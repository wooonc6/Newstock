-- Conditional paper-trading orders and atomic trade execution.

create table if not exists public.conditional_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  trade_type text not null check (trade_type in ('buy', 'sell')),
  condition_type text not null check (condition_type in ('at_or_below', 'at_or_above')),
  quantity integer not null check (quantity > 0),
  target_price numeric not null check (target_price > 0),
  status text not null default 'pending' check (status in ('pending', 'filled', 'cancelled', 'rejected')),
  execution_price numeric,
  failure_reason text,
  created_at timestamptz not null default now(),
  filled_at timestamptz,
  cancelled_at timestamptz
);

alter table public.trades
  add column if not exists conditional_order_id uuid references public.conditional_orders(id) on delete set null;

create index if not exists conditional_orders_user_status_created_idx
  on public.conditional_orders (user_id, status, created_at desc);

create index if not exists conditional_orders_pending_ticker_idx
  on public.conditional_orders (ticker)
  where status = 'pending';

alter table public.conditional_orders enable row level security;

grant select, insert, update on table public.conditional_orders to authenticated;

drop policy if exists "본인 조건 주문 읽기" on public.conditional_orders;
drop policy if exists "본인 조건 주문 생성" on public.conditional_orders;
drop policy if exists "본인 조건 주문 수정" on public.conditional_orders;

create policy "본인 조건 주문 읽기"
  on public.conditional_orders for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "본인 조건 주문 생성"
  on public.conditional_orders for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending');

create policy "본인 조건 주문 수정"
  on public.conditional_orders for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.execute_simulated_trade(
  p_ticker text,
  p_trade_type text,
  p_quantity integer,
  p_execution_price numeric,
  p_conditional_order_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_coins integer;
  v_total integer;
  v_old_quantity numeric := 0;
  v_old_avg_cost numeric := 0;
  v_new_quantity numeric;
  v_new_avg_cost numeric;
  v_cost_basis integer;
  v_realized_profit integer;
  v_order public.conditional_orders%rowtype;
  v_portfolio_after jsonb;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', '로그인이 필요합니다.');
  end if;

  if p_trade_type not in ('buy', 'sell') or p_quantity <= 0 or p_execution_price <= 0 then
    return jsonb_build_object('success', false, 'error', '올바르지 않은 거래 요청입니다.');
  end if;

  if p_conditional_order_id is not null then
    select * into v_order
    from public.conditional_orders
    where id = p_conditional_order_id and user_id = v_user_id
    for update;

    if not found or v_order.status <> 'pending' then
      return jsonb_build_object('success', false, 'error', '체결할 수 없는 조건 주문입니다.');
    end if;

    if v_order.ticker <> p_ticker
      or v_order.trade_type <> p_trade_type
      or v_order.quantity <> p_quantity
      or (v_order.condition_type = 'at_or_below' and p_execution_price > v_order.target_price)
      or (v_order.condition_type = 'at_or_above' and p_execution_price < v_order.target_price) then
      return jsonb_build_object('success', false, 'error', '아직 주문 조건이 충족되지 않았습니다.');
    end if;
  end if;

  select coins into v_coins
  from public.users
  where id = v_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', '사용자 모의투자금을 확인할 수 없습니다.');
  end if;

  select quantity, avg_cost into v_old_quantity, v_old_avg_cost
  from public.portfolio
  where user_id = v_user_id and ticker = p_ticker
  for update;

  if not found then
    v_old_quantity := 0;
    v_old_avg_cost := 0;
  end if;

  v_total := round(p_execution_price * p_quantity);

  if p_trade_type = 'buy' and v_coins < v_total then
    if p_conditional_order_id is not null then
      update public.conditional_orders
      set status = 'rejected', failure_reason = '체결 시점의 모의투자금이 부족합니다.'
      where id = p_conditional_order_id;
    end if;
    return jsonb_build_object('success', false, 'error', '모의투자금이 부족합니다.');
  end if;

  if p_trade_type = 'sell' and v_old_quantity < p_quantity then
    if p_conditional_order_id is not null then
      update public.conditional_orders
      set status = 'rejected', failure_reason = '체결 시점의 보유 수량이 부족합니다.'
      where id = p_conditional_order_id;
    end if;
    return jsonb_build_object('success', false, 'error', '보유 수량이 부족합니다.');
  end if;

  if p_trade_type = 'sell' then
    v_cost_basis := round(v_old_avg_cost * p_quantity);
    v_realized_profit := v_total - v_cost_basis;
  end if;

  insert into public.trades (
    user_id, ticker, trade_type, quantity, price, coins_delta,
    cost_basis, realized_profit, conditional_order_id
  ) values (
    v_user_id, p_ticker, p_trade_type, p_quantity, p_execution_price,
    case when p_trade_type = 'buy' then -v_total else v_total end,
    v_cost_basis, v_realized_profit, p_conditional_order_id
  );

  if p_trade_type = 'buy' then
    v_new_quantity := v_old_quantity + p_quantity;
    v_new_avg_cost := ((v_old_quantity * v_old_avg_cost) + (p_quantity * p_execution_price)) / v_new_quantity;

    insert into public.portfolio (user_id, ticker, quantity, avg_cost, updated_at)
    values (v_user_id, p_ticker, v_new_quantity, v_new_avg_cost, now())
    on conflict (user_id, ticker) do update
      set quantity = excluded.quantity,
          avg_cost = excluded.avg_cost,
          updated_at = now();

    v_coins := v_coins - v_total;
  else
    v_new_quantity := v_old_quantity - p_quantity;
    if v_new_quantity <= 0 then
      delete from public.portfolio
      where user_id = v_user_id and ticker = p_ticker;
    else
      update public.portfolio
      set quantity = v_new_quantity, updated_at = now()
      where user_id = v_user_id and ticker = p_ticker;
    end if;

    v_coins := v_coins + v_total;
  end if;

  update public.users set coins = v_coins where id = v_user_id;

  if p_conditional_order_id is not null then
    update public.conditional_orders
    set status = 'filled', execution_price = p_execution_price, filled_at = now(), failure_reason = null
    where id = p_conditional_order_id;
  end if;

  select to_jsonb(p) into v_portfolio_after
  from public.portfolio p
  where p.user_id = v_user_id and p.ticker = p_ticker;

  return jsonb_build_object(
    'success', true,
    'coins_after', v_coins,
    'portfolio_after', v_portfolio_after,
    'realized_profit', v_realized_profit,
    'realized_return_percent',
      case when coalesce(v_cost_basis, 0) > 0
        then round((v_realized_profit::numeric / v_cost_basis) * 100, 2)
        else null
      end
  );
end;
$$;

revoke all on function public.execute_simulated_trade(text, text, integer, numeric, uuid) from public, anon;
grant execute on function public.execute_simulated_trade(text, text, integer, numeric, uuid) to authenticated;


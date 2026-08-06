-- Cover the trade-to-conditional-order foreign key used by order history lookups.
create index if not exists trades_conditional_order_id_idx
  on public.trades (conditional_order_id)
  where conditional_order_id is not null;


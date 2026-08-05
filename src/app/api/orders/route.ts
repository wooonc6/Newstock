import { createClient } from '@/lib/supabase/server';
import { getMarketScheduleStatus } from '@/lib/marketSchedule';
import { getStock } from '@/lib/stocks';
import { getTradingQuote } from '@/lib/yahoo';
import { NextRequest, NextResponse } from 'next/server';

const QUIZZES_TO_UNLOCK = 3;

type ConditionalOrderBody = {
  ticker: string;
  trade_type: 'buy' | 'sell';
  condition_type: 'at_or_below' | 'at_or_above';
  quantity: number;
  target_price: number;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { data: pending, error: pendingError } = await supabase
    .from('conditional_orders')
    .select('id, ticker, trade_type, condition_type, quantity, target_price, status')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);

  if (pendingError) {
    console.error('[GET /api/orders] pending orders error:', pendingError);
    return NextResponse.json({ error: '조건 주문을 불러오지 못했습니다.' }, { status: 500 });
  }

  // 모의투자 탭이 열려 있는 동안 세션별 기준가를 확인해 충족된 주문을 체결한다.
  // 동일 종목의 기준가는 요청당 한 번만 조회한다.
  const marketStatus = getMarketScheduleStatus();
  const priceByTicker = new Map<string, number>();
  let changed = false;
  if (marketStatus.newstock.canExecuteOrders) {
    for (const order of pending ?? []) {
      let price = priceByTicker.get(order.ticker);
      if (price == null) {
        try {
          const quote = await getTradingQuote(order.ticker, marketStatus);
          price = quote.executionPrice ?? 0;
          if (price > 0) priceByTicker.set(order.ticker, price);
        } catch (error) {
          console.error(`[GET /api/orders] trading quote error (${order.ticker}):`, error);
          continue;
        }
      }

      const triggered = order.condition_type === 'at_or_below'
        ? price <= Number(order.target_price)
        : price >= Number(order.target_price);
      if (!triggered) continue;

      const { data: executionResult, error: executionError } = await supabase.rpc('execute_simulated_trade', {
        p_ticker: order.ticker,
        p_trade_type: order.trade_type,
        p_quantity: Number(order.quantity),
        p_execution_price: price,
        p_conditional_order_id: order.id,
      });

      if (executionError) {
        console.error(`[GET /api/orders] execution error (${order.id}):`, executionError);
      } else if (executionResult?.success || executionResult?.error === '모의투자금이 부족합니다.' || executionResult?.error === '보유 수량이 부족합니다.') {
        changed = true;
      }
    }
  }

  const { data: orders, error } = await supabase
    .from('conditional_orders')
    .select('id, ticker, trade_type, condition_type, quantity, target_price, status, execution_price, failure_reason, created_at, filled_at, cancelled_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[GET /api/orders] list error:', error);
    return NextResponse.json({ error: '조건 주문 내역을 불러오지 못했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ orders: orders ?? [], changed, marketStatus });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: ConditionalOrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { ticker, trade_type, condition_type, quantity, target_price } = body;
  const stock = getStock(ticker);
  const validCondition = condition_type === 'at_or_below' || condition_type === 'at_or_above';
  if (
    !stock ||
    !['buy', 'sell'].includes(trade_type) ||
    !validCondition ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(target_price) ||
    target_price <= 0 ||
    (trade_type === 'buy' && condition_type !== 'at_or_below')
  ) {
    return NextResponse.json({ error: '조건 주문 정보를 다시 확인해 주세요.' }, { status: 400 });
  }

  const { count: completedQuizzes, error: unlockError } = await supabase
    .from('quiz_sessions')
    .select('news_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('stock_ticker', ticker)
    .not('news_id', 'is', null);

  if (unlockError) {
    return NextResponse.json({ error: '모의투자 권한을 확인하지 못했습니다.' }, { status: 500 });
  }
  if ((completedQuizzes ?? 0) < QUIZZES_TO_UNLOCK) {
    return NextResponse.json(
      { error: `${stock.name} 퀴즈를 ${QUIZZES_TO_UNLOCK}개 완료해야 주문할 수 있습니다.` },
      { status: 403 }
    );
  }

  if (trade_type === 'sell') {
    const { data: holding } = await supabase
      .from('portfolio')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .maybeSingle();
    if (!holding || Number(holding.quantity) < quantity) {
      return NextResponse.json({ error: '보유 수량이 부족합니다.' }, { status: 400 });
    }
  } else {
    const { data: userData } = await supabase
      .from('users')
      .select('coins')
      .eq('id', user.id)
      .single();
    if ((userData?.coins ?? 0) < Math.round(target_price * quantity)) {
      return NextResponse.json({ error: '목표가 기준 모의투자금이 부족합니다.' }, { status: 400 });
    }
  }

  const { data: order, error } = await supabase
    .from('conditional_orders')
    .insert({ user_id: user.id, ticker, trade_type, condition_type, quantity, target_price })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/orders] insert error:', error);
    return NextResponse.json({ error: '조건 주문을 등록하지 못했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, order });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const orderId = new URL(req.url).searchParams.get('id');
  if (!orderId) return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 });

  const { data, error } = await supabase
    .from('conditional_orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: '주문을 취소하지 못했습니다.' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: '이미 체결되었거나 취소된 주문입니다.' }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}

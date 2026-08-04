import { createClient } from '@/lib/supabase/server';
import { getStock } from '@/lib/stocks';
import { getQuote } from '@/lib/yahoo';
import { NextRequest, NextResponse } from 'next/server';

const QUIZZES_TO_UNLOCK = 3;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: { ticker: string; trade_type: 'buy' | 'sell'; quantity: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { ticker, trade_type, quantity } = body;
  if (
    !ticker ||
    !trade_type ||
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    !['buy', 'sell'].includes(trade_type)
  ) {
    return NextResponse.json({ error: '지원 종목, 거래 종류, 1주 이상의 정수 수량이 필요합니다.' }, { status: 400 });
  }

  const stock = getStock(ticker);
  if (!stock) {
    return NextResponse.json({ error: 'Newstock에서 지원하지 않는 종목입니다.' }, { status: 400 });
  }

  const { count: completedQuizzes, error: unlockError } = await supabase
    .from('quiz_sessions')
    .select('news_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('stock_ticker', ticker)
    .not('news_id', 'is', null);

  if (unlockError) {
    console.error('[POST /api/trade] unlock check error:', unlockError);
    return NextResponse.json(
      { error: '모의투자 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }

  if ((completedQuizzes ?? 0) < QUIZZES_TO_UNLOCK) {
    return NextResponse.json(
      { error: `${stock.name} 퀴즈를 ${QUIZZES_TO_UNLOCK}개 완료해야 거래할 수 있습니다.` },
      { status: 403 }
    );
  }

  // 현재가 조회
  let price: number;
  try {
    const quote = await getQuote(stock.ticker);
    price = quote.regularMarketPrice ?? 0;
    if (!price) throw new Error('가격 없음');
  } catch {
    return NextResponse.json({ error: '현재 주가를 가져올 수 없습니다.' }, { status: 502 });
  }

  // users 행 방어
  await supabase.from('users').upsert(
    { id: user.id, coins: 1000000, streak: 0, sessions: 0 },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  // 거래 기록, 포트폴리오, 현금을 하나의 DB 트랜잭션에서 함께 갱신한다.
  const { data: result, error: tradeError } = await supabase.rpc('execute_simulated_trade', {
    p_ticker: ticker,
    p_trade_type: trade_type,
    p_quantity: quantity,
    p_execution_price: price,
    p_conditional_order_id: null,
  });

  if (tradeError) {
    console.error('[POST /api/trade] atomic trade error:', tradeError);
    return NextResponse.json({ error: '거래를 처리하지 못했습니다.' }, { status: 500 });
  }

  if (!result?.success) {
    return NextResponse.json({ error: result?.error ?? '거래에 실패했습니다.' }, { status: 400 });
  }

  return NextResponse.json(result);
}

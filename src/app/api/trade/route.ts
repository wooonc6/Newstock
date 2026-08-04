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

  const coins_delta = Math.round(price * quantity);

  // users 행 방어
  await supabase.from('users').upsert(
    { id: user.id, coins: 1000000, streak: 0, sessions: 0 },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  const { data: userData } = await supabase
    .from('users')
    .select('coins')
    .eq('id', user.id)
    .single();

  const current_coins = userData?.coins ?? 1000000;

  if (trade_type === 'buy') {
    if (current_coins < coins_delta) {
      return NextResponse.json({ error: '모의투자금이 부족합니다.' }, { status: 400 });
    }
  } else {
    const { data: holding } = await supabase
      .from('portfolio')
      .select('quantity')
      .eq('user_id', user.id)
      .eq('ticker', ticker)
      .single();

    if (!holding || holding.quantity < quantity) {
      return NextResponse.json({ error: '보유 수량이 부족합니다.' }, { status: 400 });
    }
  }

  // trades 기록
  await supabase.from('trades').insert({
    user_id: user.id,
    ticker,
    trade_type,
    quantity,
    price,
    coins_delta: trade_type === 'buy' ? -coins_delta : coins_delta,
  });

  // portfolio 업데이트
  const { data: existing } = await supabase
    .from('portfolio')
    .select('quantity, avg_cost')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .single();

  let portfolio_after;

  if (trade_type === 'buy') {
    const old_qty = existing?.quantity ?? 0;
    const old_avg = existing?.avg_cost ?? 0;
    const new_qty = old_qty + quantity;
    const new_avg = (old_qty * old_avg + quantity * price) / new_qty;

    const { data } = await supabase
      .from('portfolio')
      .upsert(
        { user_id: user.id, ticker, quantity: new_qty, avg_cost: new_avg },
        { onConflict: 'user_id,ticker' }
      )
      .select()
      .single();
    portfolio_after = data;
  } else {
    const new_qty = (existing?.quantity ?? 0) - quantity;
    if (new_qty <= 0) {
      await supabase
        .from('portfolio')
        .delete()
        .eq('user_id', user.id)
        .eq('ticker', ticker);
      portfolio_after = null;
    } else {
      const { data } = await supabase
        .from('portfolio')
        .update({ quantity: new_qty })
        .eq('user_id', user.id)
        .eq('ticker', ticker)
        .select()
        .single();
      portfolio_after = data;
    }
  }

  const coins_after =
    trade_type === 'buy' ? current_coins - coins_delta : current_coins + coins_delta;

  await supabase
    .from('users')
    .update({ coins: coins_after })
    .eq('id', user.id);

  return NextResponse.json({ success: true, coins_after, portfolio_after });
}

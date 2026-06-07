import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const COINS_MAP: Record<number, number> = { 1: 10, 3: 20, 6: 30 };

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: { newsId: string; answers: ('up' | 'down')[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { newsId, answers } = body;
  if (!newsId || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'newsId와 answers가 필요합니다.' }, { status: 400 });
  }

  const { data: news, error: newsErr } = await supabase
    .from('curated_news')
    .select('ticker, news_date')
    .eq('id', newsId)
    .single();

  if (newsErr || !news) {
    return NextResponse.json({ error: '뉴스를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data: cache } = await supabase
    .from('stock_price_cache')
    .select('change_1m, change_3m, change_6m')
    .eq('ticker', news.ticker)
    .eq('base_date', news.news_date)
    .single();

  if (!cache) {
    return NextResponse.json({ error: '주가 데이터가 없습니다. 먼저 퀴즈를 불러오세요.' }, { status: 404 });
  }

  const periods = [
    { months: 1, changeRate: cache.change_1m },
    { months: 3, changeRate: cache.change_3m },
    { months: 6, changeRate: cache.change_6m },
  ].filter((p) => p.changeRate != null);

  let score = 0;
  let coins_earned = 0;
  periods.forEach((p, i) => {
    const correct = p.changeRate >= 0 ? 'up' : 'down';
    if (answers[i] === correct) {
      score++;
      coins_earned += COINS_MAP[p.months] ?? 10;
    }
  });

  // users 행이 없는 첫 유저 방어
  await supabase.from('users').upsert(
    { id: user.id, coins: 1000000, streak: 0, sessions: 0 },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  await supabase.from('quiz_sessions').insert({
    user_id: user.id,
    stock_ticker: news.ticker,
    news_id: newsId,
    score,
    total: periods.length,
    coins_earned,
  });

  const { data: userData } = await supabase
    .from('users')
    .select('coins')
    .eq('id', user.id)
    .single();

  const current_coins = userData?.coins ?? 1000000;
  const new_coins_total = current_coins + coins_earned;

  await supabase
    .from('users')
    .update({ coins: new_coins_total })
    .eq('id', user.id);

  return NextResponse.json({ score, total: periods.length, coins_earned, new_coins_total });
}

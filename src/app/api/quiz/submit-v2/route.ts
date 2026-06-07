import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// 시기별 뉴스 1문제씩, 현재가 기준 채점
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: { results: Array<{ newsId: string; answer: 'up' | 'down'; coins: number }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { results } = body;
  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: 'results 배열이 필요합니다.' }, { status: 400 });
  }

  // 현재가 조회 (첫 번째 뉴스 ticker 기준)
  const { data: firstNews } = await supabase
    .from('curated_news')
    .select('ticker')
    .eq('id', results[0].newsId)
    .single();

  let currentPrice: number | null = null;
  if (firstNews?.ticker) {
    try {
      const { default: yahooFinance } = await import('yahoo-finance2');
      const quote = await (yahooFinance as any).quote(firstNews.ticker, { fields: ['regularMarketPrice'] });
      currentPrice = quote.regularMarketPrice ?? null;
    } catch { /* skip */ }
  }

  let totalScore = 0;
  let totalCoins = 0;

  // users 첫 방문 방어
  await supabase.from('users').upsert(
    { id: user.id, coins: 1000000, streak: 0, sessions: 0 },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  for (const item of results) {
    const { data: news } = await supabase
      .from('curated_news')
      .select('ticker, news_date')
      .eq('id', item.newsId)
      .single();

    if (!news) continue;

    const { data: cache } = await supabase
      .from('stock_price_cache')
      .select('price_base')
      .eq('ticker', news.ticker)
      .eq('base_date', news.news_date)
      .single();

    if (!cache?.price_base || !currentPrice) continue;

    const correctDirection = currentPrice >= cache.price_base ? 'up' : 'down';
    const isCorrect = item.answer === correctDirection;
    const coinsEarned = isCorrect ? item.coins : 0;

    if (isCorrect) {
      totalScore++;
      totalCoins += coinsEarned;
    }

    await supabase.from('quiz_sessions').insert({
      user_id: user.id,
      stock_ticker: news.ticker,
      news_id: item.newsId,
      score: isCorrect ? 1 : 0,
      total: 1,
      coins_earned: coinsEarned,
    });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('coins')
    .eq('id', user.id)
    .single();

  const currentCoins = userData?.coins ?? 1000000;
  const newCoins = currentCoins + totalCoins;

  await supabase.from('users').update({ coins: newCoins }).eq('id', user.id);

  return NextResponse.json({
    score: totalScore,
    total: results.length,
    coins_earned: totalCoins,
    new_coins_total: newCoins,
  });
}

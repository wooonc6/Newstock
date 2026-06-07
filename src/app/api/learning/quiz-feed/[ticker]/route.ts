import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const BRACKETS = [
  { label: '1개월 전', months: 1, coins: 50000 },
  { label: '3개월 전', months: 3, coins: 100000 },
  { label: '6개월 전', months: 6, coins: 150000 },
  { label: '12개월 전', months: 12, coins: 200000 },
];

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker);
  const supabase = await createClient();

  // 현재가 조회
  let currentPrice: number | null = null;
  try {
    const { default: yahooFinance } = await import('yahoo-finance2');
    const quote = await (yahooFinance as any).quote(ticker, { fields: ['regularMarketPrice'] });
    currentPrice = quote.regularMarketPrice ?? null;
  } catch {
    // 현재가 조회 실패 시 캐시 없이 direction 계산 불가 — graceful skip
  }

  const today = new Date();
  const results = [];

  for (const bracket of BRACKETS) {
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() - bracket.months);
    const targetStr = targetDate.toISOString().split('T')[0];

    // 해당 기간에서 가장 가까운 뉴스 선택
    const { data: news } = await supabase
      .from('curated_news')
      .select('id, title, company, ticker, news_date, source_url')
      .eq('ticker', ticker)
      .lte('news_date', targetStr)
      .order('news_date', { ascending: false })
      .limit(1)
      .single();

    if (!news) continue;

    // 뉴스 시점 주가 캐시 조회
    const { data: cache } = await supabase
      .from('stock_price_cache')
      .select('price_base')
      .eq('ticker', ticker)
      .eq('base_date', news.news_date)
      .single();

    // 캐시 없으면 Yahoo Finance 히스토리컬로 직접 가져오기
    let basePrice: number | null = cache?.price_base ?? null;
    if (!basePrice) {
      try {
        const { default: yahooFinance } = await import('yahoo-finance2');
        const endDate = new Date(news.news_date);
        endDate.setDate(endDate.getDate() + 5);
        const hist = await (yahooFinance as any).historical(ticker, {
          period1: news.news_date,
          period2: endDate.toISOString().split('T')[0],
          interval: '1d',
        });
        if (hist?.length) {
          basePrice = hist[0].close;
          // 캐시에 저장
          await supabase.from('stock_price_cache').upsert(
            { ticker, base_date: news.news_date, price_base: basePrice },
            { onConflict: 'ticker,base_date' }
          );
        }
      } catch { /* skip */ }
    }

    if (!basePrice || !currentPrice) continue;

    const changeRate = ((currentPrice - basePrice) / basePrice) * 100;

    results.push({
      newsId: news.id,
      title: news.title,
      company: news.company,
      ticker: news.ticker,
      newsDate: news.news_date,
      sourceUrl: news.source_url ?? null,
      timeLabel: bracket.label,
      direction: changeRate >= 0 ? 'up' : 'down',
      changeRate,
      basePrice,
      currentPrice,
      coins: bracket.coins,
    });
  }

  return NextResponse.json(results);
}

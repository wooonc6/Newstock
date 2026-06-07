import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function getStockChanges(ticker: string, baseDate: string) {
  const { default: yahooFinance } = await import('yahoo-finance2');
  const base = new Date(baseDate);
  const periods = [
    { label: '1개월 후', months: 1 },
    { label: '3개월 후', months: 3 },
    { label: '6개월 후', months: 6 },
  ];

  const endDate = new Date(base);
  endDate.setMonth(endDate.getMonth() + 6);
  endDate.setDate(endDate.getDate() + 5);

  const result = await (yahooFinance as any).historical(ticker, {
    period1: base.toISOString().split('T')[0],
    period2: endDate.toISOString().split('T')[0],
    interval: '1mo',
  });

  if (!result.length) throw new Error('주가 데이터 없음');

  const basePrice = result[0].close;
  const mapped = periods.map(({ label, months }) => {
    const target = new Date(base);
    target.setMonth(target.getMonth() + months);
    const row = result.find((r: any) => {
      const d = new Date(r.date);
      return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
    });
    const price = row?.close ?? null;
    const changeRate = price != null ? ((price - basePrice) / basePrice) * 100 : null;
    return { label, months, price, changeRate, direction: changeRate != null ? (changeRate >= 0 ? 'up' : 'down') : null };
  });

  return { base: { price: basePrice }, periods: mapped };
}


export async function GET(_req: Request, { params }: { params: { newsId: string } }) {
  const supabase = await createClient();

  const { data: news, error: newsErr } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', params.newsId)
    .single();

  if (newsErr) return NextResponse.json({ error: '뉴스를 찾을 수 없습니다.' }, { status: 404 });

  const { data: cache } = await supabase
    .from('stock_price_cache')
    .select('*')
    .eq('ticker', news.ticker)
    .eq('base_date', news.news_date)
    .single();

  let stockData;

  if (cache) {
    stockData = {
      base: { price: cache.price_base },
      periods: [
        { label: '1개월 후', months: 1, price: cache.price_1m, changeRate: cache.change_1m, direction: cache.change_1m >= 0 ? 'up' : 'down' },
        { label: '3개월 후', months: 3, price: cache.price_3m, changeRate: cache.change_3m, direction: cache.change_3m >= 0 ? 'up' : 'down' },
        { label: '6개월 후', months: 6, price: cache.price_6m, changeRate: cache.change_6m, direction: cache.change_6m >= 0 ? 'up' : 'down' },
      ],
    };
  } else {
    try {
      stockData = await getStockChanges(news.ticker, news.news_date);
    } catch (e: any) {
      return NextResponse.json({ error: `주가 조회 실패: ${e.message}` }, { status: 502 });
    }

    const [p1, p3, p6] = stockData.periods;
    await supabase.from('stock_price_cache').upsert(
      {
        ticker: news.ticker,
        base_date: news.news_date,
        price_base: stockData.base.price,
        price_1m: p1?.price ?? null,
        price_3m: p3?.price ?? null,
        price_6m: p6?.price ?? null,
        change_1m: p1?.changeRate ?? null,
        change_3m: p3?.changeRate ?? null,
        change_6m: p6?.changeRate ?? null,
      },
      { onConflict: 'ticker,base_date' }
    );
  }

  const coinsMap: Record<number, number> = { 1: 10, 3: 20, 6: 30 };
  const periods = stockData.periods
    .filter((p: any) => p.changeRate != null)
    .map((p: any) => ({
      label: p.label,
      months: p.months,
      priceBase: stockData.base.price,
      priceEnd: p.price,
      changeRate: p.changeRate,
      direction: p.direction,
      coins: coinsMap[p.months] ?? 10,
    }));

  return NextResponse.json({
    newsId: news.id,
    company: news.company,
    ticker: news.ticker,
    newsDate: news.news_date,
    headline: news.title,
    category: news.category,
    difficulty: news.difficulty,
    periods,
  });
}

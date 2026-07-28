import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const PERIODS = [
  { label: '1개월 후', months: 1 },
  { label: '3개월 후', months: 3 },
  { label: '6개월 후', months: 6 },
];

type StockPeriod = {
  label: string;
  months: number;
  price: number | null;
  changeRate: number | null;
  direction: 'up' | 'down' | null;
};

type StockData = {
  base: { price: number };
  periods: StockPeriod[];
};

async function getStockChanges(ticker: string, baseDate: string): Promise<StockData> {
  const yahooModule = await import('yahoo-finance2');
  const YahooFinance = yahooModule.default;
  const yahooFinance = new YahooFinance();

  const base = new Date(`${baseDate}T00:00:00Z`);
  const endDate = new Date(base);
  endDate.setUTCMonth(endDate.getUTCMonth() + 6);
  endDate.setUTCDate(endDate.getUTCDate() + 7);

  const chart = await yahooFinance.chart(ticker, {
    period1: base,
    period2: endDate,
    interval: '1mo',
  });

  const quotes = (chart.quotes ?? []).filter(
    (quote) => quote.date && typeof quote.close === 'number'
  );

  if (quotes.length === 0) {
    throw new Error('주가 데이터가 없습니다.');
  }

  const basePrice = quotes[0].close;

  if (typeof basePrice !== 'number') {
    throw new Error('기준일 주가를 찾을 수 없습니다.');
  }

  const mapped = PERIODS.map(({ label, months }) => {
    const target = new Date(base);
    target.setUTCMonth(target.getUTCMonth() + months);

    const row = quotes.find((quote) => {
      const date = new Date(quote.date);
      return (
        date.getUTCFullYear() === target.getUTCFullYear() &&
        date.getUTCMonth() === target.getUTCMonth()
      );
    });

    const price = typeof row?.close === 'number' ? row.close : null;
    const changeRate =
      price != null ? ((price - basePrice) / basePrice) * 100 : null;

    return {
      label,
      months,
      price,
      changeRate,
      direction:
        changeRate == null ? null : changeRate >= 0 ? ('up' as const) : ('down' as const),
    };
  });

  return { base: { price: basePrice }, periods: mapped };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ newsId: string }> }
) {
  const { newsId } = await params;
  const supabase = await createClient();

  const { data: news, error: newsErr } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', newsId)
    .single();

  if (newsErr || !news) {
    return NextResponse.json({ error: '뉴스를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data: cache, error: cacheError } = await supabase
    .from('stock_price_cache')
    .select('*')
    .eq('ticker', news.ticker)
    .eq('base_date', news.news_date)
    .maybeSingle();

  if (cacheError) {
    console.error('[GET /api/learning/quiz/:newsId] cache read error:', cacheError);
  }

  let stockData: StockData;

  if (cache) {
    stockData = {
      base: { price: cache.price_base },
      periods: [
        {
          label: '1개월 후',
          months: 1,
          price: cache.price_1m,
          changeRate: cache.change_1m,
          direction: cache.change_1m == null ? null : cache.change_1m >= 0 ? 'up' : 'down',
        },
        {
          label: '3개월 후',
          months: 3,
          price: cache.price_3m,
          changeRate: cache.change_3m,
          direction: cache.change_3m == null ? null : cache.change_3m >= 0 ? 'up' : 'down',
        },
        {
          label: '6개월 후',
          months: 6,
          price: cache.price_6m,
          changeRate: cache.change_6m,
          direction: cache.change_6m == null ? null : cache.change_6m >= 0 ? 'up' : 'down',
        },
      ],
    };
  } else {
    try {
      stockData = await getStockChanges(news.ticker, news.news_date);
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      console.error('[GET /api/learning/quiz/:newsId] Yahoo Finance error:', error);
      return NextResponse.json({ error: `주가 조회 실패: ${message}` }, { status: 502 });
    }

    const [p1, p3, p6] = stockData.periods;
    const { error: cacheWriteError } = await supabase
      .from('stock_price_cache')
      .upsert(
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

    if (cacheWriteError) {
      console.error('[GET /api/learning/quiz/:newsId] cache write error:', cacheWriteError);
    }
  }

  const coinsMap: Record<number, number> = { 1: 50000, 3: 100000, 6: 150000 };
  const periods = stockData.periods
    .filter((period) => period.changeRate != null)
    .map((period) => ({
      label: period.label,
      months: period.months,
      priceBase: stockData.base.price,
      priceEnd: period.price,
      changeRate: period.changeRate,
      direction: period.direction,
      coins: coinsMap[period.months] ?? 10,
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

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type PricePoint = {
  timestamp: number;
  price: number;
};

function addUtcMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function findPriceOnOrAfter(points: PricePoint[], target: Date): number | null {
  const targetSeconds = Math.floor(target.getTime() / 1000);
  return points.find((point) => point.timestamp >= targetSeconds)?.price ?? null;
}

async function getStockChanges(ticker: string, baseDate: string): Promise<StockData> {
  const base = new Date(`${baseDate}T00:00:00Z`);

  if (Number.isNaN(base.getTime())) {
    throw new Error('뉴스 날짜 형식이 올바르지 않습니다.');
  }

  const endDate = addUtcMonths(base, 6);
  endDate.setUTCDate(endDate.getUTCDate() + 14);

  const period1 = Math.floor(base.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`
  );

  url.searchParams.set('period1', String(period1));
  url.searchParams.set('period2', String(period2));
  url.searchParams.set('interval', '1d');
  url.searchParams.set('events', 'history');
  url.searchParams.set('includeAdjustedClose', 'true');

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 Newstock/1.0',
    },
    cache: 'no-store',
  });

  const payload = (await response.json().catch(() => null)) as YahooChartResponse | null;

  if (!response.ok) {
    const description = payload?.chart?.error?.description;
    throw new Error(description || `Yahoo Finance 응답 오류 (${response.status})`);
  }

  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];

  const points: PricePoint[] = timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      return typeof close === 'number' && Number.isFinite(close)
        ? { timestamp, price: close }
        : null;
    })
    .filter((point): point is PricePoint => point !== null)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (points.length === 0) {
    throw new Error('주가 데이터가 없습니다.');
  }

  const basePrice = findPriceOnOrAfter(points, base);

  if (basePrice == null) {
    throw new Error('기준일 주가를 찾을 수 없습니다.');
  }

  const periods = PERIODS.map(({ label, months }) => {
    const target = addUtcMonths(base, months);
    const price = findPriceOnOrAfter(points, target);
    const changeRate = price == null ? null : ((price - basePrice) / basePrice) * 100;

    return {
      label,
      months,
      price,
      changeRate,
      direction:
        changeRate == null ? null : changeRate >= 0 ? ('up' as const) : ('down' as const),
    };
  });

  return {
    base: { price: basePrice },
    periods,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { newsId: string } }
) {
  const { newsId } = params;
  const supabase = await createClient();

  const { data: news, error: newsError } = await supabase
    .from('curated_news')
    .select('id, title, company, ticker, news_date, category, difficulty')
    .eq('id', newsId)
    .single();

  if (newsError || !news) {
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

  const coinsMap: Record<number, number> = {
    1: 50000,
    3: 100000,
    6: 150000,
  };

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

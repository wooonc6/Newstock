const supabase = require('../../../../lib/supabase');
const { getStockChanges, buildQuizOptions } = require('../../../../lib/yahooFinance');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { newsId } = req.query;

  // 1. 뉴스 조회
  const { data: news, error: newsErr } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', newsId)
    .single();

  if (newsErr) return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });

  // 2. 캐시 확인
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
    // Yahoo Finance 조회
    try {
      stockData = await getStockChanges(news.ticker, news.news_date);
    } catch (e) {
      return res.status(502).json({ error: `주가 조회 실패: ${e.message}` });
    }

    // 캐시 저장
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

  // 3. 퀴즈 응답 조합
  const coinsMap = { 1: 10, 3: 20, 6: 30 };
  const periods = stockData.periods
    .filter((p) => p.changeRate !== null && p.changeRate !== undefined)
    .map((p) => {
      const { options, answerIndex } = buildQuizOptions(p.changeRate);
      return {
        label: p.label,
        months: p.months,
        priceBase: stockData.base.price,
        priceEnd: p.price,
        changeRate: p.changeRate,
        direction: p.direction,
        options,
        answerIndex,
        coins: coinsMap[p.months] ?? 10,
      };
    });

  res.status(200).json({
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

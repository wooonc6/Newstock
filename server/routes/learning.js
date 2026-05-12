const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { getStockChanges, buildQuizOptions } = require('../lib/yahooFinance');

// GET /api/learning/news — 큐레이션 뉴스 목록
router.get('/news', async (req, res) => {
  const { category, difficulty, limit = 20, offset = 0 } = req.query;

  let query = supabase
    .from('curated_news')
    .select('id, title, company, ticker, news_date, category, difficulty')
    .order('news_date', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// GET /api/learning/news/:id — 뉴스 상세
router.get('/news/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });

  res.json(data);
});

// GET /api/learning/quiz/:newsId — 주가 퀴즈 데이터 생성
router.get('/quiz/:newsId', async (req, res) => {
  // 1. 뉴스 조회
  const { data: news, error: newsErr } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', req.params.newsId)
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
    // 캐시 히트
    stockData = {
      ticker: news.ticker,
      newsDate: news.news_date,
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
    await supabase.from('stock_price_cache').upsert({
      ticker: news.ticker,
      base_date: news.news_date,
      price_base: stockData.base.price,
      price_1m: p1?.price ?? null,
      price_3m: p3?.price ?? null,
      price_6m: p6?.price ?? null,
      change_1m: p1?.changeRate ?? null,
      change_3m: p3?.changeRate ?? null,
      change_6m: p6?.changeRate ?? null,
    }, { onConflict: 'ticker,base_date' });
  }

  // 3. 퀴즈 응답 조합 (기간별 선택지 생성)
  const quizPeriods = stockData.periods
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
      };
    });

  const coinsMap = { 1: 10, 3: 20, 6: 30 };

  res.json({
    newsId: news.id,
    company: news.company,
    ticker: news.ticker,
    newsDate: news.news_date,
    headline: news.title,
    category: news.category,
    difficulty: news.difficulty,
    periods: quizPeriods.map((p) => ({
      ...p,
      coins: coinsMap[p.months] ?? 10,
    })),
  });
});

module.exports = router;

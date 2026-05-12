const yahooFinance = require('yahoo-finance2').default;

// 특정 날짜의 종가 조회 (±5 영업일 내 가장 가까운 날)
async function getClosestPrice(ticker, targetDate) {
  const start = new Date(targetDate);
  start.setDate(start.getDate() - 5);
  const end = new Date(targetDate);
  end.setDate(end.getDate() + 5);

  const history = await yahooFinance.historical(ticker, {
    period1: start.toISOString().slice(0, 10),
    period2: end.toISOString().slice(0, 10),
    interval: '1d',
  });

  if (!history || history.length === 0) return null;

  const target = new Date(targetDate).getTime();
  const closest = history.reduce((prev, cur) =>
    Math.abs(new Date(cur.date).getTime() - target) <
    Math.abs(new Date(prev.date).getTime() - target)
      ? cur
      : prev
  );

  return { date: closest.date, price: Math.round(closest.close) };
}

// 뉴스 날짜 기준 1/3/6개월 후 주가 변동률 계산
async function getStockChanges(ticker, newsDate) {
  const base = await getClosestPrice(ticker, newsDate);
  if (!base) throw new Error(`기준일 주가 조회 실패: ${ticker} ${newsDate}`);

  const addMonths = (dateStr, months) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };

  const [p1m, p3m, p6m] = await Promise.all([
    getClosestPrice(ticker, addMonths(newsDate, 1)),
    getClosestPrice(ticker, addMonths(newsDate, 3)),
    getClosestPrice(ticker, addMonths(newsDate, 6)),
  ]);

  const calcChange = (end) => {
    if (!end) return null;
    const rate = ((end.price - base.price) / base.price) * 100;
    return {
      date: end.date,
      price: end.price,
      changeRate: Math.round(rate * 100) / 100,
      direction: rate >= 0 ? 'up' : 'down',
    };
  };

  return {
    ticker,
    newsDate,
    base: { date: base.date, price: base.price },
    periods: [
      { label: '1개월 후', months: 1, ...calcChange(p1m) },
      { label: '3개월 후', months: 3, ...calcChange(p3m) },
      { label: '6개월 후', months: 6, ...calcChange(p6m) },
    ],
  };
}

// 퀴즈 선택지 4개 생성 (정답 1개 + 오답 3개)
function buildQuizOptions(correctRate) {
  const correct = Math.round(correctRate * 100) / 100;
  const opposite = correct >= 0 ? -1 : 1;
  const sameDir = correct >= 0 ? 1 : -1;

  const wrongs = [
    Math.round((Math.abs(correct) * 0.6 + 2) * opposite * 100) / 100,
    Math.round((Math.abs(correct) * 1.4 + 5) * opposite * 100) / 100,
    Math.round((Math.abs(correct) * 2.2 + 8) * sameDir * 100) / 100,
  ];

  const fmt = (r) => `${r >= 0 ? '+' : ''}${r}%`;
  const options = [
    { label: fmt(correct), isCorrect: true },
    ...wrongs.map((r) => ({ label: fmt(r), isCorrect: false })),
  ];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    options: options.map((o) => o.label),
    answerIndex: options.findIndex((o) => o.isCorrect),
  };
}

module.exports = { getStockChanges, buildQuizOptions };

import { getStock } from "@/lib/stocks";

export interface TradeRow {
  id: string;
  ticker: string;
  trade_type: "buy" | "sell";
  quantity: number;
  price: number;
  coins_delta: number | null;
  cost_basis: number | null;
  realized_profit: number | null;
  traded_at: string;
}

export interface PortfolioRow {
  ticker: string;
  quantity: number;
  avg_cost: number;
}

interface Lot {
  quantity: number;
  price: number;
  date: string;
}

export interface RealizedTradeResult {
  id: string;
  ticker: string;
  quantity: number;
  price: number;
  costBasis: number;
  realizedProfit: number;
  returnPct: number;
  holdingDays: number;
  tradedAt: string;
}

export interface TradeAnalysis {
  realized: RealizedTradeResult[];
  openLotsByTicker: Map<string, Lot[]>;
  totalRealizedProfit: number;
  totalRealizedCost: number;
  averageHoldingDays: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  avgWinHoldingDays: number;
  avgLossHoldingDays: number;
  bestTrade: RealizedTradeResult | null;
  worstTrade: RealizedTradeResult | null;
}

/**
 * FIFO 방식으로 매수/매도를 짝지어 실현 손익, 보유일수, 승률 등을 계산합니다.
 * trades.cost_basis / realized_profit 값이 DB에 이미 저장돼 있으면 그 값을 우선 사용하고,
 * 없는 경우에만 FIFO 계산값으로 대체합니다.
 */
export function analyzeTrades(trades: TradeRow[], now: Date = new Date()): TradeAnalysis {
  const byTicker = new Map<string, TradeRow[]>();
  trades.forEach((t) => {
    const list = byTicker.get(t.ticker) ?? [];
    list.push(t);
    byTicker.set(t.ticker, list);
  });

  const realized: RealizedTradeResult[] = [];
  const openLotsByTicker = new Map<string, Lot[]>();

  for (const [ticker, list] of byTicker) {
    const sorted = [...list].sort(
      (a, b) => new Date(a.traded_at).getTime() - new Date(b.traded_at).getTime()
    );
    const lots: Lot[] = [];

    for (const t of sorted) {
      const qty = Number(t.quantity) || 0;

      if (t.trade_type === "buy") {
        lots.push({ quantity: qty, price: Number(t.price) || 0, date: t.traded_at });
        continue;
      }

      let remaining = qty;
      let fifoCost = 0;
      let weightedDaysSum = 0;
      let matchedQty = 0;

      while (remaining > 0.0000001 && lots.length > 0) {
        const lot = lots[0];
        const matched = Math.min(remaining, lot.quantity);
        fifoCost += matched * lot.price;
        const days = Math.max(
          0,
          (new Date(t.traded_at).getTime() - new Date(lot.date).getTime()) / 86_400_000
        );
        weightedDaysSum += matched * days;
        matchedQty += matched;

        lot.quantity -= matched;
        remaining -= matched;
        if (lot.quantity <= 0.0000001) lots.shift();
      }

      const costBasis = t.cost_basis != null ? Number(t.cost_basis) : fifoCost;
      const proceeds = (Number(t.price) || 0) * qty;
      const realizedProfit = t.realized_profit != null ? Number(t.realized_profit) : proceeds - fifoCost;

      realized.push({
        id: t.id,
        ticker,
        quantity: qty,
        price: Number(t.price) || 0,
        costBasis,
        realizedProfit,
        returnPct: costBasis > 0 ? (realizedProfit / costBasis) * 100 : 0,
        holdingDays: matchedQty > 0 ? weightedDaysSum / matchedQty : 0,
        tradedAt: t.traded_at,
      });
    }

    openLotsByTicker.set(ticker, lots);
  }

  realized.sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime());

  const totalRealizedProfit = realized.reduce((sum, r) => sum + r.realizedProfit, 0);
  const totalRealizedCost = realized.reduce((sum, r) => sum + r.costBasis, 0);
  const totalSoldQty = realized.reduce((sum, r) => sum + r.quantity, 0);
  const weightedHoldingDaysSum = realized.reduce((sum, r) => sum + r.holdingDays * r.quantity, 0);
  const averageHoldingDays = totalSoldQty > 0 ? weightedHoldingDaysSum / totalSoldQty : 0;

  const winTrades = realized.filter((r) => r.realizedProfit > 0);
  const loseTrades = realized.filter((r) => r.realizedProfit < 0);
  const winRate = realized.length > 0 ? (winTrades.length / realized.length) * 100 : 0;
  const avgWinPct =
    winTrades.length > 0 ? winTrades.reduce((sum, r) => sum + r.returnPct, 0) / winTrades.length : 0;
  const avgLossPct =
    loseTrades.length > 0 ? loseTrades.reduce((sum, r) => sum + r.returnPct, 0) / loseTrades.length : 0;
  const avgWinHoldingDays =
    winTrades.length > 0 ? winTrades.reduce((sum, r) => sum + r.holdingDays, 0) / winTrades.length : 0;
  const avgLossHoldingDays =
    loseTrades.length > 0 ? loseTrades.reduce((sum, r) => sum + r.holdingDays, 0) / loseTrades.length : 0;

  const bestTrade =
    realized.length > 0 ? realized.reduce((a, b) => (b.realizedProfit > a.realizedProfit ? b : a)) : null;
  const worstTrade =
    realized.length > 0 ? realized.reduce((a, b) => (b.realizedProfit < a.realizedProfit ? b : a)) : null;

  return {
    realized,
    openLotsByTicker,
    totalRealizedProfit,
    totalRealizedCost,
    averageHoldingDays,
    winRate,
    avgWinPct,
    avgLossPct,
    avgWinHoldingDays,
    avgLossHoldingDays,
    bestTrade,
    worstTrade,
  };
}

function currentHoldingDays(lots: Lot[], now: Date): number {
  const totalQty = lots.reduce((sum, l) => sum + l.quantity, 0);
  if (totalQty <= 0) return 0;
  const weighted = lots.reduce(
    (sum, l) => sum + l.quantity * Math.max(0, (now.getTime() - new Date(l.date).getTime()) / 86_400_000),
    0
  );
  return weighted / totalQty;
}

export interface HoldingSummary {
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  avgCost: number;
  currentPrice: number | null;
  currentValue: number;
  costValue: number;
  unrealizedProfit: number;
  unrealizedReturnPct: number;
  holdingDays: number;
}

export function summarizeHoldings(
  holdings: PortfolioRow[],
  priceMap: Record<string, number | null>,
  openLotsByTicker: Map<string, Lot[]>,
  now: Date = new Date()
): HoldingSummary[] {
  return holdings
    .filter((h) => h.quantity > 0)
    .map((h) => {
      const stock = getStock(h.ticker);
      const price = priceMap[h.ticker] ?? null;
      const currentValue = (price != null ? price : h.avg_cost) * h.quantity;
      const costValue = h.avg_cost * h.quantity;
      const unrealizedProfit = currentValue - costValue;
      const unrealizedReturnPct = costValue > 0 ? (unrealizedProfit / costValue) * 100 : 0;
      const lots = openLotsByTicker.get(h.ticker) ?? [];

      return {
        ticker: h.ticker,
        name: stock?.name ?? h.ticker,
        sector: stock?.sector ?? "기타",
        quantity: h.quantity,
        avgCost: h.avg_cost,
        currentPrice: price,
        currentValue,
        costValue,
        unrealizedProfit,
        unrealizedReturnPct,
        holdingDays: currentHoldingDays(lots, now),
      };
    });
}

export interface PerformanceKpis {
  cash: number;
  holdingsValue: number;
  holdingsCost: number;
  unrealizedProfit: number;
  totalAsset: number;
  totalProfit: number;
  totalCostBasis: number;
  totalReturnPct: number;
  realizedReturnPct: number;
}

export function computeKpis(params: {
  cash: number;
  holdings: HoldingSummary[];
  realizedProfit: number;
  realizedCost: number;
}): PerformanceKpis {
  const { cash, holdings, realizedProfit, realizedCost } = params;
  const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const holdingsCost = holdings.reduce((sum, h) => sum + h.costValue, 0);
  const unrealizedProfit = holdings.reduce((sum, h) => sum + h.unrealizedProfit, 0);

  const totalAsset = cash + holdingsValue;
  const totalProfit = realizedProfit + unrealizedProfit;
  const totalCostBasis = realizedCost + holdingsCost;
  const totalReturnPct = totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : 0;
  const realizedReturnPct = realizedCost > 0 ? (realizedProfit / realizedCost) * 100 : 0;

  return {
    cash,
    holdingsValue,
    holdingsCost,
    unrealizedProfit,
    totalAsset,
    totalProfit,
    totalCostBasis,
    totalReturnPct,
    realizedReturnPct,
  };
}

export function realizedProfitSince(realized: RealizedTradeResult[], since: Date): number {
  return realized
    .filter((r) => new Date(r.tradedAt).getTime() >= since.getTime())
    .reduce((sum, r) => sum + r.realizedProfit, 0);
}

export interface SectorBreakdownItem {
  sector: string;
  count: number;
  ratioPct: number;
}

export function mostTradedSector(trades: TradeRow[]): SectorBreakdownItem | null {
  if (trades.length === 0) return null;
  const counts = new Map<string, number>();
  trades.forEach((t) => {
    const sector = getStock(t.ticker)?.sector ?? "기타";
    counts.set(sector, (counts.get(sector) ?? 0) + 1);
  });

  let best: [string, number] | null = null;
  counts.forEach((count, sector) => {
    if (!best || count > best[1]) best = [sector, count];
  });

  if (!best) return null;
  return { sector: best[0], count: best[1], ratioPct: (best[1] / trades.length) * 100 };
}

export interface TickerQuizAccuracy {
  correct: number;
  total: number;
  accuracyPct: number;
}

export function quizAccuracyByTicker(
  sessions: { stock_ticker: string; score: number | null; total: number | null }[]
): Map<string, TickerQuizAccuracy> {
  const raw = new Map<string, { correct: number; total: number }>();
  sessions.forEach((s) => {
    const cur = raw.get(s.stock_ticker) ?? { correct: 0, total: 0 };
    cur.correct += s.score ?? 0;
    cur.total += s.total ?? 0;
    raw.set(s.stock_ticker, cur);
  });

  const result = new Map<string, TickerQuizAccuracy>();
  raw.forEach((v, ticker) => {
    result.set(ticker, { correct: v.correct, total: v.total, accuracyPct: v.total > 0 ? (v.correct / v.total) * 100 : 0 });
  });
  return result;
}

export interface LearningVsReturnComparison {
  highAccuracyAvgReturnPct: number;
  highAccuracyCount: number;
  lowAccuracyAvgReturnPct: number;
  lowAccuracyCount: number;
  sampleSize: number;
}

const HIGH_ACCURACY_THRESHOLD_PCT = 80;

/**
 * 종목별 퀴즈 정답률(80% 이상 vs 80% 미만)에 따라 그 종목의 실현/평가 수익률 평균을 비교합니다.
 * (이 서비스는 종목당 퀴즈 3회 통과 후에만 거래가 가능해, "퀴즈 여부"가 아니라
 *  "퀴즈를 얼마나 잘 풀었는지"로 학습 효과를 비교합니다.)
 */
export function compareLearningToReturns(
  realized: RealizedTradeResult[],
  holdings: HoldingSummary[],
  accuracyByTicker: Map<string, TickerQuizAccuracy>
): LearningVsReturnComparison | null {
  const high: number[] = [];
  const low: number[] = [];

  const bucket = (ticker: string, returnPct: number) => {
    const acc = accuracyByTicker.get(ticker);
    if (!acc || acc.total === 0) return;
    if (acc.accuracyPct >= HIGH_ACCURACY_THRESHOLD_PCT) high.push(returnPct);
    else low.push(returnPct);
  };

  realized.forEach((r) => bucket(r.ticker, r.returnPct));
  holdings.forEach((h) => bucket(h.ticker, h.unrealizedReturnPct));

  const sampleSize = high.length + low.length;
  if (high.length === 0 || low.length === 0 || sampleSize < 4) return null;

  const avg = (arr: number[]) => arr.reduce((sum, v) => sum + v, 0) / arr.length;

  return {
    highAccuracyAvgReturnPct: avg(high),
    highAccuracyCount: high.length,
    lowAccuracyAvgReturnPct: avg(low),
    lowAccuracyCount: low.length,
    sampleSize,
  };
}

export function formatWon(value: number): string {
  const rounded = Math.round(value);
  return `${rounded < 0 ? "-" : ""}₩${Math.abs(rounded).toLocaleString()}`;
}

export function formatPct(value: number, digits = 1): string {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

export function formatSignedWon(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : rounded < 0 ? "-" : ""}₩${Math.abs(rounded).toLocaleString()}`;
}

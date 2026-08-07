import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardQuote } from "@/lib/yahoo";
import { getStock } from "@/lib/stocks";
import { TradeHistoryList, type TradeHistoryItem } from "@/components/trading/TradeHistoryList";
import GrowthTimeline, { type TimelinePoint } from "./GrowthTimeline";
import {
  analyzeTrades,
  compareLearningToReturns,
  computeKpis,
  formatPct,
  formatSignedWon,
  formatWon,
  mostTradedSector,
  quizAccuracyByTicker,
  realizedProfitSince,
  summarizeHoldings,
  type PortfolioRow,
  type TradeRow,
} from "@/lib/investmentAnalytics";

export default async function InvestmentPerformance() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <EmptyPanel message="로그인 후 내 투자 리포트를 확인할 수 있습니다." />;
  }

  const [userRow, tradesResult, portfolioResult, quizResult] = await Promise.all([
    supabase.from("users").select("coins").eq("id", user.id).single(),
    supabase
      .from("trades")
      .select("id, ticker, trade_type, quantity, price, coins_delta, cost_basis, realized_profit, traded_at")
      .eq("user_id", user.id)
      .order("traded_at", { ascending: true }),
    supabase.from("portfolio").select("ticker, quantity, avg_cost").eq("user_id", user.id),
    supabase.from("quiz_sessions").select("stock_ticker, score, total").eq("user_id", user.id),
  ]);

  const cash = userRow.data?.coins ?? 0;
  const trades = (tradesResult.data ?? []) as TradeRow[];
  const portfolio = (portfolioResult.data ?? []) as PortfolioRow[];
  const quizSessions = quizResult.data ?? [];

  if (trades.length === 0 && portfolio.length === 0) {
    return (
      <EmptyPanel
        message="아직 모의투자 기록이 없습니다. 종목 퀴즈를 3번 통과하면 그 종목을 거래할 수 있어요."
        showTradeLink
      />
    );
  }

  // 보유 종목 현재가 조회 (실패해도 평균단가로 대체)
  const priceMap: Record<string, number | null> = {};
  await Promise.all(
    portfolio
      .filter((h) => h.quantity > 0)
      .map(async (h) => {
        try {
          const quote = await getDashboardQuote(h.ticker);
          priceMap[h.ticker] = quote.regularMarketPrice ?? quote.regularMarketPreviousClose ?? null;
        } catch {
          priceMap[h.ticker] = null;
        }
      })
  );

  const analysis = analyzeTrades(trades);
  const holdings = summarizeHoldings(portfolio, priceMap, analysis.openLotsByTicker);
  const kpis = computeKpis({
    cash,
    holdings,
    realizedProfit: analysis.totalRealizedProfit,
    realizedCost: analysis.totalRealizedCost,
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthRealizedProfit = realizedProfitSince(analysis.realized, startOfMonth);

  const sector = mostTradedSector(trades);
  const accuracyByTicker = quizAccuracyByTicker(quizSessions);
  const learningComparison = compareLearningToReturns(analysis.realized, holdings, accuracyByTicker);

  const timelinePoints = buildTimelinePoints(trades, analysis.realized, kpis.unrealizedProfit);

  const summaryLines = buildAiSummary({
    sector,
    tradeCount: trades.length,
    averageHoldingDays: analysis.averageHoldingDays,
    bestTrade: analysis.bestTrade,
    avgWinHoldingDays: analysis.avgWinHoldingDays,
    avgLossHoldingDays: analysis.avgLossHoldingDays,
  });

  const habitLines = buildHabitInsights(analysis);

  const tradeHistoryItems = trades
    .slice()
    .reverse()
    .map(
      (t): TradeHistoryItem => ({
        id: t.id,
        ticker: t.ticker,
        trade_type: t.trade_type,
        quantity: t.quantity,
        price: t.price,
        coins_delta: t.coins_delta,
        cost_basis: t.cost_basis,
        realized_profit: t.realized_profit,
        traded_at: t.traded_at,
      })
    );

  const isUp = kpis.totalProfit >= 0;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* 이번 투자 리포트 헤더 */}
      <section
        className="mobile-section"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: "var(--text-muted)" }}>
          이번 투자 리포트
        </div>
        <div style={{ marginTop: 8, fontSize: 30, fontWeight: 900, color: "var(--text)" }}>
          {formatWon(kpis.totalAsset)}
        </div>
        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: isUp ? "#ef4444" : "#2563eb" }}>
            {isUp ? "▲" : "▼"} {formatPct(kpis.totalReturnPct)}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            이번 달 실현손익 {formatSignedWon(monthRealizedProfit)}
          </span>
        </div>
      </section>

      {/* AI 요약 */}
      <section
        className="mobile-section"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🧠 이번 투자 요약</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          {summaryLines.map((line, i) => (
            <li key={i} style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* KPI 4개 */}
      <div className="mobile-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <Kpi label="총자산" value={formatWon(kpis.totalAsset)} />
        <Kpi
          label="누적손익"
          value={formatSignedWon(kpis.totalProfit)}
          tone={kpis.totalProfit >= 0 ? "up" : "down"}
        />
        <Kpi
          label="총수익률"
          value={formatPct(kpis.totalReturnPct)}
          tone={kpis.totalReturnPct >= 0 ? "up" : "down"}
        />
        <Kpi
          label="실현수익률"
          value={formatPct(kpis.realizedReturnPct)}
          tone={kpis.realizedReturnPct >= 0 ? "up" : "down"}
        />
      </div>

      {/* 내 투자 성장 그래프 */}
      <section
        className="mobile-section"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>📈 내 투자 성장</div>
        <GrowthTimeline points={timelinePoints} />
      </section>

      {/* 잘한 거래 / 아쉬운 거래 */}
      <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TradeHighlightCard title="👍 잘한 거래" trade={analysis.bestTrade} />
        <TradeHighlightCard title="👎 아쉬운 거래" trade={analysis.worstTrade} />
      </div>

      {/* 투자 습관 */}
      <section
        className="mobile-section"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>🧭 투자 습관</div>
        {analysis.realized.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            아직 매도(청산) 기록이 없습니다. 종목을 매도하면 승률과 평균 수익·손실이 표시돼요.
          </div>
        ) : (
          <>
            <div className="mobile-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <HabitStat label="승률" value={`${Math.round(analysis.winRate)}%`} sub={stars(analysis.winRate)} />
              <HabitStat label="평균 보유" value={`${analysis.averageHoldingDays.toFixed(1)}일`} />
              <HabitStat label="평균 수익" value={formatPct(analysis.avgWinPct)} tone="up" />
              <HabitStat label="평균 손실" value={formatPct(analysis.avgLossPct)} tone="down" />
            </div>
            {habitLines.length > 0 ? (
              <ul style={{ margin: "14px 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
                {habitLines.map((line, i) => (
                  <li key={i} style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>

      {/* 뉴스 학습과 투자 */}
      <section
        className="mobile-section"
        style={{
          background: "var(--surface)",
          border: "1px solid rgba(0,168,120,0.25)",
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>📰 뉴스 학습과 투자</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          종목 퀴즈 정답률이 80% 이상이었던 종목과, 80% 미만이었던 종목의 평균 수익률을 비교합니다.
        </div>
        {learningComparison ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <LearningCompareCard
                label={`정답률 80%+ 종목 (${learningComparison.highAccuracyCount}건)`}
                value={formatPct(learningComparison.highAccuracyAvgReturnPct)}
                tone={learningComparison.highAccuracyAvgReturnPct >= 0 ? "up" : "down"}
              />
              <LearningCompareCard
                label={`정답률 80% 미만 종목 (${learningComparison.lowAccuracyCount}건)`}
                value={formatPct(learningComparison.lowAccuracyAvgReturnPct)}
                tone={learningComparison.lowAccuracyAvgReturnPct >= 0 ? "up" : "down"}
              />
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
              총 {learningComparison.sampleSize}건의 거래/보유 종목을 기준으로 계산되었습니다. 데이터가 많지
              않을 경우 결과는 참고용으로만 봐주세요.
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            비교할 만큼 데이터가 쌓이지 않았어요. 퀴즈와 거래를 더 진행하면 비교 결과가 표시됩니다.
          </div>
        )}
      </section>

      {/* 종목별 상세 분석 */}
      <details
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <summary style={{ padding: 16, cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
          ▼ 종목별 상세 분석 ({holdings.length}종목)
        </summary>
        <div style={{ display: "grid", gap: 12, padding: 14, borderTop: "1px solid var(--border)" }}>
          {holdings.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
              현재 보유 중인 종목이 없습니다.
            </div>
          ) : (
            holdings
              .slice()
              .sort((a, b) => b.currentValue - a.currentValue)
              .map((h) => (
                <details
                  key={h.ticker}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}
                >
                  <summary style={{ padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{h.name}</div>
                      <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-muted)" }}>{h.sector}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{formatWon(h.currentValue)}</div>
                      <div style={{ marginTop: 3, fontSize: 11, fontWeight: 700, color: h.unrealizedProfit >= 0 ? "#ef4444" : "#2563eb" }}>
                        {formatSignedWon(h.unrealizedProfit)} ({formatPct(h.unrealizedReturnPct)})
                      </div>
                    </div>
                  </summary>
                  <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "grid", gap: 12 }}>
                    <div className="mobile-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      <MiniStat label="평균매입가" value={`₩${Math.round(h.avgCost).toLocaleString()}`} />
                      <MiniStat label="현재가" value={h.currentPrice != null ? `₩${Math.round(h.currentPrice).toLocaleString()}` : "-"} />
                      <MiniStat label="보유기간" value={`${h.holdingDays.toFixed(0)}일`} />
                      <MiniStat label="수익률" value={formatPct(h.unrealizedReturnPct)} tone={h.unrealizedReturnPct >= 0 ? "up" : "down"} />
                    </div>
                    <TradeHistoryList
                      trades={tradeHistoryItems.filter((t) => t.ticker === h.ticker)}
                      emptyText="이 종목의 거래 기록이 없습니다."
                    />
                  </div>
                </details>
              ))
          )}
        </div>
      </details>
    </div>
  );
}

function buildTimelinePoints(
  trades: TradeRow[],
  realized: { id: string; ticker: string; quantity: number; realizedProfit: number; tradedAt: string; returnPct: number }[],
  currentUnrealizedProfit: number
): TimelinePoint[] {
  const realizedByTradeId = new Map(realized.map((r) => [r.id, r]));
  let cumulative = 0;
  const points: TimelinePoint[] = [];

  trades.forEach((t) => {
    const stock = getStock(t.ticker);
    const name = stock?.name ?? t.ticker;

    if (t.trade_type === "sell") {
      const r = realizedByTradeId.get(t.id);
      if (r) cumulative += r.realizedProfit;
      points.push({
        date: t.traded_at,
        type: "sell",
        ticker: t.ticker,
        name,
        cumulativeProfit: cumulative,
        detail: `매도 ${t.quantity}주 · ₩${Math.round(t.price).toLocaleString()}`,
      });
    } else {
      points.push({
        date: t.traded_at,
        type: "buy",
        ticker: t.ticker,
        name,
        cumulativeProfit: cumulative,
        detail: `매수 ${t.quantity}주 · ₩${Math.round(t.price).toLocaleString()}`,
      });
    }
  });

  points.push({
    date: new Date().toISOString(),
    type: "now",
    ticker: "",
    name: "현재 평가",
    cumulativeProfit: cumulative + currentUnrealizedProfit,
    detail: "실현손익 + 평가손익 합계",
  });

  return points;
}

function buildAiSummary(params: {
  sector: { sector: string; count: number; ratioPct: number } | null;
  tradeCount: number;
  averageHoldingDays: number;
  bestTrade: { ticker: string; returnPct: number } | null;
  avgWinHoldingDays: number;
  avgLossHoldingDays: number;
}): string[] {
  const { sector, tradeCount, averageHoldingDays, bestTrade, avgWinHoldingDays, avgLossHoldingDays } = params;
  const lines: string[] = [];

  if (sector) {
    lines.push(`${sector.sector} 종목 비중이 가장 높았습니다 (전체 거래의 ${Math.round(sector.ratioPct)}%).`);
  }
  lines.push(`총 ${tradeCount}번 거래했습니다.`);
  if (averageHoldingDays > 0) {
    lines.push(`평균 보유기간은 ${averageHoldingDays.toFixed(1)}일입니다.`);
  }
  if (bestTrade) {
    const stock = getStock(bestTrade.ticker);
    lines.push(`가장 높은 수익은 ${stock?.name ?? bestTrade.ticker}(${formatPct(bestTrade.returnPct)})였습니다.`);
  }
  if (avgLossHoldingDays > 0 && avgWinHoldingDays > 0) {
    if (avgLossHoldingDays > avgWinHoldingDays) {
      lines.push("손실 거래는 평균보다 오래 보유하는 경향이 있습니다.");
    } else if (avgWinHoldingDays > avgLossHoldingDays) {
      lines.push("수익 거래는 평균보다 오래 보유하는 경향이 있습니다.");
    }
  }

  if (lines.length === 0) {
    lines.push("아직 데이터가 충분하지 않습니다. 거래가 쌓이면 더 자세한 요약을 볼 수 있어요.");
  }

  return lines;
}

function buildHabitInsights(analysis: {
  realized: { returnPct: number }[];
  avgWinHoldingDays: number;
  avgLossHoldingDays: number;
}): string[] {
  const lines: string[] = [];
  if (analysis.avgWinHoldingDays > 0 && analysis.avgLossHoldingDays > 0) {
    if (analysis.avgWinHoldingDays < analysis.avgLossHoldingDays) {
      lines.push("수익 거래는 비교적 빠르게 매도했습니다.");
      lines.push("손실 거래는 평균보다 오래 보유했습니다.");
    } else if (analysis.avgWinHoldingDays > analysis.avgLossHoldingDays) {
      lines.push("수익 거래를 더 오래 보유하고, 손실 거래는 비교적 빠르게 정리했습니다.");
    }
  }
  return lines;
}

function EmptyPanel({ message, showTradeLink = false }: { message: string; showTradeLink?: boolean }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "44px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>투자 성과</div>
      <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{message}</div>
      {showTradeLink ? (
        <Link
          href="/portfolio"
          style={{
            display: "inline-flex",
            marginTop: 14,
            padding: "9px 12px",
            borderRadius: 8,
            background: "var(--accent2)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          모의투자 하러 가기
        </Link>
      ) : null}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "#ef4444" : tone === "down" ? "#2563eb" : "var(--text)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}

function HabitStat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "#ef4444" : tone === "down" ? "#2563eb" : "var(--text)";
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
      {sub ? <div style={{ marginTop: 3, fontSize: 11, color: "var(--warn)" }}>{sub}</div> : null}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "#ef4444" : tone === "down" ? "#2563eb" : "var(--text)";
  return (
    <div style={{ background: "var(--surface)", borderRadius: 8, padding: 10, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function LearningCompareCard({ label, value, tone }: { label: string; value: string; tone: "up" | "down" }) {
  const color = tone === "up" ? "#ef4444" : "#2563eb";
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
    </div>
  );
}

function TradeHighlightCard({
  title,
  trade,
}: {
  title: string;
  trade: { ticker: string; realizedProfit: number; returnPct: number; tradedAt: string } | null;
}) {
  const color = !trade || trade.realizedProfit === 0
    ? "var(--text)"
    : trade.realizedProfit > 0
      ? "#ef4444"
      : "#2563eb";
  const stock = trade ? getStock(trade.ticker) : null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", marginBottom: 10 }}>{title}</div>
      {trade ? (
        <>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{stock?.name ?? trade.ticker}</div>
          <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900, color }}>{formatSignedWon(trade.realizedProfit)}</div>
          <div style={{ marginTop: 3, fontSize: 12, fontWeight: 700, color }}>{formatPct(trade.returnPct)}</div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>아직 매도 기록이 없습니다.</div>
      )}
    </div>
  );
}

function stars(winRatePct: number) {
  const filled = Math.max(0, Math.min(5, Math.round(winRatePct / 20)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

import { createClient } from "@/lib/supabase/server";
import { getDashboardQuote } from "@/lib/yahoo";
import { getPublicNickname } from "@/lib/nicknamePolicy";
import { unstable_noStore as noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type RankingHolding = {
  ticker: string | null;
  quantity: number | string | null;
  avg_cost: number | string | null;
};

type RankingRow = {
  id: string;
  nickname: string | null;
  current_coins: number | string | null;
  total_earned_coins: number | string | null;
  realized_profit: number | string | null;
  realized_cost_basis: number | string | null;
  realized_return_rate: number | string | null;
  portfolio_cost_basis?: number | string | null;
  holding_count?: number | string | null;
  holdings?: RankingHolding[] | string | null;
};

function toNumber(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseHoldings(value: RankingRow["holdings"]) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as RankingHolding[]) : [];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  noStore();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 100);
  const requestedClassId = req.nextUrl.searchParams.get("classId");
  const classId = requestedClassId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedClassId)
    ? requestedClassId
    : null;
  if (requestedClassId && !classId) {
    return NextResponse.json({ error: "잘못된 수업입니다." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("get_learning_rankings", { p_limit: 500, p_class_id: classId });

  if (error) {
    console.error("[GET /api/rankings] ranking rpc error:", error);
    const status = error.code === "42501" ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? "이 수업 랭킹에 접근할 수 없습니다." : "랭킹을 불러오지 못했습니다." }, { status });
  }

  const rows = ((data ?? []) as RankingRow[]).map((row) => ({
    ...row,
    holdings: parseHoldings(row.holdings),
  }));
  const tickers = Array.from(new Set(rows.flatMap((row) => row.holdings.map((holding) => holding.ticker).filter(Boolean) as string[])));

  const priceEntries = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const quote = await getDashboardQuote(ticker);
        const price = quote.regularMarketPrice ?? 0;
        return [ticker, price > 0 ? price : null] as const;
      } catch (error) {
        console.error(`[GET /api/rankings] quote error (${ticker}):`, error);
        return [ticker, null] as const;
      }
    })
  );
  const priceByTicker = new Map(priceEntries);

  const rankings = rows
    .map((row) => {
      const currentCoins = toNumber(row.current_coins);
      const totalEarned = toNumber(row.total_earned_coins);
      const realizedProfit = toNumber(row.realized_profit);
      const realizedCostBasis = toNumber(row.realized_cost_basis);
      const holdings = row.holdings;
      const activeHoldings = holdings.filter((holding) => holding.ticker && toNumber(holding.quantity) > 0);
      const derivedPortfolioCostBasis = activeHoldings.reduce(
        (sum, holding) => sum + toNumber(holding.quantity) * toNumber(holding.avg_cost),
        0
      );
      const rpcPortfolioCostBasis = toNumber(row.portfolio_cost_basis);
      const portfolioCostBasis = rpcPortfolioCostBasis > 0
        ? rpcPortfolioCostBasis
        : derivedPortfolioCostBasis;
      const portfolioMarketValue = holdings.reduce((sum, holding) => {
        const quantity = toNumber(holding.quantity);
        const avgCost = toNumber(holding.avg_cost);
        const latestPrice = holding.ticker ? priceByTicker.get(holding.ticker) : null;
        return sum + quantity * (latestPrice ?? avgCost);
      }, 0);
      const unrealizedProfit = portfolioMarketValue - portfolioCostBasis;
      const totalProfit = realizedProfit + unrealizedProfit;
      const totalCostBasis = realizedCostBasis + portfolioCostBasis;
      const totalReturnRate = totalCostBasis > 0
        ? (totalProfit / totalCostBasis) * 100
        : 0;
      const totalAccountAssets = currentCoins + portfolioMarketValue;
      const returnRateAdjustment = totalEarned * (clamp(totalReturnRate, -30, 30) / 100) * 0.2;
      const learningInvestmentScore =
        totalAccountAssets +
        totalEarned * 0.3 +
        totalProfit * 0.5 +
        returnRateAdjustment;

      return {
        id: row.id,
        nickname: getPublicNickname(row.nickname, row.id),
        current_coins: Math.round(currentCoins),
        total_earned_coins: Math.round(totalEarned),
        realized_profit: Math.round(realizedProfit),
        realized_cost_basis: Math.round(realizedCostBasis),
        unrealized_profit: Math.round(unrealizedProfit),
        total_profit: Math.round(totalProfit),
        total_cost_basis: Math.round(totalCostBasis),
        total_return_rate: totalReturnRate,
        portfolio_cost_basis: Math.round(portfolioCostBasis),
        portfolio_market_value: Math.round(portfolioMarketValue),
        total_account_assets: Math.round(totalAccountAssets),
        learning_investment_score: Math.round(learningInvestmentScore),
        holding_count: activeHoldings.length,
      };
    })
    .sort((a, b) =>
      b.learning_investment_score - a.learning_investment_score ||
      b.total_account_assets - a.total_account_assets ||
      b.total_earned_coins - a.total_earned_coins ||
      b.total_return_rate - a.total_return_rate
    )
    .slice(0, limit);

  return NextResponse.json(
    { rankings },
    { headers: { "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate" } }
  );
}

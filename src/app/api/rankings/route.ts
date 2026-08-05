import { createClient } from "@/lib/supabase/server";
import { getQuote } from "@/lib/yahoo";
import { NextRequest, NextResponse } from "next/server";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1), 100);

  const { data, error } = await supabase.rpc("get_learning_rankings", { p_limit: 100 });

  if (error) {
    console.error("[GET /api/rankings] ranking rpc error:", error);
    return NextResponse.json({ error: "랭킹을 불러오지 못했습니다." }, { status: 500 });
  }

  const rows = ((data ?? []) as RankingRow[]).map((row) => ({
    ...row,
    holdings: parseHoldings(row.holdings),
  }));
  const tickers = Array.from(new Set(rows.flatMap((row) => row.holdings.map((holding) => holding.ticker).filter(Boolean) as string[])));

  const priceEntries = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const quote = await getQuote(ticker);
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
      const realizedReturnRate = toNumber(row.realized_return_rate);
      const holdings = row.holdings;
      const portfolioMarketValue = holdings.reduce((sum, holding) => {
        const quantity = toNumber(holding.quantity);
        const avgCost = toNumber(holding.avg_cost);
        const latestPrice = holding.ticker ? priceByTicker.get(holding.ticker) : null;
        return sum + quantity * (latestPrice ?? avgCost);
      }, 0);
      const totalAccountAssets = currentCoins + portfolioMarketValue;
      const returnBonus = totalEarned * (clamp(realizedReturnRate, -30, 30) / 100) * 0.2;
      const learningInvestmentScore =
        totalAccountAssets +
        totalEarned * 0.3 +
        realizedProfit * 0.5 +
        returnBonus;

      return {
        id: row.id,
        nickname: row.nickname,
        current_coins: Math.round(currentCoins),
        total_earned_coins: Math.round(totalEarned),
        realized_profit: Math.round(realizedProfit),
        realized_cost_basis: Math.round(realizedCostBasis),
        realized_return_rate: realizedReturnRate,
        portfolio_market_value: Math.round(portfolioMarketValue),
        total_account_assets: Math.round(totalAccountAssets),
        learning_investment_score: Math.round(learningInvestmentScore),
        holding_count: holdings.filter((holding) => holding.ticker && toNumber(holding.quantity) > 0).length,
      };
    })
    .sort((a, b) =>
      b.learning_investment_score - a.learning_investment_score ||
      b.total_account_assets - a.total_account_assets ||
      b.total_earned_coins - a.total_earned_coins ||
      b.realized_return_rate - a.realized_return_rate
    )
    .slice(0, limit);

  return NextResponse.json({ rankings });
}

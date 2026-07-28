import { NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";
import { getQuote } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const MARKET_MAP_WEIGHTS: Record<string, number> = {
  "005930.KS": 12,
  "000660.KS": 10,
  "373220.KS": 8,
  "207940.KS": 8,
  "005380.KS": 7,
  "000270.KS": 6,
  "005490.KS": 6,
  "035420.KS": 5,
  "012450.KS": 5,
  "105560.KS": 5,
  "055550.KS": 4,
  "086790.KS": 4,
  "267260.KS": 4,
  "034020.KS": 4,
  "068270.KS": 4,
  "006400.KS": 4,
  "042700.KS": 3,
  "010120.KS": 3,
  "298040.KS": 3,
  "329180.KS": 3,
  "042660.KS": 3,
  "010140.KS": 3,
  "047810.KS": 3,
  "064350.KS": 3,
  "015760.KS": 3,
  "000720.KS": 3,
  "012330.KS": 3,
  "000100.KS": 3,
  "035720.KS": 3,
  "259960.KS": 3,
};

export async function GET() {
  const [items, kospi] = await Promise.all([
    Promise.all(
      STOCKS.map(async (stock) => {
        try {
          const quote = await getQuote(stock.ticker);
          return {
            ticker: stock.ticker,
            name: stock.name,
            sector: stock.sector,
            weight: MARKET_MAP_WEIGHTS[stock.ticker] ?? 3,
            price: quote.regularMarketPrice ?? null,
            changePercent: quote.regularMarketChangePercent ?? null,
          };
        } catch {
          return {
            ticker: stock.ticker,
            name: stock.name,
            sector: stock.sector,
            weight: MARKET_MAP_WEIGHTS[stock.ticker] ?? 3,
            price: null,
            changePercent: null,
          };
        }
      })
    ),
    getQuote("^KS11")
      .then((quote) => ({
        value: quote.regularMarketPrice ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
      }))
      .catch(() => ({ value: null, changePercent: null })),
  ]);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    kospi,
    basis: {
      size: "코스피 대표성 가중치",
      color: "Yahoo Finance 당일 등락률",
      refresh: "대시보드 접속 또는 새로고침 시 1회",
    },
    items,
  });
}

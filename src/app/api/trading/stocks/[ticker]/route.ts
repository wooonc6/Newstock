import { NextRequest, NextResponse } from "next/server";
import { getMarketScheduleStatus } from "@/lib/marketSchedule";
import { getStock } from "@/lib/stocks";
import { getTradingQuote } from "@/lib/yahoo";

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker);
  const stock = getStock(ticker);

  if (!stock) {
    return NextResponse.json({ error: "Newstock에서 지원하지 않는 종목입니다." }, { status: 400 });
  }

  try {
    const marketStatus = getMarketScheduleStatus();
    const quote = await getTradingQuote(stock.ticker, marketStatus);

    return NextResponse.json({
      ticker: stock.ticker,
      name: stock.name,
      yahooName: quote.shortName ?? null,
      price: quote.executionPrice,
      dashboardPrice: quote.dashboardPrice,
      change: quote.regularMarketChange ?? null,
      changePercent: quote.regularMarketChangePercent ?? null,
      prevClose: quote.regularMarketPreviousClose ?? null,
      volume: quote.regularMarketVolume ?? null,
      currency: quote.currency ?? "KRW",
      priceBasis: quote.executionPriceBasis,
      priceLabel: quote.executionPriceLabel,
      sessionLabel: quote.sessionLabel,
      sessionKind: quote.sessionKind,
      mayDifferFromDashboard: quote.mayDifferFromDashboard,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[trading-quote] ${ticker}:`, err);
    return NextResponse.json({ error: "모의투자 기준가를 가져올 수 없습니다." }, { status: 502 });
  }
}

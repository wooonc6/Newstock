import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker);

  try {
    const { default: yahooFinance } = await import("yahoo-finance2");

    const quote = await (yahooFinance as any).quote(ticker, {
      fields: [
        "regularMarketPrice",
        "regularMarketChange",
        "regularMarketChangePercent",
        "regularMarketPreviousClose",
        "regularMarketVolume",
        "shortName",
        "currency",
      ],
    });

    return NextResponse.json({
      ticker,
      name: quote.shortName ?? null,
      price: quote.regularMarketPrice ?? null,
      change: quote.regularMarketChange ?? null,
      changePercent: quote.regularMarketChangePercent ?? null,
      prevClose: quote.regularMarketPreviousClose ?? null,
      volume: quote.regularMarketVolume ?? null,
      currency: quote.currency ?? "KRW",
    });
  } catch (err) {
    console.error(`[yahoo-finance] ${ticker}:`, err);
    return NextResponse.json({ error: "주가 데이터를 가져올 수 없습니다." }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStock } from "@/lib/stocks";
import { getDashboardQuote } from "@/lib/yahoo";

const SHARED_RESPONSE_CACHE = "public, s-maxage=25, stale-while-revalidate=5";

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker);
  const stock = getStock(ticker);

  if (!stock) {
    return NextResponse.json({ error: "Newstock에서 지원하지 않는 종목입니다." }, { status: 400 });
  }

  try {
    const quote = await getDashboardQuote(stock.ticker);

    return NextResponse.json(
      {
        ticker: stock.ticker,
        name: stock.name,
        yahooName: quote.shortName ?? null,
        price: quote.regularMarketPrice ?? null,
        change: quote.regularMarketChange ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
        prevClose: quote.regularMarketPreviousClose ?? null,
        volume: quote.regularMarketVolume ?? null,
        currency: quote.currency ?? "KRW",
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": SHARED_RESPONSE_CACHE } }
    );
  } catch (err) {
    console.error(`[yahoo-finance] ${ticker}:`, err);
    return NextResponse.json({ error: "주가 데이터를 가져올 수 없습니다." }, { status: 502 });
  }
}

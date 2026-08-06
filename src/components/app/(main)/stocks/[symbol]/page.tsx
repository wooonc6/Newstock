import { getStock, STOCKS } from "@/lib/stocks";
import { notFound } from "next/navigation";
import StockDetailClient from "./StockDetailClient";

export function generateStaticParams() {
  return STOCKS.map((stock) => ({ symbol: encodeURIComponent(stock.ticker) }));
}

interface Props {
  params: { symbol: string };
}

export default function StockDetailPage({ params }: Props) {
  const ticker = decodeURIComponent(params.symbol);
  const stock = getStock(ticker);

  if (!stock) notFound();

  return <StockDetailClient stock={stock} />;
}

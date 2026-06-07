import { getStock, STOCKS } from "@/lib/stocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuizClient from "./QuizClient";

export function generateStaticParams() {
  return STOCKS.map((s) => ({ stock: encodeURIComponent(s.ticker) }));
}

interface Props {
  params: { stock: string };
}

export default function QuizPage({ params }: Props) {
  const ticker = decodeURIComponent(params.stock);
  const stock = getStock(ticker);

  if (!stock) notFound();

  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          ← 종목 목록
        </Link>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>
          {stock.sector.toUpperCase()}
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>{stock.name}</div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "12px",
          }}
        >
          {stock.ticker}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>{stock.description}</div>
      </div>

      <QuizClient ticker={ticker} stockName={stock.name} />
    </div>
  );
}

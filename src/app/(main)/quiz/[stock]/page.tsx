import { Suspense } from "react";
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
    <div style={{ display: "grid", gap: "16px" }}>
      <Link
        href={`/stocks/${encodeURIComponent(stock.ticker)}`}
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textDecoration: "none",
        }}
      >
        ← 종목 상세
      </Link>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 800, marginBottom: "7px" }}>
          {stock.sector}
        </div>
        <h1 style={{ fontSize: "22px", marginBottom: "6px" }}>{stock.name} 뉴스 퀴즈</h1>
        <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6 }}>
          1·3·6개월 전과 12개월 이상 전의 서로 다른 뉴스를 읽고, 각 기사 발표 후 3거래일 동안의 주가 방향을 맞혀보세요.
        </div>
      </section>

      <Suspense fallback={null}>
        <QuizClient ticker={ticker} stockName={stock.name} />
      </Suspense>
    </div>
  );
}

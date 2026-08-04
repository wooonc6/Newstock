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
          과거 뉴스를 읽고 기사 발표 후 3거래일 동안의 주가 상승·하락을 예측해보세요.
        </div>
      </section>

      <section
        aria-labelledby="past-news-quiz-title"
        style={{
          background: "var(--surface)",
          border: "2px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          display: "grid",
          gap: "14px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              marginBottom: "10px",
              borderRadius: "999px",
              padding: "5px 9px",
              background: "var(--surface2)",
              color: "var(--accent2)",
              fontSize: "10px",
              fontWeight: 800,
            }}
          >
            과거 학습 · 정답 보상 있음
          </div>
          <h2 id="past-news-quiz-title" style={{ fontSize: "16px", lineHeight: 1.4 }}>
            📚 과거 뉴스 퀴즈
          </h2>
          <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
            당시 기사를 읽고 발표 후 3거래일 동안의 주가 상승·하락을 예측하세요.
          </p>
        </div>

        <Suspense fallback={null}>
          <QuizClient ticker={ticker} stockName={stock.name} />
        </Suspense>
      </section>
    </div>
  );
}

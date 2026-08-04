import { Suspense } from "react";
import { getStock, STOCKS } from "@/lib/stocks";
import { notFound } from "next/navigation";
import Link from "next/link";
import QuizClient from "./QuizClient";
import RecentStockNews from "./RecentStockNews";

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
        <h1 style={{ fontSize: "22px", marginBottom: "6px" }}>{stock.name} 뉴스 학습</h1>
        <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6 }}>
          최신 기사로 지금의 이슈를 확인하고, 과거 기사 퀴즈로 실제 주가 흐름을 학습해보세요.
        </div>
      </section>

      <RecentStockNews ticker={ticker} stockName={stock.name} />

      <section aria-labelledby="past-news-quiz-title">
        <h2 id="past-news-quiz-title" style={{ fontSize: "16px", lineHeight: 1.4 }}>
          📚 과거 뉴스 퀴즈
        </h2>
        <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
          당시 기사를 읽고 발표 후 3거래일 동안의 주가 상승·하락을 예측하세요.
        </p>
      </section>

      <Suspense fallback={null}>
        <QuizClient ticker={ticker} stockName={stock.name} />
      </Suspense>
    </div>
  );
}

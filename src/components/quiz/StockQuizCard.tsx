"use client";

import Link from "next/link";
import type { Stock, UnlockStatus } from "@/types";
import { SECTOR_BADGE_STYLES } from "@/lib/stocks";
import { useStockPrice } from "@/hooks/useStockPrice";

interface Props {
  stock: Stock;
  status: UnlockStatus;
  newsCount?: number;
}

function formatPrice(price: number | null | undefined) {
  if (price == null) return "-";
  return `${Math.round(price).toLocaleString()}원`;
}

function PriceSummary({ ticker }: { ticker: string }) {
  const { data, loading, error } = useStockPrice(ticker);

  if (loading) {
    return <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>불러오는 중</span>;
  }

  if (error || !data) {
    return <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>주가 준비 중</span>;
  }

  const changePercent = data.changePercent ?? 0;
  const isUp = changePercent >= 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 700 }}>
        {formatPrice(data.price)}
      </span>
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "12px",
          fontWeight: 700,
          color: isUp ? "var(--danger)" : "#2563eb",
        }}
      >
        {changePercent > 0 ? "+" : ""}
        {changePercent.toFixed(2)}%
      </span>
    </div>
  );
}

export default function StockQuizCard({ stock, status, newsCount = 0 }: Props) {
  const { unlocked, quizzes_completed, quizzes_required } = status;
  const progress = Math.min(quizzes_completed / quizzes_required, 1);
  const remaining = Math.max(quizzes_required - quizzes_completed, 0);
  const detailHref = `/stocks/${encodeURIComponent(stock.ticker)}`;
  const quizHref = `/quiz/${encodeURIComponent(stock.ticker)}`;

  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        display: "grid",
        gap: "14px",
      }}
    >
      <Link href={detailHref} style={{ textDecoration: "none", color: "inherit" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "7px" }}>
              <strong style={{ fontSize: "17px" }}>{stock.name}</strong>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: "999px",
                  fontSize: "10px",
                  fontWeight: 700,
                  ...SECTOR_BADGE_STYLES[stock.sectorColor],
                }}
              >
                {stock.sector}
              </span>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "var(--text-muted)" }}>
              {stock.ticker}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <PriceSummary ticker={stock.ticker} />
            <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
              관련 뉴스 {newsCount}개
            </div>
          </div>
        </div>

        <p style={{ marginTop: "12px", fontSize: "12px", lineHeight: 1.6, color: "var(--text-dim)" }}>
          {stock.description}
        </p>
      </Link>

      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
          <span>학습 진행</span>
          <span style={{ fontFamily: "'Space Mono', monospace" }}>
            {quizzes_completed} / {quizzes_required}
          </span>
        </div>
        <div style={{ height: "5px", background: "var(--surface2)", borderRadius: "999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              borderRadius: "999px",
              background: unlocked ? "var(--accent)" : "var(--accent2)",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: unlocked ? "var(--accent)" : "var(--text-muted)" }}>
            {unlocked ? "모의 투자 가능" : `${remaining}개 더 풀면 투자 해제`}
          </span>
          <Link
            href={quizHref}
            onClick={(event) => event.stopPropagation()}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              background: "var(--accent2)",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            퀴즈 시작
          </Link>
        </div>
      </div>
    </article>
  );
}

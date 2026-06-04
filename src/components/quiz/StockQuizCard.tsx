"use client";

import Link from "next/link";
import type { Stock, UnlockStatus } from "@/types";
import { SECTOR_BADGE_STYLES } from "@/lib/stocks";
import { useStockPrice } from "@/hooks/useStockPrice";

interface Props {
  stock: Stock;
  status: UnlockStatus;
}

function PriceTag({ ticker }: { ticker: string }) {
  const { data, loading } = useStockPrice(ticker);

  if (loading) {
    return (
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "var(--text-muted)" }}>
        ···
      </span>
    );
  }

  if (!data || data.price === null) return null;

  const up = (data.changePercent ?? 0) >= 0;
  const pctStr = data.changePercent !== null
    ? `${up ? "+" : ""}${data.changePercent.toFixed(2)}%`
    : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <span
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "13px",
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        ₩{data.price.toLocaleString()}
      </span>
      {pctStr && (
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            padding: "2px 7px",
            borderRadius: "5px",
            background: up ? "rgba(0,229,176,0.1)" : "rgba(239,68,68,0.1)",
            color: up ? "var(--accent)" : "var(--danger)",
          }}
        >
          {pctStr}
        </span>
      )}
    </div>
  );
}

export default function StockQuizCard({ stock, status }: Props) {
  const { unlocked, quizzes_completed, quizzes_required } = status;
  const progress = Math.min(quizzes_completed / quizzes_required, 1);

  const card = (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${unlocked ? "rgba(0,229,176,0.22)" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "18px 20px",
        opacity: unlocked ? 1 : 0.75,
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {unlocked && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "rgba(0,229,176,0.12)",
            border: "1px solid rgba(0,229,176,0.3)",
            borderRadius: "100px",
            padding: "3px 10px",
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          ✓ 투자 허용
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
              {stock.name}
            </span>
            <span
              style={{
                padding: "3px 9px",
                borderRadius: "100px",
                fontSize: "10px",
                fontWeight: 700,
                ...SECTOR_BADGE_STYLES[stock.sectorColor],
              }}
            >
              {stock.sector}
            </span>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <PriceTag ticker={stock.ticker} />
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "10px" }}>
            {stock.description}
          </div>

          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginBottom: "12px",
            }}
          >
            {stock.ticker}
          </div>

          {!unlocked && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                <span>퀴즈 완료</span>
                <span style={{ fontFamily: "'Space Mono', monospace" }}>
                  {quizzes_completed} / {quizzes_required}
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  background: "var(--surface2)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress * 100}%`,
                    background: progress > 0 ? "var(--accent2)" : "transparent",
                    borderRadius: "2px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
                🔒 퀴즈 {quizzes_required - quizzes_completed}개 더 풀면 모의 투자 가능
              </div>
            </div>
          )}

          {unlocked && (
            <div style={{ fontSize: "12px", color: "var(--accent)" }}>
              ✅ 모의 투자가 가능한 종목입니다
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: "20px",
            color: unlocked ? "var(--accent)" : "var(--text-muted)",
            flexShrink: 0,
            paddingTop: "2px",
          }}
        >
          {unlocked ? "→" : "🔒"}
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/quiz/${encodeURIComponent(stock.ticker)}`} style={{ textDecoration: "none" }}>
      {card}
    </Link>
  );
}

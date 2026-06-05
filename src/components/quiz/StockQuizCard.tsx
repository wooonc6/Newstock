"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>
        ₩{data.price.toLocaleString()}
      </span>
      {pctStr && (
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: "11px",
          padding: "2px 7px",
          borderRadius: "5px",
          background: up ? "rgba(0,229,176,0.1)" : "rgba(239,68,68,0.1)",
          color: up ? "var(--accent)" : "var(--danger)",
        }}>
          {pctStr}
        </span>
      )}
    </div>
  );
}

export default function StockQuizCard({ stock, status }: Props) {
  const { unlocked, quizzes_completed, quizzes_required } = status;
  const progress = Math.min(quizzes_completed / quizzes_required, 1);

  const cardRef = useRef<HTMLDivElement>(null);
  const prevUnlocked = useRef(unlocked);

  // 잠금 해제 시 반짝이는 애니메이션
  useEffect(() => {
    if (!prevUnlocked.current && unlocked && cardRef.current) {
      cardRef.current.animate(
        [
          { transform: "scale(1)",    boxShadow: "0 0 0px rgba(0,229,176,0)" },
          { transform: "scale(1.03)", boxShadow: "0 0 28px rgba(0,229,176,0.4)" },
          { transform: "scale(1)",    boxShadow: "0 0 10px rgba(0,229,176,0.15)" },
        ],
        { duration: 650, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }
      );
    }
    prevUnlocked.current = unlocked;
  }, [unlocked]);

  const card = (
    <div
      ref={cardRef}
      style={{
        background: "var(--surface)",
        border: `1px solid ${unlocked ? "rgba(0,229,176,0.22)" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "clamp(14px, 4vw, 20px)",   // 모바일 반응형
        opacity: unlocked ? 1 : 0.75,
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {unlocked && (
        <div style={{
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
        }}>
          ✓ 투자 허용
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(10px, 3vw, 14px)" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 종목명 + 섹터 배지 */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 700, color: "var(--text)" }}>
              {stock.name}
            </span>
            <span style={{
              padding: "3px 9px",
              borderRadius: "100px",
              fontSize: "10px",
              fontWeight: 700,
              ...SECTOR_BADGE_STYLES[stock.sectorColor],
            }}>
              {stock.sector}
            </span>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <PriceTag ticker={stock.ticker} />
          </div>

          <div style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "var(--text-dim)", marginBottom: "10px", lineHeight: 1.5 }}>
            {stock.description}
          </div>

          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
            {stock.ticker}
          </div>

          {/* 잠금 상태: 퀴즈 진행도 */}
          {!unlocked && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
                <span>퀴즈 완료</span>
                <span style={{ fontFamily: "'Space Mono', monospace" }}>
                  {quizzes_completed} / {quizzes_required}
                </span>
              </div>
              <div style={{ height: "4px", background: "var(--surface2)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  background: progress > 0 ? "var(--accent2)" : "transparent",
                  borderRadius: "2px",
                  transition: "width 0.5s ease",
                }} />
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

        <div style={{
          fontSize: "20px",
          color: unlocked ? "var(--accent)" : "var(--text-muted)",
          flexShrink: 0,
          paddingTop: "2px",
        }}>
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

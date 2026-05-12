"use client";

import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { STOCKS } from "@/lib/stocks";
import StockQuizCard from "@/components/quiz/StockQuizCard";

export default function DashboardClient() {
  const { user } = useAuth();
  const { unlockMap, loading } = useQuizUnlock(user?.id);

  const unlockedCount = Object.values(unlockMap).filter((s) => s.unlocked).length;

  return (
    <div>
      {/* 안내 배너 */}
      <div
        style={{
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: "12px",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "20px", flexShrink: 0 }}>📰</div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>
            종목별 뉴스 퀴즈를 풀어 투자 감각을 키우세요
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
            각 종목 퀴즈를 {3}번 완료하면 모의 투자 기능이 활성화됩니다.
          </div>
        </div>
      </div>

      {/* 진행 요약 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          종목별 퀴즈
        </div>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            color: unlockedCount > 0 ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          {loading ? "..." : `${unlockedCount} / ${STOCKS.length} 언락`}
        </div>
      </div>

      {/* 종목 카드 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {STOCKS.map((stock) => {
          const status = unlockMap[stock.ticker] ?? {
            ticker: stock.ticker,
            unlocked: false,
            quizzes_completed: 0,
            quizzes_required: 3,
          };
          return (
            <StockQuizCard key={stock.ticker} stock={stock} status={status} />
          );
        })}
      </div>
    </div>
  );
}

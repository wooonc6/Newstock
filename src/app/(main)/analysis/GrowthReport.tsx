"use client";

import { useMemo } from "react";

import GrowthCards from "./GrowthCards";
import GrowthScore from "./GrowthScore";

import { useAuth } from "@/hooks/useAuth";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";

export default function GrowthReport() {
  const { user, coins = 0 } = useAuth();
  const { unlockMap } = useQuizUnlock(user?.id);

  const unlockedCompanies = useMemo(
    () =>
      Object.values(unlockMap).filter((item) => item.unlocked).length,
    [unlockMap]
  );

  const solvedNews = useMemo(
    () =>
      Object.values(unlockMap).reduce(
        (sum, item) => sum + item.quizzes_completed,
        0
      ),
    [unlockMap]
  );

  const totalAsset = Math.round(coins);

  return (
    <div
      style={{
        display: "grid",
        gap: 28,
      }}
    >
      <section>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
          }}
        >
          성장 리포트
        </div>

        <h1
          style={{
            marginTop: 8,
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          🌱 나의 성장
        </h1>

        <p
          style={{
            marginTop: 10,
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          뉴스 학습과 기업 잠금 해제 현황을 확인하고
          투자 실력의 성장을 살펴보세요.
        </p>
      </section>

      <GrowthCards
        totalAsset={totalAsset}
        totalProfit={0}
        totalReturn={0}
        realizedReturn={0}
        solvedNews={solvedNews}
        unlockedCompanies={unlockedCompanies}
      />

      <GrowthScore
        solvedNews={solvedNews}
        unlockedCompanies={unlockedCompanies}
        totalTrades={0}
        profitableTrades={0}
        totalReturn={0}
      />
    </div>
  );
}

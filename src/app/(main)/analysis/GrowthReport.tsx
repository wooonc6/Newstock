"use client";

import { useMemo } from "react";
import GrowthCards from "./GrowthCards";
import GrowthScore from "./GrowthScore";

import { useAuth } from "@/hooks/useAuth";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTradingPrice } from "@/hooks/useTradingPrice";

export default function GrowthReport() {
  const { user, coins = 0 } = useAuth();

  const { unlockMap } = useQuizUnlock(user?.id);

  const { holdings = [] } = usePortfolio(user?.id);

  const unlockedCompanies = useMemo(
    () =>
      Object.values(unlockMap).filter((v) => v.unlocked).length,
    [unlockMap]
  );

  const totalAsset = useMemo(() => {
    let asset = coins;

    holdings.forEach((holding) => {
      const { price } = useTradingPrice(holding.ticker);
      asset += price * holding.quantity;
    });

    return Math.round(asset);
  }, [coins, holdings]);

  const solvedNews = useMemo(() => {
    return Object.values(unlockMap).reduce(
      (sum, item) => sum + item.quizzes_completed,
      0
    );
  }, [unlockMap]);

  return (
    <div style={{ display: "grid", gap: 28 }}>
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
          뉴스를 학습하고 기업 잠금을 해제하며
          투자 실력을 키우는 과정을 분석합니다.
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

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <h3
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          🌱 성장 과정
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(160px,1fr))",
            gap: 18,
          }}
        >
          {[
            "뉴스 학습",
            "뉴스 퀴즈 완료",
            "기업 잠금 해제",
            "첫 투자",
            "첫 수익",
          ].map((step, i) => (
            <div
              key={step}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 22,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 auto 14px",
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </div>

              <div style={{ fontWeight: 700 }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

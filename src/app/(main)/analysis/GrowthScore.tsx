"use client";

interface Props {
  solvedNews: number;
  unlockedCompanies: number;
  totalTrades: number;
  profitableTrades: number;
  totalReturn: number;
}

export default function GrowthScore({
  solvedNews,
  unlockedCompanies,
  totalTrades,
  profitableTrades,
  totalReturn,
}: Props) {
  const winRate =
    totalTrades > 0
      ? Math.round((profitableTrades / totalTrades) * 100)
      : 0;

  const score = Math.min(
    100,
    solvedNews +
      unlockedCompanies * 5 +
      Math.round(winRate * 0.2) +
      Math.max(0, Math.round(totalReturn))
  );

  let grade = "C";

  if (score >= 40) grade = "B";
  if (score >= 70) grade = "A";
  if (score >= 90) grade = "S";

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        background: "var(--surface)",
        padding: 28,
      }}
    >
      <h3
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        🌱 성장 지수
      </h3>

      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            minWidth: 140,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "var(--primary)",
            }}
          >
            {score}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {grade} 등급
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 240,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 12,
              background: "var(--border)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                background: "var(--primary)",
              }}
            />
          </div>

          <p
            style={{
              marginTop: 14,
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}
          >
            뉴스 학습, 기업 잠금 해제, 투자 성과를 바탕으로 계산한 성장 점수입니다.
          </p>
        </div>
      </div>
    </section>
  );
}

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
    totalTrades === 0
      ? 0
      : Math.round((profitableTrades / totalTrades) * 100);

  const score = Math.min(
    100,
    Math.round(
      solvedNews * 1.5 +
        unlockedCompanies * 3 +
        winRate * 0.3 +
        Math.max(totalReturn, 0)
    )
  );

  let grade = "C";

  if (score >= 60) grade = "B";
  if (score >= 80) grade = "A";
  if (score >= 95) grade = "S";

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
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        <div>
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
              marginTop: 8,
              fontSize: 24,
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
              height: 14,
              background: "#ececec",
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
              marginTop: 16,
              color: "var(--text-muted)",
              lineHeight: 1.8,
            }}
          >
            뉴스 학습, 기업 잠금 해제, 투자 성과를 종합하여 계산한
            성장 지수입니다.
          </p>
        </div>
      </div>
    </section>
  );
}

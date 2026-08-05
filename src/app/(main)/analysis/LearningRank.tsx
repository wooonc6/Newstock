"use client";

interface Props {
  rank: number;
  totalUsers: number;
}

export default function LearningRank({
  rank,
  totalUsers,
}: Props) {
  const percentile =
    totalUsers === 0
      ? 0
      : Math.round(((totalUsers - rank) / totalUsers) * 100);

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        background: "var(--surface)",
        padding: 24,
      }}
    >
      <h3
        style={{
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        🏅 학습 랭킹
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
            }}
          >
            현재 순위
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 46,
              fontWeight: 800,
            }}
          >
            {rank.toLocaleString()}위
          </div>

          <div
            style={{
              marginTop: 10,
              color: "var(--text-muted)",
            }}
          >
            상위 {percentile}% 학습자
          </div>
        </div>

        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "8px solid var(--primary)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {percentile}%
        </div>
      </div>
    </section>
  );
}

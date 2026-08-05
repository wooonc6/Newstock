"use client";

interface Props {
  scores: number[];
}

export default function LearningGrowthChart({
  scores,
}: Props) {
  const max = Math.max(...scores, 1);

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
        📈 성장 추이
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          height: 220,
        }}
      >
        {scores.map((score, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              {score}
            </div>

            <div
              style={{
                width: "100%",
                height: `${(score / max) * 160}px`,
                minHeight: 8,
                borderRadius: 10,
                background: "var(--primary)",
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          marginTop: 18,
          color: "var(--text-muted)",
          lineHeight: 1.7,
        }}
      >
        학습 성과가 시간에 따라 어떻게 성장했는지 보여줍니다.
      </p>
    </section>
  );
}

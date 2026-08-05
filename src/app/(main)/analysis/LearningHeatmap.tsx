"use client";

interface Props {
  values: number[];
}

export default function LearningHeatmap({
  values,
}: Props) {
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
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        🗓️ 학습 히트맵
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 8,
        }}
      >
        {values.map((value, index) => {
          const opacity =
            value === 0
              ? 0.15
              : Math.min(0.25 + value * 0.15, 1);

          return (
            <div
              key={index}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                background: `rgba(37,99,235,${opacity})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: opacity > 0.55 ? "#fff" : "#333",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {index + 1}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        색이 진할수록 해당 날짜의 학습량이 많습니다.
      </div>
    </section>
  );
}

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
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        🔥 학습 히트맵
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
              : Math.min(1, value / 5);

          return (
            <div
              key={index}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                background: `rgba(37,99,235,${opacity})`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color:
                  opacity > 0.5
                    ? "#fff"
                    : "var(--text)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {value}
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: 18,
          color: "var(--text-muted)",
          lineHeight: 1.7,
        }}
      >
        최근 학습량을 한눈에 확인할 수 있습니다.
      </p>
    </section>
  );
}

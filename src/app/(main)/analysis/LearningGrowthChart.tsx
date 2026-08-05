"use client";

interface Props {
  values: number[];
}

export default function LearningGrowthChart({
  values,
}: Props) {
  const max = Math.max(...values, 1);

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
        📈 학습 성장 추이
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          height: 220,
        }}
      >
        {values.map((value, index) => (
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
              {value}
            </div>

            <div
              style={{
                width: "100%",
                height: `${(value / max) * 160}px`,
                borderRadius: 10,
                background: "var(--primary)",
                minHeight: 6,
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              {index + 1}주
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

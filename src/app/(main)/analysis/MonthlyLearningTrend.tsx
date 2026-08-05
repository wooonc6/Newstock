"use client";

interface Props {
  values: number[];
}

export default function MonthlyLearningTrend({
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
        📆 월별 학습 추이
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 14,
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
                minHeight: 8,
                height: `${(value / max) * 160}px`,
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
              {index + 1}월
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

interface Item {
  label: string;
  value: number;
}

interface Props {
  items: Item[];
}

export default function LearningDistribution({
  items,
}: Props) {
  const total = items.reduce(
    (sum, item) => sum + item.value,
    0
  );

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
        📊 학습 비중
      </h3>

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        {items.map((item) => {
          const percent =
            total === 0
              ? 0
              : Math.round((item.value / total) * 100);

          return (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span>{item.label}</span>
                <strong>{percent}%</strong>
              </div>

              <div
                style={{
                  width: "100%",
                  height: 10,
                  background: "#ececec",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background: "var(--primary)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

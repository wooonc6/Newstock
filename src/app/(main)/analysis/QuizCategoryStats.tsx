"use client";

interface Category {
  name: string;
  solved: number;
}

interface Props {
  categories: Category[];
}

export default function QuizCategoryStats({
  categories,
}: Props) {
  const max = Math.max(...categories.map((c) => c.solved), 1);

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
        📰 분야별 뉴스 학습
      </h3>

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >
        {categories.map((item) => (
          <div key={item.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <strong>{item.name}</strong>

              <span>{item.solved}개</span>
            </div>

            <div
              style={{
                width: "100%",
                height: 10,
                borderRadius: 999,
                background: "#ececec",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(item.solved / max) * 100}%`,
                  height: "100%",
                  background: "var(--primary)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

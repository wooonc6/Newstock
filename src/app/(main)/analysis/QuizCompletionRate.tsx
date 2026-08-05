"use client";

interface Props {
  completed: number;
  total: number;
}

export default function QuizCompletionRate({
  completed,
  total,
}: Props) {
  const percent =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

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
        📚 뉴스 퀴즈 진행률
      </h3>

      <div
        style={{
          fontSize: 42,
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        {percent}%
      </div>

      <div
        style={{
          width: "100%",
          height: 12,
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

      <div
        style={{
          marginTop: 14,
          color: "var(--text-muted)",
        }}
      >
        {completed} / {total}개의 뉴스 퀴즈를 완료했습니다.
      </div>
    </section>
  );
}

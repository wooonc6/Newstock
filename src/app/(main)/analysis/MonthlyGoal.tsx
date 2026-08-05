"use client";

interface Props {
  completed: number;
  goal: number;
}

export default function MonthlyGoal({
  completed,
  goal,
}: Props) {
  const percent =
    goal === 0
      ? 0
      : Math.min(Math.round((completed / goal) * 100), 100);

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
          marginBottom: 18,
        }}
      >
        🎯 이번 달 목표
      </h3>

      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        {completed} / {goal}
      </div>

      <div
        style={{
          color: "var(--text-muted)",
          marginBottom: 18,
        }}
      >
        이번 달 뉴스 퀴즈 목표 진행률
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
          marginTop: 12,
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        진행률 {percent}%
      </div>
    </section>
  );
}

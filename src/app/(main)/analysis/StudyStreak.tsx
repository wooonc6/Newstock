"use client";

interface Props {
  streak: number;
}

export default function StudyStreak({ streak }: Props) {
  const goal = 30;
  const percent = Math.min((streak / goal) * 100, 100);

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
        🔥 연속 학습
      </h3>

      <div
        style={{
          fontSize: 44,
          fontWeight: 800,
          color: "#ef4444",
        }}
      >
        {streak}일
      </div>

      <div
        style={{
          color: "var(--text-muted)",
          marginTop: 10,
          marginBottom: 18,
        }}
      >
        매일 뉴스를 학습하면 기록이 이어집니다.
      </div>

      <div
        style={{
          width: "100%",
          height: 12,
          borderRadius: 999,
          overflow: "hidden",
          background: "#ececec",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "#ef4444",
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
        목표 30일 · {Math.round(percent)}% 달성
      </div>
    </section>
  );
}

"use client";

interface Props {
  days: boolean[];
}

export default function LearningCalendar({
  days,
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
        📅 이번 달 학습 기록
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 10,
        }}
      >
        {days.map((done, index) => (
          <div
            key={index}
            style={{
              aspectRatio: "1",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              background: done
                ? "var(--primary)"
                : "var(--border)",
              color: done ? "#fff" : "var(--text-muted)",
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </section>
  );
}

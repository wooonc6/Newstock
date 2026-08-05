"use client";

interface Props {
  thisWeek: number;
  lastWeek: number;
}

export default function LearningComparison({
  thisWeek,
  lastWeek,
}: Props) {
  const diff = thisWeek - lastWeek;
  const increased = diff >= 0;

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
        📊 지난주 대비
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            이번 주
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {thisWeek}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            지난 주
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            {lastWeek}
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          padding: 18,
          background: increased
            ? "rgba(34,197,94,.1)"
            : "rgba(239,68,68,.1)",
          color: increased ? "#16a34a" : "#dc2626",
          fontWeight: 700,
        }}
      >
        {increased
          ? `지난주보다 ${diff}개 더 학습했습니다.`
          : `지난주보다 ${Math.abs(diff)}개 적게 학습했습니다.`}
      </div>
    </section>
  );
}

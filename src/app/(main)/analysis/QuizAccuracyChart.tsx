"use client";

interface Props {
  correct: number;
  total: number;
}

export default function QuizAccuracyChart({
  correct,
  total,
}: Props) {
  const accuracy =
    total === 0 ? 0 : Math.round((correct / total) * 100);

  const incorrect = total - correct;

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
          marginBottom: 24,
        }}
      >
        🎯 정답률
      </h3>

      <div
        style={{
          width: "100%",
          height: 18,
          borderRadius: 999,
          overflow: "hidden",
          background: "#ececec",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${accuracy}%`,
            background: "#22c55e",
          }}
        />

        <div
          style={{
            width: `${100 - accuracy}%`,
            background: "#ef4444",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            정답
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#22c55e",
            }}
          >
            {correct}개
          </div>
        </div>

        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            오답
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#ef4444",
            }}
          >
            {incorrect}개
          </div>
        </div>

        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            정답률
          </div>

          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            {accuracy}%
          </div>
        </div>
      </div>
    </section>
  );
}

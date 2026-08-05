"use client";

interface Props {
  totalQuiz: number;
  accuracy: number;
}

export default function QuizLevel({
  totalQuiz,
  accuracy,
}: Props) {
  let level = "새싹";
  let color = "#22c55e";
  let next = "🌿 성장";

  if (totalQuiz >= 20 && accuracy >= 70) {
    level = "성장";
    color = "#3b82f6";
    next = "🌳 전문가";
  }

  if (totalQuiz >= 50 && accuracy >= 80) {
    level = "전문가";
    color = "#8b5cf6";
    next = "👑 마스터";
  }

  if (totalQuiz >= 100 && accuracy >= 90) {
    level = "마스터";
    color = "#f59e0b";
    next = "최고 단계";
  }

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
        🌱 학습 레벨
      </h3>

      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color,
          }}
        >
          {level}
        </div>

        <div
          style={{
            marginTop: 12,
            color: "var(--text-muted)",
          }}
        >
          다음 목표 : {next}
        </div>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              완료 퀴즈
            </div>

            <strong>{totalQuiz}개</strong>
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

            <strong>{accuracy}%</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

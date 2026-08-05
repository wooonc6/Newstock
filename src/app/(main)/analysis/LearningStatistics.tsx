"use client";

interface Props {
  totalQuiz: number;
  correctQuiz: number;
  unlockedCompanies: number;
  totalCompanies: number;
}

export default function LearningStatistics({
  totalQuiz,
  correctQuiz,
  unlockedCompanies,
  totalCompanies,
}: Props) {
  const accuracy =
    totalQuiz === 0
      ? 0
      : Math.round((correctQuiz / totalQuiz) * 100);

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
        📈 학습 통계
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18,
        }}
      >
        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            완료한 퀴즈
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {totalQuiz}
          </div>
        </div>

        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            평균 정답률
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {accuracy}%
          </div>
        </div>

        <div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            기업 잠금 해제
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {unlockedCompanies}/{totalCompanies}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

interface Props {
  totalQuiz: number;
  unlockedCompanies: number;
}

export default function NextGoal({
  totalQuiz,
  unlockedCompanies,
}: Props) {
  const nextQuizGoal = Math.ceil((totalQuiz + 1) / 10) * 10;
  const nextCompanyGoal = Math.ceil((unlockedCompanies + 1) / 5) * 5;

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
        🎯 다음 목표
      </h3>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <strong>뉴스 퀴즈</strong>

          <div
            style={{
              marginTop: 8,
              color: "var(--text-muted)",
            }}
          >
            {nextQuizGoal}개 완료하기
          </div>
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 18,
          }}
        >
          <strong>기업 잠금 해제</strong>

          <div
            style={{
              marginTop: 8,
              color: "var(--text-muted)",
            }}
          >
            {nextCompanyGoal}개 달성하기
          </div>
        </div>
      </div>
    </section>
  );
}

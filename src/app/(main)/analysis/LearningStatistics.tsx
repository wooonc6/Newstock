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
  const wrongQuiz = totalQuiz - correctQuiz;

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
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 24,
        }}
      >
        📊 학습 통계
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18,
        }}
      >
        <StatCard title="완료한 퀴즈" value={`${totalQuiz}개`} />
        <StatCard title="정답" value={`${correctQuiz}개`} />
        <StatCard title="오답" value={`${wrongQuiz}개`} />
        <StatCard title="정답률" value={`${accuracy}%`} />
        <StatCard
          title="잠금 해제"
          value={`${unlockedCompanies}/${totalCompanies}`}
        />
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

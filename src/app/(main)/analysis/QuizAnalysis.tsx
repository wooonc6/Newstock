"use client";

import QuizAccuracyChart from "./QuizAccuracyChart";

interface QuizAnalysisProps {
  totalQuiz: number;
  correctQuiz: number;
  unlockedCompanies: number;
}

export default function QuizAnalysis({
  totalQuiz,
  correctQuiz,
  unlockedCompanies,
}: QuizAnalysisProps) {
  const accuracy =
    totalQuiz === 0
      ? 0
      : Math.round((correctQuiz / totalQuiz) * 100);

  const incorrectQuiz = totalQuiz - correctQuiz;

  const cards = [
    {
      title: "완료한 뉴스 퀴즈",
      value: `${totalQuiz}개`,
    },
    {
      title: "정답",
      value: `${correctQuiz}개`,
    },
    {
      title: "오답",
      value: `${incorrectQuiz}개`,
    },
    {
      title: "정답률",
      value: `${accuracy}%`,
    },
    {
      title: "기업 잠금 해제",
      value: `${unlockedCompanies}개`,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 18,
          background: "var(--surface)",
          padding: 24,
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          📊 퀴즈 분석
        </h2>

        <p
          style={{
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          뉴스 퀴즈 학습 결과와 기업 잠금 해제 진행 상황을 확인하세요.
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--surface)",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <QuizAccuracyChart
        correct={correctQuiz}
        total={totalQuiz}
      />

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
          📚 학습 요약
        </h3>

        <div
          style={{
            lineHeight: 1.9,
            color: "var(--text-muted)",
          }}
        >
          • 완료한 뉴스 퀴즈 {totalQuiz}개
          <br />
          • 정답 {correctQuiz}개 / 오답 {incorrectQuiz}개
          <br />
          • 정답률 {accuracy}%
          <br />
          • 기업 잠금 해제 {unlockedCompanies}개
          <br />
          • 꾸준히 뉴스 퀴즈를 풀어 더 많은 기업의 잠금을 해제해 보세요.
        </div>
      </section>
    </div>
  );
}

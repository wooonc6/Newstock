"use client";

import QuizAccuracyChart from "./QuizAccuracyChart";
import CompanyQuizStats from "./CompanyQuizStats";
import RecentQuizHistory from "./RecentQuizHistory";
import LearningInsight from "./LearningInsight";
import AchievementCards from "./AchievementCards";
import WeeklyProgress from "./WeeklyProgress";

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

      <AchievementCards
        totalQuiz={totalQuiz}
        unlockedCompanies={unlockedCompanies}
        accuracy={accuracy}
      />

      <CompanyQuizStats
        companies={[
          {
            company: "삼성전자",
            completed: 3,
            required: 3,
          },
          {
            company: "SK하이닉스",
            completed: 2,
            required: 3,
          },
          {
            company: "NAVER",
            completed: 1,
            required: 3,
          },
          {
            company: "카카오",
            completed: 0,
            required: 3,
          },
          {
            company: "현대차",
            completed: 3,
            required: 3,
          },
        ]}
      />

      <RecentQuizHistory
        history={[
          {
            company: "삼성전자",
            title: "HBM 공급 확대 뉴스",
            result: "정답",
            date: "오늘",
          },
          {
            company: "SK하이닉스",
            title: "AI 메모리 투자 확대",
            result: "정답",
            date: "어제",
          },
          {
            company: "NAVER",
            title: "클라우드 실적 발표",
            result: "오답",
            date: "2일 전",
          },
          {
            company: "현대차",
            title: "전기차 판매 증가",
            result: "정답",
            date: "3일 전",
          },
          {
            company: "카카오",
            title: "광고 매출 발표",
            result: "오답",
            date: "5일 전",
          },
        ]}
      />

      <LearningInsight
        totalQuiz={totalQuiz}
        correctQuiz={correctQuiz}
        unlockedCompanies={unlockedCompanies}
      />

      <WeeklyProgress
        monday={4}
        tuesday={2}
        wednesday={6}
        thursday={5}
        friday={7}
        saturday={3}
        sunday={4}
      />
    </div>
  );
}

"use client";

import LearningStatistics from "./LearningStatistics";
import LearningSummary from "./LearningSummary";
import QuizLevel from "./QuizLevel";
import QuizAccuracyChart from "./QuizAccuracyChart";
import NewsUnderstandingScore from "./NewsUnderstandingScore";
import InvestmentReadiness from "./InvestmentReadiness";
import CompanyQuizStats from "./CompanyQuizStats";
import QuizCompletionRate from "./QuizCompletionRate";
import StudyConsistency from "./StudyConsistency";
import RecentQuizHistory from "./RecentQuizHistory";
import StudyRecommendation from "./StudyRecommendation";

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
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          📊 퀴즈 분석
        </h2>

        <p
          style={{
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          뉴스 학습 성과와 투자 준비도를 확인해보세요.
        </p>
      </section>

      <LearningStatistics
        totalQuiz={totalQuiz}
        correctQuiz={correctQuiz}
        unlockedCompanies={unlockedCompanies}
        totalCompanies={20}
      />

      <LearningSummary
        totalQuiz={totalQuiz}
        accuracy={accuracy}
        unlockedCompanies={unlockedCompanies}
        streak={12}
      />

      <QuizLevel
        totalQuiz={totalQuiz}
        accuracy={accuracy}
      />

      <QuizAccuracyChart
        correct={correctQuiz}
        total={totalQuiz}
      />

      <NewsUnderstandingScore
        score={accuracy}
      />

      <InvestmentReadiness
        score={accuracy}
      />

      <QuizCompletionRate
        completed={totalQuiz}
        total={30}
      />

      <StudyConsistency
        currentStreak={12}
        bestStreak={27}
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
        ]}
      />

      <StudyRecommendation
        accuracy={accuracy}
        streak={12}
        unlockedCompanies={unlockedCompanies}
      />
    </div>
  );
}

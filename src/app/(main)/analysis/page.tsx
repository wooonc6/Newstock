import AnalysisTabs from "@/components/analysis/AnalysisTabs";
import GrowthReport from "@/components/analysis/GrowthReport";
import QuizAnalysis from "@/components/analysis/QuizAnalysis";

import HistoryPage from "../history/page";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ recordTicker?: string }>;
}) {
  const { recordTicker } = await searchParams;

  // TODO: Supabase 연결 후 실제 데이터로 교체
  const totalQuiz = 0;
  const correctQuiz = 0;
  const unlockedCompanies = 0;

  return (
    <AnalysisTabs
      growth={<GrowthReport />}
      quiz={
        <QuizAnalysis
          totalQuiz={totalQuiz}
          correctQuiz={correctQuiz}
          unlockedCompanies={unlockedCompanies}
        />
      }
      history={<HistoryPage selectedTicker={recordTicker} />}
    />
  );
}

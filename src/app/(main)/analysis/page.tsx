import AnalysisTabs from "@/components/analysis/AnalysisTabs";
import GrowthReport from "@/components/analysis/GrowthReport";
import QuizAnalysis from "@/components/analysis/QuizAnalysis";

import { createClient } from "@/lib/supabase/server";

import HistoryPage from "../history/page";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ recordTicker?: string }>;
}) {
  const { recordTicker } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let totalQuiz = 0;
  let correctQuiz = 0;
  let unlockedCompanies = 0;

  if (user) {
    const { data: quizData } = await supabase
      .from("quiz_sessions")
      .select("is_correct, stock_ticker")
      .eq("user_id", user.id);

    totalQuiz = quizData?.length ?? 0;

    correctQuiz =
      quizData?.filter((q) => q.is_correct).length ?? 0;

    unlockedCompanies = new Set(
      quizData
        ?.filter((q) => q.is_correct)
        .map((q) => q.stock_ticker)
    ).size;
  }

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

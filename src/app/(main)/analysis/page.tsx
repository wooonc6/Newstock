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

  return (
    <AnalysisTabs
      growth={<GrowthReport />}
      quiz={<QuizAnalysis />}
      history={<HistoryPage selectedTicker={recordTicker} />}
    />
  );
}

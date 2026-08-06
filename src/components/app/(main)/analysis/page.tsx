import AnalysisTabs from "@/components/analysis/AnalysisTabs";
import InvestmentPerformance from "./InvestmentPerformance";
import QuizAnalysis from "./QuizAnalysis";

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
      growth={<InvestmentPerformance />}
      quiz={<QuizAnalysis />}
      history={<HistoryPage selectedTicker={recordTicker} />}
    />
  );
}

import AnalysisTabs from "@/components/analysis/AnalysisTabs";
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
      quiz={<QuizAnalysis />}
      history={<HistoryPage selectedTicker={recordTicker} />}
    />
  );
}

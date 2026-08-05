import StatsPage from "../stats/page";
import HistoryPage from "../history/page";

import AnalysisTabs from "@/components/analysis/AnalysisTabs";
import GrowthReport from "@/components/analysis/GrowthReport";

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
      quiz={<StatsPage />}
      history={<HistoryPage selectedTicker={recordTicker} />}
    />
  );
}

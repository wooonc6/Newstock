import StatsPage from "../stats/page";
import HistoryPage from "../history/page";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  return (
    <div style={{ display: "grid", gap: "28px" }}>
      <StatsPage />
      <HistoryPage />
    </div>
  );
}

import AnalysisTabs from "./AnalysisTabs";
import GrowthReport from "./GrowthReport";

import StatsPage from "../stats/page";
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
      quiz={
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "18px",
            background: "var(--surface)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-muted)",
                marginBottom: "5px",
              }}
            >
              ANALYSIS
            </div>

            <h2
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--text)",
              }}
            >
              📊 퀴즈 분석
            </h2>
          </div>

          <StatsPage />
        </section>
      }
      history={
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "18px",
            background: "var(--surface)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-muted)",
                marginBottom: "5px",
              }}
            >
              HISTORY
            </div>

            <h2
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "var(--text)",
              }}
            >
              🗂️ 학습 기록
            </h2>
          </div>

          <HistoryPage selectedTicker={recordTicker} />
        </section>
      }
    />
  );
}

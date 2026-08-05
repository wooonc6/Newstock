import StatsPage from "../stats/page";
import HistoryPage from "../history/page";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  return (
    <div style={{ display: "grid", gap: "28px" }}>
      <section style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", background: "var(--surface)" }}>
        <StatsPage />
      </section>
      <section style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", background: "var(--surface)" }}>
        <HistoryPage />
      </section>
    </div>
  );
}

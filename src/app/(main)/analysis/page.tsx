import StatsPage from "../stats/page";
import HistoryPage from "../history/page";

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ searchParams }: { searchParams: Promise<{ recordTicker?: string }> }) {
  const { recordTicker } = await searchParams;
  return (
    <div style={{ display: "grid", gap: "28px" }}>
      <section style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", background: "var(--surface)" }}>
        <div style={{ marginBottom: "14px", fontSize: "12px", fontWeight: 800, color: "var(--accent)" }}>📊 퀴즈 분석</div>
        <StatsPage />
      </section>
      <section style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", background: "var(--surface)" }}>
        <div style={{ marginBottom: "14px", fontSize: "12px", fontWeight: 800, color: "var(--accent2)" }}>🗂️ 학습 기록</div>
        <HistoryPage selectedTicker={recordTicker} />
      </section>
    </div>
  );
}

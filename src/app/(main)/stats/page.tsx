export default function StatsPage() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "44px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>📊</div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>분석</div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
        정답률, 취약 분야, 성장 그래프가 여기에 표시됩니다.
        <br />
        DB 연동 후 활성화됩니다.
      </div>
    </div>
  );
}

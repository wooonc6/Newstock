export default function HistoryPage() {
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
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>📋</div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>퀴즈 기록</div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
        풀었던 퀴즈의 결과와 정답 이력이 여기에 표시됩니다.
        <br />
        DB 연동 후 활성화됩니다.
      </div>
    </div>
  );
}

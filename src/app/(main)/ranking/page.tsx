export default function RankingPage() {
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
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>🏆</div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>랭킹</div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
        전체 사용자 코인 순위가 여기에 표시됩니다.
        <br />
        feat/ranking-ui 브랜치에서 구현 예정입니다.
      </div>
    </div>
  );
}

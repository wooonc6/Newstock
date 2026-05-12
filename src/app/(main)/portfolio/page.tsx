export default function PortfolioPage() {
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
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>📈</div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>모의투자</div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
        퀴즈를 완료하면 코인으로 모의 주식을 살 수 있어요.
        <br />
        거래 기능은 feat/trade-logic 브랜치에서 구현 예정입니다.
      </div>
    </div>
  );
}

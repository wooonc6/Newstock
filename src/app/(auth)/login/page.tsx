export default function LoginPage() {
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          padding: "40px 36px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "22px", fontWeight: 700, color: "var(--accent)", marginBottom: "4px" }}>
          Newstock
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" }}>
          뉴스로 배우는 투자 교육 플랫폼
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>
          인증 기능 구현 중입니다. (feat/auth-flow)
        </p>
      </div>
    </div>
  );
}

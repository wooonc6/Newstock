export default function Footer() {
  return (
    <footer
      style={{
        marginTop: "36px",
        padding: "20px 0 6px",
        borderTop: "1px solid var(--border)",
        color: "var(--text-muted)",
        fontSize: "12px",
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-dim)" }}>문의 및 오류 제보</div>
          <div>서비스 이용 중 불편한 점이나 개선 의견을 보내주세요.</div>
        </div>
        <a
          href="mailto:hanadreamers.newstock@gmail.com"
          style={{
            color: "var(--accent2)",
            fontWeight: 700,
            textDecoration: "none",
            wordBreak: "break-all",
          }}
        >
          hanadreamers.newstock@gmail.com
        </a>
      </div>
    </footer>
  );
}

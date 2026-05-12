import Link from "next/link";
import { STOCKS, SECTOR_BADGE_CLASSES } from "@/lib/stocks";

export default function DashboardPage() {
  return (
    <div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "10px",
        }}
      >
        종목별 퀴즈
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "18px" }}>
        종목을 선택하고 관련 뉴스 퀴즈를 풀어 주식 감각을 키우세요.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {STOCKS.map((stock) => (
          <Link
            key={stock.ticker}
            href={`/quiz/${encodeURIComponent(stock.ticker)}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                    {stock.name}
                  </span>
                  <span
                    style={{ padding: "3px 9px", borderRadius: "100px", fontSize: "10px", fontWeight: 700 }}
                    className={SECTOR_BADGE_CLASSES[stock.sectorColor]}
                  >
                    {stock.sector}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "4px" }}>
                  {stock.description}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  {stock.ticker} · 시총 {stock.marketCap}
                </div>
              </div>
              <div style={{ fontSize: "20px", color: "var(--text-muted)", flexShrink: 0 }}>→</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

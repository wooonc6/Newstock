"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TrendingStockItem } from "@/types";
import MarketMap from "@/components/dashboard/MarketMap";

export default function DashboardClient() {
  const [recommendedStocks, setRecommendedStocks] = useState<TrendingStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news/market-feed")
      .then((response) => {
        if (!response.ok) throw new Error("시장 뉴스 집계 요청 실패");
        return response.json();
      })
      .then((data) => {
        setRecommendedStocks(Array.isArray(data?.trending) ? data.trending : []);
      })
      .catch(() => {
        setRecommendedStocks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <section
        id="trending-stocks"
        className="mobile-section"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
        }}
      >
        <SectionTitle title="🔥 최근 24시간 많이 언급된 종목" sub="중복 기사를 제외한 종목별 뉴스 언급량입니다" />
        {loading && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>언급량을 집계하는 중...</div>}
        {!loading && recommendedStocks.length === 0 && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>최근 24시간에 집계된 종목 뉴스가 없습니다.</div>
        )}
        <div className="dashboard-trending-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
          {recommendedStocks.map((stock, index) => (
            <Link
              key={stock.ticker}
              href={`/stocks/${encodeURIComponent(stock.ticker)}`}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "13px",
                color: "var(--text)",
                textDecoration: "none",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>{index + 1}</span>
                <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {stock.name}
                </div>
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-dim)" }}>
                뉴스 {stock.count}건 · 이전 24시간보다 {stock.change >= 0 ? "+" : ""}{stock.change}건
              </div>
            </Link>
          ))}
        </div>
      </section>

      <MarketMap />
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.4, color: "var(--text)" }}>{title}</div>
      <div style={{ marginTop: "4px", fontSize: "12px", lineHeight: 1.55, color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

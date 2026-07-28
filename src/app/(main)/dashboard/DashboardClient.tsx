"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STOCKS } from "@/lib/stocks";
import type { NewsItem } from "@/types";
import MarketMap from "@/components/dashboard/MarketMap";

export default function DashboardClient() {
  const [newsCounts, setNewsCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/learning/news?limit=100")
      .then((r) => (r.ok ? r.json() : []))
      .then((items: NewsItem[]) => {
        const counts: Record<string, number> = {};
        for (const item of Array.isArray(items) ? items : []) {
          counts[item.ticker] = (counts[item.ticker] ?? 0) + 1;
        }
        setNewsCounts(counts);
      })
      .catch(() => {
        setNewsCounts({});
      });
  }, []);

  const recommendedStocks = useMemo(() => {
    return [...STOCKS]
      .sort((a, b) => (newsCounts[b.ticker] ?? 0) - (newsCounts[a.ticker] ?? 0))
      .slice(0, 3);
  }, [newsCounts]);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
        }}
      >
        <SectionTitle title="🔥 오늘 많이 언급된 종목" sub="뉴스 수가 많은 종목부터 보여줍니다" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
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
                관련 뉴스 {newsCounts[stock.ticker] ?? 0}개
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
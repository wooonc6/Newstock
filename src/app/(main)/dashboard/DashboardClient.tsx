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
          background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
          border: "1px solid rgba(148, 163, 184, 0.24)",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.2)",
        }}
      >
        <SectionTitle title="오늘 많이 언급된 종목" sub="뉴스 수가 많은 종목부터 보여줍니다" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
          {recommendedStocks.map((stock, index) => (
            <Link
              key={stock.ticker}
              href={`/stocks/${encodeURIComponent(stock.ticker)}`}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "10px",
                padding: "13px",
                color: "#f8fafc",
                textDecoration: "none",
                minWidth: 0,
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>{index + 1}</span>
                <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {stock.name}
                </div>
              </div>
              <div style={{ marginTop: "6px", fontSize: "11px", color: "#cbd5e1" }}>
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
      <div style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1.4, color: "#f8fafc" }}>{title}</div>
      <div style={{ marginTop: "4px", fontSize: "12px", lineHeight: 1.55, color: "#94a3b8" }}>{sub}</div>
    </div>
  );
}

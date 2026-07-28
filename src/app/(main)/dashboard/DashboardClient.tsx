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
      <MarketMap />

      <section>
        <SectionTitle title="오늘 많이 언급된 종목" sub="뉴스 수가 많은 종목부터 보여줍니다" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {recommendedStocks.map((stock) => (
            <Link
              key={stock.ticker}
              href={`/stocks/${encodeURIComponent(stock.ticker)}`}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{stock.name}</div>
              <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                관련 뉴스 {newsCounts[stock.ticker] ?? 0}개
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "15px", fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: "3px", fontSize: "12px", color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

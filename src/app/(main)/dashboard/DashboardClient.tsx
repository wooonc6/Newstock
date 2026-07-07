"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { STOCKS } from "@/lib/stocks";
import type { NewsItem } from "@/types";
import MarketMap from "@/components/dashboard/MarketMap";

export default function DashboardClient() {
  const { user } = useAuth();
  const { unlockMap, loading } = useQuizUnlock(user?.id);
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

  const unlockedCount = Object.values(unlockMap).filter((s) => s.unlocked).length;
  const completedTotal = Object.values(unlockMap).reduce((sum, item) => sum + item.quizzes_completed, 0);

  const recommendedStocks = useMemo(() => {
    return [...STOCKS]
      .sort((a, b) => (newsCounts[b.ticker] ?? 0) - (newsCounts[a.ticker] ?? 0))
      .slice(0, 3);
  }, [newsCounts]);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <MarketMap />

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
          display: "grid",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "5px" }}>
            시장 요약
          </div>
          <h1 style={{ fontSize: "20px", lineHeight: 1.35 }}>시장 흐름을 보고, 퀴즈 탭에서 종목 학습을 시작하세요</h1>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          <Metric label="학습 종목" value={`${STOCKS.length}개`} />
          <Metric label="투자 해제" value={loading ? "..." : `${unlockedCount}개`} />
          <Metric label="완료 퀴즈" value={`${completedTotal}개`} />
        </div>
      </section>

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

      <Link
        href="/quiz"
        style={{
          display: "inline-flex",
          justifyContent: "center",
          padding: "13px 16px",
          borderRadius: "8px",
          background: "var(--accent2)",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 800,
          textDecoration: "none",
        }}
      >
        퀴즈 탭에서 종목 학습하기
      </Link>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "12px" }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "16px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

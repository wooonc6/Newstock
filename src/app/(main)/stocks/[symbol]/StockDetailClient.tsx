"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NewsItem, Stock } from "@/types";
import { useStockPrice } from "@/hooks/useStockPrice";

interface Props {
  stock: Stock;
}

function formatPrice(price: number | null | undefined) {
  if (price == null) return "-";
  return Math.round(price).toLocaleString();
}

export default function StockDetailClient({ stock }: Props) {
  const { data: quote, loading: quoteLoading } = useStockPrice(stock.ticker);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    setNewsLoading(true);
    fetch(`/api/learning/news?ticker=${encodeURIComponent(stock.ticker)}&limit=5`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items: NewsItem[]) => setNews(Array.isArray(items) ? items : []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [stock.ticker]);

  const firstNewsId = news[0]?.id;
  const quizHref = firstNewsId
    ? `/quiz/${encodeURIComponent(stock.ticker)}?newsId=${encodeURIComponent(firstNewsId)}`
    : `/quiz/${encodeURIComponent(stock.ticker)}`;

  const changePercent = quote?.changePercent ?? 0;
  const isUp = changePercent >= 0;

  const latestQuizLabel = useMemo(() => {
    if (news.length === 0) return "등록된 뉴스가 생기면 퀴즈가 열립니다";
    return `${news[0].news_date} 뉴스 기반 퀴즈`;
  }, [news]);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <Link href="/dashboard" style={{ fontSize: "12px", color: "var(--text-muted)", textDecoration: "none" }}>
        ← 대시보드
      </Link>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "20px",
          display: "grid",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>{stock.sector}</div>
            <h1 style={{ fontSize: "24px", lineHeight: 1.25 }}>{stock.name}</h1>
            <div style={{ marginTop: "6px", fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "var(--text-muted)" }}>
              {stock.ticker}
            </div>
          </div>
          <div style={{ textAlign: "right", minWidth: "164px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "baseline",
                gap: "3px",
                minHeight: "34px",
                fontFamily: "var(--font-ui)",
                whiteSpace: "nowrap",
              }}
            >
              {!quoteLoading && (
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "var(--text)",
                    lineHeight: 1,
                  }}
                >
                  ₩
                </span>
              )}
              <span
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.08,
                  color: "var(--text)",
                }}
              >
                {quoteLoading ? "..." : formatPrice(quote?.price)}
              </span>
            </div>
            {!quoteLoading && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "7px",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background: isUp ? "rgba(239, 68, 68, 0.08)" : "rgba(37, 99, 235, 0.08)",
                  color: isUp ? "var(--danger)" : "#2563eb",
                  fontFamily: "var(--font-ui)",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: "9px", lineHeight: 1 }}>{isUp ? "▲" : "▼"}</span>
                <span>{`${Math.abs(changePercent).toFixed(2)}%`}</span>
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--text-dim)" }}>{stock.description}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          <MiniMetric label="관련 뉴스" value={`${news.length}개`} />
          <MiniMetric label="최근 퀴즈" value={latestQuizLabel} />
          <MiniMetric label="학습 목적" value="뉴스 이후 주가 흐름 이해" />
        </div>

        <Link
          href={quizHref}
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
          이 종목으로 퀴즈 풀기
        </Link>
      </section>

      <section>
        <div style={{ marginBottom: "10px" }}>
          <h2 style={{ fontSize: "16px" }}>관련 뉴스</h2>
          <div style={{ marginTop: "3px", fontSize: "12px", color: "var(--text-muted)" }}>
            이 종목이 왜 이슈인지 먼저 확인합니다
          </div>
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          {newsLoading ? (
            <NewsShell>뉴스를 불러오는 중입니다.</NewsShell>
          ) : news.length === 0 ? (
            <NewsShell>아직 이 종목에 연결된 뉴스가 없습니다.</NewsShell>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "14px",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                  {item.news_date} · {item.category} · {item.difficulty}
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, lineHeight: 1.5 }}>{item.title}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "12px", minWidth: 0 }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px" }}>{label}</div>
      <div style={{ fontSize: "12px", fontWeight: 800, lineHeight: 1.35 }}>{value}</div>
    </div>
  );
}

function NewsShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "16px",
        fontSize: "13px",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

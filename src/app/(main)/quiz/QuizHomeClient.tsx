"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { SECTOR_BADGE_STYLES, STOCKS } from "@/lib/stocks";
import type { LatestNewsItem, NewsItem } from "@/types";

export default function QuizHomeClient() {
  const { user } = useAuth();
  const { unlockMap } = useQuizUnlock(user?.id);

  const [newsCounts, setNewsCounts] = useState<Record<string, number>>({});
  const [latestNews, setLatestNews] = useState<LatestNewsItem[]>([]);
  const [fallbackNews, setFallbackNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizNewsError, setQuizNewsError] = useState<string | null>(null);
  const [latestNewsError, setLatestNewsError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const sectorGroups = useMemo(() => {
    const groups = new Map<string, typeof STOCKS>();

    for (const stock of STOCKS) {
      const current = groups.get(stock.sector) ?? [];
      current.push(stock);
      groups.set(stock.sector, current);
    }

    return Array.from(groups.entries());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchQuizNews(): Promise<NewsItem[]> {
      const response = await fetch("/api/learning/news?limit=100", {
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? `퀴즈용 뉴스 요청에 실패했습니다. (${response.status})`);
      }

      const data = await response.json();
      return Array.isArray(data)
        ? data
        : Array.isArray(data?.news)
          ? data.news
          : [];
    }

    async function fetchLatestNews(): Promise<LatestNewsItem[]> {
      const query = encodeURIComponent("주식 증시 기업");
      const response = await fetch(`/api/news?query=${query}&display=6`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? `최신 뉴스 요청에 실패했습니다. (${response.status})`);
      }

      const data = await response.json();
      return Array.isArray(data?.items) ? data.items : [];
    }

    async function fetchNews() {
      setLoading(true);
      setQuizNewsError(null);
      setLatestNewsError(null);

      const [quizNewsResult, latestNewsResult] = await Promise.allSettled([
        fetchQuizNews(),
        fetchLatestNews(),
      ]);

      if (controller.signal.aborted) return;

      if (quizNewsResult.status === "fulfilled") {
        const items = quizNewsResult.value;

        const counts: Record<string, number> = {};
        for (const item of items) {
          if (!item.ticker) continue;
          counts[item.ticker] = (counts[item.ticker] ?? 0) + 1;
        }

        setNewsCounts(counts);
        setFallbackNews(items.slice(0, 3));
      } else {
        console.error("퀴즈용 뉴스 목록 요청 실패:", quizNewsResult.reason);
        setNewsCounts({});
        setFallbackNews([]);
        setQuizNewsError(getErrorMessage(quizNewsResult.reason, "퀴즈용 뉴스를 불러오지 못했습니다."));
      }

      if (latestNewsResult.status === "fulfilled") {
        setLatestNews(latestNewsResult.value);
      } else {
        console.error("최신 뉴스 목록 요청 실패:", latestNewsResult.reason);
        setLatestNews([]);
        setLatestNewsError(getErrorMessage(latestNewsResult.reason, "최신 뉴스를 불러오지 못했습니다."));
      }

      setLoading(false);
    }

    void fetchNews();

    return () => controller.abort();
  }, [reloadVersion]);

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
          display: "grid",
          gap: "8px",
        }}
      >
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>
          QUIZ
        </div>
        <h1 style={{ fontSize: "20px", lineHeight: 1.35 }}>
          뉴스를 읽고 종목 퀴즈를 풀어보세요
        </h1>
        <p style={{ fontSize: "12px", lineHeight: 1.6, color: "var(--text-dim)" }}>
          관심 산업군을 열어 기업을 비교하고, 관련 뉴스 퀴즈로 주가 흐름을 학습해보세요.
        </p>
      </section>

      <section style={{ display: "grid", gap: "9px" }}>
        <SectionTitle title="🏢 종목 선택" sub="산업군을 열고 퀴즈를 풀 종목을 골라보세요" />
        {!loading && quizNewsError && (
          <ErrorText>
            <div>종목별 뉴스 개수를 불러오지 못했습니다.</div>
            <RetryButton onClick={() => setReloadVersion((version) => version + 1)} />
          </ErrorText>
        )}
        {sectorGroups.map(([sector, stocks], groupIndex) => {
          const totalNews = stocks.reduce((sum, stock) => sum + (newsCounts[stock.ticker] ?? 0), 0);
          const colorStyle = SECTOR_BADGE_STYLES[stocks[0].sectorColor];

          return (
            <details
              key={sector}
              open={groupIndex === 0}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(20, 30, 50, 0.035)",
              }}
            >
              <summary
                style={{
                  listStyle: "none",
                  cursor: "pointer",
                  padding: "14px 15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: colorStyle.color,
                      flex: "0 0 auto",
                    }}
                  />
                  <strong style={{ fontSize: "14px" }}>{sector}</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {stocks.length}개 기업
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  뉴스 {totalNews}개 · 펼치기
                </span>
              </summary>

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  padding: "10px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "8px",
                  background: "var(--surface2)",
                }}
              >
                {stocks.map((stock) => {
                  const status = unlockMap[stock.ticker] ?? {
                    ticker: stock.ticker,
                    unlocked: false,
                    quizzes_completed: 0,
                    quizzes_required: 3,
                  };
                  const remaining = Math.max(status.quizzes_required - status.quizzes_completed, 0);

                  return (
                    <article
                      key={stock.ticker}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "9px",
                        padding: "12px",
                        display: "grid",
                        gap: "9px",
                      }}
                    >
                      <Link
                        href={`/stocks/${encodeURIComponent(stock.ticker)}`}
                        style={{ color: "inherit", textDecoration: "none", minWidth: 0 }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: "14px", lineHeight: 1.35 }}>{stock.name}</strong>
                            <div style={{ marginTop: "3px", fontSize: "10px", color: "var(--text-muted)" }}>
                              {stock.ticker}
                            </div>
                          </div>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            뉴스 {newsCounts[stock.ticker] ?? 0}
                          </span>
                        </div>
                        <p
                          style={{
                            marginTop: "8px",
                            fontSize: "11px",
                            lineHeight: 1.55,
                            color: "var(--text-dim)",
                          }}
                        >
                          {stock.description}
                        </p>
                      </Link>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: status.unlocked ? "var(--accent)" : "var(--text-muted)" }}>
                          {status.unlocked
                            ? "✅ 모의 투자 가능"
                            : `${remaining}개 더 풀면 투자 해제`}
                        </span>
                        <Link
                          href={`/quiz/${encodeURIComponent(stock.ticker)}`}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "7px",
                            background: "var(--accent2)",
                            color: "#fff",
                            fontSize: "11px",
                            fontWeight: 700,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          🎯 퀴즈 시작
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </details>
          );
        })}
      </section>

      <section>
        <SectionTitle title="📰 최근 읽을 뉴스" sub="현재 시장의 최신 기사를 확인해보세요" />

        {loading && <EmptyText>뉴스를 불러오는 중...</EmptyText>}

        {!loading && latestNewsError && (
          <ErrorText>
            <div>실시간 최신 뉴스를 불러오지 못해 퀴즈용 뉴스를 대신 보여드립니다.</div>
            <RetryButton onClick={() => setReloadVersion((version) => version + 1)} />
          </ErrorText>
        )}

        {!loading && latestNews.length > 0 && (
          <div style={{ display: "grid", gap: "8px" }}>
            {latestNews.map((news) => (
              <a
                key={`${news.link}-${news.pubDate}`}
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "inherit",
                  textDecoration: "none",
                  display: "grid",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{news.tag}</span>
                  <span>{news.ago}</span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.45 }}>{news.title}</div>
                {news.description && (
                  <p
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.55,
                      color: "var(--text-dim)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {news.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        )}

        {!loading && latestNews.length === 0 && fallbackNews.length > 0 && (
          <div style={{ display: "grid", gap: "8px", marginTop: latestNewsError ? "8px" : 0 }}>
            {!latestNewsError && <EmptyText>퀴즈에 등록된 최근 뉴스를 표시하고 있습니다.</EmptyText>}
            {fallbackNews.map((news) => (
              <div
                key={news.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>
                  {news.company} · {news.news_date}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.45 }}>{news.title}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && !latestNewsError && latestNews.length === 0 && fallbackNews.length === 0 && (
          <EmptyText>표시할 뉴스가 아직 없습니다.</EmptyText>
        )}
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

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "14px",
        fontSize: "12px",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        borderRadius: "8px",
        padding: "14px",
        fontSize: "12px",
        color: "#be123c",
      }}
    >
      {children}
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: "9px",
        border: "1px solid currentColor",
        borderRadius: "6px",
        padding: "5px 8px",
        background: "transparent",
        color: "inherit",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      다시 불러오기
    </button>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

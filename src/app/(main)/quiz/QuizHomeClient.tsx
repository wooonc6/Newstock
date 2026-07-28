"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { STOCKS } from "@/lib/stocks";
import type { NewsItem } from "@/types";
import StockQuizCard from "@/components/quiz/StockQuizCard";

export default function QuizHomeClient() {
  const { user } = useAuth();
  const { unlockMap } = useQuizUnlock(user?.id);

  const [newsCounts, setNewsCounts] = useState<Record<string, number>>({});
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/learning/news?limit=100");

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.error ??
              `뉴스 요청에 실패했습니다. (${response.status})`
          );
        }

        const data = await response.json();
        const items: NewsItem[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.news)
            ? data.news
            : [];

        const counts: Record<string, number> = {};

        for (const item of items) {
          if (!item.ticker) continue;

          counts[item.ticker] = (counts[item.ticker] ?? 0) + 1;
        }

        setNewsCounts(counts);
        setRecentNews(items.slice(0, 3));
      } catch (err) {
        console.error("뉴스 목록 요청 실패:", err);

        setNewsCounts({});
        setRecentNews([]);
        setError(
          err instanceof Error
            ? err.message
            : "뉴스를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

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
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            fontWeight: 700,
          }}
        >
          QUIZ
        </div>

        <h1
          style={{
            fontSize: "20px",
            lineHeight: 1.35,
          }}
        >
          뉴스를 읽고 종목 퀴즈를 풀어보세요
        </h1>

        <p
          style={{
            fontSize: "12px",
            lineHeight: 1.6,
            color: "var(--text-dim)",
          }}
        >
          종목 카드를 눌러 관련 뉴스와 주가 흐름을 확인하고, 퀴즈를
          풀면 모의 투자 종목을 해제할 수 있습니다.
        </p>
      </section>

      <section>
        <SectionTitle
          title="오늘 학습 추천 종목"
          sub="카드를 누르면 종목 상세로 이동합니다"
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {STOCKS.map((stock) => {
            const status = unlockMap[stock.ticker] ?? {
              ticker: stock.ticker,
              unlocked: false,
              quizzes_completed: 0,
              quizzes_required: 3,
            };

            return (
              <StockQuizCard
                key={stock.ticker}
                stock={stock}
                status={status}
                newsCount={newsCounts[stock.ticker] ?? 0}
              />
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          title="최근 읽을 뉴스"
          sub="종목 상세와 퀴즈의 출발점입니다"
        />

        {loading && (
          <EmptyText>뉴스를 불러오는 중...</EmptyText>
        )}

        {!loading && error && (
          <ErrorText>{error}</ErrorText>
        )}

        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gap: "8px",
            }}
          >
            {recentNews.length === 0 ? (
              <EmptyText>
                curated_news에 등록된 뉴스가 있으면 여기에 표시됩니다.
              </EmptyText>
            ) : (
              recentNews.map((news) => (
                <div
                  key={news.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "5px",
                    }}
                  >
                    {news.company} · {news.news_date}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      lineHeight: 1.45,
                    }}
                  >
                    {news.title}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({
  title,
  sub,
}: {
  title: string;
  sub: string;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "3px",
          fontSize: "12px",
          color: "var(--text-muted)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function EmptyText({
  children,
}: {
  children: React.ReactNode;
}) {
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

function ErrorText({
  children,
}: {
  children: React.ReactNode;
}) {
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

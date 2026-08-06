"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { SECTOR_BADGE_STYLES, STOCKS } from "@/lib/stocks";

import type { LatestNewsItem } from "@/types";

type QuizNewsSummary = {
  counts: Record<string, number>;
};

export default function QuizHomeClient() {
  const { user } = useAuth();

  const { unlockMap } = useQuizUnlock(user?.id);

  const [newsCounts, setNewsCounts] =
    useState<Record<string, number>>({});

  const [latestNews, setLatestNews] =
    useState<LatestNewsItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [quizNewsError, setQuizNewsError] =
    useState<string | null>(null);

  const [latestNewsError, setLatestNewsError] =
    useState<string | null>(null);

  const [reloadVersion, setReloadVersion] =
    useState(0);

  const reload = () => {
    setReloadVersion((v) => v + 1);
  };

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

    async function fetchQuizNews(): Promise<QuizNewsSummary> {
      const response = await fetch(
        "/api/learning/news?summary=1",
        {
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.error ??
            `퀴즈 뉴스 요청 실패 (${response.status})`
        );
      }

      const data = await response.json();

      return {
        counts:
          data?.counts &&
          typeof data.counts === "object"
            ? data.counts
            : {},
      };
    }

    async function fetchLatestNews(): Promise<
      LatestNewsItem[]
    > {
      const response = await fetch(
        "/api/news/market-feed",
        {
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.error ??
            `최신 뉴스 요청 실패 (${response.status})`
        );
      }

      const data = await response.json();

      return Array.isArray(data?.articles)
        ? data.articles
        : [];
    }

    async function fetchNews() {
      setLoading(true);

      setQuizNewsError(null);
      setLatestNewsError(null);

      const [quizNewsResult, latestNewsResult] =
        await Promise.allSettled([
          fetchQuizNews(),
          fetchLatestNews(),
        ]);

      if (controller.signal.aborted) return;

      if (quizNewsResult.status === "fulfilled") {
        setNewsCounts(quizNewsResult.value.counts);
      } else {
        console.error(quizNewsResult.reason);

        setNewsCounts({});
        setQuizNewsError(
          getErrorMessage(
            quizNewsResult.reason,
            "퀴즈 뉴스를 불러오지 못했습니다."
          )
        );
      }

      if (latestNewsResult.status === "fulfilled") {
        setLatestNews(latestNewsResult.value);
      } else {
        console.error(latestNewsResult.reason);

        setLatestNews([]);
        setLatestNewsError(
          getErrorMessage(
            latestNewsResult.reason,
            "최신 뉴스를 불러오지 못했습니다."
          )
        );
      }

      setLoading(false);
    }

    void fetchNews();

    return () => controller.abort();
  }, [reloadVersion]);

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
      }}
    >
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
          🧠 뉴스를 읽고 종목 퀴즈를 풀어보세요
        </h1>

        <p
          style={{
            fontSize: "12px",
            lineHeight: 1.6,
            color: "var(--text-dim)",
          }}
        >
          관심 산업군을 열어 기업을 비교하고,
          관련 뉴스 퀴즈로 주가 흐름을
          학습해보세요.
        </p>
      </section>

      <LatestNewsSection
        loading={loading}
        latestNews={latestNews}
        error={latestNewsError}
        onRetry={reload}
      />

      <section
        style={{
          display: "grid",
          gap: "9px",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "16px",
          background:
            "color-mix(in srgb, var(--surface) 72%, transparent)",
        }}
      >
        <SectionTitle
          title="🏢 종목 선택"
          sub="산업군을 열고 퀴즈를 풀 종목을 골라보세요"
        />

        {!loading && quizNewsError && (
          <ErrorText>
            <div>
              종목별 뉴스 개수를
              불러오지 못했습니다.
            </div>

            <RetryButton
              onClick={reload}
            />
          </ErrorText>
        )}

        {loading ? (
          <EmptyText>
            퀴즈 목록을 불러오는 중...
          </EmptyText>
        ) : (
          sectorGroups.map(([sector, stocks]) => {
            const totalNews = stocks.reduce(
              (sum, stock) =>
                sum +
                (newsCounts[stock.ticker] ?? 0),
              0
            );

            const colorStyle =
              SECTOR_BADGE_STYLES[
                stocks[0].sectorColor
              ];

            return (
              <details
                key={sector}
                style={{
                  background:
                    "var(--surface)",
                  border:
                    "1px solid var(--border)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow:
                    "0 2px 8px rgba(20,30,50,.035)",
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "999px",
                        background: colorStyle.color,
                        flex: "0 0 auto",
                      }}
                    />

                    <strong
                      style={{
                        fontSize: "14px",
                      }}
                    >
                      {sector}
                    </strong>

                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {stocks.length}개 기업
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    뉴스 {totalNews}개
                  </span>
                </summary>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    padding: "10px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(220px,1fr))",
                    gap: "8px",
                    background: "var(--surface2)",
                  }}
                >
                  {stocks.map((stock) => {
                    const status =
                      unlockMap[stock.ticker] ?? {
                        ticker: stock.ticker,
                        unlocked: false,
                        quizzes_completed: 0,
                        quizzes_required: 3,
                      };

                    const newsCount =
                      newsCounts[stock.ticker] ?? 0;

                    const disabled =
                      newsCount === 0;

                    const remaining = Math.max(
                      status.quizzes_required -
                        status.quizzes_completed,
                      0
                    );

                    return (
                      <article
                        key={stock.ticker}
                        style={{
                          background: "var(--surface)",
                          border:
                            "1px solid var(--border)",
                          borderRadius: "9px",
                          padding: "12px",
                          display: "grid",
                          gap: "9px",
                        }}
                      >
                        <Link
                          href={`/stocks/${stock.ticker}`}
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "10px",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  fontSize: "14px",
                                }}
                              >
                                {stock.name}
                              </strong>

                              <div
                                style={{
                                  marginTop: "3px",
                                  fontSize: "10px",
                                  color:
                                    "var(--text-muted)",
                                }}
                              >
                                {stock.ticker}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: "10px",
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              뉴스 {newsCount}
                            </span>
                          </div>

                          <p
                            style={{
                              marginTop: "8px",
                              fontSize: "11px",
                              lineHeight: 1.55,
                              color:
                                "var(--text-dim)",
                            }}
                          >
                            {stock.description}
                          </p>
                        </Link>

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: status.unlocked
                                ? "var(--accent)"
                                : "var(--text-muted)",
                            }}
                          >
                            {status.unlocked
                              ? "✅ 모의 투자 가능"
                              : `${remaining}개 더 풀면 투자 해제`}
                          </span>

                          {disabled ? (
                            <span
                              style={{
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "7px",
                                background:
                                  "#cbd5e1",
                                color: "#fff",
                                fontSize:
                                  "11px",
                                fontWeight: 700,
                              }}
                            >
                              뉴스 없음
                            </span>
                          ) : (
                            <Link
                              href={`/quiz/${stock.ticker}`}
                              style={{
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "7px",
                                background:
                                  "var(--accent2)",
                                color: "#fff",
                                fontSize:
                                  "11px",
                                fontWeight: 700,
                                textDecoration:
                                  "none",
                              }}
                            >
                              {status.quizzes_completed >
                              0
                                ? "🎯 이어 풀기"
                                : "🎯 퀴즈 시작"}
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            );
          })
        )}
      </section>
    </div>
  );
}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "999px",
                        background: colorStyle.color,
                        flex: "0 0 auto",
                      }}
                    />

                    <strong
                      style={{
                        fontSize: "14px",
                      }}
                    >
                      {sector}
                    </strong>

                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {stocks.length}개 기업
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                    }}
                  >
                    뉴스 {totalNews}개
                  </span>
                </summary>

                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    padding: "10px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(220px,1fr))",
                    gap: "8px",
                    background: "var(--surface2)",
                  }}
                >
                  {stocks.map((stock) => {
                    const status =
                      unlockMap[stock.ticker] ?? {
                        ticker: stock.ticker,
                        unlocked: false,
                        quizzes_completed: 0,
                        quizzes_required: 3,
                      };

                    const newsCount =
                      newsCounts[stock.ticker] ?? 0;

                    const disabled =
                      newsCount === 0;

                    const remaining = Math.max(
                      status.quizzes_required -
                        status.quizzes_completed,
                      0
                    );

                    return (
                      <article
                        key={stock.ticker}
                        style={{
                          background: "var(--surface)",
                          border:
                            "1px solid var(--border)",
                          borderRadius: "9px",
                          padding: "12px",
                          display: "grid",
                          gap: "9px",
                        }}
                      >
                        <Link
                          href={`/stocks/${stock.ticker}`}
                          style={{
                            color: "inherit",
                            textDecoration: "none",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              gap: "10px",
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  fontSize: "14px",
                                }}
                              >
                                {stock.name}
                              </strong>

                              <div
                                style={{
                                  marginTop: "3px",
                                  fontSize: "10px",
                                  color:
                                    "var(--text-muted)",
                                }}
                              >
                                {stock.ticker}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: "10px",
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              뉴스 {newsCount}
                            </span>
                          </div>

                          <p
                            style={{
                              marginTop: "8px",
                              fontSize: "11px",
                              lineHeight: 1.55,
                              color:
                                "var(--text-dim)",
                            }}
                          >
                            {stock.description}
                          </p>
                        </Link>

                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: status.unlocked
                                ? "var(--accent)"
                                : "var(--text-muted)",
                            }}
                          >
                            {status.unlocked
                              ? "✅ 모의 투자 가능"
                              : `${remaining}개 더 풀면 투자 해제`}
                          </span>

                          {disabled ? (
                            <span
                              style={{
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "7px",
                                background:
                                  "#cbd5e1",
                                color: "#fff",
                                fontSize:
                                  "11px",
                                fontWeight: 700,
                              }}
                            >
                              뉴스 없음
                            </span>
                          ) : (
                            <Link
                              href={`/quiz/${stock.ticker}`}
                              style={{
                                padding:
                                  "7px 10px",
                                borderRadius:
                                  "7px",
                                background:
                                  "var(--accent2)",
                                color: "#fff",
                                fontSize:
                                  "11px",
                                fontWeight: 700,
                                textDecoration:
                                  "none",
                              }}
                            >
                              {status.quizzes_completed >
                              0
                                ? "🎯 이어 풀기"
                                : "🎯 퀴즈 시작"}
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            );
          })
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type RecentArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  ago: string;
  tag: string;
  ticker?: string;
};

interface Props {
  ticker: string;
  stockName: string;
}

function createRecentNewsPrompt(article: RecentArticle, stockName: string, ticker: string) {
  return `다음 최신 뉴스를 바탕으로 ${stockName}이 최근 주식시장에서 언급된 이유를 분석해 주세요.

[분석 대상]
- 종목: ${stockName} (${ticker})
- 기사 제목: ${article.title}
- 기사 시각: ${article.pubDate}
- 기사 원문: ${article.link}

[분석 요청]
1. 기사 핵심을 주식 초보자도 이해할 수 있게 3줄 이내로 요약해 주세요.
2. 이 내용이 기업의 매출, 비용, 성장성, 위험에 어떤 영향을 줄 수 있는지 설명해 주세요.
3. 상승 요인과 하락 요인을 모두 나누어 정리해 주세요.
4. 같은 시기의 시장 전체와 업종 상황을 확인해 기사 외의 요인도 구분해 주세요.
5. 근거 자료의 출처와 날짜를 링크로 제시하고, 확인할 수 없는 내용은 '확인 불가'라고 표시해 주세요.

기사만으로 향후 주가를 단정하거나 매수·매도를 추천하지 말고, 교육 목적으로 분석해 주세요.`;
}

export default function RecentStockNews({ ticker, stockName }: Props) {
  const [articles, setArticles] = useState<RecentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecentNews() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/news/market-feed?ticker=${encodeURIComponent(ticker)}`,
          { signal: controller.signal }
        );
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error ?? "최근 뉴스를 불러오지 못했습니다.");
        }

        if (!controller.signal.aborted) {
          setArticles(Array.isArray(data?.articles) ? data.articles : []);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setArticles([]);
          setError(loadError instanceof Error ? loadError.message : "최근 뉴스를 불러오지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRecentNews();
    return () => controller.abort();
  }, [ticker, reloadVersion]);

  return (
    <section aria-labelledby="recent-stock-news-title" style={{ display: "grid", gap: "10px" }}>
      <div>
        <h2 id="recent-stock-news-title" style={{ fontSize: "16px", lineHeight: 1.4 }}>
          🔥 최근 24시간 언급 뉴스
        </h2>
        <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
          지금 {stockName}이 언급된 이유를 최신 기사에서 확인하세요.
        </p>
      </div>

      {loading ? <StatusPanel>최근 24시간 뉴스를 불러오는 중입니다.</StatusPanel> : null}

      {!loading && error ? (
        <StatusPanel tone="error">
          <div>{error}</div>
          <button type="button" onClick={() => setReloadVersion((version) => version + 1)} style={retryButtonStyle}>
            다시 불러오기
          </button>
        </StatusPanel>
      ) : null}

      {!loading && !error && articles.length === 0 ? (
        <StatusPanel>현재 표시할 최근 24시간 기사가 없습니다.</StatusPanel>
      ) : null}

      {!loading && articles.length > 0 ? (
        <div style={{ display: "grid", gap: "8px" }}>
          {articles.map((article) => (
            <RecentNewsCard
              key={`${article.link}-${article.pubDate}`}
              article={article}
              stockName={stockName}
              ticker={ticker}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RecentNewsCard({
  article,
  stockName,
  ticker,
}: {
  article: RecentArticle;
  stockName: string;
  ticker: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const prompt = createRecentNewsPrompt(article, stockName, ticker);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "13px",
        display: "grid",
        gap: "9px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "11px", color: "var(--text-muted)" }}>
        <span>{stockName}</span>
        <time dateTime={article.pubDate}>{article.ago}</time>
      </div>
      <h3 style={{ fontSize: "14px", lineHeight: 1.5 }}>{article.title}</h3>
      {article.description ? (
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
          {article.description}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        <a href={article.link} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>
          기사 원문 읽기 ↗
        </a>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          style={promptButtonStyle}
        >
          AI 분석 프롬프트 {isOpen ? "접기" : "열기"}
        </button>
      </div>
      {isOpen ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <textarea
            readOnly
            value={prompt}
            aria-label={`${stockName} 최신 뉴스 분석 프롬프트`}
            style={{
              width: "100%",
              minHeight: "180px",
              resize: "vertical",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              background: "var(--surface2)",
              color: "var(--text-dim)",
              padding: "11px",
              font: "inherit",
              fontSize: "12px",
              lineHeight: 1.55,
            }}
          />
          <button type="button" onClick={handleCopy} style={promptButtonStyle}>
            {copied ? "복사했습니다" : "분석 프롬프트 복사"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function StatusPanel({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "error" }) {
  return (
    <div
      style={{
        background: tone === "error" ? "#fff1f2" : "var(--surface)",
        border: `1px solid ${tone === "error" ? "#fecdd3" : "var(--border)"}`,
        borderRadius: "8px",
        padding: "14px",
        fontSize: "12px",
        color: tone === "error" ? "#be123c" : "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "7px",
  padding: "8px 10px",
  background: "var(--surface)",
  color: "var(--accent2)",
  fontSize: "11px",
  fontWeight: 800,
  textDecoration: "none",
};

const promptButtonStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "7px",
  padding: "8px 10px",
  background: "var(--surface2)",
  color: "var(--text-dim)",
  fontSize: "11px",
  fontWeight: 800,
  cursor: "pointer",
};

const retryButtonStyle: React.CSSProperties = {
  ...promptButtonStyle,
  marginTop: "8px",
  borderColor: "currentColor",
  background: "transparent",
  color: "inherit",
};

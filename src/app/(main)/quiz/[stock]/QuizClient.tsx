"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import type { NewsItem, QuizData, QuizPeriod, QuizSubmitResult } from "@/types";

type Step = "loading" | "quiz" | "result";

interface Props {
  ticker: string;
  stockName: string;
}

type Reveal = {
  period: QuizPeriod;
  answer: "up" | "down";
  correct: boolean;
};

function formatPrice(price: number | null | undefined) {
  if (price == null) return "-";
  return `${Math.round(price).toLocaleString()}원`;
}

export default function QuizClient({ ticker, stockName }: Props) {
  const searchParams = useSearchParams();
  const initialNewsId = searchParams.get("newsId") ?? undefined;
  const { user, refreshUser } = useAuth();
  const { refetch: refetchUnlock } = useQuizUnlock(user?.id);
  const [step, setStep] = useState<Step>("loading");
  const [news, setNews] = useState<NewsItem | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<("up" | "down")[]>([]);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [activeReveal, setActiveReveal] = useState<Reveal | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      setStep("loading");
      setError("");

      try {
        let selectedNews: NewsItem | null = null;

        if (initialNewsId) {
          const detailRes = await fetch(`/api/learning/news/${encodeURIComponent(initialNewsId)}`);
          if (detailRes.ok) selectedNews = await detailRes.json();
        }

        if (!selectedNews) {
          const newsRes = await fetch(`/api/learning/news?ticker=${encodeURIComponent(ticker)}&limit=1`);
          const newsList = newsRes.ok ? await newsRes.json() : [];
          selectedNews = Array.isArray(newsList) ? newsList[0] ?? null : null;
        }

        if (!selectedNews) {
          throw new Error("이 종목에 연결된 뉴스가 아직 없습니다.");
        }

        const quizRes = await fetch(`/api/learning/quiz/${encodeURIComponent(selectedNews.id)}`);
        const quizData = await quizRes.json();
        if (!quizRes.ok) throw new Error(quizData?.error ?? "퀴즈 데이터를 불러오지 못했습니다.");

        if (!cancelled) {
          setNews(selectedNews);
          setQuiz(quizData);
          setCurrentIdx(0);
          setAnswers([]);
          setReveals([]);
          setActiveReveal(null);
          setResult(null);
          setStep("quiz");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "퀴즈를 불러오지 못했습니다.");
          setStep("quiz");
        }
      }
    }

    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [ticker, initialNewsId]);

  const period = quiz?.periods[currentIdx] ?? null;

  const progressLabel = useMemo(() => {
    if (!quiz) return "뉴스 읽기";
    return `${currentIdx + 1} / ${quiz.periods.length}`;
  }, [currentIdx, quiz]);

  function handleAnswer(answer: "up" | "down") {
    if (!period || activeReveal) return;
    const reveal = {
      period,
      answer,
      correct: answer === period.direction,
    };
    setAnswers((prev) => [...prev, answer]);
    setReveals((prev) => [...prev, reveal]);
    setActiveReveal(reveal);
  }

  async function handleNext() {
    if (!quiz) return;
    setActiveReveal(null);

    if (currentIdx < quiz.periods.length - 1) {
      setCurrentIdx((idx) => idx + 1);
      return;
    }

    const submitRes = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsId: quiz.newsId, answers }),
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok) {
      setError(submitData?.error ?? "결과 저장에 실패했습니다.");
      return;
    }

    setResult(submitData);
    setStep("result");
    await refreshUser();
    await refetchUnlock();
  }

  if (step === "loading") {
    return <PanelText>뉴스와 Yahoo Finance 주가 데이터를 불러오는 중입니다.</PanelText>;
  }

  if (error && !quiz) {
    return <PanelText>{error}</PanelText>;
  }

  if (!quiz || !news || !period) return null;

  if (step === "result" && result) {
    return (
      <div style={{ display: "grid", gap: "14px" }}>
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "22px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>결과 확인</div>
          <h2 style={{ fontSize: "26px", marginBottom: "8px" }}>
            {result.score} / {result.total} 정답
          </h2>
          <div style={{ fontSize: "14px", color: "var(--accent)", fontWeight: 800 }}>
            +{result.coins_earned.toLocaleString()} 코인
          </div>
        </section>

        <section style={{ display: "grid", gap: "8px" }}>
          {reveals.map((item) => (
            <div
              key={item.period.months}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "13px",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{item.period.months}개월 후</div>
                <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 800 }}>
                  {formatPrice(item.period.priceBase)} → {formatPrice(item.period.priceEnd)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: item.period.direction === "up" ? "var(--danger)" : "#2563eb",
                  }}
                >
                  {item.period.changeRate > 0 ? "+" : ""}
                  {item.period.changeRate.toFixed(1)}%
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px", color: item.correct ? "var(--accent)" : "var(--danger)" }}>
                  {item.correct ? "정답" : "오답"}
                </div>
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Link href={`/stocks/${encodeURIComponent(ticker)}`} style={secondaryButtonStyle}>
            종목 상세
          </Link>
          <Link href="/stats" style={primaryButtonStyle}>
            분석 보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "7px" }}>
          뉴스 읽기 · {news.news_date}
        </div>
        <h2 style={{ fontSize: "17px", lineHeight: 1.5 }}>{quiz.headline}</h2>
        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
          {quiz.company} · {quiz.category} · {quiz.difficulty}
        </div>
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>발표 당시 주가</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "18px", fontWeight: 800 }}>
              {formatPrice(period.priceBase)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>퀴즈 진행</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 800 }}>
              {progressLabel}
            </div>
          </div>
        </div>

        <div style={{ height: "5px", background: "var(--surface2)", borderRadius: "999px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentIdx + 1) / quiz.periods.length) * 100}%`,
              background: "var(--accent2)",
              borderRadius: "999px",
            }}
          />
        </div>
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
          {period.months}개월 후 퀴즈
        </div>
        <h3 style={{ fontSize: "18px", lineHeight: 1.45, marginBottom: "14px" }}>
          이 뉴스 이후 {period.months}개월 뒤 {stockName} 주가는 올랐을까요, 내렸을까요?
        </h3>

        {activeReveal ? (
          <RevealCard reveal={activeReveal} isLast={currentIdx === quiz.periods.length - 1} onNext={handleNext} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button type="button" onClick={() => handleAnswer("up")} style={answerButtonStyle("up")}>
              상승
            </button>
            <button type="button" onClick={() => handleAnswer("down")} style={answerButtonStyle("down")}>
              하락
            </button>
          </div>
        )}
      </section>

      {error && <PanelText>{error}</PanelText>}
    </div>
  );
}

function RevealCard({ reveal, isLast, onNext }: { reveal: Reveal; isLast: boolean; onNext: () => void }) {
  const isUp = reveal.period.direction === "up";

  return (
    <div
      style={{
        background: reveal.correct ? "rgba(0,168,120,0.08)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${reveal.correct ? "rgba(0,168,120,0.25)" : "rgba(239,68,68,0.22)"}`,
        borderRadius: "8px",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "7px" }}>
        {reveal.correct ? "정답입니다" : "오답입니다"}
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: "12px" }}>
        실제로는 {formatPrice(reveal.period.priceBase)}에서 {formatPrice(reveal.period.priceEnd)}로{" "}
        <span style={{ fontWeight: 800, color: isUp ? "var(--danger)" : "#2563eb" }}>
          {reveal.period.changeRate > 0 ? "+" : ""}
          {reveal.period.changeRate.toFixed(1)}% {isUp ? "상승" : "하락"}
        </span>
        했습니다.
      </div>
      <button type="button" onClick={onNext} style={primaryButtonStyle}>
        {isLast ? "결과 확인" : "다음 기간"}
      </button>
    </div>
  );
}

function PanelText({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "18px",
        fontSize: "13px",
        color: "var(--text-muted)",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function answerButtonStyle(direction: "up" | "down"): React.CSSProperties {
  return {
    padding: "24px 12px",
    borderRadius: "8px",
    border: `1px solid ${direction === "up" ? "rgba(239,68,68,0.25)" : "rgba(37,99,235,0.25)"}`,
    background: "var(--surface2)",
    color: direction === "up" ? "var(--danger)" : "#2563eb",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  };
}

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: "13px",
  borderRadius: "8px",
  border: "none",
  background: "var(--accent2)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 800,
  textDecoration: "none",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--surface)",
  color: "var(--text-dim)",
  border: "1px solid var(--border)",
};

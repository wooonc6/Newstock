"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import type { NewsItem, QuizData, QuizSubmitResult } from "@/types";
import Link from "next/link";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

type Step = "news-list" | "quiz-active" | "result";

interface Reveal {
  userAnswer: "up" | "down";
  correct: boolean;
  changeRate: number;
}

interface Props {
  ticker: string;
  stockName: string;
}

export default function QuizClient({ ticker, stockName }: Props) {
  const { user, refreshUser } = useAuth();
  const { unlockMap, refetch: refetchUnlock } = useQuizUnlock(user?.id);

  const [step, setStep] = useState<Step>("news-list");
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [answers, setAnswers] = useState<("up" | "down")[]>([]);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wasUnlocked, setWasUnlocked] = useState(false);

  useEffect(() => {
    fetch(`/api/learning/news?ticker=${encodeURIComponent(ticker)}&limit=10`)
      .then((r) => r.json())
      .then((data) => {
        setNewsList(Array.isArray(data) ? data : []);
        setNewsLoading(false);
      })
      .catch(() => setNewsLoading(false));
  }, [ticker]);

  async function selectNews(news: NewsItem) {
    setSelectedNews(news);
    setQuizLoading(true);
    setStep("quiz-active");
    setAnswers([]);
    setReveals([]);
    setCurrentPeriodIdx(0);
    setShowReveal(false);

    const r = await fetch(`/api/learning/quiz/${news.id}`);
    const data: QuizData = await r.json();
    setQuizData(data);
    setQuizLoading(false);
  }

  async function handleAnswer(direction: "up" | "down") {
    if (!quizData || showReveal) return;

    const period = quizData.periods[currentPeriodIdx];
    const isCorrect = direction === period.direction;
    const reveal: Reveal = { userAnswer: direction, correct: isCorrect, changeRate: period.changeRate };

    const newAnswers = [...answers, direction];
    const newReveals = [...reveals, reveal];

    setAnswers(newAnswers);
    setReveals(newReveals);
    setShowReveal(true);

    const isLast = currentPeriodIdx >= quizData.periods.length - 1;

    setTimeout(async () => {
      setShowReveal(false);
      if (isLast) {
        await submitQuiz(newAnswers);
      } else {
        setCurrentPeriodIdx((i) => i + 1);
      }
    }, 1400);
  }

  async function submitQuiz(finalAnswers: ("up" | "down")[]) {
    if (!quizData || !selectedNews) return;
    setSubmitting(true);

    const prevCompleted = unlockMap[ticker]?.quizzes_completed ?? 0;

    const r = await fetch("/api/quiz/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsId: selectedNews.id, answers: finalAnswers }),
    });
    const data: QuizSubmitResult = await r.json();
    setResult(data);
    setStep("result");
    setSubmitting(false);

    await refreshUser();
    await refetchUnlock();

    const newCompleted = prevCompleted + 1;
    if (newCompleted >= 3 && prevCompleted < 3) {
      setWasUnlocked(true);
    }
  }

  function resetQuiz() {
    setStep("news-list");
    setSelectedNews(null);
    setQuizData(null);
    setAnswers([]);
    setReveals([]);
    setCurrentPeriodIdx(0);
    setShowReveal(false);
    setResult(null);
    setWasUnlocked(false);
  }

  // ── 뉴스 목록 ────────────────────────────────────────────
  if (step === "news-list") {
    return (
      <div>
        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>
          {stockName} 관련 뉴스 선택
        </div>
        {newsLoading ? (
          <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "20px 0" }}>뉴스 불러오는 중...</div>
        ) : newsList.length === 0 ? (
          <div
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
              borderRadius: "10px",
              padding: "20px",
              fontSize: "13px",
              color: "var(--text-dim)",
            }}
          >
            아직 등록된 뉴스 데이터가 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {newsList.map((news) => (
              <button
                key={news.id}
                onClick={() => selectNews(news)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 700, marginBottom: "6px" }}>
                  {news.news_date} · {DIFFICULTY_LABEL[news.difficulty] ?? news.difficulty}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.5 }}>{news.title}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 퀴즈 진행 ────────────────────────────────────────────
  if (step === "quiz-active") {
    if (quizLoading || !quizData) {
      return <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "20px 0" }}>퀴즈 불러오는 중...</div>;
    }
    if (submitting) {
      return <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "20px 0" }}>결과 집계 중...</div>;
    }

    const period = quizData.periods[currentPeriodIdx];
    const currentReveal = reveals[currentPeriodIdx];

    return (
      <div>
        {/* 뉴스 헤드라인 */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
            {quizData.newsDate} 기사
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.6 }}>{quizData.headline}</div>
        </div>

        {/* 진행 바 */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {quizData.periods.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background:
                  i < currentPeriodIdx
                    ? "var(--accent)"
                    : i === currentPeriodIdx
                    ? "rgba(59,130,246,0.3)"
                    : "var(--border)",
              }}
            />
          ))}
        </div>

        {/* 질문 */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
            {currentPeriodIdx + 1}/{quizData.periods.length} · {period.label}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700 }}>
            이 뉴스 이후 {period.label}, {stockName}의 주가는?
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            정답 시 +{period.coins}코인
          </div>
        </div>

        {/* 정답 공개 오버레이 */}
        {showReveal && currentReveal ? (
          <div
            style={{
              background: currentReveal.correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${currentReveal.correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              borderRadius: "14px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>
              {currentReveal.correct ? "✅" : "❌"}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
              {currentReveal.correct ? "정답!" : "오답!"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>
              실제로{" "}
              <span
                style={{
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  color: period.direction === "up" ? "#22c55e" : "#ef4444",
                }}
              >
                {period.changeRate >= 0 ? "+" : ""}{period.changeRate.toFixed(1)}%{" "}
                {period.direction === "up" ? "상승" : "하락"}
              </span>
              했습니다
            </div>
          </div>
        ) : (
          /* 상승/하락 버튼 */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(["up", "down"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => handleAnswer(dir)}
                style={{
                  padding: "28px 16px",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  fontSize: "24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>{dir === "up" ? "📈" : "📉"}</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: dir === "up" ? "#22c55e" : "#ef4444" }}>
                  {dir === "up" ? "상승" : "하락"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 결과 화면 ────────────────────────────────────────────
  if (!result) return null;

  return (
    <div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "28px 24px",
          textAlign: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>
          {result.score === result.total ? "🎉" : result.score > 0 ? "👍" : "😅"}
        </div>
        <div style={{ fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
          {result.score}/{result.total} 정답
        </div>
        <div style={{ fontSize: "15px", color: "var(--accent)", fontWeight: 700, marginBottom: "4px" }}>
          +{result.coins_earned.toLocaleString()}원 획득
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          현재 보유 코인: 🪙 {result.new_coins_total.toLocaleString()}원
        </div>
      </div>

      {/* 기간별 결과 요약 */}
      {quizData && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {quizData.periods.map((p, i) => {
            const rev = reveals[i];
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>{p.label}</div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: p.direction === "up" ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {p.changeRate >= 0 ? "+" : ""}{p.changeRate.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: "14px" }}>{rev?.correct ? "✅" : "❌"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {wasUnlocked && (
        <div
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.25)",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
            🔓 {stockName} 모의 투자가 해제됐습니다!
          </div>
          <Link
            href="/portfolio"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            지금 투자하러 가기 →
          </Link>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={resetQuiz}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          다른 뉴스 풀기
        </button>
        <Link
          href="/dashboard"
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "var(--surface2)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            color: "var(--text-dim)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          대시보드로
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import type { QuizSubmitResult } from "@/types";
import Link from "next/link";

interface FeedItem {
  newsId: string;
  title: string;
  company: string;
  ticker: string;
  newsDate: string;
  sourceUrl: string | null;
  timeLabel: string;
  direction: "up" | "down";
  changeRate: number;
  basePrice: number;
  currentPrice: number;
  coins: number;
}

interface Reveal {
  userAnswer: "up" | "down";
  correct: boolean;
  item: FeedItem;
}

type Step = "loading" | "quiz" | "result";

interface Props {
  ticker: string;
  stockName: string;
}

export default function QuizClient({ ticker, stockName }: Props) {
  const { user, refreshUser } = useAuth();
  const { unlockMap, refetch: refetchUnlock } = useQuizUnlock(user?.id);

  const [step, setStep] = useState<Step>("loading");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [answers, setAnswers] = useState<{ newsId: string; answer: "up" | "down"; coins: number }[]>([]);
  const [reveals, setReveals] = useState<Reveal[]>([]);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [wasUnlocked, setWasUnlocked] = useState(false);

  useEffect(() => {
    fetch(`/api/learning/quiz-feed/${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((data: FeedItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setFeed(data);
          setStep("quiz");
        } else {
          setFeed([]);
          setStep("quiz");
        }
      })
      .catch(() => setStep("quiz"));
  }, [ticker]);

  async function handleAnswer(direction: "up" | "down") {
    if (showReveal || step !== "quiz") return;

    const item = feed[currentIdx];
    const isCorrect = direction === item.direction;
    const reveal: Reveal = { userAnswer: direction, correct: isCorrect, item };

    const newAnswers = [...answers, { newsId: item.newsId, answer: direction, coins: item.coins }];
    const newReveals = [...reveals, reveal];
    setAnswers(newAnswers);
    setReveals(newReveals);
    setShowReveal(true);

    const isLast = currentIdx >= feed.length - 1;
    setTimeout(async () => {
      setShowReveal(false);
      if (isLast) {
        await submitAll(newAnswers);
      } else {
        setCurrentIdx((i) => i + 1);
      }
    }, 1600);
  }

  async function submitAll(finalAnswers: { newsId: string; answer: "up" | "down"; coins: number }[]) {
    setSubmitting(true);
    const prevCompleted = unlockMap[ticker]?.quizzes_completed ?? 0;

    const r = await fetch("/api/quiz/submit-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results: finalAnswers }),
    });
    const data: QuizSubmitResult = await r.json();
    setResult(data);
    setStep("result");
    setSubmitting(false);

    await refreshUser();
    await refetchUnlock();

    const newCompleted = prevCompleted + finalAnswers.length;
    if (newCompleted >= 3 && prevCompleted < 3) setWasUnlocked(true);
  }

  // ── 로딩 ─────────────────────────────────────────────────
  if (step === "loading" || submitting) {
    return (
      <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>
        {submitting ? "결과 집계 중..." : "뉴스 불러오는 중..."}
      </div>
    );
  }

  // ── 뉴스 없음 ─────────────────────────────────────────────
  if (step === "quiz" && feed.length === 0) {
    return (
      <div
        style={{
          background: "rgba(0,168,120,0.06)",
          border: "1px solid rgba(0,168,120,0.15)",
          borderRadius: "12px",
          padding: "24px",
          fontSize: "13px",
          color: "var(--text-dim)",
          textAlign: "center",
        }}
      >
        아직 등록된 뉴스 데이터가 없습니다.<br/>
        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>DB에 curated_news 데이터 입력 후 활성화됩니다</span>
      </div>
    );
  }

  // ── 퀴즈 ──────────────────────────────────────────────────
  if (step === "quiz") {
    const item = feed[currentIdx];

    return (
      <div>
        {/* 진행 바 */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
          {feed.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: "4px", borderRadius: "2px",
                background: i < currentIdx ? "var(--accent)" : i === currentIdx ? "rgba(0,168,120,0.3)" : "var(--surface3)",
                transition: "background .3s",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>
          {currentIdx + 1} / {feed.length}
        </div>

        {/* 뉴스 카드 */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "18px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: "100px",
              background: "rgba(26,58,92,0.08)",
              border: "1px solid rgba(26,58,92,0.15)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--accent2)",
              marginBottom: "10px",
            }}
          >
            {item.timeLabel} 뉴스 · {item.newsDate}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.6, marginBottom: "8px" }}>
            {item.title}
          </div>
        </div>

        {/* 질문 */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "14px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
            이 뉴스가 나온 이후 지금까지,<br/>{stockName}의 주가는?
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            정답 시 +₩{item.coins.toLocaleString()}
          </div>
        </div>

        {/* 정답 공개 or 버튼 */}
        {showReveal ? (
          <RevealCard reveal={reveals[reveals.length - 1]} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(["up", "down"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => handleAnswer(dir)}
                style={{
                  padding: "32px 16px",
                  borderRadius: "14px",
                  border: `1.5px solid ${dir === "up" ? "rgba(0,168,120,0.2)" : "rgba(239,68,68,0.2)"}`,
                  background: "var(--surface)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  transition: "transform .1s",
                }}
              >
                <span style={{ fontSize: "32px" }}>{dir === "up" ? "📈" : "📉"}</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: dir === "up" ? "var(--accent)" : "var(--danger)" }}>
                  {dir === "up" ? "상승" : "하락"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 결과 ──────────────────────────────────────────────────
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
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>
          {result.score === result.total ? "🎉" : result.score > 0 ? "👍" : "😅"}
        </div>
        <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--accent2)", marginBottom: "6px" }}>
          {result.score}/{result.total} 정답
        </div>
        <div style={{ fontSize: "15px", color: "var(--accent)", fontWeight: 700, marginBottom: "8px" }}>
          +₩{result.coins_earned.toLocaleString()} 획득
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(184,160,48,0.08)",
            border: "1px solid rgba(184,160,48,0.2)",
            borderRadius: "100px",
            padding: "6px 14px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--coin)",
          }}
        >
          ₩{result.new_coins_total.toLocaleString()}
        </div>
      </div>

      {/* 기간별 결과 */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "10px" }}>
          기간별 실제 주가 변동
        </div>
        {reveals.map((rev, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: i < reveals.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{rev.item.timeLabel}</div>
              <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>
                {rev.item.title.slice(0, 22)}…
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "5px",
                  background: rev.item.direction === "up" ? "rgba(0,229,176,0.1)" : "rgba(239,68,68,0.1)",
                  color: rev.item.direction === "up" ? "var(--accent)" : "var(--danger)",
                }}
              >
                {rev.item.changeRate >= 0 ? "+" : ""}{rev.item.changeRate.toFixed(1)}%
              </span>
              <span style={{ fontSize: "15px" }}>{rev.correct ? "✅" : "❌"}</span>
            </div>
          </div>
        ))}
      </div>

      {wasUnlocked && (
        <div
          style={{
            background: "rgba(0,168,120,0.08)",
            border: "1px solid rgba(0,168,120,0.25)",
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
        <Link
          href="/dashboard"
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-dim)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          대시보드로
        </Link>
        <Link
          href="/portfolio"
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "var(--accent)",
            fontSize: "13px",
            fontWeight: 700,
            color: "#fff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          포트폴리오 →
        </Link>
      </div>
    </div>
  );
}

function RevealCard({ reveal }: { reveal: Reveal }) {
  const { correct, item } = reveal;
  return (
    <div
      style={{
        borderRadius: "14px",
        padding: "28px",
        textAlign: "center",
        background: correct ? "rgba(0,168,120,0.08)" : "rgba(239,68,68,0.06)",
        border: `1.5px solid ${correct ? "rgba(0,168,120,0.25)" : "rgba(239,68,68,0.2)"}`,
      }}
    >
      <div style={{ fontSize: "36px", marginBottom: "10px" }}>{correct ? "✅" : "❌"}</div>
      <div style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px" }}>{correct ? "정답!" : "오답!"}</div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "12px" }}>
        {item.newsDate} 이후 지금까지 실제로{" "}
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            color: item.direction === "up" ? "var(--accent)" : "var(--danger)",
          }}
        >
          {item.changeRate >= 0 ? "+" : ""}{item.changeRate.toFixed(1)}%{" "}
          {item.direction === "up" ? "상승" : "하락"}
        </span>
        했습니다
      </div>
      {item.sourceUrl && (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            color: "var(--accent2)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          📰 기사 원문 읽기 →
        </a>
      )}
    </div>
  );
}

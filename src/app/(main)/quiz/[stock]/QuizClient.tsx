"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import type {
  NewsQuizFeedResponse,
  NewsQuizItem,
  QuizSubmitResult,
} from "@/types";

type Step = "loading" | "quiz" | "result";
type Direction = "up" | "down";

interface Props {
  ticker: string;
  stockName: string;
}

type AnswerRecord = {
  item: NewsQuizItem;
  answer: Direction;
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
  const [items, setItems] = useState<NewsQuizItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [activeReveal, setActiveReveal] = useState<AnswerRecord | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadQuiz() {
      setStep("loading");
      setError("");

      try {
        const query = new URLSearchParams({ limit: "15" });
        if (initialNewsId) query.set("newsId", initialNewsId);

        const response = await fetch(
          `/api/learning/quiz-feed/${encodeURIComponent(ticker)}?${query.toString()}`,
          { signal: controller.signal }
        );
        const payload = (await response.json().catch(() => null)) as
          | NewsQuizFeedResponse
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload && "error" in payload ? payload.error : "퀴즈 데이터를 불러오지 못했습니다.");
        }

        const nextItems = payload && "items" in payload && Array.isArray(payload.items)
          ? payload.items
          : [];

        if (nextItems.length === 0) {
          throw new Error(
            "이 종목에는 아직 조건에 맞는 퀴즈가 없습니다. 14일 이상 지난 기사와 주가 데이터를 확인해 주세요."
          );
        }

        if (!controller.signal.aborted) {
          setItems(nextItems);
          setCurrentIdx(0);
          setAnswers([]);
          setActiveReveal(null);
          setResult(null);
          setStep("quiz");
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : "퀴즈를 불러오지 못했습니다.");
          setStep("quiz");
        }
      }
    }

    void loadQuiz();
    return () => controller.abort();
  }, [ticker, initialNewsId]);

  const currentItem = items[currentIdx] ?? null;
  const progressLabel = items.length > 0 ? `${currentIdx + 1} / ${items.length}` : "뉴스 읽기";

  function handleAnswer(answer: Direction) {
    if (!currentItem || activeReveal) return;

    const reveal: AnswerRecord = {
      item: currentItem,
      answer,
      correct: answer === currentItem.direction,
    };
    setAnswers((previous) => [...previous, reveal]);
    setActiveReveal(reveal);
  }

  async function handleNext() {
    if (!currentItem || !activeReveal) return;

    if (currentIdx < items.length - 1) {
      setCurrentIdx((index) => index + 1);
      setActiveReveal(null);
      setError("");
      return;
    }

    const submitResponse = await fetch("/api/quiz/submit-v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        results: answers.map((record) => ({
          newsId: record.item.newsId,
          answer: record.answer,
        })),
      }),
    });
    const submitData = await submitResponse.json().catch(() => null);

    if (!submitResponse.ok) {
      setError(submitData?.error ?? "결과 저장에 실패했습니다.");
      return;
    }

    setResult(submitData);
    setActiveReveal(null);
    setStep("result");
    await refreshUser();
    await refetchUnlock();
  }

  if (step === "loading") {
    return <PanelText>과거 뉴스와 발표 후 3거래일 주가를 불러오는 중입니다.</PanelText>;
  }

  if (error && items.length === 0) {
    return <PanelText>{error}</PanelText>;
  }

  if (!currentItem) return null;

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
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
            결과 확인
          </div>
          <h2 style={{ fontSize: "26px", marginBottom: "8px" }}>
            {result.score} / {result.total} 정답
          </h2>
          <div style={{ fontSize: "14px", color: "var(--accent)", fontWeight: 800 }}>
            +{result.coins_earned.toLocaleString()} 코인
          </div>
        </section>

        <section style={{ display: "grid", gap: "8px" }}>
          {answers.map((record) => (
            <div
              key={record.item.newsId}
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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {record.item.timeLabel} · {record.item.newsDate}
                </div>
                <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: 800, lineHeight: 1.4 }}>
                  {record.item.headline}
                </div>
                <div style={{ marginTop: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
                  {formatPrice(record.item.priceBase)} → {formatPrice(record.item.priceEnd)}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: record.item.direction === "up" ? "var(--danger)" : "#2563eb",
                  }}
                >
                  {record.item.changeRate > 0 ? "+" : ""}
                  {record.item.changeRate.toFixed(1)}%
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: record.correct ? "var(--accent)" : "var(--danger)",
                  }}
                >
                  {record.correct ? "정답" : "오답"}
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
          {currentItem.timeLabel} 뉴스 · {currentItem.newsDate}
        </div>
        <h2 style={{ fontSize: "17px", lineHeight: 1.5 }}>{currentItem.headline}</h2>
        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
          {currentItem.company} · {currentItem.category} · {currentItem.difficulty}
        </div>
        <a
          href={currentItem.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            marginTop: "12px",
            color: "var(--accent2)",
            fontSize: "12px",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          기사 찾아 읽기 ↗
        </a>
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
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>
              기사 발표 직전 종가 · {currentItem.baseDate}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "18px", fontWeight: 800 }}>
              {formatPrice(currentItem.priceBase)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>
              퀴즈 진행
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 800 }}>
              {progressLabel}
            </div>
          </div>
        </div>

        <div style={{ height: "5px", background: "var(--surface2)", borderRadius: "999px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentIdx + 1) / items.length) * 100}%`,
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
          기사 발표 후 {currentItem.impactTradingDays}거래일 퀴즈
        </div>
        <h3 style={{ fontSize: "18px", lineHeight: 1.45, marginBottom: "14px" }}>
          이 뉴스가 나온 뒤 {currentItem.impactTradingDays}거래일 동안 {stockName} 주가는 올랐을까요, 내렸을까요?
        </h3>

        {activeReveal ? (
          <RevealCard
            reveal={activeReveal}
            isLast={currentIdx === items.length - 1}
            onNext={handleNext}
          />
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

      {error ? <PanelText>{error}</PanelText> : null}
    </div>
  );
}

function RevealCard({
  reveal,
  isLast,
  onNext,
}: {
  reveal: AnswerRecord;
  isLast: boolean;
  onNext: () => void;
}) {
  const isUp = reveal.item.direction === "up";

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
        {reveal.item.baseDate} 종가 {formatPrice(reveal.item.priceBase)}에서 {reveal.item.impactDate} 종가{" "}
        {formatPrice(reveal.item.priceEnd)}로{" "}
        <span style={{ fontWeight: 800, color: isUp ? "var(--danger)" : "#2563eb" }}>
          {reveal.item.changeRate > 0 ? "+" : ""}
          {reveal.item.changeRate.toFixed(1)}% {isUp ? "상승" : "하락"}
        </span>
        했습니다.
      </div>
      <button type="button" onClick={onNext} style={primaryButtonStyle}>
        {isLast ? "결과 확인" : "다음 기사"}
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

function answerButtonStyle(direction: Direction): React.CSSProperties {
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

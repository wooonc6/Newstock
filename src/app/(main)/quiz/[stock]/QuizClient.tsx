"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NewsAnalysisPrompt from "@/components/quiz/NewsAnalysisPrompt";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { formatQuizPrice } from "@/lib/quizPrompt";
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

const DAILY_REFRESH_NOTICE =
  "과거 뉴스 퀴즈는 매일 오전 6:10~6:35(KST)에 자동 갱신됩니다. 새 조건에 맞는 기사가 수집되면 다음 날 다시 풀 수 있습니다.";

export default function QuizClient({ ticker, stockName }: Props) {
  const searchParams = useSearchParams();
  const initialNewsId = searchParams.get("newsId") ?? undefined;
  const { user, refreshUser } = useAuth();
  const { refetch: refetchUnlock } = useQuizUnlock(user?.id);
  const submittingRef = useRef(false);
  const [step, setStep] = useState<Step>("loading");
  const [items, setItems] = useState<NewsQuizItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [startingCompleted, setStartingCompleted] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [activeReveal, setActiveReveal] = useState<AnswerRecord | null>(null);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        const completed = payload && "progress" in payload ? payload.progress.completed : 0;
        const total = payload && "progress" in payload ? payload.progress.total : nextItems.length;

        if (nextItems.length === 0) {
          throw new Error(
            completed > 0
              ? `이 종목에서 풀 수 있는 퀴즈를 모두 완료했습니다. 완료한 문제는 기록 탭에서 확인할 수 있습니다. ${DAILY_REFRESH_NOTICE}`
              : "이 종목에는 아직 조건에 맞는 퀴즈가 없습니다. 14일 이상 지난 기사와 주가 데이터를 확인해 주세요."
          );
        }

        if (!controller.signal.aborted) {
          setItems(nextItems);
          setCurrentIdx(0);
          setStartingCompleted(completed);
          setTotalAvailable(total);
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
  const progressLabel = items.length > 0
    ? `${startingCompleted + currentIdx + 1} / ${Math.max(totalAvailable, startingCompleted + items.length)}`
    : "뉴스 읽기";

  async function handleAnswer(answer: Direction) {
    if (!currentItem || activeReveal || submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const submitResponse = await fetch("/api/quiz/submit-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          results: [{ newsId: currentItem.newsId, answer }],
        }),
      });
      const submitData = (await submitResponse.json().catch(() => null)) as
        | QuizSubmitResult
        | { error?: string }
        | null;

      if (!submitResponse.ok || !submitData || !("score" in submitData)) {
        throw new Error(
          submitData && "error" in submitData
            ? submitData.error
            : "답안 저장에 실패했습니다."
        );
      }

      const reveal: AnswerRecord = {
        item: currentItem,
        answer,
        correct: submitData.score === 1,
      };

      setAnswers((previous) => [...previous, reveal]);
      setActiveReveal(reveal);
      setResult((previous) => ({
        score: (previous?.score ?? 0) + submitData.score,
        total: (previous?.total ?? 0) + submitData.total,
        coins_earned: (previous?.coins_earned ?? 0) + submitData.coins_earned,
        new_coins_total: submitData.new_coins_total,
        already_completed:
          (previous?.already_completed ?? 0) + (submitData.already_completed ?? 0),
      }));

      await Promise.all([refreshUser(), refetchUnlock()]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "답안 저장 요청에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (!currentItem || !activeReveal || isSubmitting) return;

    if (currentIdx < items.length - 1) {
      setCurrentIdx((index) => index + 1);
      setActiveReveal(null);
      setError("");
      return;
    }

    setActiveReveal(null);
    setStep("result");
  }

  if (step === "loading") {
    return <PanelText>아직 풀지 않은 과거 뉴스 퀴즈를 불러오는 중입니다.</PanelText>;
  }

  if (error && items.length === 0) {
    return (
      <div style={{ display: "grid", gap: "10px" }}>
        <PanelText>{error}</PanelText>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Link href="/quiz" style={secondaryButtonStyle}>퀴즈 탭으로</Link>
          <Link href="/analysis" style={primaryButtonStyle}>완료 기록 보기</Link>
        </div>
      </div>
    );
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
            이번에 푼 퀴즈
          </div>
          <h2 style={{ fontSize: "26px", marginBottom: "8px" }}>
            {result.score} / {result.total} 정답
          </h2>
          <div style={{ fontSize: "14px", color: "var(--accent)", fontWeight: 800 }}>
            +₩{result.coins_earned.toLocaleString()} 모의투자금
          </div>
          <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
            모든 답안은 문제별로 저장되었습니다. 기록 탭에서 언제든 다시 확인할 수 있습니다.
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {DAILY_REFRESH_NOTICE}
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
                display: "grid",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {record.item.timeLabel} · {record.item.newsDate}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: 800, lineHeight: 1.4 }}>
                    {record.item.headline}
                  </div>
                  <div style={{ marginTop: "5px", fontSize: "12px", color: "var(--text-dim)" }}>
                    내 선택: {record.answer === "up" ? "상승" : "하락"}
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
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Link href="/analysis" style={secondaryButtonStyle}>
            완료 기록 보기
          </Link>
          <Link href="/portfolio" style={primaryButtonStyle}>
            모의투자 확인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          답을 선택하면 즉시 저장되어 언제든 이어 풀 수 있습니다.
        </div>
        <div style={{ display: "flex", gap: "8px", flex: "0 0 auto" }}>
          <Link href="/analysis" style={smallLinkStyle}>분석</Link>
          <Link href="/quiz" style={smallLinkStyle}>나가기</Link>
        </div>
      </nav>

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
          기사 원문 읽기 ↗
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
              {formatQuizPrice(currentItem.priceBase)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>
              전체 진행
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
              width: `${((startingCompleted + currentIdx + 1) / Math.max(totalAvailable, 1)) * 100}%`,
              maxWidth: "100%",
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
            <button
              type="button"
              onClick={() => void handleAnswer("up")}
              disabled={isSubmitting}
              style={answerButtonStyle("up", isSubmitting)}
            >
              {isSubmitting ? "저장 중..." : "상승"}
            </button>
            <button
              type="button"
              onClick={() => void handleAnswer("down")}
              disabled={isSubmitting}
              style={answerButtonStyle("down", isSubmitting)}
            >
              {isSubmitting ? "저장 중..." : "하락"}
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
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>
        내 선택: <strong>{reveal.answer === "up" ? "상승" : "하락"}</strong>
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6, marginBottom: "12px" }}>
        {reveal.item.baseDate} 종가 {formatQuizPrice(reveal.item.priceBase)}에서 {reveal.item.impactDate} 종가{" "}
        {formatQuizPrice(reveal.item.priceEnd)}로{" "}
        <span style={{ fontWeight: 800, color: isUp ? "var(--danger)" : "#2563eb" }}>
          {reveal.item.changeRate > 0 ? "+" : ""}
          {reveal.item.changeRate.toFixed(1)}% {isUp ? "상승" : "하락"}
        </span>
        했습니다.
      </div>
      <NewsAnalysisPrompt item={reveal.item} />
      <button type="button" onClick={onNext} style={primaryButtonStyle}>
        {isLast ? "이번 결과 확인" : "다음 미완료 기사"}
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

function answerButtonStyle(direction: Direction, disabled: boolean): React.CSSProperties {
  return {
    padding: "24px 12px",
    borderRadius: "8px",
    border: `1px solid ${direction === "up" ? "rgba(239,68,68,0.25)" : "rgba(37,99,235,0.25)"}`,
    background: "var(--surface2)",
    color: direction === "up" ? "var(--danger)" : "#2563eb",
    fontSize: "16px",
    fontWeight: 800,
    cursor: disabled ? "wait" : "pointer",
    opacity: disabled ? 0.6 : 1,
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

const smallLinkStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: "7px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-dim)",
  fontSize: "11px",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

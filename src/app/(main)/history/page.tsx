import Link from "next/link";
import NewsAnalysisPrompt from "@/components/quiz/NewsAnalysisPrompt";
import {
  buildCuratedNewsSourceUrl,
  getQuizAgeBracket,
} from "@/lib/newsImpact";
import { createClient } from "@/lib/supabase/server";
import type { NewsQuizItem } from "@/types";

type QuizSessionRow = {
  id: string;
  stock_ticker: string;
  news_id: string | null;
  user_answer: "up" | "down" | null;
  score: number | null;
  total: number | null;
  coins_earned: number | null;
  created_at: string;
};

type CuratedNewsRow = {
  id: string;
  title: string;
  company: string;
  ticker: string;
  news_date: string;
  category: string | null;
  difficulty: string | null;
  source_url: string | null;
  impact_days: number | null;
  impact_base_date: string | null;
  impact_base_price: number | string | null;
  impact_date: string | null;
  impact_price: number | string | null;
  impact_change: number | string | null;
  impact_direction: "up" | "down" | null;
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <EmptyPanel message="로그인 후 내가 풀었던 퀴즈 기록을 확인할 수 있습니다." />;
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from("quiz_sessions")
    .select("id, stock_ticker, news_id, user_answer, score, total, coins_earned, created_at")
    .eq("user_id", user.id)
    .not("news_id", "is", null)
    .order("created_at", { ascending: false });

  if (sessionError) {
    console.error("[history] quiz session read error:", sessionError);
    return <EmptyPanel message="퀴즈 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />;
  }

  const sessions = (sessionData ?? []) as QuizSessionRow[];
  if (sessions.length === 0) {
    return <EmptyPanel message="아직 완료한 퀴즈가 없습니다." showQuizLink />;
  }

  const newsIds = Array.from(
    new Set(sessions.map((session) => session.news_id).filter((id): id is string => Boolean(id)))
  );
  const { data: newsData, error: newsError } = await supabase
    .from("curated_news")
    .select(
      "id, title, company, ticker, news_date, category, difficulty, source_url, impact_days, impact_base_date, impact_base_price, impact_date, impact_price, impact_change, impact_direction"
    )
    .in("id", newsIds);

  if (newsError) {
    console.error("[history] curated news read error:", newsError);
    return <EmptyPanel message="기록에 연결된 뉴스 정보를 불러오지 못했습니다." />;
  }

  const newsById = new Map(
    ((newsData ?? []) as CuratedNewsRow[]).map((news) => [news.id, news] as const)
  );
  const totalCorrect = sessions.filter((session) => session.score === 1).length;
  const earnedCoins = sessions.reduce((sum, session) => sum + (session.coins_earned ?? 0), 0);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "18px",
          display: "grid",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px" }}>
            HISTORY
          </div>
          <h1 style={{ fontSize: "22px", lineHeight: 1.35 }}>내 퀴즈 기록</h1>
          <p style={{ marginTop: "5px", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.6 }}>
            완료한 문제는 퀴즈에 다시 나오지 않습니다. 내가 고른 답과 당시 주가 결과, AI 분석 프롬프트를 여기서 확인하세요.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
          <Metric label="완료" value={`${sessions.length}개`} />
          <Metric label="정답" value={`${totalCorrect}개`} />
          <Metric label="획득" value={`₩${earnedCoins.toLocaleString()}`} />
        </div>
      </section>

      <div style={{ display: "grid", gap: "10px" }}>
        {sessions.map((session) => {
          const news = session.news_id ? newsById.get(session.news_id) : undefined;
          const item = news ? toNewsQuizItem(news) : null;
          const correctDirection = news?.impact_direction ?? item?.direction ?? null;

          return (
            <article
              key={session.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "15px",
                display: "grid",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {formatCompletedAt(session.created_at)} · {news?.company ?? session.stock_ticker}
                  </div>
                  <h2 style={{ marginTop: "5px", fontSize: "14px", lineHeight: 1.45 }}>
                    {news?.title ?? "연결된 뉴스 정보를 찾을 수 없습니다."}
                  </h2>
                  {news ? (
                    <a
                      href={news.source_url ?? buildCuratedNewsSourceUrl(news.title, news.news_date)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        marginTop: "7px",
                        color: "var(--accent2)",
                        fontSize: "11px",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      기사 원문 ↗
                    </a>
                  ) : null}
                </div>
                <span
                  style={{
                    padding: "5px 8px",
                    borderRadius: "999px",
                    background: session.score === 1 ? "rgba(0,168,120,0.09)" : "rgba(239,68,68,0.07)",
                    color: session.score === 1 ? "var(--accent)" : "var(--danger)",
                    fontSize: "11px",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.score === 1 ? "정답" : "오답"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
                <AnswerBox label="내 선택" value={directionLabel(session.user_answer)} />
                <AnswerBox label="실제 결과" value={directionLabel(correctDirection)} />
                <AnswerBox label="받은 보상" value={`₩${(session.coins_earned ?? 0).toLocaleString()}`} />
              </div>

              {item ? <NewsAnalysisPrompt item={item} /> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function toNewsQuizItem(news: CuratedNewsRow): NewsQuizItem | null {
  const priceBase = Number(news.impact_base_price);
  const priceEnd = Number(news.impact_price);
  const changeRate = Number(news.impact_change);

  if (
    !news.impact_base_date ||
    !news.impact_date ||
    !news.impact_direction ||
    !Number.isFinite(priceBase) ||
    !Number.isFinite(priceEnd) ||
    !Number.isFinite(changeRate)
  ) {
    return null;
  }

  return {
    newsId: news.id,
    headline: news.title,
    company: news.company,
    ticker: news.ticker,
    newsDate: news.news_date,
    category: news.category ?? "기타",
    difficulty: news.difficulty ?? "medium",
    sourceUrl: news.source_url ?? buildCuratedNewsSourceUrl(news.title, news.news_date),
    timeLabel: getQuizAgeBracket(news.news_date)?.label ?? "과거 뉴스",
    impactTradingDays: news.impact_days ?? 3,
    baseDate: news.impact_base_date,
    priceBase,
    impactDate: news.impact_date,
    priceEnd,
    changeRate,
    direction: news.impact_direction,
    coins: 0,
  };
}

function directionLabel(direction: "up" | "down" | null) {
  if (direction === "up") return "상승";
  if (direction === "down") return "하락";
  return "이전 기록";
}

function formatCompletedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "10px" }}>
      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: 800, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function AnswerBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "10px" }}>
      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "12px", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function EmptyPanel({ message, showQuizLink = false }: { message: string; showQuizLink?: boolean }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "44px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>📋</div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>퀴즈 기록</div>
      <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>{message}</div>
      {showQuizLink ? (
        <Link
          href="/quiz"
          style={{
            display: "inline-flex",
            marginTop: "14px",
            padding: "9px 12px",
            borderRadius: "8px",
            background: "var(--accent2)",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          퀴즈 풀러 가기
        </Link>
      ) : null}
    </div>
  );
}

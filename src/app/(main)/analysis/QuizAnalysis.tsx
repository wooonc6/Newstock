import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  computeCoreStats,
  computeSectorPerformance,
  computeWeakConcepts,
  computeWeeklyAccuracy,
  type CuratedNewsLite,
  type QuizSessionLite,
} from "@/lib/quizAnalytics";

export default async function QuizAnalysis() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <EmptyPanel message="로그인 후 퀴즈 분석을 확인할 수 있습니다." />;
  }

  const { data: sessionData } = await supabase
    .from("quiz_sessions")
    .select("stock_ticker, news_id, score, total, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const sessions = (sessionData ?? []) as QuizSessionLite[];

  if (sessions.length === 0) {
    return <EmptyPanel message="아직 완료한 퀴즈가 없습니다. 퀴즈를 풀면 여기에 분석이 표시돼요." showQuizLink />;
  }

  const newsIds = Array.from(
    new Set(sessions.map((s) => s.news_id).filter((id): id is string => Boolean(id)))
  );
  const { data: newsData } =
    newsIds.length > 0
      ? await supabase.from("curated_news").select("id, category").in("id", newsIds)
      : { data: [] as CuratedNewsLite[] };
  const newsById = new Map(((newsData ?? []) as CuratedNewsLite[]).map((n) => [n.id, n] as const));

  const core = computeCoreStats(sessions);
  const weekly = computeWeeklyAccuracy(sessions);
  const sectors = computeSectorPerformance(sessions);
  const weakConcepts = computeWeakConcepts(sessions, newsById);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        className="mobile-section"
        style={{ border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", padding: 24 }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>📊 퀴즈 분석</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.8 }}>
          뉴스 학습 성과를 확인해보세요.
        </p>
      </section>

      {/* 핵심 지표 3개 */}
      <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <Kpi label="총 퀴즈 수" value={`${core.totalQuiz}개`} />
        <Kpi label="정답률" value={`${Math.round(core.accuracyPct)}%`} tone={core.accuracyPct >= 60 ? "up" : "down"} />
        <Kpi label="잠금 해제 종목" value={`${core.unlockedCompanies}개`} />
      </div>

      {/* 정답률 그래프 */}
      <section
        className="mobile-section"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>📈 주간 정답률 추이</div>
        <WeeklyAccuracyChart points={weekly} />
      </section>

      {/* 산업군별 성과 */}
      <section
        className="mobile-section"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>🏭 산업군별 성과</div>
        {sectors.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>아직 데이터가 없습니다.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sectors.map((s) => (
              <div key={s.sector}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                  <span style={{ fontWeight: 700 }}>{s.sector}</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {s.correct}/{s.total} · {Math.round(s.accuracyPct)}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--surface2)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, s.accuracyPct)}%`,
                      borderRadius: 999,
                      background: s.accuracyPct >= 60 ? "var(--accent)" : "var(--danger)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 자주 틀린 개념 */}
      <section
        className="mobile-section"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>❗ 자주 틀린 개념</div>
        {weakConcepts.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            아직 틀린 문제가 없습니다. 정답률이 아주 좋아요!
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {weakConcepts.map((c, i) => (
              <div
                key={c.category}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {i + 1}. {c.category}
                </span>
                <span style={{ fontSize: 12, color: "var(--danger)", fontWeight: 800 }}>{c.wrongCount}회 오답</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WeeklyAccuracyChart({ points }: { points: { weekLabel: string; total: number; accuracyPct: number }[] }) {
  const hasData = points.some((p) => p.total > 0);
  if (!hasData) {
    return (
      <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
        아직 데이터가 충분하지 않습니다.
      </div>
    );
  }

  const width = 640;
  const height = 160;
  const padX = 24;
  const padY = 18;
  const barGap = 8;
  const barWidth = (width - padX * 2 - barGap * (points.length - 1)) / points.length;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="var(--border)" />
        {points.map((p, i) => {
          const barHeight = (Math.max(0, Math.min(100, p.accuracyPct)) / 100) * (height - padY * 2);
          const x = padX + i * (barWidth + barGap);
          const y = height - padY - barHeight;
          const color = p.total === 0 ? "var(--border)" : p.accuracyPct >= 60 ? "var(--accent)" : "var(--danger)";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill={color} />
              <text x={x + barWidth / 2} y={height - 4} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
                {p.weekLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "var(--accent)" : tone === "down" ? "var(--danger)" : "var(--text)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function EmptyPanel({ message, showQuizLink = false }: { message: string; showQuizLink?: boolean }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "44px 24px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>퀴즈 분석</div>
      <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{message}</div>
      {showQuizLink ? (
        <Link
          href="/quiz"
          style={{
            display: "inline-flex",
            marginTop: 14,
            padding: "9px 12px",
            borderRadius: 8,
            background: "var(--accent2)",
            color: "#fff",
            fontSize: 12,
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

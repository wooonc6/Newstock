import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  computeCompetencyReport,
  computeCoreStats,
  computeSectorPerformance,
  computeWeakConcepts,
  computeWeeklyAccuracy,
  type CompetencyReport,
  type CompetencyScore,
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
  const competency = computeCompetencyReport(sessions, newsById);
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
          실제 퀴즈 기록을 바탕으로 학습 성과와 보완할 영역을 확인해보세요.
        </p>
      </section>

      <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <Kpi label="총 문항 수" value={`${core.totalQuiz}개`} />
        <Kpi label="정답률" value={`${Math.round(core.accuracyPct)}%`} tone={core.accuracyPct >= 60 ? "up" : "down"} />
        <Kpi label="잠금 해제 종목" value={`${core.unlockedCompanies}개`} />
      </div>

      <CompetencySection report={competency} />

      <section
        className="mobile-section"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>📈 주간 정답률 추이</div>
        <WeeklyAccuracyChart points={weekly} />
      </section>

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
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {i + 1}. {c.category}
                </span>
                <span style={{ fontSize: 12, color: "var(--danger)", fontWeight: 800, whiteSpace: "nowrap" }}>{c.wrongCount}회 오답</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CompetencySection({ report }: { report: CompetencyReport }) {
  if (!report.ready) {
    return (
      <section className="mobile-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>📐 나의 투자 역량 리포트</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65 }}>
          서로 다른 주제의 퀴즈를 8문항 이상 풀면 기업 분석·산업 분석·경제 분석·투자 판단 역량을 비교해 보여드립니다.
          현재 {report.totalQuestions}문항이 반영되었습니다.
        </div>
        <Link href="/quiz" style={{ display: "inline-flex", marginTop: 12, padding: "8px 11px", borderRadius: 8, background: "var(--accent2)", color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
          퀴즈 더 풀기
        </Link>
      </section>
    );
  }

  return (
    <section className="mobile-section" style={{ background: "var(--surface)", border: "1px solid rgba(0,168,120,.22)", borderRadius: 14, padding: 18, display: "grid", gap: 18 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>📐 나의 투자 역량 리포트</div>
        <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>
          전체 기록 70%와 최근 10문항 30%를 반영한 규칙 기반 학습 진단입니다.
        </div>
      </div>

      <div className="competency-layout" style={{ display: "grid", gridTemplateColumns: "minmax(260px, .9fr) minmax(0, 1.1fr)", gap: 18, alignItems: "center" }}>
        <CompetencyRadar scores={report.scores} />
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--surface2)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>나의 학습 유형</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{report.profileTitle}</div>
            <div style={{ marginTop: 7, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{report.profileDescription}</div>
          </div>
          <div className="competency-score-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {report.scores.map((score) => <CompetencyMiniCard key={score.id} score={score} />)}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🧠 나의 투자 약점</div>
        <div className="competency-weakness-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, .85fr) minmax(0, 1.15fr)", gap: 10 }}>
          <div style={{ padding: 16, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3" }}>
            <div style={{ fontSize: 11, color: "#be123c", fontWeight: 800 }}>가장 보완이 필요한 영역</div>
            <div style={{ marginTop: 6, fontSize: 19, fontWeight: 900 }}>{report.weakest.label}</div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#be123c" }}>
              {report.weakest.total > 0 ? `정답률 ${Math.round((report.weakest.correct / report.weakest.total) * 100)}% · ${report.weakest.wrong}문항 오답` : "관련 문제를 더 풀어보세요"}
            </div>
            <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: "rgba(190,18,60,.12)", overflow: "hidden" }}>
              <div style={{ width: `${report.weakest.score}%`, height: "100%", borderRadius: 999, background: "#e11d48" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "#9f1239" }}>현재 역량 점수 {report.weakest.score}점</div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--surface2)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>가장 취약한 개념</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{report.weakestConcept}</div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.65 }}>{report.weaknessReason}</div>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🎯 추천 학습 코스</div>
        <div style={{ display: "grid", gap: 8 }}>
          {report.recommendedCourse.map((step, index) => (
            <div key={step.title}>
              <Link href={step.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid var(--border)", borderRadius: 10, color: "inherit", textDecoration: "none", background: "var(--surface)" }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 900, flex: "0 0 auto" }}>{index + 1}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{step.title}</span>
                  <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "var(--text-muted)" }}>{step.detail}</span>
                </span>
                <span style={{ marginLeft: "auto", color: "var(--accent)", fontWeight: 900 }}>→</span>
              </Link>
              {index < report.recommendedCourse.length - 1 ? <div style={{ height: 8, borderLeft: "2px solid var(--border)", marginLeft: 25 }} /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompetencyRadar({ scores }: { scores: CompetencyScore[] }) {
  const width = 300;
  const height = 270;
  const cx = 150;
  const cy = 135;
  const radius = 92;
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  const point = (angle: number, ratio: number) => `${cx + Math.cos(angle) * radius * ratio},${cy + Math.sin(angle) * radius * ratio}`;
  const grid = [0.25, 0.5, 0.75, 1];
  const polygon = scores.map((score, index) => point(angles[index], score.score / 100)).join(" ");
  const labelPositions = [
    { x: cx, y: 20, anchor: "middle" as const },
    { x: 280, y: cy + 4, anchor: "end" as const },
    { x: cx, y: 258, anchor: "middle" as const },
    { x: 20, y: cy + 4, anchor: "start" as const },
  ];

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="기업 분석, 산업 분석, 경제 분석, 투자 판단 역량 레이더 차트">
        {grid.map((level) => (
          <polygon key={level} points={angles.map((angle) => point(angle, level)).join(" ")} fill="none" stroke="var(--border)" strokeWidth={1} />
        ))}
        {angles.map((angle, index) => (
          <line key={index} x1={cx} y1={cy} x2={cx + Math.cos(angle) * radius} y2={cy + Math.sin(angle) * radius} stroke="var(--border)" />
        ))}
        <polygon points={polygon} fill="rgba(0,168,120,.18)" stroke="var(--accent)" strokeWidth={2.5} />
        {scores.map((score, index) => {
          const [x, y] = point(angles[index], score.score / 100).split(",").map(Number);
          return <circle key={score.id} cx={x} cy={y} r={4} fill="var(--accent)" stroke="#fff" strokeWidth={2} />;
        })}
        {scores.map((score, index) => (
          <g key={score.id}>
            <text x={labelPositions[index].x} y={labelPositions[index].y} textAnchor={labelPositions[index].anchor} fontSize={12} fontWeight={800} fill="var(--text)">{score.label}</text>
            <text x={labelPositions[index].x} y={labelPositions[index].y + 15} textAnchor={labelPositions[index].anchor} fontSize={10} fontWeight={800} fill="var(--accent)">{score.score}점</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CompetencyMiniCard({ score }: { score: CompetencyScore }) {
  const confidence = score.confidence === "high" ? "충분" : score.confidence === "medium" ? "보통" : "부족";
  return (
    <div style={{ padding: 11, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{score.label}</div>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900 }}>{score.score}점</div>
      <div style={{ marginTop: 3, fontSize: 10, color: "var(--text-muted)" }}>문항 {score.total}개 · 데이터 {confidence}</div>
    </div>
  );
}

function WeeklyAccuracyChart({ points }: { points: { weekLabel: string; total: number; accuracyPct: number }[] }) {
  const hasData = points.some((p) => p.total > 0);
  if (!hasData) {
    return <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>아직 데이터가 충분하지 않습니다.</div>;
  }

  const width = 640;
  const height = 160;
  const padX = 24;
  const padY = 18;
  const barGap = 8;
  const barWidth = (width - padX * 2 - barGap * (points.length - 1)) / points.length;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 520, height: "auto", display: "block" }}>
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="var(--border)" />
        {points.map((p, i) => {
          const barHeight = (Math.max(0, Math.min(100, p.accuracyPct)) / 100) * (height - padY * 2);
          const x = padX + i * (barWidth + barGap);
          const y = height - padY - barHeight;
          const color = p.total === 0 ? "var(--border)" : p.accuracyPct >= 60 ? "var(--accent)" : "var(--danger)";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={Math.max(2, barHeight)} rx={3} fill={color} />
              {p.total > 0 ? <text x={x + barWidth / 2} y={Math.max(11, y - 5)} textAnchor="middle" fontSize={9} fontWeight={800} fill="var(--text-dim)">{Math.round(p.accuracyPct)}%</text> : null}
              <text x={x + barWidth / 2} y={height - 4} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{p.weekLabel}</text>
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
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "44px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>퀴즈 분석</div>
      <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{message}</div>
      {showQuizLink ? <Link href="/quiz" style={{ display: "inline-flex", marginTop: 14, padding: "9px 12px", borderRadius: 8, background: "var(--accent2)", color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none" }}>퀴즈 풀러 가기</Link> : null}
    </div>
  );
}

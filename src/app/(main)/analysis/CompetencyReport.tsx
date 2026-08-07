import Link from "next/link";
import type { CompetencyReport, CompetencyScore, LearningMission } from "@/lib/quizAnalytics";

export default function CompetencyReportSection({ report }: { report: CompetencyReport }) {
  if (!report.ready) {
    return (
      <section className="mobile-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>📐 나의 뉴스 이해 리포트</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65 }}>
          퀴즈를 8문항 이상 풀면 지금까지 학습한 뉴스에서 강점과 보완 개념을 찾아 보여드립니다.
          현재 {report.totalQuestions}문항이 반영되었습니다.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/quiz" style={primaryLinkStyle}>퀴즈 더 풀기</Link>
          <Link href="/concepts" style={secondaryLinkStyle}>투자 개념 도감 보기</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mobile-section" style={{ background: "var(--surface)", border: "1px solid rgba(0,168,120,.22)", borderRadius: 14, padding: 18, display: "grid", gap: 18 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>📐 나의 뉴스 이해 리포트</div>
        <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.55 }}>
          실제 기사 제목·요약에 해당 개념이 확인된 문제만 반영합니다. 한 기사에 여러 요소가 있으면 각 영역에 함께 반영됩니다.
        </div>
      </div>

      <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "minmax(260px, .9fr) minmax(0, 1.1fr)", gap: 18, alignItems: "center" }}>
        <CompetencyRadar scores={report.scores} />
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--surface2)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>이번 학습에서 나타난 특징</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{report.profileTitle}</div>
            <div style={{ marginTop: 7, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{report.profileDescription}</div>
          </div>
          <div className="mobile-grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {report.scores.map((score) => <CompetencyMiniCard key={score.id} score={score} />)}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🧠 보완하면 좋은 개념</div>
        <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "minmax(0, .85fr) minmax(0, 1.15fr)", gap: 10 }}>
          <div style={{ padding: 16, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3" }}>
            <div style={{ fontSize: 11, color: "#be123c", fontWeight: 800 }}>측정된 영역 중 보완 우선순위</div>
            <div style={{ marginTop: 6, fontSize: 19, fontWeight: 900 }}>{report.weakest.label}</div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#be123c" }}>
              정답률 {report.weakest.total > 0 ? Math.round((report.weakest.correct / report.weakest.total) * 100) : 0}% · {report.weakest.wrong}문항 오답
            </div>
            <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: "rgba(190,18,60,.12)", overflow: "hidden" }}>
              <div style={{ width: `${report.weakest.score}%`, height: "100%", borderRadius: 999, background: "#e11d48" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: "#9f1239" }}>현재 학습 점수 {report.weakest.score}점</div>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--surface2)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>최근 어려웠던 세부 개념</div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{report.weakestConcept}</div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.65 }}>{report.weaknessReason}</div>
            <Link
              href={report.weakestConceptId ? `/concepts?focus=${encodeURIComponent(report.weakestConceptId)}#${encodeURIComponent(report.weakestConceptId)}` : "/concepts"}
              style={{ ...secondaryLinkStyle, marginTop: 12 }}
            >
              개념 설명 바로 보기
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 5 }}>🎯 오늘의 학습 미션</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
          개념만 읽거나 퀴즈만 반복하지 않고, 실제 뉴스와 모의투자까지 단계적으로 연결합니다.
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {report.recommendedCourse.map((step, index) => <MissionCard key={`${step.kind}-${step.title}`} step={step} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function MissionCard({ step, index }: { step: LearningMission; index: number }) {
  const icon: Record<LearningMission["kind"], string> = {
    concept: "📖",
    news: "📰",
    quiz: "❓",
    practice: "💹",
  };
  return (
    <Link href={step.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid var(--border)", borderRadius: 10, color: "inherit", textDecoration: "none", background: "var(--surface)" }}>
      <span style={{ width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--surface2)", fontSize: 16, flex: "0 0 auto" }}>{icon[step.kind]}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{index + 1}단계</span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{step.title}</span>
        <span style={{ display: "block", marginTop: 3, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{step.detail}</span>
      </span>
      <span style={{ marginLeft: "auto", color: "var(--accent)", fontWeight: 900 }}>→</span>
    </Link>
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
  const labels = [
    { x: cx, y: 20, anchor: "middle" as const },
    { x: 280, y: cy + 4, anchor: "end" as const },
    { x: cx, y: 258, anchor: "middle" as const },
    { x: 20, y: cy + 4, anchor: "start" as const },
  ];

  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="뉴스 이해 영역별 학습 점수 레이더 차트">
        {[0.25, 0.5, 0.75, 1].map((level) => <polygon key={level} points={angles.map((angle) => point(angle, level)).join(" ")} fill="none" stroke="var(--border)" strokeWidth={1} />)}
        {angles.map((angle, index) => <line key={index} x1={cx} y1={cy} x2={cx + Math.cos(angle) * radius} y2={cy + Math.sin(angle) * radius} stroke="var(--border)" />)}
        <polygon points={scores.map((score, index) => point(angles[index], score.total > 0 ? score.score / 100 : 0)).join(" ")} fill="rgba(0,168,120,.18)" stroke="var(--accent)" strokeWidth={2.5} />
        {scores.map((score, index) => {
          const [x, y] = point(angles[index], score.total > 0 ? score.score / 100 : 0).split(",").map(Number);
          return <circle key={score.id} cx={x} cy={y} r={4} fill={score.total > 0 ? "var(--accent)" : "var(--text-muted)"} stroke="#fff" strokeWidth={2} />;
        })}
        {scores.map((score, index) => (
          <g key={score.id}>
            <text x={labels[index].x} y={labels[index].y} textAnchor={labels[index].anchor} fontSize={12} fontWeight={800} fill="var(--text)">{score.label}</text>
            <text x={labels[index].x} y={labels[index].y + 15} textAnchor={labels[index].anchor} fontSize={10} fontWeight={800} fill={score.total > 0 ? "var(--accent)" : "var(--text-muted)"}>{score.total > 0 ? `${score.score}점` : "측정 전"}</text>
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
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900 }}>{score.total > 0 ? `${score.score}점` : "측정 전"}</div>
      <div style={{ marginTop: 3, fontSize: 10, color: "var(--text-muted)" }}>{score.total > 0 ? `문항 ${score.total}개 · 데이터 ${confidence}` : "관련 기록이 아직 없습니다"}</div>
    </div>
  );
}

const primaryLinkStyle = {
  display: "inline-flex",
  padding: "8px 11px",
  borderRadius: 8,
  background: "var(--accent2)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
} as const;

const secondaryLinkStyle = {
  display: "inline-flex",
  padding: "8px 11px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--accent2)",
  fontSize: 12,
  fontWeight: 800,
  textDecoration: "none",
} as const;

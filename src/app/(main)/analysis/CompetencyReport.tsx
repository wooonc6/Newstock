import Link from "next/link";
import type { CompetencyReport, CompetencyScore } from "@/lib/quizAnalytics";

export default function CompetencyReportSection({ report }: { report: CompetencyReport }) {
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

      <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "minmax(260px, .9fr) minmax(0, 1.1fr)", gap: 18, alignItems: "center" }}>
        <CompetencyRadar scores={report.scores} />
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 12, background: "var(--surface2)" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>나의 학습 유형</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{report.profileTitle}</div>
            <div style={{ marginTop: 7, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{report.profileDescription}</div>
          </div>
          <div className="mobile-grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {report.scores.map((score) => <CompetencyMiniCard key={score.id} score={score} />)}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>🧠 나의 투자 약점</div>
        <div className="mobile-grid-3" style={{ display: "grid", gridTemplateColumns: "minmax(0, .85fr) minmax(0, 1.15fr)", gap: 10 }}>
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
  const labelPositions = [
    { x: cx, y: 20, anchor: "middle" as const },
    { x: 280, y: cy + 4, anchor: "end" as const },
    { x: cx, y: 258, anchor: "middle" as const },
    { x: 20, y: cy + 4, anchor: "start" as const },
  ];

  return (
    <div style={{ textAlign: "center", minWidth: 0 }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", margin: "0 auto" }} role="img" aria-label="기업 분석, 산업 분석, 경제 분석, 투자 판단 역량 레이더 차트">
        {[0.25, 0.5, 0.75, 1].map((level) => <polygon key={level} points={angles.map((angle) => point(angle, level)).join(" ")} fill="none" stroke="var(--border)" strokeWidth={1} />)}
        {angles.map((angle, index) => <line key={index} x1={cx} y1={cy} x2={cx + Math.cos(angle) * radius} y2={cy + Math.sin(angle) * radius} stroke="var(--border)" />)}
        <polygon points={scores.map((score, index) => point(angles[index], score.score / 100)).join(" ")} fill="rgba(0,168,120,.18)" stroke="var(--accent)" strokeWidth={2.5} />
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

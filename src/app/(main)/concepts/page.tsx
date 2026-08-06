import Link from "next/link";
import { AREA_LABELS, INVESTMENT_CONCEPTS, type ConceptArea } from "@/lib/investmentConcepts";

const AREA_ORDER: ConceptArea[] = ["company", "industry", "economy", "judgement"];

export default async function ConceptsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section className="mobile-section" style={{ padding: 20, borderRadius: 16, border: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>📚 투자 개념 도감</div>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>뉴스를 읽기 위한 핵심 개념</h1>
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>
          개념을 외우는 데서 끝내지 않고, 실제 기업과 주가에 어떤 영향을 줄 수 있는지 함께 확인해 보세요.
        </p>
      </section>

      {AREA_ORDER.map((area) => {
        const concepts = INVESTMENT_CONCEPTS.filter((concept) => concept.area === area);
        return (
          <section key={area} className="mobile-section" style={{ padding: 18, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 900 }}>{AREA_LABELS[area]}</h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{concepts.length}개 개념</span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {concepts.map((concept) => {
                const highlighted = focus === concept.id;
                return (
                  <details
                    key={concept.id}
                    id={concept.id}
                    open={highlighted}
                    style={{
                      border: highlighted ? "1px solid rgba(0,168,120,.55)" : "1px solid var(--border)",
                      borderRadius: 10,
                      background: highlighted ? "rgba(0,168,120,.06)" : "var(--surface2)",
                      overflow: "hidden",
                    }}
                  >
                    <summary style={{ padding: "13px 14px", cursor: "pointer", fontSize: 14, fontWeight: 800 }}>
                      {concept.title}
                    </summary>
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ paddingTop: 12, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7 }}>{concept.summary}</div>
                      <div style={{ marginTop: 10, padding: 11, borderRadius: 8, background: "var(--surface)", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.65 }}>
                        <strong style={{ color: "var(--text)" }}>뉴스에서 왜 중요할까요?</strong><br />
                        {concept.whyItMatters}
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href="/dashboard" style={linkStyle}>실제 뉴스 확인</Link>
                        <Link href="/quiz" style={linkStyle}>퀴즈로 점검</Link>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const linkStyle = {
  display: "inline-flex",
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--accent2)",
  fontSize: 11,
  fontWeight: 800,
  textDecoration: "none",
} as const;

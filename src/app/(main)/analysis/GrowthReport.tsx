import GrowthCards from "./GrowthCards";
import GrowthScore from "./GrowthScore";

export default function GrowthReport() {
  return (
    <div style={{ display: "grid", gap: 28 }}>
      {/* 상단 */}
      <section>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
            letterSpacing: 1,
          }}
        >
          성장 리포트
        </div>

        <h1
          style={{
            marginTop: 8,
            fontSize: 30,
            fontWeight: 800,
            color: "var(--text)",
          }}
        >
          🌱 나의 성장
        </h1>

        <p
          style={{
            marginTop: 10,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          Newstock는 투자 수익보다
          <br />
          뉴스를 이해하고 투자 실력을 키우는 과정을 분석합니다.
        </p>
      </section>

      {/* 핵심 카드 */}
      <GrowthCards
        totalAsset={1240000}
        totalProfit={240000}
        totalReturn={12.4}
        realizedReturn={8.2}
        solvedNews={24}
        unlockedCompanies={18}
      />

      {/* 성장 지수 */}
      <GrowthScore
        solvedNews={24}
        unlockedCompanies={18}
        totalTrades={22}
        profitableTrades={14}
        totalReturn={12.4}
      />

      {/* 성장 과정 */}
      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <h3
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 26,
          }}
        >
          🌱 성장 과정
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 18,
          }}
        >
          {[
            "뉴스 학습",
            "뉴스 퀴즈 완료",
            "기업 잠금 해제",
            "첫 투자",
            "첫 수익",
          ].map((step, index) => (
            <div
              key={step}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 22,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                {index + 1}
              </div>

              <div
                style={{
                  fontWeight: 700,
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 성장 분석 */}
      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <h3
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 18,
          }}
        >
          📚 성장 분석
        </h3>

        <div
          style={{
            lineHeight: 1.9,
            color: "var(--text-muted)",
          }}
        >
          • 최근 반도체 관련 뉴스를 꾸준히 학습했습니다.
          <br />
          • 기업 잠금 해제를 18개 달성했습니다.
          <br />
          • 투자 승률은 평균보다 높은 편입니다.
          <br />
          • 뉴스 학습과 투자 활동을 균형 있게 이어가고 있습니다.
        </div>
      </section>
    </div>
  );
}

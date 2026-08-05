import GrowthCards from "./GrowthCards";

export default function GrowthReport() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-muted)",
          }}
        >
          MY GROWTH
        </div>

        <h2
          style={{
            marginTop: 6,
            fontSize: 28,
            fontWeight: 800,
            color: "var(--text)",
          }}
        >
          학습 → 투자 → 성장
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "var(--text-muted)",
          }}
        >
          Newstock는 수익보다 성장 과정을 분석합니다.
        </p>
      </div>

      <GrowthCards
        totalAsset={1240000}
        totalProfit={240000}
        totalReturn={12.4}
        realizedReturn={8.2}
        solvedNews={24}
        unlockedCompanies={18}
      />

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 18,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 22,
          }}
        >
          🚀 Growth Journey
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {[
            "뉴스 학습",
            "퀴즈 완료",
            "기업 해금",
            "첫 투자",
            "첫 수익",
          ].map((step, index) => (
            <div
              key={step}
              style={{
                flex: 1,
                minWidth: 120,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                {index + 1}
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontWeight: 600,
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

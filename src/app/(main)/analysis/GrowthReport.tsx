import GrowthCards from "./GrowthCards";

export default function GrowthReport() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <GrowthCards
        totalAsset={1240000}
        totalProfit={240000}
        totalReturn={12.4}
        realizedReturn={8.2}
        solvedNews={24}
        unlockedCompanies={18}
      />

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          📈 My Growth Journey
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 16,
          }}
        >
          {[
            "뉴스 학습",
            "퀴즈 완료",
            "기업 해금",
            "첫 투자",
            "첫 수익",
          ].map((item, index) => (
            <div
              key={item}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>

              <div style={{ fontWeight: 700 }}>{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <h3
          style={{
            marginBottom: 16,
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          🎯 성장 점수
        </h3>

        <div
          style={{
            width: "100%",
            height: 12,
            background: "#ececec",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "72%",
              height: "100%",
              background: "var(--primary)",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 15,
            color: "var(--text-muted)",
          }}
        >
          현재 성장 점수 <b>72점</b>
        </div>
      </section>
    </div>
  );
}

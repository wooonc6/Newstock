export default function GrowthReport() {
  const cards = [
    {
      title: "총자산",
      value: "₩1,240,000",
    },
    {
      title: "총수익률",
      value: "+12.4%",
    },
    {
      title: "학습 뉴스",
      value: "24개",
    },
    {
      title: "해금 기업",
      value: "18개",
    },
  ];

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
            fontSize: 24,
            fontWeight: 800,
            marginTop: 6,
          }}
        >
          학습 → 투자 → 성장
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 20,
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                marginTop: 8,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
          background: "var(--surface)",
        }}
      >
        <h3 style={{ marginBottom: 14 }}>📈 성장 Journey</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            textAlign: "center",
          }}
        >
          {[
            "뉴스 학습",
            "퀴즈 완료",
            "기업 해금",
            "투자",
            "성장",
          ].map((item, index) => (
            <div key={item} style={{ flex: 1 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  margin: "0 auto",
                  borderRadius: "50%",
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

              <div style={{ marginTop: 10 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

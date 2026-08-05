"use client";

interface Props {
  score: number;
}

export default function InvestmentReadiness({
  score,
}: Props) {
  let level = "초급";
  let color = "#ef4444";
  let description = "조금 더 뉴스 학습이 필요합니다.";

  if (score >= 60) {
    level = "중급";
    color = "#f59e0b";
    description = "기본적인 투자 판단이 가능합니다.";
  }

  if (score >= 80) {
    level = "상급";
    color = "#22c55e";
    description = "충분한 뉴스 학습을 바탕으로 투자할 수 있습니다.";
  }

  if (score >= 95) {
    level = "전문가";
    color = "#2563eb";
    description = "매우 뛰어난 뉴스 분석 능력을 갖추고 있습니다.";
  }

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        background: "var(--surface)",
        padding: 24,
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 20,
        }}
      >
        📈 투자 준비도
      </h3>

      <div
        style={{
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color,
          }}
        >
          {level}
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {score}점
        </div>

        <p
          style={{
            marginTop: 18,
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          {description}
        </p>
      </div>
    </section>
  );
}

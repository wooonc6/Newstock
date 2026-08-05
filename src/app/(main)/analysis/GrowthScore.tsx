"use client";

interface GrowthScoreProps {
  solvedNews: number;
  unlockedCompanies: number;
  totalTrades: number;
  profitableTrades: number;
  totalReturn: number;
}

export default function GrowthScore({
  solvedNews,
  unlockedCompanies,
  totalTrades,
  profitableTrades,
  totalReturn,
}: GrowthScoreProps) {
  const quizScore = Math.min(solvedNews * 2, 30);

  const unlockedCompanyScore = Math.min(
    unlockedCompanies * 2,
    20
  );

  const winRate =
    totalTrades === 0
      ? 0
      : (profitableTrades / totalTrades) * 100;

  const tradeScore = Math.min(winRate * 0.3, 30);

  const returnScore = Math.max(
    0,
    Math.min(totalReturn * 2, 20)
  );

  const score = Math.round(
    quizScore +
      unlockedCompanyScore +
      tradeScore +
      returnScore
  );

  let grade = "🌱 뉴스 입문자";
  let comment =
    "뉴스를 읽고 기업을 하나씩 알아가는 단계입니다.";

  if (score >= 90) {
    grade = "🏆 시장 통찰자";
    comment =
      "뉴스를 깊이 이해하고 투자까지 연결하는 뛰어난 성장 단계입니다.";
  } else if (score >= 75) {
    grade = "🔍 기업 분석가";
    comment =
      "기업을 분석하며 꾸준한 투자 습관을 만들어가고 있습니다.";
  } else if (score >= 60) {
    grade = "📰 뉴스 투자자";
    comment =
      "뉴스를 투자 판단에 적극적으로 활용하고 있습니다.";
  } else if (score >= 40) {
    grade = "📚 학습 투자자";
    comment =
      "뉴스 퀴즈와 투자를 함께 경험하며 성장하고 있습니다.";
  }

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 24,
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
            }}
          >
            성장 지수
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              marginTop: 6,
            }}
          >
            {score}점
          </div>
        </div>

        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          {grade}
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          width: "100%",
          height: 12,
          borderRadius: 999,
          background: "#ececec",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: "var(--primary)",
          }}
        />
      </div>

      <p
        style={{
          marginTop: 16,
          color: "var(--text-muted)",
          lineHeight: 1.7,
        }}
      >
        {comment}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Metric
          title="뉴스 퀴즈"
          value={`${quizScore.toFixed(0)} / 30`}
        />

        <Metric
          title="기업 잠금 해제"
          value={`${unlockedCompanyScore.toFixed(0)} / 20`}
        />

        <Metric
          title="투자 습관"
          value={`${tradeScore.toFixed(0)} / 30`}
        />

        <Metric
          title="투자 성과"
          value={`${returnScore.toFixed(0)} / 20`}
        />
      </div>
    </section>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

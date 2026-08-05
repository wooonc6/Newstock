"use client";

interface Props {
  totalAsset: number;
  totalProfit: number;
  totalReturn: number;
  realizedReturn: number;
  solvedNews: number;
  unlockedCompanies: number;
}

export default function GrowthCards({
  totalAsset,
  totalProfit,
  totalReturn,
  realizedReturn,
  solvedNews,
  unlockedCompanies,
}: Props) {
  const cards = [
    {
      title: "총 자산",
      value: `${totalAsset.toLocaleString()}원`,
    },
    {
      title: "총 수익",
      value: `${totalProfit.toLocaleString()}원`,
      color:
        totalProfit > 0
          ? "#16a34a"
          : totalProfit < 0
          ? "#dc2626"
          : undefined,
    },
    {
      title: "총 수익률",
      value: `${totalReturn.toFixed(1)}%`,
      color:
        totalReturn > 0
          ? "#16a34a"
          : totalReturn < 0
          ? "#dc2626"
          : undefined,
    },
    {
      title: "실현 수익률",
      value: `${realizedReturn.toFixed(1)}%`,
      color:
        realizedReturn > 0
          ? "#16a34a"
          : realizedReturn < 0
          ? "#dc2626"
          : undefined,
    },
    {
      title: "학습한 뉴스",
      value: `${solvedNews}개`,
    },
    {
      title: "잠금 해제 기업",
      value: `${unlockedCompanies}개`,
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 18,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 18,
            background: "var(--surface)",
            padding: 22,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            {card.title}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 28,
              fontWeight: 800,
              color: card.color ?? "var(--text)",
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </section>
  );
}

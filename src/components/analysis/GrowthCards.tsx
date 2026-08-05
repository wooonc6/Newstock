type GrowthCardsProps = {
  totalAsset: number;
  totalProfit: number;
  totalReturn: number;
  realizedReturn: number;
  unlockedCompanies: number;
  solvedNews: number;
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function GrowthCards({
  totalAsset,
  totalProfit,
  totalReturn,
  realizedReturn,
  unlockedCompanies,
  solvedNews,
}: GrowthCardsProps) {
  const cards = [
    {
      title: "총자산",
      value: formatMoney(totalAsset),
      color: "#2563eb",
    },
    {
      title: "누적 손익",
      value: `${totalProfit >= 0 ? "+" : ""}${formatMoney(Math.abs(totalProfit))}`,
      color: totalProfit >= 0 ? "#16a34a" : "#dc2626",
    },
    {
      title: "총수익률",
      value: formatPercent(totalReturn),
      color: totalReturn >= 0 ? "#16a34a" : "#dc2626",
    },
    {
      title: "실현 수익률",
      value: formatPercent(realizedReturn),
      color: realizedReturn >= 0 ? "#16a34a" : "#dc2626",
    },
    {
      title: "완료한 뉴스 퀴즈",
      value: `${solvedNews}개`,
      color: "#7c3aed",
    },
    {
      title: "기업 잠금 해제",
      value: `${unlockedCompanies}개`,
      color: "#f59e0b",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 18,
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 22,
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            {card.title}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: card.color,
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}

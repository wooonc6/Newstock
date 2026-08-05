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

export interface GrowthMetrics {
  solvedQuiz: number;
  unlockedCompanies: number;
  realizedReturn: number;
  totalReturn: number;
  streak: number;
}

export function calculateGrowthScore({
  solvedQuiz,
  unlockedCompanies,
  realizedReturn,
  totalReturn,
  streak,
}: GrowthMetrics) {
  const learning =
    solvedQuiz * 4 +
    unlockedCompanies * 12;

  const investment =
    realizedReturn * 8 +
    totalReturn * 6;

  const consistency =
    streak * 3;

  return Math.max(
    0,
    Math.round(
      learning +
        investment +
        consistency
    )
  );
}

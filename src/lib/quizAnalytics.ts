import { getStock } from "@/lib/stocks";

export interface QuizSessionLite {
  stock_ticker: string;
  news_id: string | null;
  score: number | null;
  total: number | null;
  created_at: string;
}

export interface CuratedNewsLite {
  id: string;
  category: string | null;
}

export interface QuizCoreStats {
  totalQuiz: number;
  correctQuiz: number;
  accuracyPct: number;
  unlockedCompanies: number;
}

const UNLOCK_REQUIRED_QUIZ_COUNT = 3;

export function computeCoreStats(sessions: QuizSessionLite[]): QuizCoreStats {
  const totalQuiz = sessions.length;
  const correctQuiz = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0);
  const accuracyPct = totalQuiz > 0 ? (correctQuiz / totalQuiz) * 100 : 0;

  const byTicker = new Map<string, number>();
  sessions.forEach((s) => byTicker.set(s.stock_ticker, (byTicker.get(s.stock_ticker) ?? 0) + 1));
  const unlockedCompanies = Array.from(byTicker.values()).filter(
    (count) => count >= UNLOCK_REQUIRED_QUIZ_COUNT
  ).length;

  return { totalQuiz, correctQuiz, accuracyPct, unlockedCompanies };
}

export interface WeeklyAccuracyPoint {
  weekLabel: string;
  correct: number;
  total: number;
  accuracyPct: number;
}

export function computeWeeklyAccuracy(sessions: QuizSessionLite[], weeks = 8): WeeklyAccuracyPoint[] {
  const now = new Date();
  const points: WeeklyAccuracyPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const inRange = sessions.filter((s) => {
      const t = new Date(s.created_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    const correct = inRange.reduce((sum, s) => sum + (s.score ?? 0), 0);
    const total = inRange.length;

    points.push({
      weekLabel: `${start.getMonth() + 1}/${start.getDate()}`,
      correct,
      total,
      accuracyPct: total > 0 ? (correct / total) * 100 : 0,
    });
  }

  return points;
}

export interface SectorPerformance {
  sector: string;
  correct: number;
  total: number;
  accuracyPct: number;
}

export function computeSectorPerformance(sessions: QuizSessionLite[]): SectorPerformance[] {
  const map = new Map<string, { correct: number; total: number }>();
  sessions.forEach((s) => {
    const sector = getStock(s.stock_ticker)?.sector ?? "기타";
    const cur = map.get(sector) ?? { correct: 0, total: 0 };
    cur.correct += s.score ?? 0;
    cur.total += s.total ?? 1;
    map.set(sector, cur);
  });

  return Array.from(map, ([sector, v]) => ({
    sector,
    correct: v.correct,
    total: v.total,
    accuracyPct: v.total > 0 ? (v.correct / v.total) * 100 : 0,
  })).sort((a, b) => b.total - a.total);
}

export interface WeakConcept {
  category: string;
  wrongCount: number;
}

export function computeWeakConcepts(
  sessions: QuizSessionLite[],
  newsById: Map<string, CuratedNewsLite>,
  limit = 5
): WeakConcept[] {
  const counts = new Map<string, number>();
  sessions
    .filter((s) => s.score === 0)
    .forEach((s) => {
      const category = (s.news_id ? newsById.get(s.news_id)?.category : null) ?? "기타";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

  return Array.from(counts, ([category, wrongCount]) => ({ category, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, limit);
}

import { getStock } from "@/lib/stocks";
import {
  AREA_LABELS,
  findConceptsByText,
  getConcept,
  INVESTMENT_CONCEPTS,
  type ConceptArea,
} from "@/lib/investmentConcepts";

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
  title: string | null;
  description: string | null;
  company: string | null;
}

export interface QuizCoreStats {
  totalQuiz: number;
  correctQuiz: number;
  accuracyPct: number;
  unlockedCompanies: number;
}

const UNLOCK_REQUIRED_QUIZ_COUNT = 3;

export function computeCoreStats(sessions: QuizSessionLite[]): QuizCoreStats {
  const totalQuiz = sessions.reduce((sum, session) => sum + Math.max(1, session.total ?? 1), 0);
  const correctQuiz = sessions.reduce((sum, session) => sum + Math.max(0, session.score ?? 0), 0);
  const accuracyPct = totalQuiz > 0 ? (correctQuiz / totalQuiz) * 100 : 0;
  const byTicker = new Map<string, number>();
  sessions.forEach((session) => byTicker.set(session.stock_ticker, (byTicker.get(session.stock_ticker) ?? 0) + 1));
  const unlockedCompanies = Array.from(byTicker.values()).filter((count) => count >= UNLOCK_REQUIRED_QUIZ_COUNT).length;
  return { totalQuiz, correctQuiz, accuracyPct, unlockedCompanies };
}

export interface WeeklyAccuracyPoint {
  weekLabel: string;
  correct: number;
  total: number;
  accuracyPct: number;
}

const DAY_MS = 86_400_000;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

function toSeoulDay(date: Date): number {
  const seoul = new Date(date.getTime() + SEOUL_OFFSET_MS);
  return Date.UTC(seoul.getUTCFullYear(), seoul.getUTCMonth(), seoul.getUTCDate());
}

function formatMonthDay(day: number): string {
  const date = new Date(day);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export function computeWeeklyAccuracy(
  sessions: QuizSessionLite[],
  weeks = 8,
  referenceDate = new Date()
): WeeklyAccuracyPoint[] {
  const today = toSeoulDay(referenceDate);
  const currentDayOfWeek = new Date(today).getUTCDay();
  const daysSinceMonday = (currentDayOfWeek + 6) % 7;
  const currentWeekStart = today - daysSinceMonday * DAY_MS;
  const points: WeeklyAccuracyPoint[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = currentWeekStart - i * 7 * DAY_MS;
    const endExclusive = start + 7 * DAY_MS;
    const inRange = sessions.filter((session) => {
      const time = new Date(session.created_at);
      if (Number.isNaN(time.getTime())) return false;
      const seoulDay = toSeoulDay(time);
      return seoulDay >= start && seoulDay < endExclusive;
    });
    const correct = inRange.reduce((sum, session) => sum + Math.max(0, session.score ?? 0), 0);
    const total = inRange.reduce((sum, session) => sum + Math.max(1, session.total ?? 1), 0);
    points.push({
      weekLabel: `${formatMonthDay(start)}~${formatMonthDay(endExclusive - DAY_MS)}`,
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
  sessions.forEach((session) => {
    const sector = getStock(session.stock_ticker)?.sector ?? "기타";
    const current = map.get(sector) ?? { correct: 0, total: 0 };
    current.correct += Math.max(0, session.score ?? 0);
    current.total += Math.max(1, session.total ?? 1);
    map.set(sector, current);
  });
  return Array.from(map, ([sector, value]) => ({
    sector,
    correct: value.correct,
    total: value.total,
    accuracyPct: value.total > 0 ? (value.correct / value.total) * 100 : 0,
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
  sessions.forEach((session) => {
    const wrong = Math.max(0, Math.max(1, session.total ?? 1) - Math.max(0, session.score ?? 0));
    if (wrong === 0) return;
    const category = (session.news_id ? newsById.get(session.news_id)?.category : null) ?? "기타";
    counts.set(category, (counts.get(category) ?? 0) + wrong);
  });
  return Array.from(counts, ([category, wrongCount]) => ({ category, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, limit);
}

export type CompetencyArea = ConceptArea;

export interface CompetencyScore {
  id: CompetencyArea;
  label: string;
  score: number;
  correct: number;
  total: number;
  wrong: number;
  recentAccuracyPct: number;
  confidence: "low" | "medium" | "high";
}

export interface LearningMission {
  kind: "concept" | "news" | "quiz" | "practice";
  title: string;
  detail: string;
  href: string;
}

export interface CompetencyReport {
  ready: boolean;
  totalQuestions: number;
  scores: CompetencyScore[];
  profileTitle: string;
  profileDescription: string;
  weakest: CompetencyScore;
  weakestConcept: string;
  weakestConceptId: string | null;
  weaknessReason: string;
  recommendedCourse: LearningMission[];
}

const AREA_ORDER: CompetencyArea[] = ["company", "industry", "economy", "judgement"];

function classifyNews(news: CuratedNewsLite | undefined): { area: CompetencyArea; conceptId: string | null; conceptTitle: string }[] {
  if (!news) return [];

  // 기사 제목과 요약에 실제로 등장한 개념만 찾습니다. 종목 산업군을 임의로
  // 끼워 넣지 않으며, 한 기사에 여러 영역이 있으면 각 영역에 한 번씩 반영합니다.
  const articleText = `${news.title ?? ""} ${news.description ?? ""}`.trim();
  const byArea = new Map<CompetencyArea, ReturnType<typeof findConceptsByText>[number]>();
  findConceptsByText(articleText).forEach((concept) => {
    if (!byArea.has(concept.area)) byArea.set(concept.area, concept);
  });

  if (byArea.size === 0) {
    return [{
      area: "company",
      conceptId: null,
      conceptTitle: news.category?.trim() || news.company?.trim() || "기업 뉴스 해석",
    }];
  }

  return Array.from(byArea.values(), (concept) => ({
    area: concept.area,
    conceptId: concept.id,
    conceptTitle: concept.title,
  }));
}

function confidenceFor(total: number): CompetencyScore["confidence"] {
  if (total >= 6) return "high";
  if (total >= 3) return "medium";
  return "low";
}

function scoreArea(allCorrect: number, allTotal: number, recentCorrect: number, recentTotal: number): number {
  if (allTotal === 0) return 0;
  const overall = (allCorrect / allTotal) * 100;
  const recent = recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : overall;
  const raw = overall * 0.7 + recent * 0.3;
  const reliability = allTotal >= 6 ? 1 : allTotal >= 3 ? 0.85 : 0.7;
  return Math.round(Math.max(0, Math.min(100, raw * reliability)));
}

function missionFor(area: CompetencyArea, conceptId: string | null): LearningMission[] {
  const fallbackConcept = INVESTMENT_CONCEPTS.find((concept) => concept.area === area) ?? INVESTMENT_CONCEPTS[0];
  const concept = (conceptId ? getConcept(conceptId) : null) ?? fallbackConcept;
  return [
    {
      kind: "concept",
      title: `${concept.title} 개념 이해하기`,
      detail: "개념 도감에서 뜻과 주가 영향을 확인하세요.",
      href: `/concepts?focus=${encodeURIComponent(concept.id)}#${encodeURIComponent(concept.id)}`,
    },
    {
      kind: "news",
      title: "실제 뉴스에서 개념 찾아보기",
      detail: "최근 24시간 많이 언급된 종목의 뉴스에서 기업 영향을 한 문장으로 정리하세요.",
      href: "/dashboard#trending-stocks",
    },
    {
      kind: "quiz",
      title: "뉴스 퀴즈로 해석 점검하기",
      detail: "관련 개념이 포함된 문제를 만나면 근거를 확인하며 풀어보세요.",
      href: "/quiz",
    },
    {
      kind: "practice",
      title: "모의투자에서 기회와 위험 비교하기",
      detail: "거래 전 상승 요인과 위험 요인을 각각 하나씩 확인하세요.",
      href: "/portfolio",
    },
  ];
}

export function computeCompetencyReport(
  sessions: QuizSessionLite[],
  newsById: Map<string, CuratedNewsLite>
): CompetencyReport {
  const linkedSessions = sessions.filter((session) => Boolean(session.news_id && newsById.has(session.news_id)));
  const totalQuestions = linkedSessions.reduce((sum, session) => sum + Math.max(1, session.total ?? 1), 0);
  const recentSet = new Set(sessions.slice(-10));
  const aggregates = new Map<CompetencyArea, {
    correct: number;
    total: number;
    recentCorrect: number;
    recentTotal: number;
    concepts: Map<string, { title: string; wrong: number }>;
  }>();

  AREA_ORDER.forEach((area) => aggregates.set(area, {
    correct: 0,
    total: 0,
    recentCorrect: 0,
    recentTotal: 0,
    concepts: new Map(),
  }));

  sessions.forEach((session) => {
    const news = session.news_id ? newsById.get(session.news_id) : undefined;
    const classifications = classifyNews(news);
    if (classifications.length === 0) return;
    const total = Math.max(1, session.total ?? 1);
    const correct = Math.max(0, Math.min(total, session.score ?? 0));
    const wrong = total - correct;
    classifications.forEach((classification) => {
      const item = aggregates.get(classification.area)!;
      item.total += total;
      item.correct += correct;
      if (recentSet.has(session)) {
        item.recentTotal += total;
        item.recentCorrect += correct;
      }
      if (wrong > 0) {
        const key = classification.conceptId ?? classification.conceptTitle;
        const current = item.concepts.get(key) ?? { title: classification.conceptTitle, wrong: 0 };
        current.wrong += wrong;
        item.concepts.set(key, current);
      }
    });
  });

  const scores = AREA_ORDER.map((area): CompetencyScore => {
    const item = aggregates.get(area)!;
    return {
      id: area,
      label: AREA_LABELS[area],
      score: scoreArea(item.correct, item.total, item.recentCorrect, item.recentTotal),
      correct: item.correct,
      total: item.total,
      wrong: item.total - item.correct,
      recentAccuracyPct: item.recentTotal > 0 ? (item.recentCorrect / item.recentTotal) * 100 : 0,
      confidence: confidenceFor(item.total),
    };
  });

  const measured = scores.filter((score) => score.total > 0);
  const fallback = scores[0];
  const strongest = measured.slice().sort((a, b) => b.score - a.score || b.total - a.total)[0] ?? fallback;
  const weakest = measured.slice().sort((a, b) => a.score - b.score || b.total - a.total)[0] ?? fallback;
  const measuredSpread = measured.length > 1
    ? Math.max(...measured.map((score) => score.score)) - Math.min(...measured.map((score) => score.score))
    : 0;
  const ready = totalQuestions >= 8 && measured.length >= 1;

  const profileTitle = measured.length < 2
    ? "학습 범위를 넓히는 중"
    : measuredSpread <= 10
      ? "여러 관점을 고르게 익히는 중"
      : `${strongest.label} 문제에서 강점을 보였습니다`;
  const profileDescription = measured.length < 2
    ? "현재 기록은 특정 종류의 뉴스에 집중되어 있습니다. 다른 주제의 뉴스를 풀면 역량 비교가 더 정확해집니다."
    : measuredSpread <= 10
      ? "측정된 영역의 점수가 비슷합니다. 아래 세부 개념을 중심으로 보완하면 뉴스 해석이 더 안정적이 됩니다."
      : `${strongest.label} 관련 문제의 성과가 가장 높았습니다. 이는 고정된 투자 성향이 아니라 지금까지 푼 문제에서 나타난 학습 특징입니다.`;

  const weakAggregate = aggregates.get(weakest.id)!;
  const weakestEntry = Array.from(weakAggregate.concepts.entries()).sort((a, b) => b[1].wrong - a[1].wrong)[0];
  const weakestConceptId = weakestEntry && getConcept(weakestEntry[0]) ? weakestEntry[0] : null;
  const weakestConcept = weakestEntry?.[1].title ?? weakest.label;
  const matchedConcept = weakestConceptId ? getConcept(weakestConceptId) : null;
  const weaknessReason = matchedConcept
    ? `${matchedConcept.summary} ${matchedConcept.whyItMatters}`
    : `${weakest.label} 관련 문제에서 오답이 상대적으로 많았습니다. 개념 설명과 실제 뉴스의 영향을 연결하는 연습이 필요합니다.`;

  return {
    ready,
    totalQuestions,
    scores,
    profileTitle,
    profileDescription,
    weakest,
    weakestConcept,
    weakestConceptId,
    weaknessReason,
    recommendedCourse: missionFor(weakest.id, weakestConceptId),
  };
}

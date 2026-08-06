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
  const totalQuiz = sessions.reduce((sum, s) => sum + Math.max(1, s.total ?? 1), 0);
  const correctQuiz = sessions.reduce((sum, s) => sum + Math.max(0, s.score ?? 0), 0);
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
    const correct = inRange.reduce((sum, s) => sum + Math.max(0, s.score ?? 0), 0);
    const total = inRange.reduce((sum, s) => sum + Math.max(1, s.total ?? 1), 0);

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
    cur.correct += Math.max(0, s.score ?? 0);
    cur.total += Math.max(1, s.total ?? 1);
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
  sessions.forEach((s) => {
    const wrong = Math.max(0, Math.max(1, s.total ?? 1) - Math.max(0, s.score ?? 0));
    if (wrong === 0) return;
    const category = (s.news_id ? newsById.get(s.news_id)?.category : null) ?? "기타";
    counts.set(category, (counts.get(category) ?? 0) + wrong);
  });

  return Array.from(counts, ([category, wrongCount]) => ({ category, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, limit);
}

export type CompetencyArea = "company" | "industry" | "economy" | "judgement";

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

export interface CompetencyReport {
  ready: boolean;
  totalQuestions: number;
  scores: CompetencyScore[];
  profileTitle: string;
  profileDescription: string;
  weakest: CompetencyScore;
  weakestConcept: string;
  weaknessReason: string;
  recommendedCourse: { title: string; detail: string; href: string }[];
}

const AREA_META: Record<CompetencyArea, { label: string; profile: string }> = {
  company: { label: "기업 분석", profile: "기업 분석형 학습자" },
  industry: { label: "산업 분석", profile: "산업 흐름형 학습자" },
  economy: { label: "경제 분석", profile: "거시경제형 학습자" },
  judgement: { label: "투자 판단", profile: "신중한 판단형 학습자" },
};

const CATEGORY_KEYWORDS: Record<CompetencyArea, string[]> = {
  company: ["실적", "매출", "영업이익", "순이익", "재무", "배당", "부채", "현금흐름", "기업", "공시"],
  industry: ["산업", "업종", "시장점유율", "수요", "공급", "경쟁", "반도체", "바이오", "자동차", "금융", "에너지"],
  economy: ["금리", "환율", "물가", "경기", "경제", "고용", "원자재", "수출", "무역", "통화"],
  judgement: ["위험", "리스크", "심리", "과열", "분산", "변동성", "매수", "매도", "투자판단", "전략"],
};

function classifyArea(category: string | null, ticker: string): CompetencyArea {
  const text = `${category ?? ""} ${getStock(ticker)?.sector ?? ""}`.toLowerCase();
  for (const area of Object.keys(CATEGORY_KEYWORDS) as CompetencyArea[]) {
    if (CATEGORY_KEYWORDS[area].some((keyword) => text.includes(keyword.toLowerCase()))) return area;
  }

  // 분류 정보가 부족한 기존 데이터도 네 영역에 고르게 배정해 분석이 한쪽으로 쏠리지 않도록 합니다.
  const seed = Array.from(ticker).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (["company", "industry", "economy", "judgement"] as CompetencyArea[])[seed % 4];
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

function conceptReason(concept: string, area: CompetencyArea): string {
  const lower = concept.toLowerCase();
  if (lower.includes("금리")) return "금리 변화가 기업의 자금 조달 비용과 주가에 미치는 영향을 연결하는 문제에서 오답이 많았습니다.";
  if (lower.includes("환율")) return "환율 변화가 수출입 기업의 매출과 비용에 미치는 영향을 구분하는 연습이 필요합니다.";
  if (lower.includes("실적") || lower.includes("이익") || lower.includes("매출")) return "매출·영업이익·순이익의 차이와 실적 변화가 주가에 미치는 영향을 연결하는 문제에서 오답이 많았습니다.";
  if (lower.includes("산업") || lower.includes("업종")) return "개별 기업 뉴스와 업종 전체의 흐름을 구분하는 문제에서 오답이 많았습니다.";
  if (lower.includes("위험") || lower.includes("심리")) return "수익 가능성과 함께 변동성·과열·분산 위험을 판단하는 연습이 더 필요합니다.";

  const fallback: Record<CompetencyArea, string> = {
    company: "기업 실적과 재무 정보가 실제 기업 가치에 미치는 영향을 연결하는 문제에서 오답이 많았습니다.",
    industry: "개별 기업의 변화와 산업 전체의 수요·경쟁 구조를 구분하는 연습이 더 필요합니다.",
    economy: "금리·환율·물가 같은 경제 지표가 기업과 주가에 미치는 영향을 연결하는 연습이 더 필요합니다.",
    judgement: "뉴스의 긍정적 요인뿐 아니라 위험과 불확실성까지 함께 판단하는 연습이 더 필요합니다.",
  };
  return fallback[area];
}

function courseFor(area: CompetencyArea): CompetencyReport["recommendedCourse"] {
  const courses: Record<CompetencyArea, CompetencyReport["recommendedCourse"]> = {
    company: [
      { title: "매출·영업이익·순이익 구분하기", detail: "기업 실적 기초 · 약 5분", href: "/quiz" },
      { title: "기업 실적 뉴스 퀴즈 풀기", detail: "관련 퀴즈로 개념 확인", href: "/quiz" },
      { title: "보유 종목 실적 다시 살펴보기", detail: "종목 상세 뉴스에 적용", href: "/dashboard" },
    ],
    industry: [
      { title: "산업 수요와 경쟁 구조 이해하기", detail: "산업 분석 기초 · 약 5분", href: "/quiz" },
      { title: "산업군별 뉴스 퀴즈 풀기", detail: "비슷한 기업을 비교", href: "/quiz" },
      { title: "코스피 트리맵에서 업종 흐름 확인", detail: "시장 전체에 적용", href: "/dashboard" },
    ],
    economy: [
      { title: "금리·환율·물가 핵심 개념 익히기", detail: "경제 분석 기초 · 약 5분", href: "/quiz" },
      { title: "경제 뉴스 퀴즈 풀기", detail: "지표와 기업 영향 연결", href: "/quiz" },
      { title: "오늘의 시장 뉴스에서 영향 찾기", detail: "실제 기사에 적용", href: "/dashboard" },
    ],
    judgement: [
      { title: "수익과 위험을 함께 판단하기", detail: "투자 판단 기초 · 약 5분", href: "/quiz" },
      { title: "상승·하락 요인 구분 퀴즈", detail: "한쪽 정보에 치우치지 않기", href: "/quiz" },
      { title: "모의투자 전 위험 요인 확인하기", detail: "거래에 적용", href: "/portfolio" },
    ],
  };
  return courses[area];
}

export function computeCompetencyReport(
  sessions: QuizSessionLite[],
  newsById: Map<string, CuratedNewsLite>
): CompetencyReport {
  const recentSessions = sessions.slice(-10);
  const aggregates = new Map<CompetencyArea, { correct: number; total: number; recentCorrect: number; recentTotal: number; concepts: Map<string, number> }>();

  (Object.keys(AREA_META) as CompetencyArea[]).forEach((area) => {
    aggregates.set(area, { correct: 0, total: 0, recentCorrect: 0, recentTotal: 0, concepts: new Map() });
  });

  const recentSet = new Set(recentSessions);
  sessions.forEach((session) => {
    const category = session.news_id ? newsById.get(session.news_id)?.category ?? null : null;
    const area = classifyArea(category, session.stock_ticker);
    const item = aggregates.get(area)!;
    const total = Math.max(1, session.total ?? 1);
    const correct = Math.max(0, Math.min(total, session.score ?? 0));
    const wrong = total - correct;
    item.total += total;
    item.correct += correct;
    if (recentSet.has(session)) {
      item.recentTotal += total;
      item.recentCorrect += correct;
    }
    if (wrong > 0) {
      const concept = category?.trim() || AREA_META[area].label;
      item.concepts.set(concept, (item.concepts.get(concept) ?? 0) + wrong);
    }
  });

  const scores = (Object.keys(AREA_META) as CompetencyArea[]).map((area): CompetencyScore => {
    const item = aggregates.get(area)!;
    return {
      id: area,
      label: AREA_META[area].label,
      score: scoreArea(item.correct, item.total, item.recentCorrect, item.recentTotal),
      correct: item.correct,
      total: item.total,
      wrong: item.total - item.correct,
      recentAccuracyPct: item.recentTotal > 0 ? (item.recentCorrect / item.recentTotal) * 100 : 0,
      confidence: confidenceFor(item.total),
    };
  });

  const strongest = scores.slice().sort((a, b) => b.score - a.score || b.total - a.total)[0];
  const weakest = scores.slice().sort((a, b) => a.score - b.score || b.total - a.total)[0];
  const spread = Math.max(...scores.map((s) => s.score)) - Math.min(...scores.map((s) => s.score));
  const ready = sessions.reduce((sum, s) => sum + Math.max(1, s.total ?? 1), 0) >= 8;
  const profileTitle = spread <= 10 ? "균형 성장형 학습자" : AREA_META[strongest.id].profile;
  const profileDescription = spread <= 10
    ? "네 가지 영역을 비교적 고르게 학습하고 있습니다. 가장 낮은 영역을 조금 더 보완하면 균형이 더욱 좋아집니다."
    : `${strongest.label} 역량이 가장 강합니다. ${weakest.label} 영역을 보완하면 뉴스를 더 입체적으로 해석할 수 있습니다.`;

  const weakAggregate = aggregates.get(weakest.id)!;
  const weakestConcept = Array.from(weakAggregate.concepts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? weakest.label;

  return {
    ready,
    totalQuestions: sessions.reduce((sum, s) => sum + Math.max(1, s.total ?? 1), 0),
    scores,
    profileTitle,
    profileDescription,
    weakest,
    weakestConcept,
    weaknessReason: conceptReason(weakestConcept, weakest.id),
    recommendedCourse: courseFor(weakest.id),
  };
}

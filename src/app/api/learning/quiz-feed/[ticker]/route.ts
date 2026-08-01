import { createClient } from "@/lib/supabase/server";
import {
  buildCuratedNewsSourceUrl,
  getNewsImpact,
  getQuizAgeBracket,
  isQuizWorthyImpact,
  mapWithConcurrency,
  MAX_NEWS_PER_QUIZ,
  MIN_QUIZ_CHANGE_PERCENT,
} from "@/lib/newsImpact";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CuratedNewsRow = {
  id: string;
  title: string;
  company: string;
  ticker: string;
  news_date: string;
  category: string | null;
  difficulty: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = decodeURIComponent(params.ticker);
  const parsedLimit = Number(request.nextUrl.searchParams.get("limit") ?? MAX_NEWS_PER_QUIZ);
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(Math.floor(parsedLimit), MAX_NEWS_PER_QUIZ))
    : MAX_NEWS_PER_QUIZ;
  const preferredNewsId = request.nextUrl.searchParams.get("newsId");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curated_news")
    .select("id, title, company, ticker, news_date, category, difficulty")
    .eq("ticker", ticker)
    .order("news_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[GET /api/learning/quiz-feed/:ticker] Supabase error:", error);
    return NextResponse.json(
      { error: "종목별 퀴즈 뉴스를 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  const eligibleNews = ((data ?? []) as CuratedNewsRow[])
    .map((news) => ({ news, bracket: getQuizAgeBracket(news.news_date) }))
    .filter(
      (item): item is { news: CuratedNewsRow; bracket: NonNullable<typeof item.bracket> } =>
        item.bracket !== null
    )
    .sort((a, b) => {
      if (a.news.id === preferredNewsId) return -1;
      if (b.news.id === preferredNewsId) return 1;
      if (a.bracket.targetMonths !== b.bracket.targetMonths) {
        return a.bracket.targetMonths - b.bracket.targetMonths;
      }
      return b.news.news_date.localeCompare(a.news.news_date);
    })
    .slice(0, Math.min(limit * 3, 45));

  const evaluated = await mapWithConcurrency(eligibleNews, 4, async ({ news, bracket }) => {
    try {
      const impact = await getNewsImpact(news.ticker, news.news_date);
      if (!isQuizWorthyImpact(impact)) return null;

      return {
        newsId: news.id,
        headline: news.title,
        company: news.company,
        ticker: news.ticker,
        newsDate: news.news_date,
        category: news.category ?? "기타",
        difficulty: news.difficulty ?? "medium",
        sourceUrl: buildCuratedNewsSourceUrl(news.title, news.news_date),
        timeLabel: bracket.label,
        impactTradingDays: 3,
        baseDate: impact.baseDate,
        priceBase: impact.basePrice,
        impactDate: impact.impactDate,
        priceEnd: impact.impactPrice,
        changeRate: impact.changeRate,
        direction: impact.direction,
        coins: bracket.coins,
      };
    } catch (impactError) {
      console.error(
        `[GET /api/learning/quiz-feed/:ticker] ${news.id} impact error:`,
        impactError
      );
      return null;
    }
  });

  const items = evaluated.filter((item): item is NonNullable<typeof item> => item !== null).slice(0, limit);

  return NextResponse.json({
    items,
    rule: {
      base: "기사 발표 직전 거래일 종가",
      comparison: "기사 발표 후 3거래일 종가",
      minimumAbsoluteChangePercent: MIN_QUIZ_CHANGE_PERCENT,
    },
  });
}

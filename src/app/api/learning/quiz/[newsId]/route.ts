import {
  buildCuratedNewsSourceUrl,
  getNewsImpact,
  getQuizAgeBracket,
  isQuizWorthyImpact,
  MIN_QUIZ_CHANGE_PERCENT,
} from "@/lib/newsImpact";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { newsId: string } }
) {
  const supabase = await createClient();
  const { data: news, error } = await supabase
    .from("curated_news")
    .select(
      "id, title, company, ticker, news_date, category, difficulty, source_url, impact_days, impact_base_date, impact_base_price, impact_date, impact_price, impact_change, impact_direction"
    )
    .eq("id", params.newsId)
    .eq("is_active", true)
    .single();

  if (error || !news) {
    return NextResponse.json({ error: "뉴스를 찾을 수 없습니다." }, { status: 404 });
  }

  const bracket = getQuizAgeBracket(news.news_date);
  if (!bracket) {
    return NextResponse.json(
      { error: "이 뉴스는 아직 퀴즈에 사용하기에 충분히 지난 기사가 아닙니다." },
      { status: 422 }
    );
  }

  try {
    const basePrice = Number(news.impact_base_price);
    const impactPrice = Number(news.impact_price);
    const changeRate = Number(news.impact_change);
    const cachedImpact =
      news.impact_days === 3 &&
      news.impact_base_date &&
      news.impact_date &&
      (news.impact_direction === "up" || news.impact_direction === "down") &&
      Number.isFinite(basePrice) &&
      Number.isFinite(impactPrice) &&
      Number.isFinite(changeRate)
        ? {
            baseDate: news.impact_base_date,
            basePrice,
            impactDate: news.impact_date,
            impactPrice,
            changeRate,
            direction: news.impact_direction,
          }
        : null;
    const impact = cachedImpact ?? await getNewsImpact(news.ticker, news.news_date);

    if (!isQuizWorthyImpact(impact)) {
      return NextResponse.json(
        { error: `주가 변동률의 절댓값이 ${MIN_QUIZ_CHANGE_PERCENT}% 미만이라 퀴즈에서 제외됩니다.` },
        { status: 422 }
      );
    }

    return NextResponse.json({
      newsId: news.id,
      company: news.company,
      ticker: news.ticker,
      newsDate: news.news_date,
      headline: news.title,
      category: news.category ?? "기타",
      difficulty: news.difficulty ?? "medium",
      sourceUrl: news.source_url ?? buildCuratedNewsSourceUrl(news.title, news.news_date),
      timeLabel: bracket.label,
      impactTradingDays: 3,
      baseDate: impact.baseDate,
      impactDate: impact.impactDate,
      periods: [
        {
          label: "발표 후 3거래일",
          months: 0,
          priceBase: impact.basePrice,
          priceEnd: impact.impactPrice,
          changeRate: impact.changeRate,
          direction: impact.direction,
          coins: bracket.coins,
        },
      ],
    });
  } catch (impactError) {
    const message = impactError instanceof Error ? impactError.message : "알 수 없는 오류";
    console.error("[GET /api/learning/quiz/:newsId] impact error:", impactError);
    return NextResponse.json({ error: `주가 조회 실패: ${message}` }, { status: 502 });
  }
}

import {
  getNewsImpact,
  getQuizAgeBracket,
  isQuizWorthyImpact,
  mapWithConcurrency,
  MAX_NEWS_PER_QUIZ,
} from "@/lib/newsImpact";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SubmittedAnswer = {
  newsId: string;
  answer: "up" | "down";
};

type CuratedNewsRow = {
  id: string;
  ticker: string;
  news_date: string;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { results?: SubmittedAnswer[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const results = body.results;
  const validResults =
    Array.isArray(results) &&
    results.length > 0 &&
    results.length <= MAX_NEWS_PER_QUIZ &&
    results.every(
      (item) =>
        typeof item?.newsId === "string" &&
        item.newsId.length > 0 &&
        (item.answer === "up" || item.answer === "down")
    );

  if (!validResults || !results) {
    return NextResponse.json(
      { error: `results에는 최대 ${MAX_NEWS_PER_QUIZ}개의 유효한 답안이 필요합니다.` },
      { status: 400 }
    );
  }

  const newsIds = results.map((item) => item.newsId);
  if (new Set(newsIds).size !== newsIds.length) {
    return NextResponse.json({ error: "같은 뉴스에 중복 답안은 제출할 수 없습니다." }, { status: 400 });
  }

  const { data, error: newsError } = await supabase
    .from("curated_news")
    .select("id, ticker, news_date")
    .in("id", newsIds);

  if (newsError) {
    console.error("[POST /api/quiz/submit-v2] news read error:", newsError);
    return NextResponse.json({ error: "퀴즈 뉴스를 확인하지 못했습니다." }, { status: 500 });
  }

  const newsById = new Map(
    ((data ?? []) as CuratedNewsRow[]).map((news) => [news.id, news] as const)
  );

  if (newsById.size !== newsIds.length) {
    return NextResponse.json({ error: "일부 퀴즈 뉴스를 찾을 수 없습니다." }, { status: 404 });
  }

  const scored = await mapWithConcurrency(results, 4, async (item) => {
    const news = newsById.get(item.newsId);
    if (!news) return null;

    const bracket = getQuizAgeBracket(news.news_date);
    if (!bracket) return null;

    try {
      const impact = await getNewsImpact(news.ticker, news.news_date);
      if (!isQuizWorthyImpact(impact)) return null;

      const correct = item.answer === impact.direction;
      return {
        news,
        answer: item.answer,
        correct,
      };
    } catch (impactError) {
      console.error(
        `[POST /api/quiz/submit-v2] ${news.id} impact error:`,
        impactError
      );
      return null;
    }
  });

  const validScores = scored.filter((item): item is NonNullable<typeof item> => item !== null);

  if (validScores.length === 0) {
    return NextResponse.json(
      { error: "채점 가능한 주가 데이터가 없습니다. 잠시 후 다시 시도해 주세요." },
      { status: 422 }
    );
  }

  const totalScore = validScores.filter((item) => item.correct).length;
  const { data: rewardRows, error: rewardError } = await supabase.rpc("record_quiz_results", {
    p_results: validScores.map((item) => ({
      news_id: item.news.id,
      answer: item.answer,
      correct: item.correct,
    })),
  });

  if (rewardError) {
    console.error("[POST /api/quiz/submit-v2] atomic reward error:", rewardError);
    return NextResponse.json(
      { error: "퀴즈 결과와 모의투자금 보상을 저장하지 못했습니다." },
      { status: 500 }
    );
  }

  const reward = rewardRows?.[0] as
    | { inserted_count: number; reward_amount: number; balance_after: number }
    | undefined;

  if (!reward) {
    return NextResponse.json({ error: "보상 처리 결과를 확인하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    score: totalScore,
    total: validScores.length,
    coins_earned: reward.reward_amount,
    new_coins_total: reward.balance_after,
    already_completed: validScores.length - reward.inserted_count,
  });
}

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
        correct,
        coinsEarned: correct ? bracket.coins : 0,
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
  const totalCoins = validScores.reduce((sum, item) => sum + item.coinsEarned, 0);

  const { error: userInitError } = await supabase.from("users").upsert(
    { id: user.id, coins: 1000000, streak: 0, sessions: 0 },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (userInitError) {
    console.error("[POST /api/quiz/submit-v2] user init error:", userInitError);
    return NextResponse.json({ error: "사용자 보상 정보를 준비하지 못했습니다." }, { status: 500 });
  }

  const { data: userData, error: userReadError } = await supabase
    .from("users")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (userReadError) {
    console.error("[POST /api/quiz/submit-v2] user read error:", userReadError);
    return NextResponse.json({ error: "현재 코인 정보를 불러오지 못했습니다." }, { status: 500 });
  }

  const currentCoins = userData?.coins ?? 1000000;
  const newCoins = currentCoins + totalCoins;
  const { error: rewardError } = await supabase
    .from("users")
    .update({ coins: newCoins })
    .eq("id", user.id);

  if (rewardError) {
    console.error("[POST /api/quiz/submit-v2] reward update error:", rewardError);
    return NextResponse.json({ error: "코인 보상을 저장하지 못했습니다." }, { status: 500 });
  }

  const sessionRows = validScores.map((item) => ({
    user_id: user.id,
    stock_ticker: item.news.ticker,
    news_id: item.news.id,
    score: item.correct ? 1 : 0,
    total: 1,
    coins_earned: item.coinsEarned,
  }));
  const { error: sessionError } = await supabase.from("quiz_sessions").insert(sessionRows);

  if (sessionError) {
    console.error("[POST /api/quiz/submit-v2] session write error:", sessionError);
    return NextResponse.json(
      { error: "퀴즈 기록 저장에 실패했습니다. 코인 반영 여부를 확인해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    score: totalScore,
    total: validScores.length,
    coins_earned: totalCoins,
    new_coins_total: newCoins,
  });
}

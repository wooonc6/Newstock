import {
  getNewsImpact,
  getQuizAgeBracket,
  isQuizWorthyImpact,
} from "@/lib/newsImpact";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { newsId?: string; answers?: Array<"up" | "down"> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const newsId = body.newsId;
  const answer = body.answers?.[0];
  if (!newsId || (answer !== "up" && answer !== "down")) {
    return NextResponse.json(
      { error: "newsId와 상승·하락 답안 1개가 필요합니다." },
      { status: 400 }
    );
  }

  const { data: news, error: newsError } = await supabase
    .from("curated_news")
    .select("ticker, news_date")
    .eq("id", newsId)
    .single();

  if (newsError || !news) {
    return NextResponse.json({ error: "뉴스를 찾을 수 없습니다." }, { status: 404 });
  }

  const bracket = getQuizAgeBracket(news.news_date);
  if (!bracket) {
    return NextResponse.json({ error: "채점 가능한 뉴스 시기 범위가 아닙니다." }, { status: 422 });
  }

  let correct = false;
  try {
    const impact = await getNewsImpact(news.ticker, news.news_date);
    if (!isQuizWorthyImpact(impact)) {
      return NextResponse.json({ error: "변동 폭이 작아 채점에서 제외된 뉴스입니다." }, { status: 422 });
    }
    correct = answer === impact.direction;
  } catch (impactError) {
    console.error("[POST /api/quiz/submit] impact error:", impactError);
    return NextResponse.json({ error: "주가 데이터를 확인하지 못했습니다." }, { status: 502 });
  }

  const coinsEarned = correct ? bracket.coins : 0;
  const { error: userInitError } = await supabase.from("users").upsert(
    { id: user.id, coins: 1000000, streak: 0, sessions: 0 },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (userInitError) {
    return NextResponse.json({ error: "사용자 정보를 준비하지 못했습니다." }, { status: 500 });
  }

  const { data: userData, error: userReadError } = await supabase
    .from("users")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (userReadError) {
    return NextResponse.json({ error: "현재 코인 정보를 불러오지 못했습니다." }, { status: 500 });
  }

  const currentCoins = userData?.coins ?? 1000000;
  const newCoinsTotal = currentCoins + coinsEarned;
  const { error: rewardError } = await supabase
    .from("users")
    .update({ coins: newCoinsTotal })
    .eq("id", user.id);

  if (rewardError) {
    return NextResponse.json({ error: "코인 보상을 저장하지 못했습니다." }, { status: 500 });
  }

  const { error: sessionError } = await supabase.from("quiz_sessions").insert({
    user_id: user.id,
    stock_ticker: news.ticker,
    news_id: newsId,
    score: correct ? 1 : 0,
    total: 1,
    coins_earned: coinsEarned,
  });

  if (sessionError) {
    return NextResponse.json({ error: "퀴즈 기록을 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    score: correct ? 1 : 0,
    total: 1,
    coins_earned: coinsEarned,
    new_coins_total: newCoinsTotal,
  });
}

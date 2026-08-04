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

  const { data: rewardRows, error: rewardError } = await supabase.rpc("record_quiz_results", {
    p_results: [{ news_id: newsId, answer, correct }],
  });

  if (rewardError) {
    console.error("[POST /api/quiz/submit] atomic reward error:", rewardError);
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
    score: correct ? 1 : 0,
    total: 1,
    coins_earned: reward.reward_amount,
    new_coins_total: reward.balance_after,
    already_completed: reward.inserted_count === 0 ? 1 : 0,
  });
}

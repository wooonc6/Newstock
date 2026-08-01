import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function buildNaverSearchUrl(title: string, date: string): string {
  const [year, month, day] = date.split("-");
  const ds = `${year}.${month}.01`;
  const de = `${year}.${month}.${day}`;
  const query = encodeURIComponent(title.slice(0, 20));

  return `https://search.naver.com/search.naver?where=news&query=${query}&ds=${ds}&de=${de}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const ticker = searchParams.get("ticker");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const summary = searchParams.get("summary") === "1";

    const parsedLimit = Number(searchParams.get("limit") ?? "20");
    const parsedOffset = Number(searchParams.get("offset") ?? "0");

    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 20;

    const offset =
      Number.isFinite(parsedOffset) && parsedOffset >= 0
        ? parsedOffset
        : 0;

    const supabase = await createClient();

    if (summary) {
      const { data, error } = await supabase
        .from("curated_news")
        .select("id, title, company, ticker, news_date, category, difficulty, source_url")
        .eq("is_active", true)
        .order("news_date", { ascending: false })
        .limit(1000);

      if (error) {
        console.error("[GET /api/learning/news?summary=1] Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const counts: Record<string, number> = {};
      for (const news of data ?? []) {
        counts[news.ticker] = (counts[news.ticker] ?? 0) + 1;
      }

      const sample = (data ?? []).slice(0, 3).map((news) => ({
        ...news,
        source_url: news.source_url ?? buildNaverSearchUrl(news.title, news.news_date),
      }));

      return NextResponse.json({ counts, sample, total: data?.length ?? 0 });
    }

    let query = supabase
      .from("curated_news")
      .select("id, title, company, ticker, news_date, category, difficulty, source_url")
      .eq("is_active", true)
      .order("news_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ticker) query = query.eq("ticker", ticker);
    if (category) query = query.eq("category", category);
    if (difficulty) query = query.eq("difficulty", difficulty);

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/learning/news] Supabase error:", error);

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    const enrichedNews = (data ?? []).map((news) => ({
      ...news,
      source_url: news.source_url ?? buildNaverSearchUrl(news.title, news.news_date),
    }));

    return NextResponse.json(enrichedNews);
  } catch (error) {
    console.error("[GET /api/learning/news] Unexpected error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "뉴스를 불러오는 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

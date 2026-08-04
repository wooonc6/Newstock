import { NextResponse } from "next/server";
import { STOCKS } from "@/lib/stocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NaverNewsItem = {
  title: string;
  description: string;
  link: string;
  originallink?: string;
  pubDate: string;
};

type NaverNewsResponse = { items?: NaverNewsItem[] };

type FeedArticle = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  ago: string;
  tag: string;
  ticker?: string;
};

const HOUR = 60 * 60 * 1000;
const STOCK_ALIASES: Record<string, string[]> = {
  "000660.KS": ["SK하이닉스", "에스케이하이닉스"],
  "267260.KS": ["HD현대일렉트릭", "현대일렉트릭"],
  "010120.KS": ["LS ELECTRIC", "LS일렉트릭"],
  "329180.KS": ["HD현대중공업", "현대중공업"],
  "373220.KS": ["LG에너지솔루션", "LG엔솔"],
  "005490.KS": ["POSCO홀딩스", "포스코홀딩스"],
  "105560.KS": ["KB금융", "케이비금융"],
  "035420.KS": ["NAVER", "네이버"],
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function timeAgo(date: string): string {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / HOUR));
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function normalizedTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^\s*[\[【(].{0,20}?[\]】)]\s*/g, "")
    .replace(/[^0-9a-z가-힣]/g, "");
}

function uniqueArticles(items: FeedArticle[]): FeedArticle[] {
  const seenLinks = new Set<string>();
  const seenTitles: string[] = [];

  return items.filter((item) => {
    const titleKey = normalizedTitle(item.title);
    const linkKey = item.link.split("?")[0];
    const hasNearDuplicate = seenTitles.some((seenTitle) => {
      const shorter = Math.min(seenTitle.length, titleKey.length);
      const longer = Math.max(seenTitle.length, titleKey.length);
      return longer > 0 && shorter / longer >= 0.8 && (seenTitle.includes(titleKey) || titleKey.includes(seenTitle));
    });
    if (!titleKey || hasNearDuplicate || seenLinks.has(linkKey)) return false;
    seenTitles.push(titleKey);
    seenLinks.add(linkKey);
    return true;
  });
}

function hasAliasInTitle(title: string, aliases: string[]): boolean {
  const normalized = title.toLowerCase().replace(/\s/g, "");
  return aliases.some((alias) => normalized.includes(alias.toLowerCase().replace(/\s/g, "")));
}

function toArticle(item: NaverNewsItem, tag: string, ticker?: string): FeedArticle {
  const pubDate = item.pubDate;
  return {
    title: stripHtml(item.title),
    description: stripHtml(item.description),
    link: item.originallink || item.link,
    pubDate,
    ago: timeAgo(pubDate),
    tag,
    ticker,
  };
}

async function searchNews(query: string, display = 100): Promise<NaverNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("NAVER_API_KEY_MISSING");

  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(display));
  url.searchParams.set("sort", "date");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error(`NAVER_API_${response.status}`);
  const data = (await response.json()) as NaverNewsResponse;
  return data.items ?? [];
}

export async function GET() {
  try {
    const stockResults = await Promise.all(
      STOCKS.map(async (stock) => {
        const aliases = STOCK_ALIASES[stock.ticker] ?? [stock.name];
        const raw = await searchNews(stock.name);
        const articles = uniqueArticles(
          raw
            .map((item) => toArticle(item, stock.name, stock.ticker))
            .filter((item) => hasAliasInTitle(item.title, aliases))
            .filter((item) => Date.now() - new Date(item.pubDate).getTime() <= 48 * HOUR)
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        );

        const current = articles.filter(
          (item) => Date.now() - new Date(item.pubDate).getTime() <= 24 * HOUR
        );
        const previous = articles.filter((item) => {
          const age = Date.now() - new Date(item.pubDate).getTime();
          return age > 24 * HOUR && age <= 48 * HOUR;
        });

        return { stock, articles, current, previous };
      })
    );

    const ranked = stockResults
      .filter((result) => result.current.length > 0)
      .sort((a, b) => {
        const countDiff = b.current.length - a.current.length;
        if (countDiff !== 0) return countDiff;
        return new Date(b.current[0].pubDate).getTime() - new Date(a.current[0].pubDate).getTime();
      });

    const trending = ranked.slice(0, 3).map(({ stock, current, previous }) => ({
      ticker: stock.ticker,
      name: stock.name,
      count: current.length,
      change: current.length - previous.length,
    }));

    const selected: FeedArticle[] = [];
    for (const result of ranked.slice(0, 3)) {
      const representative = result.current[0] ?? result.articles[0];
      if (representative) selected.push(representative);
    }

    const marketRaw = await searchNews("코스피 환율 금리 증시", 100);
    const marketArticles = uniqueArticles(
      marketRaw
        .map((item) => toArticle(item, "시장동향"))
        .filter((item) => Date.now() - new Date(item.pubDate).getTime() <= 48 * HOUR)
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    );
    selected.push(...marketArticles.slice(0, 2));

    const topTickers = new Set(ranked.slice(0, 3).map((result) => result.stock.ticker));
    const otherCompanyArticle = stockResults
      .filter((result) => !topTickers.has(result.stock.ticker))
      .flatMap((result) => result.current.length > 0 ? result.current : result.articles)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())[0];
    if (otherCompanyArticle) selected.push(otherCompanyArticle);

    return NextResponse.json(
      { trending, articles: uniqueArticles(selected).slice(0, 6) },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("[GET /api/news/market-feed] error:", error);
    return NextResponse.json({ error: "시장 뉴스 집계를 불러오지 못했습니다." }, { status: 502 });
  }
}

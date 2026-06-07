import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function buildNaverSearchUrl(title: string, date: string): string {
  const [year, month, day] = date.split('-');
  const ds = `${year}.${month}.01`;
  const de = `${year}.${month}.${day}`;
  const query = encodeURIComponent(title.slice(0, 20));
  return `https://search.naver.com/search.naver?where=news&query=${query}&ds=${ds}&de=${de}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const limit = Number(searchParams.get('limit') ?? 20);
  const offset = Number(searchParams.get('offset') ?? 0);

  const supabase = await createClient();

  let query = supabase
    .from('curated_news')
    .select('id, title, company, ticker, news_date, category, difficulty, source_url')
    .order('news_date', { ascending: false })
    .range(offset, offset + limit - 1);

  const ticker = searchParams.get('ticker');

  if (ticker) query = query.eq('ticker', ticker);
  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // source_url 없는 뉴스는 네이버 검색 URL 자동 생성
  const enriched = (data ?? []).map((news: any) => ({
    ...news,
    source_url: news.source_url || buildNaverSearchUrl(news.title, news.news_date),
  }));

  return NextResponse.json(enriched);
}

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category');
  const difficulty = searchParams.get('difficulty');
  const limit = Number(searchParams.get('limit') ?? 20);
  const offset = Number(searchParams.get('offset') ?? 0);

  const supabase = await createClient();

  let query = supabase
    .from('curated_news')
    .select('id, title, company, ticker, news_date, category, difficulty')
    .order('news_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

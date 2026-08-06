import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: '뉴스를 찾을 수 없습니다.' }, { status: 404 });

  return NextResponse.json(data);
}

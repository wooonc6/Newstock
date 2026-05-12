const supabase = require('../../../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  const { data, error } = await supabase
    .from('curated_news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: '뉴스를 찾을 수 없습니다.' });

  res.status(200).json(data);
}

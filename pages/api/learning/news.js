const supabase = require('../../../lib/supabase');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { category, difficulty, limit = 20, offset = 0 } = req.query;

  let query = supabase
    .from('curated_news')
    .select('id, title, company, ticker, news_date, category, difficulty')
    .order('news_date', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category) query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty', difficulty);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
}

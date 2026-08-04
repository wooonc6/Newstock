-- 2026-08-04 14:28:00 KST
-- Support cumulative quiz reward and realized-return ranking aggregates.

create index if not exists quiz_sessions_user_ranking_idx
  on public.quiz_sessions (user_id)
  include (coins_earned);

create index if not exists trades_user_realized_ranking_idx
  on public.trades (user_id)
  include (cost_basis, realized_profit)
  where trade_type = 'sell';

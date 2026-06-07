export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  sectorColor: "blue" | "green" | "amber" | "purple" | "red";
  description: string;
  marketCap?: string;
}

export interface User {
  id: string;
  nickname: string;
  coins: number;
  streak: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tag: string;
}

export interface UnlockStatus {
  ticker: string;
  unlocked: boolean;
  quizzes_completed: number;
  quizzes_required: number;
}

export interface QuizPeriod {
  label: string;
  months: number;
  priceBase: number;
  priceEnd: number;
  changeRate: number;
  direction: "up" | "down";
  coins: number;
}

export interface QuizData {
  newsId: string;
  company: string;
  ticker: string;
  newsDate: string;
  headline: string;
  category: string;
  difficulty: string;
  periods: QuizPeriod[];
}

export interface NewsItem {
  id: string;
  title: string;
  company: string;
  ticker: string;
  news_date: string;
  category: string;
  difficulty: string;
  source_url?: string;
}

export interface Trade {
  id: string;
  user_id: string;
  ticker: string;
  trade_type: "buy" | "sell";
  quantity: number;
  price: number;
  coins_delta: number;
  traded_at: string;
}

export interface PortfolioHolding {
  user_id: string;
  ticker: string;
  quantity: number;
  avg_cost: number;
  updated_at: string;
}

export interface QuizSubmitResult {
  score: number;
  total: number;
  coins_earned: number;
  new_coins_total: number;
}

export interface TradeResult {
  success: boolean;
  coins_after: number;
  portfolio_after: PortfolioHolding;
}

// QuizSession에 news_id 추가
export interface QuizSession {
  id: string;
  user_id: string;
  stock_ticker: string;
  news_id: string;
  score: number;
  total: number;
  coins_earned: number;
  created_at: string;
}

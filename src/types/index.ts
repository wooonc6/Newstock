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

export interface QuizSession {
  id: string;
  user_id: string;
  stock_ticker: string;
  score: number;
  total: number;
  coins_earned: number;
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

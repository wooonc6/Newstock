"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UnlockStatus } from "@/types";
import { STOCKS } from "@/lib/stocks";

const QUIZZES_TO_UNLOCK = 3;

export function useQuizUnlock(userId?: string) {
  const [unlockMap, setUnlockMap] = useState<Record<string, UnlockStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError("");

    const defaultMap: Record<string, UnlockStatus> = {};

    STOCKS.forEach((stock) => {
      defaultMap[stock.ticker] = {
        ticker: stock.ticker,
        unlocked: false,
        quizzes_completed: 0,
        quizzes_required: QUIZZES_TO_UNLOCK,
      };
    });

    if (!userId || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setUnlockMap(defaultMap);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("stock_ticker")
        .eq("user_id", userId);

      if (error) throw error;

      const completedMap: Record<string, number> = {};

      (data ?? []).forEach((row: { stock_ticker: string }) => {
        completedMap[row.stock_ticker] =
          (completedMap[row.stock_ticker] ?? 0) + 1;
      });

      STOCKS.forEach((stock) => {
        const completed = completedMap[stock.ticker] ?? 0;

        defaultMap[stock.ticker] = {
          ticker: stock.ticker,
          unlocked: completed >= QUIZZES_TO_UNLOCK,
          quizzes_completed: completed,
          quizzes_required: QUIZZES_TO_UNLOCK,
        };
      });

      setUnlockMap(defaultMap);
    } catch (err) {
      console.error(err);
      setUnlockMap(defaultMap);
      setError("잠금 해제 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    unlockMap,
    loading,
    error,
    refetch: fetchStatus,
  };
}

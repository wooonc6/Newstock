"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UnlockStatus } from "@/types";
import { STOCKS } from "@/lib/stocks";

const QUIZZES_TO_UNLOCK = 3;

export function useQuizUnlock(userId: string | undefined) {
  const [unlockMap, setUnlockMap] = useState<Record<string, UnlockStatus>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchStatus = useCallback(async () => {
    if (!userId) {
      const defaultMap: Record<string, UnlockStatus> = {};
      STOCKS.forEach((s) => {
        defaultMap[s.ticker] = {
          ticker: s.ticker,
          unlocked: false,
          quizzes_completed: 0,
          quizzes_required: QUIZZES_TO_UNLOCK,
        };
      });
      setUnlockMap(defaultMap);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("stock_ticker")
      .eq("user_id", userId);

    if (error) {
      setLoading(false);
      return;
    }

    const countByTicker: Record<string, number> = {};
    (data ?? []).forEach((row: { stock_ticker: string }) => {
      countByTicker[row.stock_ticker] = (countByTicker[row.stock_ticker] ?? 0) + 1;
    });

    const map: Record<string, UnlockStatus> = {};
    STOCKS.forEach((s) => {
      const completed = countByTicker[s.ticker] ?? 0;
      map[s.ticker] = {
        ticker: s.ticker,
        unlocked: completed >= QUIZZES_TO_UNLOCK,
        quizzes_completed: completed,
        quizzes_required: QUIZZES_TO_UNLOCK,
      };
    });
    setUnlockMap(map);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { unlockMap, loading, refetch: fetchStatus };
}

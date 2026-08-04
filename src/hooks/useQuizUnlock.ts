"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UnlockStatus } from "@/types";
import { STOCKS } from "@/lib/stocks";

const QUIZZES_TO_UNLOCK = 3;

export function useQuizUnlock(userId: string | undefined) {
  const [unlockMap, setUnlockMap] = useState<Record<string, UnlockStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    const noSupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    setError("");

    if (!userId || noSupabase) {
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

    const supabase = createClient();
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("stock_ticker")
      .eq("user_id", userId);

    if (error) {
      console.error("[useQuizUnlock] quiz session read error:", error);
      setError("모의투자 권한 정보를 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
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

  return { unlockMap, loading, error, refetch: fetchStatus };
}

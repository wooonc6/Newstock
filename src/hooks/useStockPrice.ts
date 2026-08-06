"use client";

import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL_MS = 30_000;

export interface StockPrice {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  updatedAt: string;
}

export function useStockPrice(ticker: string) {
  const [data, setData] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPrice = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/stocks/${encodeURIComponent(ticker)}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error();
      const json = (await response.json()) as StockPrice;
      setData(json);
      setError(false);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;

    setLoading(true);
    setError(false);

    const refresh = async () => {
      if (fetching || document.visibilityState !== "visible") return;
      fetching = true;
      await fetchPrice(controller.signal);
      fetching = false;
    };

    refresh();
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchPrice]);

  return { data, loading, error };
}

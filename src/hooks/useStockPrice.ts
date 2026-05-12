"use client";

import { useState, useEffect } from "react";

export interface StockPrice {
  ticker: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
}

export function useStockPrice(ticker: string) {
  const [data, setData] = useState<StockPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`/api/stocks/${encodeURIComponent(ticker)}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [ticker]);

  return { data, loading, error };
}

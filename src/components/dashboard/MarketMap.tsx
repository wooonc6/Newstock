"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MarketMapItem = {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  price: number | null;
  changePercent: number | null;
};

type MarketMapResponse = {
  updatedAt: string;
  basis: {
    size: string;
    color: string;
    refresh: string;
  };
  items: MarketMapItem[];
};

function formatPrice(price: number | null) {
  if (price == null) return "-";
  return `${Math.round(price).toLocaleString()}원`;
}

function formatTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function getTileColor(changePercent: number | null) {
  if (changePercent == null) {
    return {
      background: "linear-gradient(135deg, #334155, #1e293b)",
      borderColor: "rgba(148, 163, 184, 0.35)",
    };
  }

  const intensity = Math.min(Math.abs(changePercent), 5) / 5;

  if (changePercent > 0) {
    const alpha = 0.35 + intensity * 0.55;
    return {
      background: `linear-gradient(135deg, rgba(185, 28, 28, ${alpha}), rgba(127, 29, 29, ${alpha}))`,
      borderColor: "rgba(248, 113, 113, 0.55)",
    };
  }

  if (changePercent < 0) {
    const alpha = 0.35 + intensity * 0.55;
    return {
      background: `linear-gradient(135deg, rgba(37, 99, 235, ${alpha}), rgba(30, 64, 175, ${alpha}))`,
      borderColor: "rgba(96, 165, 250, 0.55)",
    };
  }

  return {
    background: "linear-gradient(135deg, #475569, #334155)",
    borderColor: "rgba(148, 163, 184, 0.45)",
  };
}

function getSpan(weight: number) {
  if (weight >= 10) return { column: 3, row: 2 };
  if (weight >= 7) return { column: 2, row: 2 };
  if (weight >= 5) return { column: 2, row: 1 };
  return { column: 1, row: 1 };
}

export default function MarketMap() {
  const [data, setData] = useState<MarketMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(false);

    fetch("/api/market-map")
      .then((response) => {
        if (!response.ok) throw new Error("market map api error");
        return response.json();
      })
      .then((json: MarketMapResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    return [...(data?.items ?? [])].sort((a, b) => b.weight - a.weight);
  }, [data]);

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
        border: "1px solid rgba(148, 163, 184, 0.24)",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.26)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 800, marginBottom: "5px" }}>KOSPI MARKET MAP</div>
          <h2 style={{ margin: 0, fontSize: "18px", lineHeight: 1.35, color: "#f8fafc" }}>코스피 30종목 흐름 한눈에 보기</h2>
          <p style={{ margin: "6px 0 0", fontSize: "12px", lineHeight: 1.5, color: "#cbd5e1" }}>
            크기는 대표성 가중치, 색은 당일 등락률 기준입니다.
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "10px", lineHeight: 1.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
          <div>상승: 빨강</div>
          <div>하락: 파랑</div>
          <div>갱신: {formatTime(data?.updatedAt ?? null)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "34px 12px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>마켓맵을 불러오는 중입니다.</div>
      ) : error ? (
        <div style={{ padding: "34px 12px", textAlign: "center", color: "#cbd5e1", fontSize: "13px" }}>마켓맵 데이터를 불러오지 못했습니다.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gridAutoRows: "74px",
            gap: "6px",
          }}
        >
          {items.map((item) => {
            const changePercent = item.changePercent;
            const color = getTileColor(changePercent);
            const span = getSpan(item.weight);
            const isBig = item.weight >= 7;

            return (
              <Link
                key={item.ticker}
                href={`/stocks/${encodeURIComponent(item.ticker)}`}
                title={`${item.name} ${changePercent == null ? "" : `${changePercent.toFixed(2)}%`}`}
                style={{
                  ...color,
                  gridColumn: `span ${span.column}`,
                  gridRow: `span ${span.row}`,
                  border: `1px solid ${color.borderColor}`,
                  borderRadius: "10px",
                  padding: isBig ? "12px" : "9px",
                  color: "#fff",
                  textDecoration: "none",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minWidth: 0,
                  boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isBig ? "16px" : "12px",
                      fontWeight: 900,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </div>
                  {isBig && (
                    <div style={{ marginTop: "4px", fontSize: "10px", color: "rgba(255, 255, 255, 0.72)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.sector}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: isBig ? "18px" : "12px", fontWeight: 900 }}>
                    {changePercent == null ? "-" : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
                  </div>
                  {isBig && (
                    <div style={{ marginTop: "3px", fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "rgba(255, 255, 255, 0.72)" }}>
                      {formatPrice(item.price)}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

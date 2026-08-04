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
  kospi: {
    value: number | null;
    changePercent: number | null;
  };
  basis: {
    size: string;
    color: string;
    refresh: string;
  };
  items: MarketMapItem[];
};

const LEGEND_POINTS = [-12, -6, 0, 6, 12] as const;

function formatPrice(price: number | null) {
  if (price == null) return "-";
  return `₩${Math.round(price).toLocaleString()}`;
}

function formatIndex(value: number | null | undefined) {
  if (value == null) return "-";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  const intensity = Math.min(Math.abs(changePercent), 15) / 15;

  if (changePercent > 0) {
    const lightnessStart = 48 - intensity * 24;
    const lightnessEnd = 40 - intensity * 20;
    return {
      background: `linear-gradient(135deg, hsl(356 72% ${lightnessStart}%), hsl(354 68% ${lightnessEnd}%))`,
      borderColor: `hsl(356 78% ${Math.max(lightnessStart + 10, 34)}% / 0.62)`,
    };
  }

  if (changePercent < 0) {
    const lightnessStart = 54 - intensity * 28;
    const lightnessEnd = 46 - intensity * 23;
    return {
      background: `linear-gradient(135deg, hsl(224 74% ${lightnessStart}%), hsl(222 70% ${lightnessEnd}%))`,
      borderColor: `hsl(220 82% ${Math.max(lightnessStart + 10, 36)}% / 0.62)`,
    };
  }

  return {
    background: "linear-gradient(135deg, #475569, #334155)",
    borderColor: "rgba(148, 163, 184, 0.45)",
  };
}

function formatLegendLabel(value: number) {
  if (value === -12) return "-12% 이하";
  if (value === 12) return "+12% 이상";
  if (value > 0) return `+${value}%`;
  return `${value}%`;
}

function getSpan(weight: number) {
  if (weight >= 11.5) return { column: 4, row: 2 };
  if (weight >= 9) return { column: 3, row: 2 };
  if (weight >= 7) return { column: 2, row: 2 };
  if (weight >= 5.7) return { column: 3, row: 1 };
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

  const kospiChange = data?.kospi?.changePercent;

  return (
    <section
      style={{
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
        border: "1px solid rgba(148, 163, 184, 0.24)",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.26)",
        fontFamily: "var(--font-ui)",
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, marginBottom: "5px", letterSpacing: "0.02em" }}>KOSPI MARKET MAP</div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.01em", color: "#f8fafc" }}>
            코스피 30종목 흐름 한눈에 보기
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>
              {` | KOSPI ${formatIndex(data?.kospi?.value)}`}
              {kospiChange != null && ` (${kospiChange > 0 ? "+" : ""}${kospiChange.toFixed(2)}%)`}
            </span>
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: 400, lineHeight: 1.65, letterSpacing: 0, color: "#cbd5e1" }}>
            크기는 시가총액 상대 비율, 색은 당일 등락률 기준입니다.
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 400, lineHeight: 1.65, letterSpacing: 0, color: "#94a3b8", whiteSpace: "nowrap" }}>
          <div>상승: 빨강</div>
          <div>하락: 파랑</div>
          <div>갱신: {formatTime(data?.updatedAt ?? null)}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "34px 12px", textAlign: "center", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>마켓맵을 불러오는 중입니다.</div>
      ) : error ? (
        <div style={{ padding: "34px 12px", textAlign: "center", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>마켓맵 데이터를 불러오지 못했습니다.</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridAutoFlow: "dense",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              gridAutoRows: "74px",
              gap: "6px",
            }}
          >
            {items.map((item) => {
              const changePercent = item.changePercent;
              const color = getTileColor(changePercent);
              const span = getSpan(item.weight);
              const isBig = span.column * span.row >= 4;

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
                        fontSize: isBig ? "16px" : "13px",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </div>
                    {isBig && (
                      <div style={{ marginTop: "5px", fontSize: "11px", fontWeight: 400, lineHeight: 1.45, letterSpacing: 0, color: "rgba(255, 255, 255, 0.78)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.sector}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: isBig ? "18px" : "12px", fontWeight: 700, lineHeight: 1.25, letterSpacing: 0 }}>
                      {changePercent == null ? "-" : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
                    </div>
                    {isBig && (
                      <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: 500, lineHeight: 1.35, letterSpacing: 0, color: "rgba(255, 255, 255, 0.8)", whiteSpace: "nowrap" }}>
                        {formatPrice(item.price)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(148, 163, 184, 0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px", fontSize: "10px", color: "#94a3b8" }}>
              <span>하락</span>
              <span>등락률 색상 기준</span>
              <span>상승</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${LEGEND_POINTS.length}, minmax(0, 1fr))`, gap: "5px" }}>
              {LEGEND_POINTS.map((value) => {
                const color = getTileColor(value);
                return (
                  <div key={value} style={{ minWidth: 0 }}>
                    <div
                      style={{
                        ...color,
                        height: "10px",
                        border: `1px solid ${color.borderColor}`,
                        borderRadius: "999px",
                        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                      }}
                    />
                    <div style={{ marginTop: "5px", textAlign: "center", fontSize: "10px", lineHeight: 1.3, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {formatLegendLabel(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

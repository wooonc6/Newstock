"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const REFRESH_INTERVAL_MS = 30_000;

type MarketMapItem = {
  ticker: string;
  name: string;
  sector: string;
  weight: number;
  marketCap?: number | null;
  size?: number;
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

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type WeightedEntry<T> = {
  data: T;
  value: number;
};

type LayoutEntry<T> = WeightedEntry<T> & {
  rect: Rect;
};

type SectorGroup = {
  name: string;
  items: MarketMapItem[];
  total: number;
};

const LEGEND_POINTS = [-12, -6, 0, 6, 12] as const;
const SECTOR_GAP = 6;
const ITEM_GAP = 3;

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
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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

function getItemSize(item: MarketMapItem) {
  if (item.size != null && Number.isFinite(item.size) && item.size > 0) return item.size;
  if (item.marketCap != null && Number.isFinite(item.marketCap) && item.marketCap > 0) return item.marketCap;
  return Math.max(item.weight, 1);
}

function layoutTreemap<T>(entries: WeightedEntry<T>[], rect: Rect): LayoutEntry<T>[] {
  const sorted = entries
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0)
    .sort((a, b) => b.value - a.value);

  function split(nodes: WeightedEntry<T>[], box: Rect): LayoutEntry<T>[] {
    if (nodes.length === 0) return [];
    if (nodes.length === 1) return [{ ...nodes[0], rect: box }];

    const total = nodes.reduce((sum, node) => sum + node.value, 0);
    let prefix = 0;
    let splitIndex = 1;
    let closestDifference = Number.POSITIVE_INFINITY;

    for (let index = 1; index < nodes.length; index += 1) {
      prefix += nodes[index - 1].value;
      const difference = Math.abs(total / 2 - prefix);
      if (difference < closestDifference) {
        closestDifference = difference;
        splitIndex = index;
      }
    }

    const first = nodes.slice(0, splitIndex);
    const second = nodes.slice(splitIndex);
    const firstTotal = first.reduce((sum, node) => sum + node.value, 0);
    const firstRatio = firstTotal / total;

    if (box.width >= box.height) {
      const firstWidth = box.width * firstRatio;
      return [
        ...split(first, { ...box, width: firstWidth }),
        ...split(second, {
          x: box.x + firstWidth,
          y: box.y,
          width: box.width - firstWidth,
          height: box.height,
        }),
      ];
    }

    const firstHeight = box.height * firstRatio;
    return [
      ...split(first, { ...box, height: firstHeight }),
      ...split(second, {
        x: box.x,
        y: box.y + firstHeight,
        width: box.width,
        height: box.height - firstHeight,
      }),
    ];
  }

  return split(sorted, rect);
}

export default function MarketMap() {
  const [data, setData] = useState<MarketMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 680 });
  const mapRef = useRef<HTMLDivElement | null>(null);

  const loadMarketMap = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/market-map", { cache: "no-store", signal });
      if (!response.ok) throw new Error("market map api error");
      const json = (await response.json()) as MarketMapResponse;
      setData(json);
      setError(false);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    let fetching = false;

    setLoading(true);
    setError(false);

    const refresh = async () => {
      if (cancelled || fetching || document.visibilityState !== "visible") return;
      fetching = true;
      await loadMarketMap(controller.signal);
      fetching = false;
    };

    refresh();
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadMarketMap]);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const updateDimensions = () => {
      const next = element.getBoundingClientRect();
      if (next.width <= 0 || next.height <= 0) return;
      setDimensions((current) => {
        if (Math.abs(current.width - next.width) < 1 && Math.abs(current.height - next.height) < 1) return current;
        return { width: next.width, height: next.height };
      });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(element);
    return () => observer.disconnect();
  }, [loading]);

  const items = useMemo(() => {
    return [...(data?.items ?? [])].sort((a, b) => getItemSize(b) - getItemSize(a));
  }, [data]);

  const sectors = useMemo(() => {
    const grouped = new Map<string, MarketMapItem[]>();
    items.forEach((item) => {
      const sectorItems = grouped.get(item.sector) ?? [];
      sectorItems.push(item);
      grouped.set(item.sector, sectorItems);
    });

    return Array.from(grouped.entries())
      .map(([name, sectorItems]): SectorGroup => ({
        name,
        items: sectorItems.sort((a, b) => getItemSize(b) - getItemSize(a)),
        total: sectorItems.reduce((sum, item) => sum + getItemSize(item), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

  const sectorLayout = useMemo(() => {
    return layoutTreemap(
      sectors.map((sector) => ({ data: sector, value: sector.total })),
      { x: 0, y: 0, width: dimensions.width, height: dimensions.height }
    );
  }, [dimensions, sectors]);

  const kospiChange = data?.kospi?.changePercent;

  return (
    <section
      className="market-map-section"
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
      <div className="market-map-head" style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, marginBottom: "5px", letterSpacing: "0.02em" }}>KOSPI MARKET MAP</div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.01em", color: "#f8fafc" }}>
            코스피 30종목 산업군별 흐름
            <span style={{ color: "#94a3b8", fontWeight: 500 }}>
              {` | KOSPI ${formatIndex(data?.kospi?.value)}`}
              {kospiChange != null && ` (${kospiChange > 0 ? "+" : ""}${kospiChange.toFixed(2)}%)`}
            </span>
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: 400, lineHeight: 1.65, letterSpacing: 0, color: "#cbd5e1" }}>
            산업군은 소속 종목의 총 시가총액, 산업군 안의 종목은 각 시가총액에 비례합니다. 색은 당일 등락률 기준입니다.
          </p>
        </div>
        <div className="market-map-meta" style={{ textAlign: "right", fontSize: "11px", fontWeight: 400, lineHeight: 1.65, letterSpacing: 0, color: "#94a3b8", whiteSpace: "nowrap" }}>
          <div>상승: 빨강</div>
          <div>하락: 파랑</div>
          <div>갱신: {formatTime(data?.updatedAt ?? null)}</div>
          <div>Yahoo Finance · 30초 자동 갱신</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "34px 12px", textAlign: "center", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>마켓맵을 불러오는 중입니다.</div>
      ) : error ? (
        <div style={{ padding: "34px 12px", textAlign: "center", color: "#cbd5e1", fontSize: "13px", lineHeight: 1.6 }}>마켓맵 데이터를 불러오지 못했습니다.</div>
      ) : (
        <>
          <div
            ref={mapRef}
            className="market-map-canvas"
            style={{
              position: "relative",
              width: "100%",
              height: "clamp(620px, 72vw, 760px)",
              minWidth: 0,
              overflow: "hidden",
              borderRadius: "12px",
              background: "rgba(2, 6, 23, 0.72)",
              border: "1px solid rgba(148, 163, 184, 0.14)",
            }}
          >
            {sectorLayout.map(({ data: sector, rect }) => {
              const sectorWidth = Math.max(rect.width - SECTOR_GAP, 0);
              const sectorHeight = Math.max(rect.height - SECTOR_GAP, 0);
              const headerHeight = sectorHeight < 54 ? 0 : sectorHeight < 90 ? 20 : 27;
              const itemAreaHeight = Math.max(sectorHeight - headerHeight, 1);
              const itemLayout = layoutTreemap(
                sector.items.map((item) => ({ data: item, value: getItemSize(item) })),
                { x: 0, y: 0, width: sectorWidth, height: itemAreaHeight }
              );

              return (
                <div
                  key={sector.name}
                  title={`${sector.name} · ${sector.items.length}종목`}
                  style={{
                    position: "absolute",
                    left: rect.x + SECTOR_GAP / 2,
                    top: rect.y + SECTOR_GAP / 2,
                    width: sectorWidth,
                    height: sectorHeight,
                    overflow: "hidden",
                    borderRadius: "9px",
                    border: "2px solid rgba(226, 232, 240, 0.34)",
                    background: "rgba(15, 23, 42, 0.9)",
                    boxShadow: "0 4px 16px rgba(2, 6, 23, 0.24)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      zIndex: 3,
                      left: 0,
                      top: 0,
                      maxWidth: "100%",
                      height: headerHeight || 18,
                      padding: headerHeight ? "0 8px" : "0 6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#f8fafc",
                      background: headerHeight ? "rgba(15, 23, 42, 0.96)" : "rgba(15, 23, 42, 0.8)",
                      borderBottom: headerHeight ? "1px solid rgba(226, 232, 240, 0.18)" : "none",
                      borderBottomRightRadius: headerHeight ? 0 : "6px",
                      pointerEvents: "none",
                    }}
                  >
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: headerHeight >= 27 ? "12px" : "10px", fontWeight: 800, lineHeight: 1 }}>
                      {sector.name}
                    </span>
                    {sectorWidth >= 150 && headerHeight > 0 && (
                      <span style={{ flex: "0 0 auto", color: "#94a3b8", fontSize: "9px", fontWeight: 600 }}>
                        {sector.items.length}종목
                      </span>
                    )}
                  </div>

                  {itemLayout.map(({ data: item, rect: itemRect }) => {
                    const tileWidth = Math.max(itemRect.width - ITEM_GAP, 0);
                    const tileHeight = Math.max(itemRect.height - ITEM_GAP, 0);
                    const changePercent = item.changePercent;
                    const color = getTileColor(changePercent);
                    const isLarge = tileWidth >= 150 && tileHeight >= 82;
                    const showName = tileWidth >= 58 && tileHeight >= 34;
                    const showPrice = tileWidth >= 105 && tileHeight >= 70;

                    return (
                      <Link
                        key={item.ticker}
                        href={`/stocks/${encodeURIComponent(item.ticker)}`}
                        title={`${item.name} · ${item.sector} · ${changePercent == null ? "등락률 정보 없음" : `${changePercent.toFixed(2)}%`}`}
                        style={{
                          ...color,
                          position: "absolute",
                          left: itemRect.x + ITEM_GAP / 2,
                          top: headerHeight + itemRect.y + ITEM_GAP / 2,
                          width: tileWidth,
                          height: tileHeight,
                          border: `1px solid ${color.borderColor}`,
                          borderRadius: isLarge ? "8px" : "6px",
                          padding: isLarge ? "11px" : "6px",
                          color: "#fff",
                          textDecoration: "none",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          minWidth: 0,
                          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        {showName && (
                          <div
                            style={{
                              width: "100%",
                              fontSize: isLarge ? "15px" : tileWidth >= 90 ? "12px" : "10px",
                              fontWeight: 750,
                              lineHeight: 1.25,
                              letterSpacing: "-0.02em",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.name}
                          </div>
                        )}
                        <div style={{ marginTop: showName ? "5px" : 0, fontSize: isLarge ? "17px" : tileWidth >= 72 ? "11px" : "9px", fontWeight: 800, lineHeight: 1.15, whiteSpace: "nowrap" }}>
                          {changePercent == null ? "-" : `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
                        </div>
                        {showPrice && (
                          <div style={{ marginTop: "4px", fontSize: "10px", fontWeight: 500, lineHeight: 1.2, color: "rgba(255, 255, 255, 0.8)", whiteSpace: "nowrap" }}>
                            {formatPrice(item.price)}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="market-map-legend" style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(148, 163, 184, 0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px", fontSize: "10px", color: "#94a3b8" }}>
              <span>하락</span>
              <span>등락률 색상 기준</span>
              <span>상승</span>
            </div>
            <div className="market-map-legend-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${LEGEND_POINTS.length}, minmax(0, 1fr))`, gap: "5px" }}>
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

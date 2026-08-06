"use client";

import { useMemo, useState } from "react";
import { formatSignedWon } from "@/lib/investmentAnalytics";

export interface TimelinePoint {
  date: string;
  type: "buy" | "sell" | "now";
  ticker: string;
  name: string;
  cumulativeProfit: number;
  detail: string;
}

type Period = "1w" | "1m" | "all";

type DisplayPoint = TimelinePoint & {
  sourceIndex: number;
  synthetic?: boolean;
};

const PERIOD_LABEL: Record<Period, string> = { "1w": "1주", "1m": "1개월", all: "전체" };
const PERIOD_DAYS: Record<Period, number | null> = { "1w": 7, "1m": 30, all: null };

export default function GrowthTimeline({ points }: { points: TimelinePoint[] }) {
  const [period, setPeriod] = useState<Period>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const periodData = useMemo(() => {
    if (points.length === 0) return { points: [] as DisplayPoint[], domainStart: 0, domainEnd: 1 };

    const sorted = points
      .map((point, sourceIndex) => ({ ...point, sourceIndex }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const days = PERIOD_DAYS[period];
    const now = Date.now();

    if (!days) {
      const firstTime = new Date(sorted[0].date).getTime();
      const lastTime = new Date(sorted[sorted.length - 1].date).getTime();
      const padding = Math.max(6 * 60 * 60 * 1000, (lastTime - firstTime) * 0.04);
      return {
        points: sorted,
        domainStart: firstTime - padding,
        domainEnd: Math.max(now, lastTime) + padding,
      };
    }

    const cutoff = now - days * 86_400_000;
    const inRange = sorted.filter((point) => new Date(point.date).getTime() >= cutoff);
    const beforeRange = sorted.filter((point) => new Date(point.date).getTime() < cutoff).at(-1);
    const display: DisplayPoint[] = [];

    if (beforeRange) {
      display.push({
        ...beforeRange,
        date: new Date(cutoff).toISOString(),
        detail: `${PERIOD_LABEL[period]} 시작 시점 기준`,
        sourceIndex: -1,
        synthetic: true,
      });
    }
    display.push(...inRange);

    // 선택 기간에 거래가 없더라도 현재 평가점은 보여주되, 빈 기간이라는 사실은 안내합니다.
    const latest = sorted[sorted.length - 1];
    if (display.length === 0 || display[display.length - 1].sourceIndex !== latest.sourceIndex) {
      display.push(latest);
    }

    return { points: display, domainStart: cutoff, domainEnd: now };
  }, [period, points]);

  const filtered = periodData.points;

  if (points.length === 0) {
    return <Panel>아직 거래 내역이 없어 성장 그래프를 그릴 수 없습니다. 모의투자를 시작하면 여기에 표시돼요.</Panel>;
  }

  const width = 640;
  const height = 240;
  const padX = 38;
  const padTop = 36;
  const padBottom = 32;
  const values = filtered.map((point) => point.cumulativeProfit);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const valuePadding = Math.max(1, (maxValue - minValue) * 0.12);
  const minV = minValue - valuePadding;
  const maxV = maxValue + valuePadding;
  const range = maxV - minV || 1;
  const minT = periodData.domainStart;
  const maxT = Math.max(periodData.domainEnd, minT + 1);
  const timeRange = maxT - minT;
  const rawXFor = (t: number) => padX + ((Math.max(minT, Math.min(maxT, t)) - minT) / timeRange) * (width - padX * 2);
  const yFor = (value: number) => height - padBottom - ((value - minV) / range) * (height - padTop - padBottom);

  // 같은 날 또는 매우 가까운 시각의 거래는 화면상 좌우로 조금 펼쳐 점과 B/S 표시가 겹치지 않게 합니다.
  const positioned = filtered.map((point, index) => ({
    point,
    index,
    rawX: rawXFor(new Date(point.date).getTime()),
    y: yFor(point.cumulativeProfit),
  }));

  for (let start = 0; start < positioned.length; ) {
    let end = start + 1;
    while (end < positioned.length && positioned[end].rawX - positioned[end - 1].rawX < 15) end += 1;
    const count = end - start;
    if (count > 1) {
      const spread = Math.min(10, 28 / Math.max(1, count - 1));
      const centerOffset = ((count - 1) * spread) / 2;
      for (let i = start; i < end; i += 1) {
        positioned[i].rawX = Math.max(padX, Math.min(width - padX, positioned[i].rawX + (i - start) * spread - centerOffset));
      }
    }
    start = end;
  }

  const linePath = positioned
    .map(({ rawX, y }, index) => `${index === 0 ? "M" : "L"} ${rawX.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const zeroY = yFor(0);
  const last = filtered[filtered.length - 1];
  const lineColor = last.cumulativeProfit >= 0 ? "#ef4444" : "#2563eb";
  const active = activeIndex != null ? filtered[activeIndex] : null;
  const realTradesInPeriod = filtered.filter((point) => !point.synthetic && point.type !== "now").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
        {(Object.keys(PERIOD_LABEL) as Period[]).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={period === item}
            onClick={() => {
              setPeriod(item);
              setActiveIndex(null);
            }}
            style={{
              padding: "6px 13px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: period === item ? "var(--accent)" : "var(--surface2)",
              color: period === item ? "#fff" : "var(--text-dim)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {PERIOD_LABEL[item]}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>
          {period === "all" ? `전체 ${points.filter((point) => point.type !== "now").length}건` : `${PERIOD_LABEL[period]} 내 거래 ${realTradesInPeriod}건`}
        </span>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", minWidth: 560, height: "auto", display: "block" }}>
          <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke="var(--border)" strokeDasharray="4 4" />
          <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {positioned.map(({ point, index, rawX, y }) => {
            const isTrade = point.type !== "now" && !point.synthetic;
            const markerColor = point.synthetic ? "var(--text-muted)" : point.type === "buy" ? "#2563eb" : point.type === "sell" ? "#ef4444" : lineColor;
            const selected = activeIndex === index;
            const labelLift = index % 2 === 0 ? 13 : 25;
            return (
              <g
                key={`${point.date}-${point.sourceIndex}-${index}`}
                role="button"
                tabIndex={0}
                aria-label={`${point.name} ${point.detail}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveIndex((current) => (current === index ? null : index));
                  }
                }}
                style={{ cursor: "pointer", outline: "none" }}
              >
                <circle cx={rawX} cy={y} r={selected ? 8 : isTrade ? 5 : 6} fill={markerColor} stroke="var(--surface)" strokeWidth={selected ? 3 : 2} />
                {isTrade ? (
                  <text x={rawX} y={Math.max(12, y - labelLift)} textAnchor="middle" fontSize={9} fontWeight={900} fill={markerColor} stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                    {point.type === "buy" ? "B" : "S"}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)", minHeight: 38, lineHeight: 1.55 }}>
        {active ? (
          <span>
            <strong style={{ color: "var(--text)" }}>{active.name}</strong> · {active.detail} · 누적 실현손익 {formatSignedWon(active.cumulativeProfit)}
          </span>
        ) : period !== "all" && realTradesInPeriod === 0 ? (
          <span>선택한 {PERIOD_LABEL[period]} 동안 새 거래가 없어 기간 시작 값과 현재 평가만 표시됩니다.</span>
        ) : (
          <span>그래프의 점을 터치하거나 마우스를 올리면 거래 상세를 볼 수 있어요. 가까운 거래점은 겹치지 않도록 좌우로 펼쳐 표시됩니다.</span>
        )}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px", textAlign: "center", background: "var(--surface2)", borderRadius: "10px", fontSize: "13px", color: "var(--text-muted)" }}>
      {children}
    </div>
  );
}

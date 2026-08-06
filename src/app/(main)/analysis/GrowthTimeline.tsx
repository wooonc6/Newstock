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

const PERIOD_LABEL: Record<Period, string> = { "1w": "1주", "1m": "1개월", all: "전체" };
const PERIOD_DAYS: Record<Period, number | null> = { "1w": 7, "1m": 30, all: null };

export default function GrowthTimeline({ points }: { points: TimelinePoint[] }) {
  const [period, setPeriod] = useState<Period>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const days = PERIOD_DAYS[period];
    if (!days || points.length === 0) return points;
    const cutoff = Date.now() - days * 86_400_000;
    const kept = points.filter((p) => new Date(p.date).getTime() >= cutoff);
    const lastPoint = points[points.length - 1];
    if (kept.length === 0) return [lastPoint];
    if (kept[kept.length - 1] !== lastPoint) kept.push(lastPoint);
    return kept;
  }, [points, period]);

  if (points.length === 0) {
    return (
      <Panel>아직 거래 내역이 없어 성장 그래프를 그릴 수 없습니다. 모의투자를 시작하면 여기에 표시돼요.</Panel>
    );
  }

  const width = 640;
  const height = 220;
  const padX = 30;
  const padY = 26;

  const values = filtered.map((p) => p.cumulativeProfit);
  const minV = Math.min(0, ...values);
  const maxV = Math.max(0, ...values);
  const range = maxV - minV || 1;

  const times = filtered.map((p) => new Date(p.date).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const timeRange = maxT - minT || 1;

  const xFor = (t: number) => padX + ((t - minT) / timeRange) * (width - padX * 2);
  const yFor = (v: number) => height - padY - ((v - minV) / range) * (height - padY * 2);

  const linePath = filtered
    .map((p, i) => {
      const cmd = i === 0 ? "M" : "L";
      return `${cmd} ${xFor(new Date(p.date).getTime()).toFixed(1)} ${yFor(p.cumulativeProfit).toFixed(1)}`;
    })
    .join(" ");

  const zeroY = yFor(0);
  const last = filtered[filtered.length - 1];
  const lineColor = last.cumulativeProfit >= 0 ? "#ef4444" : "#2563eb";
  const active = activeIndex != null ? filtered[activeIndex] : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setPeriod(p);
              setActiveIndex(null);
            }}
            style={{
              padding: "6px 13px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: period === p ? "var(--accent)" : "var(--surface2)",
              color: period === p ? "#fff" : "var(--text-dim)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke="var(--border)" strokeDasharray="4 4" />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {filtered.map((p, i) => {
          const x = xFor(new Date(p.date).getTime());
          const y = yFor(p.cumulativeProfit);
          const isTrade = p.type !== "now";
          const markerColor = p.type === "buy" ? "#2563eb" : p.type === "sell" ? "#ef4444" : lineColor;
          return (
            <g
              key={`${p.date}-${i}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={x} cy={y} r={isTrade ? 5 : 6} fill={markerColor} stroke="var(--surface)" strokeWidth={2} />
              {isTrade ? (
                <text x={x} y={y - 10} textAnchor="middle" fontSize={9} fontWeight={800} fill={markerColor}>
                  {p.type === "buy" ? "B" : "S"}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-dim)", minHeight: 18 }}>
        {active ? (
          <span>
            <strong style={{ color: "var(--text)" }}>{active.name}</strong> · {active.detail} · 누적 실현손익{" "}
            {formatSignedWon(active.cumulativeProfit)}
          </span>
        ) : (
          <span>그래프의 점에 마우스를 올리면 거래 상세를 볼 수 있어요. B=매수, S=매도, 마지막 점=현재 평가</span>
        )}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "24px",
        textAlign: "center",
        background: "var(--surface2)",
        borderRadius: "10px",
        fontSize: "13px",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

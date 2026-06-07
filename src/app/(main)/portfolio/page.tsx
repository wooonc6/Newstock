"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { useStockPrice } from "@/hooks/useStockPrice";
import { STOCKS, getStock } from "@/lib/stocks";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioHolding } from "@/types";
import TradeModal from "./TradeModal";

interface HoldingRowProps {
  holding: PortfolioHolding;
  onTrade: (ticker: string) => void;
}

function HoldingRow({ holding, onTrade }: HoldingRowProps) {
  const { data: priceData, loading } = useStockPrice(holding.ticker);
  const stock = getStock(holding.ticker);
  const price = priceData?.price ?? 0;
  const pnl = price ? (price - holding.avg_cost) * holding.quantity : 0;
  const pnlPct = holding.avg_cost > 0 ? ((price - holding.avg_cost) / holding.avg_cost) * 100 : 0;
  const isUp = pnl >= 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
          {stock?.name ?? holding.ticker}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>
          {holding.quantity}주 · 평균 ₩{holding.avg_cost.toLocaleString()}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>
          {loading ? "..." : `₩${price.toLocaleString()}`}
        </div>
        {!loading && price > 0 && (
          <div style={{ fontSize: "12px", color: isUp ? "#ef4444" : "#2563eb", fontWeight: 700 }}>
            {isUp ? "+" : ""}{pnl.toLocaleString()}원 ({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)
          </div>
        )}
      </div>
      <button
        onClick={() => onTrade(holding.ticker)}
        style={{
          padding: "8px 14px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface2)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          color: "var(--text-dim)",
          whiteSpace: "nowrap",
        }}
      >
        거래
      </button>
    </div>
  );
}

interface SupportedStockRowProps {
  ticker: string;
  holding: PortfolioHolding | null;
  unlocked: boolean;
  completed: number;
  required: number;
  onTrade: (ticker: string) => void;
}

function SupportedStockRow({
  ticker,
  holding,
  unlocked,
  completed,
  required,
  onTrade,
}: SupportedStockRowProps) {
  const { data: priceData, loading } = useStockPrice(ticker);
  const stock = getStock(ticker);
  const changePercent = priceData?.changePercent ?? 0;
  const isUp = changePercent >= 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800 }}>{stock?.name ?? ticker}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>
            {ticker}
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
          {stock?.sector}
          {holding && (
            <span style={{ marginLeft: "8px", color: "var(--text-dim)" }}>
              보유 {holding.quantity}주
            </span>
          )}
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 700 }}>
          {loading ? "시세 조회 중..." : priceData?.price ? `₩${priceData.price.toLocaleString()}` : "시세 없음"}
          {priceData?.changePercent != null && (
            <span style={{ color: isUp ? "#ef4444" : "#2563eb", marginLeft: "8px", fontSize: "12px" }}>
              {isUp ? "+" : ""}{priceData.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          onClick={() => unlocked && onTrade(ticker)}
          disabled={!unlocked}
          style={{
            padding: "9px 14px",
            borderRadius: "8px",
            border: unlocked ? "none" : "1px solid var(--border)",
            background: unlocked ? "var(--accent)" : "var(--surface2)",
            color: unlocked ? "#fff" : "var(--text-muted)",
            fontSize: "12px",
            fontWeight: 800,
            cursor: unlocked ? "pointer" : "not-allowed",
            whiteSpace: "nowrap",
            opacity: unlocked ? 1 : 0.72,
          }}
        >
          {unlocked ? (holding ? "거래" : "매수") : "잠김"}
        </button>
        {!unlocked && (
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
            퀴즈 {completed}/{required}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { user, coins } = useAuth();
  const { unlockMap, loading: unlockLoading } = useQuizUnlock(user?.id);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeTarget, setTradeTarget] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    if (!user?.id) {
      setHoldings([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("portfolio")
      .select("user_id, ticker, quantity, avg_cost, updated_at")
      .eq("user_id", user.id);
    setHoldings(data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const holdingsByTicker = new Map(holdings.map((h) => [h.ticker, h]));
  const hasUnlockedStock = STOCKS.some((s) => unlockMap[s.ticker]?.unlocked);

  const tradeStock = tradeTarget ? getStock(tradeTarget) : null;
  const tradeHolding = tradeTarget ? holdings.find((h) => h.ticker === tradeTarget) ?? null : null;

  return (
    <div>
      {/* 잔고 요약 */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>보유 현금</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "22px", fontWeight: 700 }}>
          ₩{coins.toLocaleString()}
        </div>
      </div>

      {/* 지원 종목 시세판 */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-dim)" }}>
              지원 종목
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Newstock이 지원하는 종목만 실제 주가로 모의 투자할 수 있습니다.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {STOCKS.map((s) => {
            const status = unlockMap[s.ticker];
            const unlocked = Boolean(status?.unlocked);
            return (
              <SupportedStockRow
                key={s.ticker}
                ticker={s.ticker}
                holding={holdingsByTicker.get(s.ticker) ?? null}
                unlocked={unlocked}
                completed={status?.quizzes_completed ?? 0}
                required={status?.quizzes_required ?? 3}
                onTrade={setTradeTarget}
              />
            );
          })}
        </div>
        {unlockLoading && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
            투자 권한을 확인하는 중...
          </div>
        )}
      </div>

      {/* 보유 종목 */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px", color: "var(--text-dim)" }}>
          보유 종목
        </div>
        {loading ? (
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>불러오는 중...</div>
        ) : holdings.length === 0 ? (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--text-dim)",
            }}
          >
            아직 보유 종목이 없습니다. 위 지원 종목 중 언락된 종목을 매수해보세요.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {holdings.map((h) => (
              <HoldingRow key={h.ticker} holding={h} onTrade={setTradeTarget} />
            ))}
          </div>
        )}
      </div>

      {/* 아직 언락된 종목 없을 때 안내 */}
      {!loading && !unlockLoading && !hasUnlockedStock && holdings.length === 0 && (
        <div
          style={{
            background: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "13px",
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          종목별 퀴즈를 3개 풀면 모의 투자가 가능해집니다.
        </div>
      )}

      {/* TradeModal */}
      {tradeTarget && tradeStock && (
        <TradeModal
          ticker={tradeTarget}
          stockName={tradeStock.name}
          currentHolding={tradeHolding}
          onClose={() => setTradeTarget(null)}
          onSuccess={(_coins_after, _portfolio_after) => {
            fetchHoldings();
            setTradeTarget(null);
          }}
        />
      )}
    </div>
  );
}

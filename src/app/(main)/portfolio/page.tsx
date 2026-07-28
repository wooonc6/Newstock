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
        borderRadius: "10px",
        padding: "12px 14px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>
          {stock?.name ?? holding.ticker}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          {holding.quantity}주 · 평균 ₩{holding.avg_cost.toLocaleString()}
        </div>
      </div>
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>
          {loading ? "..." : `₩${price.toLocaleString()}`}
        </div>
        {!loading && price > 0 && (
          <div style={{ fontSize: "11px", color: isUp ? "#ef4444" : "#2563eb", fontWeight: 700 }}>
            {isUp ? "+" : ""}{pnl.toLocaleString()}원 ({isUp ? "+" : ""}{pnlPct.toFixed(1)}%)
          </div>
        )}
      </div>
      <button
        onClick={() => onTrade(holding.ticker)}
        style={{
          padding: "7px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "var(--surface2)",
          fontSize: "11px",
          fontWeight: 700,
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

interface SelectedStockPanelProps {
  ticker: string;
  holding: PortfolioHolding | null;
  unlocked: boolean;
  completed: number;
  required: number;
  onTrade: (ticker: string) => void;
}

function SelectedStockPanel({ ticker, holding, unlocked, completed, required, onTrade }: SelectedStockPanelProps) {
  const { data: priceData, loading } = useStockPrice(ticker);
  const stock = getStock(ticker);
  const changePercent = priceData?.changePercent ?? 0;
  const isUp = changePercent >= 0;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, var(--surface), var(--surface2))",
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "18px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "18px",
        alignItems: "center",
        minHeight: "132px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <div style={{ fontSize: "18px", fontWeight: 800 }}>{stock?.name ?? ticker}</div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{ticker}</span>
          {holding && (
            <span
              style={{
                padding: "3px 7px",
                borderRadius: "999px",
                background: "rgba(5, 124, 104, 0.09)",
                color: "#057c68",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              보유 {holding.quantity}주
            </span>
          )}
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>{stock?.sector}</div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {loading ? "시세 조회 중..." : priceData?.price ? `₩${priceData.price.toLocaleString()}` : "시세 없음"}
          </span>
          {priceData?.changePercent != null && (
            <span style={{ color: isUp ? "#ef4444" : "#2563eb", fontSize: "13px", fontWeight: 800 }}>
              {isUp ? "+" : ""}{priceData.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      <div style={{ minWidth: "112px", textAlign: "right" }}>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>
          {unlocked ? "투자 가능" : "투자 잠금"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "10px", fontWeight: 700 }}>
          퀴즈 {completed}/{required}
        </div>
        <button
          onClick={() => unlocked && onTrade(ticker)}
          disabled={!unlocked}
          style={{
            width: "100%",
            padding: "9px 14px",
            borderRadius: "9px",
            border: unlocked ? "none" : "1px solid var(--border)",
            background: unlocked ? "#057c68" : "var(--surface3)",
            color: unlocked ? "#fff" : "var(--text-muted)",
            fontSize: "12px",
            fontWeight: 800,
            cursor: unlocked ? "pointer" : "not-allowed",
          }}
        >
          {unlocked ? (holding ? "거래" : "매수") : "잠김"}
        </button>
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
  const [selectedTicker, setSelectedTicker] = useState(STOCKS[0]?.ticker ?? "");

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
  const selectedStatus = unlockMap[selectedTicker];
  const selectedHolding = holdingsByTicker.get(selectedTicker) ?? null;

  const tradeStock = tradeTarget ? getStock(tradeTarget) : null;
  const tradeHolding = tradeTarget ? holdings.find((h) => h.ticker === tradeTarget) ?? null : null;

  return (
    <div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "14px 18px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>보유 현금</div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>₩{coins.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>보유 종목</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{holdings.length}개</div>
        </div>
      </div>

      <section style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-dim)" }}>지원 종목</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            종목을 선택해 시세와 투자 가능 여부를 확인하세요.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "7px",
            overflowX: "auto",
            paddingBottom: "8px",
            scrollbarWidth: "thin",
          }}
        >
          {STOCKS.map((stock) => {
            const selected = stock.ticker === selectedTicker;
            const unlocked = Boolean(unlockMap[stock.ticker]?.unlocked);
            return (
              <button
                key={stock.ticker}
                onClick={() => setSelectedTicker(stock.ticker)}
                style={{
                  flex: "0 0 auto",
                  padding: "8px 12px",
                  borderRadius: "9px",
                  border: selected ? "1px solid rgba(5, 124, 104, 0.42)" : "1px solid var(--border)",
                  background: selected ? "rgba(5, 124, 104, 0.09)" : "var(--surface)",
                  color: selected ? "#057c68" : "var(--text-dim)",
                  fontSize: "11px",
                  fontWeight: selected ? 800 : 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {stock.name}
                <span style={{ fontSize: "9px", opacity: 0.7 }}>{unlocked ? "열림" : "잠김"}</span>
              </button>
            );
          })}
        </div>

        {selectedTicker && (
          <SelectedStockPanel
            ticker={selectedTicker}
            holding={selectedHolding}
            unlocked={Boolean(selectedStatus?.unlocked)}
            completed={selectedStatus?.quizzes_completed ?? 0}
            required={selectedStatus?.quizzes_required ?? 3}
            onTrade={setTradeTarget}
          />
        )}

        {unlockLoading && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
            투자 권한을 확인하는 중...
          </div>
        )}
      </section>

      <section style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "var(--text-dim)" }}>보유 종목</div>
        {loading ? (
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>불러오는 중...</div>
        ) : holdings.length === 0 ? (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "16px",
              textAlign: "center",
              fontSize: "12px",
              color: "var(--text-dim)",
            }}
          >
            아직 보유 종목이 없습니다. 언락된 종목을 매수해보세요.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {holdings.map((h) => <HoldingRow key={h.ticker} holding={h} onTrade={setTradeTarget} />)}
          </div>
        )}
      </section>

      {!loading && !unlockLoading && !hasUnlockedStock && holdings.length === 0 && (
        <div
          style={{
            background: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.15)",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "12px",
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          종목별 퀴즈를 3개 풀면 모의 투자가 가능해집니다.
        </div>
      )}

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

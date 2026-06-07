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
          <div style={{ fontSize: "12px", color: isUp ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
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

interface UnlockedStockRowProps {
  ticker: string;
  onTrade: (ticker: string) => void;
}

function UnlockedStockRow({ ticker, onTrade }: UnlockedStockRowProps) {
  const { data: priceData, loading } = useStockPrice(ticker);
  const stock = getStock(ticker);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700 }}>{stock?.name ?? ticker}</div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          {loading ? "..." : priceData?.price ? `₩${priceData.price.toLocaleString()}` : "-"}
          {priceData?.changePercent != null && (
            <span style={{ color: priceData.changePercent >= 0 ? "#22c55e" : "#ef4444", marginLeft: "6px" }}>
              {priceData.changePercent >= 0 ? "+" : ""}{priceData.changePercent.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onTrade(ticker)}
        style={{
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        매수
      </button>
    </div>
  );
}

export default function PortfolioPage() {
  const { user, coins } = useAuth();
  const { unlockMap } = useQuizUnlock(user?.id);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeTarget, setTradeTarget] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    if (!user?.id) return;
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

  const holdingTickers = new Set(holdings.map((h) => h.ticker));
  const unlockedWithoutHoldings = STOCKS.filter(
    (s) => unlockMap[s.ticker]?.unlocked && !holdingTickers.has(s.ticker)
  );

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
            아직 보유 종목이 없습니다. 아래에서 언락된 종목을 매수해보세요.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {holdings.map((h) => (
              <HoldingRow key={h.ticker} holding={h} onTrade={setTradeTarget} />
            ))}
          </div>
        )}
      </div>

      {/* 언락됐지만 미보유 종목 */}
      {unlockedWithoutHoldings.length > 0 && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px", color: "var(--text-dim)" }}>
            투자 가능한 종목
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {unlockedWithoutHoldings.map((s) => (
              <UnlockedStockRow key={s.ticker} ticker={s.ticker} onTrade={setTradeTarget} />
            ))}
          </div>
        </div>
      )}

      {/* 아직 언락된 종목 없을 때 안내 */}
      {!loading && unlockedWithoutHoldings.length === 0 && holdings.length === 0 && (
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

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { useStockPrice } from "@/hooks/useStockPrice";
import { STOCKS, getStock } from "@/lib/stocks";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioHolding } from "@/types";
import TradeModal from "./TradeModal";
import ConditionalOrders from "./ConditionalOrders";

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

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

interface StockListRowProps {
  ticker: string;
  selected: boolean;
  unlocked: boolean;
  holding: PortfolioHolding | null;
  onSelect: (ticker: string) => void;
}

function StockListRow({ ticker, selected, unlocked, holding, onSelect }: StockListRowProps) {
  const { data: priceData, loading } = useStockPrice(ticker);
  const stock = getStock(ticker);
  const changePercent = priceData?.changePercent;
  const isUp = (changePercent ?? 0) >= 0;

  return (
    <button
      onClick={() => onSelect(ticker)}
      style={{
        width: "100%",
        border: "none",
        borderBottom: "1px solid var(--border)",
        background: selected ? "rgba(5, 124, 104, 0.075)" : "transparent",
        padding: "11px 12px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        gap: "12px",
        alignItems: "center",
        cursor: "pointer",
        color: "inherit",
        textAlign: "left",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: selected ? 800 : 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {stock?.name ?? ticker}
          </span>
          {holding && <span style={{ fontSize: "9px", color: "#057c68", fontWeight: 800 }}>보유</span>}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{ticker}</div>
      </div>

      <div style={{ textAlign: "right", minWidth: "80px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
          {loading ? "..." : priceData?.price ? `₩${priceData.price.toLocaleString()}` : "-"}
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{stock?.sector}</div>
      </div>

      <div style={{ minWidth: "58px", textAlign: "right" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, color: changePercent == null ? "var(--text-muted)" : isUp ? "#ef4444" : "#2563eb" }}>
          {changePercent == null ? "-" : `${isUp ? "+" : ""}${changePercent.toFixed(2)}%`}
        </div>
        <div style={{ fontSize: "9px", color: unlocked ? "#057c68" : "var(--text-muted)", marginTop: "3px", fontWeight: 700 }}>
          {unlocked ? "✅ 거래 가능" : "🔒 잠김"}
        </div>
      </div>
    </button>
  );
}

interface OrderPanelProps {
  ticker: string;
  holding: PortfolioHolding | null;
  unlocked: boolean;
  completed: number;
  required: number;
  onTrade: (ticker: string) => void;
}

function OrderPanel({ ticker, holding, unlocked, completed, required, onTrade }: OrderPanelProps) {
  const { data: priceData, loading } = useStockPrice(ticker);
  const stock = getStock(ticker);
  const changePercent = priceData?.changePercent;
  const isUp = (changePercent ?? 0) >= 0;

  return (
    <div style={{ padding: "18px", minHeight: "320px", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "10px" }}>
        📈 선택 종목
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em" }}>{stock?.name ?? ticker}</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{ticker} · {stock?.sector}</div>
        </div>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "999px",
            background: unlocked ? "rgba(5, 124, 104, 0.09)" : "var(--surface2)",
            color: unlocked ? "#057c68" : "var(--text-muted)",
            fontSize: "10px",
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {unlocked ? "✅ 투자 가능" : "🔒 투자 잠금"}
        </span>
      </div>

      <div style={{ padding: "22px 0 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>현재가</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em" }}>
            {loading ? "시세 조회 중..." : priceData?.price ? `₩${priceData.price.toLocaleString()}` : "시세 없음"}
          </span>
          {changePercent != null && (
            <span style={{ color: isUp ? "#ef4444" : "#2563eb", fontSize: "13px", fontWeight: 800 }}>
              {isUp ? "+" : ""}{changePercent.toFixed(2)}%
            </span>
          )}
        </div>
        {!loading && (
          <div style={{ marginTop: "7px", fontSize: "10px", color: "var(--text-muted)" }}>
            Yahoo Finance 기준 · 30초 자동 갱신 · 갱신 {formatUpdatedAt(priceData?.updatedAt)}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "16px 0" }}>
        <div style={{ background: "var(--surface2)", borderRadius: "9px", padding: "11px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>보유 수량</div>
          <div style={{ fontSize: "13px", fontWeight: 800 }}>{holding ? `${holding.quantity}주` : "0주"}</div>
        </div>
        <div style={{ background: "var(--surface2)", borderRadius: "9px", padding: "11px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>평균 매수가</div>
          <div style={{ fontSize: "13px", fontWeight: 800 }}>{holding ? `₩${holding.avg_cost.toLocaleString()}` : "-"}</div>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
        {unlocked
          ? "✅ 현재 이 종목을 모의 투자할 수 있습니다."
          : `저장된 퀴즈 ${completed}/${required} · 문제별 저장이므로 ${required}개를 채우는 즉시 거래할 수 있습니다.`}
      </div>

      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
        <button
          onClick={() => unlocked && onTrade(ticker)}
          disabled={!unlocked}
          style={{
            border: unlocked ? "none" : "1px solid var(--border)",
            borderRadius: "9px",
            padding: "11px 14px",
            background: unlocked ? "#057c68" : "var(--surface2)",
            color: unlocked ? "#fff" : "var(--text-muted)",
            fontSize: "12px",
            fontWeight: 800,
            cursor: unlocked ? "pointer" : "not-allowed",
          }}
        >
          {unlocked ? `🛒 ${holding ? "거래하기" : "매수하기"}` : "🔒 잠금 상태"}
        </button>
        <Link
          href={
            unlocked
              ? `/stocks/${encodeURIComponent(ticker)}`
              : `/quiz/${encodeURIComponent(ticker)}`
          }
          style={{
            border: "1px solid var(--border)",
            borderRadius: "9px",
            padding: "11px 12px",
            background: "var(--surface)",
            color: "var(--text-dim)",
            fontSize: "11px",
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {unlocked ? "🔍 종목 보기" : "🎯 퀴즈 이어 풀기"}
        </Link>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { user, coins, refreshUser } = useAuth();
  const { unlockMap, loading: unlockLoading, error: unlockError } = useQuizUnlock(user?.id);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeTarget, setTradeTarget] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState(STOCKS[0]?.ticker ?? "");
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);

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

  const handlePortfolioChanged = useCallback(() => {
    fetchHoldings();
    refreshUser();
  }, [fetchHoldings, refreshUser]);

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
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>💰 보유 모의현금</div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>₩{coins.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>💼 보유 종목</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{holdings.length}개</div>
        </div>
      </div>

      <section style={{ marginBottom: "16px" }}>
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-dim)" }}>📋 지원 종목</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
            종목을 선택해 현재가와 투자 가능 여부를 확인하세요.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div style={{ borderRight: "1px solid var(--border)", minWidth: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto auto",
                gap: "12px",
                padding: "9px 12px",
                background: "var(--surface2)",
                borderBottom: "1px solid var(--border)",
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 700,
              }}
            >
              <span>종목</span>
              <span style={{ minWidth: "80px", textAlign: "right" }}>현재가</span>
              <span style={{ minWidth: "58px", textAlign: "right" }}>등락률</span>
            </div>
            <div style={{ height: "320px", overflowY: "auto", scrollbarWidth: "thin" }}>
              {STOCKS.map((stock) => (
                <StockListRow
                  key={stock.ticker}
                  ticker={stock.ticker}
                  selected={stock.ticker === selectedTicker}
                  unlocked={Boolean(unlockMap[stock.ticker]?.unlocked)}
                  holding={holdingsByTicker.get(stock.ticker) ?? null}
                  onSelect={setSelectedTicker}
                />
              ))}
            </div>
          </div>

          {selectedTicker && (
            <OrderPanel
              ticker={selectedTicker}
              holding={selectedHolding}
              unlocked={Boolean(selectedStatus?.unlocked)}
              completed={selectedStatus?.quizzes_completed ?? 0}
              required={selectedStatus?.quizzes_required ?? 3}
              onTrade={setTradeTarget}
            />
          )}
        </div>

        {unlockLoading && (
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
            투자 권한을 확인하는 중...
          </div>
        )}
        {!unlockLoading && unlockError && (
          <div
            role="alert"
            style={{ fontSize: "11px", color: "var(--danger)", marginTop: "6px" }}
          >
            {unlockError}
          </div>
        )}
      </section>

      <ConditionalOrders
        refreshKey={ordersRefreshKey}
        onPortfolioChanged={handlePortfolioChanged}
      />

      <section style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "var(--text-dim)" }}>💼 보유 종목</div>
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

      {!loading && !unlockLoading && !unlockError && !hasUnlockedStock && holdings.length === 0 && (
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
          종목별 퀴즈 답안이 문제마다 저장되며, 3개가 저장되는 즉시 해당 종목의 모의 투자가 열립니다.
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
            setOrdersRefreshKey((key) => key + 1);
            setTradeTarget(null);
          }}
        />
      )}
    </div>
  );
}

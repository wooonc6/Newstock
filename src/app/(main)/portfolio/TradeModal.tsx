"use client";

import { useEffect, useState } from "react";
import { useTradingPrice } from "@/hooks/useTradingPrice";
import { useAuth } from "@/context/AuthContext";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import type { PortfolioHolding } from "@/types";

interface Props {
  ticker: string;
  stockName: string;
  currentHolding: PortfolioHolding | null;
  onClose: () => void;
  onSuccess: (coins_after: number, portfolio_after: PortfolioHolding | null) => void;
}

type TradeType = "buy" | "sell";
type OrderMode = "market" | "conditional";
type ConditionType = "at_or_below" | "at_or_above";

export default function TradeModal({ ticker, stockName, currentHolding, onClose, onSuccess }: Props) {
  const { coins, refreshUser } = useAuth();
  const { data: priceData, loading: priceLoading } = useTradingPrice(ticker);
  const marketStatus = useMarketStatus();
  const [tradeType, setTradeType] = useState<TradeType>("buy");
  const [orderMode, setOrderMode] = useState<OrderMode>("market");
  const [conditionType, setConditionType] = useState<ConditionType>("at_or_below");
  const [quantity, setQuantity] = useState(1);
  const [targetPrice, setTargetPrice] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = priceData?.price ?? 0;
  const maxBuy = price > 0 ? Math.floor(coins / price) : 0;
  const maxSell = Math.floor(currentHolding?.quantity ?? 0);
  const maxQuantity = tradeType === "buy" ? maxBuy : maxSell;
  const referencePrice = orderMode === "conditional" ? targetPrice : price;
  const totalAmount = Math.round(referencePrice * quantity);
  const avgCost = Number(currentHolding?.avg_cost ?? 0);
  const expectedProfit = tradeType === "sell" ? Math.round((referencePrice - avgCost) * quantity) : 0;
  const expectedReturn = tradeType === "sell" && avgCost > 0
    ? ((referencePrice - avgCost) / avgCost) * 100
    : 0;
  const isProfit = expectedProfit >= 0;
  const isMarketOrder = orderMode === "market";
  const canSubmitInCurrentSession = !isMarketOrder || marketStatus.newstock.canTradeNow;

  useEffect(() => {
    if (price > 0 && targetPrice <= 0) setTargetPrice(Math.round(price));
  }, [price, targetPrice]);

  const canTrade =
    !loading &&
    !priceLoading &&
    price > 0 &&
    quantity > 0 &&
    quantity <= maxQuantity &&
    referencePrice > 0 &&
    canSubmitInCurrentSession &&
    (tradeType === "buy" ? totalAmount <= coins : maxSell > 0);

  function selectTradeType(type: TradeType) {
    setTradeType(type);
    setQuantity(1);
    setConditionType("at_or_below");
    setConfirming(false);
    setError(null);
  }

  async function handleSubmit() {
    if (!canTrade) return;
    setLoading(true);
    setError(null);

    const endpoint = orderMode === "market" ? "/api/trade" : "/api/orders";
    const body = orderMode === "market"
      ? { ticker, trade_type: tradeType, quantity }
      : { ticker, trade_type: tradeType, condition_type: conditionType, quantity, target_price: targetPrice };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "거래 실패");

      await refreshUser();
      onSuccess(data.coins_after ?? coins, data.portfolio_after ?? currentHolding);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "거래에 실패했습니다.");
      setConfirming(false);
      setLoading(false);
    }
  }

  const buttonLabel = orderMode === "market"
    ? `${quantity}주 ${tradeType === "buy" ? "매수" : "매도"}`
    : `${quantity}주 조건 주문 등록`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${stockName} 모의거래`}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "flex-end", justifyContent: "center", zIndex: 100,
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "20px 20px 0 0", padding: "24px", width: "100%", maxWidth: "740px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{stockName} 거래</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>시장 구간별 Newstock 기준가로 체결합니다.</div>
          </div>
          <button aria-label="거래 창 닫기" onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", background: marketStatus.newstock.canTradeNow ? "rgba(5,124,104,0.07)" : "var(--surface2)", padding: "12px 14px", marginBottom: "14px", display: "grid", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: "13px", color: marketStatus.newstock.canTradeNow ? "#057c68" : "var(--text-dim)" }}>
              {marketStatus.newstock.label}
            </strong>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--text-muted)" }}>
              KST {marketStatus.timeText}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: 1.55 }}>
            {marketStatus.newstock.description} 가격 기준: {priceData?.priceBasis ?? marketStatus.newstock.priceBasis}
          </div>
          {!marketStatus.newstock.canTradeNow && (
            <div style={{ fontSize: "11px", color: "#b45309", lineHeight: 1.5 }}>
              즉시 거래는 {marketStatus.nextOpenText}부터 가능하고, 조건 주문 등록은 지금도 가능합니다.
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "12px" }}>
          {(["market", "conditional"] as const).map((mode) => (
            <button key={mode} onClick={() => { setOrderMode(mode); setConfirming(false); setError(null); }} style={{ padding: "10px", borderRadius: "9px", border: "1px solid var(--border)", background: orderMode === mode ? "rgba(5,124,104,0.1)" : "var(--surface)", color: orderMode === mode ? "#057c68" : "var(--text-dim)", fontWeight: 800, cursor: "pointer" }}>
              {mode === "market" ? "즉시 거래" : "조건 거래"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", background: "var(--surface)", borderRadius: "10px", padding: "4px", marginBottom: "20px" }}>
          {(["buy", "sell"] as const).map((type) => (
            <button key={type} onClick={() => selectTradeType(type)} disabled={type === "sell" && maxSell <= 0} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: tradeType === type ? (type === "buy" ? "var(--accent)" : "#ef4444") : "transparent", color: tradeType === type ? "#fff" : "var(--text-dim)", fontSize: "13px", fontWeight: 700, cursor: type === "sell" && maxSell <= 0 ? "not-allowed" : "pointer", opacity: type === "sell" && maxSell <= 0 ? 0.45 : 1 }}>
              {type === "buy" ? "매수" : "매도"}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>모의투자 기준가</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "18px", fontWeight: 700 }}>{priceLoading ? "로딩 중..." : `₩${price.toLocaleString()}`}</div>
          {!priceLoading && (
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "5px", lineHeight: 1.45 }}>
              {priceData?.priceLabel ?? "Newstock 기준가"} · 대시보드 시세와 다를 수 있음
            </div>
          )}
        </div>

        {orderMode === "conditional" && (
          <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
            {tradeType === "sell" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
                <button onClick={() => setConditionType("at_or_above")} style={{ padding: "9px", borderRadius: "8px", border: conditionType === "at_or_above" ? "1px solid #ef4444" : "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>목표가 매도(이상)</button>
                <button onClick={() => setConditionType("at_or_below")} style={{ padding: "9px", borderRadius: "8px", border: conditionType === "at_or_below" ? "1px solid #2563eb" : "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>손절가 매도(이하)</button>
              </div>
            )}
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }} htmlFor="target-price">
              {tradeType === "buy" ? "이 가격 이하가 되면 매수" : conditionType === "at_or_above" ? "이 가격 이상이 되면 매도" : "이 가격 이하가 되면 매도"}
            </label>
            <input id="target-price" type="number" min={1} step={1} value={targetPrice || ""} onChange={(event) => setTargetPrice(Math.max(0, Number(event.target.value)))} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "15px", fontWeight: 700, boxSizing: "border-box" }} />
            <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "7px" }}>조건 충족 후 Newstock 세션이 열려 있을 때 모의투자 기준가로 체결됩니다.</div>
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>수량</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tradeType === "buy" ? `기준가 기준 최대 ${maxBuy}주` : `보유 ${maxSell}주`}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "18px", cursor: "pointer", color: "var(--text)" }}>−</button>
            <input type="number" min={1} max={maxQuantity} value={quantity} onChange={(event) => { const next = Math.max(1, Number(event.target.value)); setQuantity(maxQuantity > 0 ? Math.min(next, maxQuantity) : 1); }} style={{ flex: 1, textAlign: "center", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "16px", fontFamily: "var(--font-ui)", fontWeight: 700, color: "var(--text)" }} />
            <button onClick={() => setQuantity((value) => (maxQuantity > 0 ? Math.min(maxQuantity, value + 1) : value))} style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "18px", cursor: "pointer", color: "var(--text)" }}>+</button>
          </div>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "10px", padding: "12px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>{orderMode === "conditional" ? "목표가 기준 예상 금액" : `총 ${tradeType === "buy" ? "매수" : "매도"}금액`}</div>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: 700 }}>₩{totalAmount.toLocaleString()}</div>
        </div>

        {tradeType === "sell" && referencePrice > 0 && (
          <div style={{ background: isProfit ? "rgba(239,68,68,0.06)" : "rgba(37,99,235,0.07)", border: `1px solid ${isProfit ? "rgba(239,68,68,0.18)" : "rgba(37,99,235,0.18)"}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px" }}><span style={{ color: "var(--text-muted)" }}>평균 매수가</span><strong>₩{avgCost.toLocaleString()}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "7px", fontSize: "13px", color: isProfit ? "#ef4444" : "#2563eb" }}><span>{orderMode === "conditional" ? "목표가 기준 예상 수익률" : "이번 매도 수익률"}</span><strong>{isProfit ? "+" : ""}{expectedReturn.toFixed(2)}% ({isProfit ? "+" : ""}{expectedProfit.toLocaleString()}원)</strong></div>
          </div>
        )}

        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", textAlign: "right" }}>
          보유 모의현금: ₩{coins.toLocaleString()}
          {orderMode === "market" && tradeType === "buy" && totalAmount > 0 && <span> → 매수 후 {(coins - totalAmount).toLocaleString()}원</span>}
        </div>

        {confirming && (
          <div style={{ border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "12px", padding: "14px", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "6px" }}>정말 {tradeType === "buy" ? "매수" : "매도"}하시겠습니까?</div>
            <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.6 }}>
              {stockName} {quantity}주 · {orderMode === "market" ? `예상 체결가 ₩${price.toLocaleString()} (${priceData?.priceLabel ?? "Newstock 기준가"})` : `조건가 ₩${targetPrice.toLocaleString()}`}
              {tradeType === "sell" && <><br />{orderMode === "market" ? "이번 매도" : "목표가 기준 예상"} 수익률 <strong style={{ color: isProfit ? "#ef4444" : "#2563eb" }}>{isProfit ? "+" : ""}{expectedReturn.toFixed(2)}%</strong></>}
            </div>
          </div>
        )}

        {error && <div role="alert" style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
        {isMarketOrder && !marketStatus.newstock.canTradeNow && (
          <div role="status" style={{ color: "#b45309", fontSize: "12px", marginBottom: "12px", lineHeight: 1.55 }}>
            지금은 즉시 거래 시간이 아닙니다. 조건 거래로 바꾸면 주문을 등록할 수 있습니다.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: confirming ? "1fr 2fr" : "1fr", gap: "8px" }}>
          {confirming && <button onClick={() => setConfirming(false)} disabled={loading} style={{ padding: "15px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-dim)", fontWeight: 700, cursor: "pointer" }}>다시 확인</button>}
          <button onClick={() => confirming ? handleSubmit() : setConfirming(true)} disabled={!canTrade} style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: tradeType === "buy" ? "var(--accent)" : "#ef4444", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", opacity: canTrade ? 1 : 0.55 }}>
            {loading ? "처리 중..." : !canSubmitInCurrentSession ? "즉시 거래 시간 아님" : maxQuantity <= 0 ? "거래 가능 수량 없음" : confirming ? `${orderMode === "market" ? "거래" : "조건 주문"} 확정` : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useStockPrice } from "@/hooks/useStockPrice";
import { useAuth } from "@/context/AuthContext";
import type { PortfolioHolding } from "@/types";

interface Props {
  ticker: string;
  stockName: string;
  currentHolding: PortfolioHolding | null;
  onClose: () => void;
  onSuccess: (coins_after: number, portfolio_after: PortfolioHolding | null) => void;
}

export default function TradeModal({ ticker, stockName, currentHolding, onClose, onSuccess }: Props) {
  const { coins, refreshUser } = useAuth();
  const { data: priceData, loading: priceLoading } = useStockPrice(ticker);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = priceData?.price ?? 0;
  const totalCost = Math.round(price * quantity);
  const maxBuy = price > 0 ? Math.floor(coins / price) : 0;
  const maxSell = Math.floor(currentHolding?.quantity ?? 0);
  const maxQuantity = tradeType === "buy" ? maxBuy : maxSell;
  const canTrade =
    !loading &&
    !priceLoading &&
    price > 0 &&
    quantity > 0 &&
    quantity <= maxQuantity &&
    (tradeType === "buy" ? totalCost <= coins : maxSell > 0);

  async function handleTrade() {
    if (!canTrade) return;
    setLoading(true);
    setError(null);

    const r = await fetch("/api/trade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, trade_type: tradeType, quantity }),
    });
    const data = await r.json();

    if (!r.ok) {
      setError(data.error ?? "거래 실패");
      setLoading(false);
      return;
    }

    await refreshUser();
    onSuccess(data.coins_after, data.portfolio_after);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "20px 20px 0 0",
          padding: "24px",
          width: "100%",
          maxWidth: "740px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{stockName} 거래</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              실제 현재가를 기준으로 모의 매수/매도합니다.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* buy / sell 토글 */}
        <div
          style={{
            display: "flex",
            background: "var(--surface)",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "20px",
          }}
        >
          {(["buy", "sell"] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setTradeType(type); setQuantity(1); setError(null); }}
              disabled={type === "sell" && maxSell <= 0}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: tradeType === type ? (type === "buy" ? "var(--accent)" : "#ef4444") : "transparent",
                color: tradeType === type ? "#fff" : "var(--text-dim)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: type === "sell" && maxSell <= 0 ? "not-allowed" : "pointer",
                opacity: type === "sell" && maxSell <= 0 ? 0.45 : 1,
              }}
            >
              {type === "buy" ? "매수" : "매도"}
            </button>
          ))}
        </div>

        {/* 현재가 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>현재가</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "18px", fontWeight: 700 }}>
            {priceLoading ? "로딩 중..." : `₩${price.toLocaleString()}`}
          </div>
        </div>

        {/* 수량 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>수량</div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {tradeType === "buy" ? `최대 ${maxBuy}주 가능` : `보유 ${maxSell}주`}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--surface)",
                fontSize: "18px", cursor: "pointer", color: "var(--text)",
              }}
            >−</button>
            <input
              type="number"
              min={1}
              max={tradeType === "buy" ? maxBuy : maxSell}
              value={quantity}
              onChange={(e) => {
                const next = Math.max(1, Number(e.target.value));
                setQuantity(maxQuantity > 0 ? Math.min(next, maxQuantity) : 1);
              }}
              style={{
                flex: 1, textAlign: "center", padding: "8px",
                borderRadius: "8px", border: "1px solid var(--border)",
                background: "var(--surface)", fontSize: "16px",
                fontFamily: "'Space Mono', monospace", fontWeight: 700,
                color: "var(--text)",
              }}
            />
            <button
              onClick={() => setQuantity((q) => (maxQuantity > 0 ? Math.min(maxQuantity, q + 1) : q))}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--surface)",
                fontSize: "18px", cursor: "pointer", color: "var(--text)",
              }}
            >+</button>
          </div>
        </div>

        {/* 총액 */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--text-dim)" }}>총 {tradeType === "buy" ? "매수" : "매도"}금액</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", fontWeight: 700 }}>
            ₩{totalCost.toLocaleString()}
          </div>
        </div>

        {/* 잔고 */}
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", textAlign: "right" }}>
          보유 현금: ₩{coins.toLocaleString()}
          {tradeType === "buy" && totalCost > 0 && (
            <span> → 매수 후 {(coins - totalCost).toLocaleString()}원</span>
          )}
        </div>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>{error}</div>
        )}

        <button
          onClick={handleTrade}
          disabled={!canTrade}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: tradeType === "buy" ? "var(--accent)" : "#ef4444",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            opacity: canTrade ? 1 : 0.55,
          }}
        >
          {loading ? "처리 중..." : maxQuantity <= 0 ? "거래 가능 수량 없음" : `${quantity}주 ${tradeType === "buy" ? "매수" : "매도"}`}
        </button>
      </div>
    </div>
  );
}

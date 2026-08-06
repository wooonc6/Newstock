"use client";

import { getStock } from "@/lib/stocks";

export interface TradeHistoryItem {
  id: string;
  ticker: string | null;
  trade_type: "buy" | "sell" | null;
  quantity: number | string | null;
  price: number | string | null;
  coins_delta: number | string | null;
  cost_basis?: number | string | null;
  realized_profit?: number | string | null;
  traded_at: string | null;
}

function formatTradeTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function TradeHistoryList({ trades, emptyText }: { trades: TradeHistoryItem[]; emptyText: string }) {
  if (trades.length === 0) {
    return <Panel>{emptyText}</Panel>;
  }

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      {trades.map((trade) => {
        const ticker = trade.ticker ?? "";
        const stock = getStock(ticker);
        const quantity = Number(trade.quantity ?? 0);
        const price = Number(trade.price ?? 0);
        const coinsDelta = Number(trade.coins_delta ?? 0);
        const realizedProfit = Number(trade.realized_profit ?? 0);
        const isSell = trade.trade_type === "sell";
        const isProfit = realizedProfit >= 0;

        return (
          <div key={trade.id} className="trade-history-card" style={{ padding: "12px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface2)", display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                  <span style={{ padding: "3px 7px", borderRadius: "999px", background: isSell ? "rgba(239,68,68,0.10)" : "rgba(37,99,235,0.10)", color: isSell ? "#ef4444" : "#2563eb", fontSize: "11px", fontWeight: 900 }}>
                    {isSell ? "매도" : "매수"}
                  </span>
                  <strong style={{ fontSize: "13px" }}>{stock?.name ?? ticker}</strong>
                </div>
                <div style={{ marginTop: "5px", fontSize: "11px", color: "var(--text-muted)" }}>{formatTradeTime(trade.traded_at)}</div>
              </div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div style={{ fontSize: "13px", fontWeight: 900 }}>₩{Math.abs(coinsDelta).toLocaleString()}</div>
                <div style={{ marginTop: "3px", fontSize: "10px", color: "var(--text-muted)" }}>{quantity}주 · ₩{price.toLocaleString()}</div>
              </div>
            </div>

            {isSell && (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingTop: "8px", borderTop: "1px solid var(--border)", fontSize: "11px" }}>
                <span style={{ color: "var(--text-muted)" }}>실현 손익</span>
                <strong style={{ color: isProfit ? "#ef4444" : "#2563eb" }}>{isProfit ? "+" : ""}₩{realizedProfit.toLocaleString()}</strong>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "20px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", color: "var(--text-muted)" }}>{children}</div>;
}

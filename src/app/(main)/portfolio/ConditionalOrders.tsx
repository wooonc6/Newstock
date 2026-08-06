"use client";

import { useCallback, useEffect, useState } from "react";
import { getStock } from "@/lib/stocks";
import type { ConditionalOrder } from "@/types";

interface Props {
  refreshKey: number;
  onPortfolioChanged: () => void;
}

const STATUS_LABEL: Record<ConditionalOrder["status"], string> = {
  pending: "대기 중",
  filled: "체결",
  cancelled: "취소",
  rejected: "체결 실패",
};

export default function ConditionalOrders({ refreshKey, onPortfolioChanged }: Props) {
  const [orders, setOrders] = useState<ConditionalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "조건 주문을 불러오지 못했습니다.");
      setOrders(data.orders ?? []);
      setError(null);
      if (data.changed) onPortfolioChanged();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "조건 주문을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [onPortfolioChanged]);

  useEffect(() => {
    loadOrders();
    const timer = window.setInterval(loadOrders, 30_000);
    return () => window.clearInterval(timer);
  }, [loadOrders, refreshKey]);

  async function cancelOrder(id: string) {
    if (!window.confirm("이 조건 주문을 취소하시겠습니까?")) return;
    setCancellingId(id);
    try {
      const response = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "주문을 취소하지 못했습니다.");
      await loadOrders();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "주문을 취소하지 못했습니다.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-dim)" }}>⏱️ 조건 주문</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>모의투자 탭을 열어둔 동안 약 30초마다 조건을 확인합니다.</div>
        </div>
        <button onClick={loadOrders} style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-dim)", borderRadius: "8px", padding: "6px 9px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>지금 확인</button>
      </div>

      {error && <div role="alert" style={{ color: "#ef4444", fontSize: "11px", marginBottom: "8px" }}>{error}</div>}
      {loading ? (
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>조건 주문을 불러오는 중...</div>
      ) : orders.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px", fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>등록된 조건 주문이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {orders.map((order) => {
            const stockName = getStock(order.ticker)?.name ?? order.ticker;
            const isPending = order.status === "pending";
            const conditionLabel = order.trade_type === "buy"
              ? "이하 매수"
              : order.condition_type === "at_or_above" ? "이상 매도" : "이하 매도";
            return (
              <div key={order.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "11px 13px", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "10px", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "7px", alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "12px" }}>{stockName} {order.quantity}주</strong>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: isPending ? "#b45309" : order.status === "filled" ? "#057c68" : "var(--text-muted)", background: isPending ? "rgba(245,158,11,0.09)" : "var(--surface2)", borderRadius: "999px", padding: "3px 6px" }}>{STATUS_LABEL[order.status]}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>₩{Number(order.target_price).toLocaleString()} {conditionLabel}{order.execution_price ? ` · ₩${Number(order.execution_price).toLocaleString()} 체결` : ""}</div>
                  {order.failure_reason && <div style={{ fontSize: "10px", color: "#ef4444", marginTop: "3px" }}>{order.failure_reason}</div>}
                </div>
                {isPending && <button onClick={() => cancelOrder(order.id)} disabled={cancellingId === order.id} style={{ border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text-dim)", borderRadius: "7px", padding: "6px 9px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>{cancellingId === order.id ? "취소 중" : "주문 취소"}</button>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

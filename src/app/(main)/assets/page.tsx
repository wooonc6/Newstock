"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useStockPrice } from "@/hooks/useStockPrice";
import { getStock } from "@/lib/stocks";
import { createClient } from "@/lib/supabase/client";
import { TradeHistoryList, type TradeHistoryItem } from "@/components/trading/TradeHistoryList";
import type { PortfolioHolding } from "@/types";

function HoldingCard({ holding }: { holding: PortfolioHolding }) {
  const { data: priceData, loading } = useStockPrice(holding.ticker);
  const price = priceData?.price ?? 0;
  const value = price * holding.quantity;
  const profit = price ? (price - holding.avg_cost) * holding.quantity : 0;
  const profitRate = holding.avg_cost > 0 && price ? ((price - holding.avg_cost) / holding.avg_cost) * 100 : 0;
  const positive = profit >= 0;
  const stock = getStock(holding.ticker);

  return (
    <Link
      href={`/stocks/${encodeURIComponent(holding.ticker)}`}
      className="assets-holding-card"
      style={{ display: "block", padding: "14px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface)", color: "inherit", textDecoration: "none" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 800 }}>{stock?.name ?? holding.ticker}</div>
          <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>{holding.quantity}주 · 평균 ₩{holding.avg_cost.toLocaleString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14px", fontWeight: 800 }}>{loading ? "시세 조회 중..." : `₩${value.toLocaleString()}`}</div>
          {!loading && price > 0 && <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: 800, color: positive ? "#ef4444" : "#2563eb" }}>{positive ? "+" : ""}{profit.toLocaleString()}원 ({positive ? "+" : ""}{profitRate.toFixed(1)}%)</div>}
        </div>
      </div>
    </Link>
  );
}

export default function AssetsPage() {
  const { user, coins } = useAuth();
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAssets = useCallback(async () => {
    if (!user?.id) {
      setHoldings([]);
      setTrades([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const [holdingsResult, tradesResult] = await Promise.all([
      supabase.from("portfolio").select("user_id, ticker, quantity, avg_cost, updated_at").eq("user_id", user.id),
      supabase
        .from("trades")
        .select("id, ticker, trade_type, quantity, price, coins_delta, cost_basis, realized_profit, traded_at")
        .eq("user_id", user.id)
        .order("traded_at", { ascending: false }),
    ]);

    setHoldings(holdingsResult.data ?? []);
    setTrades((tradesResult.data as TradeHistoryItem[] | null) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  const investedCost = useMemo(() => holdings.reduce((sum, holding) => sum + holding.avg_cost * holding.quantity, 0), [holdings]);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <section className="mobile-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>💼 자산</div>
        <h1 style={{ fontSize: "22px", lineHeight: 1.35 }}>💰 내 모의투자 자산</h1>
        <div className="mobile-grid-3" style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
          <Metric label="보유 모의현금" value={`₩${coins.toLocaleString()}`} />
          <Metric label="매수 금액" value={`₩${investedCost.toLocaleString()}`} />
          <Metric label="보유 종목" value={`${holdings.length}개`} />
        </div>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "14px", fontWeight: 800 }}>📊 보유 종목</div>
          <Link href="/portfolio" style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>모의투자하기 →</Link>
        </div>
        {loading ? <Panel>자산을 불러오는 중입니다.</Panel> : holdings.length === 0 ? <Panel>아직 보유한 종목이 없습니다. 모의투자 탭에서 첫 거래를 시작해 보세요.</Panel> : <div style={{ display: "grid", gap: "8px" }}>{holdings.map((holding) => <HoldingCard key={holding.ticker} holding={holding} />)}</div>}
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "14px", fontWeight: 800 }}>🧾 매수·매도 기록</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>전체 {trades.length.toLocaleString()}건</div>
        </div>
        {loading ? (
          <Panel>거래 기록을 불러오는 중입니다.</Panel>
        ) : (
          <div className="mobile-scroll-frame" style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
            <TradeHistoryList trades={trades} emptyText="아직 매수·매도 기록이 없습니다." />
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: "12px", background: "var(--surface2)", borderRadius: "8px" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>{label}</div><div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap" }}>{value}</div></div>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", color: "var(--text-muted)" }}>{children}</div>;
}

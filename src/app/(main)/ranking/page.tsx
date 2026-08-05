'use client';

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useStockPrice } from "@/hooks/useStockPrice";
import { getStock } from "@/lib/stocks";

interface RankingUser {
  id: string;
  nickname: string | null;
  current_coins: number | string | null;
  total_earned_coins: number | string | null;
  realized_profit: number | string | null;
  realized_cost_basis: number | string | null;
  realized_return_rate: number | string | null;
}

interface PublicHolding {
  nickname: string | null;
  current_coins: number | string | null;
  ticker: string | null;
  quantity: number | string | null;
  avg_cost: number | string | null;
  updated_at: string | null;
}

function HoldingSnapshot({ holding }: { holding: PublicHolding }) {
  const ticker = holding.ticker ?? "";
  const { data: priceData, loading } = useStockPrice(ticker);
  const quantity = Number(holding.quantity ?? 0);
  const avgCost = Number(holding.avg_cost ?? 0);
  const price = priceData?.price ?? 0;
  const marketValue = price * quantity;
  const profitRate = price > 0 && avgCost > 0 ? ((price - avgCost) / avgCost) * 100 : 0;
  const stock = getStock(ticker);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "12px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface2)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 800 }}>{stock?.name ?? ticker}</div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>{quantity}주 · 평균 ₩{avgCost.toLocaleString()}</div>
      </div>
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div style={{ fontSize: "13px", fontWeight: 800 }}>{loading ? "시세 조회 중..." : price ? `₩${marketValue.toLocaleString()}` : "-"}</div>
        {!loading && price > 0 && <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: 800, color: profitRate >= 0 ? "#ef4444" : "#2563eb" }}>{profitRate >= 0 ? "+" : ""}{profitRate.toFixed(1)}%</div>}
      </div>
    </div>
  );
}

function PortfolioViewer({ user, onClose }: { user: RankingUser; onClose: () => void }) {
  const [holdings, setHoldings] = useState<PublicHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSnapshot = useCallback(async () => {
    const { data, error } = await createClient().rpc("get_public_portfolio_snapshot", { p_user_id: user.id });
    if (error) {
      setError("투자 현황을 불러오지 못했습니다.");
    } else {
      setHoldings((data as PublicHolding[] | null) ?? []);
      setError("");
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    void loadSnapshot();
    const timer = window.setInterval(() => void loadSnapshot(), 30_000);
    return () => window.clearInterval(timer);
  }, [loadSnapshot]);

  const currentCoins = Number(holdings[0]?.current_coins ?? user.current_coins ?? 0);
  const activeHoldings = holdings.filter((holding) => holding.ticker && Number(holding.quantity ?? 0) > 0);

  return (
    <section style={{ border: "1px solid rgba(0,168,120,0.32)", borderRadius: "14px", padding: "16px", background: "rgba(0,168,120,0.045)", display: "grid", gap: "13px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 800 }}>🔎 선택한 사용자 투자 현황</div>
          <div style={{ marginTop: "4px", fontSize: "17px", fontWeight: 900 }}>{user.nickname || "이름 없는 사용자"}</div>
        </div>
        <button type="button" onClick={onClose} style={{ border: "1px solid var(--border)", background: "var(--surface)", borderRadius: "7px", padding: "6px 9px", fontSize: "11px", fontWeight: 700, cursor: "pointer", color: "var(--text-dim)" }}>닫기</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
        <Metric label="보유 모의투자금" value={`₩${currentCoins.toLocaleString()}`} />
        <Metric label="보유 종목" value={`${activeHoldings.length}개`} />
      </div>

      {loading ? <Panel>투자 현황을 불러오는 중입니다.</Panel> : error ? <Panel>{error}</Panel> : activeHoldings.length === 0 ? <Panel>현재 보유 중인 종목이 없습니다.</Panel> : <div style={{ display: "grid", gap: "8px" }}>{activeHoldings.map((holding) => <HoldingSnapshot key={holding.ticker} holding={holding} />)}</div>}
      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>보유 내역은 30초마다 갱신되고, 평가금액은 최신 시세에 따라 함께 바뀝니다.</div>
    </section>
  );
}

export default function RankingPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRankings = useCallback(async () => {
    const { data, error } = await createClient().rpc("get_learning_rankings", { p_limit: 50 });
    if (error) setError("랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    else {
      setRankings((data as RankingUser[] | null) ?? []);
      setError("");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRankings();
    const timer = window.setInterval(() => void fetchRankings(), 30_000);
    return () => window.clearInterval(timer);
  }, [fetchRankings]);

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div style={{ marginBottom: "4px" }}>
        <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--accent2)", marginBottom: "6px" }}>🏆 랭킹</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>총 획득 모의투자금 순 · 동률이면 실현 수익률 순</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>💡 수익률은 주식을 매도한 뒤에만 반영됩니다. 사용자를 누르면 현재 투자 현황을 볼 수 있어요.</div>
      </div>

      {selectedUser && <PortfolioViewer user={selectedUser} onClose={() => setSelectedUser(null)} />}

      {loading ? <Panel>랭킹을 불러오는 중...</Panel> : error ? <Panel>{error}</Panel> : rankings.length === 0 ? <Panel>아직 랭킹 데이터가 없습니다.</Panel> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rankings.map((item, index) => {
            const isMe = item.id === user?.id;
            const rank = index + 1;
            const currentCoins = Number(item.current_coins ?? 0);
            const totalEarned = Number(item.total_earned_coins ?? 0);
            const realizedProfit = Number(item.realized_profit ?? 0);
            const realizedCostBasis = Number(item.realized_cost_basis ?? 0);
            const realizedReturnRate = Number(item.realized_return_rate ?? 0);
            const returnColor = realizedReturnRate > 0 ? "#ef4444" : realizedReturnRate < 0 ? "#2563eb" : "var(--text-muted)";

            return <button key={item.id} type="button" onClick={() => setSelectedUser(item)} style={{ width: "100%", display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) auto", alignItems: "center", gap: "12px", background: isMe ? "rgba(0,168,120,0.08)" : "var(--surface)", border: `1px solid ${isMe ? "rgba(0,168,120,0.25)" : "var(--border)"}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", color: "inherit", textAlign: "left" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: rank <= 3 ? "rgba(251,191,36,0.14)" : "var(--surface2)", color: rank <= 3 ? "var(--coin)" : "var(--text-muted)", fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 900 }}>{rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}</div>
              <div style={{ minWidth: 0 }}><div style={{ fontSize: "14px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>{item.nickname || "이름 없는 사용자"}{isMe && <span style={{ color: "var(--accent)", marginLeft: "6px", fontSize: "12px" }}>나</span>}</div><div style={{ marginTop: "4px", fontSize: "10px", color: "var(--text-muted)" }}>클릭하여 투자 현황 보기</div></div>
              <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 900, color: "var(--coin)" }}>₩{currentCoins.toLocaleString()}</div><div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>보유 모의투자금</div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>총 획득 ₩{totalEarned.toLocaleString()}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", fontWeight: 800, color: returnColor, marginTop: "5px" }} title={realizedCostBasis > 0 ? `실현손익 ${realizedProfit >= 0 ? "+" : ""}₩${realizedProfit.toLocaleString()}` : "아직 매도 내역이 없습니다."}>실현 수익률 {realizedReturnRate > 0 ? "+" : ""}{realizedReturnRate.toFixed(2)}%</div>
              </div>
            </button>;
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div style={{ padding: "11px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "9px" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>{label}</div><div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap" }}>{value}</div></div>; }
function Panel({ children }: { children: React.ReactNode }) { return <div style={{ padding: "24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{children}</div>; }

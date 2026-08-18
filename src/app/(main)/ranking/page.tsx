'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStockPrice } from "@/hooks/useStockPrice";
import { getStock } from "@/lib/stocks";
import { TradeHistoryList, type TradeHistoryItem } from "@/components/trading/TradeHistoryList";

const RANKING_REFRESH_MS = 10_000;

interface RankingUser {
  id: string;
  nickname: string | null;
  current_coins: number | string | null;
  total_earned_coins: number | string | null;
  realized_profit: number | string | null;
  realized_cost_basis: number | string | null;
  unrealized_profit: number | string | null;
  total_profit: number | string | null;
  total_cost_basis: number | string | null;
  total_return_rate: number | string | null;
  portfolio_cost_basis: number | string | null;
  portfolio_market_value: number | string | null;
  total_account_assets: number | string | null;
  learning_investment_score: number | string | null;
  holding_count: number | string | null;
}

interface JoinedClass {
  id: string;
  name: string;
  joined_at: string;
  is_admin: boolean;
  class_code: string | null;
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
    <div className="holding-snapshot" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "12px", alignItems: "center", padding: "12px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--surface2)" }}>
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
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSnapshot = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const [portfolioResult, tradeResult] = await Promise.all([
      supabase.rpc("get_public_portfolio_snapshot", { p_user_id: user.id }),
      supabase.rpc("get_public_trade_history", { p_user_id: user.id, p_limit: null }),
    ]);

    if (portfolioResult.error || tradeResult.error) {
      setError("투자 현황을 불러오지 못했습니다.");
    } else {
      setHoldings((portfolioResult.data as PublicHolding[] | null) ?? []);
      setTrades((tradeResult.data as TradeHistoryItem[] | null) ?? []);
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
  const totalAccountAssets = Number(user.total_account_assets ?? currentCoins);
  const activeHoldings = holdings.filter((holding) => holding.ticker && Number(holding.quantity ?? 0) > 0);
  const displayName = user.nickname || "아이디 미설정 사용자";

  return (
    <section style={{ border: "1px solid rgba(0,168,120,0.32)", borderRadius: "14px", padding: "16px", background: "rgba(0,168,120,0.045)", display: "grid", gap: "13px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "start" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 800, marginBottom: "5px" }}>PORTFOLIO</div>
          <div style={{ fontSize: "17px", color: "var(--text)", fontWeight: 900 }}>{displayName}</div>
        </div>
        <button type="button" onClick={onClose} style={{ border: "1px solid var(--border)", background: "var(--surface)", borderRadius: "7px", padding: "6px 9px", fontSize: "11px", fontWeight: 700, cursor: "pointer", color: "var(--text-dim)" }}>닫기</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
        <Metric label="총 계좌 자산" value={`₩${totalAccountAssets.toLocaleString()}`} />
        <Metric label="보유 모의현금" value={`₩${currentCoins.toLocaleString()}`} />
        <Metric label="총수익률" value={`${Number(user.total_return_rate ?? 0) > 0 ? "+" : ""}${Number(user.total_return_rate ?? 0).toFixed(2)}%`} />
        <Metric label="보유 종목" value={`${activeHoldings.length}개`} />
      </div>

      {loading ? <Panel>투자 현황을 불러오는 중입니다.</Panel> : error ? <Panel>{error}</Panel> : activeHoldings.length === 0 ? <Panel>현재 보유 중인 종목이 없습니다.</Panel> : <div style={{ display: "grid", gap: "8px" }}>{activeHoldings.map((holding) => <HoldingSnapshot key={holding.ticker} holding={holding} />)}</div>}

      {!loading && !error && (
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
            <div style={{ fontSize: "14px", color: "var(--text)", fontWeight: 800 }}>매수·매도 기록</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>전체 {trades.length.toLocaleString()}건</div>
          </div>
          <div className="mobile-scroll-frame" style={{ maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
            <TradeHistoryList trades={trades} emptyText="아직 공개할 매수·매도 기록이 없습니다." />
          </div>
        </div>
      )}
      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>보유 내역은 30초마다 갱신되고, 평가금액은 최신 시세에 따라 함께 바뀝니다.</div>
    </section>
  );
}

export default function RankingPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [classes, setClasses] = useState<JoinedClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classCode, setClassCode] = useState("");
  const [joiningClass, setJoiningClass] = useState(false);
  const [classMessage, setClassMessage] = useState("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState("");
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const fetchClasses = useCallback(async () => {
    const response = await fetch("/api/classes", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "수업 목록 API 오류");
    setClasses((data.classes as JoinedClass[] | null) ?? []);
  }, []);

  const fetchRankings = useCallback(async () => {
    const requestId = ++requestSequence.current;
    try {
      const query = new URLSearchParams({ limit: "50", refreshedAt: String(Date.now()) });
      if (selectedClassId) query.set("classId", selectedClassId);
      const response = await fetch(`/api/rankings?${query.toString()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "랭킹 API 오류");
      }
      if (requestId !== requestSequence.current) return;

      const nextRankings = (data.rankings as RankingUser[] | null) ?? [];
      setRankings(nextRankings);
      setSelectedUser((current) => current
        ? nextRankings.find((ranking) => ranking.id === current.id) ?? current
        : null
      );
      setError("");
    } catch {
      if (requestId === requestSequence.current) {
        setError("랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (!user) return;
    void fetchClasses().catch(() => setClassMessage("참가한 수업 목록을 불러오지 못했습니다."));
  }, [fetchClasses, user]);

  const joinClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!classCode.trim() || joiningClass) return;
    setJoiningClass(true);
    setClassMessage("");
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "수업 참가 오류");
      await fetchClasses();
      setSelectedClassId(data.class.id);
      setClassCode("");
      setClassMessage(`${data.class.name} 수업에 참가했습니다.`);
    } catch (joinError) {
      setClassMessage(joinError instanceof Error ? joinError.message : "수업 참가를 처리하지 못했습니다.");
    } finally {
      setJoiningClass(false);
    }
  };

  const renameClass = async (event: React.FormEvent<HTMLFormElement>, classId: string) => {
    event.preventDefault();
    const name = editingClassName.trim();
    if (!name) return;
    setClassMessage("");
    try {
      const response = await fetch("/api/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "수업 이름 변경 오류");
      await fetchClasses();
      setEditingClassId(null);
      setClassMessage(`수업 이름을 ${data.class.name}(으)로 변경했습니다.`);
    } catch (renameError) {
      setClassMessage(renameError instanceof Error ? renameError.message : "수업 이름을 바꾸지 못했습니다.");
    }
  };

  useEffect(() => {
    setLoading(true);
    setSelectedUser(null);
    void fetchRankings();
    const timer = window.setInterval(() => void fetchRankings(), RANKING_REFRESH_MS);
    const refreshOnFocus = () => void fetchRankings();
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") void fetchRankings();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnVisible);
    };
  }, [fetchRankings]);

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div style={{ marginBottom: "4px" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 800, marginBottom: "6px" }}>RANKING</div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", lineHeight: 1.35, marginBottom: "7px" }}>🏆 랭킹</h1>
        <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: 1.6 }}>총 계좌 자산, 총 획득 모의투자금, 투자 성과를 함께 반영한 학습투자 점수 순</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>학습투자 점수는 실제 보유 금액이 아니라 랭킹 산정을 위한 점수입니다.</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>점수 = 총 계좌 자산 + 총 획득 모의투자금의 30% + 총 투자손익의 50% + 수익률 보너스</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>총 계좌 자산은 보유 모의현금과 보유 주식의 최신 평가금액을 더해 계산합니다.</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>수익률 보너스는 과도한 수익률 쏠림을 막기 위해 반영 범위를 제한합니다.</div>
      </div>

      <section style={{ display: "grid", gap: "12px", padding: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setSelectedClassId(null)} style={rankingTabStyle(selectedClassId === null)}>전체 랭킹</button>
          {classes.map((joinedClass) => (
            <button key={joinedClass.id} type="button" onClick={() => setSelectedClassId(joinedClass.id)} style={rankingTabStyle(selectedClassId === joinedClass.id)}>
              {joinedClass.name}
            </button>
          ))}
        </div>
        <form onSubmit={joinClass} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            value={classCode}
            onChange={(event) => setClassCode(event.target.value.toUpperCase())}
            placeholder="수업 코드 입력"
            aria-label="수업 코드"
            maxLength={32}
            autoComplete="off"
            style={{ flex: "1 1 180px", minWidth: 0, border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface2)", color: "var(--text)", padding: "10px 12px", fontSize: "13px" }}
          />
          <button type="submit" disabled={joiningClass || !classCode.trim()} style={{ border: 0, borderRadius: "8px", background: "var(--accent)", color: "white", padding: "10px 15px", fontSize: "13px", fontWeight: 800, cursor: joiningClass ? "wait" : "pointer", opacity: !classCode.trim() ? 0.55 : 1 }}>
            {joiningClass ? "참가 중..." : "수업 참가"}
          </button>
        </form>
        {classes.filter((joinedClass) => joinedClass.is_admin).map((joinedClass) => (
          <div key={`admin-${joinedClass.id}`} style={{ display: "grid", gap: "8px", padding: "11px", borderRadius: "9px", background: "var(--surface2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>
                <strong style={{ color: "var(--text)" }}>{joinedClass.name}</strong> 관리자 · 수업 코드 <strong style={{ color: "var(--accent)", letterSpacing: "0.06em" }}>{joinedClass.class_code}</strong>
              </div>
              <button type="button" onClick={() => { setEditingClassId(joinedClass.id); setEditingClassName(joinedClass.name); }} style={{ border: "1px solid var(--border)", borderRadius: "7px", background: "var(--surface)", color: "var(--text-dim)", padding: "6px 9px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>이름 변경</button>
            </div>
            {editingClassId === joinedClass.id && (
              <form onSubmit={(event) => void renameClass(event, joinedClass.id)} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input value={editingClassName} onChange={(event) => setEditingClassName(event.target.value)} maxLength={100} aria-label="새 수업 이름" style={{ flex: "1 1 180px", minWidth: 0, border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)", color: "var(--text)", padding: "9px 11px", fontSize: "12px" }} />
                <button type="submit" style={{ border: 0, borderRadius: "8px", background: "var(--accent)", color: "white", padding: "9px 13px", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>저장</button>
                <button type="button" onClick={() => setEditingClassId(null)} style={{ border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)", color: "var(--text-dim)", padding: "9px 13px", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>취소</button>
              </form>
            )}
          </div>
        ))}
        {classMessage && <div role="status" style={{ fontSize: "12px", color: "var(--text-dim)" }}>{classMessage}</div>}
      </section>

      {loading ? <Panel>랭킹을 불러오는 중...</Panel> : error ? <Panel>{error}</Panel> : rankings.length === 0 ? <Panel>아직 랭킹 데이터가 없습니다.</Panel> : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rankings.map((item, index) => {
            const isMe = item.id === user?.id;
            const rank = index + 1;
            const currentCoins = Number(item.current_coins ?? 0);
            const totalEarned = Number(item.total_earned_coins ?? 0);
            const realizedProfit = Number(item.realized_profit ?? 0);
            const unrealizedProfit = Number(item.unrealized_profit ?? 0);
            const totalProfit = Number(item.total_profit ?? 0);
            const totalCostBasis = Number(item.total_cost_basis ?? 0);
            const totalReturnRate = Number(item.total_return_rate ?? 0);
            const totalAccountAssets = Number(item.total_account_assets ?? currentCoins);
            const learningInvestmentScore = Number(item.learning_investment_score ?? totalAccountAssets);
            const holdingCount = Number(item.holding_count ?? 0);
            const returnColor = totalReturnRate > 0 ? "#ef4444" : totalReturnRate < 0 ? "#2563eb" : "var(--text-muted)";
            const displayName = item.nickname || "아이디 미설정 사용자";
            const isSelected = selectedUser?.id === item.id;
            const detailId = `ranking-detail-${item.id}`;

            return (
              <div key={item.id} style={{ display: "grid", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedUser((current) => current?.id === item.id ? null : item)}
                  className="ranking-row"
                  aria-expanded={isSelected}
                  aria-controls={detailId}
                  style={{ width: "100%", display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) auto", alignItems: "center", gap: "12px", background: isMe ? "rgba(0,168,120,0.08)" : "var(--surface)", border: `1px solid ${isSelected || isMe ? "rgba(0,168,120,0.32)" : "var(--border)"}`, borderRadius: "12px", padding: "14px 16px", cursor: "pointer", color: "inherit", textAlign: "left" }}
                >
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: rank <= 3 ? "rgba(251,191,36,0.14)" : "var(--surface2)", color: rank <= 3 ? "var(--coin)" : "var(--text-muted)", fontFamily: "var(--font-ui)", fontSize: "13px", fontWeight: 900 }}>{rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}</div>
                  <div style={{ minWidth: 0 }}><div style={{ fontSize: "14px", color: "var(--text)", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}{isMe && <span style={{ color: "var(--accent)", marginLeft: "6px", fontSize: "12px", fontWeight: 800 }}>나</span>}</div><div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>{isSelected ? "투자 현황 접기" : "이 순위에서 투자 현황 보기"} · 보유 종목 {holdingCount}개</div></div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: 900, color: "var(--accent2)" }}>{learningInvestmentScore.toLocaleString()}점</div><div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>학습투자 점수</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>총 계좌 자산 ₩{totalAccountAssets.toLocaleString()}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>보유 현금 ₩{currentCoins.toLocaleString()}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>총 획득 ₩{totalEarned.toLocaleString()}</div>
                    <div style={{ fontFamily: "var(--font-ui)", fontSize: "11px", fontWeight: 800, color: returnColor, marginTop: "5px" }} title={totalCostBasis > 0 ? `총손익 ${totalProfit >= 0 ? "+" : ""}₩${totalProfit.toLocaleString()} (실현 ${realizedProfit >= 0 ? "+" : ""}₩${realizedProfit.toLocaleString()} · 평가 ${unrealizedProfit >= 0 ? "+" : ""}₩${unrealizedProfit.toLocaleString()})` : "아직 투자 내역이 없습니다."}>총수익률 {totalReturnRate > 0 ? "+" : ""}{totalReturnRate.toFixed(2)}%</div>
                  </div>
                </button>
                {isSelected && (
                  <div id={detailId}>
                    <PortfolioViewer user={item} onClose={() => setSelectedUser(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div style={{ padding: "11px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "9px" }}><div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px" }}>{label}</div><div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap" }}>{value}</div></div>; }
function Panel({ children }: { children: React.ReactNode }) { return <div style={{ padding: "24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "13px", color: "var(--text-muted)" }}>{children}</div>; }
function rankingTabStyle(active: boolean): React.CSSProperties { return { border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`, borderRadius: "999px", background: active ? "rgba(0,168,120,0.1)" : "var(--surface2)", color: active ? "var(--accent)" : "var(--text-dim)", padding: "8px 12px", fontSize: "12px", fontWeight: 800, cursor: "pointer" }; }

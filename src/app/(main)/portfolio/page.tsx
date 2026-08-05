"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import { useQuizUnlock } from "@/hooks/useQuizUnlock";
import { useTradingPrice } from "@/hooks/useTradingPrice";
import { STOCKS, getStock } from "@/lib/stocks";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioHolding } from "@/types";
import TradeModal from "./TradeModal";
import ConditionalOrders from "./ConditionalOrders";

type MarketStatus = ReturnType<typeof useMarketStatus>;

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
  const { data: priceData, loading } = useTradingPrice(holding.ticker);
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
  const { data: priceData, loading } = useTradingPrice(ticker);
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
  const { data: priceData, loading } = useTradingPrice(ticker);
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
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>모의투자 기준가</div>
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
            {priceData?.priceBasis ?? "Newstock 체결가"} · 대시보드 시세와 다를 수 있음 · 갱신 {formatUpdatedAt(priceData?.updatedAt)}
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

function MarketStatusBanner({ status, onOpenRules }: { status: MarketStatus; onOpenRules: () => void }) {
  const isOpen = status.newstock.canTradeNow;

  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "10px",
        background: "var(--surface)",
        padding: "14px 16px",
        marginBottom: "14px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "14px",
        alignItems: "center",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "999px",
              background: isOpen ? "rgba(5,124,104,0.08)" : "var(--surface2)",
              color: isOpen ? "#057c68" : "var(--text-dim)",
              fontSize: "10px",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {isOpen ? "거래 가능" : "즉시 거래 마감"}
          </span>
          <strong style={{ fontSize: "14px" }}>{status.newstock.label}</strong>
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "12px", color: "var(--text-muted)" }}>
            KST {status.dateKey}({status.weekday}) {status.timeText}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
          <StatusMini label="현실 시장" value={status.realMarket.label} detail={status.realMarket.priceBasis} />
          <StatusMini label="Newstock 체결" value={isOpen ? "즉시 거래·조건 체결 가능" : "조건 주문 등록만 가능"} detail={`${status.newstock.priceBasis} · 대시보드와 다를 수 있음`} />
          <StatusMini label="다음 기준" value={status.nextOpenText} detail={status.closedReason ?? status.realMarket.description} />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenRules}
        style={{
          border: "1px solid var(--border)",
          borderRadius: "9px",
          background: "var(--surface)",
          color: "var(--text-dim)",
          padding: "10px 12px",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        시장 규칙 보기
      </button>
    </section>
  );
}

function StatusMini({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 10px", minWidth: 0 }}>
      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 800, marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.45 }}>{detail}</div>
    </div>
  );
}

function MarketRuleModal({ status, onClose }: { status: MarketStatus; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Newstock 시장 규칙"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 120, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div style={{ width: "100%", maxWidth: "720px", maxHeight: "88vh", overflowY: "auto", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "14px 14px 0 0", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800 }}>시장 시간과 Newstock 세션 규칙</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px", lineHeight: 1.55 }}>
              현실 시장을 배우되, 저녁에도 연습할 수 있도록 Newstock 전용 체결 시간을 별도로 둡니다.
            </div>
          </div>
          <button aria-label="시장 규칙 닫기" onClick={onClose} style={{ border: "none", background: "transparent", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface)", padding: "13px", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "5px", fontWeight: 800 }}>지금 상태</div>
          <div style={{ fontSize: "14px", fontWeight: 900 }}>{status.newstock.label}</div>
          <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "5px", lineHeight: 1.55 }}>
            현실 시장: {status.realMarket.label} · Newstock 가격 기준: {status.newstock.priceBasis}
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px", marginBottom: "14px" }}>
          <RuleRow time="08:30~08:40" title="장전 시간외종가" desc="전일 종가를 Newstock 체결가로 사용합니다." />
          <RuleRow time="09:00~15:30" title="정규장" desc="정규장 최근 현재가를 Newstock 체결가로 사용합니다." />
          <RuleRow time="15:40~16:00" title="장후 시간외종가" desc="당일 종가에 가까운 마지막 확인가를 Newstock 체결가로 사용합니다." />
          <RuleRow time="16:00~18:00" title="시간외단일가" desc="실제 10분 단일가 계산 대신 Newstock 단일가 기준가로 체결합니다." />
          <RuleRow time="18:00~24:00" title="Newstock 애프터 세션" desc="현실장은 닫혔지만 Newstock 애프터 기준가로 즉시 거래와 조건 주문 체결을 허용합니다." />
          <RuleRow time="24:00~다음 08:30" title="세션 마감" desc="즉시 거래와 조건 주문 체결은 멈춥니다. 조건 주문 등록은 가능하고, 다음 세션이 열릴 때 다시 확인합니다." />
        </div>

        <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.16)", borderRadius: "12px", padding: "13px", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.65 }}>
          모의투자탭의 기준가는 거래 연습을 위한 체결가입니다. 대시보드탭은 시장 관찰용 시세를 보여주므로 두 가격이 다를 수 있습니다.
        </div>
      </div>
    </div>
  );
}

function RuleRow({ time, title, desc }: { time: string; title: string; desc: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "116px minmax(0,1fr)", gap: "10px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--surface)" }}>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: "11px", color: "var(--text-muted)", fontWeight: 800 }}>{time}</div>
      <div>
        <div style={{ fontSize: "12px", fontWeight: 800, marginBottom: "3px" }}>{title}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { user, coins, refreshUser } = useAuth();
  const marketStatus = useMarketStatus();
  const { unlockMap, loading: unlockLoading, error: unlockError } = useQuizUnlock(user?.id);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeTarget, setTradeTarget] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState(STOCKS[0]?.ticker ?? "");
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [showMarketRules, setShowMarketRules] = useState(false);

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
      <MarketStatusBanner status={marketStatus} onOpenRules={() => setShowMarketRules(true)} />

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
            종목을 선택해 모의투자 기준가와 투자 가능 여부를 확인하세요.
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
              <span style={{ minWidth: "80px", textAlign: "right" }}>기준가</span>
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

      {showMarketRules && (
        <MarketRuleModal status={marketStatus} onClose={() => setShowMarketRules(false)} />
      )}
    </div>
  );
}

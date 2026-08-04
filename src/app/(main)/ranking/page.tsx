'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface RankingUser {
  id: string;
  nickname: string | null;
  total_earned_coins: number | string | null;
  realized_profit: number | string | null;
  realized_cost_basis: number | string | null;
  realized_return_rate: number | string | null;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRankings() {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc("get_learning_rankings", { p_limit: 50 });

      if (error) {
        setError("랭킹을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      } else {
        setRankings((data as RankingUser[] | null) ?? []);
      }
      setLoading(false);
    }

    fetchRankings();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--accent2)", marginBottom: "6px" }}>
          랭킹
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          총 획득 모의투자금 순 · 동률이면 실현 수익률 순
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
          수익률은 주식을 매도한 뒤에만 반영됩니다.
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: "13px", color: "var(--text-muted)", padding: "32px 0", textAlign: "center" }}>
          랭킹을 불러오는 중...
        </div>
      ) : error ? (
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.18)",
            borderRadius: "12px",
            padding: "18px",
            fontSize: "13px",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      ) : rankings.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "28px",
            fontSize: "13px",
            color: "var(--text-dim)",
            textAlign: "center",
          }}
        >
          아직 랭킹 데이터가 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rankings.map((item, index) => {
            const isMe = item.id === user?.id;
            const rank = index + 1;
            const totalEarned = Number(item.total_earned_coins ?? 0);
            const realizedProfit = Number(item.realized_profit ?? 0);
            const realizedCostBasis = Number(item.realized_cost_basis ?? 0);
            const realizedReturnRate = Number(item.realized_return_rate ?? 0);
            const returnColor =
              realizedReturnRate > 0
                ? "#ef4444"
                : realizedReturnRate < 0
                  ? "#2563eb"
                  : "var(--text-muted)";

            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr auto",
                  alignItems: "center",
                  gap: "12px",
                  background: isMe ? "rgba(0,168,120,0.08)" : "var(--surface)",
                  border: `1px solid ${isMe ? "rgba(0,168,120,0.25)" : "var(--border)"}`,
                  borderRadius: "12px",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: rank <= 3 ? "rgba(251,191,36,0.14)" : "var(--surface2)",
                    color: rank <= 3 ? "var(--coin)" : "var(--text-muted)",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 900,
                  }}
                >
                  {rank}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.nickname || "이름 없는 사용자"}
                    {isMe && <span style={{ color: "var(--accent)", marginLeft: "6px", fontSize: "12px" }}>나</span>}
                  </div>
                </div>

                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "14px",
                      fontWeight: 900,
                      color: "var(--coin)",
                    }}
                  >
                    ₩{totalEarned.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>
                    총 획득
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: returnColor,
                      marginTop: "5px",
                    }}
                    title={
                      realizedCostBasis > 0
                        ? `실현손익 ${realizedProfit >= 0 ? "+" : ""}₩${realizedProfit.toLocaleString()}`
                        : "아직 매도 내역이 없습니다."
                    }
                  >
                    실현 수익률 {realizedReturnRate > 0 ? "+" : ""}{realizedReturnRate.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

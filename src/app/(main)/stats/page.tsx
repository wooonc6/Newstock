import { createClient } from "@/lib/supabase/server";
import { STOCKS, getStock } from "@/lib/stocks";

type QuizSessionRow = {
  stock_ticker: string;
  score: number | null;
  total: number | null;
  coins_earned: number | null;
  created_at: string;
};

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <EmptyPanel>로그인 후 내 퀴즈 분석을 볼 수 있습니다.</EmptyPanel>;
  }

  const { data, error } = await supabase
    .from("quiz_sessions")
    .select("stock_ticker, score, total, coins_earned, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <EmptyPanel>분석 데이터를 불러오지 못했습니다.</EmptyPanel>;
  }

  const rows = (data ?? []) as QuizSessionRow[];
  const total = rows.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const correct = rows.reduce((sum, row) => sum + (row.score ?? 0), 0);
  const wrong = Math.max(total - correct, 0);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const coins = rows.reduce((sum, row) => sum + (row.coins_earned ?? 0), 0);

  const wrongByTicker = rows.reduce<Record<string, number>>((map, row) => {
    const rowWrong = Math.max((row.total ?? 0) - (row.score ?? 0), 0);
    if (rowWrong > 0) map[row.stock_ticker] = (map[row.stock_ticker] ?? 0) + rowWrong;
    return map;
  }, {});

  const weakest = Object.entries(wrongByTicker)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>분석</div>
        <h1 style={{ fontSize: "22px", lineHeight: 1.35 }}>뉴스 퀴즈 정답률</h1>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        <Metric label="전체 퀴즈" value={`${total}개`} />
        <Metric label="정답" value={`${correct}개`} />
        <Metric label="오답" value={`${wrong}개`} />
        <Metric label="정답률" value={`${accuracy}%`} />
      </div>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>많이 틀린 종목</div>
        {weakest.length === 0 ? (
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            아직 오답 데이터가 없습니다. 퀴즈를 풀면 취약 종목이 표시됩니다.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {weakest.map(([ticker, count]) => (
              <div
                key={ticker}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{getStock(ticker)?.name ?? ticker}</span>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", color: "var(--danger)" }}>
                  {count}개 오답
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>많이 틀린 기간</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
          {["1개월", "3개월", "6개월"].map((label) => (
            <div key={label} style={{ background: "var(--surface2)", borderRadius: "8px", padding: "12px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "5px" }}>{label}</div>
              <div style={{ fontSize: "12px", fontWeight: 800 }}>기간별 저장 필요</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "10px", fontSize: "12px", lineHeight: 1.6, color: "var(--text-muted)" }}>
          현재 DB에는 기간 컬럼이 없어 종목별/전체 정답률까지만 정확히 계산합니다.
        </div>
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>내 정답률 요약</div>
        <div style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--text-dim)" }}>
          지원 종목 {STOCKS.length}개 중 퀴즈 기록이 있는 종목을 기준으로 계산했습니다. 지금까지 획득한 모의투자금은{" "}
          <strong style={{ color: "var(--accent)" }}>₩{coins.toLocaleString()}</strong>입니다.
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px" }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "18px", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "32px 20px",
        textAlign: "center",
        fontSize: "13px",
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

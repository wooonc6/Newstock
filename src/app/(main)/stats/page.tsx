import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getStock } from "@/lib/stocks";

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
  const wrongByTicker = rows.reduce<Record<string, number>>((map, row) => {
    const rowWrong = Math.max((row.total ?? 0) - (row.score ?? 0), 0);
    if (rowWrong > 0) map[row.stock_ticker] = (map[row.stock_ticker] ?? 0) + rowWrong;
    return map;
  }, {});

  const weakest = Object.entries(wrongByTicker)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <section
        className="mobile-section"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 800, marginBottom: "6px" }}>QUIZ SCORE</div>
        <h1 style={{ fontSize: "21px", fontWeight: 800, color: "var(--text)", lineHeight: 1.35 }}>📈 뉴스 퀴즈 정답률</h1>
      </section>

      <div className="mobile-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        <Metric label="전체 퀴즈" value={`${total}개`} />
        <Metric label="정답" value={`${correct}개`} />
        <Metric label="오답" value={`${wrong}개`} />
        <Metric label="정답률" value={`${accuracy}%`} />
      </div>

      <section
        className="mobile-section"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", marginBottom: "10px" }}>많이 틀린 종목</div>
        {weakest.length === 0 ? (
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            아직 오답 데이터가 없습니다. 퀴즈를 풀면 취약 종목이 표시됩니다.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "8px" }}>
            {weakest.map(([ticker, count]) => (
              <Link
                key={ticker}
                href={`/analysis?recordTicker=${encodeURIComponent(ticker)}#quiz-history-${ticker}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                  padding: "12px",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "9px",
                  background: "rgba(239,68,68,0.035)",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <span>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 800 }}>{getStock(ticker)?.name ?? ticker}</span>
                  <span style={{ display: "block", marginTop: "3px", fontSize: "11px", color: "var(--text-muted)" }}>클릭하면 이 종목의 퀴즈 기록으로 이동</span>
                </span>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--danger)", whiteSpace: "nowrap" }}>
                  {count}개 오답 ↘
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px" }}>
      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: "18px", fontWeight: 800 }}>{value}</div>
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

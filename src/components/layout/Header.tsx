"use client";


interface HeaderProps {
  nickname: string;
  coins: number;
  streak: number;
  onLogout?: () => void;
}

export default function Header({ nickname, coins, streak, onLogout }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        padding: "13px 18px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius, 16px)",
      }}
    >
      <img src="/logo.svg" alt="Newstock" style={{ height: "64px", width: "auto" }} />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {streak > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.18)",
              padding: "6px 11px",
              borderRadius: "100px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--warn)",
            }}
          >
            🔥 {streak}일
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
            padding: "6px 13px",
            borderRadius: "100px",
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--coin)",
          }}
        >
          ₩{coins.toLocaleString()}
        </div>

        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 13px",
            borderRadius: "100px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            color: "var(--text-dim)",
            cursor: "pointer",
          }}
        >
          <span>{nickname}</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>로그아웃</span>
        </button>
      </div>
    </header>
  );
}

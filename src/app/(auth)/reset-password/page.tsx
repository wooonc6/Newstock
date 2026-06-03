"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const s = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  } as React.CSSProperties,
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
  } as React.CSSProperties,
  logo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: "22px",
    fontWeight: 700,
    color: "var(--accent)",
    marginBottom: "4px",
  } as React.CSSProperties,
  sub: { fontSize: "13px", color: "var(--text-muted)", marginBottom: "28px" } as React.CSSProperties,
  label: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
    marginBottom: "7px",
    display: "block",
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "11px 15px",
    borderRadius: "10px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: "14px",
    outline: "none",
    marginBottom: "14px",
    display: "block",
  } as React.CSSProperties,
  btn: {
    width: "100%",
    padding: "12px",
    borderRadius: "100px",
    border: "none",
    background: "var(--accent)",
    color: "#071013",
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  } as React.CSSProperties,
  err: { fontSize: "12px", color: "var(--danger)", minHeight: "16px", marginBottom: "10px" } as React.CSSProperties,
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    setError("");
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError("비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있어요.");
      return;
    }
    alert("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
    router.push("/login");
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>Newstock</div>
        <div style={s.sub}>새 비밀번호를 설정해 주세요</div>

        <label style={s.label}>새 비밀번호</label>
        <input
          style={s.input}
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <label style={s.label}>비밀번호 확인</label>
        <input
          style={s.input}
          type="password"
          placeholder="비밀번호 다시 입력"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
          autoComplete="new-password"
        />

        <div style={s.err}>{error}</div>
        <button style={s.btn} onClick={handleReset} disabled={loading}>
          {loading ? "변경 중..." : "비밀번호 변경 →"}
        </button>
      </div>
    </div>
  );
}

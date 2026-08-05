"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Footer from "@/components/layout/Footer";

const s = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    padding: "24px",
    background:
      "radial-gradient(circle at 18% 12%, rgba(0, 168, 120, 0.10), transparent 32%), linear-gradient(135deg, #f4fbf8 0%, #f5f7fa 52%, #eef3f8 100%)",
  } as React.CSSProperties,
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "22px",
    padding: "42px 36px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 22px 60px rgba(26, 58, 92, 0.10)",
    animation: "fadeUp 0.35s ease",
  } as React.CSSProperties,
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  } as React.CSSProperties,
  sub: { fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: "28px" } as React.CSSProperties,
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
    padding: "13px 15px",
    borderRadius: "10px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    marginBottom: "14px",
    display: "block",
  } as React.CSSProperties,
  btn: {
    width: "100%",
    padding: "13px",
    borderRadius: "100px",
    border: "none",
    background: "var(--accent)",
    color: "#071013",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  } as React.CSSProperties,
  err: { fontSize: "12px", color: "var(--danger)", minHeight: "16px", marginBottom: "10px" } as React.CSSProperties,
  helper: {
    border: "1px solid rgba(0, 168, 120, 0.16)",
    background: "rgba(0, 168, 120, 0.06)",
    borderRadius: "12px",
    padding: "12px 14px",
    color: "var(--text-dim)",
    fontSize: "12px",
    lineHeight: 1.6,
    marginBottom: "20px",
  } as React.CSSProperties,
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
        <div style={s.brand}>
          <img src="/logo.svg" alt="Newstock" style={{ height: "52px", width: "auto" }} />
        </div>
        <div style={s.sub}>새 비밀번호를 설정해 주세요. 변경 후에는 로그인 화면으로 이동합니다.</div>
        <div style={s.helper}>재설정 메일을 다시 찾는 중이라면 받은편지함과 스팸함을 함께 확인해주세요.</div>

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
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <Footer />
      </div>
    </div>
  );
}

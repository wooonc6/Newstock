"use client";

import { useEffect, useState } from "react";
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
  brand: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" } as React.CSSProperties,
  sub: { fontSize: "14px", color: "var(--text-dim)", lineHeight: 1.65, marginBottom: "28px" } as React.CSSProperties,
  label: { fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "7px", display: "block" } as React.CSSProperties,
  input: { width: "100%", padding: "13px 15px", borderRadius: "10px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "14px", outline: "none", marginBottom: "14px", display: "block" } as React.CSSProperties,
  btn: { width: "100%", padding: "13px", borderRadius: "100px", border: "none", background: "var(--accent)", color: "#071013", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginTop: "4px" } as React.CSSProperties,
  err: { fontSize: "12px", color: "var(--danger)", minHeight: "16px", marginBottom: "10px" } as React.CSSProperties,
  helper: { border: "1px solid rgba(0, 168, 120, 0.16)", background: "rgba(0, 168, 120, 0.06)", borderRadius: "12px", padding: "12px 14px", color: "var(--text-dim)", fontSize: "12px", lineHeight: 1.6, marginBottom: "20px" } as React.CSSProperties,
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function establishRecoverySession() {
      try {
        // Supabase recovery links can arrive either with a PKCE `code` query
        // parameter or with access/refresh tokens in the URL hash. Make sure a
        // valid session exists before updateUser() is called.
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          url.searchParams.delete("code");
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }

        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}`);
        }

        const { data, error: sessionCheckError } = await supabase.auth.getSession();
        if (sessionCheckError) throw sessionCheckError;
        if (!data.session) throw new Error("Recovery session not found");

        if (mounted) setRecoveryReady(true);
      } catch (e) {
        console.error("Failed to establish password recovery session", e);
        if (mounted) {
          setRecoveryReady(false);
          setError("재설정 링크가 만료되었거나 올바르지 않습니다. 로그인 화면에서 새 링크를 받아주세요.");
        }
      } finally {
        if (mounted) setCheckingLink(false);
      }
    }

    establishRecoverySession();
    return () => { mounted = false; };
  }, []);

  async function handleReset() {
    setError("");
    if (!recoveryReady) {
      setError("재설정 링크를 확인할 수 없습니다. 로그인 화면에서 새 링크를 받아주세요.");
      return;
    }
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
      console.error("Password update failed", error);
      setError("비밀번호 변경에 실패했습니다. 새 재설정 링크를 받은 뒤 다시 시도해주세요.");
      return;
    }
    await supabase.auth.signOut();
    alert("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
    router.replace("/login");
    router.refresh();
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
        <input style={s.input} type="password" placeholder="새 비밀번호 (6자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" disabled={checkingLink || !recoveryReady} />

        <label style={s.label}>비밀번호 확인</label>
        <input style={s.input} type="password" placeholder="비밀번호 다시 입력" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleReset()} autoComplete="new-password" disabled={checkingLink || !recoveryReady} />

        <div style={s.err}>{checkingLink ? "재설정 링크를 확인하고 있습니다..." : error}</div>
        <button style={{ ...s.btn, opacity: checkingLink || !recoveryReady || loading ? 0.6 : 1 }} onClick={handleReset} disabled={checkingLink || !recoveryReady || loading}>
          {checkingLink ? "링크 확인 중..." : loading ? "변경 중..." : "비밀번호 변경 →"}
        </button>
      </div>
      <div style={{ width: "100%", maxWidth: "440px" }}><Footer /></div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/layout/Footer";

export default function PasswordRecoveryConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmationUrl = useMemo(() => searchParams.get("confirmation_url"), [searchParams]);

  function continueRecovery() {
    if (!confirmationUrl) return;
    try {
      const url = new URL(confirmationUrl);
      if (!url.hostname.endsWith(".supabase.co") || url.pathname !== "/auth/v1/verify") return;
      window.location.assign(url.toString());
    } catch {
      return;
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24, background: "radial-gradient(circle at 18% 12%, rgba(0, 168, 120, 0.10), transparent 32%), linear-gradient(135deg, #f4fbf8 0%, #f5f7fa 52%, #eef3f8 100%)" }}>
      <main style={{ width: "100%", maxWidth: 440, padding: "42px 36px", borderRadius: 22, background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 22px 60px rgba(26, 58, 92, 0.10)" }}>
        <img src="/logo.svg" alt="Newstock" style={{ height: 52, width: "auto", marginBottom: 20 }} />
        <h1 style={{ margin: "0 0 12px", fontSize: 24 }}>비밀번호 재설정</h1>
        <p style={{ margin: "0 0 24px", color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7 }}>
          아래 버튼을 누르면 본인 확인 후 새 비밀번호 설정 화면으로 이동합니다.
        </p>
        {confirmationUrl ? (
          <button onClick={continueRecovery} style={{ width: "100%", padding: 13, borderRadius: 100, border: "none", background: "var(--accent)", color: "#071013", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            비밀번호 재설정 계속하기 →
          </button>
        ) : (
          <>
            <p style={{ color: "var(--danger)", fontSize: 13, lineHeight: 1.6 }}>재설정 정보가 없습니다. 로그인 화면에서 새 비밀번호 재설정 메일을 요청해주세요.</p>
            <button onClick={() => router.replace("/login")} style={{ width: "100%", padding: 13, borderRadius: 100, border: "none", background: "var(--accent)", color: "#071013", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              로그인으로 돌아가기
            </button>
          </>
        )}
      </main>
      <div style={{ width: "100%", maxWidth: 440 }}><Footer /></div>
    </div>
  );
}

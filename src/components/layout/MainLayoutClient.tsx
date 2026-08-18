"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateRealName } from "@/lib/realName";
import Header from "./Header";
import NavTabs from "./NavTabs";
import Footer from "./Footer";
import UpdateTicker from "./UpdateTicker";
import { ToastProvider } from "@/components/ui/Toast";

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, nickname, coins, streak, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [realNameError, setRealNameError] = useState("");
  const [savingRealName, setSavingRealName] = useState(false);

  async function handleLogout() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDeleteAccount() {
    const response = await fetch("/api/account", { method: "DELETE" });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(result?.error ?? "회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    await signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleRealNameRegistration() {
    if (!user) return;

    setRealNameError("");
    const realName = validateRealName(lastName, firstName);
    if (!realName.ok) {
      setRealNameError(realName.error);
      return;
    }

    setSavingRealName(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ nickname: realName.displayName })
      .eq("id", user.id);

    if (error) {
      setSavingRealName(false);
      setRealNameError("이름 변경에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        last_name: realName.lastName,
        first_name: realName.firstName,
        nickname: realName.displayName,
        nickname_reviewed: true,
        real_name_version: 1,
      },
    });
    if (metadataError) {
      setSavingRealName(false);
      setRealNameError("실명 등록 상태를 저장하지 못했습니다. 다시 시도해주세요.");
      return;
    }

    await refreshUser();
    setLastName("");
    setFirstName("");
    setSavingRealName(false);
    router.refresh();
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "13px", color: "var(--text-muted)" }}>
          Loading...
        </div>
      </div>
    );
  }

  const displayName = nickname || (user?.user_metadata?.nickname as string) || "유저";
  const metadataLastName = typeof user?.user_metadata?.last_name === "string" ? user.user_metadata.last_name.trim() : "";
  const metadataFirstName = typeof user?.user_metadata?.first_name === "string" ? user.user_metadata.first_name.trim() : "";
  const hasRegisteredRealName = user?.user_metadata?.real_name_version === 1 || Boolean(metadataLastName && metadataFirstName);
  const showRealNameModal = Boolean(user && !hasRegisteredRealName);

  return (
    <ToastProvider>
      <div className="app-shell">
        <Header
          nickname={displayName}
          coins={coins}
          streak={streak}
          onLogout={handleLogout}
        />
        <NavTabs />
        <UpdateTicker />
        {children}
        <Footer onDeleteAccount={handleDeleteAccount} />
      </div>

      {showRealNameModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="real-name-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0, 0, 0, 0.58)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "28px 24px",
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
            }}
          >
            <div id="real-name-title" style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
              실명 등록이 필요합니다
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-dim)", marginBottom: 16 }}>
              Newstock은 신뢰할 수 있는 수업 랭킹 운영을 위해 실명제를 적용합니다. 성과 이름을 등록하면 기존 학습·투자 기록은 그대로 유지되고 표시 이름만 변경됩니다.
            </div>

            <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>
              현재 표시 이름: <b style={{ color: "var(--text)" }}>{displayName}</b>
              <br />이메일, 비밀번호, 랭킹 기록은 변경되지 않습니다.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
              <div>
                <label htmlFor="real-last-name" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 7 }}>성</label>
                <input id="real-last-name" value={lastName} onChange={(event) => { setLastName(event.target.value); if (realNameError) setRealNameError(""); }} autoFocus maxLength={20} autoComplete="family-name" placeholder="예: 김" style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label htmlFor="real-first-name" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 7 }}>이름</label>
                <input id="real-first-name" value={firstName} onChange={(event) => { setFirstName(event.target.value); if (realNameError) setRealNameError(""); }} onKeyDown={(event) => { if (event.key === "Enter" && lastName.trim() && firstName.trim() && !savingRealName) void handleRealNameRegistration(); }} maxLength={20} autoComplete="given-name" placeholder="예: 민수" style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 14, outline: "none" }} />
              </div>
            </div>
            <div style={{ minHeight: 34, paddingTop: 7, fontSize: 12, color: "var(--danger)", lineHeight: 1.4 }}>
              {realNameError}
            </div>

            <button
              type="button"
              onClick={() => void handleRealNameRegistration()}
              disabled={savingRealName || !lastName.trim() || !firstName.trim()}
              style={{
                width: "100%",
                padding: 12,
                border: 0,
                borderRadius: 999,
                background: "var(--accent)",
                color: "#071013",
                fontSize: 14,
                fontWeight: 800,
                cursor: savingRealName || !lastName.trim() || !firstName.trim() ? "default" : "pointer",
                opacity: savingRealName || !lastName.trim() || !firstName.trim() ? 0.55 : 1,
              }}
            >
              {savingRealName ? "저장 중..." : "실명 등록하고 계속하기"}
            </button>

            <button type="button" onClick={() => void handleLogout()} disabled={savingRealName} style={{ width: "100%", marginTop: 9, padding: 9, border: 0, background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>로그아웃</button>
          </div>
        </div>
      )}
    </ToastProvider>
  );
}

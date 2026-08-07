"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requiresNicknameReset, validateNickname } from "@/lib/nicknamePolicy";
import Header from "./Header";
import NavTabs from "./NavTabs";
import Footer from "./Footer";
import UpdateTicker from "./UpdateTicker";
import { ToastProvider } from "@/components/ui/Toast";

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, nickname, coins, streak, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const [newNickname, setNewNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

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

  async function handleNicknameReset() {
    if (!user) return;

    setNicknameError("");
    const validation = validateNickname(newNickname);
    if (!validation.ok) {
      setNicknameError(validation.error);
      return;
    }

    setSavingNickname(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({ nickname: validation.nickname })
      .eq("id", user.id);

    if (error) {
      setSavingNickname(false);
      setNicknameError(
        error.code === "23505"
          ? "이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요."
          : "닉네임 변경에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }

    // 로그인 아이디와 프로필 표시가 같은 값을 바라보도록 Auth 메타데이터도 동기화합니다.
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, nickname: validation.nickname },
    });
    if (metadataError) {
      console.warn("[nickname reset] auth metadata sync failed:", metadataError);
    }

    await refreshUser();
    setNewNickname("");
    setSavingNickname(false);
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
  const mustResetNickname = Boolean(user && nickname && requiresNicknameReset(nickname));

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

      {mustResetNickname && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nickname-reset-title"
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
            <div id="nickname-reset-title" style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>
              닉네임 변경이 필요합니다
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-dim)", marginBottom: 20 }}>
              현재 닉네임은 Newstock 운영 정책에 따라 변경이 필요합니다. 다른 사용자가 불편함 없이 서비스를 이용할 수 있도록 새로운 닉네임을 설정해 주세요.
            </div>

            <label htmlFor="required-nickname" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 7 }}>
              새 닉네임
            </label>
            <input
              id="required-nickname"
              value={newNickname}
              onChange={(event) => {
                setNewNickname(event.target.value);
                if (nicknameError) setNicknameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !savingNickname) void handleNicknameReset();
              }}
              autoFocus
              maxLength={20}
              placeholder="2~20자 닉네임"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 13px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text)",
                fontSize: 14,
                outline: "none",
              }}
            />
            <div style={{ minHeight: 34, paddingTop: 7, fontSize: 12, color: "var(--danger)", lineHeight: 1.4 }}>
              {nicknameError}
            </div>

            <button
              type="button"
              onClick={() => void handleNicknameReset()}
              disabled={savingNickname}
              style={{
                width: "100%",
                padding: 12,
                border: 0,
                borderRadius: 999,
                background: "var(--accent)",
                color: "#071013",
                fontSize: 14,
                fontWeight: 800,
                cursor: savingNickname ? "default" : "pointer",
                opacity: savingNickname ? 0.65 : 1,
              }}
            >
              {savingNickname ? "변경 중..." : "닉네임 변경하기"}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={savingNickname}
              style={{
                width: "100%",
                marginTop: 9,
                padding: 9,
                border: 0,
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </ToastProvider>
  );
}

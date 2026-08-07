"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Header from "./Header";
import NavTabs from "./NavTabs";
import Footer from "./Footer";
import UpdateTicker from "./UpdateTicker";
import { ToastProvider } from "@/components/ui/Toast";

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, nickname, coins, streak, signOut } = useAuth();
  const router = useRouter();

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
    </ToastProvider>
  );
}

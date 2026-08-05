"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Header from "./Header";
import NavTabs from "./NavTabs";
import Footer from "./Footer";
import { ToastProvider } from "@/components/ui/Toast";

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading, nickname, coins, streak, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push("/login");
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
      <div style={{ maxWidth: "740px", margin: "0 auto", padding: "24px 18px", position: "relative", zIndex: 1 }}>
        <Header nickname={displayName} coins={coins} streak={streak} onLogout={handleLogout} />
        <NavTabs />
        {children}
        <Footer />
      </div>
    </ToastProvider>
  );
}

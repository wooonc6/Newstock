"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  nickname: string;
  coins: number;
  streak: number;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  nickname: "",
  coins: 0,
  streak: 0,
  signOut: async () => {},
  refreshUser: async () => {},
});

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(hasSupabase);
  const [nickname, setNickname] = useState("");
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);

  const fetchUserData = useCallback(async (userId: string) => {
    if (!hasSupabase) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("nickname, coins, streak")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("[auth] failed to refresh user data:", error);
      return;
    }

    if (data) {
      setNickname(data.nickname ?? "");
      setCoins(data.coins ?? 0);
      setStreak(data.streak ?? 0);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (user?.id) await fetchUserData(user.id);
  }, [user?.id, fetchUserData]);

  useEffect(() => {
    if (!hasSupabase) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) void fetchUserData(session.user.id);
    });

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) void fetchUserData(session.user.id);
    });

    return () => authSubscription.unsubscribe();
  }, [fetchUserData]);

  useEffect(() => {
    if (!hasSupabase || !user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`user-balance-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const next = payload.new as { nickname?: string | null; coins?: number | null; streak?: number | null };
          if (typeof next.nickname !== "undefined") setNickname(next.nickname ?? "");
          if (typeof next.coins !== "undefined") setCoins(next.coins ?? 0);
          if (typeof next.streak !== "undefined") setStreak(next.streak ?? 0);
        }
      )
      .subscribe();

    const refresh = () => void fetchUserData(user.id);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    const intervalId = window.setInterval(refresh, 30_000);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(intervalId);
      void supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUserData]);

  async function signOut() {
    if (!hasSupabase) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setNickname("");
    setCoins(0);
    setStreak(0);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, nickname, coins, streak, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

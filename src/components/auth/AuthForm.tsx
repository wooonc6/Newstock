"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";

const s = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
    animation: "fadeUp 0.4s ease",
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
  toggle: { textAlign: "center" as const, marginTop: "14px", fontSize: "13px", color: "var(--text-muted)" },
  link: { color: "var(--accent)", cursor: "pointer" },
};

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null as any;

  function reset(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function handleLogin() {
    setError("");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError("Supabase 환경변수가 설정되지 않았습니다. (.env.local 확인)");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignup() {
    setError("");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError("Supabase 환경변수가 설정되지 않았습니다. (.env.local 확인)");
      return;
    }
    if (nickname.trim().length < 2) {
      setError("닉네임은 2자 이상이어야 합니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: nickname.trim() } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setError("");
    alert("가입 확인 이메일을 보냈습니다. 이메일을 확인해 주세요.");
    reset("login");
  }

  async function handleForgot() {
    setError("");
    setMessage("");
    if (!email) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setLoading(false);
      if (error) {
        setError("이메일 전송에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      setMessage("비밀번호 재설정 링크를 이메일로 보냈습니다. 이메일을 확인해 주세요.");
    } catch (e: any) {
      setLoading(false);
      setError("이메일 전송에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (mode === "login") handleLogin();
      else if (mode === "signup") handleSignup();
      else handleForgot();
    }
  }

  return (
    <div style={s.card}>
      <div style={s.logo}>Newstock</div>
      <div style={s.sub}>뉴스로 배우는 투자 교육 플랫폼</div>

      {mode === "login" && (
        <>
          <label style={s.label}>이메일</label>
          <input
            style={s.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoComplete="email"
          />
          <label style={s.label}>비밀번호</label>
          <input
            style={s.input}
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete="current-password"
          />
          <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "10px" }}>
            <span style={{ ...s.link, fontSize: "12px" }} onClick={() => reset("forgot")}>
              비밀번호를 잊으셨나요?
            </span>
          </div>
          <div style={s.err}>{error}</div>
          <button style={s.btn} onClick={handleLogin} disabled={loading}>
            {loading ? "로그인 중..." : "시작하기 →"}
          </button>
          <div style={s.toggle}>
            처음이신가요?{" "}
            <span style={s.link} onClick={() => reset("signup")}>
              회원가입
            </span>
          </div>
        </>
      )}

      {mode === "signup" && (
        <>
          <label style={s.label}>닉네임</label>
          <input
            style={s.input}
            type="text"
            placeholder="닉네임 (2~12자)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={12}
            onKeyDown={onKey}
          />
          <label style={s.label}>이메일</label>
          <input
            style={s.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoComplete="email"
          />
          <label style={s.label}>비밀번호</label>
          <input
            style={s.input}
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKey}
            autoComplete="new-password"
          />
          <div style={s.err}>{error}</div>
          <button style={s.btn} onClick={handleSignup} disabled={loading}>
            {loading ? "가입 중..." : "가입하고 시작 →"}
          </button>
          <div style={s.toggle}>
            <span style={s.link} onClick={() => reset("login")}>
              ← 로그인으로 돌아가기
            </span>
          </div>
        </>
      )}

      {mode === "forgot" && (
        <>
          <div style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "20px" }}>
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요.
          </div>
          <label style={s.label}>이메일</label>
          <input
            style={s.input}
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoComplete="email"
          />
          <div style={s.err}>{error}</div>
          {message && (
            <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "10px" }}>
              {message}
            </div>
          )}
          <button style={s.btn} onClick={handleForgot} disabled={loading || !!message}>
            {loading ? "전송 중..." : "재설정 링크 보내기"}
          </button>
          <div style={s.toggle}>
            <span style={s.link} onClick={() => reset("login")}>
              ← 로그인으로 돌아가기
            </span>
          </div>
        </>
      )}
    </div>
  );
}

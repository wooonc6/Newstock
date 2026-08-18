"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateRealName } from "@/lib/realName";

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
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  } as React.CSSProperties,
  err: { fontSize: "12px", color: "var(--danger)", minHeight: "16px", marginBottom: "10px" } as React.CSSProperties,
  msg: { fontSize: "12px", color: "var(--accent)", marginBottom: "10px" } as React.CSSProperties,
  toggle: { textAlign: "center" as const, marginTop: "14px", fontSize: "13px", color: "var(--text-muted)" },
  link: { color: "var(--accent)", cursor: "pointer" },
};

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginId, setLoginId] = useState("");
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인해주세요.");
      return;
    }

    const identifier = loginId.trim();
    if (!identifier || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (!identifier.includes("@")) {
      setError("가입한 이메일 주소를 입력해주세요.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: identifier.toLowerCase(), password });
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
      setError("Supabase 환경변수가 설정되지 않았습니다. .env.local을 확인해주세요.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const realName = validateRealName(lastName, firstName);

    if (!cleanEmail.includes("@")) {
      setError("이메일을 올바르게 입력해주세요.");
      return;
    }
    if (!realName.ok) {
      setError(realName.error);
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          last_name: realName.lastName,
          first_name: realName.firstName,
          nickname: realName.displayName,
          email: cleanEmail,
          nickname_reviewed: true,
          real_name_version: 1,
        },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message.includes("duplicate") ? "이미 사용 중인 이메일 또는 닉네임입니다." : error.message);
      return;
    }

    if (data.session) {
      alert("회원가입이 완료되었습니다.");
      router.push("/dashboard");
      router.refresh();
      return;
    }

    alert("가입 확인 이메일을 보냈습니다. 이메일을 확인해주세요.");
    reset("login");
  }

  async function handleForgot() {
    setError("");
    setMessage("");
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "https://newstock-xi.vercel.app/reset-password",
    });
    setLoading(false);

    if (error) {
      setError("이메일 전송에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    setMessage("가입된 이메일이라면 비밀번호 재설정 링크가 전송됩니다. 받은편지함과 스팸함을 함께 확인해주세요.");
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
      <img src="/logo.svg" alt="Newstock" style={{ height: "56px", width: "auto", marginBottom: "8px" }} />
      <div style={s.sub}>뉴스로 배우는 투자 교육 플랫폼</div>

      {mode === "login" && (
        <>
          <label style={s.label}>이메일</label>
          <input
            style={s.input}
            type="text"
            placeholder="가입 이메일"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={onKey}
            autoComplete="username"
          />
          <div style={{ marginTop: "-7px", marginBottom: "14px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            계정은 가입한 이메일 주소로 로그인할 수 있습니다.
          </div>
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
            {loading ? "로그인 중..." : "시작하기"}
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
          <label style={s.label}>이메일</label>
          <input
            style={s.input}
            type="email"
            placeholder="예: hanadreamers.newstock@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            autoComplete="email"
          />
          <div style={{ marginTop: "-6px", marginBottom: "14px", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface2)", fontSize: "12px", color: "var(--text-dim)", lineHeight: 1.55 }}>
            이메일은 <b style={{ color: "var(--text)" }}>로그인·계정 복구용</b>으로 사용되며 공개되지 않습니다.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "10px" }}>
            <div>
              <label style={s.label}>성</label>
              <input style={s.input} type="text" placeholder="예: 김" value={lastName} onChange={(e) => setLastName(e.target.value)} onKeyDown={onKey} autoComplete="family-name" maxLength={20} />
            </div>
            <div>
              <label style={s.label}>이름</label>
              <input style={s.input} type="text" placeholder="예: 민수" value={firstName} onChange={(e) => setFirstName(e.target.value)} onKeyDown={onKey} autoComplete="given-name" maxLength={20} />
            </div>
          </div>
          <div style={{ marginTop: "-7px", marginBottom: "14px", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            성과 이름을 합친 본명이 랭킹과 서비스 화면에 표시됩니다.
          </div>
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
            {loading ? "가입 중..." : "가입하고 시작"}
          </button>
          <div style={s.toggle}>
            <span style={s.link} onClick={() => reset("login")}>
              로그인으로 돌아가기
            </span>
          </div>
        </>
      )}

      {mode === "forgot" && (
        <>
          <div style={{ fontSize: "13px", color: "var(--text-dim)", marginBottom: "20px", lineHeight: 1.6 }}>
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            <br />
            메일이 보이지 않으면 스팸함도 확인해주세요.
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
          {message && <div style={s.msg}>{message}</div>}
          <button style={s.btn} onClick={handleForgot} disabled={loading || !!message}>
            {loading ? "전송 중..." : "재설정 링크 보내기"}
          </button>
          <div style={s.toggle}>
            <span style={s.link} onClick={() => reset("login")}>
              로그인으로 돌아가기
            </span>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";

interface HeaderProps {
  nickname: string;
  coins: number;
  streak: number;
  onLogout?: () => void;
}

export default function Header({ nickname, coins, streak, onLogout }: HeaderProps) {
  return (
    <header
        className="app-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
          padding: "13px 18px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius, 16px)",
        }}
      >
      <div
        className="app-header-brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          minWidth: 0,
          flex: "1 1 390px",
          flexWrap: "wrap",
        }}
      >
        <div
          className="app-header-logo"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Link href="/" aria-label="홈으로 이동" style={{ display: "inline-flex" }}>
            <img
              src="/logo.svg"
              alt="Newstock"
              style={{ height: "64px", width: "auto", cursor: "pointer" }}
            />
          </Link>
          <div
            className="app-header-logo-caption"
            style={{
              marginTop: "2px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            하나 드리머스
          </div>
        </div>
        <div
          className="app-header-meta"
          aria-label="Newstock 멘토와 팀원"
          style={{
            minWidth: 0,
            paddingLeft: "14px",
            borderLeft: "1px solid var(--border)",
            lineHeight: 1.45,
          }}
        >
          <div
            style={{
              fontSize: "clamp(10px, 1.35vw, 12px)",
              fontWeight: 700,
              color: "var(--text-dim)",
              whiteSpace: "nowrap",
            }}
          >
            하나금융TI 김형민 멘토님
          </div>
          <div
            style={{
              marginTop: "2px",
              fontSize: "clamp(10px, 1.35vw, 12px)",
              fontWeight: 700,
              color: "var(--text-dim)",
              whiteSpace: "normal",
              wordBreak: "keep-all",
            }}
          >
            × 하나고 김성준 · 김승민 · 이은우 · 최원준 · 허조영
          </div>
        </div>
      </div>

      <div
        className="app-header-actions"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          marginLeft: "auto",
        }}
      >
        {streak > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.18)",
              padding: "6px 11px",
              borderRadius: "100px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--warn)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            🔥 {streak}일
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
            padding: "6px 13px",
            borderRadius: "100px",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--coin)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          ₩{coins.toLocaleString()}
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "6px 13px",
            borderRadius: "100px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            fontSize: "12px",
            color: "var(--text-dim)",
            cursor: "pointer",
          }}
        >
          <span>{nickname}</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>로그아웃</span>
        </button>
      </div>
    </header>
  );
}

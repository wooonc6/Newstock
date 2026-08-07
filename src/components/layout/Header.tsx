"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
  nickname: string;
  coins: number;
  streak: number;
  onLogout?: () => void;
  onDeleteAccount?: () => Promise<void>;
}

export default function Header({ nickname, coins, streak, onLogout, onDeleteAccount }: HeaderProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!showDeleteModal) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) setShowDeleteModal(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteModal, deleting]);

  function openDeleteModal() {
    setConfirmation("");
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function handleDeleteAccount() {
    if (confirmation !== "탈퇴" || !onDeleteAccount) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await onDeleteAccount();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "회원 탈퇴에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <>
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

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
          <button
            type="button"
            onClick={openDeleteModal}
            style={{
              padding: "6px 10px",
              borderRadius: "100px",
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.28)",
              fontSize: "10px",
              color: "var(--danger)",
              cursor: "pointer",
            }}
          >
            회원 탈퇴
          </button>
        </div>
      </div>
      </header>

      {showDeleteModal && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setShowDeleteModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(15,23,42,0.58)",
            backdropFilter: "blur(4px)",
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-busy={deleting}
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-description"
            onSubmit={(event) => {
              event.preventDefault();
              void handleDeleteAccount();
            }}
            style={{
              width: "100%",
              maxWidth: "440px",
              padding: "24px",
              borderRadius: "18px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 70px rgba(15,23,42,0.24)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: "42px",
                height: "42px",
                display: "grid",
                placeItems: "center",
                marginBottom: "14px",
                borderRadius: "12px",
                background: "rgba(239,68,68,0.1)",
                color: "var(--danger)",
                fontSize: "21px",
                fontWeight: 900,
              }}
            >
              !
            </div>
            <h2 id="delete-account-title" style={{ margin: 0, fontSize: "20px", color: "var(--text)" }}>
              정말 회원 탈퇴할까요?
            </h2>
            <p
              id="delete-account-description"
              style={{ margin: "10px 0 18px", color: "var(--text-dim)", fontSize: "13px", lineHeight: 1.65 }}
            >
              계정과 함께 퀴즈 기록, 거래 내역, 보유 자산, 조건 주문이 모두 삭제되며 복구할 수 없습니다.
            </p>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-dim)", fontSize: "12px", fontWeight: 700 }}>
              계속하려면 아래에 <strong style={{ color: "var(--danger)" }}>탈퇴</strong>를 입력하세요.
            </label>
            <input
              autoFocus
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={deleting}
              placeholder="탈퇴"
              aria-label="회원 탈퇴 확인 문구"
              style={{
                width: "100%",
                padding: "12px 13px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                outline: "none",
              }}
            />
            {deleteError && (
              <p role="alert" style={{ margin: "10px 0 0", color: "var(--danger)", fontSize: "12px", lineHeight: 1.5 }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-dim)",
                  fontWeight: 800,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={confirmation !== "탈퇴" || deleting}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--danger)",
                  color: "white",
                  fontWeight: 800,
                  cursor: confirmation === "탈퇴" && !deleting ? "pointer" : "not-allowed",
                  opacity: confirmation === "탈퇴" && !deleting ? 1 : 0.45,
                }}
              >
                {deleting ? "탈퇴 처리 중..." : "계정 영구 삭제"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

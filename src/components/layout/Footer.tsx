"use client";

import { useEffect, useState } from "react";

interface FooterProps {
  onDeleteAccount?: () => Promise<void>;
}

export default function Footer({ onDeleteAccount }: FooterProps) {
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
      <footer
      style={{
        marginTop: "36px",
        padding: "20px 0 6px",
        borderTop: "1px solid var(--border)",
        color: "var(--text-muted)",
        fontSize: "12px",
        lineHeight: 1.7,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-dim)" }}>문의 및 오류 제보</div>
          <div>서비스 이용 중 불편한 점이나 개선 의견을 보내주세요.</div>
          {onDeleteAccount && (
            <button
              type="button"
              onClick={openDeleteModal}
              style={{
                marginTop: "8px",
                padding: 0,
                border: "none",
                background: "transparent",
                color: "var(--danger)",
                fontSize: "11px",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                cursor: "pointer",
              }}
            >
              회원 탈퇴
            </button>
          )}
        </div>
        <a
          href="mailto:hanadreamers.newstock@gmail.com"
          style={{
            color: "var(--accent2)",
            fontWeight: 700,
            textDecoration: "none",
            wordBreak: "break-all",
          }}
        >
          hanadreamers.newstock@gmail.com
        </a>
      </div>
      </footer>

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

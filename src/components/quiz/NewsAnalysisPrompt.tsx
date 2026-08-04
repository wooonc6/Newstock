"use client";

import { useState } from "react";
import {
  createNewsAnalysisPrompt,
  type NewsAnalysisPromptInput,
} from "@/lib/quizPrompt";

export default function NewsAnalysisPrompt({ item }: { item: NewsAnalysisPromptInput }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const prompt = createNewsAnalysisPrompt(item);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      style={{
        marginBottom: "12px",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          color: "var(--text-dim)",
          padding: 0,
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          fontSize: "12px",
          fontWeight: 800,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>생성형 AI로 상승·하락 원인 분석하기</span>
        <span aria-hidden="true">{isOpen ? "접기" : "열기"}</span>
      </button>

      {isOpen ? (
        <div style={{ marginTop: "10px", display: "grid", gap: "9px" }}>
          <textarea
            readOnly
            value={prompt}
            aria-label={`${item.company} 뉴스 분석 프롬프트`}
            style={{
              width: "100%",
              minHeight: "190px",
              resize: "vertical",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              background: "var(--surface2)",
              color: "var(--text-dim)",
              padding: "11px",
              font: "inherit",
              fontSize: "12px",
              lineHeight: 1.55,
            }}
          />
          <button type="button" onClick={handleCopy} style={secondaryButtonStyle}>
            {copied ? "복사했습니다" : "분석 프롬프트 복사"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: "13px",
  borderRadius: "8px",
  background: "var(--surface)",
  color: "var(--text-dim)",
  border: "1px solid var(--border)",
  fontSize: "14px",
  fontWeight: 800,
  cursor: "pointer",
};

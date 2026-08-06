"use client";

import { useState } from "react";

type Tab = "quiz" | "history";

interface Props {
  quiz: React.ReactNode;
  history: React.ReactNode;
}

export default function AnalysisTabs({ quiz, history }: Props) {
  const [tab, setTab] = useState<Tab>("quiz");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setTab("quiz")}
          style={tabStyle(tab === "quiz")}
        >
          📊 퀴즈 분석
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          style={tabStyle(tab === "history")}
        >
          🗂️ 학습 기록
        </button>
      </div>

      {tab === "quiz" ? quiz : history}
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "14px 18px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: active ? 800 : 600,
    color: "var(--text)",
    borderBottom: active ? "3px solid var(--accent)" : "3px solid transparent",
    whiteSpace: "nowrap",
  };
}

"use client";

import { useState } from "react";

type Tab = "growth" | "quiz" | "history";

interface Props {
  growth: React.ReactNode;
  quiz: React.ReactNode;
  history: React.ReactNode;
}

export default function AnalysisTabs({
  growth,
  quiz,
  history,
}: Props) {
  const [tab, setTab] = useState<Tab>("growth");

  const tabs: { id: Tab; label: string }[] = [
    { id: "growth", label: "MY GROWTH" },
    { id: "quiz", label: "퀴즈 분석" },
    { id: "history", label: "학습 기록" },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "12px 18px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: tab === t.id ? 700 : 500,
              borderBottom:
                tab === t.id
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
              color: "var(--text)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "growth" && growth}
      {tab === "quiz" && quiz}
      {tab === "history" && history}
    </>
  );
}

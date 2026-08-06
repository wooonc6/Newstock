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
  const [tab, setTab] = useState<Tab>("quiz");

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    {
      id: "growth",
      label: "투자 성과",
      emoji: "📈",
    },
    {
      id: "quiz",
      label: "퀴즈 분석",
      emoji: "📊",
    },
    {
      id: "history",
      label: "학습 기록",
      emoji: "🗂️",
    },
  ];

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
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            style={{
              padding: "14px 18px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: tab === tabItem.id ? 800 : 600,
              color: "var(--text)",
              borderBottom:
                tab === tabItem.id
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {tabItem.emoji} {tabItem.label}
          </button>
        ))}
      </div>

      {tab === "growth" && growth}
      {tab === "quiz" && quiz}
      {tab === "history" && history}
    </div>
  );
}

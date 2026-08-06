"use client";

import { useState } from "react";

type Tab = "overview" | "performance";

export default function AssetsTabs({
  overview,
  performance,
}: {
  overview: React.ReactNode;
  performance: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 18,
          padding: 5,
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--surface)",
          overflowX: "auto",
        }}
      >
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          💼 자산 현황
        </TabButton>
        <TabButton active={tab === "performance"} onClick={() => setTab("performance")}>
          📈 투자 성과
        </TabButton>
      </div>

      {tab === "overview" ? overview : <div className="asset-performance">{performance}</div>}

      <style jsx global>{`
        @media (max-width: 640px) {
          .asset-performance .mobile-grid-4 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .asset-performance [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }

          .asset-performance svg {
            min-width: 560px;
          }

          .asset-performance svg + div {
            position: sticky;
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "1 0 140px",
        padding: "10px 14px",
        border: active ? "1px solid rgba(0,168,120,0.28)" : "1px solid transparent",
        borderRadius: 9,
        background: active ? "rgba(0,168,120,0.09)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-dim)",
        fontSize: 13,
        fontWeight: active ? 800 : 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

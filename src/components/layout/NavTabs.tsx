"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/quiz", label: "퀴즈" },
  { href: "/portfolio", label: "모의투자" },
  { href: "/ranking", label: "랭킹" },
  { href: "/history", label: "기록" },
  { href: "/analysis", label: "분석" },
] as const;

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: "3px",
        marginBottom: "20px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "5px",
        overflowX: "auto",
      }}
    >
      {TABS.map(({ href, label }) => {
        const active =
          pathname === href ||
          (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
          (href === "/analysis" && pathname.startsWith("/stats"));
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              minWidth: "58px",
              padding: "9px 6px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              color: active ? "var(--text)" : "var(--text-muted)",
              background: active ? "var(--surface2)" : "transparent",
              textAlign: "center",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

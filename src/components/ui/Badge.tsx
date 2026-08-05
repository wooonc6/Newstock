import { ReactNode } from "react";

type BadgeVariant = "sector" | "rank" | "status";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  color?: string;
  background?: string;
  /** variant="rank"일 때만 사용, 1~3위는 메달 이모지로 표시 */
  rank?: number;
}

const RANK_MEDALS: Record<1 | 2 | 3, { emoji: string; background: string; color: string }> = {
  1: { emoji: "🥇", background: "#fff6df", color: "#a9790a" },
  2: { emoji: "🥈", background: "#f1f3f6", color: "#5b6472" },
  3: { emoji: "🥉", background: "#fdeee1", color: "#a15a2a" },
};

export default function Badge({ children, variant = "sector", color, background, rank }: BadgeProps) {
  if (variant === "rank") {
    const medal = rank && rank <= 3 ? RANK_MEDALS[rank as 1 | 2 | 3] : null;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 10px",
          borderRadius: "999px",
          fontSize: "12px",
          fontWeight: 800,
          background: medal?.background ?? "var(--surface2)",
          color: medal?.color ?? "var(--text-dim)",
        }}
      >
        {medal ? <span>{medal.emoji}</span> : null}
        {children}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 700,
        background: background ?? "var(--surface2)",
        color: color ?? "var(--text-dim)",
      }}
    >
      {children}
    </span>
  );
}

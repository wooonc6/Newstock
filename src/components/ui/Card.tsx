"use client";

import { CSSProperties, MouseEvent, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  padding?: string;
  /** 마우스 오버 시 살짝 떠오르는 토스식 카드 인터랙션 */
  hoverable?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
}

const REST_SHADOW = "0 2px 10px rgba(20, 30, 50, 0.05)";
const HOVER_SHADOW = "0 10px 24px rgba(20, 30, 50, 0.09)";

export default function Card({ children, padding = "20px", hoverable = false, style, onClick }: CardProps) {
  function handleEnter(e: MouseEvent<HTMLDivElement>) {
    if (!hoverable) return;
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = HOVER_SHADOW;
  }

  function handleLeave(e: MouseEvent<HTMLDivElement>) {
    if (!hoverable) return;
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = REST_SHADOW;
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "18px",
        padding,
        boxShadow: REST_SHADOW,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

"use client";

import { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "danger";
type ButtonSize = "md" | "sm";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
  style?: CSSProperties;
}

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--accent2)",
    color: "#ffffff",
    border: "1px solid transparent",
  },
  outline: {
    background: "var(--surface)",
    color: "var(--accent2)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--danger)",
    color: "#ffffff",
    border: "1px solid transparent",
  },
};

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  md: { padding: "14px 22px", fontSize: "15px", borderRadius: "14px" },
  sm: { padding: "9px 14px", fontSize: "13px", borderRadius: "10px" },
};

// 토스 특유의 "꾹 눌리는" 버튼 - 클릭 시 살짝 눌리는 스케일 애니메이션이 핵심
export default function Button({
  variant = "primary",
  size = "md",
  children,
  fullWidth,
  disabled,
  style,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        width: fullWidth ? "100%" : undefined,
        fontWeight: 700,
        fontFamily: "'Noto Sans KR', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ?

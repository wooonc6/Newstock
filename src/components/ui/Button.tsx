'use client'

import { ButtonHTMLAttributes, useState } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger'
  size?: 'sm' | 'md'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = useState(false)

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    borderRadius: '100px',
    fontFamily: "'Noto Sans KR', sans-serif",
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    opacity: disabled ? 0.35 : 1,
    ...(size === 'sm'
      ? { padding: '7px 14px', fontSize: '12px' }
      : { padding: '10px 20px', fontSize: '13px' }),
  }

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--accent)',
          color: '#071013',
          ...(hovered && !disabled
            ? {
                filter: 'brightness(1.1)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(0,229,176,0.22)',
              }
            : {}),
        }
      : variant === 'outline'
      ? {
          background: 'transparent',
          border: '1px solid var(--border)',
          color: hovered ? 'var(--text)' : 'var(--text-dim)',
          borderColor: hovered ? 'rgba(255,255,255,0.18)' : undefined,
        }
      : {
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#fca5a5',
        }

  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variantStyle, ...style }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </button>
  )
}

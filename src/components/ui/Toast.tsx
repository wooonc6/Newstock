'use client'

import { useEffect } from 'react'

type ToastVariant = 'ok' | 'warn' | 'bad'

interface ToastProps {
  show: boolean
  onClose: () => void
  variant?: ToastVariant
  title: string
  message?: string
  duration?: number  // ms — 0이면 자동 닫힘 없음
}

const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
  ok:   { background: 'rgba(0,229,176,.08)',  border: '1px solid rgba(0,229,176,.2)',  color: 'var(--accent)' },
  warn: { background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', color: 'var(--warn)' },
  bad:  { background: 'rgba(239,68,68,.08)',  border: '1px solid rgba(239,68,68,.2)',  color: '#fca5a5' },
}

const ICONS: Record<ToastVariant, string> = {
  ok: '✓',
  warn: '⚠',
  bad: '✕',
}

export default function Toast({
  show,
  onClose,
  variant = 'ok',
  title,
  message,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!show || duration === 0) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [show, duration, onClose])

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '14px 16px',
        borderRadius: '12px',
        maxWidth: '320px',
        animation: 'fadeUp 0.3s ease',
        ...VARIANT_STYLES[variant],
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1.4 }}>
        {ICONS[variant]}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: message ? '3px' : 0 }}>
          {title}
        </div>
        {message && (
          <div style={{ fontSize: '12px', opacity: 0.8, lineHeight: 1.5 }}>
            {message}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          opacity: 0.6,
          fontSize: '14px',
          padding: '0 0 0 8px',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}

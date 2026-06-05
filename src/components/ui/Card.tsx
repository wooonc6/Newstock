import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: string | number
  hover?: boolean
}

export default function Card({
  children,
  padding = '20px',
  hover = false,
  style,
  ...props
}: CardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding,
        transition: hover ? 'border-color 0.2s, background 0.2s' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

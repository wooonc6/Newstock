import type { Stock } from '@/types'

type SectorColor = Stock['sectorColor']
type RankNum = 1 | 2 | 3

interface SectorBadgeProps {
  variant: SectorColor
  children: React.ReactNode
  style?: React.CSSProperties
}

interface RankBadgeProps {
  rank: RankNum
}

const SECTOR_STYLES: Record<SectorColor, React.CSSProperties> = {
  blue:   { background: 'rgba(59,130,246,.15)',  color: '#60a5fa' },
  green:  { background: 'rgba(0,229,176,.12)',   color: 'var(--accent)' },
  amber:  { background: 'rgba(245,158,11,.12)',  color: 'var(--warn)' },
  purple: { background: 'rgba(168,85,247,.12)',  color: '#c084fc' },
  red:    { background: 'rgba(239,68,68,.15)',   color: '#fca5a5' },
}

const RANK_STYLES: Record<RankNum, React.CSSProperties> = {
  1: { background: 'rgba(251,191,36,.15)',  color: '#fbbf24' },
  2: { background: 'rgba(148,163,184,.12)', color: '#94a3b8' },
  3: { background: 'rgba(180,120,60,.12)',  color: '#cd7f32' },
}

const RANK_EMOJI: Record<RankNum, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

const base: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 9px',
  borderRadius: '100px',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.8px',
  whiteSpace: 'nowrap',
}

export function SectorBadge({ variant, children, style }: SectorBadgeProps) {
  return (
    <span style={{ ...base, ...SECTOR_STYLES[variant], ...style }}>
      {children}
    </span>
  )
}

export function RankBadge({ rank }: RankBadgeProps) {
  return (
    <span style={{ ...base, ...RANK_STYLES[rank] }}>
      {RANK_EMOJI[rank]} {rank}위
    </span>
  )
}

export default SectorBadge

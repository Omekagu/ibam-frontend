import type { CSSProperties } from 'react'
import s from './Loader.module.scss'

interface LoaderProps {
  variant?: 'ring' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  overlay?: boolean
  inline?: boolean
}

export function Loader ({
  variant = 'ring',
  size = 'md',
  label,
  overlay = false,
  inline = false,
}: LoaderProps) {
  const spinner =
    variant === 'dots' ? (
      <div className={`${s.dots} ${size === 'sm' ? s.dotsSm : size === 'lg' ? s.dotsLg : ''}`}>
        <span /><span /><span />
      </div>
    ) : (
      <div className={`${s.ring} ${size === 'sm' ? s.ringSm : size === 'lg' ? s.ringLg : ''}`} />
    )

  if (overlay) {
    return (
      <div className={s.overlay} role='status' aria-label={label ?? 'Loading'}>
        <div className={s.overlayBox}>
          {spinner}
          {label && <span className={s.label}>{label}</span>}
        </div>
      </div>
    )
  }

  if (inline) {
    return (
      <span className={s.inline} role='status' aria-label={label ?? 'Loading'}>
        {spinner}
        {label && <span className={s.label}>{label}</span>}
      </span>
    )
  }

  return (
    <div className={s.box} role='status' aria-label={label ?? 'Loading'}>
      {spinner}
      {label && <span className={s.label}>{label}</span>}
    </div>
  )
}

// ── Skeleton block ─────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number
  height?: string | number
  style?: CSSProperties
}

export function Skeleton ({ width = '100%', height = '1rem', style }: SkeletonProps) {
  return (
    <div
      className={s.skeleton}
      style={{ width, height, ...style }}
      aria-hidden='true'
    />
  )
}

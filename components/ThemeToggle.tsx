'use client'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle () {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--input-bg)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color 0.15s, color 0.15s',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon () {
  return (
    <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <circle cx='12' cy='12' r='5' strokeWidth='2' />
      <path strokeLinecap='round' strokeWidth='2'
        d='M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42' />
    </svg>
  )
}

function MoonIcon () {
  return (
    <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'
        d='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' />
    </svg>
  )
}

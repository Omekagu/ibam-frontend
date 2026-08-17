'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Theme = 'light' | 'dark'

// Routes where the user's stored theme preference applies.
// Match exact (/doctor) AND sub-paths (/doctor/kyc) but not partial (/doctorwhatever).
const PORTAL_ROOTS = ['/patient', '/doctor', '/admin', '/partner']

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider ({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = PORTAL_ROOTS.some(p => pathname === p || pathname.startsWith(p + '/'))

  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    if (!isPortal) {
      document.documentElement.setAttribute('data-theme', 'dark')
      return
    }
    const stored = localStorage.getItem('theme') as Theme | null
    const initial = stored ?? 'dark'
    setTheme(initial)
    applyTheme(initial)
    setCookie(initial)
  }, [isPortal])

  function toggle () {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      localStorage.setItem('theme', next)
      setCookie(next)
      return next
    })
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme () {
  return useContext(ThemeCtx)
}

function applyTheme (t: Theme) {
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
}

function setCookie (t: Theme) {
  document.cookie = `theme=${t}; path=/; max-age=31536000; SameSite=Lax`
}

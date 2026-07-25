'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Theme = 'light' | 'dark'

// Routes where the user's stored theme preference applies
const PORTAL_PREFIXES = ['/patient/', '/doctor/', '/admin/', '/partner/']

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider ({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))

  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    if (!isPortal) {
      // Public / auth / marketing pages are always dark
      document.documentElement.setAttribute('data-theme', 'dark')
      return
    }
    const stored = localStorage.getItem('theme') as Theme | null
    const initial = stored ?? 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [isPortal])

  function toggle () {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      localStorage.setItem('theme', next)
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

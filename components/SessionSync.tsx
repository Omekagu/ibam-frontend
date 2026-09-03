'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getStoredUser } from '@/lib/auth'
import { dashboardFor } from '@/hooks/useAuthRedirect'

const AUTH_PAGES  = ['/login', '/signup', '/onboard']
const PUBLIC_ONLY = ['/login', '/signup', '/onboard', '/verify-email']

/**
 * Syncs login/logout state across browser tabs.
 * Mounted once at the root layout level.
 */
export default function SessionSync () {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    function onStorage (e: StorageEvent) {
      if (e.key !== 'access_token') return

      if (e.newValue) {
        // Another tab logged in — redirect away from auth pages
        if (PUBLIC_ONLY.some(p => pathname.startsWith(p))) {
          const user = getStoredUser()
          router.replace(dashboardFor(user?.role, user?.adminRole))
        }
      } else {
        // Another tab logged out — redirect portal pages to login
        const isPortal = ['/patient/', '/doctor/', '/admin/', '/partner/', '/lab'].some(p => pathname.startsWith(p))
        if (isPortal) {
          router.replace('/login')
        }
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [pathname, router])

  return null
}

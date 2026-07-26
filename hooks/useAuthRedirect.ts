'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, getStoredUser } from '@/lib/auth'

export function dashboardFor (role?: string): string {
  if (role === 'doctor')           return '/doctor'
  if (role === 'admin')            return '/admin'
  if (role === 'pharmacy_partner') return '/partner/pharmacy'
  if (role === 'lab_partner')      return '/partner/lab'
  return '/patient'
}

/**
 * Redirect authenticated users away from public/auth pages.
 * Call this at the top of login, signup, and onboard pages.
 */
export function useAuthRedirect () {
  const router = useRouter()

  useEffect(() => {
    if (!isLoggedIn()) return
    const user = getStoredUser()
    router.replace(dashboardFor(user?.role))
  }, [router])
}

'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { persistFromOAuth } from '@/lib/auth'

export default function GoogleCallbackPage () {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const userRaw = searchParams.get('user')
    const error = searchParams.get('error')

    if (error) {
      router.replace('/login?error=' + encodeURIComponent(error))
      return
    }

    if (!token || !userRaw) {
      router.replace('/login?error=google_failed')
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw))
      persistFromOAuth(
        decodeURIComponent(token),
        decodeURIComponent(refreshToken ?? ''),
        user
      )
      if (user.role === 'admin') router.replace('/admin')
      else if (user.role === 'doctor') router.replace('/doctor')
      else if (user.role === 'pharmacy_partner') router.replace('/partner/pharmacy')
      else if (user.role === 'lab_partner') router.replace('/partner/lab')
      else router.replace('/patient')
    } catch {
      router.replace('/login?error=google_failed')
    }
  }, [searchParams, router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'inherit'
    }}>
      <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
        Completing Google sign-in…
      </p>
    </div>
  )
}

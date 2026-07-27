'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import api from '@/lib/api'
import s from './page.module.scss'

export default function ResetPasswordPage ({
  params
}: {
  params: { token: string }
}) {
  useAuthRedirect()
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit (e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.patch(`/auth/reset-password/${params.token}`, { password })
      setDone(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Link is invalid or has expired.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <AuthBrandPanel />

      <div className={s.formPanel}>
        <div className={s.formWrap}>
          <Link href='/' className={s.mobileHeader}>
            <Image src='/Ibam Logo Png.png' alt='iBam Health' width={36} height={36} />
            <span>iBam <em>Health</em></span>
          </Link>

          {done ? (
            <div className={s.success}>
              <div className={s.successIcon}>
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h2>Password updated!</h2>
              <p>Your password has been changed. Redirecting you to login…</p>
              <Link href='/login' className={s.backBtn}>Go to Login</Link>
            </div>
          ) : (
            <>
              <h1 className={s.formTitle}>Set new password</h1>
              <p className={s.formSub}>Choose a strong password for your account.</p>

              {error && <p className={s.errorBanner}>{error}</p>}

              <form onSubmit={handleSubmit}>
                <div className={s.field}>
                  <label htmlFor='password'>New Password</label>
                  <input
                    id='password'
                    type='password'
                    placeholder='At least 8 characters'
                    autoComplete='new-password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={s.field}>
                  <label htmlFor='confirm'>Confirm Password</label>
                  <input
                    id='confirm'
                    type='password'
                    placeholder='Repeat your password'
                    autoComplete='new-password'
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>

                <button type='submit' className={s.submit} disabled={loading}>
                  {loading ? 'Saving…' : 'Reset Password →'}
                </button>
              </form>

              <p className={s.backLink}>
                <Link href='/login'>← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

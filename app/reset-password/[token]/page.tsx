'use client'
import { useState, FormEvent, use } from 'react'
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
  params: Promise<{ token: string }>
}) {
  useAuthRedirect()
  const { token } = use(params)
  const router = useRouter()
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState('')

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
      await api.patch(`/auth/reset-password/${token}`, { password })
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
                  <div className={s.fieldInner}>
                    <input
                      id='password'
                      type={showPw ? 'text' : 'password'}
                      placeholder='At least 8 characters'
                      autoComplete='new-password'
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type='button' className={s.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div className={s.field}>
                  <label htmlFor='confirm'>Confirm Password</label>
                  <div className={s.fieldInner}>
                    <input
                      id='confirm'
                      type={showConfirm ? 'text' : 'password'}
                      placeholder='Repeat your password'
                      autoComplete='new-password'
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                    />
                    <button type='button' className={s.eyeBtn} onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
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

function EyeIcon () {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function EyeOffIcon () {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24' />
      <line x1='1' y1='1' x2='23' y2='23' />
    </svg>
  )
}

'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import api from '@/lib/api'
import s from './page.module.scss'

export default function ForgotPasswordPage () {
  useAuthRedirect()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit (e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Something went wrong. Please try again.'
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

          {sent ? (
            <div className={s.success}>
              <div className={s.successIcon}>
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h2>Check your email</h2>
              <p>
                We sent a password reset link to <strong>{email}</strong>.
                The link expires in 10 minutes.
              </p>
              <Link href='/login' className={s.backBtn}>Back to Login</Link>
            </div>
          ) : (
            <>
              <h1 className={s.formTitle}>Forgot password?</h1>
              <p className={s.formSub}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && <p className={s.errorBanner}>{error}</p>}

              <form onSubmit={handleSubmit}>
                <div className={s.field}>
                  <label htmlFor='email'>Email Address</label>
                  <input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    autoComplete='email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type='submit' className={s.submit} disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link →'}
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

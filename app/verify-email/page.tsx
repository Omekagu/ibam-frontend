'use client'
import { useState, FormEvent, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { sendEmailOTP, verifyEmailOTP } from '@/lib/auth'
import s from './page.module.scss'

function VerifyEmailForm () {
  const params = useSearchParams()
  const [email,   setEmail]   = useState(params.get('email') ?? '')
  const [otp,     setOtp]     = useState('')
  const [sent,    setSent]    = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  // Auto-send if email pre-filled from query param
  useEffect(() => {
    const q = params.get('email')
    if (q) { setEmail(q); handleSend(q) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend (emailArg?: string) {
    const target = emailArg ?? email
    if (!target) { setError('Enter your email address.'); return }
    setSending(true); setError('')
    try {
      await sendEmailOTP(target)
      setSent(true)
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to send code. Try again.'
      )
    } finally { setSending(false) }
  }

  async function handleVerify (e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await verifyEmailOTP(email, otp)
      setDone(true)
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired code.'
      )
    } finally { setLoading(false) }
  }

  return (
    <div className={s.card}>
      <Link href='/' className={s.logo}>
        <Image src='/Ibam Logo Png.png' alt='iBam' width={28} height={28} style={{ borderRadius: 8 }} />
        <span>iBam <em>Health</em></span>
      </Link>

      {done ? (
        <div className={s.success}>
          <div className={s.successIcon}>✓</div>
          <h2>Email verified!</h2>
          <p>Your email address has been confirmed. You can now log in.</p>
          <Link href='/login' className={s.backBtn}>Go to Login →</Link>
        </div>
      ) : (
        <>
          <h1 className={s.title}>Verify your email</h1>
          <p className={s.sub}>
            {sent
              ? `We sent a 6-digit code to ${email}. Enter it below.`
              : 'Enter your email and we\'ll send you a verification code.'}
          </p>

          {error && <p className={s.error}>{error}</p>}

          <form onSubmit={handleVerify}>
            <div className={s.field}>
              <label>Email Address</label>
              <input
                type='email' value={email} placeholder='you@example.com'
                onChange={e => { setEmail(e.target.value); setSent(false) }}
                required
              />
            </div>

            {sent && (
              <div className={s.field}>
                <label>Verification Code</label>
                <input
                  type='text' inputMode='numeric' placeholder='000000'
                  maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={s.otpInput} required
                />
              </div>
            )}

            {!sent ? (
              <button type='button' className={s.btn} disabled={sending} onClick={() => handleSend()}>
                {sending ? 'Sending…' : 'Send Code'}
              </button>
            ) : (
              <>
                <button type='submit' className={s.btn} disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify Email'}
                </button>
                <button type='button' className={s.resendBtn} disabled={sending} onClick={() => handleSend()}>
                  {sending ? 'Resending…' : 'Resend code'}
                </button>
              </>
            )}
          </form>

          <Link href='/login' className={s.backLink}>← Back to Login</Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage () {
  return (
    <div className={s.page}>
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </div>
  )
}

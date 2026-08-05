'use client'
import { useState, useRef, useEffect, KeyboardEvent, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { sendEmailOTP, verifyEmailOTP, getStoredUser, updateStoredUser } from '@/lib/auth'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import { useStatusModal } from '@/components/StatusModal'
import s from './page.module.scss'

const BOXES = 6

function MailIcon () {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.8} strokeLinecap='round' strokeLinejoin='round'>
      <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
      <polyline points='22,6 12,13 2,6' />
    </svg>
  )
}

function VerifyEmailForm () {
  const modal = useStatusModal()
  const params = useSearchParams()
  const router = useRouter()

  const [email,   setEmail]   = useState(params.get('email') ?? '')
  const [digits,  setDigits]  = useState<string[]>(Array(BOXES).fill(''))
  const [sent,    setSent]    = useState(false)
  const [done,    setDone]    = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)

  const boxRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const q = params.get('email')
    if (q) handleSend(q)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend (emailArg?: string) {
    const target = (emailArg ?? email).trim()
    if (!target) { modal.show({ variant: 'declined', title: 'Email Required', message: 'Enter your email address.' }); return }
    setSending(true)
    try {
      await sendEmailOTP(target)
      setEmail(target)
      setSent(true)
      setTimeout(() => boxRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Send Failed', message:
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to send code. Try again.'
      })
    } finally { setSending(false) }
  }

  function onType (text: string, i: number) {
    const val = text.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < BOXES - 1) boxRefs.current[i + 1]?.focus()
  }

  function onKeyDown (e: KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      boxRefs.current[i - 1]?.focus()
    }
  }

  async function handleVerify () {
    const otp = digits.join('')
    if (otp.length < BOXES) return
    setLoading(true)
    try {
      await verifyEmailOTP(email, otp)
      updateStoredUser({ isVerified: true })
      setDone(true)
      const user = getStoredUser()
      const dest =
        user?.role === 'doctor'            ? '/doctor/kyc'        :
        user?.role === 'admin'             ? '/admin'             :
        user?.role === 'pharmacy_partner'  ? '/partner/pharmacy'  :
        user?.role === 'lab_partner'       ? '/partner/lab'       :
        '/patient'
      setTimeout(() => router.replace(dest), 1500)
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Verification Failed', message:
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired code.'
      })
    } finally { setLoading(false) }
  }

  const filled = digits.every(d => d.length > 0)

  if (done) {
    return (
      <div className={s.success}>
        <div className={s.successIcon}>✓</div>
        <h2>Email verified!</h2>
        <p>Your email address has been confirmed.<br />Taking you to your dashboard…</p>
      </div>
    )
  }

  return (
    <>
      <div className={s.iconBadge}><MailIcon /></div>

      {!sent ? (
        <>
          <h1 className={s.formTitle}>Verify your email</h1>
          <p className={s.formSub}>
            Enter your email and we&apos;ll send you a 6-digit verification code.
          </p>

          <div className={s.field}>
            <label htmlFor='ve-email'>Email Address</label>
            <input
              id='ve-email'
              type='email'
              placeholder='you@example.com'
              value={email}
              onChange={e => { setEmail(e.target.value); setSent(false) }}
              required
            />
          </div>

          <button className={s.submit} disabled={sending || !email.trim()} onClick={() => handleSend()}>
            {sending ? 'Sending…' : 'Send Code →'}
          </button>
        </>
      ) : (
        <>
          <h1 className={s.formTitle}>Check your email</h1>
          <p className={s.formSub}>
            We sent a 6-digit code to <strong>{email}</strong>.
            Enter it below to verify your account.
          </p>

          <div className={s.otpRow}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={r => { boxRefs.current[i] = r }}
                className={`${s.otpBox} ${d ? s.otpBoxFilled : ''}`}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={d}
                onChange={e => onType(e.target.value, i)}
                onKeyDown={e => onKeyDown(e, i)}
              />
            ))}
          </div>

          <button className={s.submit} disabled={!filled || loading} onClick={handleVerify}>
            {loading ? 'Verifying…' : 'Verify Email →'}
          </button>

          <button className={s.resendBtn} disabled={sending} onClick={() => handleSend()}>
            {sending ? 'Resending…' : 'Resend code'}
          </button>

          <button
            className={s.backLink}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
            onClick={() => { setSent(false); setDigits(Array(BOXES).fill('')) }}
          >
            ← Change email
          </button>
        </>
      )}

      <Link href='/login' className={s.backLink}>← Back to Login</Link>
    </>
  )
}

export default function VerifyEmailPage () {
  return (
    <div className={s.page}>
      <AuthBrandPanel />

      <div className={s.formPanel}>
        <div className={s.formWrap}>
          <Link href='/' className={s.mobileHeader}>
            <Image src='/Ibam Logo Png.png' alt='iBam Health' width={36} height={36} />
            <span>iBam <em>Health</em></span>
          </Link>

          <Suspense>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

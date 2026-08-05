'use client'
import { useState, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import s from './page.module.scss'

type LoginMode = 'email' | 'phone'

function EyeIcon () {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      width={18}
      height={18}
    >
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  )
}

function EyeOffIcon () {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      width={18}
      height={18}
    >
      <path d='M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24' />
      <line x1='1' y1='1' x2='23' y2='23' />
    </svg>
  )
}

export default function LoginPage () {
  useAuthRedirect()
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit (e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload =
        mode === 'email' ? { email, password } : { phone, password }
      const { user } = await login(payload)
      if (user.role === 'admin') router.push('/admin')
      else if (user.role === 'doctor') router.push('/doctor')
      else if (user.role === 'pharmacy_partner')
        router.push('/partner/pharmacy')
      else if (user.role === 'lab_partner') router.push('/partner/lab')
      else router.push('/patient')
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { message?: string } }
      }
      const msg = e?.response?.data?.message ?? 'Invalid credentials'
      if (
        e?.response?.status === 403 &&
        msg.toLowerCase().includes('verify your email')
      ) {
        const target = mode === 'email' ? email : ''
        router.push(
          `/verify-email${target ? `?email=${encodeURIComponent(target)}` : ''}`
        )
        return
      }
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
            <Image
              src='/Ibam Logo Png.png'
              alt='iBam Health'
              width={36}
              height={36}
            />
            <span>
              iBam <em>Health</em>
            </span>
          </Link>

          <h1 className={s.formTitle}>Welcome back</h1>
          <p className={s.formSub}>
            New to iBam? <Link href='/signup'>Create an account</Link>
          </p>

          {error && <p className={s.errorBanner}>{error}</p>}

          <div className={s.modeToggle}>
            <button
              type='button'
              className={`${s.modeBtn} ${
                mode === 'email' ? s.modeBtnActive : ''
              }`}
              onClick={() => {
                setMode('email')
                setError('')
              }}
            >
              Email
            </button>
            <button
              type='button'
              className={`${s.modeBtn} ${
                mode === 'phone' ? s.modeBtnActive : ''
              }`}
              onClick={() => {
                setMode('phone')
                setError('')
              }}
            >
              Phone Number
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'email' ? (
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
            ) : (
              <div className={s.field}>
                <label htmlFor='phone'>Phone Number</label>
                <input
                  id='phone'
                  type='tel'
                  placeholder='+234 800 000 0000'
                  autoComplete='tel'
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={s.field}>
              <label htmlFor='password'>Password</label>
              <div className={s.fieldInner}>
                <input
                  id='password'
                  type={showPw ? 'text' : 'password'}
                  placeholder='••••••••'
                  autoComplete='current-password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type='button'
                  className={s.eyeBtn}
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className={s.meta}>
              <label>
                <input type='checkbox' /> Remember me
              </label>
              <Link href='/forgot-password'>Forgot password?</Link>
            </div>

            <button type='submit' className={s.submit} disabled={loading}>
              {loading ? 'Logging in…' : 'Log In →'}
            </button>
          </form>

          <div className={s.dividerRow}>
            <span className={s.dividerLine} />
            <span className={s.dividerLabel}>or</span>
            <span className={s.dividerLine} />
          </div>

          <button
            type='button'
            className={s.googleBtn}
            onClick={() => {
              const api =
                process.env.NEXT_PUBLIC_API_URL ??
                'https://api.ibamhealth.com/api'
              const cb = window.location.origin + '/auth/google/callback'
              window.location.href = `${api}/auth/google?platform=web&redirectUrl=${encodeURIComponent(
                cb
              )}`
            }}
          >
            <span className={s.googleIconWrap}>G</span>
            Continue with Google
          </button>

          <p className={s.signup}>
            Don&apos;t have an account? <Link href='/signup'>Sign up free</Link>
          </p>

          <div className={s.verifyLink}>
            <Link href='/verify-email'>Verify your email →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

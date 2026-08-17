'use client'
import { useState, FormEvent, Suspense, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { login } from '@/lib/auth'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

type LoginMode = 'email' | 'phone'

function GoogleIcon () {
  return (
    <svg
      viewBox='0 0 24 24'
      width='20'
      height='20'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
        fill='#4285F4'
      />
      <path
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
        fill='#34A853'
      />
      <path
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
        fill='#FBBC05'
      />
      <path
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
        fill='#EA4335'
      />
    </svg>
  )
}

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

function LoginInner () {
  useAuthRedirect()
  const modal = useStatusModal()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const msg = searchParams.get('error')
    if (msg)
      modal.show({
        variant: 'declined',
        title: 'Login Error',
        message: decodeURIComponent(msg)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit (e: FormEvent) {
    e.preventDefault()
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
      modal.show({ variant: 'declined', title: 'Login Failed', message: msg })
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

          <div className={s.modeToggle}>
            <button
              type='button'
              className={`${s.modeBtn} ${
                mode === 'email' ? s.modeBtnActive : ''
              }`}
              onClick={() => setMode('email')}
            >
              Email
            </button>
            <button
              type='button'
              className={`${s.modeBtn} ${
                mode === 'phone' ? s.modeBtnActive : ''
              }`}
              onClick={() => setMode('phone')}
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
              {loading ? (
                <Loader inline size='sm' label='Logging in…' />
              ) : (
                'Log In →'
              )}
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
                process.env.NEXT_PUBLIC_API_URL ?? 'http://10.0.1.44:5000/api'
              const cb = window.location.origin + '/auth/google/callback'
              window.location.href = `${api}/auth/google?platform=web&redirectUrl=${encodeURIComponent(
                cb
              )}`
            }}
          >
            <span className={s.googleIconWrap}>
              <GoogleIcon />
            </span>
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

export default function LoginPage () {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}

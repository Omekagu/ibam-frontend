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

export default function LoginPage () {
  useAuthRedirect()
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
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
      else if (user.role === 'pharmacy_partner') router.push('/partner/pharmacy')
      else if (user.role === 'lab_partner') router.push('/partner/lab')
      else router.push('/patient')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Invalid credentials'
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
            <Image src='/logo.png' alt='iBam Health' width={36} height={36} />
            <span>iBam <em>Health</em></span>
          </Link>

          <h1 className={s.formTitle}>Welcome back</h1>
          <p className={s.formSub}>
            New to iBam? <Link href='/signup'>Create an account</Link>
          </p>

          {error && <p className={s.errorBanner}>{error}</p>}

          <div className={s.modeToggle}>
            <button
              type='button'
              className={`${s.modeBtn} ${mode === 'email' ? s.modeBtnActive : ''}`}
              onClick={() => { setMode('email'); setError('') }}
            >
              Email
            </button>
            <button
              type='button'
              className={`${s.modeBtn} ${mode === 'phone' ? s.modeBtnActive : ''}`}
              onClick={() => { setMode('phone'); setError('') }}
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
              <input
                id='password'
                type='password'
                placeholder='••••••••'
                autoComplete='current-password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
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

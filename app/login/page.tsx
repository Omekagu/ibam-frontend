'use client'
import { useState, FormEvent, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'
import s from './page.module.scss'

const SLIDES = [
  { src: '/Frame 1.png', label: 'Your health, always within reach' },
  { src: '/Frame 2.png', label: 'Trusted healthcare platform' },
  { src: '/Frame 7.png', label: 'iBam Health — Care that moves with you' },
]

type LoginMode = 'email' | 'phone'

export default function LoginPage () {
  const router  = useRouter()
  const [slide,    setSlide]    = useState(0)
  const [mode,     setMode]     = useState<LoginMode>('email')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const id = setInterval(() => setSlide(i => (i + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit (e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = mode === 'email'
        ? { email, password }
        : { phone, password }
      const { user } = await login(payload)
      if (user.role === 'admin')               router.push('/admin')
      else if (user.role === 'doctor')         router.push('/doctor')
      else if (user.role === 'pharmacy_partner') router.push('/partner/pharmacy')
      else if (user.role === 'lab_partner')    router.push('/partner/lab')
      else                                     router.push('/patient')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid credentials'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      {/* Brand panel — full-bleed frame slideshow */}
      <div className={s.brand}>
        {SLIDES.map((sl, i) => (
          <Image
            key={sl.src}
            src={sl.src}
            alt={sl.label}
            fill
            priority={i === 0}
            className={`${s.slideImg} ${i === slide ? s.slideImgActive : ''}`}
            style={{ objectFit: 'cover' }}
          />
        ))}

        {/* Logo overlay */}
        <Link href='/' className={s.brandLogo}>
          <Image src='/logo.png' alt='iBam Health' width={44} height={44} className={s.logoImg} />
          <span className={s.name}>iBam <span>Health</span></span>
        </Link>

        {/* Slide caption + dots */}
        <div className={s.slideBottom}>
          <p className={s.slideCaption}>{SLIDES[slide].label}</p>
          <div className={s.slideDots}>
            {SLIDES.map((_, i) => (
              <button key={i} className={`${s.slideDot} ${i === slide ? s.slideDotActive : ''}`} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className={s.formPanel}>
        <div className={s.formWrap}>
          <Link href='/' className={s.mobileHeader}>
            <Image src='/logo.png' alt='iBam Health' width={36} height={36} />
            <span>iBam <em>Health</em></span>
          </Link>

          <h1 className={s.formTitle}>Welcome back</h1>
          <p className={s.formSub}>New to iBam? <Link href='/signup'>Create an account</Link></p>

          {error && <p className={s.errorBanner}>{error}</p>}

          {/* Login method toggle */}
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
                  id='email' type='email' placeholder='you@example.com'
                  autoComplete='email' value={email}
                  onChange={e => setEmail(e.target.value)} required
                />
              </div>
            ) : (
              <div className={s.field}>
                <label htmlFor='phone'>Phone Number</label>
                <input
                  id='phone' type='tel' placeholder='+234 800 000 0000'
                  autoComplete='tel' value={phone}
                  onChange={e => setPhone(e.target.value)} required
                />
              </div>
            )}

            <div className={s.field}>
              <label htmlFor='password'>Password</label>
              <input
                id='password' type='password' placeholder='••••••••'
                autoComplete='current-password' value={password}
                onChange={e => setPassword(e.target.value)} required
              />
            </div>

            <div className={s.meta}>
              <label><input type='checkbox' /> Remember me</label>
              <Link href='/forgot-password'>Forgot password?</Link>
            </div>

            <button type='submit' className={s.submit} disabled={loading}>
              {loading ? 'Logging in…' : 'Log In →'}
            </button>
          </form>

          <div className={s.divider}>or</div>

          <a href='#' className={s.googleBtn}>
            <svg width='18' height='18' viewBox='0 0 24 24'>
              <path d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' fill='#4285F4' />
              <path d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' fill='#34A853' />
              <path d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' fill='#FBBC05' />
              <path d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' fill='#EA4335' />
            </svg>
            Continue with Google
          </a>

          <p className={s.signup}>Don&apos;t have an account? <Link href='/signup'>Sign up free</Link></p>

          <div className={s.verifyLink}>
            <Link href='/verify-email'>Verify your email →</Link>
          </div>

          <div className={s.partnerLinks}>
            <p>Are you a healthcare partner?</p>
            <div className={s.partnerRow}>
              <Link href='/onboard/pharmacy' className={s.partnerLink}>Register Pharmacy</Link>
              <Link href='/onboard/lab' className={s.partnerLink}>Register Lab</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

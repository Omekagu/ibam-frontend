'use client'
import { useState, useEffect, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/auth'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import {
  UserIcon,
  StethoscopeIcon,
  PillIcon,
  MicroscopeIcon
} from '@/components/icons'
import s from './page.module.scss'

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

const FALLBACK_SPECIALTIES = [
  'General Practice',
  'Internal Medicine',
  'Paediatrics',
  'OB-GYN',
  'Cardiology',
  'Dermatology',
  'Psychiatry',
  'Orthopaedics',
  'ENT',
  'Ophthalmology',
  'Other'
]

export default function SignupPage () {
  useAuthRedirect()
  const router = useRouter()
  const [role, setRole] = useState<'patient' | 'doctor'>('patient')
  const [specialties, setSpecialties] = useState<string[]>(FALLBACK_SPECIALTIES)

  useEffect(() => {
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
      }/admin/public/content`
    )
      .then(r => r.json())
      .then(body => {
        const names: string[] = (body?.data?.specializations ?? []).map(
          (s: { name: string }) => s.name
        )
        if (names.length) setSpecialties(names)
      })
      .catch(() => {})
  }, [])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [specialty, setSpecialty] = useState('')
  const [mdcn, setMdcn] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit (e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
        role,
        phone,
        ...(role !== 'patient' && {
          specialization: specialty,
          licenseNumber: mdcn
        })
      })
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Registration failed. Please try again.'
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

          <h1 className={s.formTitle}>Create your account</h1>
          <p className={s.formSub}>
            Already have one? <Link href='/login'>Log in</Link>
          </p>

          <div className={s.rolePicker}>
            <button
              type='button'
              className={`${s.roleBtn} ${role === 'patient' ? s.active : ''}`}
              onClick={() => setRole('patient')}
            >
              <span className={s.roleIcon}>
                <UserIcon size={22} />
              </span>
              <span className={s.roleLabel}>I&apos;m a Patient</span>
            </button>
            <button
              type='button'
              className={`${s.roleBtn} ${role === 'doctor' ? s.active : ''}`}
              onClick={() => setRole('doctor')}
            >
              <span className={s.roleIcon}>
                <StethoscopeIcon size={22} />
              </span>
              <span className={s.roleLabel}>I&apos;m a Doctor</span>
            </button>
          </div>

          {error && <p className={s.errorBanner}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className={s.row}>
              <div className={s.field}>
                <label htmlFor='fname'>First Name</label>
                <input
                  id='fname'
                  type='text'
                  placeholder='Emeka'
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className={s.field}>
                <label htmlFor='lname'>Last Name</label>
                <input
                  id='lname'
                  type='text'
                  placeholder='Okonkwo'
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={s.field}>
              <label htmlFor='email'>Email Address</label>
              <input
                id='email'
                type='email'
                placeholder='emeka@example.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={s.field}>
              <label htmlFor='phone'>Phone Number</label>
              <input
                id='phone'
                type='tel'
                placeholder='+234 800 000 0000'
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {role === 'doctor' && (
              <>
                <div className={s.field}>
                  <label htmlFor='specialty'>Specialty</label>
                  <select
                    id='specialty'
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    required
                  >
                    <option value=''>Select your specialty</option>
                    {specialties.map(sp => (
                      <option key={sp}>{sp}</option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <label htmlFor='mdcn'>MDCN Registration Number</label>
                  <input
                    id='mdcn'
                    type='text'
                    placeholder='MDCN/R&S/2024/XXXXX'
                    value={mdcn}
                    onChange={e => setMdcn(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className={s.field}>
              <label htmlFor='password'>Password</label>
              <div className={s.fieldInner}>
                <input
                  id='password'
                  type={showPw ? 'text' : 'password'}
                  placeholder='Min. 8 characters'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
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

            <p className={s.terms}>
              By creating an account you agree to our{' '}
              <Link href='/legal/terms'>Terms of Service</Link> and{' '}
              <Link href='/legal/terms'>Privacy Policy</Link>. Your data is
              protected under NDPR.
            </p>

            <button type='submit' className={s.submit} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div className={s.dividerRow}>
            <span className={s.dividerLine} />
            <span className={s.dividerLabel}>or sign up with</span>
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
            <span className={s.googleIconWrap}>
              <GoogleIcon />
            </span>
            Continue with Google
          </button>

          <div className={s.partnerSection}>
            <p className={s.partnerHeading}>Are you a healthcare partner?</p>
            <div className={s.partnerLinks}>
              <Link href='/onboard/pharmacy' className={s.partnerLink}>
                <span className={s.partnerIcon}>
                  <PillIcon size={15} />
                </span>
                Register Pharmacy
              </Link>
              {/* <Link href='/onboard/lab' className={s.partnerLink}>
                <span className={s.partnerIcon}>
                  <MicroscopeIcon size={15} />
                </span>
                Register Lab
              </Link> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

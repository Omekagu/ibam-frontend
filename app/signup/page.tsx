'use client'
import { useState, FormEvent } from 'react'
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

const SPECIALTIES = [
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
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
        ...(role === 'patient'
          ? { dateOfBirth: dob }
          : { specialization: specialty, licenseNumber: mdcn })
      })
      if (role === 'doctor') router.push('/doctor/kyc')
      else router.push('/patient')
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
            <Image src='/logo.png' alt='iBam Health' width={36} height={36} />
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

            {role === 'patient' && (
              <div className={s.field}>
                <label htmlFor='dob'>Date of Birth</label>
                <input
                  id='dob'
                  type='date'
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                />
              </div>
            )}

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
                    {SPECIALTIES.map(sp => (
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
              <input
                id='password'
                type='password'
                placeholder='Min. 8 characters'
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
              />
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

          <div className={s.partnerSection}>
            <p className={s.partnerHeading}>Are you a healthcare partner?</p>
            <div className={s.partnerLinks}>
              <Link href='/onboard/pharmacy' className={s.partnerLink}>
                <span className={s.partnerIcon}>
                  <PillIcon size={15} />
                </span>
                Register Pharmacy
              </Link>
              <Link href='/onboard/lab' className={s.partnerLink}>
                <span className={s.partnerIcon}>
                  <MicroscopeIcon size={15} />
                </span>
                Register Lab
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

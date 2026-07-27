'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import AuthBrandPanel from '@/components/AuthBrandPanel'
import { CheckCircleIcon, XIcon } from '@/components/icons'
import s from '../pharmacy/page.module.scss'

interface TestRow { name: string; price: string; turnaroundHours: string }

export default function LabOnboardPage () {
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', password: '', confirmPassword: '',
    licenseNumber: '', coverageAreas: '',
  })
  const [tests, setTests] = useState<TestRow[]>([{ name: '', price: '', turnaroundHours: '24' }])
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  function set (field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  function setTest (i: number, field: keyof TestRow, val: string) {
    setTests(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  async function submit (e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true)
    try {
      const validTests = tests
        .filter(t => t.name.trim() && t.price)
        .map(t => ({ name: t.name.trim(), price: Number(t.price), turnaroundHours: Number(t.turnaroundHours) || 24 }))

      await api.post('/diagnostics/labs/onboard', {
        name:          form.name.trim(),
        address:       form.address.trim(),
        phone:         form.phone.trim(),
        email:         form.email.trim(),
        password:      form.password,
        licenseNumber: form.licenseNumber.trim() || undefined,
        coverageAreas: form.coverageAreas.split(',').map(s => s.trim()).filter(Boolean),
        testsOffered:  validTests,
      })
      setDone(true)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submission failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className={s.page}>
        <AuthBrandPanel />
        <div className={s.formPanel}>
          <div className={s.formWrap} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className={s.successIcon}><CheckCircleIcon size={28} /></div>
            <h2 className={s.successTitle}>Application Received!</h2>
            <p className={s.successMsg}>
              Your lab application has been submitted. Our team will review it and notify you by email
              once approved. You can then log in with your credentials.
            </p>
            <Link href='/login' className={s.loginLink}>Go to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <AuthBrandPanel />

      <div className={s.formPanel}>
        <div className={s.formWrap}>
          <Link href='/' className={s.mobileLogo}>
            <Image src='/Ibam Logo Png.png' alt='iBam' width={28} height={28} style={{ borderRadius: 8 }} />
            <span className={s.brandName}>iBam <em>Health</em></span>
          </Link>

          <h1 className={s.title}>Register Your Laboratory</h1>
          <p className={s.sub}>Join our network of trusted diagnostic labs</p>

          <form className={s.form} onSubmit={submit}>
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Lab Information</h3>
              <div className={s.field}>
                <label>Lab Name *</label>
                <input value={form.name} onChange={set('name')} placeholder='e.g. LifePath Diagnostics' required />
              </div>
              <div className={s.field}>
                <label>Full Address *</label>
                <input value={form.address} onChange={set('address')} placeholder='Street, City, State' required />
              </div>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>Phone Number *</label>
                  <input value={form.phone} onChange={set('phone')} placeholder='08012345678' required />
                </div>
                <div className={s.field}>
                  <label>License / Accreditation No.</label>
                  <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder='MLSCN-XXXXX' />
                </div>
              </div>
              <div className={s.field}>
                <label>Coverage Areas (comma separated)</label>
                <input value={form.coverageAreas} onChange={set('coverageAreas')} placeholder='Ikeja, Surulere, Yaba' />
              </div>
            </div>

            <div className={s.section}>
              <h3 className={s.sectionTitle}>Tests Offered</h3>
              {tests.map((t, i) => (
                <div key={i} className={s.testRow}>
                  <div className={s.field} style={{ flex: 2 }}>
                    <label>Test Name</label>
                    <input value={t.name} onChange={e => setTest(i, 'name', e.target.value)} placeholder='e.g. Full Blood Count' />
                  </div>
                  <div className={s.field} style={{ flex: 1 }}>
                    <label>Price (₦)</label>
                    <input type='number' value={t.price} onChange={e => setTest(i, 'price', e.target.value)} placeholder='5000' min='0' />
                  </div>
                  <div className={s.field} style={{ flex: 1 }}>
                    <label>Turnaround (hrs)</label>
                    <input type='number' value={t.turnaroundHours} onChange={e => setTest(i, 'turnaroundHours', e.target.value)} placeholder='24' min='1' />
                  </div>
                  {tests.length > 1 && (
                    <button type='button' className={s.removeTest} onClick={() => setTests(prev => prev.filter((_, idx) => idx !== i))}>
                      <XIcon size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button type='button' className={s.addTest}
                onClick={() => setTests(prev => [...prev, { name: '', price: '', turnaroundHours: '24' }])}>
                + Add Another Test
              </button>
            </div>

            <div className={s.section}>
              <h3 className={s.sectionTitle}>Account Credentials</h3>
              <div className={s.field}>
                <label>Email Address *</label>
                <input type='email' value={form.email} onChange={set('email')} placeholder='lab@example.com' required />
              </div>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>Password *</label>
                  <input type='password' value={form.password} onChange={set('password')} placeholder='Min 8 characters' required />
                </div>
                <div className={s.field}>
                  <label>Confirm Password *</label>
                  <input type='password' value={form.confirmPassword} onChange={set('confirmPassword')} placeholder='Repeat password' required />
                </div>
              </div>
            </div>

            {error && <p className={s.error}>{error}</p>}

            <button type='submit' className={s.submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>

          <p className={s.loginHint}>Already have an account? <Link href='/login'>Log in</Link></p>
        </div>
      </div>
    </div>
  )
}

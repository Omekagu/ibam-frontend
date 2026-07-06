'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import s from './page.module.scss'

export default function PharmacyOnboardPage () {
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', password: '', confirmPassword: '',
    licenseNumber: '', coverageAreas: '', openTime: '08:00', closeTime: '20:00',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)
  const [error,      setError]      = useState('')

  function set (field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function submit (e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true)
    try {
      await api.post('/pharmacy/onboard', {
        name:          form.name.trim(),
        address:       form.address.trim(),
        phone:         form.phone.trim(),
        email:         form.email.trim(),
        password:      form.password,
        licenseNumber: form.licenseNumber.trim() || undefined,
        coverageAreas: form.coverageAreas.split(',').map(s => s.trim()).filter(Boolean),
        operatingHours: { open: form.openTime, close: form.closeTime },
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
        <div className={s.card}>
          <div className={s.successIcon}>✓</div>
          <h2 className={s.successTitle}>Application Received!</h2>
          <p className={s.successMsg}>
            Your pharmacy application has been submitted. Our team will review it and you will
            receive an email notification once approved. You can then log in with your credentials.
          </p>
          <Link href='/login' className={s.loginLink}>Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <span className={s.mark}>iB</span>
          <span className={s.brandName}>iBam <em>Health</em></span>
        </div>
        <h1 className={s.title}>Register Your Pharmacy</h1>
        <p className={s.sub}>Join our network of trusted pharmacy partners</p>

        <form className={s.form} onSubmit={submit}>
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Business Information</h3>
            <div className={s.field}>
              <label>Pharmacy Name *</label>
              <input value={form.name} onChange={set('name')} placeholder='e.g. Medplus Pharmacy' required />
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
                <label>License Number</label>
                <input value={form.licenseNumber} onChange={set('licenseNumber')} placeholder='PCN-XXXXX' />
              </div>
            </div>
            <div className={s.field}>
              <label>Coverage Areas (comma separated)</label>
              <input value={form.coverageAreas} onChange={set('coverageAreas')} placeholder='Lekki, Victoria Island, Ajah' />
            </div>
            <div className={s.row2}>
              <div className={s.field}>
                <label>Opening Time</label>
                <input type='time' value={form.openTime} onChange={set('openTime')} />
              </div>
              <div className={s.field}>
                <label>Closing Time</label>
                <input type='time' value={form.closeTime} onChange={set('closeTime')} />
              </div>
            </div>
          </div>

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Account Credentials</h3>
            <div className={s.field}>
              <label>Email Address *</label>
              <input type='email' value={form.email} onChange={set('email')} placeholder='pharmacy@example.com' required />
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
  )
}

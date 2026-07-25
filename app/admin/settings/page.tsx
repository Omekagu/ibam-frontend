'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Settings {
  directPaymentEnabled: boolean
  companyBankName: string
  companyAccountNumber: string
  companyAccountName: string
  companyBankCode: string
  directPaymentNote: string
}

const DEFAULT: Settings = {
  directPaymentEnabled: false,
  companyBankName: '',
  companyAccountNumber: '',
  companyAccountName: '',
  companyBankCode: '',
  directPaymentNote: '',
}

export default function AdminSettingsPage () {
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    api.get('/admin/settings')
      .then(r => setSettings({ ...DEFAULT, ...r.data.data?.settings }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save () {
    setError(''); setSaving(true); setSaved(false)
    try {
      await api.put('/admin/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Failed to save settings.') }
    setSaving(false)
  }

  function field (key: keyof Settings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Platform Settings</h1>
        <p className={s.subtitle}>Configure payment methods and platform-wide options.</p>
      </div>

      {saved && <p className={s.successBanner}>Settings saved successfully.</p>}
      {error && <p className={s.errorBanner}>{error}</p>}

      {loading ? (
        <p className={s.empty}>Loading settings…</p>
      ) : (
        <div className={s.form}>
          {/* ── Direct bank transfer toggle ── */}
          <h2 className={s.sectionTitle}>Direct Bank Transfer</h2>
          <p className={s.subtext}>
            When enabled, patients will see your company bank details on the booking/payment page
            as an alternative to card payment.
          </p>

          <div className={s.toggleRow}>
            <div>
              <p className={s.toggleLabel}>Accept Direct Bank Transfers</p>
              <p className={s.toggleSub}>Patients can transfer directly to your company account</p>
            </div>
            <button
              className={`${s.toggle} ${settings.directPaymentEnabled ? s.toggleOn : ''}`}
              onClick={() => { setSettings(p => ({ ...p, directPaymentEnabled: !p.directPaymentEnabled })); setSaved(false) }}
              aria-pressed={settings.directPaymentEnabled}
            >
              <span className={s.toggleThumb} />
            </button>
          </div>

          {/* ── Company bank details ── */}
          <h2 className={s.sectionTitle} style={{ marginTop: '0.5rem' }}>Company Bank Details</h2>
          <p className={s.subtext}>These details are shown to patients when direct transfer is enabled.</p>

          <div className={s.row2}>
            <div className={s.field}>
              <label>Bank Name</label>
              <input className={s.input} value={settings.companyBankName} onChange={e => field('companyBankName', e.target.value)} placeholder="e.g. First Bank" />
            </div>
            <div className={s.field}>
              <label>Bank Code <span className={s.hint}>(optional)</span></label>
              <input className={s.input} value={settings.companyBankCode} onChange={e => field('companyBankCode', e.target.value)} placeholder="e.g. 011" />
            </div>
          </div>

          <div className={s.row2}>
            <div className={s.field}>
              <label>Account Number</label>
              <input className={s.input} value={settings.companyAccountNumber} onChange={e => field('companyAccountNumber', e.target.value)} placeholder="10-digit NUBAN" maxLength={10} />
            </div>
            <div className={s.field}>
              <label>Account Name</label>
              <input className={s.input} value={settings.companyAccountName} onChange={e => field('companyAccountName', e.target.value)} placeholder="As registered with the bank" />
            </div>
          </div>

          <div className={s.field}>
            <label>Transfer Note <span className={s.hint}>(shown to patient)</span></label>
            <input className={s.input} value={settings.directPaymentNote} onChange={e => field('directPaymentNote', e.target.value)} placeholder='e.g. "Use your name + appointment ID as description"' />
          </div>

          <button className={s.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface Profile {
  name: string
  address: string
  phone: string
  email: string
  licenseNumber: string
  status: string
  coverageAreas: string[]
  bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string; bankCode?: string }
}

export default function PharmacyProfilePage () {
  const modal = useStatusModal()
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)

  const [name,       setName]       = useState('')
  const [address,    setAddress]    = useState('')
  const [phone,      setPhone]      = useState('')
  const [areas,      setAreas]      = useState('')

  // Bank account
  const [bankName,   setBankName]   = useState('')
  const [acctNumber, setAcctNumber] = useState('')
  const [acctName,   setAcctName]   = useState('')
  const [bankCode,   setBankCode]   = useState('')
  const [bankSaving, setBankSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/pharmacy/profile')
      const p: Profile = r.data.data?.partner
      setProfile(p)
      setName(p.name || '')
      setAddress(p.address || '')
      setPhone(p.phone || '')
      setAreas((p.coverageAreas || []).join(', '))
      setBankName(p.bankAccount?.bankName ?? '')
      setAcctNumber(p.bankAccount?.accountNumber ?? '')
      setAcctName(p.bankAccount?.accountName ?? '')
      setBankCode(p.bankAccount?.bankCode ?? '')
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save () {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      modal.show({ variant: 'declined', title: 'Missing Fields', message: 'Name, address and phone are required.' }); return
    }
    setSaving(true)
    try {
      await api.put('/pharmacy/profile', {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        coverageAreas: areas.split(',').map(a => a.trim()).filter(Boolean),
      })
      modal.show({ variant: 'success', title: 'Profile Saved', message: 'Your pharmacy profile has been updated.' })
    } catch { modal.show({ variant: 'declined', title: 'Save Failed', message: 'Failed to save. Please try again.' }) }
    setSaving(false)
  }

  async function saveBankAccount () {
    setBankSaving(true)
    try {
      await api.put('/pharmacy/profile', {
        bankAccount: { bankName: bankName.trim(), accountNumber: acctNumber.trim(), accountName: acctName.trim(), bankCode: bankCode.trim() },
      })
      modal.show({ variant: 'success', title: 'Payout Account Saved', message: 'Your bank account details have been saved.' })
    } catch { modal.show({ variant: 'declined', title: 'Save Failed', message: 'Failed to save payout account. Please try again.' }) }
    setBankSaving(false)
  }

  const STATUS_COLOR: Record<string, string> = {
    active: '#10B981', pending: '#F59E0B', suspended: '#EF4444', inactive: '#6B7280',
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Pharmacy Profile</h1>
          <p className={s.subtitle}>Update your pharmacy's public information and payout account.</p>
        </div>
        {profile && (
          <span className={s.statusBadge} style={{ color: STATUS_COLOR[profile.status] || '#6B7280' }}>
            {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
          </span>
        )}
      </div>

      {loading ? (
        <p className={s.empty}><Loader label='Loading profile…' /></p>
      ) : (
        <>
          {/* ── Business info ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Business Information</h2>
            <div className={s.readOnly}>
              <label>Email</label>
              <span>{profile?.email ?? '—'}</span>
            </div>
            <div className={s.readOnly}>
              <label>License Number</label>
              <span>{profile?.licenseNumber ?? '—'}</span>
            </div>

            <div className={s.field}>
              <label>Pharmacy Name</label>
              <input className={s.input} value={name} onChange={e => setName(e.target.value)} placeholder='Your pharmacy name' />
            </div>

            <div className={s.field}>
              <label>Address</label>
              <input className={s.input} value={address} onChange={e => setAddress(e.target.value)} placeholder='Full address' />
            </div>

            <div className={s.field}>
              <label>Phone</label>
              <input className={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder='+234...' />
            </div>

            <div className={s.field}>
              <label>Coverage Areas <span className={s.hint}>(comma-separated)</span></label>
              <input className={s.input} value={areas} onChange={e => setAreas(e.target.value)} placeholder='e.g. Lekki, Victoria Island, Ajah' />
            </div>

            <button className={s.saveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* ── Payout bank account ── */}
          <div className={s.form} style={{ marginTop: '1.5rem' }}>
            <h2 className={s.sectionTitle}>Payout Account</h2>
            <p className={s.subtext}>Submit your bank details so the platform can settle your pharmacy payments.</p>

            <div className={s.row2}>
              <div className={s.field}>
                <label>Bank Name</label>
                <input className={s.input} value={bankName} onChange={e => setBankName(e.target.value)} placeholder='e.g. Access Bank' />
              </div>
              <div className={s.field}>
                <label>Bank Code <span className={s.hint}>(optional)</span></label>
                <input className={s.input} value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder='e.g. 044' />
              </div>
            </div>
            <div className={s.row2}>
              <div className={s.field}>
                <label>Account Number</label>
                <input className={s.input} value={acctNumber} onChange={e => setAcctNumber(e.target.value)} placeholder='10-digit NUBAN' maxLength={10} />
              </div>
              <div className={s.field}>
                <label>Account Name</label>
                <input className={s.input} value={acctName} onChange={e => setAcctName(e.target.value)} placeholder='As shown on your bank record' />
              </div>
            </div>

            <button className={s.saveBtn} onClick={saveBankAccount} disabled={bankSaving || !bankName || !acctNumber || !acctName}>
              {bankSaving ? <Loader inline size='sm' label='Saving…' /> : 'Save Payout Account'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { BankSelect } from '@/components/BankSelect'
import s from './page.module.scss'

interface Profile {
  name: string
  address: string
  phone: string
  email: string
  licenseNumber: string
  status: string
  coverageAreas: string[]
  logo?: string
  bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string; bankCode?: string }
}

interface Earning {
  _id: string
  grossAmount: number
  netAmount: number
  payoutStatus: string
  createdAt: string
}

export default function PharmacyProfilePage () {
  const modal = useStatusModal()
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [earnings,   setEarnings]   = useState<Earning[]>([])
  const [payoutReq,  setPayoutReq]  = useState(false)

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
  const [logo,       setLogo]       = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profRes, earnRes] = await Promise.allSettled([
        api.get('/pharmacy/profile'),
        api.get('/pharmacy/earnings'),
      ])
      if (profRes.status === 'fulfilled') {
        const p: Profile = profRes.value.data.data?.partner
        setProfile(p)
        setName(p.name || '')
        setAddress(p.address || '')
        setPhone(p.phone || '')
        setAreas((p.coverageAreas || []).join(', '))
        setLogo(p.logo ?? '')
        setBankName(p.bankAccount?.bankName ?? '')
        setAcctNumber(p.bankAccount?.accountNumber ?? '')
        setAcctName(p.bankAccount?.accountName ?? '')
        setBankCode(p.bankAccount?.bankCode ?? '')
      }
      if (earnRes.status === 'fulfilled') {
        setEarnings(earnRes.value.data.data?.earnings ?? [])
      }
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function uploadLogo (file: File) {
    setLogoUploading(true)
    try {
      const form = new FormData(); form.append('logo', file)
      const r = await api.post('/pharmacy/profile/logo', form)
      setLogo(r.data.data?.logo ?? '')
      modal.show({ variant: 'success', title: 'Logo Updated', message: 'Your pharmacy logo has been saved.' })
    } catch { modal.show({ variant: 'declined', title: 'Upload Failed', message: 'Could not upload logo. Try again.' }) }
    setLogoUploading(false)
  }

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

  async function requestPayout () {
    setPayoutReq(true)
    try {
      const r = await api.post('/pharmacy/earnings/request-payout')
      const { totalRequested, count } = r.data.data ?? {}
      modal.show({
        variant: 'success',
        title: 'Payout Requested',
        message: `₦${totalRequested?.toLocaleString()} across ${count} record(s) submitted to admin for review.`,
      })
      load()
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Payout Failed',
        message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Payout request failed. Please try again.',
      })
    }
    setPayoutReq(false)
  }

  const pendingNet   = earnings.filter(e => e.payoutStatus === 'pending').reduce((s, e) => s + e.netAmount, 0)
  const requestedNet = earnings.filter(e => e.payoutStatus === 'requested').reduce((s, e) => s + e.netAmount, 0)

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
        <div className={s.empty}><Loader label='Loading profile…' /></div>
      ) : (
        <>
          {/* ── Logo ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Pharmacy Logo</h2>
            <p className={s.subtext}>Your logo appears on your pharmacy card shown to patients.</p>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
            <div className={s.logoRow}>
              <div className={s.logoPreview} onClick={() => logoInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                {logo ? (
                  <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '1.75rem' }}>🏥</span>
                )}
              </div>
              <div>
                <button className={s.saveBtn} style={{ width: 'auto', padding: '0.5rem 1.25rem' }} onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                  {logoUploading ? 'Uploading…' : logo ? 'Change Logo' : 'Upload Logo'}
                </button>
                <p className={s.subtext} style={{ marginTop: '0.375rem' }}>PNG, JPG up to 5 MB. Square image recommended.</p>
              </div>
            </div>
          </div>

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

            <div className={s.field}>
              <label>Bank</label>
              <BankSelect
                bankCode={bankCode}
                bankName={bankName}
                onChange={(code, name) => { setBankCode(code); setBankName(name) }}
              />
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
              {bankSaving ? 'Saving…' : 'Save Payout Account'}
            </button>
          </div>

          {/* ── Earnings & Payout ── */}
          <div className={s.form} style={{ marginTop: '1.5rem' }}>
            <h2 className={s.sectionTitle}>Earnings & Payout</h2>
            <div className={s.row2}>
              <div className={s.earningCard}>
                <p className={s.earningLabel}>Available (pending)</p>
                <p className={s.earningValue}>₦{pendingNet.toLocaleString()}</p>
              </div>
              <div className={s.earningCard}>
                <p className={s.earningLabel}>Requested</p>
                <p className={s.earningValue} style={{ color: '#60A5FA' }}>₦{requestedNet.toLocaleString()}</p>
              </div>
            </div>

            {pendingNet > 0 && (
              <button className={s.saveBtn} onClick={requestPayout} disabled={payoutReq || !acctNumber}>
                {payoutReq ? 'Requesting…' : `Request Payout — ₦${pendingNet.toLocaleString()}`}
              </button>
            )}
            {!acctNumber && pendingNet > 0 && (
              <p className={s.subtext} style={{ marginTop: '0.5rem' }}>Set up your payout account above before requesting.</p>
            )}

            {earnings.length > 0 ? (
              <div className={s.earningTable}>
                {earnings.map(e => (
                  <div key={e._id} className={s.earningRow}>
                    <span className={s.earningDate}>{new Date(e.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className={s.earningNet}>₦{e.netAmount.toLocaleString()}</span>
                    <span className={`${s.earningStatus} ${s[`es_${e.payoutStatus}`]}`}>{e.payoutStatus}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={s.subtext}>No earnings yet. Earnings are recorded when patient payments are confirmed.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

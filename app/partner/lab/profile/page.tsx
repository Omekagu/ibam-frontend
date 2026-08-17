'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { BankSelect } from '@/components/BankSelect'
import s from '../../pharmacy/profile/page.module.scss'

interface LabProfile {
  name: string
  address: string
  phone: string
  email: string
  licenseNumber?: string
  status: string
  bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string; bankCode?: string }
}

interface Earning {
  _id: string
  grossAmount: number
  netAmount: number
  payoutStatus: string
  createdAt: string
}

const STATUS_COLOR: Record<string, string> = {
  active: '#10B981', pending: '#F59E0B', suspended: '#EF4444', inactive: '#6B7280',
}

export default function LabProfilePage () {
  const modal = useStatusModal()
  const [profile,    setProfile]    = useState<LabProfile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [earnings,   setEarnings]   = useState<Earning[]>([])
  const [payoutReq,  setPayoutReq]  = useState(false)

  const [name,       setName]       = useState('')
  const [address,    setAddress]    = useState('')
  const [phone,      setPhone]      = useState('')
  const [bankName,   setBankName]   = useState('')
  const [acctNumber, setAcctNumber] = useState('')
  const [acctName,   setAcctName]   = useState('')
  const [bankCode,   setBankCode]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profRes, earnRes] = await Promise.allSettled([
        api.get('/diagnostics/labs/profile'),
        api.get('/diagnostics/labs/earnings'),
      ])
      if (profRes.status === 'fulfilled') {
        const p: LabProfile = profRes.value.data.data?.lab
        setProfile(p)
        setName(p.name || '')
        setAddress(p.address || '')
        setPhone(p.phone || '')
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

  async function saveProfile () {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      modal.show({ variant: 'declined', title: 'Missing Fields', message: 'Name, address and phone are required.' }); return
    }
    setSaving(true)
    try {
      await api.put('/diagnostics/labs/profile', { name: name.trim(), address: address.trim(), phone: phone.trim() })
      modal.show({ variant: 'success', title: 'Profile Saved', message: 'Your lab profile has been updated.' })
    } catch { modal.show({ variant: 'declined', title: 'Save Failed', message: 'Failed to save. Please try again.' }) }
    setSaving(false)
  }

  async function saveBankAccount () {
    setBankSaving(true)
    try {
      await api.put('/diagnostics/labs/profile', {
        bankAccount: { bankName: bankName.trim(), accountNumber: acctNumber.trim(), accountName: acctName.trim(), bankCode: bankCode.trim() },
      })
      modal.show({ variant: 'success', title: 'Payout Account Saved', message: 'Your bank account details have been saved.' })
    } catch { modal.show({ variant: 'declined', title: 'Save Failed', message: 'Failed to save payout account.' }) }
    setBankSaving(false)
  }

  async function requestPayout () {
    setPayoutReq(true)
    try {
      const r = await api.post('/diagnostics/labs/earnings/request-payout')
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

  const pendingNet = earnings.filter(e => e.payoutStatus === 'pending').reduce((s, e) => s + e.netAmount, 0)
  const requestedNet = earnings.filter(e => e.payoutStatus === 'requested').reduce((s, e) => s + e.netAmount, 0)

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Lab Profile</h1>
          <p className={s.subtitle}>Update your lab&apos;s information and payout account.</p>
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
          {/* ── Business info ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Lab Information</h2>
            <div className={s.readOnly}><label>Email</label><span>{profile?.email ?? '—'}</span></div>
            {profile?.licenseNumber && <div className={s.readOnly}><label>License Number</label><span>{profile.licenseNumber}</span></div>}

            <div className={s.field}>
              <label>Lab Name</label>
              <input className={s.input} value={name} onChange={e => setName(e.target.value)} placeholder='Lab name' />
            </div>
            <div className={s.field}>
              <label>Address</label>
              <input className={s.input} value={address} onChange={e => setAddress(e.target.value)} placeholder='Full address' />
            </div>
            <div className={s.field}>
              <label>Phone</label>
              <input className={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder='+234…' />
            </div>

            <button className={s.saveBtn} onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* ── Payout bank account ── */}
          <div className={s.form} style={{ marginTop: '1.5rem' }}>
            <h2 className={s.sectionTitle}>Payout Account</h2>
            <p className={s.subtext}>Submit your bank details so the platform can settle your lab service payments.</p>

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

          {/* ── Earnings & payout ── */}
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

            {earnings.length > 0 && (
              <div className={s.earningTable}>
                {earnings.map(e => (
                  <div key={e._id} className={s.earningRow}>
                    <span className={s.earningDate}>{new Date(e.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className={s.earningNet}>₦{e.netAmount.toLocaleString()}</span>
                    <span className={`${s.earningStatus} ${s[`es_${e.payoutStatus}`]}`}>{e.payoutStatus}</span>
                  </div>
                ))}
              </div>
            )}
            {earnings.length === 0 && <p className={s.subtext}>No earnings recorded yet. Earnings are logged when patient payments are confirmed.</p>}
          </div>
        </>
      )}
    </div>
  )
}

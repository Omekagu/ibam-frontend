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
  bankAccount?: {
    bankName?: string
    accountNumber?: string
    accountName?: string
    bankCode?: string
    verified?: boolean
  }
}

interface Earning {
  _id: string
  grossAmount: number
  netAmount: number
  payoutStatus: string
  createdAt: string
}

const STATUS_COLOR: Record<string, string> = {
  active: '#10B981',
  pending: '#F59E0B',
  suspended: '#EF4444',
  inactive: '#6B7280'
}

type BankStep = 'view' | 'form' | 'otp'

export default function LabProfilePage () {
  const modal = useStatusModal()
  const [profile, setProfile] = useState<LabProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [payoutReq, setPayoutReq] = useState(false)

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')

  // Bank account two-step
  const [bankStep, setBankStep] = useState<BankStep>('form')
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [acctNumber, setAcctNumber] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [profRes, earnRes] = await Promise.allSettled([
        api.get('/diagnostics/labs/profile'),
        api.get('/diagnostics/labs/earnings')
      ])
      if (profRes.status === 'fulfilled') {
        const p: LabProfile = profRes.value.data.data?.lab
        setProfile(p)
        setName(p.name || '')
        setAddress(p.address || '')
        setPhone(p.phone || '')
        setBankStep(p.bankAccount?.verified ? 'view' : 'form')
      }
      if (earnRes.status === 'fulfilled') {
        setEarnings(earnRes.value.data.data?.earnings ?? [])
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveProfile () {
    if (!name.trim() || !address.trim() || !phone.trim()) {
      modal.show({
        variant: 'declined',
        title: 'Missing Fields',
        message: 'Name, address and phone are required.'
      })
      return
    }
    setSaving(true)
    try {
      await api.put('/diagnostics/labs/profile', {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim()
      })
      modal.show({
        variant: 'success',
        title: 'Profile Saved',
        message: 'Your lab profile has been updated.'
      })
    } catch {
      modal.show({
        variant: 'declined',
        title: 'Save Failed',
        message: 'Failed to save. Please try again.'
      })
    }
    setSaving(false)
  }

  async function verifyAccount () {
    if (!bankCode || !acctNumber || acctNumber.length !== 10) {
      modal.show({
        variant: 'declined',
        title: 'Missing Details',
        message: 'Select a bank and enter a valid 10-digit account number.'
      })
      return
    }
    setVerifying(true)
    try {
      const r = await api.post('/kyc/verify-bank', {
        accountNumber: acctNumber.trim(),
        bankCode,
        bankName
      })
      setResolvedName(r.data.data?.accountName ?? '')
      setOtp('')
      setBankStep('otp')
      modal.show({
        variant: 'success',
        title: 'Code Sent',
        message:
          'A 6-digit verification code has been sent to your email address.'
      })
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Could not verify account. Check the details and try again.'
      modal.show({
        variant: 'declined',
        title: 'Verification Failed',
        message: msg
      })
    }
    setVerifying(false)
  }

  async function confirmAccount () {
    if (!otp || otp.length < 6) {
      modal.show({
        variant: 'declined',
        title: 'Enter OTP',
        message: 'Enter the 6-digit code sent to your phone.'
      })
      return
    }
    setConfirming(true)
    try {
      await api.post('/kyc/confirm-bank', { otp: otp.trim() })
      modal.show({
        variant: 'success',
        title: 'Account Saved',
        message: 'Your payout account has been verified and saved.'
      })
      await load()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'OTP incorrect or expired. Try again.'
      modal.show({
        variant: 'declined',
        title: 'Confirmation Failed',
        message: msg
      })
    }
    setConfirming(false)
  }

  function startChange () {
    setBankName('')
    setBankCode('')
    setAcctNumber('')
    setResolvedName('')
    setOtp('')
    setBankStep('form')
  }

  async function requestPayout () {
    setPayoutReq(true)
    try {
      const r = await api.post('/diagnostics/labs/earnings/request-payout')
      const { totalRequested, count } = r.data.data ?? {}
      modal.show({
        variant: 'success',
        title: 'Payout Requested',
        message: `₦${totalRequested?.toLocaleString()} across ${count} record(s) submitted to admin for review.`
      })
      load()
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Payout Failed',
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? 'Payout request failed. Please try again.'
      })
    }
    setPayoutReq(false)
  }

  const pendingNet = earnings
    .filter(e => e.payoutStatus === 'pending')
    .reduce((sum, e) => sum + e.netAmount, 0)
  const requestedNet = earnings
    .filter(e => e.payoutStatus === 'requested')
    .reduce((sum, e) => sum + e.netAmount, 0)
  const bankVerified = profile?.bankAccount?.verified ?? false

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Lab Profile</h1>
          <p className={s.subtitle}>
            Update your lab&apos;s information and payout account.
          </p>
        </div>
        {profile && (
          <span
            className={s.statusBadge}
            style={{ color: STATUS_COLOR[profile.status] || '#6B7280' }}
          >
            {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
          </span>
        )}
      </div>

      {loading ? (
        <div className={s.empty}>
          <Loader label='Loading profile…' />
        </div>
      ) : (
        <>
          {/* ── Business info ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Lab Information</h2>
            <div className={s.readOnly}>
              <label>Email</label>
              <span>{profile?.email ?? '—'}</span>
            </div>
            {profile?.licenseNumber && (
              <div className={s.readOnly}>
                <label>License Number</label>
                <span>{profile.licenseNumber}</span>
              </div>
            )}

            <div className={s.field}>
              <label>Lab Name</label>
              <input
                className={s.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Lab name'
              />
            </div>
            <div className={s.field}>
              <label>Address</label>
              <input
                className={s.input}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder='Full address'
              />
            </div>
            <div className={s.field}>
              <label>Phone</label>
              <input
                className={s.input}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder='+234…'
              />
            </div>

            <button
              className={s.saveBtn}
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* ── Payout bank account ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Payout Account</h2>
            <p className={s.subtext}>
              Submit your bank details so the platform can settle your lab
              service payments. Verified with OTP confirmation.
            </p>

            {/* View — already saved */}
            {bankStep === 'view' && profile?.bankAccount && (
              <>
                <div className={s.bankReadOnly}>
                  <div className={s.bankRow}>
                    <label>Bank</label>
                    <span>{profile.bankAccount.bankName || '—'}</span>
                  </div>
                  <div className={s.bankRow}>
                    <label>Account Number</label>
                    <span>{profile.bankAccount.accountNumber || '—'}</span>
                  </div>
                  <div className={s.bankRow}>
                    <label>Account Name</label>
                    <span>{profile.bankAccount.accountName || '—'}</span>
                  </div>
                  <div className={s.bankRow}>
                    <label>Status</label>
                    <span className={s.verifiedBadge}>Verified</span>
                  </div>
                </div>
                <button className={s.backLink} onClick={startChange}>
                  Change payout account
                </button>
              </>
            )}

            {/* Step 1 — enter bank details */}
            {bankStep === 'form' && (
              <>
                <div className={s.field}>
                  <label>Bank</label>
                  <BankSelect
                    bankCode={bankCode}
                    bankName={bankName}
                    onChange={(code, name) => {
                      setBankCode(code)
                      setBankName(name)
                    }}
                  />
                </div>
                <div className={s.field}>
                  <label>Account Number</label>
                  <input
                    className={s.input}
                    value={acctNumber}
                    onChange={e =>
                      setAcctNumber(
                        e.target.value.replace(/\D/g, '').slice(0, 10)
                      )
                    }
                    placeholder='10-digit NUBAN'
                    maxLength={10}
                    inputMode='numeric'
                  />
                </div>
                <button
                  className={s.saveBtn}
                  onClick={verifyAccount}
                  disabled={verifying || !bankCode || acctNumber.length !== 10}
                >
                  {verifying ? 'Verifying…' : 'Verify Account'}
                </button>
                {bankVerified && (
                  <button
                    className={s.backLink}
                    onClick={() => setBankStep('view')}
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            {/* Step 2 — OTP confirmation */}
            {bankStep === 'otp' && (
              <>
                <div className={s.resolvedBox}>
                  <small>Account resolved</small>
                  <strong>{resolvedName}</strong>
                </div>
                <div className={s.field}>
                  <label>Enter the 6-digit code sent to your email</label>
                  <div className={s.otpRow}>
                    <input
                      className={s.otpInput}
                      value={otp}
                      onChange={e =>
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder='000000'
                      maxLength={6}
                      inputMode='numeric'
                    />
                    <button
                      className={s.confirmBtn}
                      onClick={confirmAccount}
                      disabled={confirming || otp.length < 6}
                    >
                      {confirming ? 'Confirming…' : 'Confirm'}
                    </button>
                  </div>
                </div>
                <button
                  className={s.backLink}
                  onClick={() => setBankStep('form')}
                >
                  Back — use a different account
                </button>
              </>
            )}
          </div>

          {/* ── Earnings & payout ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Earnings & Payout</h2>
            <div className={s.row2}>
              <div className={s.earningCard}>
                <p className={s.earningLabel}>Available (pending)</p>
                <p className={s.earningValue}>₦{pendingNet.toLocaleString()}</p>
              </div>
              <div className={s.earningCard}>
                <p className={s.earningLabel}>Requested</p>
                <p className={s.earningValue} style={{ color: '#60A5FA' }}>
                  ₦{requestedNet.toLocaleString()}
                </p>
              </div>
            </div>

            {pendingNet > 0 && (
              <button
                className={s.saveBtn}
                onClick={requestPayout}
                disabled={payoutReq || !bankVerified}
              >
                {payoutReq
                  ? 'Requesting…'
                  : `Request Payout — ₦${pendingNet.toLocaleString()}`}
              </button>
            )}
            {!bankVerified && pendingNet > 0 && (
              <p className={s.subtext} style={{ marginTop: '0.5rem' }}>
                Set up your verified payout account above before requesting.
              </p>
            )}

            {earnings.length > 0 && (
              <div className={s.earningTable}>
                {earnings.map(e => (
                  <div key={e._id} className={s.earningRow}>
                    <span className={s.earningDate}>
                      {new Date(e.createdAt).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className={s.earningNet}>
                      ₦{e.netAmount.toLocaleString()}
                    </span>
                    <span
                      className={`${s.earningStatus} ${
                        s[`es_${e.payoutStatus}`]
                      }`}
                    >
                      {e.payoutStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {earnings.length === 0 && (
              <p className={s.subtext}>
                No earnings recorded yet. Earnings are logged when patient
                payments are confirmed.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

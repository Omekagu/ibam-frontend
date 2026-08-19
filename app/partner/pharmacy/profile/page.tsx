'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { BankSelect } from '@/components/BankSelect'
import { BuildingIcon } from '@/components/icons'
import s from './page.module.scss'

interface BankAccount {
  bankName?: string
  accountNumber?: string
  accountName?: string
  bankCode?: string
  verified?: boolean
}

interface Profile {
  name: string
  address: string
  phone: string
  email: string
  licenseNumber: string
  status: string
  coverageAreas: string[]
  logo?: string
  bankAccount?: BankAccount
}

const STATUS_COLOR: Record<string, string> = {
  active: '#10B981',
  pending: '#F59E0B',
  suspended: '#EF4444',
  inactive: '#6B7280'
}

type BankStep = 'view' | 'form' | 'otp'

export default function PharmacyProfilePage () {
  const modal = useStatusModal()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [areas, setAreas] = useState('')
  const [logo, setLogo] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Bank account two-step state
  const [bankStep, setBankStep] = useState<BankStep>('view')
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
      const r = await api.get('/pharmacy/profile')
      const p: Profile = r.data.data?.partner
      setProfile(p)
      setName(p.name || '')
      setAddress(p.address || '')
      setPhone(p.phone || '')
      setAreas((p.coverageAreas || []).join(', '))
      setLogo(p.logo ?? '')
      setBankStep(p.bankAccount?.verified ? 'view' : 'form')
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function uploadLogo (file: File) {
    setLogoUploading(true)
    try {
      const form = new FormData()
      form.append('logo', file)
      const r = await api.post('/pharmacy/profile/logo', form)
      setLogo(r.data.data?.logo ?? '')
      modal.show({
        variant: 'success',
        title: 'Logo Updated',
        message: 'Your pharmacy logo has been saved.'
      })
    } catch {
      modal.show({
        variant: 'declined',
        title: 'Upload Failed',
        message: 'Could not upload logo. Try again.'
      })
    }
    setLogoUploading(false)
  }

  async function save () {
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
      await api.put('/pharmacy/profile', {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        coverageAreas: areas
          .split(',')
          .map(a => a.trim())
          .filter(Boolean)
      })
      modal.show({
        variant: 'success',
        title: 'Profile Saved',
        message: 'Your pharmacy profile has been updated.'
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

  // Step 1 — resolve account  + send OTP
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

  // Step 2 — confirm OTP and save
  async function confirmAccount () {
    if (!otp || otp.length < 4) {
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

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Profile & Settings</h1>
          <p className={s.subtitle}>
            Manage your pharmacy's public listing and payout account.
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
          {/* ── Logo ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Pharmacy Logo</h2>
            <p className={s.subtext}>
              Displayed on your pharmacy card shown to patients.
            </p>
            <input
              ref={logoInputRef}
              type='file'
              accept='image/*'
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) uploadLogo(f)
              }}
            />
            <div className={s.logoRow}>
              <div
                className={s.logoPreview}
                onClick={() => logoInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
              >
                {logo ? (
                  <img
                    src={logo}
                    alt='Logo'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                  />
                ) : (
                  <BuildingIcon size={32} />
                )}
              </div>
              <div>
                <button
                  className={s.saveBtn}
                  style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                >
                  {logoUploading
                    ? 'Uploading…'
                    : logo
                    ? 'Change Logo'
                    : 'Upload Logo'}
                </button>
                <p className={s.subtext} style={{ marginTop: '0.375rem' }}>
                  PNG or JPG, up to 5 MB. Square image recommended.
                </p>
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
              <input
                className={s.input}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='Your pharmacy name'
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
            <div className={s.field}>
              <label>
                Coverage Areas <span className={s.hint}>(comma-separated)</span>
              </label>
              <input
                className={s.input}
                value={areas}
                onChange={e => setAreas(e.target.value)}
                placeholder='e.g. Lekki, Victoria Island, Ajah'
              />
            </div>
            <button className={s.saveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* ── Payout bank account ── */}
          <div className={s.form}>
            <h2 className={s.sectionTitle}>Payout Account</h2>
            <p className={s.subtext}>
              Your bank details for receiving pharmacy payment settlements. View
              earnings and request payouts in{' '}
              <a
                href='/partner/pharmacy/finance'
                style={{
                  color: '#60A5FA',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Finance
              </a>
              .
            </p>

            {/* ── View (verified account already saved) ── */}
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

            {/* ── Step 1: enter bank details ── */}
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
                {profile?.bankAccount?.verified && (
                  <button
                    className={s.backLink}
                    onClick={() => setBankStep('view')}
                  >
                    Cancel
                  </button>
                )}
              </>
            )}

            {/* ── Step 2: OTP confirmation ── */}
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
        </>
      )}
    </div>
  )
}

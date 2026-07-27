'use client'
import { useEffect, useState, useRef, FormEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import s from './page.module.scss'
import { CameraIcon, VideoCameraIcon, PhoneIcon, ChatIcon } from '@/components/icons'

interface Doctor {
  bio?: string
  consultationFee: number
  yearsOfExperience: number
  qualifications: string[]
  specialization: string
  licenseNumber: string
  isApproved: boolean
  rateType: 'per_session' | 'per_hour' | 'per_minute'
  sessionDurationMinutes: number
  urgentAvailable: boolean
  urgentSurcharge: number
  fees?: { video?: number; audio?: number; chat?: number }
  bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string; bankCode?: string }
  displayName?: string
  socialLinks?: { twitter?: string; linkedin?: string; website?: string }
  user: { name: string; email: string; phone?: string; avatar?: string }
}

interface Slot {
  startTime: string
  endTime: string
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]
const DURATIONS = [15, 20, 30, 45, 60, 90]

export default function DoctorProfile () {
  const cached = getStoredUser()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [bio, setBio] = useState('')
  const [fee, setFee] = useState(0)
  const [exp, setExp] = useState(0)
  const [quals, setQuals] = useState<string[]>([])
  const [newQual, setNewQual] = useState('')
  const [rateType, setRateType] = useState<
    'per_session' | 'per_hour' | 'per_minute'
  >('per_session')
  const [sessionDuration, setSessionDuration] = useState(30)
  const [urgentAvailable, setUrgentAvailable] = useState(false)
  const [urgentSurcharge, setUrgentSurcharge] = useState(0)
  const [videoFee, setVideoFee] = useState<number | ''>('')
  const [audioFee, setAudioFee] = useState<number | ''>('')
  const [chatFee, setChatFee] = useState<number | ''>('')

  // Avatar upload
  const avatarRef = useRef<HTMLInputElement>(null)
  const [avatarUrl,     setAvatarUrl]     = useState(cached?.avatar ?? '')
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Display name + social
  const [displayName, setDisplayName] = useState('')
  const [socialTwitter,  setSocialTwitter]  = useState('')
  const [socialLinkedin, setSocialLinkedin] = useState('')
  const [socialWebsite,  setSocialWebsite]  = useState('')

  // Bank account
  const [bankName,   setBankName]   = useState('')
  const [acctNumber, setAcctNumber] = useState('')
  const [acctName,   setAcctName]   = useState('')
  const [bankCode,   setBankCode]   = useState('')
  const [bankSaving, setBankSaving] = useState(false)
  const [bankSaved,  setBankSaved]  = useState(false)

  // Availability: multiple days
  const [avDays, setAvDays] = useState<boolean[]>(Array(7).fill(false))
  const [avSlots, setAvSlots] = useState<Slot[]>([
    { startTime: '08:00', endTime: '09:00' }
  ])
  const [avSaving, setAvSaving] = useState(false)
  const [avSaved, setAvSaved] = useState(false)

  useEffect(() => {
    api
      .get('/doctors/my/profile')
      .then(r => {
        const d: Doctor = r.data.data?.doctor
        if (!d) return
        setDoctor(d)
        setBio(d.bio ?? '')
        setFee(d.consultationFee ?? 0)
        setExp(d.yearsOfExperience ?? 0)
        setQuals(d.qualifications ?? [])
        setRateType(d.rateType ?? 'per_session')
        setSessionDuration(d.sessionDurationMinutes ?? 30)
        setUrgentAvailable(d.urgentAvailable ?? false)
        setUrgentSurcharge(d.urgentSurcharge ?? 0)
        setVideoFee(d.fees?.video ?? '')
        setAudioFee(d.fees?.audio ?? '')
        setChatFee(d.fees?.chat ?? '')
        setBankName(d.bankAccount?.bankName ?? '')
        setAcctNumber(d.bankAccount?.accountNumber ?? '')
        setAcctName(d.bankAccount?.accountName ?? '')
        setBankCode(d.bankAccount?.bankCode ?? '')
        setAvatarUrl(d.user?.avatar ?? '')
        setDisplayName(d.displayName ?? '')
        setSocialTwitter(d.socialLinks?.twitter ?? '')
        setSocialLinkedin(d.socialLinks?.linkedin ?? '')
        setSocialWebsite(d.socialLinks?.website ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function uploadAvatar (e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', f)
      const r = await api.post('/doctors/my/avatar', form)
      setAvatarUrl(r.data.data?.avatarUrl ?? '')
    } catch {}
    setAvatarUploading(false)
  }

  async function saveProfile (e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const fees: Record<string, number> = {}
      if (videoFee !== '') fees.video = Number(videoFee)
      if (audioFee !== '') fees.audio = Number(audioFee)
      if (chatFee !== '') fees.chat = Number(chatFee)
      await api.put('/doctors/my/profile', {
        bio,
        consultationFee: fee,
        yearsOfExperience: exp,
        qualifications: quals,
        rateType,
        sessionDurationMinutes: sessionDuration,
        urgentAvailable,
        urgentSurcharge,
        fees: Object.keys(fees).length > 0 ? fees : undefined,
        displayName: displayName.trim() || undefined,
        socialLinks: {
          twitter: socialTwitter.trim() || undefined,
          linkedin: socialLinkedin.trim() || undefined,
          website: socialWebsite.trim() || undefined,
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  function addQual () {
    if (!newQual.trim()) return
    setQuals(prev => [...prev, newQual.trim()])
    setNewQual('')
  }

  function removeQual (i: number) {
    setQuals(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveAvailability (e: FormEvent) {
    e.preventDefault()
    const selectedDays = avDays
      .map((on, i) => (on ? i : -1))
      .filter(i => i >= 0)
    if (!selectedDays.length) return
    setAvSaving(true)
    setAvSaved(false)
    try {
      await Promise.all(
        selectedDays.map(day =>
          api.post('/doctors/availability', {
            type: 'recurring',
            dayOfWeek: day,
            slots: avSlots.map(sl => ({ ...sl, isBooked: false }))
          })
        )
      )
      setAvSaved(true)
      setTimeout(() => setAvSaved(false), 3000)
    } catch {}
    setAvSaving(false)
  }

  async function saveBankAccount () {
    setBankSaving(true); setBankSaved(false)
    try {
      await api.put('/doctors/my/profile', {
        bankAccount: { bankName: bankName.trim(), accountNumber: acctNumber.trim(), accountName: acctName.trim(), bankCode: bankCode.trim() },
      })
      setBankSaved(true)
      setTimeout(() => setBankSaved(false), 3000)
    } catch {}
    setBankSaving(false)
  }

  function addSlot () {
    setAvSlots(prev => [...prev, { startTime: '09:00', endTime: '10:00' }])
  }

  function updateSlot (i: number, field: keyof Slot, value: string) {
    setAvSlots(prev =>
      prev.map((sl, idx) => (idx === i ? { ...sl, [field]: value } : sl))
    )
  }

  function removeSlot (i: number) {
    setAvSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  function feeLabel () {
    if (rateType === 'per_session') return `₦${fee.toLocaleString()} / session`
    if (rateType === 'per_hour') return `₦${fee.toLocaleString()} / hr`
    return `₦${fee.toLocaleString()} / min`
  }

  return (
    <div className={s.grid}>
      {/* ── Summary card ──────────────────────────── */}
      <div className={s.profileCard}>
        <div className={s.avatarBlock}>
          <div className={s.avatarWrap}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt='Profile photo' fill style={{ objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span>{(doctor?.user.name ?? cached?.name)?.[0]?.toUpperCase() ?? '?'}</span>
            )}
            <button
              type='button'
              className={s.avatarEditBtn}
              onClick={() => avatarRef.current?.click()}
              title='Change photo'
            >
              {avatarUploading ? '…' : <CameraIcon size={14} />}
            </button>
            <input ref={avatarRef} type='file' accept='image/*' onChange={uploadAvatar} style={{ display: 'none' }} />
          </div>
          <div>
            <p className={s.docName}>{doctor?.displayName || doctor?.user.name || cached?.name}</p>
            <p className={s.docSpec}>{doctor?.specialization ?? (loading ? '…' : '')}</p>
            <span
              className={`${s.kycBadge} ${
                doctor?.isApproved ? s.approved : s.pending
              }`}
            >
              {doctor?.isApproved ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
        </div>

        <div className={s.detailGrid}>
          <div className={s.detail}>
            <span>Email</span>
            <p>{doctor?.user.email}</p>
          </div>
          <div className={s.detail}>
            <span>Phone</span>
            <p>{doctor?.user.phone ?? '—'}</p>
          </div>
          <div className={s.detail}>
            <span>License No.</span>
            <p>{doctor?.licenseNumber}</p>
          </div>
          <div className={s.detail}>
            <span>Specialization</span>
            <p>{doctor?.specialization}</p>
          </div>
          <div className={s.detail}>
            <span>Experience</span>
            <p>
              {exp} yr{exp !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={s.detail}>
            <span>Rate</span>
            <p>{feeLabel()}</p>
          </div>
          <div className={s.detail}>
            <span>Session</span>
            <p>{sessionDuration} min</p>
          </div>
          <div className={s.detail}>
            <span>Urgent</span>
            <p>
              {urgentAvailable
                ? `Available (+₦${urgentSurcharge.toLocaleString()})`
                : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      <div>
        {/* ── Edit professional info ─────────────── */}
        <form className={s.panel} onSubmit={saveProfile}>
          <div className={s.panelHead}>
            <h3>Professional Info</h3>
          </div>
          <div className={s.panelBody}>
            <div className={s.field}>
              <label>Display Name <span className={s.hint}>(shown publicly — leave blank to use account name)</span></label>
              <input
                type='text'
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={doctor?.user.name ?? 'Your public name'}
              />
            </div>

            <div className={s.field}>
              <label>Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder='Tell patients about yourself…'
              />
            </div>

            {/* Rate type */}
            <div className={s.field}>
              <label>Billing Model</label>
              <div className={s.rateRow}>
                {(['per_session', 'per_hour', 'per_minute'] as const).map(
                  rt => (
                    <button
                      key={rt}
                      type='button'
                      className={`${s.rateBtn} ${
                        rateType === rt ? s.rateActive : ''
                      }`}
                      onClick={() => setRateType(rt)}
                    >
                      {rt === 'per_session'
                        ? 'Per Session'
                        : rt === 'per_hour'
                        ? 'Per Hour'
                        : 'Per Minute'}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className={s.row2}>
              <div className={s.field}>
                <label>
                  {rateType === 'per_session'
                    ? 'Base Fee (₦)'
                    : rateType === 'per_hour'
                    ? 'Hourly Rate (₦)'
                    : 'Per-Minute Rate (₦)'}
                </label>
                <input
                  type='number'
                  min={0}
                  value={fee}
                  onChange={e => setFee(Number(e.target.value))}
                />
                <p className={s.hint}>
                  Default rate. Override per consultation type below.
                </p>
              </div>
              <div className={s.field}>
                <label>Session Duration (min)</label>
                <select
                  value={sessionDuration}
                  onChange={e => setSessionDuration(Number(e.target.value))}
                >
                  {DURATIONS.map(d => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={s.field}>
              <label>
                Per-Type Overrides (₦) — leave blank to use base rate
              </label>
              <div className={s.row3}>
                <div>
                  <p className={s.typeLabel}><VideoCameraIcon size={14} /> Video</p>
                  <input
                    type='number'
                    min={0}
                    placeholder='e.g. 5000'
                    value={videoFee}
                    onChange={e =>
                      setVideoFee(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <p className={s.typeLabel}><PhoneIcon size={14} /> Audio</p>
                  <input
                    type='number'
                    min={0}
                    placeholder='e.g. 3500'
                    value={audioFee}
                    onChange={e =>
                      setAudioFee(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                  />
                </div>
                <div>
                  <p className={s.typeLabel}><ChatIcon size={14} /> Chat</p>
                  <input
                    type='number'
                    min={0}
                    placeholder='e.g. 2000'
                    value={chatFee}
                    onChange={e =>
                      setChatFee(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className={s.row2}>
              <div className={s.field}>
                <label>Years of Experience</label>
                <input
                  type='number'
                  min={0}
                  value={exp}
                  onChange={e => setExp(Number(e.target.value))}
                />
              </div>
              <div className={s.field}>
                <label>Urgent Calls</label>
                <label className={s.toggleRow}>
                  <input
                    type='checkbox'
                    checked={urgentAvailable}
                    onChange={e => setUrgentAvailable(e.target.checked)}
                  />
                  <span>{urgentAvailable ? 'Available' : 'Unavailable'}</span>
                </label>
              </div>
            </div>

            {urgentAvailable && (
              <div className={s.field}>
                <label>Urgent Surcharge (₦)</label>
                <input
                  type='number'
                  min={0}
                  value={urgentSurcharge}
                  onChange={e => setUrgentSurcharge(Number(e.target.value))}
                />
                <p className={s.hint}>
                  Added on top of your base rate for urgent/emergency bookings.
                </p>
              </div>
            )}

            <div className={s.field}>
              <label>Qualifications</label>
              {quals.length > 0 && (
                <div className={s.qualList}>
                  {quals.map((q, i) => (
                    <div key={i} className={s.qualChip}>
                      <span>{q}</span>
                      <button type='button' onClick={() => removeQual(i)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={s.qualInput}>
                <input
                  value={newQual}
                  onChange={e => setNewQual(e.target.value)}
                  placeholder='e.g. MBBS, University of Enugu'
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addQual()
                    }
                  }}
                />
                <button type='button' onClick={addQual}>
                  Add
                </button>
              </div>
            </div>

            <div className={s.field}>
              <label>Social Links <span className={s.hint}>(optional — shown on your public profile)</span></label>
              <div className={s.socialGrid}>
                <input value={socialTwitter}  onChange={e => setSocialTwitter(e.target.value)}  placeholder='Twitter / X handle (e.g. @drsmith)' />
                <input value={socialLinkedin} onChange={e => setSocialLinkedin(e.target.value)} placeholder='LinkedIn URL' />
                <input value={socialWebsite}  onChange={e => setSocialWebsite(e.target.value)}  placeholder='Personal website URL' />
              </div>
            </div>

            <button type='submit' className={s.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* ── Availability ──────────────────────── */}
        <form
          className={s.panel}
          style={{ marginTop: '1.25rem' }}
          onSubmit={saveAvailability}
        >
          <div className={s.panelHead}>
            <h3>Weekly Availability</h3>
          </div>
          <div className={s.panelBody}>
            <div className={s.field}>
              <label>Working Days</label>
              <div className={s.dayGrid}>
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    type='button'
                    className={`${s.dayBtn} ${avDays[i] ? s.dayActive : ''}`}
                    onClick={() =>
                      setAvDays(prev =>
                        prev.map((on, idx) => (idx === i ? !on : on))
                      )
                    }
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.field}>
              <label>Time Slots for Selected Days</label>
              <div className={s.slotList}>
                {avSlots.map((sl, i) => (
                  <div key={i} className={s.slotRow}>
                    <input
                      type='time'
                      value={sl.startTime}
                      onChange={e => updateSlot(i, 'startTime', e.target.value)}
                    />
                    <span className={s.slotSep}>to</span>
                    <input
                      type='time'
                      value={sl.endTime}
                      onChange={e => updateSlot(i, 'endTime', e.target.value)}
                    />
                    {avSlots.length > 1 && (
                      <button
                        type='button'
                        className={s.removeSlotBtn}
                        onClick={() => removeSlot(i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type='button' className={s.addSlotBtn} onClick={addSlot}>
                + Add Time Slot
              </button>
            </div>

            <button
              type='submit'
              className={s.saveBtn}
              disabled={avSaving || !avDays.some(Boolean)}
            >
              {avSaving ? 'Saving…' : avSaved ? '✓ Saved' : 'Save Availability'}
            </button>
          </div>
        </form>

        {/* ── Payout Bank Account ───────────────── */}
        <div className={s.panel} style={{ marginTop: '1.25rem' }}>
          <div className={s.panelHead}>
            <h3>Payout Account</h3>
          </div>
          <div className={s.panelBody}>
            <p className={s.hint} style={{ marginBottom: '1rem' }}>
              Enter your bank details so the platform can pay your earnings directly to your account.
            </p>
            <div className={s.row2}>
              <div className={s.field}>
                <label>Bank Name</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder='e.g. GTBank' />
              </div>
              <div className={s.field}>
                <label>Bank Code <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '0.72rem', color: 'var(--text-faint)' }}>(optional)</span></label>
                <input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder='e.g. 058' />
              </div>
            </div>
            <div className={s.row2}>
              <div className={s.field}>
                <label>Account Number</label>
                <input value={acctNumber} onChange={e => setAcctNumber(e.target.value)} placeholder='10-digit NUBAN' maxLength={10} />
              </div>
              <div className={s.field}>
                <label>Account Name</label>
                <input value={acctName} onChange={e => setAcctName(e.target.value)} placeholder='As it appears on bank record' />
              </div>
            </div>
            <button type='button' className={s.saveBtn} disabled={bankSaving || !bankName || !acctNumber || !acctName} onClick={saveBankAccount}>
              {bankSaving ? 'Saving…' : bankSaved ? '✓ Saved' : 'Save Payout Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { downloadReceipt } from '@/lib/receipt'
import s from './page.module.scss'
import { VideoCameraIcon, PhoneIcon, ChatIcon } from '@/components/icons'
import { CheckIcon } from '@/components/icons'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'

interface Doctor {
  _id: string
  user: { _id: string; name: string; avatar?: string }
  specialization: string
  bio?: string
  consultationFee: number
  yearsOfExperience?: number
  ratings?: { average: number; count: number }
  rateType: 'per_session' | 'per_hour' | 'per_minute'
  sessionDurationMinutes: number
  urgentAvailable: boolean
  urgentSurcharge: number
  fees?: { video?: number; audio?: number; chat?: number }
  socialLinks?: { twitter?: string; linkedin?: string; website?: string }
  qualifications?: { degree: string; institution: string; year: number }[]
  displayName?: string
}

interface Slot {
  _id: string
  startTime: string
  endTime: string
  isBooked: boolean
}

const SPECS = [
  '',
  'Cardiologist',
  'Dermatologist',
  'Paediatrician',
  'Gynaecologist',
  'Psychiatrist',
  'General Practitioner',
  'Neurologist',
  'Oncologist'
]
const TYPES = ['video', 'audio', 'chat'] as const
const DURATION_OPTS = [30, 45, 60, 90, 120] // minutes

export default function BookDoctor () {
  const router = useRouter()
  const modal = useStatusModal()

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [spec, setSpec] = useState('')
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [avId, setAvId] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [type, setType] = useState<typeof TYPES[number]>('video')
  const [isUrgent, setIsUrgent] = useState(false)
  const [duration, setDuration] = useState(30)
  const [booking, setBooking] = useState(false)
  const [paystackPublicKey, setPaystackPublicKey] = useState(process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? '')
  const [scriptLoaded, setScriptLoaded] = useState(false)

  function getSlotDuration (sl: Slot): number {
    const [sh, sm] = sl.startTime.split(':').map(Number)
    const [eh, em] = sl.endTime.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  }

  function typeFeeFor (doctor: Doctor, t: typeof TYPES[number]): number {
    return doctor.fees?.[t] ?? doctor.consultationFee ?? 0
  }

  function computeFee (
    doctor: Doctor,
    t: typeof TYPES[number],
    durationMin: number,
    urgent: boolean
  ): number {
    const base = typeFeeFor(doctor, t)
    let fee = base
    if (doctor.rateType === 'per_hour') fee = Math.ceil(durationMin / 60) * base
    if (doctor.rateType === 'per_minute') fee = durationMin * base
    if (urgent && doctor.urgentSurcharge) fee += doctor.urgentSurcharge
    return fee
  }

  function loadDoctors (s = spec) {
    setLoadingDocs(true)
    const q = new URLSearchParams({ limit: '20' })
    if (s) q.set('specialization', s)
    api
      .get(`/doctors?${q}`)
      .then(r => setDoctors(r.data.data?.doctors ?? []))
      .catch(() => {})
      .finally(() => setLoadingDocs(false))
  }

  useEffect(() => {
    loadDoctors()
    const existing = document.querySelector('script[src="https://js.paystack.co/v2/inline.js"]')
    if (existing) {
      setScriptLoaded(true)
    } else {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v2/inline.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      document.body.appendChild(script)
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://10.0.1.44:5000/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(b => {
        if (b?.data?.paystackPublicKey)
          setPaystackPublicKey(b.data.paystackPublicKey)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selected || !date) return
    setSlots([])
    setSlot(null)
    setAvId('')
    setLoadingSlots(true)
    api
      .get(
        `/doctors/available-slots?doctorId=${selected.user._id}&date=${date}`
      )
      .then(r => {
        setSlots(r.data.data?.slots ?? [])
        setAvId(r.data.data?.availabilityId ?? '')
      })
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [selected, date])

  async function book (e: FormEvent) {
    e.preventDefault()
    if (!selected || !date || !slot) return

    const fee = selected ? computeFee(selected, type, duration, isUrgent) : 0
    if (fee > 0 && (!paystackPublicKey || !scriptLoaded)) return

    setBooking(true)
    try {
      const scheduledAt = new Date(`${date}T${slot.startTime}`).toISOString()
      const apptRes = await api.post('/appointments/book', {
        doctorId: selected.user._id,
        scheduledAt,
        type,
        availabilityId: avId,
        slotId: slot._id,
        isUrgent,
        sessionDurationMinutes: duration
      })
      const appt = apptRes.data.data?.appointment

      if (appt?.consultationFee > 0) {
        let payRes
        try {
          payRes = await api.post('/payments/initiate', {
            type: 'consultation',
            serviceId: appt._id,
            amount: appt.consultationFee
          })
        } catch {
          // Payment initiation failed — cancel the appointment so slot is freed
          await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Payment initiation failed' }).catch(() => {})
          throw new Error('Could not initiate payment. Please try again.')
        }
        const { accessCode, reference } = payRes.data.data
        const doctorName = selected.displayName || selected.user?.name
        const feeSnap = appt.consultationFee as number
        setBooking(false)
        const paystack = new (window as any).PaystackPop()
        paystack.newTransaction({
          key: paystackPublicKey,
          accessCode,
          onSuccess: async () => {
            try {
              await api.get(`/payments/verify/${reference}`)
              downloadReceipt({
                bookingRef: `#${appt._id.slice(-8).toUpperCase()}`,
                tests: [`${type} consultation with Dr. ${doctorName}`],
                amount: feeSnap,
                collectionType: 'walk_in',
                transactionRef: reference
              })
              modal.show({
                variant: 'success',
                title: 'Booking Confirmed!',
                message: `Your ${type} consultation with Dr. ${doctorName} on ${date} at ${
                  slot!.startTime
                } is confirmed. Receipt is downloading.`,
                actionLabel: 'View Appointments',
                onAction: () => router.push('/patient/appointments')
              })
            } catch {
              /* silent */
            }
          },
          onCancel: async () => {
            // Cancel the appointment so the slot is freed for other patients
            await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Payment not completed' }).catch(() => {})
            modal.show({
              variant: 'declined',
              title: 'Payment Cancelled',
              message: 'No appointment was made. The slot is now available for others to book.'
            })
          }
        })
        return
      }

      // Free consultation
      modal.show({
        variant: 'success',
        title: 'Appointment Booked!',
        message: `Your ${type} consultation with Dr. ${
          selected.displayName || selected.user?.name
        } is scheduled for ${date} at ${slot.startTime}.`,
        actionLabel: 'View My Appointments',
        onAction: () => router.push('/patient/appointments')
      })
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Booking Failed',
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? 'Booking failed. Please try again.',
        actionLabel: 'Try Again'
      })
    } finally {
      setBooking(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={s.grid}>
      {/* ── Doctor list ─────────────────────────── */}
      <div>
        <div className={s.searchRow}>
          <select
            value={spec}
            onChange={e => {
              setSpec(e.target.value)
              loadDoctors(e.target.value)
            }}
          >
            {SPECS.map(sp => (
              <option key={sp} value={sp}>
                {sp || 'All Specialties'}
              </option>
            ))}
          </select>
        </div>

        <div className={s.docList}>
          {loadingDocs ? (
            <Loader variant='dots' label='Loading doctors…' />
          ) : doctors.length === 0 ? (
            <p className={s.empty}>No doctors found.</p>
          ) : (
            doctors.map(d => (
              <div
                key={d._id}
                className={`${s.docCard} ${
                  selected?._id === d._id ? s.selected : ''
                }`}
                onClick={() => {
                  setSelected(d)
                  setDate('')
                  setSlots([])
                  setSlot(null)
                }}
              >
                <div className={s.docAvatar}>
                  {d.user?.avatar ? (
                    <Image
                      src={d.user.avatar}
                      alt={d.user?.name ?? ''}
                      fill
                      sizes='40px'
                      style={{ objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    d.user?.name?.[0] ?? '?'
                  )}
                </div>
                <div className={s.docInfo}>
                  <p className={s.docName}>{d.displayName || d.user?.name}</p>
                  <span className={s.docSpec}>{d.specialization}</span>
                  <div className={s.docMeta}>
                    {(d.ratings?.average ?? 0) > 0 && (
                      <span className={s.docRating}>
                        ★ {d.ratings!.average.toFixed(1)} ({d.ratings!.count})
                      </span>
                    )}
                    {(d.yearsOfExperience ?? 0) > 0 && (
                      <span className={s.docExp}>
                        {d.yearsOfExperience}yr exp
                      </span>
                    )}
                    <span className={s.docFee}>
                      ₦{d.consultationFee.toLocaleString()}
                    </span>
                  </div>
                </div>
                {selected?._id === d._id && <span className={s.tick}><CheckIcon size={14} /></span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Booking form ────────────────────────── */}
      {selected ? (
        <form className={s.bookPanel} onSubmit={book}>
          <div className={s.bookHead}>
            <div className={s.bookAvatarWrap}>
              {selected.user?.avatar ? (
                <Image
                  src={selected.user.avatar}
                  alt={selected.user?.name ?? ''}
                  fill
                  sizes='56px'
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <span>{selected.user?.name?.[0] ?? '?'}</span>
              )}
            </div>
            <div className={s.bookHeadInfo}>
              <h3>{selected.displayName || selected.user?.name}</h3>
              <p className={s.bookSpec}>{selected.specialization}</p>
              <div className={s.bookMetaRow}>
                {(selected.ratings?.average ?? 0) > 0 && (
                  <span className={s.bookRating}>
                    ★ {selected.ratings!.average.toFixed(1)}{' '}
                    <em>({selected.ratings!.count} reviews)</em>
                  </span>
                )}
                {(selected.yearsOfExperience ?? 0) > 0 && (
                  <span className={s.bookExp}>
                    {selected.yearsOfExperience} yrs experience
                  </span>
                )}
              </div>
              {(selected.socialLinks?.linkedin ||
                selected.socialLinks?.twitter ||
                selected.socialLinks?.website) && (
                <div className={s.socialLinks}>
                  {selected.socialLinks.linkedin && (
                    <a
                      href={selected.socialLinks.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={s.socialBtn}
                      title='LinkedIn'
                    >
                      <svg viewBox='0 0 24 24' fill='currentColor'>
                        <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' />
                      </svg>
                    </a>
                  )}
                  {selected.socialLinks.twitter && (
                    <a
                      href={selected.socialLinks.twitter}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={s.socialBtn}
                      title='Twitter / X'
                    >
                      <svg viewBox='0 0 24 24' fill='currentColor'>
                        <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.636 5.906-5.636zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                      </svg>
                    </a>
                  )}
                  {selected.socialLinks.website && (
                    <a
                      href={selected.socialLinks.website}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={s.socialBtn}
                      title='Website'
                    >
                      <svg
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth={2}
                      >
                        <circle cx='12' cy='12' r='10' />
                        <line x1='2' y1='12' x2='22' y2='12' />
                        <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {selected.bio && <p className={s.bio}>{selected.bio}</p>}

          {selected.qualifications && selected.qualifications.length > 0 && (
            <div className={s.qualsList}>
              {selected.qualifications.map((q, i) => (
                <span key={i} className={s.qualBadge}>
                  {q.degree} — {q.institution} {q.year}
                </span>
              ))}
            </div>
          )}

          <div className={s.field}>
            <label>Select Date</label>
            <input
              type='date'
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {date && (
            <div className={s.field}>
              <label>Available Time Slots</label>
              {loadingSlots ? (
                <Loader
                  inline
                  variant='dots'
                  size='sm'
                  label='Loading slots…'
                />
              ) : slots.length === 0 ? (
                <p className={s.slotNote}>
                  No slots available for this date. Try another day.
                </p>
              ) : (
                <div className={s.slotGrid}>
                  {slots.map((sl, i) => (
                    <button
                      key={i}
                      type='button'
                      className={`${s.slotBtn} ${
                        slot?._id === sl._id ? s.slotActive : ''
                      }`}
                      onClick={() => {
                        setSlot(sl)
                        const slotMins = getSlotDuration(sl)
                        if (duration > slotMins) {
                          setDuration(DURATION_OPTS.filter(d => d <= slotMins).at(-1) ?? slotMins)
                        }
                      }}
                    >
                      {sl.startTime} – {sl.endTime}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={s.field}>
            <label>Consultation Type</label>
            <div className={s.typeRow}>
              {TYPES.map(t => {
                const tFee = typeFeeFor(selected, t)
                const icon =
                  t === 'video' ? (
                    <VideoCameraIcon size={14} />
                  ) : t === 'audio' ? (
                    <PhoneIcon size={14} />
                  ) : (
                    <ChatIcon size={14} />
                  )
                return (
                  <button
                    key={t}
                    type='button'
                    className={`${s.typeBtn} ${type === t ? s.typeActive : ''}`}
                    onClick={() => setType(t)}
                  >
                    <span
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {icon} {t}
                    </span>
                    {tFee > 0 && <small>₦{tFee.toLocaleString()}</small>}
                  </button>
                )
              })}
            </div>
          </div>

          {selected.rateType !== 'per_session' && (
            <div className={s.field}>
              <label>Session Duration</label>
              <div className={s.durationRow}>
                {DURATION_OPTS.map(d => {
                  const slotMins = slot ? getSlotDuration(slot) : Infinity
                  const unavailable = d > slotMins
                  return (
                    <button
                      key={d}
                      type='button'
                      disabled={unavailable}
                      title={unavailable ? 'Exceeds slot duration' : undefined}
                      className={`${s.durationBtn} ${
                        duration === d ? s.durationActive : ''
                      } ${unavailable ? s.durationDisabled : ''}`}
                      onClick={() => !unavailable && setDuration(d)}
                    >
                      {d < 60 ? `${d}m` : `${d / 60}h`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className={s.summary}>
            <span>Billing</span>
            <span
              style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}
            >
              {selected.rateType === 'per_session'
                ? 'Per session'
                : selected.rateType === 'per_hour'
                ? `Per hour · ${duration} min`
                : `Per minute · ${duration} min`}
            </span>
          </div>
          {selected.urgentAvailable && (
            <label className={s.urgentRow}>
              <input
                type='checkbox'
                checked={isUrgent}
                onChange={e => setIsUrgent(e.target.checked)}
              />
              <span>
                <strong>Urgent booking</strong>
                {selected.urgentSurcharge > 0 &&
                  ` — adds ₦${selected.urgentSurcharge.toLocaleString()} surcharge`}
              </span>
            </label>
          )}
          <div className={s.summary}>
            <span>Total Fee</span>
            <strong>
              ₦{computeFee(selected, type, duration, isUrgent).toLocaleString()}
            </strong>
          </div>

          <button
            type='submit'
            className={s.bookBtn}
            disabled={
              booking ||
              !slot ||
              !date ||
              (computeFee(selected, type, duration, isUrgent) > 0 &&
                (!paystackPublicKey || !scriptLoaded))
            }
          >
            {booking
              ? 'Booking…'
              : computeFee(selected, type, duration, isUrgent) > 0 && (!paystackPublicKey || !scriptLoaded)
              ? 'Loading payment…'
              : 'Confirm Booking'}
          </button>
        </form>
      ) : (
        <div className={s.selectPrompt}>
          <p>← Select a doctor to continue</p>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState, FormEvent, type JSX } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { downloadReceipt } from '@/lib/receipt'
import s from './page.module.scss'
import { VideoIcon, PhoneIcon, ChatIcon, CheckIcon } from '@/components/icons'
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
  qualifications?: { degree: string; institution: string; year: number }[]
  displayName?: string
}

interface Slot {
  _id: string
  startTime: string
  endTime: string
  isBooked: boolean
}

const SPECS: { value: string; label: string; icon: string }[] = [
  { value: '', label: 'All', icon: '⊕' },
  { value: 'General Practitioner', label: 'General', icon: 'GP' },
  { value: 'Cardiologist', label: 'Cardiology', icon: 'HT' },
  { value: 'Dermatologist', label: 'Dermatology', icon: 'SK' },
  { value: 'Paediatrician', label: 'Paediatrics', icon: 'CH' },
  { value: 'Gynaecologist', label: 'Gynaecology', icon: 'GY' },
  { value: 'Psychiatrist', label: 'Psychiatry', icon: 'MH' },
  { value: 'Neurologist', label: 'Neurology', icon: 'NR' },
  { value: 'Oncologist', label: 'Oncology', icon: 'OC' }
]

const SPEC_ICONS: Record<string, JSX.Element> = {
  '': (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='16' />
      <line x1='8' y1='12' x2='16' y2='12' />
    </svg>
  ),
  'General Practitioner': (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
    </svg>
  ),
  Cardiologist: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
    </svg>
  ),
  Dermatologist: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
    </svg>
  ),
  Paediatrician: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='7' r='4' />
      <path d='M5.5 21a7 7 0 0 1 13 0' />
    </svg>
  ),
  Gynaecologist: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='8' r='5' />
      <path d='M12 13v8M9 18h6' />
    </svg>
  ),
  Psychiatrist: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <path d='M9.5 2A2.5 2.5 0 0 1 12 4.5v2A2.5 2.5 0 0 1 9.5 9H4a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5a2.5 2.5 0 0 1 2.5 2.5v2.5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V17a2.5 2.5 0 0 1 2.5-2.5H20a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-5.5A2.5 2.5 0 0 1 12 6.5v-2A2.5 2.5 0 0 1 14.5 2h1' />
    </svg>
  ),
  Neurologist: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <ellipse cx='12' cy='5' rx='9' ry='3' />
      <path d='M21 12c0 1.66-4 3-9 3s-9-1.34-9-3' />
      <path d='M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' />
    </svg>
  ),
  Oncologist: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='3' />
      <path d='M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83' />
    </svg>
  )
}
const TYPES = ['video', 'audio', 'chat'] as const
const DURATION_OPTS = [30, 45, 60, 90, 120]
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildDateStrip () {
  const today = new Date()
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      iso: d.toISOString().split('T')[0],
      day: d.getDate(),
      dow: DAYS_SHORT[d.getDay()]
    }
  })
}

function fmtTime (t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${
    h >= 12 ? 'PM' : 'AM'
  }`
}

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
  const [paystackPublicKey, setPaystackPublicKey] = useState(
    process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? ''
  )
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const dateStrip = buildDateStrip()

  function getSlotDuration (sl: Slot): number {
    const [sh, sm] = sl.startTime.split(':').map(Number)
    const [eh, em] = sl.endTime.split(':').map(Number)
    return eh * 60 + em - (sh * 60 + sm)
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

  function loadDoctors (sp = spec) {
    setLoadingDocs(true)
    const q = new URLSearchParams({ limit: '20' })
    if (sp) q.set('specialization', sp)
    api
      .get(`/doctors?${q}`)
      .then(r => setDoctors(r.data.data?.doctors ?? []))
      .catch(() => {})
      .finally(() => setLoadingDocs(false))
  }

  useEffect(() => {
    loadDoctors()
    const existing = document.querySelector(
      'script[src="https://js.paystack.co/v2/inline.js"]'
    )
    if (existing) {
      setScriptLoaded(true)
    } else {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v2/inline.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      document.body.appendChild(script)
    }
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
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
    const fee = computeFee(selected, type, duration, isUrgent)
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
          await api
            .put(`/appointments/${appt._id}/cancel`, {
              reason: 'Payment initiation failed'
            })
            .catch(() => {})
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
            await api
              .put(`/appointments/${appt._id}/cancel`, {
                reason: 'Payment not completed'
              })
              .catch(() => {})
            modal.show({
              variant: 'declined',
              title: 'Payment Cancelled',
              message:
                'No appointment was made. The slot is now available for others to book.'
            })
          }
        })
        return
      }

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

  const fee = selected ? computeFee(selected, type, duration, isUrgent) : 0
  const initials = selected
    ? (selected.displayName || selected.user?.name)
        ?.split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : ''

  return (
    <div className={s.layout}>
      {/* ── Doctor list (left) ── */}
      <div className={s.listPanel}>
        <div className={s.listHeader}>
          <h2>Find a Doctor</h2>
          <p>Book your next consultation</p>
        </div>

        <div className={s.specStrip}>
          {SPECS.map(sp => (
            <button
              key={sp.value}
              type='button'
              className={`${s.specChip} ${
                spec === sp.value ? s.specChipActive : ''
              }`}
              onClick={() => {
                setSpec(sp.value)
                loadDoctors(sp.value)
              }}
            >
              <span className={s.specChipIcon}>{SPEC_ICONS[sp.value]}</span>
              <span>{sp.label}</span>
            </button>
          ))}
        </div>

        <div className={s.docList}>
          {loadingDocs ? (
            <Loader variant='dots' label='Loading doctors…' />
          ) : doctors.length === 0 ? (
            <p className={s.emptyDocs}>No doctors found.</p>
          ) : (
            doctors.map(d => {
              const name = (d.displayName || d.user?.name) ?? 'Doctor'
              const initials = name
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()
              return (
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
                  {/* Photo */}
                  <div className={s.docPhotoWrap}>
                    {d.user?.avatar ? (
                      <Image
                        src={d.user.avatar}
                        alt={name}
                        fill
                        sizes='360px'
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center top'
                        }}
                      />
                    ) : (
                      <span className={s.docPhotoFallback}>{initials}</span>
                    )}
                    {(d.ratings?.average ?? 0) > 0 && (
                      <div className={s.docRatingBadge}>
                        ★ {d.ratings!.average.toFixed(1)}
                        <span style={{ opacity: 0.6 }}>
                          ({d.ratings!.count})
                        </span>
                      </div>
                    )}
                    {selected?._id === d._id && (
                      <div className={s.docTick}>
                        <CheckIcon size={12} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className={s.docInfo}>
                    <div className={s.docInfoTop}>
                      <div>
                        <p className={s.docName}>{name}</p>
                        <p className={s.docSpec}>{d.specialization}</p>
                        {(d.yearsOfExperience ?? 0) > 0 && (
                          <p className={s.docExp}>
                            {d.yearsOfExperience} yrs exp
                          </p>
                        )}
                      </div>
                      <span className={s.docFee}>
                        ₦{d.consultationFee.toLocaleString()}
                        <small
                          style={{
                            fontSize: '0.58rem',
                            fontWeight: 600,
                            opacity: 0.65
                          }}
                        >
                          {' '}
                          /session
                        </small>
                      </span>
                    </div>

                    {/* Next available dates */}
                    <div className={s.docDates}>
                      {dateStrip.slice(0, 4).map(ds => (
                        <span
                          key={ds.iso}
                          className={`${s.docDateChip} ${
                            date === ds.iso && selected?._id === d._id
                              ? s.docDateChipActive
                              : ''
                          }`}
                          onClick={e => {
                            e.stopPropagation()
                            setSelected(d)
                            setDate(ds.iso)
                            setSlots([])
                            setSlot(null)
                          }}
                        >
                          {ds.dow} {ds.day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Booking panel (right) ── */}
      {selected ? (
        <form className={s.bookPanel} onSubmit={book}>
          {/* Hero photo */}
          <div className={s.hero}>
            {selected.user?.avatar ? (
              <Image
                src={selected.user.avatar}
                alt={selected.user?.name ?? ''}
                fill
                sizes='(min-width: 1024px) 700px, 100vw'
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
              />
            ) : (
              <div className={s.heroBgInitials}>
                <span>{initials}</span>
              </div>
            )}
            <div className={s.heroGrad} />

            {/* Rating badge */}
            {(selected.ratings?.average ?? 0) > 0 && (
              <div className={s.heroRating}>
                ★ {selected.ratings!.average.toFixed(1)}
              </div>
            )}

            {/* Consultation type quick-select */}
            <div className={s.heroActions}>
              <button
                type='button'
                className={`${s.heroActionBtn} ${
                  type === 'audio' ? s.heroActionActive : ''
                }`}
                onClick={() => setType('audio')}
                title='Voice Call'
              >
                <PhoneIcon size={13} />
              </button>
              <button
                type='button'
                className={`${s.heroActionBtn} ${
                  type === 'video' ? s.heroActionActive : ''
                }`}
                onClick={() => setType('video')}
                title='Video Call'
              >
                <VideoIcon size={13} />
              </button>
              <button
                type='button'
                className={`${s.heroActionBtn} ${
                  type === 'chat' ? s.heroActionActive : ''
                }`}
                onClick={() => setType('chat')}
                title='Chat'
              >
                <ChatIcon size={13} />
              </button>
            </div>

            {/* Name overlay */}
            <div className={s.heroContent}>
              <h2 className={s.heroName}>
                {selected.displayName || selected.user?.name}
              </h2>
              {selected.qualifications?.[0] && (
                <p className={s.heroCreds}>
                  {selected.qualifications[0].degree}
                </p>
              )}
              <p className={s.heroSpec}>{selected.specialization}</p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className={s.bookBody}>
            {/* Stats row */}
            <div className={s.statsRow}>
              {(selected.yearsOfExperience ?? 0) > 0 && (
                <>
                  <div className={s.statItem}>
                    <strong>{selected.yearsOfExperience}</strong>
                    <span>Yrs Exp.</span>
                  </div>
                  <div className={s.statDiv} />
                </>
              )}
              <div className={s.statItem}>
                <strong>₦{selected.consultationFee.toLocaleString()}</strong>
                <span>Per Session</span>
              </div>
              {(selected.ratings?.average ?? 0) > 0 && (
                <>
                  <div className={s.statDiv} />
                  <div className={s.statItem}>
                    <strong>★ {selected.ratings!.average.toFixed(1)}</strong>
                    <span>{selected.ratings!.count} Reviews</span>
                  </div>
                </>
              )}
            </div>

            {/* Bio */}
            {selected.bio && (
              <div>
                <p className={s.sectionLabel}>About Doctor</p>
                <p className={s.bio}>{selected.bio}</p>
              </div>
            )}

            {/* Qualifications */}
            {selected.qualifications && selected.qualifications.length > 0 && (
              <div className={s.qualsList}>
                {selected.qualifications.map((q, i) => (
                  <span key={i} className={s.qualBadge}>
                    {q.degree} — {q.institution} {q.year}
                  </span>
                ))}
              </div>
            )}

            {/* Consultation type */}
            <div>
              <p className={s.sectionLabel}>Consultation Type</p>
              <div className={s.typeRow}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    type='button'
                    className={`${s.typePill} ${
                      type === t ? s.typePillActive : ''
                    }`}
                    onClick={() => setType(t)}
                  >
                    {t === 'video' ? (
                      <VideoIcon size={14} />
                    ) : t === 'audio' ? (
                      <PhoneIcon size={14} />
                    ) : (
                      <ChatIcon size={14} />
                    )}
                    <span>
                      {t === 'video'
                        ? 'Video'
                        : t === 'audio'
                        ? 'Voice'
                        : 'Chat'}
                    </span>
                    {typeFeeFor(selected, t) > 0 && (
                      <small>₦{typeFeeFor(selected, t).toLocaleString()}</small>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Date strip */}
            <div>
              <p className={s.sectionLabel}>Select Date</p>
              <div className={s.dateStrip}>
                {dateStrip.map(d => (
                  <button
                    key={d.iso}
                    type='button'
                    className={`${s.dateCell} ${
                      date === d.iso ? s.dateCellActive : ''
                    }`}
                    onClick={() => setDate(d.iso)}
                  >
                    <span className={s.dateDow}>{d.dow}</span>
                    <strong className={s.dateNum}>{d.day}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            {date && (
              <div>
                <p className={s.sectionLabel}>Select Time</p>
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
                    {slots.map(sl => (
                      <button
                        key={sl._id}
                        type='button'
                        className={`${s.slotPill} ${
                          slot?._id === sl._id ? s.slotPillActive : ''
                        }`}
                        onClick={() => {
                          setSlot(sl)
                          const slotMins = getSlotDuration(sl)
                          if (duration > slotMins)
                            setDuration(
                              DURATION_OPTS.filter(d => d <= slotMins).at(-1) ??
                                slotMins
                            )
                        }}
                      >
                        {fmtTime(sl.startTime)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Duration picker */}
            {selected.rateType !== 'per_session' && (
              <div>
                <p className={s.sectionLabel}>Session Duration</p>
                <div className={s.durationRow}>
                  {DURATION_OPTS.map(d => {
                    const slotMins = slot ? getSlotDuration(slot) : Infinity
                    const unavailable = d > slotMins
                    return (
                      <button
                        key={d}
                        type='button'
                        disabled={unavailable}
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

            {/* Urgent */}
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

            {/* Fee summary */}
            <div className={s.feeRow}>
              <div>
                <span className={s.feeLabel}>Total Fee</span>
                <span className={s.feeAmt}>₦{fee.toLocaleString()}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={s.feeLabel}>Billing</span>
                <span className={s.feeSub}>
                  {selected.rateType === 'per_session'
                    ? 'Per session'
                    : selected.rateType === 'per_hour'
                    ? `Per hour · ${duration} min`
                    : `Per min · ${duration} min`}
                </span>
              </div>
            </div>

            <button
              type='submit'
              className={s.bookBtn}
              disabled={
                booking ||
                !slot ||
                !date ||
                (fee > 0 && (!paystackPublicKey || !scriptLoaded))
              }
            >
              {booking
                ? 'Booking…'
                : fee > 0 && (!paystackPublicKey || !scriptLoaded)
                ? 'Loading payment…'
                : 'Book Appointment'}
            </button>
          </div>
        </form>
      ) : (
        <div className={s.selectPrompt}>
          <svg
            width='48'
            height='48'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
            style={{ opacity: 0.2 }}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3'
            />
          </svg>
          <p>Select a doctor to continue</p>
        </div>
      )}
    </div>
  )
}

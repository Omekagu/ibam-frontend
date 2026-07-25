'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'

interface Doctor {
  _id: string
  user: { _id: string; name: string; avatar?: string }
  specialization: string
  bio?: string
  consultationFee: number
  yearsOfExperience: number
  ratings?: { average: number; count: number }
  rateType: 'per_session' | 'per_hour' | 'per_minute'
  sessionDurationMinutes: number
  urgentAvailable: boolean
  urgentSurcharge: number
  fees?: { video?: number; audio?: number; chat?: number }
}

interface Slot {
  _id: string
  startTime: string
  endTime: string
  isBooked: boolean
}

const SPECS = ['', 'Cardiologist', 'Dermatologist', 'Paediatrician', 'Gynaecologist', 'Psychiatrist', 'General Practitioner', 'Neurologist', 'Oncologist']
const TYPES = ['video', 'audio', 'chat'] as const
const DURATION_OPTS = [30, 45, 60, 90, 120] // minutes

export default function BookDoctor () {
  const router = useRouter()

  const [doctors,      setDoctors]      = useState<Doctor[]>([])
  const [loadingDocs,  setLoadingDocs]  = useState(true)
  const [spec,         setSpec]         = useState('')
  const [selected,     setSelected]     = useState<Doctor | null>(null)
  const [date,         setDate]         = useState('')
  const [slots,        setSlots]        = useState<Slot[]>([])
  const [avId,         setAvId]         = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slot,         setSlot]         = useState<Slot | null>(null)
  const [type,         setType]         = useState<typeof TYPES[number]>('video')
  const [isUrgent,     setIsUrgent]     = useState(false)
  const [duration,     setDuration]     = useState(30)
  const [booking,      setBooking]      = useState(false)
  const [booked,       setBooked]       = useState(false)
  const [paymentUrl,   setPaymentUrl]   = useState('')
  const [error,        setError]        = useState('')

  function typeFeeFor (doctor: Doctor, t: typeof TYPES[number]): number {
    return doctor.fees?.[t] ?? doctor.consultationFee ?? 0
  }

  function computeFee (doctor: Doctor, t: typeof TYPES[number], durationMin: number, urgent: boolean): number {
    const base = typeFeeFor(doctor, t)
    let fee = base
    if (doctor.rateType === 'per_hour')   fee = Math.ceil(durationMin / 60) * base
    if (doctor.rateType === 'per_minute') fee = durationMin * base
    if (urgent && doctor.urgentSurcharge) fee += doctor.urgentSurcharge
    return fee
  }

  function loadDoctors (s = spec) {
    setLoadingDocs(true)
    const q = new URLSearchParams({ limit: '20' })
    if (s) q.set('specialization', s)
    api.get(`/doctors?${q}`)
      .then(r => setDoctors(r.data.data?.doctors ?? []))
      .catch(() => {})
      .finally(() => setLoadingDocs(false))
  }

  useEffect(() => { loadDoctors() }, [])

  useEffect(() => {
    if (!selected || !date) return
    setSlots([]); setSlot(null); setAvId('')
    setLoadingSlots(true)
    api.get(`/doctors/available-slots?doctorId=${selected.user._id}&date=${date}`)
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
    setBooking(true)
    setError('')
    try {
      const scheduledAt = new Date(`${date}T${slot.startTime}`).toISOString()
      const apptRes = await api.post('/appointments/book', {
        doctorId: selected.user._id,
        scheduledAt,
        type,
        availabilityId: avId,
        slotId: slot._id,
        isUrgent,
        sessionDurationMinutes: duration,
      })
      const appt = apptRes.data.data?.appointment
      if (appt?.consultationFee > 0) {
        // Initiate Paystack payment immediately after booking
        const payRes = await api.post('/payments/initiate', {
          type: 'consultation',
          serviceId: appt._id,
          amount: appt.consultationFee,
        })
        const url: string | undefined = payRes.data.data?.authorizationUrl
        if (url) { setPaymentUrl(url); setBooked(true); return }
      }
      setBooked(true)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Booking failed. Please try again.')
    }
    setBooking(false)
  }

  if (booked) return (
    <div className={s.successBox}>
      <div className={s.successIcon}>✅</div>
      <h2>Appointment Booked!</h2>
      {paymentUrl ? (
        <>
          <p>Your <strong>{type}</strong> consultation with <strong>{selected?.user.name}</strong> is confirmed for {date} at {slot?.startTime}.</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.75 }}>Complete payment to confirm your session.</p>
          <button className={s.doneBtn} onClick={() => { window.location.href = paymentUrl }}>Pay Now →</button>
          <button className={s.skipBtn} onClick={() => router.push('/patient/appointments')}>Pay Later</button>
        </>
      ) : (
        <>
          <p>Your <strong>{type}</strong> consultation with <strong>{selected?.user.name}</strong> is scheduled for {date} at {slot?.startTime}.</p>
          <button className={s.doneBtn} onClick={() => router.push('/patient/appointments')}>View My Appointments</button>
        </>
      )}
    </div>
  )

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={s.grid}>
      {/* ── Doctor list ─────────────────────────── */}
      <div>
        <div className={s.searchRow}>
          <select value={spec} onChange={e => { setSpec(e.target.value); loadDoctors(e.target.value) }}>
            {SPECS.map(sp => <option key={sp} value={sp}>{sp || 'All Specialties'}</option>)}
          </select>
        </div>

        <div className={s.docList}>
          {loadingDocs ? (
            <p className={s.empty}>Loading doctors…</p>
          ) : doctors.length === 0 ? (
            <p className={s.empty}>No doctors found.</p>
          ) : doctors.map(d => (
            <div
              key={d._id}
              className={`${s.docCard} ${selected?._id === d._id ? s.selected : ''}`}
              onClick={() => { setSelected(d); setDate(''); setSlots([]); setSlot(null) }}
            >
              <div className={s.docAvatar}>{d.user.name[0]}</div>
              <div className={s.docInfo}>
                <p className={s.docName}>{d.user.name}</p>
                <span className={s.docSpec}>{d.specialization}</span>
                <p className={s.docFee}>₦{d.consultationFee.toLocaleString()} / session</p>
              </div>
              {selected?._id === d._id && <span className={s.tick}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Booking form ────────────────────────── */}
      {selected ? (
        <form className={s.bookPanel} onSubmit={book}>
          <div className={s.bookHead}>
            <h3>Book {selected.user.name}</h3>
            <p className={s.bookSpec}>{selected.specialization}</p>
          </div>

          {selected.bio && <p className={s.bio}>{selected.bio}</p>}

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
                <p className={s.slotNote}>Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className={s.slotNote}>No available slots for this date. Try another day.</p>
              ) : (
                <div className={s.slotGrid}>
                  {slots.map((sl, i) => (
                    <button
                      key={i}
                      type='button'
                      className={`${s.slotBtn} ${slot?._id === sl._id ? s.slotActive : ''}`}
                      onClick={() => setSlot(sl)}
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
                const icon = t === 'video' ? '📹' : t === 'audio' ? '📞' : '💬'
                return (
                  <button
                    key={t}
                    type='button'
                    className={`${s.typeBtn} ${type === t ? s.typeActive : ''}`}
                    onClick={() => setType(t)}
                  >
                    <span>{icon} {t}</span>
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
                {DURATION_OPTS.map(d => (
                  <button key={d} type='button'
                    className={`${s.durationBtn} ${duration === d ? s.durationActive : ''}`}
                    onClick={() => setDuration(d)}>
                    {d < 60 ? `${d}m` : `${d / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={s.summary}>
            <span>Billing</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {selected.rateType === 'per_session' ? 'Per session' : selected.rateType === 'per_hour' ? `Per hour · ${duration} min` : `Per minute · ${duration} min`}
            </span>
          </div>
          {selected.urgentAvailable && (
            <label className={s.urgentRow}>
              <input type='checkbox' checked={isUrgent} onChange={e => setIsUrgent(e.target.checked)} />
              <span>
                <strong>Urgent booking</strong>
                {selected.urgentSurcharge > 0 && ` — adds ₦${selected.urgentSurcharge.toLocaleString()} surcharge`}
              </span>
            </label>
          )}
          <div className={s.summary}>
            <span>Total Fee</span>
            <strong>₦{computeFee(selected, type, duration, isUrgent).toLocaleString()}</strong>
          </div>

          {error && <p className={s.error}>{error}</p>}

          <button
            type='submit'
            className={s.bookBtn}
            disabled={booking || !slot || !date}
          >
            {booking ? 'Booking…' : 'Confirm Booking'}
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

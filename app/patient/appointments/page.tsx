'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { downloadReceipt } from '@/lib/receipt'
import {
  VideoIcon, PhoneIcon, ChatIcon, CreditCardIcon,
  CalendarIcon, CheckCircleIcon, XIcon, ClockIcon
} from '@/components/icons'
import s from './page.module.scss'

interface Appointment {
  _id: string
  doctor: {
    _id: string
    name: string
    avatar?: string
    specialization?: string
    rating?: number
  }
  scheduledAt: string
  type: 'video' | 'audio' | 'chat'
  status: string
  consultationFee: number
  isFollowUp: boolean
  isUrgent: boolean
  sessionDurationMinutes: number
}

type Tab = 'upcoming' | 'past' | 'all'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const TYPE_ICON: Record<string, ReactNode> = {
  video: <VideoIcon size={13} />,
  audio: <PhoneIcon size={13} />,
  chat:  <ChatIcon  size={13} />,
}
const TYPE_LABEL: Record<string, string> = {
  video: 'Video Call',
  audio: 'Voice Call',
  chat:  'Chat',
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmed',  cls: 'st_confirmed' },
  pending:   { label: 'Unpaid',     cls: 'st_pending'   },
  completed: { label: 'Completed',  cls: 'st_completed' },
  cancelled: { label: 'Cancelled',  cls: 'st_cancelled' },
  no_show:   { label: 'No-show',    cls: 'st_no_show'   },
}

function DoctorAvatar ({ name, avatar }: { name: string; avatar?: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return avatar
    ? <img src={avatar} alt={name} className={s.avatar} />
    : <div className={s.avatarFallback}><span>{initials}</span></div>
}

export default function PatientAppointments () {
  const router = useRouter()
  const modal  = useStatusModal()
  const [appts,       setAppts]       = useState<Appointment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<Tab>('upcoming')
  const [acting,      setActing]      = useState<string | null>(null)
  const [now,         setNow]         = useState(Date.now())
  const [paystackKey, setPaystackKey] = useState(process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? '')
  const [scriptLoaded,setScriptLoaded] = useState(false)

  useEffect(() => {
    api.get('/appointments/mine?limit=100')
      .then(r => setAppts(r.data.data?.appointments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const existing = document.querySelector('script[src="https://js.paystack.co/v2/inline.js"]')
    if (existing) { setScriptLoaded(true) }
    else {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v2/inline.js'
      script.async = true
      script.onload = () => setScriptLoaded(true)
      document.body.appendChild(script)
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://10.0.1.44:5000/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(b => { if (b?.data?.paystackPublicKey) setPaystackKey(b.data.paystackPublicKey) })
      .catch(() => {})
  }, [])

  const nowIso = new Date(now).toISOString()

  const filtered = appts.filter(a => {
    if (tab === 'upcoming')
      return a.status !== 'cancelled' && a.status !== 'completed' && a.scheduledAt >= nowIso
    if (tab === 'past')
      return a.status === 'completed' || a.status === 'cancelled' || a.scheduledAt < nowIso
    return true
  })

  async function joinConsultation (apptId: string) {
    setActing(apptId)
    try {
      const r = await api.get(`/consultations/by-appointment/${apptId}`)
      const cid = r.data.data?.consultation?._id
      if (cid) {
        router.push(`/consultation?appt=${apptId}&cid=${cid}`)
      } else {
        modal.show({ variant: 'pending', title: 'Not Ready Yet', message: "Doctor hasn't started the session yet. Please wait." })
      }
    } catch {
      modal.show({ variant: 'pending', title: 'Not Ready Yet', message: "Doctor hasn't started the session yet. Please wait." })
    }
    setActing(null)
  }

  async function cancelAppt (appt: Appointment) {
    if (appt.status !== 'confirmed') {
      setActing(appt._id)
      try {
        await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Cancelled by patient' })
        setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a))
      } catch {}
      setActing(null)
      return
    }
    const hoursUntil = (new Date(appt.scheduledAt).getTime() - Date.now()) / 3_600_000
    const refundNote = hoursUntil > 24
      ? 'You are eligible for a full refund (more than 24 hrs away).'
      : hoursUntil > 2
      ? 'You are eligible for a 50% refund (2–24 hrs before appointment).'
      : 'No refund applies for cancellations under 2 hours before the appointment.'
    modal.show({
      variant: 'pending',
      title: 'Cancellation Policy',
      message: `${refundNote} Refunds take 3–5 business days. Do you still want to cancel?`,
      actionLabel: 'Yes, Cancel',
      dismissLabel: 'Keep Appointment',
      onAction: async () => {
        setActing(appt._id)
        try {
          await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Cancelled by patient' })
          setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a))
        } catch {}
        setActing(null)
      }
    })
  }

  async function payForAppointment (appt: Appointment) {
    if (!paystackKey || !scriptLoaded) {
      modal.show({ variant: 'pending', title: 'Payment Loading', message: 'Payment system is still initialising. Please wait.' })
      return
    }
    setActing(appt._id)
    try {
      const payRes = await api.post('/payments/initiate', { type: 'consultation', serviceId: appt._id, amount: appt.consultationFee })
      const { accessCode, reference } = payRes.data.data
      setActing(null)
      const paystack = new (window as any).PaystackPop()
      paystack.newTransaction({
        key: paystackKey,
        accessCode,
        onSuccess: async () => {
          try {
            await api.get(`/payments/verify/${reference}`)
            setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'confirmed' } : a))
            downloadReceipt({
              bookingRef: `#${appt._id.slice(-8).toUpperCase()}`,
              tests: [`${appt.type} consultation with Dr. ${appt.doctor?.name}`],
              amount: appt.consultationFee,
              collectionType: 'walk_in',
              transactionRef: reference
            })
            modal.show({ variant: 'success', title: 'Payment Confirmed!', message: `Your ${appt.type} appointment with Dr. ${appt.doctor?.name} is now confirmed.` })
          } catch { /* silent */ }
        },
        onCancel: async () => {
          await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Payment not completed' }).catch(() => {})
          setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a))
          modal.show({ variant: 'declined', title: 'Payment Cancelled', message: 'No appointment was made. The slot is now available for others to book.' })
        }
      })
    } catch {
      setActing(null)
      modal.show({ variant: 'declined', title: 'Error', message: 'Could not initiate payment. Please try again.' })
    }
  }

  const confirmedCount = appts.filter(a => {
    const sessionEnd = new Date(a.scheduledAt).getTime() + (a.sessionDurationMinutes ?? 30) * 60_000
    return a.status === 'confirmed' && sessionEnd > now
  }).length

  const TABS: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past',     label: 'Past'     },
    { key: 'all',      label: 'All'      },
  ]

  return (
    <>
      {/* ── Tab bar ── */}
      <div className={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${s.tab} ${tab === t.key ? s.active : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.key === 'upcoming' && confirmedCount > 0 && (
              <span className={s.tabBadge}>{confirmedCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={s.empty}><Loader label='Loading appointments…' /></div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <CalendarIcon size={36} />
          <p>No {tab === 'all' ? '' : tab + ' '}appointments.</p>
          {tab !== 'past' && (
            <button className={s.bookNowBtn} onClick={() => router.push('/patient/book')}>
              Find a Doctor
            </button>
          )}
        </div>
      ) : (
        <div className={s.list}>
          {filtered.map(a => {
            const d = new Date(a.scheduledAt)
            const sessionEndMs = d.getTime() + (a.sessionDurationMinutes ?? 30) * 60_000
            const isElapsed    = sessionEndMs < now
            const diffMin      = (d.getTime() - now) / 60_000
            // Absolute guard: never show Join more than 4 hours after scheduled time
            const absoluteDeadline = d.getTime() + 4 * 60 * 60_000
            const isJoinable   = a.status === 'confirmed' && !isElapsed && absoluteDeadline > now
            const isLive       = a.status === 'confirmed' && !isElapsed
            const canCancel    = (a.status === 'confirmed' || a.status === 'pending') && !isElapsed
            const isPast       = a.status === 'completed' || a.status === 'cancelled'
            const sm           = STATUS_META[a.status] ?? { label: a.status, cls: 'st_pending' }

            return (
              <div
                key={a._id}
                className={`${s.card} ${isLive ? s.cardLive : ''} ${isPast ? s.cardPast : ''}`}
              >
                {isLive && <div className={s.liveAccent} />}

                {/* Date chip */}
                <div className={`${s.dateChip} ${isLive ? s.dateChipLive : ''} ${isPast ? s.dateChipPast : ''}`}>
                  <span className={s.dateMonth}>{MONTHS[d.getMonth()]}</span>
                  <span className={s.dateDay}>{d.getDate()}</span>
                  <span className={s.dateTime}>
                    {d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Divider */}
                <div className={s.chipDivider} />

                {/* Doctor info */}
                <div className={s.avatarWrap}>
                  <DoctorAvatar name={a.doctor?.name ?? 'D'} avatar={a.doctor?.avatar} />
                  {isLive && <div className={s.liveDot} />}
                </div>

                <div className={s.info}>
                  <div className={s.infoTop}>
                    <p className={s.docName}>{a.doctor?.name ?? '—'}</p>
                    {a.isUrgent   && <span className={s.urgentBadge}>Urgent</span>}
                    {a.isFollowUp && <span className={s.followUpBadge}>Follow-up</span>}
                  </div>
                  {a.doctor?.specialization && (
                    <p className={s.docSpec}>{a.doctor.specialization}</p>
                  )}
                  <div className={s.metaRow}>
                    <span className={s.typeChip}>
                      {TYPE_ICON[a.type]}
                      <span>{TYPE_LABEL[a.type]}</span>
                    </span>
                  </div>
                  {/* Timing pill — only for upcoming */}
                  {!isPast && diffMin > 0 && diffMin < 1440 && (
                    <span className={`${s.timingPill} ${diffMin < 15 ? s.timing_soon : s.timing_muted}`}>
                      {diffMin < 60
                        ? `In ${Math.round(diffMin)} min`
                        : `In ${Math.round(diffMin / 60)}h`}
                    </span>
                  )}
                </div>

                {/* Right: status + fee + actions */}
                <div className={s.right}>
                  <div className={s.statusFeeRow}>
                    <span className={`${s.statusBadge} ${s[sm.cls]}`}>
                      {isLive ? (
                        <><span className={s.livePulse} />{' '}Live</>
                      ) : (
                        sm.label
                      )}
                    </span>
                    {a.consultationFee > 0 && (
                      <span className={s.fee}>₦{a.consultationFee.toLocaleString()}</span>
                    )}
                  </div>

                  <div className={s.actions}>
                    {isJoinable && (
                      <button className={s.joinBtn} disabled={acting === a._id} onClick={() => joinConsultation(a._id)}>
                        {acting === a._id ? <Loader label='' /> : a.type === 'chat' ? <><ChatIcon size={13} /> Open Chat</> : <><VideoIcon size={13} /> Join Call</>}
                      </button>
                    )}
                    {a.status === 'confirmed' && isElapsed && (
                      <span className={s.elapsedLabel}>
                        <ClockIcon size={12} /> Session ended
                      </span>
                    )}
                    {a.status === 'pending' && a.consultationFee > 0 && (
                      <button className={s.payBtn} disabled={acting === a._id || !paystackKey || !scriptLoaded} onClick={() => payForAppointment(a)}>
                        {acting === a._id ? '…' : !paystackKey || !scriptLoaded ? 'Loading…' : <><CreditCardIcon size={13} /> Pay Now</>}
                      </button>
                    )}
                    {canCancel && (
                      <button className={s.cancelBtn} disabled={acting === a._id} onClick={() => cancelAppt(a)}>
                        Cancel
                      </button>
                    )}
                    {a.status === 'completed' && (
                      <span className={s.completedLabel}><CheckCircleIcon size={13} /> Done</span>
                    )}
                    {a.status === 'cancelled' && (
                      <span className={s.cancelledLabel}><XIcon size={13} /> Cancelled</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

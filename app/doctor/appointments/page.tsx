'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import { useStatusModal } from '@/components/StatusModal'
import s from './page.module.scss'

interface Appointment {
  _id: string
  patient: { _id: string; name: string; avatar?: string }
  scheduledAt: string
  type: 'video' | 'audio' | 'chat'
  status: string
  consultationFee: number
  rescheduleCount?: number
}

interface RescheduleState {
  appt: Appointment
  date: string
  time: string
  reason: string
}

type Tab = 'today' | 'upcoming' | 'past'

interface TimingInfo { label: string; urgent: boolean }

function isSessionExpired (scheduledAt: string, durationMin = 30): boolean {
  return Date.now() > new Date(scheduledAt).getTime() + durationMin * 60_000
}

function getTimingInfo (scheduledAt: string, now: number): TimingInfo {
  const diff = (new Date(scheduledAt).getTime() - now) / 60_000
  if (diff > 60)  return { label: new Date(scheduledAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }), urgent: false }
  if (diff > 15)  return { label: `In ${Math.round(diff)} min`, urgent: false }
  if (diff > 0)   return { label: `Starts in ${Math.round(diff)} min`, urgent: true }
  if (diff > -1)  return { label: 'Start now', urgent: true }
  if (diff > -15) return { label: `${Math.floor(-diff)} min late`, urgent: true }
  return { label: `${Math.floor(-diff)} min ago`, urgent: false }
}

export default function DoctorAppointments () {
  const router = useRouter()
  const modal  = useStatusModal()
  const [appts,   setAppts]   = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('today')
  const [acting,      setActing]      = useState<string | null>(null)
  const [now,         setNow]         = useState(Date.now())
  const [reschedule,  setReschedule]  = useState<RescheduleState | null>(null)
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    api.get('/doctors/my/appointments')
      .then(r => setAppts(r.data.data?.appointments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Refresh timing labels every 30 s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const todayStr = new Date().toISOString().split('T')[0]
  const nowIso   = new Date(now).toISOString()

  const filtered = appts.filter(a => {
    if (a.status === 'pending') return false // unpaid — doctor doesn't see it until payment confirms
    if (tab === 'today')    return a.scheduledAt.startsWith(todayStr)
    if (tab === 'upcoming') return a.scheduledAt > nowIso && !a.scheduledAt.startsWith(todayStr) && a.status !== 'cancelled'
    return a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show'
  })

  async function startConsultation (apptId: string) {
    setActing(apptId)
    try {
      const res = await api.post('/consultations/start', { appointmentId: apptId })
      const consult = res.data.data?.consultation
      router.push(`/consultation?appt=${apptId}&cid=${consult._id}`)
    } catch {
      router.push(`/consultation?appt=${apptId}`)
    } finally {
      setActing(null)
    }
  }

  async function rejoinConsultation (apptId: string) {
    setActing(apptId)
    try {
      const r = await api.get(`/consultations/by-appointment/${apptId}`)
      const cid = r.data.data?.consultation?._id
      if (cid) router.push(`/consultation?appt=${apptId}&cid=${cid}`)
    } catch { }
    setActing(null)
  }

  function openReschedule (appt: Appointment) {
    const d = new Date(appt.scheduledAt)
    setReschedule({
      appt,
      date: d.toISOString().split('T')[0],
      time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      reason: '',
    })
  }

  async function submitReschedule () {
    if (!reschedule) return
    const { appt, date, time, reason } = reschedule
    if (!date || !time) return
    const newISO = new Date(`${date}T${time}:00`).toISOString()
    setRescheduling(true)
    try {
      const res = await api.put(`/appointments/${appt._id}/doctor-reschedule`, { scheduledAt: newISO, reason })
      setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, scheduledAt: res.data.data?.appointment?.scheduledAt ?? newISO } : a))
      modal.show({ variant: 'success', title: 'Appointment Rescheduled', message: `Rescheduled to ${new Date(newISO).toDateString()}. The patient and admin have been notified.` })
      setReschedule(null)
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'Reschedule Failed', message: err?.response?.data?.message ?? 'Could not reschedule. Please try again.' })
    }
    setRescheduling(false)
  }

  async function cancelAppt (appt: Appointment) {
    if (appt.status !== 'confirmed') {
      // Patient hasn't paid — just cancel, no refund involved
      setActing(appt._id)
      try {
        await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Cancelled by doctor' })
        setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a))
      } catch {}
      setActing(null)
      return
    }

    // Patient has paid — per policy, doctor cancellation = 100% refund to patient
    modal.show({
      variant: 'pending',
      title: 'Cancellation Policy',
      message: 'Per iBam Health policy, cancelling a confirmed appointment will trigger a 100% refund to the patient. This action cannot be undone. See ibamhealth.com/legal/refund for the full policy.',
      actionLabel: 'Yes, Cancel Appointment',
      dismissLabel: 'Keep Appointment',
      onAction: async () => {
        setActing(appt._id)
        try {
          await api.put(`/appointments/${appt._id}/cancel`, { reason: 'Cancelled by doctor' })
          setAppts(prev => prev.map(a => a._id === appt._id ? { ...a, status: 'cancelled' } : a))
        } catch {}
        setActing(null)
      }
    })
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'today',    label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past',     label: 'Past' },
  ]

  return (
    <>
      <div className={s.tabs}>
        {TABS.map(t => (
          <button key={t.key} className={`${s.tab} ${tab === t.key ? s.active : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={s.loading}><Loader label='Loading appointments…' /></div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>No appointments in this category.</div>
      ) : (
        <div className={s.list}>
          {filtered.map(a => {
            const timing = getTimingInfo(a.scheduledAt, now)
            const isConfirmed = a.status === 'confirmed'
            const isActive = isConfirmed && !isSessionExpired(a.scheduledAt)

            return (
              <div key={a._id} className={`${s.card} ${timing.urgent && isActive ? s.urgent : ''}`}>
                <div className={s.cardLeft}>
                  <div className={s.avatar}>{a.patient?.name?.[0] ?? '?'}</div>
                  <div className={s.info}>
                    <p className={s.patName}>{a.patient?.name ?? 'Patient'}</p>
                    <span className={s.meta}>
                      {new Date(a.scheduledAt).toLocaleString('en-NG', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className={s.meta}>₦{a.consultationFee.toLocaleString()}</span>
                    {isActive && timing.label && (
                      <span className={`${s.timingLabel} ${timing.urgent ? s.timingUrgent : s.timingMuted}`}>
                        {timing.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className={s.cardRight}>
                  <span className={`${s.typeBadge} ${s[a.type]}`}>{a.type}</span>
                  <span className={`${s.statusBadge} ${s[a.status]}`}>{statusLabel(a.status)}</span>

                  {isActive && (
                    <button
                      className={`${s.startBtn} ${timing.urgent ? s.startNow : s.live}`}
                      disabled={acting === a._id}
                      onClick={() => startConsultation(a._id)}
                    >
                      {acting === a._id ? '…' : 'Start'}
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      className={s.rescheduleBtn}
                      disabled={acting === a._id}
                      onClick={() => openReschedule(a)}
                    >
                      Reschedule
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      className={s.cancelBtn}
                      disabled={acting === a._id}
                      onClick={() => cancelAppt(a)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Reschedule modal ── */}
      {reschedule && (
        <div className={s.modalOverlay} onClick={() => !rescheduling && setReschedule(null)}>
          <div className={s.modalCard} onClick={e => e.stopPropagation()}>
            <p className={s.modalTitle}>Reschedule Appointment</p>
            <p className={s.modalSub}>
              Patient: <strong>{reschedule.appt.patient?.name}</strong><br />
              Current: {new Date(reschedule.appt.scheduledAt).toLocaleString('en-NG', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
            <div className={s.modalField}>
              <label>New Date</label>
              <input
                type='date'
                className={s.modalInput}
                value={reschedule.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setReschedule(r => r ? { ...r, date: e.target.value } : r)}
              />
            </div>
            <div className={s.modalField}>
              <label>New Time</label>
              <input
                type='time'
                className={s.modalInput}
                value={reschedule.time}
                onChange={e => setReschedule(r => r ? { ...r, time: e.target.value } : r)}
              />
            </div>
            <div className={s.modalField}>
              <label>Reason <span className={s.modalHint}>(shown to patient)</span></label>
              <textarea
                className={`${s.modalInput} ${s.modalTextarea}`}
                rows={3}
                placeholder='e.g. Emergency surgery, prior patient overran…'
                value={reschedule.reason}
                onChange={e => setReschedule(r => r ? { ...r, reason: e.target.value } : r)}
              />
            </div>
            <div className={s.modalActions}>
              <button className={s.modalCancelBtn} disabled={rescheduling} onClick={() => setReschedule(null)}>
                Back
              </button>
              <button
                className={s.modalSubmitBtn}
                disabled={rescheduling || !reschedule.date || !reschedule.time}
                onClick={submitReschedule}
              >
                {rescheduling ? 'Rescheduling…' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function statusLabel (st: string) {
  return { confirmed: 'Live', pending: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' }[st] ?? st
}

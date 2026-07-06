'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'

interface Appointment {
  _id: string
  patient: { _id: string; name: string; avatar?: string }
  scheduledAt: string
  type: 'video' | 'audio' | 'chat'
  status: string
  consultationFee: number
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
  const [appts,   setAppts]   = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('today')
  const [acting,  setActing]  = useState<string | null>(null)
  const [now,     setNow]     = useState(Date.now())

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
    if (tab === 'today')    return a.scheduledAt.startsWith(todayStr)
    if (tab === 'upcoming') return a.scheduledAt > nowIso && !a.scheduledAt.startsWith(todayStr) && a.status !== 'cancelled'
    return a.status === 'completed' || a.status === 'cancelled' || a.status === 'no_show' || (a.scheduledAt < nowIso && a.status === 'pending')
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

  async function cancelAppt (id: string) {
    if (!window.confirm('Cancel this appointment?')) return
    setActing(id)
    try {
      await api.put(`/appointments/${id}/cancel`)
      setAppts(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a))
    } catch { }
    setActing(null)
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
        <div className={s.loading}>Loading appointments…</div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>No appointments in this category.</div>
      ) : (
        <div className={s.list}>
          {filtered.map(a => {
            const timing = getTimingInfo(a.scheduledAt, now)
            const isConfirmed = a.status === 'confirmed'
            const isPending   = a.status === 'pending'
            const diffMin = (new Date(a.scheduledAt).getTime() - now) / 60_000
            const canStart = isPending && diffMin < 30 // allow starting up to 30 min early

            return (
              <div key={a._id} className={`${s.card} ${timing.urgent && isPending ? s.urgent : ''}`}>
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
                    {/* Timing badge */}
                    {(isPending || isConfirmed) && timing.label && (
                      <span className={`${s.timingLabel} ${timing.urgent ? s.timingUrgent : s.timingMuted}`}>
                        {timing.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className={s.cardRight}>
                  <span className={`${s.typeBadge} ${s[a.type]}`}>{a.type}</span>
                  <span className={`${s.statusBadge} ${s[a.status]}`}>{statusLabel(a.status)}</span>

                  {isConfirmed && !isSessionExpired(a.scheduledAt) && (
                    <button
                      className={`${s.startBtn} ${s.live}`}
                      disabled={acting === a._id}
                      onClick={() => rejoinConsultation(a._id)}
                    >
                      {acting === a._id ? '…' : '↩ Rejoin'}
                    </button>
                  )}
                  {isPending && !isSessionExpired(a.scheduledAt) && (
                    <button
                      className={`${s.startBtn} ${canStart || timing.urgent ? s.startNow : ''}`}
                      disabled={acting === a._id}
                      onClick={() => startConsultation(a._id)}
                    >
                      {acting === a._id ? '…' : canStart ? '▶ Start Now' : 'Start'}
                    </button>
                  )}
                  {(isPending || isConfirmed) && (
                    <button
                      className={s.cancelBtn}
                      disabled={acting === a._id}
                      onClick={() => cancelAppt(a._id)}
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
    </>
  )
}

function statusLabel (st: string) {
  return { confirmed: 'Live', pending: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' }[st] ?? st
}

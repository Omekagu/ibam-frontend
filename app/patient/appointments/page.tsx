'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface Appointment {
  _id: string
  doctor: { _id: string; name: string; avatar?: string }
  scheduledAt: string
  type: 'video' | 'audio' | 'chat'
  status: string
  consultationFee: number
  isFollowUp: boolean
  isUrgent: boolean
  sessionDurationMinutes: number
}

type Tab = 'upcoming' | 'past' | 'all'

interface TimingInfo {
  label: string
  cls: string
}

function getTimingInfo (scheduledAt: string, now: number): TimingInfo {
  const diff = (new Date(scheduledAt).getTime() - now) / 60_000 // positive = future
  if (diff > 60)  return { label: new Date(scheduledAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }), cls: s.timingMuted }
  if (diff > 15)  return { label: `In ${Math.round(diff)} min`, cls: s.timingMuted }
  if (diff > 2)   return { label: `Starts in ${Math.round(diff)} min`, cls: s.timingSoon }
  if (diff > -1)  return { label: 'Just now', cls: s.timingNow }
  if (diff > -5)  return { label: `${Math.floor(-diff)} min late`, cls: s.timingLate }
  if (diff > -30) return { label: `${Math.floor(-diff)} min late`, cls: s.timingLate }
  return { label: '', cls: '' }
}

export default function PatientAppointments () {
  const router   = useRouter()
  const modal    = useStatusModal()
  const [appts,   setAppts]   = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('upcoming')
  const [acting,  setActing]  = useState<string | null>(null)
  const [now,     setNow]     = useState(Date.now())

  useEffect(() => {
    api.get('/appointments/mine?limit=100')
      .then(r => setAppts(r.data.data?.appointments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Refresh timing labels every 30 s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  const nowIso = new Date(now).toISOString()
  const filtered = appts.filter(a => {
    if (tab === 'upcoming') return a.status !== 'cancelled' && a.status !== 'completed' && a.scheduledAt >= nowIso
    if (tab === 'past')     return a.status === 'completed' || a.status === 'cancelled' || a.scheduledAt < nowIso
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

  async function cancelAppt (id: string) {
    if (!window.confirm('Cancel this appointment?')) return
    setActing(id)
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by patient' })
      setAppts(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a))
    } catch { }
    setActing(null)
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past',     label: 'Past' },
    { key: 'all',      label: 'All' },
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
        <div className={s.empty}><Loader label='Loading appointments…' /></div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>No appointments here.</div>
      ) : (
        <div className={s.list}>
          {filtered.map(a => {
            const d = new Date(a.scheduledAt)
            const timing = getTimingInfo(a.scheduledAt, now)

            // Determine join button label and availability
            const diffMin = (new Date(a.scheduledAt).getTime() - now) / 60_000
            const withinWindow = diffMin < 15 // allow joining up to 15 min before
            const isLive = a.status === 'confirmed'
            const sessionEndMs = new Date(a.scheduledAt).getTime() + (a.sessionDurationMinutes ?? 30) * 60_000
            const isElapsed = sessionEndMs < now

            return (
              <div key={a._id} className={s.card}>
                <div className={s.dateBox}>
                  <p>{d.toLocaleString('en-NG', { month: 'short' })}</p>
                  <strong>{d.getDate()}</strong>
                  <span>{d.getFullYear()}</span>
                </div>

                <div className={s.info}>
                  <p className={s.docName}>{a.doctor.name}</p>
                  <span className={s.meta}>
                    {d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })} · {a.type}
                  </span>
                  {a.isFollowUp && <span className={s.followUp}>Follow-up</span>}
                  {/* Timing label */}
                  {timing.label && (a.status === 'pending' || a.status === 'confirmed') && (
                    <span className={`${s.timingLabel} ${timing.cls}`}>{timing.label}</span>
                  )}
                </div>

                <div className={s.right}>
                  <span className={`${s.typeBadge} ${s[a.type]}`}>{a.type}</span>
                  <span className={`${s.statusBadge} ${s[a.status]}`}>{statusLabel(a.status)}</span>
                  <p className={s.fee}>₦{a.consultationFee.toLocaleString()}</p>

                  <div className={s.actions}>
                    {isLive && !isElapsed && (
                      <button
                        className={`${s.joinBtn} ${s.live}`}
                        disabled={acting === a._id}
                        onClick={() => joinConsultation(a._id)}
                      >
                        {acting === a._id ? '…' : '▶ Join Now'}
                      </button>
                    )}
                    {isLive && isElapsed && (
                      <span className={s.elapsedLabel}>Session ended</span>
                    )}
                    {!isLive && withinWindow && a.status === 'pending' && (
                      <span className={s.waitingLabel}>Waiting for doctor…</span>
                    )}
                    {(a.status === 'pending' || a.status === 'confirmed') && (
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
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function statusLabel (st: string) {
  return { confirmed: 'Live', pending: 'Pending', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' }[st] ?? st
}

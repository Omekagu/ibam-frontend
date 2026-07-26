'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'
import { XIcon } from '@/components/icons'

interface Participant { _id: string; name: string; email: string; phone?: string }
interface Consultation {
  _id: string
  consultationType: 'chat' | 'audio' | 'video'
  status: string
  startedAt: string
  appointment?: {
    patient?: Participant
    doctor?: Participant
  }
}
interface Msg { _id: string; sender: { name: string; role?: string }; content: string; createdAt: string; type: string }

export default function MonitoringPage () {
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [all,           setAll]           = useState<Consultation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState<'live' | 'all'>('live')
  const [viewing,       setViewing]       = useState<Consultation | null>(null)
  const [messages,      setMessages]      = useState<Msg[]>([])
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [suspending,    setSuspending]    = useState<string | null>(null)
  const [filterStatus,  setFilterStatus]  = useState('')

  const loadLive = useCallback(async () => {
    try {
      const r = await api.get('/admin/consultations/live')
      setConsultations(r.data.data?.consultations ?? [])
    } catch { }
    setLoading(false)
  }, [])

  const loadAll = useCallback(async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const r = await api.get(`/admin/consultations${params}`)
      setAll(r.data.data?.consultations ?? [])
    } catch { }
  }, [filterStatus])

  useEffect(() => { loadLive(); const t = setInterval(loadLive, 15000); return () => clearInterval(t) }, [loadLive])
  useEffect(() => { if (tab === 'all') loadAll() }, [tab, loadAll])

  async function openChat (c: Consultation) {
    setViewing(c)
    setMsgLoading(true)
    try {
      const r = await api.get(`/admin/consultations/${c._id}/messages`)
      setMessages(r.data.data?.messages ?? [])
    } catch { setMessages([]) }
    setMsgLoading(false)
  }

  async function suspendUser (userId: string, userName: string) {
    if (!confirm(`Suspend ${userName}? This immediately blocks their access.`)) return
    setSuspending(userId)
    try {
      await api.put(`/admin/users/${userId}/suspend`, { isActive: false })
      alert(`${userName} has been suspended.`)
      loadLive()
      if (viewing) setViewing(null)
    } catch { alert('Failed to suspend user.') }
    setSuspending(null)
  }

  function elapsed (startedAt: string) {
    const mins = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const list = tab === 'live' ? consultations : all

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === 'live' ? s.active : ''}`} onClick={() => setTab('live')}>
            <span className={s.liveDot} /> Live
            {consultations.length > 0 && <span className={s.count}>{consultations.length}</span>}
          </button>
          <button className={`${s.tab} ${tab === 'all' ? s.active : ''}`} onClick={() => setTab('all')}>
            All Sessions
          </button>
        </div>
        {tab === 'all' && (
          <select className={s.filter} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value=''>All statuses</option>
            <option value='active'>Active</option>
            <option value='ended'>Ended</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className={s.empty}>Loading…</div>
      ) : list.length === 0 ? (
        <div className={s.empty}>{tab === 'live' ? 'No active consultations right now.' : 'No sessions found.'}</div>
      ) : (
        <div className={s.grid}>
          {list.map(c => {
            const patient = c.appointment?.patient
            const doctor  = c.appointment?.doctor
            return (
              <div key={c._id} className={`${s.card} ${c.status === 'active' ? s.cardActive : ''}`}>
                <div className={s.cardTop}>
                  <span className={`${s.typeBadge} ${s[c.consultationType]}`}>{c.consultationType}</span>
                  <span className={`${s.statusBadge} ${c.status === 'active' ? s.statusActive : s.statusEnded}`}>
                    {c.status}
                  </span>
                </div>
                <div className={s.participants}>
                  <div className={s.person}>
                    <span className={s.role}>Doctor</span>
                    <span className={s.name}>{doctor?.name ?? '—'}</span>
                  </div>
                  <div className={s.vs}>↔</div>
                  <div className={s.person}>
                    <span className={s.role}>Patient</span>
                    <span className={s.name}>{patient?.name ?? '—'}</span>
                  </div>
                </div>
                <div className={s.meta}>
                  <span>{new Date(c.startedAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {c.status === 'active' && <span className={s.elapsed}>{elapsed(c.startedAt)} elapsed</span>}
                </div>
                <div className={s.actions}>
                  {c.consultationType !== 'video' && (
                    <button className={s.viewBtn} onClick={() => openChat(c)}>View Chat</button>
                  )}
                  {doctor && (
                    <button
                      className={s.suspendBtn}
                      disabled={suspending === doctor._id}
                      onClick={() => suspendUser(doctor._id, doctor.name)}
                    >
                      Suspend Dr.
                    </button>
                  )}
                  {patient && (
                    <button
                      className={s.suspendBtn}
                      disabled={suspending === patient._id}
                      onClick={() => suspendUser(patient._id, patient.name)}
                    >
                      Suspend Patient
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Chat viewer modal */}
      {viewing && (
        <div className={s.overlay} onClick={() => setViewing(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <div>
                <p className={s.modalTitle}>Chat — {viewing.appointment?.doctor?.name} &amp; {viewing.appointment?.patient?.name}</p>
                <p className={s.modalSub}>{new Date(viewing.startedAt).toLocaleString('en-NG')}</p>
              </div>
              <div className={s.modalActions}>
                {viewing.appointment?.doctor && (
                  <button
                    className={s.suspendBtn}
                    onClick={() => suspendUser(viewing.appointment!.doctor!._id, viewing.appointment!.doctor!.name)}
                  >
                    Suspend Doctor
                  </button>
                )}
                {viewing.appointment?.patient && (
                  <button
                    className={s.suspendBtn}
                    onClick={() => suspendUser(viewing.appointment!.patient!._id, viewing.appointment!.patient!.name)}
                  >
                    Suspend Patient
                  </button>
                )}
                <button className={s.closeBtn} onClick={() => setViewing(null)}><XIcon size={14} /></button>
              </div>
            </div>
            <div className={s.msgList}>
              {msgLoading ? (
                <p className={s.empty}>Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className={s.empty}>No messages in this session.</p>
              ) : (
                messages.map(m => (
                  <div key={m._id} className={s.msgRow}>
                    <span className={s.msgSender}>{m.sender.name}</span>
                    <p className={s.msgText}>{m.content}</p>
                    <span className={s.msgTime}>
                      {new Date(m.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

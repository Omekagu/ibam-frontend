'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Appt {
  _id: string
  patient: { name: string }
  doctor: { name: string }
  scheduledAt: string
  type: 'video' | 'audio' | 'chat'
  status: string
  consultationFee: number
}

const STATUS_OPTS = ['', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']

export default function AdminAppointments () {
  const [appts,   setAppts]   = useState<Appt[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const [page,    setPage]    = useState(1)
  const [acting,  setActing]  = useState<string | null>(null)

  function load (pg = page, st = status) {
    setLoading(true)
    const q = new URLSearchParams({ page: String(pg), limit: '20' })
    if (st) q.set('status', st)
    api.get(`/admin/appointments?${q}`)
      .then(r => { setAppts(r.data.data?.appointments ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function applyFilter (st: string) {
    setStatus(st); setPage(1); load(1, st)
  }

  async function cancel (id: string) {
    if (!window.confirm('Cancel this appointment?')) return
    setActing(id)
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Cancelled by admin' })
      setAppts(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a))
    } catch { }
    setActing(null)
  }

  const pages = Math.ceil(total / 20)

  return (
    <>
      <div className={s.toolbar}>
        <div className={s.filters}>
          {STATUS_OPTS.map(st => (
            <button
              key={st || 'all'}
              className={`${s.chip} ${status === st ? s.active : ''}`}
              onClick={() => applyFilter(st)}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
        <p className={s.total}>{total.toLocaleString()} total</p>
      </div>

      <div className={s.panel}>
        {loading ? (
          <p className={s.empty}>Loading…</p>
        ) : appts.length === 0 ? (
          <p className={s.empty}>No appointments found.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Fee</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appts.map(a => (
                <tr key={a._id}>
                  <td>{a.patient?.name ?? '—'}</td>
                  <td>{a.doctor?.name ?? '—'}</td>
                  <td>{new Date(a.scheduledAt).toLocaleString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td><span className={`${s.typeBadge} ${s[a.type]}`}>{a.type}</span></td>
                  <td>₦{a.consultationFee.toLocaleString()}</td>
                  <td><span className={`${s.badge} ${s[a.status]}`}>{a.status}</span></td>
                  <td>
                    {!['completed', 'cancelled'].includes(a.status) && (
                      <button
                        className={s.cancelBtn}
                        disabled={acting === a._id}
                        onClick={() => cancel(a._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className={s.pagination}>
          <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => { setPage(p => p + 1); load(page + 1) }}>Next →</button>
        </div>
      )}
    </>
  )
}

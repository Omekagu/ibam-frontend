'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Patient { name: string; email: string; phone?: string }
interface Lab     { name: string; address: string; phone: string }
interface Request {
  _id: string
  tests: string[]
  collectionType: 'home_visit' | 'walk_in'
  status: string
  totalAmount: number
  notes?: string
  createdAt: string
  patient?: Patient
  lab?: Lab
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', sample_collected: 'Collected',
  processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled',
}

export default function AdminDiagnosticsPage () {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter) params.set('status', filter)
      const r = await api.get(`/admin/diagnostics?${params}`)
      setRequests(r.data.data?.requests ?? [])
      setTotal(r.data.data?.total ?? 0)
    } catch { }
    setLoading(false)
  }, [filter, page])

  useEffect(() => { load() }, [load])

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Diagnostics Requests</h2>
          <span className={s.countBadge}>{total}</span>
        </div>
        <select className={s.filter} value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}>
          <option value=''>All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={s.empty}>Loading…</div>
      ) : requests.length === 0 ? (
        <div className={s.empty}>No diagnostic requests found.</div>
      ) : (
        <>
          <div className={s.table}>
            <div className={s.thead}>
              <span>Patient</span>
              <span>Tests</span>
              <span>Collection</span>
              <span>Lab</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Date</span>
            </div>
            {requests.map(r => (
              <div key={r._id} className={s.trow}>
                <div>
                  <p className={s.main}>{r.patient?.name ?? '—'}</p>
                  <p className={s.sub}>{r.patient?.phone ?? r.patient?.email ?? ''}</p>
                </div>
                <div>
                  <p className={s.main}>{r.tests.slice(0, 2).join(', ')}{r.tests.length > 2 ? ` +${r.tests.length - 2}` : ''}</p>
                </div>
                <div>
                  <p className={s.main}>{r.collectionType === 'home_visit' ? 'Home Visit' : 'Walk-in'}</p>
                </div>
                <div>
                  <p className={s.main}>{r.lab?.name ?? '—'}</p>
                  <p className={s.sub}>{r.lab?.address ?? ''}</p>
                </div>
                <div>
                  {r.totalAmount > 0 ? <p className={s.amount}>₦{r.totalAmount.toLocaleString()}</p> : <p className={s.sub}>—</p>}
                </div>
                <div>
                  <span className={`${s.statusBadge} ${s[r.status]}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                </div>
                <div>
                  <p className={s.sub}>{new Date(r.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={s.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={s.pgBtn}>Prev</button>
            <span>Page {page}</span>
            <button disabled={requests.length < 20} onClick={() => setPage(p => p + 1)} className={s.pgBtn}>Next</button>
          </div>
        </>
      )}
    </div>
  )
}

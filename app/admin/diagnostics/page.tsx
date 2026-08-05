'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface Patient { name: string; email: string; phone?: string }
interface Lab     { _id: string; name: string; address: string; phone: string }
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
  adminApprovalStatus?: 'na' | 'pending' | 'approved' | 'rejected'
  requiresApproval?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', sample_collected: 'Collected',
  processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled',
}

export default function AdminDiagnosticsPage () {
  const [requests,    setRequests]    = useState<Request[]>([])
  const [labs,        setLabs]        = useState<Lab[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('')
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)

  // Per-row action state
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [labSelects,  setLabSelects]  = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter) params.set('status', filter)
      const [reqRes, labRes] = await Promise.all([
        api.get(`/admin/diagnostics?${params}`),
        api.get('/diagnostics/labs'),
      ])
      setRequests(reqRes.data.data?.requests ?? [])
      setTotal(reqRes.data.data?.total ?? 0)
      setLabs(labRes.data.data?.labs ?? [])
    } catch { }
    setLoading(false)
  }, [filter, page])

  useEffect(() => { load() }, [load])

  async function assignLab (reqId: string) {
    const labId = labSelects[reqId]
    if (!labId) return
    setActionLoading(reqId)
    try {
      const r = await api.put(`/diagnostics/${reqId}/assign-lab`, { labId })
      const updated = r.data.data?.request
      setRequests(prev => prev.map(req => req._id === reqId ? { ...req, ...updated } : req))
      setAssigningId(null)
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to assign lab.')
    }
    setActionLoading(null)
  }

  async function handleApproval (reqId: string, approved: boolean) {
    setActionLoading(reqId)
    try {
      const r = await api.put(`/admin/approvals/test/${reqId}`, { approved })
      const updated = r.data.data?.request ?? r.data.data
      setRequests(prev => prev.map(req => req._id === reqId ? { ...req, ...(updated ?? { adminApprovalStatus: approved ? 'approved' : 'rejected', status: approved ? req.status : 'cancelled' }) } : req))
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to update approval.')
    }
    setActionLoading(null)
  }

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
        <div className={s.empty}><Loader label='Loading…' /></div>
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
              <span>Actions</span>
            </div>
            {requests.map(r => {
              const needsApproval = r.adminApprovalStatus === 'pending'
              const canAssign = !r.lab && r.status !== 'cancelled' && r.adminApprovalStatus !== 'pending'
              const isAssigning = assigningId === r._id
              const busy = actionLoading === r._id
              return (
                <div key={r._id} className={s.trow}>
                  <div>
                    <p className={s.main}>{r.patient?.name ?? '—'}</p>
                    <p className={s.sub}>{r.patient?.phone ?? r.patient?.email ?? ''}</p>
                  </div>
                  <div>
                    <p className={s.main}>{r.tests.slice(0, 2).join(', ')}{r.tests.length > 2 ? ` +${r.tests.length - 2}` : ''}</p>
                    {r.notes && <p className={s.sub} title={r.notes}>{r.notes.slice(0, 40)}{r.notes.length > 40 ? '…' : ''}</p>}
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
                    {needsApproval && <span className={s.approvalPending}>Needs approval</span>}
                  </div>
                  <div>
                    <p className={s.sub}>{new Date(r.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>

                  {/* Actions column */}
                  <div className={s.actions}>
                    {needsApproval && (
                      <div className={s.approvalBtns}>
                        <button className={s.approveBtn} disabled={busy} onClick={() => handleApproval(r._id, true)}>
                          {busy ? '…' : 'Approve'}
                        </button>
                        <button className={s.rejectBtn} disabled={busy} onClick={() => handleApproval(r._id, false)}>
                          {busy ? '…' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {canAssign && !isAssigning && (
                      <button className={s.assignBtn} onClick={() => setAssigningId(r._id)}>
                        Assign Lab
                      </button>
                    )}

                    {canAssign && isAssigning && (
                      <div className={s.assignRow}>
                        <select
                          className={s.labSelect}
                          value={labSelects[r._id] ?? ''}
                          onChange={e => setLabSelects(prev => ({ ...prev, [r._id]: e.target.value }))}
                        >
                          <option value=''>Select lab…</option>
                          {labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                        </select>
                        <button className={s.confirmBtn} disabled={!labSelects[r._id] || busy} onClick={() => assignLab(r._id)}>
                          {busy ? '…' : 'Confirm'}
                        </button>
                        <button className={s.cancelBtn} onClick={() => setAssigningId(null)}>✕</button>
                      </div>
                    )}

                    {r.lab && r.status !== 'cancelled' && (
                      <span className={s.assignedLabel}>✓ Assigned</span>
                    )}
                  </div>
                </div>
              )
            })}
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

'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Payment {
  _id: string
  user: { name: string; email: string }
  amount: number
  type: string
  method?: string
  status: string
  reference?: string
  transferReference?: string
  adminNotes?: string
  createdAt: string
}

const STATUS_OPTS = ['', 'success', 'pending', 'failed']

export default function AdminPayments () {
  const [payments,    setPayments]    = useState<Payment[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [status,      setStatus]      = useState('')
  const [method,      setMethod]      = useState('')
  const [page,        setPage]        = useState(1)
  const [confirming,  setConfirming]  = useState<string | null>(null)
  const [noteFor,     setNoteFor]     = useState<string | null>(null)
  const [note,        setNote]        = useState('')

  function load (pg = page, st = status, mt = method) {
    setLoading(true)
    const q = new URLSearchParams({ page: String(pg), limit: '20' })
    if (st) q.set('status', st)
    if (mt) q.set('method', mt)
    api.get(`/admin/payments?${q}`)
      .then(r => { setPayments(r.data.data?.payments ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function applyStatus (st: string) {
    setStatus(st); setPage(1); load(1, st, method)
  }

  function toggleTransferFilter () {
    const mt = method === 'direct_transfer' ? '' : 'direct_transfer'
    setMethod(mt); setPage(1); load(1, status, mt)
  }

  async function confirmPayment (id: string, adminNotes?: string) {
    setConfirming(id)
    try {
      await api.put(`/admin/payments/${id}/confirm`, { adminNotes })
      setPayments(prev => prev.map(p => p._id === id ? { ...p, status: 'success', adminNotes } : p))
      setNoteFor(null)
      setNote('')
    } catch { }
    setConfirming(null)
  }

  const pages = Math.ceil(total / 20)
  const pendingTransferCount = payments.filter(p => p.status === 'pending' && p.method === 'direct_transfer').length

  return (
    <>
      <div className={s.toolbar}>
        <div className={s.filters}>
          {STATUS_OPTS.map(st => (
            <button
              key={st || 'all'}
              className={`${s.chip} ${status === st && !method ? s.active : ''}`}
              onClick={() => { setMethod(''); applyStatus(st) }}
            >
              {st || 'All'}
            </button>
          ))}
          <button
            className={`${s.chip} ${method === 'direct_transfer' ? s.active : ''}`}
            onClick={toggleTransferFilter}
          >
            Pending Transfers
            {pendingTransferCount > 0 && (
              <span className={s.badge}>{pendingTransferCount}</span>
            )}
          </button>
        </div>
        <p className={s.total}>{total.toLocaleString()} transactions</p>
      </div>

      <div className={s.panel}>
        {loading ? (
          <p className={s.empty}>Loading…</p>
        ) : payments.length === 0 ? (
          <p className={s.empty}>No payments found.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Method</th>
                <th>Transfer Ref</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className={s.userCell}>
                      <p>{p.user?.name ?? '—'}</p>
                      <span>{p.user?.email ?? ''}</span>
                    </div>
                  </td>
                  <td className={s.amount}>₦{(p.amount / 100).toLocaleString()}</td>
                  <td><span className={s.typeBadge}>{p.type ?? '—'}</span></td>
                  <td>
                    <span className={`${s.methodBadge} ${p.method === 'direct_transfer' ? s.transfer : s.paystack}`}>
                      {p.method === 'direct_transfer' ? 'Bank Transfer' : p.method === 'walk_in_cash' ? 'Walk-in Cash' : 'Paystack'}
                    </span>
                  </td>
                  <td className={s.ref}>
                    {p.transferReference
                      ? <span className={s.transferRef}>{p.transferReference}</span>
                      : <span className={s.dim}>—</span>}
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><span className={`${s.badge} ${s[p.status]}`}>{p.status}</span></td>
                  <td>
                    {p.status === 'pending' && p.method === 'direct_transfer' ? (
                      noteFor === p._id ? (
                        <div className={s.confirmForm}>
                          <input
                            className={s.noteInput}
                            placeholder="Admin note (optional)"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                          />
                          <button
                            className={s.confirmBtn}
                            disabled={confirming === p._id}
                            onClick={() => confirmPayment(p._id, note || undefined)}
                          >
                            {confirming === p._id ? '…' : 'Confirm'}
                          </button>
                          <button className={s.cancelBtn} onClick={() => setNoteFor(null)}>✕</button>
                        </div>
                      ) : (
                        <button className={s.confirmBtn} onClick={() => setNoteFor(p._id)}>
                          Confirm Transfer
                        </button>
                      )
                    ) : null}
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

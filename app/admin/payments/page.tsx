'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Payment {
  _id: string
  user: { name: string; email: string }
  amount: number
  type: string
  status: string
  reference?: string
  createdAt: string
}

const STATUS_OPTS = ['', 'success', 'pending', 'failed']

export default function AdminPayments () {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState('')
  const [page,     setPage]     = useState(1)

  function load (pg = page, st = status) {
    setLoading(true)
    const q = new URLSearchParams({ page: String(pg), limit: '20' })
    if (st) q.set('status', st)
    api.get(`/admin/payments?${q}`)
      .then(r => { setPayments(r.data.data?.payments ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function applyFilter (st: string) {
    setStatus(st); setPage(1); load(1, st)
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
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
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
                  <td className={s.ref}>{p.reference ?? '—'}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><span className={`${s.badge} ${s[p.status]}`}>{p.status}</span></td>
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

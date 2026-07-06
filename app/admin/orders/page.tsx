'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Patient  { name: string; email: string; phone?: string }
interface Pharmacy { name: string; address: string; phone?: string }

interface Order {
  _id: string
  orderType: 'direct' | 'prescription'
  patient: Patient
  pharmacy: Pharmacy
  items: { name: string; price: number; qty: number }[]
  fulfillmentType: string
  totalAmount: number
  status: string
  adminApprovalStatus: string
  requiresApproval: boolean
  externalPrescriptionUrl?: string
  notes?: string
  createdAt: string
}

const STATUS_OPTS   = ['', 'pending', 'processing', 'ready', 'dispatched', 'delivered', 'cancelled']
const TYPE_OPTS     = ['', 'direct', 'prescription']

export default function AdminOrdersPage () {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('')
  const [type,    setType]    = useState('')
  const [page,    setPage]    = useState(1)
  const [exp,     setExp]     = useState<string | null>(null)

  function load (pg = page, st = status, tp = type) {
    setLoading(true)
    const q = new URLSearchParams({ page: String(pg), limit: '25' })
    if (st) q.set('status', st)
    if (tp) q.set('orderType', tp)
    api.get(`/admin/orders?${q}`)
      .then(r => { setOrders(r.data.data?.orders ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyStatus (st: string) { setStatus(st); setPage(1); load(1, st, type) }
  function applyType   (tp: string) { setType(tp);   setPage(1); load(1, status, tp) }

  const pages = Math.ceil(total / 25)

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>All Orders</h1>
          <p className={s.subtitle}>Every pharmacy order across all partners — {total.toLocaleString()} total</p>
        </div>
        <button className={s.refreshBtn} onClick={() => load()}>Refresh</button>
      </div>

      <div className={s.toolbar}>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Status</span>
          {STATUS_OPTS.map(st => (
            <button key={st || 'all'} className={`${s.chip} ${status === st ? s.active : ''}`}
              onClick={() => applyStatus(st)}>
              {st || 'All'}
            </button>
          ))}
        </div>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Type</span>
          {TYPE_OPTS.map(tp => (
            <button key={tp || 'all'} className={`${s.chip} ${type === tp ? s.active : ''}`}
              onClick={() => applyType(tp)}>
              {tp || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className={s.panel}>
        {loading ? <p className={s.empty}>Loading…</p> : orders.length === 0 ? (
          <p className={s.empty}>No orders found.</p>
        ) : (
          <div className={s.list}>
            {orders.map(o => (
              <div key={o._id} className={s.card}>
                <div className={s.cardHead} onClick={() => setExp(exp === o._id ? null : o._id)}>
                  <div className={s.cardLeft}>
                    <span className={`${s.typeBadge} ${o.orderType === 'direct' ? s.typeDirect : s.typeRx}`}>
                      {o.orderType === 'direct' ? 'Direct' : 'Rx'}
                    </span>
                    <div>
                      <p className={s.cardName}>{o.patient?.name ?? '—'}</p>
                      <p className={s.cardSub}>
                        {o.items?.length > 0
                          ? o.items.map(i => `${i.name} ×${i.qty}`).join(', ')
                          : 'Prescription order'}
                      </p>
                    </div>
                  </div>
                  <div className={s.cardRight}>
                    {o.totalAmount > 0 && <span className={s.amount}>₦{o.totalAmount.toLocaleString()}</span>}
                    <span className={`${s.statusBadge} ${s['s_' + o.status.replace('-','_')]}`}>{o.status}</span>
                    {o.requiresApproval && (
                      <span className={`${s.approvalBadge} ${o.adminApprovalStatus === 'approved' ? s.aApproved : o.adminApprovalStatus === 'rejected' ? s.aRejected : s.aPending}`}>
                        {o.adminApprovalStatus}
                      </span>
                    )}
                    <span className={s.date}>
                      {new Date(o.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={s.chevron}>{exp === o._id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {exp === o._id && (
                  <div className={s.cardBody}>
                    <div className={s.grid}>
                      <div className={s.infoBlock}>
                        <p className={s.infoLabel}>Patient</p>
                        <p className={s.infoVal}>{o.patient?.name}</p>
                        <p className={s.infoMuted}>{o.patient?.email}{o.patient?.phone ? ` · ${o.patient.phone}` : ''}</p>
                      </div>
                      <div className={s.infoBlock}>
                        <p className={s.infoLabel}>Pharmacy</p>
                        <p className={s.infoVal}>{o.pharmacy?.name ?? '—'}</p>
                        <p className={s.infoMuted}>{o.pharmacy?.address ?? ''}</p>
                      </div>
                      <div className={s.infoBlock}>
                        <p className={s.infoLabel}>Fulfillment</p>
                        <p className={s.infoVal}>{o.fulfillmentType}</p>
                      </div>
                      <div className={s.infoBlock}>
                        <p className={s.infoLabel}>Admin Approval</p>
                        <p className={s.infoVal}>{o.adminApprovalStatus}</p>
                      </div>
                    </div>
                    {o.items?.length > 0 && (
                      <table className={s.itemTable}>
                        <thead><tr><th>Drug</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
                        <tbody>
                          {o.items.map((it, i) => (
                            <tr key={i}>
                              <td>{it.name}</td>
                              <td>₦{it.price.toLocaleString()}</td>
                              <td>{it.qty}</td>
                              <td>₦{(it.price * it.qty).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {o.externalPrescriptionUrl && (
                      <a href={o.externalPrescriptionUrl} target='_blank' rel='noreferrer' className={s.docLink}>
                        View Uploaded Prescription ↗
                      </a>
                    )}
                    {o.notes && <p className={s.notes}><strong>Notes:</strong> {o.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className={s.pagination}>
          <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => { setPage(p => p + 1); load(page + 1) }}>Next →</button>
        </div>
      )}
    </div>
  )
}

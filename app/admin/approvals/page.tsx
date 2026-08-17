'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { ChevronUpIcon, ChevronDownIcon } from '@/components/icons'
import s from './page.module.scss'

interface Patient { name: string; email: string; phone?: string }
interface Pharmacy { name: string; address: string }
interface Lab     { name: string; address: string }

interface PendingOrder {
  _id: string
  items: { name: string; price: number; qty: number }[]
  patient: Patient
  pharmacy: Pharmacy
  fulfillmentType: string
  totalAmount: number
  externalPrescriptionUrl?: string
  createdAt: string
}

interface PendingTest {
  _id: string
  tests: string[]
  patient: Patient
  lab?: Lab
  collectionType: string
  totalAmount: number
  externalReferralUrl?: string
  createdAt: string
}

export default function ApprovalsPage () {
  const [orders,      setOrders]      = useState<PendingOrder[]>([])
  const [tests,       setTests]       = useState<PendingTest[]>([])
  const [loading,     setLoading]     = useState(true)
  const [acting,      setActing]      = useState<string | null>(null)
  const [note,        setNote]        = useState<Record<string, string>>({})
  const [expanded,    setExpanded]    = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/admin/approvals')
      setOrders(r.data.data?.orders ?? [])
      setTests(r.data.data?.testRequests ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function decideOrder (id: string, approved: boolean) {
    setActing(id)
    try {
      await api.put(`/admin/approvals/order/${id}`, { approved, note: note[id] })
      setOrders(prev => prev.filter(o => o._id !== id))
    } catch { alert('Action failed.') }
    setActing(null)
  }

  async function decideTest (id: string, approved: boolean) {
    setActing(id)
    try {
      await api.put(`/admin/approvals/test/${id}`, { approved, note: note[id] })
      setTests(prev => prev.filter(t => t._id !== id))
    } catch { alert('Action failed.') }
    setActing(null)
  }

  const total = orders.length + tests.length

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Pending Approvals</h1>
          <p className={s.subtitle}>Review direct orders and lab requests that don't have an iBam doctor referral.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>Refresh</button>
      </div>

      <div className={s.stats}>
        <div className={s.stat}><span className={s.statNum}>{total}</span><span>Total Pending</span></div>
        <div className={s.stat}><span className={s.statNum}>{orders.length}</span><span>Pharmacy Orders</span></div>
        <div className={s.stat}><span className={s.statNum}>{tests.length}</span><span>Lab Requests</span></div>
      </div>

      {loading ? <p className={s.empty}>Loading…</p> : total === 0 ? (
        <p className={s.empty}>All clear — no pending approvals.</p>
      ) : (
        <>
          {orders.length > 0 && (
            <section>
              <h2 className={s.sectionTitle}>Pharmacy Orders</h2>
              <div className={s.list}>
                {orders.map(o => (
                  <div key={o._id} className={s.card}>
                    <div className={s.cardHead} onClick={() => setExpanded(expanded === o._id ? null : o._id)}>
                      <div className={s.cardLeft}>
                        <span className={s.typeBadge}>Drugs</span>
                        <div>
                          <p className={s.name}>{o.patient.name}</p>
                          <p className={s.sub}>{o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</p>
                        </div>
                      </div>
                      <div className={s.cardRight}>
                        <span className={s.amount}>₦{o.totalAmount.toLocaleString()}</span>
                        <span className={s.date}>{new Date(o.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                        <span className={s.chevron}>{expanded === o._id ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}</span>
                      </div>
                    </div>
                    {expanded === o._id && (
                      <div className={s.cardBody}>
                        <p className={s.info}>Patient: {o.patient.name} · {o.patient.email}{o.patient.phone ? ` · ${o.patient.phone}` : ''}</p>
                        <p className={s.info}>Pharmacy: {o.pharmacy.name} — {o.pharmacy.address}</p>
                        <p className={s.info}>Fulfillment: {o.fulfillmentType}</p>
                        {o.externalPrescriptionUrl && (
                          <a href={o.externalPrescriptionUrl} target='_blank' rel='noreferrer' className={s.docLink}>
                            View Uploaded Prescription
                          </a>
                        )}
                        <textarea className={s.noteInput} placeholder='Add rejection note (optional)…' rows={2}
                          value={note[o._id] ?? ''} onChange={e => setNote(prev => ({ ...prev, [o._id]: e.target.value }))} />
                        <div className={s.actions}>
                          <button className={s.approveBtn} disabled={acting === o._id} onClick={() => decideOrder(o._id, true)}>
                            {acting === o._id ? '…' : 'Approve'}
                          </button>
                          <button className={s.rejectBtn} disabled={acting === o._id} onClick={() => decideOrder(o._id, false)}>
                            {acting === o._id ? '…' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {tests.length > 0 && (
            <section>
              <h2 className={s.sectionTitle}>Lab Test Requests</h2>
              <div className={s.list}>
                {tests.map(t => (
                  <div key={t._id} className={s.card}>
                    <div className={s.cardHead} onClick={() => setExpanded(expanded === t._id ? null : t._id)}>
                      <div className={s.cardLeft}>
                        <span className={`${s.typeBadge} ${s.typeLab}`}>Tests</span>
                        <div>
                          <p className={s.name}>{t.patient.name}</p>
                          <p className={s.sub}>{t.tests.join(', ')}</p>
                        </div>
                      </div>
                      <div className={s.cardRight}>
                        {t.totalAmount > 0 && <span className={s.amount}>₦{t.totalAmount.toLocaleString()}</span>}
                        <span className={s.date}>{new Date(t.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                        <span className={s.chevron}>{expanded === t._id ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}</span>
                      </div>
                    </div>
                    {expanded === t._id && (
                      <div className={s.cardBody}>
                        <p className={s.info}>Patient: {t.patient.name} · {t.patient.email}</p>
                        <p className={s.info}>Lab: {t.lab?.name ?? 'Not yet assigned'}</p>
                        <p className={s.info}>Collection: {t.collectionType.replace('_', ' ')}</p>
                        {t.externalReferralUrl && (
                          <a href={t.externalReferralUrl} target='_blank' rel='noreferrer' className={s.docLink}>
                            View External Referral
                          </a>
                        )}
                        <textarea className={s.noteInput} placeholder='Add rejection note (optional)…' rows={2}
                          value={note[t._id] ?? ''} onChange={e => setNote(prev => ({ ...prev, [t._id]: e.target.value }))} />
                        <div className={s.actions}>
                          <button className={s.approveBtn} disabled={acting === t._id} onClick={() => decideTest(t._id, true)}>
                            {acting === t._id ? '…' : 'Approve'}
                          </button>
                          <button className={s.rejectBtn} disabled={acting === t._id} onClick={() => decideTest(t._id, false)}>
                            {acting === t._id ? '…' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

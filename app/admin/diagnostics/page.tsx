'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface Patient { name: string; email: string; phone?: string }
interface Lab     { _id: string; name: string }
interface PaymentRef { status: string; amount: number; reference?: string }
interface Request {
  _id: string
  tests: string[]
  collectionType: 'home_visit' | 'walk_in'
  status: string
  totalAmount: number
  notes?: string
  createdAt: string
  preferredDate?: string
  preferredTime?: string
  pickupLocation?: { address?: string }
  patient?: Patient
  lab?: Lab
  paymentRef?: PaymentRef
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', sample_collected: 'Collected',
  processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled',
}

export default function AdminDiagnosticsPage () {
  const [requests,  setRequests]  = useState<Request[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('')
  const [search,    setSearch]    = useState('')
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (searchQ = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (filter) params.set('status', filter)
      if (searchQ.trim()) params.set('search', searchQ.trim())
      const r = await api.get(`/admin/diagnostics?${params}`)
      setRequests(r.data.data?.requests ?? [])
      setTotal(r.data.data?.total ?? 0)
    } catch { }
    setLoading(false)
  }, [filter, page, search])

  useEffect(() => { load() }, [load])

  function handleSearch (val: string) {
    setSearch(val)
    setPage(1)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(val), 420)
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Diagnostics Requests</h2>
          <span className={s.countBadge}>{total}</span>
        </div>
        <div className={s.controls}>
          <div className={s.searchWrap}>
            <span className={s.searchIcon}>🔍</span>
            <input
              className={s.searchInput}
              placeholder='Patient ID, transaction ref, or name…'
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            {search && (
              <button className={s.searchClear} onClick={() => handleSearch('')}>✕</button>
            )}
          </div>
          <select className={s.filter} value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}>
            <option value=''>All statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {search.trim() && (
        <p className={s.searchHint}>
          Tip: paste the patient&apos;s <strong>User ID</strong> or <strong>Transaction Ref</strong> from their receipt for an exact match.
        </p>
      )}

      {loading ? (
        <div className={s.empty}><Loader label='Loading…' /></div>
      ) : requests.length === 0 ? (
        <div className={s.empty}>{search ? 'No requests match your search.' : 'No diagnostic requests found.'}</div>
      ) : (
        <>
          <div className={s.list}>
            {requests.map(r => {
              const open = expanded === r._id
              const preferred = r.preferredDate
                ? new Date(r.preferredDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })
                    + (r.preferredTime ? ` at ${r.preferredTime}` : '')
                : null
              return (
                <div key={r._id} className={s.card}>
                  <div className={s.cardTop} onClick={() => setExpanded(open ? null : r._id)} role='button'>
                    <div className={s.cardInfo}>
                      <p className={s.main}>
                        {r.tests.slice(0, 2).join(', ')}
                        {r.tests.length > 2 && <span className={s.moreTag}> +{r.tests.length - 2}</span>}
                      </p>
                      <p className={s.sub}>
                        {r.patient?.name ?? '—'} · {r.collectionType === 'home_visit' ? '🏠 Home Visit' : '🚶 Walk-in'} · {new Date(r.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className={s.cardRight}>
                      <span className={`${s.statusBadge} ${s[r.status]}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                      {r.lab && <span className={s.labTag}>{r.lab.name}</span>}
                      <span className={s.chevron}>{open ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {open && (
                    <div className={s.cardBody}>
                      <div className={s.detailGrid}>
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Patient</span>
                          <span className={s.dVal}>{r.patient?.name ?? '—'}</span>
                          <span className={s.dSub}>{r.patient?.phone ?? r.patient?.email ?? ''}</span>
                        </div>
                        {r.totalAmount > 0 && (
                          <div className={s.detailItem}>
                            <span className={s.dLabel}>Amount</span>
                            <span className={`${s.dVal} ${s.dGreen}`}>₦{r.totalAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {r.paymentRef && (
                          <div className={s.detailItem}>
                            <span className={s.dLabel}>Payment</span>
                            <span className={`${s.dVal} ${r.paymentRef.status === 'success' ? s.dGreen : ''}`}>
                              {r.paymentRef.status === 'success' ? '✓ Confirmed' : '⏳ ' + r.paymentRef.status}
                            </span>
                            {r.paymentRef.reference && <span className={s.dSub}>{r.paymentRef.reference}</span>}
                          </div>
                        )}
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Processed by</span>
                          <span className={s.dVal}>{r.lab?.name ?? <em style={{ opacity: 0.5 }}>Unclaimed</em>}</span>
                        </div>
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Booking Ref</span>
                          <span className={`${s.dVal} ${s.dMono}`}>#{r._id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className={s.testTags}>
                        {r.tests.map((t, i) => <span key={i} className={s.testTag}>{t}</span>)}
                      </div>

                      {r.collectionType === 'home_visit' && (preferred || r.pickupLocation?.address) && (
                        <div className={s.visitBox}>
                          {r.pickupLocation?.address && <p>📍 {r.pickupLocation.address}</p>}
                          {preferred && <p>🗓 Preferred: <strong>{preferred}</strong></p>}
                        </div>
                      )}

                      {r.notes && <p className={s.notes}>{r.notes}</p>}
                    </div>
                  )}
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

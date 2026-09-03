'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import { XIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon, CheckIcon, ClockIcon, HomeIcon, WalkingIcon, MapPinIcon, DownloadIcon } from '@/components/icons'
import s from './page.module.scss'

interface Patient { name: string; email: string; phone?: string }
interface Lab     { _id: string; name: string }
interface PaymentRef { status: string; amount: number; reference?: string; method?: string }
interface LabResult { fileUrl: string; notes?: string; createdAt: string }
interface Actor { name: string; email: string; role?: string; adminRole?: string }
interface WellnessPkg { name: string }

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
  result?: LabResult
  registeredBy?: Actor
  wellnessPackage?: WellnessPkg
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', sample_collected: 'Collected',
  processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled',
}

const METHOD_LABELS: Record<string, string> = {
  pos: 'POS / Card',
  direct_transfer: 'Bank Transfer',
  walk_in_cash: 'Cash',
  paystack: 'Paystack',
}

function actorLabel (actor?: Actor) {
  if (!actor) return '—'
  const role = actor.adminRole ?? actor.role ?? ''
  const roleTag = role === 'lab_partner' ? 'Lab Staff'
    : role === 'super_admin' ? 'Super Admin'
    : role === 'lab_admin' ? 'Lab Admin'
    : role === 'admin' ? 'Admin'
    : role
  return `${actor.name}${roleTag ? ` (${roleTag})` : ''}`
}

// ─── All Requests tab ────────────────────────────────────────────────────────
function AllRequestsTab () {
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
    <>
      <div className={s.controls}>
        <div className={s.searchWrap}>
          <span className={s.searchIcon}><SearchIcon size={14} /></span>
          <input
            className={s.searchInput}
            placeholder='Patient ID, transaction ref, or name…'
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className={s.searchClear} onClick={() => handleSearch('')}><XIcon size={14} /></button>
          )}
        </div>
        <select className={s.filter} value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}>
          <option value=''>All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
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
                        {r.patient?.name ?? '—'} · {r.collectionType === 'home_visit' ? <><HomeIcon size={14} /> Home Visit</> : <><WalkingIcon size={14} /> Walk-in</>} · {new Date(r.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className={s.cardRight}>
                      <span className={`${s.statusBadge} ${s[r.status]}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                      {r.lab && <span className={s.labTag}>{r.lab.name}</span>}
                      <span className={s.chevron}>{open ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}</span>
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
                              {r.paymentRef.status === 'success' ? <><CheckIcon size={14} /> Confirmed</> : <><ClockIcon size={14} /> {r.paymentRef.status}</>}
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
                          {r.pickupLocation?.address && <p><MapPinIcon size={14} /> {r.pickupLocation.address}</p>}
                          {preferred && <p>Preferred: <strong>{preferred}</strong></p>}
                        </div>
                      )}

                      {r.notes && <p className={s.notes}>{r.notes}</p>}

                      {r.result ? (
                        <div className={s.resultBox}>
                          <p className={s.resultReady}><CheckIcon size={14} /> Lab result uploaded</p>
                          {r.result.notes && <p className={s.resultNotes}>{r.result.notes}</p>}
                          <a href={r.result.fileUrl} target='_blank' rel='noreferrer' className={s.downloadBtn}>
                            <DownloadIcon size={14} /> Download Report
                          </a>
                        </div>
                      ) : r.status === 'completed' ? (
                        <p className={s.resultMissing}>Result file not yet uploaded.</p>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className={s.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={s.pgBtn}>Prev</button>
            <span>Page {page} · {total} total</span>
            <button disabled={requests.length < 20} onClick={() => setPage(p => p + 1)} className={s.pgBtn}>Next</button>
          </div>
        </>
      )}
    </>
  )
}

// ─── Walk-in History tab ─────────────────────────────────────────────────────
function WalkInHistoryTab () {
  const [rows,     setRows]     = useState<Request[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalRevenue = rows.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0)

  const load = useCallback(async (pg = page, q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: '30' })
      if (q.trim()) params.set('search', q.trim())
      const r = await api.get(`/admin/labs/walk-in-history?${params}`)
      setRows(r.data.data?.rows ?? [])
      setTotal(r.data.data?.total ?? 0)
    } catch {}
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  function handleSearch (val: string) {
    setSearch(val)
    setPage(1)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(1, val), 420)
  }

  const pages = Math.ceil(total / 30)

  return (
    <>
      {/* Summary strip */}
      <div className={s.wiSummaryStrip}>
        <div className={s.wiStat}>
          <span className={s.wiStatLabel}>Total Walk-ins</span>
          <span className={s.wiStatVal}>{total.toLocaleString()}</span>
        </div>
        <div className={s.wiStatDivider} />
        <div className={s.wiStat}>
          <span className={s.wiStatLabel}>Revenue (this page)</span>
          <span className={`${s.wiStatVal} ${s.wiStatGreen}`}>₦{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      <div className={s.controls}>
        <div className={s.searchWrap}>
          <span className={s.searchIcon}><SearchIcon size={14} /></span>
          <input
            className={s.searchInput}
            placeholder='Patient name…'
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className={s.searchClear} onClick={() => handleSearch('')}><XIcon size={14} /></button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={s.empty}><Loader label='Loading walk-in history…' /></div>
      ) : rows.length === 0 ? (
        <div className={s.empty}>No walk-in registrations found.</div>
      ) : (
        <>
          <div className={s.wiTable}>
            {/* Table header */}
            <div className={s.wiTHead}>
              <span>Patient</span>
              <span>Tests / Package</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Registered By</span>
              <span>Lab</span>
              <span>Date</span>
              <span />
            </div>

            {rows.map(r => {
              const open = expanded === r._id
              const amount = r.totalAmount ?? 0
              const method = r.paymentRef?.method
                ? (METHOD_LABELS[r.paymentRef.method] ?? r.paymentRef.method)
                : '—'
              const testSummary = r.wellnessPackage
                ? r.wellnessPackage.name
                : r.tests.slice(0, 2).join(', ') + (r.tests.length > 2 ? ` +${r.tests.length - 2}` : '')

              return (
                <div key={r._id} className={s.wiRow}>
                  <div
                    className={s.wiRowMain}
                    onClick={() => setExpanded(open ? null : r._id)}
                    role='button'
                  >
                    <div className={s.wiCell}>
                      <span className={s.wiPatientName}>{r.patient?.name ?? '—'}</span>
                      <span className={s.wiPatientSub}>{r.patient?.phone ?? ''}</span>
                    </div>
                    <div className={s.wiCell}>
                      <span className={s.wiTestSummary}>{testSummary}</span>
                      {r.wellnessPackage && <span className={s.wiPkgBadge}>Package</span>}
                    </div>
                    <div className={s.wiCell}>
                      <span className={amount > 0 ? s.wiAmount : s.wiAmountFree}>
                        {amount > 0 ? `₦${amount.toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                    <div className={s.wiCell}>
                      <span className={s.wiMethod}>{method}</span>
                    </div>
                    <div className={s.wiCell}>
                      <span className={s.wiActor}>{actorLabel(r.registeredBy)}</span>
                    </div>
                    <div className={s.wiCell}>
                      <span className={s.wiLabName}>{r.lab?.name ?? <em style={{ opacity: 0.45 }}>—</em>}</span>
                    </div>
                    <div className={s.wiCell}>
                      <span className={s.wiDate}>
                        {new Date(r.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={s.wiTime}>
                        {new Date(r.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={s.wiCell}>
                      <span className={s.chevron}>{open ? <ChevronUpIcon size={13} /> : <ChevronDownIcon size={13} />}</span>
                    </div>
                  </div>

                  {open && (
                    <div className={s.wiRowBody}>
                      <div className={s.detailGrid} style={{ gap: '1.5rem' }}>
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Booking Ref</span>
                          <span className={`${s.dVal} ${s.dMono}`}>#{r._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Patient Email</span>
                          <span className={s.dVal}>{r.patient?.email ?? '—'}</span>
                        </div>
                        {r.paymentRef?.reference && (
                          <div className={s.detailItem}>
                            <span className={s.dLabel}>Payment Ref</span>
                            <span className={`${s.dVal} ${s.dMono}`}>{r.paymentRef.reference}</span>
                          </div>
                        )}
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Payment Status</span>
                          <span className={`${s.dVal} ${r.paymentRef?.status === 'success' ? s.dGreen : ''}`}>
                            {r.paymentRef?.status === 'success' ? 'Confirmed' : (r.paymentRef?.status ?? 'Not recorded')}
                          </span>
                        </div>
                        <div className={s.detailItem}>
                          <span className={s.dLabel}>Status</span>
                          <span className={s.dVal}>{STATUS_LABELS[r.status] ?? r.status}</span>
                        </div>
                      </div>
                      <div className={s.testTags} style={{ marginTop: 10 }}>
                        {r.tests.map((t, i) => <span key={i} className={s.testTag}>{t}</span>)}
                      </div>
                      {r.notes && <p className={s.notes}>{r.notes}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div className={s.pagination}>
              <button
                disabled={page <= 1}
                onClick={() => { setPage(p => p - 1); load(page - 1) }}
                className={s.pgBtn}
              >Prev</button>
              <span>Page {page} of {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => { setPage(p => p + 1); load(page + 1) }}
                className={s.pgBtn}
              >Next</button>
            </div>
          )}
        </>
      )}
    </>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
type DiagTab = 'all' | 'walkins'

export default function AdminDiagnosticsPage () {
  const [tab, setTab] = useState<DiagTab>('all')

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Diagnostics</h2>
        </div>
        <div className={s.tabBar}>
          <button
            className={`${s.tabBtn} ${tab === 'all' ? s.tabBtnActive : ''}`}
            onClick={() => setTab('all')}
          >
            All Requests
          </button>
          <button
            className={`${s.tabBtn} ${tab === 'walkins' ? s.tabBtnActive : ''}`}
            onClick={() => setTab('walkins')}
          >
            Walk-in History
          </button>
        </div>
      </div>

      {tab === 'all' ? <AllRequestsTab /> : <WalkInHistoryTab />}
    </div>
  )
}

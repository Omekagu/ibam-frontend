'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

// ── Types ──────────────────────────────────────────────────────────────────
interface BankAccount {
  bankName?: string
  accountNumber?: string
  accountName?: string
  bankCode?: string
}

interface PayoutRow {
  _id: string
  partnerType: 'doctor' | 'pharmacy' | 'lab'
  partnerName: string
  partnerEmail: string
  totalGross: number
  platformCut: number
  totalNet: number
  bankAccount?: BankAccount | null
  payoutStatus: string
  requestedAt?: string
  paidAt?: string
  createdAt: string
  earningCount?: number
  isDoctor?: boolean
}

interface EarningRow {
  _id: string
  serviceType: 'consultation' | 'pharmacy_order' | 'lab_test'
  partnerType: 'doctor' | 'pharmacy' | 'lab'
  partnerName: string
  partnerEmail: string
  grossAmount: number
  platformCut: number
  platformPct: number
  netAmount: number
  payoutStatus: string
  createdAt: string
  requestedAt?: string
  paidAt?: string
}

interface Summary {
  platformRevenue: number
  pendingNet: number
  requestedNet: number
  paidNet: number
  totalTransactions: number
}

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_OPTS   = ['', 'pending', 'requested', 'paid']
const TYPE_OPTS = [
  { value: '',         label: 'All'        },
  { value: 'doctor',   label: 'Doctors'    },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'lab',      label: 'Labs'       },
]
const SERVICE_LABEL: Record<string, string> = {
  consultation:   'Consultation',
  pharmacy_order: 'Pharmacy Order',
  lab_test:       'Lab Test',
}
const TYPE_BADGE: Record<string, string> = {
  doctor:   s.typeDoctor,
  pharmacy: s.typePharmacy,
  lab:      s.typeLab,
}

function fmt (n: number) { return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}` }
function fmtDate (d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminPayouts () {
  const modal = useStatusModal()
  const [tab,      setTab]      = useState<'requests' | 'history'>('requests')

  // Payout requests state
  const [rows,     setRows]     = useState<PayoutRow[]>([])
  const [loadingR, setLoadingR] = useState(true)
  const [statusR,  setStatusR]  = useState('requested')
  const [typeR,    setTypeR]    = useState('')
  const [acting,   setActing]   = useState<string | null>(null)

  // Earning history state
  const [history,  setHistory]  = useState<EarningRow[]>([])
  const [summary,  setSummary]  = useState<Summary | null>(null)
  const [loadingH, setLoadingH] = useState(false)
  const [statusH,  setStatusH]  = useState('')
  const [typeH,    setTypeH]    = useState('')
  const [pageH,    setPageH]    = useState(1)
  const [totalH,   setTotalH]   = useState(0)
  const [pagesH,   setPagesH]   = useState(1)

  // ── Load payout requests ────────────────────────────────────────────────
  const loadRequests = useCallback((st = statusR, ty = typeR) => {
    setLoadingR(true)
    const q = new URLSearchParams()
    if (st) q.set('status', st)
    if (ty) q.set('type', ty)
    api.get(`/admin/payouts?${q}`)
      .then(r => setRows(r.data.data?.earnings ?? []))
      .catch(() => {})
      .finally(() => setLoadingR(false))
  }, [statusR, typeR])

  // ── Load earning history ────────────────────────────────────────────────
  const loadHistory = useCallback((st = statusH, ty = typeH, pg = pageH) => {
    setLoadingH(true)
    const q = new URLSearchParams({ page: String(pg), limit: '50' })
    if (st) q.set('status', st)
    if (ty) q.set('type', ty)
    api.get(`/admin/earnings?${q}`)
      .then(r => {
        const d = r.data.data
        setHistory(d?.earnings ?? [])
        setTotalH(d?.total ?? 0)
        setPagesH(d?.pages ?? 1)
        if (d?.summary) setSummary(d.summary)
      })
      .catch(() => {})
      .finally(() => setLoadingH(false))
  }, [statusH, typeH, pageH])

  useEffect(() => { loadRequests() }, [])
  useEffect(() => { if (tab === 'history') loadHistory() }, [tab])

  // ── Payout request actions ──────────────────────────────────────────────
  function approvePayout (row: PayoutRow) {
    const bank = row.bankAccount
    const bankLine = bank?.accountNumber
      ? `${bank.accountName ?? ''} · ${bank.accountNumber} (${bank.bankName ?? ''})`
      : 'No bank account on file'
    modal.show({
      variant: 'pending',
      title: 'Approve Payout?',
      message: `Pay ${fmt(row.totalNet)} to ${row.partnerName}.\n${bankLine}`,
      actionLabel: 'Yes, Approve',
      dismissLabel: 'Cancel',
      onAction: async () => {
        setActing(row._id)
        try {
          await api.put(`/admin/payouts/${row._id}/approve`)
          setRows(prev => prev.map(r => r._id === row._id
            ? { ...r, payoutStatus: 'paid', paidAt: new Date().toISOString() } : r))
          modal.show({ variant: 'success', title: 'Payout Approved', message: `Payout approved for ${row.partnerName}.` })
        } catch (err: any) {
          modal.show({ variant: 'declined', title: 'Approval Failed', message: err?.response?.data?.message ?? 'Approval failed.' })
        }
        setActing(null)
      }
    })
  }

  // ── Request tab summary ─────────────────────────────────────────────────
  const requestedTotal = rows.filter(r => r.payoutStatus === 'requested').reduce((s, r) => s + r.totalNet, 0)
  const requestedByType = (['doctor', 'pharmacy', 'lab'] as const).reduce<Record<string, number>>((acc, t) => {
    acc[t] = rows.filter(r => r.payoutStatus === 'requested' && r.partnerType === t).reduce((s, r) => s + r.totalNet, 0)
    return acc
  }, {})

  return (
    <>
      {/* ── Tab bar ── */}
      <div className={s.tabBar}>
        <button className={`${s.tab} ${tab === 'requests' ? s.tabActive : ''}`} onClick={() => setTab('requests')}>
          Payout Requests
        </button>
        <button className={`${s.tab} ${tab === 'history' ? s.tabActive : ''}`} onClick={() => setTab('history')}>
          Earning History
        </button>
      </div>

      {/* ════════════════ PAYOUT REQUESTS TAB ════════════════ */}
      {tab === 'requests' && (
        <>
          <div className={s.summaryBar}>
            <div className={s.summaryCard}>
              <p className={s.summaryLabel}>Requested Payouts</p>
              <p className={s.summaryValue}>{fmt(requestedTotal)}</p>
            </div>
            {(['doctor', 'pharmacy', 'lab'] as const).map(t => requestedByType[t] > 0 && (
              <div key={t} className={`${s.summaryCard} ${s.summaryCardSm}`}>
                <p className={s.summaryLabel} style={{ textTransform: 'capitalize' }}>{t}s</p>
                <p className={s.summaryValue}>{fmt(requestedByType[t])}</p>
              </div>
            ))}
          </div>

          <div className={s.toolbar}>
            <div className={s.filters}>
              {TYPE_OPTS.map(opt => (
                <button key={opt.value || 'all'}
                  className={`${s.chip} ${typeR === opt.value ? s.active : ''}`}
                  onClick={() => { setTypeR(opt.value); loadRequests(statusR, opt.value) }}>
                  {opt.label}
                </button>
              ))}
              <span className={s.filterDivider}>|</span>
              {STATUS_OPTS.map(st => (
                <button key={st || 'all-s'}
                  className={`${s.chip} ${statusR === st ? s.active : ''}`}
                  onClick={() => { setStatusR(st); loadRequests(st, typeR) }}>
                  {st || 'All Status'}
                </button>
              ))}
            </div>
            <p className={s.count}>{rows.length} records</p>
          </div>

          <div className={s.panel}>
            {loadingR ? <div className={s.empty}><Loader label='Loading…' /></div>
              : rows.length === 0 ? <p className={s.empty}>No payout records.</p>
              : (
                <table className={s.table}>
                  <thead><tr>
                    <th>Partner</th><th>Type</th><th>Gross</th>
                    <th>Platform Cut</th><th>Net Payout</th>
                    <th>Bank Account</th><th>Requested</th>
                    <th>Status</th><th>Action</th>
                  </tr></thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r._id}>
                        <td>
                          <div className={s.docCell}>
                            <p>{r.partnerName ?? '—'}</p>
                            <span>{r.partnerEmail ?? ''}</span>
                          </div>
                        </td>
                        <td><span className={`${s.typeBadge} ${TYPE_BADGE[r.partnerType] ?? ''}`}>{r.partnerType}</span></td>
                        <td>{fmt(r.totalGross)}</td>
                        <td className={s.cut}>{fmt(r.platformCut)}</td>
                        <td className={s.net}>{fmt(r.totalNet)}</td>
                        <td>
                          {r.bankAccount?.accountNumber ? (
                            <div className={s.bankCell}>
                              <span className={s.bankAcct}>{r.bankAccount.accountNumber}</span>
                              <span className={s.bankName}>{r.bankAccount.bankName ?? ''}</span>
                              {r.bankAccount.accountName && <span className={s.bankName}>{r.bankAccount.accountName}</span>}
                            </div>
                          ) : <span className={s.noBank}>No account</span>}
                        </td>
                        <td>{fmtDate(r.requestedAt)}</td>
                        <td><span className={`${s.badge} ${s[r.payoutStatus]}`}>{r.payoutStatus}</span></td>
                        <td>
                          {r.payoutStatus === 'requested' && (
                            <button className={s.approveBtn} disabled={acting === r._id} onClick={() => approvePayout(r)}>
                              {acting === r._id ? '…' : 'Approve'}
                            </button>
                          )}
                          {r.payoutStatus === 'paid' && (
                            <span className={s.paidLabel}>Paid {fmtDate(r.paidAt)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </>
      )}

      {/* ════════════════ EARNING HISTORY TAB ════════════════ */}
      {tab === 'history' && (
        <>
          {/* Summary cards */}
          {summary && (
            <div className={s.summaryBar}>
              <div className={`${s.summaryCard} ${s.revenueCard}`}>
                <p className={s.summaryLabel}>Platform Revenue</p>
                <p className={s.summaryValue}>{fmt(summary.platformRevenue)}</p>
                <p className={s.summaryMeta}>{summary.totalTransactions} transactions</p>
              </div>
              <div className={s.summaryCard}>
                <p className={s.summaryLabel}>Pending</p>
                <p className={`${s.summaryValue} ${s.pendingVal}`}>{fmt(summary.pendingNet)}</p>
                <p className={s.summaryMeta}>net payable</p>
              </div>
              <div className={s.summaryCard}>
                <p className={s.summaryLabel}>Requested</p>
                <p className={`${s.summaryValue} ${s.requestedVal}`}>{fmt(summary.requestedNet)}</p>
                <p className={s.summaryMeta}>awaiting approval</p>
              </div>
              <div className={s.summaryCard}>
                <p className={s.summaryLabel}>Paid Out</p>
                <p className={`${s.summaryValue} ${s.paidVal}`}>{fmt(summary.paidNet)}</p>
                <p className={s.summaryMeta}>settled</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className={s.toolbar}>
            <div className={s.filters}>
              {TYPE_OPTS.map(opt => (
                <button key={opt.value || 'all'}
                  className={`${s.chip} ${typeH === opt.value ? s.active : ''}`}
                  onClick={() => { setTypeH(opt.value); setPageH(1); loadHistory(statusH, opt.value, 1) }}>
                  {opt.label}
                </button>
              ))}
              <span className={s.filterDivider}>|</span>
              {STATUS_OPTS.map(st => (
                <button key={st || 'all-s'}
                  className={`${s.chip} ${statusH === st ? s.active : ''}`}
                  onClick={() => { setStatusH(st); setPageH(1); loadHistory(st, typeH, 1) }}>
                  {st || 'All Status'}
                </button>
              ))}
            </div>
            <p className={s.count}>{totalH} records</p>
          </div>

          <div className={s.panel}>
            {loadingH ? <div className={s.empty}><Loader label='Loading history…' /></div>
              : history.length === 0 ? <p className={s.empty}>No earning records.</p>
              : (
                <table className={s.table}>
                  <thead><tr>
                    <th>Date</th>
                    <th>Partner</th>
                    <th>Type</th>
                    <th>Service</th>
                    <th>Gross</th>
                    <th>Commission</th>
                    <th>Net Paid Out</th>
                    <th>Requested</th>
                    <th>Paid</th>
                    <th>Status</th>
                  </tr></thead>
                  <tbody>
                    {history.map(e => (
                      <tr key={e._id}>
                        <td className={s.dateCell}>{fmtDate(e.createdAt)}</td>
                        <td>
                          <div className={s.docCell}>
                            <p>{e.partnerName}</p>
                            <span>{e.partnerEmail}</span>
                          </div>
                        </td>
                        <td><span className={`${s.typeBadge} ${TYPE_BADGE[e.partnerType] ?? ''}`}>{e.partnerType}</span></td>
                        <td><span className={s.serviceTag}>{SERVICE_LABEL[e.serviceType] ?? e.serviceType}</span></td>
                        <td>{fmt(e.grossAmount)}</td>
                        <td>
                          <div className={s.commCell}>
                            <span className={s.cut}>{fmt(e.platformCut)}</span>
                            <span className={s.commPct}>{e.platformPct}%</span>
                          </div>
                        </td>
                        <td className={s.net}>{fmt(e.netAmount)}</td>
                        <td className={s.dateCell}>{fmtDate(e.requestedAt)}</td>
                        <td className={s.dateCell}>{fmtDate(e.paidAt)}</td>
                        <td><span className={`${s.badge} ${s[e.payoutStatus]}`}>{e.payoutStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>

          {/* Pagination */}
          {pagesH > 1 && (
            <div className={s.pagination}>
              <button className={s.pageBtn} disabled={pageH <= 1}
                onClick={() => { setPageH(p => p - 1); loadHistory(statusH, typeH, pageH - 1) }}>
                ← Prev
              </button>
              <span className={s.pageInfo}>Page {pageH} of {pagesH}</span>
              <button className={s.pageBtn} disabled={pageH >= pagesH}
                onClick={() => { setPageH(p => p + 1); loadHistory(statusH, typeH, pageH + 1) }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

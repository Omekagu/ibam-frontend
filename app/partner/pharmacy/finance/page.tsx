'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { ArrowUpIcon, ArrowDownIcon, ClockIcon } from '@/components/icons'
import s from './page.module.scss'

interface Earning {
  _id: string
  grossAmount: number
  platformCut: number
  netAmount: number
  payoutStatus: 'pending' | 'requested' | 'paid'
  createdAt: string
  serviceRef?: string
}

interface MonthBucket {
  label: string
  net: number
  gross: number
  count: number
}

interface PayoutHistoryItem {
  _id: string
  totalNet: number
  totalGross: number
  status: 'requested' | 'paid' | 'failed'
  requestedAt: string
  processedAt?: string
  bankAccount?: { bankName?: string; accountNumber?: string; accountName?: string }
}

interface Totals {
  gross: number
  net: number
  pending: number
  requested: number
  paid: number
}

interface EarningsData {
  earnings: Earning[]
  totals: Totals
  monthly: MonthBucket[]
  thisMonth: number
  lastMonth: number
  payoutHistory: PayoutHistoryItem[]
}

type TabFilter = 'all' | 'pending' | 'requested' | 'paid'

const TAB_LABELS: Record<TabFilter, string> = {
  all: 'All', pending: 'Available', requested: 'Requested', paid: 'Paid Out',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', requested: '#60A5FA', paid: '#10B981', failed: '#EF4444',
}

function fmt (n: number) {
  return '₦' + Math.round(n).toLocaleString('en-NG')
}

function MiniChart ({ months }: { months: MonthBucket[] }) {
  const max = Math.max(...months.map(m => m.net), 1)
  return (
    <div className={s.chartWrap}>
      {months.map((m, i) => {
        const pct = (m.net / max) * 100
        return (
          <div key={i} className={s.barCol}>
            <span className={s.barVal}>{m.net > 0 ? fmt(m.net) : ''}</span>
            <div className={s.barTrack}>
              <div className={s.barFill} style={{ height: `${Math.max(pct, m.net > 0 ? 4 : 0)}%` }} />
            </div>
            <span className={s.barLabel}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PharmacyFinancePage () {
  const modal = useStatusModal()
  const [data,       setData]       = useState<EarningsData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<TabFilter>('all')
  const [payoutBusy, setPayoutBusy] = useState(false)
  const [hasBankSet, setHasBankSet] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [earnRes, profRes] = await Promise.allSettled([
        api.get('/pharmacy/earnings'),
        api.get('/pharmacy/profile'),
      ])
      if (earnRes.status === 'fulfilled') setData(earnRes.value.data.data)
      if (profRes.status === 'fulfilled') {
        const bank = profRes.value.data.data?.partner?.bankAccount
        setHasBankSet(!!(bank?.accountNumber))
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function requestPayout () {
    setPayoutBusy(true)
    try {
      const r = await api.post('/pharmacy/earnings/request-payout')
      const { totalRequested, count } = r.data.data ?? {}
      modal.show({
        variant: 'success',
        title: 'Payout Requested',
        message: `${fmt(totalRequested ?? 0)} across ${count ?? 0} record(s) submitted to admin for review.`,
      })
      load()
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Payout Failed',
        message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Request failed. Please try again.',
      })
    }
    setPayoutBusy(false)
  }

  const earnings = data?.earnings ?? []
  const filtered = earnings.filter(e => tab === 'all' || e.payoutStatus === tab)
  const totals   = data?.totals ?? { gross: 0, net: 0, pending: 0, requested: 0, paid: 0 }
  const monthly  = data?.monthly ?? []
  const history  = data?.payoutHistory ?? []

  const changeVsLastMonth = (data?.thisMonth ?? 0) - (data?.lastMonth ?? 0)
  const changePositive    = changeVsLastMonth >= 0

  return (
    <div className={s.wrap}>
      {/* ── Header ── */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Finance & Revenue</h1>
          <p className={s.subtitle}>Track your earnings, request payouts, and view payment history.</p>
        </div>
        <button className={s.refreshBtn} onClick={load} disabled={loading}>Refresh</button>
      </div>

      {loading ? (
        <div className={s.loaderWrap}><Loader label='Loading finance data…' /></div>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div className={s.statsGrid}>
            <div className={s.statCard}>
              <span className={s.statLabel}>Total Net Revenue</span>
              <span className={s.statValue}>{fmt(totals.net)}</span>
              <span className={s.statSub}>{fmt(totals.gross)} gross · {earnings.length} orders</span>
            </div>
            <div className={s.statCard}>
              <span className={s.statLabel}>This Month</span>
              <span className={s.statValue}>{fmt(data?.thisMonth ?? 0)}</span>
              <span className={s.statSub} style={{ color: changePositive ? '#10B981' : '#EF4444' }}>
                {changePositive ? <ArrowUpIcon size={12} /> : <ArrowDownIcon size={12} />} {fmt(Math.abs(changeVsLastMonth))} vs last month
              </span>
            </div>
            <div className={`${s.statCard} ${s.highlightCard}`}>
              <span className={s.statLabel}>Available to Pay Out</span>
              <span className={s.statValue} style={{ color: '#10B981' }}>{fmt(totals.pending)}</span>
              <span className={s.statSub}>
                {totals.requested > 0 ? `+ ${fmt(totals.requested)} awaiting approval` : 'Request below when ready'}
              </span>
            </div>
            <div className={s.statCard}>
              <span className={s.statLabel}>Total Paid Out</span>
              <span className={s.statValue} style={{ color: '#60A5FA' }}>{fmt(totals.paid)}</span>
              <span className={s.statSub}>{history.filter(h => h.status === 'paid').length} completed payout(s)</span>
            </div>
          </div>

          {/* ── Monthly chart ── */}
          {monthly.length > 0 && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Revenue — Last 6 Months</h2>
              <MiniChart months={monthly} />
            </div>
          )}

          {/* ── Payout request panel ── */}
          <div className={s.section}>
            <h2 className={s.sectionTitle}>Request Payout</h2>
            {totals.pending > 0 ? (
              <div className={s.payoutPanel}>
                <div className={s.payoutInfo}>
                  <span className={s.payoutAmount}>{fmt(totals.pending)}</span>
                  <span className={s.payoutDesc}>available from {earnings.filter(e => e.payoutStatus === 'pending').length} completed order(s)</span>
                </div>
                {hasBankSet ? (
                  <button className={s.payoutBtn} onClick={requestPayout} disabled={payoutBusy}>
                    {payoutBusy ? 'Submitting…' : 'Request Payout'}
                  </button>
                ) : (
                  <div className={s.noBankWarn}>
                    Set up your bank account in <a href='/partner/pharmacy/profile' className={s.profileLink}>Profile</a> before requesting.
                  </div>
                )}
              </div>
            ) : totals.requested > 0 ? (
              <div className={s.infoBox}>
                <span className={s.infoIcon}><ClockIcon size={14} /></span>
                <div>
                  <p className={s.infoTitle}>Payout Pending Admin Review</p>
                  <p className={s.infoDesc}>{fmt(totals.requested)} is queued for processing. You'll be notified when it's approved.</p>
                </div>
              </div>
            ) : (
              <p className={s.emptyText}>No pending balance to pay out right now.</p>
            )}
          </div>

          {/* ── Earnings table ── */}
          <div className={s.section}>
            <div className={s.tableHeader}>
              <h2 className={s.sectionTitle}>Earnings Ledger</h2>
              <div className={s.tabs}>
                {(Object.keys(TAB_LABELS) as TabFilter[]).map(t => (
                  <button
                    key={t}
                    className={`${s.tab} ${tab === t ? s.activeTab : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {TAB_LABELS[t]}
                    {t !== 'all' && (
                      <span className={s.tabCount}>
                        {earnings.filter(e => e.payoutStatus === t).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className={s.emptyText}>No {tab === 'all' ? '' : TAB_LABELS[tab] + ' '}earnings yet.</p>
            ) : (
              <div className={s.table}>
                <div className={s.tableRow + ' ' + s.tableHeadRow}>
                  <span>Date</span>
                  <span>Gross</span>
                  <span>Platform Cut</span>
                  <span>Net</span>
                  <span>Status</span>
                </div>
                {filtered.map(e => (
                  <div key={e._id} className={s.tableRow}>
                    <span className={s.dateCell}>
                      {new Date(e.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={s.numCell}>{fmt(e.grossAmount)}</span>
                    <span className={s.numCell + ' ' + s.cutCell}>{fmt(e.platformCut)}</span>
                    <span className={s.numCell + ' ' + s.netCell}>{fmt(e.netAmount)}</span>
                    <span>
                      <span className={s.statusPill} style={{ color: STATUS_COLOR[e.payoutStatus], background: STATUS_COLOR[e.payoutStatus] + '18' }}>
                        {e.payoutStatus === 'pending' ? 'Available' : e.payoutStatus === 'requested' ? 'Requested' : 'Paid Out'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Payout history ── */}
          {history.length > 0 && (
            <div className={s.section}>
              <h2 className={s.sectionTitle}>Payout History</h2>
              <div className={s.historyList}>
                {history.map(h => (
                  <div key={h._id} className={s.historyCard}>
                    <div className={s.historyLeft}>
                      <span className={s.historyAmount}>{fmt(h.totalNet)}</span>
                      {h.bankAccount?.bankName && (
                        <span className={s.historyBank}>{h.bankAccount.bankName} · {h.bankAccount.accountNumber}</span>
                      )}
                      <span className={s.historyDate}>
                        Requested {new Date(h.requestedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {h.processedAt && ` · Processed ${new Date(h.processedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </span>
                    </div>
                    <span className={s.historyStatus} style={{ color: STATUS_COLOR[h.status], background: STATUS_COLOR[h.status] + '18' }}>
                      {h.status === 'requested' ? 'Pending' : h.status === 'paid' ? 'Paid' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

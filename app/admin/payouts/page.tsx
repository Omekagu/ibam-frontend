'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

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

const STATUS_OPTS = ['', 'requested', 'paid']
const TYPE_OPTS   = [
  { value: '',         label: 'All Types'  },
  { value: 'doctor',   label: 'Doctors'    },
  { value: 'pharmacy', label: 'Pharmacies' },
  { value: 'lab',      label: 'Labs'       },
]

const TYPE_BADGE: Record<string, string> = { doctor: s.typeDoctor, pharmacy: s.typePharmacy, lab: s.typeLab }

export default function AdminPayouts () {
  const modal = useStatusModal()
  const [rows,    setRows]    = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status,  setStatus]  = useState('requested')
  const [type,    setType]    = useState('')
  const [acting,  setActing]  = useState<string | null>(null)

  function load (st = status, ty = type) {
    setLoading(true)
    const q = new URLSearchParams()
    if (st) q.set('status', st)
    if (ty) q.set('type', ty)
    api.get(`/admin/payouts?${q}`)
      .then(r => setRows(r.data.data?.earnings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function applyFilter (st: string, ty: string) {
    setStatus(st); setType(ty); load(st, ty)
  }

  async function approvePayout (row: PayoutRow) {
    const bank = row.bankAccount
    const bankLine = bank?.accountNumber
      ? `\nAccount: ${bank.accountNumber} (${bank.bankName ?? ''})`
      : '\n⚠ No bank account on file'
    if (!window.confirm(`Approve ₦${row.totalNet.toLocaleString()} payout to ${row.partnerName}?${bankLine}`)) return
    setActing(row._id)
    try {
      await api.put(`/admin/payouts/${row._id}/approve`)
      setRows(prev => prev.map(r => r._id === row._id ? { ...r, payoutStatus: 'paid', paidAt: new Date().toISOString() } : r))
      modal.show({ variant: 'success', title: 'Payout Approved', message: `Payout approved for ${row.partnerName}.` })
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Approval Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Approval failed.' })
    }
    setActing(null)
  }

  const requestedTotal = rows.filter(r => r.payoutStatus === 'requested').reduce((s, r) => s + r.totalNet, 0)
  const requestedByType = ['doctor', 'pharmacy', 'lab'].reduce<Record<string, number>>((acc, t) => {
    acc[t] = rows.filter(r => r.payoutStatus === 'requested' && r.partnerType === t).reduce((s, r) => s + r.totalNet, 0)
    return acc
  }, {})

  return (
    <>
      <div className={s.summaryBar}>
        <div className={s.summaryCard}>
          <p className={s.summaryLabel}>Requested Payouts</p>
          <p className={s.summaryValue}>₦{requestedTotal.toLocaleString()}</p>
        </div>
        {(['doctor', 'pharmacy', 'lab'] as const).map(t => requestedByType[t] > 0 && (
          <div key={t} className={`${s.summaryCard} ${s.summaryCardSm}`}>
            <p className={s.summaryLabel} style={{ textTransform: 'capitalize' }}>{t}s</p>
            <p className={s.summaryValue}>₦{requestedByType[t].toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className={s.toolbar}>
        <div className={s.filters}>
          {TYPE_OPTS.map(opt => (
            <button
              key={opt.value || 'all-types'}
              className={`${s.chip} ${type === opt.value ? s.active : ''}`}
              onClick={() => applyFilter(status, opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <span className={s.filterDivider}>|</span>
          {STATUS_OPTS.map(st => (
            <button
              key={st || 'all-status'}
              className={`${s.chip} ${status === st ? s.active : ''}`}
              onClick={() => applyFilter(st, type)}
            >
              {st || 'All Status'}
            </button>
          ))}
        </div>
        <p className={s.count}>{rows.length} records</p>
      </div>

      <div className={s.panel}>
        {loading ? (
          <div className={s.empty}><Loader label='Loading…' /></div>
        ) : rows.length === 0 ? (
          <p className={s.empty}>No payout records.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Type</th>
                <th>Gross</th>
                <th>Cut</th>
                <th>Net Payout</th>
                <th>Bank Account</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id}>
                  <td>
                    <div className={s.docCell}>
                      <p>{r.partnerName ?? '—'}</p>
                      <span>{r.partnerEmail ?? ''}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${s.typeBadge} ${TYPE_BADGE[r.partnerType] ?? ''}`}>
                      {r.partnerType}
                    </span>
                  </td>
                  <td>₦{r.totalGross.toLocaleString()}</td>
                  <td className={s.cut}>₦{r.platformCut.toLocaleString()}</td>
                  <td className={s.net}>₦{r.totalNet.toLocaleString()}</td>
                  <td>
                    {r.bankAccount?.accountNumber ? (
                      <div className={s.bankCell}>
                        <span className={s.bankAcct}>{r.bankAccount.accountNumber}</span>
                        <span className={s.bankName}>{r.bankAccount.bankName ?? ''}</span>
                        {r.bankAccount.accountName && <span className={s.bankName}>{r.bankAccount.accountName}</span>}
                      </div>
                    ) : (
                      <span className={s.noBank}>No account</span>
                    )}
                  </td>
                  <td>{r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-NG') : '—'}</td>
                  <td><span className={`${s.badge} ${s[r.payoutStatus]}`}>{r.payoutStatus}</span></td>
                  <td>
                    {r.payoutStatus === 'requested' && (
                      <button
                        className={s.approveBtn}
                        disabled={acting === r._id}
                        onClick={() => approvePayout(r)}
                      >
                        {acting === r._id ? '…' : 'Approve'}
                      </button>
                    )}
                    {r.payoutStatus === 'paid' && (
                      <span className={s.paidLabel}>Paid {r.paidAt ? new Date(r.paidAt).toLocaleDateString('en-NG') : ''}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

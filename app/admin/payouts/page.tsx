'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface Earning {
  _id: string
  doctor: { name: string; email: string }
  grossAmount: number
  platformCut: number
  netAmount: number
  payoutStatus: string
  payoutRequestedAt?: string
  paidAt?: string
  createdAt: string
}

const STATUS_OPTS = ['', 'pending', 'requested', 'paid']

export default function AdminPayouts () {
  const modal = useStatusModal()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState('requested')
  const [acting,   setActing]   = useState<string | null>(null)

  function load (st = status) {
    setLoading(true)
    const q = new URLSearchParams({ limit: '50' })
    if (st) q.set('status', st)
    api.get(`/admin/payouts?${q}`)
      .then(r => setEarnings(r.data.data?.earnings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function applyFilter (st: string) {
    setStatus(st); load(st)
  }

  async function approvePayout (id: string, doctorName: string, amount: number) {
    if (!window.confirm(`Approve ₦${amount.toLocaleString()} payout to ${doctorName}?`)) return
    setActing(id)
    try {
      await api.put(`/admin/payouts/${id}/approve`)
      setEarnings(prev => prev.map(e => e._id === id ? { ...e, payoutStatus: 'paid', paidAt: new Date().toISOString() } : e))
      modal.show({ variant: 'success', title: 'Payout Approved', message: `Payout approved for ${doctorName}.` })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Approval failed.'
      modal.show({ variant: 'declined', title: 'Approval Failed', message: msg })
    }
    setActing(null)
  }

  const pendingTotal = earnings
    .filter(e => e.payoutStatus === 'requested')
    .reduce((sum, e) => sum + e.netAmount, 0)

  return (
    <>
      <div className={s.summaryBar}>
        <div className={s.summaryCard}>
          <p className={s.summaryLabel}>Requested Payouts</p>
          <p className={s.summaryValue}>₦{pendingTotal.toLocaleString()}</p>
        </div>
      </div>

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
        <p className={s.count}>{earnings.length} records</p>
      </div>

      <div className={s.panel}>
        {loading ? (
          <p className={s.empty}><Loader label='Loading…' /></p>
        ) : earnings.length === 0 ? (
          <p className={s.empty}>No payout records.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Gross</th>
                <th>Platform Cut</th>
                <th>Net Payout</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map(e => (
                <tr key={e._id}>
                  <td>
                    <div className={s.docCell}>
                      <p>{e.doctor?.name ?? '—'}</p>
                      <span>{e.doctor?.email ?? ''}</span>
                    </div>
                  </td>
                  <td>₦{e.grossAmount.toLocaleString()}</td>
                  <td className={s.cut}>₦{e.platformCut.toLocaleString()}</td>
                  <td className={s.net}>₦{e.netAmount.toLocaleString()}</td>
                  <td>{e.payoutRequestedAt ? new Date(e.payoutRequestedAt).toLocaleDateString("en-NG") : '—'}</td>
                  <td><span className={`${s.badge} ${s[e.payoutStatus]}`}>{e.payoutStatus}</span></td>
                  <td>
                    {e.payoutStatus === 'requested' && (
                      <button
                        className={s.approveBtn}
                        disabled={acting === e._id}
                        onClick={() => approvePayout(e._id, e.doctor?.name ?? 'Doctor', e.netAmount)}
                      >
                        {acting === e._id ? '…' : 'Approve'}
                      </button>
                    )}
                    {e.payoutStatus === 'paid' && (
                      <span className={s.paidLabel}>Paid {e.paidAt ? new Date(e.paidAt).toLocaleDateString("en-NG") : ''}</span>
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

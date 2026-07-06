'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Earning {
  _id: string
  grossAmount: number
  netAmount: number
  platformCut: number
  payoutStatus: string
  createdAt: string
  consultation?: { consultationType: string }
}

interface Totals { gross: number; net: number; pending: number }

export default function DoctorEarnings () {
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [totals, setTotals]     = useState<Totals>({ gross: 0, net: 0, pending: 0 })
  const [loading, setLoading]   = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    api.get('/doctors/my/earnings')
      .then(r => {
        setEarnings(r.data.data?.earnings ?? [])
        setTotals(r.data.data?.totals ?? { gross: 0, net: 0, pending: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function requestPayout () {
    setRequesting(true)
    setMsg(null)
    try {
      const res = await api.post('/doctors/my/payouts/request')
      const { totalRequested } = res.data.data
      setMsg({ ok: true, text: `Payout of ₦${Number(totalRequested).toLocaleString()} requested. You'll receive it on the next Monday.` })
      setTotals(prev => ({ ...prev, pending: 0 }))
      setEarnings(prev => prev.map(e => e.payoutStatus === 'pending' ? { ...e, payoutStatus: 'requested' } : e))
    } catch (err: unknown) {
      const text = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Request failed. Try again.'
      setMsg({ ok: false, text })
    }
    setRequesting(false)
  }

  if (loading) return <div className={s.loading}>Loading earnings…</div>

  return (
    <>
      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <p className={s.statLabel}>Gross Revenue</p>
          <p className={s.statValue}>₦{totals.gross.toLocaleString()}</p>
          <p className={s.statSub}>Before platform cut</p>
        </div>
        <div className={s.statCard}>
          <p className={s.statLabel}>Net Earned</p>
          <p className={s.statValue}>₦{totals.net.toLocaleString()}</p>
          <p className={s.statSub}>After 20% platform fee</p>
        </div>
        <div className={`${s.statCard} ${s.highlight}`}>
          <p className={s.statLabel}>Pending Payout</p>
          <p className={s.statValue}>₦{totals.pending.toLocaleString()}</p>
          <p className={s.statSub}>Available to withdraw</p>
        </div>
      </div>

      <div className={s.payoutBox}>
        {msg && <p className={`${s.msg} ${msg.ok ? s.ok : s.err}`}>{msg.text}</p>}
        <button
          className={s.payoutBtn}
          onClick={requestPayout}
          disabled={requesting || totals.pending === 0}
        >
          {requesting ? 'Requesting…' : `Request Payout — ₦${totals.pending.toLocaleString()}`}
        </button>
        <p className={s.payoutNote}>Payouts are processed every Monday.</p>
      </div>

      <div className={s.panel}>
        <div className={s.panelHead}><h3>Earnings History</h3></div>
        {earnings.length === 0 ? (
          <p className={s.empty}>No earnings yet. Complete consultations to earn.</p>
        ) : (
          earnings.map(e => (
            <div key={e._id} className={s.row}>
              <div className={s.rowLeft}>
                <p>{typeLabel(e.consultation?.consultationType)} session</p>
                <span>{new Date(e.createdAt).toLocaleDateString('en-NG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className={s.rowRight}>
                <span className={`${s.status} ${s[e.payoutStatus]}`}>{e.payoutStatus}</span>
                <span className={s.amount}>₦{e.netAmount.toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function typeLabel (t?: string) {
  return { video: 'Video', audio: 'Audio', chat: 'Chat' }[t ?? ''] ?? 'Consultation'
}

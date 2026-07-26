'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import s from './page.module.scss'
import { CalendarIcon, WalletIcon, ChartBarIcon, CreditCardIcon, HourglassIcon } from '@/components/icons'

interface Appointment {
  _id: string
  patient: { name: string; avatar?: string }
  scheduledAt: string
  type: 'video' | 'audio' | 'chat'
  status: string
  consultationFee: number
}

interface EarningsTotals {
  gross: number
  net: number
  pending: number
}

interface Payout {
  _id: string
  netAmount: number
  payoutStatus: string
  createdAt: string
}

export default function DoctorDashboard () {
  const router = useRouter()
  const user = typeof window !== 'undefined' ? getStoredUser() : null

  const [appts, setAppts] = useState<Appointment[]>([])
  const [totals, setTotals] = useState<EarningsTotals>({ gross: 0, net: 0, pending: 0 })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [isApproved, setIsApproved] = useState<boolean | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      api.get(`/doctors/my/appointments?date=${today}`),
      api.get('/doctors/my/earnings'),
      api.get('/doctors/my/profile'),
    ]).then(([apptRes, earningsRes, profileRes]) => {
      setAppts(apptRes.data.data?.appointments ?? [])
      setTotals(earningsRes.data.data?.totals ?? { gross: 0, net: 0, pending: 0 })
      setPayouts((earningsRes.data.data?.earnings ?? []).slice(0, 4))
      setIsApproved(profileRes.data.data?.doctor?.isApproved ?? false)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function startConsultation (apptId: string) {
    try {
      const res = await api.post('/consultations/start', { appointmentId: apptId })
      const consult = res.data.data?.consultation
      router.push(`/consultation?appt=${apptId}&cid=${consult._id}`)
    } catch {
      router.push(`/consultation?appt=${apptId}`)
    }
  }

  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })
  const confirmed = appts.filter(a => a.status === 'confirmed').length

  if (loading) return <div className={s.loading}>Loading…</div>

  return (
    <>
      {isApproved === false && (
        <div className={s.kycBanner}>
          <HourglassIcon size={14} /> Your account is pending admin approval. Some features are restricted until approved.
          <Link href='/doctor/kyc' className={s.kycLink}>Check KYC status →</Link>
        </div>
      )}

      <div className={s.greeting}>
        <h1>Good {hour()}, {(user?.name ?? 'Doctor').split(' ')[0]}</h1>
        <p>{today} · {confirmed} confirmed appointment{confirmed !== 1 ? 's' : ''} today</p>
      </div>

      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={s.statIcon}><CalendarIcon size={20} /></div>
          <p className={s.statLabel}>Today</p>
          <p className={s.statValue}>{appts.length}</p>
          <p className={s.statSub}>Appointments</p>
        </div>
        <div className={s.statCard}>
          <div className={s.statIcon}><WalletIcon size={20} /></div>
          <p className={s.statLabel}>Pending Payout</p>
          <p className={s.statValue}>₦{totals.pending.toLocaleString()}</p>
          <p className={s.statSub}>Available to withdraw</p>
        </div>
        <div className={s.statCard}>
          <div className={s.statIcon}><ChartBarIcon size={20} /></div>
          <p className={s.statLabel}>Net Earned</p>
          <p className={s.statValue}>₦{totals.net.toLocaleString()}</p>
          <p className={s.statSub}>All time</p>
        </div>
        <div className={s.statCard}>
          <div className={s.statIcon}><CreditCardIcon size={20} /></div>
          <p className={s.statLabel}>Gross Revenue</p>
          <p className={s.statValue}>₦{totals.gross.toLocaleString()}</p>
          <p className={s.statSub}>Before platform cut</p>
        </div>
      </div>

      <div className={s.grid2}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <h3>Today&apos;s Appointments</h3>
            <Link href='/doctor/appointments' style={{ fontSize: '0.75rem', color: '#0A8F6C', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          {appts.length === 0 ? (
            <p className={s.emptyState}>No appointments today.</p>
          ) : (
            appts.map(a => (
              <div key={a._id} className={s.apptItem}>
                <span className={s.apptTime}>
                  {new Date(a.scheduledAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={s.apptAvatar}>{a.patient.name[0]}</div>
                <div className={s.apptInfo}>
                  <p>{a.patient.name}</p>
                  <span>{statusLabel(a.status)} · {a.type}</span>
                </div>
                <span className={`${s.apptType} ${s[a.type]}`}>{a.type}</span>
                {a.status === 'confirmed' && (
                  <button className={s.joinBtn} onClick={() => startConsultation(a._id)}>
                    Start
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div>
          <div className={s.earningsCard}>
            <p className={s.earningsLabel}>Pending Earnings</p>
            <p className={s.earningsValue}>₦{totals.pending.toLocaleString()}</p>
            <p className={s.earningsPeriod}>Next payout: Every Monday</p>
            <Link href='/doctor/earnings' className={s.payoutBtn} style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none', marginTop: '1rem' }}>
              View Earnings →
            </Link>
          </div>

          <div className={s.panel}>
            <div className={s.panelHead}><h3>Recent Earnings</h3></div>
            {payouts.length === 0 ? (
              <p className={s.emptyState}>No earnings yet.</p>
            ) : (
              payouts.map(p => (
                <div key={p._id} className={s.payoutItem}>
                  <div className={s.payoutLeft}>
                    <p>Consultation</p>
                    <span>{new Date(p.createdAt).toLocaleDateString("en-NG")}</span>
                  </div>
                  <span className={s.payoutAmount}>₦{p.netAmount.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function hour () {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

function statusLabel (s: string) {
  return { confirmed: 'Confirmed', pending: 'Pending', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' }[s] ?? s
}

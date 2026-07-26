'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import s from './page.module.scss'
import {
  UsersIcon, StethoscopeIcon, CalendarIcon, WalletIcon,
  CreditCardIcon, CurrencyIcon,
} from '@/components/icons'

interface Stats {
  totalUsers: number
  totalDoctors: number
  totalAppointments: number
  totalRevenue: number
  activeSubscriptions: number
}

interface KycDoctor {
  _id: string
  user: { name: string; email: string }
  specialization: string
  isApproved: boolean
  createdAt: string
}

export default function AdminDashboard () {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [pending, setPending] = useState<KycDoctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/doctors?approved=false&limit=5'),
    ]).then(([sRes, dRes]) => {
      setStats(sRes.data.data)
      setPending(dRes.data.data?.doctors ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className={s.statsGrid}>
        <StatCard icon={<UsersIcon size={20} />}      color='rgba(10,143,108,0.15)' label='Total Users'        value={stats?.totalUsers?.toLocaleString() ?? '—'} />
        <StatCard icon={<StethoscopeIcon size={20} />} color='rgba(0,229,160,0.12)'  label='Active Doctors'     value={stats?.totalDoctors?.toLocaleString() ?? '—'} />
        <StatCard icon={<CalendarIcon size={20} />}    color='rgba(245,158,11,0.12)' label='Total Appointments' value={stats?.totalAppointments?.toLocaleString() ?? '—'} />
        <StatCard icon={<CurrencyIcon size={20} />}    color='rgba(59,130,246,0.12)' label='Total Revenue'      value={stats ? '₦' + (stats.totalRevenue / 100).toLocaleString() : '—'} />
      </div>

      <div className={s.grid2}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <h3>Pending Doctor KYC</h3>
            <Link href='/admin/doctors' className={s.viewAll}>View all →</Link>
          </div>
          {loading ? (
            <p className={s.empty}>Loading…</p>
          ) : pending.length === 0 ? (
            <p className={s.empty}>No pending KYC submissions.</p>
          ) : (
            <table className={s.table}>
              <thead>
                <tr><th>Doctor</th><th>Specialty</th><th>Submitted</th><th></th></tr>
              </thead>
              <tbody>
                {pending.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div className={s.docCell}>
                        <span className={s.docAvatar}>{d.user.name[0]}</span>
                        <div>
                          <p>{d.user.name}</p>
                          <span>{d.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{d.specialization}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString("en-NG")}</td>
                    <td>
                      <span className={s.badge}>Pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={s.panel}>
          <div className={s.panelHead}><h3>Quick Links</h3></div>
          <div className={s.quickLinks}>
            {[
              { href: '/admin/appointments', icon: <CalendarIcon size={16} />,    label: 'View Appointments' },
              { href: '/admin/payments',     icon: <CreditCardIcon size={16} />,  label: 'Payment History' },
              { href: '/admin/payouts',      icon: <WalletIcon size={16} />,      label: 'Process Payouts' },
              { href: '/admin/doctors',      icon: <StethoscopeIcon size={16} />, label: 'KYC Queue' },
              { href: '/admin/users',        icon: <UsersIcon size={16} />,       label: 'Manage Users' },
            ].map(l => (
              <Link key={l.href} href={l.href} className={s.quickLink}>
                <span className={s.quickIcon}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard ({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className={s.statCard}>
      <div className={s.statIcon} style={{ background: color }}>{icon}</div>
      <p className={s.statLabel}>{label}</p>
      <p className={s.statValue}>{value}</p>
    </div>
  )
}

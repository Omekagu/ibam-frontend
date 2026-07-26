'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import s from './page.module.scss'
import {
  StethoscopeIcon, MicroscopeIcon, ClipboardIcon, ThermometerIcon,
  PillIcon, CalendarIcon,
} from '@/components/icons'

interface Appointment {
  _id: string
  doctor: { _id: string; name: string; avatar?: string }
  scheduledAt: string
  type: string
  status: string
  consultationFee: number
}

interface PatientProfile {
  bloodType?: string
  allergies?: string[]
  medicalHistory?: string[]
}

const QUICK_ACTIONS = [
  { icon: <StethoscopeIcon size={22} />, bg: 'rgba(10,143,108,0.15)', label: 'Book Doctor',    sub: 'See a doctor now',    href: '/patient/book' },
  { icon: <MicroscopeIcon size={22} />,  bg: 'rgba(59,130,246,0.12)', label: 'Lab Tests',      sub: 'Order diagnostics',   href: '/patient/labs' },
  { icon: <ClipboardIcon size={22} />,   bg: 'rgba(245,158,11,0.12)', label: 'Health Records', sub: 'View prescriptions',  href: '/patient/records' },
  { icon: <ThermometerIcon size={22} />, bg: 'rgba(239,68,68,0.1)',   label: 'Symptom Check',  sub: 'AI triage',           href: '/patient/triage' },
]

export default function PatientDashboard () {
  const router = useRouter()
  const user = typeof window !== 'undefined' ? getStoredUser() : null
  const [appts,   setAppts]   = useState<Appointment[]>([])
  const [profile, setProfile] = useState<PatientProfile | null>(null)
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    api.get('/appointments/mine?limit=3')
      .then(r => setAppts((r.data.data?.appointments ?? []).filter((a: Appointment) => a.status !== 'cancelled' && a.status !== 'completed').slice(0, 3)))
      .catch(() => {})

    api.get('/users/profile')
      .then(r => setProfile(r.data.data?.patient ?? null))
      .catch(() => {})
  }, [])

  async function joinConsultation (apptId: string) {
    setJoining(apptId)
    try {
      const r = await api.get(`/consultations/by-appointment/${apptId}`)
      const cid = r.data.data?.consultation?._id
      if (cid) {
        router.push(`/consultation?appt=${apptId}&cid=${cid}`)
      } else {
        alert('Doctor hasn\'t started the consultation yet. Please wait.')
      }
    } catch {
      alert('Consultation not started yet. Please wait for your doctor.')
    }
    setJoining(null)
  }

  return (
    <>
      <div className={s.greeting}>
        <h1>Hello, {(user?.name ?? 'there').split(' ')[0]}</h1>
        <p>How are you feeling today? Your health is our priority.</p>
      </div>

      <div className={s.quickActions}>
        {QUICK_ACTIONS.map(q => (
          <Link key={q.label} href={q.href} className={s.quickCard}>
            <div className={s.quickIcon} style={{ background: q.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{q.icon}</div>
            <p className={s.quickLabel}>{q.label}</p>
            <p className={s.quickSub}>{q.sub}</p>
          </Link>
        ))}
      </div>

      <div className={s.grid2}>
        <div className={s.panel}>
          <div className={s.panelHead}>
            <h3>Upcoming Appointments</h3>
            <Link href='/patient/appointments'>View all →</Link>
          </div>
          {appts.length === 0 ? (
            <div className={s.emptyAppt}>
              <p>No upcoming appointments.</p>
              <Link href='/patient/book'>Book one now →</Link>
            </div>
          ) : appts.map(a => {
            const d = new Date(a.scheduledAt)
            return (
              <div key={a._id} className={s.apptCard}>
                <div className={s.apptDate}>
                  <p>{d.toLocaleString('en', { month: 'short' })}</p>
                  <strong>{d.getDate()}</strong>
                </div>
                <div className={s.apptDoc}>
                  <p>{a.doctor.name}</p>
                  <span>{d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })} · {a.type}</span>
                </div>
                <span className={`${s.statusBadge} ${s[a.status]}`}>{a.status}</span>
                {a.status === 'confirmed' && (
                  <button
                    className={s.joinBtn}
                    disabled={joining === a._id}
                    onClick={() => joinConsultation(a._id)}
                  >
                    {joining === a._id ? '…' : 'Join'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div>
          <div className={s.healthCard}>
            <p className={s.healthTitle}>Health Summary</p>
            <div className={s.healthRows}>
              <div className={s.healthRow}><span>Blood Type</span><span>{profile?.bloodType ?? 'Not recorded'}</span></div>
              <div className={s.healthRow}><span>Allergies</span><span>{profile?.allergies?.join(', ') || 'None recorded'}</span></div>
              <div className={s.healthRow}><span>Medical History</span><span>{profile?.medicalHistory?.length ? profile.medicalHistory.length + ' records' : 'None'}</span></div>
            </div>
            <button className={s.triageBtn} onClick={() => router.push('/patient/triage')}>
              <ThermometerIcon size={14} /> Check Symptoms Now
            </button>
          </div>

          <div className={s.panel}>
            <div className={s.panelHead}>
              <h3>Quick Access</h3>
            </div>
            <div className={s.recordLinks}>
              <Link href='/patient/records' className={s.recordLink}>
                <PillIcon size={18} /><div><p>My Prescriptions</p><span>View all e-prescriptions</span></div>
              </Link>
              <Link href='/patient/labs' className={s.recordLink}>
                <MicroscopeIcon size={18} /><div><p>Lab Results</p><span>View diagnostic results</span></div>
              </Link>
              <Link href='/patient/appointments' className={s.recordLink}>
                <CalendarIcon size={18} /><div><p>All Appointments</p><span>Past and upcoming</span></div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

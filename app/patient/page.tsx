'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import s from './page.module.scss'

interface Appointment {
  _id: string
  doctor: {
    _id: string
    name: string
    avatar?: string
    specialization?: string
  }
  scheduledAt: string
  type: string
  status: string
  consultationFee: number
}

interface Doctor {
  _id: string
  user: { _id: string; name: string; avatar?: string }
  specialization: string
  consultationFee: number
  ratings?: { average: number; count: number }
  yearsOfExperience?: number
}

interface LabRequest {
  _id: string
  status: string
  createdAt: string
}

export default function PatientDashboard () {
  const router = useRouter()
  const [appts, setAppts] = useState<Appointment[]>([])
  const [labCount, setLabCount] = useState(0)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [joining, setJoining] = useState<string | null>(null)

  const userName =
    typeof window !== 'undefined'
      ? getStoredUser()?.name?.split(' ')[0] ?? 'there'
      : 'there'

  useEffect(() => {
    // upcoming appointments
    api
      .get('/appointments/mine?limit=20')
      .then(r => {
        const now = Date.now()
        const upcoming = (r.data.data?.appointments ?? []).filter(
          (a: Appointment) =>
            a.status !== 'cancelled' &&
            a.status !== 'completed' &&
            new Date(a.scheduledAt).getTime() >= now - 30 * 60_000
        )
        setAppts(upcoming)
      })
      .catch(() => {})

    // lab results count
    api
      .get('/diagnostics/requests?limit=50')
      .then(r => {
        const reqs: LabRequest[] = r.data.data?.requests ?? []
        const recent = reqs.filter(r => {
          const age = Date.now() - new Date(r.createdAt).getTime()
          return r.status === 'resulted' && age < 30 * 24 * 60 * 60_000
        })
        setLabCount(recent.length)
      })
      .catch(() => {})

    // recommended doctors (top rated)
    api
      .get('/doctors?limit=6')
      .then(r => setDoctors(r.data.data?.doctors ?? []))
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
        alert("Doctor hasn't started the consultation yet. Please wait.")
      }
    } catch {
      alert('Consultation not started yet. Please wait for your doctor.')
    }
    setJoining(null)
  }

  const upcomingCount = appts.length
  const nextAppt = appts[0]
  const nextApptLabel = nextAppt
    ? new Date(nextAppt.scheduledAt).toLocaleDateString('en-NG', {
        month: 'short',
        day: 'numeric'
      }) +
      ', ' +
      new Date(nextAppt.scheduledAt).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  return (
    <>
      {/* ── Greeting ── */}
      <div className={s.greeting} suppressHydrationWarning>
        <div>
          <h1>Hello, {userName} 👋</h1>
          <p>How are you feeling today?</p>
        </div>
      </div>
      {/* ── Stat cards ── */}
      <div className={s.statRow}>
        <Link href='/patient/appointments' className={s.statCard}>
          <div className={s.statIcon}>
            <CalIcon />
          </div>
          <p className={s.statLabel}>Appointments</p>
          <p className={s.statValue}>{upcomingCount}</p>
          <p className={s.statSub}>
            {nextApptLabel ? `Next: ${nextApptLabel}` : 'No upcoming'}
          </p>
        </Link>

        <Link href='/patient/labs' className={s.statCard}>
          <div className={`${s.statIcon} ${s.statIconBlue}`}>
            <LabIcon />
          </div>
          <p className={s.statLabel}>Lab Results</p>
          <p className={s.statValue}>{labCount > 0 ? labCount : '—'}</p>
          <p className={s.statSub}>
            {labCount > 0 ? 'New results' : 'Updated today'}
          </p>
        </Link>
      </div>
      {/* ── Ask AI ── */}
      <Link href='/patient/triage' className={s.aiCard}>
        <div className={s.aiIcon}>
          <BotIcon />
        </div>
        <div className={s.aiBody}>
          <p className={s.aiTitle}>Ask AI</p>
          <p className={s.aiSub}>
            Describe your symptoms, get health insights, or ask about finding
            the right doctor.
          </p>
        </div>
        <div className={s.aiArrow}>
          <svg
            width='20'
            height='20'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2.5}
              d='M9 5l7 7-7 7'
            />
          </svg>
        </div>
      </Link>
      {/* ── Quick actions ── */}
      <div className={s.section}>
        <div className={s.sectionHead}>
          <h3>Quick Access</h3>
        </div>
        <div className={s.quickGrid}>
          {[
            {
              href: '/patient/labs',
              icon: <LabIcon />,
              label: 'Lab Tests',
              bg: 'rgba(59,130,246,0.12)',
              color: '#3B82F6'
            },
            {
              href: '/patient/records',
              icon: <DocIcon />,
              label: 'Health Records',
              bg: 'rgba(139,92,246,0.12)',
              color: '#8B5CF6'
            },
            {
              href: '/patient/pharmacy',
              icon: <PharmIcon />,
              label: 'Pharmacy',
              bg: 'rgba(245,158,11,0.12)',
              color: '#F59E0B'
            },
            {
              href: '/patient/health',
              icon: <HeartIcon />,
              label: 'Health Insights',
              bg: 'rgba(239,68,68,0.10)',
              color: '#EF4444'
            },
            {
              href: '/patient/facilities',
              icon: <MapIcon />,
              label: 'Facilities',
              bg: 'rgba(20,184,166,0.12)',
              color: '#14B8A6'
            },
            {
              href: '/patient/triage',
              icon: <BotIcon />,
              label: 'Symptom Check',
              bg: 'rgba(34,197,94,0.12)',
              color: '#22C55E'
            }
          ].map(q => (
            <Link key={q.href} href={q.href} className={s.quickItem}>
              <div
                className={s.quickIcon}
                style={{ background: q.bg, color: q.color }}
              >
                {q.icon}
              </div>
              <span>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>
      {/* ── Upcoming appointment (if any) ── */}
      {nextAppt && (
        <div className={s.panel}>
          <div className={s.panelHead}>
            <h3>Upcoming Appointment</h3>
            <Link href='/patient/appointments'>View all →</Link>
          </div>
          {appts.slice(0, 3).map(a => {
            const d = new Date(a.scheduledAt)
            const MONTHS = [
              'Jan',
              'Feb',
              'Mar',
              'Apr',
              'May',
              'Jun',
              'Jul',
              'Aug',
              'Sep',
              'Oct',
              'Nov',
              'Dec'
            ]
            const isConfirmed = a.status === 'confirmed'
            const sessionEnd = d.getTime() + 30 * 60_000
            const canJoin = isConfirmed && sessionEnd > Date.now()
            return (
              <div key={a._id} className={s.apptCard}>
                <div className={s.apptDate}>
                  <span>{MONTHS[d.getMonth()]}</span>
                  <strong>{d.getDate()}</strong>
                </div>
                <div className={s.apptDoc}>
                  <p>{a.doctor.name}</p>
                  <span>
                    {d.toLocaleTimeString('en', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}{' '}
                    · {a.type}
                  </span>
                </div>
                <span className={`${s.statusBadge} ${s[a.status]}`}>
                  {a.status === 'confirmed'
                    ? 'Confirmed'
                    : a.status === 'pending'
                    ? 'Unpaid'
                    : a.status}
                </span>
                {canJoin && (
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
      )}
      {/* ── Recommended For You ── */}
      <div className={s.section}>
        <div className={s.sectionHead}>
          <h3>Recommended for You</h3>
          <Link href='/patient/book'>View all</Link>
        </div>
        <div className={s.docGrid}>
          {doctors.map((d, i) => {
            const matchPct = Math.max(85, 98 - i * 3)
            const name = d.user?.name ?? 'Doctor'
            const initials = name
              .split(' ')
              .slice(0, 2)
              .map(w => w[0])
              .join('')
              .toUpperCase()
            return (
              <Link key={d._id} href='/patient/book' className={s.docCard}>
                <div className={s.docPhotoWrap}>
                  {d.user?.avatar ? (
                    <Image
                      src={d.user.avatar}
                      alt={name}
                      fill
                      sizes='100px'
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <span className={s.docInitials}>{initials}</span>
                  )}
                  <span className={s.matchBadge}>{matchPct}% match</span>
                </div>
                <div className={s.docInfo}>
                  <p className={s.docName}>{name}</p>
                  <p className={s.docSpec}>{d.specialization}</p>
                  {(d.ratings?.average ?? 0) > 0 && (
                    <p className={s.docRating}>
                      ★ {d.ratings!.average.toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

function CalIcon () {
  return (
    <svg
      width='18'
      height='18'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      />
    </svg>
  )
}
function LabIcon () {
  return (
    <svg
      width='18'
      height='18'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 3v10.5a4.5 4.5 0 009 0V3M9 3H6m3 0h6m0 0h3M6 7h3M15 7h3'
      />
    </svg>
  )
}
function BotIcon () {
  return (
    <svg
      width='20'
      height='20'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
      />
    </svg>
  )
}
function DocIcon () {
  return (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    </svg>
  )
}
function PharmIcon () {
  return (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      />
    </svg>
  )
}
function HeartIcon () {
  return (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
      />
    </svg>
  )
}
function MapIcon () {
  return (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
      />
    </svg>
  )
}

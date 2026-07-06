'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout, getStoredUser } from '@/lib/auth'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBell from '@/components/NotificationBell'
import s from './layout.module.scss'

const NAV = [
  { href: '/patient',              label: 'Dashboard',      icon: <GridIcon /> },
  { href: '/patient/appointments', label: 'Appointments',   icon: <CalIcon /> },
  { href: '/patient/book',         label: 'Book Doctor',    icon: <DoctorIcon /> },
  { href: '/patient/labs',         label: 'Lab Tests',      icon: <LabIcon /> },
  { href: '/patient/records',      label: 'Health Records', icon: <DocIcon /> },
  { href: '/patient/pharmacy',     label: 'Pharmacy',       icon: <PharmacyIcon /> },
  { href: '/patient/subscriptions', label: 'Subscriptions', icon: <SubIcon /> },
  { href: '/patient/triage',       label: 'Symptom Check',  icon: <TriageIcon /> },
  { href: '/patient/profile',      label: 'Profile',        icon: <UserIcon /> },
]

function initials (name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function DateDisplay () {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => setLabel(new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])
  return <span className={s.dateChip}>{label}</span>
}

export default function PatientLayout ({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null)
  useEffect(() => { setUser(getStoredUser()) }, [])

  const currentPage = NAV.find(n => n.href === path)

  async function handleLogout () {
    await logout()
    router.push('/login')
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        {/* Logo */}
        <Link href='/patient' className={s.sidebarLogo}>
          <div className={s.logoMark}>
            <span>iB</span>
          </div>
          <div className={s.logoText}>
            <span>iBam</span>
            <em>Health</em>
          </div>
        </Link>

        {/* User card */}
        <div className={s.userCard}>
          <div className={s.avatar}>
            {user?.name ? initials(user.name) : '?'}
          </div>
          <div className={s.userInfo}>
            <p>{user?.name ?? 'Patient'}</p>
            <span>Patient</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={s.nav}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.navLink} ${path === item.href ? s.active : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={s.sidebarBottom}>
          <button className={s.logoutBtn} onClick={handleLogout}>
            <LogoutIcon /> Log Out
          </button>
        </div>
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          {/* Left — page identity */}
          <div className={s.topbarLeft}>
            <span className={s.topbarEyebrow}>Patient Portal</span>
            <h1 className={s.topbarTitle}>
              {currentPage?.icon && <span className={s.topbarIcon}>{currentPage.icon}</span>}
              {currentPage?.label ?? 'Portal'}
            </h1>
          </div>

          {/* Right — actions */}
          <div className={s.topbarRight}>
            <DateDisplay />
            <NotificationBell />
            <ThemeToggle />
            <Link href='/patient/book' className={s.bookBtn}>
              <PlusIcon /> Book Doctor
            </Link>
          </div>
        </header>
        <main className={s.content}>{children}</main>
      </div>
    </div>
  )
}

function GridIcon ()   { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' /></svg> }
function CalIcon ()    { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg> }
function DoctorIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg> }
function LabIcon ()    { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3v10.5a4.5 4.5 0 009 0V3M9 3H6m3 0h6m0 0h3M6 7h3M15 7h3' /></svg> }
function DocIcon ()    { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg> }
function SubIcon ()    { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' /></svg> }
function TriageIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' /></svg> }
function UserIcon ()   { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg> }
function PharmacyIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' /></svg> }
function LogoutIcon () { return <svg width='14' height='14' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg> }
function PlusIcon ()   { return <svg width='14' height='14' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M12 4v16m8-8H4' /></svg> }

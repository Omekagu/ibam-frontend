'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { logout, getStoredUser } from '@/lib/auth'
import ThemeToggle from '@/components/ThemeToggle'
import s from './layout.module.scss'

const NAV = [
  { href: '/doctor', label: 'Dashboard', icon: <GridIcon /> },
  { href: '/doctor/appointments', label: 'Appointments', icon: <CalIcon /> },
  { href: '/doctor/patients', label: 'My Patients', icon: <UsersIcon /> },
  { href: '/doctor/earnings', label: 'Earnings', icon: <WalletIcon /> },
  { href: '/doctor/profile', label: 'Profile', icon: <UserIcon /> },
]

export default function DoctorLayout ({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null)
  useEffect(() => { setUser(getStoredUser()) }, [])
  const [online, setOnline] = useState(true)

  async function handleLogout () {
    await logout()
    router.push('/login')
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href='/doctor' className={s.sidebarLogo}>
          <span className={s.mark}>iB</span>
          <span>iBam <em>Health</em></span>
        </Link>

        <div className={s.doctorCard}>
          <div className={s.avatar}>👨‍⚕️</div>
          <div className={s.doctorInfo}>
            <p>{user?.name ?? 'Doctor'}</p>
            <span>Physician</span>
          </div>
        </div>

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
          <span className={s.topbarTitle}>
            {NAV.find(n => n.href === path)?.label ?? 'Doctor Portal'}
          </span>
          <div className={s.topbarRight}>
            <ThemeToggle />
            <label className={s.onlineToggle}>
              <span>{online ? 'Online' : 'Offline'}</span>
              <label className={s.toggleSwitch}>
                <input type='checkbox' checked={online} onChange={e => setOnline(e.target.checked)} />
                <span />
              </label>
            </label>
          </div>
        </header>
        <main className={s.content}>{children}</main>
      </div>
    </div>
  )
}

function GridIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' /></svg> }
function CalIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg> }
function UsersIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' /></svg> }
function WalletIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' /></svg> }
function UserIcon () { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg> }
function LogoutIcon () { return <svg width='14' height='14' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg> }

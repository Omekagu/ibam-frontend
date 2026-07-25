'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { logout, getStoredUser } from '@/lib/auth'
import api from '@/lib/api'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBell from '@/components/NotificationBell'
import s from './layout.module.scss'

const NAV = [
  { href: '/doctor',                label: 'Dashboard',    icon: <GridIcon /> },
  { href: '/doctor/appointments',   label: 'Appointments', icon: <CalIcon /> },
  { href: '/doctor/availability',   label: 'Availability', icon: <ClockIcon /> },
  { href: '/doctor/patients',       label: 'My Patients',  icon: <UsersIcon /> },
  { href: '/doctor/earnings',       label: 'Earnings',     icon: <WalletIcon /> },
  { href: '/doctor/profile',        label: 'Profile',      icon: <UserIcon /> },
  { href: '/doctor/kyc',            label: 'KYC',          icon: <ShieldIcon /> },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [online, setOnline] = useState(true)
  const [togglingOnline, setTogglingOnline] = useState(false)

  useEffect(() => { setUser(getStoredUser()) }, [])
  useEffect(() => { setDrawerOpen(false) }, [path])

  async function handleOnlineToggle (checked: boolean) {
    setTogglingOnline(true)
    try {
      await api.put('/doctors/my/profile', { isAvailable: checked })
      setOnline(checked)
    } catch { }
    setTogglingOnline(false)
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  const currentLabel = NAV.find(n => n.href === path)?.label ?? 'Doctor Portal'

  const sidebarInner = (
    <>
      <Link href='/doctor' className={s.sidebarLogo}>
        <span className={s.mark}>iB</span>
        <span>iBam <em>Health</em></span>
      </Link>
      <div className={s.doctorCard}>
        <div className={s.avatar}>
          {user?.name ? user.name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase() : '👨‍⚕️'}
        </div>
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
            {item.icon}{item.label}
          </Link>
        ))}
      </nav>
      <div className={s.sidebarBottom}>
        <button className={s.logoutBtn} onClick={handleLogout}>
          <LogoutIcon /> Log Out
        </button>
      </div>
    </>
  )

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>{sidebarInner}</aside>

      {drawerOpen && <div className={s.drawerOverlay} onClick={() => setDrawerOpen(false)} />}
      <aside className={`${s.drawer} ${drawerOpen ? s.drawerOpen : ''}`}>
        <button className={s.drawerClose} onClick={() => setDrawerOpen(false)} aria-label='Close'>
          <CloseIcon />
        </button>
        {sidebarInner}
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <button className={s.hamburger} onClick={() => setDrawerOpen(true)} aria-label='Menu'>
            <HamburgerIcon />
          </button>
          <span className={s.topbarTitle}>{currentLabel}</span>
          <div className={s.topbarRight}>
            <NotificationBell />
            <ThemeToggle />
            <label className={`${s.onlineToggle} ${togglingOnline ? s.toggling : ''}`}>
              <span>{online ? 'Online' : 'Offline'}</span>
              <label className={s.toggleSwitch}>
                <input type='checkbox' checked={online} disabled={togglingOnline} onChange={e => handleOnlineToggle(e.target.checked)} />
                <span />
              </label>
            </label>
          </div>
        </header>

        <main className={s.content}>{children}</main>

        <nav className={s.mobileNav}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.mobileNavItem} ${path === item.href ? s.mobileNavActive : ''}`}
            >
              {item.icon}
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}

function GridIcon()    { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' /></svg> }
function ClockIcon()   { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' /></svg> }
function ShieldIcon()  { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' /></svg> }
function CalIcon()     { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg> }
function UsersIcon()   { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' /></svg> }
function WalletIcon()  { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' /></svg> }
function UserIcon()    { return <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg> }
function LogoutIcon()  { return <svg width='14' height='14' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg> }
function HamburgerIcon(){ return <svg width='20' height='20' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' /></svg> }
function CloseIcon()   { return <svg width='20' height='20' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg> }

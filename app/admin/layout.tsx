'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import ThemeToggle from '@/components/ThemeToggle'
import s from './layout.module.scss'

const NAV = [
  {
    section: 'Overview',
    items: [
      { href: '/admin',              label: 'Dashboard',    icon: <GridIcon /> },
    ]
  },
  {
    section: 'People',
    items: [
      { href: '/admin/doctors',      label: 'Doctors',      icon: <DoctorIcon />, badge: 'KYC' },
      { href: '/admin/users',        label: 'Patients',     icon: <UsersIcon /> },
    ]
  },
  {
    section: 'Live',
    items: [
      { href: '/admin/monitoring',   label: 'Monitoring',   icon: <LiveIcon />, badge: 'Live' },
    ]
  },
  {
    section: 'Operations',
    items: [
      { href: '/admin/appointments', label: 'Appointments', icon: <CalIcon /> },
      { href: '/admin/orders',       label: 'All Orders',   icon: <OrderIcon /> },
      { href: '/admin/payments',     label: 'Payments',     icon: <CardIcon /> },
      { href: '/admin/payouts',      label: 'Payouts',      icon: <WalletIcon /> },
    ]
  },
  {
    section: 'Partners',
    items: [
      { href: '/admin/pharmacy',     label: 'Pharmacies',   icon: <PillIcon /> },
      { href: '/admin/labs',         label: 'Labs',         icon: <LabIcon /> },
      { href: '/admin/diagnostics',  label: 'Diagnostics',  icon: <TestIcon /> },
      { href: '/admin/drugs',        label: 'Drug Catalog', icon: <CatalogIcon /> },
    ]
  },
  {
    section: 'Review',
    items: [
      { href: '/admin/approvals',    label: 'Approvals',    icon: <CheckIcon /> },
    ]
  },
  {
    section: 'Logs',
    items: [
      { href: '/admin/audit',        label: 'Audit Log',    icon: <AuditIcon /> },
    ]
  },
]

export default function AdminLayout ({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout () {
    await logout()
    router.push('/login')
  }

  const allItems = NAV.flatMap(g => g.items)
  const currentLabel = allItems.find(i => i.href === path)?.label ?? 'Admin'

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href='/admin' className={s.sidebarLogo}>
          <span className={s.mark}>iB</span>
          <span>iBam <em>Health</em></span>
        </Link>
        <div className={s.adminBadge}>Admin Console</div>

        <nav className={s.nav}>
          {NAV.map(group => (
            <div key={group.section}>
              <p className={s.navSection}>{group.section}</p>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${s.navLink} ${path === item.href ? s.active : ''}`}
                >
                  {item.icon}
                  {item.label}
                  {'badge' in item && item.badge && (
                    <span className={`${s.navBadge} ${item.badge === 'Live' ? s.navBadgeLive : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={s.sidebarBottom}>
          <div className={s.adminAvatar}>A</div>
          <div className={s.adminInfo}>
            <p>Super Admin</p>
            <span>admin@ibamhealth.com</span>
          </div>
          <button className={s.logoutBtn} onClick={handleLogout} aria-label='Log out'>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className={s.main}>
        <header className={s.topbar}>
          <span className={s.topbarTitle}>{currentLabel}</span>
          <div className={s.topbarRight}>
            <ThemeToggle />
            <button className={s.notifBtn} aria-label='Notifications'>
              <BellIcon />
            </button>
          </div>
        </header>
        <main className={s.content}>{children}</main>
      </div>
    </div>
  )
}

function GridIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' /></svg> }
function DoctorIcon () { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg> }
function UsersIcon ()  { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' /></svg> }
function CalIcon ()    { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg> }
function CardIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' /></svg> }
function WalletIcon () { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 10h18M3 6h18M3 14h6m4 0h8M3 18h6m4 0h8' /></svg> }
function BellIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' /></svg> }
function LogoutIcon () { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg> }
function LiveIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><circle cx='12' cy='12' r='2' fill='currentColor'/><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.5 8.5a5 5 0 000 7m7-7a5 5 0 010 7M5.5 5.5a9 9 0 000 13m13-13a9 9 0 010 13' /></svg> }
function PillIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 3H4a1 1 0 00-1 1v16a1 1 0 001 1h5M15 3h5a1 1 0 011 1v16a1 1 0 01-1 1h-5M9 3v18M15 3v18' /></svg> }
function LabIcon ()    { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' /></svg> }
function TestIcon ()    { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' /></svg> }
function CatalogIcon () { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' /></svg> }
function CheckIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg> }
function OrderIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' /></svg> }
function AuditIcon ()   { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' /></svg> }

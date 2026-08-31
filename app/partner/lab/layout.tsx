'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import s from './layout.module.scss'

export default function LabPartnerLayout ({
  children
}: {
  children: React.ReactNode
}) {
  const path = usePathname()
  const router = useRouter()
  async function handleLogout () {
    await logout()
    router.push('/login')
  }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href='/partner/lab' className={s.logo}>
          <Image
            src='/Ibam Logo Png.png'
            alt='iBam'
            width={28}
            height={28}
            style={{ borderRadius: 8 }}
          />
          <span>
            iBam <em>Partner</em>
          </span>
        </Link>
        <div className={s.partnerBadge}>Lab Portal</div>

        <nav className={s.nav}>
          <Link
            href='/partner/lab'
            className={`${s.navLink} ${
              path === '/partner/lab' ? s.active : ''
            }`}
          >
            <RequestsIcon /> Test Requests
          </Link>
          {/* <Link href='/partner/lab/tests' className={`${s.navLink} ${path === '/partner/lab/tests' ? s.active : ''}`}>
            <TestsIcon /> Manage Tests
          </Link>
          <Link href='/partner/lab/profile' className={`${s.navLink} ${path === '/partner/lab/profile' ? s.active : ''}`}>
            <ProfileIcon /> Profile & Payouts
          </Link> */}
        </nav>

        <button className={s.logoutBtn} onClick={handleLogout}>
          <LogoutIcon /> Log Out
        </button>
      </aside>

      <div className={s.main}>
        <main className={s.content}>{children}</main>
      </div>
    </div>
  )
}

function ProfileIcon () {
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
        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      />
    </svg>
  )
}
function RequestsIcon () {
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
        d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
      />
    </svg>
  )
}
function TestsIcon () {
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
        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
      />
    </svg>
  )
}
function LogoutIcon () {
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
        d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
      />
    </svg>
  )
}

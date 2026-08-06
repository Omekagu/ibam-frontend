'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import s from './layout.module.scss'

export default function PharmacyPartnerLayout ({ children }: { children: React.ReactNode }) {
  const path   = usePathname()
  const router = useRouter()
  async function handleLogout () { await logout(); router.push('/login') }

  return (
    <div className={s.shell}>
      <aside className={s.sidebar}>
        <Link href='/partner/pharmacy' className={s.logo}>
          <Image src='/Ibam Logo Png.png' alt='iBam' width={28} height={28} style={{ borderRadius: 8 }} />
          <span>iBam <em>Partner</em></span>
        </Link>
        <div className={s.partnerBadge}>Pharmacy Portal</div>

        <nav className={s.nav}>
          <Link href='/partner/pharmacy' className={`${s.navLink} ${path === '/partner/pharmacy' ? s.active : ''}`}>
            <OrdersIcon /> Orders
          </Link>
          <Link href='/partner/pharmacy/catalog' className={`${s.navLink} ${path === '/partner/pharmacy/catalog' ? s.active : ''}`}>
            <CatalogIcon /> Drug Catalog
          </Link>
          <Link href='/partner/pharmacy/profile' className={`${s.navLink} ${path === '/partner/pharmacy/profile' ? s.active : ''}`}>
            <ProfileIcon /> Profile & Payouts
          </Link>
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

function OrdersIcon ()  { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' /></svg> }
function CatalogIcon () { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' /></svg> }
function ProfileIcon () { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' /></svg> }
function LogoutIcon ()  { return <svg width='16' height='16' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg> }

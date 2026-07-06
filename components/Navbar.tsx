'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import s from './Navbar.module.scss'

const NAV = [
  { label: 'Services', href: '/services' },
  { label: 'Doctors', href: '/doctors' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'For Doctors', href: '/#for-doctors' },
  { label: 'About', href: '/about' }
]

export default function Navbar () {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Lock body scroll when menu is open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <header className={`${s.nav} ${scrolled ? s.solid : s.transparent}`}>
        <div className={s.inner}>
          <Link href='/' className={s.logo} onClick={close}>
            <span className={s.logoMark}>iB</span>
            <span className={s.logoText}>
              iBam <span>Health</span>
            </span>
          </Link>

          <ul className={s.links}>
            {NAV.map(l => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>

          <div className={s.ctas}>
            <Link href='/login' className={s.loginBtn}>
              Log In
            </Link>
            <Link href='/signup' className={s.getStartedBtn}>
              Get Started
            </Link>
          </div>

          <button
            className={`${s.hamburger} ${open ? s.open : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Full-screen mobile overlay */}
      {open && (
        <div className={s.mobileOverlay} aria-modal='true' role='dialog'>
          {/* Decorative background elements */}
          <div className={s.menuOrb1} />
          <div className={s.menuOrb2} />
          <div className={s.menuGrid} />

          {/* Top bar mirrored in the overlay */}
          <div className={s.menuTop}>
            {/* <a */}
            <button
              className={s.closeBtn}
              onClick={close}
              aria-label='Close menu'
            >
              <svg
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                width={22}
                height={22}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className={s.menuNav}>
            {NAV.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={s.menuLink}
                style={{ animationDelay: `${i * 0.07}s` }}
                onClick={close}
              >
                <span className={s.menuLinkText}>{l.label}</span>
                <svg
                  className={s.menuArrow}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  width={20}
                  height={20}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 8l4 4m0 0l-4 4m4-4H3'
                  />
                </svg>
              </Link>
            ))}
          </nav>

          {/* Bottom CTA + trust */}
          <div className={s.menuBottom}>
            <div className={s.menuCtas}>
              <Link href='/login' className={s.menuLoginBtn} onClick={close}>
                Log In
              </Link>
              <Link href='/signup' className={s.menuStartBtn} onClick={close}>
                Get Started →
              </Link>
            </div>
            <div className={s.menuTrust}>
              {['MDCN Verified', 'NDPR Compliant', 'Encrypted'].map(t => (
                <span key={t} className={s.menuTrustBadge}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

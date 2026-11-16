import Image from 'next/image'
import Link from 'next/link'
import s from './Footer.module.scss'

const COLS = [
  {
    title: 'Services',
    links: [
      { label: 'Telemedicine', href: '/services' },
      { label: 'Smart Triage', href: '/services' },
      { label: 'Diagnostics', href: '/services' },
      { label: 'E-Prescriptions', href: '/services' },
      { label: 'Pharmacy', href: '/services' },
      { label: 'Nearby Care', href: '/services' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'For Doctors', href: '/signup' },
      { label: 'Contact Us', href: '/contact' },
      // { label: 'Register Lab',      href: '/onboard/lab' },
      { label: 'Register Pharmacy', href: '/onboard/pharmacy' }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Medical Disclaimer', href: '/legal/medical-disclaimer' },
      { label: 'Refund Policy', href: '/legal/refund' },
      { label: 'NDPR Compliance', href: '/legal/privacy' }
    ]
  }
]

const SOCIALS = [
  {
    name: 'instagram',
    href: 'https://www.instagram.com/ibamhealth/',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'
  },
  {
    name: 'facebook',
    href: 'https://www.facebook.com/profile.php?id=61592650325039',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'
  },
  {
    name: 'tiktok',
    href: 'https://www.tiktok.com/@ibamhealth',
    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.21 8.21 0 004.79 1.52V6.76a4.84 4.84 0 01-1.02-.07z'
  }
]

function SocialIcon ({ path }: { path: string }) {
  return (
    <svg fill='currentColor' viewBox='0 0 24 24'>
      <path d={path} />
    </svg>
  )
}

export default function Footer () {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.grid}>
          <div className={s.brand}>
            <Link href='/' className={s.logo}>
              <Image
                src='/Ibam Logo Png.png'
                alt='iBam Health'
                width={36}
                height={36}
                className={s.logoMark}
              />
              <span className={s.logoText}>
                iBam <span>Health</span>
              </span>
            </Link>
            <p>
              Bringing certified medical care to your doorstep diagnostics,
              consultations, prescriptions, and more.
            </p>
            <div className={s.socials}>
              {SOCIALS.map(social => (
                <a
                  key={social.name}
                  href={social.href}
                  className={s.socialBtn}
                  aria-label={social.name}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <SocialIcon path={social.path} />
                </a>
              ))}
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.title} className={s.col}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={s.bottom}>
          <p>
            © {new Date().getFullYear()} iBam Health Ltd. All rights reserved.
          </p>
          <div className={s.badges}>
            <span className={s.badge}>Registered in Nigeria</span>
            {/* <span className={s.badge}>NDPR Compliant</span>
            <span className={s.badge}>FMOH Licensed</span> */}
          </div>
        </div>
      </div>
    </footer>
  )
}

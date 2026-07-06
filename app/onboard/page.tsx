import Link from 'next/link'
import s from './page.module.scss'

export default function OnboardPage () {
  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <Link href='/' className={s.logo}>
          <span className={s.mark}>iB</span>
          <span>iBam <em>Health</em></span>
        </Link>
        <h1 className={s.title}>Partner with iBam Health</h1>
        <p className={s.sub}>
          Join Nigeria&apos;s leading telemedicine network. Register your business and start
          serving patients connected to verified doctors on our platform.
        </p>

        <div className={s.cards}>
          <Link href='/onboard/pharmacy' className={s.card}>
            <div className={s.cardIcon}>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'>
                <path d='M3 6h18M3 18h18M9 6v12M15 6v12M3 12h6M15 12h6'/>
              </svg>
            </div>
            <h2>Register Pharmacy</h2>
            <p>Receive prescriptions from verified doctors and fulfill drug orders for patients on the platform.</p>
            <ul className={s.perks}>
              <li>Receive digital prescriptions</li>
              <li>Delivery &amp; pickup orders</li>
              <li>Integrated payment collection</li>
              <li>Real-time order notifications</li>
            </ul>
            <span className={s.cta}>Apply Now →</span>
          </Link>

          <Link href='/onboard/lab' className={s.card}>
            <div className={s.cardIcon}>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round'>
                <path d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'/>
              </svg>
            </div>
            <h2>Register Laboratory</h2>
            <p>Provide diagnostic services to patients referred by doctors. Upload results digitally and manage home-visit sampling.</p>
            <ul className={s.perks}>
              <li>Receive test referrals from doctors</li>
              <li>Upload digital results</li>
              <li>Home-visit sample collection</li>
              <li>Manage your test catalog</li>
            </ul>
            <span className={s.cta}>Apply Now →</span>
          </Link>
        </div>

        <p className={s.loginHint}>
          Already registered? <Link href='/login'>Log in to your partner account</Link>
        </p>
      </div>
    </div>
  )
}

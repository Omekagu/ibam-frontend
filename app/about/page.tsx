import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import s from './page.module.scss'
import {
  ShieldCheckIcon, GlobeIcon, BoltIcon, LightbulbIcon, LockIcon, HandshakeIcon,
} from '@/components/icons'

export const metadata: Metadata = {
  title: 'About — iBam Health',
  description:
    'iBam Health is a digital health platform redefining how people access healthcare through accessible diagnostics, connected care, and innovative technology.'
}

const STATS = [
  { val: '10K+',  lbl: 'Registered Patients' },
  { val: '500+',  lbl: 'Verified Physicians' },
  { val: '50+',   lbl: 'Partner Facilities' },
  { val: '98.6%', lbl: 'Satisfaction Rate' }
]

const VALUES = [
  {
    icon: <ShieldCheckIcon size={28} />,
    title: 'Trust & Safety',
    desc: 'Every doctor is MDCN-verified. Every consultation is end-to-end encrypted. Your health data belongs to you alone.'
  },
  {
    icon: <GlobeIcon size={28} />,
    title: 'Accessibility',
    desc: 'We believe quality healthcare is a right, not a privilege. Built to work on affordable data and basic devices across Nigeria.'
  },
  {
    icon: <BoltIcon size={28} />,
    title: 'Speed & Reliability',
    desc: 'Triage in minutes. Doctor match in seconds. Lab results delivered before your next cup of tea.'
  },
  {
    icon: <LightbulbIcon size={28} />,
    title: 'Clinical Excellence',
    desc: 'Our medical advisory board reviews clinical protocols quarterly to keep iBam at the frontier of evidence-based medicine.'
  },
  {
    icon: <LockIcon size={28} />,
    title: 'Privacy First',
    desc: 'NDPR compliant. End-to-end encrypted. We never sell your health data to insurers, pharma, or any third party.'
  },
  {
    icon: <HandshakeIcon size={28} />,
    title: 'Community Impact',
    desc: '10% of profits fund rural health outreach programmes across underserved communities in Nigeria.'
  }
]

const TEAM = [
  { initials: 'EO', name: 'Dr. Emeka Okonkwo',   role: 'Chief Medical Officer',   dept: 'Internal Medicine, University of Enugu' },
  { initials: 'ZB', name: 'Zainab Bello',         role: 'CEO & Co-Founder',        dept: 'Previously at Flutterwave, MIT Media Lab' },
  { initials: 'TA', name: 'Tunde Adeyemi',         role: 'CTO',                     dept: 'Ex-Google, MSc Software Engineering' },
  { initials: 'FS', name: 'Dr. Fatima Suleiman',  role: 'Head of Telemedicine',    dept: 'OB-GYN, University of Abuja' },
  { initials: 'CO', name: 'Chidi Obi',             role: 'Head of Diagnostics',     dept: 'Clinical Pathologist, LUTH' },
  { initials: 'AM', name: 'Aisha Mohammed',        role: 'VP Operations',           dept: 'MBA, Lagos Business School' },
  { initials: 'SA', name: 'Seun Adeleke',          role: 'Head of Product Design',  dept: 'UX Lead, ex-Andela' },
  { initials: 'GE', name: 'Dr. Grace Eze',         role: 'Medical Advisory Board',  dept: 'Cardiology, University of Benin' },
]

export default function AboutPage () {
  return (
    <PageShell>

      {/* ─── Hero ──────────────────────────────────── */}
      <section className={s.hero}>
        <Image
          src='/1.png'
          alt='iBam Health'
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          className={s.heroBg}
        />
        <div className={s.heroOverlay} />
        <div className={s.heroInner}>
          <span className={s.eyebrow}>Our Story</span>
          <h1>
            Built to fix Nigerian<br />healthcare, for real
          </h1>
          <p>
            iBam Health was born out of frustration — long queues, unavailable specialists,
            surprise bills, and fragmented records. We built the platform we wished existed.
          </p>
          <div className={s.heroCtas}>
            <Link href='/signup' className={s.heroBtn}>Get started free</Link>
            <Link href='/contact' className={s.heroLinkBtn}>Contact us →</Link>
          </div>
        </div>
      </section>

      {/* ─── About ─────────────────────────────────── */}
      <section className={s.about}>
        <div className={s.aboutInner}>
          <div className={`${s.aboutText} reveal`}>
            <span className={s.label}>About iBam Health</span>
            <h2>A connected healthcare ecosystem, from diagnosis to treatment</h2>
            <p>
              iBam Health is a digital health platform redefining how people access healthcare
              by placing diagnostic services at the heart of the healthcare journey. We empower
              individuals to request laboratory investigations with ease, facilitating safe sample
              collection and transportation to accredited laboratories while ensuring timely access
              to accurate results.
            </p>
            <p>
              Built on the belief that informed healthcare begins with accurate diagnosis, iBam
              simplifies the process of connecting patients to the tests they need before guiding
              them to the right care. Users can also access virtual medical consultations and
              pharmacy services within the same seamless ecosystem, creating a connected healthcare
              experience from diagnosis to treatment.
            </p>
            <p>
              Driven by innovation, trust, and accessibility, iBam Health is committed to
              eliminating barriers to quality healthcare through technology. Our goal is to make
              healthcare more convenient, efficient, and patient-centred.
            </p>
          </div>
          <div className={`${s.aboutVisual} reveal`}>
            <Image
              src='/8.png'
              alt='iBam Health app'
              width={480}
              height={480}
              style={{ width: '100%', height: 'auto', borderRadius: 24 }}
            />
          </div>
        </div>
      </section>

      {/* ─── Vision & Mission ──────────────────────── */}
      <section className={s.vmSection}>
        <div className={s.vmInner}>
          <div className={`${s.vmCard} reveal`}>
            <span className={s.vmTag}>Vision</span>
            <h3>Africa&apos;s leading digital health ecosystem</h3>
            <p>
              To become Africa&apos;s leading digital health ecosystem, transforming healthcare through
              accessible diagnostics, connected care, and innovative technology that empowers
              healthier lives.
            </p>
          </div>
          <div className={`${s.vmCard} reveal`}>
            <span className={s.vmTag}>Mission</span>
            <h3>Simplifying access to quality healthcare</h3>
            <p>
              To simplify access to quality healthcare by delivering a seamless digital platform
              that connects people to trusted diagnostic services, healthcare professionals, and
              essential health solutions — making informed care more accessible, efficient, and
              patient-centred.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────── */}
      <section className={s.stats}>
        <div className={s.statsInner}>
          {STATS.map(st => (
            <div key={st.lbl} className={`${s.statCard} reveal`}>
              <span className={s.val}>{st.val}</span>
              <span className={s.lbl}>{st.lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── App showcase ──────────────────────────── */}
      <section className={s.appSection}>
        <div className={s.appInner}>
          <div className={`${s.appVisual} reveal`}>
            <Image
              src='/12.png'
              alt='iBam Health app icon'
              width={420}
              height={420}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <div className={`${s.appText} reveal`}>
            <span className={s.label}>Available Now</span>
            <h2>Healthcare in your pocket</h2>
            <p>
              From anywhere in Nigeria, iBam Health puts a verified doctor, a certified lab, and a
              licensed pharmacy one tap away. No waiting rooms, no repeat queues, no lost records.
            </p>
            <div className={s.appStore}>
              <Image
                src='/13.png'
                alt='Download iBam Health on the App Store'
                width={460}
                height={200}
                style={{ width: '100%', height: 'auto', borderRadius: 16 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Values ────────────────────────────────── */}
      <section className={s.values}>
        <div className={s.valuesInner}>
          <div className={`${s.sectionHeader} reveal`}>
            <span className={s.eyebrow}>What We Stand For</span>
            <h2>Our core values</h2>
            <p>
              Principles that guide every product decision, every hire, and every patient interaction.
            </p>
          </div>
          <div className={`${s.valuesGrid} reveal-stagger`}>
            {VALUES.map(v => (
              <div key={v.title} className={`${s.valueCard} reveal`}>
                <span className={s.icon}>{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team ──────────────────────────────────── */}
      <section className={s.team}>
        <div className={s.teamInner}>
          <div className={`${s.sectionHeader} reveal`}>
            <span className={s.eyebrow}>The Team</span>
            <h2>People behind the platform</h2>
            <p>
              Clinicians, engineers, and operators who&apos;ve spent their careers building for Africa.
            </p>
          </div>
          <div className={`${s.teamGrid} reveal-stagger`}>
            {TEAM.map(m => (
              <div key={m.name} className={`${s.teamCard} reveal`}>
                <div className={s.avatar}>{m.initials}</div>
                <h3>{m.name}</h3>
                <div className={s.role}>{m.role}</div>
                <div className={s.dept}>{m.dept}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </PageShell>
  )
}

import type { Metadata } from 'next'
import PageShell from '@/components/PageShell'
import s from './page.module.scss'
import {
  ShieldCheckIcon, GlobeIcon, BoltIcon, LightbulbIcon, LockIcon, HandshakeIcon,
  StethoscopeIcon, UserIcon,
} from '@/components/icons'

export const metadata: Metadata = {
  title: 'About — iBam Health',
  description:
    "Learn about iBam Health's mission to deliver accessible, quality healthcare to every Nigerian."
}

const STATS = [
  { val: '10K+', lbl: 'Registered Patients' },
  { val: '500+', lbl: 'Verified Physicians' },
  { val: '50+', lbl: 'Partner Facilities' },
  { val: '98.6%', lbl: 'Satisfaction Rate' }
]

const VALUES = [
  {
    icon: <ShieldCheckIcon size={28} />,
    title: 'Trust & Safety',
    desc: 'Every doctor is MDCN-verified. Every consultation is encrypted. Your health data is yours alone.'
  },
  {
    icon: <GlobeIcon size={28} />,
    title: 'Accessibility',
    desc: 'We believe quality healthcare is a right, not a privilege. Built to work on affordable data and basic devices.'
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
    desc: 'NDPR compliant. End-to-end encrypted. We never sell your data to insurers, pharma, or any third party.'
  },
  {
    icon: <HandshakeIcon size={28} />,
    title: 'Community Impact',
    desc: '10% of profits fund rural health outreach programmes across underserved communities in Nigeria.'
  }
]

const TEAM = [
  {
    initials: 'EO',
    name: 'Dr. Emeka Okonkwo',
    role: 'Chief Medical Officer',
    dept: 'Internal Medicine, University of Enugu'
  },
  {
    initials: 'ZB',
    name: 'Zainab Bello',
    role: 'CEO & Co-Founder',
    dept: 'Previously at Flutterwave, MIT Media Lab'
  },
  {
    initials: 'TA',
    name: 'Tunde Adeyemi',
    role: 'CTO',
    dept: 'Ex-Google, MSc Software Engineering'
  },
  {
    initials: 'FS',
    name: 'Dr. Fatima Suleiman',
    role: 'Head of Telemedicine',
    dept: 'OB-GYN, University of Abuja'
  },
  {
    initials: 'CO',
    name: 'Chidi Obi',
    role: 'Head of Diagnostics',
    dept: 'Clinical Pathologist, LUTH'
  },
  {
    initials: 'AM',
    name: 'Aisha Mohammed',
    role: 'VP Operations',
    dept: 'MBA, Enugu Business School'
  },
  {
    initials: 'SA',
    name: 'Seun Adeleke',
    role: 'Head of Product Design',
    dept: 'UX Lead, ex-Andela'
  },
  {
    initials: 'GE',
    name: 'Dr. Grace Eze',
    role: 'Medical Advisory Board',
    dept: 'Cardiology, University of Benin'
  }
]

export default function AboutPage () {
  return (
    <PageShell>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>Our Story</span>
          <h1>
            Built to fix Nigerian
            <br />
            healthcare, for real
          </h1>
          <p>
            iBam Health was born out of frustration — long queues, unavailable
            specialists, surprise bills, and fragmented records. We built the
            platform we wished existed.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className={s.mission}>
        <div className={s.missionInner}>
          <div className={`${s.missionText} reveal`}>
            <span className={s.label}>Our Mission</span>
            <h2>Bringing world-class care to your doorstep</h2>
            <p>
              Nigeria has over 200 million people but fewer than 40,000
              registered doctors — a ratio of roughly 1 doctor per 5,000
              patients. We can't fix the supply overnight, but we can radically
              improve the efficiency of every medical interaction.
            </p>
            <p>
              iBam Health uses technology to connect patients with available,
              verified physicians instantly — regardless of where they are in
              Nigeria. We handle the logistics of prescriptions, diagnostics,
              and pharmacy delivery so the doctor can focus on medicine.
            </p>
            <p>
              Our goal is simple: no Nigerian should suffer or die from a
              condition that could have been diagnosed and treated by a
              qualified doctor.
            </p>
          </div>
          <div className={`${s.missionStats} reveal-stagger`}>
            {STATS.map(st => (
              <div key={st.lbl} className={`${s.statCard} reveal`}>
                <span className={s.val}>{st.val}</span>
                <span className={s.lbl}>{st.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={s.values}>
        <div className={s.valuesInner}>
          <div className={`${s.sectionHeader} reveal`}>
            <span className={s.eyebrow}>What We Stand For</span>
            <h2>Our core values</h2>
            <p>
              Principles that guide every product decision, every hire, and
              every patient interaction.
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

      {/* Team */}
      <section className={s.team}>
        <div className={s.teamInner}>
          <div className={`${s.sectionHeader} reveal`}>
            <span className={s.eyebrow}>The Team</span>
            <h2>People behind the platform</h2>
            <p>
              Clinicians, engineers, and operators who've spent their careers
              building for Africa.
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

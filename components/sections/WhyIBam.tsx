import s from "./WhyIBam.module.scss";

const METRICS = [
  { label: "Doctor Verification Rate",  val: "100%",  pct: 100 },
  { label: "Consultation Satisfaction", val: "96.4%", pct: 96  },
  { label: "Prescription Accuracy",     val: "99.1%", pct: 99  },
  { label: "Lab Result On-Time",        val: "97.8%", pct: 98  },
];

const PILLARS = [
  { title: "Certified Doctors Only", desc: "Every physician is verified against the MDCN register before seeing any patient.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
  { title: "End-to-End Healthcare",   desc: "Prescriptions, diagnostics, pharmacy delivery, and follow-up — no handoffs, no gaps.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /> },
  { title: "Transparent Pricing",     desc: "Fees are shown upfront. Subscription plans for families and chronic care patients.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { title: "Military-Grade Security", desc: "End-to-end encrypted consultations. NDPR compliant. Your data is never sold.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
  { title: "Available 24 / 7",        desc: "Triage system and on-call physicians available round-the-clock, every day of the year.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { title: "Built for Nigeria",       desc: "Paystack, Termii OTPs, NHIS integration, and multilingual support — built for Nigerian healthcare.", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
];

export default function WhyIBam() {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={`${s.left} reveal`}>
          <span className={s.eyebrow}>Why iBam</span>
          <h2>Healthcare you can trust, built for Africa</h2>
          <p>Every feature at iBam Health is designed with patient safety and clinical integrity at its core.</p>

          <div className={s.scorecard}>
            {METRICS.map((m) => (
              <div key={m.label}>
                <div className={s.metric}>
                  <span className={s.metricLabel}>{m.label}</span>
                  <span className={s.metricVal}>{m.val}</span>
                </div>
                <div className={s.metricBar}>
                  <div className={s.metricFill} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${s.pillars} reveal-stagger`}>
          {PILLARS.map((p) => (
            <div key={p.title} className={`${s.pillar} reveal`}>
              <div className={s.iconBox}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">{p.icon}</svg>
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

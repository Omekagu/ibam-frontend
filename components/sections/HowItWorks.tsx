import s from "./HowItWorks.module.scss";

const STEPS = [
  {
    num: "01",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
    title: "Complete Smart Triage",
    desc: "Answer clinically validated symptom questions. Our system classifies severity — Green, Yellow, or Red — and routes you to the right doctor, instantly.",
    note: "Under 3 minutes",
  },
  {
    num: "02",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.845V15.5a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    title: "Consult a Certified Doctor",
    desc: "Video, audio, or chat with a verified, FMOH-registered physician. Book scheduled or connect on-demand for urgent cases.",
    note: "Video · Audio · Chat",
  },
  {
    num: "03",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
    title: "Prescription & Lab Tests",
    desc: "Get a tamper-proof digital e-prescription instantly. Order lab tests with home collection by a certified field agent. Results uploaded to your record.",
    note: "Home collection available",
  },
  {
    num: "04",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
    title: "Medication Delivered",
    desc: "Your prescription goes straight to a partner pharmacy. Choose doorstep delivery or walk-in pickup. Track every step of the order in real time.",
    note: "Delivered in 2–4 hours",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <span className={s.eyebrow}>How It Works</span>
          <h2>End-to-end care in four steps</h2>
          <p>From your first symptom to your final prescription — iBam Health handles every step of your healthcare journey, seamlessly and securely.</p>
        </div>

        <div className={`${s.grid} reveal-stagger`}>
          {STEPS.map((step) => (
            <div key={step.num} className={`${s.card} reveal`}>
              <div className={s.top}>
                <div className={s.iconWrap}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">{step.icon}</svg>
                </div>
                <span className={s.num}>{step.num}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <span className={s.note}>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {step.note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

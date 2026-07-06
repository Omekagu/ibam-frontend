import Link from "next/link";
import s from "./ForDoctors.module.scss";

const FREELANCE_FEATURES = [
  "Set your own hours & consultation fees",
  "Earnings dashboard with payout requests",
  "Digital tools: e-prescriptions, notes, lab orders",
  "Malpractice & MDCN verification support",
  "Marketing: your public profile on iBam",
];

const HOSPITAL_FEATURES = [
  "Multi-doctor staff management panel",
  "Branded patient experience",
  "EMR integration & patient history access",
  "Revenue sharing & consolidated billing",
  "Priority listing in the facility directory",
];

function CheckGreen() {
  return (
    <svg className={s.checkGreen} width={16} height={16} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

function CheckNavy() {
  return (
    <svg className={s.checkNavy} width={16} height={16} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export default function ForDoctors() {
  return (
    <section className={s.section} id="for-doctors">
      <div className={s.inner}>

        <div className={`${s.header} reveal`}>
          <span className={s.eyebrow}>For Healthcare Professionals</span>
          <h2>Practise on your terms</h2>
          <p>
            Whether you&apos;re a freelance consultant or part of a hospital system, iBam Health
            gives you the infrastructure to deliver great care efficiently.
          </p>
        </div>

        <div className={s.grid}>

          {/* Freelance card */}
          <div className={`${s.cardGreen} reveal`}>
            <div className={s.tag}>
              <svg width={12} height={12} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              </svg>
              Independent Practice
            </div>

            <h3>Join as a Freelance Doctor</h3>
            <p>
              Set your own schedule, define your consultation rates, and see patients from anywhere.
              Get paid directly through the platform with full earnings transparency.
            </p>

            <ul className={s.featureList}>
              {FREELANCE_FEATURES.map((f) => (
                <li key={f}>
                  <CheckGreen />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/signup?role=doctor" className={s.btnWhite}>
              Apply as a Doctor <ArrowRight />
            </Link>
          </div>

          {/* Hospital card */}
          <div className={`${s.cardNavy} reveal`}>
            <div className={s.tag}>
              <svg width={12} height={12} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              Hospital Partnership
            </div>

            <h3>Hospital &amp; Clinic Integration</h3>
            <p>
              Onboard your clinical staff to the iBam platform and expand your hospital&apos;s digital
              reach. Manage employed doctors, patient queues, and telemedicine from one dashboard.
            </p>

            <ul className={s.featureList}>
              {HOSPITAL_FEATURES.map((f) => (
                <li key={f}>
                  <CheckNavy />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/partners" className={s.btnOutlineWhite}>
              Partner With Us <ArrowRight />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

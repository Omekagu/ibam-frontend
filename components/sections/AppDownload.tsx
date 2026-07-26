import Link from "next/link";
import s from "./AppDownload.module.scss";
import { StethoscopeIcon, MicroscopeIcon, PillIcon, HeartPulseIcon, VideoCameraIcon } from "@/components/icons";

const FEATURES = [
  "Secure biometric login",
  "Push notifications for appointments & results",
  "Offline access to your health records",
  "In-app video & audio consultations",
];

function CheckIcon() {
  return (
    <svg className={s.check} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

export default function AppDownload() {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={s.card}>

          {/* Left copy */}
          <div className={`${s.copy} reveal`}>
            <span className={s.eyebrow}>Mobile App</span>
            <h2>Take your health<br />with you everywhere</h2>
            <p>
              The iBam Health app puts your complete medical record, consultation history,
              prescriptions, and lab results in your pocket. Book appointments, track orders,
              and get notified — all from your phone.
            </p>

            <ul className={s.featureList}>
              {FEATURES.map((f) => (
                <li key={f}>
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <div className={s.storeButtons}>
              <Link href="#" className={s.storeBtn}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div className={s.storeMeta}>
                  <span className={s.storeLabel}>Download on the</span>
                  <span className={s.storeName}>App Store</span>
                </div>
              </Link>

              <Link href="#" className={s.storeBtn}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.19l12.6-7.26-2.69-2.7-10.9 9.77zm-.96-20.4a1.56 1.56 0 00-.22.83v19.62c0 .3.07.57.22.82l.07.07 10.99-10.99v-.26L2.29 3.29l-.07.07zM20.54 10.8l-2.82-1.63-3.01 3.01 3.01 3.01 2.83-1.63c.81-.47.81-1.23 0-1.76zm-17.36 12.96l12.6-7.26-2.69-2.69-9.91 9.95z" />
                </svg>
                <div className={s.storeMeta}>
                  <span className={s.storeLabel}>Get it on</span>
                  <span className={s.storeName}>Google Play</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Right phone mockup */}
          <div className={s.phoneSide}>
            <div className={s.phone}>
              <div className={s.phoneStatus}>
                <span className={s.time}>9:41</span>
                <div className={s.dots}>
                  <div className={s.dot} />
                  <div className={s.dot} />
                  <div className={s.dot} />
                </div>
              </div>

              <div className={s.phoneCard}>
                <p className={s.greeting}>Good morning</p>
                <p className={s.sub}>John Doe</p>
                <div className={s.scoreRow}>
                  <div>
                    <div className={s.scoreLabel}>Health Score</div>
                    <div className={s.scoreVal}>86 / 100</div>
                  </div>
                  <span className={s.heart}><HeartPulseIcon size={18} /></span>
                </div>
              </div>

              <div className={s.phoneGrid}>
                {[
                  { label: 'Doctor',    icon: <StethoscopeIcon size={14} /> },
                  { label: 'Lab Test',  icon: <MicroscopeIcon size={14} /> },
                  { label: 'Pharmacy',  icon: <PillIcon size={14} /> },
                ].map((item) => (
                  <div key={item.label} className={s.phoneGridItem} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{item.icon} {item.label}</div>
                ))}
              </div>

              <div className={s.phoneAppt}>
                <div className={s.apptTitle}>Next Appointment</div>
                <div className={s.apptRow}>
                  <div className={s.apptAvatar}><VideoCameraIcon size={16} /></div>
                  <div>
                    <div className={s.apptName}>Dr. Amara Nwosu</div>
                    <div className={s.apptTime}>Tomorrow · 10:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

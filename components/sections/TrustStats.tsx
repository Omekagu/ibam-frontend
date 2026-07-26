import s from "./TrustStats.module.scss";
import {
  UsersIcon, StethoscopeIcon, StarFilledIcon, MicroscopeIcon,
  HospitalIcon, CheckCircleIcon,
} from "@/components/icons";

const STATS = [
  { icon: <UsersIcon size={28} />,       value: "10,000+", label: "Registered Patients" },
  { icon: <StethoscopeIcon size={28} />, value: "500+",    label: "Verified Physicians" },
  { icon: <StarFilledIcon size={28} />,  value: "98.6%",   label: "Patient Satisfaction" },
  { icon: <MicroscopeIcon size={28} />,  value: "24 hrs",  label: "Lab Result Turnaround" },
  { icon: <HospitalIcon size={28} />,    value: "50+",     label: "Partner Facilities" },
  { icon: <CheckCircleIcon size={28} />, value: "₦0",      label: "Hidden Fees" },
];

export default function TrustStats() {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <h2>Trusted by thousands across Nigeria</h2>
          <p>Numbers that reflect our commitment to quality, safety, and accessibility</p>
        </div>
        <div className={`${s.grid} reveal-stagger`}>
          {STATS.map((st) => (
            <div key={st.label} className={`${s.stat} reveal`}>
              <span className={s.icon} style={{ display: 'flex', justifyContent: 'center' }}>{st.icon}</span>
              <span className={s.value}>{st.value}</span>
              <span className={s.label}>{st.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

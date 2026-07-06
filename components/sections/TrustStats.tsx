import s from "./TrustStats.module.scss";

const STATS = [
  { icon: "👥", value: "10,000+", label: "Registered Patients" },
  { icon: "🩺", value: "500+",    label: "Verified Physicians" },
  { icon: "⭐", value: "98.6%",   label: "Patient Satisfaction" },
  { icon: "🔬", value: "24 hrs",  label: "Lab Result Turnaround" },
  { icon: "🏥", value: "50+",     label: "Partner Facilities" },
  { icon: "✅", value: "₦0",      label: "Hidden Fees" },
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
              <span className={s.icon}>{st.icon}</span>
              <span className={s.value}>{st.value}</span>
              <span className={s.label}>{st.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

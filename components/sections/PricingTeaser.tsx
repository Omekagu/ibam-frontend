import Link from "next/link";
import s from "./PricingTeaser.module.scss";

const PLANS = [
  {
    name: "Free",
    badge: "Get Started",
    price: "₦0",
    period: "forever",
    featured: false,
    features: [
      { label: "Smart symptom triage",     included: true  },
      { label: "1 consultation / month",   included: true  },
      { label: "Basic health profile",     included: true  },
      { label: "Unlimited consultations",  included: false },
      { label: "E-prescriptions & labs",   included: false },
      { label: "Family accounts",          included: false },
    ],
    cta: "Start Free",
    href: "/signup",
  },
  {
    name: "Personal",
    badge: "Most Popular",
    price: "₦2,500",
    period: "/ month",
    featured: true,
    features: [
      { label: "Smart symptom triage",     included: true },
      { label: "Unlimited consultations",  included: true },
      { label: "E-prescriptions & labs",   included: true },
      { label: "Pharmacy delivery",        included: true },
      { label: "Health record storage",    included: true },
      { label: "Family accounts",          included: false },
    ],
    cta: "Get Personal",
    href: "/signup?plan=personal",
  },
  {
    name: "Family",
    badge: "Best Value",
    price: "₦5,000",
    period: "/ month",
    featured: false,
    features: [
      { label: "Smart symptom triage",     included: true },
      { label: "Unlimited consultations",  included: true },
      { label: "E-prescriptions & labs",   included: true },
      { label: "Pharmacy delivery",        included: true },
      { label: "Up to 6 family members",   included: true },
      { label: "Priority booking",         included: true },
    ],
    cta: "Get Family",
    href: "/signup?plan=family",
  },
];

function CheckIcon() {
  return (
    <svg className={s.featureCheck} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className={s.featureCross} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );
}

export default function PricingTeaser() {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <span className={s.eyebrow}>Pricing</span>
          <h2>Simple, transparent plans</h2>
          <p>No hidden fees. No surprise bills. Cancel anytime.</p>
        </div>

        <div className={`${s.grid} reveal-stagger`}>
          {PLANS.map((plan) => (
            <div key={plan.name} className={`${s.card} ${plan.featured ? s.featured : ""} reveal`}>
              <span className={s.badge}>{plan.badge}</span>
              <div className={s.planName}>{plan.name}</div>
              <div className={s.price}>
                <sub>{ }</sub>{plan.price}
              </div>
              <div className={s.period}>{plan.period}</div>
              <hr className={s.divider} />
              <ul className={s.featureList}>
                {plan.features.map((f) => (
                  <li key={f.label} className={s.feature}>
                    {f.included ? <CheckIcon /> : <CrossIcon />}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={s.planCta}>{plan.cta}</Link>
            </div>
          ))}
        </div>

        <div className={s.viewAll}>
          <Link href="/pricing">
            View full plan comparison →
          </Link>
        </div>
      </div>
    </section>
  );
}

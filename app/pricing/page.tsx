import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import FAQ from "@/components/sections/FAQ";
import s from "./page.module.scss";

export const metadata: Metadata = {
  title: "Pricing — iBam Health",
  description: "Simple, transparent pricing. Choose the plan that works for you.",
};

const PLANS = [
  {
    name: "Free",
    price: "₦0",
    period: "forever",
    featured: false,
    features: [
      { label: "Smart symptom triage",         yes: true  },
      { label: "1 consultation per month",      yes: true  },
      { label: "Basic health profile",          yes: true  },
      { label: "Unlimited consultations",       yes: false },
      { label: "E-prescriptions",               yes: false },
      { label: "Lab test ordering",             yes: false },
      { label: "Pharmacy delivery",             yes: false },
      { label: "Family accounts",               yes: false },
      { label: "Priority booking",              yes: false },
      { label: "24/7 on-call support",          yes: false },
    ],
    cta: "Get Started Free",
    href: "/signup",
  },
  {
    name: "Personal",
    price: "₦2,500",
    period: "/ month",
    featured: true,
    features: [
      { label: "Smart symptom triage",         yes: true  },
      { label: "Unlimited consultations",      yes: true  },
      { label: "E-prescriptions",              yes: true  },
      { label: "Lab test ordering",            yes: true  },
      { label: "Pharmacy delivery",            yes: true  },
      { label: "Full health record storage",   yes: true  },
      { label: "Prescription history",         yes: true  },
      { label: "Family accounts",              yes: false },
      { label: "Priority booking",             yes: false },
      { label: "24/7 on-call support",         yes: false },
    ],
    cta: "Get Personal",
    href: "/signup?plan=personal",
  },
  {
    name: "Family",
    price: "₦5,000",
    period: "/ month",
    featured: false,
    features: [
      { label: "Smart symptom triage",         yes: true },
      { label: "Unlimited consultations",      yes: true },
      { label: "E-prescriptions",              yes: true },
      { label: "Lab test ordering",            yes: true },
      { label: "Pharmacy delivery",            yes: true },
      { label: "Full health record storage",   yes: true },
      { label: "Up to 6 family members",       yes: true },
      { label: "Priority booking",             yes: true },
      { label: "24/7 on-call support",         yes: true },
      { label: "Dedicated care manager",       yes: false },
    ],
    cta: "Get Family",
    href: "/signup?plan=family",
  },
  {
    name: "Corporate",
    price: "Custom",
    period: "contact us",
    featured: false,
    features: [
      { label: "Smart symptom triage",         yes: true },
      { label: "Unlimited consultations",      yes: true },
      { label: "E-prescriptions",              yes: true },
      { label: "Lab test ordering",            yes: true },
      { label: "Pharmacy delivery",            yes: true },
      { label: "Full health record storage",   yes: true },
      { label: "Unlimited employee accounts",  yes: true },
      { label: "Priority booking",             yes: true },
      { label: "24/7 on-call support",         yes: true },
      { label: "Dedicated care manager",       yes: true },
    ],
    cta: "Contact Sales",
    href: "/contact",
  },
];

const TABLE_ROWS = [
  { label: "Monthly price",            vals: ["₦0", "₦2,500", "₦5,000", "Custom"] },
  { label: "Consultations",            vals: ["1/mo", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Family members",           vals: ["–", "1", "Up to 6", "Unlimited"] },
  { label: "E-prescriptions",          vals: ["–", "✓", "✓", "✓"] },
  { label: "Lab test ordering",        vals: ["–", "✓", "✓", "✓"] },
  { label: "Pharmacy delivery",        vals: ["–", "✓", "✓", "✓"] },
  { label: "Priority booking",         vals: ["–", "–", "✓", "✓"] },
  { label: "24/7 on-call support",     vals: ["–", "–", "✓", "✓"] },
  { label: "Dedicated care manager",   vals: ["–", "–", "–", "✓"] },
  { label: "NHIS/HMO billing",         vals: ["–", "–", "–", "✓"] },
];

function CheckIcon({ yes }: { yes: boolean }) {
  if (yes) {
    return (
      <svg className={s.check} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className={s.cross} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>Pricing</span>
          <h1>Honest pricing.<br />No surprises.</h1>
          <p>Start free. Upgrade when you need more. Cancel anytime.</p>
        </div>
      </section>

      <section className={s.plans}>
        <div className={s.plansInner}>
          <div className={`${s.grid} reveal-stagger`}>
            {PLANS.map((plan) => (
              <div key={plan.name} className={`${s.card} ${plan.featured ? s.featured : ""} reveal`}>
                <div className={s.planName}>{plan.name}</div>
                <div className={s.price}>{plan.price}</div>
                <div className={s.period}>{plan.period}</div>
                <hr className={s.divider} />
                <ul className={s.featureList}>
                  {plan.features.map((f) => (
                    <li key={f.label} className={s.featureItem}>
                      <CheckIcon yes={f.yes} />
                      <span className={s.featureName}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={s.cta}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.compare}>
        <div className={s.compareInner}>
          <div className={`${s.sectionHeader} reveal`}>
            <h2>Full comparison</h2>
          </div>
          <div className="reveal" style={{ overflowX: "auto" }}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free</th>
                  <th className={s.highlight}>Personal</th>
                  <th>Family</th>
                  <th>Corporate</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className={s.rowLabel}>{row.label}</td>
                    {row.vals.map((v, i) => (
                      <td key={i} className={v === "✓" ? s.yes : v === "–" ? s.no : ""}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FAQ limit={5} />
    </PageShell>
  );
}

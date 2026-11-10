import Link from "next/link";
import s from "./PricingTeaser.module.scss";

interface WellnessPackage {
  _id: string;
  name: string;
  slug: string;
  includedTests: string[];
  walkInPrice: number;
  homeVisitPrice: number;
  gender: "male" | "female" | "all";
}

async function fetchPackages(): Promise<WellnessPackage[]> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://api.ibamhealth.com/api";
    const res = await fetch(`${base}/admin/public/content`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const body = await res.json();
    return (body?.data?.wellnessPackages ?? []) as WellnessPackage[];
  } catch {
    return [];
  }
}

function genderBadge(gender: string) {
  if (gender === "male") return "For Men";
  if (gender === "female") return "For Women";
  return "For Everyone";
}

function CheckIcon() {
  return (
    <svg className={s.featureCheck} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

export default async function PricingTeaser() {
  const packages = await fetchPackages();
  const preview = packages.slice(0, 3);

  if (preview.length === 0) return null;

  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <span className={s.eyebrow}>Wellness Packages</span>
          <h2>Comprehensive health checks</h2>
          <p>All-inclusive diagnostic packages with walk-in and home visit collection options.</p>
        </div>

        <div className={`${s.grid} reveal-stagger`}>
          {preview.map((pkg) => (
            <div key={pkg._id} className={`${s.card} reveal`}>
              <span className={s.badge}>{genderBadge(pkg.gender)}</span>
              <div className={s.planName}>{pkg.name}</div>
              <div className={s.price}>
                ₦{pkg.walkInPrice.toLocaleString("en-NG")}
              </div>
              <div className={s.period}>
                walk-in · home visit ₦{pkg.homeVisitPrice.toLocaleString("en-NG")}
              </div>
              <hr className={s.divider} />
              <ul className={s.featureList}>
                {pkg.includedTests.slice(0, 5).map((test) => (
                  <li key={test} className={s.feature}>
                    <CheckIcon />
                    {test}
                  </li>
                ))}
                {pkg.includedTests.length > 5 && (
                  <li className={s.feature}>
                    <CheckIcon />
                    +{pkg.includedTests.length - 5} more tests
                  </li>
                )}
              </ul>
              <Link href={`/diagnostics?package=${pkg.slug}`} className={s.planCta}>
                Book Package
              </Link>
            </div>
          ))}
        </div>

        <div className={s.viewAll}>
          <Link href="/pricing">
            View all wellness packages →
          </Link>
        </div>
      </div>
    </section>
  );
}

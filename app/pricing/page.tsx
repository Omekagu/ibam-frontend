import type { Metadata } from 'next'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import FAQ from '@/components/sections/FAQ'
import s from './page.module.scss'

export const metadata: Metadata = {
  title: 'Pricing — iBam Health',
  description:
    'Comprehensive wellness packages with transparent pricing. Walk-in and home visit collection options available.'
}

interface WellnessPackage {
  _id: string
  name: string
  slug: string
  targetAudience: string
  includedTests: string[]
  walkInPrice: number
  homeVisitPrice: number
  gender: 'male' | 'female' | 'all'
}

async function fetchPackages(): Promise<WellnessPackage[]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
    const res = await fetch(`${base}/admin/public/content`, {
      next: { revalidate: 300 }
    })
    if (!res.ok) return []
    const body = await res.json()
    return (body?.data?.wellnessPackages ?? []) as WellnessPackage[]
  } catch {
    return []
  }
}

function genderLabel(gender: string) {
  if (gender === 'male') return 'For Men'
  if (gender === 'female') return 'For Women'
  return 'For Everyone'
}

function CheckIcon() {
  return (
    <svg className={s.check} viewBox='0 0 20 20' fill='currentColor'>
      <path
        fillRule='evenodd'
        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
        clipRule='evenodd'
      />
    </svg>
  )
}

export default async function PricingPage() {
  const packages = await fetchPackages()

  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>Pricing</span>
          <h1>
            Honest pricing.
            <br />
            No surprises.
          </h1>
          <p>Comprehensive wellness packages. Walk-in or home visit collection. No hidden fees.</p>
        </div>
      </section>

      <section className={s.plans}>
        <div className={s.plansInner}>
          <div className={`${s.grid} reveal-stagger`}>
            {packages.map(pkg => (
              <div key={pkg._id} className={`${s.card} reveal`}>
                <span className={s.packageBadge}>{genderLabel(pkg.gender)}</span>
                <div className={s.planName}>{pkg.name}</div>
                <div className={s.price}>
                  ₦{pkg.walkInPrice.toLocaleString('en-NG')}
                </div>
                <div className={s.period}>walk-in collection</div>
                {pkg.homeVisitPrice > 0 && (
                  <div className={s.homeVisit}>
                    Home visit: ₦{pkg.homeVisitPrice.toLocaleString('en-NG')}
                  </div>
                )}
                {pkg.targetAudience && (
                  <p className={s.planDesc}>{pkg.targetAudience}</p>
                )}
                <hr className={s.divider} />
                <ul className={s.featureList}>
                  {pkg.includedTests.map(test => (
                    <li key={test} className={s.featureItem}>
                      <CheckIcon />
                      <span className={s.featureName}>{test}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/diagnostics?package=${pkg.slug}`} className={s.cta}>
                  Book Package
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ limit={5} />
    </PageShell>
  )
}

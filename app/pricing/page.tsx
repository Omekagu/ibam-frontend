import type { Metadata } from 'next'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import FAQ from '@/components/sections/FAQ'
import s from './page.module.scss'

export const metadata: Metadata = {
  title: 'Pricing — iBam Health',
  description:
    'Simple, transparent pricing. Choose the plan that works for you.'
}

interface Plan {
  _id: string
  name: string
  description: string
  price: number
  interval: string
  features: string[]
  featured: boolean
}

async function fetchPlans (): Promise<Plan[]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://10.59.157.88:5000/api'
    const res = await fetch(`${base}/admin/public/content`, {
      next: { revalidate: 300 }
    })
    if (!res.ok) return []
    const body = await res.json()
    return (body?.data?.plans ?? []) as Plan[]
  } catch {
    return []
  }
}

function formatPrice (price: number, name: string) {
  if (name.toLowerCase() === 'corporate' && price === 0) return 'Custom'
  if (price === 0) return '₦0'
  return `₦${price.toLocaleString('en-NG')}`
}

function formatPeriod (price: number, interval: string, name: string) {
  if (name.toLowerCase() === 'corporate' && price === 0) return 'contact us'
  if (price === 0) return 'forever'
  return interval === 'yearly' ? '/ year' : '/ month'
}

function planCta (name: string) {
  const lower = name.toLowerCase()
  if (lower === 'free') return { label: 'Get Started Free', href: '/signup' }
  if (lower === 'corporate') return { label: 'Contact Sales', href: '/contact' }
  return { label: `Get ${name}`, href: `/signup?plan=${lower}` }
}

function CheckIcon ({ yes }: { yes: boolean }) {
  if (yes) {
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
  return (
    <svg className={s.cross} viewBox='0 0 20 20' fill='currentColor'>
      <path
        fillRule='evenodd'
        d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z'
        clipRule='evenodd'
      />
    </svg>
  )
}

const TABLE_ROWS = [
  { label: 'Monthly price', vals: ['₦0', '₦2,500', '₦5,000', 'Custom'] },
  {
    label: 'Consultations',
    vals: ['1/mo', 'Unlimited', 'Unlimited', 'Unlimited']
  },
  { label: 'Family members', vals: ['–', '1', 'Up to 6', 'Unlimited'] },
  { label: 'E-prescriptions', vals: ['–', '✓', '✓', '✓'] },
  { label: 'Lab test ordering', vals: ['–', '✓', '✓', '✓'] },
  { label: 'Pharmacy delivery', vals: ['–', '✓', '✓', '✓'] },
  { label: 'Priority booking', vals: ['–', '–', '✓', '✓'] },
  { label: '24/7 on-call support', vals: ['–', '–', '✓', '✓'] },
  { label: 'Dedicated care manager', vals: ['–', '–', '–', '✓'] },
  { label: 'NHIS/HMO billing', vals: ['–', '–', '–', '✓'] }
]

export default async function PricingPage () {
  const plans = await fetchPlans()

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
          <p>Start free. Upgrade when you need more. Cancel anytime.</p>
        </div>
      </section>

      <section className={s.plans}>
        <div className={s.plansInner}>
          <div className={`${s.grid} reveal-stagger`}>
            {plans.map(plan => {
              const { label, href } = planCta(plan.name)
              return (
                <div
                  key={plan._id}
                  className={`${s.card} ${
                    plan.featured ? s.featured : ''
                  } reveal`}
                >
                  <div className={s.planName}>{plan.name}</div>
                  <div className={s.price}>
                    {formatPrice(plan.price, plan.name)}
                  </div>
                  <div className={s.period}>
                    {formatPeriod(plan.price, plan.interval, plan.name)}
                  </div>
                  {plan.description && (
                    <p className={s.planDesc}>{plan.description}</p>
                  )}
                  <hr className={s.divider} />
                  <ul className={s.featureList}>
                    {plan.features.map(f => (
                      <li key={f} className={s.featureItem}>
                        <CheckIcon yes />
                        <span className={s.featureName}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className={s.cta}>
                    {label}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className={s.compare}>
        <div className={s.compareInner}>
          <div className={`${s.sectionHeader} reveal`}>
            <h2>Full comparison</h2>
          </div>
          <div className='reveal' style={{ overflowX: 'auto' }}>
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
                {TABLE_ROWS.map(row => (
                  <tr key={row.label}>
                    <td className={s.rowLabel}>{row.label}</td>
                    {row.vals.map((v, i) => (
                      <td
                        key={i}
                        className={v === '✓' ? s.yes : v === '–' ? s.no : ''}
                      >
                        {v}
                      </td>
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
  )
}

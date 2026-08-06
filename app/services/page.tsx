import type { ReactElement } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import PageShell from '@/components/PageShell'
import s from './page.module.scss'
import {
  VideoCameraIcon,
  BoltIcon,
  MicroscopeIcon,
  PillIcon,
  HospitalIcon,
  TruckIcon
} from '@/components/icons'

export const metadata: Metadata = {
  title: 'Services — iBam Health',
  description:
    'Telemedicine, diagnostics, e-prescriptions, pharmacy delivery and more — all in one platform.'
}

interface PlatformService {
  _id: string
  iconName: string
  tagLabel: string
  title: string
  description: string
  steps: string[]
  visualLabel: string
  visualSub: string
  cta: string
  ctaHref: string
}

type IconSize = { size: number }
const ICON_MAP: Record<string, (p: IconSize) => ReactElement> = {
  video: p => <VideoCameraIcon {...p} />,
  ai: p => <BoltIcon {...p} />,
  lab: p => <MicroscopeIcon {...p} />,
  pharmacy: p => <PillIcon {...p} />,
  hospital: p => <HospitalIcon {...p} />,
  truck: p => <TruckIcon {...p} />
}

function getIcon (name: string, size: number) {
  const fn = ICON_MAP[name] ?? ICON_MAP['video']
  return fn({ size })
}

async function fetchServices (): Promise<PlatformService[]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://10.59.157.88:5000/api'
    const res = await fetch(`${base}/admin/public/content`, {
      next: { revalidate: 300 }
    })
    if (!res.ok) return []
    const body = await res.json()
    return (body?.data?.services ?? []) as PlatformService[]
  } catch {
    return []
  }
}

export default async function ServicesPage () {
  const services = await fetchServices()

  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>What We Offer</span>
          <h1>
            Complete healthcare,
            <br />
            one platform
          </h1>
          <p>
            From your first symptom to your last follow-up — consultations,
            diagnostics, prescriptions, and delivery, all connected.
          </p>
        </div>
      </section>

      <section className={s.services}>
        <div className={s.inner}>
          {services.map(svc => (
            <div key={svc._id} className={s.service}>
              <div className={`${s.serviceText} reveal`}>
                <div className={s.tag}>
                  <span>{getIcon(svc.iconName, 16)}</span>
                  {svc.tagLabel}
                </div>
                <h2>{svc.title}</h2>
                <p>{svc.description}</p>
                <ol className={s.steps}>
                  {svc.steps.map((step, i) => (
                    <li key={i}>
                      <span className={s.num}>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Link href={svc.ctaHref} className={s.cta}>
                  {svc.cta} →
                </Link>
              </div>
              <div className={`${s.serviceVisual} reveal`}>
                <div className={s.visualIcon}>{getIcon(svc.iconName, 64)}</div>
                <div className={s.visualLabel}>{svc.visualLabel}</div>
                <div className={s.visualSub}>{svc.visualSub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}

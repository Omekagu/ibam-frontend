import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import s from './legal.module.scss';

export const metadata: Metadata = {
  title: 'Legal — iBam Health',
};

const DOCS = [
  { href: '/legal/terms',               label: 'Terms & Conditions' },
  { href: '/legal/privacy',             label: 'Privacy Policy' },
  { href: '/legal/refund',              label: 'Refund & Cancellation Policy' },
  { href: '/legal/medical-disclaimer',  label: 'Medical Disclaimer' },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <div className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>Legal</span>
          <h1>Policies & Terms</h1>
          <p>iBam Health is committed to transparency, data privacy, and the highest standard of patient care.</p>
        </div>
      </div>

      <div className={s.layout}>
        <aside className={s.sidebar}>
          <p className={s.sidebarHeading}>Documents</p>
          <nav>
            {DOCS.map(d => (
              <Link key={d.href} href={d.href} className={s.sidebarLink}>
                {d.label}
              </Link>
            ))}
          </nav>
          <div className={s.sidebarContact}>
            <p className={s.sidebarContactTitle}>Questions?</p>
            <a href="mailto:legal@ibamhealth.com">legal@ibamhealth.com</a>
          </div>
        </aside>

        <main className={s.content}>
          {children}
        </main>
      </div>
    </PageShell>
  );
}

import type { Metadata } from 'next'
import PageShell from '@/components/PageShell'
import s from './page.module.scss'

export const metadata: Metadata = {
  title: 'Contact — iBam Health',
  description: 'Get in touch with the iBam Health team.'
}

const INFO = [
  {
    icon: '📧',
    title: 'Email Us',
    body: 'support@ibamhealth.ng\npartners@ibamhealth.ng'
  },
  {
    icon: '📞',
    title: 'Call Us',
    body: '+234 700 IBAM HEALTH\nMon–Fri, 8 AM – 8 PM'
  },
  {
    icon: '📍',
    title: 'Head Office',
    body: '14 Adeola Odeku Street\nVictoria Island, Enugu'
  },
  {
    icon: '💬',
    title: 'Live Chat',
    body: 'Available in the app 24/7\nAverage response: < 3 minutes'
  }
]

export default function ContactPage () {
  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>Contact Us</span>
          <h1>We&apos;re here to help</h1>
          <p>
            Questions, partnerships, media enquiries, or just feedback — we read
            every message.
          </p>
        </div>
      </section>

      <section className={s.body}>
        <div className={s.bodyInner}>
          <div className={`${s.info} reveal-stagger`}>
            {INFO.map(item => (
              <div key={item.title} className={`${s.infoCard} reveal`}>
                <div className={s.iconWrap}>{item.icon}</div>
                <div>
                  <h4>{item.title}</h4>
                  <p style={{ whiteSpace: 'pre-line' }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`${s.form} reveal`}>
            <h3>Send us a message</h3>
            <p className={s.sub}>
              We&apos;ll get back to you within one business day.
            </p>

            <form>
              <div className={s.row}>
                <div className={s.field}>
                  <label htmlFor='fname'>First Name</label>
                  <input id='fname' type='text' placeholder='Emeka' />
                </div>
                <div className={s.field}>
                  <label htmlFor='lname'>Last Name</label>
                  <input id='lname' type='text' placeholder='Okonkwo' />
                </div>
              </div>

              <div className={s.field}>
                <label htmlFor='email'>Email Address</label>
                <input
                  id='email'
                  type='email'
                  placeholder='emeka@example.com'
                />
              </div>

              <div className={s.field}>
                <label htmlFor='subject'>Subject</label>
                <select id='subject'>
                  <option value=''>Select a topic</option>
                  <option>General Enquiry</option>
                  <option>Technical Support</option>
                  <option>Doctor Partnership</option>
                  <option>Hospital / Clinic Partnership</option>
                  <option>Media / Press</option>
                  <option>Billing</option>
                  <option>Other</option>
                </select>
              </div>

              <div className={s.field}>
                <label htmlFor='message'>Message</label>
                <textarea id='message' placeholder='Tell us how we can help…' />
              </div>

              <button type='submit' className={s.submit}>
                Send Message →
              </button>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

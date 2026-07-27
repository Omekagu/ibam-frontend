import s from './Services.module.scss'

const SERVICES = [
  {
    color: '#0A8F6C',
    glow: 'rgba(10,143,108,0.08)',
    title: 'Telemedicine',
    desc: 'Consult FMOH-registered doctors via HD video, audio, or encrypted chat — from your phone or browser.',
    features: [
      'Video · Audio · Chat',
      'Scheduled & on-demand',
      'Consultation notes'
    ],
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M15 10l4.553-2.069A1 1 0 0121 8.845V15.5a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
      />
    )
  },
  {
    color: '#7C3AED',
    glow: 'rgba(124,58,237,0.08)',
    title: 'Smart Triage',
    desc: 'Clinically validated symptom assessment that classifies severity in under 3 minutes and routes you to the right care.',
    features: [
      'Green / Yellow / Red',
      'Clinically validated',
      'Instant classification'
    ],
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
      />
    )
  },
  {
    color: '#0891B2',
    glow: 'rgba(8,145,178,0.08)',
    title: 'Diagnostics',
    desc: 'Request lab tests from labs. Choose walk-in or home sample collection by a certified field agent.',
    features: ['Home collection', 'Partnered labs', 'Digital results'],
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
      />
    )
  },
  {
    color: '#2563EB',
    glow: 'rgba(37,99,235,0.08)',
    title: 'E-Prescriptions',
    desc: 'Receive tamper-proof digital prescriptions instantly after your consultation, auto-forwarded to partner pharmacies.',
    features: ['Digitally signed', 'Sent to pharmacy', 'PDF download'],
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    )
  },
  {
    color: '#D97706',
    glow: 'rgba(217,119,6,0.08)',
    title: 'Pharmacy Delivery',
    desc: 'Order from trusted partner pharmacies with doorstep delivery or pickup. Real-time tracking included.',
    features: ['2–4 hr delivery', 'Verified pharmacies', 'Live tracking'],
    icon: (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.5}
        d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
      />
    )
  },
  {
    color: '#DC2626',
    glow: 'rgba(220,38,38,0.08)',
    title: 'Nearby Care',
    desc: 'Find hospitals, clinics, pharmacies, and diagnostic centres on a live map — including A&E emergency locations.',
    features: ['Live map', 'A&E finder', 'Directions'],
    icon: (
      <>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
        />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </>
    )
  }
]

export default function Services () {
  return (
    <section id='services' className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <div>
            <span className={s.eyebrow}>Our Services</span>
            <h2>
              Everything your
              <br />
              health needs
            </h2>
          </div>
          <p>
            From first symptom to last prescription — one platform, end-to-end.
          </p>
        </div>

        <div className={`${s.grid} reveal`}>
          {SERVICES.map(sv => (
            <div
              key={sv.title}
              className={s.card}
              style={
                {
                  '--glow-color': sv.glow,
                  '--accent-color': sv.color
                } as React.CSSProperties
              }
            >
              <div
                className={s.iconWrap}
                style={{ background: sv.glow.replace('0.08', '0.12') }}
              >
                <svg fill='none' stroke={sv.color} viewBox='0 0 24 24'>
                  {sv.icon}
                </svg>
              </div>
              <h3>{sv.title}</h3>
              <p>{sv.desc}</p>
              <ul className={s.features}>
                {sv.features.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <div className={s.arrow}>
                <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17 8l4 4m0 0l-4 4m4-4H3'
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

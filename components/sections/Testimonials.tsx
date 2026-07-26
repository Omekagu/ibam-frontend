import s from './Testimonials.module.scss'

const TESTIMONIALS = [
  {
    initials: 'CA',
    name: 'Chioma A.',
    location: 'Enugu',
    condition: 'Hypertension',
    rating: 5,
    quote:
      'I was skeptical about telemedicine but iBam Health changed my mind completely. My doctor reviewed my BP logs, adjusted my medication, and I never had to leave home. The prescription was at my pharmacy within hours.'
  },
  {
    initials: 'EO',
    name: 'Emmanuel O.',
    location: 'Abuja',
    condition: 'Diabetes Management',
    rating: 5,
    quote:
      'Managing my diabetes used to mean countless hospital visits. Now I get quarterly reviews online, my lab results sync automatically, and my doctor tracks my glucose trends in real time. Life-changing.'
  },
  {
    initials: 'FB',
    name: 'Fatima B.',
    location: 'Kano',
    condition: 'Maternal Care',
    rating: 5,
    quote:
      "Being pregnant in a city with limited specialist access was scary. iBam connected me with an OB-GYN in Enugu for weekly virtual check-ins. My delivery was smooth and my baby is healthy. I'm forever grateful."
  }
]

function StarIcon () {
  return (
    <svg viewBox='0 0 20 20' fill='currentColor'>
      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
    </svg>
  )
}

export default function Testimonials () {
  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <span className={s.eyebrow}>Patient Stories</span>
          <h2>Real care, real results</h2>
          <p>
            Thousands of Nigerians trust iBam Health for their everyday
            healthcare needs.
          </p>
        </div>

        <div className={`${s.grid} reveal-stagger`}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className={`${s.card} reveal`}>
              <div className={s.stars}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <p className={s.quote}>{t.quote}</p>
              <div className={s.author}>
                <div className={s.avatar}>{t.initials}</div>
                <div>
                  <div className={s.name}>{t.name}</div>
                  <div className={s.meta}>{t.location}</div>
                </div>
                <span className={s.tag}>{t.condition}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

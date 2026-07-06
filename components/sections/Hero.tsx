'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import s from './Hero.module.scss'

/* ── Flip carousel scenes ──────────────────────────────
   Drop images in /public/images/ to replace the gradient cards.
   Set imageSrc to e.g. "/images/doctor-consult.jpg" to use a photo.
*/
const SCENES = [
  {
    bg: 'linear-gradient(145deg,#0A8F6C 0%,#00E5A0 55%,#065F46 100%)',
    imageSrc:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // "/images/scene-consult.jpg"
    icon: '',
    // icon: '🩺',
    tag: 'Telemedicine',
    title: 'See a doctor\nin minutes',
    stat: '500+ verified physicians'
  },
  {
    bg: 'linear-gradient(145deg,#0D1F35 0%,#0A8F6C 60%,#00E5A0 100%)',
    imageSrc:
      'https://plus.unsplash.com/premium_photo-1676325101955-1089267548d4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // "/images/scene-lab.jpg"
    icon: '',
    // icon: '🔬',
    tag: 'Diagnostics',
    title: 'Lab results\nin 24 hours',
    stat: 'Home sample collection'
  },
  {
    bg: 'linear-gradient(145deg,#050D1B 0%,#0D1B2A 45%,#0A8F6C 100%)',
    imageSrc:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1240&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // "/images/scene-pharmacy.jpg"
    icon: '',
    // icon: '💊',
    tag: 'Pharmacy',
    title: 'Medications\ndelivered today',
    stat: 'Same-day in Lagos & Abuja'
  }
]

const SLOTS = ['09:00', '10:30', '14:00', '16:30']
const STATS = [
  { value: '500+', label: 'Verified Physicians' },
  { value: '24/7', label: 'Always Available' },
  { value: '98.6%', label: 'Patient Satisfaction' },
  { value: '₦0', label: 'Hidden Fees' }
]

export default function Hero () {
  const [scene, setScene] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)

  /* Auto-advance every 4 s */
  useEffect(() => {
    const t = setInterval(() => {
      setFlipping(true)
      setTimeout(() => {
        setScene(c => (c + 1) % SCENES.length)
        setFlipping(false)
      }, 350)
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const cur = SCENES[scene]

  return (
    <>
      <section className={s.hero}>
        {/* ── Background ──────────────────────────── */}
        <div className={s.bg}>
          {/* Optional photo bg — uncomment and set src when image is ready */}
          <img
            src='https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1240&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            className={s.bgPhoto}
            alt=''
            aria-hidden
          />
          <div className={s.bgOrb1} />
          <div className={s.bgOrb2} />
          <div className={s.bgOrb3} />
          <div className={s.bgGrid} />
          <div className={s.bgFade} />
        </div>

        {/* ── Main grid ───────────────────────────── */}
        <div className={s.inner}>
          {/* Left: copy */}
          <div className={s.copy}>
            <div className={s.badge}>
              <span className={s.badgeDot} />
              Telemedicine · Diagnostics · Pharmacy
            </div>

            <h1 className={s.headline}>
              Quality Healthcare, <span className={s.accent}>Delivered</span> to
              You.
            </h1>

            <p className={s.sub}>
              Consult certified doctors, order lab tests, get e-prescriptions,
              and access trusted pharmacy delivery — from wherever you are in
              Nigeria.
            </p>

            <div className={s.ctaRow}>
              <Link href='/signup' className={s.btnPrimary}>
                Book a Consultation <ArrowRight />
              </Link>
              <button className={s.btnVideo} onClick={() => setVideoOpen(true)}>
                <PlayIcon /> Watch Demo
              </button>
              <Link href='#how-it-works' className={s.btnOutline}>
                See How It Works
              </Link>
            </div>

            <div className={s.trust}>
              {[
                'FMOH Licensed',
                'NDPR Protected',
                'Encrypted Consultations',
                'ISO 27001'
              ].map(b => (
                <div key={b} className={s.trustItem}>
                  <CheckIcon className={s.trustIcon} />
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D flip carousel */}
          <div className={s.visual}>
            <div className={s.flipWrapper}>
              <div className={`${s.flipCard} ${flipping ? s.flipOut : ''}`}>
                {/* Scene card */}
                <div
                  className={s.sceneCard}
                  style={
                    cur.imageSrc
                      ? { backgroundImage: `url(${cur.imageSrc})` }
                      : { background: cur.bg }
                  }
                >
                  {cur.imageSrc && <div className={s.sceneOverlay} />}

                  <div className={s.sceneContent}>
                    <span className={s.sceneTag}>{cur.tag}</span>
                    <div className={s.sceneIcon}>{cur.icon}</div>
                    <h3
                      className={s.sceneTitle}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {cur.title}
                    </h3>
                    <p className={s.sceneStat}>{cur.stat}</p>
                  </div>

                  {/* Embedded booking strip */}
                  <div className={s.sceneStrip}>
                    <div className={s.stripRow}>
                      <div className={s.stripDoc}>
                        <span className={s.stripAvatar}>👨🏿‍⚕️</span>
                        <div>
                          <div className={s.stripName}>Dr. Amara Nwosu</div>
                          <div className={s.stripSpec}>Cardiologist</div>
                        </div>
                        <span className={s.stripDot} />
                      </div>
                    </div>
                    <div className={s.slotGrid}>
                      {SLOTS.map((t, i) => (
                        <button
                          key={t}
                          className={`${s.slot} ${i === 1 ? s.slotActive : ''}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <button className={s.bookBtn}>
                      Confirm Booking — ₦5,000
                    </button>
                  </div>
                </div>
              </div>

              {/* Slide indicators */}
              <div className={s.dots}>
                {SCENES.map((_, i) => (
                  <button
                    key={i}
                    className={`${s.dot} ${i === scene ? s.dotActive : ''}`}
                    onClick={() => {
                      setFlipping(true)
                      setTimeout(() => {
                        setScene(i)
                        setFlipping(false)
                      }, 350)
                    }}
                    aria-label={`Scene ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <div className={`${s.badgeFloat} ${s.badgeTop}`}>
              <div
                className={s.badgeIcon}
                style={{ background: 'rgba(16,185,129,0.15)' }}
              >
                <CheckCircle color='#10B981' />
              </div>
              <div>
                <p className={s.badgeLabel}>Triage Complete</p>
                <p className={s.badgeSub}>Green — Low Risk</p>
              </div>
            </div>

            <div className={`${s.badgeFloat} ${s.badgeBottom}`}>
              <div
                className={s.badgeIcon}
                style={{ background: 'rgba(10,143,108,0.15)' }}
              >
                <DocIcon color='#0A8F6C' />
              </div>
              <div>
                <p className={s.badgeLabel}>E-Prescription Sent</p>
                <p className={s.badgeSub}>Amoxicillin 500mg · 5 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className={s.stats}>
          {STATS.map(st => (
            <div key={st.label} className={s.statItem}>
              <span className={s.statValue}>{st.value}</span>
              <span className={s.statLabel}>{st.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Video modal ─────────────────────────────── */}
      {videoOpen && (
        <div className={s.videoModal} onClick={() => setVideoOpen(false)}>
          <div className={s.videoBox} onClick={e => e.stopPropagation()}>
            <button
              className={s.videoClose}
              onClick={() => setVideoOpen(false)}
              aria-label='Close'
            >
              <svg
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                width={20}
                height={20}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
            {/* Replace src with your actual video path: /videos/demo.mp4 or a YouTube iframe */}
            <video
              className={s.video}
              src='/videos/demo.mp4'
              controls
              autoPlay
              playsInline
              onError={e => {
                ;(e.currentTarget as HTMLVideoElement).style.display = 'none'
                ;(
                  e.currentTarget.nextElementSibling as HTMLElement
                ).style.display = 'flex'
              }}
            />
            <div className={s.videoPlaceholder}>
              <div className={s.videoPlaceholderIcon}>🎥</div>
              <p>
                Drop your demo video at <code>/public/videos/demo.mp4</code>
              </p>
              <span>Or replace with a YouTube embed</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Inline SVGs ─────────────────────────────────
function ArrowRight () {
  return (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 8l4 4m0 0l-4 4m4-4H3'
      />
    </svg>
  )
}
function PlayIcon () {
  return (
    <svg width='16' height='16' fill='currentColor' viewBox='0 0 20 20'>
      <path d='M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z' />
    </svg>
  )
}
function CheckIcon ({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 20 20' fill='currentColor'>
      <path
        fillRule='evenodd'
        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
        clipRule='evenodd'
      />
    </svg>
  )
}
function CheckCircle ({ color }: { color: string }) {
  return (
    <svg width='16' height='16' viewBox='0 0 20 20' fill={color}>
      <path
        fillRule='evenodd'
        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
        clipRule='evenodd'
      />
    </svg>
  )
}
function DocIcon ({ color }: { color: string }) {
  return (
    <svg width='16' height='16' fill='none' stroke={color} viewBox='0 0 24 24'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    </svg>
  )
}

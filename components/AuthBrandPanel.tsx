'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import s from './AuthBrandPanel.module.scss'

const SLIDES = [
  { src: '/Frame 1.png', label: 'Your health, always within reach' },
  { src: '/Frame 2.png', label: 'Trusted healthcare platform' },
  { src: '/Frame 7.png', label: 'iBam Health — Care that moves with you' },
]

export default function AuthBrandPanel () {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSlide(i => (i + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={s.brand}>
      {SLIDES.map((sl, i) => (
        <Image
          key={sl.src}
          src={sl.src}
          alt={sl.label}
          fill
          priority={i === 0}
          className={`${s.slideImg} ${i === slide ? s.slideImgActive : ''}`}
          style={{ objectFit: 'cover' }}
        />
      ))}

      <Link href='/' className={s.brandLogo}>
        <Image src='/Ibam Logo Png.png' alt='iBam Health' width={44} height={44} className={s.logoImg} />
        <span className={s.name}>iBam <span>Health</span></span>
      </Link>

      <div className={s.slideBottom}>
        <p className={s.slideCaption}>{SLIDES[slide].label}</p>
        <div className={s.slideDots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${s.slideDot} ${i === slide ? s.slideDotActive : ''}`}
              onClick={() => setSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

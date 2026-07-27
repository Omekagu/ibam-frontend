'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollReveal () {
  const pathname = usePathname()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    // Wait one frame so the new page's DOM is fully painted
    const id = requestAnimationFrame(() => {
      // Mark body so CSS hides un-observed reveals — only after observer is ready
      document.body.classList.add('sr-ready')

      document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) =>
        observer.observe(el)
      )
    })

    return () => {
      cancelAnimationFrame(id)
      observer.disconnect()
    }
  }, [pathname])

  return null
}

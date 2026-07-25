'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import PageShell from '@/components/PageShell'
import api from '@/lib/api'
import s from './page.module.scss'

const SPECIALTIES = [
  'All Specialties', 'General Practice', 'Paediatrics', 'Cardiology',
  'OB-GYN', 'Dermatology', 'Internal Medicine', 'Psychiatry',
  'Ophthalmology', 'ENT', 'Orthopaedics',
]

interface DoctorCard {
  _id: string
  specialization: string
  consultationFee: number
  yearsOfExperience: number
  isAvailable: boolean
  ratings: { average: number; count: number }
  displayName?: string
  rateType: string
  user: { name: string; avatar?: string }
}

function StarIcon () {
  return (
    <svg className={s.star} viewBox='0 0 20 20' fill='currentColor' width={13} height={13}>
      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
    </svg>
  )
}

export default function DoctorsPage () {
  const [doctors, setDoctors] = useState<DoctorCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('All Specialties')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    load()
  }, [specialty, page])

  async function load () {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: 12 }
      if (specialty !== 'All Specialties') params.specialization = specialty
      const r = await api.get('/doctors', { params })
      const { doctors: docs, total: t, pages: pg } = r.data.data ?? {}
      setDoctors(docs ?? [])
      setTotal(t ?? 0)
      setPages(pg ?? 1)
    } catch { setDoctors([]) }
    setLoading(false)
  }

  const displayed = search.trim()
    ? doctors.filter(d => {
        const name = (d.displayName || d.user.name).toLowerCase()
        const spec = d.specialization.toLowerCase()
        const q = search.toLowerCase()
        return name.includes(q) || spec.includes(q)
      })
    : doctors

  function rateSuffix (rateType: string) {
    if (rateType === 'per_hour')   return '/ hr'
    if (rateType === 'per_minute') return '/ min'
    return '/ consultation'
  }

  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <h1>Find your doctor</h1>
          <p>
            Browse MDCN-verified physicians. Filter by specialty,
            availability, and price — book in seconds.
          </p>
          <div className={s.searchBar}>
            <div className={s.searchIcon}>
              <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </div>
            <input
              type='text'
              placeholder='Search by name or specialty…'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type='button' onClick={() => { setPage(1); load() }}>Search</button>
          </div>
        </div>
      </section>

      <section className={s.body}>
        <div className={s.bodyInner}>
          <aside className={s.filters}>
            <h3>Specialty</h3>
            {SPECIALTIES.map(sp => (
              <label key={sp} className={s.option}>
                <input
                  type='radio'
                  name='specialty'
                  checked={specialty === sp}
                  onChange={() => { setSpecialty(sp); setPage(1) }}
                />
                {sp}
              </label>
            ))}
          </aside>

          <div className={s.results}>
            <h2>
              {loading ? 'Loading…' : `${total} doctor${total !== 1 ? 's' : ''} found`}
            </h2>

            {loading ? (
              <div className={s.loadingGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={s.skeleton} />
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <div className={s.empty}>
                <p>No doctors found matching your search.</p>
                <button onClick={() => { setSearch(''); setSpecialty('All Specialties'); setPage(1) }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={`${s.grid} reveal-stagger`}>
                  {displayed.map(doc => {
                    const name = doc.displayName || doc.user.name
                    return (
                      <div key={doc._id} className={`${s.card} reveal`}>
                        <div className={s.docAvatar}>
                          {doc.user.avatar ? (
                            <Image src={doc.user.avatar} alt={name} fill style={{ objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            <span>{name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div className={s.docInfo}>
                          <div className={s.docTop}>
                            <div className={s.docName}>{name}</div>
                            <span className={`${s.badge} ${doc.isAvailable ? s.available : s.busy}`}>
                              {doc.isAvailable ? 'Available' : 'Busy'}
                            </span>
                          </div>
                          <div className={s.specialty}>{doc.specialization}</div>
                          <div className={s.meta}>
                            <span>
                              <StarIcon />
                              {doc.ratings.average > 0
                                ? `${doc.ratings.average.toFixed(1)} (${doc.ratings.count})`
                                : 'New'}
                            </span>
                            <span>
                              <svg fill='none' stroke='currentColor' viewBox='0 0 24 24' width={13} height={13}>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                              {doc.yearsOfExperience > 0 ? `${doc.yearsOfExperience} yr${doc.yearsOfExperience !== 1 ? 's' : ''} exp` : 'New doctor'}
                            </span>
                          </div>
                          <div className={s.docFooter}>
                            <div className={s.price}>
                              ₦{doc.consultationFee.toLocaleString()}
                              <span> {rateSuffix(doc.rateType)}</span>
                            </div>
                            <Link href='/signup' className={s.bookBtn}>Book Now</Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {pages > 1 && (
                  <div className={s.pagination}>
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span>Page {page} of {pages}</span>
                    <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  )
}

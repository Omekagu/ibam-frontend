'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'
import { SearchIcon } from '@/components/icons'

interface Patient {
  id: string
  name: string
  lastConsultation: string
  count: number
  types: string[]
}

export default function DoctorPatients () {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    api.get('/doctors/my/appointments')
      .then(r => {
        const appts: { patient: { _id: string; name: string }; scheduledAt: string; type: string }[] =
          r.data.data?.appointments ?? []

        const map = new Map<string, Patient>()
        for (const a of appts) {
          const pid = a.patient._id
          const existing = map.get(pid)
          if (existing) {
            existing.count++
            if (a.scheduledAt > existing.lastConsultation) existing.lastConsultation = a.scheduledAt
            if (!existing.types.includes(a.type)) existing.types.push(a.type)
          } else {
            map.set(pid, {
              id: pid,
              name: a.patient.name,
              lastConsultation: a.scheduledAt,
              count: 1,
              types: [a.type],
            })
          }
        }

        setPatients(
          Array.from(map.values()).sort((a, b) => b.lastConsultation.localeCompare(a.lastConsultation))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : patients

  return (
    <>
      <div className={s.header}>
        <p className={s.count}>{patients.length} unique patient{patients.length !== 1 ? 's' : ''}</p>
        <div className={s.searchBar}>
          <span className={s.searchIcon}><SearchIcon size={16} /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by name…'
          />
        </div>
      </div>

      {loading ? (
        <div className={s.loading}>Loading patients…</div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>{search ? 'No patients found.' : 'No patients yet. Complete consultations to see patients here.'}</div>
      ) : (
        <div className={s.grid}>
          {filtered.map(p => (
            <div key={p.id} className={s.card}>
              <div className={s.cardTop}>
                <div className={s.avatar}>{p.name[0]}</div>
                <div>
                  <p className={s.name}>{p.name}</p>
                  <p className={s.sessions}>{p.count} session{p.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className={s.cardBottom}>
                <div className={s.types}>
                  {p.types.map(t => (
                    <span key={t} className={`${s.typeBadge} ${s[t]}`}>{t}</span>
                  ))}
                </div>
                <p className={s.lastSeen}>
                  Last: {new Date(p.lastConsultation).toLocaleDateString('en-NG', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Pharmacy {
  _id: string
  name: string
  address: string
  phone: string
  email?: string
  licenseNumber?: string
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  coverageAreas: string[]
  createdAt: string
  user?: { name: string; email: string; isActive: boolean }
}

const STATUS_OPTS = ['pending', 'active', 'inactive', 'suspended'] as const

export default function AdminPharmacyPage () {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('')
  const [updating,   setUpdating]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const r = await api.get(`/admin/pharmacy${params}`)
      setPharmacies(r.data.data?.pharmacies ?? [])
    } catch { }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function setStatus (id: string, status: string) {
    setUpdating(id)
    try {
      await api.put(`/admin/pharmacy/${id}/status`, { status })
      setPharmacies(prev => prev.map(p => p._id === id ? { ...p, status: status as Pharmacy['status'] } : p))
    } catch { alert('Failed to update status.') }
    setUpdating(null)
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Pharmacy Partners</h2>
          <span className={s.countBadge}>{pharmacies.length}</span>
        </div>
        <select className={s.filter} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value=''>All statuses</option>
          {STATUS_OPTS.map(o => <option key={o} value={o}>{capitalize(o)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={s.empty}>Loading pharmacies…</div>
      ) : pharmacies.length === 0 ? (
        <div className={s.empty}>No pharmacies found.</div>
      ) : (
        <div className={s.table}>
          <div className={s.thead}>
            <span>Pharmacy</span>
            <span>Contact</span>
            <span>License</span>
            <span>Coverage</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {pharmacies.map(p => (
            <div key={p._id} className={s.trow}>
              <div>
                <p className={s.pharmName}>{p.name}</p>
                <p className={s.pharmAddr}>{p.address}</p>
              </div>
              <div>
                <p className={s.detail}>{p.phone}</p>
                <p className={s.detail}>{p.email ?? p.user?.email ?? '—'}</p>
              </div>
              <div>
                <p className={s.detail}>{p.licenseNumber ?? '—'}</p>
              </div>
              <div>
                <p className={s.detail}>{p.coverageAreas.length > 0 ? p.coverageAreas.join(', ') : '—'}</p>
              </div>
              <div>
                <span className={`${s.statusBadge} ${s[p.status]}`}>{capitalize(p.status)}</span>
              </div>
              <div className={s.actionRow}>
                {p.status !== 'active' && (
                  <button
                    className={s.approveBtn}
                    disabled={updating === p._id}
                    onClick={() => setStatus(p._id, 'active')}
                  >
                    Approve
                  </button>
                )}
                {p.status === 'active' && (
                  <button
                    className={s.suspendBtn}
                    disabled={updating === p._id}
                    onClick={() => setStatus(p._id, 'suspended')}
                  >
                    Suspend
                  </button>
                )}
                {p.status === 'suspended' && (
                  <button
                    className={s.approveBtn}
                    disabled={updating === p._id}
                    onClick={() => setStatus(p._id, 'active')}
                  >
                    Reinstate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function capitalize (s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

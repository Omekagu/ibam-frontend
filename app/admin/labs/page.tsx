'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Test { name: string; price: number; turnaroundHours: number }
interface Lab {
  _id: string
  name: string
  address: string
  phone: string
  email?: string
  licenseNumber?: string
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  testsOffered: Test[]
  coverageAreas: string[]
  createdAt: string
  user?: { name: string; email: string; isActive: boolean }
}

const STATUS_OPTS = ['pending', 'active', 'inactive', 'suspended'] as const

export default function AdminLabsPage () {
  const [labs,     setLabs]     = useState<Lab[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const r = await api.get(`/admin/labs${params}`)
      setLabs(r.data.data?.labs ?? [])
    } catch { }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function setStatus (id: string, status: string) {
    setUpdating(id)
    try {
      await api.put(`/admin/labs/${id}/status`, { status })
      setLabs(prev => prev.map(l => l._id === id ? { ...l, status: status as Lab['status'] } : l))
    } catch { alert('Failed to update status.') }
    setUpdating(null)
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Diagnostic Labs</h2>
          <span className={s.countBadge}>{labs.length}</span>
        </div>
        <select className={s.filter} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value=''>All statuses</option>
          {STATUS_OPTS.map(o => <option key={o} value={o}>{cap(o)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={s.empty}>Loading labs…</div>
      ) : labs.length === 0 ? (
        <div className={s.empty}>No labs found.</div>
      ) : (
        <div className={s.list}>
          {labs.map(lab => (
            <div key={lab._id} className={s.card}>
              <div className={s.cardMain}>
                <div className={s.cardInfo}>
                  <div>
                    <p className={s.labName}>{lab.name}</p>
                    <p className={s.labAddr}>{lab.address}</p>
                  </div>
                  <div className={s.metaRow}>
                    <span>{lab.phone}</span>
                    {lab.licenseNumber && <span>License: {lab.licenseNumber}</span>}
                    <span>{lab.testsOffered.length} test{lab.testsOffered.length !== 1 ? 's' : ''} offered</span>
                  </div>
                </div>
                <div className={s.cardRight}>
                  <span className={`${s.statusBadge} ${s[lab.status]}`}>{cap(lab.status)}</span>
                  <div className={s.actionRow}>
                    <button
                      className={s.testsBtn}
                      onClick={() => setExpanded(expanded === lab._id ? null : lab._id)}
                    >
                      {expanded === lab._id ? 'Hide Tests' : 'View Tests'}
                    </button>
                    {lab.status !== 'active' && (
                      <button className={s.approveBtn} disabled={updating === lab._id} onClick={() => setStatus(lab._id, 'active')}>
                        Approve
                      </button>
                    )}
                    {lab.status === 'active' && (
                      <button className={s.suspendBtn} disabled={updating === lab._id} onClick={() => setStatus(lab._id, 'suspended')}>
                        Suspend
                      </button>
                    )}
                    {lab.status === 'suspended' && (
                      <button className={s.approveBtn} disabled={updating === lab._id} onClick={() => setStatus(lab._id, 'active')}>
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {expanded === lab._id && (
                <div className={s.testsList}>
                  {lab.testsOffered.length === 0 ? (
                    <p className={s.noTests}>No tests listed yet.</p>
                  ) : (
                    <table className={s.testsTable}>
                      <thead>
                        <tr><th>Test Name</th><th>Price</th><th>Turnaround</th></tr>
                      </thead>
                      <tbody>
                        {lab.testsOffered.map((t, i) => (
                          <tr key={i}>
                            <td>{t.name}</td>
                            <td>₦{t.price.toLocaleString()}</td>
                            <td>{t.turnaroundHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function cap (s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

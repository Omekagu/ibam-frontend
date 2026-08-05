'use client'
import { useState, useEffect, useCallback, Fragment } from 'react'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  isVerified: boolean
  ninVerified: boolean
  kycStatus: string
  avatar?: string
  createdAt: string
}

const ROLES = [
  { key: 'all',              label: 'All Users' },
  { key: 'patient',          label: 'Patients' },
  { key: 'doctor',           label: 'Doctors' },
  { key: 'pharmacy_partner', label: 'Pharmacy' },
  { key: 'lab_partner',      label: 'Lab Partners' },
  { key: 'admin',            label: 'Admins' },
]

const ROLE_LABELS: Record<string, string> = {
  patient:          'Patient',
  doctor:           'Doctor',
  pharmacy_partner: 'Pharmacy',
  lab_partner:      'Lab Partner',
  admin:            'Admin',
  field_agent:      'Field Agent',
}

const KYC_COLORS: Record<string, string> = {
  pending:       'grey',
  nin_verified:  'blue',
  face_verified: 'orange',
  approved:      'green',
  rejected:      'red',
}

export default function AdminUsersPage () {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params: Record<string, string> = { limit: '100' }
    if (roleFilter !== 'all') params.role = roleFilter
    if (search.trim()) params.search = search.trim()
    api.get('/admin/users', { params })
      .then(r => {
        const data = r.data.data ?? r.data
        setUsers(data.users ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roleFilter, search])

  useEffect(() => { load() }, [load])

  async function toggleSuspend (id: string, active: boolean) {
    try {
      await api.put(`/admin/users/${id}/suspend`, { isActive: !active })
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !active } : u))
    } catch { }
  }

  const kycLabel = (s: string) => s?.replace('_', ' ') ?? 'pending'

  return (
    <>
      <div className={s.header}>
        <div className={s.heading}>
          <h1>User Management</h1>
          <p>{total.toLocaleString()} {roleFilter === 'all' ? 'total' : roleFilter.replace('_', ' ')} users</p>
        </div>
        <input
          className={s.search}
          type='search'
          placeholder='Search name, email or phone…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={s.tabs}>
        {ROLES.map(r => (
          <button
            key={r.key}
            className={`${s.tab} ${roleFilter === r.key ? s.active : ''}`}
            onClick={() => setRoleFilter(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className={s.panel}>
        {loading ? (
          <div className={s.loading}><Loader label='Loading users…' /></div>
        ) : users.length === 0 ? (
          <div className={s.empty}>No users found.</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Role</th>
                <th>KYC</th>
                <th>Verified</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <Fragment key={u._id}>
                  <tr
                    className={expanded === u._id ? s.expandedRow : ''}
                    onClick={() => setExpanded(expanded === u._id ? null : u._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className={s.user}>
                        {u.avatar
                          ? <img src={u.avatar} className={s.avatarImg} alt='' />
                          : <div className={s.avatar}>{u.name[0]}</div>
                        }
                        <div>
                          <p className={s.userName}>{u.name}</p>
                          <p className={s.userEmail}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={s.phone}>{u.phone ?? '—'}</td>
                    <td>
                      <span className={`${s.roleBadge} ${s[u.role] ?? ''}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`${s.kycBadge} ${s[KYC_COLORS[u.kycStatus] ?? 'grey']}`}>
                        {kycLabel(u.kycStatus)}
                      </span>
                    </td>
                    <td>
                      <span className={`${s.badge} ${u.isVerified ? s.green : s.grey}`}>
                        {u.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className={s.date}>{new Date(u.createdAt).toLocaleDateString('en-NG')}</td>
                    <td>
                      <span className={`${s.badge} ${u.isActive ? s.green : s.red}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className={u.isActive ? s.btnSuspend : s.btnRestore}
                        onClick={() => toggleSuspend(u._id, u.isActive)}
                      >
                        {u.isActive ? 'Suspend' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                  {expanded === u._id && (
                    <tr className={s.detailRow}>
                      <td colSpan={8}>
                        <div className={s.detailGrid}>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>User ID</span>
                            <span className={s.detailValue}>{u._id}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Full Name</span>
                            <span className={s.detailValue}>{u.name}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Email</span>
                            <span className={s.detailValue}>{u.email}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Phone</span>
                            <span className={s.detailValue}>{u.phone ?? 'Not provided'}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Role</span>
                            <span className={s.detailValue}>{ROLE_LABELS[u.role] ?? u.role}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>KYC Status</span>
                            <span className={s.detailValue}>{kycLabel(u.kycStatus)}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Email Verified</span>
                            <span className={s.detailValue}>{u.isVerified ? 'Yes' : 'No'}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>NIN Verified</span>
                            <span className={s.detailValue}>{u.ninVerified ? 'Yes' : 'No'}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Account Status</span>
                            <span className={s.detailValue}>{u.isActive ? 'Active' : 'Suspended'}</span>
                          </div>
                          <div className={s.detailItem}>
                            <span className={s.detailLabel}>Registered</span>
                            <span className={s.detailValue}>{new Date(u.createdAt).toLocaleString('en-NG')}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

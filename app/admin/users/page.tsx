'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface User {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

const MOCK: User[] = [
  { _id: '1', name: 'Amara Okafor', email: 'amara@example.com', role: 'patient', isActive: true, createdAt: new Date().toISOString() },
  { _id: '2', name: 'Chidi Nwosu', email: 'chidi@example.com', role: 'patient', isActive: true, createdAt: new Date(Date.now()-86400000).toISOString() },
  { _id: '3', name: 'Ngozi Adeyemi', email: 'ngozi@example.com', role: 'patient', isActive: false, createdAt: new Date(Date.now()-172800000).toISOString() },
  { _id: '4', name: 'Emeka Ibe', email: 'emeka@example.com', role: 'patient', isActive: true, createdAt: new Date(Date.now()-259200000).toISOString() },
  { _id: '5', name: 'Bola Alade', email: 'bola@example.com', role: 'patient', isActive: true, createdAt: new Date(Date.now()-345600000).toISOString() },
]

export default function AdminUsersPage () {
  const [users, setUsers] = useState<User[]>(MOCK)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.data?.users ?? MOCK)).catch(() => {})
  }, [])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleSuspend (id: string, active: boolean) {
    try {
      await api.put(`/admin/users/${id}/suspend`, { isActive: !active })
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !active } : u))
    } catch { }
  }

  return (
    <>
      <div className={s.header}>
        <div className={s.heading}>
          <h1>Patient Management</h1>
          <p>{users.length.toLocaleString()} registered patients</p>
        </div>
        <input
          className={s.search}
          type='search'
          placeholder='Search by name or email…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={s.panel}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u._id}>
                <td>
                  <div className={s.user}>
                    <div className={s.avatar}>{u.name[0]}</div>
                    <div>
                      <p className={s.userName}>{u.name}</p>
                      <p className={s.userEmail}>{u.email}</p>
                    </div>
                  </div>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString("en-NG")}</td>
                <td>
                  <span className={`${s.badge} ${u.isActive ? s.green : s.red}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td>
                  <button
                    className={u.isActive ? s.btnSuspend : s.btnRestore}
                    onClick={() => toggleSuspend(u._id, u.isActive)}
                  >
                    {u.isActive ? 'Suspend' : 'Restore'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

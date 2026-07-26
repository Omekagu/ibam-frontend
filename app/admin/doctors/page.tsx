'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'
import { StethoscopeIcon, DocumentIcon, CheckIcon, XIcon } from '@/components/icons'

interface Doctor {
  _id: string
  user: { name: string; email: string } | null
  specialization: string
  licenseNumber: string
  licenseDocument?: string
  isApproved: boolean
  createdAt: string
}

const MOCK: Doctor[] = [
  { _id: '1', user: { name: 'Dr. Adaeze Obi', email: 'adaeze@example.com' }, specialization: 'Cardiologist', licenseNumber: 'MDCN/R&S/2024/11231', isApproved: false, createdAt: new Date().toISOString() },
  { _id: '2', user: { name: 'Dr. Emeka Nwosu', email: 'emeka@example.com' }, specialization: 'Dermatologist', licenseNumber: 'MDCN/R&S/2023/09821', isApproved: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '3', user: { name: 'Dr. Fatima Yusuf', email: 'fatima@example.com' }, specialization: 'Paediatrician', licenseNumber: 'MDCN/R&S/2024/10452', isApproved: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { _id: '4', user: { name: 'Dr. Chioma Eze', email: 'chioma@example.com' }, specialization: 'OB-GYN', licenseNumber: 'MDCN/R&S/2022/07634', isApproved: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: '5', user: { name: 'Dr. Tunde Alade', email: 'tunde@example.com' }, specialization: 'Psychiatrist', licenseNumber: 'MDCN/R&S/2024/11890', isApproved: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
]

type Tab = 'pending' | 'approved' | 'all'

export default function AdminDoctorsPage () {
  const [tab, setTab] = useState<Tab>('pending')
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK)
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    api.get('/admin/doctors').then(r => setDoctors(r.data.data?.doctors ?? MOCK)).catch(() => {})
  }, [])

  const filtered = doctors.filter(d =>
    tab === 'all' ? true : tab === 'pending' ? !d.isApproved : d.isApproved
  )

  async function approve (id: string) {
    setActing(true)
    try {
      await api.put(`/admin/doctors/${id}/approve`, { isApproved: true })
      setDoctors(prev => prev.map(d => d._id === id ? { ...d, isApproved: true } : d))
      setSelected(null)
    } catch { /* use optimistic */ }
    setActing(false)
  }

  async function reject (id: string) {
    setActing(true)
    try {
      await api.put(`/admin/doctors/${id}/approve`, { isApproved: false })
      setDoctors(prev => prev.filter(d => d._id !== id))
      setSelected(null)
    } catch { }
    setActing(false)
  }

  return (
    <>
      <div className={s.header}>
        <div className={s.heading}>
          <h1>Doctor Management</h1>
          <p>{doctors.filter(d => !d.isApproved).length} pending KYC reviews</p>
        </div>
        <div className={s.tabs}>
          {(['pending', 'approved', 'all'] as Tab[]).map(t => (
            <button
              key={t}
              className={`${s.tab} ${tab === t ? s.active : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={s.panel}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>License No.</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d._id}>
                <td>
                  <div className={s.doctor}>
                    <div className={s.avatar}><StethoscopeIcon size={18} /></div>
                    <div>
                      <p className={s.doctorName}>{d.user?.name ?? '—'}</p>
                      <p className={s.doctorEmail}>{d.user?.email ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td>{d.specialization}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{d.licenseNumber}</td>
                <td>
                  <span className={`${s.badge} ${d.isApproved ? s.approved : s.pending}`}>
                    {d.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>{new Date(d.createdAt).toLocaleDateString("en-NG")}</td>
                <td>
                  <div className={s.actions}>
                    <button className={s.btnView} onClick={() => setSelected(d)}>Review</button>
                    {!d.isApproved && (
                      <>
                        <button className={s.btnApprove} onClick={() => approve(d._id)}>Approve</button>
                        <button className={s.btnReject} onClick={() => reject(d._id)}>Reject</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review drawer */}
      {selected && (
        <>
          <div className={s.overlay} onClick={() => setSelected(null)} />
          <aside className={s.drawer}>
            <div className={s.drawerHead}>
              <h2>KYC Review</h2>
              <button className={s.closeBtn} onClick={() => setSelected(null)}><XIcon size={14} /></button>
            </div>

            <div className={s.drawerBody}>
              <div className={s.drawerSection}>
                <h4>Doctor Info</h4>
                <div className={s.infoRow}><span>Full Name</span><span>{selected.user?.name ?? '—'}</span></div>
                <div className={s.infoRow}><span>Email</span><span>{selected.user?.email ?? '—'}</span></div>
                <div className={s.infoRow}><span>Specialty</span><span>{selected.specialization}</span></div>
                <div className={s.infoRow}><span>MDCN No.</span><span style={{ fontFamily: 'monospace' }}>{selected.licenseNumber}</span></div>
                <div className={s.infoRow}><span>Submitted</span><span>{new Date(selected.createdAt).toLocaleString()}</span></div>
              </div>

              <div className={s.drawerSection}>
                <h4>License Document</h4>
                <div className={s.docPreview}>
                  <DocumentIcon size={20} />
                  <div>
                    <p>Medical License Certificate</p>
                    {selected.licenseDocument
                      ? <a href={selected.licenseDocument} target='_blank' rel='noreferrer'>View document ↗</a>
                      : <a href='#'>No document uploaded yet</a>
                    }
                  </div>
                </div>
              </div>
            </div>

            {!selected.isApproved && (
              <div className={s.drawerActions}>
                <button
                  className={s.approveBtn}
                  onClick={() => approve(selected._id)}
                  disabled={acting}
                >
                  {acting ? 'Processing…' : <><CheckIcon size={14} /> Approve Doctor</>}
                </button>
                <button
                  className={s.rejectBtn}
                  onClick={() => reject(selected._id)}
                  disabled={acting}
                >
                  <XIcon size={14} /> Reject
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  )
}

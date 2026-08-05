'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import s from './page.module.scss'
import { StethoscopeIcon, DocumentIcon, CheckIcon, XIcon } from '@/components/icons'

interface Doctor {
  _id: string
  user: { _id?: string; name: string; email: string } | null
  specialization: string
  licenseNumber: string
  licenseDocument?: string
  kycStatus?: string
  isApproved: boolean
  createdAt: string
}

type Tab = 'pending' | 'approved' | 'all'

const KYC_STATUSES = ['pending', 'nin_verified', 'face_verified', 'approved', 'rejected'] as const

const BLANK_FORM = {
  name: '', email: '', phone: '', password: '',
  specialization: '', licenseNumber: '',
  consultationFee: '', bio: '', autoApprove: false,
}

export default function AdminDoctorsPage () {
  const modal = useStatusModal()
  const [tab, setTab]           = useState<Tab>('pending')
  const [doctors, setDoctors]   = useState<Doctor[]>([])
  const [selected, setSelected] = useState<Doctor | null>(null)
  const [acting, setActing]     = useState(false)

  // Register modal
  const [showRegister, setShowRegister] = useState(false)
  const [form, setForm]                 = useState(BLANK_FORM)
  const [formErr, setFormErr]           = useState('')
  const [creating, setCreating]         = useState(false)

  // Manual KYC
  const [kycTarget,  setKycTarget]  = useState('')
  const [kycStatus,  setKycStatus]  = useState<typeof KYC_STATUSES[number]>('approved')
  const [kycReason,  setKycReason]  = useState('')
  const [kycSaving,  setKycSaving]  = useState(false)

  useEffect(() => {
    api.get('/admin/doctors').then(r => setDoctors(r.data.data?.doctors ?? [])).catch(() => {})
  }, [])

  const filtered = doctors.filter(d =>
    tab === 'all' ? true : tab === 'pending' ? !d.isApproved : d.isApproved
  )

  async function approve (id: string) {
    setActing(true)
    try {
      await api.put(`/admin/doctors/${id}/approve`, { isApproved: true })
      setDoctors(prev => prev.map(d => d._id === id ? { ...d, isApproved: true, kycStatus: 'approved' } : d))
      setSelected(null)
    } catch {}
    setActing(false)
  }

  async function reject (id: string) {
    setActing(true)
    try {
      await api.put(`/admin/doctors/${id}/approve`, { isApproved: false })
      setDoctors(prev => prev.filter(d => d._id !== id))
      setSelected(null)
    } catch {}
    setActing(false)
  }

  async function submitRegister (e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!form.name || !form.email || !form.password || !form.specialization || !form.licenseNumber) {
      setFormErr('Name, email, password, specialization and license number are required.')
      return
    }
    setCreating(true)
    try {
      const r = await api.post('/admin/doctors', {
        ...form,
        consultationFee: form.consultationFee ? Number(form.consultationFee) : 0,
      })
      const newDoc: Doctor = { ...r.data.data.doctor, user: r.data.data.user }
      setDoctors(prev => [newDoc, ...prev])
      setForm(BLANK_FORM)
      setShowRegister(false)
      modal.show({ variant: 'success', title: 'Doctor Created', message: 'The doctor account has been created successfully.' })
    } catch (err: any) {
      setFormErr(err?.response?.data?.message ?? 'Failed to create doctor. Please try again.')
    }
    setCreating(false)
  }

  async function submitKyc () {
    if (!kycTarget) return
    setKycSaving(true)
    try {
      await api.put(`/admin/kyc/${kycTarget}/verify`, { kycStatus, reason: kycReason })
      setDoctors(prev => prev.map(d =>
        d.user?._id === kycTarget
          ? { ...d, kycStatus, isApproved: kycStatus === 'approved' }
          : d
      ))
      if (selected && selected.user?._id === kycTarget) {
        setSelected({ ...selected, kycStatus, isApproved: kycStatus === 'approved' })
      }
      modal.show({ variant: 'success', title: 'KYC Updated', message: 'KYC status updated successfully.' })
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'KYC Update Failed', message: err?.response?.data?.message ?? 'Failed to update KYC.' })
    }
    setKycSaving(false)
  }

  function openDrawer (d: Doctor) {
    setSelected(d)
    setKycTarget(d.user?._id ?? '')
    setKycStatus('approved')
    setKycReason('')
  }

  return (
    <>
      <div className={s.header}>
        <div className={s.heading}>
          <h1>Doctor Management</h1>
          <p>{doctors.filter(d => !d.isApproved).length} pending KYC reviews</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={s.tabs}>
            {(['pending', 'approved', 'all'] as Tab[]).map(t => (
              <button key={t} className={`${s.tab} ${tab === t ? s.active : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button className={s.btnPrimary} onClick={() => { setForm(BLANK_FORM); setFormErr(''); setShowRegister(true) }}>
            + Register Doctor
          </button>
        </div>
      </div>

      <div className={s.panel}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Specialty</th>
              <th>License No.</th>
              <th>KYC</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '2rem' }}>No doctors found.</td></tr>
            )}
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
                  <span className={`${s.badge} ${s[d.kycStatus ?? (d.isApproved ? 'approved' : 'pending')]}`}>
                    {d.kycStatus ?? (d.isApproved ? 'approved' : 'pending')}
                  </span>
                </td>
                <td>{new Date(d.createdAt).toLocaleDateString('en-NG')}</td>
                <td>
                  <div className={s.actions}>
                    <button className={s.btnView} onClick={() => openDrawer(d)}>Review</button>
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

      {/* ── Review + KYC drawer ── */}
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
                <div className={s.infoRow}><span>KYC Status</span>
                  <span className={`${s.badge} ${s[selected.kycStatus ?? 'pending']}`}>{selected.kycStatus ?? 'pending'}</span>
                </div>
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
                      : <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>No document uploaded</span>
                    }
                  </div>
                </div>
              </div>

              <div className={s.drawerSection}>
                <h4>Manual KYC Override</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
                  Directly set this doctor's KYC verification stage.
                </p>
                <div className={s.kycRow}>
                  <select
                    className={s.kycSelect}
                    value={kycStatus}
                    onChange={e => setKycStatus(e.target.value as any)}
                  >
                    {KYC_STATUSES.map(st => (
                      <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <button
                    className={s.kycBtn}
                    onClick={submitKyc}
                    disabled={kycSaving || !kycTarget}
                  >
                    {kycSaving ? 'Saving…' : 'Apply'}
                  </button>
                </div>
                <input
                  className={s.kycReasonInput}
                  placeholder='Reason / note (optional)'
                  value={kycReason}
                  onChange={e => setKycReason(e.target.value)}
                />
              </div>
            </div>

            {!selected.isApproved && (
              <div className={s.drawerActions}>
                <button className={s.approveBtn} onClick={() => approve(selected._id)} disabled={acting}>
                  {acting ? 'Processing…' : <><CheckIcon size={14} /> Approve Doctor</>}
                </button>
                <button className={s.rejectBtn} onClick={() => reject(selected._id)} disabled={acting}>
                  <XIcon size={14} /> Reject
                </button>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ── Register Doctor modal ── */}
      {showRegister && (
        <>
          <div className={s.overlay} onClick={() => setShowRegister(false)} />
          <aside className={s.drawer}>
            <div className={s.drawerHead}>
              <h2>Register Doctor</h2>
              <button className={s.closeBtn} onClick={() => setShowRegister(false)}><XIcon size={14} /></button>
            </div>

            <form className={s.drawerBody} onSubmit={submitRegister}>
              {formErr && <p className={s.formErr}>{formErr}</p>}

              <div className={s.drawerSection}>
                <h4>Account Details</h4>
                <div className={s.fieldGroup}>
                  <label>Full Name *</label>
                  <input className={s.input} placeholder='Dr. John Doe' value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Email *</label>
                  <input className={s.input} type='email' placeholder='doctor@example.com' value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Phone</label>
                  <input className={s.input} placeholder='+234 800 000 0000' value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Temporary Password *</label>
                  <input className={s.input} type='password' placeholder='Min 8 characters' value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
              </div>

              <div className={s.drawerSection}>
                <h4>Professional Info</h4>
                <div className={s.fieldGroup}>
                  <label>Specialization *</label>
                  <input className={s.input} placeholder='e.g. Cardiologist' value={form.specialization}
                    onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>License Number (MDCN) *</label>
                  <input className={s.input} placeholder='MDCN/R&S/2024/XXXXX' value={form.licenseNumber}
                    onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Consultation Fee (₦)</label>
                  <input className={s.input} type='number' min='0' placeholder='e.g. 5000' value={form.consultationFee}
                    onChange={e => setForm(p => ({ ...p, consultationFee: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Bio</label>
                  <textarea className={s.textarea} rows={3} placeholder='Brief professional bio…' value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                </div>
              </div>

              <div className={s.drawerSection}>
                <label className={s.checkRow}>
                  <input type='checkbox' checked={form.autoApprove}
                    onChange={e => setForm(p => ({ ...p, autoApprove: e.target.checked }))} />
                  <span>Auto-approve (skip KYC workflow)</span>
                </label>
              </div>

              <div className={s.drawerActions}>
                <button type='submit' className={s.approveBtn} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Doctor'}
                </button>
                <button type='button' className={s.rejectBtn} onClick={() => setShowRegister(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </>
  )
}

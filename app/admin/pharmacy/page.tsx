'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
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
  user?: { _id?: string; name: string; email: string; isActive: boolean }
}

const STATUS_OPTS = ['pending', 'active', 'inactive', 'suspended'] as const

const BLANK = {
  name: '', email: '', phone: '', password: '',
  address: '', licenseNumber: '', cacNumber: '',
  coverageAreas: '', autoActivate: false,
}

export default function AdminPharmacyPage () {
  const modal = useStatusModal()
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('')
  const [updating,   setUpdating]   = useState<string | null>(null)

  // Register modal
  const [showRegister, setShowRegister] = useState(false)
  const [form,         setForm]         = useState(BLANK)
  const [formErr,      setFormErr]      = useState('')
  const [creating,     setCreating]     = useState(false)

  // Manual KYC panel
  const [kycPharmId, setKycPharmId] = useState<string | null>(null)
  const [kycStatus,  setKycStatus]  = useState<'pending'|'approved'|'rejected'>('approved')
  const [kycReason,  setKycReason]  = useState('')
  const [kycSaving,  setKycSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const r = await api.get(`/admin/pharmacy${params}`)
      setPharmacies(r.data.data?.pharmacies ?? [])
    } catch {}
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

  async function submitRegister (e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!form.name || !form.email || !form.password || !form.address) {
      setFormErr('Name, email, password and address are required.')
      return
    }
    setCreating(true)
    try {
      const r = await api.post('/admin/pharmacy', form)
      const newPharm: Pharmacy = { ...r.data.data.pharmacy, user: r.data.data.user }
      setPharmacies(prev => [newPharm, ...prev])
      setForm(BLANK)
      setShowRegister(false)
      modal.show({ variant: 'success', title: 'Pharmacy Created', message: 'The pharmacy account has been created successfully.' })
    } catch (err: any) {
      setFormErr(err?.response?.data?.message ?? 'Failed to create pharmacy.')
    }
    setCreating(false)
  }

  async function submitKyc (pharm: Pharmacy) {
    const userId = pharm.user?._id
    if (!userId) { modal.show({ variant: 'declined', title: 'KYC Error', message: 'User ID not available.' }); return }
    setKycSaving(true)
    try {
      await api.put(`/admin/kyc/${userId}/verify`, { kycStatus, reason: kycReason })
      setPharmacies(prev => prev.map(p =>
        p._id === pharm._id
          ? { ...p, status: kycStatus === 'approved' ? 'active' : kycStatus === 'rejected' ? 'suspended' : p.status }
          : p
      ))
      modal.show({ variant: 'success', title: 'KYC Updated', message: 'KYC status updated.' })
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'KYC Update Failed', message: err?.response?.data?.message ?? 'Failed to update KYC.' })
    }
    setKycSaving(false)
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Pharmacy Partners</h2>
          <span className={s.countBadge}>{pharmacies.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <select className={s.filter} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value=''>All statuses</option>
            {STATUS_OPTS.map(o => <option key={o} value={o}>{capitalize(o)}</option>)}
          </select>
          <button className={s.registerBtn} onClick={() => { setForm(BLANK); setFormErr(''); setShowRegister(true) }}>
            + Register Pharmacy
          </button>
        </div>
      </div>

      {loading ? (
        <div className={s.empty}><Loader label='Loading pharmacies…' /></div>
      ) : pharmacies.length === 0 ? (
        <div className={s.empty}>No pharmacies found.</div>
      ) : (
        <div className={s.list}>
          {pharmacies.map(p => (
            <div key={p._id} className={s.card}>
              <div className={s.cardMain}>
                <div className={s.cardInfo}>
                  <div>
                    <p className={s.pharmName}>{p.name}</p>
                    <p className={s.pharmAddr}>{p.address}</p>
                  </div>
                  <div className={s.metaRow}>
                    <span>{p.phone}</span>
                    {p.licenseNumber && <span>License: {p.licenseNumber}</span>}
                    {(p.email ?? p.user?.email) && <span>{p.email ?? p.user?.email}</span>}
                    {p.coverageAreas.length > 0 && <span>{p.coverageAreas.join(', ')}</span>}
                  </div>
                </div>
                <div className={s.cardRight}>
                  <span className={`${s.statusBadge} ${s[p.status]}`}>{capitalize(p.status)}</span>
                  <div className={s.actionRow}>
                    <button
                      className={s.kycBtn}
                      onClick={() => {
                        setKycPharmId(kycPharmId === p._id ? null : p._id)
                        setKycReason(''); setKycStatus('approved')
                      }}
                    >
                      {kycPharmId === p._id ? 'Close KYC' : 'Verify KYC'}
                    </button>
                    {p.status !== 'active' && (
                      <button className={s.approveBtn} disabled={updating === p._id} onClick={() => setStatus(p._id, 'active')}>
                        Approve
                      </button>
                    )}
                    {p.status === 'active' && (
                      <button className={s.suspendBtn} disabled={updating === p._id} onClick={() => setStatus(p._id, 'suspended')}>
                        Suspend
                      </button>
                    )}
                    {p.status === 'suspended' && (
                      <button className={s.approveBtn} disabled={updating === p._id} onClick={() => setStatus(p._id, 'active')}>
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* KYC panel */}
              {kycPharmId === p._id && (
                <div className={s.kycPanel}>
                  <p className={s.kycTitle}>Manual KYC Verification — {p.name}</p>
                  <p className={s.kycSub}>Override the CAC / KYC status for this pharmacy partner.</p>
                  <div className={s.kycRow}>
                    <select className={s.kycSelect} value={kycStatus} onChange={e => setKycStatus(e.target.value as any)}>
                      <option value='approved'>Approved — activate pharmacy</option>
                      <option value='rejected'>Rejected — suspend pharmacy</option>
                      <option value='pending'>Pending — reset to pending</option>
                    </select>
                    <button className={s.approveBtn} onClick={() => submitKyc(p)} disabled={kycSaving}>
                      {kycSaving ? 'Saving…' : 'Apply KYC'}
                    </button>
                  </div>
                  <input
                    className={s.kycReasonInput}
                    placeholder='Reason / note (optional)'
                    value={kycReason}
                    onChange={e => setKycReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Register Pharmacy modal ── */}
      {showRegister && (
        <>
          <div className={s.modalOverlay} onClick={() => setShowRegister(false)} />
          <div className={s.modal}>
            <div className={s.modalHead}>
              <h3>Register Pharmacy Partner</h3>
              <button className={s.closeBtn} onClick={() => setShowRegister(false)}>✕</button>
            </div>
            <form className={s.modalBody} onSubmit={submitRegister}>
              {formErr && <p className={s.formErr}>{formErr}</p>}
              <div className={s.formGrid}>
                <div className={s.fieldGroup}>
                  <label>Pharmacy Name *</label>
                  <input className={s.input} placeholder='e.g. HealthPlus Pharmacy' value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Email *</label>
                  <input className={s.input} type='email' placeholder='pharmacy@example.com' value={form.email}
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
                <div className={s.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Address *</label>
                  <input className={s.input} placeholder='Full address' value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>License Number</label>
                  <input className={s.input} placeholder='PCN license no.' value={form.licenseNumber}
                    onChange={e => setForm(p => ({ ...p, licenseNumber: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>CAC Number</label>
                  <input className={s.input} placeholder='RC000000' value={form.cacNumber}
                    onChange={e => setForm(p => ({ ...p, cacNumber: e.target.value }))} />
                </div>
                <div className={s.fieldGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Coverage Areas (comma-separated)</label>
                  <input className={s.input} placeholder='Lagos, Abuja, Port Harcourt' value={form.coverageAreas}
                    onChange={e => setForm(p => ({ ...p, coverageAreas: e.target.value }))} />
                </div>
                <label className={s.checkRow} style={{ gridColumn: '1 / -1' }}>
                  <input type='checkbox' checked={form.autoActivate}
                    onChange={e => setForm(p => ({ ...p, autoActivate: e.target.checked }))} />
                  <span>Auto-activate (skip review workflow)</span>
                </label>
              </div>
              <div className={s.modalFooter}>
                <button type='button' className={s.cancelBtn} onClick={() => setShowRegister(false)}>Cancel</button>
                <button type='submit' className={s.submitBtn} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Pharmacy'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

function capitalize (s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

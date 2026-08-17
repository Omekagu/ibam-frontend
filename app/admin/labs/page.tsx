'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { XIcon } from '@/components/icons'
import s from './page.module.scss'

interface TestRow { name: string; price: number | ''; turnaroundHours: number | '' }
interface Lab {
  _id: string
  name: string
  address: string
  phone: string
  email?: string
  licenseNumber?: string
  status: 'pending' | 'active' | 'inactive' | 'suspended'
  testsOffered: { name: string; price: number; turnaroundHours: number }[]
  coverageAreas: string[]
  createdAt: string
  user?: { _id?: string; name: string; email: string; isActive: boolean }
}

const STATUS_OPTS = ['pending', 'active', 'inactive', 'suspended'] as const
const EMPTY_ROW: TestRow = { name: '', price: '', turnaroundHours: 24 }

const BLANK = {
  name: '', email: '', phone: '', password: '',
  address: '', licenseNumber: '', cacNumber: '',
  coverageAreas: '', autoActivate: false,
}

export default function AdminLabsPage () {
  const modal = useStatusModal()
  const [labs,       setLabs]       = useState<Lab[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('')
  const [updating,   setUpdating]   = useState<string | null>(null)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [draftTests, setDraftTests] = useState<TestRow[]>([])
  const [saving,     setSaving]     = useState(false)
  const [saveErr,    setSaveErr]    = useState('')

  // Register modal
  const [showRegister, setShowRegister] = useState(false)
  const [form,         setForm]         = useState(BLANK)
  const [formErr,      setFormErr]      = useState('')
  const [creating,     setCreating]     = useState(false)

  // Manual KYC
  const [kycLabId,  setKycLabId]  = useState<string | null>(null)
  const [kycStatus, setKycStatus] = useState<'pending'|'approved'|'rejected'>('approved')
  const [kycReason, setKycReason] = useState('')
  const [kycSaving, setKycSaving] = useState(false)

  const [openingPortal, setOpeningPortal] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter ? `?status=${filter}` : ''
      const r = await api.get(`/admin/labs${params}`)
      setLabs(r.data.data?.labs ?? [])
    } catch {}
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

  function openEdit (lab: Lab) {
    setSaveErr('')
    const rows: TestRow[] = lab.testsOffered.length
      ? lab.testsOffered.map(t => ({ name: t.name, price: t.price, turnaroundHours: t.turnaroundHours }))
      : [{ ...EMPTY_ROW }]
    setDraftTests(rows)
    setEditingId(lab._id)
  }

  function updateRow (idx: number, field: keyof TestRow, value: string) {
    setDraftTests(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: field === 'name' ? value : value === '' ? '' : Number(value) } : t
    ))
    setSaveErr('')
  }

  function addRow () { setDraftTests(prev => [...prev, { ...EMPTY_ROW }]) }

  function removeRow (idx: number) {
    if (draftTests.length === 1) { setDraftTests([{ ...EMPTY_ROW }]); return }
    setDraftTests(prev => prev.filter((_, i) => i !== idx))
  }

  async function saveTests (labId: string) {
    const valid = draftTests.filter(t => t.name.trim() && t.price !== '')
    if (!valid.length) { setSaveErr('Add at least one test with a name and price.'); return }
    setSaving(true); setSaveErr('')
    try {
      const r = await api.put(`/admin/labs/${labId}/tests`, {
        testsOffered: valid.map(t => ({
          name: t.name.trim(),
          price: Number(t.price),
          turnaroundHours: t.turnaroundHours === '' ? 24 : Number(t.turnaroundHours),
        })),
      })
      const updated = r.data.data?.lab
      setLabs(prev => prev.map(l => l._id === labId ? { ...l, testsOffered: updated.testsOffered } : l))
      setEditingId(null)
      modal.show({ variant: 'success', title: 'Catalog Saved', message: 'Lab test catalog has been updated.' })
    } catch { setSaveErr('Failed to save. Please try again.') }
    setSaving(false)
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
      const r = await api.post('/admin/labs', form)
      const newLab: Lab = {
        ...r.data.data.lab,
        user: r.data.data.user,
      }
      setLabs(prev => [newLab, ...prev])
      setForm(BLANK)
      setShowRegister(false)
      modal.show({ variant: 'success', title: 'Lab Created', message: 'The lab account has been created successfully.' })
    } catch (err: any) {
      setFormErr(err?.response?.data?.message ?? 'Failed to create lab.')
    }
    setCreating(false)
  }

  async function openLabPortal (labId: string) {
    setOpeningPortal(labId)
    try {
      const r = await api.post(`/admin/labs/${labId}/impersonate`)
      const url: string = r.data.data?.url
      window.open(url, '_blank', 'noopener')
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'Error', message: err?.response?.data?.message ?? 'Could not open lab portal.' })
    }
    setOpeningPortal(null)
  }

  async function submitKyc (lab: Lab) {
    const userId = lab.user?._id
    if (!userId) { modal.show({ variant: 'declined', title: 'KYC Error', message: 'User ID not available.' }); return }
    setKycSaving(true)
    try {
      await api.put(`/admin/kyc/${userId}/verify`, { kycStatus, reason: kycReason })
      setLabs(prev => prev.map(l =>
        l._id === lab._id
          ? { ...l, status: kycStatus === 'approved' ? 'active' : kycStatus === 'rejected' ? 'suspended' : l.status }
          : l
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
          <h2 className={s.title}>Diagnostic Labs</h2>
          <span className={s.countBadge}>{labs.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <select className={s.filter} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value=''>All statuses</option>
            {STATUS_OPTS.map(o => <option key={o} value={o}>{cap(o)}</option>)}
          </select>
          <button className={s.registerBtn} onClick={() => { setForm(BLANK); setFormErr(''); setShowRegister(true) }}>
            + Register Lab
          </button>
        </div>
      </div>

      {loading ? (
        <div className={s.empty}><Loader label='Loading labs…' /></div>
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
                    <span>{lab.testsOffered.length} test{lab.testsOffered.length !== 1 ? 's' : ''}</span>
                    {lab.user?.email && <span>{lab.user.email}</span>}
                  </div>
                </div>
                <div className={s.cardRight}>
                  <span className={`${s.statusBadge} ${s[lab.status]}`}>{cap(lab.status)}</span>
                  <div className={s.actionRow}>
                    <button
                      className={s.testsBtn}
                      onClick={() => {
                        if (editingId === lab._id) { setEditingId(null); setKycLabId(null) }
                        else { openEdit(lab); setKycLabId(null) }
                      }}
                    >
                      {editingId === lab._id ? 'Close' : 'Manage Tests'}
                    </button>
                    <button
                      className={s.testsBtn}
                      onClick={() => {
                        setKycLabId(kycLabId === lab._id ? null : lab._id)
                        setKycReason(''); setKycStatus('approved')
                        setEditingId(null)
                      }}
                    >
                      {kycLabId === lab._id ? 'Close KYC' : 'Verify KYC'}
                    </button>
                    <button
                      className={s.portalBtn}
                      disabled={openingPortal === lab._id}
                      onClick={() => openLabPortal(lab._id)}
                      title="Open this lab&apos;s dashboard as admin"
                    >
                      {openingPortal === lab._id ? '…' : '↗ Open Lab Portal'}
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

              {/* KYC panel */}
              {kycLabId === lab._id && (
                <div className={s.testEditor}>
                  <div className={s.editorHead}>
                    <span className={s.editorTitle}>Manual KYC Verification — {lab.name}</span>
                    <p className={s.editorSub}>Override the KYC / verification status for this lab partner.</p>
                  </div>
                  <div className={s.kycRow}>
                    <select className={s.input} value={kycStatus} onChange={e => setKycStatus(e.target.value as any)}>
                      <option value='approved'>Approved — activate lab</option>
                      <option value='rejected'>Rejected — suspend lab</option>
                      <option value='pending'>Pending — reset to pending</option>
                    </select>
                    <button className={s.saveTestsBtn} onClick={() => submitKyc(lab)} disabled={kycSaving}>
                      {kycSaving ? 'Saving…' : 'Apply KYC'}
                    </button>
                  </div>
                  <input
                    className={s.input}
                    style={{ marginTop: '0.5rem' }}
                    placeholder='Reason / note (optional)'
                    value={kycReason}
                    onChange={e => setKycReason(e.target.value)}
                  />
                </div>
              )}

              {/* Test catalog editor */}
              {editingId === lab._id && (
                <div className={s.testEditor}>
                  <div className={s.editorHead}>
                    <span className={s.editorTitle}>Test Catalog — {lab.name}</span>
                    <p className={s.editorSub}>Add, edit, or remove tests. Only admin can modify this catalog.</p>
                  </div>
                  {saveErr && <p className={s.editorErr}>{saveErr}</p>}
                  <div className={s.tableHead}>
                    <span>Test Name</span><span>Price (₦)</span><span>Turnaround (hrs)</span><span />
                  </div>
                  <div className={s.tableBody}>
                    {draftTests.map((row, i) => (
                      <div key={i} className={s.tableRow}>
                        <input className={s.input} placeholder='e.g. Full Blood Count' value={row.name}
                          onChange={e => updateRow(i, 'name', e.target.value)} />
                        <input className={s.input} type='number' min={0} placeholder='e.g. 3500' value={row.price}
                          onChange={e => updateRow(i, 'price', e.target.value)} />
                        <input className={s.input} type='number' min={1} placeholder='24' value={row.turnaroundHours}
                          onChange={e => updateRow(i, 'turnaroundHours', e.target.value)} />
                        <button className={s.removeBtn} onClick={() => removeRow(i)} title='Remove'><XIcon size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className={s.editorFooter}>
                    <button className={s.addRowBtn} onClick={addRow}>+ Add Test</button>
                    <button className={s.saveTestsBtn} onClick={() => saveTests(lab._id)} disabled={saving}>
                      {saving ? 'Saving…' : 'Save Catalog'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Register Lab modal ── */}
      {showRegister && (
        <>
          <div className={s.modalOverlay} onClick={() => setShowRegister(false)} />
          <div className={s.modal}>
            <div className={s.modalHead}>
              <h3>Register Diagnostic Lab</h3>
              <button className={s.closeBtn} onClick={() => setShowRegister(false)}><XIcon size={14} /></button>
            </div>
            <form className={s.modalBody} onSubmit={submitRegister}>
              {formErr && <p className={s.editorErr}>{formErr}</p>}
              <div className={s.formGrid}>
                <div className={s.fieldGroup}>
                  <label>Lab Name *</label>
                  <input className={s.input} placeholder='e.g. MedLab Diagnostics' value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Email *</label>
                  <input className={s.input} type='email' placeholder='lab@example.com' value={form.email}
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
                  <input className={s.input} placeholder='Lab license no.' value={form.licenseNumber}
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
                <button type='submit' className={s.saveTestsBtn} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Lab'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

function cap (s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

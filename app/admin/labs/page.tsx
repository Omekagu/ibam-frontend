'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
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
  user?: { name: string; email: string; isActive: boolean }
}

const STATUS_OPTS = ['pending', 'active', 'inactive', 'suspended'] as const
const EMPTY_ROW: TestRow = { name: '', price: '', turnaroundHours: 24 }

export default function AdminLabsPage () {
  const [labs,       setLabs]       = useState<Lab[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('')
  const [updating,   setUpdating]   = useState<string | null>(null)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [draftTests, setDraftTests] = useState<TestRow[]>([])
  const [saving,     setSaving]     = useState(false)
  const [saveErr,    setSaveErr]    = useState('')

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
    setSaving(true)
    setSaveErr('')
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
    } catch { setSaveErr('Failed to save. Please try again.') }
    setSaving(false)
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
                    <span>{lab.testsOffered.length} test{lab.testsOffered.length !== 1 ? 's' : ''}</span>
                    {lab.user?.email && <span>{lab.user.email}</span>}
                  </div>
                </div>
                <div className={s.cardRight}>
                  <span className={`${s.statusBadge} ${s[lab.status]}`}>{cap(lab.status)}</span>
                  <div className={s.actionRow}>
                    <button
                      className={s.testsBtn}
                      onClick={() => editingId === lab._id ? setEditingId(null) : openEdit(lab)}
                    >
                      {editingId === lab._id ? 'Close' : 'Manage Tests'}
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

              {editingId === lab._id && (
                <div className={s.testEditor}>
                  <div className={s.editorHead}>
                    <span className={s.editorTitle}>Test Catalog — {lab.name}</span>
                    <p className={s.editorSub}>Add, edit, or remove tests. Only admin can modify this catalog.</p>
                  </div>

                  {saveErr && <p className={s.editorErr}>{saveErr}</p>}

                  <div className={s.tableHead}>
                    <span>Test Name</span>
                    <span>Price (₦)</span>
                    <span>Turnaround (hrs)</span>
                    <span />
                  </div>

                  <div className={s.tableBody}>
                    {draftTests.map((row, i) => (
                      <div key={i} className={s.tableRow}>
                        <input
                          className={s.input}
                          placeholder='e.g. Full Blood Count'
                          value={row.name}
                          onChange={e => updateRow(i, 'name', e.target.value)}
                        />
                        <input
                          className={s.input}
                          type='number'
                          min={0}
                          placeholder='e.g. 3500'
                          value={row.price}
                          onChange={e => updateRow(i, 'price', e.target.value)}
                        />
                        <input
                          className={s.input}
                          type='number'
                          min={1}
                          placeholder='24'
                          value={row.turnaroundHours}
                          onChange={e => updateRow(i, 'turnaroundHours', e.target.value)}
                        />
                        <button className={s.removeBtn} onClick={() => removeRow(i)} title='Remove'>✕</button>
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
    </div>
  )
}

function cap (s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

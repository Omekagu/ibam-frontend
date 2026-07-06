'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface TestRow {
  name: string
  price: number | ''
  turnaroundHours: number | ''
}

const EMPTY_ROW: TestRow = { name: '', price: '', turnaroundHours: 24 }

export default function ManageTestsPage () {
  const [tests,   setTests]   = useState<TestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/diagnostics/labs/profile')
      const offered = r.data.data?.lab?.testsOffered ?? []
      setTests(offered.length ? offered : [{ ...EMPTY_ROW }])
    } catch { setTests([{ ...EMPTY_ROW }]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function updateRow (idx: number, field: keyof TestRow, value: string) {
    setTests(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: field === 'name' ? value : value === '' ? '' : Number(value) } : t
    ))
    setSaved(false)
  }

  function addRow () { setTests(prev => [...prev, { ...EMPTY_ROW }]) }

  function removeRow (idx: number) {
    if (tests.length === 1) { setTests([{ ...EMPTY_ROW }]); return }
    setTests(prev => prev.filter((_, i) => i !== idx))
  }

  async function save () {
    setError('')
    const valid = tests.filter(t => t.name.trim() && t.price !== '' && Number(t.price) >= 0)
    if (!valid.length) { setError('Add at least one test with a name and price.'); return }
    setSaving(true)
    try {
      await api.put('/diagnostics/labs/tests', {
        testsOffered: valid.map(t => ({
          name: t.name.trim(),
          price: Number(t.price),
          turnaroundHours: t.turnaroundHours === '' ? 24 : Number(t.turnaroundHours),
        })),
      })
      setSaved(true)
    } catch { setError('Failed to save. Please try again.') }
    setSaving(false)
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Manage Tests</h1>
          <p className={s.subtitle}>Add, edit or remove the tests your lab offers to patients.</p>
        </div>
        <button className={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {saved  && <p className={s.successBanner}>Test catalog saved successfully.</p>}
      {error  && <p className={s.errorBanner}>{error}</p>}

      {loading ? (
        <p className={s.empty}>Loading your test catalog…</p>
      ) : (
        <div className={s.tableWrap}>
          <div className={s.tableHead}>
            <span>Test Name</span>
            <span>Price (₦)</span>
            <span>Turnaround (hrs)</span>
            <span />
          </div>

          <div className={s.tableBody}>
            {tests.map((row, i) => (
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

          <button className={s.addBtn} onClick={addRow}>+ Add Test</button>
        </div>
      )}

      <div className={s.hint}>
        <p>Turnaround time is how many hours after sample collection until results are ready.</p>
        <p>Only tests with a name and price will be saved. Incomplete rows are ignored.</p>
      </div>
    </div>
  )
}

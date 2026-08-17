'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { XIcon } from '@/components/icons'
import s from './page.module.scss'

interface Drug {
  _id?: string
  name: string
  price: number | ''
  unit: string
  requiresPrescription: boolean
  inStock: boolean
  adminApproved?: boolean
}

const EMPTY: Drug = { name: '', price: '', unit: 'pack', requiresPrescription: false, inStock: true }

export default function PharmacyCatalogPage () {
  const modal = useStatusModal()
  const [drugs,   setDrugs]   = useState<Drug[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/pharmacy/catalog')
      const list: Drug[] = r.data.data?.drugs ?? []
      setDrugs(list.length ? list : [{ ...EMPTY }])
    } catch { setDrugs([{ ...EMPTY }]) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function update (idx: number, field: keyof Drug, value: unknown) {
    setDrugs(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d))
  }

  function addRow () { setDrugs(prev => [...prev, { ...EMPTY }]) }

  function removeRow (idx: number) {
    if (drugs.length === 1) { setDrugs([{ ...EMPTY }]); return }
    setDrugs(prev => prev.filter((_, i) => i !== idx))
  }

  async function save () {
    const valid = drugs.filter(d => d.name.trim() && d.price !== '' && Number(d.price) >= 0)
    if (!valid.length) { modal.show({ variant: 'declined', title: 'Catalog Empty', message: 'Add at least one drug with a name and price.' }); return }
    setSaving(true)
    try {
      await api.put('/pharmacy/catalog', {
        drugs: valid.map(d => ({
          _id: d._id,
          name: d.name.trim(),
          price: Number(d.price),
          unit: d.unit || 'pack',
          requiresPrescription: Boolean(d.requiresPrescription),
          inStock: d.inStock !== false,
        })),
      })
      modal.show({ variant: 'success', title: 'Catalog Saved', message: 'Your drug catalog has been updated.' })
      load()
    } catch { modal.show({ variant: 'declined', title: 'Save Failed', message: 'Failed to save. Please try again.' }) }
    setSaving(false)
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Drug Catalog</h1>
          <p className={s.subtitle}>Manage the drugs your pharmacy offers. Changes are live immediately.</p>
        </div>
        <button className={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Catalog'}
        </button>
      </div>

      {loading ? <div className={s.empty}><Loader label='Loading catalog…' /></div> : (
        <div className={s.tableWrap}>
          <div className={s.tableHead}>
            <span>Drug Name</span>
            <span>Price (₦)</span>
            <span>Unit</span>
            <span>Rx Required</span>
            <span>In Stock</span>
            <span>Status</span>
            <span />
          </div>

          <div className={s.tableBody}>
            {drugs.map((drug, i) => (
              <div key={i} className={s.tableRow}>
                <input className={s.input} placeholder='e.g. Amoxicillin 500mg'
                  value={drug.name} onChange={e => update(i, 'name', e.target.value)} />
                <input className={`${s.input} ${s.numInput}`} type='number' min={0} placeholder='e.g. 1500'
                  value={drug.price} onChange={e => update(i, 'price', e.target.value === '' ? '' : Number(e.target.value))} />
                <input className={`${s.input} ${s.unitInput}`} placeholder='pack'
                  value={drug.unit} onChange={e => update(i, 'unit', e.target.value)} />
                <label className={s.toggle}>
                  <input type='checkbox' checked={drug.requiresPrescription}
                    onChange={e => update(i, 'requiresPrescription', e.target.checked)} />
                  <span>{drug.requiresPrescription ? 'Yes' : 'No'}</span>
                </label>
                <label className={s.toggle}>
                  <input type='checkbox' checked={drug.inStock}
                    onChange={e => update(i, 'inStock', e.target.checked)} />
                  <span>{drug.inStock ? 'Yes' : 'No'}</span>
                </label>
                <span className={drug.inStock ? s.approvedBadge : s.pendingBadge}>
                  {drug.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
                <button className={s.removeBtn} onClick={() => removeRow(i)} title='Remove'><XIcon size={14} /></button>
              </div>
            ))}
          </div>

          <button className={s.addBtn} onClick={addRow}>+ Add Drug</button>
        </div>
      )}

      <div className={s.hint}>
        <p>Drugs marked "Rx Required" will require patients to upload a prescription.</p>
        <p>Only in-stock drugs are visible to patients.</p>
      </div>
    </div>
  )
}

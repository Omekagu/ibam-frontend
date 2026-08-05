'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface Feature { text: string }

interface Plan {
  _id: string
  name: string
  description: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  isActive: boolean
  paystackPlanCode: string
}

const BLANK: Omit<Plan, '_id'> = {
  name: '',
  description: '',
  price: 0,
  interval: 'monthly',
  features: [],
  isActive: true,
  paystackPlanCode: '',
}

export default function AdminPlansPage () {
  const modal = useStatusModal()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => { load() }, [])

  async function load () {
    setLoading(true)
    try {
      const r = await api.get('/admin/plans')
      setPlans(r.data.data?.plans ?? [])
    } catch { modal.show({ variant: 'declined', title: 'Load Failed', message: 'Failed to load plans.' }) }
    setLoading(false)
  }

  function openNew () {
    setEditing({ _id: '', ...BLANK })
    setIsNew(true)
  }

  function openEdit (plan: Plan) {
    setEditing({ ...plan })
    setIsNew(false)
  }

  function closeEdit () {
    setEditing(null)
    setIsNew(false)
    setNewFeature('')
  }

  function field (key: keyof Plan, value: any) {
    setEditing(prev => prev ? { ...prev, [key]: value } : prev)
  }

  function addFeature () {
    if (!newFeature.trim() || !editing) return
    field('features', [...editing.features, newFeature.trim()])
    setNewFeature('')
  }

  function removeFeature (i: number) {
    if (!editing) return
    field('features', editing.features.filter((_, idx) => idx !== i))
  }

  async function save () {
    if (!editing) return
    if (!editing.name || !editing.price) { modal.show({ variant: 'declined', title: 'Missing Fields', message: 'Name and price are required.' }); return }
    setSaving(true)
    try {
      if (isNew) {
        const r = await api.post('/admin/plans', editing)
        setPlans(prev => [...prev, r.data.data.plan])
      } else {
        const r = await api.put(`/admin/plans/${editing._id}`, editing)
        setPlans(prev => prev.map(p => p._id === editing._id ? r.data.data.plan : p))
      }
      modal.show({ variant: 'success', title: isNew ? 'Plan Created' : 'Plan Updated', message: isNew ? 'Subscription plan created.' : 'Subscription plan updated.' })
      closeEdit()
    } catch { modal.show({ variant: 'declined', title: 'Save Failed', message: 'Failed to save plan.' }) }
    setSaving(false)
  }

  async function toggleActive (plan: Plan) {
    try {
      const r = await api.put(`/admin/plans/${plan._id}`, { ...plan, isActive: !plan.isActive })
      setPlans(prev => prev.map(p => p._id === plan._id ? r.data.data.plan : p))
    } catch { modal.show({ variant: 'declined', title: 'Update Failed', message: 'Failed to update plan.' }) }
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Subscription Plans</h1>
          <p className={s.subtitle}>Create and edit the plans shown to patients on the pricing page.</p>
        </div>
        <button className={s.newBtn} onClick={openNew}>+ New Plan</button>
      </div>

      {loading ? (
        <p className={s.empty}><Loader label='Loading plans…' /></p>
      ) : (
        <div className={s.planGrid}>
          {plans.map(plan => (
            <div key={plan._id} className={`${s.planCard} ${!plan.isActive ? s.inactive : ''}`}>
              <div className={s.planCardHead}>
                <div>
                  <p className={s.planName}>{plan.name}</p>
                  <p className={s.planPrice}>₦{plan.price.toLocaleString()} / {plan.interval === 'monthly' ? 'mo' : 'yr'}</p>
                </div>
                <span className={`${s.statusBadge} ${plan.isActive ? s.active : s.deactivated}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {plan.description && <p className={s.planDesc}>{plan.description}</p>}

              <ul className={s.featureList}>
                {plan.features.map((f, i) => (
                  <li key={i}><span className={s.featureDot} />  {f}</li>
                ))}
              </ul>

              {plan.paystackPlanCode && (
                <p className={s.paystackCode}>Paystack: <code>{plan.paystackPlanCode}</code></p>
              )}

              <div className={s.planActions}>
                <button className={s.editBtn} onClick={() => openEdit(plan)}>Edit</button>
                <button className={s.toggleBtn} onClick={() => toggleActive(plan)}>
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}

          {plans.length === 0 && (
            <p className={s.empty}>No plans yet. Create one to get started.</p>
          )}
        </div>
      )}

      {/* ── Edit / Create modal ── */}
      {editing && (
        <div className={s.overlay} onClick={closeEdit}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <h2>{isNew ? 'New Plan' : 'Edit Plan'}</h2>
              <button className={s.closeBtn} onClick={closeEdit}>✕</button>
            </div>

            <div className={s.modalBody}>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>Plan Name *</label>
                  <input value={editing.name} onChange={e => field('name', e.target.value)} placeholder='e.g. Personal' />
                </div>
                <div className={s.field}>
                  <label>Interval</label>
                  <select value={editing.interval} onChange={e => field('interval', e.target.value)}>
                    <option value='monthly'>Monthly</option>
                    <option value='yearly'>Yearly</option>
                  </select>
                </div>
              </div>

              <div className={s.field}>
                <label>Price (₦) *</label>
                <input type='number' min={0} value={editing.price} onChange={e => field('price', Number(e.target.value))} />
              </div>

              <div className={s.field}>
                <label>Description</label>
                <textarea rows={2} value={editing.description} onChange={e => field('description', e.target.value)} placeholder='Short description shown to users' />
              </div>

              <div className={s.field}>
                <label>Features</label>
                <div className={s.featureChips}>
                  {editing.features.map((f, i) => (
                    <div key={i} className={s.featureChip}>
                      <span>{f}</span>
                      <button type='button' onClick={() => removeFeature(i)}>×</button>
                    </div>
                  ))}
                </div>
                <div className={s.featureInput}>
                  <input
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    placeholder='Add a feature…'
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
                  />
                  <button type='button' onClick={addFeature}>Add</button>
                </div>
              </div>

              <div className={s.field}>
                <label>Paystack Plan Code <span className={s.hint}>(optional — required for card subscriptions)</span></label>
                <input value={editing.paystackPlanCode} onChange={e => field('paystackPlanCode', e.target.value)} placeholder='PLN_xxxx' />
              </div>

              <div className={s.toggleRow}>
                <span>Plan is active (visible to patients)</span>
                <button
                  type='button'
                  className={`${s.toggle} ${editing.isActive ? s.toggleOn : ''}`}
                  onClick={() => field('isActive', !editing.isActive)}
                >
                  <span className={s.toggleThumb} />
                </button>
              </div>
            </div>

            <div className={s.modalFoot}>
              <button className={s.cancelBtn} onClick={closeEdit}>Cancel</button>
              <button className={s.saveBtn} onClick={save} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create Plan' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

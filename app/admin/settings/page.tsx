'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

// ─── Payment settings ─────────────────────────────────────────────────────────
interface PaymentSettings {
  directPaymentEnabled: boolean
  companyBankName: string
  companyAccountNumber: string
  companyAccountName: string
  companyBankCode: string
  directPaymentNote: string
}

const DEFAULT_PAYMENT: PaymentSettings = {
  directPaymentEnabled: false,
  companyBankName: '',
  companyAccountNumber: '',
  companyAccountName: '',
  companyBankCode: '',
  directPaymentNote: '',
}

function PaymentTab() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api.get('/admin/settings')
      .then(r => setSettings({ ...DEFAULT_PAYMENT, ...r.data.data?.settings }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setError(''); setSaving(true); setSaved(false)
    try {
      await api.put('/admin/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setError('Failed to save settings.') }
    setSaving(false)
  }

  function field(key: keyof PaymentSettings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  if (loading) return <p className={s.empty}>Loading…</p>

  return (
    <div className={s.card}>
      {saved  && <p className={s.successBanner}>Settings saved successfully.</p>}
      {error  && <p className={s.errorBanner}>{error}</p>}

      <h2 className={s.sectionTitle}>Direct Bank Transfer</h2>
      <p className={s.subtext}>
        When enabled, patients will see your company bank details on the payment page as an alternative to card.
      </p>

      <div className={s.toggleRow}>
        <div>
          <p className={s.toggleLabel}>Accept Direct Bank Transfers</p>
          <p className={s.toggleSub}>Patients can transfer directly to your company account</p>
        </div>
        <button
          className={`${s.toggle} ${settings.directPaymentEnabled ? s.toggleOn : ''}`}
          onClick={() => { setSettings(p => ({ ...p, directPaymentEnabled: !p.directPaymentEnabled })); setSaved(false) }}
          aria-pressed={settings.directPaymentEnabled}
        >
          <span className={s.toggleThumb} />
        </button>
      </div>

      <h2 className={s.sectionTitle} style={{ marginTop: '0.5rem' }}>Company Bank Details</h2>
      <p className={s.subtext}>These details are shown to patients when direct transfer is enabled.</p>

      <div className={s.row2}>
        <div className={s.field}>
          <label>Bank Name</label>
          <input className={s.input} value={settings.companyBankName} onChange={e => field('companyBankName', e.target.value)} placeholder="e.g. First Bank" />
        </div>
        <div className={s.field}>
          <label>Bank Code <span className={s.hint}>(optional)</span></label>
          <input className={s.input} value={settings.companyBankCode} onChange={e => field('companyBankCode', e.target.value)} placeholder="e.g. 011" />
        </div>
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label>Account Number</label>
          <input className={s.input} value={settings.companyAccountNumber} onChange={e => field('companyAccountNumber', e.target.value)} placeholder="10-digit NUBAN" maxLength={10} />
        </div>
        <div className={s.field}>
          <label>Account Name</label>
          <input className={s.input} value={settings.companyAccountName} onChange={e => field('companyAccountName', e.target.value)} placeholder="As registered with the bank" />
        </div>
      </div>

      <div className={s.field}>
        <label>Transfer Note <span className={s.hint}>(shown to patient)</span></label>
        <input className={s.input} value={settings.directPaymentNote} onChange={e => field('directPaymentNote', e.target.value)} placeholder='e.g. "Use your name + appointment ID as description"' />
      </div>

      <button className={s.saveBtn} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  )
}

// ─── Specializations ──────────────────────────────────────────────────────────
interface Spec {
  _id: string
  name: string
  description?: string
  isActive: boolean
  order: number
}

function SpecializationsTab() {
  const [items,   setItems]   = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [modal,   setModal]   = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Spec | null>(null)
  const [form,    setForm]    = useState({ name: '', description: '' })

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/specializations')
      .then(r => setItems(r.data.data?.specializations ?? []))
      .catch(() => setError('Failed to load specializations.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setForm({ name: '', description: '' })
    setEditing(null)
    setModal('add')
  }

  function openEdit(item: Spec) {
    setForm({ name: item.name, description: item.description ?? '' })
    setEditing(item)
    setModal('edit')
  }

  async function submit() {
    if (!form.name.trim()) return
    setSaving(true); setError('')
    try {
      if (modal === 'add') {
        await api.post('/admin/specializations', form)
      } else if (editing) {
        await api.put(`/admin/specializations/${editing._id}`, form)
      }
      setModal(null)
      load()
    } catch { setError('Failed to save specialization.') }
    setSaving(false)
  }

  async function toggle(item: Spec) {
    try {
      await api.put(`/admin/specializations/${item._id}`, { isActive: !item.isActive })
      load()
    } catch { setError('Failed to update.') }
  }

  async function remove(item: Spec) {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await api.delete(`/admin/specializations/${item._id}`)
      load()
    } catch { setError('Failed to delete.') }
  }

  return (
    <div className={s.card}>
      {error && <p className={s.errorBanner}>{error}</p>}

      <div className={s.listHeader}>
        <p className={s.listTitle}>Doctor Specializations</p>
        <button className={s.addBtn} onClick={openAdd}>+ Add</button>
      </div>

      {loading ? (
        <p className={s.empty}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={s.empty}>No specializations yet.</p>
      ) : (
        <div className={s.itemList}>
          {items.map(item => (
            <div key={item._id} className={`${s.itemRow} ${item.isActive ? '' : s.inactive}`}>
              <span className={s.itemName}>{item.name}</span>
              {item.description && <span className={s.itemSub}>{item.description}</span>}
              <span className={`${s.badge} ${item.isActive ? s.badgeActive : s.badgeInactive}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className={s.rowActions}>
                <button className={s.iconBtn} onClick={() => openEdit(item)}>Edit</button>
                <button className={s.iconBtn} onClick={() => toggle(item)}>
                  {item.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className={`${s.iconBtn} ${s.danger}`} onClick={() => remove(item)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className={s.modal}>
            <div className={s.modalHead}>
              <h2>{modal === 'add' ? 'Add Specialization' : 'Edit Specialization'}</h2>
              <button className={s.closeBtn} onClick={() => setModal(null)}>×</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.field}>
                <label>Name *</label>
                <input className={s.input} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Cardiology" />
              </div>
              <div className={s.field}>
                <label>Description <span className={s.hint}>(optional)</span></label>
                <input className={s.input} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" />
              </div>
            </div>
            <div className={s.modalFoot}>
              <button className={s.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button className={s.confirmBtn} onClick={submit} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Platform Services ─────────────────────────────────────────────────────────
interface Service {
  _id: string
  iconName: string
  tagLabel: string
  title: string
  description: string
  steps: string[]
  visualLabel: string
  visualSub: string
  cta: string
  ctaHref: string
  order: number
  isActive: boolean
}

const ICON_OPTIONS = ['video', 'ai', 'lab', 'pharmacy', 'hospital', 'truck']

const EMPTY_SERVICE = {
  iconName: 'video', tagLabel: '', title: '', description: '',
  steps: [] as string[], visualLabel: '', visualSub: '', cta: '', ctaHref: '',
}

function ServicesTab() {
  const [items,   setItems]   = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [modal,   setModal]   = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form,    setForm]    = useState(EMPTY_SERVICE)
  const [stepInput, setStepInput] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/services')
      .then(r => setItems(r.data.data?.services ?? []))
      .catch(() => setError('Failed to load services.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setForm(EMPTY_SERVICE)
    setEditing(null)
    setModal('add')
    setStepInput('')
  }

  function openEdit(item: Service) {
    setForm({
      iconName: item.iconName, tagLabel: item.tagLabel, title: item.title,
      description: item.description, steps: [...item.steps],
      visualLabel: item.visualLabel, visualSub: item.visualSub,
      cta: item.cta, ctaHref: item.ctaHref,
    })
    setEditing(item)
    setModal('edit')
    setStepInput('')
  }

  function addStep() {
    const t = stepInput.trim()
    if (!t) return
    setForm(p => ({ ...p, steps: [...p.steps, t] }))
    setStepInput('')
  }

  function removeStep(i: number) {
    setForm(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }))
  }

  async function submit() {
    if (!form.title.trim() || !form.tagLabel.trim()) return
    setSaving(true); setError('')
    try {
      if (modal === 'add') {
        await api.post('/admin/services', form)
      } else if (editing) {
        await api.put(`/admin/services/${editing._id}`, form)
      }
      setModal(null)
      load()
    } catch { setError('Failed to save service.') }
    setSaving(false)
  }

  async function toggle(item: Service) {
    try {
      await api.put(`/admin/services/${item._id}`, { isActive: !item.isActive })
      load()
    } catch { setError('Failed to update.') }
  }

  async function remove(item: Service) {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      await api.delete(`/admin/services/${item._id}`)
      load()
    } catch { setError('Failed to delete.') }
  }

  const f = (key: keyof typeof EMPTY_SERVICE, val: string) =>
    setForm(p => ({ ...p, [key]: val }))

  return (
    <div className={s.card}>
      {error && <p className={s.errorBanner}>{error}</p>}

      <div className={s.listHeader}>
        <p className={s.listTitle}>Platform Services</p>
        <button className={s.addBtn} onClick={openAdd}>+ Add</button>
      </div>

      {loading ? (
        <p className={s.empty}>Loading…</p>
      ) : items.length === 0 ? (
        <p className={s.empty}>No services yet.</p>
      ) : (
        <div className={s.itemList}>
          {items.map(item => (
            <div key={item._id} className={`${s.itemRow} ${item.isActive ? '' : s.inactive}`}>
              <span className={s.itemName}>{item.title}</span>
              <span className={s.itemSub}>{item.tagLabel}</span>
              <span className={`${s.badge} ${item.isActive ? s.badgeActive : s.badgeInactive}`}>
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className={s.rowActions}>
                <button className={s.iconBtn} onClick={() => openEdit(item)}>Edit</button>
                <button className={s.iconBtn} onClick={() => toggle(item)}>
                  {item.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className={`${s.iconBtn} ${s.danger}`} onClick={() => remove(item)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className={s.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className={s.modal} style={{ maxWidth: 560 }}>
            <div className={s.modalHead}>
              <h2>{modal === 'add' ? 'Add Service' : 'Edit Service'}</h2>
              <button className={s.closeBtn} onClick={() => setModal(null)}>×</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>Title *</label>
                  <input className={s.input} value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Telemedicine" />
                </div>
                <div className={s.field}>
                  <label>Tag Label *</label>
                  <input className={s.input} value={form.tagLabel} onChange={e => f('tagLabel', e.target.value)} placeholder="e.g. Video & Audio" />
                </div>
              </div>

              <div className={s.row2}>
                <div className={s.field}>
                  <label>Icon</label>
                  <select className={s.input} value={form.iconName} onChange={e => f('iconName', e.target.value)}>
                    {ICON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label>CTA Text</label>
                  <input className={s.input} value={form.cta} onChange={e => f('cta', e.target.value)} placeholder="e.g. Find a Doctor" />
                </div>
              </div>

              <div className={s.field}>
                <label>Description</label>
                <textarea
                  className={s.input}
                  value={form.description}
                  onChange={e => f('description', e.target.value)}
                  rows={3}
                  placeholder="Service description…"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className={s.field}>
                <label>Steps <span className={s.hint}>(one per line)</span></label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className={s.input}
                    value={stepInput}
                    onChange={e => setStepInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep() } }}
                    placeholder="Add a step and press Enter"
                  />
                  <button className={s.iconBtn} onClick={addStep} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Add</button>
                </div>
                {form.steps.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                    {form.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>{i + 1}. {step}</span>
                        <button className={`${s.iconBtn} ${s.danger}`} onClick={() => removeStep(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={s.row2}>
                <div className={s.field}>
                  <label>Visual Label</label>
                  <input className={s.input} value={form.visualLabel} onChange={e => f('visualLabel', e.target.value)} placeholder="Short headline" />
                </div>
                <div className={s.field}>
                  <label>CTA Link</label>
                  <input className={s.input} value={form.ctaHref} onChange={e => f('ctaHref', e.target.value)} placeholder="/signup" />
                </div>
              </div>

              <div className={s.field}>
                <label>Visual Subtitle</label>
                <input className={s.input} value={form.visualSub} onChange={e => f('visualSub', e.target.value)} placeholder="Supporting text under the icon" />
              </div>
            </div>
            <div className={s.modalFoot}>
              <button className={s.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button className={s.confirmBtn} onClick={submit} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Tab = 'payment' | 'specializations' | 'services'

const TABS: { id: Tab; label: string }[] = [
  { id: 'payment',         label: 'Payment' },
  { id: 'specializations', label: 'Specializations' },
  { id: 'services',        label: 'Services' },
]

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('payment')

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Platform Settings</h1>
        <p className={s.subtitle}>Manage payment methods, doctor specializations, and platform services.</p>
      </div>

      <div className={s.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${s.tab} ${tab === t.id ? s.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'payment'         && <PaymentTab />}
      {tab === 'specializations' && <SpecializationsTab />}
      {tab === 'services'        && <ServicesTab />}
    </div>
  )
}

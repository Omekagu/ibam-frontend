'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

// ─── Payment settings ─────────────────────────────────────────────────────────
interface PaymentSettings {
  paystackEnabled: boolean
  paystackKeySet: boolean
  paystackPublicKey: string
  directPaymentEnabled: boolean
  companyBankName: string
  companyAccountNumber: string
  companyAccountName: string
  companyBankCode: string
  directPaymentNote: string
}

const DEFAULT_PAYMENT: PaymentSettings = {
  paystackEnabled: true,
  paystackKeySet: false,
  paystackPublicKey: '',
  directPaymentEnabled: false,
  companyBankName: '',
  companyAccountNumber: '',
  companyAccountName: '',
  companyBankCode: '',
  directPaymentNote: ''
}

function PaymentTab () {
  const modal = useStatusModal()
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [otpMode, setOtpMode] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otp, setOtp] = useState('')
  const [newSecretKey, setNewSecretKey] = useState('')
  const [newPublicKey, setNewPublicKey] = useState('')

  useEffect(() => {
    api
      .get('/admin/settings')
      .then(r => setSettings({ ...DEFAULT_PAYMENT, ...r.data.data?.settings }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function sendOtp () {
    setOtpSending(true)
    try {
      await api.post('/admin/settings/request-otp')
      setOtpSent(true)
    } catch {
      modal.show({
        variant: 'declined',
        title: 'OTP Failed',
        message: 'Could not send OTP. Try again.'
      })
    }
    setOtpSending(false)
  }

  async function save () {
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = {
        paystackEnabled: settings.paystackEnabled,
        directPaymentEnabled: settings.directPaymentEnabled,
        companyBankName: settings.companyBankName,
        companyAccountNumber: settings.companyAccountNumber,
        companyAccountName: settings.companyAccountName,
        companyBankCode: settings.companyBankCode,
        directPaymentNote: settings.directPaymentNote
      }
      if (otpMode && newSecretKey.trim()) {
        body.paystackSecretKey = newSecretKey.trim()
        body.paystackPublicKey = newPublicKey.trim()
        if (settings.paystackKeySet) body.otp = otp
      }
      const r = await api.put('/admin/settings', body)
      setSettings(prev => ({ ...prev, ...r.data.data?.settings }))
      setOtpMode(false)
      setOtpSent(false)
      setOtp('')
      setNewSecretKey('')
      setNewPublicKey('')
      modal.show({
        variant: 'success',
        title: 'Settings Saved',
        message: 'Payment settings have been updated.'
      })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      modal.show({
        variant: 'declined',
        title: 'Save Failed',
        message: msg ?? 'Failed to save settings.'
      })
    }
    setSaving(false)
  }

  function field (key: keyof PaymentSettings, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading)
    return (
      <div className={s.empty}>
        <Loader label='Loading…' />
      </div>
    )

  return (
    <div className={s.card}>
      <h2 className={s.sectionTitle}>Paystack</h2>
      <p className={s.subtext}>
        Configure Paystack integration. API keys are stored securely in the
        database. Changes to API keys require email OTP verification.
      </p>

      <div className={s.toggleRow}>
        <div>
          <p className={s.toggleLabel}>Accept Paystack Payments</p>
          <p className={s.toggleSub}>Card, bank transfer, USSD, and more </p>
        </div>
        <button
          className={`${s.toggle} ${
            settings.paystackEnabled ? s.toggleOn : ''
          }`}
          onClick={() =>
            setSettings(p => ({ ...p, paystackEnabled: !p.paystackEnabled }))
          }
          aria-pressed={settings.paystackEnabled}
        >
          <span className={s.toggleThumb} />
        </button>
      </div>

      {/* API Keys */}
      <div className={s.keySection}>
        <div className={s.keySectionHead}>
          <div>
            <p className={s.sectionTitle}>API Keys</p>
            <p className={s.subtext} style={{ marginTop: 4 }}>
              {settings.paystackKeySet
                ? 'Keys are saved and active.'
                : 'No keys saved yet — add them below.'}
            </p>
          </div>
          {settings.paystackKeySet && !otpMode && (
            <button className={s.editKeyBtn} onClick={() => setOtpMode(true)}>
              Change Keys
            </button>
          )}
        </div>

        {settings.paystackKeySet && !otpMode ? (
          <div className={s.lockedKeyRow}>
            <div className={s.lockedKeyItem}>
              <span className={s.lockedKeyLabel}>Secret Key</span>
              <span className={s.lockedKeyValue}>
                sk_••••••••••••••••••••••••••••••
              </span>
            </div>
            <div className={s.lockedKeyItem}>
              <span className={s.lockedKeyLabel}>Public Key</span>
              <span className={s.lockedKeyValue}>
                {settings.paystackPublicKey ||
                  'pk_••••••••••••••••••••••••••••••'}
              </span>
            </div>
          </div>
        ) : (
          <>
            {settings.paystackKeySet && !otpSent && (
              <div className={s.otpPrompt}>
                <p className={s.otpPromptText}>
                  An OTP will be sent to your admin email to authorize this
                  change.
                </p>
                <div className={s.otpBtnRow}>
                  <button
                    className={s.otpSendBtn}
                    onClick={sendOtp}
                    disabled={otpSending}
                  >
                    {otpSending ? 'Sending…' : 'Send OTP to my email'}
                  </button>
                  <button
                    className={s.cancelKeyBtn}
                    onClick={() => {
                      setOtpMode(false)
                      setOtpSent(false)
                      setOtp('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {(!settings.paystackKeySet || otpSent) && (
              <>
                {settings.paystackKeySet && (
                  <div className={s.field}>
                    <label>
                      OTP <span className={s.hint}>(check your email)</span>
                    </label>
                    <input
                      className={s.input}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder='6-digit OTP'
                      maxLength={6}
                      style={{ maxWidth: 200 }}
                    />
                  </div>
                )}
                <div className={s.row2}>
                  <div className={s.field}>
                    <label>Secret Key</label>
                    <input
                      className={s.input}
                      value={newSecretKey}
                      onChange={e => setNewSecretKey(e.target.value)}
                      placeholder='sk_live_…'
                      type='password'
                      autoComplete='new-password'
                    />
                  </div>
                  <div className={s.field}>
                    <label>Public Key</label>
                    <input
                      className={s.input}
                      value={newPublicKey}
                      onChange={e => setNewPublicKey(e.target.value)}
                      placeholder='pk_live_…'
                    />
                  </div>
                </div>
                {settings.paystackKeySet && (
                  <button
                    className={s.cancelKeyBtn}
                    onClick={() => {
                      setOtpMode(false)
                      setOtpSent(false)
                      setOtp('')
                    }}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Cancel
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className={s.divider} />

      <h2 className={s.sectionTitle}>Direct Bank Transfer</h2>
      <p className={s.subtext}>
        When enabled, patients will see your company bank details on the payment
        page as an alternative to card.
      </p>

      <div className={s.toggleRow}>
        <div>
          <p className={s.toggleLabel}>Accept Direct Bank Transfers</p>
          <p className={s.toggleSub}>
            Patients can transfer directly to your company account
          </p>
        </div>
        <button
          className={`${s.toggle} ${
            settings.directPaymentEnabled ? s.toggleOn : ''
          }`}
          onClick={() =>
            setSettings(p => ({
              ...p,
              directPaymentEnabled: !p.directPaymentEnabled
            }))
          }
          aria-pressed={settings.directPaymentEnabled}
        >
          <span className={s.toggleThumb} />
        </button>
      </div>

      <h2 className={s.sectionTitle} style={{ marginTop: '0.5rem' }}>
        Company Bank Details
      </h2>
      <p className={s.subtext}>
        These details are shown to patients when direct transfer is enabled.
      </p>

      <div className={s.row2}>
        <div className={s.field}>
          <label>Bank Name</label>
          <input
            className={s.input}
            value={settings.companyBankName}
            onChange={e => field('companyBankName', e.target.value)}
            placeholder='e.g. First Bank'
          />
        </div>
        <div className={s.field}>
          <label>
            Bank Code <span className={s.hint}>(optional)</span>
          </label>
          <input
            className={s.input}
            value={settings.companyBankCode}
            onChange={e => field('companyBankCode', e.target.value)}
            placeholder='e.g. 011'
          />
        </div>
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label>Account Number</label>
          <input
            className={s.input}
            value={settings.companyAccountNumber}
            onChange={e => field('companyAccountNumber', e.target.value)}
            placeholder='10-digit NUBAN'
            maxLength={10}
          />
        </div>
        <div className={s.field}>
          <label>Account Name</label>
          <input
            className={s.input}
            value={settings.companyAccountName}
            onChange={e => field('companyAccountName', e.target.value)}
            placeholder='As registered with the bank'
          />
        </div>
      </div>

      <div className={s.field}>
        <label>
          Transfer Note <span className={s.hint}>(shown to patient)</span>
        </label>
        <input
          className={s.input}
          value={settings.directPaymentNote}
          onChange={e => field('directPaymentNote', e.target.value)}
          placeholder='e.g. "Use your name + appointment ID as description"'
        />
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

function SpecializationsTab () {
  const statusModal = useStatusModal()
  const [items, setItems] = useState<Spec[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Spec | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/admin/specializations')
      .then(r => setItems(r.data.data?.specializations ?? []))
      .catch(() =>
        statusModal.show({
          variant: 'declined',
          title: 'Load Failed',
          message: 'Failed to load specializations.'
        })
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openAdd () {
    setForm({ name: '', description: '' })
    setEditing(null)
    setModal('add')
  }

  function openEdit (item: Spec) {
    setForm({ name: item.name, description: item.description ?? '' })
    setEditing(item)
    setModal('edit')
  }

  async function submit () {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/admin/specializations', form)
      } else if (editing) {
        await api.put(`/admin/specializations/${editing._id}`, form)
      }
      setModal(null)
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Save Failed',
        message: 'Failed to save specialization.'
      })
    }
    setSaving(false)
  }

  async function toggle (item: Spec) {
    try {
      await api.put(`/admin/specializations/${item._id}`, {
        isActive: !item.isActive
      })
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Update Failed',
        message: 'Failed to update specialization.'
      })
    }
  }

  async function remove (item: Spec) {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await api.delete(`/admin/specializations/${item._id}`)
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Delete Failed',
        message: 'Failed to delete specialization.'
      })
    }
  }

  return (
    <div className={s.card}>
      <div className={s.listHeader}>
        <p className={s.listTitle}>Doctor Specializations</p>
        <button className={s.addBtn} onClick={openAdd}>
          + Add
        </button>
      </div>

      {loading ? (
        <div className={s.empty}>
          <Loader label='Loading…' />
        </div>
      ) : items.length === 0 ? (
        <p className={s.empty}>No specializations yet.</p>
      ) : (
        <div className={s.itemList}>
          {items.map(item => (
            <div
              key={item._id}
              className={`${s.itemRow} ${item.isActive ? '' : s.inactive}`}
            >
              <span className={s.itemName}>{item.name}</span>
              {item.description && (
                <span className={s.itemSub}>{item.description}</span>
              )}
              <span
                className={`${s.badge} ${
                  item.isActive ? s.badgeActive : s.badgeInactive
                }`}
              >
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className={s.rowActions}>
                <button className={s.iconBtn} onClick={() => openEdit(item)}>
                  Edit
                </button>
                <button className={s.iconBtn} onClick={() => toggle(item)}>
                  {item.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  className={`${s.iconBtn} ${s.danger}`}
                  onClick={() => remove(item)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div
          className={s.overlay}
          onClick={e => {
            if (e.target === e.currentTarget) setModal(null)
          }}
        >
          <div className={s.modal}>
            <div className={s.modalHead}>
              <h2>
                {modal === 'add' ? 'Add Specialization' : 'Edit Specialization'}
              </h2>
              <button className={s.closeBtn} onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.field}>
                <label>Name *</label>
                <input
                  className={s.input}
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder='e.g. Cardiology'
                />
              </div>
              <div className={s.field}>
                <label>
                  Description <span className={s.hint}>(optional)</span>
                </label>
                <input
                  className={s.input}
                  value={form.description}
                  onChange={e =>
                    setForm(p => ({ ...p, description: e.target.value }))
                  }
                  placeholder='Short description'
                />
              </div>
            </div>
            <div className={s.modalFoot}>
              <button className={s.cancelBtn} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className={s.confirmBtn}
                onClick={submit}
                disabled={saving || !form.name.trim()}
              >
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
  iconName: 'video',
  tagLabel: '',
  title: '',
  description: '',
  steps: [] as string[],
  visualLabel: '',
  visualSub: '',
  cta: '',
  ctaHref: ''
}

function ServicesTab () {
  const statusModal = useStatusModal()
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState(EMPTY_SERVICE)
  const [stepInput, setStepInput] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/admin/services')
      .then(r => setItems(r.data.data?.services ?? []))
      .catch(() =>
        statusModal.show({
          variant: 'declined',
          title: 'Load Failed',
          message: 'Failed to load services.'
        })
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openAdd () {
    setForm(EMPTY_SERVICE)
    setEditing(null)
    setModal('add')
    setStepInput('')
  }

  function openEdit (item: Service) {
    setForm({
      iconName: item.iconName,
      tagLabel: item.tagLabel,
      title: item.title,
      description: item.description,
      steps: [...item.steps],
      visualLabel: item.visualLabel,
      visualSub: item.visualSub,
      cta: item.cta,
      ctaHref: item.ctaHref
    })
    setEditing(item)
    setModal('edit')
    setStepInput('')
  }

  function addStep () {
    const t = stepInput.trim()
    if (!t) return
    setForm(p => ({ ...p, steps: [...p.steps, t] }))
    setStepInput('')
  }

  function removeStep (i: number) {
    setForm(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }))
  }

  async function submit () {
    if (!form.title.trim() || !form.tagLabel.trim()) return
    setSaving(true)
    try {
      if (modal === 'add') {
        await api.post('/admin/services', form)
      } else if (editing) {
        await api.put(`/admin/services/${editing._id}`, form)
      }
      setModal(null)
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Save Failed',
        message: 'Failed to save service.'
      })
    }
    setSaving(false)
  }

  async function toggle (item: Service) {
    try {
      await api.put(`/admin/services/${item._id}`, { isActive: !item.isActive })
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Update Failed',
        message: 'Failed to update service.'
      })
    }
  }

  async function remove (item: Service) {
    if (!confirm(`Delete "${item.title}"?`)) return
    try {
      await api.delete(`/admin/services/${item._id}`)
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Delete Failed',
        message: 'Failed to delete service.'
      })
    }
  }

  const f = (key: keyof typeof EMPTY_SERVICE, val: string) =>
    setForm(p => ({ ...p, [key]: val }))

  return (
    <div className={s.card}>
      <div className={s.listHeader}>
        <p className={s.listTitle}>Platform Services</p>
        <button className={s.addBtn} onClick={openAdd}>
          + Add
        </button>
      </div>

      {loading ? (
        <div className={s.empty}>
          <Loader label='Loading…' />
        </div>
      ) : items.length === 0 ? (
        <p className={s.empty}>No services yet.</p>
      ) : (
        <div className={s.itemList}>
          {items.map(item => (
            <div
              key={item._id}
              className={`${s.itemRow} ${item.isActive ? '' : s.inactive}`}
            >
              <span className={s.itemName}>{item.title}</span>
              <span className={s.itemSub}>{item.tagLabel}</span>
              <span
                className={`${s.badge} ${
                  item.isActive ? s.badgeActive : s.badgeInactive
                }`}
              >
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className={s.rowActions}>
                <button className={s.iconBtn} onClick={() => openEdit(item)}>
                  Edit
                </button>
                <button className={s.iconBtn} onClick={() => toggle(item)}>
                  {item.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  className={`${s.iconBtn} ${s.danger}`}
                  onClick={() => remove(item)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div
          className={s.overlay}
          onClick={e => {
            if (e.target === e.currentTarget) setModal(null)
          }}
        >
          <div className={s.modal} style={{ maxWidth: 560 }}>
            <div className={s.modalHead}>
              <h2>{modal === 'add' ? 'Add Service' : 'Edit Service'}</h2>
              <button className={s.closeBtn} onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>Title *</label>
                  <input
                    className={s.input}
                    value={form.title}
                    onChange={e => f('title', e.target.value)}
                    placeholder='e.g. Telemedicine'
                  />
                </div>
                <div className={s.field}>
                  <label>Tag Label *</label>
                  <input
                    className={s.input}
                    value={form.tagLabel}
                    onChange={e => f('tagLabel', e.target.value)}
                    placeholder='e.g. Video & Audio'
                  />
                </div>
              </div>

              <div className={s.row2}>
                <div className={s.field}>
                  <label>Icon</label>
                  <select
                    className={s.input}
                    value={form.iconName}
                    onChange={e => f('iconName', e.target.value)}
                  >
                    {ICON_OPTIONS.map(o => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.field}>
                  <label>CTA Text</label>
                  <input
                    className={s.input}
                    value={form.cta}
                    onChange={e => f('cta', e.target.value)}
                    placeholder='e.g. Find a Doctor'
                  />
                </div>
              </div>

              <div className={s.field}>
                <label>Description</label>
                <textarea
                  className={s.input}
                  value={form.description}
                  onChange={e => f('description', e.target.value)}
                  rows={3}
                  placeholder='Service description…'
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className={s.field}>
                <label>
                  Steps <span className={s.hint}>(one per line)</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className={s.input}
                    value={stepInput}
                    onChange={e => setStepInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addStep()
                      }
                    }}
                    placeholder='Add a step and press Enter'
                  />
                  <button
                    className={s.iconBtn}
                    onClick={addStep}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    Add
                  </button>
                </div>
                {form.steps.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      marginTop: 6
                    }}
                  >
                    {form.steps.map((step, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            flex: 1
                          }}
                        >
                          {i + 1}. {step}
                        </span>
                        <button
                          className={`${s.iconBtn} ${s.danger}`}
                          onClick={() => removeStep(i)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={s.row2}>
                <div className={s.field}>
                  <label>Visual Label</label>
                  <input
                    className={s.input}
                    value={form.visualLabel}
                    onChange={e => f('visualLabel', e.target.value)}
                    placeholder='Short headline'
                  />
                </div>
                <div className={s.field}>
                  <label>CTA Link</label>
                  <input
                    className={s.input}
                    value={form.ctaHref}
                    onChange={e => f('ctaHref', e.target.value)}
                    placeholder='/signup'
                  />
                </div>
              </div>

              <div className={s.field}>
                <label>Visual Subtitle</label>
                <input
                  className={s.input}
                  value={form.visualSub}
                  onChange={e => f('visualSub', e.target.value)}
                  placeholder='Supporting text under the icon'
                />
              </div>
            </div>
            <div className={s.modalFoot}>
              <button className={s.cancelBtn} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className={s.confirmBtn}
                onClick={submit}
                disabled={saving || !form.title.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Lab Test Catalog ─────────────────────────────────────────────────────────
interface LabTestItem {
  _id: string
  name: string
  category?: string
  walkInPrice?: number
  homeVisitPrice?: number
  estimatedPrice?: number
  turnaroundHours: number
  isActive: boolean
}

const DEFAULT_CATEGORIES = [
  'Haematology',
  'Biochemistry',
  'Microbiology',
  'Serology',
  'Endocrinology',
  'Immunology',
  'Oncology',
  'Radiology',
  'Cardiology',
  'Pathology',
  'Genetics',
  'Other'
]

const EMPTY_LAB_TEST = {
  name: '',
  category: '',
  walkInPrice: '',
  homeVisitPrice: '',
  turnaroundHours: '24'
}

function LabTestsTab () {
  const statusModal = useStatusModal()
  const [items, setItems] = useState<LabTestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<LabTestItem | null>(null)
  const [form, setForm] = useState(EMPTY_LAB_TEST)

  const load = useCallback(() => {
    setLoading(true)
    api
      .get('/admin/lab-tests')
      .then(r => setItems(r.data.data?.labTests ?? []))
      .catch(() =>
        statusModal.show({
          variant: 'declined',
          title: 'Load Failed',
          message: 'Failed to load lab tests.'
        })
      )
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openAdd () {
    setForm(EMPTY_LAB_TEST)
    setEditing(null)
    setModal('add')
  }

  function openEdit (item: LabTestItem) {
    setForm({
      name: item.name,
      category: item.category ?? '',
      walkInPrice:
        item.walkInPrice != null
          ? String(item.walkInPrice)
          : item.estimatedPrice != null
          ? String(item.estimatedPrice)
          : '',
      homeVisitPrice:
        item.homeVisitPrice != null ? String(item.homeVisitPrice) : '',
      turnaroundHours: String(item.turnaroundHours)
    })
    setEditing(item)
    setModal('edit')
  }

  async function submit () {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      category: form.category || undefined,
      walkInPrice:
        form.walkInPrice !== '' ? Number(form.walkInPrice) : undefined,
      homeVisitPrice:
        form.homeVisitPrice !== '' ? Number(form.homeVisitPrice) : undefined,
      estimatedPrice:
        form.walkInPrice !== '' ? Number(form.walkInPrice) : undefined,
      turnaroundHours:
        form.turnaroundHours !== '' ? Number(form.turnaroundHours) : 24
    }
    try {
      if (modal === 'add') {
        await api.post('/admin/lab-tests', payload)
      } else if (editing) {
        await api.put(`/admin/lab-tests/${editing._id}`, payload)
      }
      setModal(null)
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Save Failed',
        message: 'Failed to save lab test.'
      })
    }
    setSaving(false)
  }

  async function toggle (item: LabTestItem) {
    try {
      await api.put(`/admin/lab-tests/${item._id}`, {
        isActive: !item.isActive
      })
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Update Failed',
        message: 'Failed to update lab test.'
      })
    }
  }

  async function remove (item: LabTestItem) {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await api.delete(`/admin/lab-tests/${item._id}`)
      load()
    } catch {
      statusModal.show({
        variant: 'declined',
        title: 'Delete Failed',
        message: 'Failed to delete lab test.'
      })
    }
  }

  const byCategory = items.reduce<Record<string, LabTestItem[]>>((acc, t) => {
    const cat = t.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div className={s.card}>
      <div className={s.listHeader}>
        <p className={s.listTitle}>
          Lab Test Catalog{' '}
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-faint)',
              fontWeight: 400
            }}
          >
            ({items.length} tests)
          </span>
        </p>
        <button className={s.addBtn} onClick={openAdd}>
          + Add Test
        </button>
      </div>

      {loading ? (
        <div className={s.empty}>
          <Loader label='Loading…' />
        </div>
      ) : items.length === 0 ? (
        <p className={s.empty}>No lab tests configured yet.</p>
      ) : (
        Object.entries(byCategory).map(([cat, tests]) => (
          <div key={cat}>
            <p
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                margin: '0.75rem 0 4px'
              }}
            >
              {cat}
            </p>
            <div className={s.itemList}>
              {tests.map(item => (
                <div
                  key={item._id}
                  className={`${s.itemRow} ${item.isActive ? '' : s.inactive}`}
                >
                  <span className={s.itemName}>{item.name}</span>
                  <span className={s.itemSub}>
                    {item.walkInPrice != null
                      ? `Walk-in: ₦${item.walkInPrice.toLocaleString('en-NG')}`
                      : ''}
                    {item.walkInPrice != null && item.homeVisitPrice != null
                      ? ' · '
                      : ''}
                    {item.homeVisitPrice != null
                      ? `Home: ₦${item.homeVisitPrice.toLocaleString('en-NG')}`
                      : ''}
                    {item.walkInPrice != null || item.homeVisitPrice != null
                      ? ` · ${item.turnaroundHours}h`
                      : `${item.turnaroundHours}h`}
                  </span>
                  <span
                    className={`${s.badge} ${
                      item.isActive ? s.badgeActive : s.badgeInactive
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className={s.rowActions}>
                    <button
                      className={s.iconBtn}
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </button>
                    <button className={s.iconBtn} onClick={() => toggle(item)}>
                      {item.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className={`${s.iconBtn} ${s.danger}`}
                      onClick={() => remove(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modal && (
        <div
          className={s.overlay}
          onClick={e => {
            if (e.target === e.currentTarget) setModal(null)
          }}
        >
          <div className={s.modal}>
            <div className={s.modalHead}>
              <h2>{modal === 'add' ? 'Add Lab Test' : 'Edit Lab Test'}</h2>
              <button className={s.closeBtn} onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.field}>
                <label>Test Name *</label>
                <input
                  className={s.input}
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder='e.g. Full Blood Count (FBC)'
                />
              </div>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>
                    Category{' '}
                    <span className={s.hint}>(type to create new)</span>
                  </label>
                  <input
                    className={s.input}
                    list='lab-categories'
                    value={form.category}
                    onChange={e =>
                      setForm(p => ({ ...p, category: e.target.value }))
                    }
                    placeholder='e.g. Haematology'
                    autoComplete='off'
                  />
                  <datalist id='lab-categories'>
                    {Array.from(
                      new Set([
                        ...DEFAULT_CATEGORIES,
                        ...(items
                          .map(t => t.category)
                          .filter(Boolean) as string[])
                      ])
                    ).map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className={s.field}>
                  <label>
                    Turnaround <span className={s.hint}>(hours)</span>
                  </label>
                  <input
                    className={s.input}
                    type='number'
                    min={1}
                    value={form.turnaroundHours}
                    onChange={e =>
                      setForm(p => ({ ...p, turnaroundHours: e.target.value }))
                    }
                    placeholder='24'
                  />
                </div>
              </div>
              <div className={s.row2}>
                <div className={s.field}>
                  <label>
                    Walk-in Price <span className={s.hint}>(₦, at lab)</span>
                  </label>
                  <input
                    className={s.input}
                    type='number'
                    min={0}
                    value={form.walkInPrice}
                    onChange={e =>
                      setForm(p => ({ ...p, walkInPrice: e.target.value }))
                    }
                    placeholder='e.g. 3500'
                  />
                </div>
                <div className={s.field}>
                  <label>
                    Home Visit Price <span className={s.hint}>(₦, extra)</span>
                  </label>
                  <input
                    className={s.input}
                    type='number'
                    min={0}
                    value={form.homeVisitPrice}
                    onChange={e =>
                      setForm(p => ({ ...p, homeVisitPrice: e.target.value }))
                    }
                    placeholder='e.g. 5500'
                  />
                </div>
              </div>
            </div>
            <div className={s.modalFoot}>
              <button className={s.cancelBtn} onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className={s.confirmBtn}
                onClick={submit}
                disabled={saving || !form.name.trim()}
              >
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
type Tab = 'payment' | 'specializations' | 'services' | 'lab-tests'

const TABS: { id: Tab; label: string }[] = [
  { id: 'payment', label: 'Payment' },
  { id: 'specializations', label: 'Specializations' },
  { id: 'services', label: 'Services' },
  { id: 'lab-tests', label: 'Lab Tests' }
]

export default function AdminSettingsPage () {
  const [tab, setTab] = useState<Tab>('payment')

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Platform Settings</h1>
        <p className={s.subtitle}>
          Manage payment methods, doctor specializations, platform services, and
          lab test catalog.
        </p>
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

      {tab === 'payment' && <PaymentTab />}
      {tab === 'specializations' && <SpecializationsTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'lab-tests' && <LabTestsTab />}
    </div>
  )
}

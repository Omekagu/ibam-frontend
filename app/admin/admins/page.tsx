'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { XIcon } from '@/components/icons'
import s from './page.module.scss'

const ADMIN_ROLES = ['super_admin', 'lab_admin', 'finance_admin', 'support_admin', 'ops_admin'] as const
// lab_admin accounts should be created from the Labs page (they require a managedLabId)
const CREATABLE_ROLES = ['super_admin', 'finance_admin', 'support_admin', 'ops_admin'] as const
type AdminRole = typeof ADMIN_ROLES[number]

interface AdminUser {
  _id: string
  name: string
  email: string
  role: string
  adminRole?: AdminRole
  isActive: boolean
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:    'Super Admin',
  lab_admin:      'Lab Admin',
  finance_admin:  'Finance Admin',
  support_admin:  'Support Admin',
  ops_admin:      'Ops Admin',
  lab_scientist:  'Lab Scientist',
}

const ROLE_DESC: Record<string, string> = {
  super_admin:   'Full access to all sections',
  lab_admin:     'Labs, diagnostics, walk-in, lab tests, doctors, KYC',
  finance_admin: 'Payments, payouts, earnings',
  support_admin: 'Users, monitoring, appointments, audit, broadcast',
  ops_admin:     'Approvals, orders, pharmacy, drugs',
  lab_scientist: 'Processes diagnostic requests assigned by lab admin',
}

const BLANK = { name: '', email: '', password: '', adminRole: 'support_admin' as AdminRole }

export default function AdminUsersPage () {
  const modal = useStatusModal()
  const [admins,   setAdmins]   = useState<AdminUser[]>([])
  const [loading,  setLoading]  = useState(true)

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [form,       setForm]       = useState(BLANK)
  const [formErr,    setFormErr]    = useState('')
  const [creating,   setCreating]   = useState(false)

  // Role editing
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [roleDraft,   setRoleDraft]   = useState<AdminRole>('support_admin')
  const [savingRole,  setSavingRole]  = useState(false)

  // Toggle active
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/admin/admin-users')
      setAdmins(r.data.data?.admins ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function submitCreate (e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!form.name || !form.email || !form.password) {
      setFormErr('Name, email and password are required.')
      return
    }
    setCreating(true)
    try {
      const r = await api.post('/admin/admin-users', form)
      const created = r.data.data?.user
      if (created) setAdmins(prev => [{ ...created, createdAt: new Date().toISOString() }, ...prev])
      setForm(BLANK)
      setShowCreate(false)
      modal.show({ variant: 'success', title: 'Admin Created', message: 'New admin account has been created.' })
    } catch (err: any) {
      setFormErr(err?.response?.data?.message ?? 'Failed to create admin.')
    }
    setCreating(false)
  }

  async function saveRole (id: string) {
    setSavingRole(true)
    try {
      await api.put(`/admin/admin-users/${id}/role`, { adminRole: roleDraft })
      setAdmins(prev => prev.map(a => a._id === id ? { ...a, adminRole: roleDraft } : a))
      setEditingRole(null)
      modal.show({ variant: 'success', title: 'Role Updated', message: 'Admin role has been updated.' })
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'Error', message: err?.response?.data?.message ?? 'Failed to update role.' })
    }
    setSavingRole(false)
  }

  async function toggleActive (admin: AdminUser) {
    setTogglingId(admin._id)
    try {
      await api.put(`/admin/admin-users/${admin._id}/toggle`)
      setAdmins(prev => prev.map(a => a._id === admin._id ? { ...a, isActive: !a.isActive } : a))
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'Error', message: err?.response?.data?.message ?? 'Failed to update status.' })
    }
    setTogglingId(null)
  }

  async function deleteAdmin (admin: AdminUser) {
    if (!window.confirm(`Permanently delete ${admin.name}? This frees their email for reuse and cannot be undone.`)) return
    setDeletingId(admin._id)
    try {
      await api.delete(`/admin/admin-users/${admin._id}`)
      setAdmins(prev => prev.filter(a => a._id !== admin._id))
      modal.show({ variant: 'success', title: 'Deleted', message: `${admin.name}'s account has been permanently removed.` })
    } catch (err: any) {
      modal.show({ variant: 'declined', title: 'Error', message: err?.response?.data?.message ?? 'Failed to delete.' })
    }
    setDeletingId(null)
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h2 className={s.title}>Admin Users</h2>
          <span className={s.countBadge}>{admins.length}</span>
        </div>
        <button className={s.createBtn} onClick={() => { setForm(BLANK); setFormErr(''); setShowCreate(true) }}>
          + Add Admin
        </button>
      </div>

      {/* Role legend */}
      <div className={s.legend}>
        {[...ADMIN_ROLES, 'lab_scientist'].map(r => (
          <div key={r} className={s.legendItem}>
            <span className={`${s.rolePill} ${s[r]}`}>{ROLE_LABELS[r]}</span>
            <span className={s.legendDesc}>{ROLE_DESC[r]}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={s.empty}><Loader label='Loading admins…' /></div>
      ) : admins.length === 0 ? (
        <div className={s.empty}>No admin users found.</div>
      ) : (
        <div className={s.list}>
          {admins.filter(Boolean).map(admin => (
            <div key={admin._id} className={`${s.card} ${!admin.isActive ? s.cardInactive : ''}`}>
              <div className={s.cardMain}>
                <div className={s.cardInfo}>
                  <div className={s.nameRow}>
                    <span className={s.adminName}>{admin.name}</span>
                    <span className={`${s.rolePill} ${s[admin.adminRole ?? admin.role]}`}>
                      {ROLE_LABELS[admin.adminRole ?? admin.role] ?? admin.role}
                    </span>
                    {!admin.isActive && <span className={s.inactivePill}>Inactive</span>}
                  </div>
                  <p className={s.adminEmail}>{admin.email}</p>
                  <p className={s.adminMeta}>
                    {admin.role === 'lab_scientist' ? 'Lab Scientist' : `${ROLE_LABELS[admin.adminRole ?? ''] ?? 'Admin'}`}
                    {' · '}Added {new Date(admin.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className={s.cardActions}>
                  {admin.role !== 'lab_scientist' && (editingRole === admin._id ? (
                    <div className={s.roleEditRow}>
                      <select
                        className={s.roleSelect}
                        value={roleDraft}
                        onChange={e => setRoleDraft(e.target.value as AdminRole)}
                      >
                        {ADMIN_ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <button className={s.saveBtn} disabled={savingRole} onClick={() => saveRole(admin._id)}>
                        {savingRole ? '…' : 'Save'}
                      </button>
                      <button className={s.cancelEditBtn} onClick={() => setEditingRole(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      className={s.editRoleBtn}
                      onClick={() => { setEditingRole(admin._id); setRoleDraft(admin.adminRole ?? 'support_admin') }}
                    >
                      Change Role
                    </button>
                  ))}
                  <button
                    className={admin.isActive ? s.deactivateBtn : s.activateBtn}
                    disabled={togglingId === admin._id}
                    onClick={() => toggleActive(admin)}
                  >
                    {togglingId === admin._id ? '…' : admin.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className={s.deleteBtn}
                    disabled={deletingId === admin._id}
                    onClick={() => deleteAdmin(admin)}
                  >
                    {deletingId === admin._id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Admin modal ── */}
      {showCreate && (
        <>
          <div className={s.modalOverlay} onClick={() => setShowCreate(false)} />
          <div className={s.modal}>
            <div className={s.modalHead}>
              <h3>Add Admin User</h3>
              <button className={s.closeBtn} onClick={() => setShowCreate(false)}><XIcon size={14} /></button>
            </div>
            <form className={s.modalBody} onSubmit={submitCreate}>
              {formErr && <p className={s.formErr}>{formErr}</p>}
              <div className={s.formGrid}>
                <div className={s.fieldGroup}>
                  <label>Full Name *</label>
                  <input className={s.input} placeholder='Admin name' value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Email *</label>
                  <input className={s.input} type='email' placeholder='admin@ibamhealth.com' value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Temporary Password *</label>
                  <input className={s.input} type='password' placeholder='Min 8 characters' value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label>Role *</label>
                  <select className={s.input} value={form.adminRole}
                    onChange={e => setForm(p => ({ ...p, adminRole: e.target.value as AdminRole }))}>
                    {CREATABLE_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className={s.roleHint} style={{ color: 'var(--text-muted)', marginTop: 0 }}>
                To create a Lab Admin, use the <strong>+ Add Lab Admin</strong> button on the Labs page — lab admins must be linked to a specific lab.
              </p>
              {form.adminRole && (
                <p className={s.roleHint}>{ROLE_DESC[form.adminRole]}</p>
              )}
              <div className={s.modalFooter}>
                <button type='button' className={s.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type='submit' className={s.createBtn} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

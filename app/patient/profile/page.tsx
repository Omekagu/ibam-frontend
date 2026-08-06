'use client'
import { useEffect, useState, FormEvent } from 'react'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import { useStatusModal } from '@/components/StatusModal'
import s from './page.module.scss'

interface Profile {
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  isVerified: boolean
  createdAt?: string
}

export default function PatientProfile () {
  const modal = useStatusModal()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [refreshing, setRefreshing] = useState(true)
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    const cached = getStoredUser()
    if (cached) {
      setProfile({ name: cached.name, email: cached.email, role: cached.role, isVerified: false })
      setName(cached.name ?? '')
    }
    api.get('/users/profile')
      .then(r => {
        const u = r.data.data?.user ?? r.data.data
        if (!u) return
        setProfile(u)
        setName(u.name ?? '')
        setPhone(u.phone ?? '')
      })
      .catch(() => {})
      .finally(() => setRefreshing(false))
  }, [])

  async function save (e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await api.put('/users/profile', { name, phone })
      setProfile(prev => prev ? { ...prev, name, phone } : prev)
      const stored = getStoredUser()
      if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, name, phone }))
      setSaved(true)
      modal.show({ variant: 'success', title: 'Profile Updated', message: 'Your profile has been saved successfully.' })
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed.'
      modal.show({ variant: 'declined', title: 'Update Failed', message: msg })
    }
    setSaving(false)
  }

  return (
    <div className={s.grid}>
      {/* ── Card ────────────────────────────────── */}
      <div className={s.card}>
        <div className={s.avatarWrap}>
          <div className={s.avatar}>{(profile?.name ?? 'P')[0]}</div>
        </div>
        <p className={s.name}>{profile?.name}</p>
        <p className={s.email}>{profile?.email}{refreshing && <span className={s.refreshing}> …</span>}</p>
        <div className={s.badges}>
          <span className={s.roleBadge}>{profile?.role}</span>
          {profile?.isVerified && <span className={s.verBadge}>Verified</span>}
        </div>
        <div className={s.meta}>
          <div className={s.metaRow}><span>Phone</span><p>{profile?.phone ?? '—'}</p></div>
          <div className={s.metaRow}><span>Member since</span><p>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : '—'}</p></div>
        </div>
      </div>

      {/* ── Edit form ───────────────────────────── */}
      <form className={s.panel} onSubmit={save}>
        <div className={s.panelHead}><h3>Edit Profile</h3></div>
        <div className={s.panelBody}>
          <div className={s.field}>
            <label>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder='Your full name' required />
          </div>
          <div className={s.field}>
            <label>Email</label>
            <input value={profile?.email ?? ''} disabled />
          </div>
          <div className={s.field}>
            <label>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder='+234 800 000 0000' />
          </div>
          <button type='submit' className={s.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

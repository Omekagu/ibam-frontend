'use client'
import { useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

const ALL_ROLES = ['patient', 'doctor', 'pharmacy_partner', 'lab_partner', 'admin'] as const
type Role = typeof ALL_ROLES[number]

const ROLE_LABELS: Record<Role, string> = {
  patient:           'Patients',
  doctor:            'Doctors',
  pharmacy_partner:  'Pharmacies',
  lab_partner:       'Labs',
  admin:             'Admins',
}

const CHANNELS = ['push', 'email', 'in_app'] as const
type Channel = typeof CHANNELS[number]

const CHANNEL_LABELS: Record<Channel, string> = {
  push:   'Push Notification',
  email:  'Email',
  in_app: 'In-App',
}

interface Result {
  recipients: number
  inApp: number
  push: number
  email: number
}

export default function BroadcastPage() {
  const [title,    setTitle]    = useState('')
  const [message,  setMessage]  = useState('')
  const [roles,    setRoles]    = useState<Role[]>([])   // empty = all
  const [channels, setChannels] = useState<Channel[]>(['push', 'email', 'in_app'])
  const [sending,  setSending]  = useState(false)
  const [result,   setResult]   = useState<Result | null>(null)
  const [error,    setError]    = useState('')

  function toggleRole(r: Role) {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  function toggleChannel(c: Channel) {
    setChannels(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function send() {
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.')
      return
    }
    if (!channels.length) {
      setError('Select at least one channel.')
      return
    }
    setError('')
    setResult(null)
    setSending(true)
    try {
      const { data } = await api.post('/admin/broadcast', {
        title:    title.trim(),
        message:  message.trim(),
        roles:    roles.length ? roles : undefined,
        channels,
      })
      setResult(data.data)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Broadcast failed. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Broadcast Message</h1>
        <p className={s.subtitle}>Send a message to users via push, email, and in-app notification simultaneously</p>
      </div>

      {result && (
        <div className={s.successBanner}>
          Sent to <strong>{result.recipients}</strong> users —
          {' '}{result.push} push · {result.email} email · {result.inApp} in-app
        </div>
      )}
      {error && <p className={s.errorBanner}>{error}</p>}

      <div className={s.form}>
        {/* Channels */}
        <div>
          <p className={s.sectionTitle}>Channels</p>
          <div className={s.chipRow}>
            {CHANNELS.map(c => (
              <button
                key={c}
                type="button"
                className={`${s.chip} ${channels.includes(c) ? s.chipActive : ''}`}
                onClick={() => toggleChannel(c)}
              >
                {c === 'push'   && <PushIcon />}
                {c === 'email'  && <EmailIcon />}
                {c === 'in_app' && <BellIcon />}
                {CHANNEL_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <p className={s.sectionTitle}>Audience</p>
          <p className={s.subtext}>Leave all unchecked to send to everyone</p>
          <div className={s.chipRow}>
            {ALL_ROLES.map(r => (
              <button
                key={r}
                type="button"
                className={`${s.chip} ${roles.includes(r) ? s.chipActive : ''}`}
                onClick={() => toggleRole(r)}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className={s.field}>
          <label>Notification Title</label>
          <input
            className={s.input}
            placeholder="e.g. Platform Update"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={80}
          />
          <span className={s.hint}>{title.length}/80</span>
        </div>

        {/* Message */}
        <div className={s.field}>
          <label>Message</label>
          <textarea
            className={`${s.input} ${s.textarea}`}
            placeholder="Write your message here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            maxLength={500}
          />
          <span className={s.hint}>{message.length}/500</span>
        </div>

        {/* Preview */}
        {(title || message) && (
          <div className={s.preview}>
            <p className={s.previewLabel}>Preview</p>
            <div className={s.previewCard}>
              <div className={s.previewDot} />
              <div>
                <p className={s.previewTitle}>{title || '(title)'}</p>
                <p className={s.previewBody}>{message || '(message)'}</p>
              </div>
            </div>
          </div>
        )}

        <button
          className={s.sendBtn}
          onClick={send}
          disabled={sending || !title || !message}
        >
          {sending ? 'Sending…' : `Send Broadcast${roles.length ? ` to ${roles.map(r => ROLE_LABELS[r]).join(', ')}` : ' to All Users'}`}
        </button>
      </div>
    </div>
  )
}

function PushIcon()  { return <svg width='13' height='13' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 18h.01M8 21h8M3 3l18 18M10.583 10.583A5 5 0 0117 17M6.343 6.343A8 8 0 0017.657 17.657' /></svg> }
function EmailIcon() { return <svg width='13' height='13' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' /></svg> }
function BellIcon()  { return <svg width='13' height='13' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' /></svg> }

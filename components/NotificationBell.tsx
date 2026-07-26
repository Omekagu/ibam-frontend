'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import api from '@/lib/api'
import {
  CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, VideoCameraIcon,
  FlagIcon, PillIcon, PackageIcon, MicroscopeIcon, CreditCardIcon,
  StarIcon, NoSymbolIcon, HandshakeIcon, ClipboardIcon, BeakerIcon,
  WalletIcon, BellIcon as BellSvg,
} from '@/components/icons'

interface Notif {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

function NotifIcon ({ type }: { type: string }) {
  const props = { size: 16, style: { color: 'var(--text-muted)' } }
  switch (type) {
    case 'appointment_booked':     return <CalendarIcon {...props} />
    case 'appointment_confirmed':  return <CheckCircleIcon {...props} style={{ color: '#22C55E' }} />
    case 'appointment_cancelled':  return <XCircleIcon {...props} style={{ color: '#EF4444' }} />
    case 'appointment_reminder':   return <ClockIcon {...props} />
    case 'consultation_started':   return <VideoCameraIcon {...props} style={{ color: '#22C55E' }} />
    case 'consultation_ended':     return <FlagIcon {...props} />
    case 'prescription_ready':     return <PillIcon {...props} style={{ color: '#22C55E' }} />
    case 'pharmacy_order_update':  return <PackageIcon {...props} />
    case 'lab_result_ready':       return <MicroscopeIcon {...props} />
    case 'payment_success':        return <CreditCardIcon {...props} style={{ color: '#22C55E' }} />
    case 'subscription_activated': return <StarIcon {...props} style={{ color: '#F59E0B' }} />
    case 'subscription_cancelled': return <NoSymbolIcon {...props} style={{ color: '#EF4444' }} />
    case 'doctor_approved':        return <CheckCircleIcon {...props} style={{ color: '#22C55E' }} />
    case 'partner_approved':       return <HandshakeIcon {...props} style={{ color: '#22C55E' }} />
    case 'drug_approval':          return <PillIcon {...props} />
    case 'order_approval':         return <ClipboardIcon {...props} />
    case 'test_request_approval':  return <BeakerIcon {...props} />
    case 'payout_processed':       return <WalletIcon {...props} style={{ color: '#22C55E' }} />
    default:                       return <BellSvg {...props} />
  }
}

function timeAgo (iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function NotificationBell () {
  const [open,      setOpen]      = useState(false)
  const [notifs,    setNotifs]    = useState<Notif[]>([])
  const [unread,    setUnread]    = useState(0)
  const [loading,   setLoading]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await api.get('/notifications?limit=15')
      setNotifs(r.data.data?.notifications ?? [])
      setUnread(r.data.data?.unreadCount ?? 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  useEffect(() => {
    function handleClick (e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markRead (id: string) {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    await api.put(`/notifications/${id}/read`).catch(() => {})
  }

  async function markAllRead () {
    setLoading(true)
    await api.put('/notifications/read-all').catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
    setLoading(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label='Notifications'
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36,
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: open ? 'rgba(10,143,108,0.08)' : 'var(--input-bg)',
          color: open ? '#0A8F6C' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        <BellSvg size={17} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#EF4444', color: '#fff',
            fontSize: 9, fontWeight: 800,
            borderRadius: 999, minWidth: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid var(--bg-sidebar)',
            lineHeight: 1,
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 360,
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          zIndex: 200,
          overflow: 'hidden',
          animation: 'fadeDown 0.18s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Notifications</p>
              {unread > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{unread} unread</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} disabled={loading} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#0A8F6C', fontWeight: 600, padding: '2px 6px',
                borderRadius: 6,
              }}>
                {loading ? '…' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}><BellSvg size={28} style={{ color: 'var(--text-faint)' }} /></div>
                No notifications yet
              </div>
            ) : notifs.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: n.isRead ? 'transparent' : 'rgba(10,143,108,0.04)',
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'var(--input-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <NotifIcon type={n.type} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0A8F6C', flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4, display: 'block' }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}


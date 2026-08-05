'use client'
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import s from './StatusModal.module.scss'

// ── Types ─────────────────────────────────────────────────────────
export type ModalVariant = 'success' | 'declined' | 'pending'

export interface ShowModalOptions {
  variant: ModalVariant
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  dismissLabel?: string
}

interface CtxType {
  show: (opts: ShowModalOptions) => void
  hide: () => void
}

// ── Context ───────────────────────────────────────────────────────
const ModalCtx = createContext<CtxType | null>(null)

export function useStatusModal () {
  const ctx = useContext(ModalCtx)
  if (!ctx) throw new Error('useStatusModal must be used inside <StatusModalProvider>')
  return ctx
}

// ── Icons ─────────────────────────────────────────────────────────
function CheckIcon () {
  return (
    <svg viewBox='0 0 24 24' width={36} height={36} fill='none'
      stroke='#fff' strokeWidth={2.8} strokeLinecap='round' strokeLinejoin='round'>
      <polyline points='20 6 9 17 4 12' />
    </svg>
  )
}

function XIcon () {
  return (
    <svg viewBox='0 0 24 24' width={32} height={32} fill='none'
      stroke='#fff' strokeWidth={2.8} strokeLinecap='round' strokeLinejoin='round'>
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  )
}

function ClockIcon () {
  return (
    <svg viewBox='0 0 24 24' width={34} height={34} fill='none'
      stroke='#fff' strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <circle cx='12' cy='12' r='10' />
      <polyline points='12 6 12 12 16 14' />
    </svg>
  )
}

// ── Modal card ────────────────────────────────────────────────────
interface ModalProps extends ShowModalOptions {
  onDismiss: () => void
}

function ModalCard ({
  variant, title, message, actionLabel, onAction, dismissLabel, onDismiss,
}: ModalProps) {
  const [exiting, setExiting] = useState(false)

  function close () {
    setExiting(true)
    setTimeout(onDismiss, 240)
  }

  function handleAction () {
    onAction?.()
    close()
  }

  const icon   = variant === 'success' ? <CheckIcon /> : variant === 'declined' ? <XIcon /> : <ClockIcon />
  const iconCls = variant === 'success' ? s.iconSuccess : variant === 'declined' ? s.iconDeclined : s.iconPending
  const btnCls  = variant === 'success' ? s.actionSuccess : variant === 'declined' ? s.actionDeclined : s.actionPending
  const ptCls   = variant === 'success' ? s.particlesSuccess : variant === 'declined' ? s.particlesDeclined : s.particlesPending

  return (
    <div className={`${s.backdrop} ${exiting ? s.exiting : ''}`} onClick={close}>
      <div
        className={`${s.card} ${exiting ? s.cardExiting : ''}`}
        onClick={e => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
        aria-labelledby='status-modal-title'
      >
        {/* floating particles */}
        <div className={`${s.particles} ${ptCls}`}>
          <span /><span /><span /><span /><span />
        </div>

        {/* close */}
        <button className={s.closeBtn} onClick={close} aria-label='Close'>✕</button>

        {/* icon */}
        <div className={`${s.iconWrap} ${iconCls}`}>{icon}</div>

        <h2 id='status-modal-title' className={s.title}>{title}</h2>
        <p className={s.message}>{message}</p>

        <div className={s.actions}>
          {actionLabel && (
            <button className={`${s.actionBtn} ${btnCls}`} onClick={handleAction}>
              {actionLabel}
            </button>
          )}
          <button className={s.dismissBtn} onClick={close}>
            {dismissLabel ?? 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────
interface State extends ShowModalOptions { open: boolean }
const CLOSED: State = { open: false, variant: 'success', title: '', message: '' }

export function StatusModalProvider ({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(CLOSED)

  const show = useCallback((opts: ShowModalOptions) =>
    setState({ open: true, ...opts }), [])
  const hide = useCallback(() => setState(CLOSED), [])

  return (
    <ModalCtx.Provider value={{ show, hide }}>
      {children}
      {state.open && <ModalCard {...state} onDismiss={hide} />}
    </ModalCtx.Provider>
  )
}

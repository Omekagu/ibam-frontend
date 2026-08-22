'use client'
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  FormEvent,
  Suspense
} from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import s from './page.module.scss'

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
).replace(/\/api$/, '')

const AgoraClient = dynamic(() => import('./AgoraClient'), { ssr: false })

// ─── Types ────────────────────────────────────────────
interface ChatMessage {
  _id?: string
  id?: string
  text: string
  from: 'me' | 'them'
  senderName?: string
  time: string
}
interface RxDrug {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

function normalizeMsg (
  m: {
    _id: string
    sender: { _id: string; name: string }
    content?: string
    createdAt: string
  },
  myId: string,
  myName: string
): ChatMessage {
  const isMe =
    m.sender._id === myId || (myName !== 'You' && m.sender.name === myName)
  return {
    _id: m._id,
    text: m.content ?? '',
    from: isMe ? 'me' : 'them',
    senderName: m.sender.name,
    time: new Date(m.createdAt).toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// ─── SVG Icons (inline, no emoji) ─────────────────────
const IcMic = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <rect x='9' y='2' width='6' height='12' rx='3' />
    <path d='M5 10a7 7 0 0014 0' />
    <line x1='12' y1='22' x2='12' y2='19' />
    <line x1='8' y1='22' x2='16' y2='22' />
  </svg>
)
const IcMicOff = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='1' y1='1' x2='23' y2='23' />
    <path d='M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6' />
    <path d='M17 16.95A7 7 0 015 10v-1m14 0v1a7 7 0 01-.11 1.23' />
    <line x1='12' y1='22' x2='12' y2='19' />
    <line x1='8' y1='22' x2='16' y2='22' />
  </svg>
)
const IcCam = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <polygon points='23 7 16 12 23 17 23 7' />
    <rect x='1' y='5' width='15' height='14' rx='2' />
  </svg>
)
const IcCamOff = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='1' y1='1' x2='23' y2='23' />
    <path d='M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34' />
    <polygon points='23 7 16 12 23 17 23 7' />
  </svg>
)
const IcChat = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' />
  </svg>
)
const IcRx = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' />
    <polyline points='14 2 14 8 20 8' />
    <line x1='9' y1='12' x2='15' y2='12' />
    <line x1='9' y1='16' x2='13' y2='16' />
  </svg>
)
const IcPill = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v3.5' />
    <circle cx='17' cy='17' r='5' />
    <line x1='14' y1='20' x2='20' y2='14' />
  </svg>
)
const IcPhoneOff = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='1' y1='1' x2='23' y2='23' />
    <path d='M16.5 9.4l-1-1a2 2 0 00-2.83 0l-1.06 1.06a13.86 13.86 0 01-4.07-4.07L8.6 4.33a2 2 0 000-2.83l-1-1A2 2 0 004.78.08l-2.1 1.05A2 2 0 001.5 3.1C2.3 9.58 7.01 16 13.5 18.89a2 2 0 001.97-.17l1.05-2.1a2 2 0 00-.42-2.22M23.5 9a11 11 0 00-2.5-3.5m-3-2.5A11 11 0 0023.5 9' />
  </svg>
)
const IcLeave = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4' />
    <polyline points='16 17 21 12 16 7' />
    <line x1='21' y1='12' x2='9' y2='12' />
  </svg>
)
const IcSend = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='22' y1='2' x2='11' y2='13' />
    <polygon points='22 2 15 22 11 13 2 9 22 2' />
  </svg>
)
const IcArrowLeft = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='19' y1='12' x2='5' y2='12' />
    <polyline points='12 19 5 12 12 5' />
  </svg>
)
const IcClose = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='18' y1='6' x2='6' y2='18' />
    <line x1='6' y1='6' x2='18' y2='18' />
  </svg>
)
const IcPlus = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='12' y1='5' x2='12' y2='19' />
    <line x1='5' y1='12' x2='19' y2='12' />
  </svg>
)
const IcTrash = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <polyline points='3 6 5 6 21 6' />
    <path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
    <path d='M10 11v6M14 11v6' />
    <path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
  </svg>
)

const IcMinimize = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <polyline points='4 14 10 14 10 20' />
    <polyline points='20 10 14 10 14 4' />
    <line x1='10' y1='14' x2='3' y2='21' />
    <line x1='21' y1='3' x2='14' y2='10' />
  </svg>
)
const IcExpand = () => (
  <svg
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth={2}
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <polyline points='15 3 21 3 21 9' />
    <polyline points='9 21 3 21 3 15' />
    <line x1='21' y1='3' x2='14' y2='10' />
    <line x1='3' y1='21' x2='10' y2='14' />
  </svg>
)

// ─── Main component ────────────────────────────────────
function ConsultationInner () {
  const params = useSearchParams()
  const router = useRouter()
  const apptId = params.get('appt') ?? ''
  const cid = params.get('cid') ?? ''

  const [me, setMe] = useState<ReturnType<typeof getStoredUser>>(null)
  useEffect(() => {
    setMe(getStoredUser())
  }, [])

  const [agoraToken, setAgoraToken] = useState<string | null>(null)
  const [channelName, setChannelName] = useState('')
  const [consultType, setConsultType] = useState<'video' | 'audio' | 'chat'>(
    'video'
  )
  const [otherName, setOtherName] = useState('Participant')
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [rxOpen, setRxOpen] = useState(false)
  const [callMinimized, setCallMinimized] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [ending, setEnding] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<'active' | 'ended' | null>(
    null
  )
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(30)
  const [unread, setUnread] = useState(0)
  const [rxDrugs, setRxDrugs] = useState<RxDrug[]>([
    {
      name: '',
      dosage: '',
      frequency: 'Twice daily',
      duration: '7 days',
      instructions: ''
    }
  ])
  const [rxDiagnosis, setRxDiagnosis] = useState('')
  const [rxTests, setRxTests] = useState<string[]>([''])
  const [rxLabsSent, setRxLabsSent] = useState<string[][]>([])
  const [labCatalog, setLabCatalog] = useState<string[]>([])
  const [activeTestSuggestIdx, setActiveTestSuggestIdx] = useState<
    number | null
  >(null)
  const [rxList, setRxList] = useState<
    {
      _id: string
      medications: RxDrug[]
      diagnosis?: string
      createdAt: string
    }[]
  >([])

  const [otherTyping, setOtherTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const lastMsgCount = useRef(0)
  const socketRef = useRef<any>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatOpenRef = useRef(chatOpen)
  useEffect(() => {
    chatOpenRef.current = chatOpen
  }, [chatOpen])

  const isDoctor = me?.role === 'doctor'
  const myName = me?.name ?? 'You'

  useEffect(() => {
    if (!apptId) return
    api
      .get(`/consultations/by-appointment/${apptId}`)
      .then(r => {
        const c = r.data.data?.consultation
        if (!c) return
        // Session already ended on server — lock and navigate away
        if (c.status === 'ended') {
          setSessionEnded(true)
          setSessionStatus('ended')
          router.back()
          return
        }
        setSessionStatus(c.status)
        setChannelName(c.agoraChannel ?? `ibam_${apptId}`)
        setConsultType(c.consultationType ?? 'video')
        setStartedAt(c.startedAt ? new Date(c.startedAt).getTime() : Date.now())
        if (c.appointment?.scheduledAt)
          setScheduledAt(c.appointment.scheduledAt)
        if (c.appointment?.sessionDurationMinutes)
          setSessionDurationMinutes(c.appointment.sessionDurationMinutes)
        const appt = c.appointment
        if (appt)
          setOtherName(
            isDoctor
              ? appt.patient?.name ?? 'Patient'
              : appt.doctor?.name ?? 'Doctor'
          )
      })
      .catch(() => setChannelName(`ibam_${apptId}`))
  }, [apptId, isDoctor])

  useEffect(() => {
    if (!cid) return
    api
      .post('/consultations/token', { consultationId: cid, uid: 0 })
      .then(r => setAgoraToken(r.data.data?.token ?? null))
      .catch(() => setAgoraToken(null))
  }, [cid])

  const fetchMessages = useCallback(async () => {
    if (!cid || !me?._id) return
    try {
      const r = await api.get(`/consultations/${cid}/messages`)
      const raw = r.data.data?.messages ?? []
      const mapped = raw.map((m: Parameters<typeof normalizeMsg>[0]) =>
        normalizeMsg(m, me._id, myName)
      )
      setMessages(mapped)
      if (!chatOpen && mapped.length > lastMsgCount.current) {
        setUnread(prev => prev + (mapped.length - lastMsgCount.current))
      }
      lastMsgCount.current = mapped.length
    } catch {}
  }, [cid, me?._id, myName, chatOpen])

  useEffect(() => {
    fetchMessages()
    const poll = setInterval(fetchMessages, 30000)
    return () => clearInterval(poll)
  }, [fetchMessages])

  // ── Socket.io real-time chat ──
  useEffect(() => {
    if (!cid || !me?._id) return
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token')
        : null
    if (!token) return

    let socket: any
    import('socket.io-client').then(({ io }) => {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      })
      socketRef.current = socket

      socket.on('connect', () => {
        socket.emit('join_consultation', cid)
      })

      socket.on(
        'new_message',
        (data: { consultationId: string; message: any }) => {
          if (data.consultationId !== cid) return
          const normalized = normalizeMsg(data.message, me._id, myName)
          setMessages(prev => {
            // replace the most recent optimistic tmp message with same text from me
            if (normalized.from === 'me') {
              const tmpIdx = [...prev]
                .reverse()
                .findIndex(
                  m => m.id?.startsWith('tmp-') && m.text === normalized.text
                )
              if (tmpIdx >= 0) {
                const realIdx = prev.length - 1 - tmpIdx
                return prev.map((m, i) => (i === realIdx ? normalized : m))
              }
            }
            if (prev.some(m => m._id === normalized._id)) return prev
            return [...prev, normalized]
          })
          if (normalized.from === 'them' && !chatOpenRef.current) {
            setUnread(n => n + 1)
          }
        }
      )

      socket.on(
        'user_typing',
        ({ isTyping }: { userId: string; isTyping: boolean }) => {
          setOtherTyping(isTyping)
        }
      )
    })

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current)
      socketRef.current?.emit('leave_consultation', cid)
      socketRef.current?.disconnect()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, me?._id])

  useEffect(() => {
    if (chatOpen) {
      setUnread(0)
      lastMsgCount.current = messages.length
      setTimeout(() => chatInputRef.current?.focus(), 60)
    }
  }, [chatOpen, messages.length])

  useEffect(() => {
    if (sessionEnded) return
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [startedAt, sessionEnded])

  // Re-verify session status when user returns to this tab (e.g. after minimising)
  useEffect(() => {
    if (!apptId) return
    function onVisible () {
      if (document.visibilityState === 'visible' && !sessionEnded) {
        api
          .get(`/consultations/by-appointment/${apptId}`)
          .then(r => {
            const c = r.data.data?.consultation
            if (c?.status === 'ended') {
              setSessionEnded(true)
              setSessionStatus('ended')
              router.back()
            }
          })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [apptId, sessionEnded])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatOpen])

  // Best-effort: tell the server the doctor left if the tab is closed before End is clicked
  useEffect(() => {
    if (!isDoctor || !cid) return
    function onUnload () {
      if (!sessionEnded) {
        const url = `${
          process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') ?? ''
        }/api/consultations/${cid}/end`
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('access_token')
            : null
        if (token) {
          // sendBeacon cannot set Authorization headers, so fall back to a sync XHR
          try {
            const xhr = new XMLHttpRequest()
            xhr.open('PUT', url, false) // false = synchronous
            xhr.setRequestHeader('Content-Type', 'application/json')
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            xhr.send(JSON.stringify({}))
          } catch {
            /* best-effort */
          }
        }
      }
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [isDoctor, cid, sessionEnded])

  useEffect(() => {
    if (!cid) return
    const load = async () => {
      try {
        const r = await api.get(`/prescriptions/by-consultation/${cid}`)
        setRxList(r.data.data?.prescriptions ?? [])
      } catch {}
    }
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [cid])

  useEffect(() => {
    if (!isDoctor) return
    Promise.all([
      api
        .get('/diagnostics/lab-tests')
        .catch(() => ({ data: { data: { tests: [] } } })),
      api
        .get('/diagnostics/labs')
        .catch(() => ({ data: { data: { labs: [] } } }))
    ]).then(([catalogRes, labsRes]) => {
      const catalogNames: string[] = (catalogRes.data.data?.tests ?? []).map(
        (t: { name: string }) => t.name
      )
      const partnerNames: string[] = (labsRes.data.data?.labs ?? []).flatMap(
        (l: { testsOffered?: string[] }) => l.testsOffered ?? []
      )
      setLabCatalog(Array.from(new Set([...catalogNames, ...partnerNames])))
    })
  }, [isDoctor])

  const totalSeconds = sessionDurationMinutes * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsed)
  const isAlmostUp = remainingSeconds > 0 && remainingSeconds <= 300
  const isTimeUp = elapsed > 0 && remainingSeconds === 0

  useEffect(() => {
    if (isTimeUp && !ending && !sessionEnded) endCall()
  }, [isTimeUp])

  function fmt (sec: number) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, '0')
    const ss = (sec % 60).toString().padStart(2, '0')
    return h > 0 ? `${h}:${m}:${ss}` : `${m}:${ss}`
  }
  function fmtCD (sec: number) {
    if (sec <= 0) return '00:00'
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0')
    const ss = (sec % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  function handleInputChange (e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
    if (socketRef.current && cid) {
      socketRef.current.emit('typing', { consultationId: cid, isTyping: true })
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => {
        socketRef.current?.emit('typing', {
          consultationId: cid,
          isTyping: false
        })
      }, 2000)
    }
  }

  async function sendMessage (e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !cid) return
    setInput('')
    setSending(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    socketRef.current?.emit('typing', { consultationId: cid, isTyping: false })
    const time = new Date().toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit'
    })
    setMessages(prev => [
      ...prev,
      { id: `tmp-${Date.now()}`, text, from: 'me', time }
    ])
    try {
      await api.post(`/consultations/${cid}/messages`, { content: text })
    } catch {}
    setSending(false)
    chatInputRef.current?.focus()
  }

  async function sendPrescription () {
    const meds = rxDrugs.filter(d => d.name.trim() && d.dosage.trim())
    const tests = rxTests.map(t => t.trim()).filter(Boolean)
    if (!meds.length && !tests.length) return
    try {
      const apptR = await api.get(`/consultations/by-appointment/${apptId}`)
      const patientId = apptR.data.data?.consultation?.appointment?.patient?._id
      if (meds.length) {
        await api.post('/prescriptions', {
          patientId,
          consultationId: cid,
          medications: meds,
          diagnosis: rxDiagnosis
        })
      }
      if (tests.length && patientId) {
        await api.post('/diagnostics/doctor-order', {
          patientId,
          tests,
          consultationId: cid
        })
        setRxLabsSent(prev => [...prev, tests])
      }
      setRxDrugs([
        {
          name: '',
          dosage: '',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: ''
        }
      ])
      setRxDiagnosis('')
      setRxTests([''])
      setRxOpen(false)
    } catch {}
  }

  async function endCall () {
    if (ending || sessionEnded) return
    setEnding(true)
    setSessionEnded(true)
    setSessionStatus('ended')
    try {
      if (isDoctor && cid) await api.put(`/consultations/${cid}/end`)
    } catch {}
    router.back()
  }

  const showAvCall =
    consultType !== 'chat' && !!agoraToken && !!channelName && !sessionEnded
  const lateMin = scheduledAt
    ? Math.floor((startedAt - new Date(scheduledAt).getTime()) / 60000)
    : 0

  return (
    <div className={s.page}>
      {/* ── Topbar ──────────────────────────────────── */}
      <header className={s.topbar}>
        <div className={s.topLeft}>
          <button
            className={s.backBtn}
            onClick={() => router.back()}
            title='Back'
          >
            <IcArrowLeft />
          </button>
          <div className={s.callerInfo}>
            <div className={s.callerAvatar}>{otherName[0]?.toUpperCase()}</div>
            <div>
              <span className={s.callerName}>{otherName}</span>
              <div className={s.callerBadges}>
                {sessionStatus === 'active' && !sessionEnded ? (
                  <span className={s.liveBadge}>
                    <span className={s.liveDot} />
                    Live
                  </span>
                ) : sessionEnded ? (
                  <span className={s.endedBadge}>Ended</span>
                ) : null}
                {lateMin > 2 && (
                  <span className={s.lateBadge}>{lateMin} min late</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={s.topRight}>
          <div className={s.timerBlock}>
            <span className={s.elapsed}>{fmt(elapsed)}</span>
            {isTimeUp ? (
              <span className={s.timeUp}>TIME UP</span>
            ) : (
              <span className={`${s.remaining} ${isAlmostUp ? s.warn : ''}`}>
                {fmtCD(remainingSeconds)} left
              </span>
            )}
          </div>
          {scheduledAt && (
            <span className={s.schedLabel}>
              Scheduled{' '}
              {new Date(scheduledAt).toLocaleTimeString('en-NG', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </header>

      {/* ── Almost-up banner ────────────────────────── */}
      {isAlmostUp && !isTimeUp && (
        <div className={s.warnBanner}>
          Session ending in {fmtCD(remainingSeconds)}
        </div>
      )}

      {/* ── Video / audio area ──────────────────────── */}
      {consultType !== 'chat' && (
        <div
          className={`${s.callArea} ${callMinimized ? s.callAreaHidden : ''}`}
        >
          {showAvCall ? (
            <AgoraClient
              token={agoraToken!}
              channel={channelName}
              micOn={micOn}
              camOn={camOn}
              isAudioOnly={consultType === 'audio'}
              otherName={otherName}
              myName={myName}
              onFallback={() => {
                setChatOpen(true)
              }}
            />
          ) : (
            <div className={s.waitScreen}>
              <div className={s.waitAvatar}>{otherName[0]?.toUpperCase()}</div>
              <p className={s.waitName}>{otherName}</p>
              <p className={s.waitSub}>
                {cid
                  ? 'Connecting to session…'
                  : 'Waiting for session to start…'}
              </p>
              <div className={s.waitDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Minimized pip ───────────────────────────── */}
      {consultType !== 'chat' && callMinimized && !sessionEnded && (
        <div
          className={s.pip}
          onClick={() => setCallMinimized(false)}
          title='Expand call'
        >
          <div className={s.pipAvatar}>{otherName[0]?.toUpperCase()}</div>
          <div className={s.pipInfo}>
            <span className={s.pipName}>{otherName}</span>
            <span className={s.pipTimer}>{fmt(elapsed)}</span>
          </div>
          <span className={s.pipExpand}>
            <IcExpand />
          </span>
        </div>
      )}

      {/* ── Chat-only mode ──────────────────────────── */}
      {consultType === 'chat' && !sessionEnded && (
        <div className={s.chatOnlyWrap}>
          {/* messages rendered inline — NOT as a sub-component */}
          <div className={s.chatMessages}>
            {messages.length === 0 && (
              <p className={s.noMsgs}>No messages yet — say hello!</p>
            )}
            {messages.map((m, i) => (
              <div key={m._id ?? m.id ?? i} className={`${s.msg} ${s[m.from]}`}>
                {m.from === 'them' && m.senderName && (
                  <span className={s.msgSender}>{m.senderName}</span>
                )}
                <p>{m.text}</p>
                <span className={s.msgTime}>{m.time}</span>
              </div>
            ))}
            {otherTyping && (
              <div className={s.typingIndicator}>
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className={s.chatInputRow} onSubmit={sendMessage}>
            <input
              ref={chatInputRef}
              value={input}
              onChange={handleInputChange}
              placeholder='Type a message…'
              disabled={sending}
              autoComplete='off'
            />
            <button
              type='submit'
              className={s.sendBtn}
              disabled={!input.trim() || sending}
            >
              <IcSend />
            </button>
          </form>
        </div>
      )}

      {/* ── Controls ────────────────────────────────── */}
      <div className={s.controlsBar}>
        <div className={s.controlPill}>
          {consultType !== 'chat' && !sessionEnded && (
            <>
              <button
                className={`${s.ctrlBtn} ${micOn ? '' : s.ctrlOff}`}
                onClick={() => setMicOn(v => !v)}
                title={micOn ? 'Mute' : 'Unmute'}
              >
                <span className={s.ctrlIcon}>
                  {micOn ? <IcMic /> : <IcMicOff />}
                </span>
                <span className={s.ctrlLabel}>
                  {micOn ? 'Mute' : 'Unmuted'}
                </span>
              </button>
              {consultType === 'video' && (
                <button
                  className={`${s.ctrlBtn} ${camOn ? '' : s.ctrlOff}`}
                  onClick={() => setCamOn(v => !v)}
                  title={camOn ? 'Camera off' : 'Camera on'}
                >
                  <span className={s.ctrlIcon}>
                    {camOn ? <IcCam /> : <IcCamOff />}
                  </span>
                  <span className={s.ctrlLabel}>
                    {camOn ? 'Camera' : 'No cam'}
                  </span>
                </button>
              )}
              <button
                className={s.ctrlBtn}
                onClick={() => setCallMinimized(v => !v)}
                title={callMinimized ? 'Expand call' : 'Minimize call'}
              >
                <span className={s.ctrlIcon}>
                  {callMinimized ? <IcExpand /> : <IcMinimize />}
                </span>
                <span className={s.ctrlLabel}>
                  {callMinimized ? 'Expand' : 'Minimize'}
                </span>
              </button>
              <div className={s.ctrlDivider} />
            </>
          )}

          <button
            className={`${s.ctrlBtn} ${chatOpen ? s.ctrlActive : ''}`}
            onClick={() => {
              setChatOpen(v => !v)
              setRxOpen(false)
            }}
            title='Chat'
          >
            <span className={s.ctrlIcon}>
              <IcChat />
              {unread > 0 && !chatOpen && (
                <span className={s.badge}>{unread > 9 ? '9+' : unread}</span>
              )}
            </span>
            <span className={s.ctrlLabel}>Chat</span>
          </button>

          {isDoctor && !sessionEnded && (
            <button
              className={`${s.ctrlBtn} ${rxOpen ? s.ctrlActive : ''}`}
              onClick={() => {
                setRxOpen(v => !v)
                setChatOpen(false)
              }}
              title='Prescription'
            >
              <span className={s.ctrlIcon}>
                <IcRx />
              </span>
              <span className={s.ctrlLabel}>Prescribe</span>
            </button>
          )}

          {!isDoctor && rxList.length > 0 && (
            <button
              className={`${s.ctrlBtn} ${rxOpen ? s.ctrlActive : ''}`}
              onClick={() => setRxOpen(v => !v)}
              title='View prescription'
            >
              <span className={s.ctrlIcon}>
                <IcPill />
                <span className={s.badge}>{rxList.length}</span>
              </span>
              <span className={s.ctrlLabel}>My Rx</span>
            </button>
          )}

          <div className={s.ctrlDivider} />

          <button
            className={`${s.ctrlBtn} ${s.ctrlEnd}`}
            onClick={endCall}
            disabled={ending || sessionEnded}
            title={
              sessionEnded ? 'Call Ended' : isDoctor ? 'End Call' : 'Leave Call'
            }
          >
            <span className={s.ctrlIcon}>
              {isDoctor ? <IcPhoneOff /> : <IcLeave />}
            </span>
            <span className={s.ctrlLabel}>
              {sessionEnded ? 'Call Ended' : isDoctor ? 'End Call' : 'Leave'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Chat drawer ─────────────────────────────── */}
      {chatOpen && consultType !== 'chat' && (
        <aside className={s.chatDrawer}>
          <div className={s.drawerHead}>
            <div className={s.drawerHeadLeft}>
              <IcChat />
              <span>Chat</span>
            </div>
            <button
              className={s.drawerClose}
              onClick={() => setChatOpen(false)}
            >
              <IcClose />
            </button>
          </div>

          {/* INLINE — not a sub-component, so no re-mount on parent re-render */}
          <div className={s.chatMessages}>
            {messages.length === 0 && (
              <p className={s.noMsgs}>No messages yet — say hello!</p>
            )}
            {messages.map((m, i) => (
              <div key={m._id ?? m.id ?? i} className={`${s.msg} ${s[m.from]}`}>
                {m.from === 'them' && m.senderName && (
                  <span className={s.msgSender}>{m.senderName}</span>
                )}
                <p>{m.text}</p>
                <span className={s.msgTime}>{m.time}</span>
              </div>
            ))}
            {otherTyping && (
              <div className={s.typingIndicator}>
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={s.chatInputRow} onSubmit={sendMessage}>
            <input
              ref={chatInputRef}
              value={input}
              onChange={handleInputChange}
              placeholder={sessionEnded ? 'Session ended' : 'Type a message…'}
              disabled={sending || sessionEnded}
              autoComplete='off'
            />
            <button
              type='submit'
              className={s.sendBtn}
              disabled={!input.trim() || sending || sessionEnded}
            >
              <IcSend />
            </button>
          </form>
        </aside>
      )}

      {/* ── Prescription panel (doctor) ─────────────── */}
      {rxOpen && isDoctor && (
        <div className={s.rxPanel}>
          <div className={s.drawerHead}>
            <div className={s.drawerHeadLeft}>
              <IcRx />
              <span>Write Prescription</span>
            </div>
            <button className={s.drawerClose} onClick={() => setRxOpen(false)}>
              <IcClose />
            </button>
          </div>
          <div className={s.rxBody}>
            <div className={s.rxField}>
              <label>Diagnosis</label>
              <input
                placeholder='e.g. Upper respiratory tract infection'
                value={rxDiagnosis}
                onChange={e => setRxDiagnosis(e.target.value)}
              />
            </div>

            {rxDrugs.map((drug, i) => (
              <div key={i} className={s.rxDrugCard}>
                <div className={s.rxDrugHeader}>
                  <span className={s.rxDrugNum}>Drug {i + 1}</span>
                  {rxDrugs.length > 1 && (
                    <button
                      type='button'
                      className={s.rxRemoveBtn}
                      onClick={() =>
                        setRxDrugs(prev => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <IcTrash />
                    </button>
                  )}
                </div>
                <div className={s.rxField}>
                  <label>Drug Name</label>
                  <input
                    placeholder='e.g. Amoxicillin 500mg'
                    value={drug.name}
                    onChange={e =>
                      setRxDrugs(prev =>
                        prev.map((d, idx) =>
                          idx === i ? { ...d, name: e.target.value } : d
                        )
                      )
                    }
                  />
                </div>
                <div className={s.rxRow2}>
                  <div className={s.rxField}>
                    <label>Dosage</label>
                    <input
                      placeholder='e.g. 500mg'
                      value={drug.dosage}
                      onChange={e =>
                        setRxDrugs(prev =>
                          prev.map((d, idx) =>
                            idx === i ? { ...d, dosage: e.target.value } : d
                          )
                        )
                      }
                    />
                  </div>
                  <div className={s.rxField}>
                    <label>Frequency</label>
                    <select
                      value={drug.frequency}
                      onChange={e =>
                        setRxDrugs(prev =>
                          prev.map((d, idx) =>
                            idx === i ? { ...d, frequency: e.target.value } : d
                          )
                        )
                      }
                    >
                      <option>Once daily</option>
                      <option>Twice daily</option>
                      <option>Three times daily</option>
                      <option>Four times daily</option>
                      <option>As needed</option>
                    </select>
                  </div>
                </div>
                <div className={s.rxRow2}>
                  <div className={s.rxField}>
                    <label>Duration</label>
                    <select
                      value={drug.duration}
                      onChange={e =>
                        setRxDrugs(prev =>
                          prev.map((d, idx) =>
                            idx === i ? { ...d, duration: e.target.value } : d
                          )
                        )
                      }
                    >
                      <option>3 days</option>
                      <option>5 days</option>
                      <option>7 days</option>
                      <option>10 days</option>
                      <option>14 days</option>
                      <option>30 days</option>
                      <option>Ongoing</option>
                    </select>
                  </div>
                  <div className={s.rxField}>
                    <label>Instructions</label>
                    <input
                      placeholder='e.g. After meals'
                      value={drug.instructions}
                      onChange={e =>
                        setRxDrugs(prev =>
                          prev.map((d, idx) =>
                            idx === i
                              ? { ...d, instructions: e.target.value }
                              : d
                          )
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type='button'
              className={s.rxAddBtn}
              onClick={() =>
                setRxDrugs(prev => [
                  ...prev,
                  {
                    name: '',
                    dosage: '',
                    frequency: 'Twice daily',
                    duration: '7 days',
                    instructions: ''
                  }
                ])
              }
            >
              <IcPlus /> Add Another Drug
            </button>

            <div className={s.rxSectionHeader}>
              <span className={s.rxSectionTitle}>Lab Tests</span>
            </div>
            {rxTests.map((test, i) => {
              const suggestions = labCatalog
                .filter(
                  t =>
                    t.toLowerCase().includes(test.toLowerCase()) &&
                    test.trim().length > 0 &&
                    t.toLowerCase() !== test.toLowerCase()
                )
                .slice(0, 5)
              return (
                <div key={i} className={s.rxTestWrap}>
                  <div className={s.rxTestRow}>
                    <input
                      className={s.rxTestInput}
                      placeholder={
                        labCatalog.length > 0
                          ? `e.g. ${labCatalog[0]}`
                          : 'e.g. Full Blood Count'
                      }
                      value={test}
                      onChange={e => {
                        setRxTests(prev =>
                          prev.map((t, idx) => (idx === i ? e.target.value : t))
                        )
                        setActiveTestSuggestIdx(i)
                      }}
                      onFocus={() => setActiveTestSuggestIdx(i)}
                      onBlur={() =>
                        setTimeout(() => setActiveTestSuggestIdx(null), 150)
                      }
                    />
                    {rxTests.length > 1 && (
                      <button
                        type='button'
                        className={s.rxRemoveBtn}
                        onClick={() =>
                          setRxTests(prev => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        <IcTrash />
                      </button>
                    )}
                  </div>
                  {activeTestSuggestIdx === i && suggestions.length > 0 && (
                    <div className={s.rxSuggestionBox}>
                      {suggestions.map(sg => (
                        <button
                          key={sg}
                          type='button'
                          className={s.rxSuggestionItem}
                          onMouseDown={() => {
                            setRxTests(prev =>
                              prev.map((t, idx) => (idx === i ? sg : t))
                            )
                            setActiveTestSuggestIdx(null)
                          }}
                        >
                          {sg}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <button
              type='button'
              className={s.rxAddBtn}
              onClick={() => setRxTests(prev => [...prev, ''])}
            >
              <IcPlus /> Add Another Test
            </button>

            <button
              className={s.rxIssueBtn}
              onClick={sendPrescription}
              disabled={
                !rxDrugs.some(d => d.name.trim()) &&
                !rxTests.some(t => t.trim())
              }
            >
              Issue Prescription
            </button>

            {(rxList.length > 0 || rxLabsSent.length > 0) && (
              <div className={s.rxSentSection}>
                {rxList.length > 0 && (
                  <>
                    <p className={s.rxSentTitle}>
                      Drugs issued · {rxList.length}
                    </p>
                    {rxList.map(rx => (
                      <div key={rx._id} className={s.rxSentCard}>
                        {rx.medications.map((m, i) => (
                          <p key={i} className={s.rxSentLine}>
                            <span>{m.name}</span>
                            <span>
                              {m.dosage} · {m.frequency} · {m.duration}
                            </span>
                          </p>
                        ))}
                      </div>
                    ))}
                  </>
                )}
                {rxLabsSent.length > 0 && (
                  <>
                    <p className={s.rxSentTitle}>
                      Lab tests ordered · {rxLabsSent.flat().length}
                    </p>
                    {rxLabsSent.map((batch, bi) => (
                      <div key={bi} className={s.rxSentCard}>
                        {batch.map((t, ti) => (
                          <p key={ti} className={s.rxSentLine}>
                            <span>{t}</span>
                          </p>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Prescription panel (patient) ────────────── */}
      {rxOpen && !isDoctor && rxList.length > 0 && (
        <div className={s.rxPanel}>
          <div className={s.drawerHead}>
            <div className={s.drawerHeadLeft}>
              <IcPill />
              <span>Your Prescriptions</span>
            </div>
            <button className={s.drawerClose} onClick={() => setRxOpen(false)}>
              <IcClose />
            </button>
          </div>
          <div className={s.rxBody}>
            {rxList.map(rx => (
              <div key={rx._id} className={s.rxSentCard}>
                {rx.diagnosis && <p className={s.rxDxLine}>{rx.diagnosis}</p>}
                {rx.medications.map((m, i) => (
                  <div key={i} className={s.rxMedRow}>
                    <p className={s.rxMedName}>{m.name}</p>
                    <p className={s.rxMedMeta}>
                      {m.dosage} · {m.frequency} · {m.duration}
                    </p>
                    {m.instructions && (
                      <p className={s.rxMedNote}>{m.instructions}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
            <p className={s.rxNote}>
              After the call, go to <strong>Records → Prescriptions</strong> to
              order from pharmacy, or <strong>Lab → My Tests</strong> to pay and
              proceed with any ordered lab tests.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ConsultationPage () {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#060D1A',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.875rem'
          }}
        >
          Connecting…
        </div>
      }
    >
      <ConsultationInner />
    </Suspense>
  )
}

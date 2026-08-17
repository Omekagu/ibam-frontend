'use client'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangleIcon, MicOffIcon } from '@/components/icons'
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng'
import s from './page.module.scss'

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? ''

interface Props {
  token: string
  channel: string
  micOn: boolean
  camOn: boolean
  isAudioOnly: boolean
  otherName: string
  myName: string
  onFallback?: () => void  // called when video/audio is unavailable — parent opens chat
}

export default function AgoraClient ({ token, channel, micOn, camOn, isAudioOnly, otherName, myName, onFallback }: Props) {
  const clientRef      = useRef<IAgoraRTCClient | null>(null)
  const localVideoRef  = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const audioTrack     = useRef<IMicrophoneAudioTrack | null>(null)
  const videoTrack     = useRef<ICameraVideoTrack | null>(null)
  const remoteUserRef  = useRef<IAgoraRTCRemoteUser | null>(null)

  const [remoteJoined, setRemoteJoined] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [joining, setJoining]           = useState(true)

  useEffect(() => {
    if (!APP_ID || !token || !channel) {
      setError('Missing Agora credentials — video unavailable in demo mode.')
      setJoining(false)
      return
    }

    // getUserMedia is blocked on non-secure origins (HTTP on a LAN IP, etc.)
    if (typeof window !== 'undefined' && !window.isSecureContext && !navigator.mediaDevices?.getUserMedia) {
      setError(
        'Camera/microphone access requires HTTPS. The server is running on HTTP — please enable TLS or use localhost. Chat is still available below.'
      )
      setJoining(false)
      return
    }

    let aborted = false
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    function playRemote (user: IAgoraRTCRemoteUser) {
      let attempts = 0
      const tryPlay = () => {
        if (aborted) return
        const el = remoteVideoRef.current
        if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
          user.videoTrack?.play(el)
        } else if (attempts < 30) {
          attempts++
          setTimeout(tryPlay, 100)
        }
      }
      setTimeout(tryPlay, 80)
    }

    // Register listeners BEFORE join() so we never miss user-published events
    // that fire the moment we enter a channel that already has participants.
    client.on('user-published', async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType)
      } catch { return }
      if (aborted) return
      remoteUserRef.current = user
      if (mediaType === 'video') {
        setRemoteJoined(true)
        playRemote(user)
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play()
        setRemoteJoined(true)
      }
    })

    client.on('user-unpublished', (_user, mediaType) => {
      if (mediaType === 'video') setRemoteJoined(false)
    })

    client.on('user-left', () => {
      setRemoteJoined(false)
      remoteUserRef.current = null
    })

    async function join () {
      try {
        await client.join(APP_ID, channel, token, null)
        if (aborted) return

        if (isAudioOnly) {
          const audio = await AgoraRTC.createMicrophoneAudioTrack()
          if (aborted) { audio.close(); return }
          audioTrack.current = audio
          await client.publish([audio])
        } else {
          const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks()
          if (aborted) { audio.close(); video.close(); return }
          audioTrack.current = audio
          videoTrack.current = video
          // Retry local play until the PiP div has dimensions
          let localAttempts = 0
          const tryLocalPlay = () => {
            if (aborted) return
            const el = localVideoRef.current
            if (el && el.offsetWidth > 0) {
              video.play(el)
            } else if (localAttempts < 20) {
              localAttempts++
              setTimeout(tryLocalPlay, 100)
            }
          }
          tryLocalPlay()
          await client.publish([audio, video])
        }

        if (!aborted) setJoining(false)
      } catch (err: unknown) {
        if (aborted) return
        const code = (err as { code?: string })?.code ?? ''
        // Cleanup codes from React Strict Mode double-mount — not real errors
        if (code === 'OPERATION_ABORTED' || code === 'WS_ABORT') return
        console.error('Agora join error:', err)
        if (code === 'NOT_SUPPORTED') {
          setError(
            'Video/audio is unavailable. This usually means the page is served over HTTP instead of HTTPS. Ask your admin to enable TLS, or use Chat below.'
          )
        } else if (code === 'PERMISSION_DENIED') {
          setError(
            'Camera/microphone access was denied. Open your browser settings, allow access for this site, then refresh.'
          )
        } else if (code === 'DEVICE_NOT_FOUND') {
          setError(
            'No camera or microphone detected. Connect a device and refresh, or switch to Audio-only / Chat mode.'
          )
        } else if (code === 'UID_CONFLICT') {
          setError('Session conflict — please refresh the page and rejoin.')
        } else {
          setError('Could not connect to the call. Check your connection and try refreshing.')
        }
        setJoining(false)
      }
    }

    // Delay lets React Strict Mode's first-mount cleanup fire (clearTimeout below)
    // before the join actually starts, so only the second mount's join runs.
    const timer = setTimeout(join, 80)

    return () => {
      clearTimeout(timer)
      aborted = true
      audioTrack.current?.close()
      videoTrack.current?.close()
      client.leave().catch(() => {})
      clientRef.current = null
    }
  }, [token, channel, isAudioOnly])

  useEffect(() => { audioTrack.current?.setEnabled(micOn) },  [micOn])
  useEffect(() => { videoTrack.current?.setEnabled(camOn) },  [camOn])

  if (error) {
    return (
      <div className={s.agoraError}>
        <AlertTriangleIcon size={24} />
        <p>{error}</p>
        {onFallback && (
          <button className={s.agoraFallbackBtn} onClick={onFallback}>
            Open Chat instead
          </button>
        )}
      </div>
    )
  }

  if (isAudioOnly) {
    return (
      <div className={s.audioView}>
        <div className={s.audioAvatar}>{otherName[0]?.toUpperCase()}</div>
        <p className={s.audioName}>{otherName}</p>
        <div className={s.audioWaves}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={s.audioBar} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        {joining && <p className={s.connectingLabel}>Connecting…</p>}
        {!joining && !remoteJoined && <p className={s.connectingLabel}>Waiting for participant…</p>}
        {remoteJoined && <p className={s.connectedLabel}>● Connected</p>}
        {!micOn && <div className={s.mutedBanner}><MicOffIcon size={14} /> Mic muted</div>}
      </div>
    )
  }

  return (
    <div className={s.videoContainer}>
      {/*
        Remote video is ALWAYS display:block — Agora needs a visible container
        to initialise the internal <video> element. The overlay sits on top.
      */}
      <div ref={remoteVideoRef} className={s.remoteVideo} />

      {/* Overlay: shown while waiting, sits on top via position:absolute */}
      {!remoteJoined && (
        <div className={s.remoteWaiting}>
          <div className={s.avatarCircle}>{otherName[0]?.toUpperCase()}</div>
          <p className={s.avatarName}>{otherName}</p>
          <p className={s.connectingLabel}>{joining ? 'Connecting…' : 'Waiting to join…'}</p>
        </div>
      )}

      {/* Local video PiP — always rendered so Agora can play local track to it */}
      <div className={s.localPip}>
        <div ref={localVideoRef} className={s.localPipInner} />
        {!camOn && (
          <div className={s.localPipOff}>
            <span>{myName[0]?.toUpperCase()}</span>
          </div>
        )}
        <span className={s.localPipLabel}>You</span>
      </div>
    </div>
  )
}

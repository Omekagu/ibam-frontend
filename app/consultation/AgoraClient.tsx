'use client'
import { useEffect, useRef, useState } from 'react'
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
}

export default function AgoraClient ({ token, channel, micOn, camOn, isAudioOnly, otherName, myName }: Props) {
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
        // WS_ABORT / OPERATION_ABORTED happen when React Strict Mode fires cleanup
        // mid-join — the timer below prevents this in practice, but guard here too
        const code = (err as { code?: string })?.code ?? ''
        if (code === 'OPERATION_ABORTED' || code === 'WS_ABORT') return
        console.error('Agora join error:', err)
        setError('Could not access camera/microphone. Check browser permissions.')
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
        <span>⚠️</span>
        <p>{error}</p>
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
        {!micOn && <div className={s.mutedBanner}>🔇 Mic muted</div>}
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

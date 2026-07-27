'use client'
import { useState, useRef, useEffect, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'
import {
  CheckCircleIcon, HourglassIcon, SearchIcon, MailIcon,
  FolderIcon, DocumentIcon, CameraIcon,
} from '@/components/icons'

// Step 0: NIN  |  Step 1: Face  |  Step 2: Upload  |  Step 3: Done
const STEPS = ['NIN Verify', 'Face Match', 'Upload Document']

export default function DoctorKYCPage () {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [statusError, setStatusError] = useState('')
  const [kycStatus, setKycStatus] = useState('pending')
  const [step, setStep] = useState(0)

  // Step 0 — NIN
  const [nin, setNin] = useState('')
  const [ninLoading, setNinLoading] = useState(false)
  const [ninError, setNinError] = useState('')

  // Step 1 — Live camera face capture
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [selfiePreview, setSelfiePreview] = useState('')
  const [faceLoading, setFaceLoading] = useState(false)
  const [faceError, setFaceError] = useState('')
  const [faceDone, setFaceDone] = useState(false)

  // Step 2 — License upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    api.get('/kyc/status')
      .then(res => {
        const payload = res.data.data ?? res.data
        const user   = payload.user ?? payload
        const doctor = payload.doctor
        const st = user?.kycStatus ?? 'pending'
        setKycStatus(st)
        if (st === 'approved') {
          setFaceDone(true)
          setSubmitted(true)
          setStep(3)
        } else if (st === 'face_verified') {
          setFaceDone(true)
          if (doctor?.licenseDocument) {
            setSubmitted(true)
            setStep(3)
          } else {
            setStep(2)
          }
        } else if (st === 'nin_verified') {
          setStep(1)
        }
        // pending / rejected → step 0 (NIN)
      })
      .catch(() => {
        setStatusError('Unable to load your verification status. Please refresh the page.')
      })
      .finally(() => setLoading(false))
  }, [])

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [])

  // ── Camera helpers ─────────────────────────────────────────
  function stopCamera () {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  async function startCamera () {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {
      setCameraError('Camera access denied. Please allow camera permissions in your browser and try again.')
    }
  }

  function capturePhoto () {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    setSelfiePreview(canvas.toDataURL('image/jpeg', 0.8))
    stopCamera()
    setCameraActive(false)
  }

  function retakePhoto () {
    setSelfiePreview('')
    setFaceError('')
    startCamera()
  }

  // ── Step handlers ──────────────────────────────────────────
  async function verifyNin () {
    if (nin.length !== 11) return
    setNinLoading(true)
    setNinError('')
    try {
      await api.post('/kyc/verify-nin', { nin })
      setStep(1)
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setStep(1) // already done, silently advance
      } else {
        setNinError(err?.response?.data?.message ?? 'NIN verification failed. Check the number and try again.')
      }
    } finally {
      setNinLoading(false)
    }
  }

  async function verifyFace () {
    if (!selfiePreview || faceDone) return
    setFaceLoading(true)
    setFaceError('')
    try {
      await api.post('/kyc/verify-face', { selfie: selfiePreview })
      setFaceDone(true)
      setStep(2)
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setFaceDone(true)
        setStep(2)
      } else {
        setFaceError(err?.response?.data?.message ?? 'Face match failed. Please retake your selfie and try again.')
      }
    } finally {
      setFaceLoading(false)
    }
  }

  function onDrop (e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function submitDocument () {
    if (!file || submitted) return
    setSubmitted(true)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post('/doctors/license', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } catch (err: any) {
      // 409 = already submitted; advance anyway
      if (err?.response?.status !== 409) {
        // upload failed — allow retry
        setSubmitted(false)
        setUploading(false)
        return
      }
    } finally {
      setUploading(false)
    }
    setStep(3)
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <div className={s.loadingWrap}>
            <div className={s.spinner} />
            <p>Checking verification status…</p>
          </div>
        </div>
      </div>
    )
  }

  if (statusError) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <p className={s.errorText}>{statusError}</p>
          <button className={s.nextBtn} onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.card}>

        {step < 3 && (
          <div className={s.steps}>
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={`${s.step} ${i < step ? s.done : ''} ${i === step ? s.current : ''}`}
              >
                <div className={s.stepCircle}>{i < step ? '✓' : i + 1}</div>
                <span className={s.stepLabel}>{label}</span>
                <div className={s.stepLine} />
              </div>
            ))}
          </div>
        )}

        {kycStatus === 'rejected' && step === 0 && (
          <div className={s.rejectedBanner}>
            Your previous submission was rejected. Please correct your details and resubmit.
          </div>
        )}

        {/* ── Step 0 — NIN Verification ─────────────────── */}
        {step === 0 && (
          <>
            <h1 className={s.title}>NIN Verification</h1>
            <p className={s.sub}>
              Enter your 11-digit National Identification Number. We use this to confirm your identity before face matching.
            </p>

            <div className={s.field}>
              <label>National Identification Number (NIN)</label>
              <input
                type='text'
                inputMode='numeric'
                maxLength={11}
                placeholder='12345678901'
                value={nin}
                onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
              />
              <span className={s.fieldHint}>{nin.length} / 11 digits</span>
            </div>

            {ninError && <p className={s.errorText}>{ninError}</p>}

            <button
              className={s.nextBtn}
              onClick={verifyNin}
              disabled={nin.length !== 11 || ninLoading}
            >
              {ninLoading ? 'Verifying…' : 'Verify NIN →'}
            </button>
          </>
        )}

        {/* ── Step 1 — Live Camera Face Capture ─────────── */}
        {step === 1 && (
          <>
            <h1 className={s.title}>Face Verification</h1>
            <p className={s.sub}>
              Take a live selfie using your camera. Gallery uploads are not accepted.
              We&apos;ll match it against your NIN photo to confirm your identity.
            </p>

            <div className={s.cameraWrap}>
              {selfiePreview ? (
                <img src={selfiePreview} className={s.selfiePreview} alt='Captured selfie' />
              ) : cameraActive ? (
                <video ref={videoRef} className={s.videoFeed} autoPlay playsInline muted />
              ) : (
                <div className={s.selfieEmpty}>
                  <CameraIcon size={36} />
                  <p>Press &ldquo;Open Camera&rdquo; to begin</p>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {cameraError && <p className={s.errorText}>{cameraError}</p>}
            {faceError   && <p className={s.errorText}>{faceError}</p>}

            <div className={s.cameraControls}>
              {!selfiePreview && !cameraActive && (
                <button className={s.cameraBtn} onClick={startCamera}>
                  <CameraIcon size={14} /> Open Camera
                </button>
              )}
              {cameraActive && (
                <button className={s.captureBtn} onClick={capturePhoto}>
                  Capture Photo
                </button>
              )}
              {selfiePreview && !faceDone && (
                <button className={s.cameraBtn} onClick={retakePhoto}>
                  Retake Photo
                </button>
              )}
            </div>

            <button
              className={s.nextBtn}
              onClick={verifyFace}
              disabled={!selfiePreview || faceLoading || faceDone}
            >
              {faceLoading ? 'Matching…' : faceDone ? 'Verified ✓' : 'Verify Face →'}
            </button>
          </>
        )}

        {/* ── Step 2 — Upload License ────────────────────── */}
        {step === 2 && (
          <>
            <h1 className={s.title}>Upload license document</h1>
            <p className={s.sub}>
              Upload a clear photo or scan of your medical license / MDCN certificate. Accepted: PDF, JPG, PNG (max 10 MB).
            </p>

            <div
              className={`${s.dropZone} ${dragging ? s.active : ''} ${submitted ? s.disabled : ''}`}
              onDragOver={e => { if (!submitted) { e.preventDefault(); setDragging(true) } }}
              onDragLeave={() => setDragging(false)}
              onDrop={submitted ? undefined : onDrop}
              onClick={() => !submitted && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type='file'
                accept='.pdf,.jpg,.jpeg,.png'
                style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
              />
              <div className={s.uploadIcon}><FolderIcon size={32} /></div>
              <p className={s.uploadTitle}>{dragging ? 'Drop file here' : 'Click or drag & drop'}</p>
              <p className={s.uploadSub}>PDF, JPG, PNG up to 10 MB</p>
            </div>

            {file && (
              <div className={s.uploadedFile}>
                <DocumentIcon size={16} />
                <p>{file.name}</p>
              </div>
            )}

            <button
              className={s.nextBtn}
              onClick={submitDocument}
              disabled={!file || uploading || submitted}
            >
              {uploading ? 'Uploading…' : submitted ? 'Submitted ✓' : 'Submit for Review →'}
            </button>
          </>
        )}

        {/* ── Step 3 — Under Review / Approved ──────────── */}
        {step === 3 && (
          <div className={s.awaiting}>
            {kycStatus === 'approved' ? (
              <>
                <div className={`${s.awaitingIcon} ${s.approvedIcon}`}><CheckCircleIcon size={48} /></div>
                <h2 className={s.awaitingTitle}>KYC Approved!</h2>
                <p className={s.awaitingText}>
                  Your identity and credentials have been verified. You can now accept patient consultations on iBam Health.
                </p>
              </>
            ) : (
              <>
                <div className={s.awaitingIcon}><HourglassIcon size={48} /></div>
                <h2 className={s.awaitingTitle}>Application Submitted!</h2>
                <p className={s.awaitingText}>
                  Your KYC is under review by our medical team. This usually takes 1–2 business days.
                  We&apos;ll notify you by email once approved.
                </p>
              </>
            )}

            <div className={s.checklist}>
              <div className={s.checkItem}><CheckCircleIcon size={14} /> NIN identity verified</div>
              <div className={s.checkItem}><CheckCircleIcon size={14} /> Face match complete</div>
              <div className={s.checkItem}><CheckCircleIcon size={14} /> License document uploaded</div>
              {kycStatus === 'approved'
                ? <div className={s.checkItem}><CheckCircleIcon size={14} /> Admin review complete</div>
                : <div className={s.checkItem}><SearchIcon size={14} /> Admin review in progress</div>
              }
              <div className={s.checkItem}><MailIcon size={14} /> Email notification on approval</div>
            </div>

            <button className={s.nextBtn} onClick={() => router.push('/doctor')}>
              Go to Dashboard →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

'use client'
import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'
import {
  CheckCircleIcon, HourglassIcon, SearchIcon, MailIcon,
  FolderIcon, DocumentIcon, CameraIcon,
} from '@/components/icons'

const STEPS = ['MDCN Details', 'NIN Verify', 'Face Match', 'Upload Document']

export default function DoctorKYCPage () {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState('pending')
  const [step, setStep] = useState(0)

  // Step 0
  const [mdcn, setMdcn] = useState('')
  const [specialty, setSpecialty] = useState('')

  // Step 1 — NIN
  const [nin, setNin] = useState('')
  const [ninLoading, setNinLoading] = useState(false)
  const [ninError, setNinError] = useState('')

  // Step 2 — Face selfie
  const selfieRef = useRef<HTMLInputElement>(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [faceLoading, setFaceLoading] = useState(false)
  const [faceError, setFaceError] = useState('')

  // Step 3 — License upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    api.get('/kyc/status')
      .then(res => {
        const payload = res.data.data ?? res.data
        const user   = payload.user ?? payload
        const doctor = payload.doctor
        const st = user?.kycStatus ?? 'pending'
        setKycStatus(st)
        if (st === 'approved') {
          setStep(4)
        } else if (st === 'face_verified') {
          setStep(doctor?.licenseDocument ? 4 : 3)
        } else if (st === 'nin_verified') {
          setStep(2)
        }
        // pending / rejected → stay at step 0
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Handlers ────────────────────────────────────

  function submitDetails () {
    if (!mdcn.trim() || !specialty) return
    setStep(1)
  }

  async function verifyNin () {
    if (nin.length !== 11) return
    setNinLoading(true)
    setNinError('')
    try {
      await api.post('/kyc/verify-nin', { nin })
      setStep(2)
    } catch (err: any) {
      setNinError(err?.response?.data?.message ?? 'NIN verification failed. Check the number and try again.')
    } finally {
      setNinLoading(false)
    }
  }

  function onSelfieChange (e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setSelfiePreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  async function verifyFace () {
    if (!selfiePreview) return
    setFaceLoading(true)
    setFaceError('')
    try {
      await api.post('/kyc/verify-face', { selfie: selfiePreview })
      setStep(3)
    } catch (err: any) {
      setFaceError(err?.response?.data?.message ?? 'Face match failed. Please retake your selfie and try again.')
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
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('licenseNumber', mdcn)
      form.append('specialization', specialty)
      await api.post('/doctors/license', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setStep(4)
    } catch {
      setStep(4)
    } finally {
      setUploading(false)
    }
  }

  // ── Loading ──────────────────────────────────────

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

  return (
    <div className={s.page}>
      <div className={s.card}>

        {/* Step indicators — hide on review / approved */}
        {step < 4 && (
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

        {/* Rejected banner */}
        {kycStatus === 'rejected' && step === 0 && (
          <div className={s.rejectedBanner}>
            Your previous submission was rejected. Please correct your details and resubmit.
          </div>
        )}

        {/* ── Step 0 — MDCN Details ────────────────── */}
        {step === 0 && (
          <>
            <h1 className={s.title}>Verify your credentials</h1>
            <p className={s.sub}>
              Enter your MDCN registration details. We verify every doctor before they go live on iBam Health.
            </p>

            <div className={s.field}>
              <label>MDCN Registration Number</label>
              <input
                type='text'
                placeholder='MDCN/R&S/2024/XXXXX'
                value={mdcn}
                onChange={e => setMdcn(e.target.value)}
              />
            </div>

            <div className={s.field}>
              <label>Medical Specialty</label>
              <select value={specialty} onChange={e => setSpecialty(e.target.value)}>
                <option value=''>Select specialty</option>
                {['General Practice','Internal Medicine','Paediatrics','OB-GYN','Cardiology',
                  'Dermatology','Psychiatry','Orthopaedics','ENT','Ophthalmology','Other'].map(sp => (
                  <option key={sp}>{sp}</option>
                ))}
              </select>
            </div>

            <button
              className={s.nextBtn}
              onClick={submitDetails}
              disabled={!mdcn.trim() || !specialty}
            >
              Continue →
            </button>
          </>
        )}

        {/* ── Step 1 — NIN Verification ────────────── */}
        {step === 1 && (
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
            <button className={s.backBtn} onClick={() => setStep(0)}>← Back</button>
          </>
        )}

        {/* ── Step 2 — Face Selfie ─────────────────── */}
        {step === 2 && (
          <>
            <h1 className={s.title}>Face Verification</h1>
            <p className={s.sub}>
              Take a clear selfie. We&apos;ll match it against your NIN photo to confirm your identity.
            </p>

            <div className={s.selfieWrap}>
              {selfiePreview ? (
                <img src={selfiePreview} className={s.selfiePreview} alt='Selfie preview' />
              ) : (
                <div className={s.selfieEmpty}>
                  <CameraIcon size={32} />
                  <p>No photo yet</p>
                </div>
              )}

              <input
                ref={selfieRef}
                type='file'
                accept='image/*'
                capture='user'
                onChange={onSelfieChange}
                style={{ display: 'none' }}
              />

              <button className={s.cameraBtn} onClick={() => selfieRef.current?.click()}>
                <CameraIcon size={14} /> {selfiePreview ? 'Retake Photo' : 'Take Selfie / Upload'}
              </button>
            </div>

            {faceError && <p className={s.errorText}>{faceError}</p>}

            <button
              className={s.nextBtn}
              onClick={verifyFace}
              disabled={!selfiePreview || faceLoading}
            >
              {faceLoading ? 'Matching…' : 'Verify Face →'}
            </button>
            <button className={s.backBtn} onClick={() => setStep(1)}>← Back</button>
          </>
        )}

        {/* ── Step 3 — Upload License ──────────────── */}
        {step === 3 && (
          <>
            <h1 className={s.title}>Upload license document</h1>
            <p className={s.sub}>
              Upload a clear photo or scan of your medical license / MDCN certificate. Accepted: PDF, JPG, PNG (max 10 MB).
            </p>

            <div
              className={`${s.dropZone} ${dragging ? s.active : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type='file'
                accept='.pdf,.jpg,.jpeg,.png'
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
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading…' : 'Submit for Review →'}
            </button>
            <button className={s.backBtn} onClick={() => setStep(2)}>← Back</button>
          </>
        )}

        {/* ── Step 4 — Under Review / Approved ────── */}
        {step === 4 && (
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
              <div className={s.checkItem}><CheckCircleIcon size={14} /> MDCN number recorded</div>
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

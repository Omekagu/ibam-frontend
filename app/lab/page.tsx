'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import {
  MicroscopeIcon,
  DocumentIcon,
  XIcon,
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  WalkingIcon,
  MapPinIcon,
  ClipboardIcon
} from '@/components/icons'
import s from './page.module.scss'
import { Suspense } from 'react'
import { downloadReceipt } from '@/lib/receipt'

// ── Axios instance that uses either the session-storage lab token (impersonation)
//    or the normal localStorage token (lab logs in themselves).
function makeLabApi (token?: string) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
  const inst = axios.create({ baseURL: base })
  inst.interceptors.request.use(cfg => {
    const t =
      token ??
      (typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('lab_token')
        : null) ??
      (typeof localStorage !== 'undefined'
        ? localStorage.getItem('token')
        : null)
    if (t) cfg.headers.Authorization = `Bearer ${t}`
    return cfg
  })
  return inst
}

interface Patient {
  name: string
  phone?: string
  email?: string
  _id?: string
}
interface PaymentRef {
  status: string
  amount: number
  method?: string
  reference?: string
}
interface Scientist {
  _id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}
interface LabRequest {
  _id: string
  tests: string[]
  collectionType: 'walk_in' | 'home_visit'
  status: string
  totalAmount: number
  notes?: string
  createdAt: string
  preferredDate?: string
  preferredTime?: string
  pickupLocation?: { address?: string; lat?: number; lng?: number }
  patient?: Patient
  paymentRef?: PaymentRef
  wellnessPackage?: { name: string }
  assignedScientist?: { _id: string; name: string; email: string }
  result?: {
    fileUrl: string
    signedUrl?: string
    notes?: string
    createdAt: string
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  assigned: 'In Progress',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show'
}

const STATUS_CLS: Record<string, string> = {
  pending: s.statusPending,
  assigned: s.statusAssigned,
  sample_collected: s.statusCollected,
  processing: s.statusProcessing,
  completed: s.statusDone,
  cancelled: s.statusCancelled,
  no_show: s.statusCancelled
}

type Tab = 'available' | 'mine' | 'completed' | 'walkin' | 'team'

function fmt (iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function fmtPreferred (date?: string, time?: string) {
  if (!date) return null
  const d = new Date(date).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
  return time ? `${d} at ${time}` : d
}

// ── Upload result modal ───────────────────────────────────────────────────────
function UploadModal ({
  req,
  labApi,
  onClose,
  onDone
}: {
  req: LabRequest
  labApi: ReturnType<typeof makeLabApi>
  onClose: () => void
  onDone: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function submit () {
    if (!file) {
      setErr('Please select a result file.')
      return
    }
    setSaving(true)
    setErr('')
    const form = new FormData()
    form.append('result', file)
    if (notes) form.append('notes', notes)
    try {
      await labApi.post(`/diagnostics/${req._id}/upload-result`, form)
      onDone()
      onClose()
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Upload failed. Try again.'
      )
    }
    setSaving(false)
  }

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>Upload Result</h3>
          <button className={s.closeBtn} onClick={onClose}>
            <XIcon size={14} />
          </button>
        </div>
        <p className={s.modalSub}>
          {req.tests.slice(0, 3).join(', ')}
          {req.tests.length > 3 ? ` +${req.tests.length - 3} more` : ''} ·{' '}
          {req.patient?.name ?? 'Patient'}
        </p>
        {err && <p className={s.errMsg}>{err}</p>}
        <div className={s.fileArea} onClick={() => fileRef.current?.click()}>
          <input
            ref={fileRef}
            type='file'
            accept='.pdf,image/*'
            style={{ display: 'none' }}
            onChange={e => {
              setFile(e.target.files?.[0] ?? null)
              setErr('')
            }}
          />
          {file ? (
            <p className={s.fileName}>{file.name}</p>
          ) : (
            <>
              <p>Click to attach result file</p>
              <span>PDF or image</span>
            </>
          )}
        </div>
        <textarea
          className={s.notesInput}
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder='Optional notes or summary for the patient…'
        />
        <div className={s.modalFooter}>
          <button className={s.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={s.saveBtn}
            onClick={submit}
            disabled={saving || !file}
          >
            {saving ? <Loader inline size='sm' /> : 'Upload Result'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Assign scientist modal ────────────────────────────────────────────────────
function AssignScientistModal ({
  req,
  scientists,
  labApi,
  onClose,
  onDone
}: {
  req: LabRequest
  scientists: Scientist[]
  labApi: ReturnType<typeof makeLabApi>
  onClose: () => void
  onDone: () => void
}) {
  const [assigning, setAssigning] = useState<string | null>(null)
  const [err, setErr] = useState('')

  async function assign (scientistId: string) {
    setAssigning(scientistId)
    setErr('')
    try {
      await labApi.post(
        `/diagnostics/labs/requests/${req._id}/assign-scientist`,
        { scientistId }
      )
      onDone()
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Assignment failed.'
      )
    }
    setAssigning(null)
  }

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>Assign to Scientist</h3>
          <button className={s.closeBtn} onClick={onClose}>
            <XIcon size={14} />
          </button>
        </div>
        <p className={s.modalSub}>
          {req.tests.slice(0, 2).join(', ')}
          {req.tests.length > 2 ? ` +${req.tests.length - 2} more` : ''} ·{' '}
          {req.patient?.name ?? 'Patient'}
        </p>
        {err && <p className={s.errMsg}>{err}</p>}
        <div className={s.assignList}>
          {scientists.map(sci => (
            <button
              key={sci._id}
              className={`${s.assignItem} ${
                req.assignedScientist?._id === sci._id ? s.assignItemActive : ''
              }`}
              onClick={() => assign(sci._id)}
              disabled={assigning !== null}
            >
              <span className={s.assignAvatar}>{sci.name[0]}</span>
              <div className={s.assignInfo}>
                <span className={s.assignName}>{sci.name}</span>
                <span className={s.assignEmail}>{sci.email}</span>
              </div>
              {req.assignedScientist?._id === sci._id && (
                <span className={s.assignedTag}>Current</span>
              )}
              {assigning === sci._id && (
                <span className={s.assignedTag}>…</span>
              )}
            </button>
          ))}
        </div>
        <div className={s.modalFooter}>
          <button className={s.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Request card ─────────────────────────────────────────────────────────────
function RequestCard ({
  req,
  isAvailable,
  labApi,
  onRefresh,
  scientists
}: {
  req: LabRequest
  isAvailable: boolean
  labApi: ReturnType<typeof makeLabApi>
  onRefresh: () => void
  scientists?: Scientist[]
}) {
  const modal = useStatusModal()
  const [expanded, setExpanded] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  async function claim () {
    setClaiming(true)
    try {
      await labApi.post(`/diagnostics/labs/requests/${req._id}/claim`)
      modal.show({
        variant: 'success',
        title: 'Request Claimed',
        message:
          'This request is now in your queue. The patient has been notified.'
      })
      onRefresh()
    } catch (e: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Error',
        message:
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Could not claim request.'
      })
    }
    setClaiming(false)
  }

  async function updateStatus (status: string) {
    setStatusUpdating(true)
    try {
      await labApi.put(`/diagnostics/labs/requests/${req._id}/status`, {
        status
      })
      onRefresh()
    } catch (e: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Error',
        message:
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Could not update status.'
      })
    }
    setStatusUpdating(false)
  }

  const preferred = fmtPreferred(req.preferredDate, req.preferredTime)
  const isPaid = req.paymentRef?.status === 'success'
  const isCompleted = req.status === 'completed'

  return (
    <>
      <div className={s.reqCard}>
        <div
          className={s.reqCardTop}
          onClick={() => setExpanded(p => !p)}
          role='button'
        >
          <div className={`${s.reqIcon} ${isCompleted ? s.reqIconDone : ''}`}>
            <MicroscopeIcon size={18} />
          </div>
          <div className={s.reqInfo}>
            <p className={s.reqTitle}>
              {req.tests.slice(0, 2).join(', ')}
              {req.tests.length > 2 && (
                <span className={s.moreTag}> +{req.tests.length - 2}</span>
              )}
            </p>
            <span className={s.reqMeta}>
              {req.patient?.name ?? 'Patient'} ·{' '}
              {req.collectionType === 'home_visit' ? (
                <>
                  <HomeIcon size={14} /> Home Visit
                </>
              ) : (
                <>
                  <WalkingIcon size={14} /> Walk-in
                </>
              )}{' '}
              · {fmt(req.createdAt)}
            </span>
          </div>
          <div className={s.reqRight}>
            <span
              className={`${s.statusBadge} ${STATUS_CLS[req.status] ?? ''}`}
            >
              {STATUS_LABEL[req.status] ?? req.status}
            </span>
            <span className={s.chevron}>
              {expanded ? (
                <ChevronUpIcon size={14} />
              ) : (
                <ChevronDownIcon size={14} />
              )}
            </span>
          </div>
        </div>

        {expanded && (
          <div className={s.reqBody}>
            {/* Tests */}
            <div>
              <p className={s.bodyLabel}>Tests</p>
              <div className={s.testTags}>
                {req.tests.map((t, i) => (
                  <span key={i} className={s.testTag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className={s.detailGrid}>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Patient</span>
                <span className={s.detailVal}>{req.patient?.name ?? '—'}</span>
                {req.patient?.phone && (
                  <span className={s.detailSub}>{req.patient.phone}</span>
                )}
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Booking Ref</span>
                <span className={`${s.detailVal} ${s.detailMono}`}>
                  #{req._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Collection</span>
                <span className={s.detailVal}>
                  {req.collectionType === 'home_visit'
                    ? 'Home Visit'
                    : 'Walk-in at Lab'}
                </span>
              </div>
              {req.assignedScientist && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>Assigned To</span>
                  <span className={s.detailVal}>
                    {req.assignedScientist.name}
                  </span>
                  <span className={s.detailSub}>
                    {req.assignedScientist.email}
                  </span>
                </div>
              )}
              {req.totalAmount > 0 && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>Amount</span>
                  <span className={`${s.detailVal} ${s.detailGreen}`}>
                    ₦{req.totalAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {req.paymentRef && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>Payment</span>
                  <span
                    className={`${s.detailVal} ${
                      isPaid ? s.detailGreen : s.detailWarn
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckIcon size={14} /> Confirmed
                      </>
                    ) : (
                      <>
                        <ClockIcon size={14} /> Pending
                      </>
                    )}
                  </span>
                  {req.paymentRef.reference && (
                    <span className={s.detailSub}>
                      {req.paymentRef.reference}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Home visit schedule */}
            {req.collectionType === 'home_visit' && (
              <div className={s.visitBox}>
                {req.pickupLocation?.address && (
                  <p className={s.visitAddr}>
                    <MapPinIcon size={14} /> {req.pickupLocation.address}
                  </p>
                )}
                {preferred && (
                  <p className={s.visitDate}>
                    Preferred: <strong>{preferred}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {req.notes && <p className={s.notesText}>Note: {req.notes}</p>}

            {/* Wellness package */}
            {req.wellnessPackage && (
              <p className={s.pkgTag}>
                <ClipboardIcon size={14} /> Package: {req.wellnessPackage.name}
              </p>
            )}

            {/* Actions */}
            <div className={s.actionRow}>
              {isAvailable && (
                <button
                  className={s.claimBtn}
                  onClick={claim}
                  disabled={claiming}
                >
                  {claiming ? (
                    <Loader inline size='sm' />
                  ) : (
                    'Claim This Request'
                  )}
                </button>
              )}

              {!isAvailable && !isCompleted && (
                <>
                  {req.status === 'assigned' && (
                    <button
                      className={s.actionBtn}
                      disabled={statusUpdating}
                      onClick={() => updateStatus('sample_collected')}
                    >
                      {statusUpdating ? '…' : 'Mark Sample Collected'}
                    </button>
                  )}
                  {req.status === 'sample_collected' && (
                    <button
                      className={s.actionBtn}
                      disabled={statusUpdating}
                      onClick={() => updateStatus('processing')}
                    >
                      {statusUpdating ? '…' : 'Mark Processing'}
                    </button>
                  )}
                  {(req.status === 'sample_collected' ||
                    req.status === 'processing' ||
                    req.status === 'assigned') && (
                    <button
                      className={s.uploadBtn}
                      onClick={() => setShowUpload(true)}
                    >
                      <DocumentIcon size={13} /> Upload Result
                    </button>
                  )}
                  {req.status === 'assigned' &&
                    req.collectionType === 'walk_in' && (
                      <button
                        className={s.noShowBtn}
                        disabled={statusUpdating}
                        onClick={() => updateStatus('no_show')}
                      >
                        Mark No-Show
                      </button>
                    )}
                  {scientists && scientists.length > 0 && (
                    <button
                      className={s.assignBtn}
                      onClick={() => setShowAssign(true)}
                    >
                      {req.assignedScientist
                        ? `↗ ${req.assignedScientist.name}`
                        : 'Assign Scientist'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          req={req}
          labApi={labApi}
          onClose={() => setShowUpload(false)}
          onDone={onRefresh}
        />
      )}
      {showAssign && scientists && (
        <AssignScientistModal
          req={req}
          scientists={scientists}
          labApi={labApi}
          onClose={() => setShowAssign(false)}
          onDone={() => {
            setShowAssign(false)
            onRefresh()
          }}
        />
      )}
    </>
  )
}

// ── Walk-in registration tab ─────────────────────────────────────────────────
interface WalkInTest {
  _id: string
  name: string
  category: string
  walkInPrice?: number
  estimatedPrice?: number
  turnaroundHours: number
}
interface WellnessPkg {
  _id: string
  name: string
  gender: string
  walkInPrice: number
  includedTests: string[]
  isActive: boolean
}
type WalkInStep = 'patient' | 'tests' | 'payment' | 'done'
type WalkInPay = 'pos' | 'direct_transfer'
type WalkInMode = 'individual' | 'wellness'

const WALK_IN_PAY: { value: WalkInPay; label: string; desc: string }[] = [
  {
    value: 'pos',
    label: 'POS / Card',
    desc: 'Debit or credit card via POS terminal'
  },
  {
    value: 'direct_transfer',
    label: 'Bank Transfer',
    desc: 'Direct bank transfer to account'
  }
]

function WalkInTab ({ labApi }: { labApi: ReturnType<typeof makeLabApi> }) {
  const [step, setStep] = useState<WalkInStep>('patient')
  const [testMode, setTestMode] = useState<WalkInMode>('individual')
  const [allTests, setAllTests] = useState<WalkInTest[]>([])
  const [allPackages, setAllPackages] = useState<WellnessPkg[]>([])
  const [selectedPkg, setSelectedPkg] = useState<WellnessPkg | null>(null)
  const [loadingTests, setLoadingTests] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [patient, setPatient] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [payMethod, setPayMethod] = useState<WalkInPay>('pos')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    bookingRef: string
    patientName: string
    phone: string
    tests: string[]
    total: number
    payLabel: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    labApi
      .get('/diagnostics/labs/test-catalog')
      .then(r => setAllTests(r.data.data?.tests ?? []))
      .catch(() => setAllTests([]))
      .finally(() => setLoadingTests(false))
    labApi
      .get('/diagnostics/labs/wellness-packages')
      .then(r => setAllPackages(r.data.data ?? []))
      .catch(() => {})
  }, [labApi])

  const filtered = allTests.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const grouped = filtered.reduce<Record<string, WalkInTest[]>>((acc, t) => {
    const cat = t.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  const selectedTests = allTests.filter(t => selected.includes(t.name))
  const total =
    testMode === 'wellness' && selectedPkg
      ? selectedPkg.walkInPrice
      : selectedTests.reduce(
          (sum, t) => sum + (t.walkInPrice ?? t.estimatedPrice ?? 0),
          0
        )

  const displayTests =
    testMode === 'wellness' && selectedPkg
      ? selectedPkg.includedTests
      : selected

  const canProceed =
    testMode === 'wellness' ? !!selectedPkg : selected.length > 0

  function toggle (name: string) {
    setSelected(p =>
      p.includes(name) ? p.filter(n => n !== name) : [...p, name]
    )
  }

  async function submit () {
    setSubmitting(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        patientName: patient.name,
        patientPhone: patient.phone,
        patientEmail: patient.email || undefined,
        paymentMethod: payMethod,
        totalAmount: total,
        notes: patient.notes || undefined
      }
      if (testMode === 'wellness' && selectedPkg) {
        body.wellnessPackageId = selectedPkg._id
      } else {
        body.tests = selected
      }
      const res = await labApi.post('/diagnostics/labs/walk-in', body)
      const d = res.data.data
      setResult({
        bookingRef: d.bookingRef,
        patientName: d.patient.name,
        phone: d.patient.phone,
        tests: displayTests,
        total,
        payLabel:
          WALK_IN_PAY.find(m => m.value === payMethod)?.label ?? payMethod
      })
      setStep('done')
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to create request.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function reset () {
    setStep('patient')
    setSelected([])
    setSelectedPkg(null)
    setTestMode('individual')
    setSearch('')
    setPatient({ name: '', phone: '', email: '', notes: '' })
    setPayMethod('pos')
    setResult(null)
    setError('')
  }

  const STEPS: WalkInStep[] = ['patient', 'tests', 'payment', 'done']
  const STEP_LABELS: Record<WalkInStep, string> = {
    patient: 'Patient',
    tests: 'Tests',
    payment: 'Payment',
    done: 'Done'
  }

  return (
    <div className={s.wiWrap}>
      {/* Stepper */}
      <div className={s.wiStepper}>
        {STEPS.map((st, i) => {
          const done = STEPS.indexOf(st) < STEPS.indexOf(step)
          const active = st === step
          return (
            <div key={st} className={s.wiStepItem}>
              <div
                className={`${s.wiStepBubble} ${active ? s.wiStepActive : ''} ${
                  done ? s.wiStepDone : ''
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={`${s.wiStepLabel} ${
                  active ? s.wiStepLabelActive : ''
                }`}
              >
                {STEP_LABELS[st]}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`${s.wiStepLine} ${done ? s.wiStepLineDone : ''}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Patient ── */}
      {step === 'patient' && (
        <div className={s.wiCard}>
          <h3 className={s.wiTitle}>Patient Information</h3>
          <p className={s.wiHint}>
            Enter the walk-in patient's details. If they have an existing
            account it will be linked automatically.
          </p>
          <div className={s.wiGrid}>
            <label className={s.wiField}>
              <span className={s.wiLabel}>
                Full Name <em className={s.wiReq}>*</em>
              </span>
              <input
                className={s.wiInput}
                placeholder='e.g. John Adeyemi'
                value={patient.name}
                onChange={e =>
                  setPatient(p => ({ ...p, name: e.target.value }))
                }
                autoFocus
              />
            </label>
            <label className={s.wiField}>
              <span className={s.wiLabel}>
                Phone <em className={s.wiReq}>*</em>
              </span>
              <input
                className={s.wiInput}
                placeholder='e.g. 08012345678'
                value={patient.phone}
                onChange={e =>
                  setPatient(p => ({ ...p, phone: e.target.value }))
                }
              />
            </label>
            <label className={s.wiField}>
              <span className={s.wiLabel}>
                Email <small className={s.wiOpt}>(optional)</small>
              </span>
              <input
                className={s.wiInput}
                type='email'
                placeholder='patient@example.com'
                value={patient.email}
                onChange={e =>
                  setPatient(p => ({ ...p, email: e.target.value }))
                }
              />
            </label>
            <label className={`${s.wiField} ${s.wiFieldFull}`}>
              <span className={s.wiLabel}>
                Clinical Notes <small className={s.wiOpt}>(optional)</small>
              </span>
              <textarea
                className={`${s.wiInput} ${s.wiTextarea}`}
                placeholder='Referral info, symptoms…'
                value={patient.notes}
                onChange={e =>
                  setPatient(p => ({ ...p, notes: e.target.value }))
                }
              />
            </label>
          </div>
          <div className={s.wiActions}>
            <button
              className={s.wiBtn}
              disabled={!patient.name.trim() || !patient.phone.trim()}
              onClick={() => setStep('tests')}
            >
              Next: Select Tests →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Tests ── */}
      {step === 'tests' && (
        <div className={s.wiCard}>
          <div className={s.wiTopRow}>
            <div>
              <h3 className={s.wiTitle}>Select Tests</h3>
              <p className={s.wiHint}>
                Choose individual tests or a wellness package.
              </p>
            </div>
            {canProceed && (
              <div className={s.wiSelBadge}>
                {testMode === 'wellness'
                  ? selectedPkg!.name
                  : `${selected.length} · ₦${total.toLocaleString()}`}
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div className={s.wiModeToggle}>
            <button
              className={`${s.wiModeBtn} ${
                testMode === 'individual' ? s.wiModeBtnActive : ''
              }`}
              onClick={() => {
                setTestMode('individual')
                setSelectedPkg(null)
              }}
            >
              Individual Tests
            </button>
            <button
              className={`${s.wiModeBtn} ${
                testMode === 'wellness' ? s.wiModeBtnActive : ''
              }`}
              onClick={() => {
                setTestMode('wellness')
                setSelected([])
              }}
            >
              Wellness Package
            </button>
          </div>

          {testMode === 'individual' ? (
            <>
              <div className={s.wiSearch}>
                <SearchIcon size={14} />
                <input
                  className={s.wiSearchInput}
                  placeholder='Search tests…'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    className={s.searchClear}
                    onClick={() => setSearch('')}
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>
              {loadingTests ? (
                <div className={s.empty}>
                  <Loader label='Loading tests…' />
                </div>
              ) : filtered.length === 0 ? (
                <p className={s.empty}>
                  No tests found{search ? ` for "${search}"` : '.'}
                </p>
              ) : (
                <div className={s.wiTestsScroll}>
                  {Object.entries(grouped)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([cat, tests]) => (
                      <div key={cat} className={s.wiCatGroup}>
                        <p className={s.wiCatLabel}>
                          {cat}{' '}
                          <span className={s.wiCatCount}>{tests.length}</span>
                        </p>
                        {tests.map(t => {
                          const price = t.walkInPrice ?? t.estimatedPrice ?? 0
                          const sel = selected.includes(t.name)
                          return (
                            <label
                              key={t._id}
                              className={`${s.wiTestRow} ${
                                sel ? s.wiTestRowSel : ''
                              }`}
                            >
                              <span
                                className={`${s.wiCheck} ${
                                  sel ? s.wiCheckOn : ''
                                }`}
                              >
                                {sel && '✓'}
                              </span>
                              <input
                                type='checkbox'
                                checked={sel}
                                onChange={() => toggle(t.name)}
                                style={{ display: 'none' }}
                              />
                              <span className={s.wiTestName}>{t.name}</span>
                              <span className={s.wiTurnaround}>
                                {t.turnaroundHours}h
                              </span>
                              <span className={s.wiPrice}>
                                {price > 0 ? `₦${price.toLocaleString()}` : '—'}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    ))}
                </div>
              )}
              {selected.length > 0 && (
                <div className={s.wiSummaryBar}>
                  <span>
                    {selected.length} test{selected.length !== 1 ? 's' : ''}
                  </span>
                  <span className={s.wiSummaryTotal}>
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {loadingTests ? (
                <div className={s.empty}>
                  <Loader label='Loading packages…' />
                </div>
              ) : allPackages.length === 0 ? (
                <p className={s.empty}>No wellness packages available.</p>
              ) : (
                <div className={s.wiPkgGrid}>
                  {allPackages.map(pkg => (
                    <button
                      key={pkg._id}
                      className={`${s.wiPkgCard} ${
                        selectedPkg?._id === pkg._id ? s.wiPkgCardSel : ''
                      }`}
                      onClick={() => setSelectedPkg(pkg)}
                    >
                      <p className={s.wiPkgName}>{pkg.name}</p>
                      {pkg.gender !== 'all' && (
                        <span className={s.wiPkgGender}>{pkg.gender}</span>
                      )}
                      <p className={s.wiPkgPrice}>
                        ₦{pkg.walkInPrice.toLocaleString()}
                      </p>
                      {pkg.includedTests.length > 0 && (
                        <div className={s.wiPkgTests}>
                          {pkg.includedTests.slice(0, 4).map(t => (
                            <span key={t} className={s.wiPkgTag}>
                              {t}
                            </span>
                          ))}
                          {pkg.includedTests.length > 4 && (
                            <span className={s.wiPkgTag}>
                              +{pkg.includedTests.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedPkg && (
                <div className={s.wiSummaryBar}>
                  <span>{selectedPkg.name}</span>
                  <span className={s.wiSummaryTotal}>
                    ₦{total.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}

          <div className={s.wiActions}>
            <button className={s.wiBtn2} onClick={() => setStep('patient')}>
              ← Back
            </button>
            <button
              className={s.wiBtn}
              disabled={!canProceed}
              onClick={() => setStep('payment')}
            >
              Next: Payment →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment ── */}
      {step === 'payment' && (
        <div className={s.wiCard}>
          <h3 className={s.wiTitle}>Review & Record Payment</h3>

          <div className={s.wiReviewBlock}>
            <p className={s.wiReviewTitle}>Patient</p>
            <div className={s.wiPatientRow}>
              <div className={s.wiAvatar}>
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={s.wiPatientName}>{patient.name}</p>
                <p className={s.wiPatientMeta}>
                  {patient.phone}
                  {patient.email ? ` · ${patient.email}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className={s.wiReviewBlock}>
            {testMode === 'wellness' && selectedPkg ? (
              <>
                <p className={s.wiReviewTitle}>Wellness Package</p>
                <div className={s.wiReviewRow}>
                  <span className={s.wiReviewName}>{selectedPkg.name}</span>
                  {selectedPkg.gender !== 'all' && (
                    <span className={s.wiReviewCat}>{selectedPkg.gender}</span>
                  )}
                  <span className={s.wiReviewPrice}>
                    ₦{selectedPkg.walkInPrice.toLocaleString()}
                  </span>
                </div>
                {selectedPkg.includedTests.length > 0 && (
                  <div className={s.wiPkgTests} style={{ marginTop: 6 }}>
                    {selectedPkg.includedTests.map(t => (
                      <span key={t} className={s.wiPkgTag}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className={s.wiReviewTitle}>
                  Tests ({selectedTests.length})
                </p>
                {selectedTests.map(t => {
                  const price = t.walkInPrice ?? t.estimatedPrice ?? 0
                  return (
                    <div key={t._id} className={s.wiReviewRow}>
                      <span className={s.wiReviewName}>{t.name}</span>
                      <span className={s.wiReviewCat}>{t.category}</span>
                      <span className={s.wiReviewPrice}>
                        {price > 0 ? `₦${price.toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                  )
                })}
              </>
            )}
            <div className={s.wiTotalRow}>
              <span>Total</span>
              <span className={s.wiTotalVal}>₦{total.toLocaleString()}</span>
            </div>
          </div>

          <div className={s.wiReviewBlock}>
            <p className={s.wiReviewTitle}>Payment Method</p>
            <div className={s.wiPayGrid}>
              {WALK_IN_PAY.map(m => (
                <label
                  key={m.value}
                  className={`${s.wiPayCard} ${
                    payMethod === m.value ? s.wiPayCardActive : ''
                  }`}
                >
                  <input
                    type='radio'
                    name='pm'
                    value={m.value}
                    checked={payMethod === m.value}
                    onChange={() => setPayMethod(m.value)}
                    style={{ display: 'none' }}
                  />
                  <span
                    className={`${s.wiPayDot} ${
                      payMethod === m.value ? s.wiPayDotOn : ''
                    }`}
                  />
                  <div>
                    <p className={s.wiPayLabel}>{m.label}</p>
                    <p className={s.wiPayDesc}>{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className={s.errMsg}>{error}</p>}
          <div className={s.wiActions}>
            <button
              className={s.wiBtn2}
              onClick={() => {
                setError('')
                setStep('tests')
              }}
            >
              ← Back
            </button>
            <button className={s.wiBtn} disabled={submitting} onClick={submit}>
              {submitting ? (
                <Loader inline size='sm' />
              ) : (
                'Confirm & Register →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && result && (
        <div className={s.wiCard}>
          <div className={s.wiSuccessBanner}>
            <span className={s.wiSuccessCheck}>✓</span>
            <div>
              <p className={s.wiSuccessTitle}>Registered Successfully</p>
              <p className={s.wiSuccessSub}>
                Walk-in request created and payment recorded.
              </p>
            </div>
          </div>

          <div className={s.wiTicket} id='lab-walkin-ticket'>
            {/* Branded header stripe */}
            <div className={s.wiTicketHeader}>
              <div className={s.wiTicketHeaderLeft}>
                <span className={s.wiTicketHeaderLogo}>iBam Health</span>
                <span className={s.wiTicketHeaderSub}>Diagnostics Centre</span>
              </div>
              <div className={s.wiTicketHeaderRight}>
                <span className={s.wiTicketHeaderBadge}>OFFICIAL RECEIPT</span>
                <span className={s.wiTicketHeaderDate}>
                  {new Date().toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Booking reference */}
            <div className={s.wiTicketRefWrap}>
              <span className={s.wiTicketRefLabel}>Booking Reference</span>
              <span className={s.wiTicketRef}>{result.bookingRef}</span>
            </div>

            {/* Patient details grid */}
            <div className={s.wiTicketGrid}>
              <div>
                <p className={s.wiTLabel}>Patient Name</p>
                <p className={s.wiTVal}>{result.patientName}</p>
              </div>
              <div>
                <p className={s.wiTLabel}>Phone</p>
                <p className={s.wiTVal}>{result.phone}</p>
              </div>
              <div>
                <p className={s.wiTLabel}>Collection Type</p>
                <p className={s.wiTVal}>Walk-in</p>
              </div>
              <div>
                <p className={s.wiTLabel}>Payment Method</p>
                <p className={s.wiTVal}>{result.payLabel}</p>
              </div>
            </div>

            <div className={s.wiTicketDiv} />

            {/* Tests */}
            <div>
              <p className={s.wiTLabel}>Tests Requested</p>
              <ul className={s.wiTicketList}>
                {result.tests.map(t => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            <div className={s.wiTicketDiv} />

            {/* Total */}
            <div className={s.wiTicketTotalRow}>
              <span>Amount Paid</span>
              <span className={s.wiTicketTotalVal}>
                ₦{result.total.toLocaleString()}
              </span>
            </div>

            {/* Footer */}
            <p className={s.wiTicketFooter}>
              Present this slip at the sample collection point.
              <br />
              <strong>iBam Health</strong> · ibamhealth.com
            </p>
          </div>

          <div className={s.wiActions}>
            <button
              className={s.wiBtn2}
              onClick={() =>
                downloadReceipt({
                  bookingRef: result.bookingRef,
                  tests: result.tests,
                  amount: result.total,
                  collectionType: 'walk_in',
                  patientName: result.patientName,
                  paymentMethod: result.payLabel
                })
              }
            >
              🖨 Print Slip
            </button>
            <button className={s.wiBtn} onClick={reset}>
              + Register Another Patient
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Scientist request card ────────────────────────────────────────────────────
function ScientistCard ({
  req,
  labApi,
  onRefresh
}: {
  req: LabRequest
  labApi: ReturnType<typeof makeLabApi>
  onRefresh: () => void
}) {
  const modal = useStatusModal()
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const isCompleted = req.status === 'completed'

  async function updateStatus (status: string) {
    setUpdating(true)
    try {
      await labApi.put(`/diagnostics/scientist/requests/${req._id}/status`, {
        status
      })
      onRefresh()
    } catch (e: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Error',
        message:
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Could not update status.'
      })
    }
    setUpdating(false)
  }

  return (
    <>
      <div className={s.reqCard}>
        <div
          className={s.reqCardTop}
          onClick={() => setExpanded(p => !p)}
          role='button'
        >
          <div className={`${s.reqIcon} ${isCompleted ? s.reqIconDone : ''}`}>
            <MicroscopeIcon size={18} />
          </div>
          <div className={s.reqInfo}>
            <p className={s.reqTitle}>
              {req.tests.slice(0, 2).join(', ')}
              {req.tests.length > 2 && (
                <span className={s.moreTag}> +{req.tests.length - 2}</span>
              )}
            </p>
            <span className={s.reqMeta}>
              {req.patient?.name ?? 'Patient'} ·{' '}
              {req.collectionType === 'home_visit' ? (
                <>
                  <HomeIcon size={14} /> Home Visit
                </>
              ) : (
                <>
                  <WalkingIcon size={14} /> Walk-in
                </>
              )}{' '}
              · {fmt(req.createdAt)}
            </span>
          </div>
          <div className={s.reqRight}>
            <span
              className={`${s.statusBadge} ${STATUS_CLS[req.status] ?? ''}`}
            >
              {STATUS_LABEL[req.status] ?? req.status}
            </span>
            <span className={s.chevron}>
              {expanded ? (
                <ChevronUpIcon size={14} />
              ) : (
                <ChevronDownIcon size={14} />
              )}
            </span>
          </div>
        </div>

        {expanded && (
          <div className={s.reqBody}>
            <div>
              <p className={s.bodyLabel}>Tests</p>
              <div className={s.testTags}>
                {req.tests.map((t, i) => (
                  <span key={i} className={s.testTag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className={s.detailGrid}>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Patient</span>
                <span className={s.detailVal}>{req.patient?.name ?? '—'}</span>
                {req.patient?.phone && (
                  <span className={s.detailSub}>{req.patient.phone}</span>
                )}
              </div>
              <div className={s.detailItem}>
                <span className={s.detailLabel}>Booking Ref</span>
                <span className={`${s.detailVal} ${s.detailMono}`}>
                  #{req._id.slice(-8).toUpperCase()}
                </span>
              </div>
              {req.totalAmount > 0 && (
                <div className={s.detailItem}>
                  <span className={s.detailLabel}>Amount</span>
                  <span className={`${s.detailVal} ${s.detailGreen}`}>
                    ₦{req.totalAmount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {req.notes && <p className={s.notesText}>Note: {req.notes}</p>}
            {req.wellnessPackage && (
              <p className={s.pkgTag}>
                <ClipboardIcon size={14} /> Package: {req.wellnessPackage.name}
              </p>
            )}

            {req.result && (
              <div className={s.sciResultBox}>
                <p className={s.sciResultReady}>Result uploaded</p>
                {req.result.notes && (
                  <p className={s.notesText}>{req.result.notes}</p>
                )}
                {req.result.signedUrl && (
                  <a
                    href={req.result.signedUrl}
                    target='_blank'
                    rel='noreferrer'
                    className={s.downloadBtn}
                  >
                    <DocumentIcon size={13} /> Download Result
                  </a>
                )}
              </div>
            )}

            {!isCompleted && (
              <div className={s.actionRow}>
                {req.status === 'assigned' && (
                  <button
                    className={s.actionBtn}
                    disabled={updating}
                    onClick={() => updateStatus('sample_collected')}
                  >
                    {updating ? '…' : 'Mark Sample Collected'}
                  </button>
                )}
                {req.status === 'sample_collected' && (
                  <button
                    className={s.actionBtn}
                    disabled={updating}
                    onClick={() => updateStatus('processing')}
                  >
                    {updating ? '…' : 'Mark Processing'}
                  </button>
                )}
                <button
                  className={s.uploadBtn}
                  onClick={() => setShowUpload(true)}
                >
                  <DocumentIcon size={13} /> Upload & Complete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {showUpload && (
        <UploadModal
          req={req}
          labApi={labApi}
          onClose={() => setShowUpload(false)}
          onDone={onRefresh}
        />
      )}
    </>
  )
}

// ── Scientist portal ──────────────────────────────────────────────────────────
function ScientistPortal ({
  labApi,
  labName
}: {
  labApi: ReturnType<typeof makeLabApi>
  labName: string
}) {
  const [historyMode, setHistoryMode] = useState(false)
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    labApi
      .get(
        `/diagnostics/scientist/requests${historyMode ? '?history=true' : ''}`
      )
      .then(r => setRequests(r.data.data?.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [labApi, historyMode])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>My Assigned Tests</h1>
          {labName && <p className={s.labSubtitle}>{labName}</p>}
        </div>
        <button className={s.refreshBtn} onClick={load}>
          ↻ Refresh
        </button>
      </div>

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${!historyMode ? s.tabActive : ''}`}
          onClick={() => setHistoryMode(false)}
        >
          Active
          {!historyMode && requests.length > 0 && (
            <span className={s.badge}>{requests.length}</span>
          )}
        </button>
        <button
          className={`${s.tab} ${historyMode ? s.tabActive : ''}`}
          onClick={() => setHistoryMode(true)}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className={s.empty}>
          <Loader label='Loading tests…' />
        </div>
      ) : requests.length === 0 ? (
        <div className={s.empty}>
          {historyMode
            ? 'No completed tests yet.'
            : 'No active tests assigned to you.'}
        </div>
      ) : (
        <div className={s.list}>
          {requests.map(req => (
            <ScientistCard
              key={req._id}
              req={req}
              labApi={labApi}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── My Team tab ───────────────────────────────────────────────────────────────
function TeamTab ({ labApi }: { labApi: ReturnType<typeof makeLabApi> }) {
  const modal = useStatusModal()
  const [scientists, setScientists] = useState<Scientist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function loadTeam () {
    setLoading(true)
    labApi
      .get('/diagnostics/labs/scientists')
      .then(r => setScientists(r.data.data?.scientists ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTeam()
  }, [labApi])

  async function addScientist () {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr('Name, email, and password are required.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      await labApi.post('/diagnostics/labs/scientists', form)
      setForm({ name: '', email: '', phone: '', password: '' })
      setShowForm(false)
      loadTeam()
      modal.show({
        variant: 'success',
        title: 'Scientist Added',
        message:
          'Account created. Share the credentials with the new scientist.'
      })
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to create account.'
      )
    }
    setSaving(false)
  }

  return (
    <div className={s.teamWrap}>
      <div className={s.teamHeader}>
        <h2 className={s.teamTitle}>Lab Scientists ({scientists.length})</h2>
        <button className={s.addSciBtn} onClick={() => setShowForm(p => !p)}>
          {showForm ? 'Cancel' : '+ Add Scientist'}
        </button>
      </div>

      {showForm && (
        <div className={s.addSciForm}>
          <h3 className={s.addSciFormTitle}>New Scientist Account</h3>
          {err && <p className={s.errMsg}>{err}</p>}
          <div className={s.sciFormGrid}>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Full Name *</span>
              <input
                className={s.sciFormInput}
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder='Dr. Jane Okafor'
              />
            </label>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Email *</span>
              <input
                className={s.sciFormInput}
                type='email'
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder='jane@lab.com'
              />
            </label>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Phone</span>
              <input
                className={s.sciFormInput}
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder='08012345678'
              />
            </label>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Temporary Password *</span>
              <input
                className={s.sciFormInput}
                type='password'
                value={form.password}
                onChange={e =>
                  setForm(p => ({ ...p, password: e.target.value }))
                }
                placeholder='Min 8 characters'
              />
            </label>
          </div>
          <button className={s.wiBtn} disabled={saving} onClick={addScientist}>
            {saving ? <Loader inline size='sm' /> : 'Create Account'}
          </button>
        </div>
      )}

      {loading ? (
        <div className={s.empty}>
          <Loader label='Loading team…' />
        </div>
      ) : scientists.length === 0 ? (
        <div className={s.empty}>No lab scientists yet. Add one above.</div>
      ) : (
        <div className={s.sciTeamList}>
          {scientists.map(sci => (
            <div key={sci._id} className={s.sciTeamCard}>
              <div className={s.sciTeamAvatar}>{sci.name[0]}</div>
              <div className={s.sciTeamInfo}>
                <p className={s.sciTeamName}>{sci.name}</p>
                <p className={s.sciTeamEmail}>{sci.email}</p>
                {sci.phone && <p className={s.sciTeamPhone}>{sci.phone}</p>}
              </div>
              <span className={s.sciTeamJoined}>
                Joined {fmt(sci.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main lab portal ───────────────────────────────────────────────────────────
function LabPortalInner () {
  const searchParams = useSearchParams()
  const modal = useStatusModal()

  const urlToken = searchParams.get('token')

  const [labApi] = useState(() => {
    // Store impersonation token from URL into sessionStorage at init time
    if (urlToken && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('lab_token', urlToken)
    }
    return makeLabApi(urlToken ?? undefined)
  })

  // Clean the token out of the URL after mount — must be in useEffect, not during render
  useEffect(() => {
    if (urlToken && typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/lab')
    }
  }, [urlToken])

  const [tab, setTab] = useState<Tab>('available')
  const [available, setAvailable] = useState<LabRequest[]>([])
  const [mine, setMine] = useState<LabRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [labName, setLabName] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [scientists, setScientists] = useState<Scientist[]>([])
  const [search, setSearch] = useState('')

  // Phase 1: load profile to detect role
  useEffect(() => {
    labApi
      .get('/diagnostics/labs/profile')
      .then(r => {
        setLabName(r.data.data?.lab?.name ?? '')
        setUserRole(r.data.data?.userRole ?? 'lab_partner')
      })
      .catch(() => setUserRole('lab_partner'))
  }, [labApi])

  // Phase 2: load requests (non-scientists only) + scientists list
  const load = useCallback(async () => {
    if (!userRole || userRole === 'lab_scientist') return
    try {
      const [reqRes, sciRes] = await Promise.allSettled([
        labApi.get('/diagnostics/labs/requests'),
        labApi.get('/diagnostics/labs/scientists')
      ])
      if (reqRes.status === 'fulfilled') {
        setAvailable(reqRes.value.data.data?.available ?? [])
        setMine(reqRes.value.data.data?.mine ?? [])
      } else {
        const status = (reqRes.reason as { response?: { status?: number } })
          ?.response?.status
        if (status === 401) {
          modal.show({
            variant: 'declined',
            title: 'Session Expired',
            message:
              'Please log in again or ask an admin to re-open the portal.'
          })
        }
      }
      if (sciRes.status === 'fulfilled') {
        setScientists(sciRes.value.data.data?.scientists ?? [])
      }
    } catch {
      /* ignore */
    }
  }, [labApi, modal, userRole])

  useEffect(() => {
    if (userRole === null) return
    load().finally(() => setLoading(false))
    if (userRole === 'lab_scientist') return
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [load, userRole])

  const myActive = mine.filter(
    r => r.status !== 'completed' && r.status !== 'cancelled'
  )
  const myDone = mine.filter(
    r => r.status === 'completed' || r.status === 'cancelled'
  )

  function filterRequests (list: LabRequest[]) {
    const q = search.trim().toLowerCase().replace(/^#/, '')
    if (!q) return list
    return list.filter(
      r =>
        r._id.toLowerCase().includes(q) ||
        r._id.slice(-8).toLowerCase() === q ||
        r.patient?.name?.toLowerCase().includes(q) ||
        r.patient?._id?.toLowerCase().includes(q) ||
        r.patient?.phone?.includes(q) ||
        r.patient?.email?.toLowerCase().includes(q) ||
        r.paymentRef?.reference?.toLowerCase().includes(q)
    )
  }

  const tabData: Record<Tab, LabRequest[]> = {
    available: filterRequests(available),
    mine: filterRequests(myActive),
    completed: filterRequests(myDone),
    walkin: [],
    team: []
  }

  // Show loading spinner until profile is resolved
  if (userRole === null) {
    return (
      <div className={s.wrap}>
        <div className={s.empty}>
          <Loader label='Loading portal…' />
        </div>
      </div>
    )
  }

  // Scientists see their own portal
  if (userRole === 'lab_scientist') {
    return <ScientistPortal labApi={labApi} labName={labName} />
  }

  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Lab Portal</h1>
          {labName && <p className={s.labSubtitle}>{labName}</p>}
        </div>
        <button className={s.refreshBtn} onClick={() => load()}>
          ↻ Refresh
        </button>
      </div>

      {/* Search bar — hidden on walk-in and team tabs */}
      <div
        className={s.searchWrap}
        style={
          tab === 'walkin' || tab === 'team' ? { display: 'none' } : undefined
        }
      >
        <span className={s.searchIcon}>
          <SearchIcon size={14} />
        </span>
        <input
          className={s.searchInput}
          placeholder='Search by patient ID, name, or transaction ref…'
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={s.searchClear} onClick={() => setSearch('')}>
            <XIcon size={14} />
          </button>
        )}
      </div>

      {search.trim() && tab !== 'walkin' && tab !== 'team' && (
        <p className={s.searchHint}>
          Tip: paste the patient&apos;s <strong>User ID</strong> or{' '}
          <strong>Transaction Ref</strong> from their receipt for an exact
          match.
        </p>
      )}

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === 'available' ? s.tabActive : ''}`}
          onClick={() => setTab('available')}
        >
          Available Requests
          {tabData.available.length > 0 && (
            <span className={s.badge}>{tabData.available.length}</span>
          )}
        </button>
        <button
          className={`${s.tab} ${tab === 'mine' ? s.tabActive : ''}`}
          onClick={() => setTab('mine')}
        >
          In Progress
          {tabData.mine.length > 0 && (
            <span className={s.badge}>{tabData.mine.length}</span>
          )}
        </button>
        <button
          className={`${s.tab} ${tab === 'completed' ? s.tabActive : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed
        </button>
        <button
          className={`${s.tab} ${tab === 'walkin' ? s.tabActive : ''} ${
            s.tabWalkin
          }`}
          onClick={() => setTab('walkin')}
        >
          + Walk-in
        </button>
        <button
          className={`${s.tab} ${tab === 'team' ? s.tabActive : ''}`}
          onClick={() => setTab('team')}
        >
          My Team
          {scientists.length > 0 && (
            <span className={s.badge}>{scientists.length}</span>
          )}
        </button>
      </div>

      {tab === 'walkin' ? (
        <WalkInTab labApi={labApi} />
      ) : tab === 'team' ? (
        <TeamTab labApi={labApi} />
      ) : loading ? (
        <div className={s.empty}>
          <Loader label='Loading requests…' />
        </div>
      ) : tabData[tab as Exclude<Tab, 'walkin' | 'team'>]?.length === 0 ? (
        <div className={s.empty}>
          {search.trim()
            ? 'No requests match your search.'
            : tab === 'available'
            ? 'No new requests at the moment.'
            : tab === 'mine'
            ? 'No active requests.'
            : 'No completed requests yet.'}
        </div>
      ) : (
        <div className={s.list}>
          {tabData[tab as Exclude<Tab, 'walkin' | 'team'>]?.map(req => (
            <RequestCard
              key={req._id}
              req={req}
              isAvailable={tab === 'available'}
              labApi={labApi}
              onRefresh={load}
              scientists={
                tab === 'mine' && scientists.length > 0 ? scientists : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LabPortalPage () {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader label='Loading…' />
        </div>
      }
    >
      <LabPortalInner />
    </Suspense>
  )
}

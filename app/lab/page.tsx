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

type Tab = 'available' | 'mine' | 'completed' | 'walkin'

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

// ── Request card ─────────────────────────────────────────────────────────────
function RequestCard ({
  req,
  isAvailable,
  labApi,
  onRefresh
}: {
  req: LabRequest
  isAvailable: boolean
  labApi: ReturnType<typeof makeLabApi>
  onRefresh: () => void
}) {
  const modal = useStatusModal()
  const [expanded, setExpanded] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

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
type WalkInStep = 'patient' | 'tests' | 'payment' | 'done'
type WalkInPay = 'pos' | 'direct_transfer'

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
  const [allTests, setAllTests] = useState<WalkInTest[]>([])
  const [loadingTests, setLoadingTests] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [patient, setPatient] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [payMethod, setPayMethod] = useState<WalkInPay>()
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
  const total = selectedTests.reduce(
    (sum, t) => sum + (t.walkInPrice ?? t.estimatedPrice ?? 0),
    0
  )

  function toggle (name: string) {
    setSelected(p =>
      p.includes(name) ? p.filter(n => n !== name) : [...p, name]
    )
  }

  async function submit () {
    setSubmitting(true)
    setError('')
    try {
      const res = await labApi.post('/diagnostics/labs/walk-in', {
        patientName: patient.name,
        patientPhone: patient.phone,
        patientEmail: patient.email || undefined,
        tests: selected,
        paymentMethod: payMethod,
        totalAmount: total,
        notes: patient.notes || undefined
      })
      const d = res.data.data
      setResult({
        bookingRef: d.bookingRef,
        patientName: d.patient.name,
        phone: d.patient.phone,
        tests: selected,
        total,
        payLabel:
          WALK_IN_PAY.find(m => m.value === payMethod)?.label ??
          payMethod ??
          'pos'
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
              <p className={s.wiHint}>Choose all tests the patient requires.</p>
            </div>
            {selected.length > 0 && (
              <div className={s.wiSelBadge}>
                {selected.length} · ₦{total.toLocaleString()}
              </div>
            )}
          </div>
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
              <button className={s.searchClear} onClick={() => setSearch('')}>
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
                      {cat} <span className={s.wiCatCount}>{tests.length}</span>
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
                            className={`${s.wiCheck} ${sel ? s.wiCheckOn : ''}`}
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
          <div className={s.wiActions}>
            <button className={s.wiBtn2} onClick={() => setStep('patient')}>
              ← Back
            </button>
            <button
              className={s.wiBtn}
              disabled={!selected.length}
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
            <p className={s.wiReviewTitle}>Tests ({selected.length})</p>
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
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const [reqRes, profileRes] = await Promise.all([
        labApi.get('/diagnostics/labs/requests'),
        labApi
          .get('/diagnostics/labs/profile')
          .catch(() => ({ data: { data: {} } }))
      ])
      setAvailable(reqRes.data.data?.available ?? [])
      setMine(reqRes.data.data?.mine ?? [])
      setLabName(profileRes.data.data?.lab?.name ?? '')
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 401) {
        modal.show({
          variant: 'declined',
          title: 'Session Expired',
          message: 'Please log in again or ask an admin to re-open the portal.'
        })
      }
    }
  }, [labApi, modal])

  useEffect(() => {
    load().finally(() => setLoading(false))
    const iv = setInterval(load, 30000) // poll every 30s for new requests
    return () => clearInterval(iv)
  }, [load])

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
    walkin: []
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

      {/* Search bar — hidden on walk-in tab */}
      <div
        className={s.searchWrap}
        style={tab === 'walkin' ? { display: 'none' } : undefined}
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

      {search.trim() && (
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
      </div>

      {tab === 'walkin' ? (
        <WalkInTab labApi={labApi} />
      ) : loading ? (
        <div className={s.empty}>
          <Loader label='Loading requests…' />
        </div>
      ) : tabData[tab as Exclude<Tab, 'walkin'>]?.length === 0 ? (
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
          {tabData[tab as Exclude<Tab, 'walkin'>]?.map(req => (
            <RequestCard
              key={req._id}
              req={req}
              isAvailable={tab === 'available'}
              labApi={labApi}
              onRefresh={load}
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

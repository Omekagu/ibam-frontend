'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { XIcon, SearchIcon } from '@/components/icons'
import { downloadReceipt } from '@/lib/receipt'
import s from './page.module.scss'

interface Scientist {
  _id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

interface LabTest {
  _id: string
  name: string
  category?: string
  walkInPrice?: number
  estimatedPrice?: number
  turnaroundHours: number
}

interface Patient { name: string; phone?: string; email?: string }

interface PaymentRef {
  status: string
  amount: number
  method: string
  reference?: string
  transferReference?: string
}

interface LabResultDoc {
  fileUrl: string
  signedUrl?: string
  notes?: string
  createdAt: string
}

interface Request {
  _id: string
  tests: string[]
  collectionType: 'home_visit' | 'walk_in'
  status: string
  notes?: string
  resultNotes?: string
  createdAt: string
  totalAmount?: number
  pickupLocation?: { address?: string; lat?: number; lng?: number }
  preferredDate?: string
  preferredTime?: string
  externalReferralUrl?: string
  patient?: Patient
  paymentRef?: PaymentRef | null
  result?: LabResultDoc | null
  assignedScientist?: { _id: string; name: string; email: string }
}

const METHOD_LABEL: Record<string, string> = {
  pos: 'POS',
  direct_transfer: 'Bank Transfer',
  paystack: 'Paystack',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
  expired: 'Expired',
}

const DONE = ['completed', 'cancelled', 'no_show', 'expired']

// ── Walk-in panel types ───────────────────────────────────────────────────────

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
type TestMode = 'individual' | 'wellness'

const WALK_IN_PAY: { value: WalkInPay; label: string; desc: string }[] = [
  { value: 'pos', label: 'POS / Card', desc: 'Debit or credit card via POS terminal' },
  { value: 'direct_transfer', label: 'Bank Transfer', desc: 'Direct bank transfer to account' },
]

// ── Walk-in inline panel ──────────────────────────────────────────────────────

function WalkInPanel ({
  labTests,
  onDone,
}: {
  labTests: LabTest[]
  onDone: () => void
}) {
  const [step,         setStep]         = useState<WalkInStep>('patient')
  const [testMode,     setTestMode]     = useState<TestMode>('individual')
  const [allPackages,  setAllPackages]  = useState<WellnessPkg[]>([])
  const [selectedPkg,  setSelectedPkg]  = useState<WellnessPkg | null>(null)
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState<string[]>([])
  const [patient,      setPatient]      = useState({ name: '', phone: '', email: '', notes: '' })
  const [payMethod,    setPayMethod]    = useState<WalkInPay>('pos')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [pendingConfirm, setPendingConfirm] = useState<{
    name: string; email: string | null; phone: string
  } | null>(null)
  const [result,       setResult]       = useState<{
    bookingRef: string
    patientName: string
    phone: string
    tests: string[]
    total: number
    payLabel: string
  } | null>(null)

  useEffect(() => {
    api.get('/diagnostics/labs/wellness-packages')
      .then(r => setAllPackages(r.data.data ?? []))
      .catch(() => {})
  }, [])

  function testPrice (t: LabTest) { return t.walkInPrice ?? t.estimatedPrice ?? 0 }

  const filtered = labTests.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedTests = labTests.filter(t => selected.includes(t.name))

  const total = testMode === 'wellness' && selectedPkg
    ? selectedPkg.walkInPrice
    : selectedTests.reduce((sum, t) => sum + testPrice(t), 0)

  const displayTests = testMode === 'wellness' && selectedPkg
    ? selectedPkg.includedTests
    : selected

  const canProceedFromTests = testMode === 'wellness' ? !!selectedPkg : selected.length > 0

  function toggle (name: string) {
    setSelected(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name])
  }

  async function submit (confirmExisting = false, forceNew = false) {
    setSubmitting(true)
    setError('')
    setPendingConfirm(null)
    try {
      const body: Record<string, unknown> = {
        patientName:  patient.name,
        patientPhone: patient.phone,
        patientEmail: patient.email || undefined,
        paymentMethod: payMethod,
        totalAmount:  total,
        notes:        patient.notes || undefined,
        ...(confirmExisting ? { confirmExisting: true } : {}),
        ...(forceNew ? { forceNew: true } : {}),
      }
      if (testMode === 'wellness' && selectedPkg) {
        body.wellnessPackageId = selectedPkg._id
      } else {
        body.tests = selected
      }
      const res = await api.post('/diagnostics/labs/walk-in', body)
      const d = res.data.data

      if (d.requiresConfirmation) {
        setPendingConfirm(d.existingPatient)
        return
      }

      setResult({
        bookingRef:  d.bookingRef,
        patientName: d.patient.name,
        phone:       d.patient.phone,
        tests:       displayTests,
        total,
        payLabel: WALK_IN_PAY.find(m => m.value === payMethod)?.label ?? payMethod,
      })
      setStep('done')
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Failed to create request.'
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
    setPendingConfirm(null)
  }

  const STEPS: WalkInStep[] = ['patient', 'tests', 'payment', 'done']
  const STEP_LABELS: Record<WalkInStep, string> = {
    patient: 'Patient', tests: 'Tests', payment: 'Payment', done: 'Done',
  }

  return (
    <div className={s.wiWrap}>
      {/* Stepper */}
      <div className={s.wiStepper}>
        {STEPS.map((st, i) => {
          const isDone   = STEPS.indexOf(st) < STEPS.indexOf(step)
          const isActive = st === step
          return (
            <div key={st} className={s.wiStepItem}>
              <div className={`${s.wiStepBubble} ${isActive ? s.wiStepActive : ''} ${isDone ? s.wiStepDone : ''}`}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`${s.wiStepLabel} ${isActive ? s.wiStepLabelActive : ''}`}>{STEP_LABELS[st]}</span>
              {i < STEPS.length - 1 && <div className={`${s.wiStepLine} ${isDone ? s.wiStepLineDone : ''}`} />}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Patient ── */}
      {step === 'patient' && (
        <div className={s.wiCard}>
          <h3 className={s.wiTitle}>Patient Information</h3>
          <p className={s.wiHint}>Enter the walk-in patient&apos;s details. If they have an existing account it will be linked automatically.</p>
          <div className={s.wiGrid}>
            <label className={s.wiField}>
              <span className={s.wiLabel}>Full Name <em className={s.wiReq}>*</em></span>
              <input className={s.wiInput} placeholder='e.g. John Adeyemi' value={patient.name}
                onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} autoFocus />
            </label>
            <label className={s.wiField}>
              <span className={s.wiLabel}>Phone <em className={s.wiReq}>*</em></span>
              <input className={s.wiInput} placeholder='e.g. 08012345678' value={patient.phone}
                onChange={e => setPatient(p => ({ ...p, phone: e.target.value }))} />
            </label>
            <label className={s.wiField}>
              <span className={s.wiLabel}>Email <small className={s.wiOpt}>(optional)</small></span>
              <input className={s.wiInput} type='email' placeholder='patient@example.com' value={patient.email}
                onChange={e => setPatient(p => ({ ...p, email: e.target.value }))} />
            </label>
            <label className={`${s.wiField} ${s.wiFieldFull}`}>
              <span className={s.wiLabel}>Clinical Notes <small className={s.wiOpt}>(optional)</small></span>
              <textarea className={`${s.wiInput} ${s.wiTextarea}`} placeholder='Referral info, symptoms…' value={patient.notes}
                onChange={e => setPatient(p => ({ ...p, notes: e.target.value }))} />
            </label>
          </div>
          <div className={s.wiActions}>
            <button className={s.wiBtn} disabled={!patient.name.trim() || !patient.phone.trim()}
              onClick={() => setStep('tests')}>
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
              <p className={s.wiHint}>Choose individual tests or a wellness package.</p>
            </div>
            {canProceedFromTests && (
              <div className={s.wiSelBadge}>
                {testMode === 'wellness' ? selectedPkg?.name : `${selected.length} · ₦${total.toLocaleString()}`}
              </div>
            )}
          </div>

          {/* Mode toggle */}
          <div className={s.wiModeToggle}>
            <button className={`${s.wiModeBtn} ${testMode === 'individual' ? s.wiModeBtnActive : ''}`}
              onClick={() => { setTestMode('individual'); setSelectedPkg(null) }}>
              Individual Tests
            </button>
            <button className={`${s.wiModeBtn} ${testMode === 'wellness' ? s.wiModeBtnActive : ''}`}
              onClick={() => { setTestMode('wellness'); setSelected([]) }}>
              Wellness Package
            </button>
          </div>

          {testMode === 'individual' ? (
            <>
              <div className={s.wiSearch}>
                <SearchIcon size={14} />
                <input className={s.wiSearchInput} placeholder='Search tests…' value={search}
                  onChange={e => setSearch(e.target.value)} autoFocus />
                {search && (
                  <button className={s.wiSearchClear} onClick={() => setSearch('')}><XIcon size={12} /></button>
                )}
              </div>
              {labTests.length === 0 ? (
                <p className={s.empty}>No tests configured for this lab yet.</p>
              ) : filtered.length === 0 ? (
                <p className={s.empty}>No tests found{search ? ` for &quot;${search}&quot;` : '.'}</p>
              ) : (
                <div className={s.wiTestsScroll}>
                  {filtered.map(t => {
                    const price = testPrice(t)
                    const sel   = selected.includes(t.name)
                    return (
                      <label key={t._id} className={`${s.wiTestRow} ${sel ? s.wiTestRowSel : ''}`}>
                        <span className={`${s.wiCheck} ${sel ? s.wiCheckOn : ''}`}>{sel && '✓'}</span>
                        <input type='checkbox' checked={sel} onChange={() => toggle(t.name)} style={{ display: 'none' }} />
                        <span className={s.wiTestName}>{t.name}</span>
                        {t.turnaroundHours > 0 && <span className={s.wiTurnaround}>{t.turnaroundHours}h</span>}
                        <span className={s.wiPrice}>{price > 0 ? `₦${price.toLocaleString()}` : '—'}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {selected.length > 0 && (
                <div className={s.wiSummaryBar}>
                  <span>{selected.length} test{selected.length !== 1 ? 's' : ''}</span>
                  <span className={s.wiSummaryTotal}>₦{total.toLocaleString()}</span>
                </div>
              )}
            </>
          ) : (
            allPackages.length === 0 ? (
              <p className={s.empty}>No active wellness packages available.</p>
            ) : (
              <div className={s.wiPkgGrid}>
                {allPackages.map(pkg => (
                  <div key={pkg._id}
                    className={`${s.wiPkgCard} ${selectedPkg?._id === pkg._id ? s.wiPkgCardSel : ''}`}
                    onClick={() => setSelectedPkg(pkg)}
                  >
                    <p className={s.wiPkgName}>{pkg.name}</p>
                    {pkg.gender !== 'all' && <p className={s.wiPkgGender}>{pkg.gender}</p>}
                    <p className={s.wiPkgPrice}>₦{pkg.walkInPrice.toLocaleString()}</p>
                    <p className={s.wiPkgTests}>{pkg.includedTests.length} tests included</p>
                  </div>
                ))}
              </div>
            )
          )}

          <div className={s.wiActions}>
            <button className={s.wiBtn2} onClick={() => setStep('patient')}>← Back</button>
            <button className={s.wiBtn} disabled={!canProceedFromTests} onClick={() => setStep('payment')}>
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
              <div className={s.wiAvatar}>{patient.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className={s.wiPatientName}>{patient.name}</p>
                <p className={s.wiPatientMeta}>{patient.phone}{patient.email ? ` · ${patient.email}` : ''}</p>
              </div>
            </div>
          </div>

          <div className={s.wiReviewBlock}>
            <p className={s.wiReviewTitle}>Tests ({displayTests.length})</p>
            {testMode === 'wellness' && selectedPkg && (
              <p className={s.wiPkgTag}>Package: {selectedPkg.name}</p>
            )}
            {displayTests.map(t => (
              <div key={t} className={s.wiReviewRow}>
                <span className={s.wiReviewName}>{t}</span>
              </div>
            ))}
            <div className={s.wiTotalRow}>
              <span>Total</span>
              <span className={s.wiTotalVal}>₦{total.toLocaleString()}</span>
            </div>
          </div>

          <div className={s.wiReviewBlock}>
            <p className={s.wiReviewTitle}>Payment Method</p>
            <div className={s.wiPayGrid}>
              {WALK_IN_PAY.map(m => (
                <label key={m.value} className={`${s.wiPayCard} ${payMethod === m.value ? s.wiPayCardActive : ''}`}>
                  <input type='radio' name='pm' value={m.value} checked={payMethod === m.value}
                    onChange={() => setPayMethod(m.value)} style={{ display: 'none' }} />
                  <span className={`${s.wiPayDot} ${payMethod === m.value ? s.wiPayDotOn : ''}`} />
                  <div>
                    <p className={s.wiPayLabel}>{m.label}</p>
                    <p className={s.wiPayDesc}>{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {pendingConfirm && (
            <div className={s.confirmBanner}>
              <p className={s.confirmBannerText}>
                A patient named <strong>{pendingConfirm.name}</strong>
                {pendingConfirm.phone ? ` (${pendingConfirm.phone})` : ''} already has an account.
                Is this the same person?
              </p>
              <div className={s.confirmBannerActions}>
                <button className={s.wiBtn} disabled={submitting} onClick={() => submit(true)}>
                  {submitting ? 'Registering…' : 'Yes, use existing →'}
                </button>
                <button className={s.wiBtn} disabled={submitting} onClick={() => submit(false, true)}
                  style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1.5px solid var(--border)' }}>
                  {submitting ? 'Registering…' : 'No, new patient →'}
                </button>
                <button className={s.wiBtn2} onClick={() => { setPendingConfirm(null); setStep('patient') }}>
                  No, change patient
                </button>
              </div>
            </div>
          )}
          {error && <p className={s.formError}>{error}</p>}
          {!pendingConfirm && (
            <div className={s.wiActions}>
              <button className={s.wiBtn2} onClick={() => { setError(''); setStep('tests') }}>← Back</button>
              <button className={s.wiBtn} disabled={submitting} onClick={() => submit()}>
                {submitting ? 'Registering…' : 'Confirm & Register →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && result && (
        <div className={s.wiCard}>
          <div className={s.wiSuccessBanner}>
            <span className={s.wiSuccessCheck}>✓</span>
            <div>
              <p className={s.wiSuccessTitle}>Registered Successfully</p>
              <p className={s.wiSuccessSub}>Walk-in request created and payment recorded.</p>
            </div>
          </div>

          <div className={s.wiTicket}>
            <div className={s.wiTicketHeader}>
              <div className={s.wiTicketHeaderLeft}>
                <span className={s.wiTicketHeaderLogo}>iBam Health</span>
                <span className={s.wiTicketHeaderSub}>Diagnostics Centre</span>
              </div>
              <div className={s.wiTicketHeaderRight}>
                <span className={s.wiTicketHeaderBadge}>OFFICIAL RECEIPT</span>
                <span className={s.wiTicketHeaderDate}>
                  {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className={s.wiTicketRefWrap}>
              <span className={s.wiTicketRefLabel}>Booking Reference</span>
              <span className={s.wiTicketRef}>{result.bookingRef}</span>
            </div>

            <div className={s.wiTicketGrid}>
              <div><p className={s.wiTLabel}>Patient Name</p><p className={s.wiTVal}>{result.patientName}</p></div>
              <div><p className={s.wiTLabel}>Phone</p><p className={s.wiTVal}>{result.phone}</p></div>
              <div><p className={s.wiTLabel}>Collection Type</p><p className={s.wiTVal}>Walk-in</p></div>
              <div><p className={s.wiTLabel}>Payment Method</p><p className={s.wiTVal}>{result.payLabel}</p></div>
            </div>

            <div className={s.wiTicketDiv} />

            <div>
              <p className={s.wiTLabel}>Tests Requested</p>
              <ul className={s.wiTicketList}>
                {result.tests.map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>

            <div className={s.wiTicketDiv} />

            <div className={s.wiTicketTotalRow}>
              <span>Amount Paid</span>
              <span className={s.wiTicketTotalVal}>₦{result.total.toLocaleString()}</span>
            </div>

            <p className={s.wiTicketFooter}>
              Present this slip at the sample collection point.<br />
              <strong>iBam Health</strong> · ibamhealth.com
            </p>
          </div>

          <div className={s.wiActions}>
            <button className={s.wiBtn2} onClick={() =>
              downloadReceipt({
                bookingRef:    result.bookingRef,
                tests:         result.tests,
                amount:        result.total,
                collectionType: 'walk_in',
                patientName:   result.patientName,
                paymentMethod: result.payLabel,
              })
            }>
              🖨 Print Slip
            </button>
            <button className={s.wiBtn} onClick={() => { reset(); onDone() }}>
              + Register Another Patient
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Assign scientist modal ────────────────────────────────────────────────────

function AssignScientistModal ({
  req,
  scientists,
  onClose,
  onDone,
}: {
  req: Request
  scientists: Scientist[]
  onClose: () => void
  onDone: () => void
}) {
  const [assigning, setAssigning] = useState<string | null>(null)
  const [err, setErr] = useState('')

  async function assign (scientistId: string) {
    setAssigning(scientistId)
    setErr('')
    try {
      await api.post(`/diagnostics/labs/requests/${req._id}/assign-scientist`, { scientistId })
      onDone()
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Assignment failed.'
      )
    }
    setAssigning(null)
  }

  return (
    <div className={s.overlay}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h3 className={s.modalTitle}>Assign to Scientist</h3>
          <button className={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
          {req.tests.slice(0, 2).join(', ')}
          {req.tests.length > 2 ? ` +${req.tests.length - 2} more` : ''} · {req.patient?.name ?? 'Patient'}
        </p>
        {err && <p className={s.formError}>{err}</p>}
        <div className={s.assignList}>
          {scientists.map(sci => (
            <button
              key={sci._id}
              className={`${s.assignItem} ${req.assignedScientist?._id === sci._id ? s.assignItemActive : ''}`}
              onClick={() => assign(sci._id)}
              disabled={assigning !== null}
            >
              <span className={s.assignAvatar}>{sci.name[0]}</span>
              <div className={s.assignInfo}>
                <span className={s.assignName}>{sci.name}</span>
                <span className={s.assignEmail}>{sci.email}</span>
              </div>
              {req.assignedScientist?._id === sci._id && <span className={s.assignedTag}>Current</span>}
              {assigning === sci._id && <span className={s.assignedTag}>…</span>}
            </button>
          ))}
        </div>
        <div className={s.modalActions}>
          <button className={s.cancelBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Scientist request card ────────────────────────────────────────────────────

function ScientistCard ({ req, onRefresh }: { req: Request; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadNote, setUploadNote] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const done = DONE.includes(req.status)

  async function updateStatus (status: string) {
    setUpdating(true)
    try {
      await api.put(`/diagnostics/scientist/requests/${req._id}/status`, { status })
      onRefresh()
    } catch {}
    setUpdating(false)
  }

  async function uploadResult () {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('result', file)
      if (uploadNote) form.append('notes', uploadNote)
      await api.post(`/diagnostics/${req._id}/upload-result`, form)
      onRefresh()
    } catch {}
    setUploading(false)
  }

  return (
    <div className={`${s.card} ${done ? s.cardDone : ''}`}>
      <div className={s.cardHead} onClick={() => setOpen(v => !v)}>
        <div className={s.cardLeft}>
          <span className={`${s.statusBadge} ${s[`badge_${req.status}`] ?? s.badge_pending}`}>
            {STATUS_LABEL[req.status] ?? req.status}
          </span>
          <div>
            <p className={s.patientName}>{req.patient?.name ?? 'Patient'}</p>
            <p className={s.testList}>
              {req.tests.slice(0, 2).join(', ')}
              {req.tests.length > 2 ? ` +${req.tests.length - 2} more` : ''}
            </p>
          </div>
        </div>
        <div className={s.cardRight}>
          <span className={s.collection}>{req.collectionType === 'home_visit' ? 'Home Visit' : 'Walk-in'}</span>
          <span className={s.date}>
            {new Date(req.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {open && (
        <div className={s.cardBody}>
          <div className={s.allTests}>
            <p className={s.sectionLabel}>Tests</p>
            {req.tests.map((t, i) => <span key={i} className={s.testTag}>{t}</span>)}
          </div>

          {req.patient?.phone && <p className={s.info}>Phone: {req.patient.phone}</p>}
          {req.notes && <p className={s.infoNote}>Notes: {req.notes}</p>}

          {req.result?.fileUrl && (
            <div className={s.resultBox}>
              <p className={s.sectionLabel}>Result Uploaded</p>
              {req.result.notes && <p className={s.infoNote}>{req.result.notes}</p>}
              <a href={req.result.signedUrl ?? req.result.fileUrl} target='_blank' rel='noopener noreferrer' className={s.resultLink}>
                Download Result ↗
              </a>
            </div>
          )}

          {!done && (
            <div className={s.actions}>
              <div className={s.actionBtns}>
                {req.status === 'assigned' && req.collectionType === 'home_visit' && (
                  <button className={s.actionBtn} disabled={updating} onClick={() => updateStatus('sample_collected')}>
                    Mark Sample Collected
                  </button>
                )}
                {(req.status === 'sample_collected' || (req.status === 'assigned' && req.collectionType === 'walk_in')) && (
                  <button className={s.actionBtn} disabled={updating} onClick={() => updateStatus('processing')}>
                    Mark Processing
                  </button>
                )}
              </div>
              <div className={s.uploadSection}>
                <p className={s.sectionLabel}>Upload Result (PDF / image)</p>
                <div className={s.uploadRow}>
                  <input type='file' accept='.pdf,image/*' ref={fileRef} className={s.fileInput} />
                  <textarea
                    className={s.notesInput}
                    rows={2}
                    placeholder='Result notes (optional)…'
                    value={uploadNote}
                    onChange={e => setUploadNote(e.target.value)}
                  />
                  <button className={s.uploadBtn} disabled={uploading} onClick={uploadResult}>
                    {uploading ? 'Uploading…' : 'Upload & Complete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Scientist portal ──────────────────────────────────────────────────────────

function ScientistPortal ({ labName }: { labName: string }) {
  const [historyMode, setHistoryMode] = useState(false)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/diagnostics/scientist/requests${historyMode ? '?history=true' : ''}`)
      setRequests(r.data.data?.requests ?? [])
    } catch {}
    setLoading(false)
  }, [historyMode])

  useEffect(() => { load() }, [load])

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>My Assigned Tests</h1>
          {labName && <p className={s.subtitle}>{labName}</p>}
        </div>
        <button className={s.refreshBtn} onClick={load}>Refresh</button>
      </div>

      <div className={s.tabs}>
        <button
          className={`${s.tab} ${!historyMode ? s.tabActive : ''}`}
          onClick={() => setHistoryMode(false)}
        >
          Active
          {!historyMode && requests.length > 0 && <span className={s.tabCount}>{requests.length}</span>}
        </button>
        <button
          className={`${s.tab} ${historyMode ? s.tabActive : ''}`}
          onClick={() => setHistoryMode(true)}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className={s.empty}>Loading tests…</div>
      ) : requests.length === 0 ? (
        <div className={s.empty}>{historyMode ? 'No completed tests yet.' : 'No active tests assigned to you.'}</div>
      ) : (
        <div className={s.list}>
          {requests.map(req => <ScientistCard key={req._id} req={req} onRefresh={load} />)}
        </div>
      )}
    </div>
  )
}

// ── My Team tab ───────────────────────────────────────────────────────────────

function TeamTab () {
  const [scientists, setScientists] = useState<Scientist[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function loadTeam () {
    setLoading(true)
    api.get('/diagnostics/labs/scientists')
      .then(r => setScientists(r.data.data?.scientists ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTeam() }, [])

  async function addScientist () {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setErr('Name, email, and password are required.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      await api.post('/diagnostics/labs/scientists', form)
      setForm({ name: '', email: '', phone: '', password: '' })
      setShowForm(false)
      loadTeam()
    } catch (e: unknown) {
      setErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Failed to create account.'
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
          {err && <p className={s.formError}>{err}</p>}
          <div className={s.sciFormGrid}>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Full Name *</span>
              <input className={s.sciFormInput} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder='Dr. Jane Okafor' />
            </label>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Email *</span>
              <input className={s.sciFormInput} type='email' value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder='jane@lab.com' />
            </label>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Phone</span>
              <input className={s.sciFormInput} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder='08012345678' />
            </label>
            <label className={s.sciFormField}>
              <span className={s.sciFormLabel}>Temporary Password *</span>
              <input className={s.sciFormInput} type='password' value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder='Min 8 characters' />
            </label>
          </div>
          <button className={s.wiBtn} disabled={saving} onClick={addScientist}>
            {saving ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      )}

      {loading ? (
        <div className={s.empty}>Loading team…</div>
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
                Joined {new Date(sci.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Single request card ───────────────────────────────────────────────────────

function RequestCard ({
  req,
  onUpdate,
  onUpload,
  updating,
  uploading,
  uploadNotes,
  setUploadNotes,
  fileRefs,
  scientists,
  onRefresh,
}: {
  req: Request
  onUpdate: (id: string, status: string) => void
  onUpload: (id: string) => void
  updating: string | null
  uploading: string | null
  uploadNotes: Record<string, string>
  setUploadNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>
  fileRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  scientists?: Scientist[]
  onRefresh?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const done = DONE.includes(req.status)
  const busy = updating === req._id

  return (
    <>
    <div className={`${s.card} ${done ? s.cardDone : ''}`}>
      <div className={s.cardHead} onClick={() => setOpen(v => !v)}>
        <div className={s.cardLeft}>
          <span className={`${s.statusBadge} ${s[`badge_${req.status}`] ?? s.badge_pending}`}>
            {STATUS_LABEL[req.status] ?? req.status}
          </span>
          <div>
            <p className={s.patientName}>{req.patient?.name ?? 'Patient'}</p>
            <p className={s.testList}>
              {req.tests.slice(0, 2).join(', ')}
              {req.tests.length > 2 ? ` +${req.tests.length - 2} more` : ''}
            </p>
          </div>
        </div>
        <div className={s.cardRight}>
          <span className={s.collection}>{req.collectionType === 'home_visit' ? 'Home Visit' : 'Walk-in'}</span>
          <span className={s.date}>
            {new Date(req.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {open && (
        <div className={s.cardBody}>
          <div className={s.allTests}>
            <p className={s.sectionLabel}>Tests</p>
            {req.tests.map((t, i) => <span key={i} className={s.testTag}>{t}</span>)}
          </div>

          {req.patient?.phone && <p className={s.info}>Phone: {req.patient.phone}</p>}
          {req.patient?.email && !req.patient.email.includes('@ibamhealth.guest') && (
            <p className={s.info}>Email: {req.patient.email}</p>
          )}
          {req.pickupLocation?.address && (
            <p className={s.info}>📍 Address: {req.pickupLocation.address}</p>
          )}
          {req.preferredDate && (
            <p className={s.info}>
              🗓 Preferred:{' '}
              {new Date(req.preferredDate).toLocaleDateString('en-NG', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              })}
              {req.preferredTime && ` at ${req.preferredTime}`}
            </p>
          )}
          {req.notes && <p className={s.infoNote}>Notes: {req.notes}</p>}
          {req.externalReferralUrl && (
            <a href={req.externalReferralUrl} target="_blank" rel="noopener noreferrer" className={s.resultLink}>
              📄 View Doctor Referral / Prescription ↗
            </a>
          )}

          {req.paymentRef && (
            <div className={s.receiptBox}>
              <p className={s.sectionLabel}>Payment Receipt</p>
              <div className={s.receiptRow}>
                <span>Amount</span>
                <strong>₦{(req.totalAmount != null && req.totalAmount > 0 ? req.totalAmount : Math.round((req.paymentRef?.amount ?? 0) / 100)).toLocaleString()}</strong>
              </div>
              <div className={s.receiptRow}>
                <span>Method</span>
                <strong>{METHOD_LABEL[req.paymentRef.method] ?? req.paymentRef.method}</strong>
              </div>
              <div className={s.receiptRow}>
                <span>Status</span>
                <strong className={req.paymentRef.status === 'success' ? s.paid : s.pending}>
                  {req.paymentRef.status}
                </strong>
              </div>
              {req.paymentRef.reference && (
                <div className={s.receiptRow}>
                  <span>Ref</span>
                  <code className={s.refCode}>{req.paymentRef.reference.slice(-12)}</code>
                </div>
              )}
              {req.paymentRef.transferReference && (
                <div className={s.receiptRow}>
                  <span>Transfer Ref</span>
                  <code className={s.refCode}>{req.paymentRef.transferReference}</code>
                </div>
              )}
            </div>
          )}

          {req.result?.fileUrl && (
            <div className={s.resultBox}>
              <p className={s.sectionLabel}>Lab Result</p>
              {req.result.notes && <p className={s.infoNote}>{req.result.notes}</p>}
              <a href={req.result.signedUrl ?? req.result.fileUrl} target="_blank" rel="noopener noreferrer" className={s.resultLink}>
                View / Download Result ↗
              </a>
            </div>
          )}

          {!done && (
            <div className={s.actions}>
              {req.status === 'assigned' && req.collectionType === 'home_visit' && (
                <button className={s.actionBtn} disabled={busy} onClick={() => onUpdate(req._id, 'sample_collected')}>
                  Mark Sample Collected
                </button>
              )}
              {(req.status === 'sample_collected' || (req.status === 'assigned' && req.collectionType === 'walk_in')) && (
                <button className={s.actionBtn} disabled={busy} onClick={() => onUpdate(req._id, 'processing')}>
                  Mark Processing
                </button>
              )}
              {req.status === 'processing' && (
                <button className={s.actionBtn} disabled={busy} onClick={() => onUpdate(req._id, 'completed')}>
                  Mark Completed
                </button>
              )}
              {['assigned', 'sample_collected'].includes(req.status) && (
                <button className={s.noShowBtn} disabled={busy} onClick={() => onUpdate(req._id, 'no_show')}>
                  No Show
                </button>
              )}

              {scientists && scientists.length > 0 && (
                <button className={s.assignBtn} onClick={() => setShowAssign(true)}>
                  {req.assignedScientist ? `↗ ${req.assignedScientist.name}` : 'Assign Scientist'}
                </button>
              )}

              <div className={s.uploadSection}>
                <p className={s.sectionLabel}>Upload Result (PDF / image)</p>
                <div className={s.uploadRow}>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    ref={el => { fileRefs.current[req._id] = el }}
                    className={s.fileInput}
                  />
                  <textarea
                    className={s.notesInput}
                    rows={2}
                    placeholder="Result notes (optional)…"
                    value={uploadNotes[req._id] ?? ''}
                    onChange={e => setUploadNotes(prev => ({ ...prev, [req._id]: e.target.value }))}
                  />
                  <button className={s.uploadBtn} disabled={uploading === req._id} onClick={() => onUpload(req._id)}>
                    {uploading === req._id ? 'Uploading…' : 'Upload & Complete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    {showAssign && scientists && scientists.length > 0 && (
      <AssignScientistModal
        req={req}
        scientists={scientists}
        onClose={() => setShowAssign(false)}
        onDone={() => { setShowAssign(false); if (onRefresh) onRefresh() }}
      />
    )}
    </>
  )
}

// ── Claimable request card ─────────────────────────────────────────────────────

function ClaimCard ({ req, claiming, onClaim }: { req: Request; claiming: string | null; onClaim: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={s.card}>
      <div className={s.cardHead} onClick={() => setOpen(v => !v)}>
        <div className={s.cardLeft}>
          <span className={`${s.statusBadge} ${s.badge_available}`}>Unclaimed</span>
          <div>
            <p className={s.patientName}>{req.patient?.name ?? 'Patient'}</p>
            <p className={s.testList}>
              {req.tests.slice(0, 2).join(', ')}
              {req.tests.length > 2 ? ` +${req.tests.length - 2} more` : ''}
            </p>
          </div>
        </div>
        <div className={s.cardRight}>
          <span className={s.collection}>{req.collectionType === 'home_visit' ? 'Home Visit' : 'Walk-in'}</span>
          <span className={s.date}>
            {new Date(req.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
          </span>
          <button
            className={s.claimBtn}
            disabled={claiming === req._id}
            onClick={e => { e.stopPropagation(); onClaim(req._id) }}
          >
            {claiming === req._id ? '…' : 'Claim'}
          </button>
        </div>
      </div>
      {open && (
        <div className={s.cardBody}>
          <div className={s.allTests}>
            <p className={s.sectionLabel}>Tests Requested</p>
            {req.tests.map((t, i) => <span key={i} className={s.testTag}>{t}</span>)}
          </div>

          {req.patient?.phone && <p className={s.info}>Phone: {req.patient.phone}</p>}
          {req.patient?.email && !req.patient.email?.includes('@ibamhealth.guest') && (
            <p className={s.info}>Email: {req.patient.email}</p>
          )}
          {req.pickupLocation?.address && (
            <p className={s.info}>📍 Address: {req.pickupLocation.address}</p>
          )}
          {req.preferredDate && (
            <p className={s.info}>
              🗓 Preferred:{' '}
              {new Date(req.preferredDate).toLocaleDateString('en-NG', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              })}
              {req.preferredTime && ` at ${req.preferredTime}`}
            </p>
          )}
          {req.notes && <p className={s.infoNote}>Notes: {req.notes}</p>}
          {req.externalReferralUrl && (
            <a href={req.externalReferralUrl} target="_blank" rel="noopener noreferrer" className={s.resultLink}>
              📄 View Doctor Referral / Prescription ↗
            </a>
          )}

          {req.paymentRef && (
            <div className={s.receiptBox}>
              <p className={s.sectionLabel}>Payment</p>
              <div className={s.receiptRow}>
                <span>Amount</span>
                <strong>₦{(req.totalAmount != null && req.totalAmount > 0 ? req.totalAmount : Math.round((req.paymentRef?.amount ?? 0) / 100)).toLocaleString()}</strong>
              </div>
              <div className={s.receiptRow}>
                <span>Method</span>
                <strong>{METHOD_LABEL[req.paymentRef.method] ?? req.paymentRef.method}</strong>
              </div>
              <div className={s.receiptRow}>
                <span>Status</span>
                <strong className={req.paymentRef.status === 'success' ? s.paid : s.pending}>
                  {req.paymentRef.status}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Pagination helper ─────────────────────────────────────────────────────────

const PAGE_SIZE = 20

function paginateList<T>(arr: T[], page: number) {
  const start = (page - 1) * PAGE_SIZE
  return {
    items: arr.slice(start, start + PAGE_SIZE),
    totalPages: Math.max(1, Math.ceil(arr.length / PAGE_SIZE)),
  }
}

function PaginationBar ({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className={s.pagination}>
      <button className={s.pageBtn} disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span className={s.pageInfo}>Page {page} of {totalPages}</span>
      <button className={s.pageBtn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

type Tab = 'active' | 'available' | 'done' | 'walkin' | 'team'

export default function LabDashboard () {
  const [available,   setAvailable]   = useState<Request[]>([])
  const [mine,        setMine]        = useState<Request[]>([])
  const [loading,     setLoading]     = useState(true)
  const [labName,     setLabName]     = useState('')
  const [userRole,    setUserRole]    = useState<string | null>(null)
  const [claiming,    setClaiming]    = useState<string | null>(null)
  const [updating,    setUpdating]    = useState<string | null>(null)
  const [uploading,   setUploading]   = useState<string | null>(null)
  const [scientists,  setScientists]  = useState<Scientist[]>([])
  const [labTests,    setLabTests]    = useState<LabTest[]>([])
  const [tab,         setTab]         = useState<Tab>('active')
  const [uploadNotes, setUploadNotes] = useState<Record<string, string>>({})
  const [walkInMsg,   setWalkInMsg]   = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pages,       setPages]       = useState<Record<string, number>>({ active: 1, available: 1, done: 1 })
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Phase 1: detect user role from profile
  useEffect(() => {
    api.get('/diagnostics/labs/profile')
      .then(r => {
        setLabName(r.data.data?.lab?.name ?? '')
        setUserRole(r.data.data?.userRole ?? 'lab_partner')
      })
      .catch(() => setUserRole('lab_partner'))
  }, [])

  // Phase 2: load requests + scientists (non-scientists only)
  const load = useCallback(async () => {
    if (!userRole || userRole === 'lab_scientist') return
    setLoading(true)
    try {
      const [reqRes, sciRes] = await Promise.allSettled([
        api.get('/diagnostics/labs/requests'),
        api.get('/diagnostics/labs/scientists'),
      ])
      if (reqRes.status === 'fulfilled') {
        setAvailable(reqRes.value.data.data?.available ?? [])
        setMine(reqRes.value.data.data?.mine ?? [])
      }
      if (sciRes.status === 'fulfilled') {
        setScientists(sciRes.value.data.data?.scientists ?? [])
      }
    } catch {}
    setLoading(false)
  }, [userRole])

  useEffect(() => {
    if (userRole === null) return
    if (userRole === 'lab_scientist') { setLoading(false); return }
    load()
    api.get('/diagnostics/labs/test-catalog')
      .then(r => setLabTests(r.data.data?.tests ?? []))
      .catch(() => {})
  }, [load, userRole])

  async function claimRequest (id: string) {
    setClaiming(id)
    try {
      const r = await api.post(`/diagnostics/labs/requests/${id}/claim`)
      const updated = r.data.data?.request
      setAvailable(prev => prev.filter(req => req._id !== id))
      setMine(prev => [updated ?? available.find(req => req._id === id)!, ...prev].filter(Boolean))
      setTab('active')
    } catch {}
    setClaiming(null)
  }

  async function updateStatus (id: string, status: string) {
    setUpdating(id)
    try {
      const r = await api.put(`/diagnostics/labs/requests/${id}/status`, { status })
      const updated = r.data.data?.request
      if (updated) setMine(prev => prev.map(req => req._id === id ? { ...req, ...updated } : req))
    } catch {}
    setUpdating(null)
  }

  async function uploadResult (id: string) {
    const file = fileRefs.current[id]?.files?.[0]
    if (!file) return
    setUploading(id)
    try {
      const form = new FormData()
      form.append('result', file)
      if (uploadNotes[id]) form.append('notes', uploadNotes[id])
      await api.post(`/diagnostics/${id}/upload-result`, form)
      setMine(prev => prev.map(req => req._id === id ? { ...req, status: 'completed' } : req))
    } catch {}
    setUploading(null)
  }

  if (userRole === null) {
    return <div className={s.wrap}><div className={s.empty}>Loading portal…</div></div>
  }

  if (userRole === 'lab_scientist') {
    return <ScientistPortal labName={labName} />
  }

  const active       = mine.filter(r => !DONE.includes(r.status))
  const done         = mine.filter(r =>  DONE.includes(r.status))
  const todayWalkIns = mine.filter(r =>
    r.collectionType === 'walk_in' &&
    new Date(r.createdAt).toDateString() === new Date().toDateString()
  ).length

  function filterRequests (list: Request[]) {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(r =>
      r.patient?.name?.toLowerCase().includes(q) ||
      r.tests.some(t => t.toLowerCase().includes(q)) ||
      r.patient?.phone?.includes(q)
    )
  }

  function goPage (tabKey: string, p: number) {
    setPages(prev => ({ ...prev, [tabKey]: p }))
  }

  const filteredActive    = filterRequests(active)
  const filteredAvailable = filterRequests(available)
  const filteredDone      = filterRequests(done)

  const { items: activeItems,    totalPages: activeTotalPages    } = paginateList(filteredActive,    pages.active    ?? 1)
  const { items: availableItems, totalPages: availableTotalPages } = paginateList(filteredAvailable, pages.available ?? 1)
  const { items: doneItems,      totalPages: doneTotalPages      } = paginateList(filteredDone,      pages.done      ?? 1)

  const showSearch = ['active', 'available', 'done'].includes(tab)

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>{labName || 'Lab Dashboard'}</h1>
          {labName && <p className={s.subtitle}>Test Requests & Walk-in Management</p>}
        </div>
        <div className={s.headerActions}>
          <button className={s.refreshBtn} onClick={load}>Refresh</button>
        </div>
      </div>

      <div className={s.stats}>
        <div className={s.stat}><span className={s.statNum}>{active.length}</span><span>Active</span></div>
        <div className={s.stat}><span className={s.statNum}>{available.length}</span><span>Available</span></div>
        <div className={s.stat}><span className={s.statNum}>{todayWalkIns}</span><span>Walk-ins Today</span></div>
        <div className={s.stat}><span className={s.statNum}>{done.length}</span><span>Completed</span></div>
      </div>

      {walkInMsg && (
        <div className={s.successToast} onClick={() => setWalkInMsg('')}>
          {walkInMsg}
        </div>
      )}

      <div className={s.tabs}>
        {([['active', 'Active', active.length], ['available', 'Available', available.length], ['done', 'Done', done.length]] as const).map(([key, label, count]) => (
          <button
            key={key}
            className={`${s.tab} ${tab === key ? s.tabActive : ''}`}
            onClick={() => { setTab(key); setSearchQuery('') }}
          >
            {label}
            {count > 0 && <span className={s.tabCount}>{count}</span>}
          </button>
        ))}
        <button
          className={`${s.tab} ${tab === 'walkin' ? s.tabActive : ''} ${s.tabWalkin}`}
          onClick={() => setTab('walkin')}
        >
          + Walk-in
        </button>
        <button
          className={`${s.tab} ${tab === 'team' ? s.tabActive : ''}`}
          onClick={() => setTab('team')}
        >
          My Team
          {scientists.length > 0 && <span className={s.tabCount}>{scientists.length}</span>}
        </button>
      </div>

      {showSearch && (
        <div className={s.searchRow}>
          <div className={s.searchWrap}>
            <SearchIcon size={16} className={s.searchIcon} />
            <input
              className={s.searchInput}
              type='text'
              placeholder='Search by patient name, phone, or test…'
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPages(prev => ({ ...prev, [tab]: 1 })) }}
            />
            {searchQuery && (
              <button className={s.searchClear} onClick={() => { setSearchQuery(''); setPages(prev => ({ ...prev, [tab]: 1 })) }}>
                <XIcon size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'team' ? (
        <TeamTab />
      ) : tab === 'walkin' ? (
        <WalkInPanel
          labTests={labTests}
          onDone={() => { load(); setTab('active') }}
        />
      ) : loading ? (
        <div className={s.empty}>Loading requests…</div>
      ) : tab === 'available' ? (
        filteredAvailable.length === 0
          ? <div className={s.empty}>{searchQuery ? 'No results match your search.' : 'No unclaimed paid requests right now.'}</div>
          : <>
              <div className={s.list}>
                {availableItems.map(req => (
                  <ClaimCard key={req._id} req={req} claiming={claiming} onClaim={claimRequest} />
                ))}
              </div>
              <PaginationBar page={pages.available ?? 1} totalPages={availableTotalPages} onPage={p => goPage('available', p)} />
            </>
      ) : tab === 'active' ? (
        filteredActive.length === 0
          ? <div className={s.empty}>{searchQuery ? 'No results match your search.' : 'No active requests — claim available ones or register a walk-in.'}</div>
          : <>
              <div className={s.list}>
                {activeItems.map(req => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    onUpdate={updateStatus}
                    onUpload={uploadResult}
                    updating={updating}
                    uploading={uploading}
                    uploadNotes={uploadNotes}
                    setUploadNotes={setUploadNotes}
                    fileRefs={fileRefs}
                    scientists={scientists.length > 0 ? scientists : undefined}
                    onRefresh={load}
                  />
                ))}
              </div>
              <PaginationBar page={pages.active ?? 1} totalPages={activeTotalPages} onPage={p => goPage('active', p)} />
            </>
      ) : (
        filteredDone.length === 0
          ? <div className={s.empty}>{searchQuery ? 'No results match your search.' : 'No completed requests yet.'}</div>
          : <>
              <div className={s.list}>
                {doneItems.map(req => (
                  <RequestCard
                    key={req._id}
                    req={req}
                    onUpdate={updateStatus}
                    onUpload={uploadResult}
                    updating={updating}
                    uploading={uploading}
                    uploadNotes={uploadNotes}
                    setUploadNotes={setUploadNotes}
                    fileRefs={fileRefs}
                  />
                ))}
              </div>
              <PaginationBar page={pages.done ?? 1} totalPages={doneTotalPages} onPage={p => goPage('done', p)} />
            </>
      )}
    </div>
  )
}

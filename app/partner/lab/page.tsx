'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import { XIcon } from '@/components/icons'
import s from './page.module.scss'

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
}

const METHOD_LABEL: Record<string, string> = {
  walk_in_cash: 'Cash',
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

// ── Walk-in modal ─────────────────────────────────────────────────────────────

interface ExistingPatient { name: string; email: string | null; phone?: string }

function WalkInModal ({
  labTests,
  onClose,
  onSuccess,
}: {
  labTests: LabTest[]
  onClose: () => void
  onSuccess: (req: Request, isNew: boolean) => void
}) {
  const [patientName,   setPatientName]   = useState('')
  const [patientPhone,  setPatientPhone]  = useState('')
  const [patientEmail,  setPatientEmail]  = useState('')
  const [selected,      setSelected]      = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('walk_in_cash')
  const [notes,         setNotes]         = useState('')
  const [search,        setSearch]        = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const [confirmFor,    setConfirmFor]    = useState<ExistingPatient | null>(null)

  const filtered = labTests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  function toggleTest (name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name])
  }

  function testPrice (t: LabTest) { return t.walkInPrice ?? t.estimatedPrice ?? 0 }

  const autoTotal = labTests
    .filter(t => selected.includes(t.name))
    .reduce((sum, t) => sum + testPrice(t), 0)

  async function submit (confirmExisting = false) {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/diagnostics/labs/walk-in', {
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        tests: selected,
        paymentMethod,
        totalAmount: autoTotal,
        notes: notes || undefined,
        confirmExisting,
      })
      const data = res.data.data
      if (data?.requiresConfirmation) {
        setConfirmFor(data.existingPatient)
        setLoading(false)
        return
      }
      onSuccess(data?.request, data?.patient?.isNew ?? false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message ?? 'Failed to create walk-in.')
    }
    setLoading(false)
  }

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    if (!selected.length) { setError('Select at least one test.'); return }
    await submit(false)
  }

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <h3 className={s.modalTitle}>Register Walk-in Patient</h3>
          <button className={s.closeBtn} onClick={onClose}><XIcon size={16} /></button>
        </div>

        {confirmFor && (
          <div className={s.confirmOverlay}>
            <p className={s.confirmIcon}>👤</p>
            <h4 className={s.confirmTitle}>Patient already exists</h4>
            <p className={s.confirmBody}>
              <strong>{confirmFor.name}</strong>
              {confirmFor.email && <> ({confirmFor.email})</>} already has an iBam Health account.
              Do you want to register this test for them?
              They will be notified by email and in-app.
            </p>
            <div className={s.confirmActions}>
              <button className={s.cancelBtn} onClick={() => setConfirmFor(null)} disabled={loading}>
                No, change details
              </button>
              <button className={s.submitBtn} onClick={() => submit(true)} disabled={loading}>
                {loading ? 'Registering…' : 'Yes, register for them'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className={s.modalForm} style={confirmFor ? { display: 'none' } : undefined}>
          <div className={s.formRow}>
            <div className={s.field}>
              <label>Patient Name *</label>
              <input
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className={s.field}>
              <label>Phone *</label>
              <input
                required
                type="tel"
                value={patientPhone}
                onChange={e => setPatientPhone(e.target.value)}
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          <div className={s.field}>
            <label>Email (optional)</label>
            <input
              type="email"
              value={patientEmail}
              onChange={e => setPatientEmail(e.target.value)}
              placeholder="patient@email.com"
            />
          </div>

          <div className={s.field}>
            <label>
              Tests *
              {selected.length > 0 && (
                <span className={s.fieldHint}> — {selected.length} selected · ₦{autoTotal.toLocaleString()} total</span>
              )}
            </label>
            {labTests.length === 0 ? (
              <p className={s.fieldHint}>No tests configured for this lab yet.</p>
            ) : (
              <>
                <input
                  className={s.searchInput}
                  placeholder="Search tests…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className={s.testGrid}>
                  {filtered.length === 0 ? (
                    <p className={s.fieldHint}>No tests match &quot;{search}&quot;</p>
                  ) : filtered.map(t => (
                    <label
                      key={t._id}
                      className={`${s.testOption} ${selected.includes(t.name) ? s.testOptionActive : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(t.name)}
                        onChange={() => toggleTest(t.name)}
                      />
                      <span className={s.testOptionName}>{t.name}</span>
                      {testPrice(t) > 0 && (
                        <span className={s.testOptionPrice}>₦{testPrice(t).toLocaleString()}</span>
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={s.formRow}>
            <div className={s.field}>
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="walk_in_cash">Cash</option>
                <option value="pos">POS</option>
                <option value="direct_transfer">Bank Transfer</option>
              </select>
            </div>
            <div className={s.field}>
              <label>Total (₦) <span className={s.fieldHint}>auto-calculated</span></label>
              <input
                type="number"
                min="0"
                value={autoTotal}
                readOnly
                className={s.readonlyInput}
                tabIndex={-1}
              />
            </div>
          </div>

          <div className={s.field}>
            <label>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any relevant notes about the patient or tests…"
              rows={2}
            />
          </div>

          {error && <p className={s.formError}>{error}</p>}

          <div className={s.modalActions}>
            <button type="button" className={s.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={s.submitBtn} disabled={loading}>
              {loading ? 'Registering…' : `Register Walk-in${autoTotal > 0 ? ` · ₦${autoTotal.toLocaleString()}` : ''}`}
            </button>
          </div>
        </form>
      </div>
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
}: {
  req: Request
  onUpdate: (id: string, status: string) => void
  onUpload: (id: string) => void
  updating: string | null
  uploading: string | null
  uploadNotes: Record<string, string>
  setUploadNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>
  fileRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
}) {
  const [open, setOpen] = useState(false)
  const done = DONE.includes(req.status)
  const busy = updating === req._id

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
            <a
              href={req.externalReferralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.resultLink}
            >
              📄 View Doctor Referral / Prescription ↗
            </a>
          )}

          {/* Payment receipt */}
          {req.paymentRef && (
            <div className={s.receiptBox}>
              <p className={s.sectionLabel}>Payment Receipt</p>
              <div className={s.receiptRow}>
                <span>Amount</span>
                <strong>₦{(req.totalAmount > 0 ? req.totalAmount : Math.round((req.paymentRef.amount ?? 0) / 100)).toLocaleString()}</strong>
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

          {/* Lab result */}
          {req.result?.fileUrl && (
            <div className={s.resultBox}>
              <p className={s.sectionLabel}>Lab Result</p>
              {req.result.notes && <p className={s.infoNote}>{req.result.notes}</p>}
              <a
                href={req.result.signedUrl ?? req.result.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={s.resultLink}
              >
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
                  <button
                    className={s.uploadBtn}
                    disabled={uploading === req._id}
                    onClick={() => onUpload(req._id)}
                  >
                    {uploading === req._id ? 'Uploading…' : 'Upload & Complete'}
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
            <a
              href={req.externalReferralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={s.resultLink}
            >
              📄 View Doctor Referral / Prescription ↗
            </a>
          )}

          {req.paymentRef && (
            <div className={s.receiptBox}>
              <p className={s.sectionLabel}>Payment</p>
              <div className={s.receiptRow}>
                <span>Amount</span>
                <strong>₦{(req.totalAmount > 0 ? req.totalAmount : Math.round((req.paymentRef.amount ?? 0) / 100)).toLocaleString()}</strong>
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

// ── Main dashboard ─────────────────────────────────────────────────────────────

type Tab = 'active' | 'available' | 'done'

export default function LabDashboard () {
  const [available,    setAvailable]    = useState<Request[]>([])
  const [mine,         setMine]         = useState<Request[]>([])
  const [loading,      setLoading]      = useState(true)
  const [labName,      setLabName]      = useState('')
  const [claiming,     setClaiming]     = useState<string | null>(null)
  const [updating,     setUpdating]     = useState<string | null>(null)
  const [uploading,    setUploading]    = useState<string | null>(null)
  const [walkInOpen,   setWalkInOpen]   = useState(false)
  const [labTests,     setLabTests]     = useState<LabTest[]>([])
  const [tab,          setTab]          = useState<Tab>('active')
  const [uploadNotes,  setUploadNotes]  = useState<Record<string, string>>({})
  const [walkInMsg,    setWalkInMsg]    = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [reqRes, profRes] = await Promise.all([
        api.get('/diagnostics/labs/requests'),
        api.get('/diagnostics/labs/profile').catch(() => null),
      ])
      setAvailable(reqRes.data.data?.available ?? [])
      setMine(reqRes.data.data?.mine ?? [])
      const name = profRes?.data?.data?.lab?.name
      if (name) setLabName(name)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    api.get('/diagnostics/labs/test-catalog')
      .then(r => setLabTests(r.data.data?.tests ?? []))
      .catch(() => {})
  }, [load])

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

  const active    = mine.filter(r => !DONE.includes(r.status))
  const done      = mine.filter(r =>  DONE.includes(r.status))
  const todayWalkIns = mine.filter(r =>
    r.collectionType === 'walk_in' &&
    new Date(r.createdAt).toDateString() === new Date().toDateString()
  ).length

  return (
    <>
      <div className={s.wrap}>
        <div className={s.pageHeader}>
          <div>
            <h1 className={s.title}>{labName || 'Lab Dashboard'}</h1>
            {labName && <p className={s.subtitle}>Test Requests & Walk-in Management</p>}
          </div>
          <div className={s.headerActions}>
            <button className={s.refreshBtn} onClick={load}>Refresh</button>
            <button className={s.walkInBtn} onClick={() => setWalkInOpen(true)}>+ Register Walk-in</button>
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
              onClick={() => setTab(key)}
            >
              {label}
              {count > 0 && <span className={s.tabCount}>{count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={s.empty}>Loading requests…</div>
        ) : tab === 'available' ? (
          available.length === 0
            ? <div className={s.empty}>No unclaimed paid requests right now.</div>
            : <div className={s.list}>
                {available.map(req => (
                  <ClaimCard key={req._id} req={req} claiming={claiming} onClaim={claimRequest} />
                ))}
              </div>
        ) : tab === 'active' ? (
          active.length === 0
            ? <div className={s.empty}>No active requests — claim available ones or register a walk-in.</div>
            : <div className={s.list}>
                {active.map(req => (
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
        ) : (
          done.length === 0
            ? <div className={s.empty}>No completed requests yet.</div>
            : <div className={s.list}>
                {done.map(req => (
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
        )}
      </div>

      {walkInOpen && (
        <WalkInModal
          labTests={labTests}
          onClose={() => setWalkInOpen(false)}
          onSuccess={(newReq, isNew) => {
            setMine(prev => [newReq, ...prev])
            setWalkInOpen(false)
            setTab('active')
            setWalkInMsg(isNew
              ? 'Account created & test registered. A welcome email has been sent.'
              : 'Test registered. Patient has been notified by email and in-app.')
          }}
        />
      )}
    </>
  )
}

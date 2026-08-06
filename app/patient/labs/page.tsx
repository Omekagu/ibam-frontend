'use client'
import { useEffect, useState, useRef, FormEvent } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'
import { MapPinIcon } from '@/components/icons'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'

interface LabRequest {
  _id: string
  tests: string[]
  lab?: { name: string }
  collectionType: string
  status: string
  totalAmount: number
  adminApprovalStatus?: string
  createdAt: string
}
interface LabResult {
  _id: string
  request: string
  fileUrl: string
  notes?: string
  createdAt: string
}
interface LabTestCatalog {
  _id: string
  name: string
  category?: string
  estimatedPrice?: number
  turnaroundHours?: number
}
interface BankSettings {
  companyBankName: string
  companyAccountNumber: string
  companyAccountName: string
  directPaymentNote?: string
}

type Tab = 'order' | 'results'

export default function PatientLabs () {
  const modal = useStatusModal()
  const [tab, setTab] = useState<Tab>('order')
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [results, setResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [catalogTests, setCatalogTests] = useState<LabTestCatalog[]>([])
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null)

  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [collection, setCollection] = useState<'home_visit' | 'walk_in'>('walk_in')
  const [notes, setNotes] = useState('')
  const [referralFile, setReferralFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [homeAddr, setHomeAddr] = useState('')
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Bank transfer modal state
  const [showPayModal, setShowPayModal] = useState(false)
  const [transferRef, setTransferRef] = useState('')
  const [submittingRef, setSubmittingRef] = useState(false)

  const estimatedTotal = selectedTests.reduce((sum, name) => {
    const t = catalogTests.find(c => c.name === name)
    return sum + (t?.estimatedPrice ?? 0)
  }, 0)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://10.0.1.19:5000/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(body => { if (body?.data?.labTests?.length) setCatalogTests(body.data.labTests) })
      .catch(() => {})

    api.get('/payments/settings')
      .then(r => { const s = r.data.data?.settings; if (s?.directPaymentEnabled) setBankSettings(s) })
      .catch(() => {})

    api.get('/diagnostics/results/mine')
      .then(r => { setRequests(r.data.data?.requests ?? []); setResults(r.data.data?.results ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggleTest (test: string) {
    setSelectedTests(prev => prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test])
  }

  function useGPS () {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setHomeCoords(coords)
        setHomeAddr(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setGpsLoading(false)
      },
      () => { alert('Could not get your location.'); setGpsLoading(false) }
    )
  }

  function buildForm () {
    const form = new FormData()
    selectedTests.forEach(t => form.append('tests[]', t))
    form.append('collectionType', collection)
    if (notes) form.append('notes', notes)
    if (referralFile) form.append('referral', referralFile)
    if (collection === 'home_visit' && (homeAddr || homeCoords)) {
      form.append('pickupLocation', JSON.stringify({ address: homeAddr, ...homeCoords }))
    }
    return form
  }

  function resetForm () {
    setSelectedTests([])
    setNotes('')
    setReferralFile(null)
    setHomeAddr('')
    setHomeCoords(null)
  }

  async function submitRequest (e: FormEvent) {
    e.preventDefault()
    if (!selectedTests.length) {
      modal.show({ variant: 'declined', title: 'No Tests Selected', message: 'Please select at least one test before submitting.' })
      return
    }
    if (collection === 'home_visit' && !homeAddr) {
      modal.show({ variant: 'declined', title: 'Address Required', message: 'Please provide your home address for the home visit.' })
      return
    }

    // Home visit with known price + bank configured → show payment modal first
    if (collection === 'home_visit' && estimatedTotal > 0 && bankSettings) {
      setShowPayModal(true)
      return
    }

    // Walk-in OR home visit without price/bank → submit directly
    setSubmitting(true)
    try {
      const r = await api.post('/diagnostics/request', buildForm())
      setRequests(prev => [r.data.data?.request, ...prev])
      resetForm()
      if (collection === 'walk_in') {
        modal.show({
          variant: 'success',
          title: 'Request Submitted!',
          message: 'Visit the assigned lab and pay at the counter. The lab partner will confirm your payment and process your tests.',
          actionLabel: 'View My Requests',
          onAction: () => setTab('results')
        })
      } else {
        modal.show({
          variant: 'pending',
          title: 'Request Submitted!',
          message: 'Our team will assign a lab and send you payment details. Once confirmed, a home visit will be scheduled.',
          actionLabel: 'View My Requests',
          onAction: () => setTab('results')
        })
      }
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Submission Failed',
        message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not submit your request. Please try again.',
        actionLabel: 'Try Again'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Creates the request AND links the transfer reference in one go
  async function handleSubmitTransferRef () {
    if (!transferRef.trim()) return
    setSubmittingRef(true)
    try {
      const r = await api.post('/diagnostics/request', buildForm())
      const reqId: string = r.data.data?.request?._id
      setRequests(prev => [r.data.data?.request, ...prev])

      await api.post('/payments/submit-transfer', {
        type: 'lab_test',
        referenceId: reqId,
        amount: estimatedTotal * 100,
        transferReference: transferRef.trim(),
      })

      resetForm()
      setShowPayModal(false)
      setTransferRef('')
      modal.show({
        variant: 'pending',
        title: 'Request & Payment Submitted!',
        message: `Your ₦${estimatedTotal.toLocaleString()} transfer reference has been submitted. Admin will confirm and schedule your home visit.`,
        actionLabel: 'View My Requests',
        onAction: () => setTab('results')
      })
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Submission Failed',
        message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not complete submission. Please try again.'
      })
    } finally {
      setSubmittingRef(false)
    }
  }

  const resultMap = new Map(results.map(r => [r.request, r]))

  return (
    <>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'order' ? s.active : ''}`} onClick={() => setTab('order')}>
          Order Tests
        </button>
        <button className={`${s.tab} ${tab === 'results' ? s.active : ''}`} onClick={() => setTab('results')}>
          My Results{requests.length > 0 && <span className={s.count}>{requests.length}</span>}
        </button>
      </div>

      {tab === 'order' ? (
        <form className={s.orderForm} onSubmit={submitRequest}>
          <div className={s.infoNote}>
            <strong>How it works:</strong> Select the tests you need, choose how your sample will be collected, and submit. Our team will assign a certified lab and notify you with next steps.
          </div>

          <div className={s.section}>
            <h3>Select Tests <span className={s.selectedCount}>{selectedTests.length} selected</span></h3>
            {catalogTests.length === 0 ? (
              <Loader inline variant='dots' size='sm' label='Loading tests…' />
            ) : (
              <div className={s.testGrid}>
                {catalogTests.map(t => (
                  <label key={t._id} className={`${s.testItem} ${selectedTests.includes(t.name) ? s.checked : ''}`}>
                    <input type='checkbox' checked={selectedTests.includes(t.name)} onChange={() => toggleTest(t.name)} />
                    <div className={s.testContent}>
                      <span>{t.name}</span>
                      {t.estimatedPrice != null && (
                        <span style={{ fontSize: '0.7rem', opacity: 0.65 }}>~₦{t.estimatedPrice.toLocaleString('en-NG')}</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className={s.section}>
            <h3>Sample Collection</h3>
            <div className={s.collectionRow}>
              {(['walk_in', 'home_visit'] as const).map(c => (
                <label key={c} className={`${s.collectionOpt} ${collection === c ? s.picked : ''}`}>
                  <input type='radio' name='collection' value={c} checked={collection === c} onChange={() => setCollection(c)} />
                  <span>{c === 'walk_in' ? 'Walk-in Lab' : 'Home Visit'}</span>
                  <p>{c === 'walk_in' ? 'Visit the assigned lab yourself' : 'A lab professional visits you at home'}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Payment note — shown after collection type is chosen */}
          {collection === 'walk_in' && selectedTests.length > 0 && (
            <div className={s.paymentNote}>
              <span className={s.paymentNoteIcon}>💵</span>
              <p>You will pay at the lab counter on the day of your visit. The lab partner confirms your payment.</p>
            </div>
          )}
          {collection === 'home_visit' && estimatedTotal > 0 && bankSettings && (
            <div className={s.paymentNote} data-variant='transfer'>
              <span className={s.paymentNoteIcon}>🏦</span>
              <p>Estimated total: <strong>₦{estimatedTotal.toLocaleString()}</strong>. You will transfer to the platform bank account and enter your reference to confirm your request.</p>
            </div>
          )}

          {collection === 'home_visit' && (
            <div className={s.section}>
              <h3>Your Home Address</h3>
              <p className={s.referralNote}>Provide your address so we can schedule a home collection visit.</p>
              <div className={s.locationRow}>
                <input type='text' value={homeAddr} onChange={e => setHomeAddr(e.target.value)}
                  placeholder='Your full address or nearest landmark…' className={s.locationInput} required />
                <button type='button' className={s.gpsBtn} disabled={gpsLoading} onClick={useGPS}>
                  {gpsLoading ? '…' : <><MapPinIcon size={13} /> GPS</>}
                </button>
              </div>
              {homeCoords && <p className={s.coordsNote}>GPS: {homeCoords.lat.toFixed(5)}, {homeCoords.lng.toFixed(5)}</p>}
            </div>
          )}

          <div className={s.section}>
            <h3>Doctor Referral / Prescription <span className={s.optional}>optional</span></h3>
            <p className={s.referralNote}>Upload a referral note if you have one. Without an iBam doctor&apos;s referral, your request will be reviewed by admin first.</p>
            <div className={s.fileUploadArea} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type='file' accept='.pdf,image/*' style={{ display: 'none' }}
                onChange={e => setReferralFile(e.target.files?.[0] ?? null)} />
              {referralFile ? <p className={s.fileName}>{referralFile.name}</p> : <p>Click to upload referral (PDF or image)</p>}
            </div>
          </div>

          <div className={s.section}>
            <h3>Notes <span className={s.optional}>optional</span></h3>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder='Any relevant medical history or special instructions…' />
          </div>

          <button type='submit' className={s.submitBtn} disabled={submitting || !selectedTests.length}>
            {submitting ? <Loader inline size='sm' /> : (
              collection === 'home_visit' && estimatedTotal > 0 && bankSettings
                ? `Continue to Payment — ₦${estimatedTotal.toLocaleString()}`
                : `Submit Request (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`
            )}
          </button>
        </form>

      ) : loading ? (
        <Loader label='Loading results…' />
      ) : requests.length === 0 ? (
        <div className={s.empty}>No lab requests yet. Order your first test above.</div>
      ) : (
        <div className={s.resultsList}>
          {requests.map(req => {
            const result = resultMap.get(req._id)
            return (
              <div key={req._id} className={s.resultCard}>
                <div className={s.resultTop}>
                  <div className={s.resultInfo}>
                    <p>{req.tests.join(', ')}</p>
                    <span>{req.lab?.name ?? 'Lab being assigned'} · {req.collectionType.replace('_', ' ')}</span>
                    <span>{new Date(req.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {req.adminApprovalStatus === 'pending' && <span className={s.pendingAdmin}>Awaiting admin review</span>}
                    {req.totalAmount > 0 && <span className={s.amountTag}>₦{req.totalAmount.toLocaleString()}</span>}
                  </div>
                  <span className={`${s.statusBadge} ${s[req.status]}`}>{req.status.replace(/_/g, ' ')}</span>
                </div>

                {result ? (
                  <div className={s.resultBody}>
                    {result.notes && <p className={s.resultNotes}>{result.notes}</p>}
                    <a href={result.fileUrl} target='_blank' rel='noreferrer' className={s.downloadBtn}>Download Report</a>
                  </div>
                ) : (
                  req.status !== 'completed' && <p className={s.pendingNote}>Results will appear here once ready.</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Bank Transfer Modal ── */}
      {showPayModal && (
        <div className={s.payOverlay}>
          <div className={s.payPanel}>
            <div className={s.payPanelHeader}>
              <h2 className={s.payPanelTitle}>Pay for Home Visit</h2>
              <button className={s.payPanelClose} onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <p className={s.payPanelSub}>
              Transfer <strong>₦{estimatedTotal.toLocaleString()}</strong> to the platform bank account, then enter your reference number below. Your request will only be submitted after this step.
            </p>

            {bankSettings && (
              <div className={s.bankCard}>
                <BankRow label='Bank' value={bankSettings.companyBankName} />
                <BankRow label='Account Number' value={bankSettings.companyAccountNumber} copyable />
                <BankRow label='Account Name' value={bankSettings.companyAccountName} />
                {bankSettings.directPaymentNote && (
                  <p className={s.bankNote}>{bankSettings.directPaymentNote}</p>
                )}
              </div>
            )}

            <input
              className={s.refInput}
              placeholder='Enter your bank transfer reference…'
              value={transferRef}
              onChange={e => setTransferRef(e.target.value.toUpperCase())}
              autoComplete='off'
            />

            <button
              className={s.payConfirmBtn}
              disabled={!transferRef.trim() || submittingRef}
              onClick={handleSubmitTransferRef}
            >
              {submittingRef ? <Loader inline size='sm' /> : 'Submit Request & Reference'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function BankRow ({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  function copy () { navigator.clipboard?.writeText(value).catch(() => {}) }
  return (
    <div className={s.bankRow}>
      <span className={s.bankRowLabel}>{label}</span>
      <span className={s.bankRowVal}>
        {value || '—'}
        {copyable && value && (
          <button type='button' className={s.copyBtn} onClick={copy} title='Copy'>⧉</button>
        )}
      </span>
    </div>
  )
}

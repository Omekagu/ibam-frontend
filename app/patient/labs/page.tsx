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
  walkInPrice?: number
  homeVisitPrice?: number
  estimatedPrice?: number
  turnaroundHours?: number
}
interface WellnessPackageItem {
  _id: string
  name: string
  slug: string
  gender: 'male' | 'female' | 'all'
  targetAudience?: string
  benefits?: string
  includedTests: string[]
  walkInPrice: number
  homeVisitPrice: number
}
interface BankSettings {
  companyBankName: string
  companyAccountNumber: string
  companyAccountName: string
  directPaymentNote?: string
}

type Tab = 'order' | 'results' | 'packages'

export default function PatientLabs () {
  const modal = useStatusModal()
  const [tab, setTab] = useState<Tab>('order')
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [results, setResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [catalogTests, setCatalogTests] = useState<LabTestCatalog[]>([])
  const [wellnessPackages, setWellnessPackages] = useState<WellnessPackageItem[]>([])
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null)

  // Individual test order
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [collection, setCollection] = useState<'home_visit' | 'walk_in'>('walk_in')
  const [notes, setNotes] = useState('')
  const [referralFile, setReferralFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [homeAddr, setHomeAddr] = useState('')
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [transferRef, setTransferRef] = useState('')
  const [submittingRef, setSubmittingRef] = useState(false)

  // Wellness package booking
  const [selectedPackage, setSelectedPackage] = useState<WellnessPackageItem | null>(null)
  const [pkgCollection, setPkgCollection] = useState<'walk_in' | 'home_visit'>('walk_in')
  const [pkgAddress, setPkgAddress] = useState('')
  const [pkgCoords, setPkgCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [pkgGpsLoading, setPkgGpsLoading] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookingStep, setBookingStep] = useState<'details' | 'payment'>('details')
  const [bookingRef, setBookingRef] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null)

  const estimatedTotal = selectedTests.reduce((sum, name) => {
    const t = catalogTests.find(c => c.name === name)
    const price = collection === 'home_visit'
      ? (t?.homeVisitPrice ?? t?.estimatedPrice ?? 0)
      : (t?.walkInPrice ?? t?.estimatedPrice ?? 0)
    return sum + price
  }, 0)

  const pkgPrice = selectedPackage
    ? pkgCollection === 'walk_in' ? selectedPackage.walkInPrice : selectedPackage.homeVisitPrice
    : 0

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(body => {
        if (body?.data?.labTests?.length) setCatalogTests(body.data.labTests)
        if (body?.data?.wellnessPackages?.length) setWellnessPackages(body.data.wellnessPackages)
      })
      .catch(() => {})

    api.get('/payments/settings')
      .then(r => {
        const st = r.data.data?.settings
        if (st?.directPaymentEnabled) setBankSettings(st)
      })
      .catch(() => {})

    api.get('/diagnostics/results/mine')
      .then(r => {
        setRequests(r.data.data?.requests ?? [])
        setResults(r.data.data?.results ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Individual test order helpers ─────────────────────────────────────────

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
    if (collection === 'home_visit' && (homeAddr || homeCoords))
      form.append('pickupLocation', JSON.stringify({ address: homeAddr, ...homeCoords }))
    return form
  }

  function resetForm () {
    setSelectedTests([]); setNotes(''); setReferralFile(null); setHomeAddr(''); setHomeCoords(null)
  }

  async function submitRequest (e: FormEvent) {
    e.preventDefault()
    if (!selectedTests.length) {
      modal.show({ variant: 'declined', title: 'No Tests Selected', message: 'Please select at least one test before submitting.' }); return
    }
    if (collection === 'home_visit' && !homeAddr) {
      modal.show({ variant: 'declined', title: 'Address Required', message: 'Please provide your home address for the home visit.' }); return
    }
    if (collection === 'home_visit' && estimatedTotal > 0 && bankSettings) { setShowPayModal(true); return }

    setSubmitting(true)
    try {
      const r = await api.post('/diagnostics/request', buildForm())
      setRequests(prev => [r.data.data?.request, ...prev])
      resetForm()
      if (collection === 'walk_in') {
        modal.show({ variant: 'success', title: 'Request Submitted!', message: 'Your request has been submitted. Visit the assigned lab for sample collection — no payment at the counter.', actionLabel: 'View My Requests', onAction: () => setTab('results') })
      } else {
        modal.show({ variant: 'pending', title: 'Request Submitted!', message: 'Our team will assign a lab and send you payment details. Once confirmed, a home visit will be scheduled.', actionLabel: 'View My Requests', onAction: () => setTab('results') })
      }
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Submission Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not submit your request. Please try again.', actionLabel: 'Try Again' })
    } finally { setSubmitting(false) }
  }

  async function handleSubmitTransferRef () {
    if (!transferRef.trim()) return
    setSubmittingRef(true)
    try {
      const r = await api.post('/diagnostics/request', buildForm())
      const reqId: string = r.data.data?.request?._id
      setRequests(prev => [r.data.data?.request, ...prev])
      await api.post('/payments/submit-transfer', { type: 'lab_test', referenceId: reqId, amount: estimatedTotal * 100, transferReference: transferRef.trim() })
      resetForm(); setShowPayModal(false); setTransferRef('')
      modal.show({ variant: 'pending', title: 'Request & Payment Submitted!', message: `Your ₦${estimatedTotal.toLocaleString()} transfer reference has been submitted. Admin will confirm and schedule your home visit.`, actionLabel: 'View My Requests', onAction: () => setTab('results') })
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Submission Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not complete submission. Please try again.' })
    } finally { setSubmittingRef(false) }
  }

  // ── Wellness package booking helpers ──────────────────────────────────────

  function openBookModal (pkg: WellnessPackageItem) {
    setSelectedPackage(pkg); setPkgCollection('walk_in'); setPkgAddress(''); setPkgCoords(null)
    setBookingStep('details'); setBookingRef(''); setShowBookModal(true)
  }

  function usePkgGPS () {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return }
    setPkgGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPkgCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setPkgAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setPkgGpsLoading(false)
      },
      () => { alert('Could not get your location.'); setPkgGpsLoading(false) }
    )
  }

  async function handleBookPackage () {
    if (!selectedPackage) return
    if (pkgCollection === 'home_visit' && !pkgAddress) {
      modal.show({ variant: 'declined', title: 'Address Required', message: 'Please enter your home address for the visit.' }); return
    }
    // Home visit + bank: go to payment step first
    if (pkgCollection === 'home_visit' && pkgPrice > 0 && bankSettings && bookingStep === 'details') {
      setBookingStep('payment'); return
    }
    setBookingSubmitting(true)
    try {
      const payload: Record<string, unknown> = { collectionType: pkgCollection }
      if (pkgCollection === 'home_visit') { payload.address = pkgAddress; if (pkgCoords) { payload.lat = pkgCoords.lat; payload.lng = pkgCoords.lng } }
      if (bookingRef.trim()) payload.transferReference = bookingRef.trim()
      const r = await api.post(`/wellness-packages/${selectedPackage._id}/book`, payload)
      setRequests(prev => [r.data.data?.request, ...prev])
      setShowBookModal(false)
      if (pkgCollection === 'walk_in') {
        modal.show({ variant: 'success', title: 'Package Booked!', message: `Your "${selectedPackage.name}" package has been booked. Visit the assigned lab for sample collection.`, actionLabel: 'View My Requests', onAction: () => setTab('results') })
      } else {
        modal.show({ variant: 'pending', title: 'Package Booked!', message: `Your "${selectedPackage.name}" package is confirmed. Our team will contact you to schedule your home visit.`, actionLabel: 'View My Requests', onAction: () => setTab('results') })
      }
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Booking Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not book the package. Please try again.' })
    } finally { setBookingSubmitting(false) }
  }

  const resultMap = new Map(results.map(r => [r.request, r]))

  const GENDER_LABEL: Record<string, string> = { male: '♂ Men', female: '♀ Women', all: 'All' }

  return (
    <>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'order' ? s.active : ''}`} onClick={() => setTab('order')}>Order Tests</button>
        <button className={`${s.tab} ${tab === 'packages' ? s.active : ''}`} onClick={() => setTab('packages')}>
          Wellness Packages
          {wellnessPackages.length > 0 && <span className={s.count}>{wellnessPackages.length}</span>}
        </button>
        <button className={`${s.tab} ${tab === 'results' ? s.active : ''}`} onClick={() => setTab('results')}>
          My Results
          {requests.length > 0 && <span className={s.count}>{requests.length}</span>}
        </button>
      </div>

      {/* ── Order Tests Tab ── */}
      {tab === 'order' && (
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
                {catalogTests.map(t => {
                  const price = collection === 'home_visit' ? (t.homeVisitPrice ?? t.estimatedPrice) : (t.walkInPrice ?? t.estimatedPrice)
                  return (
                    <label key={t._id} className={`${s.testItem} ${selectedTests.includes(t.name) ? s.checked : ''}`}>
                      <input type='checkbox' checked={selectedTests.includes(t.name)} onChange={() => toggleTest(t.name)} />
                      <div className={s.testContent}>
                        <span>{t.name}</span>
                        {price != null && <span style={{ fontSize: '0.7rem', opacity: 0.65 }}>₦{price.toLocaleString('en-NG')}</span>}
                      </div>
                    </label>
                  )
                })}
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

          {collection === 'home_visit' && estimatedTotal > 0 && bankSettings && (
            <div className={s.paymentNote} data-variant='transfer'>
              <span className={s.paymentNoteIcon}>🏦</span>
              <p>Estimated total: <strong>₦{estimatedTotal.toLocaleString()}</strong>. Transfer to the company bank account (not a personal account) and enter your reference to confirm your request.</p>
            </div>
          )}

          {collection === 'home_visit' && (
            <div className={s.section}>
              <h3>Your Home Address</h3>
              <p className={s.referralNote}>Provide your address so we can schedule a home collection visit.</p>
              <div className={s.locationRow}>
                <input type='text' value={homeAddr} onChange={e => setHomeAddr(e.target.value)} placeholder='Your full address or nearest landmark…' className={s.locationInput} required />
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
              <input ref={fileRef} type='file' accept='.pdf,image/*' style={{ display: 'none' }} onChange={e => setReferralFile(e.target.files?.[0] ?? null)} />
              {referralFile ? <p className={s.fileName}>{referralFile.name}</p> : <p>Click to upload referral (PDF or image)</p>}
            </div>
          </div>

          <div className={s.section}>
            <h3>Notes <span className={s.optional}>optional</span></h3>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder='Any relevant medical history or special instructions…' />
          </div>

          <button type='submit' className={s.submitBtn} disabled={submitting || !selectedTests.length}>
            {submitting ? <Loader inline size='sm' /> : collection === 'home_visit' && estimatedTotal > 0 && bankSettings
              ? `Continue to Payment — ₦${estimatedTotal.toLocaleString()}`
              : `Submit Request (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`}
          </button>
        </form>
      )}

      {/* ── Wellness Packages Tab ── */}
      {tab === 'packages' && (
        <div className={s.pkgGrid}>
          {wellnessPackages.length === 0 ? (
            <div className={s.empty}>No wellness packages available right now.</div>
          ) : wellnessPackages.map(pkg => {
            const open = expandedPkg === pkg._id
            return (
              <div key={pkg._id} className={s.pkgCard}>
                <div className={s.pkgCardTop}>
                  <div className={s.pkgMeta}>
                    <span className={s.pkgGenderBadge}>{GENDER_LABEL[pkg.gender] ?? pkg.gender}</span>
                    <h3 className={s.pkgName}>{pkg.name}</h3>
                    {pkg.benefits && <p className={s.pkgBenefits}>{pkg.benefits}</p>}
                  </div>
                  <div className={s.pkgPrices}>
                    <div className={s.pkgPriceRow}>
                      <span className={s.pkgPriceLabel}>Walk-in</span>
                      <span className={s.pkgPriceVal}>₦{pkg.walkInPrice.toLocaleString('en-NG')}</span>
                    </div>
                    <div className={s.pkgPriceRow}>
                      <span className={s.pkgPriceLabel}>Home Visit</span>
                      <span className={s.pkgPriceVal}>₦{pkg.homeVisitPrice.toLocaleString('en-NG')}</span>
                    </div>
                  </div>
                </div>

                <button className={s.pkgTestsToggle} onClick={() => setExpandedPkg(open ? null : pkg._id)}>
                  {open ? '▲' : '▼'} {pkg.includedTests.length} included tests
                </button>

                {open && (
                  <ul className={s.pkgTestsList}>
                    {pkg.includedTests.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}

                <button className={s.pkgBookBtn} onClick={() => openBookModal(pkg)}>
                  Book This Package
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Results Tab ── */}
      {tab === 'results' && (
        loading ? <Loader label='Loading results…' /> : requests.length === 0 ? (
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
                  ) : (req.status !== 'completed' && <p className={s.pendingNote}>Results will appear here once ready.</p>)}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Bank Transfer Modal (individual tests) ── */}
      {showPayModal && (
        <div className={s.payOverlay}>
          <div className={s.payPanel}>
            <div className={s.payPanelHeader}>
              <h2 className={s.payPanelTitle}>Pay for Home Visit</h2>
              <button className={s.payPanelClose} onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <p className={s.payPanelSub}>Transfer <strong>₦{estimatedTotal.toLocaleString()}</strong> to the company bank account below, then enter your reference number. Do not transfer to any personal account.</p>
            {bankSettings && (
              <div className={s.bankCard}>
                <BankRow label='Bank' value={bankSettings.companyBankName} />
                <BankRow label='Account Number' value={bankSettings.companyAccountNumber} copyable />
                <BankRow label='Account Name' value={bankSettings.companyAccountName} />
                {bankSettings.directPaymentNote && <p className={s.bankNote}>{bankSettings.directPaymentNote}</p>}
              </div>
            )}
            <input className={s.refInput} placeholder='Enter your bank transfer reference…' value={transferRef} onChange={e => setTransferRef(e.target.value.toUpperCase())} autoComplete='off' />
            <button className={s.payConfirmBtn} disabled={!transferRef.trim() || submittingRef} onClick={handleSubmitTransferRef}>
              {submittingRef ? <Loader inline size='sm' /> : 'Submit Request & Reference'}
            </button>
          </div>
        </div>
      )}

      {/* ── Wellness Package Booking Modal ── */}
      {showBookModal && selectedPackage && (
        <div className={s.payOverlay}>
          <div className={s.payPanel} style={{ maxWidth: 480 }}>
            <div className={s.payPanelHeader}>
              <h2 className={s.payPanelTitle}>{bookingStep === 'payment' ? 'Pay for Package' : 'Book Package'}</h2>
              <button className={s.payPanelClose} onClick={() => setShowBookModal(false)}>✕</button>
            </div>

            {bookingStep === 'details' ? (
              <>
                <p className={s.payPanelSub}><strong>{selectedPackage.name}</strong> — {selectedPackage.includedTests.length} tests included.</p>

                {/* Collection type */}
                <div className={s.collectionRow}>
                  {(['walk_in', 'home_visit'] as const).map(c => (
                    <label key={c} className={`${s.collectionOpt} ${pkgCollection === c ? s.picked : ''}`}>
                      <input type='radio' name='pkgCollection' value={c} checked={pkgCollection === c} onChange={() => setPkgCollection(c)} />
                      <span>{c === 'walk_in' ? 'Walk-in Lab' : 'Home Visit'}</span>
                      <p>
                        {c === 'walk_in'
                          ? `₦${selectedPackage.walkInPrice.toLocaleString('en-NG')} — visit lab for collection`
                          : `₦${selectedPackage.homeVisitPrice.toLocaleString('en-NG')} — agent comes to you`}
                      </p>
                    </label>
                  ))}
                </div>

                {/* Address (home visit only) */}
                {pkgCollection === 'home_visit' && (
                  <>
                    <div className={s.locationRow}>
                      <input type='text' value={pkgAddress} onChange={e => setPkgAddress(e.target.value)} placeholder='Your full address or nearest landmark…' className={s.locationInput} />
                      <button type='button' className={s.gpsBtn} disabled={pkgGpsLoading} onClick={usePkgGPS}>
                        {pkgGpsLoading ? '…' : <><MapPinIcon size={13} /> GPS</>}
                      </button>
                    </div>
                    {pkgCoords && <p className={s.coordsNote}>GPS: {pkgCoords.lat.toFixed(5)}, {pkgCoords.lng.toFixed(5)}</p>}
                  </>
                )}

                <div className={s.pkgPriceHighlight}>
                  Total: <strong>₦{pkgPrice.toLocaleString('en-NG')}</strong>
                  {pkgCollection === 'walk_in' && <span> — visit lab for sample collection</span>}
                  {pkgCollection === 'home_visit' && bankSettings && <span> — transfer to company account</span>}
                </div>

                <button className={s.payConfirmBtn} disabled={bookingSubmitting || (pkgCollection === 'home_visit' && !pkgAddress)} onClick={handleBookPackage}>
                  {bookingSubmitting ? <Loader inline size='sm' /> : pkgCollection === 'home_visit' && pkgPrice > 0 && bankSettings ? 'Continue to Payment' : 'Confirm Booking'}
                </button>
              </>
            ) : (
              /* Payment step */
              <>
                <p className={s.payPanelSub}>Transfer <strong>₦{pkgPrice.toLocaleString()}</strong> to the company bank account below for your <strong>{selectedPackage.name}</strong> package. Do not transfer to any personal account. Enter your reference to confirm.</p>
                {bankSettings && (
                  <div className={s.bankCard}>
                    <BankRow label='Bank' value={bankSettings.companyBankName} />
                    <BankRow label='Account Number' value={bankSettings.companyAccountNumber} copyable />
                    <BankRow label='Account Name' value={bankSettings.companyAccountName} />
                    {bankSettings.directPaymentNote && <p className={s.bankNote}>{bankSettings.directPaymentNote}</p>}
                  </div>
                )}
                <input className={s.refInput} placeholder='Enter your bank transfer reference…' value={bookingRef} onChange={e => setBookingRef(e.target.value.toUpperCase())} autoComplete='off' />
                <button className={s.payConfirmBtn} disabled={!bookingRef.trim() || bookingSubmitting} onClick={handleBookPackage}>
                  {bookingSubmitting ? <Loader inline size='sm' /> : 'Confirm Booking & Reference'}
                </button>
                <button className={s.payPanelClose} style={{ alignSelf: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }} onClick={() => setBookingStep('details')}>← Back</button>
              </>
            )}
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
        {copyable && value && <button type='button' className={s.copyBtn} onClick={copy} title='Copy'>⧉</button>}
      </span>
    </div>
  )
}

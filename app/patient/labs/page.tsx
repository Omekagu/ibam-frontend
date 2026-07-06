'use client'
import { useEffect, useState, useRef, FormEvent } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface LabTest { name: string; price: number; turnaroundHours: number }
interface Lab {
  _id: string
  name: string
  address: string
  phone: string
  testsOffered: LabTest[]
  coverageAreas: string[]
}
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

const COMMON_TESTS = [
  'Full Blood Count (FBC)', 'Malaria Parasite', 'Hepatitis B Surface Antigen',
  'HIV Screening', 'Fasting Blood Sugar', 'Urine Analysis', 'Widal Test',
  'Electrolytes, Urea & Creatinine', 'Liver Function Tests', 'Lipid Profile',
]

type Tab = 'order' | 'results'

export default function PatientLabs () {
  const [tab,           setTab]           = useState<Tab>('order')
  const [labs,          setLabs]          = useState<Lab[]>([])
  const [requests,      setRequests]      = useState<LabRequest[]>([])
  const [results,       setResults]       = useState<LabResult[]>([])
  const [loading,       setLoading]       = useState(true)

  const [selectedLab,   setSelectedLab]   = useState('')
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [collection,    setCollection]    = useState<'home_visit' | 'walk_in'>('walk_in')
  const [notes,         setNotes]         = useState('')
  const [referralFile,  setReferralFile]  = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [walkInAddr,    setWalkInAddr]    = useState('')
  const [walkInCoords,  setWalkInCoords]  = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading,    setGpsLoading]    = useState(false)
  const [submitting,    setSubmitting]    = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [error,         setError]         = useState('')
  const [paying,        setPaying]        = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/diagnostics/labs'),
      api.get('/diagnostics/results/mine'),
    ]).then(([labsRes, resultsRes]) => {
      setLabs(labsRes.data.data?.labs ?? [])
      setRequests(resultsRes.data.data?.requests ?? [])
      setResults(resultsRes.data.data?.results ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const selectedLabData = labs.find(l => l._id === selectedLab)
  const catalogTests: string[] = selectedLabData?.testsOffered.map(t => t.name) ?? []
  const displayTests = selectedLab && catalogTests.length > 0 ? catalogTests : COMMON_TESTS
  const hasPricing = (selectedLabData?.testsOffered.length ?? 0) > 0

  function toggleTest (test: string) {
    setSelectedTests(prev => prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test])
  }

  function testPrice (name: string): number {
    return selectedLabData?.testsOffered.find(t => t.name === name)?.price ?? 0
  }

  const totalPrice = selectedTests.reduce((sum, t) => sum + testPrice(t), 0)

  function useGPS () {
    if (!navigator.geolocation) { alert('Geolocation not supported in this browser.'); return }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setWalkInCoords(coords)
        setWalkInAddr(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setGpsLoading(false)
      },
      () => { alert('Could not get your location.'); setGpsLoading(false) }
    )
  }

  async function submitRequest (e: FormEvent) {
    e.preventDefault()
    if (!selectedTests.length) { setError('Select at least one test.'); return }
    setSubmitting(true); setError('')
    try {
      const form = new FormData()
      selectedTests.forEach(t => form.append('tests[]', t))
      if (selectedLab) form.append('labId', selectedLab)
      form.append('collectionType', collection)
      if (notes) form.append('notes', notes)
      if (referralFile) form.append('referral', referralFile)
      if (collection === 'walk_in' && (walkInAddr || walkInCoords)) {
        form.append('pickupLocation', JSON.stringify({ address: walkInAddr, ...walkInCoords }))
      }

      const r = await api.post('/diagnostics/request', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setRequests(prev => [r.data.data?.request, ...prev])
      setSubmitted(true)
      setSelectedTests([]); setNotes(''); setReferralFile(null); setSelectedLab('')
      setTimeout(() => { setSubmitted(false); setTab('results') }, 2500)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submission failed. Try again.')
    }
    setSubmitting(false)
  }

  async function initiatePayment (req: LabRequest) {
    if (!req.totalAmount) { alert('No amount set.'); return }
    setPaying(req._id)
    try {
      const r = await api.post('/payments/initiate', { type: 'lab_test', serviceId: req._id, amount: req.totalAmount })
      const url: string | undefined = r.data.data?.authorizationUrl
      if (url) window.location.href = url
    } catch { alert('Could not initiate payment.'); setPaying(null) }
  }

  const resultMap = new Map(results.map(r => [r.request, r]))

  return (
    <>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'order' ? s.active : ''}`} onClick={() => setTab('order')}>Order Tests</button>
        <button className={`${s.tab} ${tab === 'results' ? s.active : ''}`} onClick={() => setTab('results')}>
          My Results {requests.length > 0 && <span className={s.count}>{requests.length}</span>}
        </button>
      </div>

      {tab === 'order' ? (
        <form className={s.orderForm} onSubmit={submitRequest}>
          {submitted && <div className={s.success}>Request submitted! Redirecting to results…</div>}

          <div className={s.section}>
            <h3>Select Lab (optional)</h3>
            <select value={selectedLab} onChange={e => { setSelectedLab(e.target.value); setSelectedTests([]) }}>
              <option value=''>No preference — assign automatically</option>
              {labs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.address}</option>)}
            </select>
            {hasPricing && <p className={s.priceNote}>Prices shown from this lab's catalog. Total updates as you select tests.</p>}
          </div>

          <div className={s.section}>
            <h3>
              Select Tests
              {hasPricing && totalPrice > 0 && <span className={s.totalBadge}>₦{totalPrice.toLocaleString()}</span>}
            </h3>
            <div className={s.testGrid}>
              {displayTests.map(t => {
                const price = testPrice(t)
                return (
                  <label key={t} className={`${s.testItem} ${selectedTests.includes(t) ? s.checked : ''}`}>
                    <input type='checkbox' checked={selectedTests.includes(t)} onChange={() => toggleTest(t)} />
                    <div className={s.testContent}>
                      <span>{t}</span>
                      {hasPricing && price > 0 && <em>₦{price.toLocaleString()}</em>}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className={s.section}>
            <h3>Sample Collection</h3>
            <div className={s.collectionRow}>
              {(['walk_in', 'home_visit'] as const).map(c => (
                <label key={c} className={`${s.collectionOpt} ${collection === c ? s.picked : ''}`}>
                  <input type='radio' name='collection' value={c} checked={collection === c} onChange={() => setCollection(c)} />
                  <span>{c === 'walk_in' ? 'Walk-in Lab' : 'Home Visit'}</span>
                  <p>{c === 'walk_in' ? 'Visit the lab yourself' : 'Sample collected at your location'}</p>
                </label>
              ))}
            </div>
          </div>

          {collection === 'walk_in' && (
            <div className={s.section}>
              <h3>Your Location <span className={s.optional}>optional</span></h3>
              <p className={s.referralNote}>Share your location so the lab can prepare and confirm ETA for sample pick-up.</p>
              <div className={s.locationRow}>
                <input type='text' value={walkInAddr} onChange={e => setWalkInAddr(e.target.value)}
                  placeholder='Your address or nearest landmark…' className={s.locationInput} />
                <button type='button' className={s.gpsBtn} disabled={gpsLoading} onClick={useGPS}>
                  {gpsLoading ? '…' : '📍 Use GPS'}
                </button>
              </div>
              {walkInCoords && <p className={s.coordsNote}>GPS: {walkInCoords.lat.toFixed(5)}, {walkInCoords.lng.toFixed(5)}</p>}
            </div>
          )}

          <div className={s.section}>
            <h3>Doctor Referral / Prescription (optional)</h3>
            <p className={s.referralNote}>Upload an external doctor's note if you have one. Without an iBam doctor's referral, your request will be reviewed by admin first.</p>
            <div className={s.fileUploadArea} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type='file' accept='.pdf,image/*' style={{ display: 'none' }}
                onChange={e => setReferralFile(e.target.files?.[0] ?? null)} />
              {referralFile ? <p className={s.fileName}>{referralFile.name}</p> : <p>Click to upload referral (PDF or image)</p>}
            </div>
          </div>

          <div className={s.section}>
            <h3>Notes (optional)</h3>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder='Any relevant medical history or special instructions…' />
          </div>

          {error && <p className={s.error}>{error}</p>}

          <button type='submit' className={s.submitBtn} disabled={submitting || !selectedTests.length}>
            {submitting ? 'Submitting…'
              : hasPricing && totalPrice > 0
                ? `Submit Request — ₦${totalPrice.toLocaleString()} (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`
                : `Submit Request (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`
            }
          </button>
        </form>
      ) : (
        loading ? <div className={s.empty}>Loading results…</div> : requests.length === 0
          ? <div className={s.empty}>No lab requests yet. Order your first test.</div>
          : <div className={s.resultsList}>
              {requests.map(req => {
                const result = resultMap.get(req._id)
                return (
                  <div key={req._id} className={s.resultCard}>
                    <div className={s.resultTop}>
                      <div className={s.resultInfo}>
                        <p>{req.tests.join(', ')}</p>
                        <span>{req.lab?.name ?? 'Pending assignment'} · {req.collectionType.replace('_', ' ')}</span>
                        <span>{new Date(req.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {req.adminApprovalStatus === 'pending' && <span className={s.pendingAdmin}>Awaiting admin review</span>}
                        {req.totalAmount > 0 && <span className={s.amountTag}>₦{req.totalAmount.toLocaleString()}</span>}
                      </div>
                      <span className={`${s.statusBadge} ${s[req.status]}`}>{req.status.replace('_', ' ')}</span>
                    </div>

                    {req.status === 'pending' && req.totalAmount > 0 && req.adminApprovalStatus !== 'pending' && (
                      <div className={s.resultFooter}>
                        <button className={s.payBtn} disabled={paying === req._id} onClick={() => initiatePayment(req)}>
                          {paying === req._id ? 'Redirecting…' : `Pay ₦${req.totalAmount.toLocaleString()}`}
                        </button>
                      </div>
                    )}

                    {result ? (
                      <div className={s.resultBody}>
                        {result.notes && <p className={s.resultNotes}>{result.notes}</p>}
                        <a href={result.fileUrl} target='_blank' rel='noreferrer' className={s.downloadBtn}>Download Report</a>
                      </div>
                    ) : req.status !== 'completed' && (
                      <p className={s.pendingNote}>Results will appear here once ready.</p>
                    )}
                  </div>
                )
              })}
            </div>
      )}
    </>
  )
}

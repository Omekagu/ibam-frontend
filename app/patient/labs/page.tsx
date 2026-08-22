'use client'
import { useEffect, useState, useRef, FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import s from './page.module.scss'
import {
  MapPinIcon,
  MicroscopeIcon,
  DocumentIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  WalkingIcon,
  CreditCardIcon,
  XIcon
} from '@/components/icons'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { downloadReceipt } from '@/lib/receipt'

interface LabRequest {
  _id: string
  tests: string[]
  lab?: { name: string }
  collectionType: string
  status: string
  totalAmount: number
  adminApprovalStatus?: string
  createdAt: string
  walkInExpiresAt?: string
  wellnessPackage?: { name: string }
  paymentRef?: {
    _id?: string
    status?: string
    amount?: number
    method?: string
    transferReference?: string
  }
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

const RESULT_STEPS = [
  'Submitted',
  'Lab Assigned',
  'Processing',
  'Ready'
] as const

function stepIndex (status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    assigned: 1,
    sample_collected: 2,
    processing: 2,
    completed: 3
  }
  return map[status] ?? 0
}

const BAND_CLS: Record<string, string> = {
  male: 'pkgCardBandMale',
  female: 'pkgCardBandFemale',
  all: 'pkgCardBandAll'
}
const BADGE_CLS: Record<string, string> = {
  male: 'pkgGenderBadgeMale',
  female: 'pkgGenderBadgeFemale'
}

function PatientLabsInner () {
  const modal = useStatusModal()
  const params = useSearchParams()
  const [tab, setTab] = useState<Tab>('order')
  const [requests, setRequests] = useState<LabRequest[]>([])
  const [results, setResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(true)
  const [catalogTests, setCatalogTests] = useState<LabTestCatalog[]>([])
  const [wellnessPackages, setWellnessPackages] = useState<
    WellnessPackageItem[]
  >([])
  const [bankSettings, setBankSettings] = useState<BankSettings | null>(null)
  const [paystackPublicKey, setPaystackPublicKey] = useState(
    process.env.NEXT_PUBLIC_PAYSTACK_KEY ?? ''
  )

  // Individual test order
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [collection, setCollection] = useState<'home_visit' | 'walk_in'>(
    'walk_in'
  )
  const [notes, setNotes] = useState('')
  const [referralFile, setReferralFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [homeAddr, setHomeAddr] = useState('')
  const [homeCoords, setHomeCoords] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [testSearch, setTestSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [transferRef, setTransferRef] = useState('')
  const [submittingRef, setSubmittingRef] = useState(false)

  // Wellness package booking
  const [selectedPackage, setSelectedPackage] =
    useState<WellnessPackageItem | null>(null)
  const [pkgCollection, setPkgCollection] = useState<'walk_in' | 'home_visit'>(
    'walk_in'
  )
  const [pkgAddress, setPkgAddress] = useState('')
  const [pkgCoords, setPkgCoords] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [pkgGpsLoading, setPkgGpsLoading] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null)

  const [refundingId, setRefundingId] = useState<string | null>(null)
  const [expandingResult, setExpandingResult] = useState<string | null>(null)
  const [payingLabId, setPayingLabId] = useState<string | null>(null)

  const estimatedTotal = selectedTests.reduce((sum, name) => {
    const t = catalogTests.find(c => c.name === name)
    const price =
      collection === 'home_visit'
        ? t?.homeVisitPrice ?? t?.estimatedPrice ?? 0
        : t?.walkInPrice ?? t?.estimatedPrice ?? 0
    return sum + price
  }, 0)

  const pkgPrice = selectedPackage
    ? pkgCollection === 'walk_in'
      ? selectedPackage.walkInPrice
      : selectedPackage.homeVisitPrice
    : 0

  useEffect(() => {
    const testsParam = params.get('tests')
    const tabParam = params.get('tab')
    if (tabParam === 'order') setTab('order')
    if (testsParam) {
      const names = testsParam
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
      if (names.length) setSelectedTests(names)
    }
  }, [params])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      try {
        document.body.removeChild(script)
      } catch {
        /* already removed */
      }
    }
  }, [])

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(body => {
        if (body?.data?.labTests?.length) setCatalogTests(body.data.labTests)
        if (body?.data?.wellnessPackages?.length)
          setWellnessPackages(body.data.wellnessPackages)
        if (body?.data?.paystackPublicKey)
          setPaystackPublicKey(body.data.paystackPublicKey)
      })
      .catch(() => {})

    api
      .get('/payments/settings')
      .then(r => {
        const st = r.data.data?.settings
        if (st?.directPaymentEnabled) setBankSettings(st)
      })
      .catch(() => {})

    api
      .get('/diagnostics/results/mine')
      .then(r => {
        setRequests(r.data.data?.requests ?? [])
        setResults(r.data.data?.results ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Individual test order helpers ─────────────────────────────────────────

  function toggleTest (test: string) {
    setSelectedTests(prev =>
      prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
    )
  }

  function useGPS () {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setHomeCoords(coords)
        setHomeAddr(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(
            5
          )}`
        )
        setGpsLoading(false)
      },
      () => {
        alert('Could not get your location.')
        setGpsLoading(false)
      }
    )
  }

  function buildForm () {
    const form = new FormData()
    selectedTests.forEach(t => form.append('tests[]', t))
    form.append('collectionType', collection)
    if (notes) form.append('notes', notes)
    if (referralFile) form.append('referral', referralFile)
    if (collection === 'home_visit') {
      if (homeAddr || homeCoords)
        form.append(
          'pickupLocation',
          JSON.stringify({ address: homeAddr, ...homeCoords })
        )
      if (preferredDate) form.append('preferredDate', preferredDate)
      if (preferredTime) form.append('preferredTime', preferredTime)
    }
    return form
  }

  function resetForm () {
    setSelectedTests([])
    setNotes('')
    setReferralFile(null)
    setHomeAddr('')
    setHomeCoords(null)
    setPreferredDate('')
    setPreferredTime('')
  }

  async function submitRequest (e: FormEvent) {
    e.preventDefault()
    if (!selectedTests.length) {
      modal.show({
        variant: 'declined',
        title: 'No Tests Selected',
        message: 'Please select at least one test before submitting.'
      })
      return
    }
    if (collection === 'home_visit' && !homeAddr) {
      modal.show({
        variant: 'declined',
        title: 'Address Required',
        message: 'Please provide your home address for the home visit.'
      })
      return
    }
    if (collection === 'home_visit' && !preferredDate) {
      modal.show({
        variant: 'declined',
        title: 'Date Required',
        message: 'Please select a preferred date for sample collection.'
      })
      return
    }
    // Any priced service (walk-in or home visit) → Paystack inline
    if (estimatedTotal > 0) {
      setSubmitting(true)
      try {
        const r = await api.post('/diagnostics/request', buildForm())
        const reqId: string = r.data.data?.request?._id
        setRequests(prev => [r.data.data?.request, ...prev])
        const payRes = await api.post('/payments/initiate', {
          type: 'lab_test',
          referenceId: reqId,
          amount: estimatedTotal
        })
        const { accessCode, reference } = payRes.data.data
        const testsSnap = [...selectedTests]
        const amountSnap = estimatedTotal
        const collectionSnap = collection
        resetForm()
        const paystack = new (window as any).PaystackPop()
        paystack.newTransaction({
          key: paystackPublicKey,
          accessCode,
          onSuccess: async () => {
            try {
              const vr = await api.get(`/payments/verify/${reference}`)
              if (vr.data.data?.payment?.status === 'success') {
                downloadReceipt({
                  bookingRef: `#${reqId.slice(-8).toUpperCase()}`,
                  tests: testsSnap,
                  amount: amountSnap,
                  collectionType: collectionSnap,
                  transactionRef: reference
                })
                modal.show({
                  variant: 'success',
                  title: 'Payment Confirmed!',
                  message: `Booking confirmed. Reference: #${reqId
                    .slice(-8)
                    .toUpperCase()}. Receipt is downloading.`,
                  actionLabel: 'View My Results',
                  onAction: () => setTab('results')
                })
                api
                  .get('/diagnostics/results/mine')
                  .then(rv => setRequests(rv.data.data?.requests ?? []))
                  .catch(() => {})
              }
            } catch {
              /* silent */
            }
          },
          onCancel: async () => {
            try {
              await api.delete(`/diagnostics/request/${reqId}`)
            } catch {
              /* silent */
            }
            setRequests(prev => prev.filter(r => r._id !== reqId))
            modal.show({
              variant: 'declined',
              title: 'Payment Cancelled',
              message:
                'No booking was made. Your selected tests are still available.'
            })
          }
        })
      } catch (err: unknown) {
        modal.show({
          variant: 'declined',
          title: 'Booking Failed',
          message:
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? 'Could not initiate payment. Please try again.'
        })
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSubmitting(true)
    try {
      const r = await api.post('/diagnostics/request', buildForm())
      setRequests(prev => [r.data.data?.request, ...prev])
      resetForm()
      if (collection === 'walk_in') {
        modal.show({
          variant: 'success',
          title: 'Request Submitted!',
          message:
            'Your request has been submitted. Visit the assigned lab for sample collection.',
          actionLabel: 'View My Requests',
          onAction: () => setTab('results')
        })
      } else {
        modal.show({
          variant: 'pending',
          title: 'Request Submitted!',
          message:
            'Your request has been submitted. Our team will contact you to schedule your home visit.',
          actionLabel: 'View My Requests',
          onAction: () => setTab('results')
        })
      }
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Submission Failed',
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
          'Could not submit your request. Please try again.',
        actionLabel: 'Try Again'
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRefundRequest (req: LabRequest) {
    const paymentId = req.paymentRef?._id
    if (!paymentId) return
    if (!confirm('Request a refund for this order?')) return
    setRefundingId(req._id)
    try {
      await api.post('/payments/refund-request', {
        paymentId,
        reason:
          req.status === 'no_show'
            ? 'Lab request marked as no-show'
            : 'Lab request cancelled without service'
      })
      modal.show({
        variant: 'success',
        title: 'Refund Requested',
        message:
          'Refund request submitted. Our team will review within 24–48 hours.'
      })
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Error',
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? 'Could not submit refund request.'
      })
    } finally {
      setRefundingId(null)
    }
  }

  async function handlePayLabRequest (req: LabRequest) {
    if (!paystackPublicKey) {
      modal.show({
        variant: 'declined',
        title: 'Not Ready',
        message: 'Payment system is loading. Please try again.'
      })
      return
    }
    setPayingLabId(req._id)
    try {
      const payRes = await api.post('/payments/initiate', {
        type: 'lab_test',
        referenceId: req._id,
        amount: req.totalAmount
      })
      const { accessCode, reference } = payRes.data.data
      setPayingLabId(null)
      const paystack = new (window as any).PaystackPop()
      paystack.newTransaction({
        key: paystackPublicKey,
        accessCode,
        onSuccess: async () => {
          try {
            await api.get(`/payments/verify/${reference}`)
            downloadReceipt({
              bookingRef: `#${req._id.slice(-8).toUpperCase()}`,
              tests: req.tests,
              amount: req.totalAmount,
              collectionType: req.collectionType as 'walk_in' | 'home_visit',
              transactionRef: reference
            })
            modal.show({
              variant: 'success',
              title: 'Payment Confirmed!',
              message: `Lab test booking confirmed. Receipt is downloading.`,
              actionLabel: 'View Results',
              onAction: () => setTab('results')
            })
            api
              .get('/diagnostics/results/mine')
              .then(rv => setRequests(rv.data.data?.requests ?? []))
              .catch(() => {})
          } catch {
            /* silent */
          }
        },
        onCancel: () => {
          modal.show({
            variant: 'declined',
            title: 'Payment Cancelled',
            message: 'Payment was not completed. Try again from My Results.'
          })
        }
      })
    } catch {
      setPayingLabId(null)
      modal.show({
        variant: 'declined',
        title: 'Error',
        message: 'Could not initiate payment. Please try again.'
      })
    }
  }

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
        transferReference: transferRef.trim()
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
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ??
          'Could not complete submission. Please try again.'
      })
    } finally {
      setSubmittingRef(false)
    }
  }

  // ── Wellness package booking helpers ──────────────────────────────────────

  function openBookModal (pkg: WellnessPackageItem) {
    setSelectedPackage(pkg)
    setPkgCollection('walk_in')
    setPkgAddress('')
    setPkgCoords(null)
    setShowBookModal(true)
  }

  function usePkgGPS () {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.')
      return
    }
    setPkgGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPkgCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setPkgAddress(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(
            5
          )}`
        )
        setPkgGpsLoading(false)
      },
      () => {
        alert('Could not get your location.')
        setPkgGpsLoading(false)
      }
    )
  }

  async function handleBookPackage () {
    if (!selectedPackage) return
    if (pkgCollection === 'home_visit' && !pkgAddress) {
      modal.show({
        variant: 'declined',
        title: 'Address Required',
        message: 'Please enter your home address for the visit.'
      })
      return
    }

    // Any priced booking (walk-in or home visit) → Paystack inline
    if (pkgPrice > 0) {
      setBookingSubmitting(true)
      try {
        const payload: Record<string, unknown> = {
          collectionType: pkgCollection
        }
        if (pkgCollection === 'home_visit') {
          payload.address = pkgAddress
          if (pkgCoords) {
            payload.lat = pkgCoords.lat
            payload.lng = pkgCoords.lng
          }
        }
        const r = await api.post(
          `/wellness-packages/${selectedPackage._id}/book`,
          payload
        )
        const reqId: string = r.data.data?.request?._id
        setRequests(prev => [r.data.data?.request, ...prev])
        const payRes = await api.post('/payments/initiate', {
          type: 'lab_test',
          referenceId: reqId,
          amount: pkgPrice
        })
        const { accessCode, reference } = payRes.data.data
        const priceSnap = pkgPrice
        const pkgNameSnap = selectedPackage.name
        const testsSnap = [...selectedPackage.includedTests]
        const collectionSnap = pkgCollection
        setShowBookModal(false)
        const paystack = new (window as any).PaystackPop()
        paystack.newTransaction({
          key: paystackPublicKey,
          accessCode,
          onSuccess: async () => {
            try {
              const vr = await api.get(`/payments/verify/${reference}`)
              if (vr.data.data?.payment?.status === 'success') {
                downloadReceipt({
                  bookingRef: `#${reqId.slice(-8).toUpperCase()}`,
                  tests: testsSnap,
                  amount: priceSnap,
                  collectionType: collectionSnap,
                  transactionRef: reference,
                  packageName: pkgNameSnap
                })
                modal.show({
                  variant: 'success',
                  title: 'Package Booked!',
                  message: `"${pkgNameSnap}" is confirmed. Reference: #${reqId
                    .slice(-8)
                    .toUpperCase()}. Receipt is downloading.`,
                  actionLabel: 'View My Results',
                  onAction: () => setTab('results')
                })
                api
                  .get('/diagnostics/results/mine')
                  .then(rv => setRequests(rv.data.data?.requests ?? []))
                  .catch(() => {})
              }
            } catch {
              /* silent */
            }
          },
          onCancel: async () => {
            try {
              await api.delete(`/diagnostics/request/${reqId}`)
            } catch {
              /* silent */
            }
            setRequests(prev => prev.filter(r => r._id !== reqId))
            modal.show({
              variant: 'declined',
              title: 'Payment Cancelled',
              message: `No booking was made. You can book "${pkgNameSnap}" again anytime.`
            })
          }
        })
      } catch (err: unknown) {
        modal.show({
          variant: 'declined',
          title: 'Booking Failed',
          message:
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? 'Could not book the package. Please try again.'
        })
      } finally {
        setBookingSubmitting(false)
      }
      return
    }

    // Free package
    setBookingSubmitting(true)
    try {
      const payload: Record<string, unknown> = { collectionType: pkgCollection }
      if (pkgCollection === 'home_visit') {
        payload.address = pkgAddress
        if (pkgCoords) {
          payload.lat = pkgCoords.lat
          payload.lng = pkgCoords.lng
        }
      }
      const r = await api.post(
        `/wellness-packages/${selectedPackage._id}/book`,
        payload
      )
      setRequests(prev => [r.data.data?.request, ...prev])
      setShowBookModal(false)
      modal.show({
        variant: 'success',
        title: 'Package Booked!',
        message:
          pkgCollection === 'walk_in'
            ? `Your "${selectedPackage.name}" package has been booked. Visit the assigned lab for sample collection.`
            : `Your "${selectedPackage.name}" package has been booked. Our team will contact you to schedule your home visit.`,
        actionLabel: 'View My Requests',
        onAction: () => setTab('results')
      })
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Booking Failed',
        message:
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? 'Could not book the package. Please try again.'
      })
    } finally {
      setBookingSubmitting(false)
    }
  }

  const resultMap = new Map(results.map(r => [r.request, r]))

  const GENDER_LABEL: Record<string, string> = {
    male: '♂ Men',
    female: '♀ Women',
    all: 'All'
  }

  return (
    <>
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === 'order' ? s.active : ''}`}
          onClick={() => setTab('order')}
        >
          Order Tests
        </button>
        <button
          className={`${s.tab} ${tab === 'packages' ? s.active : ''}`}
          onClick={() => setTab('packages')}
        >
          Wellness Packages
          {wellnessPackages.length > 0 && (
            <span className={s.count}>{wellnessPackages.length}</span>
          )}
        </button>
        <button
          className={`${s.tab} ${tab === 'results' ? s.active : ''}`}
          onClick={() => setTab('results')}
        >
          My Results
          {requests.length > 0 && (
            <span className={s.count}>{requests.length}</span>
          )}
        </button>
      </div>

      {/* ── Order Tests Tab ── */}
      {tab === 'order' && (
        <form className={s.orderForm} onSubmit={submitRequest}>
          <div className={s.infoNote}>
            <strong>How it works:</strong> Select the tests you need, choose how
            your sample will be collected, and submit. Our team will assign a
            certified lab and notify you with next steps.
          </div>

          <div className={s.section}>
            <div className={s.testSectionHead}>
              <h3>
                Select Tests{' '}
                <span className={s.selectedCount}>
                  {selectedTests.length} selected
                </span>
              </h3>
              <input
                type='search'
                className={s.testSearch}
                placeholder='Search tests…'
                value={testSearch}
                onChange={e => setTestSearch(e.target.value)}
              />
            </div>
            {catalogTests.length === 0 ? (
              <Loader inline variant='dots' size='sm' label='Loading tests…' />
            ) : (
              <div className={s.testGrid}>
                {catalogTests
                  .filter(
                    t =>
                      !testSearch ||
                      t.name.toLowerCase().includes(testSearch.toLowerCase())
                  )
                  .map(t => {
                    const price =
                      collection === 'home_visit'
                        ? t.homeVisitPrice ?? t.estimatedPrice
                        : t.walkInPrice ?? t.estimatedPrice
                    return (
                      <label
                        key={t._id}
                        className={`${s.testItem} ${
                          selectedTests.includes(t.name) ? s.checked : ''
                        }`}
                      >
                        <input
                          type='checkbox'
                          checked={selectedTests.includes(t.name)}
                          onChange={() => toggleTest(t.name)}
                        />
                        <div className={s.testContent}>
                          <span>{t.name}</span>
                          {price != null && (
                            <span style={{ fontSize: '0.7rem', opacity: 0.65 }}>
                              ₦{price.toLocaleString('en-NG')}
                            </span>
                          )}
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
                <label
                  key={c}
                  className={`${s.collectionOpt} ${
                    collection === c ? s.picked : ''
                  }`}
                >
                  <input
                    type='radio'
                    name='collection'
                    value={c}
                    checked={collection === c}
                    onChange={() => setCollection(c)}
                  />
                  <div className={s.collectionIcon}>
                    {c === 'walk_in' ? (
                      <WalkingIcon size={24} />
                    ) : (
                      <HomeIcon size={24} />
                    )}
                  </div>
                  <span>{c === 'walk_in' ? 'Walk-in Lab' : 'Home Visit'}</span>
                  <p>
                    {c === 'walk_in'
                      ? 'Visit the assigned lab yourself'
                      : 'A lab professional visits you at home'}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {collection === 'home_visit' && estimatedTotal > 0 && (
            <div className={s.paymentNote} data-variant='transfer'>
              <span className={s.paymentNoteIcon}>
                <CreditCardIcon size={14} />
              </span>
              <p>
                Estimated total:{' '}
                <strong>₦{estimatedTotal.toLocaleString()}</strong>. Pay
                securely via card — a booking confirmation will be sent after
                payment.
              </p>
            </div>
          )}

          {collection === 'home_visit' && (
            <div className={s.section}>
              <h3>Home Visit Details</h3>
              <p className={s.referralNote}>
                Tell us where to come and when works best for you. Our team will
                confirm the visit.
              </p>

              {/* Address */}
              <div className={s.locationRow}>
                <input
                  type='text'
                  value={homeAddr}
                  onChange={e => setHomeAddr(e.target.value)}
                  placeholder='Your full address or nearest landmark…'
                  className={s.locationInput}
                  required
                />
                <button
                  type='button'
                  className={s.gpsBtn}
                  disabled={gpsLoading}
                  onClick={useGPS}
                >
                  {gpsLoading ? (
                    '…'
                  ) : (
                    <>
                      <MapPinIcon size={13} /> GPS
                    </>
                  )}
                </button>
              </div>
              {homeCoords && (
                <p className={s.coordsNote}>
                  GPS: {homeCoords.lat.toFixed(5)}, {homeCoords.lng.toFixed(5)}
                </p>
              )}

              {/* Preferred date + time */}
              <div className={s.scheduleRow}>
                <div className={s.scheduleField}>
                  <label className={s.scheduleLabel}>Preferred Date *</label>
                  <input
                    type='date'
                    className={s.locationInput}
                    value={preferredDate}
                    min={
                      new Date(Date.now() + 86400000)
                        .toISOString()
                        .split('T')[0]
                    }
                    onChange={e => setPreferredDate(e.target.value)}
                    required
                  />
                </div>
                <div className={s.scheduleField}>
                  <label className={s.scheduleLabel}>
                    Preferred Time <span className={s.optional}>optional</span>
                  </label>
                  <select
                    className={s.locationInput}
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                  >
                    <option value=''>Any time</option>
                    {[
                      '07:00',
                      '08:00',
                      '09:00',
                      '10:00',
                      '11:00',
                      '12:00',
                      '13:00',
                      '14:00',
                      '15:00',
                      '16:00',
                      '17:00'
                    ].map(t => (
                      <option key={t} value={t}>
                        {t.replace(':', ':')}{' '}
                        {Number(t.split(':')[0]) < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className={s.section}>
            <h3>
              Doctor Referral / Prescription{' '}
              <span className={s.optional}>optional</span>
            </h3>
            <p className={s.referralNote}>
              Upload a referral note if you have one. Without an iBam
              doctor&apos;s referral, your request will be reviewed by admin
              first.
            </p>
            <div
              className={s.fileUploadArea}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type='file'
                accept='.pdf,image/*'
                style={{ display: 'none' }}
                onChange={e => setReferralFile(e.target.files?.[0] ?? null)}
              />
              {referralFile ? (
                <p className={s.fileName}>{referralFile.name}</p>
              ) : (
                <p>Click to upload referral (PDF or image)</p>
              )}
            </div>
          </div>

          <div className={s.section}>
            <h3>
              Notes <span className={s.optional}>optional</span>
            </h3>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Any relevant medical history or special instructions…'
            />
          </div>

          <button
            type='submit'
            className={s.submitBtn}
            disabled={submitting || !selectedTests.length}
          >
            {submitting ? (
              <Loader inline size='sm' />
            ) : estimatedTotal > 0 ? (
              `Pay ₦${estimatedTotal.toLocaleString()} & Book`
            ) : (
              `Submit Request (${selectedTests.length} test${
                selectedTests.length !== 1 ? 's' : ''
              })`
            )}
          </button>
        </form>
      )}

      {/* ── Wellness Packages Tab ── */}
      {tab === 'packages' && (
        <div className={s.pkgGrid}>
          {wellnessPackages.length === 0 ? (
            <div className={s.empty}>
              No wellness packages available right now.
            </div>
          ) : (
            wellnessPackages.map(pkg => {
              const open = expandedPkg === pkg._id
              return (
                <div key={pkg._id} className={s.pkgCard}>
                  <div
                    className={`${s.pkgCardBand} ${
                      s[BAND_CLS[pkg.gender] ?? 'pkgCardBandAll']
                    }`}
                  />
                  <div className={s.pkgCardInner}>
                    <div className={s.pkgCardTop}>
                      <div className={s.pkgMeta}>
                        <span
                          className={`${s.pkgGenderBadge} ${
                            BADGE_CLS[pkg.gender]
                              ? s[BADGE_CLS[pkg.gender]]
                              : ''
                          }`}
                        >
                          {GENDER_LABEL[pkg.gender] ?? pkg.gender}
                        </span>
                        <h3 className={s.pkgName}>{pkg.name}</h3>
                        {pkg.benefits && (
                          <p className={s.pkgBenefits}>{pkg.benefits}</p>
                        )}
                      </div>
                      <div className={s.pkgPrices}>
                        <div className={s.pkgPriceRow}>
                          <span className={s.pkgPriceLabel}>Walk-in</span>
                          <span className={s.pkgPriceVal}>
                            ₦{pkg.walkInPrice.toLocaleString('en-NG')}
                          </span>
                        </div>
                        <div className={s.pkgPriceRow}>
                          <span className={s.pkgPriceLabel}>Home Visit</span>
                          <span className={s.pkgPriceVal}>
                            ₦{pkg.homeVisitPrice.toLocaleString('en-NG')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className={s.pkgTestsToggle}
                      onClick={() => setExpandedPkg(open ? null : pkg._id)}
                    >
                      {open ? (
                        <ChevronUpIcon size={14} />
                      ) : (
                        <ChevronDownIcon size={14} />
                      )}{' '}
                      {pkg.includedTests.length} included tests
                    </button>

                    {open && (
                      <ul className={s.pkgTestsList}>
                        {pkg.includedTests.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}

                    <button
                      className={s.pkgBookBtn}
                      onClick={() => openBookModal(pkg)}
                    >
                      Book This Package
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── Results Tab ── */}
      {tab === 'results' &&
        (loading ? (
          <Loader label='Loading results…' />
        ) : (
          <>
            {requests.length === 0 ? (
              <div className={s.emptyState}>
                <div className={s.emptyStateIcon}>🔬</div>
                <p className={s.emptyStateTitle}>No lab requests yet</p>
                <span className={s.emptyStateSub}>
                  Order your first test from the Order Tests tab above.
                </span>
              </div>
            ) : (
              <div className={s.resultsList}>
                {requests.map(req => {
                  const result = resultMap.get(req._id)
                  const open = expandingResult === req._id
                  const canRefund = !!(
                    req.paymentRef?._id &&
                    req.paymentRef.status === 'success' &&
                    (req.status === 'no_show' || req.status === 'cancelled')
                  )
                  const hasResult = !!result
                  const showSteps =
                    req.status !== 'cancelled' && req.status !== 'no_show'
                  return (
                    <div
                      key={req._id}
                      className={`${s.resultCard} ${
                        hasResult ? s.resultCardDone : ''
                      }`}
                    >
                      {showSteps && (
                        <div className={s.statusSteps}>
                          {RESULT_STEPS.map((label, i) => {
                            const idx = stepIndex(req.status)
                            const done = idx > i
                            const active = idx === i
                            return (
                              <div
                                key={label}
                                className={`${s.statusStep} ${
                                  done ? s.stepDone : ''
                                } ${active ? s.stepActive : ''}`}
                              >
                                <div className={s.stepDot}>
                                  {done ? '✓' : ''}
                                </div>
                                <span className={s.stepLabel}>{label}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {/* ── Card header (always visible, clickable) ── */}
                      <div
                        className={s.resultCardHeader}
                        onClick={() =>
                          setExpandingResult(open ? null : req._id)
                        }
                        role='button'
                      >
                        <div
                          className={`${s.resultIconWrap} ${
                            hasResult ? s.resultIconWrapDone : ''
                          }`}
                        >
                          <MicroscopeIcon size={20} />
                        </div>
                        <div className={s.resultCardInfo}>
                          <p className={s.resultCardTitle}>
                            {req.tests.slice(0, 2).join(', ')}
                            {req.tests.length > 2 && (
                              <span className={s.moreTests}>
                                {' '}
                                +{req.tests.length - 2}
                              </span>
                            )}
                            {req.wellnessPackage && (
                              <span className={s.pkgLabel}>
                                {' '}
                                · {req.wellnessPackage.name}
                              </span>
                            )}
                          </p>
                          <span className={s.resultCardSub}>
                            {req.lab?.name ?? 'Lab being assigned'} ·{' '}
                            {req.collectionType === 'walk_in'
                              ? 'Walk-in'
                              : 'Home Visit'}{' '}
                            ·{' '}
                            {new Date(req.createdAt).toLocaleDateString(
                              'en-NG',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }
                            )}
                          </span>
                        </div>
                        <div className={s.resultCardRight}>
                          <span className={`${s.statusBadge} ${s[req.status]}`}>
                            {req.status.replace(/_/g, ' ')}
                          </span>
                          <span className={s.chevronIcon}>
                            {open ? (
                              <ChevronUpIcon size={14} />
                            ) : (
                              <ChevronDownIcon size={14} />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* ── Expanded body ── */}
                      {open && (
                        <div className={s.resultCardBody}>
                          {/* Tests chips */}
                          <div>
                            <p className={s.bodyLabel}>Tests Requested</p>
                            <div className={s.testTagList}>
                              {req.tests.map((t, i) => (
                                <span key={i} className={s.testTag}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Detail grid */}
                          <div className={s.detailGrid}>
                            <div className={s.detailItem}>
                              <span className={s.detailLabel}>Collection</span>
                              <span className={s.detailValue}>
                                {req.collectionType === 'walk_in' ? (
                                  <>
                                    <WalkingIcon size={14} /> Walk-in at Lab
                                  </>
                                ) : (
                                  <>
                                    <HomeIcon size={14} /> Home Visit
                                  </>
                                )}
                              </span>
                            </div>
                            {req.totalAmount > 0 && (
                              <div className={s.detailItem}>
                                <span className={s.detailLabel}>Amount</span>
                                <span
                                  className={`${s.detailValue} ${s.detailAmount}`}
                                >
                                  ₦{req.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {req.paymentRef && (
                              <div className={s.detailItem}>
                                <span className={s.detailLabel}>Payment</span>
                                <span
                                  className={`${s.detailValue} ${
                                    req.paymentRef.status === 'success'
                                      ? s.detailSuccess
                                      : s.detailPending
                                  }`}
                                >
                                  {req.paymentRef.status === 'success' ? (
                                    <>
                                      <CheckIcon size={14} /> Confirmed
                                    </>
                                  ) : (
                                    <>
                                      <ClockIcon size={14} /> Pending
                                    </>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Admin approval chip */}
                          {req.adminApprovalStatus === 'pending' && (
                            <div className={s.infoChip}>
                              Awaiting admin review before lab assignment
                            </div>
                          )}

                          {/* Walk-in expiry */}
                          {req.walkInExpiresAt &&
                            req.status === 'pending' &&
                            req.collectionType === 'walk_in' && (
                              <div
                                className={`${s.infoChip} ${s.infoChipWarn}`}
                              >
                                Walk-in expires:{' '}
                                {new Date(
                                  req.walkInExpiresAt
                                ).toLocaleDateString('en-NG', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}

                          {/* Result ready banner */}
                          {hasResult && (
                            <div className={s.resultReadyBanner}>
                              <span className={s.resultReadyCheck}>
                                <CheckIcon size={14} />
                              </span>
                              <div>
                                <p className={s.resultReadyTitle}>
                                  Your results are ready
                                </p>
                                {result!.notes && (
                                  <p className={s.resultReadyNotes}>
                                    {result!.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Pending note */}
                          {!hasResult && req.status !== 'completed' && (
                            <p className={s.pendingNote}>
                              Results will appear here once your sample is
                              processed.
                            </p>
                          )}

                          {/* Pay Now — for requests awaiting payment */}
                          {req.status === 'pending' &&
                            req.totalAmount > 0 &&
                            (!req.paymentRef ||
                              req.paymentRef.status !== 'success') && (
                              <div className={s.actionRow}>
                                <button
                                  className={`${s.actionBtn} ${s.actionBtnPay}`}
                                  disabled={payingLabId === req._id}
                                  onClick={() => handlePayLabRequest(req)}
                                >
                                  {payingLabId === req._id ? (
                                    <Loader inline size='sm' />
                                  ) : (
                                    <>
                                      <CreditCardIcon size={14} /> Pay Now
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                          {/* Action buttons */}
                          {(hasResult ||
                            req.paymentRef?.status === 'success' ||
                            canRefund) && (
                            <div className={s.actionRow}>
                              {hasResult && result!.fileUrl && (
                                <a
                                  href={result!.fileUrl}
                                  target='_blank'
                                  rel='noreferrer'
                                  className={s.downloadResultBtn}
                                >
                                  <DocumentIcon size={15} /> Download Report
                                </a>
                              )}
                              {req.paymentRef?.status === 'success' && (
                                <button
                                  className={s.actionBtn}
                                  onClick={() =>
                                    downloadReceipt({
                                      bookingRef: `#${req._id
                                        .slice(-8)
                                        .toUpperCase()}`,
                                      tests: req.tests,
                                      amount:
                                        req.paymentRef?.amount ??
                                        req.totalAmount,
                                      collectionType: req.collectionType as
                                        | 'walk_in'
                                        | 'home_visit',
                                      transactionRef: req.paymentRef?._id
                                    })
                                  }
                                >
                                  Download Receipt
                                </button>
                              )}
                              {canRefund && (
                                <button
                                  className={`${s.actionBtn} ${s.actionBtnDanger}`}
                                  disabled={refundingId === req._id}
                                  onClick={() => handleRefundRequest(req)}
                                >
                                  {refundingId === req._id ? (
                                    <Loader inline size='sm' />
                                  ) : (
                                    'Request Refund'
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ))}

      {/* ── Bank Transfer Modal (individual tests) ── */}
      {showPayModal && (
        <div className={s.payOverlay}>
          <div className={s.payPanel}>
            <div className={s.payPanelHeader}>
              <h2 className={s.payPanelTitle}>Pay for Home Visit</h2>
              <button
                className={s.payPanelClose}
                onClick={() => setShowPayModal(false)}
              >
                <XIcon size={14} />
              </button>
            </div>
            <p className={s.payPanelSub}>
              Transfer <strong>₦{estimatedTotal.toLocaleString()}</strong> to
              the company bank account below, then enter your reference number.
              Do not transfer to any personal account.
            </p>
            {bankSettings && (
              <div className={s.bankCard}>
                <BankRow label='Bank' value={bankSettings.companyBankName} />
                <BankRow
                  label='Account Number'
                  value={bankSettings.companyAccountNumber}
                  copyable
                />
                <BankRow
                  label='Account Name'
                  value={bankSettings.companyAccountName}
                />
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
              {submittingRef ? (
                <Loader inline size='sm' />
              ) : (
                'Submit Request & Reference'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Wellness Package Booking Modal ── */}
      {showBookModal && selectedPackage && (
        <div className={s.payOverlay}>
          <div className={s.payPanel} style={{ maxWidth: 480 }}>
            <div className={s.payPanelHeader}>
              <h2 className={s.payPanelTitle}>Book Package</h2>
              <button
                className={s.payPanelClose}
                onClick={() => setShowBookModal(false)}
              >
                <XIcon size={14} />
              </button>
            </div>

            {
              <>
                <p className={s.payPanelSub}>
                  <strong>{selectedPackage.name}</strong> —{' '}
                  {selectedPackage.includedTests.length} tests included.
                </p>

                {/* Collection type */}
                <div className={s.collectionRow}>
                  {(['walk_in', 'home_visit'] as const).map(c => (
                    <label
                      key={c}
                      className={`${s.collectionOpt} ${
                        pkgCollection === c ? s.picked : ''
                      }`}
                    >
                      <input
                        type='radio'
                        name='pkgCollection'
                        value={c}
                        checked={pkgCollection === c}
                        onChange={() => setPkgCollection(c)}
                      />
                      <span>
                        {c === 'walk_in' ? 'Walk-in Lab' : 'Home Visit'}
                      </span>
                      <p>
                        {c === 'walk_in'
                          ? `₦${selectedPackage.walkInPrice.toLocaleString(
                              'en-NG'
                            )} — visit lab for collection`
                          : `₦${selectedPackage.homeVisitPrice.toLocaleString(
                              'en-NG'
                            )} — agent comes to you`}
                      </p>
                    </label>
                  ))}
                </div>

                {/* Address (home visit only) */}
                {pkgCollection === 'home_visit' && (
                  <>
                    <div className={s.locationRow}>
                      <input
                        type='text'
                        value={pkgAddress}
                        onChange={e => setPkgAddress(e.target.value)}
                        placeholder='Your full address or nearest landmark…'
                        className={s.locationInput}
                      />
                      <button
                        type='button'
                        className={s.gpsBtn}
                        disabled={pkgGpsLoading}
                        onClick={usePkgGPS}
                      >
                        {pkgGpsLoading ? (
                          '…'
                        ) : (
                          <>
                            <MapPinIcon size={13} /> GPS
                          </>
                        )}
                      </button>
                    </div>
                    {pkgCoords && (
                      <p className={s.coordsNote}>
                        GPS: {pkgCoords.lat.toFixed(5)},{' '}
                        {pkgCoords.lng.toFixed(5)}
                      </p>
                    )}
                  </>
                )}

                <div className={s.pkgPriceHighlight}>
                  Total: <strong>₦{pkgPrice.toLocaleString('en-NG')}</strong>
                  {pkgPrice > 0 && <span> — pay securely by card</span>}
                </div>

                <button
                  className={s.payConfirmBtn}
                  disabled={
                    bookingSubmitting ||
                    (pkgCollection === 'home_visit' && !pkgAddress)
                  }
                  onClick={handleBookPackage}
                >
                  {bookingSubmitting ? (
                    <Loader inline size='sm' />
                  ) : pkgPrice > 0 ? (
                    `Pay ₦${pkgPrice.toLocaleString()} & Book`
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </>
            }
          </div>
        </div>
      )}
    </>
  )
}

export default function PatientLabs () {
  return (
    <Suspense fallback={<Loader label='Loading lab tests…' />}>
      <PatientLabsInner />
    </Suspense>
  )
}

function BankRow ({
  label,
  value,
  copyable
}: {
  label: string
  value: string
  copyable?: boolean
}) {
  function copy () {
    navigator.clipboard?.writeText(value).catch(() => {})
  }
  return (
    <div className={s.bankRow}>
      <span className={s.bankRowLabel}>{label}</span>
      <span className={s.bankRowVal}>
        {value || '—'}
        {copyable && value && (
          <button
            type='button'
            className={s.copyBtn}
            onClick={copy}
            title='Copy'
          >
            ⧉
          </button>
        )}
      </span>
    </div>
  )
}

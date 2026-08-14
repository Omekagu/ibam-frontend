'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { MapPinIcon } from '@/components/icons'

interface SubscriptionPlan {
  _id: string
  name: string
  description?: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  isActive: boolean
  featured: boolean
  paystackPlanCode?: string
}

interface ActiveSubscription {
  _id: string
  plan: SubscriptionPlan
  status: 'active' | 'cancelled'
  nextBillingDate?: string
  createdAt: string
}

interface WellnessPackage {
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

const GENDER_LABEL: Record<string, string> = { male: '♂ Men', female: '♀ Women', all: 'All' }

function formatPrice (price: number, interval: string) {
  return `₦${price.toLocaleString('en-NG')}/${interval === 'yearly' ? 'yr' : 'mo'}`
}

function formatDate (iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SubscriptionsPage () {
  const modal = useStatusModal()

  // Platform plans state
  const [plans,       setPlans]       = useState<SubscriptionPlan[]>([])
  const [current,     setCurrent]     = useState<ActiveSubscription | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [cancelling,  setCancelling]  = useState(false)

  // Wellness packages state
  const [packages,       setPackages]       = useState<WellnessPackage[]>([])
  const [expandedPkg,    setExpandedPkg]    = useState<string | null>(null)
  const [bankSettings,   setBankSettings]   = useState<BankSettings | null>(null)

  // Booking modal state
  const [selectedPkg,      setSelectedPkg]      = useState<WellnessPackage | null>(null)
  const [showBookModal,    setShowBookModal]    = useState(false)
  const [pkgCollection,    setPkgCollection]    = useState<'walk_in' | 'home_visit'>('walk_in')
  const [pkgAddress,       setPkgAddress]       = useState('')
  const [pkgCoords,        setPkgCoords]        = useState<{ lat: number; lng: number } | null>(null)
  const [pkgGpsLoading,    setPkgGpsLoading]    = useState(false)
  const [bookingStep,      setBookingStep]      = useState<'details' | 'payment'>('details')
  const [bookingRef,       setBookingRef]       = useState('')
  const [bookingSubmitting,setBookingSubmitting] = useState(false)

  const pkgPrice = selectedPkg
    ? pkgCollection === 'walk_in' ? selectedPkg.walkInPrice : selectedPkg.homeVisitPrice
    : 0

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/mine'),
      ])
      setPlans(plansRes.data.data?.plans ?? [])
      setCurrent(subRes.data.data?.subscription ?? null)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.ibamhealth.com/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(body => { if (body?.data?.wellnessPackages?.length) setPackages(body.data.wellnessPackages) })
      .catch(() => {})

    api.get('/payments/settings')
      .then(r => { const st = r.data.data?.settings; if (st?.directPaymentEnabled) setBankSettings(st) })
      .catch(() => {})
  }, [load])

  // ── Platform plan handlers ────────────────────────────────────────────────

  async function handleSubscribe (plan: SubscriptionPlan) {
    if (!plan.paystackPlanCode) {
      modal.show({ variant: 'pending', title: 'Coming Soon', message: `"${plan.name}" is not yet available for online subscription. Please check back soon.` }); return
    }
    if (!confirm(`Subscribe to ${plan.name} for ${formatPrice(plan.price, plan.interval)}?\n\nYou will be charged via Paystack. Cancel anytime.`)) return
    setSubscribing(plan._id)
    try {
      const r = await api.post('/subscriptions/subscribe', { planId: plan._id })
      setCurrent(r.data.data?.subscription)
      modal.show({ variant: 'success', title: 'Subscribed!', message: `You're now on the ${plan.name} plan. Enjoy your premium benefits.`, actionLabel: 'Great, thanks!' })
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Subscription Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not process your subscription. Please try again.', actionLabel: 'Try Again' })
    } finally { setSubscribing(null) }
  }

  async function handleCancel () {
    if (!confirm('Cancel your subscription? You will lose access at the end of the billing period.')) return
    setCancelling(true)
    try {
      await api.put('/subscriptions/cancel')
      setCurrent(null)
      modal.show({ variant: 'success', title: 'Subscription Cancelled', message: 'Your subscription has been cancelled. You will retain access until the end of your current billing period.' })
    } catch {
      modal.show({ variant: 'declined', title: 'Cancellation Failed', message: 'Could not cancel your subscription. Please try again or contact support.', actionLabel: 'Try Again' })
    } finally { setCancelling(false) }
  }

  // ── Wellness package handlers ─────────────────────────────────────────────

  function openBookModal (pkg: WellnessPackage) {
    setSelectedPkg(pkg); setPkgCollection('walk_in'); setPkgAddress(''); setPkgCoords(null)
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
    if (!selectedPkg) return
    if (pkgCollection === 'home_visit' && !pkgAddress) {
      modal.show({ variant: 'declined', title: 'Address Required', message: 'Please enter your home address.' }); return
    }
    if (pkgCollection === 'home_visit' && pkgPrice > 0 && bankSettings && bookingStep === 'details') {
      setBookingStep('payment'); return
    }
    setBookingSubmitting(true)
    try {
      const payload: Record<string, unknown> = { collectionType: pkgCollection }
      if (pkgCollection === 'home_visit') {
        payload.address = pkgAddress
        if (pkgCoords) { payload.lat = pkgCoords.lat; payload.lng = pkgCoords.lng }
      }
      if (bookingRef.trim()) payload.transferReference = bookingRef.trim()
      await api.post(`/wellness-packages/${selectedPkg._id}/book`, payload)
      setShowBookModal(false)
      if (pkgCollection === 'walk_in') {
        modal.show({ variant: 'success', title: 'Package Booked!', message: `Your "${selectedPkg.name}" package is confirmed. Visit the assigned lab and pay ₦${selectedPkg.walkInPrice.toLocaleString()} at the counter.` })
      } else {
        modal.show({ variant: 'pending', title: 'Package Booked!', message: `Your "${selectedPkg.name}" package is confirmed. Our team will contact you to schedule your home visit.` })
      }
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Booking Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not book the package. Please try again.' })
    } finally { setBookingSubmitting(false) }
  }

  if (loading) return <div className={s.wrap}><Loader label='Loading…' /></div>

  return (
    <div className={s.wrap}>

      {/* ── Wellness Packages section ── */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Wellness Packages</h1>
          <p className={s.subtitle}>Curated laboratory screening packages for preventive healthcare.</p>
        </div>
      </div>

      {packages.length === 0 ? (
        <p className={s.empty}>No wellness packages available right now. Check back soon.</p>
      ) : (
        <div className={s.pkgGrid}>
          {packages.map(pkg => {
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

      {/* ── Platform Plans section ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <div className={s.pageHeader} style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className={s.title} style={{ fontSize: '1rem' }}>Platform Subscription Plans</h2>
            <p className={s.subtitle}>Subscribe to unlock unlimited consultations and premium features.</p>
          </div>
        </div>

        {current && (
          <div className={s.activeBanner} style={{ marginBottom: '1rem' }}>
            <div className={s.activeBannerLeft}>
              <span className={s.activeBadge}>✓ Active</span>
              <p className={s.activePlanName}>{current.plan?.name}</p>
              <p className={s.activeMeta}>Next billing: {formatDate(current.nextBillingDate)}</p>
            </div>
            <button className={s.cancelBtn} onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
            </button>
          </div>
        )}

        {plans.length === 0 ? (
          <p className={s.empty}>No subscription plans available at this time.</p>
        ) : (
          <div className={s.plansGrid}>
            {plans.map(plan => {
              const isActive = current?.plan?._id === plan._id || current?.plan === plan._id as unknown as SubscriptionPlan
              const isLoading = subscribing === plan._id
              return (
                <div key={plan._id} className={`${s.planCard} ${plan.featured ? s.planFeatured : ''} ${isActive ? s.planActive : ''}`}>
                  {plan.featured && <span className={s.popularBadge}>★ Most Popular</span>}
                  <div className={s.planHeader}>
                    <div>
                      <p className={s.planName}>{plan.name}</p>
                      {plan.description && <p className={s.planDesc}>{plan.description}</p>}
                    </div>
                    <div className={s.planPriceWrap}>
                      <span className={s.planPrice}>₦{plan.price.toLocaleString('en-NG')}</span>
                      <span className={s.planInterval}>/{plan.interval === 'yearly' ? 'yr' : 'mo'}</span>
                    </div>
                  </div>
                  {plan.features.length > 0 && (
                    <ul className={s.featureList}>
                      {plan.features.map((f, i) => <li key={i} className={s.featureItem}><span className={s.checkmark}>✓</span>{f}</li>)}
                    </ul>
                  )}
                  {isActive ? (
                    <div className={s.currentTag}>✓ Your current plan</div>
                  ) : (
                    <button
                      className={`${s.subscribeBtn} ${plan.featured ? s.subscribeBtnFeatured : ''}`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={!!subscribing}
                    >
                      {isLoading ? 'Processing…' : 'Subscribe Now'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className={s.footnote}>Payments are processed securely via Paystack. You can cancel anytime from this page.</p>
      </div>

      {/* ── Wellness Package Booking Modal ── */}
      {showBookModal && selectedPkg && (
        <div className={s.bookOverlay}>
          <div className={s.bookPanel}>
            <div className={s.bookPanelHeader}>
              <h2 className={s.bookPanelTitle}>{bookingStep === 'payment' ? 'Pay for Package' : 'Book Package'}</h2>
              <button className={s.bookPanelClose} onClick={() => setShowBookModal(false)}>✕</button>
            </div>

            {bookingStep === 'details' ? (
              <>
                <p className={s.bookPanelSub}><strong>{selectedPkg.name}</strong> — {selectedPkg.includedTests.length} tests included.</p>

                <div className={s.collectionRow}>
                  {(['walk_in', 'home_visit'] as const).map(c => (
                    <label key={c} className={`${s.collectionOpt} ${pkgCollection === c ? s.picked : ''}`}>
                      <input type='radio' name='pkgCollection' value={c} checked={pkgCollection === c} onChange={() => setPkgCollection(c)} />
                      <span>{c === 'walk_in' ? 'Walk-in Lab' : 'Home Visit'}</span>
                      <p>
                        {c === 'walk_in'
                          ? `₦${selectedPkg.walkInPrice.toLocaleString('en-NG')} — pay at counter`
                          : `₦${selectedPkg.homeVisitPrice.toLocaleString('en-NG')} — agent comes to you`}
                      </p>
                    </label>
                  ))}
                </div>

                {pkgCollection === 'home_visit' && (
                  <div className={s.locationRow}>
                    <input type='text' value={pkgAddress} onChange={e => setPkgAddress(e.target.value)} placeholder='Your full address or nearest landmark…' className={s.locationInput} />
                    <button type='button' className={s.gpsBtn} disabled={pkgGpsLoading} onClick={usePkgGPS}>
                      {pkgGpsLoading ? '…' : <><MapPinIcon size={13} /> GPS</>}
                    </button>
                  </div>
                )}
                {pkgCoords && <p className={s.coordsNote}>GPS: {pkgCoords.lat.toFixed(5)}, {pkgCoords.lng.toFixed(5)}</p>}

                <div className={s.priceHighlight}>
                  Total: <strong>₦{pkgPrice.toLocaleString('en-NG')}</strong>
                  {pkgCollection === 'walk_in' && <span> — pay at the lab counter</span>}
                  {pkgCollection === 'home_visit' && bankSettings && <span> — bank transfer required</span>}
                </div>

                <button className={s.bookConfirmBtn} disabled={bookingSubmitting || (pkgCollection === 'home_visit' && !pkgAddress)} onClick={handleBookPackage}>
                  {bookingSubmitting ? <Loader inline size='sm' /> : pkgCollection === 'home_visit' && pkgPrice > 0 && bankSettings ? 'Continue to Payment' : 'Confirm Booking'}
                </button>
              </>
            ) : (
              <>
                <p className={s.bookPanelSub}>Transfer <strong>₦{pkgPrice.toLocaleString()}</strong> for your <strong>{selectedPkg.name}</strong> package, then enter your reference.</p>
                {bankSettings && (
                  <div className={s.bankCard}>
                    <BankRow label='Bank' value={bankSettings.companyBankName} />
                    <BankRow label='Account Number' value={bankSettings.companyAccountNumber} copyable />
                    <BankRow label='Account Name' value={bankSettings.companyAccountName} />
                    {bankSettings.directPaymentNote && <p className={s.bankNote}>{bankSettings.directPaymentNote}</p>}
                  </div>
                )}
                <input className={s.refInput} placeholder='Enter your bank transfer reference…' value={bookingRef} onChange={e => setBookingRef(e.target.value.toUpperCase())} autoComplete='off' />
                <button className={s.bookConfirmBtn} disabled={!bookingRef.trim() || bookingSubmitting} onClick={handleBookPackage}>
                  {bookingSubmitting ? <Loader inline size='sm' /> : 'Confirm Booking & Reference'}
                </button>
                <button className={s.backLink} onClick={() => setBookingStep('details')}>← Back</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
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

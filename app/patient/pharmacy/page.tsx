'use client'
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  FormEvent
} from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { downloadReceipt } from '@/lib/receipt'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}
interface Prescription {
  _id: string
  doctor: { name: string }
  medications: Medication[]
  diagnosis?: string
  status: string
  createdAt: string
  forwardedToPharmacy: boolean
}

interface OperatingHours {
  open?: string
  close?: string
  days?: string[]
}
interface PharmacyPartner {
  _id: string
  name: string
  address: string
  phone: string
  logo?: string
  coverageAreas?: string[]
  operatingHours?: OperatingHours
  drugCount?: number
}

interface Drug {
  _id: string
  name: string
  price: number
  unit: string
  requiresPrescription: boolean
  inStock: boolean
}
interface CartItem {
  drugId: string
  name: string
  price: number
  qty: number
  requiresPrescription: boolean
}

interface DrugSearchResult {
  drug: {
    _id: string
    name: string
    price: number
    unit: string
    requiresPrescription: boolean
  }
  pharmacy: {
    _id: string
    name: string
    address: string
    logo?: string
    coverageAreas?: string[]
    operatingHours?: OperatingHours
  }
}

interface PharmacyOrder {
  _id: string
  orderType?: 'prescription' | 'direct'
  prescription?:
    | { _id: string; medications: Medication[]; diagnosis?: string }
    | string
  items?: CartItem[]
  pharmacy: { name: string; address: string; phone: string }
  fulfillmentType: 'delivery' | 'pickup'
  deliveryAddress?: string
  status: string
  totalAmount: number
  adminApprovalStatus?: string
  createdAt: string
}

type Tab = 'shop' | 'prescription' | 'orders'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isPharmacyOpen (hours?: OperatingHours): boolean {
  if (!hours?.open || !hours?.close) return true
  const now = new Date()
  const day = now.toLocaleDateString('en-US', { weekday: 'short' })
  if (
    hours.days?.length &&
    !hours.days.some(d =>
      d.toLowerCase().startsWith(day.toLowerCase().slice(0, 3))
    )
  )
    return false
  const [oh, om] = hours.open.split(':').map(Number)
  const [ch, cm] = hours.close.split(':').map(Number)
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= oh * 60 + om && mins <= ch * 60 + cm
}

function PharmacyAvatar ({
  logo,
  name,
  size = 56
}: {
  logo?: string
  name: string
  size?: number
}) {
  const [err, setErr] = useState(false)
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
  const colors = [
    '#22C55E',
    '#3B82F6',
    '#8B5CF6',
    '#F59E0B',
    '#EF4444',
    '#14B8A6'
  ]
  const color = colors[name.charCodeAt(0) % colors.length]
  if (logo && !err) {
    return (
      <img
        src={logo}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
        onError={() => setErr(true)}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}33, ${color}66)`,
        border: `2px solid ${color}55`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.3,
        fontWeight: 800,
        color
      }}
    >
      {initials}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

function PharmacyContent () {
  const params = useSearchParams()
  const modal = useStatusModal()
  const [tab, setTab] = useState<Tab>('shop')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [partners, setPartners] = useState<PharmacyPartner[]>([])
  const [orders, setOrders] = useState<PharmacyOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [paystackPublicKey, setPaystackPublicKey] = useState('')
  const [paystackLoaded, setPaystackLoaded] = useState(false)

  // Global drug search
  const [drugQuery, setDrugQuery] = useState('')
  const [drugResults, setDrugResults] = useState<DrugSearchResult[]>([])
  const [drugSearching, setDrugSearching] = useState(false)
  const drugSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Shop tab
  const [shopPharmacy, setShopPharmacy] = useState('')
  const [shopPharmacyData, setShopPharmacyData] =
    useState<PharmacyPartner | null>(null)
  const [catalog, setCatalog] = useState<Drug[]>([])
  const [catalogDrugSearch, setCatalogDrugSearch] = useState('')
  const [catalogLoad, setCatalogLoad] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [shopFulfill, setShopFulfill] = useState<'pickup' | 'delivery'>(
    'pickup'
  )
  const [shopAddress, setShopAddress] = useState('')
  const [shopNotes, setShopNotes] = useState('')
  const [rxFile, setRxFile] = useState<File | null>(null)
  const rxInputRef = useRef<HTMLInputElement>(null)
  const [shopSub, setShopSub] = useState(false)

  // Prescription tab
  const [selected, setSelected] = useState<string | null>(null)
  const [pharmacyId, setPharmacyId] = useState('')
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>(
    'pickup'
  )
  const [rxAddress, setRxAddress] = useState('')
  const [rxNotes, setRxNotes] = useState('')
  const [rxSub, setRxSub] = useState(false)
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v2/inline.js'
    script.async = true
    script.onload = () => setPaystackLoaded(true)
    document.body.appendChild(script)
    return () => {
      try {
        document.body.removeChild(script)
      } catch {
        /* removed */
      }
    }
  }, [])

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://10.0.1.44:5000/api'
    fetch(`${base}/admin/public/content`)
      .then(r => r.json())
      .then(b => {
        if (b?.data?.paystackPublicKey)
          setPaystackPublicKey(b.data.paystackPublicKey)
      })
      .catch(() => {})

    Promise.all([
      api.get('/prescriptions/mine'),
      api.get('/pharmacy/partners'),
      api.get('/pharmacy/orders/mine')
    ])
      .then(([rxRes, parRes, ordRes]) => {
        const all: Prescription[] = rxRes.data.data?.prescriptions ?? []
        setPrescriptions(all.filter(p => p.status === 'active'))
        setPartners(parRes.data.data?.partners ?? [])
        setOrders(ordRes.data.data?.orders ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Handle incoming redirect from records page
  useEffect(() => {
    const rxId = params.get('prescriptionId')
    const tabParam = params.get('tab')
    if (tabParam === 'prescriptions') setTab('prescription')
    if (rxId) setSelected(rxId)
  }, [params])

  // Handle Paystack callback
  useEffect(() => {
    const ref = params.get('reference')
    if (!ref) return
    api
      .get(`/payments/verify/${ref}`)
      .then(() => {
        modal.show({
          variant: 'success',
          title: 'Payment Confirmed',
          message: 'Your order is being processed.'
        })
        setTab('orders')
        api
          .get('/pharmacy/orders/mine')
          .then(r => setOrders(r.data.data?.orders ?? []))
      })
      .catch(() => {})
  }, [params])

  // Load catalog when pharmacy selected
  useEffect(() => {
    if (!shopPharmacy) {
      setCatalog([])
      return
    }
    setCatalogLoad(true)
    api
      .get(`/pharmacy/${shopPharmacy}/catalog`)
      .then(r => setCatalog(r.data.data?.drugs ?? []))
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoad(false))
    setCart([])
    setCatalogDrugSearch('')
  }, [shopPharmacy])

  // ── Drug search (cross-pharmacy) ────────────────────────────────────────────

  useEffect(() => {
    if (drugSearchTimer.current) clearTimeout(drugSearchTimer.current)
    if (!drugQuery.trim()) {
      setDrugResults([])
      setDrugSearching(false)
      return
    }
    setDrugSearching(true)
    drugSearchTimer.current = setTimeout(async () => {
      try {
        const r = await api.get('/pharmacy/drugs/search', {
          params: { q: drugQuery }
        })
        setDrugResults(r.data.data?.results ?? [])
      } catch {
        setDrugResults([])
      }
      setDrugSearching(false)
    }, 380)
    return () => {
      if (drugSearchTimer.current) clearTimeout(drugSearchTimer.current)
    }
  }, [drugQuery])

  // ── Cart helpers ────────────────────────────────────────────────────────────

  function cartQty (drugId: string) {
    return cart.find(c => c.drugId === drugId)?.qty ?? 0
  }

  function changeQty (drug: Drug, delta: number) {
    setCart(prev => {
      const existing = prev.find(c => c.drugId === drug._id)
      if (!existing)
        return delta < 1
          ? prev
          : [
              ...prev,
              {
                drugId: drug._id,
                name: drug.name,
                price: drug.price,
                qty: 1,
                requiresPrescription: drug.requiresPrescription
              }
            ]
      const newQty = existing.qty + delta
      return newQty <= 0
        ? prev.filter(c => c.drugId !== drug._id)
        : prev.map(c => (c.drugId === drug._id ? { ...c, qty: newQty } : c))
    })
  }

  async function addFromSearch (result: DrugSearchResult) {
    const ph = partners.find(p => p._id === result.pharmacy._id)
    if (shopPharmacy && shopPharmacy !== result.pharmacy._id) {
      modal.show({
        variant: 'declined',
        title: 'Different Pharmacy',
        message: `Clear your current cart from ${shopPharmacyData?.name} first, or finish checking out before ordering from ${result.pharmacy.name}.`
      })
      return
    }
    if (!shopPharmacy) {
      setShopPharmacy(result.pharmacy._id)
      setShopPharmacyData(
        ph ?? {
          _id: result.pharmacy._id,
          name: result.pharmacy.name,
          address: result.pharmacy.address,
          logo: result.pharmacy.logo
        }
      )
    }
    const drug: Drug = {
      _id: result.drug._id as string,
      name: result.drug.name,
      price: result.drug.price,
      unit: result.drug.unit,
      requiresPrescription: result.drug.requiresPrescription,
      inStock: true
    }
    changeQty(drug, 1)
    setDrugQuery('')
    setDrugResults([])
    setTab('shop')
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const needsRx = cart.some(c => c.requiresPrescription)
  const filteredCatalog = catalog.filter(d =>
    d.name.toLowerCase().includes(catalogDrugSearch.toLowerCase())
  )

  // ── GPS ─────────────────────────────────────────────────────────────────────

  const [gpsLoading, setGpsLoading] = useState(false)
  function useGPS () {
    if (!navigator.geolocation) {
      modal.show({
        variant: 'declined',
        title: 'Not Supported',
        message: 'Geolocation is not available in this browser.'
      })
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setShopAddress(
          `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(
            5
          )}`
        )
        setGpsLoading(false)
      },
      () => {
        modal.show({
          variant: 'declined',
          title: 'Location Error',
          message: 'Could not get your location.'
        })
        setGpsLoading(false)
      }
    )
  }

  // ── Submit direct order ──────────────────────────────────────────────────────

  function buildForm (useCart = cart) {
    const form = new FormData()
    form.append('pharmacyId', shopPharmacy)
    form.append(
      'items',
      JSON.stringify(
        useCart.map(c => ({ drugId: c.drugId, qty: c.qty, name: c.name }))
      )
    )
    form.append('fulfillmentType', shopFulfill)
    if (shopFulfill === 'delivery') form.append('deliveryAddress', shopAddress)
    if (shopNotes) form.append('notes', shopNotes)
    if (rxFile) form.append('prescription', rxFile)
    return form
  }

  async function submitDirectOrder (e: FormEvent) {
    e.preventDefault()
    if (!cart.length) {
      modal.show({
        variant: 'declined',
        title: 'Cart Empty',
        message: 'Add at least one item.'
      })
      return
    }
    if (shopFulfill === 'delivery' && !shopAddress.trim()) {
      modal.show({
        variant: 'declined',
        title: 'Missing Address',
        message: 'Enter delivery address.'
      })
      return
    }
    if (needsRx && !rxFile) {
      modal.show({
        variant: 'declined',
        title: 'Prescription Required',
        message: 'Upload a prescription for Rx-required drugs.'
      })
      return
    }

    if (cartTotal > 0) {
      if (!paystackLoaded) {
        modal.show({
          variant: 'declined',
          title: 'Please Wait',
          message: 'Payment system is still loading. Try again in a moment.'
        })
        return
      }
      setShopSub(true)
      try {
        const r = await api.post('/pharmacy/order/direct', buildForm())
        const orderId: string = r.data.data?.order?._id
        setOrders(prev => [r.data.data?.order, ...prev])
        const payRes = await api.post('/payments/initiate', {
          type: 'pharmacy',
          referenceId: orderId,
          amount: cartTotal
        })
        const { accessCode, reference } = payRes.data.data
        const amountSnap = cartTotal
        const cartSnap = [...cart].map(c => c.name)
        setCart([])
        setShopPharmacy('')
        setShopPharmacyData(null)
        setShopAddress('')
        setShopNotes('')
        setRxFile(null)
        setShopSub(false)
        const paystack = new (window as any).PaystackPop()
        paystack.newTransaction({
          key: paystackPublicKey,
          accessCode,
          onSuccess: async () => {
            try {
              await api.get(`/payments/verify/${reference}`)
              downloadReceipt({
                bookingRef: `#${orderId.slice(-8).toUpperCase()}`,
                tests: cartSnap,
                amount: amountSnap,
                collectionType:
                  shopFulfill === 'pickup' ? 'walk_in' : 'home_visit',
                transactionRef: reference
              })
              modal.show({
                variant: 'success',
                title: 'Order Confirmed!',
                message:
                  shopFulfill === 'pickup'
                    ? 'Show your receipt at the pharmacy when picking up.'
                    : 'Payment confirmed. Your delivery order is on the way.',
                actionLabel: 'View Orders',
                onAction: () => setTab('orders')
              })
              api
                .get('/pharmacy/orders/mine')
                .then(rv => setOrders(rv.data.data?.orders ?? []))
                .catch(() => {})
            } catch {
              /* silent */
            }
          },
          onCancel: () =>
            modal.show({
              variant: 'declined',
              title: 'Payment Cancelled',
              message: 'Your order is saved — retry from My Orders.',
              actionLabel: 'View Orders',
              onAction: () => setTab('orders')
            })
        })
      } catch (err: unknown) {
        modal.show({
          variant: 'declined',
          title: 'Order Failed',
          message:
            (err as any)?.response?.data?.message ?? 'Failed to place order.'
        })
        setShopSub(false)
      }
      return
    }

    // Free order
    setShopSub(true)
    try {
      const r = await api.post('/pharmacy/order/direct', buildForm())
      setOrders(prev => [r.data.data?.order, ...prev])
      setCart([])
      setShopPharmacy('')
      setShopPharmacyData(null)
      setShopAddress('')
      setShopNotes('')
      setRxFile(null)
      modal.show({
        variant: 'success',
        title: 'Order Placed!',
        message: 'Your order has been submitted.'
      })
      setTimeout(() => setTab('orders'), 2000)
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Order Failed',
        message:
          (err as any)?.response?.data?.message ?? 'Failed to place order.'
      })
    }
    setShopSub(false)
  }

  async function submitRxOrder (e: FormEvent) {
    e.preventDefault()
    if (!selected) {
      modal.show({ variant: 'declined', title: 'No Prescription', message: 'Select a prescription.' })
      return
    }
    if (!pharmacyId) {
      modal.show({ variant: 'declined', title: 'No Pharmacy', message: 'Select a pharmacy.' })
      return
    }
    if (fulfillment === 'delivery' && !rxAddress.trim()) {
      modal.show({ variant: 'declined', title: 'Missing Address', message: 'Enter delivery address.' })
      return
    }
    if (!paystackLoaded) {
      modal.show({ variant: 'declined', title: 'Please Wait', message: 'Payment system is still loading. Try again in a moment.' })
      return
    }
    setRxSub(true)
    try {
      const r = await api.post('/pharmacy/order', {
        prescriptionId: selected,
        pharmacyId,
        fulfillmentType: fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? rxAddress : undefined,
        notes: rxNotes || undefined
      })
      const order = r.data.data?.order
      const totalAmount: number = r.data.data?.totalAmount ?? order?.totalAmount ?? 0
      setOrders(prev => [order, ...prev])

      const rxSelected = prescriptions.find(p => p._id === selected)
      const medNames = rxSelected?.medications?.map(m => m.name) ?? []

      if (totalAmount > 0) {
        const payRes = await api.post('/payments/initiate', { type: 'pharmacy', referenceId: order._id, amount: totalAmount })
        const { accessCode, reference } = payRes.data.data
        setSelected(null); setPharmacyId(''); setRxAddress(''); setRxNotes('')
        setRxSub(false)
        const paystack = new (window as any).PaystackPop()
        paystack.newTransaction({
          key: paystackPublicKey,
          accessCode,
          onSuccess: async () => {
            try {
              await api.get(`/payments/verify/${reference}`)
              downloadReceipt({
                bookingRef: `#${order._id.slice(-8).toUpperCase()}`,
                tests: medNames,
                amount: totalAmount,
                collectionType: fulfillment === 'pickup' ? 'walk_in' : 'home_visit',
                transactionRef: reference
              })
              modal.show({
                variant: 'success',
                title: 'Order Confirmed!',
                message: fulfillment === 'pickup'
                  ? 'Payment received. Show your receipt at the pharmacy when picking up.'
                  : 'Payment confirmed. Your delivery is on the way.',
                actionLabel: 'View Orders',
                onAction: () => setTab('orders')
              })
              api.get('/pharmacy/orders/mine').then(rv => setOrders(rv.data.data?.orders ?? [])).catch(() => {})
            } catch { /* silent */ }
          },
          onCancel: () => modal.show({
            variant: 'declined',
            title: 'Payment Cancelled',
            message: 'Your order is saved — retry from My Orders.',
            actionLabel: 'View Orders',
            onAction: () => setTab('orders')
          })
        })
      } else {
        // Drugs not in pharmacy catalog — pharmacy will confirm price
        modal.show({
          variant: 'pending',
          title: 'Order Placed',
          message: 'Your prescription has been sent to the pharmacy. They will confirm the price and you can pay from My Orders.',
          actionLabel: 'View Orders',
          onAction: () => setTab('orders')
        })
        setSelected(null); setPharmacyId(''); setRxAddress(''); setRxNotes('')
        setRxSub(false)
      }
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Order Failed', message: (err as any)?.response?.data?.message ?? 'Failed to place order.' })
      setRxSub(false)
    }
  }

  async function payForOrder (order: PharmacyOrder) {
    if (!paystackLoaded) {
      modal.show({
        variant: 'declined',
        title: 'Please Wait',
        message: 'Payment system still loading.'
      })
      return
    }
    setPayingOrderId(order._id)
    try {
      const payRes = await api.post('/payments/initiate', {
        type: 'pharmacy',
        referenceId: order._id,
        amount: order.totalAmount
      })
      const { accessCode, reference } = payRes.data.data
      const amountSnap = order.totalAmount
      setPayingOrderId(null)
      const paystack = new (window as any).PaystackPop()
      paystack.newTransaction({
        key: paystackPublicKey,
        accessCode,
        onSuccess: async () => {
          try {
            await api.get(`/payments/verify/${reference}`)
            downloadReceipt({
              bookingRef: `#${order._id.slice(-8).toUpperCase()}`,
              tests: [],
              amount: amountSnap,
              collectionType: 'home_visit',
              transactionRef: reference
            })
            modal.show({
              variant: 'success',
              title: 'Payment Confirmed!',
              message: 'Your pharmacy order is confirmed.'
            })
            api
              .get('/pharmacy/orders/mine')
              .then(rv => setOrders(rv.data.data?.orders ?? []))
              .catch(() => {})
          } catch {
            /* silent */
          }
        },
        onCancel: () =>
          modal.show({
            variant: 'declined',
            title: 'Payment Cancelled',
            message: 'You can retry from My Orders.'
          })
      })
    } catch (err: unknown) {
      modal.show({
        variant: 'declined',
        title: 'Error',
        message:
          (err as any)?.response?.data?.message ?? 'Could not initiate payment.'
      })
      setPayingOrderId(null)
    }
  }

  const orderedRxIds = new Set(
    orders.map(o =>
      typeof o.prescription === 'object' ? o.prescription?._id : o.prescription
    )
  )

  const isPendingPayment = (o: PharmacyOrder) =>
    o.status === 'pending' &&
    o.totalAmount > 0 &&
    (!o.adminApprovalStatus ||
      o.adminApprovalStatus === 'na' ||
      o.adminApprovalStatus === 'approved')

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={s.page}>
      {/* ── Global Drug Search Hero ── */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <p className={s.heroLabel}>iBam Pharmacy</p>
          <h1 className={s.heroTitle}>
            Find any medicine,
            <br />
            at any pharmacy.
          </h1>
          <div className={s.heroSearch}>
            <span className={s.heroSearchIcon}>💊</span>
            <input
              className={s.heroSearchInput}
              placeholder='Search paracetamol, amoxicillin, insulin… across all pharmacies'
              value={drugQuery}
              onChange={e => setDrugQuery(e.target.value)}
              autoComplete='off'
            />
            {drugQuery && (
              <button
                className={s.heroSearchClear}
                onClick={() => {
                  setDrugQuery('')
                  setDrugResults([])
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Drug search results */}
          {(drugSearching || drugResults.length > 0) && (
            <div className={s.drugResultsPanel}>
              {drugSearching ? (
                <div className={s.drugResultSearching}>
                  <Loader label='Searching pharmacies…' />
                </div>
              ) : drugResults.length === 0 ? (
                <p className={s.drugResultEmpty}>
                  No pharmacy carries &quot;{drugQuery}&quot; right now.
                </p>
              ) : (
                <>
                  <p className={s.drugResultCount}>
                    {drugResults.length} result
                    {drugResults.length !== 1 ? 's' : ''} across{' '}
                    {new Set(drugResults.map(r => r.pharmacy._id)).size}{' '}
                    pharmacies
                  </p>
                  <div className={s.drugResultList}>
                    {drugResults.map((r, i) => (
                      <div key={i} className={s.drugResultCard}>
                        <PharmacyAvatar
                          logo={r.pharmacy.logo}
                          name={r.pharmacy.name}
                          size={36}
                        />
                        <div className={s.drugResultInfo}>
                          <p className={s.drugResultName}>{r.drug.name}</p>
                          <p className={s.drugResultMeta}>
                            {r.pharmacy.name} ·{' '}
                            <strong>₦{r.drug.price.toLocaleString()}</strong>/
                            {r.drug.unit}
                          </p>
                        </div>
                        {r.drug.requiresPrescription && (
                          <span className={s.rxPill}>Rx</span>
                        )}
                        <button
                          className={s.drugResultBtn}
                          onClick={() => addFromSearch(r)}
                        >
                          Add to Cart →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={s.tabBar}>
        {(
          [
            ['shop', '🏪', 'Shop Drugs'],
            ['prescription', '📋', 'Prescriptions'],
            ['orders', '📦', 'My Orders']
          ] as const
        ).map(([t, icon, label]) => (
          <button
            key={t}
            className={`${s.tab} ${tab === t ? s.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            <span className={s.tabIcon}>{icon}</span>
            <span>{label}</span>
            {t === 'orders' && orders.length > 0 && (
              <span className={s.tabBadge}>{orders.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className={s.content}>
        {loading ? (
          <div className={s.centered}>
            <Loader label='Loading pharmacy…' />
          </div>
        ) : /* ─── SHOP TAB ─── */
        tab === 'shop' ? (
          !shopPharmacy ? (
            <div>
              <p className={s.sectionLabel}>Select a pharmacy to shop</p>
              {partners.length === 0 ? (
                <div className={s.emptyState}>
                  <span>🏥</span>
                  <p>No pharmacy partners available right now.</p>
                </div>
              ) : (
                <div className={s.pharmacyGrid}>
                  {partners.map(ph => {
                    const open = isPharmacyOpen(ph.operatingHours)
                    return (
                      <div
                        key={ph._id}
                        className={s.pharmacyCard}
                        onClick={() => {
                          setShopPharmacy(ph._id)
                          setShopPharmacyData(ph)
                        }}
                      >
                        <div className={s.pharmacyCardTop}>
                          <span className={open ? s.openBadge : s.closedBadge}>
                            {open ? '🟢 Open' : '🔴 Closed'}
                          </span>
                          {ph.operatingHours?.close && (
                            <span className={s.hoursText}>
                              until {ph.operatingHours.close}
                            </span>
                          )}
                        </div>
                        <div className={s.pharmacyCardBody}>
                          <PharmacyAvatar
                            logo={ph.logo}
                            name={ph.name}
                            size={64}
                          />
                          <div className={s.pharmacyCardInfo}>
                            <p className={s.pharmacyName}>{ph.name}</p>
                            <p className={s.pharmacyAddr}>📍 {ph.address}</p>
                            {ph.drugCount != null && (
                              <p className={s.pharmacyDrugCount}>
                                💊 {ph.drugCount} drug
                                {ph.drugCount !== 1 ? 's' : ''} available
                              </p>
                            )}
                          </div>
                        </div>
                        {ph.coverageAreas && ph.coverageAreas.length > 0 && (
                          <div className={s.coverageTags}>
                            {ph.coverageAreas.slice(0, 4).map(a => (
                              <span key={a} className={s.coverageTag}>
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                        <button className={s.pharmacyShopBtn}>
                          Browse Drugs →
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Pharmacy selected — catalog view */
            <form onSubmit={submitDirectOrder} className={s.catalogView}>
              {/* Pharmacy header bar */}
              <div className={s.catalogHeader}>
                <button
                  type='button'
                  className={s.backBtn}
                  onClick={() => {
                    setShopPharmacy('')
                    setShopPharmacyData(null)
                    setCart([])
                  }}
                >
                  ← Back
                </button>
                <div className={s.catalogHeaderInfo}>
                  <PharmacyAvatar
                    logo={shopPharmacyData?.logo}
                    name={shopPharmacyData?.name ?? ''}
                    size={40}
                  />
                  <div>
                    <p className={s.catalogPharmacyName}>
                      {shopPharmacyData?.name}
                    </p>
                    <p className={s.catalogPharmacyAddr}>
                      {shopPharmacyData?.address}
                    </p>
                  </div>
                </div>
                {cart.length > 0 && (
                  <div className={s.cartPill}>
                    🛒 {cart.reduce((s, c) => s + c.qty, 0)} · ₦
                    {cartTotal.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Catalog search */}
              <div className={s.catalogSearch}>
                <span className={s.catalogSearchIcon}>🔍</span>
                <input
                  className={s.catalogSearchInput}
                  placeholder='Search drugs in this pharmacy…'
                  value={catalogDrugSearch}
                  onChange={e => setCatalogDrugSearch(e.target.value)}
                />
              </div>

              {/* Drug grid */}
              {catalogLoad ? (
                <div className={s.centered}>
                  <Loader label='Loading catalog…' />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className={s.emptyState}>
                  <span>🔍</span>
                  <p>
                    No drugs found
                    {catalogDrugSearch ? ` for "${catalogDrugSearch}"` : ''}.
                  </p>
                </div>
              ) : (
                <div className={s.drugGrid}>
                  {filteredCatalog.map(drug => {
                    const qty = cartQty(drug._id)
                    return (
                      <div key={drug._id} className={s.drugCard}>
                        <div className={s.drugCardLeft}>
                          <div className={s.drugIconCircle}>💊</div>
                          <div className={s.drugCardInfo}>
                            <p className={s.drugName}>{drug.name}</p>
                            <p className={s.drugUnit}>{drug.unit}</p>
                            {drug.requiresPrescription && (
                              <span className={s.rxTag}>Rx Required</span>
                            )}
                          </div>
                        </div>
                        <div className={s.drugCardRight}>
                          <p className={s.drugPrice}>
                            ₦{drug.price.toLocaleString()}
                          </p>
                          {qty === 0 ? (
                            <button
                              type='button'
                              className={s.addBtn}
                              onClick={() => changeQty(drug, 1)}
                            >
                              + Add
                            </button>
                          ) : (
                            <div className={s.qtyControl}>
                              <button
                                type='button'
                                className={s.qtyBtn}
                                onClick={() => changeQty(drug, -1)}
                              >
                                −
                              </button>
                              <span className={s.qtyNum}>{qty}</span>
                              <button
                                type='button'
                                className={s.qtyBtn}
                                onClick={() => changeQty(drug, 1)}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Cart summary + checkout */}
              {cart.length > 0 && (
                <div className={s.checkoutPanel}>
                  <p className={s.checkoutTitle}>Your Cart</p>
                  <div className={s.cartItems}>
                    {cart.map(c => (
                      <div key={c.drugId} className={s.cartItem}>
                        <span className={s.cartItemName}>{c.name}</span>
                        <span className={s.cartItemQty}>×{c.qty}</span>
                        <span className={s.cartItemPrice}>
                          ₦{(c.price * c.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className={s.cartTotalRow}>
                      <span>Total</span>
                      <span className={s.cartTotalVal}>
                        ₦{cartTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Fulfillment */}
                  <p className={s.checkoutLabel}>Fulfillment</p>
                  <div className={s.fulfillRow}>
                    {(['pickup', 'delivery'] as const).map(f => (
                      <label
                        key={f}
                        className={`${s.fulfillOpt} ${
                          shopFulfill === f ? s.fulfillOptActive : ''
                        }`}
                      >
                        <input
                          type='radio'
                          name='shopFulfill'
                          value={f}
                          checked={shopFulfill === f}
                          onChange={() => setShopFulfill(f)}
                        />
                        <span className={s.fulfillIcon}>
                          {f === 'pickup' ? '🏪' : '🚚'}
                        </span>
                        <span className={s.fulfillLabel}>
                          {f === 'pickup' ? 'Pickup' : 'Home Delivery'}
                        </span>
                      </label>
                    ))}
                  </div>
                  {shopFulfill === 'delivery' && (
                    <div className={s.locationRow}>
                      <input
                        className={s.textInput}
                        placeholder='Delivery address…'
                        value={shopAddress}
                        onChange={e => setShopAddress(e.target.value)}
                      />
                      <button
                        type='button'
                        className={s.gpsBtn}
                        onClick={useGPS}
                        disabled={gpsLoading}
                      >
                        📍 GPS
                      </button>
                    </div>
                  )}

                  {needsRx && (
                    <div
                      className={s.rxUpload}
                      onClick={() => rxInputRef.current?.click()}
                    >
                      <input
                        ref={rxInputRef}
                        type='file'
                        accept='image/*,.pdf'
                        className={s.hiddenInput}
                        onChange={e => setRxFile(e.target.files?.[0] ?? null)}
                      />
                      {rxFile ? (
                        <p className={s.rxFileName}>📎 {rxFile.name}</p>
                      ) : (
                        <p>📋 Prescription required — tap to upload</p>
                      )}
                    </div>
                  )}

                  {shopNotes !== undefined && (
                    <textarea
                      className={s.notesInput}
                      placeholder='Add notes for the pharmacy (optional)…'
                      value={shopNotes}
                      onChange={e => setShopNotes(e.target.value)}
                      rows={2}
                    />
                  )}

                  <div className={s.paymentBanner}>
                    <span>🔒</span>
                    <p>
                      {cartTotal > 0
                        ? `Pay ₦${cartTotal.toLocaleString()} securely via Paystack. ${
                            shopFulfill === 'pickup'
                              ? 'Show your receipt at the pharmacy.'
                              : ''
                          }`
                        : 'This order is free.'}
                    </p>
                  </div>

                  <button
                    type='submit'
                    className={s.submitBtn}
                    disabled={shopSub}
                  >
                    {shopSub ? (
                      <Loader label='Placing order…' />
                    ) : cartTotal > 0 ? (
                      `Pay ₦${cartTotal.toLocaleString()} & Order`
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              )}
            </form>
          )
        ) : /* ─── PRESCRIPTION TAB ─── */
        tab === 'prescription' ? (
          <form onSubmit={submitRxOrder} className={s.rxForm}>
            <p className={s.sectionLabel}>Select Pharmacy</p>
            <div className={s.partnerList}>
              {partners.map(ph => (
                <label
                  key={ph._id}
                  className={`${s.partnerOpt} ${
                    pharmacyId === ph._id ? s.partnerOptActive : ''
                  }`}
                >
                  <input
                    type='radio'
                    name='rxPharmacy'
                    value={ph._id}
                    checked={pharmacyId === ph._id}
                    onChange={() => setPharmacyId(ph._id)}
                  />
                  <PharmacyAvatar logo={ph.logo} name={ph.name} size={36} />
                  <div className={s.partnerOptInfo}>
                    <p className={s.partnerOptName}>{ph.name}</p>
                    <p className={s.partnerOptAddr}>{ph.address}</p>
                  </div>
                  {pharmacyId === ph._id && (
                    <span className={s.checkMark}>✓</span>
                  )}
                </label>
              ))}
            </div>

            <p className={s.sectionLabel}>Select Prescription</p>
            {prescriptions.length === 0 ? (
              <div className={s.emptyState}>
                <span>📋</span>
                <p>
                  No active prescriptions. Doctor prescriptions forwarded to
                  pharmacies appear here.
                </p>
              </div>
            ) : (
              <div className={s.rxList}>
                {prescriptions.map(rx => (
                  <label
                    key={rx._id}
                    className={`${s.rxCard} ${
                      selected === rx._id ? s.rxCardActive : ''
                    } ${orderedRxIds.has(rx._id) ? s.rxCardOrdered : ''}`}
                  >
                    <input
                      type='radio'
                      name='prescription'
                      value={rx._id}
                      disabled={orderedRxIds.has(rx._id)}
                      onChange={() => setSelected(rx._id)}
                    />
                    <div className={s.rxCardIcon}>📋</div>
                    <div className={s.rxCardInfo}>
                      <p className={s.rxCardMeds}>
                        {rx.medications.map(m => m.name).join(', ')}
                      </p>
                      <p className={s.rxCardMeta}>
                        Dr. {rx.doctor.name} ·{' '}
                        {new Date(rx.createdAt).toLocaleDateString('en-NG', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      {rx.diagnosis && (
                        <p className={s.rxCardDiag}>{rx.diagnosis}</p>
                      )}
                      {orderedRxIds.has(rx._id) && (
                        <span className={s.orderedBadge}>Already Ordered</span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <p className={s.sectionLabel}>Fulfillment</p>
            <div className={s.fulfillRow}>
              {(['pickup', 'delivery'] as const).map(f => (
                <label
                  key={f}
                  className={`${s.fulfillOpt} ${
                    fulfillment === f ? s.fulfillOptActive : ''
                  }`}
                >
                  <input
                    type='radio'
                    name='rxFulfill'
                    value={f}
                    checked={fulfillment === f}
                    onChange={() => setFulfillment(f)}
                  />
                  <span className={s.fulfillIcon}>
                    {f === 'pickup' ? '🏪' : '🚚'}
                  </span>
                  <span className={s.fulfillLabel}>
                    {f === 'pickup' ? 'Pickup' : 'Home Delivery'}
                  </span>
                </label>
              ))}
            </div>
            {fulfillment === 'delivery' && (
              <input
                className={s.textInput}
                placeholder='Delivery address…'
                value={rxAddress}
                onChange={e => setRxAddress(e.target.value)}
              />
            )}

            <textarea
              className={s.notesInput}
              placeholder='Notes for pharmacy (optional)…'
              value={rxNotes}
              onChange={e => setRxNotes(e.target.value)}
              rows={2}
            />

            <div
              className={s.paymentBanner}
              style={{
                borderColor: 'rgba(96,165,250,0.25)',
                background: 'rgba(59,130,246,0.06)'
              }}
            >
              <span>🔒</span>
              <p>
                If your medications are in the pharmacy catalog, payment is
                completed immediately and a receipt is generated. Otherwise the
                pharmacy will confirm the price and you can pay from My Orders.
              </p>
            </div>

            <button type='submit' className={s.submitBtn} disabled={rxSub}>
              {rxSub ? <Loader label='Processing…' /> : 'Order Prescription'}
            </button>
          </form>
        ) : (
          /* ─── ORDERS TAB ─── */
          <div className={s.ordersList}>
            {orders.length === 0 ? (
              <div className={s.emptyState}>
                <span>📦</span>
                <p>
                  No orders yet. Shop for drugs or send a prescription above.
                </p>
              </div>
            ) : (
              orders.map(order => {
                const rx =
                  typeof order.prescription === 'object'
                    ? order.prescription
                    : null
                const pending = isPendingPayment(order)
                return (
                  <div key={order._id} className={s.orderCard}>
                    <div className={s.orderCardTop}>
                      <div className={s.orderCardLeft}>
                        <div className={s.orderPharmacyAvatar}>🏥</div>
                        <div className={s.orderCardInfo}>
                          <p className={s.orderPharmacyName}>
                            {order.pharmacy?.name}
                          </p>
                          <p className={s.orderMeta}>
                            {new Date(order.createdAt).toLocaleDateString(
                              'en-NG',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }
                            )}
                            {' · '}
                            {order.fulfillmentType === 'pickup'
                              ? '🏪 Pickup'
                              : '🚚 Delivery'}
                          </p>
                          {rx && (
                            <p className={s.orderRxMeds}>
                              {rx.medications?.map(m => m.name).join(', ')}
                            </p>
                          )}
                          {order.items && order.items.length > 0 && (
                            <p className={s.orderRxMeds}>
                              {order.items
                                .map(i => i.name)
                                .slice(0, 3)
                                .join(', ')}
                              {order.items.length > 3
                                ? ` +${order.items.length - 3} more`
                                : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={s.orderCardRight}>
                        <span
                          className={`${s.statusBadge} ${
                            s[`status_${order.status}`]
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.totalAmount > 0 && (
                          <span className={s.orderAmount}>
                            ₦{order.totalAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {pending && (
                      <div className={s.orderCardFooter}>
                        <p className={s.pendingNote}>
                          Payment pending — tap to complete your order.
                        </p>
                        <button
                          className={s.payNowBtn}
                          disabled={payingOrderId === order._id}
                          onClick={() => payForOrder(order)}
                        >
                          {payingOrderId === order._id ? (
                            <Loader label='Opening payment…' />
                          ) : (
                            `Pay ₦${order.totalAmount.toLocaleString()} Now`
                          )}
                        </button>
                      </div>
                    )}
                    {order.status === 'ready' &&
                      order.fulfillmentType === 'pickup' && (
                        <div className={s.orderCardFooter}>
                          <p className={s.readyNote}>
                            ✅ Ready for pickup! Show your booking ref{' '}
                            <strong>
                              #{order._id.slice(-8).toUpperCase()}
                            </strong>{' '}
                            at the pharmacy.
                          </p>
                        </div>
                      )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PharmacyPage () {
  return (
    <Suspense fallback={<Loader label='Loading pharmacy…' />}>
      <PharmacyContent />
    </Suspense>
  )
}

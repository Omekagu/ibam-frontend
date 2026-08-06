'use client'
import { Suspense, useEffect, useState, useRef, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'
import { MapPinIcon, PillIcon, CheckCircleIcon, TruckIcon } from '@/components/icons'

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions?: string }
interface Prescription {
  _id: string
  doctor: { name: string }
  medications: Medication[]
  diagnosis?: string
  status: string
  createdAt: string
  forwardedToPharmacy: boolean
}
interface PharmacyPartner { _id: string; name: string; address: string; phone: string }
interface Drug { _id: string; name: string; price: number; unit: string; requiresPrescription: boolean; inStock: boolean }
interface CartItem { drugId: string; name: string; price: number; qty: number; requiresPrescription: boolean }
interface PharmacyOrder {
  _id: string
  orderType?: 'prescription' | 'direct'
  prescription?: { _id: string; medications: Medication[]; diagnosis?: string } | string
  items?: CartItem[]
  pharmacy: { name: string; address: string; phone: string }
  fulfillmentType: 'delivery' | 'pickup'
  deliveryAddress?: string
  status: string
  totalAmount: number
  adminApprovalStatus?: string
  createdAt: string
}
interface BankSettings {
  companyBankName: string
  companyAccountNumber: string
  companyAccountName: string
  directPaymentNote?: string
}

type Tab = 'shop' | 'prescription' | 'orders'

function PharmacyContent () {
  const params = useSearchParams()
  const modal = useStatusModal()
  const [tab,           setTab]          = useState<Tab>('shop')
  const [prescriptions, setPrescriptions]= useState<Prescription[]>([])
  const [partners,      setPartners]     = useState<PharmacyPartner[]>([])
  const [orders,        setOrders]       = useState<PharmacyOrder[]>([])
  const [loading,       setLoading]      = useState(true)
  const [bankSettings,  setBankSettings] = useState<BankSettings | null>(null)

  // shop tab
  const [shopPharmacy,      setShopPharmacy]      = useState('')
  const [catalog,           setCatalog]           = useState<Drug[]>([])
  const [catalogLoad,       setCatalogLoad]       = useState(false)
  const [cart,              setCart]              = useState<CartItem[]>([])
  const [shopFulfill,       setShopFulfill]       = useState<'pickup' | 'delivery'>('pickup')
  const [shopAddress,       setShopAddress]       = useState('')
  const [shopPickupAddr,    setShopPickupAddr]    = useState('')
  const [shopPickupCoords,  setShopPickupCoords]  = useState<{ lat: number; lng: number } | null>(null)
  const [shopPickupLoading, setShopPickupLoading] = useState(false)
  const [shopNotes,         setShopNotes]         = useState('')
  const [rxFile,            setRxFile]            = useState<File | null>(null)
  const rxInputRef = useRef<HTMLInputElement>(null)
  const [shopSub,           setShopSub]           = useState(false)

  // Bank transfer modal for direct delivery orders
  const [showPayModal,   setShowPayModal]   = useState(false)
  const [transferRef,    setTransferRef]    = useState('')
  const [submittingRef,  setSubmittingRef]  = useState(false)
  const pendingCartRef = useRef<CartItem[]>([])
  const pendingAmountRef = useRef(0)

  // prescription tab
  const [selected,       setSelected]      = useState<string | null>(null)
  const [pharmacyId,     setPharmacyId]    = useState('')
  const [fulfillment,    setFulfillment]   = useState<'delivery' | 'pickup'>('pickup')
  const [rxAddress,      setRxAddress]     = useState('')
  const [rxPickupAddr,   setRxPickupAddr]  = useState('')
  const [rxPickupCoords, setRxPickupCoords]= useState<{ lat: number; lng: number } | null>(null)
  const [rxNotes,        setRxNotes]       = useState('')
  const [rxSub,          setRxSub]         = useState(false)

  // Bank transfer for order in orders tab (prescription orders where pharmacy set a price)
  const [orderTransferRef, setOrderTransferRef] = useState<Record<string, string>>({})
  const [orderPayPanelId,  setOrderPayPanelId]  = useState<string | null>(null)
  const [submittingOrder,  setSubmittingOrder]  = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/prescriptions/mine'),
      api.get('/pharmacy/partners'),
      api.get('/pharmacy/orders/mine'),
      api.get('/payments/settings'),
    ]).then(([rxRes, parRes, ordRes, payRes]) => {
      const all: Prescription[] = rxRes.data.data?.prescriptions ?? []
      setPrescriptions(all.filter(p => p.forwardedToPharmacy))
      setPartners(parRes.data.data?.partners ?? [])
      setOrders(ordRes.data.data?.orders ?? [])
      const ps = payRes.data.data?.settings
      if (ps?.directPaymentEnabled) setBankSettings(ps)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Handle Paystack callback (kept for backwards compatibility with existing orders)
  useEffect(() => {
    const ref = params.get('reference')
    if (!ref) return
    api.get(`/payments/verify/${ref}`)
      .then(() => {
        modal.show({ variant: 'success', title: 'Payment Confirmed', message: 'Your order is being processed.' })
        setTab('orders')
        api.get('/pharmacy/orders/mine').then(r => setOrders(r.data.data?.orders ?? []))
      }).catch(() => {})
  }, [params])

  useEffect(() => {
    if (!shopPharmacy) { setCatalog([]); return }
    setCatalogLoad(true)
    api.get(`/pharmacy/${shopPharmacy}/catalog`)
      .then(r => setCatalog(r.data.data?.drugs ?? []))
      .catch(() => setCatalog([]))
      .finally(() => setCatalogLoad(false))
    setCart([])
  }, [shopPharmacy])

  function cartQty (drugId: string) { return cart.find(c => c.drugId === drugId)?.qty ?? 0 }

  function changeQty (drug: Drug, delta: number) {
    setCart(prev => {
      const existing = prev.find(c => c.drugId === drug._id)
      if (!existing) {
        return delta < 1 ? prev : [...prev, { drugId: drug._id, name: drug.name, price: drug.price, qty: 1, requiresPrescription: drug.requiresPrescription }]
      }
      const newQty = existing.qty + delta
      return newQty <= 0 ? prev.filter(c => c.drugId !== drug._id) : prev.map(c => c.drugId === drug._id ? { ...c, qty: newQty } : c)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const needsRx = cart.some(c => c.requiresPrescription)

  function useGPS (setAddr: (a: string) => void, setCoords: (c: { lat: number; lng: number } | null) => void, setLoad: (l: boolean) => void) {
    if (!navigator.geolocation) { alert('Geolocation not supported in this browser.'); return }
    setLoad(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setAddr(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setLoad(false)
      },
      () => { alert('Could not get your location.'); setLoad(false) }
    )
  }

  function buildDirectForm (useCart = cart) {
    const form = new FormData()
    form.append('pharmacyId', shopPharmacy)
    form.append('items', JSON.stringify(useCart.map(c => ({ drugId: c.drugId, qty: c.qty, name: c.name }))))
    form.append('fulfillmentType', shopFulfill)
    if (shopFulfill === 'delivery') form.append('deliveryAddress', shopAddress)
    if (shopFulfill === 'pickup' && (shopPickupAddr || shopPickupCoords)) {
      form.append('pickupLocation', JSON.stringify({ address: shopPickupAddr, ...shopPickupCoords }))
    }
    if (shopNotes) form.append('notes', shopNotes)
    if (rxFile) form.append('prescription', rxFile)
    return form
  }

  async function submitDirectOrder (e: FormEvent) {
    e.preventDefault()
    if (!cart.length) { modal.show({ variant: 'declined', title: 'Cart Empty', message: 'Add at least one item to your cart.' }); return }
    if (shopFulfill === 'delivery' && !shopAddress.trim()) { modal.show({ variant: 'declined', title: 'Missing Address', message: 'Enter delivery address.' }); return }
    if (needsRx && !rxFile) { modal.show({ variant: 'declined', title: 'Prescription Required', message: 'Upload a prescription for Rx-required drugs.' }); return }

    // Delivery with known total + bank configured → show payment modal first, order placed after reference
    if (shopFulfill === 'delivery' && cartTotal > 0 && bankSettings) {
      pendingCartRef.current   = [...cart]
      pendingAmountRef.current = cartTotal
      setShowPayModal(true)
      return
    }

    // Pickup OR delivery without bank → place order directly
    setShopSub(true)
    try {
      const r = await api.post('/pharmacy/order/direct', buildDirectForm())
      setOrders(prev => [r.data.data?.order, ...prev])
      setCart([]); setShopPharmacy(''); setShopAddress(''); setShopNotes(''); setRxFile(null)
      if (shopFulfill === 'pickup') {
        modal.show({
          variant: 'success',
          title: 'Order Placed!',
          message: `Visit the pharmacy and pay ₦${cartTotal.toLocaleString()} at the counter. They will confirm your payment.`,
        })
      } else {
        modal.show({
          variant: 'pending',
          title: 'Order Placed!',
          message: 'Your order has been submitted. Our team will contact you with payment details and delivery confirmation.',
        })
      }
      setTimeout(() => setTab('orders'), 3000)
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Order Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to place order.' })
    }
    setShopSub(false)
  }

  // Places the delivery order AND submits the transfer reference together
  async function handleSubmitDirectTransfer () {
    if (!transferRef.trim()) return
    setSubmittingRef(true)
    try {
      const r = await api.post('/pharmacy/order/direct', buildDirectForm(pendingCartRef.current))
      const orderId: string = r.data.data?.order?._id
      setOrders(prev => [r.data.data?.order, ...prev])

      await api.post('/payments/submit-transfer', {
        type: 'pharmacy',
        referenceId: orderId,
        amount: pendingAmountRef.current * 100,
        transferReference: transferRef.trim(),
      })

      setCart([]); setShopPharmacy(''); setShopAddress(''); setShopNotes(''); setRxFile(null)
      setShowPayModal(false); setTransferRef('')
      modal.show({
        variant: 'pending',
        title: 'Order & Payment Submitted!',
        message: `Your ₦${pendingAmountRef.current.toLocaleString()} transfer reference has been submitted. Admin will confirm and your order will be dispatched.`,
        actionLabel: 'View Orders',
        onAction: () => setTab('orders')
      })
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not complete your order. Please try again.' })
    } finally {
      setSubmittingRef(false)
    }
  }

  async function submitRxOrder (e: FormEvent) {
    e.preventDefault()
    if (!selected) { modal.show({ variant: 'declined', title: 'No Prescription', message: 'Select a prescription.' }); return }
    if (!pharmacyId) { modal.show({ variant: 'declined', title: 'No Pharmacy', message: 'Select a pharmacy.' }); return }
    if (fulfillment === 'delivery' && !rxAddress.trim()) { modal.show({ variant: 'declined', title: 'Missing Address', message: 'Enter delivery address.' }); return }
    setRxSub(true)
    try {
      const pickupLoc = fulfillment === 'pickup' && (rxPickupAddr || rxPickupCoords)
        ? { address: rxPickupAddr, ...rxPickupCoords } : undefined
      const r = await api.post('/pharmacy/order', { prescriptionId: selected, pharmacyId,
        fulfillmentType: fulfillment, deliveryAddress: fulfillment === 'delivery' ? rxAddress : undefined,
        pickupLocation: pickupLoc, notes: rxNotes || undefined })
      setOrders(prev => [r.data.data?.order, ...prev])
      if (fulfillment === 'pickup') {
        modal.show({ variant: 'success', title: 'Order Placed', message: 'Visit the pharmacy and pay at the counter when your order is ready.' })
      } else {
        modal.show({ variant: 'pending', title: 'Order Placed', message: 'The pharmacy will confirm the total. You\'ll transfer to the platform account to confirm delivery.' })
      }
      setSelected(null); setPharmacyId(''); setRxAddress(''); setRxNotes('')
      setTimeout(() => setTab('orders'), 2500)
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Order Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to place order.' })
    }
    setRxSub(false)
  }

  // Bank transfer for orders already placed (e.g. prescription orders where pharmacy confirmed the total)
  async function submitOrderTransfer (order: PharmacyOrder) {
    const ref = orderTransferRef[order._id]
    if (!ref?.trim()) return
    setSubmittingOrder(order._id)
    try {
      await api.post('/payments/submit-transfer', {
        type: 'pharmacy',
        referenceId: order._id,
        amount: order.totalAmount * 100,
        transferReference: ref.trim(),
      })
      setOrderPayPanelId(null)
      setOrderTransferRef(prev => ({ ...prev, [order._id]: '' }))
      modal.show({ variant: 'pending', title: 'Transfer Submitted', message: 'Admin will confirm your payment and process your order.' })
      api.get('/pharmacy/orders/mine').then(r => setOrders(r.data.data?.orders ?? []))
    } catch (err: unknown) {
      modal.show({ variant: 'declined', title: 'Failed', message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not submit transfer reference.' })
    } finally {
      setSubmittingOrder(null)
    }
  }

  const orderedRxIds = new Set(orders.map(o => (typeof o.prescription === 'object' ? o.prescription?._id : o.prescription)))

  return (
    <>
      <div className={s.tabs}>
        {(['shop', 'prescription', 'orders'] as Tab[]).map(t => (
          <button key={t} className={`${s.tab} ${tab === t ? s.active : ''}`} onClick={() => setTab(t)}>
            {t === 'shop' ? 'Shop Drugs' : t === 'prescription' ? 'Prescriptions' : 'My Orders'}
            {t === 'orders' && orders.length > 0 && <span className={s.count}>{orders.length}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className={s.empty}><Loader label='Loading pharmacy…' /></div> : tab === 'shop' ? (
        <form className={s.orderForm} onSubmit={submitDirectOrder}>
          <div className={s.section}>
            <h3>Select Pharmacy</h3>
            {partners.length === 0 ? <p className={s.noPartners}>No pharmacy partners available yet.</p> : (
              <select value={shopPharmacy} onChange={e => setShopPharmacy(e.target.value)}>
                <option value=''>Choose a pharmacy…</option>
                {partners.map(p => <option key={p._id} value={p._id}>{p.name} — {p.address}</option>)}
              </select>
            )}
          </div>

          {shopPharmacy && (
            <>
              <div className={s.section}>
                <h3>Available Drugs {catalogLoad && <Loader inline size='sm' />}</h3>
                {!catalogLoad && catalog.length === 0
                  ? <p className={s.noPartners}>This pharmacy has no approved drugs listed yet.</p>
                  : <div className={s.drugGrid}>
                      {catalog.map(drug => (
                        <div key={drug._id} className={s.drugCard}>
                          <div className={s.drugInfo}>
                            <p className={s.drugName}>{drug.name}</p>
                            <span className={s.drugMeta}>₦{drug.price.toLocaleString()} / {drug.unit}</span>
                            {drug.requiresPrescription && <span className={s.rxTag}>Rx</span>}
                          </div>
                          <div className={s.qtyControl}>
                            <button type='button' onClick={() => changeQty(drug, -1)}>−</button>
                            <span>{cartQty(drug._id)}</span>
                            <button type='button' onClick={() => changeQty(drug, 1)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {cart.length > 0 && (
                <div className={s.cartSummary}>
                  <p className={s.cartLabel}>Cart</p>
                  {cart.map(c => (
                    <div key={c.drugId} className={s.cartRow}>
                      <span>{c.name} × {c.qty}</span>
                      <span>₦{(c.price * c.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className={s.cartTotal}><span>Total</span><span>₦{cartTotal.toLocaleString()}</span></div>
                </div>
              )}

              <div className={s.section}>
                <h3>Fulfillment</h3>
                <div className={s.fulfillRow}>
                  {(['pickup', 'delivery'] as const).map(f => (
                    <label key={f} className={`${s.fulfillOpt} ${shopFulfill === f ? s.picked : ''}`}>
                      <input type='radio' name='shopFulfill' checked={shopFulfill === f} onChange={() => setShopFulfill(f)} />
                      <span>{f === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                      <p>{f === 'pickup' ? 'Visit the pharmacy' : 'Delivered to your address'}</p>
                    </label>
                  ))}
                </div>
              </div>

              {shopFulfill === 'delivery' && (
                <div className={s.section}>
                  <h3>Delivery Address</h3>
                  <input type='text' className={s.textInput} value={shopAddress}
                    onChange={e => setShopAddress(e.target.value)} placeholder='Enter full delivery address…' />
                </div>
              )}
              {shopFulfill === 'pickup' && (
                <div className={s.section}>
                  <h3>Your Pickup Location <span className={s.optional}>optional</span></h3>
                  <p className={s.locationNote}>Share your location so the pharmacy can prepare your order and give you an ETA.</p>
                  <div className={s.locationRow}>
                    <input type='text' className={s.textInput} value={shopPickupAddr}
                      onChange={e => setShopPickupAddr(e.target.value)} placeholder='Your address or nearest landmark…' />
                    <button type='button' className={s.gpsBtn} disabled={shopPickupLoading}
                      onClick={() => useGPS(setShopPickupAddr, setShopPickupCoords, setShopPickupLoading)}>
                      {shopPickupLoading ? '…' : <><MapPinIcon size={13} /> Use GPS</>}
                    </button>
                  </div>
                  {shopPickupCoords && <p className={s.coordsNote}>GPS: {shopPickupCoords.lat.toFixed(5)}, {shopPickupCoords.lng.toFixed(5)}</p>}
                </div>
              )}

              {needsRx && (
                <div className={s.section}>
                  <h3>Upload Prescription <span className={s.required}>Required</span></h3>
                  <div className={s.fileUploadArea} onClick={() => rxInputRef.current?.click()}>
                    <input ref={rxInputRef} type='file' accept='.pdf,image/*' className={s.hiddenInput}
                      onChange={e => setRxFile(e.target.files?.[0] ?? null)} />
                    {rxFile ? <p className={s.fileName}>{rxFile.name}</p> : <p>Click to upload (PDF or image)</p>}
                  </div>
                </div>
              )}

              {/* Payment note */}
              {cart.length > 0 && shopFulfill === 'pickup' && (
                <div className={s.paymentNote}>
                  <span className={s.paymentNoteIcon}>💵</span>
                  <p>You will pay at the pharmacy counter. The pharmacy will confirm your payment when you arrive.</p>
                </div>
              )}
              {cart.length > 0 && shopFulfill === 'delivery' && cartTotal > 0 && bankSettings && (
                <div className={s.paymentNote} data-variant='transfer'>
                  <span className={s.paymentNoteIcon}>🏦</span>
                  <p>Total: <strong>₦{cartTotal.toLocaleString()}</strong>. You will transfer to the platform bank account and enter your reference to confirm this delivery order.</p>
                </div>
              )}

              <div className={s.section}>
                <h3>Notes (optional)</h3>
                <textarea rows={2} value={shopNotes} onChange={e => setShopNotes(e.target.value)} placeholder='Special instructions…' />
              </div>
            </>
          )}

          <button type='submit' className={s.submitBtn} disabled={shopSub || !cart.length}>
            {shopSub ? <Loader inline size='sm' /> : (
              shopFulfill === 'pickup'
                ? `Place Order — Pay at Counter`
                : cartTotal > 0 && bankSettings
                  ? `Continue to Payment — ₦${cartTotal.toLocaleString()}`
                  : `Place Order${cart.length > 0 ? ` — ₦${cartTotal.toLocaleString()}` : ''}`
            )}
          </button>
        </form>

      ) : tab === 'prescription' ? (
        prescriptions.length === 0
          ? <div className={s.empty}><p>No forwarded prescriptions.</p><p>Go to <strong>Health Records → Prescriptions</strong> and click &quot;Send to Pharmacy&quot; first.</p></div>
          : <form className={s.orderForm} onSubmit={submitRxOrder}>
              <div className={s.section}>
                <h3>Select Prescription</h3>
                <div className={s.rxList}>
                  {prescriptions.map(p => {
                    const ordered = orderedRxIds.has(p._id)
                    return (
                      <label key={p._id} className={`${s.rxCard} ${selected === p._id ? s.picked : ''} ${ordered ? s.disabled : ''}`}>
                        <input type='radio' name='prescription' checked={selected === p._id}
                          disabled={ordered} onChange={() => !ordered && setSelected(p._id)} />
                        <div className={s.rxInfo}>
                          <p className={s.rxMeds}>{p.medications.map(m => m.name).join(', ')}</p>
                          <span>Dr. {p.doctor?.name ?? '—'} · {new Date(p.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {ordered && <span className={s.alreadyOrdered}>Already ordered</span>}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div className={s.section}>
                <h3>Select Pharmacy</h3>
                {partners.length === 0 ? <p className={s.noPartners}>No partners available.</p> : (
                  <select value={pharmacyId} onChange={e => setPharmacyId(e.target.value)}>
                    <option value=''>Choose a pharmacy…</option>
                    {partners.map(p => <option key={p._id} value={p._id}>{p.name} — {p.address}</option>)}
                  </select>
                )}
              </div>
              <div className={s.section}>
                <h3>Fulfillment</h3>
                <div className={s.fulfillRow}>
                  {(['pickup', 'delivery'] as const).map(f => (
                    <label key={f} className={`${s.fulfillOpt} ${fulfillment === f ? s.picked : ''}`}>
                      <input type='radio' name='rxFulfillment' checked={fulfillment === f} onChange={() => setFulfillment(f)} />
                      <span>{f === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                      <p>{f === 'pickup' ? 'Visit the pharmacy' : 'Delivered to your address'}</p>
                    </label>
                  ))}
                </div>
              </div>
              {fulfillment === 'delivery' && (
                <div className={s.section}>
                  <h3>Delivery Address</h3>
                  <input type='text' className={s.textInput} value={rxAddress}
                    onChange={e => setRxAddress(e.target.value)} placeholder='Enter full delivery address…' />
                </div>
              )}
              {fulfillment === 'pickup' && (
                <div className={s.section}>
                  <h3>Your Pickup Location <span className={s.optional}>optional</span></h3>
                  <p className={s.locationNote}>Share your location so the pharmacy can prepare your order and give you an ETA.</p>
                  <div className={s.locationRow}>
                    <input type='text' className={s.textInput} value={rxPickupAddr}
                      onChange={e => setRxPickupAddr(e.target.value)} placeholder='Your address or nearest landmark…' />
                    <button type='button' className={s.gpsBtn} onClick={() => useGPS(setRxPickupAddr, setRxPickupCoords, () => {})}>
                      <MapPinIcon size={13} /> Use GPS
                    </button>
                  </div>
                  {rxPickupCoords && <p className={s.coordsNote}>GPS: {rxPickupCoords.lat.toFixed(5)}, {rxPickupCoords.lng.toFixed(5)}</p>}
                </div>
              )}
              {fulfillment === 'pickup' && (
                <div className={s.paymentNote}>
                  <span className={s.paymentNoteIcon}>💵</span>
                  <p>Pay at the pharmacy counter when you pick up your order. The pharmacy confirms your payment.</p>
                </div>
              )}
              {fulfillment === 'delivery' && (
                <div className={s.paymentNote} data-variant='transfer'>
                  <span className={s.paymentNoteIcon}>🏦</span>
                  <p>The pharmacy will confirm your total. You will then transfer to the platform bank account from My Orders.</p>
                </div>
              )}
              <button type='submit' className={s.submitBtn} disabled={rxSub || !selected || !partners.length}>
                {rxSub ? <Loader inline size='sm' /> : (fulfillment === 'pickup' ? 'Place Order — Pay at Counter' : 'Place Order')}
              </button>
            </form>

      ) : (
        orders.length === 0 ? <div className={s.empty}>No pharmacy orders yet.</div> : (
          <div className={s.ordersList}>
            {orders.map(o => {
              const rx = typeof o.prescription === 'object' ? o.prescription : null
              const itemNames = o.orderType === 'direct'
                ? (o.items ?? []).map(i => `${i.name} ×${i.qty}`).join(', ')
                : rx ? rx.medications.map((m: Medication) => m.name).join(', ') : 'Prescription order'
              const isPendingPayment = o.status === 'pending' && o.totalAmount > 0 && o.adminApprovalStatus !== 'pending'
              const showPanel = orderPayPanelId === o._id
              return (
                <div key={o._id} className={s.orderCard}>
                  <div className={s.orderTop}>
                    <div className={s.orderLeft}>
                      <div className={s.orderIcon}><PillIcon size={18} /></div>
                      <div className={s.orderInfo}>
                        <p>{itemNames}</p>
                        <span>{o.pharmacy?.name ?? 'Pharmacy'} · {o.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                        <span>{new Date(o.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {o.adminApprovalStatus === 'pending' && <span className={s.approvalNote}>Awaiting admin review</span>}
                      </div>
                    </div>
                    <div className={s.orderRight}>
                      <span className={`${s.statusBadge} ${s[o.status]}`}>{statusLabel(o.status)}</span>
                      {o.totalAmount > 0 && <span className={s.amount}>₦{o.totalAmount.toLocaleString()}</span>}
                    </div>
                  </div>

                  {/* Pickup orders — pay at counter note */}
                  {o.status === 'pending' && o.fulfillmentType === 'pickup' && o.adminApprovalStatus !== 'pending' && (
                    <div className={s.orderFooter}>
                      <p className={s.counterNote}>
                        💵 {o.totalAmount > 0 ? `Pay ₦${o.totalAmount.toLocaleString()} at the pharmacy counter.` : 'Pay at the pharmacy counter when your order is ready.'}
                      </p>
                    </div>
                  )}

                  {/* Delivery orders — bank transfer */}
                  {isPendingPayment && o.fulfillmentType === 'delivery' && (
                    <div className={s.orderFooter}>
                      {!showPanel ? (
                        <button className={s.payBtn} onClick={() => setOrderPayPanelId(o._id)}>
                          Submit Transfer Reference
                        </button>
                      ) : (
                        <div className={s.transferPanel}>
                          {bankSettings && (
                            <div className={s.bankCardSm}>
                              <BankRow label='Bank' value={bankSettings.companyBankName} />
                              <BankRow label='Account No.' value={bankSettings.companyAccountNumber} copyable />
                              <BankRow label='Account Name' value={bankSettings.companyAccountName} />
                            </div>
                          )}
                          <p className={s.transferInstruction}>
                            Transfer <strong>₦{o.totalAmount.toLocaleString()}</strong> to the account above, then enter your reference:
                          </p>
                          <div className={s.transferInputRow}>
                            <input
                              className={s.refInput}
                              placeholder='Transfer reference…'
                              value={orderTransferRef[o._id] ?? ''}
                              onChange={e => setOrderTransferRef(prev => ({ ...prev, [o._id]: e.target.value.toUpperCase() }))}
                              autoComplete='off'
                            />
                            <button
                              className={s.payConfirmBtn}
                              disabled={!orderTransferRef[o._id]?.trim() || submittingOrder === o._id}
                              onClick={() => submitOrderTransfer(o)}
                            >
                              {submittingOrder === o._id ? <Loader inline size='sm' /> : 'Confirm'}
                            </button>
                            <button className={s.cancelTransferBtn} onClick={() => setOrderPayPanelId(null)}>✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {o.status === 'pending' && !o.totalAmount && o.adminApprovalStatus !== 'pending' && (
                    <div className={s.orderFooter}><p className={s.codNote}>Awaiting pharmacy confirmation of your order total.</p></div>
                  )}
                  {['ready', 'dispatched'].includes(o.status) && (
                    <div className={s.orderFooter}><p className={s.readyNote}>
                      {o.status === 'ready'
                        ? <><CheckCircleIcon size={13} /> Ready! {o.fulfillmentType === 'pickup' ? 'Visit the pharmacy.' : 'Delivery on the way.'}</>
                        : <><TruckIcon size={13} /> Your order is on the way!</>}
                    </p></div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── Bank Transfer Modal (for new direct delivery orders) ── */}
      {showPayModal && (
        <div className={s.payOverlay}>
          <div className={s.payPanel}>
            <div className={s.payPanelHeader}>
              <h2 className={s.payPanelTitle}>Pay for Delivery Order</h2>
              <button className={s.payPanelClose} onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <p className={s.payPanelSub}>
              Transfer <strong>₦{pendingAmountRef.current.toLocaleString()}</strong> to the platform bank account, then enter your reference. Your order is placed only after this step.
            </p>

            {bankSettings && (
              <div className={s.bankCard}>
                <BankRow label='Bank' value={bankSettings.companyBankName} />
                <BankRow label='Account Number' value={bankSettings.companyAccountNumber} copyable />
                <BankRow label='Account Name' value={bankSettings.companyAccountName} />
                {bankSettings.directPaymentNote && <p className={s.bankNote}>{bankSettings.directPaymentNote}</p>}
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
              onClick={handleSubmitDirectTransfer}
            >
              {submittingRef ? <Loader inline size='sm' /> : 'Place Order & Submit Reference'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function PharmacyPage () {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}><Loader label='Loading…' /></div>}>
      <PharmacyContent />
    </Suspense>
  )
}

function statusLabel (st: string) {
  return ({ pending: 'Pending', processing: 'Processing', ready: 'Ready', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled' }[st] ?? st)
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

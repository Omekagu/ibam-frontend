'use client'
import { Suspense, useEffect, useState, useRef, FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
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
interface PharmacyPartner {
  _id: string
  name: string
  address: string
  phone: string
}
interface Drug {
  _id: string
  name: string
  price: number
  unit: string
  requiresPrescription: boolean
  inStock: boolean
}
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

type Tab = 'shop' | 'prescription' | 'orders'

function PharmacyContent () {
  const params = useSearchParams()
  const [tab,           setTab]          = useState<Tab>('shop')
  const [prescriptions, setPrescriptions]= useState<Prescription[]>([])
  const [partners,      setPartners]     = useState<PharmacyPartner[]>([])
  const [orders,        setOrders]       = useState<PharmacyOrder[]>([])
  const [loading,       setLoading]      = useState(true)
  const [successMsg,    setSuccessMsg]   = useState('')

  // shop tab
  const [shopPharmacy,  setShopPharmacy] = useState('')
  const [catalog,       setCatalog]      = useState<Drug[]>([])
  const [catalogLoad,   setCatalogLoad]  = useState(false)
  const [cart,          setCart]         = useState<CartItem[]>([])
  const [shopFulfill,       setShopFulfill]       = useState<'pickup' | 'delivery'>('pickup')
  const [shopAddress,       setShopAddress]       = useState('')
  const [shopPickupAddr,    setShopPickupAddr]    = useState('')
  const [shopPickupCoords,  setShopPickupCoords]  = useState<{ lat: number; lng: number } | null>(null)
  const [shopPickupLoading, setShopPickupLoading] = useState(false)
  const [shopNotes,         setShopNotes]         = useState('')
  const [rxFile,        setRxFile]       = useState<File | null>(null)
  const rxInputRef = useRef<HTMLInputElement>(null)
  const [shopError,     setShopError]    = useState('')
  const [shopSub,       setShopSub]      = useState(false)

  // prescription tab
  const [selected,      setSelected]     = useState<string | null>(null)
  const [pharmacyId,    setPharmacyId]   = useState('')
  const [fulfillment,    setFulfillment]   = useState<'delivery' | 'pickup'>('pickup')
  const [rxAddress,      setRxAddress]     = useState('')
  const [rxPickupAddr,   setRxPickupAddr]  = useState('')
  const [rxPickupCoords, setRxPickupCoords]= useState<{ lat: number; lng: number } | null>(null)
  const [rxNotes,       setRxNotes]      = useState('')
  const [rxSub,         setRxSub]        = useState(false)
  const [rxError,       setRxError]      = useState('')

  const [paying,        setPaying]       = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/prescriptions/mine'),
      api.get('/pharmacy/partners'),
      api.get('/pharmacy/orders/mine'),
    ]).then(([rxRes, parRes, ordRes]) => {
      const all: Prescription[] = rxRes.data.data?.prescriptions ?? []
      setPrescriptions(all.filter(p => p.forwardedToPharmacy))
      setPartners(parRes.data.data?.partners ?? [])
      setOrders(ordRes.data.data?.orders ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const ref = params.get('reference')
    if (!ref) return
    api.get(`/payments/verify/${ref}`)
      .then(() => {
        setSuccessMsg('Payment confirmed! Your order is being processed.')
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
      return newQty <= 0
        ? prev.filter(c => c.drugId !== drug._id)
        : prev.map(c => c.drugId === drug._id ? { ...c, qty: newQty } : c)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const needsRx = cart.some(c => c.requiresPrescription)

  function useGPS (
    setAddr: (a: string) => void,
    setCoords: (c: { lat: number; lng: number } | null) => void,
    setLoading: (l: boolean) => void
  ) {
    if (!navigator.geolocation) { alert('Geolocation not supported in this browser.'); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setAddr(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setLoading(false)
      },
      () => { alert('Could not get your location.'); setLoading(false) }
    )
  }

  async function submitDirectOrder (e: FormEvent) {
    e.preventDefault()
    setShopError('')
    if (!cart.length) { setShopError('Add at least one item to your cart.'); return }
    if (shopFulfill === 'delivery' && !shopAddress.trim()) { setShopError('Enter delivery address.'); return }
    if (needsRx && !rxFile) { setShopError('Upload a prescription for Rx-required drugs.'); return }
    setShopSub(true)
    try {
      const form = new FormData()
      form.append('pharmacyId', shopPharmacy)
      form.append('items', JSON.stringify(cart.map(c => ({ drugId: c.drugId, qty: c.qty, name: c.name }))))
      form.append('fulfillmentType', shopFulfill)
      if (shopFulfill === 'delivery') form.append('deliveryAddress', shopAddress)
      if (shopFulfill === 'pickup' && (shopPickupAddr || shopPickupCoords)) {
        form.append('pickupLocation', JSON.stringify({ address: shopPickupAddr, ...shopPickupCoords }))
      }
      if (shopNotes) form.append('notes', shopNotes)
      if (rxFile) form.append('prescription', rxFile)
      const r = await api.post('/pharmacy/order/direct', form)
      setOrders(prev => [r.data.data?.order, ...prev])
      setSuccessMsg(r.data.data?.requiresApproval
        ? 'Order submitted! Admin will review your prescription shortly.'
        : 'Order placed! The pharmacy will prepare your drugs.')
      setCart([]); setShopPharmacy(''); setShopAddress(''); setShopNotes(''); setRxFile(null)
      setTimeout(() => { setSuccessMsg(''); setTab('orders') }, 3000)
    } catch (err: unknown) {
      setShopError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to place order.')
    }
    setShopSub(false)
  }

  async function submitRxOrder (e: FormEvent) {
    e.preventDefault()
    if (!selected) { setRxError('Select a prescription.'); return }
    if (!pharmacyId) { setRxError('Select a pharmacy.'); return }
    if (fulfillment === 'delivery' && !rxAddress.trim()) { setRxError('Enter delivery address.'); return }
    setRxSub(true); setRxError('')
    try {
      const pickupLoc = fulfillment === 'pickup' && (rxPickupAddr || rxPickupCoords)
        ? { address: rxPickupAddr, ...rxPickupCoords } : undefined
      const r = await api.post('/pharmacy/order', { prescriptionId: selected, pharmacyId,
        fulfillmentType: fulfillment, deliveryAddress: fulfillment === 'delivery' ? rxAddress : undefined,
        pickupLocation: pickupLoc, notes: rxNotes || undefined })
      setOrders(prev => [r.data.data?.order, ...prev])
      setSuccessMsg('Order placed! The pharmacy will confirm the total and prepare your drugs.')
      setSelected(null); setPharmacyId(''); setRxAddress(''); setRxNotes('')
      setTimeout(() => { setSuccessMsg(''); setTab('orders') }, 2500)
    } catch (err: unknown) {
      setRxError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to place order.')
    }
    setRxSub(false)
  }

  async function initiatePayment (order: PharmacyOrder) {
    if (!order.totalAmount) { alert("The pharmacy hasn't set a total yet."); return }
    setPaying(order._id)
    try {
      const r = await api.post('/payments/initiate', { type: 'pharmacy', serviceId: order._id, amount: order.totalAmount })
      const url: string | undefined = r.data.data?.authorizationUrl
      if (url) window.location.href = url
    } catch { alert('Could not initiate payment.'); setPaying(null) }
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

      {successMsg && <div className={s.successBanner}>{successMsg}</div>}

      {loading ? <div className={s.empty}>Loading pharmacy…</div> : tab === 'shop' ? (
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
                <h3>Available Drugs {catalogLoad && <span className={s.loading}>Loading…</span>}</h3>
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
                    <button type='button' className={s.gpsBtn}
                      disabled={shopPickupLoading}
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

              <div className={s.section}>
                <h3>Notes (optional)</h3>
                <textarea rows={2} value={shopNotes} onChange={e => setShopNotes(e.target.value)} placeholder='Special instructions…' />
              </div>
            </>
          )}

          {shopError && <p className={s.error}>{shopError}</p>}
          <button type='submit' className={s.submitBtn} disabled={shopSub || !cart.length}>
            {shopSub ? 'Placing Order…' : `Place Order${cart.length > 0 ? ` — ₦${cartTotal.toLocaleString()}` : ''}`}
          </button>
        </form>

      ) : tab === 'prescription' ? (
        prescriptions.length === 0
          ? <div className={s.empty}><p>No forwarded prescriptions.</p><p>Go to <strong>Health Records → Prescriptions</strong> and click "Send to Pharmacy" first.</p></div>
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
                    <button type='button' className={s.gpsBtn}
                      onClick={() => useGPS(setRxPickupAddr, setRxPickupCoords, () => {})}>
                      <MapPinIcon size={13} /> Use GPS
                    </button>
                  </div>
                  {rxPickupCoords && <p className={s.coordsNote}>GPS: {rxPickupCoords.lat.toFixed(5)}, {rxPickupCoords.lng.toFixed(5)}</p>}
                </div>
              )}
              {rxError && <p className={s.error}>{rxError}</p>}
              <button type='submit' className={s.submitBtn} disabled={rxSub || !selected || !partners.length}>
                {rxSub ? 'Placing Order…' : 'Place Order'}
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
                  {o.status === 'pending' && o.totalAmount > 0 && o.adminApprovalStatus !== 'pending' && (
                    <div className={s.orderFooter}>
                      <button className={s.payBtn} disabled={paying === o._id} onClick={() => initiatePayment(o)}>
                        {paying === o._id ? 'Redirecting…' : `Pay ₦${o.totalAmount.toLocaleString()}`}
                      </button>
                    </div>
                  )}
                  {o.status === 'pending' && !o.totalAmount && o.adminApprovalStatus !== 'pending' && (
                    <div className={s.orderFooter}><p className={s.codNote}>Awaiting pharmacy confirmation.</p></div>
                  )}
                  {['ready', 'dispatched'].includes(o.status) && (
                    <div className={s.orderFooter}><p className={s.readyNote}>
                      {o.status === 'ready'
                        ? <><CheckCircleIcon size={13} /> Ready! {o.fulfillmentType === 'pickup' ? 'Visit the pharmacy.' : 'Delivery on the way.'}</>
                        : <><TruckIcon size={13} /> Your order is on the way!</>
                      }
                    </p></div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </>
  )
}

export default function PharmacyPage () {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>Loading…</div>}>
      <PharmacyContent />
    </Suspense>
  )
}

function statusLabel (st: string) {
  return ({ pending: 'Pending', processing: 'Processing', ready: 'Ready', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled' }[st] ?? st)
}

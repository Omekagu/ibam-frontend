'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import s from './page.module.scss'

interface Medication { name: string; dosage: string; frequency: string; duration: string }
interface Prescription { _id: string; medications: Medication[]; diagnosis?: string }
interface PaymentRef { _id: string; status: string; amount: number; reference?: string; method?: string }
interface Order {
  _id: string
  prescription: Prescription | null
  patient: { _id?: string; name: string; phone?: string }
  fulfillmentType: 'delivery' | 'pickup'
  deliveryAddress?: string
  status: string
  totalAmount: number
  notes?: string
  createdAt: string
  paymentRef?: PaymentRef | null
}

const STATUSES = ['pending', 'processing', 'ready', 'dispatched', 'delivered', 'cancelled']
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', ready: 'Ready',
  dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled',
}

function matchesSearch (order: Order, q: string) {
  const lower = q.toLowerCase()
  if (!lower) return true
  const ref = order._id.slice(-8).toUpperCase()
  if (order._id.toLowerCase().includes(lower)) return true
  if (ref.toLowerCase().includes(lower)) return true
  if (order.patient?.name?.toLowerCase().includes(lower)) return true
  if (order.patient?._id?.toLowerCase().includes(lower)) return true
  if (order.patient?.phone?.includes(lower)) return true
  if (order.paymentRef?.reference?.toLowerCase().includes(lower)) return true
  if (order.status.toLowerCase().includes(lower)) return true
  return false
}

export default function PharmacyPartnerDashboard () {
  const modal = useStatusModal()
  const [orders,    setOrders]    = useState<Order[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [updating,  setUpdating]  = useState<string | null>(null)
  const [amounts,   setAmounts]   = useState<Record<string, string>>({})
  const [search,    setSearch]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/pharmacy/orders/partner')
      setOrders(r.data.data?.orders ?? [])
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateOrder (id: string, status: string, totalAmount?: number) {
    setUpdating(id)
    try {
      await api.put(`/pharmacy/order/${id}/status`, {
        status,
        ...(totalAmount !== undefined ? { totalAmount } : {}),
      })
      setOrders(prev => prev.map(o =>
        o._id === id
          ? { ...o, status, ...(totalAmount !== undefined ? { totalAmount } : {}) }
          : o
      ))
    } catch {
      modal.show({ variant: 'declined', title: 'Update Failed', message: 'Could not update order. Please try again.' })
    }
    setUpdating(null)
  }

  const filtered  = orders.filter(o => matchesSearch(o, search))
  const pending   = orders.filter(o => o.status === 'pending')
  const active    = orders.filter(o => ['processing', 'ready', 'dispatched'].includes(o.status))
  const completed = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Pharmacy Orders</h1>
        <button className={s.refreshBtn} onClick={load}>Refresh</button>
      </div>

      <div className={s.stats}>
        <div className={s.stat}><span className={s.statNum}>{pending.length}</span><span>Awaiting</span></div>
        <div className={s.stat}><span className={s.statNum}>{active.length}</span><span>In Progress</span></div>
        <div className={s.stat}><span className={s.statNum}>{completed.length}</span><span>Completed</span></div>
        <div className={s.stat}><span className={s.statNum}>{orders.length}</span><span>Total</span></div>
      </div>

      {/* Search */}
      <div className={s.searchWrap}>
        <span className={s.searchIcon}>🔍</span>
        <input
          className={s.searchInput}
          placeholder="Search by patient name, booking ref, receipt ref, or payment status…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={s.searchClear} onClick={() => setSearch('')}>✕</button>
        )}
      </div>
      {search && (
        <p className={s.searchHint}>
          Tip: paste the last 8 characters of an order ID or the transaction reference from the patient&apos;s receipt for an exact match.
        </p>
      )}

      {loading ? (
        <div className={s.empty}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className={s.empty}>No orders yet. Orders from patients will appear here once placed.</div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>No orders match &quot;{search}&quot;</div>
      ) : (
        <div className={s.list}>
          {filtered.map(order => {
            const rx = order.prescription
            const isExpanded = expanded === order._id
            const isPaid = !!(order.paymentRef && order.paymentRef.status === 'success')
            const bookingRef = `#${order._id.slice(-8).toUpperCase()}`

            return (
              <div key={order._id} className={`${s.card} ${s[order.status]}`}>
                <div className={s.cardHead} onClick={() => setExpanded(isExpanded ? null : order._id)}>
                  <div className={s.cardLeft}>
                    <span className={`${s.statusBadge} ${s[`badge_${order.status}`]}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <div className={s.cardInfo}>
                      <p className={s.patientName}>{order.patient?.name ?? 'Patient'}</p>
                      <p className={s.meds}>
                        {rx ? rx.medications.map(m => m.name).join(', ') : 'Prescription order'}
                        {' · '}
                        {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                        {' · '}
                        <span className={isPaid ? s.paidTag : s.unpaidTag}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className={s.cardRight}>
                    {order.totalAmount > 0 && (
                      <span className={s.amount}>₦{order.totalAmount.toLocaleString()}</span>
                    )}
                    <span className={s.date}>
                      {new Date(order.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={s.chevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className={s.cardBody}>
                    {/* Booking ref + payment info */}
                    <div className={s.receiptBox}>
                      <div className={s.receiptRow}>
                        <span className={s.receiptLabel}>Booking Ref</span>
                        <span className={s.receiptMono}>{bookingRef}</span>
                      </div>
                      {order.paymentRef?.reference && (
                        <div className={s.receiptRow}>
                          <span className={s.receiptLabel}>Transaction Ref</span>
                          <span className={s.receiptMono}>{order.paymentRef.reference}</span>
                        </div>
                      )}
                      <div className={s.receiptRow}>
                        <span className={s.receiptLabel}>Payment</span>
                        <span className={isPaid ? s.paidBadge : s.unpaidBadge}>
                          {isPaid
                            ? `Paid via ${order.paymentRef?.method === 'walk_in_cash' ? 'Cash' : 'App'}`
                            : 'Not yet paid'}
                        </span>
                      </div>
                      {order.patient?._id && (
                        <div className={s.receiptRow}>
                          <span className={s.receiptLabel}>Patient ID</span>
                          <span className={s.receiptMono}>{order.patient._id}</span>
                        </div>
                      )}
                    </div>

                    {rx && (
                      <div className={s.rxSection}>
                        {rx.diagnosis && <p className={s.diagnosis}>{rx.diagnosis}</p>}
                        {rx.medications.map((m, i) => (
                          <div key={i} className={s.medRow}>
                            <span className={s.medName}>{m.name}</span>
                            <span className={s.medMeta}>{m.dosage} · {m.frequency} · {m.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.deliveryAddress && (
                      <p className={s.address}>Deliver to: {order.deliveryAddress}</p>
                    )}
                    {order.notes && <p className={s.notes}>Patient note: {order.notes}</p>}
                    {order.patient?.phone && <p className={s.phone}>Phone: {order.patient.phone}</p>}

                    {/* Set total amount — only if order not yet paid */}
                    {!['delivered', 'cancelled'].includes(order.status) && !isPaid && (
                      <div className={s.priceRow}>
                        <label>Total Amount (₦)</label>
                        <input
                          type='number'
                          min='0'
                          placeholder={order.totalAmount > 0 ? String(order.totalAmount) : '0'}
                          value={amounts[order._id] ?? (order.totalAmount > 0 ? String(order.totalAmount) : '')}
                          onChange={e => setAmounts(prev => ({ ...prev, [order._id]: e.target.value }))}
                        />
                        <button
                          className={s.setAmountBtn}
                          disabled={updating === order._id || !amounts[order._id]}
                          onClick={() => updateOrder(order._id, order.status, Number(amounts[order._id]))}
                        >
                          Set Amount
                        </button>
                      </div>
                    )}
                    {isPaid && !['delivered', 'cancelled'].includes(order.status) && (
                      <p className={s.paidNote}>Amount locked — patient has already paid via the app.</p>
                    )}

                    {/* Status actions */}
                    {!['delivered', 'cancelled'].includes(order.status) && (
                      <div className={s.actions}>
                        {order.status === 'pending' && (
                          <button className={s.actionBtn} disabled={updating === order._id}
                            onClick={() => updateOrder(order._id, 'processing')}>
                            Start Processing
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button className={s.actionBtn} disabled={updating === order._id}
                            onClick={() => updateOrder(order._id, 'ready')}>
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'ready' && order.fulfillmentType === 'delivery' && (
                          <button className={s.actionBtn} disabled={updating === order._id}
                            onClick={() => updateOrder(order._id, 'dispatched')}>
                            Mark Dispatched
                          </button>
                        )}
                        {(order.status === 'ready' || order.status === 'dispatched') && (
                          <button className={s.actionBtn} disabled={updating === order._id}
                            onClick={() => updateOrder(order._id, 'delivered')}>
                            Mark Delivered
                          </button>
                        )}
                        <button className={s.cancelBtn} disabled={updating === order._id}
                          onClick={() => updateOrder(order._id, 'cancelled')}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

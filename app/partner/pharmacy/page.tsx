'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Medication { name: string; dosage: string; frequency: string; duration: string }
interface Prescription { _id: string; medications: Medication[]; diagnosis?: string }
interface Order {
  _id: string
  prescription: Prescription | null
  patient: { name: string; phone?: string }
  fulfillmentType: 'delivery' | 'pickup'
  deliveryAddress?: string
  status: string
  totalAmount: number
  notes?: string
  createdAt: string
}

const STATUSES = ['pending', 'processing', 'ready', 'dispatched', 'delivered', 'cancelled']
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', processing: 'Processing', ready: 'Ready',
  dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled',
}

export default function PharmacyPartnerDashboard () {
  const [orders,    setOrders]    = useState<Order[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [updating,  setUpdating]  = useState<string | null>(null)
  const [amounts,   setAmounts]   = useState<Record<string, string>>({})

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
    } catch { alert('Update failed. Please try again.') }
    setUpdating(null)
  }

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

      {loading ? (
        <div className={s.empty}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className={s.empty}>No orders yet. Orders from patients will appear here once assigned.</div>
      ) : (
        <div className={s.list}>
          {orders.map(order => {
            const rx = order.prescription
            const isExpanded = expanded === order._id
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

                    {/* Set total amount */}
                    {!['delivered', 'cancelled'].includes(order.status) && (
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

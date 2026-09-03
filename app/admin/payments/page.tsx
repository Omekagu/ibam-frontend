'use client'
import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { XIcon } from '@/components/icons'
import s from './page.module.scss'

interface Payment {
  _id: string
  user: { name: string; email: string }
  amount: number
  type: string
  method?: string
  status: string
  reference?: string
  transferReference?: string
  adminNotes?: string
  subaccountCode?: string
  createdAt: string
}

const STATUS_OPTS = ['', 'success', 'pending', 'failed']

const TYPE_LABELS: Record<string, string> = {
  consultation: 'Doctor Consultation',
  pharmacy: 'Pharmacy Order',
  pharmacy_batch: 'Pharmacy (Batch)',
  lab_test: 'Lab Test',
  subscription: 'Subscription',
  wellness_package: 'Wellness Package'
}

const METHOD_LABELS: Record<string, string> = {
  paystack: 'Paystack',
  direct_transfer: 'Bank Transfer',
  pos: 'POS'
}

function ReceiptModal ({
  payment,
  onClose
}: {
  payment: Payment
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  function handlePrint () {
    const el = ref.current
    if (!el) return
    const win = window.open('', '_blank', 'width=600,height=800')
    if (!win) return
    win.document.write(`
      <html><head><title>Receipt — iBam Health</title>
      <style>
        body { font-family: sans-serif; padding: 32px; color: #111; }
        h2 { margin: 0 0 4px; font-size: 1.25rem; }
        .sub { color: #6B7280; font-size: 0.8rem; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; font-size: 0.875rem; border-bottom: 1px solid #E5E7EB; }
        td:first-child { color: #6B7280; width: 40%; }
        .amount { font-size: 1.5rem; font-weight: 700; color: #16a34a; margin: 16px 0; }
        .footer { margin-top: 32px; font-size: 0.75rem; color: #9CA3AF; text-align: center; }
      </style></head><body>
      ${el.innerHTML}
      <div class="footer">iBam Health — ibamhealth.com</div>
      </body></html>`)
    win.document.close()
    win.print()
  }

  const amountNaira = (payment.amount / 100).toLocaleString('en-NG', {
    minimumFractionDigits: 2
  })
  const isSuccess = payment.status === 'success'
  const isSplit = !!payment.subaccountCode

  return (
    <div
      className={s.overlay}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={s.receiptModal}>
        <div className={s.receiptHeader}>
          <div>
            <h3 className={s.receiptTitle}>Payment Receipt</h3>
            <p className={s.receiptSub}>iBam Health Transaction</p>
          </div>
          <button className={s.closeBtn} onClick={onClose}>
            <XIcon size={18} />
          </button>
        </div>

        <div ref={ref}>
          <h2 style={{ marginBottom: 4 }}>iBam Health</h2>
          <p className={s.receiptDate}>
            {new Date(payment.createdAt).toLocaleString('en-NG', {
              dateStyle: 'full',
              timeStyle: 'short'
            })}
          </p>

          <div className={s.receiptAmount}>
            ₦{amountNaira}
            <span className={`${s.receiptStatusBadge} ${s[payment.status]}`}>
              {payment.status}
            </span>
          </div>

          <table className={s.receiptTable}>
            <tbody>
              <tr>
                <td>Patient</td>
                <td>
                  <strong>{payment.user?.name ?? '—'}</strong>
                  <br />
                  <small>{payment.user?.email ?? ''}</small>
                </td>
              </tr>
              <tr>
                <td>Service</td>
                <td>{TYPE_LABELS[payment.type] ?? payment.type}</td>
              </tr>
              <tr>
                <td>Method</td>
                <td>
                  {METHOD_LABELS[payment.method ?? ''] ?? payment.method ?? '—'}
                </td>
              </tr>
              <tr>
                <td>Settlement</td>
                <td>
                  {isSplit ? 'Automatic split (Paystack)' : 'Manual transfer'}
                </td>
              </tr>
              {payment.reference && (
                <tr>
                  <td>Reference</td>
                  <td>
                    <code style={{ fontSize: '0.8rem' }}>
                      {payment.reference}
                    </code>
                  </td>
                </tr>
              )}
              {payment.transferReference && (
                <tr>
                  <td>Transfer Ref</td>
                  <td>
                    <code style={{ fontSize: '0.8rem' }}>
                      {payment.transferReference}
                    </code>
                  </td>
                </tr>
              )}
              {payment.adminNotes && (
                <tr>
                  <td>Admin Notes</td>
                  <td>{payment.adminNotes}</td>
                </tr>
              )}
              <tr>
                <td>Date</td>
                <td>
                  {new Date(payment.createdAt).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={s.receiptActions}>
          <button className={s.printBtn} onClick={handlePrint}>
            Print Receipt
          </button>
          <button className={s.cancelBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPayments () {
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [page, setPage] = useState(1)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [noteFor, setNoteFor] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState<Payment | null>(null)

  function load (pg = page, st = status, mt = method) {
    setLoading(true)
    const q = new URLSearchParams({ page: String(pg), limit: '20' })
    if (st) q.set('status', st)
    if (mt) q.set('method', mt)
    api
      .get(`/admin/payments?${q}`)
      .then(r => {
        setPayments(r.data.data?.payments ?? [])
        setTotal(r.data.data?.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function applyStatus (st: string) {
    setStatus(st)
    setPage(1)
    load(1, st, method)
  }

  function toggleTransferFilter () {
    const mt = method === 'direct_transfer' ? '' : 'direct_transfer'
    setMethod(mt)
    setPage(1)
    load(1, status, mt)
  }

  async function confirmPayment (id: string, adminNotes?: string) {
    setConfirming(id)
    try {
      await api.put(`/admin/payments/${id}/confirm`, { adminNotes })
      setPayments(prev =>
        prev.map(p =>
          p._id === id ? { ...p, status: 'success', adminNotes } : p
        )
      )
      setNoteFor(null)
      setNote('')
    } catch {}
    setConfirming(null)
  }

  const pages = Math.ceil(total / 20)
  const pendingTransferCount = payments.filter(
    p => p.status === 'pending' && p.method === 'direct_transfer'
  ).length

  return (
    <>
      <div className={s.toolbar}>
        <div className={s.filters}>
          {STATUS_OPTS.map(st => (
            <button
              key={st || 'all'}
              className={`${s.chip} ${
                status === st && !method ? s.active : ''
              }`}
              onClick={() => {
                setMethod('')
                applyStatus(st)
              }}
            >
              {st || 'All'}
            </button>
          ))}
          <button
            className={`${s.chip} ${
              method === 'direct_transfer' ? s.active : ''
            }`}
            onClick={toggleTransferFilter}
          >
            Pending Transfers
            {pendingTransferCount > 0 && (
              <span className={s.badge}>{pendingTransferCount}</span>
            )}
          </button>
        </div>
        <p className={s.total}>{total.toLocaleString()} transactions</p>
      </div>

      <div className={s.panel}>
        {loading ? (
          <p className={s.empty}>Loading...</p>
        ) : payments.length === 0 ? (
          <p className={s.empty}>No payments found.</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>
                    <div className={s.userCell}>
                      <p>{p.user?.name ?? '-'}</p>
                      <span>{p.user?.email ?? ''}</span>
                    </div>
                  </td>
                  <td className={s.amount}>
                    N{(p.amount / 100).toLocaleString()}
                  </td>
                  <td>
                    <span className={s.typeBadge}>
                      {TYPE_LABELS[p.type] ?? p.type ?? '-'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${s.methodBadge} ${
                        p.method === 'direct_transfer' ? s.transfer : s.paystack
                      }`}
                    >
                      {METHOD_LABELS[p.method ?? ''] ?? p.method ?? '-'}
                    </span>
                  </td>
                  <td className={s.ref}>
                    {p.reference ? (
                      <span className={s.transferRef}>
                        {p.reference.slice(-10)}
                      </span>
                    ) : p.transferReference ? (
                      <span className={s.transferRef}>
                        {p.transferReference}
                      </span>
                    ) : (
                      <span className={s.dim}>-</span>
                    )}
                  </td>
                  <td>
                    {new Date(p.createdAt).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td>
                    <span className={`${s.statusBadge} ${s[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className={s.actionCell}>
                      <button
                        className={s.receiptBtn}
                        onClick={() => setReceipt(p)}
                      >
                        Receipt
                      </button>
                      {p.status === 'pending' &&
                        p.method === 'direct_transfer' &&
                        (noteFor === p._id ? (
                          <div className={s.confirmForm}>
                            <input
                              className={s.noteInput}
                              placeholder='Admin note (optional)'
                              value={note}
                              onChange={e => setNote(e.target.value)}
                            />
                            <button
                              className={s.confirmBtn}
                              disabled={confirming === p._id}
                              onClick={() =>
                                confirmPayment(p._id, note || undefined)
                              }
                            >
                              {confirming === p._id ? '...' : 'Confirm'}
                            </button>
                            <button
                              className={s.cancelBtn}
                              onClick={() => setNoteFor(null)}
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className={s.confirmBtn}
                            onClick={() => setNoteFor(p._id)}
                          >
                            Confirm Transfer
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className={s.pagination}>
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage(p => p - 1)
              load(page - 1)
            }}
          >
            Prev
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => {
              setPage(p => p + 1)
              load(page + 1)
            }}
          >
            Next
          </button>
        </div>
      )}

      {receipt && (
        <ReceiptModal payment={receipt} onClose={() => setReceipt(null)} />
      )}
    </>
  )
}

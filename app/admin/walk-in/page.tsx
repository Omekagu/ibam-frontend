'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'
import { downloadReceipt } from '@/lib/receipt'

interface LabTest {
  _id: string
  name: string
  category: string
  walkInPrice?: number
  estimatedPrice?: number
  turnaroundHours: number
}

type Step = 'patient' | 'tests' | 'payment' | 'done'
type PayMethod = 'pos' | 'direct_transfer'

interface PatientInfo {
  name: string
  phone: string
  email: string
  notes: string
}

interface SuccessData {
  bookingRef: string
  patientName: string
  phone: string
  tests: string[]
  total: number
  payMethodLabel: string
  date: string
}

const PAY_METHODS: { value: PayMethod; label: string; desc: string }[] = [
  {
    value: 'pos',
    label: 'POS / Card',
    desc: 'Debit or credit card via POS terminal'
  },
  {
    value: 'direct_transfer',
    label: 'Bank Transfer',
    desc: 'Direct bank transfer to account'
  }
]

const STEP_ORDER: Step[] = ['patient', 'tests', 'payment', 'done']
const STEP_LABELS: Record<Step, string> = {
  patient: 'Patient Info',
  tests: 'Select Tests',
  payment: 'Payment',
  done: 'Done'
}

function stepIndex (st: Step) {
  return STEP_ORDER.indexOf(st)
}

export default function WalkInLabPage () {
  const [step, setStep] = useState<Step>('patient')
  const [allTests, setAllTests] = useState<LabTest[]>([])
  const [loadingTests, setLoadingTests] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [patient, setPatient] = useState<PatientInfo>({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [payMethod, setPayMethod] = useState<PayMethod>()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/admin/lab-tests')
      .then(r => setAllTests(r.data.data?.labTests ?? r.data.data?.tests ?? []))
      .catch(() => setAllTests([]))
      .finally(() => setLoadingTests(false))
  }, [])

  const filtered = allTests.filter(
    t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const grouped = filtered.reduce<Record<string, LabTest[]>>((acc, t) => {
    const cat = t.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  const selectedTests = allTests.filter(t => selected.includes(t.name))
  const total = selectedTests.reduce(
    (sum, t) => sum + (t.walkInPrice ?? t.estimatedPrice ?? 0),
    0
  )

  function toggleTest (name: string) {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  async function handleSubmit () {
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post('/admin/diagnostics/walk-in', {
        patientName: patient.name,
        patientPhone: patient.phone,
        patientEmail: patient.email || undefined,
        tests: selected,
        paymentMethod: payMethod,
        totalAmount: total,
        notes: patient.notes || undefined
      })
      const data = res.data.data
      const methodLabel =
        PAY_METHODS.find(m => m.value === payMethod)?.label ?? payMethod
      setSuccess({
        bookingRef: data.bookingRef,
        patientName: data.patient.name,
        phone: data.patient.phone,
        tests: selected,
        total,
        payMethodLabel: methodLabel,
        date: new Date().toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      })
      setStep('done')
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          'Failed to create request. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function resetAll () {
    setStep('patient')
    setSelected([])
    setPatient({ name: '', phone: '', email: '', notes: '' })
    setSuccess(null)
    setError('')
    setSearch('')
  }

  return (
    <div className={s.wrap}>
      {/* ── Page title ── */}
      <div className={s.pageHeader}>
        <div className={s.pageTitleRow}>
          <FlaskIcon />
          <div>
            <h1 className={s.pageTitle}>Walk-in Lab Registration</h1>
            <p className={s.pageSubtitle}>
              Register walk-in patients, select tests, and record payment on
              their behalf.
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className={s.stepper}>
          {STEP_ORDER.map((st, i) => {
            const done = stepIndex(st) < stepIndex(step)
            const active = st === step
            return (
              <div key={st} className={s.stepItem}>
                <div
                  className={`${s.stepBubble} ${active ? s.stepActive : ''} ${
                    done ? s.stepDone : ''
                  }`}
                >
                  {done ? <CheckIcon /> : <span>{i + 1}</span>}
                </div>
                <span
                  className={`${s.stepLabel} ${
                    active ? s.stepLabelActive : ''
                  }`}
                >
                  {STEP_LABELS[st]}
                </span>
                {i < STEP_ORDER.length - 1 && (
                  <div
                    className={`${s.stepLine} ${done ? s.stepLineDone : ''}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ─────────────── STEP 1: Patient Info ─────────────── */}
      {step === 'patient' && (
        <div className={s.card}>
          <h2 className={s.cardTitle}>Patient Information</h2>
          <p className={s.cardHint}>
            Enter the patient's details. If they already have an iBam account,
            their records will be linked automatically.
          </p>
          <div className={s.formGrid}>
            <label className={s.field}>
              <span className={s.label}>
                Full Name <em className={s.req}>*</em>
              </span>
              <input
                className={s.input}
                placeholder='e.g. John Adeyemi'
                value={patient.name}
                onChange={e =>
                  setPatient(p => ({ ...p, name: e.target.value }))
                }
                autoFocus
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>
                Phone Number <em className={s.req}>*</em>
              </span>
              <input
                className={s.input}
                placeholder='e.g. 08012345678'
                value={patient.phone}
                onChange={e =>
                  setPatient(p => ({ ...p, phone: e.target.value }))
                }
              />
            </label>
            <label className={s.field}>
              <span className={s.label}>
                Email <small className={s.optional}>(optional)</small>
              </span>
              <input
                className={s.input}
                type='email'
                placeholder='patient@example.com'
                value={patient.email}
                onChange={e =>
                  setPatient(p => ({ ...p, email: e.target.value }))
                }
              />
            </label>
            <label className={`${s.field} ${s.fieldFull}`}>
              <span className={s.label}>
                Clinical Notes <small className={s.optional}>(optional)</small>
              </span>
              <textarea
                className={`${s.input} ${s.textarea}`}
                placeholder='Referral info, symptoms, doctor notes…'
                value={patient.notes}
                onChange={e =>
                  setPatient(p => ({ ...p, notes: e.target.value }))
                }
              />
            </label>
          </div>
          <div className={s.actions}>
            <button
              className={s.btnPrimary}
              disabled={!patient.name.trim() || !patient.phone.trim()}
              onClick={() => setStep('tests')}
            >
              Next: Select Tests →
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── STEP 2: Test Selection ─────────────── */}
      {step === 'tests' && (
        <div className={s.card}>
          <div className={s.testTopRow}>
            <div>
              <h2 className={s.cardTitle}>Select Tests</h2>
              <p className={s.cardHint}>
                Choose all tests the patient needs. Walk-in prices shown.
              </p>
            </div>
            {selected.length > 0 && (
              <div className={s.selBadge}>
                {selected.length} selected &nbsp;·&nbsp; ₦
                {total.toLocaleString()}
              </div>
            )}
          </div>

          <div className={s.searchBar}>
            <MagnifyIcon />
            <input
              className={s.searchInput}
              placeholder='Search by test name or category…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button className={s.clearBtn} onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>

          {loadingTests ? (
            <div className={s.centered}>
              <Loader />
            </div>
          ) : filtered.length === 0 ? (
            <p className={s.empty}>
              No tests found{search ? ` for "${search}"` : '.'}
            </p>
          ) : (
            <div className={s.categoriesWrap}>
              {Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([cat, catTests]) => (
                  <div key={cat} className={s.catGroup}>
                    <p className={s.catLabel}>
                      {cat}
                      <span className={s.catCount}>{catTests.length}</span>
                    </p>
                    <div className={s.testRows}>
                      {catTests.map(t => {
                        const price = t.walkInPrice ?? t.estimatedPrice ?? 0
                        const sel = selected.includes(t.name)
                        return (
                          <label
                            key={t._id}
                            className={`${s.testRow} ${
                              sel ? s.testRowSel : ''
                            }`}
                          >
                            <span
                              className={`${s.checkBox} ${
                                sel ? s.checkBoxOn : ''
                              }`}
                            >
                              {sel && <CheckSmallIcon />}
                            </span>
                            <input
                              type='checkbox'
                              checked={sel}
                              onChange={() => toggleTest(t.name)}
                              className={s.hiddenCheck}
                            />
                            <span className={s.testName}>{t.name}</span>
                            <span className={s.turnaround}>
                              {t.turnaroundHours}h
                            </span>
                            <span className={s.testPrice}>
                              {price > 0 ? `₦${price.toLocaleString()}` : '—'}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {selected.length > 0 && (
            <div className={s.floatSummary}>
              <span className={s.floatCount}>
                {selected.length} test{selected.length !== 1 ? 's' : ''}{' '}
                selected
              </span>
              <span className={s.floatTotal}>₦{total.toLocaleString()}</span>
            </div>
          )}

          <div className={s.actions}>
            <button
              className={s.btnSecondary}
              onClick={() => setStep('patient')}
            >
              ← Back
            </button>
            <button
              className={s.btnPrimary}
              disabled={selected.length === 0}
              onClick={() => setStep('payment')}
            >
              Next: Payment →
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── STEP 3: Review & Payment ─────────────── */}
      {step === 'payment' && (
        <div className={s.card}>
          <h2 className={s.cardTitle}>Review & Record Payment</h2>

          {/* Patient */}
          <div className={s.reviewSection}>
            <p className={s.reviewSectionTitle}>Patient</p>
            <div className={s.reviewPatient}>
              <div className={s.avatarCircle}>
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={s.reviewName}>{patient.name}</p>
                <p className={s.reviewMeta}>
                  {patient.phone}
                  {patient.email ? ` · ${patient.email}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Tests */}
          <div className={s.reviewSection}>
            <p className={s.reviewSectionTitle}>
              Tests Selected ({selected.length})
            </p>
            <div className={s.reviewTestList}>
              {selectedTests.map(t => {
                const price = t.walkInPrice ?? t.estimatedPrice ?? 0
                return (
                  <div key={t._id} className={s.reviewTestRow}>
                    <span className={s.reviewTestName}>{t.name}</span>
                    <span className={s.reviewTestCat}>{t.category}</span>
                    <span className={s.reviewTestPrice}>
                      {price > 0 ? `₦${price.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                )
              })}
              <div className={s.reviewTotal}>
                <span>Total</span>
                <span className={s.reviewTotalVal}>
                  ₦{total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className={s.reviewSection}>
            <p className={s.reviewSectionTitle}>Payment Method</p>
            <div className={s.payGrid}>
              {PAY_METHODS.map(m => (
                <label
                  key={m.value}
                  className={`${s.payCard} ${
                    payMethod === m.value ? s.payCardActive : ''
                  }`}
                >
                  <input
                    type='radio'
                    name='payMethod'
                    value={m.value}
                    checked={payMethod === m.value}
                    onChange={() => setPayMethod(m.value)}
                    className={s.hiddenCheck}
                  />
                  <span
                    className={`${s.payDot} ${
                      payMethod === m.value ? s.payDotActive : ''
                    }`}
                  />
                  <div>
                    <p className={s.payLabel}>{m.label}</p>
                    <p className={s.payDesc}>{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <p className={s.errorMsg}>{error}</p>}

          <div className={s.actions}>
            <button
              className={s.btnSecondary}
              onClick={() => {
                setError('')
                setStep('tests')
              }}
            >
              ← Back
            </button>
            <button
              className={s.btnPrimary}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader size='sm' inline />
              ) : (
                `Confirm & Register →`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────── STEP 4: Success + Printable Ticket ─────────────── */}
      {step === 'done' && success && (
        <div className={s.card}>
          <div className={s.successBanner}>
            <div className={s.successCheck}>
              <CheckIcon />
            </div>
            <div>
              <h2 className={s.successTitle}>Registered Successfully</h2>
              <p className={s.successSub}>
                Walk-in request created and payment recorded.
              </p>
            </div>
          </div>

          {/* Printable ticket */}
          <div className={s.ticketWrap} id='walk-in-ticket'>
            <div className={s.ticket}>
              {/* Branded header stripe */}
              <div className={s.ticketHeader}>
                <div className={s.ticketHeaderLeft}>
                  <span className={s.ticketHeaderLogo}>iBam Health</span>
                  <span className={s.ticketHeaderSub}>Diagnostics Centre</span>
                </div>
                <div className={s.ticketHeaderRight}>
                  <span className={s.ticketHeaderBadge}>OFFICIAL RECEIPT</span>
                  <span className={s.ticketHeaderDate}>{success.date}</span>
                </div>
              </div>

              <div className={s.ticketBody}>
                <div className={s.ticketRefWrap}>
                  <span className={s.ticketRefLabel}>Booking Reference</span>
                  <span className={s.ticketRef}>{success.bookingRef}</span>
                </div>

                <div className={s.ticketGrid}>
                  <div className={s.ticketField}>
                    <span className={s.tLabel}>Patient</span>
                    <span className={s.tVal}>{success.patientName}</span>
                  </div>
                  <div className={s.ticketField}>
                    <span className={s.tLabel}>Phone</span>
                    <span className={s.tVal}>{success.phone}</span>
                  </div>
                  <div className={s.ticketField}>
                    <span className={s.tLabel}>Date</span>
                    <span className={s.tVal}>{success.date}</span>
                  </div>
                  <div className={s.ticketField}>
                    <span className={s.tLabel}>Payment</span>
                    <span className={s.tVal}>{success.payMethodLabel}</span>
                  </div>
                </div>

                <div className={s.ticketDivider} />

                <div className={s.ticketTests}>
                  <span className={s.tLabel}>Tests Requested</span>
                  <ul className={s.ticketTestList}>
                    {success.tests.map(t => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div className={s.ticketDivider} />

                <div className={s.ticketTotalRow}>
                  <span>Amount Paid</span>
                  <span className={s.ticketTotalVal}>
                    ₦{success.total.toLocaleString()}
                  </span>
                </div>

                <p className={s.ticketFooter}>
                  Present this slip at the sample collection point.
                  <br />
                  <strong>iBam Health</strong> · ibamhealth.com
                </p>
              </div>
            </div>
          </div>

          <div className={s.actions}>
            <button
              className={s.btnSecondary}
              onClick={() =>
                downloadReceipt({
                  bookingRef: success.bookingRef,
                  tests: success.tests,
                  amount: success.total,
                  collectionType: 'walk_in',
                  patientName: success.patientName,
                  paymentMethod: success.payMethodLabel
                })
              }
            >
              <PrintIcon /> Print Slip
            </button>
            <button className={s.btnPrimary} onClick={resetAll}>
              + Register Another Patient
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function FlaskIcon () {
  return (
    <svg
      width='22'
      height='22'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={1.8}
        d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
      />
    </svg>
  )
}
function CheckIcon () {
  return (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2.5}
        d='M5 13l4 4L19 7'
      />
    </svg>
  )
}
function CheckSmallIcon () {
  return (
    <svg
      width='10'
      height='10'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={3}
        d='M5 13l4 4L19 7'
      />
    </svg>
  )
}
function MagnifyIcon () {
  return (
    <svg
      width='15'
      height='15'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      style={{ flexShrink: 0, opacity: 0.45 }}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      />
    </svg>
  )
}
function PrintIcon () {
  return (
    <svg
      width='15'
      height='15'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      style={{ flexShrink: 0 }}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
      />
    </svg>
  )
}

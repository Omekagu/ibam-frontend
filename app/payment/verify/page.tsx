'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { downloadReceipt } from '@/lib/receipt'
import { DownloadIcon } from '@/components/icons'
import styles from './page.module.scss'

type Stage = 'loading' | 'success' | 'failed' | 'error'

interface ReceiptInfo {
  bookingRef: string
  amount: number
  tests: string[]
  collectionType: 'walk_in' | 'home_visit'
  transactionRef: string
  packageName?: string
}

export default function PaymentVerifyPage () {
  return (
    <Suspense fallback={
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading…</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}

function VerifyContent () {
  const params = useSearchParams()
  const reference = params.get('reference') || params.get('trxref') || ''
  const [stage, setStage] = useState<Stage>('loading')
  const [info, setInfo] = useState<ReceiptInfo | null>(null)
  const [downloading, setDownloading] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (!reference || ran.current) return
    ran.current = true

    ;(async () => {
      try {
        const res = await api.get(`/payments/verify/${reference}`)
        const payment = res.data.data?.payment
        if (!payment || payment.status !== 'success') {
          setStage('failed')
          return
        }

        // Fetch the associated DiagnosticsRequest for tests list
        let tests: string[] = []
        let collectionType: 'walk_in' | 'home_visit' = 'walk_in'
        let packageName: string | undefined

        if (payment.serviceRef) {
          try {
            const reqRes = await api.get('/diagnostics/results/mine')
            const reqs: Array<{ _id: string; tests: string[]; collectionType: string }> =
              reqRes.data.data?.requests ?? []
            const matched = reqs.find(r => r._id === payment.serviceRef)
            if (matched) {
              tests = matched.tests ?? []
              collectionType = (matched.collectionType as 'walk_in' | 'home_visit') ?? 'walk_in'
            }
          } catch { /* non-fatal — receipt will show without tests */ }
        }

        const bookingRef = `#${(payment.serviceRef || reference).toString().slice(-8).toUpperCase()}`

        const receiptInfo: ReceiptInfo = {
          bookingRef,
          amount: payment.amount,
          tests,
          collectionType,
          transactionRef: reference,
          packageName,
        }
        setInfo(receiptInfo)
        setStage('success')

        // Auto-open receipt in same window (print dialog)
        downloadReceipt(receiptInfo)
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 401) {
          // Auth expired — redirect to login with return URL
          window.location.href = '/login?redirect=/patient/labs'
        } else {
          setStage('error')
        }
      }
    })()
  }, [reference])

  function handleDownload () {
    if (!info) return
    setDownloading(true)
    downloadReceipt(info)
    setTimeout(() => setDownloading(false), 1500)
  }

  if (stage === 'loading') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Confirming your payment…</p>
        </div>
      </div>
    )
  }

  if (stage === 'failed') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.iconWrap} data-variant='pending'>
            <svg width='40' height='40' viewBox='0 0 24 24' fill='none'>
              <circle cx='12' cy='12' r='10' stroke='#f59e0b' strokeWidth='2' />
              <path d='M12 8v4M12 16h.01' stroke='#f59e0b' strokeWidth='2.5' strokeLinecap='round' />
            </svg>
          </div>
          <h1 className={styles.title}>Payment Not Yet Confirmed</h1>
          <p className={styles.sub}>
            Your payment hasn&apos;t been confirmed yet. If you completed the payment, go back to the app and click <strong>&quot;Verify &amp; Get Receipt&quot;</strong>.
          </p>
          <Link href='/patient/labs?tab=results' className={styles.primaryBtn}>
            Return to My Results
          </Link>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.iconWrap} data-variant='error'>
            <svg width='40' height='40' viewBox='0 0 24 24' fill='none'>
              <circle cx='12' cy='12' r='10' stroke='#ef4444' strokeWidth='2' />
              <path d='M15 9l-6 6M9 9l6 6' stroke='#ef4444' strokeWidth='2.5' strokeLinecap='round' />
            </svg>
          </div>
          <h1 className={styles.title}>Verification Error</h1>
          <p className={styles.sub}>
            Something went wrong while verifying your payment. Your payment may still have gone through — please return to the app and click <strong>&quot;Verify &amp; Get Receipt&quot;</strong>.
          </p>
          <Link href='/patient/labs?tab=results' className={styles.primaryBtn}>
            Return to My Results
          </Link>
        </div>
      </div>
    )
  }

  // success
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.iconWrap} data-variant='success'>
          <svg width='44' height='44' viewBox='0 0 24 24' fill='none'>
            <circle cx='12' cy='12' r='10' stroke='#22c55e' strokeWidth='2' />
            <path d='M8 12l3 3 5-5' stroke='#22c55e' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </div>

        <h1 className={styles.title}>Payment Confirmed!</h1>
        <p className={styles.sub}>
          Your booking is confirmed. A receipt has opened in a new tab — you can save it as PDF.
        </p>

        {info && (
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Booking Reference</span>
              <span className={styles.summaryVal} data-ref>{info.bookingRef}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Amount Paid</span>
              <span className={styles.summaryVal}>₦{info.amount.toLocaleString('en-NG')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Collection</span>
              <span className={styles.summaryVal}>
                {info.collectionType === 'walk_in' ? 'Walk-in at Lab' : 'Home Visit'}
              </span>
            </div>
            {info.tests.length > 0 && (
              <div className={styles.summaryRow} data-col>
                <span className={styles.summaryKey}>Tests</span>
                <span className={styles.summaryVal}>
                  {info.tests.join(' · ')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Opening…' : <><DownloadIcon size={14} /> Download Receipt (PDF)</>}
          </button>
          <Link href='/patient/labs?tab=results' className={styles.secondaryBtn}>
            Go to My Results
          </Link>
        </div>

        <p className={styles.hint}>
          Present your Booking Reference <strong>{info?.bookingRef}</strong> at the lab or during your home visit.
        </p>
      </div>
    </div>
  )
}

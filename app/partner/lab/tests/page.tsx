'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Test { name: string; price: number; turnaroundHours: number }

export default function ManageTestsPage () {
  const [tests,   setTests]   = useState<Test[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/diagnostics/labs/profile')
      setTests(r.data.data?.lab?.testsOffered ?? [])
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Test Catalog</h1>
          <p className={s.subtitle}>Your lab&apos;s test catalog is managed by the iBam Health admin team. Contact support to add or update tests.</p>
        </div>
      </div>

      {loading ? (
        <p className={s.empty}>Loading your test catalog…</p>
      ) : tests.length === 0 ? (
        <p className={s.empty}>No tests have been added to your lab yet. Please contact the iBam admin team.</p>
      ) : (
        <div className={s.tableWrap}>
          <div className={s.tableHead}>
            <span>Test Name</span>
            <span>Price (₦)</span>
            <span>Turnaround (hrs)</span>
          </div>

          <div className={s.tableBody}>
            {tests.map((row, i) => (
              <div key={i} className={s.tableRow}>
                <span className={s.cell}>{row.name}</span>
                <span className={s.cell}>₦{row.price.toLocaleString()}</span>
                <span className={s.cell}>{row.turnaroundHours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={s.hint}>
        <p>Test prices, names, and turnaround times are set by the platform administrator.</p>
      </div>
    </div>
  )
}

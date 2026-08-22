'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import s from './page.module.scss'

type Tab = 'all' | 'labs' | 'recommendations'

interface LabResult {
  _id: string
  tests: { name: string; result?: string; referenceRange?: string; unit?: string; status?: string }[]
  status: string
  createdAt: string
}

interface LabMarker {
  name: string
  value: string
  unit: string
  status: 'normal' | 'low' | 'high' | 'desirable'
  label: string
}

const RECO_ITEMS = [
  { icon: '☀️', title: 'Increase vitamin D with 15–20 mins of daily sunlight.' },
  { icon: '🐟', title: 'Consider omega-3 rich foods 2–3 times per week.' },
  { icon: '💧', title: 'Stay consistent with hydration and prioritize quality sleep.' },
  { icon: '🚶', title: 'Aim for 30 minutes of moderate activity on most days.' },
]

function statusLabel (st?: string): LabMarker['status'] {
  if (!st) return 'normal'
  const s = st.toLowerCase()
  if (s === 'low')  return 'low'
  if (s === 'high') return 'high'
  if (s.includes('desirable') || s.includes('optimal')) return 'desirable'
  return 'normal'
}

export default function HealthInsightsPage () {
  const [tab, setTab]           = useState<Tab>('all')
  const [markers, setMarkers]   = useState<LabMarker[]>([])
  const [labDate, setLabDate]   = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/diagnostics/requests?limit=20&status=resulted')
      .then(r => {
        const reqs: LabResult[] = r.data.data?.requests ?? []
        // Find most recent resulted request with test values
        const recent = reqs.find(r => r.tests?.some(t => t.result))
        if (recent) {
          setLabDate(new Date(recent.createdAt).toLocaleDateString('en-NG', { month: 'long', day: 'numeric' }))
          const extracted: LabMarker[] = recent.tests
            .filter(t => t.result)
            .slice(0, 6)
            .map(t => ({
              name: t.name,
              value: t.result ?? '—',
              unit: t.unit ?? '',
              status: statusLabel(t.status),
              label: t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase()) : 'Normal',
            }))
          setMarkers(extracted)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hasLabs   = markers.length > 0
  const flagged   = markers.filter(m => m.status === 'low' || m.status === 'high')

  const aiSummary = hasLabs
    ? `Your labs from ${labDate || 'your last visit'} look ${flagged.length === 0 ? 'within normal range' : 'mostly within range'}. ${flagged.length > 0 ? `${flagged.length} marker${flagged.length > 1 ? 's' : ''} could use attention.` : 'Everything looks great!'}`
    : 'Order a lab test to get a personalised AI summary of your health markers.'

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all',             label: 'All'             },
    { key: 'labs',            label: 'Labs'            },
    { key: 'recommendations', label: 'Recommendations' },
  ]

  return (
    <>
      {/* ── Tab bar ── */}
      <div className={s.tabs}>
        {TABS.map(t => (
          <button key={t.key} className={`${s.tab} ${tab === t.key ? s.active : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── AI Health Summary ── */}
      {(tab === 'all' || tab === 'labs') && (
        <div className={s.aiCard}>
          <div className={s.aiCardLeft}>
            <div className={s.aiCardTitle}>
              <span className={s.aiDot} />
              AI Health Summary
            </div>
            <p className={s.aiCardText}>{aiSummary}</p>
            <p className={s.aiCardMeta}>
              Generated today at {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              <span className={s.infoIcon}>ⓘ</span>
            </p>
          </div>
          <div className={s.aiCardRight}>
            <div className={s.radialWrap}>
              <svg viewBox='0 0 60 60' width='72' height='72'>
                <circle cx='30' cy='30' r='24' fill='none' stroke='rgba(255,255,255,0.15)' strokeWidth='5' />
                <circle cx='30' cy='30' r='24' fill='none' stroke='rgba(255,255,255,0.8)' strokeWidth='5'
                  strokeDasharray={`${hasLabs ? 120 : 60} 151`} strokeLinecap='round'
                  transform='rotate(-90 30 30)' />
              </svg>
              <span className={s.radialPct}>{hasLabs ? (flagged.length === 0 ? '92' : '78') : '—'}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Lab markers ── */}
      {(tab === 'all' || tab === 'labs') && (
        <div className={s.panel}>
          {loading ? (
            <p className={s.empty}>Loading lab results…</p>
          ) : markers.length === 0 ? (
            <div className={s.emptyState}>
              <p className={s.emptyTitle}>No lab results yet</p>
              <p className={s.emptySub}>Order a lab test to see your health markers here.</p>
              <Link href='/patient/labs' className={s.labsBtn}>Order Lab Test</Link>
            </div>
          ) : (
            <>
              <div className={s.markersGrid}>
                {markers.slice(0, 4).map((m, i) => (
                  <div key={i} className={`${s.markerCard} ${s[`status_${m.status}`]}`}>
                    <p className={s.markerName}>{m.name}</p>
                    <p className={s.markerValue}>{m.value}</p>
                    <p className={s.markerUnit}>{m.unit}</p>
                    <div className={`${s.markerBar} ${s[`bar_${m.status}`]}`} />
                    <p className={s.markerLabel}>{m.label}</p>
                  </div>
                ))}
              </div>
              <Link href='/patient/labs' className={s.reportBtn}>
                <svg width='15' height='15' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/>
                </svg>
                View Full Report
                <svg width='14' height='14' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M9 5l7 7-7 7'/>
                </svg>
              </Link>
            </>
          )}
        </div>
      )}

      {/* ── Personalized Recommendations ── */}
      {(tab === 'all' || tab === 'recommendations') && (
        <div className={s.section}>
          <h3 className={s.sectionTitle}>Personalized Recommendations</h3>
          <div className={s.recoList}>
            {RECO_ITEMS.map((r, i) => (
              <div key={i} className={s.recoItem}>
                <span className={s.recoIcon}>{r.icon}</span>
                <p className={s.recoText}>{r.title}</p>
                <svg className={s.recoArrow} width='14' height='14' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M9 5l7 7-7 7'/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

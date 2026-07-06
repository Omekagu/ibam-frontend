'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Medication { name: string; dosage: string; frequency: string; duration: string; instructions?: string }
interface Prescription {
  _id: string
  doctor: { name: string }
  medications: Medication[]
  diagnosis?: string
  instructions?: string
  status: string
  createdAt: string
  forwardedToPharmacy: boolean
}

interface LabRequest {
  _id: string
  tests: string[]
  lab?: { name: string }
  collectionType: string
  status: string
  createdAt: string
}

interface LabResult {
  _id: string
  request: string
  fileUrl: string
  notes?: string
  createdAt: string
}

type Tab = 'prescriptions' | 'labs'

export default function HealthRecords () {
  const [tab,           setTab]           = useState<Tab>('prescriptions')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [requests,      setRequests]      = useState<LabRequest[]>([])
  const [results,       setResults]       = useState<LabResult[]>([])
  const [loading,       setLoading]       = useState(true)
  const [expanding,     setExpanding]     = useState<string | null>(null)
  const [forwarding,    setForwarding]    = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/prescriptions/mine'),
      api.get('/diagnostics/results/mine'),
    ]).then(([rxRes, labRes]) => {
      setPrescriptions(rxRes.data.data?.prescriptions ?? [])
      setRequests(labRes.data.data?.requests ?? [])
      setResults(labRes.data.data?.results ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function forwardToPharmacy (id: string) {
    setForwarding(id)
    try {
      await api.put(`/prescriptions/${id}/forward-pharmacy`)
      setPrescriptions(prev => prev.map(p => p._id === id ? { ...p, forwardedToPharmacy: true } : p))
    } catch { }
    setForwarding(null)
  }

  const resultMap = new Map(results.map(r => [r.request, r]))

  return (
    <>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'prescriptions' ? s.active : ''}`} onClick={() => setTab('prescriptions')}>
          💊 Prescriptions
        </button>
        <button className={`${s.tab} ${tab === 'labs' ? s.active : ''}`} onClick={() => setTab('labs')}>
          🔬 Lab Results
        </button>
      </div>

      {loading ? (
        <div className={s.empty}>Loading records…</div>
      ) : tab === 'prescriptions' ? (
        prescriptions.length === 0 ? (
          <div className={s.empty}>No prescriptions yet.</div>
        ) : (
          <div className={s.list}>
            {prescriptions.map(p => (
              <div key={p._id} className={s.card}>
                <div className={s.cardTop} onClick={() => setExpanding(expanding === p._id ? null : p._id)}>
                  <div className={s.cardLeft}>
                    <div className={s.rxIcon}>💊</div>
                    <div>
                      <p className={s.cardTitle}>{p.medications.map(m => m.name).join(', ')}</p>
                      <span>Dr. {p.doctor?.name ?? '—'} · {new Date(p.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className={s.cardRight}>
                    <span className={`${s.statusBadge} ${s[p.status]}`}>{p.status}</span>
                    {p.forwardedToPharmacy && <span className={s.fwdBadge}>Sent to Pharmacy</span>}
                    <span className={s.chevron}>{expanding === p._id ? '▲' : '▼'}</span>
                  </div>
                </div>
                {expanding === p._id && (
                  <div className={s.cardBody}>
                    {p.diagnosis && <p className={s.diagnosis}><strong>Diagnosis:</strong> {p.diagnosis}</p>}
                    <div className={s.medList}>
                      {p.medications.map((m, i) => (
                        <div key={i} className={s.medItem}>
                          <p className={s.medName}>{m.name} — {m.dosage}</p>
                          <p className={s.medMeta}>{m.frequency} · {m.duration}</p>
                          {m.instructions && <p className={s.medNote}>{m.instructions}</p>}
                        </div>
                      ))}
                    </div>
                    {p.instructions && <p className={s.instructions}>{p.instructions}</p>}
                    {!p.forwardedToPharmacy && p.status === 'active' && (
                      <button
                        className={s.fwdBtn}
                        disabled={forwarding === p._id}
                        onClick={() => forwardToPharmacy(p._id)}
                      >
                        {forwarding === p._id ? 'Forwarding…' : '💊 Send to Pharmacy'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <div className={s.empty}>No lab requests yet.</div>
        ) : (
          <div className={s.list}>
            {requests.map(req => {
              const result = resultMap.get(req._id)
              return (
                <div key={req._id} className={s.card}>
                  <div className={s.cardTop}>
                    <div className={s.cardLeft}>
                      <div className={s.rxIcon}>🔬</div>
                      <div>
                        <p className={s.cardTitle}>{req.tests.join(', ')}</p>
                        <span>{req.lab?.name ?? 'Lab not assigned'} · {req.collectionType.replace('_', ' ')} · {new Date(req.createdAt).toLocaleDateString("en-NG")}</span>
                      </div>
                    </div>
                    <div className={s.cardRight}>
                      <span className={`${s.statusBadge} ${s[req.status]}`}>{req.status}</span>
                    </div>
                  </div>
                  {result && (
                    <div className={s.cardBody}>
                      <p className={s.resultReady}>Your results are ready.</p>
                      {result.notes && <p className={s.resultNotes}>{result.notes}</p>}
                      <a href={result.fileUrl} target='_blank' rel='noreferrer' className={s.downloadBtn}>
                        📄 Download Report
                      </a>
                    </div>
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

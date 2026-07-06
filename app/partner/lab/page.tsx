'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface Patient  { name: string; phone?: string; email: string }
interface Request  {
  _id: string
  tests: string[]
  collectionType: 'home_visit' | 'walk_in'
  status: string
  notes?: string
  createdAt: string
  patient?: Patient
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', assigned: 'Assigned', sample_collected: 'Sample Collected',
  processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled',
}

export default function LabPartnerDashboard () {
  const [requests,   setRequests]   = useState<Request[]>([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [uploading,  setUploading]  = useState<string | null>(null)
  const [notes,      setNotes]      = useState<Record<string, string>>({})
  const [successMsg, setSuccessMsg] = useState<Record<string, string>>({})
  const fileRefs    = useRef<Record<string, HTMLInputElement | null>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/diagnostics/labs/requests')
      setRequests(r.data.data?.requests ?? [])
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function uploadResult (requestId: string) {
    const fileInput = fileRefs.current[requestId]
    const file = fileInput?.files?.[0]
    if (!file) { alert('Please select a PDF or image file.'); return }

    setUploading(requestId)
    try {
      const form = new FormData()
      form.append('result', file)
      if (notes[requestId]) form.append('notes', notes[requestId])
      await api.post(`/diagnostics/${requestId}/upload-result`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'completed' } : r))
      setSuccessMsg(prev => ({ ...prev, [requestId]: 'Result uploaded successfully!' }))
      if (fileInput) fileInput.value = ''
    } catch { alert('Upload failed. Please try again.') }
    setUploading(null)
  }

  async function markCollected (requestId: string) {
    try {
      await api.put(`/diagnostics/${requestId}/mark-collected`)
      setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'sample_collected' } : r))
    } catch { alert('Failed to update status.') }
  }

  const active    = requests.filter(r => !['completed', 'cancelled'].includes(r.status))
  const completed = requests.filter(r => r.status === 'completed')

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Test Requests</h1>
        <button className={s.refreshBtn} onClick={load}>Refresh</button>
      </div>

      <div className={s.stats}>
        <div className={s.stat}><span className={s.statNum}>{active.length}</span><span>Active</span></div>
        <div className={s.stat}><span className={s.statNum}>{completed.length}</span><span>Completed</span></div>
        <div className={s.stat}><span className={s.statNum}>{requests.length}</span><span>Total</span></div>
      </div>

      {loading ? (
        <div className={s.empty}>Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className={s.empty}>No test requests assigned to your lab yet.</div>
      ) : (
        <div className={s.list}>
          {requests.map(req => {
            const isExpanded = expanded === req._id
            return (
              <div key={req._id} className={`${s.card} ${req.status === 'completed' ? s.cardDone : ''}`}>
                <div className={s.cardHead} onClick={() => setExpanded(isExpanded ? null : req._id)}>
                  <div className={s.cardLeft}>
                    <span className={`${s.statusBadge} ${s[`badge_${req.status}`]}`}>
                      {STATUS_LABEL[req.status] ?? req.status}
                    </span>
                    <div>
                      <p className={s.patientName}>{req.patient?.name ?? 'Patient'}</p>
                      <p className={s.testList}>{req.tests.slice(0, 2).join(', ')}{req.tests.length > 2 ? ` +${req.tests.length - 2} more` : ''}</p>
                    </div>
                  </div>
                  <div className={s.cardRight}>
                    <span className={s.collection}>{req.collectionType === 'home_visit' ? 'Home Visit' : 'Walk-in'}</span>
                    <span className={s.date}>{new Date(req.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                    <span className={s.chevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className={s.cardBody}>
                    <div className={s.allTests}>
                      <p className={s.sectionLabel}>Tests Requested</p>
                      {req.tests.map((t, i) => <span key={i} className={s.testTag}>{t}</span>)}
                    </div>

                    {req.patient?.phone && <p className={s.info}>Phone: {req.patient.phone}</p>}
                    {req.patient?.email && <p className={s.info}>Email: {req.patient.email}</p>}
                    {req.notes && <p className={s.infoNote}>Patient notes: {req.notes}</p>}

                    {successMsg[req._id] && <p className={s.success}>{successMsg[req._id]}</p>}

                    {!['completed', 'cancelled'].includes(req.status) && (
                      <>
                        {req.collectionType === 'home_visit' && req.status === 'assigned' && (
                          <button className={s.collectBtn} onClick={() => markCollected(req._id)}>
                            Mark Sample Collected
                          </button>
                        )}

                        <div className={s.uploadSection}>
                          <p className={s.sectionLabel}>Upload Result</p>
                          <div className={s.uploadRow}>
                            <input
                              type='file'
                              accept='.pdf,image/*'
                              ref={el => { fileRefs.current[req._id] = el }}
                              className={s.fileInput}
                            />
                            <textarea
                              className={s.notesInput}
                              rows={2}
                              placeholder='Add notes about the results (optional)…'
                              value={notes[req._id] ?? ''}
                              onChange={e => setNotes(prev => ({ ...prev, [req._id]: e.target.value }))}
                            />
                            <button
                              className={s.uploadBtn}
                              disabled={uploading === req._id}
                              onClick={() => uploadResult(req._id)}
                            >
                              {uploading === req._id ? 'Uploading…' : 'Upload & Complete'}
                            </button>
                          </div>
                        </div>
                      </>
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

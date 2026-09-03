'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { ChevronUpIcon, ChevronDownIcon } from '@/components/icons'
import s from './page.module.scss'

interface AdminUser { name: string; email: string }

interface AuditLog {
  _id: string
  admin: AdminUser
  actorRole?: string
  action: string
  targetModel?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}

const ACTION_LABELS: Record<string, string> = {
  approve_doctor: 'Approved Doctor',
  suspend_user:   'Suspended User',
  approve_payout: 'Approved Payout',
  update_pharmacy_status: 'Updated Pharmacy',
  update_lab_status:      'Updated Lab',
  approve_drug:   'Approved Drug',
  approve_order:  'Approved Order',
  approve_test:   'Approved Test',
  update_triage_questions:    'Updated Triage',
  create_walkin_lab:          'Walk-in Registered (Admin)',
  lab_walk_in_registered:     'Walk-in Registered (Lab)',
  lab_request_claimed:        'Lab Request Claimed',
  lab_request_status_updated: 'Lab Status Updated',
  lab_result_uploaded:        'Lab Result Uploaded',
  lab_payout_requested:       'Lab Payout Requested',
  create_lab:                 'Lab Created',
  update_lab_tests:           'Lab Tests Updated',
  impersonate_lab:            'Lab Impersonated',
}

const LAB_ACTIONS = new Set([
  'create_walkin_lab', 'lab_walk_in_registered', 'lab_request_claimed',
  'lab_request_status_updated', 'lab_result_uploaded', 'lab_payout_requested',
  'create_lab', 'update_lab_tests', 'impersonate_lab',
])

type AuditView = 'all' | 'lab'

export default function AuditPage () {
  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [exp,     setExp]     = useState<string | null>(null)
  const [view,    setView]    = useState<AuditView>('all')

  function load (pg = page, q = search, v = view) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: '30' })
    const effectiveQ = v === 'lab' ? (q || 'lab') : q
    if (effectiveQ) params.set('action', effectiveQ)
    api.get(`/admin/audit?${params}`)
      .then(r => { setLogs(r.data.data?.logs ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function doSearch () { setPage(1); load(1, search, view) }

  function switchView (v: AuditView) {
    setView(v)
    setPage(1)
    setSearch('')
    load(1, '', v)
  }

  const pages = Math.ceil(total / 30)

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Audit Log</h1>
          <p className={s.subtitle}>All staff actions recorded — {total.toLocaleString()} entries</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className={s.viewTabs}>
            <button className={`${s.viewTab} ${view === 'all' ? s.viewTabActive : ''}`} onClick={() => switchView('all')}>All</button>
            <button className={`${s.viewTab} ${view === 'lab' ? s.viewTabActive : ''}`} onClick={() => switchView('lab')}>Lab Activity</button>
          </div>
          <button className={s.refreshBtn} onClick={() => load()}>Refresh</button>
        </div>
      </div>

      <div className={s.toolbar}>
        <input
          className={s.search}
          placeholder={view === 'lab' ? 'Filter lab actions…' : 'Filter by action keyword…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch()}
        />
        <button className={s.searchBtn} onClick={doSearch}>Search</button>
        {search && (
          <button className={s.clearBtn} onClick={() => { setSearch(''); load(1, '') }}>Clear</button>
        )}
      </div>

      <div className={s.panel}>
        {loading ? <p className={s.empty}>Loading…</p> : logs.length === 0 ? (
          <p className={s.empty}>No audit entries found.</p>
        ) : (
          <div className={s.list}>
            {logs.map(log => (
              <div key={log._id} className={s.row}>
                <div className={s.rowHead} onClick={() => setExp(exp === log._id ? null : log._id)}>
                  <div className={s.rowLeft}>
                    <div className={`${s.adminAvatar} ${LAB_ACTIONS.has(log.action) ? s.adminAvatarLab : ''}`}>
                      {log.admin?.name?.[0] ?? 'A'}
                    </div>
                    <div>
                      <p className={s.adminName}>{log.admin?.name ?? 'Admin'}</p>
                      <p className={s.adminEmail}>
                        {log.actorRole ?? log.admin?.email ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className={s.rowMid}>
                    <span className={`${s.actionBadge} ${LAB_ACTIONS.has(log.action) ? s.actionBadgeLab : ''}`}>
                      {ACTION_LABELS[log.action] ?? log.action.replace(/_/g, ' ')}
                    </span>
                    {log.targetModel && (
                      <span className={s.model}>{log.targetModel}</span>
                    )}
                    {/* Show amount for walk-in registrations */}
                    {(log.action === 'lab_walk_in_registered' || log.action === 'create_walkin_lab') &&
                      typeof log.details?.totalAmount === 'number' && log.details.totalAmount > 0 && (
                      <span className={s.amountChip}>
                        ₦{(log.details.totalAmount as number).toLocaleString()}
                        {log.details.paymentMethod ? ` · ${log.details.paymentMethod}` : ''}
                      </span>
                    )}
                  </div>
                  <div className={s.rowRight}>
                    {log.ipAddress && <span className={s.ip}>{log.ipAddress}</span>}
                    <span className={s.date}>
                      {new Date(log.createdAt).toLocaleString('en-NG', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <span className={s.chevron}>{exp === log._id ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}</span>
                  </div>
                </div>

                {exp === log._id && (
                  <div className={s.rowBody}>
                    <div className={s.detailGrid}>
                      <div>
                        <p className={s.detailLabel}>Action</p>
                        <p className={s.detailVal}>{log.action}</p>
                      </div>
                      {log.targetModel && (
                        <div>
                          <p className={s.detailLabel}>Target Model</p>
                          <p className={s.detailVal}>{log.targetModel}</p>
                        </div>
                      )}
                      {log.targetId && (
                        <div>
                          <p className={s.detailLabel}>Target ID</p>
                          <p className={s.detailValMono}>{String(log.targetId)}</p>
                        </div>
                      )}
                      {log.ipAddress && (
                        <div>
                          <p className={s.detailLabel}>IP Address</p>
                          <p className={s.detailValMono}>{log.ipAddress}</p>
                        </div>
                      )}
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className={s.details}>
                        <p className={s.detailLabel}>Payload</p>
                        <pre className={s.detailJson}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className={s.pagination}>
          <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1) }}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => { setPage(p => p + 1); load(page + 1) }}>Next →</button>
        </div>
      )}
    </div>
  )
}

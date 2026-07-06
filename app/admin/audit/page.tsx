'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface AdminUser { name: string; email: string }

interface AuditLog {
  _id: string
  admin: AdminUser
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
  approve_drug:  'Approved Drug',
  approve_order: 'Approved Order',
  approve_test:  'Approved Test',
  update_triage_questions: 'Updated Triage',
}

export default function AuditPage () {
  const [logs,    setLogs]    = useState<AuditLog[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const [exp,     setExp]     = useState<string | null>(null)

  function load (pg = page, q = search) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: '30' })
    if (q) params.set('action', q)
    api.get(`/admin/audit?${params}`)
      .then(r => { setLogs(r.data.data?.logs ?? []); setTotal(r.data.data?.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function doSearch () { setPage(1); load(1, search) }

  const pages = Math.ceil(total / 30)

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Audit Log</h1>
          <p className={s.subtitle}>Every admin action recorded — {total.toLocaleString()} entries</p>
        </div>
        <button className={s.refreshBtn} onClick={() => load()}>Refresh</button>
      </div>

      <div className={s.toolbar}>
        <input
          className={s.search}
          placeholder='Filter by action keyword…'
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
                    <div className={s.adminAvatar}>{log.admin?.name?.[0] ?? 'A'}</div>
                    <div>
                      <p className={s.adminName}>{log.admin?.name ?? 'Admin'}</p>
                      <p className={s.adminEmail}>{log.admin?.email ?? ''}</p>
                    </div>
                  </div>
                  <div className={s.rowMid}>
                    <span className={s.actionBadge}>
                      {ACTION_LABELS[log.action] ?? log.action.replace(/_/g, ' ')}
                    </span>
                    {log.targetModel && (
                      <span className={s.model}>{log.targetModel}</span>
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
                    <span className={s.chevron}>{exp === log._id ? '▲' : '▼'}</span>
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

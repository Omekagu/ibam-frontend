'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'

interface DrugEntry {
  _id: string
  name: string
  price: number
  unit: string
  requiresPrescription: boolean
  inStock: boolean
  adminApproved: boolean
  pharmacyId: string
  pharmacyName: string
  pharmacyAddress: string
}

export default function DrugsPage () {
  const [drugs,   setDrugs]   = useState<DrugEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<'all' | 'pending' | 'approved'>('all')
  const [acting,  setActing]  = useState<string | null>(null)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/admin/drugs')
      setDrugs(r.data.data?.drugs ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleApproval (drug: DrugEntry) {
    setActing(drug._id)
    try {
      await api.put(`/admin/pharmacy/${drug.pharmacyId}/drug/${drug._id}/approve`, {
        approved: !drug.adminApproved,
      })
      setDrugs(prev => prev.map(d => d._id === drug._id ? { ...d, adminApproved: !drug.adminApproved } : d))
    } catch { alert('Action failed.') }
    setActing(null)
  }

  const filtered = drugs.filter(d => {
    const matchFilter = filter === 'all' || (filter === 'pending' ? !d.adminApproved : d.adminApproved)
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.pharmacyName.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const pendingCount = drugs.filter(d => !d.adminApproved).length

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Drug Catalog</h1>
          <p className={s.subtitle}>Review and approve drugs listed by pharmacy partners.</p>
        </div>
        <button className={s.refreshBtn} onClick={load}>Refresh</button>
      </div>

      <div className={s.toolbar}>
        <input className={s.search} placeholder='Search drug or pharmacy…' value={search}
          onChange={e => setSearch(e.target.value)} />
        <div className={s.filters}>
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button key={f} className={`${s.filterBtn} ${filter === f ? s.active : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${drugs.length})` : f === 'pending' ? `Pending (${pendingCount})` : `Approved (${drugs.length - pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className={s.empty}><Loader label='Loading drug catalog…' /></div>
        : filtered.length === 0 ? <p className={s.empty}>No drugs match your filter.</p>
        : (
          <div className={s.tableWrap}>
            <div className={s.tableHead}>
              <span>Drug Name</span>
              <span>Price</span>
              <span>Unit</span>
              <span>Rx</span>
              <span>Stock</span>
              <span>Pharmacy</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            <div className={s.tableBody}>
              {filtered.map(d => (
                <div key={d._id} className={s.tableRow}>
                  <span className={s.drugName}>{d.name}</span>
                  <span>₦{d.price.toLocaleString()}</span>
                  <span className={s.muted}>{d.unit}</span>
                  <span>{d.requiresPrescription ? <span className={s.rxYes}>Yes</span> : <span className={s.rxNo}>No</span>}</span>
                  <span>{d.inStock ? <span className={s.inStock}>In Stock</span> : <span className={s.outStock}>Out</span>}</span>
                  <div className={s.pharmacyCell}>
                    <span className={s.pharmacyName}>{d.pharmacyName}</span>
                    <span className={s.pharmacyAddr}>{d.pharmacyAddress}</span>
                  </div>
                  <span>{d.adminApproved ? <span className={s.approvedBadge}>Approved</span> : <span className={s.pendingBadge}>Pending</span>}</span>
                  <button
                    className={d.adminApproved ? s.revokeBtn : s.approveBtn}
                    disabled={acting === d._id}
                    onClick={() => toggleApproval(d)}
                  >
                    {acting === d._id ? '…' : d.adminApproved ? 'Revoke' : 'Approve'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      }
    </div>
  )
}

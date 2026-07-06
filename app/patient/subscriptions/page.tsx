'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import api from '@/lib/api'
import s from './page.module.scss'

interface SubItem  { name: string; price: number; qty: number }
interface TestItem { name: string; price: number }
interface Subscription {
  _id: string
  type: 'drug' | 'test'
  pharmacy?: { name: string }
  lab?: { name: string }
  drugItems: SubItem[]
  testItems: TestItem[]
  fulfillmentType?: string
  collectionType?: string
  frequency: string
  nextDue: string
  status: 'active' | 'paused' | 'cancelled'
  totalAmount: number
  createdAt: string
}
interface Lab { _id: string; name: string; address: string; testsOffered: { name: string; price: number }[] }
interface Pharmacy { _id: string; name: string; address: string }
interface Drug { _id: string; name: string; price: number; unit: string }

type View = 'list' | 'new-drug' | 'new-test'

export default function SubscriptionsPage () {
  const [view,       setView]       = useState<View>('list')
  const [subs,       setSubs]       = useState<Subscription[]>([])
  const [labs,       setLabs]       = useState<Lab[]>([])
  const [partners,   setPartners]   = useState<Pharmacy[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // new drug sub form
  const [dPharmacy,  setDPharmacy]  = useState('')
  const [dCatalog,   setDCatalog]   = useState<Drug[]>([])
  const [dCart,      setDCart]      = useState<{ drugId: string; name: string; price: number; qty: number }[]>([])
  const [dFulfill,   setDFulfill]   = useState<'pickup' | 'delivery'>('pickup')
  const [dAddress,   setDAddress]   = useState('')
  const [dFreq,      setDFreq]      = useState('monthly')

  // new test sub form
  const [tLab,       setTLab]       = useState('')
  const [tTests,     setTTests]     = useState<string[]>([])
  const [tCollect,   setTCollect]   = useState<'home_visit' | 'walk_in'>('walk_in')
  const [tFreq,      setTFreq]      = useState('monthly')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, labRes, parRes] = await Promise.all([
        api.get('/product-subscriptions/mine'),
        api.get('/diagnostics/labs'),
        api.get('/pharmacy/partners'),
      ])
      setSubs(subRes.data.data?.subscriptions ?? [])
      setLabs(labRes.data.data?.labs ?? [])
      setPartners(parRes.data.data?.partners ?? [])
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!dPharmacy) { setDCatalog([]); return }
    api.get(`/pharmacy/${dPharmacy}/catalog`).then(r => setDCatalog(r.data.data?.drugs ?? [])).catch(() => {})
    setDCart([])
  }, [dPharmacy])

  function dQty (id: string) { return dCart.find(c => c.drugId === id)?.qty ?? 0 }
  function changeDQty (drug: Drug, delta: number) {
    setDCart(prev => {
      const ex = prev.find(c => c.drugId === drug._id)
      if (!ex) return delta < 1 ? prev : [...prev, { drugId: drug._id, name: drug.name, price: drug.price, qty: 1 }]
      const q = ex.qty + delta
      return q <= 0 ? prev.filter(c => c.drugId !== drug._id) : prev.map(c => c.drugId === drug._id ? { ...c, qty: q } : c)
    })
  }

  const labData = labs.find(l => l._id === tLab)
  const tCatalog = labData?.testsOffered.map(t => t.name) ?? []

  function toggleTest (t: string) {
    setTTests(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  async function updateStatus (id: string, status: string) {
    try {
      await api.put(`/product-subscriptions/${id}`, { status })
      setSubs(prev => prev.map(s => s._id === id ? { ...s, status: status as Subscription['status'] } : s))
    } catch { alert('Failed to update.') }
  }

  async function submitDrug (e: FormEvent) {
    e.preventDefault(); setError('')
    if (!dPharmacy || !dCart.length) { setError('Select a pharmacy and add items.'); return }
    setSaving(true)
    try {
      const labObj = labs.find(l => l._id === tLab)
      void labObj
      const r = await api.post('/product-subscriptions', {
        type: 'drug', pharmacyId: dPharmacy,
        drugItems: dCart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
        fulfillmentType: dFulfill, deliveryAddress: dFulfill === 'delivery' ? dAddress : undefined,
        frequency: dFreq,
      })
      setSubs(prev => [r.data.data?.subscription, ...prev])
      setSuccessMsg('Drug subscription created!'); setView('list')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed.')
    }
    setSaving(false)
  }

  async function submitTest (e: FormEvent) {
    e.preventDefault(); setError('')
    if (!tLab || !tTests.length) { setError('Select a lab and at least one test.'); return }
    setSaving(true)
    try {
      const labObj = labs.find(l => l._id === tLab)
      const testItems = tTests.map(name => {
        const found = labObj?.testsOffered.find(t => t.name === name)
        return { name, price: found?.price ?? 0 }
      })
      const r = await api.post('/product-subscriptions', {
        type: 'test', labId: tLab, testItems, collectionType: tCollect, frequency: tFreq,
      })
      setSubs(prev => [r.data.data?.subscription, ...prev])
      setSuccessMsg('Test subscription created!'); setView('list')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed.')
    }
    setSaving(false)
  }

  const FREQ_LABEL: Record<string, string> = { weekly: 'Weekly', biweekly: 'Every 2 Weeks', monthly: 'Monthly' }

  if (view === 'new-drug') return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>New Drug Subscription</h1>
        <button className={s.backBtn} onClick={() => setView('list')}>← Back</button>
      </div>
      {error && <p className={s.errorBanner}>{error}</p>}
      <form className={s.form} onSubmit={submitDrug}>
        <div className={s.field}><label>Pharmacy</label>
          <select value={dPharmacy} onChange={e => setDPharmacy(e.target.value)}>
            <option value=''>Select pharmacy…</option>
            {partners.map(p => <option key={p._id} value={p._id}>{p.name} — {p.address}</option>)}
          </select>
        </div>
        {dPharmacy && dCatalog.length > 0 && (
          <div className={s.field}><label>Select Drugs</label>
            <div className={s.drugGrid}>
              {dCatalog.map(d => (
                <div key={d._id} className={s.drugCard}>
                  <div><p className={s.drugName}>{d.name}</p><span>₦{d.price.toLocaleString()} / {d.unit}</span></div>
                  <div className={s.qtyCtrl}>
                    <button type='button' onClick={() => changeDQty(d, -1)}>−</button>
                    <span>{dQty(d._id)}</span>
                    <button type='button' onClick={() => changeDQty(d, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={s.field}><label>Fulfillment</label>
          <div className={s.row}>
            {(['pickup', 'delivery'] as const).map(f => (
              <label key={f} className={`${s.optCard} ${dFulfill === f ? s.picked : ''}`}>
                <input type='radio' checked={dFulfill === f} onChange={() => setDFulfill(f)} />
                <span>{f === 'pickup' ? 'Pickup' : 'Delivery'}</span>
              </label>
            ))}
          </div>
        </div>
        {dFulfill === 'delivery' && (
          <div className={s.field}><label>Delivery Address</label>
            <input className={s.input} value={dAddress} onChange={e => setDAddress(e.target.value)} placeholder='Full address…' />
          </div>
        )}
        <div className={s.field}><label>Frequency</label>
          <select value={dFreq} onChange={e => setDFreq(e.target.value)}>
            <option value='weekly'>Weekly</option>
            <option value='biweekly'>Every 2 Weeks</option>
            <option value='monthly'>Monthly</option>
          </select>
        </div>
        <button type='submit' className={s.saveBtn} disabled={saving}>{saving ? 'Creating…' : 'Create Subscription'}</button>
      </form>
    </div>
  )

  if (view === 'new-test') return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>New Test Subscription</h1>
        <button className={s.backBtn} onClick={() => setView('list')}>← Back</button>
      </div>
      {error && <p className={s.errorBanner}>{error}</p>}
      <form className={s.form} onSubmit={submitTest}>
        <div className={s.field}><label>Lab</label>
          <select value={tLab} onChange={e => { setTLab(e.target.value); setTTests([]) }}>
            <option value=''>Select lab…</option>
            {labs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.address}</option>)}
          </select>
        </div>
        {tLab && tCatalog.length > 0 && (
          <div className={s.field}><label>Tests</label>
            <div className={s.checkList}>
              {tCatalog.map(t => (
                <label key={t} className={`${s.checkItem} ${tTests.includes(t) ? s.checked : ''}`}>
                  <input type='checkbox' checked={tTests.includes(t)} onChange={() => toggleTest(t)} />
                  <span>{t}</span>
                  {labData?.testsOffered.find(x => x.name === t) && (
                    <em>₦{labData.testsOffered.find(x => x.name === t)!.price.toLocaleString()}</em>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className={s.field}><label>Collection</label>
          <div className={s.row}>
            {(['walk_in', 'home_visit'] as const).map(c => (
              <label key={c} className={`${s.optCard} ${tCollect === c ? s.picked : ''}`}>
                <input type='radio' checked={tCollect === c} onChange={() => setTCollect(c)} />
                <span>{c === 'walk_in' ? 'Walk-in' : 'Home Visit'}</span>
              </label>
            ))}
          </div>
        </div>
        <div className={s.field}><label>Frequency</label>
          <select value={tFreq} onChange={e => setTFreq(e.target.value)}>
            <option value='weekly'>Weekly</option>
            <option value='biweekly'>Every 2 Weeks</option>
            <option value='monthly'>Monthly</option>
          </select>
        </div>
        <button type='submit' className={s.saveBtn} disabled={saving}>{saving ? 'Creating…' : 'Create Subscription'}</button>
      </form>
    </div>
  )

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>My Subscriptions</h1>
          <p className={s.subtitle}>Set up recurring drug orders or lab test schedules.</p>
        </div>
        <div className={s.newBtns}>
          <button className={s.newBtn} onClick={() => { setView('new-drug'); setError('') }}>+ Drug Plan</button>
          <button className={s.newBtn} onClick={() => { setView('new-test'); setError('') }}>+ Test Plan</button>
        </div>
      </div>

      {successMsg && <p className={s.successBanner}>{successMsg}</p>}

      {loading ? <p className={s.empty}>Loading subscriptions…</p>
        : subs.length === 0 ? <p className={s.empty}>No subscriptions yet. Create a recurring drug or test plan.</p>
        : <div className={s.list}>
            {subs.map(sub => {
              const items = sub.type === 'drug'
                ? sub.drugItems.map(i => `${i.name} ×${i.qty}`).join(', ')
                : sub.testItems.map(i => i.name).join(', ')
              const dueDate = new Date(sub.nextDue)
              const isOverdue = dueDate < new Date()
              return (
                <div key={sub._id} className={`${s.card} ${sub.status === 'cancelled' ? s.cancelled : ''}`}>
                  <div className={s.cardTop}>
                    <div>
                      <span className={sub.type === 'drug' ? s.typeDrug : s.typeTest}>
                        {sub.type === 'drug' ? '💊 Drugs' : '🧪 Tests'}
                      </span>
                      <p className={s.cardItems}>{items}</p>
                      <span className={s.cardMeta}>
                        {sub.type === 'drug' ? sub.pharmacy?.name : sub.lab?.name} · {FREQ_LABEL[sub.frequency]}
                      </span>
                    </div>
                    <div className={s.cardRight}>
                      <span className={`${s.statusBadge} ${s[sub.status]}`}>{sub.status}</span>
                      {sub.totalAmount > 0 && <span className={s.amount}>₦{sub.totalAmount.toLocaleString()}</span>}
                      <span className={isOverdue ? s.overdue : s.nextDue}>
                        {isOverdue ? 'Due now' : `Next: ${dueDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}`}
                      </span>
                    </div>
                  </div>
                  {sub.status !== 'cancelled' && (
                    <div className={s.cardActions}>
                      {sub.status === 'active'
                        ? <button className={s.pauseBtn} onClick={() => updateStatus(sub._id, 'paused')}>Pause</button>
                        : <button className={s.resumeBtn} onClick={() => updateStatus(sub._id, 'active')}>Resume</button>
                      }
                      <button className={s.cancelBtn} onClick={() => updateStatus(sub._id, 'cancelled')}>Cancel</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}

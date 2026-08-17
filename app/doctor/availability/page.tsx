'use client'
import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import { LockIcon, XIcon } from '@/components/icons'
import s from './page.module.scss'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Slot { startTime: string; endTime: string; isBooked?: boolean }
interface AvailabilityRecord {
  _id: string
  type: 'recurring' | 'one_off'
  dayOfWeek?: number
  date?: string
  slots: Slot[]
  isActive: boolean
}

const DEFAULT_SLOTS: Slot[] = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
]

export default function DoctorAvailabilityPage () {
  const modal = useStatusModal()
  const [records,   setRecords]   = useState<AvailabilityRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)

  // Recurring form
  const [recDay,    setRecDay]    = useState(1)
  const [recSlots,  setRecSlots]  = useState<Slot[]>([{ startTime: '09:00', endTime: '10:00' }])

  // One-off form
  const [oneDate,   setOneDate]   = useState('')
  const [oneSlots,  setOneSlots]  = useState<Slot[]>([{ startTime: '09:00', endTime: '10:00' }])

  const [activeTab, setActiveTab] = useState<'view' | 'recurring' | 'oneoff'>('view')
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get('/doctors/my/availability')
      setRecords(r.data.data?.availabilities ?? [])
    } catch { }
    setLoading(false)
  }, [])

  function deleteRecord (rec: AvailabilityRecord) {
    const hasBooked = rec.slots.some(s => s.isBooked)
    if (hasBooked) {
      modal.show({
        variant: 'declined',
        title: 'Cannot Delete',
        message: 'This schedule has booked appointments. Cancel the appointments first before removing this availability.'
      })
      return
    }
    modal.show({
      variant: 'pending',
      title: 'Delete Schedule?',
      message: rec.type === 'one_off'
        ? `Remove availability for ${rec.date ? new Date(rec.date).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) : 'this date'}?`
        : `Remove all ${DAYS[rec.dayOfWeek ?? 0]} recurring slots?`,
      actionLabel: 'Yes, Delete',
      dismissLabel: 'Keep',
      onAction: async () => {
        setDeleting(rec._id)
        try {
          await api.delete(`/doctors/availability/${rec._id}`)
          setRecords(prev => prev.filter(r => r._id !== rec._id))
        } catch (err: unknown) {
          modal.show({
            variant: 'declined',
            title: 'Delete Failed',
            message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not delete.'
          })
        }
        setDeleting(null)
      }
    })
  }

  useEffect(() => { load() }, [load])

  function updateSlot (list: Slot[], setList: (s: Slot[]) => void, idx: number, field: keyof Slot, val: string) {
    setList(list.map((sl, i) => i === idx ? { ...sl, [field]: val } : sl))
  }

  function addSlot (list: Slot[], setList: (s: Slot[]) => void) {
    setList([...list, { startTime: '09:00', endTime: '10:00' }])
  }

  function removeSlot (list: Slot[], setList: (s: Slot[]) => void, idx: number) {
    if (list.length === 1) return
    setList(list.filter((_, i) => i !== idx))
  }

  async function saveRecurring () {
    if (!recSlots.length) return
    setSaving(true)
    try {
      await api.post('/doctors/availability', { type: 'recurring', dayOfWeek: recDay, slots: recSlots })
      modal.show({ variant: 'success', title: 'Schedule Saved', message: `Recurring schedule for ${DAYS[recDay]} saved.` })
      await load()
      setActiveTab('view')
    } catch (e: any) {
      modal.show({ variant: 'declined', title: 'Save Failed', message: e?.response?.data?.message ?? 'Failed to save.' })
    }
    setSaving(false)
  }

  async function saveOneOff () {
    if (!oneDate || !oneSlots.length) { modal.show({ variant: 'declined', title: 'Missing Fields', message: 'Date and at least one slot are required.' }); return }
    setSaving(true)
    try {
      await api.post('/doctors/availability', { type: 'one_off', date: oneDate, slots: oneSlots })
      modal.show({ variant: 'success', title: 'Date Saved', message: `One-off availability for ${oneDate} saved.` })
      await load()
      setActiveTab('view')
    } catch (e: any) {
      modal.show({ variant: 'declined', title: 'Save Failed', message: e?.response?.data?.message ?? 'Failed to save.' })
    }
    setSaving(false)
  }

  function useDefaults (setList: (s: Slot[]) => void) {
    setList(DEFAULT_SLOTS.map(s => ({ ...s })))
  }

  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr  = today.toISOString().split('T')[0]
  const recurring = records.filter(r => r.type === 'recurring')
  const oneOff    = records.filter(r => r.type === 'one_off' && new Date(r.date ?? 0) >= today)

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.title}>Availability & Schedule</h1>
          <p className={s.subtitle}>Set the days and time slots when patients can book appointments with you.</p>
        </div>
      </div>

      <div className={s.tabs}>
        {([['view', 'Current Schedule'], ['recurring', 'Set Weekly Hours'], ['oneoff', 'Add Specific Date']] as const).map(([key, label]) => (
          <button key={key} className={`${s.tab} ${activeTab === key ? s.active : ''}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── View current ── */}
      {activeTab === 'view' && (
        loading ? <div className={s.empty}><Loader label='Loading schedule…' /></div> : records.length === 0 ? (
          <div className={s.empty}>
            <p>No availability set yet.</p>
            <p>Use the tabs above to add your weekly hours or specific dates.</p>
          </div>
        ) : (
          <div className={s.scheduleGrid}>
            {recurring.length > 0 && (
              <div className={s.scheduleGroup}>
                <h3 className={s.groupLabel}>Weekly Recurring</h3>
                <div className={s.recordList}>
                  {recurring.sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0)).map(rec => {
                    const hasBooked = rec.slots.some(sl => sl.isBooked)
                    return (
                      <div key={rec._id} className={s.recordCard}>
                        <div className={s.recordHead}>
                          <span className={s.recordDay}>{DAYS[rec.dayOfWeek ?? 0]}</span>
                          <button
                            className={`${s.deleteBtn} ${hasBooked ? s.deleteLocked : ''}`}
                            disabled={deleting === rec._id}
                            onClick={() => deleteRecord(rec)}
                            title={hasBooked ? 'Has booked appointments — cannot delete' : 'Delete schedule'}
                          >
                            {hasBooked ? <LockIcon size={14} /> : deleting === rec._id ? '…' : 'Delete'}
                          </button>
                        </div>
                        <div className={s.slotPills}>
                          {rec.slots.map((sl, i) => (
                            <span key={i} className={`${s.slotPill} ${sl.isBooked ? s.booked : ''}`}>
                              {sl.isBooked && <span className={s.lockIcon}><LockIcon size={12} /></span>}
                              {sl.startTime} – {sl.endTime}
                              {sl.isBooked && <em>booked</em>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {oneOff.length > 0 && (
              <div className={s.scheduleGroup}>
                <h3 className={s.groupLabel}>Specific Dates</h3>
                <div className={s.recordList}>
                  {oneOff.map(rec => {
                    const hasBooked = rec.slots.some(sl => sl.isBooked)
                    return (
                      <div key={rec._id} className={s.recordCard}>
                        <div className={s.recordHead}>
                          <span className={s.recordDay}>{rec.date ? new Date(rec.date).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}</span>
                          <button
                            className={`${s.deleteBtn} ${hasBooked ? s.deleteLocked : ''}`}
                            disabled={deleting === rec._id}
                            onClick={() => deleteRecord(rec)}
                            title={hasBooked ? 'Has booked appointments — cannot delete' : 'Delete schedule'}
                          >
                            {hasBooked ? <LockIcon size={14} /> : deleting === rec._id ? '…' : 'Delete'}
                          </button>
                        </div>
                        <div className={s.slotPills}>
                          {rec.slots.map((sl, i) => (
                            <span key={i} className={`${s.slotPill} ${sl.isBooked ? s.booked : ''}`}>
                              {sl.isBooked && <span className={s.lockIcon}><LockIcon size={12} /></span>}
                              {sl.startTime} – {sl.endTime}
                              {sl.isBooked && <em>booked</em>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Recurring form ── */}
      {activeTab === 'recurring' && (
        <div className={s.form}>
          <div className={s.formRow}>
            <label className={s.label}>Day of week</label>
            <div className={s.dayPicker}>
              {DAYS.map((d, i) => (
                <button key={i} type='button'
                  className={`${s.dayBtn} ${recDay === i ? s.dayActive : ''}`}
                  onClick={() => setRecDay(i)}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className={s.formRow}>
            <div className={s.labelRow}>
              <label className={s.label}>Time slots</label>
              <button type='button' className={s.defaultsLink} onClick={() => useDefaults(setRecSlots)}>Use defaults</button>
            </div>
            <div className={s.slotEditor}>
              {recSlots.map((sl, i) => (
                <div key={i} className={s.slotRow}>
                  <input type='time' className={s.timeInput} value={sl.startTime} onChange={e => updateSlot(recSlots, setRecSlots, i, 'startTime', e.target.value)} />
                  <span className={s.slotDash}>—</span>
                  <input type='time' className={s.timeInput} value={sl.endTime} onChange={e => updateSlot(recSlots, setRecSlots, i, 'endTime', e.target.value)} />
                  <button type='button' className={s.removeSlotBtn} onClick={() => removeSlot(recSlots, setRecSlots, i)} disabled={recSlots.length === 1}><XIcon size={14} /></button>
                </div>
              ))}
              <button type='button' className={s.addSlotBtn} onClick={() => addSlot(recSlots, setRecSlots)}>+ Add slot</button>
            </div>
          </div>

          <button className={s.saveBtn} onClick={saveRecurring} disabled={saving}>
            {saving ? 'Saving…' : `Save ${DAYS[recDay]} Schedule`}
          </button>
        </div>
      )}

      {/* ── One-off form ── */}
      {activeTab === 'oneoff' && (
        <div className={s.form}>
          <div className={s.formRow}>
            <label className={s.label}>Date</label>
            <input type='date' className={s.dateInput} min={todayStr} value={oneDate} onChange={e => setOneDate(e.target.value)} />
          </div>

          <div className={s.formRow}>
            <div className={s.labelRow}>
              <label className={s.label}>Time slots</label>
              <button type='button' className={s.defaultsLink} onClick={() => useDefaults(setOneSlots)}>Use defaults</button>
            </div>
            <div className={s.slotEditor}>
              {oneSlots.map((sl, i) => (
                <div key={i} className={s.slotRow}>
                  <input type='time' className={s.timeInput} value={sl.startTime} onChange={e => updateSlot(oneSlots, setOneSlots, i, 'startTime', e.target.value)} />
                  <span className={s.slotDash}>—</span>
                  <input type='time' className={s.timeInput} value={sl.endTime} onChange={e => updateSlot(oneSlots, setOneSlots, i, 'endTime', e.target.value)} />
                  <button type='button' className={s.removeSlotBtn} onClick={() => removeSlot(oneSlots, setOneSlots, i)} disabled={oneSlots.length === 1}><XIcon size={14} /></button>
                </div>
              ))}
              <button type='button' className={s.addSlotBtn} onClick={() => addSlot(oneSlots, setOneSlots)}>+ Add slot</button>
            </div>
          </div>

          <button className={s.saveBtn} onClick={saveOneOff} disabled={saving || !oneDate}>
            {saving ? 'Saving…' : 'Save Date'}
          </button>
        </div>
      )}
    </div>
  )
}

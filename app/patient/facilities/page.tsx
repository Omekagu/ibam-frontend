'use client'
import { useState } from 'react'
import api from '@/lib/api'
import { useStatusModal } from '@/components/StatusModal'
import { Loader } from '@/components/Loader'
import s from './page.module.scss'
import {
  HospitalIcon, StethoscopeIcon, PillIcon, MicroscopeIcon, SirenIcon,
  MapPinIcon, ClockIcon, PhoneIcon, GlobeIcon, MapIcon, CheckCircleIcon,
} from '@/components/icons'

interface Facility {
  _id: string
  name: string
  type: string
  address: string
  phone?: string
  email?: string
  website?: string
  operatingHours?: string
  services?: string[]
  isVerified: boolean
}

const TYPES = [
  { value: '',          label: 'All' },
  { value: 'hospital',  label: 'Hospitals' },
  { value: 'clinic',    label: 'Clinics' },
  { value: 'pharmacy',  label: 'Pharmacies' },
  { value: 'lab',       label: 'Labs' },
  { value: 'emergency', label: 'Emergency' },
]

function FacilityTypeIcon ({ type }: { type: string }) {
  const p = { size: 20 as const }
  switch (type) {
    case 'hospital':  return <HospitalIcon {...p} />
    case 'clinic':    return <StethoscopeIcon {...p} />
    case 'pharmacy':  return <PillIcon {...p} />
    case 'lab':       return <MicroscopeIcon {...p} />
    case 'emergency': return <SirenIcon {...p} />
    default:          return <HospitalIcon {...p} />
  }
}

const RADII = [
  { value: 2000,  label: '2 km' },
  { value: 5000,  label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
]

export default function FacilitiesPage () {
  const modal = useStatusModal()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading,    setLoading]    = useState(false)
  const [located,    setLocated]    = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [radius,     setRadius]     = useState(5000)
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(null)

  async function fetchFacilities (lat: number, lng: number, type: string, r: number) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(r) })
      if (type) params.set('type', type)
      const res = await api.get(`/facilities/nearby?${params}`)
      setFacilities(res.data.data?.facilities ?? [])
    } catch {
      modal.show({ variant: 'declined', title: 'Load Failed', message: 'Could not load facilities. Please try again.' })
    }
    setLoading(false)
  }

  function locate () {
    if (!navigator.geolocation) { modal.show({ variant: 'declined', title: 'Not Supported', message: 'Geolocation is not supported by your browser.' }); return }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        setLocated(true)
        fetchFacilities(lat, lng, typeFilter, radius)
      },
      () => {
        modal.show({ variant: 'declined', title: 'Location Error', message: 'Could not get your location. Please allow location access and try again.' })
        setLoading(false)
      },
      { timeout: 10_000 }
    )
  }

  function handleTypeChange (type: string) {
    setTypeFilter(type)
    if (coords) fetchFacilities(coords.lat, coords.lng, type, radius)
  }

  function handleRadiusChange (r: number) {
    setRadius(r)
    if (coords) fetchFacilities(coords.lat, coords.lng, typeFilter, r)
  }

  return (
    <div className={s.wrap}>
      <div className={s.pageHeader}>
        <h1 className={s.title}>Find Health Facilities</h1>
        <p className={s.subtitle}>Locate hospitals, clinics, pharmacies, labs, and emergency centres near you.</p>
      </div>

      {/* Location prompt */}
      {!located && (
        <div className={s.locateCard}>
          <span className={s.locateEmoji}><MapPinIcon size={24} /></span>
          <div className={s.locateText}>
            <p className={s.locateTitle}>Share your location</p>
            <p className={s.locateSub}>We need your location to find facilities nearby.</p>
          </div>
          <button className={s.locateBtn} onClick={locate} disabled={loading}>
            {loading ? 'Locating…' : 'Use My Location'}
          </button>
        </div>
      )}

      {/* Filters (show once located) */}
      {located && (
        <div className={s.filters}>
          <div className={s.typeChips}>
            {TYPES.map(t => (
              <button
                key={t.value}
                className={`${s.chip} ${typeFilter === t.value ? s.chipActive : ''}`}
                onClick={() => handleTypeChange(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className={s.radiusRow}>
            <span className={s.radiusLabel}>Radius:</span>
            {RADII.map(r => (
              <button
                key={r.value}
                className={`${s.radiusChip} ${radius === r.value ? s.chipActive : ''}`}
                onClick={() => handleRadiusChange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className={s.empty}><Loader label='Searching nearby facilities…' /></div>
      ) : located && facilities.length === 0 ? (
        <p className={s.empty}>No facilities found in this area. Try increasing the radius.</p>
      ) : (
        <div className={s.list}>
          {facilities.map(f => (
            <div key={f._id} className={s.card}>
              <div className={s.cardTop}>
                <span className={s.typeIcon}><FacilityTypeIcon type={f.type} /></span>
                <div className={s.cardMeta}>
                  <h3 className={s.cardName}>
                    {f.name}
                    {f.isVerified && <span className={s.verifiedBadge}><CheckCircleIcon size={12} /> Verified</span>}
                  </h3>
                  <span className={s.typeBadge}>{f.type}</span>
                </div>
              </div>

              <p className={s.cardAddress}><MapPinIcon size={13} /> {f.address}</p>

              {f.operatingHours && (
                <p className={s.cardDetail}><ClockIcon size={13} /> {f.operatingHours}</p>
              )}

              {(f.services?.length ?? 0) > 0 && (
                <p className={s.cardDetail}><StethoscopeIcon size={13} /> {f.services!.join(', ')}</p>
              )}

              <div className={s.cardActions}>
                {f.phone && (
                  <a className={s.actionLink} href={`tel:${f.phone}`}><PhoneIcon size={13} /> Call</a>
                )}
                {f.website && (
                  <a className={s.actionLink} href={f.website} target='_blank' rel='noopener noreferrer'><GlobeIcon size={13} /> Website</a>
                )}
                {f.address && (
                  <a
                    className={s.actionLink}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name + ' ' + f.address)}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <MapIcon size={13} /> Directions
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

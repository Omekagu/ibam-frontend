// Shared SVG icon components — stroke-based, 16×16 default, Heroicons-style

import { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size = 16) => ({
  width: size, height: size,
  fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24',
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2,
})

// ── People ────────────────────────────────────────
export function UserIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' /></svg>
}
export function UsersIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' /></svg>
}

// ── Medical ───────────────────────────────────────
export function StethoscopeIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v4a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3' /><path d='M18 12a3 3 0 110 6 3 3 0 010-6z' /><path d='M14 14.5A4 4 0 0018 18' /></svg>
}
export function PillIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M10.5 20H4a2 2 0 01-2-2V6a2 2 0 012-2h16a2 2 0 012 2v7.5M16 19h6M19 16v6' /><path d='M10 11l4-4' /></svg>
}
export function HeartPulseIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z' /><path d='M3.22 12H9.5l1.5-3 2 6 1.5-3h5.27' /></svg>
}
export function ThermometerIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z' /></svg>
}
export function MicroscopeIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M6 18h8M3 22h18M14 22a7 7 0 10-4.17-12.67L5 14' /><path d='M10 10L8.5 8.5l4-4 1.5 1.5' /><path d='M4.51 14.49l4.97-4.97' /></svg>
}
export function BeakerIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M9 3H5a2 2 0 000 4h14a2 2 0 000-4h-4' /><path d='M15 7v10.5a2.5 2.5 0 01-2.5 2.5h-1A2.5 2.5 0 019 17.5V7' /></svg>
}

// ── Calendar / Time ───────────────────────────────
export function CalendarIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><rect x='3' y='4' width='18' height='18' rx='2' ry='2' /><line x1='16' y1='2' x2='16' y2='6' /><line x1='8' y1='2' x2='8' y2='6' /><line x1='3' y1='10' x2='21' y2='10' /></svg>
}
export function ClockIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='12' cy='12' r='10' /><polyline points='12 6 12 12 16 14' /></svg>
}
export function HourglassIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2' /></svg>
}

// ── Communication ─────────────────────────────────
export function BellIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0' /></svg>
}
export function MailIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' /><polyline points='22,6 12,13 2,6' /></svg>
}
export function PhoneIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.72A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.13a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z' /></svg>
}
export function ChatIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' /></svg>
}
export function MessageIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z' /></svg>
}

// ── Finance ───────────────────────────────────────
export function WalletIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M21 12V7H5a2 2 0 010-4h14v4' /><path d='M3 5v14a2 2 0 002 2h16v-5' /><path d='M18 12a2 2 0 000 4h4v-4h-4z' /></svg>
}
export function CreditCardIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><rect x='1' y='4' width='22' height='16' rx='2' ry='2' /><line x1='1' y1='10' x2='23' y2='10' /></svg>
}
export function CurrencyIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='12' y1='1' x2='12' y2='23' /><path d='M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' /></svg>
}

// ── Media ─────────────────────────────────────────
export function VideoCameraIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polygon points='23 7 16 12 23 17 23 7' /><rect x='1' y='5' width='15' height='14' rx='2' ry='2' /></svg>
}
export function CameraIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z' /><circle cx='12' cy='13' r='4' /></svg>
}
export function MicOffIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='1' y1='1' x2='23' y2='23' /><path d='M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6' /><path d='M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8' /></svg>
}

// ── Files / Documents ─────────────────────────────
export function FolderIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' /></svg>
}
export function DocumentIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' /><polyline points='14 2 14 8 20 8' /><line x1='16' y1='13' x2='8' y2='13' /><line x1='16' y1='17' x2='8' y2='17' /><polyline points='10 9 9 9 8 9' /></svg>
}
export function ClipboardIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2' /><rect x='8' y='2' width='8' height='4' rx='1' ry='1' /></svg>
}
export function UploadIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polyline points='16 16 12 12 8 16' /><line x1='12' y1='12' x2='12' y2='21' /><path d='M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3' /></svg>
}

// ── Location / Navigation ─────────────────────────
export function MapPinIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' /><circle cx='12' cy='10' r='3' /></svg>
}
export function GlobeIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='12' cy='12' r='10' /><line x1='2' y1='12' x2='22' y2='12' /><path d='M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' /></svg>
}
export function MapIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polygon points='1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6' /><line x1='8' y1='2' x2='8' y2='18' /><line x1='16' y1='6' x2='16' y2='22' /></svg>
}
export function NavigationIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polygon points='3 11 22 2 13 21 11 13 3 11' /></svg>
}

// ── Status / Alerts ───────────────────────────────
export function CheckCircleIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M22 11.08V12a10 10 0 11-5.93-9.14' /><polyline points='22 4 12 14.01 9 11.01' /></svg>
}
export function XCircleIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='12' cy='12' r='10' /><line x1='15' y1='9' x2='9' y2='15' /><line x1='9' y1='9' x2='15' y2='15' /></svg>
}
export function AlertTriangleIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' /><line x1='12' y1='9' x2='12' y2='13' /><line x1='12' y1='17' x2='12.01' y2='17' /></svg>
}
export function ShieldIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' /></svg>
}
export function ShieldCheckIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' /><polyline points='9 12 11 14 15 10' /></svg>
}
export function LockIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0110 0v4' /></svg>
}
export function NoSymbolIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='12' cy='12' r='10' /><line x1='4.93' y1='4.93' x2='19.07' y2='19.07' /></svg>
}
export function FlagIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z' /><line x1='4' y1='22' x2='4' y2='15' /></svg>
}

// ── Actions ───────────────────────────────────────
export function SearchIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='11' cy='11' r='8' /><line x1='21' y1='21' x2='16.65' y2='16.65' /></svg>
}
export function StarIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' /></svg>
}
export function StarFilledIcon ({ size, ...p }: P) {
  return <svg width={size ?? 16} height={size ?? 16} viewBox='0 0 20 20' fill='currentColor' {...p}><path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' /></svg>
}

// ── Buildings / Places ────────────────────────────
export function HospitalIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' /><polyline points='9 22 9 12 15 12 15 22' /></svg>
}
export function BuildingIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><rect x='2' y='7' width='20' height='14' rx='2' ry='2' /><path d='M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16' /></svg>
}

// ── Logistics ─────────────────────────────────────
export function PackageIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polyline points='16.5 9.4 7.55 4.24' /><path d='M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' /><polyline points='3.27 6.96 12 12.01 20.73 6.96' /><line x1='12' y1='22.08' x2='12' y2='12' /></svg>
}
export function TruckIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><rect x='1' y='3' width='15' height='13' /><polygon points='16 8 20 8 23 11 23 16 16 16 16 8' /><circle cx='5.5' cy='18.5' r='2.5' /><circle cx='18.5' cy='18.5' r='2.5' /></svg>
}

// ── Miscellaneous ─────────────────────────────────
export function BoltIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' /></svg>
}
export function LightbulbIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='9' y1='18' x2='15' y2='18' /><line x1='10' y1='22' x2='14' y2='22' /><path d='M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14' /></svg>
}
export function HandshakeIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z' /></svg>
}
export function ChartBarIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='18' y1='20' x2='18' y2='10' /><line x1='12' y1='20' x2='12' y2='4' /><line x1='6' y1='20' x2='6' y2='14' /><line x1='2' y1='20' x2='22' y2='20' /></svg>
}
export function ArrowRightIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='5' y1='12' x2='19' y2='12' /><polyline points='12 5 19 12 12 19' /></svg>
}
export function ExternalLinkIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3' /></svg>
}
export function CheckIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polyline points='20 6 9 17 4 12' /></svg>
}
export function XIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' /></svg>
}
export function ChevronUpIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polyline points='18 15 12 9 6 15' /></svg>
}
export function ChevronDownIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polyline points='6 9 12 15 18 9' /></svg>
}
export function HomeIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' /><polyline points='9 22 9 12 15 12 15 22' /></svg>
}
export function StoreIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' /><polyline points='9 22 9 12 15 12 15 22' /></svg>
}
export function CartIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='9' cy='21' r='1' /><circle cx='20' cy='21' r='1' /><path d='M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6' /></svg>
}
export function WalkingIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='13' cy='4' r='2' /><path d='m14.5 10.5-2 3.5H9l1.5-4' /><path d='m9.5 16.5 1-3h4l2 4' /><path d='M7 22h3l1-3' /><path d='M14 22h3l-1.5-5.5' /></svg>
}
export function DownloadIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' /><polyline points='7 10 12 15 17 10' /><line x1='12' y1='15' x2='12' y2='3' /></svg>
}
export function ArrowUpIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='12' y1='19' x2='12' y2='5' /><polyline points='5 12 12 5 19 12' /></svg>
}
export function ArrowDownIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><line x1='12' y1='5' x2='12' y2='19' /><polyline points='19 12 12 19 5 12' /></svg>
}
export function PinIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0Z' /><circle cx='12' cy='10' r='3' /></svg>
}
export function PlayIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polygon points='5 3 19 12 5 21 5 3' /></svg>
}
export function RefreshIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><polyline points='1 4 1 10 7 10' /><path d='M3.51 15a9 9 0 102.13-9.36L1 10' /></svg>
}
export function EyeIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' /><circle cx='12' cy='12' r='3' /></svg>
}
export function ScissorsIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='6' cy='6' r='3' /><circle cx='6' cy='18' r='3' /><line x1='20' y1='4' x2='8.12' y2='15.88' /><line x1='14.47' y1='14.48' x2='20' y2='20' /><line x1='8.12' y1='8.12' x2='12' y2='12' /></svg>
}
export function LinkedinIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z' /><rect x='2' y='9' width='4' height='12' /><circle cx='4' cy='4' r='2' /></svg>
}
export function TwitterIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' /></svg>
}
export function WebsiteIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><circle cx='12' cy='12' r='10' /><line x1='2' y1='12' x2='22' y2='12' /><path d='M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z' /></svg>
}
export function SirenIcon ({ size, ...p }: P) {
  return <svg {...base(size)} {...p}><path d='M22 17H2a3 3 0 010-6h2.39A7 7 0 0121 11c.34.6.6 1.28.71 2H22a3 3 0 010 6z' /><path d='M8 17v1a4 4 0 008 0v-1' /><line x1='12' y1='3' x2='12' y2='5' /><line x1='5.45' y1='5.11' x2='7.05' y2='6.71' /><line x1='18.55' y1='5.11' x2='16.95' y2='6.71' /></svg>
}

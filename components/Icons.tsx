import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, props: P) => ({
  width: size,
  height: size,
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 2,
  viewBox: '0 0 24 24',
  ...props,
})

export function XIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M18 6 6 18M6 6l12 12' /></svg>
}
export function ChevronUpIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='m18 15-6-6-6 6' /></svg>
}
export function ChevronDownIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='m6 9 6 6 6-6' /></svg>
}
export function CheckIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M20 6 9 17l-5-5' /></svg>
}
export function CheckCircleIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><circle cx='12' cy='12' r='10' /><path d='m9 12 2 2 4-4' /></svg>
}
export function ClockIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><circle cx='12' cy='12' r='10' /><path d='M12 6v6l4 2' /></svg>
}
export function LockIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><rect x='3' y='11' width='18' height='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' /></svg>
}
export function MapPinIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z' /><circle cx='12' cy='10' r='3' /></svg>
}
export function PillIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z' /><path d='m8.5 8.5 7 7' /></svg>
}
export function BuildingIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' /><path d='M9 22V12h6v10' /></svg>
}
export function StoreIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' /><polyline points='9 22 9 12 15 12 15 22' /></svg>
}
export function ClipboardIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><rect x='9' y='2' width='6' height='4' rx='1' /><path d='M8 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-2' /><path d='M12 11h4M12 16h4M8 11h.01M8 16h.01' /></svg>
}
export function SearchIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><circle cx='11' cy='11' r='8' /><path d='m21 21-4.35-4.35' /></svg>
}
export function CreditCardIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><rect x='1' y='4' width='22' height='16' rx='2' ry='2' /><line x1='1' y1='10' x2='23' y2='10' /></svg>
}
export function TruckIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><rect x='1' y='3' width='15' height='13' rx='1' /><path d='M16 8h4l3 3v5h-7V8z' /><circle cx='5.5' cy='18.5' r='2.5' /><circle cx='18.5' cy='18.5' r='2.5' /></svg>
}
export function CalendarIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><rect x='3' y='4' width='18' height='18' rx='2' ry='2' /><line x1='16' y1='2' x2='16' y2='6' /><line x1='8' y1='2' x2='8' y2='6' /><line x1='3' y1='10' x2='21' y2='10' /></svg>
}
export function PhoneIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' /></svg>
}
export function ChatIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' /></svg>
}
export function HomeIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' /><polyline points='9 22 9 12 15 12 15 22' /></svg>
}
export function CartIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><circle cx='9' cy='21' r='1' /><circle cx='20' cy='21' r='1' /><path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' /></svg>
}
export function DownloadIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' /><polyline points='7 10 12 15 17 10' /><line x1='12' y1='15' x2='12' y2='3' /></svg>
}
export function ArrowUpIcon ({ size = 12, ...p }: P) {
  return <svg {...base(size, p)}><path d='m18 15-6-6-6 6' /></svg>
}
export function ArrowDownIcon ({ size = 12, ...p }: P) {
  return <svg {...base(size, p)}><path d='m6 9 6 6 6-6' /></svg>
}
export function WalkingIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><circle cx='13' cy='4' r='2' /><path d='m14.5 10.5-2 3.5H9l1.5-4' /><path d='m9.5 16.5 1-3h4l2 4' /><path d='M7 22h3l1-3' /><path d='M14 22h3l-1.5-5.5' /></svg>
}
export function ArrowRightIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M5 12h14M12 5l7 7-7 7' /></svg>
}
export function UploadIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' /><polyline points='17 8 12 3 7 8' /><line x1='12' y1='3' x2='12' y2='15' /></svg>
}
export function FileTextIcon ({ size = 16, ...p }: P) {
  return <svg {...base(size, p)}><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' /><polyline points='14 2 14 8 20 8' /><line x1='16' y1='13' x2='8' y2='13' /><line x1='16' y1='17' x2='8' y2='17' /><polyline points='10 9 9 9 8 9' /></svg>
}

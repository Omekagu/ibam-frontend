export const Colors = {
  // ── iBam brand palette ──────────────────────────
  primary:       '#22C55E',   // iBam brand green
  primaryLight:  '#DCFCE7',
  primaryDark:   '#15803D',
  accent:        '#F59E0B',   // iBam brand amber ("Health" badge)
  accentLight:   '#FEF3C7',

  success:       '#10B981',
  successLight:  '#D1FAE5',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
  info:          '#3B82F6',
  infoLight:     '#DBEAFE',
  violet:        '#8B5CF6',
  violetLight:   '#EDE9FE',
  teal:          '#14B8A6',
  tealLight:     '#CCFBF1',
  orange:        '#F97316',
  orangeLight:   '#FFEDD5',
  gold:          '#EAB308',
  goldLight:     '#FEF9C3',

  // Light-mode surfaces
  background:    '#F8FAFC',
  surface:       '#FFFFFF',
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',

  // Text
  textPrimary:   '#0D1B2A',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Dark-mode / brand forest green
  navy:          '#0A2810',
  navyDark:      '#082208',
  navyCard:      '#0D2B0D',
} as const

export const Typography = {
  size: {
    tiny:    10,
    small:   11,
    caption: 12,
    body:    13,
    bodyLg:  14,
    label:   15,
    h4:      16,
    h3:      18,
    h2:      20,
    h1:      24,
    display: 28,
  },
  weight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
    black:     '900',
  },
} as const

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  x2l:  32,
  x3l:  40,
  x4l:  48,
  x5l:  64,
} as const

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   18,
  x2l:  24,
  full: 999,
} as const

export const Shadow = {
  sm:  '0 1px 3px rgba(0,0,0,0.06)',
  md:  '0 4px 12px rgba(0,0,0,0.10)',
  lg:  '0 8px 24px rgba(0,0,0,0.14)',
  xl:  '0 16px 40px rgba(0,0,0,0.18)',
} as const

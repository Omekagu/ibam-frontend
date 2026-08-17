import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.scss'
import ScrollReveal from '@/components/ScrollReveal'
import { ThemeProvider } from '@/components/ThemeProvider'
import SessionSync from '@/components/SessionSync'
import { StatusModalProvider } from '@/components/StatusModal'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ibamhealth.com'),
  title: {
    default: 'iBam Health — Quality Healthcare, Delivered',
    template: '%s — iBam Health'
  },
  description:
    'Book consultations, run lab tests, get e-prescriptions, and access trusted pharmacy delivery — all in one platform. Accessible healthcare across Nigeria.',
  applicationName: 'iBam Health',
  keywords: [
    'healthcare',
    'telemedicine',
    'diagnostics',
    'Nigeria',
    'doctor consultation',
    'lab tests',
    'pharmacy',
    'iBam'
  ],
  authors: [{ name: 'iBam Health' }],
  icons: {
    apple: '/Ibam Logo Png.png'
  },
  openGraph: {
    type: 'website',
    siteName: 'iBam Health',
    title: 'iBam Health — Quality Healthcare, Delivered',
    description:
      'Book consultations, run lab tests, get e-prescriptions, and access trusted pharmacy delivery — all in one platform.',
    images: [
      {
        url: '/1.png',
        width: 1200,
        height: 630,
        alt: 'iBam Health — Digital Healthcare Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iBam Health — Quality Healthcare, Delivered',
    description:
      'Book consultations, run lab tests, get e-prescriptions, and access trusted pharmacy delivery — all in one platform.',
    images: ['/1.png']
  }
}

const PORTAL_ROOTS = ['/patient', '/doctor', '/admin', '/partner']

export default async function RootLayout ({
  children
}: {
  children: React.ReactNode
}) {
  // Read theme cookie server-side so the correct data-theme is in the initial HTML —
  // eliminates flash without needing a before-hydration script tag.
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value as 'light' | 'dark' | undefined
  // We don't know the pathname in the root layout, so default to the portal preference
  // if a cookie exists; otherwise omit the attribute (ThemeProvider sets it client-side).
  const serverTheme = themeCookie ?? null

  return (
    <html
      lang='en'
      className={nunito.variable}
      suppressHydrationWarning
      {...(serverTheme === 'dark' ? { 'data-theme': 'dark' } : {})}
    >
      <head>
        <link rel='icon' type='image/png' href='/Ibam Logo Png.png' />
        <link rel='shortcut icon' href='/Ibam Logo Png.png' />
        <link rel='apple-touch-icon' href='/Ibam Logo Png.png' />
      </head>
      <body>
        <ThemeProvider>
          <StatusModalProvider>
            <SessionSync />
            {children}
            <ScrollReveal />
          </StatusModalProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

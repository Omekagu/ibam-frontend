import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.scss";
import ScrollReveal from "@/components/ScrollReveal";
import { ThemeProvider } from "@/components/ThemeProvider";
import SessionSync from "@/components/SessionSync";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400","500","600","700","800","900"] });

export const metadata: Metadata = {
  title: {
    default: 'iBam Health — Quality Healthcare, Delivered',
    template: '%s — iBam Health',
  },
  description:
    'Book consultations, run lab tests, get e-prescriptions, and access trusted pharmacy delivery — all in one platform. Accessible healthcare across Nigeria.',
  applicationName: 'iBam Health',
  keywords: ['healthcare', 'telemedicine', 'diagnostics', 'Nigeria', 'doctor consultation', 'lab tests', 'pharmacy', 'iBam'],
  authors: [{ name: 'iBam Health' }],
  icons: {
    icon: '/Ibam Logo Png.png',
    shortcut: '/Ibam Logo Png.png',
    apple: '/Ibam Logo Png.png',
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
        alt: 'iBam Health — Digital Healthcare Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iBam Health — Quality Healthcare, Delivered',
    description:
      'Book consultations, run lab tests, get e-prescriptions, and access trusted pharmacy delivery — all in one platform.',
    images: ['/1.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        {/* Prevent theme flash before hydration.
            Public/auth routes are always dark; portals use stored preference. */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var p = window.location.pathname;
            var portals = ['/patient/','/doctor/','/admin/','/partner/'];
            var isPortal = portals.some(function(x){ return p.startsWith(x); });
            var t = isPortal ? (localStorage.getItem('theme') || 'light') : 'dark';
            if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
            else document.documentElement.removeAttribute('data-theme');
          })()
        `}} />
      </head>
      <body>
        <ThemeProvider>
          <SessionSync />
          {children}
          <ScrollReveal />
        </ThemeProvider>
      </body>
    </html>
  );
}

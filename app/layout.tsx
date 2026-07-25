import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.scss";
import ScrollReveal from "@/components/ScrollReveal";
import { ThemeProvider } from "@/components/ThemeProvider";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400","500","600","700","800","900"] });

export const metadata: Metadata = {
  title: "iBam Health — Quality Healthcare, Delivered",
  description: "Book consultations, run lab tests, get e-prescriptions, and access trusted pharmacy delivery — all in one platform.",
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
            var portals = ['/patient','/doctor','/admin','/partner'];
            var isPortal = portals.some(function(x){ return p.startsWith(x); });
            var t = isPortal ? (localStorage.getItem('theme') || 'light') : 'dark';
            if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
            else document.documentElement.removeAttribute('data-theme');
          })()
        `}} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <ScrollReveal />
        </ThemeProvider>
      </body>
    </html>
  );
}

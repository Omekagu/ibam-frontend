import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Hero from '@/components/sections/Hero'
import HowItWorks from '@/components/sections/HowItWorks'
import Services from '@/components/sections/Services'
import WhyIBam from '@/components/sections/WhyIBam'
import ForDoctors from '@/components/sections/ForDoctors'
import AppDownload from '@/components/sections/AppDownload'
import Testimonials from '@/components/sections/Testimonials'
import PricingTeaser from '@/components/sections/PricingTeaser'
import FAQ from '@/components/sections/FAQ'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Services />
        <WhyIBam />
        <Testimonials />
        <PricingTeaser />
        <ForDoctors />
        <AppDownload />
        <FAQ limit={5} />
      </main>
      <Footer />
    </>
  )
}

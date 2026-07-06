import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import s from "./page.module.scss";

export const metadata: Metadata = {
  title: "Services — iBam Health",
  description: "Telemedicine, diagnostics, e-prescriptions, pharmacy delivery and more — all in one platform.",
};

const SERVICES = [
  {
    tag: "🎥", tagLabel: "Video & Audio",
    title: "Telemedicine Consultations",
    desc: "See a verified Nigerian doctor from anywhere in the country. Our secure video and audio consultations let you describe your symptoms, get examined, and receive clinical guidance — all without leaving home.",
    steps: [
      "Choose from hundreds of specialists by specialty, rating, and price",
      "Book an immediate or scheduled consultation slot",
      "Join the encrypted video call at the agreed time",
      "Receive clinical notes and any prescriptions within minutes",
    ],
    cta: "Find a Doctor",
    href: "/doctors",
    visualIcon: "🎥",
    visualLabel: "Video Consultation",
    visualSub: "Encrypted end-to-end. Works on 3G. No app download required for patients.",
  },
  {
    tag: "🧠", tagLabel: "AI-Powered",
    title: "Smart Triage System",
    desc: "Not sure if you need a doctor? Our AI-powered triage tool analyses your symptoms against clinical guidelines and either reassures you with self-care advice or escalates to the right specialist immediately.",
    steps: [
      "Describe your symptoms in plain English or Pidgin",
      "The system asks follow-up questions to assess severity",
      "Receive a triage outcome: self-care, GP, or emergency",
      "If escalated, get directly connected to the right doctor",
    ],
    cta: "Try Triage",
    href: "/signup",
    visualIcon: "🧠",
    visualLabel: "AI Symptom Checker",
    visualSub: "Trained on Nigerian epidemiological data. Supports English, Yoruba, Hausa, Igbo.",
  },
  {
    tag: "🔬", tagLabel: "Diagnostics",
    title: "Lab Tests & Diagnostics",
    desc: "Order blood panels, imaging, and specialty tests directly from your doctor's consultation. A certified phlebotomist visits your home to collect samples, and results are uploaded securely to your health profile.",
    steps: [
      "Doctor orders lab tests as part of your consultation",
      "Choose home sample collection or walk-in at a partner lab",
      "Results uploaded to your profile within 24–48 hours",
      "Doctor reviews results and follows up with next steps",
    ],
    cta: "Book a Lab Test",
    href: "/signup",
    visualIcon: "🔬",
    visualLabel: "Home Sample Collection",
    visualSub: "Partnership with 50+ NAFDAC-accredited diagnostic centres nationwide.",
  },
  {
    tag: "💊", tagLabel: "Digital Prescriptions",
    title: "E-Prescriptions",
    desc: "Every prescription issued on iBam is digitally signed, tamper-proof, and directly routed to our pharmacy network. No paper. No forged prescriptions. No pharmacy confusion.",
    steps: [
      "Doctor issues a digital prescription at the end of consultation",
      "Prescription is verified and sent to partner pharmacies",
      "Choose delivery to your doorstep or pick up at a location",
      "Prescription history stored in your health record",
    ],
    cta: "Get Started",
    href: "/signup",
    visualIcon: "💊",
    visualLabel: "Digital Prescription",
    visualSub: "Accepted at over 200 pharmacies in Lagos, Abuja, Port Harcourt, and Kano.",
  },
  {
    tag: "🏥", tagLabel: "Nearby Care",
    title: "Hospital & Clinic Locator",
    desc: "When you need in-person care, iBam helps you find the nearest accredited facility, check wait times, and pre-register — so you're not scrambling during a health crisis.",
    steps: [
      "Use GPS to find hospitals, clinics, and pharmacies near you",
      "Filter by specialty, insurance accepted, and wait time",
      "Pre-register or book an appointment online",
      "Receive your iBam health summary to share with the facility",
    ],
    cta: "Find Nearby Care",
    href: "/signup",
    visualIcon: "🏥",
    visualLabel: "Facility Locator",
    visualSub: "Real-time data from 500+ partner facilities across 36 states.",
  },
  {
    tag: "🚚", tagLabel: "Delivery",
    title: "Pharmacy Delivery",
    desc: "Medications, supplements, and medical supplies delivered to your door within hours. All orders are fulfilled by NAFDAC-registered pharmacies and delivered by temperature-controlled logistics partners.",
    steps: [
      "Browse our pharmacy catalogue or link to your prescription",
      "Place an order with your address",
      "Pharmacist verifies and prepares your order",
      "Delivery within 2–6 hours in Lagos, Abuja, PH, and Kano",
    ],
    cta: "Order Medications",
    href: "/signup",
    visualIcon: "🚚",
    visualLabel: "Same-Day Delivery",
    visualSub: "Cold-chain compliant. Tamper-evident packaging. Real-time order tracking.",
  },
];

export default function ServicesPage() {
  return (
    <PageShell>
      <section className={s.hero}>
        <div className={s.heroInner}>
          <span className={s.eyebrow}>What We Offer</span>
          <h1>Complete healthcare,<br />one platform</h1>
          <p>
            From your first symptom to your last follow-up — consultations, diagnostics,
            prescriptions, and delivery, all connected.
          </p>
        </div>
      </section>

      <section className={s.services}>
        <div className={s.inner}>
          {SERVICES.map((svc) => (
            <div key={svc.title} className={s.service}>
              <div className={`${s.serviceText} reveal`}>
                <div className={s.tag}>
                  <span>{svc.tag}</span>
                  {svc.tagLabel}
                </div>
                <h2>{svc.title}</h2>
                <p>{svc.desc}</p>
                <ol className={s.steps}>
                  {svc.steps.map((step, i) => (
                    <li key={i}>
                      <span className={s.num}>{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <Link href={svc.href} className={s.cta}>{svc.cta} →</Link>
              </div>
              <div className={`${s.serviceVisual} reveal`}>
                <div className={s.visualIcon}>{svc.visualIcon}</div>
                <div className={s.visualLabel}>{svc.visualLabel}</div>
                <div className={s.visualSub}>{svc.visualSub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

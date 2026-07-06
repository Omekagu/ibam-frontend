"use client";
import { useState } from "react";
import s from "./FAQ.module.scss";

const FAQS = [
  {
    q: "Is iBam Health available across Nigeria?",
    a: "Yes. Our telemedicine service is available to anyone in Nigeria with a smartphone and internet connection. Pharmacy delivery currently covers Lagos, Abuja, Port Harcourt, Kano, and Ibadan, with more cities launching soon.",
  },
  {
    q: "Are the doctors on iBam Health real and verified?",
    a: "Every physician on the platform is verified against the Medical and Dental Council of Nigeria (MDCN) register before they can see any patient. We also run background checks and credential reviews. You can view each doctor's license number on their profile.",
  },
  {
    q: "How does a video consultation work?",
    a: "After booking, you'll receive a link for your consultation slot. At the scheduled time, join the secure video call directly in the app or browser — no downloads required. Your doctor will review your health history, conduct the consultation, and can issue e-prescriptions or lab orders immediately after.",
  },
  {
    q: "Is my medical data secure and private?",
    a: "Absolutely. All consultations are end-to-end encrypted. We are fully compliant with Nigeria's NDPR (National Data Protection Regulation). Your data is never sold to third parties and is only accessible to you and your treating physicians.",
  },
  {
    q: "Can I use iBam Health for my family?",
    a: "Yes — our Family plan supports up to 6 members under a single subscription. Each member gets their own private health profile, consultation history, and records. Children's accounts are managed by the primary account holder.",
  },
  {
    q: "What happens if I need emergency care?",
    a: "iBam Health is designed for non-emergency and chronic care management. If you describe symptoms that indicate a medical emergency, our triage system will immediately direct you to your nearest emergency facility and, where available, dispatch a referral to a partner hospital.",
  },
  {
    q: "Does iBam Health accept NHIS?",
    a: "We are actively working on NHIS integration. Currently, you can pay via card, bank transfer, or USSD through Paystack. Corporate clients can negotiate direct billing arrangements with us.",
  },
];

export default function FAQ({ limit }: { limit?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = limit ? FAQS.slice(0, limit) : FAQS;

  return (
    <section className={s.section}>
      <div className={s.inner}>
        <div className={`${s.header} reveal`}>
          <span className={s.eyebrow}>FAQ</span>
          <h2>Common questions</h2>
          <p>Everything you need to know about iBam Health.</p>
        </div>

        <div className={`${s.list} reveal`}>
          {items.map((faq, i) => (
            <div key={i} className={`${s.item} ${open === i ? s.open : ""}`}>
              <button className={s.question} onClick={() => setOpen(open === i ? null : i)}>
                <span>{faq.q}</span>
                <span className={s.icon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
              <div className={s.answer}>
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

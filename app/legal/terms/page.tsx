import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions — iBam Health',
  description:
    'The terms and conditions governing your use of iBam Health services.'
}

export default function TermsPage () {
  return (
    <div className='legal-doc'>
      <h1>Terms &amp; Conditions</h1>
      <span className='effective'>
        Effective Date: 20 July 2026 &nbsp;·&nbsp; Version 1.0
      </span>

      <div className='highlight-box'>
        Please read these Terms carefully before using iBam Health. By creating
        an account or using any of our services, you agree to be bound by these
        Terms. If you do not agree, you must not use iBam Health.
      </div>

      {/* ── 1 ── */}
      <h2>1. About iBam Health</h2>
      <p>
        iBam Health (&ldquo;iBam&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
        &ldquo;our&rdquo;) is a digital health platform operated under Nigerian
        law that connects patients with licensed medical professionals,
        accredited pharmacies, and certified diagnostic laboratories. Our
        services include telemedicine consultations, e-prescriptions, pharmacy
        order fulfilment, laboratory test requests, health triage, and
        subscription wellness plans.
      </p>
      <p>
        iBam Health is not a hospital, clinic, or medical institution. We are a
        technology platform that facilitates healthcare services. All clinical
        decisions are made exclusively by the licensed professionals on our
        platform.
      </p>

      {/* ── 2 ── */}
      <h2>2. Eligibility</h2>
      <ul>
        <li>
          You must be at least <strong>18 years old</strong> to create an
          account. Users between 13 and 17 may use iBam Health only with the
          consent and active supervision of a parent or legal guardian.
        </li>
        <li>
          You must provide accurate, current, and complete information during
          registration.
        </li>
        <li>
          You must have a valid Nigerian mobile number capable of receiving OTP
          verification.
        </li>
        <li>
          Medical professionals (doctors, pharmacists, laboratory scientists)
          must hold current, valid licences issued by the relevant Nigerian
          regulatory body (MDCN, PCN, MLSCN).
        </li>
        <li>
          Business partners (pharmacies, laboratories) must be duly registered
          with the Corporate Affairs Commission (CAC) and the relevant
          regulatory authority.
        </li>
      </ul>

      {/* ── 3 ── */}
      <h2>3. Account Registration &amp; Security</h2>
      <p>
        You are responsible for maintaining the confidentiality of your login
        credentials and for all activities that occur under your account. You
        agree to:
      </p>
      <ul>
        <li>Provide truthful registration information and keep it updated.</li>
        <li>
          Immediately notify us at{' '}
          <a href='mailto:support@ibamhealth.com'>support@ibamhealth.com</a> of
          any unauthorised access.
        </li>
        <li>Not share your account with any other person.</li>
        <li>
          Not create multiple accounts to circumvent restrictions or bans.
        </li>
      </ul>
      <p>
        We reserve the right to suspend or terminate any account where we
        reasonably believe the information provided is false, or where the
        account poses a risk to users or the platform.
      </p>

      {/* ── 4 ── */}
      <h2>4. Services</h2>

      <h3>4.1 Telemedicine Consultations</h3>
      <p>
        iBam Health enables patients to book video, audio, or chat consultations
        with licensed doctors. Consultations are conducted through our encrypted
        platform. Consultation fees are set by individual doctors and displayed
        prior to booking. A platform service fee applies to each consultation.
      </p>
      <p>
        iBam Health does not guarantee the availability of any specific doctor.
        Appointment times are indicative and may vary due to prior patient care
        demands.
      </p>

      <h3>4.2 E-Prescriptions</h3>
      <p>
        Prescriptions issued through iBam Health are generated solely by
        licensed doctors and are valid for dispensing at pharmacies registered
        under the Pharmacists Council of Nigeria (PCN). Digital prescriptions
        are stored in your account for 12 months. You must not alter, forge, or
        misuse any prescription issued on our platform.
      </p>

      <h3>4.3 Pharmacy Orders</h3>
      <p>
        iBam Health partners with PCN-registered pharmacy outlets to fulfil drug
        orders. Medication availability, pricing, and delivery timelines are
        managed by partner pharmacies. iBam Health does not dispense medication
        directly and is not liable for pharmacy errors, drug interactions, or
        adverse reactions arising from medications dispensed by partner
        pharmacies.
      </p>

      <h3>4.4 Laboratory &amp; Diagnostic Tests</h3>
      <p>
        Diagnostic test requests are fulfilled by MLSCN-accredited partner
        laboratories. Sample collection, processing, and result reporting are
        the responsibility of the partner laboratory. iBam Health is not liable
        for inaccurate test results caused by laboratory error or improper
        sample collection on the patient&rsquo;s part.
      </p>

      <h3>4.5 Health Triage</h3>
      <p>
        Our AI-assisted triage tool provides symptom-based guidance only. It is{' '}
        <strong>not a diagnostic tool</strong> and does not replace a clinical
        consultation. Triage results must not be used as the basis for
        self-medication.
      </p>

      <h3>4.6 Subscription Plans</h3>
      <p>
        Subscription plans grant access to bundled wellness benefits as
        described at the time of purchase. Benefits are non-transferable and
        valid only for the subscribed account holder.
      </p>

      {/* ── 5 ── */}
      <h2>5. Doctor &amp; Professional Terms</h2>
      <p>Medical professionals using iBam Health agree to:</p>
      <ul>
        <li>
          Maintain valid, current registration with the Medical and Dental
          Council of Nigeria (MDCN) or relevant regulatory body at all times.
        </li>
        <li>
          Provide consultation services in accordance with the Nigerian Medical
          Code of Ethics.
        </li>
        <li>
          Complete iBam&rsquo;s KYC verification, including NIN verification and
          face-match biometric check, before seeing patients.
        </li>
        <li>
          Maintain patient confidentiality in compliance with the National
          Health Act 2014 and NDPR 2019.
        </li>
        <li>
          Not prescribe controlled substances (Schedule I–III) via telemedicine
          without a prior in-person examination, as required by NDLEA
          regulations.
        </li>
        <li>
          Update their availability status accurately to avoid patient
          inconvenience.
        </li>
        <li>
          Not solicit patients for off-platform consultations to circumvent iBam
          fees.
        </li>
      </ul>
      <p>
        iBam Health reserves the right to suspend any doctor pending
        investigation of a patient complaint, and to permanently remove any
        doctor found to have breached these terms or professional ethics.
      </p>

      {/* ── 6 ── */}
      <h2>6. Fees &amp; Payments</h2>
      <p>
        All payments are processed securely via Paystack, a PCI-DSS compliant
        payment processor. By making a payment, you authorise iBam Health and
        Paystack to charge your nominated payment method for the amount
        displayed at checkout.
      </p>
      <ul>
        <li>
          <strong>Consultation fees</strong> are charged at the time of booking
          confirmation.
        </li>
        <li>
          <strong>Pharmacy and lab orders</strong> are charged upon order
          placement.
        </li>
        <li>
          <strong>Subscription fees</strong> are charged at the start of each
          billing cycle and auto-renew until cancelled.
        </li>
        <li>
          All prices are in Nigerian Naira (₦) and are inclusive of applicable
          taxes.
        </li>
        <li>
          iBam Health retains a platform fee of up to 20% from each doctor
          consultation fee.
        </li>
      </ul>

      {/* ── 7 ── */}
      <h2>7. Prohibited Conduct</h2>
      <p>You must not use iBam Health to:</p>
      <ul>
        <li>Provide false medical history or identity information.</li>
        <li>Obtain prescriptions for the purpose of reselling medications.</li>
        <li>Harass, threaten, or abuse any doctor, partner, or other user.</li>
        <li>
          Attempt to circumvent our payment systems or charge-backs through
          fraudulent means.
        </li>
        <li>Reverse-engineer, scrape, or extract data from our platform.</li>
        <li>Impersonate a medical professional or another user.</li>
        <li>Upload malicious code or interfere with platform security.</li>
        <li>Violate any applicable Nigerian law or regulation.</li>
      </ul>
      <p>
        Violations may result in immediate account termination and referral to
        the relevant Nigerian law enforcement or regulatory authorities.
      </p>

      {/* ── 8 ── */}
      <h2>8. Intellectual Property</h2>
      <p>
        All content on iBam Health — including but not limited to logos,
        software, design, text, and data — is the exclusive property of iBam
        Health or its licensors and is protected under Nigerian copyright law
        and international intellectual property treaties. You may not copy,
        modify, distribute, or create derivative works without our express
        written permission.
      </p>
      <p>
        By uploading content (e.g., profile photos, medical documents) to iBam
        Health, you grant us a non-exclusive, royalty-free licence to store,
        display, and process that content solely for the purpose of providing
        our services to you.
      </p>

      {/* ── 9 ── */}
      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by Nigerian law, iBam Health and its
        directors, employees, and partners shall not be liable for:
      </p>
      <ul>
        <li>
          Any indirect, incidental, special, or consequential damages arising
          from your use of the platform.
        </li>
        <li>
          Clinical outcomes resulting from consultations, prescriptions, or
          treatments facilitated through the platform.
        </li>
        <li>
          Loss of data, revenue, or business arising from platform downtime or
          technical failure.
        </li>
        <li>
          Actions or omissions of independent doctors, pharmacies, or
          laboratories on the platform.
        </li>
      </ul>
      <p>
        Our total aggregate liability to you for any claim shall not exceed the
        amount you paid to iBam Health in the three (3) months preceding the
        claim.
      </p>

      {/* ── 10 ── */}
      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless iBam Health, its officers,
        directors, employees, and agents from any claims, damages, fines, or
        expenses (including reasonable legal fees) arising from: (a) your breach
        of these Terms; (b) your violation of any Nigerian law or third-party
        right; or (c) any false or misleading information you provided to the
        platform.
      </p>

      {/* ── 11 ── */}
      <h2>11. Termination</h2>
      <p>
        You may close your account at any time by contacting{' '}
        <a href='mailto:support@ibamhealth.com'>support@ibamhealth.com</a>. Upon
        closure, your personal data will be handled in accordance with our
        Privacy Policy. Unused subscription credits are not refundable upon
        voluntary account closure.
      </p>
      <p>
        We may suspend or terminate your account immediately, without notice, if
        we determine you have materially breached these Terms, committed fraud,
        or pose a risk to other users or the integrity of the platform.
      </p>

      {/* ── 12 ── */}
      <h2>12. Governing Law &amp; Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of the Federal Republic of Nigeria.
        Any dispute arising under these Terms shall first be submitted to
        mediation administered by the Enugu Multi-Door Courthouse (LMDC) or such
        other agreed mediator. If mediation fails, disputes shall be resolved by
        arbitration under the Arbitration and Mediation Act 2023, with the seat
        of arbitration in Enugu, Nigeria.
      </p>
      <p>
        Nothing in this clause prevents either party from seeking urgent
        injunctive or equitable relief from a court of competent jurisdiction.
      </p>

      {/* ── 13 ── */}
      <h2>13. Changes to These Terms</h2>
      <p>
        We may update these Terms periodically. We will notify you of material
        changes via email or in-app notification at least 14 days before they
        take effect. Your continued use of iBam Health after the effective date
        constitutes your acceptance of the revised Terms.
      </p>

      {/* ── 14 ── */}
      <h2>14. Contact</h2>
      <p>
        For questions about these Terms, contact our legal team:
        <br />
        <strong>iBam Health Technologies Ltd</strong>
        <br />
        Email: <a href='mailto:legal@ibamhealth.com'>legal@ibamhealth.com</a>
        <br />
        Address: Enugu, Nigeria
      </p>
    </div>
  )
}

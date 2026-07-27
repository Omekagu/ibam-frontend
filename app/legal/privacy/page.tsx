import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — iBam Health',
  description:
    'How iBam Health collects, uses, and protects your personal and health data in compliance with the NDPR.'
}

export default function PrivacyPage () {
  return (
    <div className='legal-doc'>
      <h1>Privacy Policy</h1>
      <span className='effective'>
        Effective Date: 20 July 2026 &nbsp;·&nbsp; Version 1.0
      </span>

      <div className='highlight-box'>
        iBam Health is committed to protecting your privacy. This Policy
        explains how we collect, use, share, and safeguard your personal data in
        compliance with the{' '}
        <strong>Nigeria Data Protection Regulation 2019 (NDPR)</strong> and the{' '}
        <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>. Your health
        data is never sold to third parties.
      </div>

      {/* ── 1 ── */}
      <h2>1. Data Controller</h2>
      <p>
        iBam Health Technologies Ltd (&ldquo;iBam&rdquo;, &ldquo;we&rdquo;) is
        the Data Controller for personal data collected through our web
        platform, mobile application, and APIs. Our designated Data Protection
        Officer (DPO) can be reached at{' '}
        <a href='mailto:dpo@ibamhealth.com'>dpo@ibamhealth.com</a>.
      </p>

      {/* ── 2 ── */}
      <h2>2. Data We Collect</h2>

      <h3>2.1 Information You Provide</h3>
      <ul>
        <li>
          <strong>Identity data:</strong> Full name, date of birth, gender,
          profile photo, National Identification Number (NIN).
        </li>
        <li>
          <strong>Contact data:</strong> Email address, phone number, delivery
          address.
        </li>
        <li>
          <strong>Health data:</strong> Medical history, symptoms, diagnoses,
          prescriptions, lab results, blood type, allergies, consultation notes
          and recordings (where consent is given).
        </li>
        <li>
          <strong>Financial data:</strong> Payment card details (tokenised via
          Paystack — we never store raw card numbers), bank verification number
          (BVN) for payouts to doctors.
        </li>
        <li>
          <strong>Professional data (doctors/partners):</strong> Medical licence
          number, licence document, CAC registration number, qualifications,
          professional bio.
        </li>
      </ul>

      <h3>2.2 Data Collected Automatically</h3>
      <ul>
        <li>
          <strong>Usage data:</strong> Pages visited, features used, appointment
          history, session duration.
        </li>
        <li>
          <strong>Device data:</strong> Device type, operating system, IP
          address, browser type.
        </li>
        <li>
          <strong>Location data:</strong> Approximate location (city/state
          level) used to suggest nearby pharmacies and labs. Precise GPS is only
          used with your explicit consent.
        </li>
        <li>
          <strong>Cookies and analytics:</strong> See Section 9.
        </li>
      </ul>

      <h3>2.3 Data from Third Parties</h3>
      <ul>
        <li>
          <strong>Dojah (KYC provider):</strong> NIN biographic data and
          face-match scores for identity verification.
        </li>
        <li>
          <strong>Paystack:</strong> Payment status and transaction references.
        </li>
        <li>
          <strong>Agora:</strong> Video/audio call metadata (call duration,
          participant counts). Agora does not retain call content after the
          session ends.
        </li>
      </ul>

      {/* ── 3 ── */}
      <h2>3. How We Use Your Data</h2>

      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Data Used</th>
            <th>Legal Basis (NDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Create and manage your account</td>
            <td>Identity, contact</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Facilitate consultations and bookings</td>
            <td>Identity, health, contact</td>
            <td>Contract / Vital interest</td>
          </tr>
          <tr>
            <td>Process payments</td>
            <td>Financial</td>
            <td>Contract</td>
          </tr>
          <tr>
            <td>Verify doctor and partner identity (KYC)</td>
            <td>NIN, face biometric</td>
            <td>Legal obligation / Legitimate interest</td>
          </tr>
          <tr>
            <td>Dispense prescriptions and lab results</td>
            <td>Health, identity</td>
            <td>Vital interest / Consent</td>
          </tr>
          <tr>
            <td>Send appointment reminders and notifications</td>
            <td>Contact, booking data</td>
            <td>Contract / Consent</td>
          </tr>
          <tr>
            <td>Detect fraud and ensure platform security</td>
            <td>Usage, device data</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Comply with legal obligations (NDPR, NDLEA, MDCN)</td>
            <td>All categories</td>
            <td>Legal obligation</td>
          </tr>
          <tr>
            <td>Aggregate anonymised health analytics</td>
            <td>De-identified health data</td>
            <td>Legitimate interest</td>
          </tr>
          <tr>
            <td>Send marketing emails (opt-in only)</td>
            <td>Email, usage</td>
            <td>Consent</td>
          </tr>
        </tbody>
      </table>

      <p>
        We <strong>never</strong> use your health data to make automated
        decisions with legal or similarly significant effects without human
        review.
      </p>

      {/* ── 4 ── */}
      <h2>4. Data Sharing</h2>
      <p>We share your data only as described below:</p>

      <h3>4.1 Within the Platform</h3>
      <ul>
        <li>
          <strong>Doctors</strong> see patient name, relevant health history
          shared by the patient, consultation notes, and prescriptions for the
          purpose of providing care.
        </li>
        <li>
          <strong>Partner pharmacies</strong> see prescription details, patient
          name, and delivery address when an order is placed.
        </li>
      </ul>

      <h3>4.2 Service Providers (Data Processors)</h3>
      <p>
        We engage the following processors under binding data processing
        agreements:
      </p>
      <ul>
        <li>
          <strong>Paystack</strong> — payment processing
        </li>
        <li>
          <strong>Dojah</strong> — identity/KYC verification
        </li>
        <li>
          <strong>Agora</strong> — video and audio call infrastructure
        </li>
        <li>
          <strong>Cloudinary</strong> — secure media storage (profile photos,
          documents)
        </li>
        <li>
          <strong>MongoDB Atlas</strong> — cloud database (hosted in Europe/US
          with Standard Contractual Clauses)
        </li>
        <li>
          <strong>Termii</strong> — SMS OTP delivery
        </li>
      </ul>

      <h3>4.3 Legal Disclosure</h3>
      <p>
        We may disclose your data when required by Nigerian law, a court order,
        or a regulatory authority (e.g., NITDA, NDLEA, NAFDAC, Nigerian Police
        Force) — and only to the extent strictly required. We will notify you of
        such disclosures where legally permitted.
      </p>

      <h3>4.4 Business Transfer</h3>
      <p>
        In the event of a merger, acquisition, or asset sale, your data may be
        transferred. We will provide notice and continue to honour your privacy
        rights.
      </p>

      <p>
        We <strong>do not sell</strong> your personal data to advertisers, data
        brokers, insurance companies, or any other third party.
      </p>

      {/* ── 5 ── */}
      <h2>5. Health Data &amp; Confidentiality</h2>
      <p>
        Health data is classified as <strong>sensitive personal data</strong>{' '}
        under the NDPR and NDPA and is afforded the highest level of protection.
        We process your health data only to provide you with healthcare services
        or where required by law. All health data is encrypted at rest (AES-256)
        and in transit (TLS 1.3+).
      </p>
      <p>
        Consultation transcripts and medical notes are accessible only to the
        treating doctor and the patient. iBam Health administrators access
        health data solely for technical support, fraud prevention, or
        regulatory compliance, and only under strict access controls.
      </p>

      {/* ── 6 ── */}
      <h2>6. Data Retention</h2>
      <table>
        <thead>
          <tr>
            <th>Data Type</th>
            <th>Retention Period</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account and profile data</td>
            <td>Duration of account + 5 years after closure</td>
          </tr>
          <tr>
            <td>Medical records and prescriptions</td>
            <td>10 years (National Health Act 2014 requirement)</td>
          </tr>
          <tr>
            <td>Payment records</td>
            <td>7 years (FIRS / tax compliance)</td>
          </tr>
          <tr>
            <td>KYC / NIN verification data</td>
            <td>5 years after verification</td>
          </tr>
          <tr>
            <td>Consultation recordings (if consented)</td>
            <td>90 days, then auto-deleted</td>
          </tr>
          <tr>
            <td>Server and security logs</td>
            <td>12 months</td>
          </tr>
          <tr>
            <td>Marketing opt-in records</td>
            <td>Until opt-out + 3 years</td>
          </tr>
        </tbody>
      </table>

      {/* ── 7 ── */}
      <h2>7. Your Rights Under the NDPR &amp; NDPA</h2>
      <p>
        As a data subject, you have the following rights. To exercise them,
        email
        <a href='mailto:dpo@ibamhealth.com'> dpo@ibamhealth.com</a> with proof
        of identity. We will respond within <strong>30 days</strong>.
      </p>
      <ul>
        <li>
          <strong>Right of access:</strong> Request a copy of all personal data
          we hold about you.
        </li>
        <li>
          <strong>Right to rectification:</strong> Correct inaccurate or
          incomplete data.
        </li>
        <li>
          <strong>Right to erasure:</strong> Request deletion of your data where
          we have no legal obligation to retain it (note: medical records are
          subject to mandatory retention periods).
        </li>
        <li>
          <strong>Right to data portability:</strong> Receive your data in a
          structured, machine-readable format.
        </li>
        <li>
          <strong>Right to object:</strong> Object to processing based on
          legitimate interest, including direct marketing.
        </li>
        <li>
          <strong>Right to restrict processing:</strong> Request that we limit
          how we use your data during a dispute.
        </li>
        <li>
          <strong>Right to withdraw consent:</strong> Where processing is based
          on consent, withdraw it at any time without affecting prior lawful
          processing.
        </li>
        <li>
          <strong>Right to lodge a complaint:</strong> File a complaint with
          NITDA at{' '}
          <a
            href='https://ndpr.nitda.gov.ng'
            target='_blank'
            rel='noopener noreferrer'
          >
            ndpr.nitda.gov.ng
          </a>
          .
        </li>
      </ul>

      {/* ── 8 ── */}
      <h2>8. Security</h2>
      <p>We implement the following measures to protect your data:</p>
      <ul>
        <li>AES-256 encryption at rest for all stored data.</li>
        <li>TLS 1.3 encryption for all data in transit.</li>
        <li>Multi-factor authentication for administrative access.</li>
        <li>
          Role-based access controls — staff access only the data needed for
          their role.
        </li>
        <li>Regular penetration testing and vulnerability assessments.</li>
        <li>24/7 intrusion detection monitoring.</li>
        <li>
          Incident response plan aligned with NDPR breach notification
          requirements (72-hour NITDA notification where required).
        </li>
      </ul>
      <p>
        No system is perfectly secure. In the event of a data breach that poses
        a high risk to your rights, we will notify you directly within{' '}
        <strong>72 hours</strong> of becoming aware.
      </p>

      {/* ── 9 ── */}
      <h2>9. Cookies</h2>
      <p>We use the following types of cookies:</p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Essential</td>
            <td>Authentication, session management</td>
            <td>Session</td>
          </tr>
          <tr>
            <td>Preference</td>
            <td>Theme, language, UI settings</td>
            <td>12 months</td>
          </tr>
          <tr>
            <td>Analytics</td>
            <td>Anonymous usage statistics (no cross-site tracking)</td>
            <td>6 months</td>
          </tr>
        </tbody>
      </table>
      <p>
        We do <strong>not</strong> use advertising or tracking cookies. You can
        manage cookies through your browser settings. Disabling essential
        cookies will impair platform functionality.
      </p>

      {/* ── 10 ── */}
      <h2>10. Children&rsquo;s Privacy</h2>
      <p>
        iBam Health does not knowingly collect personal data from children under
        13. Users aged 13–17 must have parental/guardian consent. If you believe
        a child has created an account without consent, contact us immediately
        at <a href='mailto:dpo@ibamhealth.com'>dpo@ibamhealth.com</a>.
      </p>

      {/* ── 11 ── */}
      <h2>11. International Data Transfers</h2>
      <p>
        Some of our processors (MongoDB Atlas, Cloudinary, Agora) store or
        process data outside Nigeria. We ensure appropriate safeguards are in
        place, including Standard Contractual Clauses or adequacy decisions
        recognised under Nigerian law, before any such transfer.
      </p>

      {/* ── 12 ── */}
      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy to reflect changes in law or our
        practices. Material changes will be communicated via email and in-app
        notification at least 14 days in advance. The current version is always
        available at <strong>ibamhealth.com/legal/privacy</strong>.
      </p>

      {/* ── 13 ── */}
      <h2>13. Contact</h2>
      <p>
        <strong>Data Protection Officer — iBam Health Technologies Ltd</strong>
        <br />
        Email: <a href='mailto:dpo@ibamhealth.com'>dpo@ibamhealth.com</a>
        <br />
        Postal: Enugu, Nigeria
        <br />
        To exercise your NDPR rights or report a concern, use the above email
        with the subject line &ldquo;Data Subject Request&rdquo;.
      </p>
    </div>
  )
}

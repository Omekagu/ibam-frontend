import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Disclaimer — iBam Health',
  description: 'Important information about the limitations of iBam Health services and when to seek emergency care.',
};

export default function MedicalDisclaimerPage() {
  return (
    <div className="legal-doc">
      <h1>Medical Disclaimer</h1>
      <span className="effective">Effective Date: 20 July 2026 &nbsp;·&nbsp; Version 1.0</span>

      <div className="warning-box">
        <strong>Emergency Notice:</strong> If you or someone else is experiencing a medical
        emergency — including chest pain, difficulty breathing, loss of consciousness, severe
        bleeding, suspected stroke, or any life-threatening condition — <strong>do not use this
        platform</strong>. Call <strong>112</strong> (National Emergency) or{' '}
        <strong>767</strong> (Lagos State Emergency) immediately and go to your nearest
        emergency department.
      </div>

      {/* ── 1 ── */}
      <h2>1. Not a Substitute for Emergency or In-Person Care</h2>
      <p>
        iBam Health is a digital health platform that facilitates telemedicine consultations,
        e-prescriptions, pharmacy orders, and laboratory test requests. It is <strong>not a
        hospital, clinic, or emergency service</strong> and cannot replace in-person clinical
        assessment, physical examination, or emergency medical intervention.
      </p>
      <p>
        Certain conditions — including but not limited to chest pain, stroke symptoms, severe
        trauma, obstetric emergencies, mental health crises involving immediate risk to life, and
        acute paediatric illness — require urgent in-person evaluation. If you are unsure whether
        your condition is an emergency, err on the side of caution and seek immediate care.
      </p>

      {/* ── 2 ── */}
      <h2>2. Platform Information Is Not Medical Advice</h2>
      <p>
        Content published on iBam Health — including articles, FAQs, health tips, triage
        guidance, and any AI-generated text — is provided for <strong>general informational
        purposes only</strong>. It does not constitute, and must not be treated as, professional
        medical advice, diagnosis, or treatment.
      </p>
      <p>
        Always seek the advice of a qualified, licensed medical professional with any questions
        you may have regarding your health or a medical condition. Never disregard professional
        medical advice or delay seeking it because of something you have read or seen on this platform.
      </p>

      {/* ── 3 ── */}
      <h2>3. Triage Tool Limitations</h2>
      <p>
        iBam Health offers an AI-assisted symptom triage tool designed to help you understand
        the possible urgency of your symptoms and guide you toward an appropriate next step
        (e.g., self-care, telemedicine, or in-person visit). The triage tool:
      </p>
      <ul>
        <li>Is <strong>not a diagnostic instrument</strong> and does not produce a clinical diagnosis.</li>
        <li>Cannot account for your full medical history, physical findings, or test results.</li>
        <li>May not recognise rare conditions, atypical presentations, or symptom combinations not in its training data.</li>
        <li>Must <strong>never</strong> be used as the basis for self-medication, including over-the-counter drugs.</li>
        <li>Is intended to be used as a <em>starting point</em> for seeking appropriate care, not as a replacement for it.</li>
      </ul>

      <div className="warning-box">
        <strong>Important:</strong> If triage suggests "low urgency" but your instinct tells you
        something is seriously wrong, trust your instinct and seek care immediately. No automated
        tool can fully replace clinical judgement.
      </div>

      {/* ── 4 ── */}
      <h2>4. Telemedicine Consultations</h2>
      <p>
        Telemedicine consultations on iBam Health are conducted by licensed doctors registered
        with the Medical and Dental Council of Nigeria (MDCN). However:
      </p>
      <ul>
        <li>
          A telemedicine consultation is inherently limited because the doctor cannot perform a
          physical examination, observe non-verbal clinical signs, or use diagnostic instruments
          in person.
        </li>
        <li>
          Diagnoses and treatment recommendations made via telemedicine are based solely on the
          information you share and the doctor&apos;s professional judgement within those constraints.
          They may differ from an in-person assessment.
        </li>
        <li>
          For complex, chronic, or progressive conditions, telemedicine should complement — not
          replace — your relationship with a primary care physician or specialist.
        </li>
        <li>
          iBam Health does not guarantee any clinical outcome and is not liable for the
          independent professional judgements of doctors on its platform (see Terms &amp; Conditions
          Section 9).
        </li>
      </ul>

      {/* ── 5 ── */}
      <h2>5. Prescriptions and Medications</h2>
      <p>
        Prescriptions issued through iBam Health are generated exclusively by licensed doctors.
        However:
      </p>
      <ul>
        <li>
          <strong>Do not self-medicate</strong> based on a previous prescription, a friend&apos;s
          prescription, or platform information. Medications have specific indications,
          contraindications, and dosing requirements that must be assessed by a doctor for
          your individual situation.
        </li>
        <li>
          Inform your doctor of all medications you are currently taking, including
          over-the-counter drugs, supplements, and herbal remedies, to avoid dangerous interactions.
        </li>
        <li>
          If you experience an adverse reaction to any medication dispensed through iBam Health,
          stop taking the medication and seek immediate medical attention. Report the reaction to
          NAFDAC at <a href="tel:08001006268">0800-100-6268</a>.
        </li>
        <li>
          Controlled substances (Schedule I–III under NDLEA regulations) will not be prescribed
          via telemedicine without a prior in-person examination, as required by Nigerian law.
        </li>
      </ul>

      {/* ── 6 ── */}
      <h2>6. Laboratory &amp; Diagnostic Tests</h2>
      <p>
        Laboratory test results obtained through iBam Health should be interpreted by a licensed
        medical professional in the context of your complete clinical picture. A test result —
        whether normal or abnormal — does not constitute a diagnosis on its own. Do not
        self-interpret test results or make clinical decisions based solely on a result without
        consulting a doctor.
      </p>

      {/* ── 7 ── */}
      <h2>7. Mental Health</h2>
      <p>
        iBam Health may offer mental health and counselling services through licensed
        professionals. If you or someone you know is experiencing a mental health crisis —
        including thoughts of suicide or self-harm — please contact:
      </p>
      <ul>
        <li><strong>Nigeria Suicide Prevention Initiative (NAPS):</strong> <a href="tel:+2348062106493">+234 806 210 6493</a></li>
        <li><strong>Centre for Suicide Prevention and Research, Lagos:</strong> <a href="tel:+2348089558678">+234 808 955 8678</a></li>
        <li><strong>National Emergency:</strong> <a href="tel:112">112</a></li>
        <li>Go to your nearest emergency department or psychiatric unit.</li>
      </ul>
      <p>
        Do not wait for a scheduled telemedicine appointment if you or someone else is at
        immediate risk.
      </p>

      {/* ── 8 ── */}
      <h2>8. Children and Minors</h2>
      <p>
        Parents and guardians are responsible for making healthcare decisions on behalf of
        minor children. Telemedicine consultations for children should supplement, not replace,
        regular paediatric care. Sick children under 5 with fever, respiratory distress, severe
        diarrhoea, or unusual lethargy should be seen in person without delay.
      </p>

      {/* ── 9 ── */}
      <h2>9. Accuracy of Platform Information</h2>
      <p>
        iBam Health makes reasonable efforts to ensure that health information published on the
        platform is accurate and up to date. However, medical knowledge evolves rapidly, and we
        cannot guarantee that all content reflects the most current clinical guidelines or research.
        We are not liable for any errors or omissions in published health information or for
        any outcomes resulting from reliance on such information.
      </p>

      {/* ── 10 ── */}
      <h2>10. No Doctor–Patient Relationship with iBam Health</h2>
      <p>
        iBam Health Technologies Ltd is a technology platform, not a healthcare provider. No
        doctor–patient relationship exists between you and iBam Health as a company. A
        doctor–patient relationship exists solely between you and the individual licensed doctor
        you consult through the platform. iBam Health staff — including customer support agents —
        are not qualified to provide medical advice.
      </p>

      {/* ── 11 ── */}
      <h2>11. Second Opinions</h2>
      <p>
        You are always entitled to seek a second medical opinion. If you are uncertain about a
        diagnosis or treatment plan received through iBam Health, we encourage you to consult
        another qualified professional. iBam Health facilitates access to multiple doctors and
        supports your right to informed healthcare decision-making.
      </p>

      {/* ── 12 ── */}
      <h2>12. Contact for Medical Concerns</h2>
      <p>
        If you have a concern about care received through iBam Health, contact our clinical team:<br />
        <strong>Clinical Concerns:</strong> <a href="mailto:complaints@ibamhealth.com">complaints@ibamhealth.com</a><br />
        <strong>General Support:</strong> <a href="mailto:support@ibamhealth.com">support@ibamhealth.com</a><br />
        <strong>Hotline:</strong> Monday–Friday, 8 am–8 pm WAT
      </p>
      <p>
        For complaints about a specific doctor, you may also contact the Medical and Dental
        Council of Nigeria (MDCN) directly at <a href="https://mdcn.gov.ng" target="_blank" rel="noopener noreferrer">mdcn.gov.ng</a>.
      </p>
    </div>
  );
}

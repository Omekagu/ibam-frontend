import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — iBam Health',
  description:
    'iBam Health refund, cancellation, and dispute resolution policy for consultations, pharmacy orders, lab tests, and subscriptions.'
}

export default function RefundPage () {
  return (
    <div className='legal-doc'>
      <h1>Refund &amp; Cancellation Policy</h1>
      <span className='effective'>
        Effective Date: 20 July 2026 &nbsp;·&nbsp; Version 1.0
      </span>

      <div className='highlight-box'>
        We want every iBam Health experience to be excellent. If something goes
        wrong, this policy explains your options. All refund requests must be
        raised within the timeframes below. Refunds are processed back to the
        original payment method within <strong>5–10 business days</strong>.
      </div>

      {/* ── 1 ── */}
      <h2>1. Telemedicine Consultations</h2>

      <h3>1.1 Patient-initiated Cancellation</h3>
      <table>
        <thead>
          <tr>
            <th>Cancellation Timing</th>
            <th>Refund</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>More than 24 hours before scheduled appointment</td>
            <td>
              <strong>100% refund</strong>
            </td>
          </tr>
          <tr>
            <td>2–24 hours before scheduled appointment</td>
            <td>
              <strong>50% refund</strong>
            </td>
          </tr>
          <tr>
            <td>Less than 2 hours before appointment</td>
            <td>
              <strong>No refund</strong>
            </td>
          </tr>
          <tr>
            <td>No-show (patient does not join within 15 minutes)</td>
            <td>
              <strong>No refund</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>1.2 Doctor-initiated Cancellation or No-Show</h3>
      <p>
        If the doctor cancels or fails to join within{' '}
        <strong>15 minutes</strong> of the scheduled time, you are entitled to a{' '}
        <strong>100% refund</strong> or, at your option, a free rescheduled
        consultation with the same or another available doctor.
      </p>

      <h3>1.3 Technical Failure</h3>
      <p>
        If a consultation is cut short or cannot proceed due to a verified fault
        in the iBam Health platform (not your device or internet connection),
        you will receive a<strong> 100% refund</strong> or the option to
        reschedule at no charge. Technical issues must be reported within{' '}
        <strong>2 hours</strong> of the scheduled session.
      </p>

      <h3>1.4 Completed Consultations</h3>
      <p>
        Once a consultation has been completed (the session has ended and both
        parties participated), fees are <strong>non-refundable</strong> unless a
        medical negligence complaint is substantiated through our formal
        complaints process (see Section 6).
      </p>

      <div className='warning-box'>
        <strong>Important:</strong> Dissatisfaction with a medical opinion or
        treatment recommendation is not grounds for a refund. Clinical decisions
        are the independent judgement of licensed doctors.
      </div>

      {/* ── 2 ── */}
      <h2>2. Pharmacy Orders</h2>

      <h3>2.1 Order Cancellation</h3>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Refund</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cancelled before pharmacy begins processing</td>
            <td>
              <strong>100% refund</strong>
            </td>
          </tr>
          <tr>
            <td>Cancelled after processing has started</td>
            <td>
              <strong>No refund</strong> (pharmacy has committed resources)
            </td>
          </tr>
          <tr>
            <td>Item(s) out of stock — pharmacy unable to fulfil</td>
            <td>
              <strong>100% refund</strong> for unfulfilled items
            </td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 Delivery Issues</h3>
      <ul>
        <li>
          <strong>Wrong medication or dosage delivered:</strong> 100% refund or
          free replacement within 48 hours of delivery. Report within 6 hours of
          receiving the order.
        </li>
        <li>
          <strong>Damaged or tampered packaging:</strong> 100% refund or
          replacement. Report within 6 hours with photo evidence.
        </li>
        <li>
          <strong>Non-delivery (dispatch confirmed but not received):</strong>{' '}
          100% refund after a 48-hour investigation period. Report within 24
          hours of estimated delivery.
        </li>
        <li>
          <strong>Delivery to wrong address due to patient error:</strong> No
          refund.
        </li>
      </ul>

      <h3>2.3 Returns</h3>
      <p>
        For <strong>health and safety reasons</strong>, dispensed medications
        cannot be returned or exchanged once they have left the pharmacy, except
        where the item is demonstrably incorrect, damaged, or counterfeit.
        Counterfeit medication concerns should also be reported to NAFDAC at{' '}
        <a href='tel:08001006268'>0800-100-6268</a>.
      </p>

      {/* ── 3 ── */}
      <h2>3. Laboratory &amp; Diagnostic Tests</h2>

      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Refund</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cancelled before sample collection</td>
            <td>
              <strong>100% refund</strong>
            </td>
          </tr>
          <tr>
            <td>Sample collected but lab unable to process (lab error)</td>
            <td>
              <strong>100% refund</strong> or free re-test
            </td>
          </tr>
          <tr>
            <td>Test results delayed beyond the stated turnaround</td>
            <td>
              <strong>20% partial refund</strong> after written request, or full
              refund if delay exceeds 5× the stated time
            </td>
          </tr>
          <tr>
            <td>Patient cancels after sample collection</td>
            <td>
              <strong>No refund</strong>
            </td>
          </tr>
          <tr>
            <td>Home collection — patient not available at scheduled time</td>
            <td>
              <strong>No refund</strong> of collection fee; test fee may be
              credited for rescheduling
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 4 ── */}
      <h2>4. Subscription Plans</h2>

      <h3>4.1 Cancellation</h3>
      <p>
        You may cancel your subscription at any time through your account
        settings or by contacting support. Cancellation takes effect at the{' '}
        <strong>end of the current billing cycle</strong>. You will retain
        access to all subscription benefits until that date.
      </p>

      <h3>4.2 Refunds</h3>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Refund</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cancel within 48 hours of first payment, no benefits used</td>
            <td>
              <strong>100% refund</strong>
            </td>
          </tr>
          <tr>
            <td>Cancel after 48 hours of first payment</td>
            <td>
              <strong>No refund</strong> — access continues until end of cycle
            </td>
          </tr>
          <tr>
            <td>Auto-renewal charged in error after documented cancellation</td>
            <td>
              <strong>100% refund</strong> — report within 7 days
            </td>
          </tr>
          <tr>
            <td>Plan discontinued by iBam Health</td>
            <td>
              <strong>Pro-rata refund</strong> for unused days
            </td>
          </tr>
        </tbody>
      </table>

      <h3>4.3 Unused Benefits</h3>
      <p>
        Unused consultations, prescription credits, or test vouchers included in
        a subscription plan <strong>do not carry over</strong> between billing
        cycles and are not redeemable for cash.
      </p>

      {/* ── 5 ── */}
      <h2>5. How to Request a Refund</h2>
      <ol>
        <li>
          Email{' '}
          <a href='mailto:support@ibamhealth.com'>support@ibamhealth.com</a>{' '}
          with the subject line{' '}
          <strong>&ldquo;Refund Request — [Order/Appointment ID]&rdquo;</strong>
          .
        </li>
        <li>
          Include: your registered email, the transaction ID or appointment
          reference, a brief description of the issue, and any supporting
          evidence (photos, screenshots).
        </li>
        <li>
          Our support team will acknowledge your request within{' '}
          <strong>24 hours</strong> (business days).
        </li>
        <li>
          A decision will be communicated within{' '}
          <strong>3 business days</strong>.
        </li>
        <li>
          Approved refunds are processed within{' '}
          <strong>5–10 business days</strong> via the original payment method.
        </li>
      </ol>

      {/* ── 6 ── */}
      <h2>6. Formal Complaints &amp; Medical Negligence</h2>
      <p>
        If you believe you have experienced substandard clinical care, you may
        raise a formal complaint by emailing{' '}
        <a href='mailto:support@ibamhealth.com'>support@ibamhealth.com</a>. All
        clinical complaints are reviewed by our Chief Medical Officer within 5
        business days.
      </p>
      <p>
        Where medical negligence is substantiated, iBam Health will cooperate
        with any investigation by the Medical and Dental Council of Nigeria
        (MDCN) and may suspend the relevant doctor pending the outcome.
        Compensation for medical negligence is the independent liability of the
        treating doctor, not iBam Health (see Terms &amp; Conditions Section 9).
      </p>

      {/* ── 7 ── */}
      <h2>7. Chargebacks</h2>
      <p>
        If you initiate a chargeback with your bank or card issuer without first
        contacting iBam Health support, we reserve the right to suspend your
        account pending investigation. Fraudulent chargebacks may be reported to
        the relevant Nigerian financial regulators and law enforcement.
      </p>

      {/* ── 8 ── */}
      <h2>8. Contact</h2>
      <p>
        <strong>iBam Health Customer Support</strong>
        <br />
        Email:{' '}
        <a href='mailto:support@ibamhealth.com'>support@ibamhealth.com</a>
        <br />
        Hotline: Available Monday–Friday, 8 am–8 pm WAT
        <br />
        Response time: Within 24 business hours
      </p>
    </div>
  )
}

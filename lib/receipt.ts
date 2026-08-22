import { LOGO_B64 } from './logoB64'

export interface ReceiptData {
  bookingRef: string
  tests: string[]
  amount: number
  collectionType: 'walk_in' | 'home_visit'
  transactionRef?: string
  patientName?: string
  packageName?: string
  paymentMethod?: string
}

export function buildReceiptHTML(data: ReceiptData): string {
  const {
    bookingRef, tests, amount, collectionType,
    transactionRef, patientName, packageName,
  } = data

  const date = new Date().toLocaleString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const collectionLabel = collectionType === 'walk_in' ? 'Walk-in at Lab' : 'Home Visit'

  const itemRows = tests
    .map(t => `<tr><td style="padding:9px 0;border-bottom:1px solid #e8f5e9;font-size:14px;color:#1a1a1a"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-right:10px;vertical-align:middle"></span>${t}</td></tr>`)
    .join('')

  const metaExtras = [
    patientName ? `<div style="margin-bottom:14px"><div style="font-size:10px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px">Patient</div><div style="font-size:14px;color:#111;font-weight:600">${patientName}</div></div>` : '',
    packageName  ? `<div style="margin-bottom:14px"><div style="font-size:10px;color:#888;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px">Package</div><div style="font-size:14px;color:#111;font-weight:600">${packageName}</div></div>` : '',
  ].filter(Boolean).join('')

  const payMethodLabel = data.paymentMethod ?? 'Paystack (Card)'

  const txnRow = transactionRef
    ? `<div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;margin-top:8px;border-top:1px solid #e8f5e9"><span style="font-size:11px;color:#888">Transaction Ref</span><span style="font-size:11px;color:#166534;font-weight:600;font-family:monospace">${transactionRef}</span></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>iBam Health — Receipt ${bookingRef}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#052e16;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 16px 48px;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .wrap{width:100%;max-width:560px}
  .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}

  /* ── Header ── */
  .hdr{background:linear-gradient(160deg,#166534 0%,#14532d 55%,#052e16 100%);padding:36px 40px 30px;position:relative;overflow:hidden;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .hdr::before{content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:rgba(255,255,255,.04);border-radius:50%}
  .hdr::after{content:'';position:absolute;bottom:-60px;left:-30px;width:180px;height:180px;background:rgba(255,255,255,.03);border-radius:50%}
  .brand{display:flex;align-items:center;gap:12px;margin-bottom:22px;position:relative;z-index:1}
  .brand-logo{width:44px;height:44px;background:rgba(255,255,255,.12);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.18);overflow:hidden;padding:4px}
  .brand-logo img{width:100%;height:100%;object-fit:contain}
  .brand-name{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px}
  .brand-name span{font-weight:300;opacity:.7}
  .hdr-pill{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:6px 16px;position:relative;z-index:1}
  .hdr-dot{width:8px;height:8px;background:#4ade80;border-radius:50%;box-shadow:0 0 0 2px rgba(74,222,128,.3)}
  .hdr-txt{font-size:13px;color:rgba(255,255,255,.9);font-weight:600;letter-spacing:.2px}

  /* ── Ref band ── */
  .ref-band{background:#f0fdf4;border-bottom:2px solid #bbf7d0;padding:20px 40px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .ref-lbl{font-size:10px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
  .ref-val{font-size:24px;font-weight:900;color:#16a34a;font-family:'Courier New',monospace;letter-spacing:2px}
  .paid-stamp{flex-shrink:0;border:3px solid #16a34a;border-radius:8px;padding:6px 14px;transform:rotate(-5deg);background:rgba(22,163,74,.06)}
  .paid-txt{font-size:14px;font-weight:900;color:#16a34a;text-transform:uppercase;letter-spacing:3px}

  /* ── Body ── */
  .body{padding:32px 40px}
  .meta-row{display:flex;gap:32px;margin-bottom:26px;flex-wrap:wrap}
  .meta-item{flex:1;min-width:120px}
  .meta-lbl{font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
  .meta-val{font-size:14px;color:#111;font-weight:600}
  .div{border:none;border-top:1.5px dashed #d1fae5;margin:22px 0}
  .sec-title{font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse}
  .total-band{background:#f0fdf4;border-radius:12px;padding:18px 22px;margin-top:22px;display:flex;align-items:center;justify-content:space-between;border:1.5px solid #bbf7d0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .total-lbl{font-size:14px;font-weight:700;color:#374151}
  .total-amt{font-size:28px;font-weight:900;color:#16a34a}
  .pay-box{margin-top:18px;background:#f9fafb;border-radius:10px;padding:15px 20px;border:1px solid #e8f5e9}
  .pay-row{display:flex;justify-content:space-between;align-items:center}
  .pay-key{font-size:11px;color:#9ca3af;font-weight:500}
  .pay-val{font-size:11px;color:#374151;font-weight:700;font-family:monospace}

  /* ── Footer ── */
  .ftr{background:#052e16;padding:26px 40px;text-align:center;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .ftr-logo{font-size:16px;font-weight:800;color:#fff;letter-spacing:-.3px;margin-bottom:8px}
  .ftr-logo span{font-weight:300;opacity:.6}
  .ftr-txt{font-size:12px;color:rgba(255,255,255,.5);line-height:1.7}
  .ftr-email{color:#4ade80;font-weight:600;text-decoration:none}
  .ftr-note{display:inline-block;margin-top:14px;padding:9px 18px;background:rgba(255,255,255,.07);border-radius:8px;font-size:11px;color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.12)}

  /* Print button */
  .print-section{margin-top:20px;text-align:center}
  .print-btn{background:#16a34a;color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.2px}
  .print-btn:hover{background:#166534}

  @media print{
    body{background:#052e16!important;padding:0;print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .card{box-shadow:none;border-radius:0}
    .wrap{max-width:100%}
    .print-section{display:none}
    .hdr{print-color-adjust:exact;-webkit-print-color-adjust:exact}
    .ftr{print-color-adjust:exact;-webkit-print-color-adjust:exact}
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="hdr">
      <div class="brand">
        <div class="brand-logo">
          <img src="data:image/png;base64,${LOGO_B64}" alt="iBam Health Logo">
        </div>
        <span class="brand-name">iBam<span>Health</span></span>
      </div>
      <div class="hdr-pill">
        <div class="hdr-dot"></div>
        <span class="hdr-txt">Payment Confirmed</span>
      </div>
    </div>

    <div class="ref-band">
      <div>
        <div class="ref-lbl">Booking Reference</div>
        <div class="ref-val">${bookingRef}</div>
      </div>
      <div class="paid-stamp"><div class="paid-txt">PAID</div></div>
    </div>

    <div class="body">
      <div class="meta-row">
        <div class="meta-item">
          <div class="meta-lbl">Date &amp; Time</div>
          <div class="meta-val">${date}</div>
        </div>
        <div class="meta-item">
          <div class="meta-lbl">Collection</div>
          <div class="meta-val">${collectionLabel}</div>
        </div>
        ${metaExtras}
      </div>

      <hr class="div">
      <div class="sec-title">Services Ordered</div>
      <table><tbody>${itemRows || '<tr><td style="padding:8px 0;color:#aaa;font-size:13px">See booking confirmation email for details</td></tr>'}</tbody></table>

      <div class="total-band">
        <span class="total-lbl">Total Amount Paid</span>
        <span class="total-amt">&#8358;${amount.toLocaleString('en-NG')}</span>
      </div>

      <div class="pay-box">
        <div class="pay-row">
          <span class="pay-key">Payment Method</span>
          <span class="pay-val">${payMethodLabel}</span>
        </div>
        ${txnRow}
      </div>
    </div>

    <div class="ftr">
      <div class="ftr-logo">iBam<span>Health</span></div>
      <p class="ftr-txt">
        This receipt confirms your payment. For support or refund requests:<br>
        <a href="mailto:support@ibamhealth.com" class="ftr-email">support@ibamhealth.com</a>
      </p>
      <div class="ftr-note">
        Present Booking Reference ${bookingRef} at the lab or home visit appointment
      </div>
    </div>
  </div>

  <div class="print-section">
    <button class="print-btn" onclick="window.print()">Save as PDF / Print Receipt</button>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},800)}</script>
</body>
</html>`
}

/** Download receipt as an HTML file (blob anchor — no popup blockers). */
export function downloadReceipt(data: ReceiptData): void {
  const html = buildReceiptHTML(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `iBam-Receipt-${data.bookingRef.replace(/[^A-Z0-9]/gi, '')}.html`
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

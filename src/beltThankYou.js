// ─────────────────────────────────────────────────────────────────────────────
//  /belt-testing/thank-you — post-signature confirmation page. Reads the
//  current belt-test date from config so it stays accurate between tests.
// ─────────────────────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

export function buildBeltTestThankYou(cfg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>You're in — Belt Test Confirmed | IMA Karate</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    :root { --bg:#0a0a0a; --panel:#131313; --line:#262626; --text:#f4f4f5; --muted:#b5b5b8; --red:#c8102e; --gold:#d4a24a; }
    * { box-sizing: border-box; }
    html, body { margin:0; background:var(--bg); color:var(--text); font-family:'Inter',system-ui,sans-serif; min-height:100vh; }
    a { color: inherit; }
    .wrap { max-width: 620px; margin: 0 auto; padding: 80px 24px 40px; text-align: center; }
    .badge { width:96px; height:96px; border-radius:50%; background:#0d3d20; border:2px solid #10b981; display:grid; place-items:center; margin:0 auto 24px; font-size:2.5rem; color:#10b981; }
    .eyebrow { color: var(--gold); letter-spacing:.3em; text-transform:uppercase; font-size:.8rem; font-weight:600; margin: 0 0 8px; }
    h1 { font-family:'Oswald',sans-serif; text-transform:uppercase; font-size: clamp(2rem, 4vw, 2.75rem); margin: 0 0 16px; }
    .lead { color: var(--muted); font-size:1.05rem; line-height:1.6; margin: 0 0 32px; }
    .date-card { background: var(--panel); border:1px solid var(--line); border-left:3px solid var(--red); padding: 24px; text-align: left; border-radius: 4px; margin-bottom: 24px; }
    .date-card h2 { font-family:'Oswald',sans-serif; text-transform:uppercase; font-size: 1.05rem; color: var(--gold); margin: 0 0 8px; letter-spacing:.1em; }
    .date-card p { margin: 4px 0; color: var(--text); }
    .date-card small { color: var(--muted); }
    ol.steps { list-style: none; counter-reset: s; padding: 0; text-align: left; margin: 0 0 32px; }
    ol.steps li { counter-increment: s; padding: 14px 14px 14px 56px; position: relative; background: var(--panel); border: 1px solid var(--line); border-radius: 3px; margin-bottom: 8px; color: var(--text); }
    ol.steps li::before { content: counter(s); position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; background: var(--red); color:#fff; border-radius: 50%; display: grid; place-items: center; font-family:'Oswald',sans-serif; font-weight: 700; }
    ol.steps li small { display: block; color: var(--muted); margin-top: 2px; }
    .btn-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
    .btn-primary, .btn-outline { padding: 12px 24px; text-transform: uppercase; font-weight: 700; letter-spacing:.06em; border-radius:2px; text-decoration:none; font-family: inherit; font-size: .95rem; display: inline-block; border:none; cursor:pointer; }
    .btn-primary { background: var(--red); color: #fff; }
    .btn-outline { border: 1.5px solid #fff; color: #fff; background: transparent; }
    .contact { margin-top: 32px; color: var(--muted); font-size: .9rem; }
    .contact a { color: var(--gold); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="badge">✓</div>
    <p class="eyebrow">Belt test confirmed</p>
    <h1>You're all set.</h1>
    <p class="lead">Payment received and DocuSign waiver signed. See you on the mat.</p>

    <div class="date-card">
      <h2>Your test</h2>
      <p><strong>${esc(cfg.testDateDisplay)}</strong> · ${esc(cfg.testDay)}</p>
      <p>${esc(cfg.location)}</p>
      <small>Arrive 15 minutes before your testing time. White belt through orange-with-white-stripe test at 9:30 AM; full orange &amp; up test at 12:00 Noon.</small>
    </div>

    <ol class="steps">
      <li>Confirmation email is on its way<small>Includes your signed waiver PDF, test date, and arrival details.</small></li>
      <li>Review the required techniques<small>Check your Student Progress Manual for your next-belt requirements. Ask your instructor if anything is unclear.</small></li>
      <li>Arrive 15 minutes early on test day<small>Dressed in a clean gi, present belt, and IMA patch visible.</small></li>
    </ol>

    <div class="btn-row">
      <a href="/" class="btn-outline">Back to home</a>
      <a href="tel:+13036650339" class="btn-primary">Call ${esc(cfg.phone)}</a>
    </div>

    <p class="contact">Questions? Email <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a> · Call ${esc(cfg.phone)}</p>
  </div>
</body>
</html>`;
}

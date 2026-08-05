// ─────────────────────────────────────────────────────────────────────────────
//  /belt-testing page — homepage-styled Kyu belt-test signup flow.
//
//  Info section mirrors imakarate.com/belt-testing (stripe system, testing
//  cadence, evaluation). Registration section is a client-side wizard:
//      1. select tier
//      2. student + guardian details
//      3. Memberstack lookup (email → name fallback → create-account modal)
//      4. Memberstack one-time-plan checkout
//      5. Zapier → DocuSign envelope (fields pre-filled)
//      6. redirect to /belt-testing/thank-you
//
//  All fetches hit our own Worker routes under /belt-testing/*.
// ─────────────────────────────────────────────────────────────────────────────

import { BELT_TIERS } from './beltConfig.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function buildBeltTestingPage(cfg) {
  const tiers = BELT_TIERS.map((t) => ({
    id: t.id,
    label: t.label,
    price: money(t.priceCents),
    priceCents: t.priceCents,
  }));

  const tiersJson = JSON.stringify(tiers);
  const cfgClient = {
    testDate: cfg.testDate,
    testDateDisplay: cfg.testDateDisplay,
    testDay: cfg.testDay,
    lateFeeCutoff: cfg.lateFeeCutoff,
    location: cfg.location,
    phone: cfg.phone,
    email: cfg.email,
    lateFeeCents: cfg.lateFeeCents,
    manualAddonCents: cfg.manualAddonCents,
    ccSurchargePct: cfg.ccSurchargePct,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Belt Testing — IMA Karate</title>
  <meta name="description" content="Sign up for the next IMA Karate Kyu belt test. ${esc(cfg.testDateDisplay)} at ${esc(cfg.location)}." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${PAGE_CSS}</style>
</head>
<body>
  <div class="topbar">
    <a href="tel:+13036650339">+1 (303) 665-0339</a>
    <div class="socials">
      <a href="https://www.facebook.com/imakarate" aria-label="Facebook">f</a>
      <a href="https://www.instagram.com/imakarate" aria-label="Instagram">ig</a>
      <a href="https://www.youtube.com/@imakarate" aria-label="YouTube">yt</a>
    </div>
    <a href="/sign-up" class="topbar-cta">CLAIM A FREE TRIAL CLASS</a>
  </div>

  <header class="site-nav">
    <a href="/" class="brand">
      <img src="https://cdn.prod.website-files.com/67294bbae93e819099f356c2/672953cd9cf8c751045fb537_Logo.png" alt="IMA Karate — Home" />
    </a>
    <nav>
      <a href="/#programs">PROGRAMS</a>
      <a href="/#schedule">STUDENT INFORMATION</a>
      <a href="/#news">NEWS &amp; EVENTS</a>
      <a href="/login" class="btn-outline">LOGIN</a>
      <a href="/sign-up" class="btn-primary">JOIN IMA</a>
    </nav>
  </header>

  <!-- ── HERO ────────────────────────────────────────────────────────────── -->
  <section class="hero">
    <div class="hero-inner">
      <p class="eyebrow">Next Kyu belt test</p>
      <h1>${esc(cfg.testDateDisplay)}</h1>
      <p class="lead">
        ${esc(cfg.location)} · Arrive 15 minutes before your testing time. Applications close
        after ${esc(formatShort(cfg.applicationCutoff))} — a $${(cfg.lateFeeCents / 100).toFixed(0)} late fee applies past this Thursday cutoff.
      </p>
      <a href="#register" class="btn-primary btn-lg">Register for this test</a>
    </div>
  </section>

  <!-- ── INFO (mirrors imakarate.com/belt-testing) ─────────────────────── -->
  <section class="info">
    <div class="grid-2">
      <div>
        <h2>The Belt Testing Process</h2>
        <p>
          Testing for the next belt is an important step in the study of karate. Each successful test
          brings the student one step closer to becoming a black belt. Students must demonstrate the
          skills required for their next level — listed in the Student Progress Manual — before testing.
          An instructor or Hanshi Madani will discuss when each student is ready to test.
        </p>
        <ul class="check-list">
          <li>Eight Kyu (color-belt) tests are held each year.</li>
          <li>Two Dan (black-belt) tests are held each year.</li>
          <li>Every test date is posted at least two months in advance.</li>
          <li>Applications are handed out about two weeks before the date, once you have earned the required stripes.</li>
        </ul>
      </div>
      <div>
        <h2>What happens on test day</h2>
        <ul class="check-list">
          <li>Arrive 15 minutes early — check in with the front desk.</li>
          <li>White through orange-with-white-stripe: <strong>9:30 AM</strong>. Full orange &amp; up: <strong>12:00 Noon</strong>.</li>
          <li>Each student is evaluated by an instructor; the written evaluation is confidential and shared with the student and family.</li>
          <li>New belts are presented on the test date; rank certificates are usually handed out at the next class.</li>
          <li>Brown/black candidates should plan to stay after testing to meet with Hanshi.</li>
        </ul>
      </div>
    </div>

    <div class="stripe-legend">
      <h3>The IMA stripe system</h3>
      <div class="stripes">
        <div><span class="dot dot-black"></span><b>Black</b> — technical skill &amp; understanding</div>
        <div><span class="dot dot-red"></span><b>Red</b> — positive character outside class</div>
        <div><span class="dot dot-yellow"></span><b>Yellow</b> — scholastic performance</div>
        <div><span class="dot dot-blue"></span><b>Blue</b> — effort, focus, respect, spirit</div>
      </div>
    </div>
  </section>

  <!-- ── REGISTRATION FORM ─────────────────────────────────────────────── -->
  <section id="register" class="register">
    <div class="register-inner">
      <p class="eyebrow">Registration</p>
      <h2>Sign up for the ${esc(cfg.testDateDisplay)} test</h2>
      <p class="lead">
        Fees include an IMA certificate of rank and a new belt. The first test also includes an IMA patch.
        Payment goes through our secure processor; the DocuSign waiver is emailed to you immediately after checkout.
      </p>

      <form id="bt-form" novalidate>
        <fieldset class="card">
          <legend>Choose your test</legend>
          <div class="tiers">
            ${tiers
              .map(
                (t) => `
              <label class="tier">
                <input type="radio" name="tier" value="${t.id}" required />
                <div>
                  <strong>${esc(t.label)}</strong>
                  <span class="price">${t.price}</span>
                </div>
              </label>`,
              )
              .join('')}
          </div>
        </fieldset>

        <fieldset class="card">
          <legend>Student information</legend>
          <div class="grid-3">
            <label>Salutation
              <select name="salutation" required>
                <option value="">Select…</option>
                <option>Mr.</option><option>Mrs.</option><option>Ms.</option><option>Miss</option>
              </select>
            </label>
            <label>First name<input name="firstName" required autocomplete="given-name" /></label>
            <label>Middle (optional)<input name="middleName" autocomplete="additional-name" /></label>
            <label>Last name<input name="lastName" required autocomplete="family-name" /></label>
            <label>Age<input name="age" type="number" min="3" max="120" required /></label>
            <label>Present belt / Kyu<input name="presentBelt" required placeholder="e.g. Full orange" /></label>
            <label class="span-2">IMA Membership # (if any)<input name="membershipNumber" /></label>
            <label>Email<input name="email" type="email" required autocomplete="email" /></label>
            <label>Phone<input name="phone" type="tel" required autocomplete="tel" /></label>
          </div>

          <div class="grid-3">
            <label>Dojo / School
              <select name="dojo" required>
                <option value="">Select…</option>
                <option>IMA Dojo</option>
                <option>Rec. Center</option>
                <option>IMA Arvada</option>
              </select>
            </label>
            <label class="check span-2">
              <input type="checkbox" name="wantsManual" />
              Add the Student Progress Manual (+$30) —
              <em>included free for 1st Kyu (Brown w/ black stripe)</em>
            </label>
          </div>
        </fieldset>

        <fieldset class="card">
          <legend>Payment</legend>
          <div class="pay-summary" id="bt-summary">
            <div><span>Base fee</span><b id="bt-base">—</b></div>
            <div><span>Progress Manual</span><b id="bt-manual">—</b></div>
            <div class="late" id="bt-late-row"><span>Late fee (past Thursday cutoff)</span><b id="bt-late">—</b></div>
            <div class="total"><span>Total</span><b id="bt-total">—</b></div>
          </div>
          <p class="fine">Credit-card payments include a 3% processing surcharge automatically added at checkout by Stripe. No application is accepted on the testing day.</p>
        </fieldset>

        <div class="cta-row">
          <button type="submit" class="btn-primary btn-lg" id="bt-submit">Continue to checkout</button>
          <p class="fine">
            You'll confirm your IMA account (or create one), pay for your test, then sign the DocuSign
            testing waiver — all in one flow. Questions? Call
            <a href="tel:+13036650339">${esc(cfg.phone)}</a> or email
            <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a>.
          </p>
        </div>
      </form>
    </div>
  </section>

  <!-- ── MODALS ────────────────────────────────────────────────────────── -->
  <div id="bt-modal" class="modal" hidden>
    <div class="modal-inner" role="dialog" aria-modal="true" aria-labelledby="bt-modal-title">
      <button class="modal-close" type="button" aria-label="Close">×</button>
      <div id="bt-modal-body"></div>
    </div>
  </div>

  <footer class="site-footer">
    <p>© IMA Karate · ${esc(cfg.location)} · <a href="tel:+13036650339">${esc(cfg.phone)}</a> · <a href="mailto:${esc(cfg.email)}">${esc(cfg.email)}</a></p>
  </footer>

  <script>
    window.__BT_CFG__   = ${JSON.stringify(cfgClient)};
    window.__BT_TIERS__ = ${tiersJson};
  </script>
  <script>${PAGE_JS}</script>
</body>
</html>`;
}

function formatShort(iso) {
  // iso = "2026-08-27"
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CSS — aligns with the homepage: dark bg, red accent, gold eyebrow, Oswald
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  :root {
    --bg: #0a0a0a; --panel: #131313; --panel-2: #1a1a1a; --line: #262626;
    --text: #f4f4f5; --muted: #b5b5b8; --red: #c8102e; --red-2: #a30d24;
    --gold: #d4a24a;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3, legend { font-family: 'Oswald', 'Inter', sans-serif; letter-spacing: .02em; text-transform: uppercase; margin: 0 0 .5em; }
  h1 { font-size: clamp(2rem, 4vw, 3.75rem); line-height: 1.05; }
  h2 { font-size: clamp(1.5rem, 2.4vw, 2.2rem); }
  h3 { font-size: 1.15rem; }
  p { line-height: 1.6; }
  .eyebrow { color: var(--gold); letter-spacing: .3em; text-transform: uppercase; font-size: .8rem; margin: 0 0 .5em; font-weight: 600; }
  .lead { color: var(--muted); font-size: 1.05rem; }

  .topbar { background: var(--red); color: #fff; display: flex; align-items: center; justify-content: center; gap: 24px; padding: 6px 16px; font-size: .82rem; font-weight: 600; letter-spacing: .05em; }
  .topbar .socials a { margin: 0 6px; }
  .topbar-cta { text-transform: uppercase; }

  .site-nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; background: #000; border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; }
  .site-nav .brand img { width: 64px; height: 64px; display: block; }
  .site-nav nav { display: flex; align-items: center; gap: 22px; font-family: 'Oswald', sans-serif; letter-spacing: .08em; }
  .site-nav nav a { padding: 6px 8px; }
  .btn-primary { background: var(--red); color: #fff; padding: 10px 20px; border: none; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: background .15s; }
  .btn-primary:hover { background: var(--red-2); }
  .btn-outline { border: 1.5px solid #fff; padding: 8px 18px; text-transform: uppercase; font-weight: 700; letter-spacing: .06em; border-radius: 2px; }
  .btn-lg { padding: 14px 32px; font-size: 1rem; }

  .hero { padding: 80px 32px 60px; background:
    linear-gradient(180deg, rgba(10,10,10,.65) 0%, rgba(10,10,10,.9) 100%),
    url('https://cdn.jsdelivr.net/gh/robh-autods/ima-karate-assets@main/Comp-Team.jpg') center/cover no-repeat; }
  .hero-inner { max-width: 1080px; margin: 0 auto; }

  .info { padding: 60px 32px; }
  .grid-2 { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  .grid-2 > div { }
  .check-list { list-style: none; padding: 0; margin: 12px 0 0; }
  .check-list li { padding: 8px 0 8px 24px; position: relative; color: var(--muted); }
  .check-list li::before { content: ""; position: absolute; left: 0; top: 15px; width: 8px; height: 8px; background: var(--red); }

  .stripe-legend { max-width: 1080px; margin: 48px auto 0; padding: 24px; background: var(--panel); border-left: 3px solid var(--gold); }
  .stripes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; color: var(--muted); font-size: .95rem; }
  .dot { display: inline-block; width: 10px; height: 10px; margin-right: 8px; }
  .dot-black { background: #fff; outline: 1px solid #fff; }
  .dot-red { background: var(--red); }
  .dot-yellow { background: #f2c94c; }
  .dot-blue { background: #56ccf2; }

  .register { padding: 60px 32px 100px; background: #050505; }
  .register-inner { max-width: 900px; margin: 0 auto; }
  fieldset.card { background: var(--panel); border: 1px solid var(--line); padding: 24px 24px 16px; margin: 24px 0 0; border-radius: 4px; }
  fieldset.card legend { color: var(--gold); padding: 0 8px; font-size: .95rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 8px; }
  .grid-3 label { display: flex; flex-direction: column; font-size: .82rem; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 600; gap: 6px; }
  .grid-3 label.span-2 { grid-column: span 2; }
  .grid-3 input, .grid-3 select { background: var(--panel-2); border: 1px solid var(--line); color: var(--text); padding: 12px 14px; font-family: inherit; font-size: .95rem; border-radius: 3px; text-transform: none; letter-spacing: 0; }
  .grid-3 input:focus, .grid-3 select:focus { outline: 2px solid var(--gold); border-color: var(--gold); }
  .grid-3 label.check { flex-direction: row; align-items: flex-start; gap: 10px; text-transform: none; letter-spacing: 0; font-size: .92rem; color: var(--text); font-weight: 500; }
  .grid-3 label.check em { color: var(--muted); font-style: normal; }

  .tiers { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .tier { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 3px; cursor: pointer; transition: border-color .15s, background .15s; }
  .tier:hover { border-color: var(--red); }
  .tier input { margin: 0; accent-color: var(--red); transform: scale(1.2); }
  .tier > div { display: flex; justify-content: space-between; width: 100%; align-items: center; gap: 16px; }
  .tier .price { color: var(--gold); font-weight: 700; font-size: 1.1rem; font-family: 'Oswald', sans-serif; }
  .tier input:checked + div { color: #fff; }
  .tier:has(input:checked) { border-color: var(--red); background: rgba(200, 16, 46, 0.08); }

  .pay-summary { display: grid; gap: 8px; margin: 12px 0; }
  .pay-summary > div { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--line); color: var(--muted); }
  .pay-summary .total { border-bottom: none; border-top: 2px solid var(--red); margin-top: 8px; padding-top: 14px; color: #fff; font-size: 1.15rem; font-weight: 700; }
  .pay-summary .late { display: none; }
  .pay-summary .late.show { display: flex; color: #ffb4b4; }
  .fine { color: var(--muted); font-size: .82rem; margin: 8px 0 0; }
  .cta-row { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; margin-top: 24px; }

  .modal { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.82); display: grid; place-items: center; z-index: 100; padding: 20px; }
  .modal[hidden] { display: none; }
  .modal-inner { background: var(--panel); border: 1px solid var(--line); border-top: 3px solid var(--red); border-radius: 4px; max-width: 520px; width: 100%; padding: 32px; position: relative; max-height: 90vh; overflow-y: auto; }
  .modal-close { position: absolute; top: 8px; right: 12px; background: transparent; border: none; color: #fff; font-size: 2rem; cursor: pointer; line-height: 1; }
  .modal-inner h3 { color: #fff; }
  .modal-inner .btn-primary, .modal-inner .btn-outline { margin-top: 12px; }
  .match { background: var(--panel-2); border: 1px solid var(--line); padding: 12px 14px; border-radius: 3px; margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
  .match:hover { border-color: var(--gold); }
  .match small { color: var(--muted); display: block; }
  .status { padding: 12px; border-radius: 3px; margin: 12px 0; font-size: .95rem; }
  .status.info { background: rgba(212, 162, 74, 0.1); border: 1px solid var(--gold); color: var(--gold); }
  .status.err { background: rgba(200, 16, 46, 0.15); border: 1px solid var(--red); color: #ffb4b4; }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid var(--line); border-top-color: var(--red); border-radius: 50%; animation: spin .8s linear infinite; margin-right: 8px; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .site-footer { padding: 32px; text-align: center; color: var(--muted); font-size: .85rem; background: #000; border-top: 1px solid var(--line); }

  @media (max-width: 900px) {
    .grid-2 { grid-template-columns: 1fr; gap: 32px; }
    .grid-3 { grid-template-columns: 1fr 1fr; }
    .grid-3 label.span-2 { grid-column: span 2; }
    .stripes { grid-template-columns: 1fr 1fr; }
    .site-nav { padding: 12px 16px; }
    .site-nav .brand img { width: 48px; height: 48px; }
    .site-nav nav { gap: 12px; }
    .site-nav nav a:not(.btn-primary):not(.btn-outline) { display: none; }
  }
  @media (max-width: 560px) {
    .grid-3 { grid-template-columns: 1fr; }
    .grid-3 label.span-2 { grid-column: auto; }
    .stripes { grid-template-columns: 1fr; }
    .hero { padding: 60px 20px 40px; }
    .info, .register { padding: 40px 20px; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
//  Client-side wizard
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_JS = `
(function () {
  var cfg = window.__BT_CFG__ || {};
  var tiers = window.__BT_TIERS__ || [];
  var form = document.getElementById('bt-form');
  var modal = document.getElementById('bt-modal');
  var modalBody = document.getElementById('bt-modal-body');
  var closeBtn = modal.querySelector('.modal-close');

  // Totals
  function currentSelections() {
    var fd = new FormData(form);
    var tierId = fd.get('tier');
    var tier = tiers.find(function (t) { return t.id === tierId; });
    var wantsManual = fd.get('wantsManual') === 'on';
    var isLate = Date.now() > new Date(cfg.lateFeeCutoff + 'T23:59:59-06:00').getTime();
    return { fd: fd, tier: tier, wantsManual: wantsManual, isLate: isLate };
  }
  function fmt(cents) { return '$' + (cents / 100).toFixed(2); }
  function updateSummary() {
    var sel = currentSelections();
    var base = sel.tier ? sel.tier.priceCents : 0;
    var manual = (sel.wantsManual && sel.tier && sel.tier.id !== 'brown') ? cfg.manualAddonCents : 0;
    var late = sel.isLate ? cfg.lateFeeCents : 0;
    document.getElementById('bt-base').textContent = base ? fmt(base) : '—';
    document.getElementById('bt-manual').textContent = manual ? fmt(manual) : '—';
    document.getElementById('bt-late').textContent = late ? fmt(late) : '—';
    document.getElementById('bt-late-row').classList.toggle('show', sel.isLate);
    document.getElementById('bt-total').textContent = base ? fmt(base + manual + late) : '—';
  }
  form.addEventListener('change', updateSummary);
  form.addEventListener('input', updateSummary);
  updateSummary();

  // Modal helpers
  function openModal(html) {
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    modalBody.innerHTML = '';
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  // Serialize form → application object
  function readApplication() {
    var fd = new FormData(form);
    var obj = {};
    fd.forEach(function (v, k) { obj[k] = String(v); });
    var sel = currentSelections();
    obj.wantsManual = sel.wantsManual;
    obj.isLate = sel.isLate;
    obj.baseCents = sel.tier ? sel.tier.priceCents : 0;
    obj.manualCents = (sel.wantsManual && sel.tier && sel.tier.id !== 'brown') ? cfg.manualAddonCents : 0;
    obj.lateCents = sel.isLate ? cfg.lateFeeCents : 0;
    obj.totalCents = obj.baseCents + obj.manualCents + obj.lateCents;
    obj.tierLabel = sel.tier ? sel.tier.label : '';
    obj.testDate = cfg.testDate;
    obj.testDateDisplay = cfg.testDateDisplay;
    return obj;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var app = readApplication();
    sessionStorage.setItem('bt.application', JSON.stringify(app));

    openModal(
      '<h3>Looking up your IMA account…</h3>' +
      '<p class="lead"><span class="spinner"></span>Checking whether ' + esc(app.email) + ' matches an existing member.</p>'
    );

    try {
      var res = await fetch('/belt-testing/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: app.email, firstName: app.firstName, lastName: app.lastName })
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');

      if (data.match) {
        renderMatch(data.match, app);
      } else if (data.candidates && data.candidates.length) {
        renderCandidates(data.candidates, app);
      } else {
        renderCreate(app);
      }
    } catch (err) {
      openModal(
        '<h3>Account lookup hit a snag</h3>' +
        '<div class="status err">' + esc(err.message) + '</div>' +
        '<p class="lead">You can still continue — we\\'ll create a new account for you at checkout.</p>' +
        '<button class="btn-primary" id="bt-create">Create account & continue</button>'
      );
      document.getElementById('bt-create').onclick = function () { renderCreate(app); };
    }
  });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function renderMatch(match, app) {
    openModal(
      '<h3>Welcome back, ' + esc(match.name || app.firstName) + '</h3>' +
      '<p class="lead">We found your IMA account. We\\'ll link this belt test to it.</p>' +
      '<div class="match"><span><b>' + esc(match.email) + '</b><small>' + esc(match.name || '') + '</small></span></div>' +
      '<button class="btn-primary btn-lg" id="bt-continue">Continue to payment</button>' +
      '<button class="btn-outline" id="bt-notme" type="button" style="margin-left:8px">That\\'s not me</button>'
    );
    document.getElementById('bt-continue').onclick = function () { goToCheckout(app, match.id); };
    document.getElementById('bt-notme').onclick = function () { renderCreate(app); };
  }

  function renderCandidates(candidates, app) {
    openModal(
      '<h3>Is this you?</h3>' +
      '<p class="lead">We found a few IMA members matching your name. Pick yours, or create a new account.</p>' +
      candidates.map(function (c) {
        return '<div class="match" data-id="' + esc(c.id) + '"><span><b>' + esc(c.name || '(no name)') + '</b><small>' + esc(c.email || '') + '</small></span><span>→</span></div>';
      }).join('') +
      '<button class="btn-outline" id="bt-newacct" type="button">None of these — create a new account</button>'
    );
    Array.from(modalBody.querySelectorAll('.match')).forEach(function (row) {
      row.onclick = function () { goToCheckout(app, row.dataset.id); };
    });
    document.getElementById('bt-newacct').onclick = function () { renderCreate(app); };
  }

  function renderCreate(app) {
    openModal(
      '<h3>Create your IMA account</h3>' +
      '<p class="lead">We didn\\'t find an existing member for ' + esc(app.email) + '. Set a password to create your account — you\\'ll use it to log in for future tests and events.</p>' +
      '<label style="display:flex;flex-direction:column;gap:6px;margin:12px 0;">Password' +
      '<input id="bt-pw" type="password" minlength="8" style="background:#1a1a1a;border:1px solid #262626;color:#fff;padding:12px;border-radius:3px" /></label>' +
      '<button class="btn-primary btn-lg" id="bt-signup">Create account & continue</button>'
    );
    document.getElementById('bt-signup').onclick = async function () {
      var pw = document.getElementById('bt-pw').value;
      if (!pw || pw.length < 8) { alert('Password must be at least 8 characters.'); return; }
      openModal('<h3>Creating your account…</h3><p class="lead"><span class="spinner"></span>One moment.</p>');
      try {
        var res = await fetch('/belt-testing/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: app.email, password: pw, firstName: app.firstName, lastName: app.lastName, phone: app.phone })
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Sign-up failed');
        goToCheckout(app, data.memberId);
      } catch (err) {
        openModal('<h3>Sign-up failed</h3><div class="status err">' + esc(err.message) + '</div><button class="btn-outline" id="bt-back">Try again</button>');
        document.getElementById('bt-back').onclick = function () { renderCreate(app); };
      }
    };
  }

  async function goToCheckout(app, memberId) {
    sessionStorage.setItem('bt.memberId', memberId);
    openModal('<h3>Redirecting to secure checkout…</h3><p class="lead"><span class="spinner"></span>Please don\\'t close this window.</p>');
    try {
      var res = await fetch('/belt-testing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: memberId, application: app })
      });
      var data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start checkout');
      location.href = data.checkoutUrl;
    } catch (err) {
      openModal('<h3>Checkout failed to start</h3><div class="status err">' + esc(err.message) + '</div><p class="lead">Please try again or call us at ' + esc(cfg.phone) + '.</p>');
    }
  }
})();
`;

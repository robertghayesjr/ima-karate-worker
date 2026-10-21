// ─────────────────────────────────────────────────────────────────────────────
//  Mock Stripe checkout page for DEMO_MODE.
//
//  When env.DEMO_MODE === "1", /belt-testing/checkout returns a URL pointing
//  at /belt-testing/mock-stripe instead of the real Memberstack Stripe URL,
//  and then continues to the confirmation page.
//
//  These pages are self-contained (inline CSS), obviously labelled "DEMO",
//  and never touch any billing rails.
// ─────────────────────────────────────────────────────────────────────────────

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ── /belt-testing/mock-stripe?memberId=… ────────────────────────────────────
// A Stripe-lookalike checkout page. Reads the KV stash to show the correct
// tier/amount. "Pay" button redirects to /belt-testing/post-payment.
export function buildMockStripePage(app, memberId, cfg, token) {
  const total = app?.totalCents ?? 0;
  const tierLabel = app?.tierLabel || 'Belt Testing';
  const testDate = cfg?.testDateDisplay || '';
  const email = app?.email || '';
  const nameLine = `${app?.firstName || ''} ${app?.lastName || ''}`.trim();

  const lineItems = [];
  if (app?.baseCents) lineItems.push({ label: `${tierLabel} — testing fee`, amount: app.baseCents });
  if (app?.manualCents) lineItems.push({ label: 'IMA training manual', amount: app.manualCents });
  if (app?.lateCents) lineItems.push({ label: 'Late registration fee', amount: app.lateCents });

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Checkout — IMA Karate</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;background:#f6f9fc;color:#1a1f36;font-family:'Inter',-apple-system,sans-serif;min-height:100vh}
.demo-banner{background:#f59e0b;color:#1a1f36;text-align:center;padding:8px 12px;font-size:.82rem;font-weight:600;letter-spacing:.02em}
.wrap{max-width:920px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:calc(100vh - 40px)}
@media (max-width:820px){.wrap{grid-template-columns:1fr}}
.summary{padding:48px 56px;background:#f6f9fc}
.form{padding:48px 56px;background:#fff;border-left:1px solid #e6ebf1}
@media (max-width:820px){.form{border-left:0;border-top:1px solid #e6ebf1}}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:32px}
.brand img{height:32px}
.brand-name{font-weight:600;font-size:.95rem;color:#425466}
.back{color:#425466;font-size:.82rem;text-decoration:none;display:inline-block;margin-bottom:20px}
.back:hover{color:#1a1f36}
.pay-to{color:#697386;font-size:.85rem;font-weight:500;margin:0 0 4px}
.total{font-size:2.4rem;font-weight:700;margin:0 0 32px;letter-spacing:-.02em}
.line{display:flex;justify-content:space-between;padding:14px 0;font-size:.9rem;border-bottom:1px solid #e6ebf1}
.line:last-of-type{border-bottom:0}
.line span:first-child{color:#425466}
.line-total{padding-top:16px;border-top:2px solid #1a1f36;margin-top:8px;font-weight:600;font-size:1rem}
.line-total span:last-child{font-weight:700}
h2{font-size:1rem;margin:0 0 20px;color:#1a1f36}
.field{margin-bottom:16px}
.field label{display:block;font-size:.82rem;color:#425466;margin-bottom:6px;font-weight:500}
.field input{width:100%;padding:11px 13px;border:1px solid #e6ebf1;border-radius:6px;font:inherit;font-size:.95rem;background:#fff;transition:border-color .15s,box-shadow .15s}
.field input:focus{outline:0;border-color:#635bff;box-shadow:0 0 0 4px rgba(99,91,255,.12)}
.field.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pay-btn{width:100%;background:#635bff;color:#fff;border:0;border-radius:6px;padding:13px;font:inherit;font-weight:600;font-size:.98rem;cursor:pointer;margin-top:8px;transition:background .15s}
.pay-btn:hover{background:#4b45d1}
.pay-btn:disabled{opacity:.65;cursor:wait}
.secure{margin-top:20px;text-align:center;font-size:.78rem;color:#8792a2}
.badge{display:inline-block;background:#e3e8ee;color:#697386;font-size:.68rem;padding:3px 8px;border-radius:4px;letter-spacing:.03em;font-weight:600;margin-left:6px;vertical-align:1px}
.err{color:#c8102e;font-size:.85rem;margin-top:8px;display:none}
</style></head><body>
<div class="demo-banner">DEMO MODE — no real payment will be processed</div>
<div class="wrap">
  <div class="summary">
    <div class="brand">
      <img src="https://cdn.prod.website-files.com/67294bbae93e819099f356c2/672953cd9cf8c751045fb537_Logo.png" alt="IMA Karate">
      <div class="brand-name">IMA Karate</div>
    </div>
    <a class="back" href="/belt-testing">&larr; Back</a>
    <p class="pay-to">Pay IMA Karate</p>
    <p class="total">${money(total)}</p>
    ${lineItems.map((li) => `<div class="line"><span>${esc(li.label)}</span><span>${money(li.amount)}</span></div>`).join('')}
    <div class="line line-total"><span>Total due</span><span>${money(total)}</span></div>
    <div style="margin-top:24px;padding:14px;background:#fff;border-radius:6px;font-size:.85rem;color:#425466;line-height:1.55">
      <div style="font-weight:600;color:#1a1f36;margin-bottom:4px">Kyu belt test — ${esc(testDate)}</div>
      ${nameLine ? `${esc(nameLine)}<br>` : ''}
      ${email ? esc(email) : ''}
    </div>
  </div>
  <form class="form" id="pay-form">
    <h2>Payment details <span class="badge">DEMO</span></h2>
    <div class="field">
      <label>Email</label>
      <input type="email" value="${esc(email)}" readonly>
    </div>
    <div class="field">
      <label>Card information</label>
      <input type="text" placeholder="4242 4242 4242 4242" maxlength="19" id="cc-num" required>
    </div>
    <div class="field row">
      <input type="text" placeholder="MM / YY" maxlength="7" id="cc-exp" required>
      <input type="text" placeholder="CVC" maxlength="4" id="cc-cvc" required>
    </div>
    <div class="field">
      <label>Cardholder name</label>
      <input type="text" value="${esc(nameLine)}" required>
    </div>
    <div class="field">
      <label>Country</label>
      <input type="text" value="United States" readonly>
    </div>
    <button class="pay-btn" type="submit" id="pay-btn">Pay ${money(total)}</button>
    <div class="err" id="err">Please fill out card details.</div>
    <div class="secure">🔒 Payments are securely processed by Stripe. In demo mode, no charge is made.</div>
  </form>
</div>
<script>
(function(){
  var form=document.getElementById('pay-form'),btn=document.getElementById('pay-btn'),err=document.getElementById('err');
  var num=document.getElementById('cc-num'),exp=document.getElementById('cc-exp'),cvc=document.getElementById('cc-cvc');
  num.addEventListener('input',function(){this.value=this.value.replace(/[^\\d ]/g,'').replace(/(.{4}) ?/g,'$1 ').trim().slice(0,19)});
  exp.addEventListener('input',function(){var v=this.value.replace(/\\D/g,'');if(v.length>2)v=v.slice(0,2)+' / '+v.slice(2,4);this.value=v});
  cvc.addEventListener('input',function(){this.value=this.value.replace(/\\D/g,'').slice(0,4)});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!num.value||!exp.value||!cvc.value){err.style.display='block';return}
    err.style.display='none';
    btn.disabled=true;btn.textContent='Processing…';
    setTimeout(function(){location.href='/belt-testing/post-payment?memberId=${esc(memberId)}&demo=1${token ? '&token=' + encodeURIComponent(token) : ''}'},1400);
  });
})();
</script></body></html>`;
}

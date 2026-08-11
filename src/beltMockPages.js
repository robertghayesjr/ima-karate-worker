// ─────────────────────────────────────────────────────────────────────────────
//  Mock Stripe checkout + mock DocuSign signing pages for DEMO_MODE.
//
//  When env.DEMO_MODE === "1", /belt-testing/checkout returns a URL pointing
//  at /belt-testing/mock-stripe instead of the real Memberstack Stripe URL,
//  and the post-payment interstitial links to /belt-testing/mock-docusign
//  instead of relying on a real DocuSign email.
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
export function buildMockStripePage(app, memberId, cfg) {
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
    setTimeout(function(){location.href='/belt-testing/post-payment?memberId=${esc(memberId)}&demo=1'},1400);
  });
})();
</script></body></html>`;
}

// ── /belt-testing/mock-docusign?memberId=… ──────────────────────────────────
// A DocuSign-lookalike page. "Sign and return" redirects to /belt-testing/thank-you
// after marking the member as signed (only in demo mode).
export function buildMockDocusignPage(app, memberId, cfg) {
  const nameLine = `${app?.firstName || ''} ${app?.lastName || ''}`.trim();
  const testDate = cfg?.testDateDisplay || '';
  const tierLabel = app?.tierLabel || 'Kyu belt test';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Sign document — DocuSign</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;background:#f0f2f5;color:#222;font-family:'Inter',-apple-system,sans-serif;min-height:100vh}
.demo-banner{background:#f59e0b;color:#1a1f36;text-align:center;padding:8px 12px;font-size:.82rem;font-weight:600;letter-spacing:.02em}
.top{background:#fff;border-bottom:1px solid #d8dbe0;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.ds-brand{display:flex;align-items:center;gap:10px}
.ds-logo{background:#ffcc22;color:#0a0e13;font-weight:700;font-size:.85rem;padding:5px 10px;border-radius:3px;letter-spacing:.04em}
.top-actions{display:flex;gap:10px;align-items:center;font-size:.85rem;color:#555}
.finish-btn{background:#ffcc22;color:#0a0e13;border:0;padding:9px 22px;font-weight:600;border-radius:3px;cursor:pointer;font:inherit;font-weight:600}
.finish-btn:disabled{opacity:.5;cursor:not-allowed}
.envelope-hdr{background:#fdf6dc;border-bottom:1px solid #e8dfa8;padding:10px 24px;font-size:.85rem;color:#5c4c00}
.doc-frame{max-width:820px;margin:24px auto;background:#fff;border:1px solid #d8dbe0;box-shadow:0 2px 6px rgba(0,0,0,.04);padding:56px 72px;font-size:.92rem;line-height:1.65;color:#333}
.doc-frame h1{font-size:1.4rem;text-align:center;margin:0 0 6px;color:#111}
.doc-frame h2{font-size:1rem;text-align:center;margin:0 0 24px;color:#555;font-weight:500}
.doc-frame h3{font-size:.95rem;margin:22px 0 8px;color:#111;text-transform:uppercase;letter-spacing:.04em}
.doc-frame p{margin:0 0 12px}
.field-highlight{background:#e0edff;border:1px solid #4a90e2;padding:2px 8px;border-radius:2px;font-weight:600;color:#1a4b8f}
.sig-area{margin-top:32px;padding:24px;background:#fffbe6;border:2px dashed #e0c14a;border-radius:4px}
.sig-row{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-top:16px}
.sig-label{font-size:.72rem;text-transform:uppercase;color:#8a7a2a;letter-spacing:.06em;margin-bottom:6px;font-weight:600}
.sig-box{background:#fff;border:1px solid #e0c14a;border-radius:3px;padding:16px;min-height:70px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s}
.sig-box:hover{background:#fffdf0}
.sig-box.signed{background:#fff;font-family:'Dancing Script',cursive;font-size:1.9rem;color:#1a4b8f;justify-content:flex-start;padding-left:24px;cursor:default}
.date-box{background:#fff;border:1px solid #e0c14a;border-radius:3px;padding:16px;font-family:'Inter',sans-serif;color:#555;font-size:.92rem;display:flex;align-items:center}
.field-list{background:#f9fafc;border:1px solid #e6ebf1;border-radius:4px;padding:16px 20px;margin:16px 0;font-size:.85rem;color:#555}
.field-list dt{font-weight:600;color:#333;display:inline-block;min-width:150px}
.field-list dd{display:inline;margin:0}
.field-list .row{margin:4px 0}
.sign-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:100}
.sign-modal.open{display:flex}
.sign-modal-inner{background:#fff;border-radius:6px;padding:32px;max-width:440px;text-align:center}
.sign-modal h3{margin:0 0 8px;font-size:1.1rem}
.sign-modal p{color:#666;margin:0 0 20px;font-size:.9rem}
.sign-preview{font-family:'Dancing Script',cursive;font-size:2.6rem;color:#1a4b8f;padding:16px;border:1px solid #e6ebf1;border-radius:4px;margin-bottom:18px}
.sign-modal-actions{display:flex;gap:10px;justify-content:center}
.btn-adopt{background:#ffcc22;color:#0a0e13;border:0;padding:10px 22px;font-weight:600;border-radius:3px;cursor:pointer;font:inherit}
.btn-cancel{background:#fff;color:#555;border:1px solid #d8dbe0;padding:10px 22px;font-weight:500;border-radius:3px;cursor:pointer;font:inherit}
</style></head><body>
<div class="demo-banner">DEMO MODE — no real DocuSign envelope is being sent</div>
<div class="top">
  <div class="ds-brand"><span class="ds-logo">Docusign</span></div>
  <div class="top-actions">
    <span>${esc(nameLine)}</span>
    <button class="finish-btn" id="finish-btn" disabled>Finish</button>
  </div>
</div>
<div class="envelope-hdr">Please review and sign this document. Signing this document is legally binding.</div>

<div class="doc-frame">
  <h1>IMA KARATE — KYU BELT TESTING</h1>
  <h2>Application & Liability Waiver — ${esc(testDate)}</h2>

  <h3>Applicant information</h3>
  <div class="field-list">
    <div class="row"><dt>Name:</dt><dd><span class="field-highlight">${esc(nameLine || '—')}</span></dd></div>
    <div class="row"><dt>Email:</dt><dd><span class="field-highlight">${esc(app?.email || '—')}</span></dd></div>
    <div class="row"><dt>Phone:</dt><dd><span class="field-highlight">${esc(app?.phone || '—')}</span></dd></div>
    <div class="row"><dt>Current rank:</dt><dd><span class="field-highlight">${esc(app?.presentBelt || '—')}</span></dd></div>
    <div class="row"><dt>Testing for:</dt><dd><span class="field-highlight">${esc(tierLabel)}</span></dd></div>
    <div class="row"><dt>Testing time:</dt><dd><span class="field-highlight">${esc(app?.testingTime || '—')}</span></dd></div>
    <div class="row"><dt>Dojo location:</dt><dd><span class="field-highlight">${esc(cfg?.location || '—')}</span></dd></div>
    <div class="row"><dt>Membership #:</dt><dd><span class="field-highlight">${esc(app?.membershipNumber || '—')}</span></dd></div>
  </div>

  <h3>Fees</h3>
  <div class="field-list">
    <div class="row"><dt>Testing fee:</dt><dd>${money(app?.baseCents || 0)}</dd></div>
    ${app?.manualCents ? `<div class="row"><dt>Training manual:</dt><dd>${money(app.manualCents)}</dd></div>` : ''}
    ${app?.lateCents ? `<div class="row"><dt>Late fee:</dt><dd>${money(app.lateCents)}</dd></div>` : ''}
    <div class="row" style="border-top:1px solid #d8dbe0;margin-top:8px;padding-top:8px"><dt>Total paid:</dt><dd><b>${money(app?.totalCents || 0)}</b></dd></div>
  </div>

  <h3>Liability Waiver</h3>
  <p>I understand that participation in karate training and belt-testing involves risk of physical injury. I agree to hold IMA Karate, its instructors, employees, and affiliates harmless from any claims arising from my participation. I certify that I am physically able to participate in the testing activities and that the information above is true and accurate.</p>
  <p>I acknowledge that testing fees are non-refundable, that make-up tests are subject to instructor approval, and that I will conduct myself in accordance with the traditions and code of conduct of the dojo at all times during testing.</p>

  <div class="sig-area">
    <div class="sig-row">
      <div>
        <div class="sig-label">Applicant / Guardian Signature</div>
        <div class="sig-box" id="sig-box">Click to sign</div>
      </div>
      <div>
        <div class="sig-label">Date Signed</div>
        <div class="date-box" id="date-box">—</div>
      </div>
    </div>
  </div>
</div>

<div class="sign-modal" id="sign-modal">
  <div class="sign-modal-inner">
    <h3>Adopt your signature</h3>
    <p>Confirm your name and initials, then click "Adopt and Sign."</p>
    <div class="sign-preview" id="sig-preview">${esc(nameLine || 'Your Name')}</div>
    <div class="sign-modal-actions">
      <button class="btn-cancel" id="btn-cancel">Cancel</button>
      <button class="btn-adopt" id="btn-adopt">Adopt and Sign</button>
    </div>
  </div>
</div>

<script>
(function(){
  var sigBox=document.getElementById('sig-box'),dateBox=document.getElementById('date-box'),modal=document.getElementById('sign-modal');
  var adopt=document.getElementById('btn-adopt'),cancel=document.getElementById('btn-cancel'),finish=document.getElementById('finish-btn');
  var signed=false;
  sigBox.addEventListener('click',function(){if(!signed)modal.classList.add('open')});
  cancel.addEventListener('click',function(){modal.classList.remove('open')});
  adopt.addEventListener('click',function(){
    signed=true;
    sigBox.classList.add('signed');
    sigBox.textContent=${JSON.stringify(nameLine || 'Applicant')};
    dateBox.textContent=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    modal.classList.remove('open');
    finish.disabled=false;
    finish.style.background='#4caf50';
    finish.style.color='#fff';
  });
  finish.addEventListener('click',function(){
    if(!signed)return;
    finish.disabled=true;finish.textContent='Finishing…';
    fetch('/belt-testing/mock-docusign-complete',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({memberId:${JSON.stringify(memberId)}})
    }).finally(function(){location.href='/belt-testing/thank-you'});
  });
})();
</script></body></html>`;
}

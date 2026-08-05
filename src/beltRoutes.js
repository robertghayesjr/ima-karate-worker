// ─────────────────────────────────────────────────────────────────────────────
//  Belt-testing route handlers. Everything under /belt-testing/*.
// ─────────────────────────────────────────────────────────────────────────────

import {
  getBeltConfig,
  updateBeltConfig,
  BELT_TIERS,
  findTier,
  testingTimeFor,
  computeTotalCents,
  isLateNow,
} from './beltConfig.js';
import {
  findMemberByEmail,
  findMembersByName,
  recordBeltTestProgress,
  getMember,
} from './memberstack.js';
import { buildBeltTestingPage } from './beltTestingPage.js';
import { buildBeltTestThankYou } from './beltThankYou.js';

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'x-ima-worker': 'v1',
      ...extra,
    },
  });
}

function html(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'x-ima-worker': 'v1',
      ...extra,
    },
  });
}

function memberSummary(m) {
  if (!m) return null;
  const cf = m.customFields || {};
  const first = cf['first-name'] || cf.firstName || '';
  const last = cf['last-name'] || cf.lastName || '';
  return {
    id: m.id,
    email: m.auth?.email || m.email || '',
    name: `${first} ${last}`.trim(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Router — call this from worker.js. Returns Response or null if unmatched.
// ─────────────────────────────────────────────────────────────────────────────
export async function handleBeltTestingRoutes(request, env, url) {
  const p = url.pathname.replace(/\/$/, '') || '/';

  // Landing page
  if (p === '/belt-testing') {
    const cfg = await getBeltConfig(env);
    return html(buildBeltTestingPage(cfg));
  }

  // Thank-you (after DocuSign complete)
  if (p === '/belt-testing/thank-you') {
    const cfg = await getBeltConfig(env);
    return html(buildBeltTestThankYou(cfg));
  }

  // Post-payment landing — Memberstack redirects here after Stripe success.
  // We fire the DocuSign envelope and forward the signer into the DocuSign
  // signing URL that Zapier returned to us (via KV lookup by memberId).
  if (p === '/belt-testing/post-payment') {
    return handlePostPayment(request, env, url);
  }

  // ── JSON API ─────────────────────────────────────────────────────────────
  if (request.method !== 'POST') return null;

  if (p === '/belt-testing/lookup')       return apiLookup(request, env);
  if (p === '/belt-testing/signup')       return apiSignup(request, env);
  if (p === '/belt-testing/checkout')     return apiCheckout(request, env);
  if (p === '/belt-testing/docusign-hook')return apiDocusignHook(request, env);
  if (p === '/belt-testing/webhook/paid') return apiWebhookPaid(request, env);
  if (p === '/belt-testing/webhook/signed') return apiWebhookSigned(request, env);

  if (p === '/__admin/belt-testing')      return apiAdmin(request, env);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /belt-testing/lookup
//  → { match?: {id,email,name}, candidates?: [...] }
// ─────────────────────────────────────────────────────────────────────────────
async function apiLookup(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { email, firstName, lastName } = body || {};

  try {
    // 1. Exact email match first.
    const byEmail = await findMemberByEmail(env, email);
    if (byEmail) return json({ match: memberSummary(byEmail) });

    // 2. Fallback to name search — return candidates, don't auto-select.
    const byName = await findMembersByName(env, firstName, lastName);
    if (byName.length) {
      return json({ candidates: byName.map(memberSummary) });
    }
    return json({ match: null, candidates: [] });
  } catch (e) {
    console.error('lookup error', e);
    return json({ error: e.message || 'Lookup failed' }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /belt-testing/signup — create a Memberstack member on the fly.
// ─────────────────────────────────────────────────────────────────────────────
async function apiSignup(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { email, password, firstName, lastName, phone } = body || {};
  if (!email || !password) return json({ error: 'Email and password required' }, 400);

  try {
    const res = await fetch('https://admin.memberstack.com/members', {
      method: 'POST',
      headers: {
        'X-API-KEY': env.MEMBERSTACK_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        customFields: {
          'first-name': firstName || '',
          'last-name': lastName || '',
          phone: phone || '',
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: data.message || 'Sign-up failed' }, res.status);
    return json({ memberId: data.data?.id || data.id });
  } catch (e) {
    return json({ error: e.message || 'Sign-up failed' }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /belt-testing/checkout — persist the application to KV keyed by
//  memberId, then hand the client a Memberstack Stripe-Checkout URL for the
//  right belt-tier plan. Memberstack handles the CC surcharge if the plan is
//  configured for it (or we can set it up as a separate line item later).
// ─────────────────────────────────────────────────────────────────────────────
async function apiCheckout(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { memberId, application } = body || {};
  if (!memberId || !application?.tier) return json({ error: 'Missing memberId or tier' }, 400);

  const tier = findTier(application.tier);
  if (!tier) return json({ error: 'Unknown tier' }, 400);

  const planId = env[tier.planEnv];
  if (!planId || planId.startsWith('pln_replace_')) {
    return json({
      error: `Memberstack plan ID for tier "${tier.id}" is not configured (${tier.planEnv}). Set it in wrangler.toml or the Cloudflare dashboard.`,
    }, 500);
  }

  // Persist application to KV so the /post-payment step can retrieve it.
  const stashKey = `application:${memberId}`;
  const cfg = await getBeltConfig(env);
  const stash = {
    ...application,
    memberId,
    tierId: tier.id,
    tierLabel: tier.label,
    testingTime: testingTimeFor(tier.testingBlock),
    testDate: cfg.testDate,
    testDateDisplay: cfg.testDateDisplay,
    createdAt: new Date().toISOString(),
  };
  await env.BELT_TEST.put(stashKey, JSON.stringify(stash), { expirationTtl: 60 * 60 * 24 * 7 });

  // Also stamp the member with what they applied for so support can see it.
  try {
    await recordBeltTestProgress(env, memberId, {
      tier: tier.id,
      testDate: cfg.testDate,
      applicationJson: JSON.stringify(stash),
    });
  } catch (e) {
    console.warn('recordBeltTestProgress failed (non-fatal):', e.message);
  }

  // Memberstack Stripe Checkout URL format for one-time plans:
  //   https://checkout.memberstack.com/<plan-id>?memberId=<id>&successUrl=...&cancelUrl=...
  // Docs: https://docs.memberstack.com/hc/en-us/articles/16452862181147
  const successUrl = new URL('/belt-testing/post-payment', request.url);
  successUrl.searchParams.set('memberId', memberId);
  successUrl.searchParams.set('planId', planId);
  const cancelUrl = new URL('/belt-testing', request.url);
  cancelUrl.searchParams.set('cancel', '1');

  const checkoutUrl = `https://checkout.memberstack.com/${planId}` +
    `?memberId=${encodeURIComponent(memberId)}` +
    `&successUrl=${encodeURIComponent(successUrl.toString())}` +
    `&cancelUrl=${encodeURIComponent(cancelUrl.toString())}`;

  return json({ checkoutUrl });
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /belt-testing/post-payment?memberId=…
//  Memberstack redirects here after Stripe success. We:
//    1. Mark the member as paid in Memberstack.
//    2. Fire the Zapier webhook to create a DocuSign envelope with pre-filled
//       fields. Zapier returns the signing URL to the user via email or an
//       embedded signing link in the envelope; we redirect the user to an
//       interstitial that tells them to check their email.
// ─────────────────────────────────────────────────────────────────────────────
async function handlePostPayment(request, env, url) {
  const memberId = url.searchParams.get('memberId');
  if (!memberId) return new Response('Missing memberId', { status: 400 });

  const cfg = await getBeltConfig(env);
  const stashRaw = await env.BELT_TEST.get(`application:${memberId}`);
  const stash = stashRaw ? JSON.parse(stashRaw) : null;

  // Mark as paid (belt-test-paid = true).
  try {
    await recordBeltTestProgress(env, memberId, { paid: true, testDate: cfg.testDate });
  } catch (e) {
    console.warn('mark paid failed:', e.message);
  }

  // Fire the Zapier webhook — Zap generates the DocuSign envelope with
  // pre-filled fields and emails the signer.
  if (env.ZAPIER_DOCUSIGN_HOOK_URL && stash) {
    const member = await getMember(env, memberId).catch(() => null);
    const payload = buildDocusignPayload(stash, member, cfg);
    try {
      await fetch(env.ZAPIER_DOCUSIGN_HOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Zapier webhook failed:', e.message);
    }
  }

  // Interstitial: tell them to check their inbox and sign, then go to thank-you.
  return html(buildSigningInterstitial(cfg, stash));
}

function buildDocusignPayload(app, member, cfg) {
  // Field names in this payload must match the tab labels set on your
  // DocuSign template. Update Zap or template if names differ.
  const cf = member?.customFields || {};
  return {
    templateId: cfg.docusignTemplateId || null,
    signerEmail: app.email,
    signerName: `${app.firstName || ''} ${app.lastName || ''}`.trim(),
    testDate: cfg.testDate,
    testDateDisplay: cfg.testDateDisplay,
    testingTime: app.testingTime || '',
    location: cfg.location,
    tabs: {
      salutation: app.salutation || '',
      first_name: app.firstName || '',
      middle_name: app.middleName || '',
      last_name: app.lastName || '',
      age: app.age || '',
      membership_number: app.membershipNumber || '',
      present_belt: app.presentBelt || '',
      email: app.email || '',
      phone: app.phone || '',
      dojo: app.dojo || '',
      tier_label: app.tierLabel || '',
      tier_id: app.tierId || '',
      base_amount: (app.baseCents / 100).toFixed(2),
      manual_amount: (app.manualCents / 100).toFixed(2),
      late_amount: (app.lateCents / 100).toFixed(2),
      total_amount: (app.totalCents / 100).toFixed(2),
      wants_manual: app.wantsManual ? 'Yes' : 'No',
      is_late: app.isLate ? 'Yes' : 'No',
      test_date: cfg.testDateDisplay,
      testing_time: app.testingTime || '',
      dojo_location: cfg.location,
    },
    metadata: {
      memberId: member?.id || null,
      applicationCreatedAt: app.createdAt,
    },
  };
}

function buildSigningInterstitial(cfg, app) {
  const nameLine = app ? `${app.firstName || ''} ${app.lastName || ''}`.trim() : '';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Check your inbox — IMA Karate</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#0a0a0a;color:#f4f4f5;font-family:'Inter',sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}
.card{max-width:560px;text-align:center}.eyebrow{color:#d4a24a;letter-spacing:.3em;text-transform:uppercase;font-size:.8rem;font-weight:600;margin:0 0 8px}
h1{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:2rem;margin:0 0 16px}
.lead{color:#b5b5b8;font-size:1.05rem;line-height:1.6}
.card > div{background:#131313;border-left:3px solid #c8102e;padding:20px;text-align:left;margin:24px 0;border-radius:3px}
a.btn{display:inline-block;background:#c8102e;color:#fff;padding:12px 28px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;text-decoration:none;font-weight:700;border-radius:2px}</style>
</head><body><div class="card">
<p class="eyebrow">Payment received</p>
<h1>Now check your inbox</h1>
<p class="lead">Thanks${nameLine ? `, ${nameLine.replace(/[<>&"']/g, '')}` : ''} — your payment is confirmed. A DocuSign email is on its way from IMA Karate with your testing waiver, pre-filled with your details.</p>
<div><b style="color:#d4a24a">What to do next</b>
<ol style="margin:8px 0 0;padding-left:20px;color:#b5b5b8;line-height:1.7">
<li>Open the DocuSign email (from <b>dse_NA4@docusign.net</b> — check spam if you don't see it).</li>
<li>Review, then click <b>Sign</b> — everything is pre-filled from your form.</li>
<li>Once you sign, you'll land on our confirmation page for the ${escStr(cfg.testDateDisplay)} test.</li>
</ol></div>
<a class="btn" href="/belt-testing/thank-you">I've signed — take me to the confirmation</a>
</div></body></html>`;
}

function escStr(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

// ─────────────────────────────────────────────────────────────────────────────
//  POST /belt-testing/webhook/paid — optional. Memberstack (or a Stripe Zap)
//  can call this after payment to guarantee the paid flag gets set even if
//  the user closes the tab before hitting /post-payment.
// ─────────────────────────────────────────────────────────────────────────────
async function apiWebhookPaid(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.memberId) return json({ error: 'memberId required' }, 400);
  await recordBeltTestProgress(env, body.memberId, { paid: true });
  return json({ ok: true });
}

// POST /belt-testing/webhook/signed — Zapier fires this from a DocuSign
// "Envelope Completed" trigger so we can flip belt-test-signed = true.
async function apiWebhookSigned(request, env) {
  const body = await request.json().catch(() => null);
  if (!body?.memberId) return json({ error: 'memberId required' }, 400);
  await recordBeltTestProgress(env, body.memberId, {
    signed: true,
    envelopeId: body.envelopeId,
  });
  return json({ ok: true });
}

// Fallback endpoint if you want to fire the DocuSign hook manually.
async function apiDocusignHook(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid JSON' }, 400);
  if (!env.ZAPIER_DOCUSIGN_HOOK_URL) return json({ error: 'ZAPIER_DOCUSIGN_HOOK_URL not set' }, 500);
  const res = await fetch(env.ZAPIER_DOCUSIGN_HOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return json({ ok: res.ok, status: res.status });
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /__admin/belt-testing — update the KV config. Requires Bearer ADMIN_TOKEN.
//  Body: any subset of BeltTestConfig fields.
//
//  GET /__admin/belt-testing — return current config (still auth-gated).
// ─────────────────────────────────────────────────────────────────────────────
async function apiAdmin(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (request.method === 'GET') {
    return json(await getBeltConfig(env));
  }

  const patch = await request.json().catch(() => null);
  if (!patch || typeof patch !== 'object') return json({ error: 'Invalid JSON' }, 400);
  const updated = await updateBeltConfig(env, patch);
  return json({ ok: true, config: updated });
}

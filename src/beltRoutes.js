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
import { sendBeltTestEnvelope, verifyConnectSignature } from './docusign.js';
import { buildMockStripePage, buildMockDocusignPage } from './beltMockPages.js';

function isDemoMode(env) {
  return env.DEMO_MODE === '1' || env.DEMO_MODE === 'true';
}

/**
 * Guard for any write against a Memberstack member. In demo mode we must never
 * mutate a real member — only synthetic mem_demo_* records are writable.
 * In production (demo off), all members are writable.
 */
function canWriteMember(env, memberId) {
  if (!memberId) return false;
  // Demo mode performs NO Memberstack writes at all — demo activity is fully
  // isolated from real members. (Fail-closed: an unset env is not demo.)
  if (isDemoMode(env)) return false;
  return true;
}

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

  // Mock Stripe / DocuSign pages — demo mode ONLY. In production these
  // routes do not exist (404) so the mock flow can never stand in for the
  // real payment or signing services.
  if ((p === '/belt-testing/mock-stripe' || p === '/belt-testing/mock-docusign')) {
    if (!isDemoMode(env)) return new Response('Not found', { status: 404 });
    return p === '/belt-testing/mock-stripe'
      ? handleMockStripe(request, env, url)
      : handleMockDocusign(request, env, url);
  }

  // ── JSON API ─────────────────────────────────────────────────────────────
  // Admin route accepts both GET (read config) and POST (update). Handled
  // before the POST-only guard below.
  if (p === '/__admin/belt-testing')      return apiAdmin(request, env);

  if (request.method !== 'POST') return null;

  if (p === '/belt-testing/lookup')       return apiLookup(request, env);
  if (p === '/belt-testing/signup')       return apiSignup(request, env);
  if (p === '/belt-testing/checkout')     return apiCheckout(request, env);
  if (p === '/belt-testing/webhook/paid') return apiWebhookPaid(request, env);
  if (p === '/belt-testing/webhook/signed') return apiWebhookSigned(request, env);
  if (p === '/belt-testing/docusign-connect') return apiDocusignConnect(request, env);
  if (p === '/belt-testing/mock-docusign-complete') {
    if (!isDemoMode(env)) return json({ error: 'Not found' }, 404);
    return apiMockDocusignComplete(request, env);
  }

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

  // Demo mode — always report "no match" so the wizard prompts a create-account
  // step, which we also demo-shortcut.
  if (isDemoMode(env)) return json({ match: null, candidates: [], demo: true });

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

  // Demo mode — skip Memberstack entirely, mint a synthetic memberId so the
  // rest of the flow can be walked end-to-end without real signup.
  if (isDemoMode(env)) {
    const demoId = 'mem_demo_' + Math.random().toString(36).slice(2, 10);
    return json({ memberId: demoId, demo: true });
  }

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
  const planUnset = !planId || planId.startsWith('pln_replace_');
  const demo = isDemoMode(env);

  // HARDENING: when demo mode is OFF, a missing plan ID must NOT silently
  // fall back to the mock checkout — that would let production payments
  // bypass Stripe. Fail loudly instead.
  if (!demo && planUnset) {
    console.error(`Belt-testing checkout: plan ID missing for tier ${tier.id} (env ${tier.planEnv})`);
    return json({
      error: 'Payment plan for this belt tier is not configured yet. Please contact the dojo at (303) 665-0339 to complete your registration.',
      code: 'plan_not_configured',
    }, 503);
  }

  // Persist application to KV so the /post-payment step can retrieve it.
  // HARDENING: monetary fields are recomputed server-side from the tier table
  // and the KV config — client-supplied amounts are never trusted.
  const cfg = await getBeltConfig(env);
  const serverIsLate = isLateNow(cfg);
  const serverAmounts = {
    baseCents: tier.priceCents,
    manualCents: application.wantsManual && tier.id !== 'brown' ? cfg.manualAddonCents : 0,
    lateCents: serverIsLate ? cfg.lateFeeCents : 0,
  };
  serverAmounts.totalCents = computeTotalCents(tier.id, {
    wantsManual: application.wantsManual,
    isLate: serverIsLate,
    payByCreditCard: application.payByCreditCard,
  }, cfg);

  // One-time checkout token — /post-payment must present this to mark the
  // member paid, so an arbitrary GET can't flip paid flags.
  const checkoutToken = crypto.randomUUID();

  const stashKey = `application:${memberId}`;
  const stash = {
    ...application,
    memberId,
    tierId: tier.id,
    tierLabel: tier.label,
    ...serverAmounts,
    isLate: serverIsLate,
    checkoutToken,
    testingTime: testingTimeFor(tier.testingBlock),
    testDate: cfg.testDate,
    testDateDisplay: cfg.testDateDisplay,
    createdAt: new Date().toISOString(),
  };
  await env.IMA_KARATE.put(stashKey, JSON.stringify(stash), { expirationTtl: 60 * 60 * 24 * 7 });

  // Also stamp the member with what they applied for so support can see it.
  // Guarded: demo mode never writes to real Memberstack members.
  if (canWriteMember(env, memberId)) {
    try {
      await recordBeltTestProgress(env, memberId, {
        tier: tier.id,
        testDate: cfg.testDate,
        applicationJson: JSON.stringify(stash),
      });
    } catch (e) {
      console.warn('recordBeltTestProgress failed (non-fatal):', e.message);
    }
  }

  // Demo mode: send the client to our mock Stripe page instead of Memberstack.
  if (demo) {
    const mockUrl = new URL('/belt-testing/mock-stripe', request.url);
    mockUrl.searchParams.set('memberId', memberId);
    mockUrl.searchParams.set('token', checkoutToken);
    return json({ checkoutUrl: mockUrl.toString(), demo: true });
  }

  // Memberstack Stripe Checkout URL format for one-time plans:
  //   https://checkout.memberstack.com/<plan-id>?memberId=<id>&successUrl=...&cancelUrl=...
  // Docs: https://docs.memberstack.com/hc/en-us/articles/16452862181147
  const successUrl = new URL('/belt-testing/post-payment', request.url);
  successUrl.searchParams.set('memberId', memberId);
  successUrl.searchParams.set('planId', planId);
  successUrl.searchParams.set('token', checkoutToken);
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
  const token = url.searchParams.get('token') || '';

  const cfg = await getBeltConfig(env);
  const stashRaw = await env.IMA_KARATE.get(`application:${memberId}`);
  const stash = stashRaw ? JSON.parse(stashRaw) : null;

  const demo = isDemoMode(env) || memberId.startsWith('mem_demo_');

  // HARDENING: only mark the member paid when the one-time checkout token
  // from our own checkout URL is presented — an arbitrary GET (or a stale
  // bookmark) can no longer flip the paid flag. The same token gates the
  // DocuSign envelope below.
  const tokenOk = !!(stash?.checkoutToken && token && stash.checkoutToken === token);
  const markPaid = tokenOk && canWriteMember(env, memberId);
  if (markPaid) {
    try {
      await recordBeltTestProgress(env, memberId, { paid: true, testDate: cfg.testDate });
    } catch (e) {
      console.warn('mark paid failed:', e.message);
    }
  } else if (stash && !tokenOk) {
    console.warn(`post-payment: paid flag NOT set for ${memberId} — checkout token missing/mismatched`);
  }

  // Send DocuSign envelope directly (JWT auth from Worker) — replaces the
  // former Zapier hop. On failure we still show the interstitial so the user
  // isn't stranded; they'll just get a manual email from us.
  // HARDENING: idempotent — a page refresh does not send a second envelope.
  // Demo mode skips DocuSign entirely and shows a mock-signing CTA instead.
  let docusignError = null;
  if (stash && !demo && tokenOk) {
    const sentKey = `docusign-sent:${memberId}`;
    const alreadySent = await env.IMA_KARATE.get(sentKey);
    if (alreadySent) {
      console.log(`post-payment: envelope already sent for ${memberId}, skipping resend`);
    } else {
      const member = await getMember(env, memberId).catch(() => null);
      const payload = buildDocusignPayload(stash, member, cfg);
      try {
        // Claim the sent-flag BEFORE sending to narrow the concurrent-request
        // race window; remove it if the send fails so a retry is possible.
        await env.IMA_KARATE.put(sentKey, JSON.stringify({
          state: 'sending', sentAt: new Date().toISOString(),
        }), { expirationTtl: 60 * 60 * 24 * 7 });
        const result = await sendBeltTestEnvelope(env, payload);
        try {
          await env.IMA_KARATE.put(
            `envelope:${result.envelopeId}`,
            JSON.stringify({ memberId, ...payload.metadata }),
            { expirationTtl: 60 * 60 * 24 * 30 },
          );
          await env.IMA_KARATE.put(sentKey, JSON.stringify({
            state: 'sent', envelopeId: result.envelopeId,
            sentAt: new Date().toISOString(),
          }), { expirationTtl: 60 * 60 * 24 * 7 });
        } catch (e) { console.warn('envelope stash failed:', e.message); }
      } catch (e) {
        console.error('DocuSign send failed:', e.message);
        docusignError = e.message;
        await env.IMA_KARATE.delete(sentKey).catch(() => {});
      }
    }
  } else if (stash && !demo && !tokenOk) {
    console.warn(`post-payment: DocuSign NOT sent for ${memberId} — checkout token missing/mismatched`);
  }

  // Interstitial: tell them to check their inbox and sign, then go to thank-you.
  return html(buildSigningInterstitial(cfg, stash, docusignError, memberId, demo));
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

function buildSigningInterstitial(cfg, app, docusignError, memberId, demo) {
  const nameLine = app ? `${app.firstName || ''} ${app.lastName || ''}`.trim() : '';
  const safeName = nameLine.replace(/[<>&"']/g, '');

  // In demo mode, skip the email step and link straight to the mock signing page.
  if (demo) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Ready to sign — IMA Karate</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>body{margin:0;background:#0a0a0a;color:#f4f4f5;font-family:'Inter',sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}
.demo-banner{position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#1a1f36;text-align:center;padding:8px;font-size:.82rem;font-weight:600}
.card{max-width:560px;text-align:center;margin-top:40px}.eyebrow{color:#d4a24a;letter-spacing:.3em;text-transform:uppercase;font-size:.8rem;font-weight:600;margin:0 0 8px}
h1{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:2rem;margin:0 0 16px}
.lead{color:#b5b5b8;font-size:1.05rem;line-height:1.6}
.card > div{background:#131313;border-left:3px solid #4caf50;padding:20px;text-align:left;margin:24px 0;border-radius:3px}
a.btn{display:inline-block;background:#c8102e;color:#fff;padding:14px 32px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;text-decoration:none;font-weight:700;border-radius:2px;font-size:1.05rem}</style>
</head><body>
<div class="demo-banner">DEMO MODE — in production, a DocuSign email is sent automatically</div>
<div class="card">
<p class="eyebrow">Payment confirmed</p>
<h1>Ready to sign your waiver</h1>
<p class="lead">Thanks${nameLine ? `, ${safeName}` : ''} — your ${escStr(cfg.testDateDisplay)} belt-test payment is confirmed. Next step: sign the liability waiver, pre-filled with your details.</p>
<div><b style="color:#d4a24a">In production, the flow is:</b>
<ol style="margin:8px 0 0;padding-left:20px;color:#b5b5b8;line-height:1.7">
<li>Applicant receives a DocuSign email at <b>${escStr(app?.email || 'your inbox')}</b>.</li>
<li>Applicant clicks <b>Review Document</b> — all 21 fields are pre-filled.</li>
<li>Applicant signs; DocuSign notifies our Worker via webhook.</li>
<li>Applicant lands on the ${escStr(cfg.testDateDisplay)} confirmation page.</li>
</ol></div>
<a class="btn" href="/belt-testing/mock-docusign?memberId=${encodeURIComponent(memberId || '')}">Open the waiver &rarr;</a>
</div></body></html>`;
  }

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
<p class="lead">Thanks${nameLine ? `, ${safeName}` : ''} — your payment is confirmed. A DocuSign email is on its way from IMA Karate with your testing waiver, pre-filled with your details.</p>
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
function webhookAuthorized(request, env) {
  // Shared-secret auth for external webhooks. Without WEBHOOK_SECRET the
  // hooks are disabled (fail closed) — configure the secret in the Worker
  // and pass it as ?secret= or the x-webhook-secret header.
  const secret = env.WEBHOOK_SECRET || '';
  if (!secret) return { ok: false, status: 503, error: 'Webhooks not configured — set WEBHOOK_SECRET on the Worker.' };
  const got = request.headers.get('x-webhook-secret') || new URL(request.url).searchParams.get('secret') || '';
  if (got !== secret) return { ok: false, status: 401, error: 'Invalid webhook secret' };
  return { ok: true };
}

async function apiWebhookPaid(request, env) {
  const auth = webhookAuthorized(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const body = await request.json().catch(() => null);
  if (!body?.memberId) return json({ error: 'memberId required' }, 400);
  // Guarded: demo mode never writes to real Memberstack members.
  if (!canWriteMember(env, body.memberId)) return json({ ok: true, skipped: 'demo-mode' });
  await recordBeltTestProgress(env, body.memberId, { paid: true });
  return json({ ok: true });
}

// POST /belt-testing/webhook/signed — legacy Zapier hook target. Still
// supported for any external tool that wants to force a member's
// belt-test-signed flag; expects { memberId, envelopeId? }.
async function apiWebhookSigned(request, env) {
  const auth = webhookAuthorized(request, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const body = await request.json().catch(() => null);
  if (!body?.memberId) return json({ error: 'memberId required' }, 400);
  if (!canWriteMember(env, body.memberId)) return json({ ok: true, skipped: 'demo-mode' });
  await recordBeltTestProgress(env, body.memberId, {
    signed: true,
    envelopeId: body.envelopeId,
  });
  return json({ ok: true });
}

// POST /belt-testing/docusign-connect — DocuSign Connect webhook.
// Configure this URL in DocuSign Admin → Connect → Custom Configuration.
// Enable "Envelope Signed/Completed" event. Include custom envelope fields.
async function apiDocusignConnect(request, env) {
  const raw = await request.text();
  const sigHeader = request.headers.get('x-docusign-signature-1') || '';
  const ok = await verifyConnectSignature(env, raw, sigHeader);
  if (!ok) return json({ error: 'Invalid signature' }, 401);

  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, 400); }

  // DocuSign Connect JSON schema: { event, data: { envelopeId, envelopeSummary: { status, customFields, ... } } }
  const envelopeId = body?.data?.envelopeId || body?.envelopeId;
  const status = body?.data?.envelopeSummary?.status || body?.event || '';
  if (!envelopeId) return json({ error: 'missing envelopeId' }, 400);

  // Look up memberId — first from custom envelope fields, then from KV.
  let memberId = '';
  const cf = body?.data?.envelopeSummary?.customFields?.textCustomFields || [];
  const mf = cf.find((f) => f.name === 'memberId');
  if (mf?.value) memberId = mf.value;

  if (!memberId) {
    const stash = await env.IMA_KARATE.get(`envelope:${envelopeId}`);
    if (stash) { try { memberId = JSON.parse(stash).memberId || ''; } catch {} }
  }

  if (memberId && /completed|signed/i.test(status)) {
    // Guarded: demo mode never writes to real Memberstack members.
    if (canWriteMember(env, memberId)) {
      await recordBeltTestProgress(env, memberId, { signed: true, envelopeId }).catch((e) =>
        console.warn('mark signed failed:', e.message),
      );
    }
  }
  return json({ ok: true, memberId, envelopeId, status });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mock Stripe checkout page (DEMO_MODE only).
// ─────────────────────────────────────────────────────────────────────────────
async function handleMockStripe(request, env, url) {
  const memberId = url.searchParams.get('memberId');
  if (!memberId) return new Response('Missing memberId', { status: 400 });
  const cfg = await getBeltConfig(env);
  const stashRaw = await env.IMA_KARATE.get(`application:${memberId}`);
  const stash = stashRaw ? JSON.parse(stashRaw) : null;
  return html(buildMockStripePage(stash, memberId, cfg, url.searchParams.get('token')));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mock DocuSign signing page (DEMO_MODE only).
// ─────────────────────────────────────────────────────────────────────────────
async function handleMockDocusign(request, env, url) {
  const memberId = url.searchParams.get('memberId');
  if (!memberId) return new Response('Missing memberId', { status: 400 });
  const cfg = await getBeltConfig(env);
  const stashRaw = await env.IMA_KARATE.get(`application:${memberId}`);
  const stash = stashRaw ? JSON.parse(stashRaw) : null;
  return html(buildMockDocusignPage(stash, memberId, cfg));
}

// POST /belt-testing/mock-docusign-complete — mark demo member as signed
// (only records progress if the memberId looks like a real Memberstack ID).
async function apiMockDocusignComplete(request, env) {
  const body = await request.json().catch(() => null);
  const memberId = body?.memberId;
  if (!memberId) return json({ error: 'memberId required' }, 400);
  // Guarded: demo mode never writes to real Memberstack members.
  if (canWriteMember(env, memberId)) {
    try {
      await recordBeltTestProgress(env, memberId, { signed: true });
    } catch (e) {
      console.warn('mock-docusign-complete: mark signed failed:', e.message);
    }
  }
  return json({ ok: true, memberId });
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

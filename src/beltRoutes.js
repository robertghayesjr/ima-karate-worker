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
import { buildMockStripePage } from './beltMockPages.js';

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

  // Thank-you (after payment)
  if (p === '/belt-testing/thank-you') {
    const cfg = await getBeltConfig(env);
    return html(buildBeltTestThankYou(cfg));
  }

  // Post-payment landing — checkout redirects here after payment success.
  if (p === '/belt-testing/post-payment') {
    return handlePostPayment(request, env, url);
  }

  // Mock Stripe page — demo mode ONLY. In production this route does not
  // exist (404) so the mock flow can never stand in for real payment.
  if (p === '/belt-testing/mock-stripe') {
    if (!isDemoMode(env)) return new Response('Not found', { status: 404 });
    return handleMockStripe(request, env, url);
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
//  Checkout redirects here after payment. We mark the member as paid and
//  send them to the confirmation page.
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
  // bookmark) can no longer flip the paid flag.
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

  // No waiver step: payment confirmed → confirmation page.
  const done = new URL('/belt-testing/thank-you', request.url);
  return Response.redirect(done.toString(), 303);
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

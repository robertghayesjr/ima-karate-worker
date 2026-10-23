// ─────────────────────────────────────────────────────────────────────────────
//  Purchase notification emails (Resend).
//  Sent once per paid Stripe Checkout session, either from /post-payment or
//  from the scheduled sweep (covers families who close the tab after paying).
//  Needs the RESEND_API_KEY secret; NOTIFY_FROM sets the sender address.
// ─────────────────────────────────────────────────────────────────────────────
import { getBeltConfig, findTier } from './beltConfig.js';
import { stripeList, getCheckoutLineItems } from './stripe.js';
import { recordBeltTestProgress } from './memberstack.js';

export const DEFAULT_NOTIFY_EMAILS = ['madani9996@gmail.com', 'info@imakarate.com', 'robert@creao.co'];
const EMAIL_RE = /^[^\s@,<>]+@[^\s@,<>]+\.[a-z]{2,}$/i;

export function notifyRecipients(cfg) {
  const list = Array.isArray(cfg?.notifyEmails) ? cfg.notifyEmails : DEFAULT_NOTIFY_EMAILS;
  return list.map((e) => String(e).trim()).filter((e) => EMAIL_RE.test(e)).slice(0, 10);
}

export function parseEmailList(value) {
  const parts = (Array.isArray(value) ? value : String(value || '').split(/[\s,;]+/)).map((e) => String(e).trim()).filter(Boolean);
  const bad = parts.filter((e) => !EMAIL_RE.test(e));
  return { emails: [...new Set(parts.filter((e) => EMAIL_RE.test(e)))].slice(0, 10), bad };
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const money = (cents) => '$' + (Number(cents || 0) / 100).toFixed(2);

/** Build subject / text / html for one purchase. */
export function buildPurchaseEmail({ stash, session, lineItems, cfg }) {
  const s = stash || {};
  const meta = session?.metadata || {};
  const student = [s.salutation, s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ') || meta.student || 'Student';
  const tierLabel = s.tierLabel || findTier(meta.tier)?.label || meta.tier || '';
  const total = session?.amount_total ?? s.totalCents;
  const lines = (lineItems && lineItems.length)
    ? lineItems
    : [
        { name: `Kyu belt test: ${tierLabel}`, cents: s.baseCents },
        { name: 'Student progress manual', cents: s.manualCents },
        { name: 'Late registration fee', cents: s.lateCents },
        { name: `Card processing fee (${s.processingFeePct ?? cfg?.ccSurchargePct ?? 3}%)`, cents: s.processingFeeCents },
      ].filter((l) => l.cents > 0);
  const rows = [
    ['Student', student],
    ['Age', s.age],
    ['Present belt', s.presentBelt],
    ['Testing for', tierLabel],
    ['Membership #', s.membershipNumber],
    ['Dojo', s.dojo],
    ['Email', s.email || session?.customer_details?.email],
    ['Phone', s.phone || session?.customer_details?.phone],
    ['Test date', [s.testDateDisplay || cfg?.testDateDisplay, s.testingTime].filter(Boolean).join(', ')],
    ['Late registration', s.isLate ? 'Yes' : 'No'],
  ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');

  const subject = `New belt test payment: ${student} (${money(total)})`;
  const text = [
    `A belt test payment was received on the IMA Karate website.`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Charges:',
    ...lines.map((l) => `  ${l.name}: ${money(l.cents)}`),
    `  Total paid: ${money(total)}`,
    '',
    `Stripe payment: ${session?.payment_intent || session?.id || ''}`,
  ].join('\n');

  const td = 'padding:6px 10px;border-bottom:1px solid #e5e5e5;font-size:14px;vertical-align:top';
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;padding:24px">
<h2 style="margin:0 0 6px;font-size:20px">New belt test payment</h2>
<p style="margin:0 0 16px;color:#555;font-size:14px">Received on the IMA Karate website.</p>
<table style="width:100%;border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="${td};color:#666;width:38%">${esc(k)}</td><td style="${td}">${esc(v)}</td></tr>`).join('')}</table>
<h3 style="margin:20px 0 6px;font-size:16px">Charges</h3>
<table style="width:100%;border-collapse:collapse">${lines.map((l) => `<tr><td style="${td}">${esc(l.name)}</td><td style="${td};text-align:right">${money(l.cents)}</td></tr>`).join('')}
<tr><td style="${td};font-weight:bold">Total paid</td><td style="${td};text-align:right;font-weight:bold">${money(total)}</td></tr></table>
<p style="margin:18px 0 0;color:#888;font-size:12px">Stripe payment: ${esc(session?.payment_intent || session?.id || '')}</p>
</div></body></html>`;
  return { subject, text, html, replyTo: s.email || session?.customer_details?.email || undefined };
}

export async function sendEmail(env, { to, subject, text, html, replyTo }) {
  if (!env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY is not set' };
  const body = { from: env.NOTIFY_FROM || 'IMA Karate <notifications@imakarate.com>', to, subject, text, html };
  if (replyTo) body.reply_to = replyTo;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, id: data.id } : { ok: false, status: res.status, error: data.message || data.name || 'send failed' };
}

/**
 * Notify once for a paid session. Safe to call from several places:
 * a KV marker keyed by the session id prevents duplicate emails.
 */
export async function notifyPurchase(env, { session, stash, cfg }) {
  if (!session?.id) return { ok: false, error: 'no session' };
  const sentKey = `notify-sent:${session.id}`;
  if (await env.IMA_KARATE.get(sentKey)) return { ok: true, skipped: 'already sent' };
  cfg = cfg || await getBeltConfig(env);
  const to = notifyRecipients(cfg);
  if (!to.length) return { ok: false, error: 'no recipients' };
  let lineItems = null;
  try {
    const li = await getCheckoutLineItems(env, session.id);
    lineItems = (li.data || []).map((l) => ({ name: l.description, cents: l.amount_total }));
  } catch { /* fall back to the stored application */ }
  const msg = buildPurchaseEmail({ stash, session, lineItems, cfg });
  const r = await sendEmail(env, { to, ...msg });
  if (r.ok) {
    await env.IMA_KARATE.put(sentKey, JSON.stringify({ to, id: r.id, at: new Date().toISOString() }), { expirationTtl: 60 * 60 * 24 * 120 });
  } else {
    console.warn('purchase email failed:', r.error);
    await env.IMA_KARATE.put(`notify-failed:${session.id}`, JSON.stringify({ error: r.error, at: new Date().toISOString() }), { expirationTtl: 60 * 60 * 24 * 30 });
  }
  return r;
}

/**
 * Scheduled sweep: find recent paid belt-test sessions in Stripe and make
 * sure each one is recorded and emailed. Covers closed tabs.
 */
export async function sweepPaidSessions(env, { hours = 72 } = {}) {
  if (!env.STRIPE_SECRET_KEY) return { checked: 0 };
  const cfg = await getBeltConfig(env);
  const since = Math.floor(Date.now() / 1000) - hours * 3600;
  const list = await stripeList(env, '/checkout/sessions', { 'created[gte]': since, status: 'complete', limit: 100 });
  let checked = 0, emailed = 0;
  for (const s of list.data || []) {
    if (s.metadata?.source !== 'ima-belt-test' || s.payment_status !== 'paid') continue;
    checked++;
    if (await env.IMA_KARATE.get(`notify-sent:${s.id}`)) continue;
    const memberId = s.metadata.memberId;
    const stashKey = await env.IMA_KARATE.get(`session-app:${s.id}`);
    const stash = stashKey ? JSON.parse((await env.IMA_KARATE.get(stashKey)) || 'null') : null;
    const testDate = stash?.testDate || s.metadata.testDate;
    const paidKey = `belt-paid:${memberId}:${testDate}:${s.id}`;
    if (!(await env.IMA_KARATE.get(paidKey))) {
      await env.IMA_KARATE.put(paidKey, JSON.stringify({
        sessionId: s.id, paymentIntent: s.payment_intent, amountTotal: s.amount_total, email: s.customer_details?.email || stash?.email,
        tier: stash?.tierId || s.metadata.tier, student: s.metadata.student, paidAt: new Date().toISOString(), via: 'sweep',
      }));
      if (memberId && stash && s.amount_total === stash.totalCents) {
        try { await recordBeltTestProgress(env, memberId, { paid: true, testDate }); } catch (e) { console.warn('sweep mark paid failed:', e.message); }
      }
    }
    const r = await notifyPurchase(env, { session: s, stash, cfg });
    if (r.ok && !r.skipped) emailed++;
  }
  return { checked, emailed };
}

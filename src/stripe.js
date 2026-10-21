// ─────────────────────────────────────────────────────────────────────────────
//  Stripe Checkout for belt tests (direct API, no SDK).
//  Each charge is its own line item, including the card processing fee.
//  Payment is confirmed by retrieving the session from Stripe — never by
//  trusting the redirect alone.
// ─────────────────────────────────────────────────────────────────────────────
const API = 'https://api.stripe.com/v1';

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripeFetch(env, path, { method = 'GET', body, idempotencyKey } = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  const headers = { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` };
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(API + path, { method, headers, body: body ? body.toString() : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${data.error?.message || 'request failed'}`);
  return data;
}

/** Line items from server-computed amounts (cents). Zero lines are skipped. */
export function beltLineItems(amounts, { tierLabel, feePct }) {
  const items = [
    { name: `Kyu belt test: ${tierLabel}`, cents: amounts.baseCents },
    { name: 'Student progress manual', cents: amounts.manualCents },
    { name: 'Late registration fee', cents: amounts.lateCents },
    { name: `Card processing fee (${feePct}%)`, cents: amounts.processingFeeCents },
  ].filter((i) => i.cents > 0);
  return items.map((i) => ({ price_data: { currency: 'usd', unit_amount: i.cents, product_data: { name: i.name } }, quantity: 1 }));
}

export async function createBeltCheckoutSession(env, { amounts, tierLabel, feePct, email, memberId, studentName, testDate, tierId, successUrl, cancelUrl, idempotencyKey }) {
  const meta = { source: 'ima-belt-test', memberId, tier: tierId, testDate, student: studentName };
  const params = form({
    mode: 'payment',
    customer_email: email,
    client_reference_id: memberId,
    success_url: successUrl, // must contain the literal {CHECKOUT_SESSION_ID}
    cancel_url: cancelUrl,
    metadata: meta,
    payment_intent_data: { description: `IMA Kyu belt test (${testDate}): ${studentName}`.slice(0, 300), metadata: meta },
  });
  params.append('payment_method_types[0]', 'card');
  beltLineItems(amounts, { tierLabel, feePct }).forEach((li, i) => {
    params.append(`line_items[${i}][quantity]`, '1');
    params.append(`line_items[${i}][price_data][currency]`, li.price_data.currency);
    params.append(`line_items[${i}][price_data][unit_amount]`, String(li.price_data.unit_amount));
    params.append(`line_items[${i}][price_data][product_data][name]`, li.price_data.product_data.name);
  });
  return stripeFetch(env, '/checkout/sessions', { method: 'POST', body: params, idempotencyKey });
}

export async function getCheckoutSession(env, id) {
  if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(id || '')) throw new Error('Invalid checkout session id');
  return stripeFetch(env, `/checkout/sessions/${id}`);
}

export async function getCheckoutLineItems(env, id) {
  return stripeFetch(env, `/checkout/sessions/${id}/line_items?limit=10`);
}

export async function expireCheckoutSession(env, id) {
  return stripeFetch(env, `/checkout/sessions/${id}/expire`, { method: 'POST' });
}

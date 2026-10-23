import { buildPurchaseEmail, parseEmailList, notifyRecipients, notifyPurchase, sweepPaidSessions } from '../src/notify.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const kv = new Map();
const KV = { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async (k) => kv.delete(k) };
const sent = [];
globalThis.fetch = async (url, init) => {
  url = String(url);
  if (url.includes('api.resend.com')) { sent.push(JSON.parse(init.body)); return new Response(JSON.stringify({ id: 'em_' + sent.length }), { status: 200 }); }
  if (url.includes('/line_items')) return new Response(JSON.stringify({ data: [{ description: 'Kyu belt test: White', amount_total: 13500 }, { description: 'Card processing fee (3%)', amount_total: 405 }] }));
  if (url.includes('/v1/checkout/sessions?')) return new Response(JSON.stringify({ data: [
    { id: 'cs_live_A', payment_status: 'paid', amount_total: 13905, payment_intent: 'pi_A', metadata: { source: 'ima-belt-test', memberId: 'mem_1', tier: 'white_yellow', testDate: '2026-11-07', student: 'Ann Lee' }, customer_details: { email: 'p@x.com' } },
    { id: 'cs_live_B', payment_status: 'paid', amount_total: 500, metadata: { source: 'other' } },
  ] }));
  if (url.includes('memberstack')) return new Response('{}');
  return new Response('{}', { status: 404 });
};
const env = { IMA_KARATE: KV, RESEND_API_KEY: 're_x', STRIPE_SECRET_KEY: 'sk_test_x' };

ok(notifyRecipients({}).length === 3, 'default 3 recipients');
const pe = parseEmailList('a@b.com, bad, c@d.org'); ok(pe.emails.length === 2 && pe.bad[0] === 'bad', 'parse emails');
const m = buildPurchaseEmail({ stash: { firstName: 'Ann', lastName: 'Lee', tierLabel: 'White', email: 'p@x.com', baseCents: 13500, processingFeeCents: 405, totalCents: 13905 }, session: { id: 'cs_1', amount_total: 13905 }, cfg: {} });
ok(m.subject.includes('Ann Lee') && m.subject.includes('$139.05'), 'subject has name + total');
ok(m.text.includes('Card processing fee') && m.html.includes('Total paid'), 'body lists charges');
ok(!/—/.test(m.text + m.html + m.subject), 'no em dashes');

kv.set('session-app:cs_live_A', 'application:mem_1:tok');
kv.set('application:mem_1:tok', JSON.stringify({ firstName: 'Ann', lastName: 'Lee', email: 'p@x.com', tierId: 'white_yellow', tierLabel: 'White', totalCents: 13905, testDate: '2026-11-07' }));
let r = await sweepPaidSessions(env);
ok(r.checked === 1 && r.emailed === 1, 'sweep emails the one belt-test session');
ok(sent.length === 1 && sent[0].to.length === 3 && sent[0].reply_to === 'p@x.com', 'sent to 3 with reply-to parent');
ok(!!kv.get('belt-paid:mem_1:2026-11-07:cs_live_A'), 'sweep records the paid session');
r = await sweepPaidSessions(env);
ok(r.emailed === 0 && sent.length === 1, 'no duplicate on second sweep');
r = await notifyPurchase(env, { session: { id: 'cs_live_A' }, stash: null });
ok(r.skipped && sent.length === 1, 'post-payment path also deduped');
const r2 = await notifyPurchase({ IMA_KARATE: KV }, { session: { id: 'cs_live_Z' }, stash: {} , cfg: {} });
ok(!r2.ok && /RESEND_API_KEY/.test(r2.error) && !kv.get('notify-sent:cs_live_Z'), 'no key: not marked sent (retries later)');
console.log('\n' + fails + ' failures');

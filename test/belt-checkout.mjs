import { handleBeltTestingRoutes } from '../src/beltRoutes.js';
import { computeBeltAmounts, updateBeltConfig } from '../src/beltConfig.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const kv = new Map();
const env = { IMA_KARATE: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); } }, DEMO_MODE: '0', STRIPE_SECRET_KEY: 'sk_test_x' };
const sessions = new Map(); const created = [];
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url);
  if (u.host !== 'api.stripe.com') return new Response('{}', { status: 404 });
  if (u.pathname === '/v1/checkout/sessions' && init.method === 'POST') {
    const f = new URLSearchParams(init.body); created.push({ f, headers: init.headers });
    let total = 0; for (let i = 0; f.has(`line_items[${i}][quantity]`); i++) total += Number(f.get(`line_items[${i}][price_data][unit_amount]`));
    const id = 'cs_test_' + (sessions.size + 1);
    sessions.set(id, { id, url: 'https://checkout.stripe.com/c/pay/' + id, amount_total: total, payment_status: 'unpaid', metadata: { memberId: f.get('metadata[memberId]') }, success_url: f.get('success_url') });
    return new Response(JSON.stringify(sessions.get(id)));
  }
  const m = u.pathname.match(/^\/v1\/checkout\/sessions\/(cs_test_\d+)$/);
  if (m) return new Response(JSON.stringify(sessions.get(m[1]) || {}), { status: sessions.has(m[1]) ? 200 : 404 });
  return new Response('{}', { status: 404 });
};
const call = (method, path, body) => handleBeltTestingRoutes(new Request('https://imakarate.com' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }), env, new URL('https://imakarate.com' + path));

const cfgBase = { manualAddonCents: 3000, lateFeeCents: 5000, ccSurchargePct: 3 };
const a = computeBeltAmounts('white_yellow', { wantsManual: true, isLate: true }, cfgBase);
ok(a.processingFeeCents === Math.round((a.baseCents + 3000 + 5000) * 0.03) && a.totalCents === a.subtotalCents + a.processingFeeCents, 'fee = 3% of subtotal, own line');

await updateBeltConfig(env, { registrationOpen: false, testDate: '2099-01-10', testDateDisplay: 'January 10, 2099', lateFeeCutoff: '2099-01-08' });
let page = await (await call('GET', '/belt-testing')).text();
ok(page.includes('Online registration opens soon') && /id="bt-form" novalidate hidden/.test(page), 'paused: notice shown, form hidden');
ok((await call('POST', '/belt-testing/signup', { email: 'a@b.c', password: 'x' })).status === 403, 'paused: signup refused');
ok((await call('POST', '/belt-testing/checkout', { memberId: 'mem_1', application: { tier: 'white_yellow' } })).status === 403, 'paused: checkout refused');

await updateBeltConfig(env, { registrationOpen: true });
page = await (await call('GET', '/belt-testing')).text();
ok(!page.includes('Online registration opens soon') && page.includes('Card processing fee (3%)') && page.includes('id="bt-fee"'), 'open: form + fee line on page');

const res = await call('POST', '/belt-testing/checkout', { memberId: 'mem_real1', application: { tier: 'white_yellow', wantsManual: true, email: 's@x.com', firstName: 'Sam', lastName: 'Lee', totalCents: 1, baseCents: 1 } });
const cj = await res.json();
ok(res.status === 200 && cj.checkoutUrl.startsWith('https://checkout.stripe.com/'), 'checkout returns Stripe URL');
const f = created[0].f;
const names = []; for (let i = 0; f.has(`line_items[${i}][quantity]`); i++) names.push(f.get(`line_items[${i}][price_data][product_data][name]`) + '=' + f.get(`line_items[${i}][price_data][unit_amount]`));
const exp = computeBeltAmounts('white_yellow', { wantsManual: true, isLate: false }, { ...cfgBase });
ok(names.length === 3 && names[0].startsWith('Kyu belt test:') && names[1] === 'Student progress manual=3000' && names[2] === `Card processing fee (3%)=${exp.processingFeeCents}`, 'line items: test, manual, 3% fee (' + names.join(', ') + ')');
ok(f.get('payment_method_types[0]') === 'card' && f.get('metadata[source]') === 'ima-belt-test' && f.get('customer_email') === 's@x.com', 'card only, metadata, email');
ok(f.get('success_url').includes('session_id={CHECKOUT_SESSION_ID}') && created[0].headers['Idempotency-Key'], 'success url placeholder + idempotency');
const stash = JSON.parse([...kv.entries()].find(([k]) => k.startsWith('application:mem_real1:'))[1]);
ok(stash.totalCents === exp.totalCents && stash.stripeSessionId === 'cs_test_1', 'client amounts ignored; session stored');

const pp = (q) => call('GET', '/belt-testing/post-payment?' + q);
ok((await pp(`memberId=mem_real1&token=${stash.checkoutToken}&session_id=cs_test_1`)).status === 402, 'unpaid session: not confirmed');
sessions.get('cs_test_1').payment_status = 'paid';
ok((await pp(`memberId=mem_real1&token=bad&session_id=cs_test_1`)).status === 303 && ![...kv.keys()].some((k) => k.startsWith('belt-paid:')), 'bad token: no paid record');
sessions.set('cs_test_9', { id: 'cs_test_9', payment_status: 'paid', amount_total: exp.totalCents, metadata: { memberId: 'mem_real1' } });
ok((await pp(`memberId=mem_real1&token=${stash.checkoutToken}&session_id=cs_test_9`)).status === 402, 'someone else\'s paid session rejected');
sessions.get('cs_test_1').amount_total = 100;
ok((await pp(`memberId=mem_real1&token=${stash.checkoutToken}&session_id=cs_test_1`)).status === 402, 'wrong amount rejected');
sessions.get('cs_test_1').amount_total = exp.totalCents;
const good = await pp(`memberId=mem_real1&token=${stash.checkoutToken}&session_id=cs_test_1`);
ok(good.status === 303 && good.headers.get('Location').endsWith('/belt-testing/thank-you'), 'paid: redirect to thank-you');
const rec = JSON.parse(kv.get('belt-paid:mem_real1:2099-01-10:cs_test_1') || 'null');
ok(rec && rec.amountTotal === exp.totalCents && rec.student === 'Sam Lee', 'paid record stored');

const env2 = { ...env, STRIPE_SECRET_KEY: '' };
const r2 = await handleBeltTestingRoutes(new Request('https://imakarate.com/belt-testing/checkout', { method: 'POST', body: JSON.stringify({ memberId: 'm', application: { tier: 'white_yellow' } }) }), env2, new URL('https://imakarate.com/belt-testing/checkout'));
ok(r2.status === 503, 'no Stripe key: refuses (no mock fallback)');
// siblings: two checkouts on one parent account keep separate applications
await call('POST', '/belt-testing/checkout', { memberId: 'mem_parent', application: { tier: 'tiny_tiger', email: 'p@x.com', firstName: 'Kid', lastName: 'One' } });
await call('POST', '/belt-testing/checkout', { memberId: 'mem_parent', application: { tier: 'white_yellow', email: 'p@x.com', firstName: 'Kid', lastName: 'Two' } });
const sib = [...kv.entries()].filter(([k]) => k.startsWith('application:mem_parent:')).map(([, v]) => JSON.parse(v).firstName + ' ' + JSON.parse(v).lastName).sort();
ok(sib.length === 2 && sib[0] === 'Kid One' && sib[1] === 'Kid Two', 'siblings on one account keep separate applications');
console.log('\n' + fails + ' failures'); process.exit(fails ? 1 : 0);

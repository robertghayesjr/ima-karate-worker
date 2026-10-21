import worker from '../src/worker.js';
import { validateDoc, publishDoc } from '../src/contentDocs.js';
import { handleAdminRoutes } from '../src/adminRoutes.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const kv = new Map();
const env = { IMA_KARATE: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); }, list: async () => ({ keys: [] }) }, ADMIN_PASSWORD: 'pw', DEMO_MODE: '1' };
const ctx = { waitUntil() {}, passThroughOnCloudflare() {} };
const get = async (path) => (await worker.fetch(new Request('https://ima.rob-hayes.com' + path), env, ctx)).text();

let html = await get('/');
ok((html.match(/aria-label="(Facebook|Instagram|YouTube)" target="_blank" rel="noopener"><svg/g) || []).length === 3, 'home: 3 real SVG social icons by default');
ok(!/aria-label="Facebook">f</.test(html), 'home: letter placeholders gone');
const belt = await get('/belt-testing');
ok(/aria-label="YouTube"[^>]*><svg/.test(belt), 'belt-testing page: real icons');

ok(!validateDoc('site', { socials: [{ platform: 'myspace', url: 'https://x.com' }] }).ok, 'validate: unknown platform rejected');
ok(!validateDoc('site', { socials: [{ platform: 'facebook', url: 'javascript:alert(1)' }] }).ok, 'validate: javascript: url rejected');
ok(!validateDoc('site', { socials: [], announcement: { enabled: true, text: '' } }).ok, 'validate: enabled announcement needs text');
ok(validateDoc('site', { socials: [{ platform: 'tiktok', url: 'https://www.tiktok.com/@imakarate' }], announcement: { enabled: true, text: 'Belt test Nov 21', href: '/belt-testing' } }).ok, 'validate: good doc accepted');

await publishDoc(env, 'site', { socials: [{ platform: 'instagram', url: 'https://www.instagram.com/imakarate' }, { platform: 'tiktok', url: 'https://www.tiktok.com/@imakarate' }], announcement: { enabled: true, text: 'Belt test <Nov 21>', href: '/belt-testing' } }, 'test');
html = await get('/');
ok(/aria-label="TikTok"/.test(html) && !/aria-label="Facebook"/.test(html), 'published doc: icons follow the site doc (TikTok added, Facebook removed)');
ok(html.includes('<div class="ima-announce" role="status"><a href="/belt-testing">Belt test &lt;Nov 21&gt; &rarr;</a></div>'), 'published doc: announcement bar rendered + escaped');
ok(/aria-label="TikTok"/.test(await get('/belt-testing')), 'published doc: applies on belt-testing page too');

const login = await handleAdminRoutes(new Request('https://x/admin/api/login', { method: 'POST', body: JSON.stringify({ password: 'pw' }), headers: { 'Content-Type': 'application/json' } }), env, new URL('https://x/admin/api/login'));
const token = (await login.json()).token;
const admin = (path, init = {}) => handleAdminRoutes(new Request('https://x' + path, { ...init, headers: { 'x-admin-auth': token, 'Content-Type': 'application/json' } }), env, new URL('https://x' + path));
const pv = await admin('/admin/api/preview/site');
ok(pv.status === 200 && /ima-announce/.test(await pv.text()), 'admin: site preview renders home page with settings');
const d = await (await admin('/admin/api/doc/site')).json();
ok(d.key === 'site' && d.published.socials.length === 2, 'admin: site doc readable');
kv.set('admin:change-requests', JSON.stringify([{ id: 'abc1', summary: 'Add testimonials', details: 'home page', status: 'open', createdAt: new Date().toISOString() }]));
ok((await (await admin('/admin/api/requests')).json()).requests[0].summary === 'Add testimonials', 'admin: requests listed');
ok((await admin('/admin/api/requests/abc1', { method: 'PATCH', body: JSON.stringify({ status: 'done' }) })).status === 200 && JSON.parse(kv.get('admin:change-requests'))[0].status === 'done', 'admin: request marked done');
ok((await admin('/admin/api/requests/abc1', { method: 'PATCH', body: JSON.stringify({ status: 'hacked' }) })).status === 400, 'admin: bad status rejected');
console.log('\n' + fails + ' failures'); process.exit(fails ? 1 : 0);

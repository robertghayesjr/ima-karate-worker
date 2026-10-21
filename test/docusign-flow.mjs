// DocuSign flow tests against a mocked DocuSign REST API.
import * as ds from '../src/docusign.js';
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const kv = new Map();
const KV = { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); } };
const env = { IMA_KARATE: KV, DOCUSIGN_ACCOUNT_ID: 'acct', DOCUSIGN_BASE_URI: 'https://na4.docusign.net' };
const calls = [];
const ENV_ID = '11111111-2222-3333-4444-555555555555';
let envelopeDb = {};
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); const m = init.method || 'GET';
  calls.push({ m, path: u.pathname + u.search, body: init.body ? JSON.parse(init.body) : null, auth: init.headers?.Authorization });
  const r = (o, s = 200) => new Response(JSON.stringify(o), { status: s });
  if (m === 'POST' && u.pathname.endsWith('/envelopes')) return r({ envelopeId: ENV_ID, status: 'sent' }, 201);
  if (m === 'GET' && u.pathname.endsWith('/folders')) return r({ folders: [{ name: 'Sent Items', folderId: 's1' }, { name: 'IMA Belt Tests', folderId: 'f-belt' }] });
  if (m === 'PUT' && u.pathname.includes('/folders/')) return r({});
  if (m === 'GET' && u.pathname.includes('/envelopes/')) { const id = u.pathname.split('/').pop(); return envelopeDb[id] ? r(envelopeDb[id]) : r({ errorCode: 'NOT_FOUND' }, 404); }
  if (m === 'POST' && u.pathname.endsWith('/templates')) return r({ templateId: 'tpl-123', name: ds.TEMPLATE_NAME }, 201);
  if (m === 'GET' && u.pathname.endsWith('/templates')) return r({ envelopeTemplates: [] });
  return r({ error: 'unexpected ' + m + ' ' + u.pathname }, 500);
};
// cached token so no JWT signing is needed
const tokKey = (await import('fs')).readFileSync(new URL('../src/docusign.js', import.meta.url), 'utf8').match(/TOKEN_KV_KEY = '([^']+)'/)[1];
kv.set(tokKey, 'test-token');

const payload = { signerName: 'Jane Doe', signerEmail: 'jane@example.com', testDate: '2026-11-21', testDateDisplay: 'November 21, 2026',
  metadata: { memberId: 'mem_abc' }, tabs: { first_name: 'Jane', last_name: 'Doe', tier_label: 'Orange to Green', present_belt: 'Orange', total_amount: '175.00' } };

// 1. document fallback path
let res = await ds.sendBeltTestEnvelope(env, payload);
let post = calls.find((c) => c.m === 'POST' && c.path.endsWith('/envelopes')).body;
ok(res.envelopeId === ENV_ID && res.usedTemplate === false, 'fallback: envelope created from embedded PDF');
ok(post.documents?.[0]?.documentBase64?.startsWith('JVBER'), 'fallback: PDF attached');
const cf = Object.fromEntries(post.customFields.textCustomFields.map((f) => [f.name, f]));
ok(cf.Source.value === 'ima-belt-test' && cf.memberId.value === 'mem_abc', 'custom fields: Source + memberId');
ok(cf.Student.value === 'Jane Doe' && cf.Student.show === 'true' && cf['Belt tier'].value === 'Orange to Green' && cf['Total paid'].value === '$175.00', 'custom fields: visible Student/Belt/Total');
ok(post.emailSubject === 'IMA Belt Test - Jane Doe - November 21, 2026', 'subject names the student: ' + post.emailSubject);
ok(post.eventNotification?.url === 'https://ima.rob-hayes.com/belt-testing/docusign-connect' && post.eventNotification.events.includes('envelope-completed'), 'per-envelope status callback registered');
const tt = post.recipients.signers[0].tabs.textTabs;
ok(tt.find((t) => t.tabLabel === 'first_name').anchorString === '\\first_name\\' && tt.every((t) => t.locked === 'true'), 'anchor tabs use \\label\\ and are locked');
ok(calls.some((c) => c.m === 'PUT' && c.path.includes('/folders/f-belt') && c.body.envelopeIds[0] === ENV_ID) && res.folder.ok, 'envelope filed into "IMA Belt Tests" folder');

// 2. template path
calls.length = 0;
res = await ds.sendBeltTestEnvelope(env, { ...payload, templateId: 'tpl-123' });
post = calls.find((c) => c.m === 'POST' && c.path.endsWith('/envelopes')).body;
ok(res.usedTemplate && post.templateId === 'tpl-123' && !post.documents, 'template: uses DocuSign template, no embedded PDF');
ok(post.templateRoles[0].roleName === 'Student' && post.templateRoles[0].tabs.textTabs.find((t) => t.tabLabel === 'tier_label').value === 'Orange to Green', 'template: role Student with prefilled tabs');
ok(post.customFields && post.eventNotification, 'template: custom fields + callback still set');

// 3. create template
calls.length = 0;
const t = await ds.createBeltTestTemplate(env);
const tb = calls.find((c) => c.path.endsWith('/templates') && c.m === 'POST').body;
ok(t.templateId === 'tpl-123' && tb.recipients.signers[0].roleName === 'Student' && tb.recipients.signers[0].tabs.textTabs.length === 21 && tb.recipients.signers[0].tabs.signHereTabs.length === 1, 'template creation: 21 fields + signature, role Student');

// 4. webhook verify-by-fetch
const { handleBeltTestingRoutes } = await import('../src/beltRoutes.js');
const HOOK_URL = 'https://ima.rob-hayes.com/belt-testing/docusign-connect';
const hook = (body) => handleBeltTestingRoutes(new Request(HOOK_URL, { method: 'POST', body: JSON.stringify(body) }), { ...env, DEMO_MODE: '1' }, new URL(HOOK_URL));
envelopeDb[ENV_ID] = { status: 'completed', completedDateTime: '2026-10-21T00:00:00Z', customFields: { textCustomFields: [{ name: 'Source', value: 'ima-belt-test' }, { name: 'memberId', value: 'mem_abc' }] } };
const OTHER = '99999999-2222-3333-4444-555555555555';
envelopeDb[OTHER] = { status: 'completed', customFields: { textCustomFields: [] } };
let r1 = await (await hook({ event: 'envelope-completed', data: { envelopeId: ENV_ID, envelopeSummary: { status: 'completed' } } })).json();
ok(r1.ok && r1.status === 'completed' && JSON.parse(kv.get('envelope-status:' + ENV_ID)).status === 'completed', 'webhook: verified status recorded from DocuSign');
let r2 = await (await hook({ event: 'envelope-completed', data: { envelopeId: OTHER } })).json();
ok(r2.ignored, 'webhook: non-belt-test envelopes (e.g. real-estate docs) ignored');
envelopeDb[ENV_ID].status = 'sent';
let r3 = await (await hook({ event: 'envelope-completed', data: { envelopeId: ENV_ID, envelopeSummary: { status: 'completed' } } })).json();
ok(r3.status === 'sent', 'webhook: forged "completed" payload is not trusted (DocuSign says sent)');
let r4 = await hook({ data: { envelopeId: 'not-an-id' } });
ok(r4.status === 400, 'webhook: bad envelope id rejected');
console.log('\n' + fails + ' failures'); process.exit(fails ? 1 : 0);

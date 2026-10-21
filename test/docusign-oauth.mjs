import { createHash } from 'crypto';
import * as ds from '../src/docusign.js';
import { handleAdminRoutes } from '../src/adminRoutes.js';
import worker from '../src/worker.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const kv = new Map();
const env = { IMA_KARATE: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); } },
  DOCUSIGN_INTEGRATION_KEY: 'ik-123', DOCUSIGN_ACCOUNT_ID: '6b65537a-a0f5-4bd6-802d-1daa34fe38d8', DOCUSIGN_BASE_URI: 'https://na4.docusign.net', ADMIN_PASSWORD: 'pw', DOCUSIGN_RSA_PRIVATE_KEY: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };
const calls = []; let n = 0; let failRefresh = false;
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); const body = init.body ? new URLSearchParams(init.body) : null;
  calls.push({ url: u.href, body, headers: init.headers || {} });
  const r = (o, s = 200) => new Response(JSON.stringify(o), { status: s });
  if (u.pathname === '/oauth/token') {
    if (body.get('grant_type') === 'authorization_code') {
      const v = body.get('code_verifier'); const ch = createHash('sha256').update(v).digest('base64url');
      if (ch !== globalThis.__challenge || body.get('code') !== 'good-code') return r({ error: 'invalid_grant' }, 400);
      return r({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 28800 });
    }
    if (body.get('grant_type') === 'refresh_token') {
      if (failRefresh) return r({ error: 'invalid_grant', error_description: 'expired' }, 400);
      n++; return r({ access_token: 'at-r' + n, refresh_token: 'rt-r' + n, expires_in: 28800 });
    }
  }
  if (u.pathname === '/oauth/userinfo') return r({ sub: 'user-1', name: 'Rob Hayes', email: 'hello@creao.co', accounts: [{ account_id: 'other', is_default: true, base_uri: 'https://na3.docusign.net' }, { account_id: '6b65537a-a0f5-4bd6-802d-1daa34fe38d8', account_name: 'Rob Hayes', base_uri: 'https://na4.docusign.net' }] });
  return r({ error: 'unexpected ' + u.href }, 500);
};
let st = await ds.connectionStatus(env);
ok(!st.connected && st.mode === 'none', 'status: not connected (RSA value is not a key)');
ok((await ds.testConnection(env)).hint.includes('Connect DocuSign'), 'test: tells user to click Connect DocuSign');

const authUrl = new URL(await ds.startOAuth(env));
const state = authUrl.searchParams.get('state');
ok(authUrl.host === 'account.docusign.com' && authUrl.searchParams.get('scope') === 'signature extended' && authUrl.searchParams.get('code_challenge_method') === 'S256', 'start: production sign-in URL, extended scope, PKCE');
ok(authUrl.searchParams.get('redirect_uri') === 'https://ima.rob-hayes.com/admin/api/docusign/callback', 'start: redirect URI');
globalThis.__challenge = authUrl.searchParams.get('code_challenge');

const cb = (q) => handleAdminRoutes(new Request('https://ima.rob-hayes.com/admin/api/docusign/callback?' + q), env, new URL('https://ima.rob-hayes.com/admin/api/docusign/callback?' + q));
let res = await cb('code=good-code&state=forged-state-aaaaaaaaaaaaaaa');
ok(res.status === 400 && /expired/.test(await res.text()), 'callback: unknown state rejected');
res = await cb('error=access_denied&error_description=%3Cscript%3Ex%3C%2Fscript%3E');
ok(res.status === 400 && !(await res.text()).includes('<script>x'), 'callback: DocuSign error shown escaped');
res = await cb(`code=good-code&state=${state}`);
const html = await res.text();
ok(res.status === 200 && html.includes('Connected to DocuSign as Rob Hayes (Rob Hayes)'), 'callback: connected');
const rec = JSON.parse(kv.get('docusign:oauth'));
ok(rec.refreshToken === 'rt-1' && rec.baseUri === 'https://na4.docusign.net' && rec.accountId === env.DOCUSIGN_ACCOUNT_ID, 'callback: stored refresh token + matching account (not the default one)');
ok(calls.find((c) => c.body?.get('grant_type') === 'authorization_code').body.get('client_id') === 'ik-123', 'public client: client_id in body (no secret key)');
ok((await cb(`code=good-code&state=${state}`)).status === 400, 'callback: state is single-use');

kv.delete('docusign:access_token');
ok((await ds.testConnection(env)).ok, 'test: refresh works');
ok(JSON.parse(kv.get('docusign:oauth')).refreshToken === 'rt-r1' && kv.get('docusign:access_token') === 'at-r1', 'refresh: rotated refresh token + cached access token');

const env2 = { ...env, DOCUSIGN_SECRET_KEY: 'sec' }; kv.delete('docusign:access_token');
await ds.docusignKeepAlive(env2);
const last = calls.filter((c) => c.body?.get('grant_type') === 'refresh_token').pop();
ok(last.headers.Authorization === 'Basic ' + Buffer.from('ik-123:sec').toString('base64') && !last.body.get('client_id'), 'confidential client: Basic auth with secret key');

let scheduled; await worker.scheduled({}, env, { waitUntil: (p) => { scheduled = p; } }); await scheduled;
ok(JSON.parse(kv.get('docusign:oauth')).refreshToken === 'rt-r3', 'cron: daily keep-alive refreshes');
failRefresh = true; await ds.docusignKeepAlive(env);
st = await ds.connectionStatus(env);
ok(st.connected && /expired/.test(st.lastError), 'keep-alive failure recorded for admin');
await ds.disconnectOAuth(env);
ok(!(await ds.connectionStatus(env)).connected, 'disconnect clears connection');
console.log('\n' + fails + ' failures'); process.exit(fails ? 1 : 0);

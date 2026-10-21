// ─────────────────────────────────────────────────────────────────────────────
//  DocuSign JWT auth + envelope creation for Cloudflare Workers.
//
//  Zero-Zapier flow: this replaces the Catch-Hook → Create-Envelope Zap.
//
//  Required Worker secrets (set via `wrangler secret put` or the CF dash):
//    DOCUSIGN_INTEGRATION_KEY   — integrator key (UUID) from DocuSign admin
//    DOCUSIGN_USER_GUID         — DocuSign user API ID (UUID) — the sending user
//    DOCUSIGN_ACCOUNT_ID        — DocuSign account ID (UUID; ours: 6b65537a-…)
//    DOCUSIGN_TEMPLATE_ID       — the belt-test waiver template ID
//    DOCUSIGN_RSA_PRIVATE_KEY   — PEM-formatted RSA private key (BEGIN…END lines)
//    DOCUSIGN_BASE_URI          — e.g. https://na4.docusign.net (no /restapi suffix)
//
//  Optional / defaults:
//    DOCUSIGN_OAUTH_HOST        — defaults to "account.docusign.com" (prod).
//                                 Use "account-d.docusign.com" for the demo env.
//    DOCUSIGN_WEBHOOK_URL       — where DocuSign Connect posts envelope events.
//                                 Not used at envelope-create time; set once in
//                                 the DocuSign Admin → Connect settings.
//
//  Docs:
//    JWT grant   → https://developers.docusign.com/platform/auth/jwt/jwt-grant/
//    Envelopes   → https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/create/
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KV_KEY = 'docusign:access_token';
const TOKEN_TTL_SECONDS = 3300; // token good for 1h, refresh at 55min

// ─── Base64URL helpers ──────────────────────────────────────────────────────

function b64urlEncode(bytes) {
  // bytes: Uint8Array or ArrayBuffer
  const u8 = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let str = '';
  for (let i = 0; i < u8.length; i++) str += String.fromCharCode(u8[i]);
  return btoa(str).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlEncodeString(s) {
  const bytes = new TextEncoder().encode(s);
  return b64urlEncode(bytes);
}

// ─── PEM → CryptoKey ────────────────────────────────────────────────────────

// Normalise however the key was pasted (dashboard single-line, literal "\\n"
// escapes, surrounding quotes, CRLF) back into a clean PEM body.
function normalisePem(pem) {
  return String(pem || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\r\\n|\\n|\\r/g, '\n');
}

function pemToArrayBuffer(pem) {
  const b64 = normalisePem(pem)
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/[^A-Za-z0-9+/=]/g, '')
    .replace(/=+$/, '');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// Non-secret description of the configured key, for diagnostics only.
export function describeKey(pem) {
  const n = normalisePem(pem);
  const header = (n.match(/-----BEGIN ([^-]+)-----/) || [])[1] || 'none';
  const body = n.replace(/-----(BEGIN|END) [^-]+-----/g, '');
  const stray = body.replace(/[A-Za-z0-9+/=\s]/g, '');
  return {
    present: !!pem,
    header,
    hasFooter: /-----END [^-]+-----/.test(n),
    bodyChars: body.replace(/\s/g, '').length,
    strayChars: stray.length,
    looksLikePublicKey: /PUBLIC KEY/.test(header),
  };
}

export async function importRsaPrivateKey(pem) {
  // DocuSign gives PKCS#8 keys (BEGIN PRIVATE KEY) *or* PKCS#1 (BEGIN RSA
  // PRIVATE KEY). Cloudflare's SubtleCrypto only accepts PKCS#8. If the PEM
  // header is PKCS#1 we transcode.
  const isPkcs1 = /-----BEGIN RSA PRIVATE KEY-----/.test(pem);
  let keyBuf = pemToArrayBuffer(pem);
  if (isPkcs1) keyBuf = wrapPkcs1AsPkcs8(keyBuf);
  return crypto.subtle.importKey(
    'pkcs8',
    keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

// PKCS#1 → PKCS#8 wrapper. Prepends the standard PKCS#8 preamble bytes so
// crypto.subtle will accept the key. See RFC 5208.
function wrapPkcs1AsPkcs8(pkcs1Buf) {
  const pkcs1 = new Uint8Array(pkcs1Buf);
  // Header: version(0) + AlgorithmIdentifier(rsaEncryption) + OCTET STRING wrapper
  const preamble = new Uint8Array([
    0x30, 0x82, 0x00, 0x00, // SEQUENCE, length placeholder (we'll fix)
    0x02, 0x01, 0x00,       // INTEGER 0 (version)
    0x30, 0x0D,             // SEQUENCE (AlgorithmIdentifier), length 13
    0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, // OID 1.2.840.113549.1.1.1
    0x05, 0x00,             // NULL
    0x04, 0x82, 0x00, 0x00, // OCTET STRING, length placeholder
  ]);
  // Set OCTET STRING length
  preamble[preamble.length - 2] = (pkcs1.length >> 8) & 0xFF;
  preamble[preamble.length - 1] = pkcs1.length & 0xFF;
  const totalLen = (preamble.length - 4) + pkcs1.length; // -4 accounts for the outer SEQUENCE length bytes
  preamble[2] = (totalLen >> 8) & 0xFF;
  preamble[3] = totalLen & 0xFF;

  const out = new Uint8Array(preamble.length + pkcs1.length);
  out.set(preamble, 0);
  out.set(pkcs1, preamble.length);
  return out.buffer;
}

// ─── JWT sign + token exchange ──────────────────────────────────────────────

async function signJwt(env) {
  const iss = env.DOCUSIGN_INTEGRATION_KEY;
  const sub = env.DOCUSIGN_USER_GUID;
  const aud = env.DOCUSIGN_OAUTH_HOST || 'account.docusign.com';
  if (!iss || !sub) throw new Error('DocuSign integration key/user GUID missing');
  if (!env.DOCUSIGN_RSA_PRIVATE_KEY) throw new Error('DOCUSIGN_RSA_PRIVATE_KEY missing');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss,
    sub,
    aud,
    iat: now,
    exp: now + 3600,
    scope: 'signature impersonation',
  };

  const encHeader = b64urlEncodeString(JSON.stringify(header));
  const encPayload = b64urlEncodeString(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;

  const key = await importRsaPrivateKey(env.DOCUSIGN_RSA_PRIVATE_KEY);
  const sigBuf = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(signingInput),
  );
  const encSig = b64urlEncode(sigBuf);
  return `${signingInput}.${encSig}`;
}

async function fetchAccessToken(env) {
  const host = env.DOCUSIGN_OAUTH_HOST || 'account.docusign.com';
  const jwt = await signJwt(env);
  const res = await fetch(`https://${host}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const consent = data.error === 'consent_required';
    const msg = consent
      ? `DocuSign consent required. Grant consent once by visiting: https://${host}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${env.DOCUSIGN_INTEGRATION_KEY}&redirect_uri=https://ima.rob-hayes.com/belt-testing/docusign-consent-callback`
      : `DocuSign token exchange failed (${res.status}): ${JSON.stringify(data)}`;
    throw new Error(msg);
  }
  return data.access_token;
}

// ─── Authorization Code Grant (no RSA key needed) ───────────────────────────
// The site owner clicks "Connect DocuSign" in the admin and signs in once.
// We keep the refresh token in KV; with the `extended` scope each refresh
// renews it for another 30 days, and a daily cron keeps it alive.
// Works as a confidential client (DOCUSIGN_SECRET_KEY set) or a public
// client with PKCE (no secret key).
const OAUTH_KV_KEY = 'docusign:oauth';
const OAUTH_STATE_PREFIX = 'docusign:oauth-state:';

function oauthHost(env) { return env.DOCUSIGN_OAUTH_HOST || 'account.docusign.com'; }
export function oauthRedirectUri(env) {
  return `${(env.PUBLIC_BASE_URL || 'https://ima.rob-hayes.com').replace(/\/$/, '')}/admin/api/docusign/callback`;
}
async function getOAuthRecord(env) {
  try { const raw = await env.IMA_KARATE.get(OAUTH_KV_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function randomB64url(n) { return b64urlEncode(crypto.getRandomValues(new Uint8Array(n)).buffer); }

async function tokenRequest(env, params, host = oauthHost(env)) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const body = new URLSearchParams(params);
  if (env.DOCUSIGN_SECRET_KEY) {
    headers.Authorization = 'Basic ' + btoa(`${env.DOCUSIGN_INTEGRATION_KEY}:${env.DOCUSIGN_SECRET_KEY}`);
  } else {
    body.set('client_id', env.DOCUSIGN_INTEGRATION_KEY);
  }
  const res = await fetch(`https://${host}/oauth/token`, { method: 'POST', headers, body: body.toString() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`DocuSign sign-in failed (${res.status}): ${data.error || ''} ${data.error_description || ''}`.trim());
  return data;
}

/** Step 1: build the DocuSign sign-in URL (state + PKCE stored for 10 min). */
export const SANDBOX_HOST = 'account-d.docusign.com';
export async function startOAuth(env, { sandbox = false } = {}) {
  if (!env.DOCUSIGN_INTEGRATION_KEY) throw new Error('DOCUSIGN_INTEGRATION_KEY is not set');
  const host = sandbox ? SANDBOX_HOST : oauthHost(env);
  const state = randomB64url(24);
  const verifier = randomB64url(48);
  const challenge = b64urlEncode(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  await env.IMA_KARATE.put(OAUTH_STATE_PREFIX + state, JSON.stringify({ verifier, host }), { expirationTtl: 600 });
  const q = new URLSearchParams({
    response_type: 'code',
    scope: 'signature extended',
    client_id: env.DOCUSIGN_INTEGRATION_KEY,
    redirect_uri: oauthRedirectUri(env),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `https://${host}/oauth/auth?${q}`;
}

/** Step 2: DocuSign redirects back with ?code&state — exchange + store. */
export async function finishOAuth(env, code, state) {
  if (!code || !state || !/^[A-Za-z0-9_-]{20,64}$/.test(state)) throw new Error('Missing or invalid sign-in response');
  const stashed = await env.IMA_KARATE.get(OAUTH_STATE_PREFIX + state);
  let verifier = stashed, host = oauthHost(env);
  try { const j = JSON.parse(stashed); verifier = j.verifier; host = j.host || host; } catch {}
  if (!host.endsWith('.docusign.com')) host = oauthHost(env);
  if (!verifier) throw new Error('This sign-in link expired. Go back to the admin and click Connect DocuSign again.');
  await env.IMA_KARATE.delete(OAUTH_STATE_PREFIX + state);
  const tok = await tokenRequest(env, { grant_type: 'authorization_code', code, code_verifier: verifier }, host);
  if (!tok.refresh_token) throw new Error('DocuSign did not return a refresh token');
  const uiRes = await fetch(`https://${host}/oauth/userinfo`, { headers: { Authorization: `Bearer ${tok.access_token}` } });
  const ui = await uiRes.json().catch(() => ({}));
  const accounts = ui.accounts || [];
  const acct = accounts.find((a) => a.account_id === env.DOCUSIGN_ACCOUNT_ID) || accounts.find((a) => a.is_default) || accounts[0];
  if (!acct) throw new Error('No DocuSign account found for this login');
  const record = {
    refreshToken: tok.refresh_token, host, sandbox: host === SANDBOX_HOST,
    accountId: acct.account_id, baseUri: acct.base_uri, accountName: acct.account_name || '',
    userName: ui.name || '', email: ui.email || '', userId: ui.sub || '',
    connectedAt: new Date().toISOString(), refreshedAt: new Date().toISOString(),
  };
  await env.IMA_KARATE.put(OAUTH_KV_KEY, JSON.stringify(record));
  await env.IMA_KARATE.put(TOKEN_KV_KEY, tok.access_token, { expirationTtl: Math.max(300, (tok.expires_in || 28800) - 600) });
  return record;
}

async function refreshOAuth(env, record) {
  const tok = await tokenRequest(env, { grant_type: 'refresh_token', refresh_token: record.refreshToken }, record.host || oauthHost(env));
  const updated = { ...record, refreshToken: tok.refresh_token || record.refreshToken, refreshedAt: new Date().toISOString(), lastError: undefined };
  await env.IMA_KARATE.put(OAUTH_KV_KEY, JSON.stringify(updated));
  await env.IMA_KARATE.put(TOKEN_KV_KEY, tok.access_token, { expirationTtl: Math.max(300, (tok.expires_in || 28800) - 600) });
  return tok.access_token;
}

export async function disconnectOAuth(env) {
  await env.IMA_KARATE.delete(OAUTH_KV_KEY);
  await env.IMA_KARATE.delete(TOKEN_KV_KEY);
}

/** Connection status for the admin (no secrets). */
export async function connectionStatus(env) {
  const r = await getOAuthRecord(env);
  if (r) return { mode: 'signin', connected: true, sandbox: !!r.sandbox, userName: r.userName, email: r.email, accountName: r.accountName, connectedAt: r.connectedAt, refreshedAt: r.refreshedAt, lastError: r.lastError || null, redirectUri: oauthRedirectUri(env) };
  const k = describeKey(env.DOCUSIGN_RSA_PRIVATE_KEY);
  return { mode: k.header !== 'none' ? 'jwt' : 'none', connected: false, redirectUri: oauthRedirectUri(env) };
}

/** Daily cron: refresh so the 30-day refresh token never lapses. */
export async function docusignKeepAlive(env) {
  const r = await getOAuthRecord(env);
  if (!r) return { skipped: true };
  try {
    await refreshOAuth(env, r);
    return { ok: true };
  } catch (e) {
    await env.IMA_KARATE.put(OAUTH_KV_KEY, JSON.stringify({ ...r, lastError: `${new Date().toISOString()}: ${e.message}` }));
    return { ok: false, error: e.message };
  }
}

async function getAccessToken(env) {
  // Cache the access token in KV so we don't sign a JWT on every request.
  try {
    const cached = await env.IMA_KARATE.get(TOKEN_KV_KEY);
    if (cached) return cached;
  } catch { /* ignore KV read errors */ }
  // Prefer the one-time sign-in connection; fall back to JWT (RSA key).
  const oauth = await getOAuthRecord(env);
  if (oauth) return refreshOAuth(env, oauth);
  const token = await fetchAccessToken(env);
  try {
    await env.IMA_KARATE.put(TOKEN_KV_KEY, token, { expirationTtl: TOKEN_TTL_SECONDS });
  } catch { /* ignore KV write errors */ }
  return token;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Diagnostic: verify the DocuSign JWT credentials by exchanging the token
 * (skips the KV cache so this always tests the real credentials).
 * No envelope is created or sent.
 */
export async function testConnection(env) {
  const oauth = await getOAuthRecord(env);
  if (oauth) {
    try {
      await refreshOAuth(env, oauth);
      return { ok: true, mode: 'signin', hint: `Connected to DocuSign as ${oauth.userName || oauth.email} (${oauth.accountName}).` };
    } catch (e) {
      return { ok: false, mode: 'signin', error: e.message, hint: 'The DocuSign sign-in has expired or was revoked. Click Connect DocuSign to sign in again.' };
    }
  }
  if (describeKey(env.DOCUSIGN_RSA_PRIVATE_KEY).header === 'none') {
    return { ok: false, mode: 'none', hint: 'DocuSign is not connected yet. Click Connect DocuSign and sign in once.' };
  }
  try {
    const token = await fetchAccessToken(env);
    return { ok: true, hint: 'JWT grant succeeded — credentials and consent are valid.' };
  } catch (e) {
    const msg = String(e.message || e);
    let hint = 'Token exchange failed.';
    if (/consent/i.test(msg)) hint = 'The sending user has not granted consent to this integration key yet. Visit the consent URL (see docs/belt-testing-setup.md) once while logged in as the sending user.';
    else if (/invalid_grant/i.test(msg)) hint = 'DocuSign rejected the grant — check DOCUSIGN_USER_GUID and that the RSA key matches the integration key.';
    if (/atob|base64|importKey|pkcs8|DataError/i.test(msg)) hint = 'The RSA private key could not be read. Re-paste the full private key (including the BEGIN/END lines) into DOCUSIGN_RSA_PRIVATE_KEY.';
    return { ok: false, error: msg, hint, key: describeKey(env.DOCUSIGN_RSA_PRIVATE_KEY) };
  }
}


/**
 * Send a belt-test waiver via DocuSign, using the configured template and
 * filling every tab from the application data.
 *
 * @param {object} env Worker env
 * @param {object} payload  Result of buildDocusignPayload() in beltRoutes.js
 * @returns {Promise<{envelopeId: string, status: string}>}
 */
// Embedded waiver document (docs/kyu-belt-testing-template.pdf, anchors in
// white). Used when DOCUSIGN_TEMPLATE_ID is not set — the envelope is built
// directly from this document with anchor-based tabs, so no DocuSign template
// needs to exist in the account.
const WAIVER_PDF_B64 = 'JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSIC9GMiAzIDAgUgo+PgplbmRvYmoKMiAwIG9iago8PAovQmFzZUZvbnQgL0hlbHZldGljYSAvRW5jb2RpbmcgL1dpbkFuc2lFbmNvZGluZyAvTmFtZSAvRjEgL1N1YnR5cGUgL1R5cGUxIC9UeXBlIC9Gb250Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQgL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcgL05hbWUgL0YyIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udAo+PgplbmRvYmoKNCAwIG9iago8PAovQ29udGVudHMgOCAwIFIgL01lZGlhQm94IFsgMCAwIDYxMiA3OTIgXSAvUGFyZW50IDcgMCBSIC9SZXNvdXJjZXMgPDwKL0ZvbnQgMSAwIFIgL1Byb2NTZXQgWyAvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJIF0KPj4gL1JvdGF0ZSAwIC9UcmFucyA8PAoKPj4gCiAgL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1BhZ2VNb2RlIC9Vc2VOb25lIC9QYWdlcyA3IDAgUiAvVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKNiAwIG9iago8PAovQXV0aG9yIChhbm9ueW1vdXMpIC9DcmVhdGlvbkRhdGUgKEQ6MjAyNjEwMjExNDUwMjArMDAnMDAnKSAvQ3JlYXRvciAoYW5vbnltb3VzKSAvS2V5d29yZHMgKCkgL01vZERhdGUgKEQ6MjAyNjEwMjExNDUwMjArMDAnMDAnKSAvUHJvZHVjZXIgKFJlcG9ydExhYiBQREYgTGlicmFyeSAtIFwob3BlbnNvdXJjZVwpKSAKICAvU3ViamVjdCAodW5zcGVjaWZpZWQpIC9UaXRsZSAodW50aXRsZWQpIC9UcmFwcGVkIC9GYWxzZQo+PgplbmRvYmoKNyAwIG9iago8PAovQ291bnQgMSAvS2lkcyBbIDQgMCBSIF0gL1R5cGUgL1BhZ2VzCj4+CmVuZG9iago4IDAgb2JqCjw8Ci9GaWx0ZXIgWyAvQVNDSUk4NURlY29kZSAvRmxhdGVEZWNvZGUgXSAvTGVuZ3RoIDE2ODAKPj4Kc3RyZWFtCkdhdG4nQ010K08nU2FCczx1YnFkWCotRUpGK0ZBYyllaGhaUSFCUEtHODRnO0E3YzYwb28qJi5QREZfJ2EtV0whNkZVWUsrVjooImY/Xl4vKzhcJFAjW2FrOC84S2QiKjAvP1NMX0lqMiZHTE8iYVFHOCU/ZU9US191b21haklcb01TUXFZNmEnTDNRSE8xKlpyKC4/OUInMGomMzRZWEE7XmRmPiNUbXRLX29bImw2VShJNV9yVSl0NSdvTjlCOXNFUStocmEvcE8tKnROLWhfMkdnRmAwI0xMLXBvcEo0VmNUKDteRSknTDtUNjBOLWsrWkdQTmNAZ1RpO0ZzXFUnTmM6LGY+WyVCcDlCTytqMSlZVSwzbFRBcidyVE9KO1JeIW1cZjZnXEhoQkpPZy1MXFJWKC9URVQjLzFsMTs/IjdoUz5uJjRfc146az5DYSE4WltERDchYzgxYzxjQmkyT1lKN1ZrbUZYTl0zZFZWRGxYZTlRb1E6VC1jVzEhJUEyKGVNLzk9YmBRUUpQRmJEKyhJLks0WyIuNFkmKThKLGBxXi4oQ3NfTEktP25AYlVSNlErLlA6L2tWaytCSEJlbk51ZTV1V0pxbltWdTYvTm9ISyhEYFMnQUdxMC0nXzd0KTU6P001VyZfOGx1dGhKKkdwOVRLVDxOMXM2JCRGU0pJNEkvMnQzLTdnWU4oSitbNllbTi1rZ2JRIkFiNmEtMDo2Xzo0RkdHU01VUU40MDM4anEnbXBsZ24mZFk5TSpdcCRTPEs5WF9gMl5fP2xfYCFBVnUpQEs6MlJHa042aGgwPCVuaVtZOCdUaSZYI2tmWS06PUMhRzc7ZTwuKjFRKSJhYy4mS1Y+SzI+KG8xPitfLUtpJjhVb1o7UGMnPzVbb1o+UExxLDhKR1FHQ0k5W0xhTDJsU0ljOiNPVUM1Q1M9PDtvLDcyNFpaM09UM2ZNOXFXUzI5TmouQSc+PGlBXDk4Z21tRS0nR2JOTS9YSjdDNlw4JixmJSRfK2h1b1NpM1lBQGNScGdzJkJiOS5YXGVePyxfLy50TC1VXmZTWzpsJUJZNUFGM2BfUGxDOyhQUl9pVWheNl4mUDcyPUNYQmhHVlgvP19YWy1tYTZQUGBaLjg7RjtuTlJUcClQOSFENUNTSGdgTy9qR2hkdWZWM1o/OyFFaituNko2K1k9cDhubXJSWVgvZUxyZjhhazNkQlR1Zis+WEZdXEomNUYxQHMudChyZmYwam1rLmA5Z2NzTzwpJDtxamNIUl9yJUlddDx0UkkkNzdQS2M9VWcjJjFOMCRkb2hTIi5eYlppJnI3YFFuNCNAdSM/OCIzJmlOLjluUFlNPkpOYiFAYmM/aWgiVjZOVSsnUUpEXz4jPD1bRVwsdVYoNEQ9J1YtbFQpU1xtbjRjI0paV2RHMiJuayY6W2dGc1BJP3NPQE8zV1s7SkxxJGklQnNOKUhfJSc7anNFaF0zcm08OG9yOj45UlNYRlFGcz45OmJBN2tLYSxpZlk0UHNrWEY3Jy8hayI6cSZFPVE/VXFlSFRAYC1zTyNraTNTLGohT09ZY2YyaiFSaU0oNHJ1ZiNAQ0tGS1YmJUt1QlgxZV5xNFk3aWsiOkxMI1pkVWdPWDkkSUE7NWo2ITomQ0xvM2JzIWQ5dW9MXTMtbUA9YkYrcm1IMDZWIlciNmwmOkhPSGtiS2I2NDI2TyVHKSkqV3BRTmdGWVtaPG9JVXQ/QjBOQms0blNhPWxfKGJTc2wrcG9CamlsOE4kQGJvTlhLakBLZDdnPF9kbjNXJjBcPTcyOT86PmRKVFpeMFteUWc1JTBsLUNlTGtjU0MiV2ZbWE5Hc1dtRDQuK05OQ3FjTiwpTUw9YFEuNFtaTElxTVRTIl07Q0ZJbFktR3InPyshQkEzOTVfQSU2OzlDJy9RSz1EaF9sTU8vKUw+XjduaG5CRTopVGlrQEVaRWE3LmYyUFQ6TSFATmtgJnJqQmRlQE9CQlprb1BXbVs7cGJaMWhQMHJlaVU4PF1tcilxM2AzPlJpPF9yLHIjNDgxISlYZTpXJUBOWXVlaU03cyQ4UkhiU25ZWXEqIyNYSUFvRE4sJVJScVVBV21BN1NrdEUtXGtPOGZjbjApM3NgYFdSaTRXcEhFXTc6Oz5YaF0kLCVGJEQyYUFrYW5CTzI4X1FzbUtrTGkkJFY9LlglPypFamd0dVRAMFM+UXJJPmtvcjxJZE8+VDN+PmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDkKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDYxIDAwMDAwIG4gCjAwMDAwMDAxMDIgMDAwMDAgbiAKMDAwMDAwMDIwOSAwMDAwMCBuIAowMDAwMDAwMzIxIDAwMDAwIG4gCjAwMDAwMDA1MTQgMDAwMDAgbiAKMDAwMDAwMDU4MiAwMDAwMCBuIAowMDAwMDAwODQzIDAwMDAwIG4gCjAwMDAwMDA5MDIgMDAwMDAgbiAKdHJhaWxlcgo8PAovSUQgCls8MTNiYzc0NTMyNTlkNDRjYjlhNTU1NGZjMTE5NjFkMGI+PDEzYmM3NDUzMjU5ZDQ0Y2I5YTU1NTRmYzExOTYxZDBiPl0KJSBSZXBvcnRMYWIgZ2VuZXJhdGVkIFBERiBkb2N1bWVudCAtLSBkaWdlc3QgKG9wZW5zb3VyY2UpCgovSW5mbyA2IDAgUgovUm9vdCA1IDAgUgovU2l6ZSA5Cj4+CnN0YXJ0eHJlZgoyNjczCiUlRU9GCg==';

const ANCHOR_LABELS = [
  'salutation', 'first_name', 'middle_name', 'last_name', 'age',
  'membership_number', 'present_belt', 'email', 'phone', 'dojo',
  'tier_label', 'tier_id', 'base_amount', 'manual_amount', 'late_amount',
  'total_amount', 'wants_manual', 'is_late', 'test_date', 'testing_time', 'dojo_location',
];

export const BELT_TEST_SOURCE = 'ima-belt-test';
export const TEMPLATE_NAME = 'IMA Kyu Belt Test - Application & Waiver';
const SIGNER_ROLE = 'Student';

async function dsBase(env) {
  const rec = await getOAuthRecord(env);
  const accountId = rec?.accountId || env.DOCUSIGN_ACCOUNT_ID;
  const baseUri = rec?.baseUri || env.DOCUSIGN_BASE_URI;
  if (!accountId || !baseUri) throw new Error('DocuSign env missing DOCUSIGN_ACCOUNT_ID / DOCUSIGN_BASE_URI');
  return `${baseUri.replace(/\/$/, '')}/restapi/v2.1/accounts/${accountId}`;
}

// Authenticated DocuSign REST call. Retries once with a fresh token on 401.
async function dsFetch(env, path, init = {}, retried = false) {
  const token = await getAccessToken(env);
  const res = await fetch((await dsBase(env)) + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (res.status === 401 && !retried) {
    try { await env.IMA_KARATE.delete(TOKEN_KV_KEY); } catch {}
    return dsFetch(env, path, init, true);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`DocuSign ${init.method || 'GET'} ${path.split('?')[0]} failed (${res.status}): ${JSON.stringify(data).slice(0, 400)}`);
  return data;
}

function siteBase(env) {
  return (env.PUBLIC_BASE_URL || 'https://ima.rob-hayes.com').replace(/\/$/, '');
}

// Envelope custom fields: visible + searchable in DocuSign (Manage > filters),
// and used by the webhook to tie an envelope back to a student.
function beltCustomFields(payload) {
  const t = payload.tabs || {};
  const f = (name, value, show = 'true') => ({ name, value: String(value ?? '').slice(0, 100), show, required: 'false' });
  return {
    textCustomFields: [
      f('Source', BELT_TEST_SOURCE, 'false'),
      f('memberId', payload.metadata?.memberId || '', 'false'),
      f('Student', payload.signerName),
      f('Belt tier', t.tier_label || ''),
      f('Present belt', t.present_belt || ''),
      f('Test date', payload.testDateDisplay || payload.testDate || ''),
      f('Total paid', t.total_amount ? `$${t.total_amount}` : ''),
    ],
  };
}

// Per-envelope status callback: no account-level Connect setup required.
function beltEventNotification(env) {
  return {
    url: `${siteBase(env)}/belt-testing/docusign-connect`,
    requireAcknowledgment: 'true',
    loggingEnabled: 'true',
    deliveryMode: 'SIM',
    events: ['envelope-sent', 'envelope-delivered', 'envelope-completed', 'envelope-declined', 'envelope-voided'],
    eventData: { version: 'restv2.1', format: 'json', includeData: ['custom_fields'] },
  };
}

function anchoredTabs(values, { locked }) {
  const textTabs = ANCHOR_LABELS
    .filter((label) => values === null || values[label] !== undefined)
    .map((label) => ({
      tabLabel: label,
      ...(values ? { value: String(values[label] ?? '') } : {}),
      anchorString: '\\' + label + '\\',
      anchorXOffset: '0',
      anchorYOffset: '-0.02',
      anchorUnits: 'inches',
      anchorCaseSensitive: 'true',
      anchorIgnoreIfNotPresent: 'true',
      width: '160',
      locked: locked ? 'true' : 'false',
    }));
  return {
    textTabs,
    signHereTabs: [{ anchorString: '/sn1/', anchorXOffset: '0', anchorYOffset: '0' }],
    dateSignedTabs: [{ anchorString: '/ds1/', tabLabel: 'date_signed', anchorXOffset: '0', anchorYOffset: '0' }],
  };
}

/**
 * Send a belt-test waiver. Uses the DocuSign template (managed in DocuSign)
 * when a template ID is configured — admin Belt Test tab or
 * DOCUSIGN_TEMPLATE_ID — otherwise the embedded waiver PDF as a fallback.
 */
export function buildEnvelopeDefinition(env, payload) {
  const templateId = payload.templateId || env.DOCUSIGN_TEMPLATE_ID || '';
  const values = payload.tabs || {};
  const subjectName = payload.signerName ? ` - ${payload.signerName}` : '';
  const emailSubject = `IMA Belt Test${subjectName} - ${payload.testDateDisplay || payload.testDate || ''}`.slice(0, 100);
  const common = {
    emailSubject,
    emailBlurb: 'Please review and sign your IMA Karate belt test application and waiver.',
    status: 'sent',
    customFields: beltCustomFields(payload),
    eventNotification: beltEventNotification(env),
  };

  let envelopeDef;
  if (templateId) {
    envelopeDef = {
      ...common,
      templateId,
      templateRoles: [{
        roleName: SIGNER_ROLE,
        name: payload.signerName,
        email: payload.signerEmail,
        tabs: { textTabs: Object.entries(values).map(([tabLabel, v]) => ({ tabLabel, value: String(v ?? '') })) },
      }],
    };
  } else {
    envelopeDef = {
      ...common,
      documents: [{ documentId: '1', name: 'IMA Kyu Belt Test Application and Waiver.pdf', fileExtension: 'pdf', documentBase64: WAIVER_PDF_B64 }],
      recipients: { signers: [{ recipientId: '1', name: payload.signerName, email: payload.signerEmail, tabs: anchoredTabs(values, { locked: true }) }] },
    };
  }

  return envelopeDef;
}

export async function sendBeltTestEnvelope(env, payload) {
  const templateId = payload.templateId || env.DOCUSIGN_TEMPLATE_ID || '';
  const envelopeDef = buildEnvelopeDefinition(env, payload);
  const data = await dsFetch(env, '/envelopes', { method: 'POST', body: JSON.stringify(envelopeDef) });
  const folder = await fileEnvelopeInFolder(env, data.envelopeId).catch((e) => ({ ok: false, error: e.message }));
  return { envelopeId: data.envelopeId, status: data.status, usedTemplate: !!templateId, folder };
}

// Move an envelope into the "IMA Belt Tests" folder if that folder exists in
// the sending user's DocuSign account (create it once in DocuSign).
export async function fileEnvelopeInFolder(env, envelopeId) {
  const name = (env.DOCUSIGN_FOLDER_NAME || 'IMA Belt Tests').toLowerCase();
  const list = await dsFetch(env, '/folders?include=envelope_folders&sub_folder_depth=-1');
  const flat = [];
  const walk = (arr) => (arr || []).forEach((f) => { flat.push(f); walk(f.folders); });
  walk(list.folders);
  const folder = flat.find((f) => String(f.name || '').toLowerCase() === name);
  if (!folder) return { ok: false, error: 'folder not found' };
  await dsFetch(env, `/folders/${folder.folderId}`, { method: 'PUT', body: JSON.stringify({ envelopeIds: [envelopeId] }) });
  return { ok: true, folderId: folder.folderId };
}

/** Fetch an envelope's real status + custom fields straight from DocuSign. */
export async function getEnvelopeSummary(env, envelopeId) {
  if (!/^[0-9a-f-]{36}$/i.test(envelopeId)) throw new Error('bad envelope id');
  const e = await dsFetch(env, `/envelopes/${envelopeId}?include=custom_fields`);
  const fields = {};
  (e.customFields?.textCustomFields || []).forEach((f) => { fields[f.name] = f.value; });
  return { envelopeId, status: e.status, completedDateTime: e.completedDateTime || null, sentDateTime: e.sentDateTime || null, fields };
}

/** List belt-test envelopes (sent from the site) for the admin view. */
export async function listBeltTestEnvelopes(env, { days = 365 } = {}) {
  const from = new Date(Date.now() - days * 864e5).toISOString();
  const q = new URLSearchParams({ from_date: from, include: 'custom_fields,recipients', order: 'desc', order_by: 'created', count: '100' });
  q.append('custom_field', `Source=${BELT_TEST_SOURCE}`);
  const data = await dsFetch(env, `/envelopes?${q}`);
  return (data.envelopes || []).map((e) => {
    const fields = {};
    (e.customFields?.textCustomFields || []).forEach((f) => { fields[f.name] = f.value; });
    const signer = e.recipients?.signers?.[0] || {};
    return {
      envelopeId: e.envelopeId, status: e.status, subject: e.emailSubject,
      student: fields.Student || signer.name || '', email: signer.email || '',
      beltTier: fields['Belt tier'] || '', testDate: fields['Test date'] || '',
      sentDateTime: e.sentDateTime || null, completedDateTime: e.completedDateTime || null,
    };
  });
}

/**
 * Create the belt-test waiver as a reusable DocuSign template (one-time).
 * After this the waiver wording/layout is managed inside DocuSign; the site
 * fills the same tab labels by role "Student".
 */
export async function createBeltTestTemplate(env) {
  const body = {
    name: TEMPLATE_NAME,
    description: 'Sent automatically by ima.rob-hayes.com after belt-test payment. Tab labels must stay the same for the site to pre-fill them.',
    shared: 'false',
    emailSubject: 'IMA Belt Test - Application & Waiver',
    documents: [{ documentId: '1', name: 'IMA Kyu Belt Test Application and Waiver.pdf', fileExtension: 'pdf', documentBase64: WAIVER_PDF_B64 }],
    recipients: { signers: [{ recipientId: '1', roleName: SIGNER_ROLE, routingOrder: '1', tabs: anchoredTabs(null, { locked: true }) }] },
    status: 'created',
  };
  const data = await dsFetch(env, '/templates', { method: 'POST', body: JSON.stringify(body) });
  return { templateId: data.templateId, name: data.name || TEMPLATE_NAME };
}

/** Find an existing template by name (avoids creating duplicates). */
export async function findBeltTestTemplate(env) {
  const data = await dsFetch(env, `/templates?search_text=${encodeURIComponent('IMA Kyu Belt Test')}`);
  const t = (data.envelopeTemplates || []).find((x) => x.name === TEMPLATE_NAME);
  return t ? { templateId: t.templateId, name: t.name } : null;
}

/**
 * Verify a DocuSign Connect webhook by checking the HMAC signature header.
 * Returns true if the payload is valid or if no HMAC secret is configured
 * (signature-checking is opt-in in DocuSign Connect).
 */
export async function verifyConnectSignature(env, rawBody, signatureHeader) {
  if (!env.DOCUSIGN_CONNECT_HMAC_KEY) return true; // opt-in
  if (!signatureHeader) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.DOCUSIGN_CONNECT_HMAC_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64 === signatureHeader;
}

/**
 * Sandbox only: make the error-free eSignature API calls DocuSign's Go-Live
 * review looks for, while exercising the real waiver against DocuSign.
 * Creates DRAFT envelopes (status "created" — nothing is emailed), one per
 * call, alternating the template path and the embedded-PDF path, then moves
 * them to the recycle bin. No envelope is read twice (polling rules).
 */
export async function runGoLiveCalls(env, count = 20) {
  const rec = await getOAuthRecord(env);
  if (!rec?.sandbox) throw new Error('Connect the DocuSign sandbox first (Go-Live test calls only run there).');
  const results = { template: null, created: [], errors: [] };
  let tpl = await findBeltTestTemplate(env).catch((e) => { results.errors.push(e.message); return null; });
  if (!tpl) tpl = await createBeltTestTemplate(env).catch((e) => { results.errors.push(e.message); return null; });
  results.template = tpl;
  const sample = {
    signerName: 'Go-Live Test Student', signerEmail: rec.email || 'test@example.com',
    testDate: '2026-11-21', testDateDisplay: 'November 21, 2026', metadata: { memberId: 'golive-test' },
    tabs: { first_name: 'Test', last_name: 'Student', tier_label: 'White to Yellow', present_belt: 'White', total_amount: '135.00', test_date: 'November 21, 2026' },
  };
  for (let i = 0; i < count; i++) {
    const useTemplate = tpl && i % 2 === 0;
    try {
      const body = buildEnvelopeDefinition(env, { ...sample, templateId: useTemplate ? tpl.templateId : '' });
      body.status = 'created';
      delete body.eventNotification;
      const r = await dsFetch(env, '/envelopes', { method: 'POST', body: JSON.stringify(body) });
      results.created.push(r.envelopeId);
    } catch (e) { results.errors.push(e.message); }
  }
  if (results.created.length) {
    await dsFetch(env, '/folders/recyclebin', { method: 'PUT', body: JSON.stringify({ envelopeIds: results.created }) })
      .catch((e) => results.errors.push('cleanup: ' + e.message));
  }
  return { ok: results.errors.length === 0, calls: results.created.length + (tpl ? 2 : 1) + 1, ...results };
}

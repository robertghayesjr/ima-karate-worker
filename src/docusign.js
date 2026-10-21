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

function pemToArrayBuffer(pem) {
  // Strip PEM header/footer and whitespace
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function importRsaPrivateKey(pem) {
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

async function getAccessToken(env) {
  // Cache the access token in KV so we don't sign a JWT on every request.
  try {
    const cached = await env.IMA_KARATE.get(TOKEN_KV_KEY);
    if (cached) return cached;
  } catch { /* ignore KV read errors */ }
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
  try {
    const token = await fetchAccessToken(env);
    return { ok: true, hint: 'JWT grant succeeded — credentials and consent are valid.' };
  } catch (e) {
    const msg = String(e.message || e);
    let hint = 'Token exchange failed.';
    if (/consent/i.test(msg)) hint = 'The sending user has not granted consent to this integration key yet. Visit the consent URL (see docs/belt-testing-setup.md) once while logged in as the sending user.';
    else if (/invalid_grant/i.test(msg)) hint = 'DocuSign rejected the grant — check DOCUSIGN_USER_GUID and that the RSA key matches the integration key.';
    return { ok: false, error: msg, hint };
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

export async function sendBeltTestEnvelope(env, payload) {
  const accountId = env.DOCUSIGN_ACCOUNT_ID;
  const templateId = env.DOCUSIGN_TEMPLATE_ID; // optional — document path used when unset
  const baseUri = env.DOCUSIGN_BASE_URI;
  if (!accountId || !baseUri) {
    throw new Error('DocuSign env missing DOCUSIGN_ACCOUNT_ID / DOCUSIGN_BASE_URI');
  }

  const accessToken = await getAccessToken(env);

  // Convert the flat `tabs` map into the DocuSign textTabs array.
  const textTabs = Object.entries(payload.tabs || {}).map(([label, value]) => ({
    tabLabel: label,
    value: String(value ?? ''),
  }));

  const customFields = {
    textCustomFields: [
      { name: 'memberId', value: payload.metadata?.memberId || '', required: 'false', show: 'false' },
    ],
  };
  const emailSubject = `IMA Karate belt test — sign for ${payload.testDateDisplay || payload.testDate}`;

  let envelopeDef;
  if (templateId) {
    // Template path (if a template exists in the account).
    envelopeDef = {
      emailSubject,
      status: 'sent',
      templateId,
      templateRoles: [
        {
          roleName: 'Student',
          name: payload.signerName,
          email: payload.signerEmail,
          tabs: { textTabs },
        },
      ],
      customFields,
    };
  } else {
    // Document path — anchor-based tabs on the embedded waiver PDF.
    // Each field's anchor string is \label\ (white text in the document);
    // the signature anchor is /sn1/ and the date-signed anchor is /ds1/.
    const anchoredTextTabs = ANCHOR_LABELS
      .filter((label) => payload.tabs?.[label] !== undefined)
      .map((label) => ({
        tabLabel: label,
        value: String(payload.tabs[label] ?? ''),
        anchorString: '\\' + label + '\\',
        anchorXOffset: '0',
        anchorYOffset: '-0.02',
        anchorCaseSensitive: 'true',
        width: '160',
      }));
    envelopeDef = {
      emailSubject,
      status: 'sent',
      documents: [
        {
          documentId: '1',
          name: 'IMA Kyu Belt Test Application and Waiver.pdf',
          fileExtension: 'pdf',
          documentBase64: WAIVER_PDF_B64,
        },
      ],
      recipients: {
        signers: [
          {
            recipientId: '1',
            name: payload.signerName,
            email: payload.signerEmail,
            tabs: {
              textTabs: anchoredTextTabs,
              signHereTabs: [
                { anchorString: '/sn1/', anchorXOffset: '0', anchorYOffset: '0' },
              ],
              dateSignedTabs: [
                { anchorString: '/ds1/', tabLabel: 'date_signed', anchorXOffset: '0', anchorYOffset: '0' },
              ],
            },
          },
        ],
      },
      customFields,
    };
  }

  const url = `${baseUri.replace(/\/$/, '')}/restapi/v2.1/accounts/${accountId}/envelopes`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envelopeDef),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // If the token was rejected, blow the cache once and retry.
    if (res.status === 401) {
      try { await env.IMA_KARATE.delete(TOKEN_KV_KEY); } catch {}
    }
    throw new Error(`DocuSign create-envelope failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return { envelopeId: data.envelopeId, status: data.status };
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

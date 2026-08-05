// ─────────────────────────────────────────────────────────────────────────────
//  Memberstack Admin API client — Cloudflare Worker–safe (fetch only).
//  Docs: https://docs.memberstack.com/hc/en-us/articles/22335358881819
// ─────────────────────────────────────────────────────────────────────────────

const MS_BASE = 'https://admin.memberstack.com';

function headers(env) {
  const key = env.MEMBERSTACK_SECRET_KEY;
  if (!key) throw new Error('MEMBERSTACK_SECRET_KEY is not set');
  return {
    'X-API-KEY': key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function req(env, path, init = {}) {
  const res = await fetch(MS_BASE + path, {
    ...init,
    headers: { ...headers(env), ...(init.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON — keep raw text
  }
  if (!res.ok) {
    const msg = data?.message || text || res.statusText;
    const err = new Error(`Memberstack ${res.status}: ${msg}`);
    err.status = res.status;
    err.body = data ?? text;
    throw err;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Lookups
// ─────────────────────────────────────────────────────────────────────────────

/** Try to find a member by email. Returns the member object or null. */
export async function findMemberByEmail(env, email) {
  if (!email) return null;
  const clean = String(email).trim().toLowerCase();
  try {
    // Memberstack admin API exposes GET /members?email= for exact lookup.
    const data = await req(env, `/members?email=${encodeURIComponent(clean)}`);
    // Response shape: { data: [ member, ... ] } or { data: member }.
    const arr = Array.isArray(data?.data) ? data.data : data?.data ? [data.data] : [];
    return arr.find((m) => (m.auth?.email || m.email || '').toLowerCase() === clean) || null;
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

/**
 * Search members by first + last name. Memberstack doesn't expose a native
 * name-search endpoint, so we page through /members and filter client-side.
 * Capped at 200 results to keep the Worker's CPU budget safe.
 */
export async function findMembersByName(env, firstName, lastName) {
  const fn = (firstName || '').trim().toLowerCase();
  const ln = (lastName || '').trim().toLowerCase();
  if (!fn && !ln) return [];

  const matches = [];
  let after = null;
  for (let page = 0; page < 4; page++) {
    const q = new URLSearchParams({ limit: '50' });
    if (after) q.set('after', after);
    const data = await req(env, `/members?${q}`);
    const list = data?.data || [];
    for (const m of list) {
      const memberFn = (m.customFields?.['first-name'] || m.customFields?.firstName || '').toLowerCase();
      const memberLn = (m.customFields?.['last-name'] || m.customFields?.lastName || '').toLowerCase();
      if ((!fn || memberFn === fn) && (!ln || memberLn === ln)) {
        matches.push(m);
        if (matches.length >= 25) return matches;
      }
    }
    after = data?.endCursor || null;
    if (!data?.hasNextPage || !after) break;
  }
  return matches;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update a member's custom fields and/or metadata.
 * @param {string} memberId
 * @param {{customFields?: object, metaData?: object}} patch
 */
export async function updateMember(env, memberId, patch) {
  return req(env, `/members/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Fetch a single member by id. */
export async function getMember(env, memberId) {
  try {
    return await req(env, `/members/${encodeURIComponent(memberId)}`);
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

/** Convenience: merge current belt-test progress into a member's profile. */
export async function recordBeltTestProgress(env, memberId, progress) {
  // progress = { paid?, signed?, tier?, testDate?, envelopeId? }
  const customFields = {};
  const metaData = {};
  if ('paid' in progress) customFields['belt-test-paid'] = !!progress.paid;
  if ('signed' in progress) customFields['belt-test-signed'] = !!progress.signed;
  if (progress.tier) customFields['belt-test-tier'] = progress.tier;
  if (progress.testDate) customFields['belt-test-date'] = progress.testDate;
  if (progress.envelopeId) metaData.docusignEnvelopeId = progress.envelopeId;
  if (progress.applicationJson) metaData.beltTestApplication = progress.applicationJson;
  return updateMember(env, memberId, { customFields, metaData });
}

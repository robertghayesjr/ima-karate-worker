// ─────────────────────────────────────────────────────────────────────────────
//  Belt-testing configuration (backed by the BELT_TEST KV namespace)
//  ─────────────────────────────────────────────────────────────────────────
//  KV key: "current" → JSON of BeltTestConfig
//
//  Update via `POST /__admin/belt-testing` with a bearer ADMIN_TOKEN and a
//  JSON body containing any subset of fields.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BeltTestConfig
 * @property {string} testDate              e.g. "2026-08-29"
 * @property {string} testDateDisplay       e.g. "August 29, 2026"
 * @property {string} testDay               e.g. "Saturday"
 * @property {string} lateFeeCutoff         e.g. "2026-08-27" (Thursday prior)
 * @property {string} applicationCutoff     e.g. "2026-08-27" (no apps day-of)
 * @property {string} location              e.g. "IMA Dojo — 1340 Main St., Louisville, CO"
 * @property {string} phone                 e.g. "(303) 665-0339"
 * @property {string} email                 e.g. "madani@imakarate.com"
 * @property {number} lateFeeCents          e.g. 5000
 * @property {number} manualAddonCents      e.g. 3000
 * @property {number} ccSurchargePct        e.g. 3
 * @property {string} docusignTemplateId    e.g. DocuSign template UUID (Zapier passes through)
 */

/** Sensible defaults. Written to KV on first read if the key doesn't exist. */
export const DEFAULT_CONFIG = Object.freeze({
  testDate: '2026-08-29',
  testDateDisplay: 'August 29, 2026',
  testDay: 'Saturday',
  lateFeeCutoff: '2026-08-27',
  applicationCutoff: '2026-08-27',
  location: 'IMA Dojo — 1340 Main St., Louisville, CO 80027',
  phone: '(303) 665-0339',
  email: 'madani@imakarate.com',
  lateFeeCents: 5000,
  manualAddonCents: 3000,
  ccSurchargePct: 3,
  docusignTemplateId: '',
});

const KV_KEY = 'current';

/** Read the active belt-test config, seeding defaults if missing. */
export async function getBeltConfig(env) {
  if (!env.BELT_TEST) return { ...DEFAULT_CONFIG, _source: 'defaults' };
  const raw = await env.BELT_TEST.get(KV_KEY);
  if (!raw) return { ...DEFAULT_CONFIG, _source: 'defaults' };
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed, _source: 'kv' };
  } catch {
    return { ...DEFAULT_CONFIG, _source: 'defaults-parse-error' };
  }
}

/** Overwrite the config (merges caller-supplied fields onto current). */
export async function updateBeltConfig(env, patch) {
  const current = await getBeltConfig(env);
  const next = { ...current, ...patch };
  delete next._source;
  await env.BELT_TEST.put(KV_KEY, JSON.stringify(next, null, 2));
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Belt-tier fee table (matches Kyu Testing Form v. Mar 28 2026)
// ─────────────────────────────────────────────────────────────────────────────

/** Ordered so the <select> keeps the same order as the paper form. */
export const BELT_TIERS = Object.freeze([
  {
    id: 'tiny_tiger',
    label: 'Tiny Tiger — all levels',
    priceCents: 6000,
    planEnv: 'MS_PLAN_TINY_TIGER',
    testingBlock: 'tiny_tiger',
  },
  {
    id: 'white_yellow',
    label: 'White/yellow, yellow/white and full yellow belts',
    priceCents: 13500,
    planEnv: 'MS_PLAN_WHITE_YELLOW',
    testingBlock: 'morning', // 9:30 AM
  },
  {
    id: 'orange_green',
    label: 'Orange/white stripe through full green belts',
    priceCents: 17500,
    planEnv: 'MS_PLAN_ORANGE_GREEN',
    testingBlock: 'noon', // 12:00 Noon
  },
  {
    id: 'purple_blue',
    label: 'Purple/white through blue belts',
    priceCents: 25500,
    planEnv: 'MS_PLAN_PURPLE_BLUE',
    testingBlock: 'noon',
  },
  {
    id: 'brown',
    label: 'All brown belt levels (stay after to meet with Hanshi)',
    priceCents: 36500,
    planEnv: 'MS_PLAN_BROWN',
    testingBlock: 'noon',
  },
]);

export function findTier(id) {
  return BELT_TIERS.find((t) => t.id === id);
}

/** Convert a testing block into the required arrival time (15 min before). */
export function testingTimeFor(block) {
  if (block === 'tiny_tiger') return '9:15 AM (test starts 9:30 AM)';
  if (block === 'morning') return '9:15 AM (test starts 9:30 AM)';
  if (block === 'noon') return '11:45 AM (test starts 12:00 Noon)';
  return '';
}

/** Compute the total in cents given the user's selections + config. */
export function computeTotalCents(tierId, opts, cfg) {
  const tier = findTier(tierId);
  if (!tier) throw new Error(`Unknown tier: ${tierId}`);
  let cents = tier.priceCents;
  if (opts.wantsManual && tierId !== 'brown') cents += cfg.manualAddonCents;
  if (opts.isLate) cents += cfg.lateFeeCents;
  if (opts.payByCreditCard) {
    cents = Math.round(cents * (1 + cfg.ccSurchargePct / 100));
  }
  return cents;
}

/** Is right-now past the late-fee cutoff for the configured test? */
export function isLateNow(cfg, now = new Date()) {
  const cutoff = new Date(cfg.lateFeeCutoff + 'T23:59:59-06:00'); // Mountain Time
  return now.getTime() > cutoff.getTime();
}

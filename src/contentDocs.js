// ─────────────────────────────────────────────────────────────────────────────
//  Content layer — editable content documents stored in KV, with drafts,
//  published versions, and an immutable revision history.
//
//  Model (advisor-reviewed):
//    - Published doc:   content:published:{key}      (what the site renders)
//    - Draft doc:       content:draft:{key}          (Claude writes here; preview only)
//    - Revision:        content:rev:{key}:{revId}     (immutable snapshot, 30 kept)
//    - Revision index:  content:revindex:{key}       (array of revIds, newest first)
//
//  A publish ALWAYS creates a new revision — history is never deleted.
//  A restore copies an older revision into a new draft (user then publishes),
//  or publishes directly when invoked with {immediate:true}.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_SITE_DOC, SOCIAL_ICONS } from './siteSettings.js';

const MAX_REVISIONS = 30;

/** Default docs — mirror the shipped site content. Used when nothing is published yet. */
export const DEFAULT_DOCS = {
  news: {
    items: [
      {
        eyebrow: 'Annual Training Camp',
        title: '2025 Gasshuku',
        layout: 'media-left',
        img: 'gasshuku-mountain.jpg',
        imgAlt: '2025 IMA Gasshuku',
        paragraphs: [
          'Please mark your calendar for another exciting Gasshuku in Colorado. We are excited to announce having special guests in addition to other great instructors.',
          'Sensei Palmer from Peru, in addition to Sensei Obran — with hundreds of national and international medals and titles between them — are our honored guests for the 2025 Gasshuku.',
          'There will be separate sessions for different levels with different emphases on the training. Please email the application form to info@imakarate.com. We offer several methods of payment such as PayPal, check, and cash.',
          'Do not miss this once-a-year opportunity.',
        ],
        cta: { label: 'Download Schedule & Application', href: 'https://imakarate.com/wp-content/uploads/2025/07/2025-Gasshuku.pdf' },
      },
      {
        eyebrow: 'Tournament',
        title: 'Rocky Mountain Championships',
        layout: 'media-right',
        img: 'madani-flyer.png',
        imgAlt: '2025 Rocky Mountain Championship flyer',
        paragraphs: [
          'Dear IMA Family — it’s that time of year again to prepare for our annual Rocky Mountain Championships (RMC). We are beyond grateful for all the support and to be celebrating over 30 years of running the tournament here in Louisville, Colorado.',
          'This year the tournament is special as it is officially a USA Karate sanctioned event, allowing access to more training opportunities and competition for those exploring these options.',
          'Finally, we need help from our community to make this all happen. Volunteers for set up and takedown would be greatly appreciated — all Tournament Day table volunteers will receive the USA karate shirt.',
        ],
        cta: null,
      },
    ],
  },
  schedule: {
    days: [
      { day: 'MON', classes: [{ name: 'Tiny Tigers', time: '4:30 – 5:00 pm' }] },
      { day: 'TUE', classes: [
        { name: 'All Levels — Teen/Adult', time: '12:00 – 1:00 pm' },
        { name: 'Little Dragons', time: '5:00 – 6:00 pm' },
        { name: 'Youth Class', time: '6:00 – 7:00 pm' },
        { name: 'Black Belt — Teen/Adult', time: '7:00 – 8:15 pm' },
      ] },
      { day: 'WED', classes: [
        { name: 'Little Dragons', time: '5:00 – 6:00 pm' },
        { name: 'Youth Class', time: '6:00 – 7:00 pm' },
        { name: 'All Levels — Teen/Adult', time: '7:00 – 8:15 pm' },
      ] },
      { day: 'THU', classes: [
        { name: 'All Levels — Teen/Adult', time: '12:00 – 1:00 pm' },
        { name: 'Little Dragons', time: '5:00 – 6:00 pm' },
        { name: 'Youth Class', time: '6:00 – 7:00 pm' },
        { name: 'Black Belt — Teen/Adult', time: '7:00 – 8:15 pm' },
      ] },
      { day: 'FRI', classes: [
        { name: 'Little Dragons', time: '5:00 – 6:00 pm' },
        { name: 'Youth Class', time: '6:00 – 7:00 pm' },
        { name: 'All Levels — Teen/Adult', time: '7:00 – 8:15 pm' },
      ] },
      { day: 'SAT', classes: [
        { name: 'Little Dragons / Youth', time: '10:00 – 11:00 am' },
        { name: 'All Levels — Teen/Adult', time: '11:00 – 12:15 pm' },
      ] },
    ],
  },
  site: DEFAULT_SITE_DOC,
};

export const CONTENT_KEYS = Object.keys(DEFAULT_DOCS);

const key = (k, kind) => `content:${kind}:${k}`;

/** Read the doc a page should render. Falls back to defaults when unpublished. */
export async function getPublishedDoc(env, docKey) {
  if (!env?.IMA_KARATE) return structuredClone(DEFAULT_DOCS[docKey]);
  const raw = await env.IMA_KARATE.get(key(docKey, 'published'));
  if (!raw) return structuredClone(DEFAULT_DOCS[docKey]);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(DEFAULT_DOCS[docKey]);
  }
}

export async function getDraftDoc(env, docKey) {
  if (!env?.IMA_KARATE) return null;
  const raw = await env.IMA_KARATE.get(key(docKey, 'draft'));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Validate a doc against its schema. Returns { ok, error }.
 * Strict allowlist: unknown shapes are rejected, sizes capped.
 */
export function validateDoc(docKey, doc) {
  const fail = (error) => ({ ok: false, error });
  if (!CONTENT_KEYS.includes(docKey)) return fail(`Unknown content key: ${docKey}`);
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return fail('Doc must be an object');
  const str = (v, max) => typeof v === 'string' && v.length <= max;

  if (docKey === 'news') {
    if (!Array.isArray(doc.items)) return fail('news.items must be an array');
    if (doc.items.length > 20) return fail('Too many news items (max 20)');
    for (const it of doc.items) {
      if (!it || typeof it !== 'object') return fail('Each news item must be an object');
      if (!str(it.title, 120)) return fail('Each news item needs a title (string, max 120 chars)');
      for (const p of it.paragraphs || []) {
        if (!str(p, 3000)) return fail('News paragraphs must be strings (max 3000 chars)');
      }
      if (it.cta) {
        if (!(str(it.cta.label, 120) && str(it.cta.href, 500))) return fail('cta needs label + href');
        if (!/^(https?:|mailto:|tel:|\/)/i.test(it.cta.href)) return fail('cta.href must be http(s), mailto:, tel:, or site-relative');
      }
      if (it.img !== undefined && it.img !== '') {
        // http(s) URL, site-relative path, or a bare filename served from /img/
        if (!/^(https?:\/\/|\/|[\w.-]+\.(jpg|jpeg|png|webp|gif|svg))$/i.test(it.img)) return fail('img must be a site filename, /path, or https URL');
      }
      if (it.eyebrow !== undefined && !str(it.eyebrow, 60)) return fail('eyebrow must be a short string');
      if (it.img !== undefined && !str(it.img, 300)) return fail('img must be a string path');
      if (it.layout !== undefined && !['media-left', 'media-right'].includes(it.layout)) return fail('layout must be media-left or media-right');
    }
  }
  if (docKey === 'schedule') {
    if (!Array.isArray(doc.days)) return fail('schedule.days must be an array');
    if (doc.days.length > 14) return fail('Too many schedule days (max 14)');
    for (const d of doc.days) {
      if (!d || !str(d.day, 12)) return fail('Each day needs a day label');
      if (!Array.isArray(d.classes)) return fail('Each day needs a classes array');
      for (const c of d.classes) {
        if (!c || !str(c.name, 120) || !str(c.time, 60)) return fail('Each class needs name + time');
      }
    }
  }
  if (docKey === 'site') {
    if (!Array.isArray(doc.socials)) return fail('site.socials must be an array');
    if (doc.socials.length > 8) return fail('Too many social links (max 8)');
    for (const so of doc.socials) {
      if (!so || !SOCIAL_ICONS[so.platform]) return fail('Each social link needs a platform: ' + Object.keys(SOCIAL_ICONS).join(', '));
      if (!str(so.url, 300) || !/^https:\/\//i.test(so.url)) return fail('Each social link needs an https:// url');
    }
    const a = doc.announcement;
    if (a !== undefined) {
      if (!a || typeof a !== 'object') return fail('announcement must be an object');
      if (typeof a.enabled !== 'boolean') return fail('announcement.enabled must be true or false');
      if (a.text !== undefined && !str(a.text, 200)) return fail('announcement.text max 200 chars');
      if (a.href && (!str(a.href, 300) || !/^(https:\/\/|\/)/i.test(a.href))) return fail('announcement.href must be https:// or site-relative');
      if (a.enabled && !a.text) return fail('announcement needs text when enabled');
    }
  }
  return { ok: true };
}

/** Save a draft (validated first). Returns { ok, error }. */
export async function saveDraft(env, docKey, doc, actor = 'admin') {
  const v = validateDoc(docKey, doc);
  if (!v.ok) return v;
  await env.IMA_KARATE.put(key(docKey, 'draft'), JSON.stringify(doc), { expirationTtl: 60 * 60 * 24 * 30 });
  console.log(`content draft saved: ${docKey} by ${actor}`);
  return { ok: true };
}

/** Discard the draft. */
export async function discardDraft(env, docKey) {
  await env.IMA_KARATE.delete(key(docKey, 'draft'));
  return { ok: true };
}

/** Publish: write published doc + create an immutable revision. History is kept. */
export async function publishDraft(env, docKey, actor = 'admin') {
  const draft = await getDraftDoc(env, docKey);
  if (!draft) return { ok: false, error: 'No draft to publish' };
  const v = validateDoc(docKey, draft);
  if (!v.ok) return v;
  return publishDoc(env, docKey, draft, actor);
}

/**
 * Publish an explicit doc (used by restore and by publishDraft).
 * Order matters: the immutable revision is written BEFORE the published
 * pointer changes, so a failure can never leave a live change without its
 * history. On the first ever publish, the outgoing (default) content is
 * saved as a baseline revision so the original state is always restorable.
 */
export async function publishDoc(env, docKey, doc, actor = 'admin') {
  const now = new Date().toISOString();
  const idxRaw = await env.IMA_KARATE.get(key(docKey, 'revindex'));
  let idx = [];
  try { idx = idxRaw ? JSON.parse(idxRaw) : []; } catch {}
  const firstPublish = idx.length === 0;

  // Baseline: snapshot the outgoing content so the first edit is undoable.
  if (firstPublish) {
    const baseline = await getPublishedDoc(env, docKey); // defaults when nothing published yet
    const baseId = 'baseline';
    await env.IMA_KARATE.put(`${key(docKey, 'rev')}:${baseId}`, JSON.stringify({
      revId: baseId, publishedAt: now, actor: 'baseline (pre-edit state)', doc: baseline,
    }), { expirationTtl: 60 * 60 * 24 * 365 });
    idx.push(baseId);
  }

  const revId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await env.IMA_KARATE.put(`${key(docKey, 'rev')}:${revId}`, JSON.stringify({
    revId, publishedAt: now, actor, doc,
  }), { expirationTtl: 60 * 60 * 24 * 365 });
  idx.unshift(revId);
  idx = idx.slice(0, MAX_REVISIONS);
  // Index + published pointer are written only after the revision is durable.
  await env.IMA_KARATE.put(key(docKey, 'revindex'), JSON.stringify(idx));
  await env.IMA_KARATE.put(key(docKey, 'published'), JSON.stringify(doc));
  await env.IMA_KARATE.delete(key(docKey, 'draft'));
  console.log(`content published: ${docKey} rev ${revId} by ${actor}`);
  return { ok: true, revId, publishedAt: now };
}

/** Restore: copy an older revision into a NEW draft (history untouched). */
export async function restoreRevision(env, docKey, revId, actor = 'admin') {
  const raw = await env.IMA_KARATE.get(`${key(docKey, 'rev')}:${revId}`);
  if (!raw) return { ok: false, error: 'Revision not found' };
  let rev;
  try { rev = JSON.parse(raw); } catch { return { ok: false, error: 'Revision unreadable' }; }
  const v = validateDoc(docKey, rev.doc);
  if (!v.ok) return v;
  return saveDraft(env, docKey, rev.doc, `${actor} (restore of ${revId})`);
}

/** List revisions (metadata only). */
export async function listRevisions(env, docKey) {
  const idxRaw = await env.IMA_KARATE.get(key(docKey, 'revindex'));
  let idx = [];
  try { idx = idxRaw ? JSON.parse(idxRaw) : []; } catch {}
  const out = [];
  for (const revId of idx) {
    const raw = await env.IMA_KARATE.get(`${key(docKey, 'rev')}:${revId}`);
    if (!raw) continue;
    try {
      const rev = JSON.parse(raw);
      out.push({ revId, publishedAt: rev.publishedAt, actor: rev.actor });
    } catch {}
  }
  return out;
}

export async function getRevisionDoc(env, docKey, revId) {
  const raw = await env.IMA_KARATE.get(`${key(docKey, 'rev')}:${revId}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

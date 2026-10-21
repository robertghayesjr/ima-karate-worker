// ─────────────────────────────────────────────────────────────────────────────
//  Shared page rendering: built-in pages + design-doc pages, with the "site"
//  doc (socials, announcement) and the "design" doc (css, edits) applied.
//  Used by the live site (worker.js) and by admin previews / Claude tools.
// ─────────────────────────────────────────────────────────────────────────────
import { handleSiteRoutes, PAGE_PATHS } from './siteRoutes.js';
import { handleBeltTestingRoutes } from './beltRoutes.js';
import { applySiteSettings } from './siteSettings.js';
import { applyDesign, findCustomPage, normalizePath } from './siteDesign.js';
import { pageShell } from './siteTheme.js';
import { getPublishedDoc } from './contentDocs.js';

const ORIGIN = 'https://ima.rob-hayes.com';

/** Every path the assistant can read or edit. */
export function listEditablePaths(designDoc) {
  return [
    ...PAGE_PATHS(),
    '/belt-testing',
    '/belt-testing/thank-you',
    ...(designDoc?.pages || []).map((p) => normalizePath(p.path)),
  ];
}

/** Render a design-doc page inside the site theme. */
export function renderCustomPage(pg) {
  return pageShell({ title: `${pg.title} | IMA Karate`, description: pg.description || '', content: pg.html });
}

/**
 * Base HTML for a path BEFORE the design doc is applied (site settings are
 * applied). Returns null when the path isn't a page.
 */
export async function renderBaseHtml(env, path, { designDoc, siteDoc } = {}) {
  const p = normalizePath(path);
  const req = new Request(ORIGIN + p, { method: 'GET' });
  const url = new URL(req.url);
  let res = await handleSiteRoutes(req, env, url);
  if (!res && (p === '/belt-testing' || p === '/belt-testing/thank-you')) res = await handleBeltTestingRoutes(req, env, url);
  let html = null;
  if (res && res.status === 200 && (res.headers.get('Content-Type') || '').includes('text/html')) {
    html = await res.text();
  } else if (!res) {
    const pg = findCustomPage(designDoc || await getPublishedDoc(env, 'design'), p);
    if (pg) html = renderCustomPage(pg);
  }
  if (html == null) return null;
  return applySiteSettings(html, siteDoc || await getPublishedDoc(env, 'site'));
}

/** Fully rendered page (site settings + design). */
export async function renderFullHtml(env, path, { designDoc, siteDoc } = {}) {
  const design = designDoc || await getPublishedDoc(env, 'design');
  const base = await renderBaseHtml(env, path, { designDoc: design, siteDoc });
  if (base == null) return null;
  return applyDesign(base, design, path);
}

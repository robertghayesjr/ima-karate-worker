// ─────────────────────────────────────────────────────────────────────────────
//  "design" content doc — lets the admin assistant change anything on the
//  site (styling, wording, layout, navigation, new sections, new pages)
//  without a developer, through the same draft → preview → publish → restore
//  flow as every other content doc.
//
//  Shape:
//    {
//      css:   string,                                  // site-wide CSS
//      edits: [{ path, find, replace, note? }],        // exact find/replace on page HTML
//      pages: [{ path, title, description?, html }],   // brand-new pages in the site theme
//    }
//
//  path for edits: "/" | "/about" | "/student-information/*" (prefix) | "*" (every page)
//
//  Safety: chat text and attachments are untrusted, so inserted HTML/CSS is
//  checked here: no scripts, event handlers, javascript: URLs, forms that post
//  off-site, or embeds other than YouTube / Vimeo / Google Maps. Edits never
//  touch the inside of existing <script> or <style> blocks.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_DESIGN_DOC = { css: '', edits: [], pages: [] };

const LIMITS = { css: 60000, edits: 200, find: 4000, replace: 30000, pages: 30, html: 80000, title: 160, description: 300, note: 300 };

// Paths the site already uses for apps/APIs. New pages can't take these.
const RESERVED_PREFIXES = ['/admin', '/__admin', '/belt-testing', '/img', '/img-uploads', '/script', '/script-upload', '/thank-you', '/contact/submit', '/contact/thank-you'];

const IFRAME_OK = /^https:\/\/(www\.youtube\.com\/embed\/|www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/|www\.google\.com\/maps\/embed)/i;

export function normalizePath(p) {
  const s = String(p || '').trim();
  if (s === '*') return '*';
  return (s.replace(/\/+$/, '') || '/');
}

/** Returns an error string, or '' if the HTML fragment is safe to insert. */
export function checkHtml(html, label) {
  const s = String(html);
  if (/<\s*script\b/i.test(s)) return `${label}: <script> tags are not allowed`;
  if (/<\s*\/?\s*(object|embed|applet|base|meta|link|style|frameset|frame)\b/i.test(s)) return `${label}: that tag is not allowed (use the css field for styles)`;
  if (/<[^>]*\son[a-z]+\s*=/i.test(s)) return `${label}: event-handler attributes (onclick, onload, ...) are not allowed`;
  if (/(javascript|vbscript)\s*:/i.test(s)) return `${label}: javascript: links are not allowed`;
  if (/data\s*:\s*text\/html/i.test(s)) return `${label}: data:text/html is not allowed`;
  if (/\ssrcdoc\s*=/i.test(s)) return `${label}: srcdoc is not allowed`;
  for (const m of s.matchAll(/<\s*iframe\b[^>]*>/gi)) {
    const src = (m[0].match(/\ssrc\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    if (!IFRAME_OK.test(src)) return `${label}: iframes are only allowed for YouTube, Vimeo, or Google Maps embeds`;
  }
  for (const m of s.matchAll(/<\s*form\b[^>]*>/gi)) {
    const action = (m[0].match(/\saction\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    if (action !== '/contact/submit') return `${label}: forms can only post to /contact/submit`;
  }
  return '';
}

export function checkCss(css) {
  const s = String(css);
  if (/<\/?\s*style|<\s*script|<\//i.test(s)) return 'css: HTML tags are not allowed in css';
  if (/expression\s*\(|javascript\s*:|behavior\s*:|-moz-binding/i.test(s)) return 'css: that construct is not allowed';
  if (/@import/i.test(s)) return 'css: @import is not allowed';
  for (const m of s.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi)) {
    const u = m[2].trim();
    if (!/^(https:\/\/|\/|data:image\/(png|jpeg|gif|webp|svg\+xml)[;,])/i.test(u)) return `css: url(${u.slice(0, 60)}) must be https://, a site path, or a data:image`;
  }
  return '';
}

export function validateDesign(doc) {
  const fail = (error) => ({ ok: false, error });
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return fail('design doc must be an object');
  const allowed = new Set(['css', 'edits', 'pages']);
  for (const k of Object.keys(doc)) if (!allowed.has(k)) return fail(`design: unknown field "${k}"`);
  if (typeof (doc.css ?? '') !== 'string') return fail('design.css must be a string');
  if ((doc.css || '').length > LIMITS.css) return fail(`design.css is too long (max ${LIMITS.css} chars)`);
  const cssErr = checkCss(doc.css || '');
  if (cssErr) return fail(cssErr);

  const edits = doc.edits ?? [];
  if (!Array.isArray(edits)) return fail('design.edits must be an array');
  if (edits.length > LIMITS.edits) return fail(`design.edits: max ${LIMITS.edits}`);
  for (const [i, e] of edits.entries()) {
    const tag = `edits[${i}]`;
    if (!e || typeof e !== 'object') return fail(`${tag} must be an object`);
    for (const k of Object.keys(e)) if (!['path', 'find', 'replace', 'note'].includes(k)) return fail(`${tag}: unknown field "${k}"`);
    const path = normalizePath(e.path);
    if (path !== '*' && !/^\/[A-Za-z0-9\-/_]*\*?$/.test(path)) return fail(`${tag}.path must be "*", a site path like "/about", or a prefix like "/about/*"`);
    if (typeof e.find !== 'string' || e.find.length < 3 || e.find.length > LIMITS.find) return fail(`${tag}.find must be 3-${LIMITS.find} characters of exact page HTML`);
    if (/<\s*\/?\s*(script|style)\b/i.test(e.find)) return fail(`${tag}.find cannot include <script> or <style> blocks`);
    if (typeof e.replace !== 'string' || e.replace.length > LIMITS.replace) return fail(`${tag}.replace must be a string up to ${LIMITS.replace} characters`);
    const he = checkHtml(e.replace, `${tag}.replace`);
    if (he) return fail(he);
    if (e.note != null && (typeof e.note !== 'string' || e.note.length > LIMITS.note)) return fail(`${tag}.note must be a short string`);
  }

  const pages = doc.pages ?? [];
  if (!Array.isArray(pages)) return fail('design.pages must be an array');
  if (pages.length > LIMITS.pages) return fail(`design.pages: max ${LIMITS.pages}`);
  const seen = new Set();
  for (const [i, pg] of pages.entries()) {
    const tag = `pages[${i}]`;
    if (!pg || typeof pg !== 'object') return fail(`${tag} must be an object`);
    for (const k of Object.keys(pg)) if (!['path', 'title', 'description', 'html'].includes(k)) return fail(`${tag}: unknown field "${k}"`);
    const path = normalizePath(pg.path);
    if (!/^\/[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(path)) return fail(`${tag}.path must look like "/new-page" (lowercase letters, numbers, dashes)`);
    if (RESERVED_PREFIXES.some((r) => path === r || path.startsWith(r + '/'))) return fail(`${tag}.path ${path} is reserved by the site`);
    if (seen.has(path)) return fail(`${tag}.path ${path} is used twice`);
    seen.add(path);
    if (typeof pg.title !== 'string' || !pg.title.trim() || pg.title.length > LIMITS.title) return fail(`${tag}.title is required (max ${LIMITS.title} chars)`);
    if (pg.description != null && (typeof pg.description !== 'string' || pg.description.length > LIMITS.description)) return fail(`${tag}.description max ${LIMITS.description} chars`);
    if (typeof pg.html !== 'string' || !pg.html.trim() || pg.html.length > LIMITS.html) return fail(`${tag}.html is required (max ${LIMITS.html} chars)`);
    const he = checkHtml(pg.html, `${tag}.html`);
    if (he) return fail(he);
  }
  return { ok: true };
}

/** Does an edit's path pattern apply to this request path? */
export function pathMatches(pattern, path) {
  const pat = normalizePath(pattern);
  const p = normalizePath(path);
  if (pat === '*') return true;
  if (pat.endsWith('*')) {
    const base = pat.slice(0, -1).replace(/\/+$/, '');
    return p === (base || '/') || p.startsWith(base + '/');
  }
  return pat === p;
}

const PROTECTED = /(<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>)/gi;

/** Replace every occurrence of `find` outside <script>/<style> blocks. */
function replaceOutsideCode(html, find, replace) {
  const parts = html.split(PROTECTED);
  let count = 0;
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue; // captured script/style block
    const seg = parts[i];
    if (!seg.includes(find)) continue;
    const pieces = seg.split(find);
    count += pieces.length - 1;
    parts[i] = pieces.join(replace);
  }
  return { html: parts.join(''), count };
}

/**
 * Apply a design doc to a rendered page. Returns { html, unmatched } where
 * unmatched lists indexes of edits for this path whose `find` text was not on
 * the page (shown to the assistant so it can fix them).
 */
export function applyDesign(html, doc, path) {
  if (!doc || typeof html !== 'string') return { html, unmatched: [] };
  let out = html;
  const unmatched = [];
  (doc.edits || []).forEach((e, i) => {
    if (!pathMatches(e.path, path)) return;
    const r = replaceOutsideCode(out, e.find, e.replace);
    if (!r.count) unmatched.push(i);
    out = r.html;
  });
  if (doc.css && doc.css.trim()) {
    const tag = `<style id="ima-design">${doc.css}</style>`;
    out = out.includes('</head>') ? out.replace('</head>', `${tag}\n</head>`) : tag + out;
  }
  return { html: out, unmatched };
}

export function findCustomPage(doc, path) {
  const p = normalizePath(path);
  return (doc?.pages || []).find((pg) => normalizePath(pg.path) === p) || null;
}

/**
 * Page HTML as the assistant should read it: <body> only, with <script> and
 * <style> blocks swapped for placeholders (edits never apply inside them).
 * Everything else is exact, so `find` strings can be copied verbatim.
 */
export function readableHtml(html, { offset = 0, limit = 30000 } = {}) {
  const m = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const body = (m ? m[1] : html)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '<!-- (script) -->')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '<!-- (style) -->');
  const start = Math.max(0, Number(offset) || 0);
  return { html: body.slice(start, start + limit), totalLength: body.length, offset: start, more: start + limit < body.length };
}

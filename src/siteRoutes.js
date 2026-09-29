// ─────────────────────────────────────────────────────────────────────────────
//  Route table for the rebuilt site pages. Any path listed here is served by
//  the Worker directly; everything else falls through to the Webflow proxy.
// ─────────────────────────────────────────────────────────────────────────────

import {
  buildHomePage,
  buildAboutPage,
  buildHistoryPage,
  buildHanshiPage,
  buildSenseiPage,
  buildAlliancesPage,
  buildStructurePage,
  buildBenefitsImaPage,
  buildAffiliatedDojoPage,
  buildProgramsPage,
  buildHowToJoinPage,
  buildContactPage,
  buildContactThanksPage,
} from './sitePagesMain.js';
import {
  buildStudentInfoPage,
  buildBenefitsKaratePage,
  buildHistoryPrinciplesPage,
  buildClassSchedulePage,
  buildInstructorsPage,
  buildBeltTestingPage,
  buildRulesCompetitionPage,
  buildKatasPage,
  buildDictionaryPage,
} from './sitePagesStudent.js';
import {
  buildNewsEventsPage,
  buildDojoLocationsPage,
} from './sitePagesWorld.js';

const PAGES = new Map([
  ['/about',                        buildAboutPage],
  ['/about/history',                buildHistoryPage],
  ['/about/hanshi',                 buildHanshiPage],
  ['/about/sensei',                 buildSenseiPage],
  ['/about/alliances',              buildAlliancesPage],
  ['/about/structure',              buildStructurePage],
  ['/about/benefits',               buildBenefitsImaPage],
  ['/about/affiliated-dojo',        buildAffiliatedDojoPage],
  ['/programs',                     buildProgramsPage],
  ['/how-to-join',                  buildHowToJoinPage],
  ['/contact',                      buildContactPage],
  ['/student-information',                        buildStudentInfoPage],
  ['/student-information/benefits-of-karate',    buildBenefitsKaratePage],
  ['/student-information/history-principles',    buildHistoryPrinciplesPage],
  ['/student-information/class-schedule',         buildClassSchedulePage],
  ['/student-information/instructors',           buildInstructorsPage],
  ['/student-information/belt-testing-guidelines', buildBeltTestingPage],
  ['/student-information/rules-of-competition',  buildRulesCompetitionPage],
  ['/student-information/list-of-katas',          buildKatasPage],
  ['/student-information/karate-dictionary',      buildDictionaryPage],
  ['/news-events',                  buildNewsEventsPage],
  ['/dojo-locations',               buildDojoLocationsPage],
]);

// ── Handle a request for a site page. Returns a Response or null. ─────────────
export async function handleSiteRoutes(request, env, url) {
  const p = url.pathname.replace(/\/+$/, '') || '/';

  // Home page
  if (p === '/') {
    return pageResponse(buildHomePage());
  }

  // Contact form submission (stores in KV, then redirects to thank-you)
  if (p === '/contact/submit' && request.method === 'POST') {
    return handleContactSubmit(request, env);
  }
  if (p === '/contact/thank-you') {
    return pageResponse(buildContactThanksPage());
  }

  // Legacy WP-style path aliases → new pages (keeps old links working)
  const ALIASES = new Map([
    ['/about/ima-organizational-structure', '/about/structure'],
    ['/about/benefits-of-ima-organization', '/about/benefits'],
    ['/about/join-the-ima-organization', '/about/affiliated-dojo'],
    ['/about/national-international-alliances', '/about/alliances'],
    ['/about/history-principles-of-shotokan-karate', '/student-information/history-principles'],
    ['/student-information/history-principles-of-shotokan-karate', '/student-information/history-principles'],
    ['/contact-us', '/contact'],
    ['/how-to-join/', '/how-to-join'],
  ]);
  if (ALIASES.has(p) && !PAGES.has(p)) {
    return Response.redirect(new URL(ALIASES.get(p), url.origin), 301);
  }

  const builder = PAGES.get(p);
  if (builder && (request.method === 'GET' || request.method === 'HEAD')) {
    return pageResponse(builder());
  }
  return null;
}

function pageResponse(html) {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'x-ima-worker': 'site',
    },
  });
}

// ── Contact form handler ─────────────────────────────────────────────────────
async function handleContactSubmit(request, env) {
  let form;
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    form = await request.json().catch(() => ({}));
  } else {
    form = await request.formData().then((fd) => Object.fromEntries(fd)).catch(() => ({}));
  }
  const { name = '', email = '', phone = '', message = '' } = form;
  if (!name || !email) {
    return new Response('Missing name or email', { status: 400 });
  }
  const entry = {
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    phone: String(phone).slice(0, 60),
    message: String(message).slice(0, 4000),
    submittedAt: new Date().toISOString(),
    userAgent: (request.headers.get('user-agent') || '').slice(0, 300),
  };
  const key = `contact:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  try {
    await env.IMA_KARATE.put(key, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 90 });
  } catch (e) {
    console.warn('contact KV write failed:', e.message);
  }
  return Response.redirect(new URL('/contact/thank-you', new URL(request.url).origin), 303);
}

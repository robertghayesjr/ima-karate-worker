// ─────────────────────────────────────────────────────────────────────────────
//  ima-karate-worker
//  ─────────────────
//  Cloudflare Worker that proxies the Webflow origin for the IMA Karate site
//  and rewrites the HTML on the fly. Pattern matches the Clientele Media
//  file-upload-worker: content updates deploy on push to `main` via
//  Cloudflare Workers Builds — no Webflow custom code touched.
//
//  Routing:
//    - Bind this worker to the custom domain via a Cloudflare Zone Route
//      (e.g. temp-domain-2.com/* → ima-karate-worker). See README.md.
//
//  Content updates:
//    - Edit CONTENT below (or /src/content.js if you factor it out) and
//      `git push` to main. Workers Builds redeploys automatically.
//
//  Env vars (wrangler.toml [vars]):
//    ORIGIN            e.g. "https://temp-domain-2.webflow.io" (the Webflow-hosted origin)
//    IMG_BASE          jsDelivr / CDN base URL for images
//
//  Optional: SCRIPT_UPLOAD_SECRET + KV binding SCRIPTS to allow hot-patching
//  the injected JS without a redeploy (mirrors the Clientele Media pattern).
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    const url = new URL(request.url);

    // ── Utility endpoints ────────────────────────────────────────────────────
    if (url.pathname === '/__worker/health') {
      return json({ ok: true, worker: 'ima-karate-worker', v: 1, origin: env.ORIGIN });
    }

    // ── Hot-patched JS bundles via KV (optional; mirrors Clientele pattern) ─
    if (url.pathname.startsWith('/script/') && (request.method === 'GET' || request.method === 'HEAD')) {
      return handleScriptHost(request, env);
    }
    if (url.pathname === '/script-upload' && request.method === 'POST') {
      return handleScriptUpload(request, env);
    }

    // ── Everything else: proxy Webflow origin and rewrite ────────────────────
    return proxyAndRewrite(request, env);
  },
};

// ═════════════════════════════════════════════════════════════════════════════
//  PROXY + HTMLRewriter
// ═════════════════════════════════════════════════════════════════════════════
async function proxyAndRewrite(request, env) {
  const origin = env.ORIGIN || 'https://ima-670b18.webflow.io';
  const incoming = new URL(request.url);
  const upstreamUrl = origin.replace(/\/$/, '') + incoming.pathname + incoming.search;

  // Rebuild request headers, but override Host to the origin.
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('Host', new URL(origin).host);
  // Webflow's origin may reject/redirect if it sees the CF-connecting host.
  upstreamHeaders.delete('cf-connecting-ip');
  upstreamHeaders.delete('cf-visitor');

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'follow',
  });

  const contentType = upstream.headers.get('content-type') || '';
  // Only rewrite HTML responses; pass through everything else verbatim.
  if (!contentType.toLowerCase().includes('text/html')) {
    return upstream;
  }

  // Strip origin-set caching so our edits show up immediately during dev.
  const outHeaders = new Headers(upstream.headers);
  outHeaders.delete('content-security-policy');
  outHeaders.delete('content-security-policy-report-only');
  outHeaders.set('x-ima-worker', 'v1');

  const IMG_BASE = env.IMG_BASE || 'https://cdn.jsdelivr.net/gh/robh-autods/ima-karate-assets@main/';

  return new HTMLRewriter()
    // Inject our CSS at the end of <head>
    .on('head', {
      element(el) {
        el.append(buildStyleTag(IMG_BASE), { html: true });
      },
    })
    // Inject our JS just before </body>
    .on('body', {
      element(el) {
        el.append(buildScriptTag(IMG_BASE), { html: true });
      },
    })
    .transform(new Response(upstream.body, { status: upstream.status, headers: outHeaders }));
}

// ═════════════════════════════════════════════════════════════════════════════
//  KV-hosted JS bundles (optional hot-patch path)
// ═════════════════════════════════════════════════════════════════════════════
async function handleScriptHost(request, env) {
  const url = new URL(request.url);
  const name = url.pathname.slice('/script/'.length);
  if (!name || /[^a-z0-9._-]/i.test(name)) return json({ error: 'invalid_name' }, 400);
  const KV = env.SCRIPTS;
  if (!KV) return new Response('// no KV bound', { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/javascript' } });
  const stored = await KV.get(`script:${name}`, { type: 'json' });
  if (!stored?.body) return new Response(`// not found: ${name}`, { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/javascript' } });
  const headers = {
    ...CORS_HEADERS,
    'Content-Type': 'application/javascript; charset=utf-8',
    'Cache-Control': 'public, max-age=60, must-revalidate',
    'X-Script-Updated': stored.updatedAt || '',
  };
  if (request.method === 'HEAD') return new Response(null, { headers });
  return new Response(stored.body, { headers });
}

async function handleScriptUpload(request, env) {
  let body; try { body = await request.json(); } catch (_) { return json({ error: 'invalid_json' }, 400); }
  const { name, body: jsBody, secret } = body || {};
  if (!env.SCRIPT_UPLOAD_SECRET || secret !== env.SCRIPT_UPLOAD_SECRET) return json({ error: 'unauthorized' }, 401);
  if (!name || /[^a-z0-9._-]/i.test(name)) return json({ error: 'invalid_name' }, 400);
  if (typeof jsBody !== 'string' || jsBody.length === 0) return json({ error: 'body required' }, 400);
  const KV = env.SCRIPTS;
  if (!KV) return json({ error: 'no_kv' }, 500);
  await KV.put(`script:${name}`, JSON.stringify({ body: jsBody, updatedAt: new Date().toISOString(), bytes: jsBody.length }));
  return json({ ok: true, name, bytes: jsBody.length });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  CSS + JS payloads (edit these to update the site — then `git push`)
// ═════════════════════════════════════════════════════════════════════════════
function buildStyleTag(IMG_BASE) {
  return `
<style id="ima-worker-css">
  /* Override template background images */
  .section.intro-section,
  .section.intro-section.intro-marketing {
    background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)),
                      url("${IMG_BASE}adult-class-1536x1152.jpg") !important;
    background-size: cover !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
  }
  .section.second-section {
    background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
                      url("${IMG_BASE}Comp-Team.jpg") !important;
    background-size: cover !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
  }
  /* Hide template shopping-cart / instructor widgets */
  .w-commerce-commercecartwrapper,
  .w-commerce-commercecartcontainerwrapper,
  .nav-cart,
  .cart-wrapper,
  [class*="commercecart"] { display: none !important; }
  .section.intro-section img.marketing-image-mobile,
  .section.second-section img.marketing-image-mobile { display: none !important; }
  .ima-hide, .ima-hide * { display: none !important; visibility: hidden !important; }

  /* Force our rebuilt sections onto dark backgrounds */
  .section.third-section.user-guide-section,
  .section.third-section.user-guide-section .column,
  .section.third-section.user-guide-section .container,
  .section.third-section.user-guide-section .column.light-column {
    background: #0a0a0a !important;
    color: #eee !important;
  }
  .section.third-section.user-guide-section .section-heading-large,
  .section.third-section.user-guide-section h2,
  .section.third-section.user-guide-section h3 { color: #fff !important; }
  .section.third-section.user-guide-section .light-paragraph,
  .section.third-section.user-guide-section p { color: #cfcfcf !important; }
  .section.third-section:not(.user-guide-section) { background: #111 !important; }

  /* Programs grid */
  .ima-programs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:24px}
  .ima-program-card{background:#1a1a1a;border:1px solid rgba(255,255,255,.08);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;transition:transform .25s ease,box-shadow .25s ease;min-height:320px}
  .ima-program-card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.5)}
  .ima-program-imgwrap{aspect-ratio:4/3;width:100%;overflow:hidden;background:#222;position:relative}
  .ima-program-imgwrap img{width:100%;height:100%;object-fit:cover;display:block}
  .ima-program-body{padding:22px;flex:1;display:flex;flex-direction:column}
  .ima-program-body h3{margin:0 0 6px !important;font-size:22px !important;color:#fff !important;font-family:Oswald,sans-serif !important;letter-spacing:1px !important;text-transform:uppercase !important}
  .ima-program-age{color:#d4a24a;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
  .ima-program-body p{color:#cfcfcf !important;font-size:15px !important;line-height:1.55 !important;margin:0 !important}
  @media (max-width:900px){.ima-programs-grid{grid-template-columns:repeat(2,1fr)}}
  @media (max-width:560px){.ima-programs-grid{grid-template-columns:1fr}}

  /* Class Schedule */
  .ima-sched-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:24px}
  .ima-sched-day{background:rgba(255,255,255,.04);border-top:3px solid #c8102e;padding:18px 14px;border-radius:4px;min-height:160px}
  .ima-sched-day h4{font-family:Oswald,sans-serif !important;font-size:14px !important;letter-spacing:2px !important;text-transform:uppercase !important;color:#c8102e !important;margin:0 0 12px !important;padding-bottom:6px !important;border-bottom:1px solid rgba(255,255,255,.12) !important}
  .ima-sched-slot{margin-bottom:10px;font-size:13.5px;color:#eee !important}
  .ima-sched-slot strong{display:block;color:#fff !important;font-size:13px;font-weight:600}
  .ima-sched-slot .ima-sched-time{color:#aaa !important;font-size:12.5px}
  .ima-sched-note{text-align:center;color:#ccc !important;margin-top:24px;font-size:15px}
  @media (max-width:900px){.ima-sched-grid{grid-template-columns:repeat(3,1fr)}}
  @media (max-width:560px){.ima-sched-grid{grid-template-columns:repeat(2,1fr)}}

  /* Instructors */
  .ima-instructors-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;margin-top:24px;text-align:left}
  .ima-ins-card{background:rgba(255,255,255,.04);border-left:4px solid #c8102e;padding:22px;border-radius:0 6px 6px 0}
  .ima-ins-card h4{margin:0 0 4px !important;font-family:Oswald,sans-serif !important;font-size:18px !important;color:#fff !important;letter-spacing:1px !important;text-transform:uppercase !important}
  .ima-ins-rank{color:#d4a24a;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;display:block}
  .ima-ins-card p{color:#cfcfcf !important;font-size:14.5px !important;line-height:1.55 !important;margin:0 !important}
  @media (max-width:700px){.ima-instructors-grid{grid-template-columns:1fr}}

  /* Dojo Kun */
  .ima-kun-list{max-width:700px;margin:24px auto 0;display:grid;gap:12px;list-style:none;padding:0}
  .ima-kun-list li{padding:14px 18px;border:1px solid rgba(255,255,255,.18);color:#fff !important;font-size:17px;letter-spacing:1px;text-align:center;background:rgba(0,0,0,.25)}

  /* Benefits list (intro) */
  .ima-benefits-list{list-style:none !important;padding:0 !important;margin:16px 0 0 !important}
  .ima-benefits-list li{position:relative;padding:10px 0 10px 28px !important;border-bottom:1px solid rgba(255,255,255,.1);color:#ddd !important;font-size:15.5px}
  .ima-benefits-list li:before{content:"✦";position:absolute;left:0;color:#c8102e;font-weight:700}

  /* Section helpers */
  .ima-section-eyebrow{display:block;color:#d4a24a !important;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px}
  .ima-center{text-align:center}
  .ima-subsection{padding:60px 0}
  .ima-subsection:first-child{padding-top:0}
</style>`;
}

function buildScriptTag(IMG_BASE) {
  // NOTE: This runs client-side. It rewrites innerHTML of the existing Webflow
  // sections to match imakarate.com. Kept as a plain <script> string so
  // HTMLRewriter injects it verbatim.
  return `
<script id="ima-worker-js">
(function(){
  var IMG_BASE = ${JSON.stringify(IMG_BASE)};
  var IMG = {
    hero:            IMG_BASE + "2021-Team-Photo-in-Track-Suits-1536x1024.jpg",
    adultClass:      IMG_BASE + "adult-class-1536x1152.jpg",
    tinyTigers:      IMG_BASE + "Tiny-Tigers.jpg",
    tinyTigersClass: IMG_BASE + "Tiny-Tigers-Class.jpg",
    tinyTigerPhoto:  IMG_BASE + "tiny-tiger-photo.jpg",
    littleDragons:   IMG_BASE + "little-dragons.jpg",
    youth:           IMG_BASE + "Youth.jpg",
    youthClass:      IMG_BASE + "youth-class.jpg",
    teen:            IMG_BASE + "Teen.jpg",
    compTeam:        IMG_BASE + "Comp-Team.jpg"
  };

  function $(sel, ctx){ return (ctx||document).querySelector(sel); }
  function $$(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); }
  function setHTML(el, html){ if(el) el.innerHTML = html; }

  function hideCartAndTemplateWidgets(){
    $$('.w-commerce-commercecartwrapper, .w-commerce-commercecartcontainerwrapper, .nav-cart, .cart-wrapper').forEach(function(el){ el.style.display = 'none'; });
    $$('[data-w-id], .w-dyn-list').forEach(function(el){
      if(el.className && typeof el.className === 'string' &&
         (el.className.indexOf('ima-') === 0 || el.className.indexOf(' ima-') > -1)) return;
      var t = (el.textContent||'').toLowerCase();
      if(t.indexOf('josh steven')>-1 || t.indexOf('head bjj')>-1 ||
         t.indexOf('head coach')>-1 || t.indexOf('view instructor profile')>-1 ||
         t.indexOf('brazilian jiu')>-1){
        var parent = el.closest('.container, .column') || el;
        if(parent && !parent.classList.contains('section')) parent.classList.add('ima-hide');
        else el.classList.add('ima-hide');
      }
    });
  }

  function programCard(img, title, age, desc){
    return '<div class="ima-program-card"><div class="ima-program-imgwrap"><img src="'+img+'" alt="'+title+'" loading="lazy"></div><div class="ima-program-body"><h3>'+title+'</h3><div class="ima-program-age">'+age+'</div><p>'+desc+'</p></div></div>';
  }
  function schedDay(day, slots){
    var html = '<div class="ima-sched-day"><h4>'+day+'</h4>';
    slots.forEach(function(s){ html += '<div class="ima-sched-slot"><strong>'+s[0]+'</strong><span class="ima-sched-time">'+s[1]+'</span></div>'; });
    return html + '</div>';
  }
  function insCard(name, rank, bio){
    return '<div class="ima-ins-card"><h4>'+name+'</h4><span class="ima-ins-rank">'+rank+'</span><p>'+bio+'</p></div>';
  }

  function run(){
    hideCartAndTemplateWidgets();

    // Hero
    var hero = $('.section.hero-slide-one');
    if(hero){
      var h1 = $('.hero-headline', hero);
      setHTML(h1, '<strong>Developing Karate Athletes</strong><br/><strong>of the Highest Level</strong>');
      var p = $('.light-paragraph', hero);
      setHTML(p,
        'Our karate family invites you to join us to develop the highest level of technical and philosophical skills in Traditional and Sport Karate. We welcome dojos, clubs, and other organizations to learn about our unique methods of teaching karate for all ages and abilities.<br/><br/>'+
        'If you are looking for a strong and non-political karate organization, the International Martialarts Association (I.M.A) has built a reputation for producing students and instructors of the highest standards for over 35 years.'
      );
      var btns = $$('.buttons-wrap .button', hero);
      if(btns[0]){ btns[0].textContent = 'Our Programs'; btns[0].setAttribute('href','#programs'); }
      if(btns[1]){ btns[1].textContent = 'Join IMA Today'; btns[1].setAttribute('href','/sign-up'); }
    }

    // News headings
    var newsItems = $$('.section.videos-section .menu-item-heading');
    if(newsItems[0]) newsItems[0].textContent = '2025 Gasshuku';
    if(newsItems[1]) newsItems[1].textContent = 'Rocky Mountain Championships';
    if(newsItems[2]) newsItems[2].textContent = 'Belt Testing — Kyu: April 5 · Dan: June 21';

    // Intro
    var intro = $('.section.intro-section');
    if(intro){
      var introH2 = $('.section-heading-large', intro);
      if(introH2) introH2.textContent = 'Join IMA Honbu Dojo in Louisville, CO';
      var introP = $('.light-paragraph', intro);
      setHTML(introP,
        'Many factors make IMA Karate in Louisville, Colorado a unique place to pursue the study of martial arts for you and your family:'+
        '<ul class="ima-benefits-list">'+
          '<li>Conveniently scheduled, year-round training classes</li>'+
          '<li>Convenient location for Boulder County and Denver residents</li>'+
          '<li>Competitive monthly fees with <strong>no contract required</strong></li>'+
          '<li>World-recognized instructors for students of all levels and abilities</li>'+
          '<li>Over 40 years of instructional experience</li>'+
          '<li>Individualized attention — students can start at any time</li>'+
        '</ul>'
      );
      var introBtns = $$('.button', intro);
      if(introBtns[0]){ introBtns[0].textContent = 'Class Schedule'; introBtns[0].setAttribute('href','#schedule'); }
      if(introBtns[1]){ introBtns[1].textContent = 'Join IMA'; introBtns[1].setAttribute('href','/sign-up'); }
    }

    // Competition Team
    var comp = $('.section.second-section');
    if(comp){
      var compH2 = $('.section-heading-large', comp);
      if(compH2) compH2.textContent = 'IMA Competition Team';
      var compP = $('.light-paragraph', comp);
      setHTML(compP,
        'The IMA Competition Team is an invite-only group of dedicated karate practitioners who show the highest level of drive and commitment to the sport. The team travels to WKF-style karate tournaments throughout the US and internationally. '+
        'Our members include athletes on the <strong>USA Karate National Team</strong> and National champions across divisions — currently 6 IMA students are members of the US National Team.'
      );
      var compBtns = $$('.button', comp);
      if(compBtns[0]){ compBtns[0].textContent = 'Join IMA Today'; compBtns[0].setAttribute('href','/sign-up'); }
      if(compBtns[1]){ compBtns[1].textContent = 'Meet the Team'; compBtns[1].setAttribute('href','#instructors'); }
    }

    // Programs grid
    var third = $('.section.third-section:not(.user-guide-section)');
    if(third){
      third.setAttribute('id','programs');
      third.innerHTML =
        '<div class="container flex-container condensed"><div class="column centered-column ima-center">'+
          '<span class="ima-section-eyebrow">Our Programs</span>'+
          '<h2 class="section-heading-large white-heading centered-heading">Classes for Every Age &amp; Ability</h2>'+
          '<p class="light-paragraph">From our youngest Tiny Tigers to our elite Competition Team, every IMA program is designed to build technical skill, character, and confidence through traditional Shotokan karate.</p>'+
        '</div></div>'+
        '<div class="container"><div class="ima-programs-grid">'+
          programCard(IMG.tinyTigersClass, 'Tiny Tigers', 'Ages 4 – 5', 'Our youngest students learn proper respect and etiquette toward the dojo, instructors, and fellow students. Focus is on following directions, taking turns, and concentration within a fun learning atmosphere.') +
          programCard(IMG.littleDragons, 'Little Dragons', 'Ages 5 – 7', 'Designed to help students control their emotions and stay focused. Class time combines warm-up games with basic karate techniques and kata while reinforcing proper etiquette.') +
          programCard(IMG.youthClass, 'Pre-Teen / Youth', 'Ages 8 – 12', 'Students focus on traditional Shotokan techniques and forms, conditioning to build strength, and an introduction to sport Karate Kumite (sparring) with opportunities to compete.') +
          programCard(IMG.adultClass, 'Adult / Teen Class', 'Ages 13 &amp; Up', 'Our adult program serves students of all levels: warm-up, conditioning, hand and foot techniques, traditional Shotokan kata, Sport Kumite sparring, self-defense, and dynamics.') +
          programCard(IMG.compTeam, 'Competition Team', 'Invite Only', 'An elite, invite-only group competing in WKF-style tournaments across the US and internationally. Includes USA Karate National Team athletes and National champions.') +
          programCard(IMG.hero, 'Black Belt Classes', 'Teen / Adult', 'Advanced training for black belts focused on refining technique, deepening philosophical understanding, and preparing for Dan-level testing and championship competition.') +
        '</div></div>';
    }

    // Schedule + Dojo Kun + Instructors
    var featured = $('.section.third-section.user-guide-section');
    if(featured){
      featured.setAttribute('id','schedule');
      featured.innerHTML =
        '<div class="ima-subsection">'+
          '<div class="container flex-container condensed"><div class="column centered-column ima-center">'+
            '<span class="ima-section-eyebrow">Louisville Honbu Dojo</span>'+
            '<h2 class="section-heading-large white-heading centered-heading">Class Schedule</h2>'+
            '<p class="light-paragraph">Classes run year-round at 1340 Main St., Louisville, CO 80027. Call <a href="tel:3036650339" style="color:#d4a24a">(303) 665-0339</a> to reserve your free trial class.</p>'+
          '</div></div>'+
          '<div class="container"><div class="ima-sched-grid">'+
            schedDay('Monday', [['Tiny Tigers','4:30 – 5:00 pm']]) +
            schedDay('Tuesday', [['All Levels – Teen/Adult','12:00 – 1:00 pm'],['Little Dragons','5:00 – 6:00 pm'],['Youth Class','6:00 – 7:00 pm'],['Black Belt – Teen/Adult','7:00 – 8:15 pm']]) +
            schedDay('Wednesday', [['Little Dragons','5:00 – 6:00 pm'],['Youth Class','6:00 – 7:00 pm'],['All Levels – Teen/Adult','7:00 – 8:15 pm']]) +
            schedDay('Thursday', [['All Levels – Teen/Adult','12:00 – 1:00 pm'],['Little Dragons','5:00 – 6:00 pm'],['Youth Class','6:00 – 7:00 pm'],['Black Belt – Teen/Adult','7:00 – 8:15 pm']]) +
            schedDay('Friday', [['Little Dragons','5:00 – 6:00 pm'],['Youth Class','6:00 – 7:00 pm'],['All Levels – Teen/Adult','7:00 – 8:15 pm']]) +
            schedDay('Saturday', [['Little Dragons / Youth','10:00 – 11:00 am'],['All Levels – Teen/Adult','11:00 – 12:15 pm']]) +
          '</div><p class="ima-sched-note"><strong style="color:#d4a24a">Belt Testing:</strong> Kyu Testing — April 5 &nbsp;|&nbsp; Dan Testing — June 21</p></div>'+
        '</div>'+
        '<div class="ima-subsection">'+
          '<div class="container flex-container condensed"><div class="column centered-column ima-center">'+
            '<span class="ima-section-eyebrow">Traditional Shotokan Affirmations</span>'+
            '<h2 class="section-heading-large white-heading centered-heading">Dojo Kun</h2>'+
            '<p class="light-paragraph">Our dojo kun reminds students to carry the physical, mental, and spiritual discipline of karate beyond the dojo and into everyday life.</p>'+
            '<ul class="ima-kun-list">'+
              '<li>Seek perfection of character</li><li>Be faithful</li><li>Endeavor to excel</li>'+
              '<li>Respect others</li><li>Refrain from violent behavior</li><li>Love yourself and love others</li>'+
            '</ul>'+
          '</div></div>'+
        '</div>'+
        '<div class="ima-subsection" id="instructors">'+
          '<div class="container flex-container condensed"><div class="column centered-column ima-center">'+
            '<span class="ima-section-eyebrow">Our Instructors</span>'+
            '<h2 class="section-heading-large white-heading centered-heading">World-Class Teachers</h2>'+
            '<p class="light-paragraph">Led by founder Hanshi Cyrus Madani, Kudan (9th Dan) — training since 1964 with the Japan Karate Association.</p>'+
          '</div></div>'+
          '<div class="container"><div class="ima-instructors-grid">'+
            insCard('Hanshi Cyrus Madani','Chief Instructor · Kudan','Founder and Chief Instructor of the International Martialarts Association. Held the highest kata/kumite license with the Pan American Karate Federation and World Karate Federation (1998–2021). Students have medaled at Pan American championships since 2000 and World Championships in 2009 and 2011.') +
            insCard('Shihan Fariba Madani','Head Instructor · Hachidan','First woman from the United States to be licensed by Pan American and WKF as a karate referee. Member of the USA-NKF Referee Council and the World Karate Federation.') +
            insCard("Sensei Michelle Prud'Homme",'Rokudan','Training with Hanshi since the rec center days in 1993 — before the dojo was built. Achieved National Referee A license.') +
            insCard('Sensei Bob McCormick','Rokudan','Joined IMA Honbu Dojo in 1996 and began teaching in 1997 as an orange belt, drawn to the family atmosphere and high level of karate-do being practiced.') +
            insCard('Sensei Deborah Keyek-Franssen','Godan','Studying with Hanshi since 1999. Lifetime USA-WKF member who judges and referees local tournaments including the Rocky Mountain Championship.') +
            insCard('Sensei Josh Schmidt','Sandan','The first Black Belt under Hanshi Madani at the Honbu Dojo. Coaches the competition team; his wife and two children also train with IMA Karate.') +
          '</div><div class="ima-center" style="margin-top:40px">'+
            '<a href="/sign-up" class="button transparent-button w-button" style="margin-right:10px">Start Free Trial</a>'+
            '<a href="tel:3036650339" class="button red-cta-button w-button">Call (303) 665-0339</a>'+
          '</div></div>'+
        '</div>';
    }

    // CTA video section
    var ctaSec = $('#CTA-Section .column.short-opaque-column');
    if(ctaSec){
      var ctaH2 = $('.section-heading-large', ctaSec);
      setHTML(ctaH2, '<strong>Develop Your Body, Mind &amp; Spirit</strong><br/><em style="font-size:18px;font-weight:400">Traditional Shotokan Karate in Louisville, CO</em>');
      var ctaBtns = $$('.button', ctaSec);
      if(ctaBtns[0]){ ctaBtns[0].textContent = 'Join IMA'; }
      if(ctaBtns[1]){ ctaBtns[1].textContent = 'Our Programs'; ctaBtns[1].setAttribute('href','#programs'); ctaBtns[1].removeAttribute('target'); }
    }

    // Special offer
    var offer = $('.section.marketing-cta-section .column.light-column');
    if(offer){
      var headings = $$('.section-heading-large', offer);
      if(headings[0]) setHTML(headings[0], 'New Student Special:<br/>One Month + Free Uniform<br/>for Only $150');
      if(headings[2]) setHTML(headings[2], '<span style="font-size:18px;font-weight:400">A 50% savings — valid for new enrollments</span>');
      var offerBtns = $$('.button', offer);
      if(offerBtns[0]){ offerBtns[0].textContent = 'Join IMA'; offerBtns[0].setAttribute('href','/sign-up'); }
      if(offerBtns[1]){ offerBtns[1].textContent = 'Call (303) 665-0339'; offerBtns[1].setAttribute('href','tel:3036650339'); }
    }

    // Footer link labels
    var footerLinks = $$('.column.footer-column .footer-link');
    var labels = ['Tiny Tigers','Little Dragons','Pre-Teen / Youth','Adult / Teen','Competition Team','Black Belt Classes','Class Schedule','Dojo Etiquette','FAQ','History','Instructors','Free Trial'];
    footerLinks.forEach(function(a, i){ if(labels[i]) a.textContent = labels[i]; });

    // Top bar
    var topBarLinks = $$('.nav-topbar .top-bar-link');
    if(topBarLinks[0]){ topBarLinks[0].textContent = '+1 (303) 665-0339'; topBarLinks[0].setAttribute('href','tel:3036650339'); }
    if(topBarLinks[1]){ topBarLinks[1].textContent = 'CLAIM A FREE TRIAL CLASS'; topBarLinks[1].setAttribute('href','/sign-up'); }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  setTimeout(run, 400);
  setTimeout(run, 1200);
})();
</script>`;
}

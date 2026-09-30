// ─────────────────────────────────────────────────────────────────────────────
//  Site theme — shared design system for all rebuilt IMA pages.
//
//  Matches the belt-testing flow: dark background, Oswald display headings,
//  Inter body, IMA red (#c8102e) + gold (#d4a24a) accents.
//
//  Images are optimized locally and served from /img/ via Workers
//  Static Assets (see wrangler.toml [assets]).
// ─────────────────────────────────────────────────────────────────────────────

const IMG = '/img';
const LOGO = 'https://cdn.prod.website-files.com/67294bbae93e819099f356c2/672953cd9cf8c751045fb537_Logo.png';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;',
  })[c]);

// ── Navigation tree ───────────────────────────────────────────────────────────
const NAV = [
  {
    label: 'About', href: '/about', key: 'about',
    children: [
      { label: 'About IMA Karate', href: '/about' },
      { label: 'History of IMA', href: '/about/history' },
      { label: 'Hanshi Cyrus Madani', href: '/about/hanshi' },
      { label: 'Sensei Fariba Madani', href: '/about/sensei' },
      { label: 'Alliances', href: '/about/alliances' },
      { label: 'Organizational Structure', href: '/about/structure' },
      { label: 'Benefits of IMA', href: '/about/benefits' },
      { label: 'Become an Affiliated Dojo', href: '/about/affiliated-dojo' },
    ],
  },
  { label: 'Programs', href: '/programs', key: 'programs' },
  {
    label: 'Student Info', href: '/student-information', key: 'student',
    children: [
      { label: 'Student Information', href: '/student-information' },
      { label: 'Benefits of Karate Training', href: '/student-information/benefits-of-karate' },
      { label: 'History & Principles', href: '/student-information/history-principles' },
      { label: 'Class Schedule', href: '/student-information/class-schedule' },
      { label: 'Our Instructors', href: '/student-information/instructors' },
      { label: 'Belt Testing Guidelines', href: '/student-information/belt-testing-guidelines' },
      { label: 'Rules of Competition', href: '/student-information/rules-of-competition' },
      { label: 'List of Katas', href: '/student-information/list-of-katas' },
      { label: 'Karate Dictionary', href: '/student-information/karate-dictionary' },
    ],
  },
  { label: 'News & Events', href: '/news-events', key: 'news' },
  { label: 'Belt Testing', href: '/belt-testing', key: 'belt', accent: true },
  { label: 'Locations', href: '/dojo-locations', key: 'locations' },
  { label: 'Contact', href: '/contact', key: 'contact' },
];

// ── Shared CSS ────────────────────────────────────────────────────────────────
const SITE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#0a0a0b;color:#f4f4f5;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit}
::selection{background:#c8102e;color:#fff}

/* subtle film grain over everything — adds texture without noise */
body::after{content:'';position:fixed;inset:0;z-index:9999;pointer-events:none;opacity:.028;mix-blend-mode:overlay;
background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E")}

/* dark themed scrollbar */
::-webkit-scrollbar{width:11px;background:#0a0a0b}
::-webkit-scrollbar-track{background:#0a0a0b}
::-webkit-scrollbar-thumb{background:#26262b;border-radius:6px;border:2px solid #0a0a0b}
::-webkit-scrollbar-thumb:hover{background:#c8102e}

/* scroll progress bar */
.scroll-progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:500;background:linear-gradient(90deg,#c8102e,#d4a24a);box-shadow:0 0 12px rgba(200,16,46,.7);transition:width .08s linear}

/* back-to-top */
.to-top{position:fixed;bottom:26px;right:26px;z-index:400;width:46px;height:46px;border-radius:50%;border:1px solid #2c2c31;background:rgba(19,19,20,.85);backdrop-filter:blur(8px);color:#f4f4f5;font-size:1.05rem;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .3s,transform .3s,visibility .3s,border-color .2s,background .2s;display:grid;place-items:center}
.to-top.show{opacity:1;visibility:visible;transform:none}
.to-top:hover{border-color:#c8102e;background:#c8102e}

/* ── Topbar ─────────────────────────────────────────────── */
.topbar{background:#050506;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 4vw;font-size:.8rem;border-bottom:1px solid #1b1b1e;position:relative}
.topbar::after{content:'';position:absolute;bottom:-1px;left:4vw;right:4vw;height:1px;background:linear-gradient(90deg,transparent,rgba(200,16,46,.5),transparent)}
.topbar a{color:#b5b5b8;text-decoration:none;letter-spacing:.04em;transition:color .15s}
.topbar a:hover{color:#d4a24a}
.topbar-phone{font-weight:600;color:#f4f4f5}
.socials{display:flex;gap:6px}
.socials a{width:26px;height:26px;border:1px solid #2a2a2e;border-radius:50%;display:grid;place-items:center;font-size:.62rem;font-weight:700;transition:border-color .2s,background .2s,transform .2s}
.socials a:hover{border-color:#d4a24a;background:#131313;transform:translateY(-2px)}
.topbar-cta{background:linear-gradient(135deg,#c8102e,#9e0c23);color:#fff;padding:5px 12px;font-weight:600;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;transition:filter .2s,transform .2s}
.topbar-cta:hover{filter:brightness(1.2);color:#fff;transform:translateY(-1px)}
@media(max-width:760px){.topbar .topbar-mid{display:none}}

/* ── Header / nav ──────────────────────────────────────── */
.site-header{position:sticky;top:0;z-index:200;background:rgba(10,10,11,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #1b1b1e;transition:box-shadow .3s,padding .3s}
.site-header.scrolled{box-shadow:0 10px 34px rgba(0,0,0,.55)}
.header-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 4vw;max-width:1400px;margin:0 auto}
.brand img{height:44px;width:auto;transition:transform .3s}
.brand:hover img{transform:scale(1.04)}
.nav-links{display:flex;align-items:center;gap:2px;list-style:none;margin:0;padding:0}
.nav-links>li{position:relative}
.nav-links>li>a{position:relative;display:flex;align-items:center;gap:5px;padding:10px 11px;font-family:'Oswald',sans-serif;font-size:.76rem;font-weight:500;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;color:#d8d8da;border-radius:3px;transition:color .15s,background .15s;white-space:nowrap}
.nav-links>li>a::after{content:'';position:absolute;left:11px;right:11px;bottom:5px;height:2px;background:linear-gradient(90deg,#c8102e,#d4a24a);border-radius:1px;transform:scaleX(0);transform-origin:left;transition:transform .25s cubic-bezier(.2,.7,.3,1)}
.nav-links>li>a:hover,.nav-links>li>a.active{color:#fff}
.nav-links>li>a:hover::after,.nav-links>li>a.active::after{transform:scaleX(1)}
.nav-links>li>a.nav-accent{color:#e89494}
.nav-links>li>a.nav-accent:hover,.nav-links>li>a.nav-accent.active{color:#fff}
.nav-links>li>a.nav-accent::after{background:#c8102e}
.nav-arrow{font-size:.55rem;transition:transform .2s}
.has-drop:hover .nav-arrow{transform:rotate(180deg)}
.drop{position:absolute;top:calc(100% + 8px);left:0;min-width:265px;background:rgba(21,21,23,.97);backdrop-filter:blur(16px);border:1px solid #2a2a2f;border-top:2px solid #c8102e;border-radius:6px;padding:8px 0;list-style:none;margin:0;opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity .22s,transform .22s cubic-bezier(.2,.7,.3,1),visibility .22s;box-shadow:0 22px 54px rgba(0,0,0,.65)}
.has-drop:hover .drop,.has-drop:focus-within .drop{opacity:1;visibility:visible;transform:translateY(0)}
.drop a{display:block;padding:9px 18px;font-size:.84rem;color:#c9c9cc;text-decoration:none;transition:background .12s,color .12s,padding-left .15s}
.drop a:hover{background:rgba(200,16,46,.12);color:#fff;padding-left:24px}
.nav-actions{display:flex;gap:10px;align-items:center}
.burger{display:none;background:none;border:0;padding:8px;cursor:pointer}
.burger span{display:block;width:24px;height:2px;background:#f4f4f5;margin:5px 0;transition:transform .25s,opacity .25s}
@media(max-width:1120px){.nav-links{display:none}.burger{display:block}.nav-actions .btn-outline{display:none}}
@media(max-width:560px){.nav-actions .btn-primary{padding:9px 14px;font-size:.72rem}}

/* mobile drawer */
.m-nav{position:fixed;inset:0 0 0 auto;width:min(340px,88vw);background:#0e0e10;border-left:1px solid #26262a;z-index:300;transform:translateX(100%);transition:transform .32s cubic-bezier(.2,.7,.3,1);overflow-y:auto;padding:22px 0 40px;box-shadow:-30px 0 80px rgba(0,0,0,.5)}
.m-nav.open{transform:translateX(0)}
.m-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(3px);z-index:290;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
.m-nav-backdrop.open{opacity:1;visibility:visible}
.m-nav-head{display:flex;justify-content:space-between;align-items:center;padding:0 22px 16px;border-bottom:1px solid #232327}
.m-nav-head img{height:34px}
.m-close{background:none;border:1px solid #2e2e33;color:#f4f4f5;width:34px;height:34px;border-radius:3px;font-size:1rem;cursor:pointer;transition:border-color .2s,color .2s}
.m-close:hover{border-color:#c8102e;color:#fff}
.m-group>a{display:flex;justify-content:space-between;align-items:center;padding:13px 22px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;text-decoration:none;color:#e3e3e5;border-bottom:1px solid #1b1b1e}
.m-group>a .nav-arrow{transition:transform .2s}
.m-group.open>a{color:#d4a24a}
.m-group.open>a .nav-arrow{transform:rotate(180deg)}
.m-sub{max-height:0;overflow:hidden;transition:max-height .32s ease;background:#0a0a0c}
.m-group.open .m-sub{max-height:600px}
.m-sub a{display:block;padding:9px 32px;font-size:.85rem;color:#b0b0b4;text-decoration:none;border-bottom:1px solid #16161a;transition:color .15s,padding-left .15s}
.m-sub a:hover{color:#fff;padding-left:38px}
.m-cta{margin:18px 22px 0;display:block;text-align:center}

/* ── Buttons ───────────────────────────────────────────── */
.btn-primary,.btn-outline,.btn-gold{position:relative;display:inline-block;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.07em;text-decoration:none;font-weight:500;border-radius:3px;transition:background .2s,color .2s,transform .2s,border-color .2s,box-shadow .3s;cursor:pointer;border:0;overflow:hidden}
.btn-primary{background:linear-gradient(135deg,#c8102e,#a00d24);color:#fff;padding:11px 22px;font-size:.82rem;box-shadow:0 4px 18px rgba(200,16,46,.28)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(200,16,46,.45);color:#fff}
.btn-primary::before,.btn-gold::before{content:'';position:absolute;top:0;bottom:0;left:-70%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-22deg);transition:left .55s ease}
.btn-primary:hover::before,.btn-gold:hover::before{left:130%}
.btn-outline{background:transparent;color:#f4f4f5;padding:10px 20px;font-size:.82rem;border:1px solid #3a3a40}
.btn-outline:hover{border-color:#c8102e;color:#fff;transform:translateY(-2px)}
.btn-gold{background:linear-gradient(135deg,#d4a24a,#b8862f);color:#151004;padding:11px 22px;font-size:.82rem;box-shadow:0 4px 18px rgba(212,162,74,.25)}
.btn-gold:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(212,162,74,.4);color:#151004}
.btn-lg{padding:15px 34px;font-size:.95rem}

/* ── Hero (home) ───────────────────────────────────────── */
.hero{position:relative;min-height:82vh;display:grid;place-items:center;text-align:center;overflow:hidden;padding:90px 5vw}
.hero-bg{position:absolute;inset:-4%;background-size:cover;background-position:center 30%;animation:kenburns 18s ease-out both;transform-origin:65% 45%;will-change:transform}
.hero::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(10,10,11,.38) 0%,rgba(10,10,11,.62) 55%,rgba(10,10,11,.9) 100%),linear-gradient(180deg,rgba(10,10,11,.55),rgba(10,10,11,.35) 45%,#0a0a0b 96%)}
@keyframes kenburns{from{transform:scale(1.1)}to{transform:scale(1)}}
.hero-inner{position:relative;z-index:2;max-width:880px}
.hero .eyebrow{animation:rise .8s .15s both}
.hero h1{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(2.3rem,5.2vw,4.2rem);line-height:1.06;margin:0 0 20px;font-weight:700;animation:rise .8s .3s both;text-shadow:0 4px 40px rgba(0,0,0,.85)}
.hero .lead{font-size:clamp(1rem,1.6vw,1.2rem);color:#ececee;max-width:640px;margin:0 auto 34px;animation:rise .8s .45s both;text-shadow:0 2px 24px rgba(0,0,0,.9)}
.hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:rise .8s .6s both}
@keyframes rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}

/* ── Page hero (subpages) ──────────────────────────────── */
.page-hero{position:relative;padding:92px 5vw 72px;overflow:hidden;background:#0d0d0f}
.page-hero.has-photo{background-size:cover;background-position:center}
.page-hero::before{content:'';position:absolute;inset:0;z-index:1;background:
  radial-gradient(ellipse 60% 90% at 78% 10%,rgba(200,16,46,.14),transparent 60%),
  radial-gradient(ellipse 50% 70% at 12% 95%,rgba(212,162,74,.06),transparent 60%)}
.page-hero.has-photo::after{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(10,10,11,.96) 22%,rgba(10,10,11,.78) 55%,rgba(10,10,11,.5)),linear-gradient(0deg,rgba(10,10,11,.85),transparent 40%)}
.page-hero-inner{position:relative;z-index:2;max-width:1200px;margin:0 auto}
.breadcrumb{font-size:.78rem;letter-spacing:.06em;color:#a9a9ad;margin:0 0 14px;text-transform:uppercase;font-weight:500}
.breadcrumb a{color:#d4a24a;text-decoration:none}
.breadcrumb a:hover{text-decoration:underline}
.page-hero h1{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(1.9rem,3.8vw,3rem);margin:0 0 12px;line-height:1.1;font-weight:700;text-shadow:0 3px 32px rgba(0,0,0,.8)}
.page-hero .lead{color:#e6e6e9;max-width:660px;margin:0;font-size:1.02rem;text-shadow:0 2px 20px rgba(0,0,0,.85)}

/* ── Sections ──────────────────────────────────────────── */
.section{padding:78px 5vw;max-width:1200px;margin:0 auto}
.section.alt{background:linear-gradient(180deg,#0d0d0f,#101012);max-width:none;position:relative}
.section.alt::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 45% 60% at 85% 20%,rgba(200,16,46,.05),transparent 60%);pointer-events:none}
.section.alt>.inner{max-width:1200px;margin:0 auto;position:relative}
.section-head{margin-bottom:44px}
.eyebrow{display:flex;align-items:center;gap:12px;color:#d4a24a;letter-spacing:.32em;text-transform:uppercase;font-size:.76rem;font-weight:600;margin:0 0 12px}
.eyebrow::before{content:'';width:26px;height:2px;background:linear-gradient(90deg,#c8102e,#d4a24a);flex-shrink:0}
.eyebrow::after{content:'';flex:1;max-width:60px;height:1px;background:linear-gradient(90deg,rgba(212,162,74,.4),transparent)}
h2.sec{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(1.6rem,3vw,2.3rem);margin:0 0 14px;line-height:1.12;font-weight:600}
.lead{color:#c3c3c7;font-size:1.04rem;max-width:720px}
.prose p{color:#c9c9cd;margin:0 0 16px}
.prose strong{color:#f4f4f5}
.prose h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:1.15rem;margin:34px 0 12px;color:#fff}
.prose a{color:#d4a24a;text-decoration:none;border-bottom:1px solid rgba(212,162,74,.4);transition:border-color .15s}
.prose a:hover{border-color:#d4a24a}

/* grids & cards */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
@media(max-width:920px){.grid-2{grid-template-columns:1fr}.grid-3{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.grid-3{grid-template-columns:1fr}}
.img-frame{position:relative;border-radius:8px;overflow:hidden;border:1px solid #26262b;box-shadow:0 20px 50px rgba(0,0,0,.4);transition:box-shadow .35s,transform .35s}
.img-frame::after{content:'';position:absolute;inset:0;background:linear-gradient(200deg,transparent 55%,rgba(10,10,11,.5));pointer-events:none}
.img-frame:hover{box-shadow:0 28px 70px rgba(0,0,0,.55);transform:translateY(-4px)}
.img-frame img{width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;transition:transform .7s cubic-bezier(.2,.7,.3,1)}
.img-frame:hover img{transform:scale(1.05)}
.img-frame.ratio-3-4 img{aspect-ratio:3/4}
.img-frame.natural img{aspect-ratio:auto;width:auto;max-width:100%;margin:0 auto}

/* overlapping portrait pair — modern collage */
.portrait-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.portrait-pair .p1,.portrait-pair .p2{position:relative;border-radius:10px;overflow:hidden;border:1px solid #26262b;box-shadow:0 24px 60px rgba(0,0,0,.5);transition:transform .5s cubic-bezier(.2,.7,.3,1),box-shadow .4s,border-color .3s}
.portrait-pair .p1{z-index:1}
.portrait-pair .p2{margin-top:11%;z-index:2}
.portrait-pair .p1:hover,.portrait-pair .p2:hover{transform:translateY(-6px);box-shadow:0 30px 72px rgba(0,0,0,.6);border-color:rgba(200,16,46,.45)}
.portrait-pair img{width:100%;display:block;aspect-ratio:3/4;object-fit:cover}
.portrait-pair .p-cap{position:absolute;left:0;right:0;bottom:0;padding:44px 16px 14px;background:linear-gradient(180deg,transparent,rgba(5,5,6,.92) 78%);font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;color:#c9c9cd}
.portrait-pair .p-cap b{display:block;color:#d4a24a;font-size:.92rem;letter-spacing:.05em;margin-bottom:2px}
@media(max-width:640px){.portrait-pair .p2{margin-top:0}}

.card{position:relative;background:linear-gradient(180deg,#151517,#111113);border:1px solid #242429;border-radius:8px;overflow:hidden;transition:transform .3s cubic-bezier(.2,.7,.3,1),border-color .3s,box-shadow .35s;text-decoration:none;display:block}
.card:hover{transform:translateY(-6px);border-color:rgba(200,16,46,.5);box-shadow:0 22px 52px rgba(0,0,0,.55),0 0 0 1px rgba(200,16,46,.25)}
.card-img{aspect-ratio:16/10;overflow:hidden;position:relative}
.card-img::after{content:'';position:absolute;inset:0;background:linear-gradient(200deg,transparent 55%,rgba(10,10,11,.55));pointer-events:none}
.card-img img{width:100%;height:100%;object-fit:cover;transition:transform .7s cubic-bezier(.2,.7,.3,1)}
.card:hover .card-img img{transform:scale(1.07)}
.card-body{padding:22px 24px 26px}
.card-body h3{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:1.06rem;margin:0 0 8px;letter-spacing:.04em;color:#fff}
.card-body p{color:#b8b8bd;font-size:.9rem;margin:0 0 14px}
.card-link{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:.74rem;letter-spacing:.14em;color:#d4a24a;text-decoration:none;transition:color .15s,letter-spacing .2s}
.card:hover .card-link{color:#e4b666;letter-spacing:.2em}

/* lists */
.check-list{list-style:none;margin:18px 0 0;padding:0}
.check-list li{position:relative;padding:7px 0 7px 32px;color:#c9c9cd}
.check-list li::before{content:'';position:absolute;left:0;top:13px;width:15px;height:8px;border-left:2px solid #c8102e;border-bottom:2px solid #c8102e;transform:rotate(-45deg)}
.arrow-list{list-style:none;margin:0;padding:0}
.arrow-list li{padding:7px 0 7px 24px;position:relative;color:#c9c9cd;border-bottom:1px solid #1d1d21}
.arrow-list li::before{content:'\\003E';position:absolute;left:0;color:#c8102e;font-family:'Oswald',sans-serif;font-weight:700}
.arrow-list li:last-child{border-bottom:0}

/* stats band */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:54px 5vw;background:linear-gradient(180deg,#101013,#0b0b0d);border-top:1px solid #1f1f23;border-bottom:1px solid #1f1f23;position:relative}
.stats::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 50% 100% at 50% 0%,rgba(200,16,46,.07),transparent 65%);pointer-events:none}
@media(max-width:860px){.stats{grid-template-columns:1fr 1fr}}
.stat{text-align:center;position:relative}
.stat b{display:block;font-family:'Oswald',sans-serif;font-size:3rem;font-weight:700;line-height:1;background:linear-gradient(180deg,#fff 30%,#b9b9bf);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.stat span{display:block;margin-top:8px;color:#9a9a9f;font-size:.76rem;text-transform:uppercase;letter-spacing:.18em}
.stat b .gold{background:linear-gradient(180deg,#e9c37a,#b8862f);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

/* CTA band */
.cta-band{position:relative;padding:100px 5vw;text-align:center;overflow:hidden}
.cta-band .bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:grayscale(.25) brightness(.34) saturate(.9);transform:scale(1.04);transition:transform .8s}
.cta-band:hover .bg{transform:scale(1.08)}
.cta-band .inner{position:relative;z-index:2;max-width:760px;margin:0 auto}
.cta-band h2{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(1.7rem,3.4vw,2.6rem);margin:0 0 16px;font-weight:700;text-shadow:0 3px 32px rgba(0,0,0,.8)}
.cta-band p{color:#e2e2e5;margin:0 0 30px;text-shadow:0 2px 18px rgba(0,0,0,.8)}
.cta-band .check-list li{color:#e2e2e5}

/* schedule table */
.sched{width:100%;border-collapse:collapse;font-size:.92rem}
.sched th{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:.8rem;color:#d4a24a;text-align:left;padding:14px 16px;border-bottom:2px solid #c8102e;background:#111013}
.sched td{padding:12px 16px;border-bottom:1px solid #1e1e22;color:#c9c9cd;vertical-align:top;transition:background .15s}
.sched td:first-child{white-space:nowrap;font-family:'Oswald',sans-serif;letter-spacing:.1em;text-transform:uppercase;font-size:.78rem;color:#fff}
.sched tr:hover td{background:#15151a}

/* people */
.people{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:22px}
.person{background:linear-gradient(180deg,#151517,#111113);border:1px solid #242429;border-radius:8px;overflow:hidden;transition:transform .3s cubic-bezier(.2,.7,.3,1),border-color .3s,box-shadow .35s}
.person:hover{transform:translateY(-6px);border-color:rgba(200,16,46,.5);box-shadow:0 22px 52px rgba(0,0,0,.55)}
.person-img{aspect-ratio:3/4;overflow:hidden;position:relative}
.person-img img{width:100%;height:100%;object-fit:cover;filter:saturate(.85) contrast(1.02);transition:transform .7s cubic-bezier(.2,.7,.3,1),filter .4s}
.person:hover .person-img img{transform:scale(1.06);filter:saturate(1.05) contrast(1.02)}
.person-body{padding:16px 18px 20px}
.person-body h3{font-family:'Oswald',sans-serif;font-size:.95rem;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px;color:#fff}
.person-rank{display:inline-block;color:#d4a24a;font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px;border:1px solid rgba(212,162,74,.35);border-radius:3px;padding:2px 8px;background:rgba(212,162,74,.07)}
.person-body p{color:#adadb2;font-size:.82rem;margin:0}

/* accordion */
details.acc{background:linear-gradient(180deg,#151517,#111113);border:1px solid #242429;border-radius:8px;margin-bottom:12px;overflow:hidden;transition:border-color .25s}
details.acc[open]{border-color:rgba(200,16,46,.4)}
details.acc summary{list-style:none;cursor:pointer;padding:17px 22px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:.95rem;display:flex;justify-content:space-between;align-items:center;transition:background .15s,color .15s;color:#e8e8ea}
details.acc summary::-webkit-details-marker{display:none}
details.acc summary:hover{background:#17171a;color:#fff}
details.acc[open] summary{border-bottom:1px solid #242429;color:#d4a24a}
details.acc .acc-body{padding:18px 22px}
details.acc .acc-body p{color:#b8b8bd;margin:0 0 10px;font-size:.92rem}
.jp{color:#d4a24a;font-weight:600;margin-right:8px}

/* dictionary */
.dict-search{display:flex;gap:0;max-width:520px;margin:0 auto 40px}
.dict-search input{flex:1;background:#131316;border:1px solid #2c2c31;border-right:0;color:#f4f4f5;padding:13px 18px;font:inherit;font-size:.95rem;border-radius:5px 0 0 5px;outline:none;transition:border-color .2s,box-shadow .2s}
.dict-search input:focus{border-color:#c8102e;box-shadow:0 0 0 4px rgba(200,16,46,.12)}
.dict-search button{background:linear-gradient(135deg,#c8102e,#a00d24);color:#fff;border:0;padding:0 24px;border-radius:0 5px 5px 0;cursor:pointer;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem;transition:filter .2s}
.dict-search button:hover{filter:brightness(1.2)}
.dict-group{margin-bottom:30px}
.dict-group h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#fff;font-size:1.02rem;border-left:3px solid #c8102e;padding-left:14px;margin:0 0 14px}
.dict-list{list-style:none;margin:0;padding:0;columns:2;column-gap:40px}
@media(max-width:760px){.dict-list{columns:1}}
.dict-list li{break-inside:avoid;padding:8px 0;border-bottom:1px solid #1b1b1f;font-size:.9rem;color:#c9c9cd;transition:background .12s}
.dict-list li:hover{background:rgba(255,255,255,.02)}
.dict-list li b{color:#f4f4f5;font-weight:600}
.dict-list .pron{color:#8f8f93;font-style:italic}
.dict-empty{text-align:center;color:#8f8f93;padding:40px 0;display:none}

/* locations */
.loc-state{margin-bottom:44px}
.loc-state>h3{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:1.3rem;letter-spacing:.1em;color:#fff;border-bottom:2px solid #c8102e;padding-bottom:10px;margin:0 0 22px}
.loc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.loc-card{background:linear-gradient(180deg,#151517,#111113);border:1px solid #242429;border-radius:8px;padding:22px 24px;transition:border-color .25s,transform .25s,box-shadow .3s}
.loc-card:hover{border-color:rgba(200,16,46,.5);transform:translateY(-4px);box-shadow:0 18px 44px rgba(0,0,0,.5)}
.loc-card h4{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:.95rem;color:#d4a24a;margin:0 0 6px}
.loc-card .loc-name{color:#fff;font-weight:600;margin:0 0 6px}
.loc-card p{color:#adadb2;font-size:.86rem;margin:0 0 4px}
.loc-card a{color:#e06a76;text-decoration:none;font-weight:600;transition:color .15s}
.loc-card a:hover{color:#fff;text-decoration:underline}

/* contact form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.form-grid .full{grid-column:1/-1}
.field label{display:block;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:#9a9a9f;margin-bottom:7px;font-weight:600}
.field input,.field select,.field textarea{width:100%;background:#101013;border:1px solid #2c2c31;color:#f4f4f5;padding:13px 15px;font:inherit;font-size:.95rem;border-radius:5px;outline:none;transition:border-color .2s,box-shadow .2s}
.field input:focus,.field textarea:focus,.field select:focus{border-color:#c8102e;box-shadow:0 0 0 4px rgba(200,16,46,.12)}
.field textarea{min-height:140px;resize:vertical}
@media(max-width:640px){.form-grid{grid-template-columns:1fr}}
.contact-cards{display:grid;gap:16px}
.contact-card{display:flex;gap:16px;align-items:center;background:linear-gradient(180deg,#151517,#111113);border:1px solid #242429;border-radius:8px;padding:18px 22px;text-decoration:none;transition:border-color .25s,transform .25s}
.contact-card:hover{border-color:#c8102e;transform:translateY(-3px)}
.contact-card .ico{width:46px;height:46px;border-radius:6px;background:linear-gradient(135deg,rgba(200,16,46,.18),rgba(200,16,46,.06));border:1px solid rgba(200,16,46,.3);display:grid;place-items:center;font-size:1.1rem;flex-shrink:0}
.contact-card b{display:block;color:#fff;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:.88rem}
.contact-card span{color:#adadb2;font-size:.88rem}

/* ── Footer ─────────────────────────────────────────────── */
.site-footer{background:#050506;border-top:1px solid #1b1b1e;margin-top:40px;position:relative}
.site-footer::before{content:'';position:absolute;top:-1px;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(200,16,46,.6),transparent)}
.footer-inner{max-width:1200px;margin:0 auto;padding:60px 5vw 30px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px}
@media(max-width:920px){.footer-inner{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.footer-inner{grid-template-columns:1fr}}
.site-footer h4{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:.82rem;letter-spacing:.16em;color:#fff;margin:0 0 16px}
.site-footer ul{list-style:none;margin:0;padding:0}
.site-footer li{margin-bottom:9px}
.site-footer a{color:#9a9a9f;text-decoration:none;font-size:.88rem;transition:color .15s,padding-left .15s}
.site-footer a:hover{color:#d4a24a;padding-left:4px}
.footer-brand img{height:40px;margin-bottom:16px}
.footer-brand p{color:#8f8f93;font-size:.86rem;max-width:300px;margin:0 0 18px}
.footer-bottom{border-top:1px solid #17171a;padding:20px 5vw;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;max-width:1200px;margin:0 auto;font-size:.78rem;color:#6f6f74}
.footer-bottom a{color:#9a9a9f;text-decoration:none}

/* ── Reveal animations ────────────────────────────────── */
.reveal{opacity:0;transform:translateY(30px);filter:blur(10px);transition:opacity .8s cubic-bezier(.2,.7,.3,1),transform .8s cubic-bezier(.2,.7,.3,1),filter .8s cubic-bezier(.2,.7,.3,1)}
.reveal.in{opacity:1;transform:none;filter:blur(0)}
@media(prefers-reduced-motion:reduce){
  .reveal{opacity:1;transform:none;filter:none;transition:none}
  .hero-bg{animation:none}
  html{scroll-behavior:auto}
}
`;

// ── Shared page JS ────────────────────────────────────────────────────────────
const SITE_JS = `
(function(){
  // sticky header shadow
  var hdr = document.querySelector('.site-header');
  var toTop = document.querySelector('.to-top');
  var progress = document.querySelector('.scroll-progress');
  var heroBg = document.querySelector('.hero-bg');
  var lastY = -1;
  var onScroll = function(){
    var y = window.scrollY;
    if (hdr) hdr.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    // subtle parallax on home hero
    if (heroBg && y < window.innerHeight * 1.2) {
      heroBg.style.transform = 'translateY(' + (y * 0.18) + 'px) scale(1.04)';
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // back to top
  if (toTop) toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });

  // mobile drawer
  var burger = document.querySelector('.burger');
  var mnav = document.querySelector('.m-nav');
  var backdrop = document.querySelector('.m-nav-backdrop');
  var closeBtn = document.querySelector('.m-close');
  function setNav(open){
    if(mnav){ mnav.classList.toggle('open', open); }
    if(backdrop){ backdrop.classList.toggle('open', open); }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if(burger) burger.addEventListener('click', function(){ setNav(true); });
  if(closeBtn) closeBtn.addEventListener('click', function(){ setNav(false); });
  if(backdrop) backdrop.addEventListener('click', function(){ setNav(false); });

  // mobile accordions
  document.querySelectorAll('.m-group > a').forEach(function(a){
    a.addEventListener('click', function(e){
      var li = a.parentElement;
      if (!li.querySelector('.m-sub')) return;
      e.preventDefault();
      document.querySelectorAll('.m-group.open').forEach(function(g){ if(g!==li) g.classList.remove('open'); });
      li.classList.toggle('open');
    });
  });

  // scroll reveals
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && els.length) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) {
          var d = en.target.getAttribute('data-delay');
          if (d) en.target.style.transitionDelay = d + 'ms';
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
    els.forEach(function(el){ io.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }

  // animated counters
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        var dur = 1500;
        function tick(t){
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          p = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * p);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, {threshold: 0.5});
    counters.forEach(function(c){ cio.observe(c); });
  }

  // dictionary filter
  var dictInput = document.getElementById('dict-search-input');
  if (dictInput) {
    var items = document.querySelectorAll('.dict-list li');
    var empty = document.getElementById('dict-empty');
    dictInput.addEventListener('input', function(){
      var q = dictInput.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function(li){
        var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      document.querySelectorAll('.dict-group').forEach(function(g){
        var vis = g.querySelectorAll('.dict-list li:not([style*="none"])').length;
        g.style.display = vis ? '' : 'none';
      });
      if (empty) empty.style.display = shown ? 'none' : 'block';
    });
  }
})();
`;

// ── Header builder ────────────────────────────────────────────────────────────
function siteHeader(activeKey) {
  const desktop = NAV.map((item) => {
    const arrow = item.children ? ' <span class="nav-arrow">▾</span>' : '';
    const subs = item.children
      ? `<ul class="drop">${item.children
          .map((c) => `<li><a href="${c.href}">${esc(c.label)}</a></li>`)
          .join('')}</ul>`
      : '';
    return `<li class="${item.children ? 'has-drop' : ''}"><a href="${item.href}" class="${[
      item.key === activeKey ? 'active' : '',
      item.accent ? 'nav-accent' : '',
    ].filter(Boolean).join(' ')}">${esc(item.label)}${arrow}</a>${subs}</li>`;
  }).join('');

  const mobile = NAV.map((item) => {
    const subs = item.children
      ? `<div class="m-sub">${item.children
          .map((c) => `<a href="${c.href}">${esc(c.label)}</a>`)
          .join('')}</div>`
      : '';
    return `<div class="m-group"><a href="${item.href}">${esc(item.label)}${item.children ? '<span class="nav-arrow">▾</span>' : ''}</a>${subs}</div>`;
  }).join('');

  return `
  <div class="topbar">
    <a href="tel:+13036650339" class="topbar-phone">+1 (303) 665-0339</a>
    <div class="socials topbar-mid">
      <a href="https://www.facebook.com/imakarate" aria-label="Facebook">f</a>
      <a href="https://www.instagram.com/imakarate" aria-label="Instagram">ig</a>
      <a href="https://www.youtube.com/@imakarate" aria-label="YouTube">yt</a>
    </div>
    <a href="/how-to-join" class="topbar-cta">Claim a Free Trial Class</a>
  </div>
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="brand" aria-label="IMA Karate home"><img src="${LOGO}" alt="IMA Karate" /></a>
      <ul class="nav-links">${desktop}</ul>
      <div class="nav-actions">
        <a href="/login" class="btn-outline">Login</a>
        <a href="/how-to-join" class="btn-primary">Join IMA</a>
        <button class="burger" aria-label="Open menu"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>
  <div class="m-nav-backdrop"></div>
  <nav class="m-nav" aria-label="Mobile">
    <div class="m-nav-head">
      <img src="${LOGO}" alt="IMA Karate" />
      <button class="m-close" aria-label="Close menu">✕</button>
    </div>
    ${mobile}
    <a href="/how-to-join" class="btn-primary m-cta">Join IMA</a>
  </nav>
  <div class="scroll-progress" aria-hidden="true"></div>
  <button class="to-top" aria-label="Back to top">↑</button>`;
}

// ── Footer builder ────────────────────────────────────────────────────────────
function siteFooter() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="${LOGO}" alt="IMA Karate" />
        <p>A world-recognized karate organization training students and instructors of all levels in the principles and philosophy of Shotokan Karate since 1991.</p>
        <a href="tel:+13036650339" class="btn-outline" style="font-size:.74rem;padding:8px 16px">+1 (303) 665-0339</a>
      </div>
      <div>
        <h4>Student Info</h4>
        <ul>
          <li><a href="/student-information/class-schedule">Class Schedule</a></li>
          <li><a href="/student-information/belt-testing-guidelines">Belt Testing Guidelines</a></li>
          <li><a href="/student-information/instructors">Our Instructors</a></li>
          <li><a href="/student-information/list-of-katas">List of Katas</a></li>
          <li><a href="/student-information/karate-dictionary">Karate Dictionary</a></li>
          <li><a href="/belt-testing">Belt Test Sign-Up</a></li>
        </ul>
      </div>
      <div>
        <h4>Programs</h4>
        <ul>
          <li><a href="/programs">All Programs</a></li>
          <li><a href="/programs#tiny-tigers">Tiny Tigers</a></li>
          <li><a href="/programs#little-dragons">Little Dragons</a></li>
          <li><a href="/programs#youth">Youth Class</a></li>
          <li><a href="/programs#adults">Teen / Adult</a></li>
          <li><a href="/programs#competition">Competition Team</a></li>
        </ul>
      </div>
      <div>
        <h4>Organization</h4>
        <ul>
          <li><a href="/about">About IMA</a></li>
          <li><a href="/about/history">History</a></li>
          <li><a href="/about/hanshi">Hanshi Madani</a></li>
          <li><a href="/dojo-locations">Dojo Locations</a></li>
          <li><a href="/news-events">News & Events</a></li>
          <li><a href="/contact">Contact Us</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} International Martialarts Association. All rights reserved.</span>
      <span>1340 Main Street, Louisville, CO 80027 · <a href="mailto:info@imakarate.com">info@imakarate.com</a></span>
    </div>
  </footer>`;
}

// ── Page shell ────────────────────────────────────────────────────────────────
function pageShell({ title, description, activeNav = '', bodyClass = '', content = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  ${description ? `<meta name="description" content="${esc(description)}" />` : ''}
  <meta property="og:title" content="${esc(title)}" />
  ${description ? `<meta property="og:description" content="${esc(description)}" />` : ''}
  <meta property="og:type" content="website" />
  <link rel="icon" href="https://cdn.prod.website-files.com/67294bbae93e819099f356c2/6729882799654f6726ad05d9_webp%20ima.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>${SITE_CSS}</style>
</head>
<body class="${bodyClass}">
  ${siteHeader(activeNav)}
  <main>
  ${content}
  </main>
  ${siteFooter()}
  <script>${SITE_JS}</script>
</body>
</html>`;
}

// ── Shared section components ───────────────────────────────────────────────
// pageHero: pass bg = local asset name (served from /img/) for photo heroes.
// Omit bg for the designed gradient hero (red glow + grain) — used when no
// high-res photo exists, which also guarantees text readability.
function pageHero({ eyebrow, title, lead, bg, crumbs = [] }) {
  const crumbHtml = crumbs.length
    ? `<p class="breadcrumb">${crumbs
        .map((c, i) =>
          i === crumbs.length - 1
            ? esc(c.label)
            : `<a href="${c.href}">${esc(c.label)}</a> · `,
        )
        .join('')}</p>`
    : '';
  return `<section class="page-hero${bg ? ' has-photo' : ''}"${bg ? ` style="background-image:url('${IMG}/${bg}')"` : ''}>
    <div class="page-hero-inner">
      ${crumbHtml}
      ${eyebrow ? `<p class="eyebrow" style="display:inline-flex">${esc(eyebrow)}</p>` : ''}
      <h1>${title}</h1>
      ${lead ? `<p class="lead">${lead}</p>` : ''}
    </div>
  </section>`;
}

export { esc, IMG, LOGO, pageShell, pageHero, siteHeader, siteFooter };

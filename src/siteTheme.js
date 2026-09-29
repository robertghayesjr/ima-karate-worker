// ─────────────────────────────────────────────────────────────────────────────
//  Site theme — shared design system for all rebuilt IMA pages.
//
//  Matches the belt-testing flow: dark background, Oswald display headings,
//  Inter body, IMA red (#c8102e) + gold (#d4a24a) accents.
//
//  Images are hotlinked from the client's own WordPress uploads. To re-host
//  later, change IMG_ORIGIN once.
// ─────────────────────────────────────────────────────────────────────────────

const IMG_ORIGIN = 'https://imakarate.com/wp-content/uploads';
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
body{margin:0;background:#0a0a0a;color:#f4f4f5;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit}
::selection{background:#c8102e;color:#fff}

/* ── Topbar ─────────────────────────────────────────────── */
.topbar{background:#000;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 4vw;font-size:.8rem;border-bottom:1px solid #1f1f22}
.topbar a{color:#b5b5b8;text-decoration:none;letter-spacing:.04em;transition:color .15s}
.topbar a:hover{color:#d4a24a}
.topbar-phone{font-weight:600;color:#f4f4f5}
.socials{display:flex;gap:6px}
.socials a{width:26px;height:26px;border:1px solid #2a2a2e;border-radius:50%;display:grid;place-items:center;font-size:.62rem;font-weight:700;transition:border-color .15s,background .15s}
.socials a:hover{border-color:#d4a24a;background:#131313}
.topbar-cta{background:#c8102e;color:#fff;padding:5px 12px;font-weight:600;font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;transition:background .15s}
.topbar-cta:hover{background:#a00d24;color:#fff}
@media(max-width:760px){.topbar .topbar-mid{display:none}}

/* ── Header / nav ──────────────────────────────────────── */
.site-header{position:sticky;top:0;z-index:200;background:rgba(10,10,10,.92);backdrop-filter:blur(10px);border-bottom:1px solid #1f1f22}
.site-header.scrolled{box-shadow:0 6px 24px rgba(0,0,0,.45)}
.header-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 4vw;max-width:1400px;margin:0 auto}
.brand img{height:44px;width:auto}
.nav-links{display:flex;align-items:center;gap:4px;list-style:none;margin:0;padding:0}
.nav-links>li{position:relative}
.nav-links>li>a{display:flex;align-items:center;gap:5px;padding:10px 11px;font-family:'Oswald',sans-serif;font-size:.76rem;font-weight:500;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;color:#d8d8da;border-radius:3px;transition:color .15s,background .15s;white-space:nowrap}
.nav-links>li>a:hover,.nav-links>li>a.active{color:#fff;background:#161617}
.nav-links>li>a.nav-accent{color:#e8b4b4}
.nav-links>li>a.nav-accent:hover,.nav-links>li>a.nav-accent.active{color:#fff;background:#c8102e}
.nav-arrow{font-size:.55rem;transition:transform .2s}
.has-drop:hover .nav-arrow{transform:rotate(180deg)}
.drop{position:absolute;top:calc(100% + 6px);left:0;min-width:265px;background:#131313;border:1px solid #26262a;border-top:2px solid #c8102e;border-radius:4px;padding:8px 0;list-style:none;margin:0;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .2s,transform .2s,visibility .2s;box-shadow:0 18px 44px rgba(0,0,0,.55)}
.has-drop:hover .drop,.has-drop:focus-within .drop{opacity:1;visibility:visible;transform:translateY(0)}
.drop a{display:block;padding:9px 18px;font-size:.84rem;color:#c9c9cc;text-decoration:none;transition:background .12s,color .12s,padding-left .12s}
.drop a:hover{background:#1d1d20;color:#fff;padding-left:23px}
.nav-actions{display:flex;gap:10px;align-items:center}
.burger{display:none;background:none;border:0;padding:8px;cursor:pointer}
.burger span{display:block;width:24px;height:2px;background:#f4f4f5;margin:5px 0;transition:transform .25s,opacity .25s}
@media(max-width:1120px){.nav-links{display:none}.burger{display:block}.nav-actions .btn-outline{display:none}}
@media(max-width:560px){.nav-actions .btn-primary{padding:9px 14px;font-size:.72rem}}

/* mobile drawer */
.m-nav{position:fixed;inset:0 0 0 auto;width:min(340px,88vw);background:#101012;border-left:1px solid #26262a;z-index:300;transform:translateX(100%);transition:transform .3s cubic-bezier(.2,.7,.3,1);overflow-y:auto;padding:22px 0 40px}
.m-nav.open{transform:translateX(0)}
.m-nav-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:290;opacity:0;visibility:hidden;transition:opacity .25s}
.m-nav-backdrop.open{opacity:1;visibility:visible}
.m-nav-head{display:flex;justify-content:space-between;align-items:center;padding:0 22px 16px;border-bottom:1px solid #232327}
.m-nav-head img{height:34px}
.m-close{background:none;border:1px solid #2e2e33;color:#f4f4f5;width:34px;height:34px;border-radius:3px;font-size:1rem;cursor:pointer}
.m-group>a{display:flex;justify-content:space-between;align-items:center;padding:13px 22px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.85rem;text-decoration:none;color:#e3e3e5;border-bottom:1px solid #1b1b1e}
.m-group>a .nav-arrow{transition:transform .2s}
.m-group.open>a .nav-arrow{transform:rotate(180deg)}
.m-sub{max-height:0;overflow:hidden;transition:max-height .3s ease;background:#0c0c0e}
.m-group.open .m-sub{max-height:600px}
.m-sub a{display:block;padding:9px 32px;font-size:.85rem;color:#b0b0b4;text-decoration:none;border-bottom:1px solid #17171a}
.m-sub a:hover{color:#fff}
.m-cta{margin:18px 22px 0;display:block;text-align:center}

/* ── Buttons ───────────────────────────────────────────── */
.btn-primary,.btn-outline,.btn-gold{display:inline-block;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.07em;text-decoration:none;font-weight:500;border-radius:2px;transition:background .15s,color .15s,transform .15s,border-color .15s;cursor:pointer;border:0}
.btn-primary{background:#c8102e;color:#fff;padding:11px 22px;font-size:.82rem}
.btn-primary:hover{background:#a00d24;transform:translateY(-1px);color:#fff}
.btn-outline{background:transparent;color:#f4f4f5;padding:10px 20px;font-size:.82rem;border:1px solid #3a3a40}
.btn-outline:hover{border-color:#c8102e;color:#fff}
.btn-gold{background:#d4a24a;color:#151004;padding:11px 22px;font-size:.82rem}
.btn-gold:hover{background:#e4b666;transform:translateY(-1px)}
.btn-lg{padding:15px 34px;font-size:.95rem}

/* ── Hero (home) ───────────────────────────────────────── */
.hero{position:relative;min-height:78vh;display:grid;place-items:center;text-align:center;overflow:hidden;padding:90px 5vw}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center 30%;animation:kenburns 18s ease-out both;transform-origin:65% 45%}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,.72),rgba(10,10,10,.45) 45%,#0a0a0a)}
@keyframes kenburns{from{transform:scale(1.12)}to{transform:scale(1)}}
.hero-inner{position:relative;z-index:2;max-width:880px}
.hero .eyebrow{animation:rise .8s .15s both}
.hero h1{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(2.3rem,5.2vw,4.2rem);line-height:1.06;margin:0 0 20px;font-weight:700;animation:rise .8s .3s both}
.hero .lead{font-size:clamp(1rem,1.6vw,1.2rem);color:#d6d6d9;max-width:640px;margin:0 auto 34px;animation:rise .8s .45s both}
.hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:rise .8s .6s both}
@keyframes rise{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}

/* ── Page hero (subpages) ──────────────────────────────── */
.page-hero{position:relative;padding:86px 5vw 66px;overflow:hidden;background-size:cover;background-position:center}
.page-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.94) 25%,rgba(10,10,10,.55));}
.page-hero-inner{position:relative;z-index:2;max-width:1200px;margin:0 auto}
.breadcrumb{font-size:.78rem;letter-spacing:.06em;color:#8f8f93;margin:0 0 14px;text-transform:uppercase;font-weight:500}
.breadcrumb a{color:#d4a24a;text-decoration:none}
.breadcrumb a:hover{text-decoration:underline}
.page-hero h1{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(1.9rem,3.8vw,3rem);margin:0 0 12px;line-height:1.1;font-weight:700}
.page-hero .lead{color:#cfcfd2;max-width:660px;margin:0;font-size:1.02rem}

/* ── Sections ──────────────────────────────────────────── */
.section{padding:78px 5vw;max-width:1200px;margin:0 auto}
.section.alt{background:#0d0d0f;max-width:none}
.section.alt>.inner{max-width:1200px;margin:0 auto}
.section-head{margin-bottom:44px}
.eyebrow{color:#d4a24a;letter-spacing:.32em;text-transform:uppercase;font-size:.76rem;font-weight:600;margin:0 0 12px}
h2.sec{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(1.6rem,3vw,2.3rem);margin:0 0 14px;line-height:1.12;font-weight:600}
.lead{color:#b5b5b8;font-size:1.04rem;max-width:720px}
.prose p{color:#c4c4c8;margin:0 0 16px}
.prose strong{color:#f4f4f5}
.prose h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:1.15rem;margin:34px 0 12px;color:#fff}
.prose em{color:#d4a24a;font-style:normal}

/* grids & cards */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
@media(max-width:920px){.grid-2{grid-template-columns:1fr}.grid-3{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.grid-3{grid-template-columns:1fr}}
.img-frame{position:relative;border-radius:6px;overflow:hidden;border:1px solid #232327}
.img-frame::after{content:'';position:absolute;inset:0;background:linear-gradient(200deg,transparent 55%,rgba(10,10,10,.55));pointer-events:none}
.img-frame img{width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;transition:transform .6s cubic-bezier(.2,.7,.3,1)}
.img-frame:hover img{transform:scale(1.05)}
.card{background:#131313;border:1px solid #232327;border-radius:6px;overflow:hidden;transition:transform .25s,border-color .25s,box-shadow .25s}
.card:hover{transform:translateY(-5px);border-color:#3a3a40;box-shadow:0 18px 40px rgba(0,0,0,.5)}
.card-img{aspect-ratio:16/10;overflow:hidden}
.card-img img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.3,1)}
.card:hover .card-img img{transform:scale(1.06)}
.card-body{padding:22px 24px 26px}
.card-body h3{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:1.06rem;margin:0 0 8px;letter-spacing:.04em}
.card-body p{color:#b0b0b4;font-size:.9rem;margin:0 0 14px}
.card-link{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:.74rem;letter-spacing:.14em;color:#d4a24a;text-decoration:none}
.card-link:hover{color:#e4b666}

/* lists */
.check-list{list-style:none;margin:18px 0 0;padding:0}
.check-list li{position:relative;padding:7px 0 7px 32px;color:#c4c4c8}
.check-list li::before{content:'';position:absolute;left:0;top:13px;width:15px;height:8px;border-left:2px solid #c8102e;border-bottom:2px solid #c8102e;transform:rotate(-45deg)}
.arrow-list{list-style:none;margin:0;padding:0}
.arrow-list li{padding:7px 0 7px 24px;position:relative;color:#c4c4c8;border-bottom:1px solid #1c1c1f}
.arrow-list li::before{content:'\\003E';position:absolute;left:0;color:#c8102e;font-family:'Oswald',sans-serif;font-weight:700}
.arrow-list li:last-child{border-bottom:0}

/* stats band */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:54px 5vw;background:linear-gradient(180deg,#111013,#0d0d0f);border-top:1px solid #1f1f22;border-bottom:1px solid #1f1f22}
@media(max-width:860px){.stats{grid-template-columns:1fr 1fr}}
.stat{text-align:center}
.stat b{display:block;font-family:'Oswald',sans-serif;font-size:2.9rem;font-weight:700;color:#fff;line-height:1}
.stat span{display:block;margin-top:8px;color:#8f8f93;font-size:.76rem;text-transform:uppercase;letter-spacing:.18em}
.stat b .gold{color:#d4a24a}

/* CTA band */
.cta-band{position:relative;padding:92px 5vw;text-align:center;overflow:hidden}
.cta-band .bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:grayscale(.35) brightness(.5)}
.cta-band .inner{position:relative;z-index:2;max-width:760px;margin:0 auto}
.cta-band h2{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:clamp(1.7rem,3.4vw,2.6rem);margin:0 0 16px;font-weight:700}
.cta-band p{color:#cfcfd2;margin:0 0 30px}

/* schedule table */
.sched{width:100%;border-collapse:collapse;font-size:.92rem}
.sched th{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.12em;font-size:.8rem;color:#d4a24a;text-align:left;padding:14px 16px;border-bottom:2px solid #c8102e;background:#111013}
.sched td{padding:12px 16px;border-bottom:1px solid #1e1e22;color:#c4c4c8;vertical-align:top}
.sched td:first-child{white-space:nowrap;font-family:'Oswald',sans-serif;letter-spacing:.1em;text-transform:uppercase;font-size:.78rem;color:#fff}
.sched tr:hover td{background:#141416}

/* people */
.people{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:22px}
.person{background:#131313;border:1px solid #232327;border-radius:6px;overflow:hidden;transition:transform .25s,border-color .25s}
.person:hover{transform:translateY(-5px);border-color:#3a3a40}
.person-img{aspect-ratio:3/4;overflow:hidden}
.person-img img{width:100%;height:100%;object-fit:cover;filter:saturate(.92);transition:transform .6s}
.person:hover .person-img img{transform:scale(1.05)}
.person-body{padding:16px 18px 20px}
.person-body h3{font-family:'Oswald',sans-serif;font-size:.95rem;text-transform:uppercase;letter-spacing:.05em;margin:0 0 4px}
.person-rank{color:#d4a24a;font-size:.76rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0 0 8px}
.person-body p{color:#a5a5aa;font-size:.82rem;margin:0}

/* accordion */
details.acc{background:#131313;border:1px solid #232327;border-radius:6px;margin-bottom:12px;overflow:hidden}
details.acc summary{list-style:none;cursor:pointer;padding:17px 22px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:.95rem;display:flex;justify-content:space-between;align-items:center;transition:background .15s}
details.acc summary::-webkit-details-marker{display:none}
details.acc summary:hover{background:#17171a}
details.acc[open] summary{border-bottom:1px solid #232327;color:#d4a24a}
details.acc .acc-body{padding:18px 22px}
details.acc .acc-body p{color:#b0b0b4;margin:0 0 10px;font-size:.92rem}
.jp{color:#d4a24a;font-weight:600;margin-right:8px}

/* dictionary */
.dict-search{display:flex;gap:0;max-width:520px;margin:0 auto 40px}
.dict-search input{flex:1;background:#131313;border:1px solid #2c2c31;border-right:0;color:#f4f4f5;padding:13px 18px;font:inherit;font-size:.95rem;border-radius:4px 0 0 4px;outline:none;transition:border-color .15s}
.dict-search input:focus{border-color:#c8102e}
.dict-search button{background:#c8102e;color:#fff;border:0;padding:0 24px;border-radius:0 4px 4px 0;cursor:pointer;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem}
.dict-group{margin-bottom:30px}
.dict-group h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#fff;font-size:1.02rem;border-left:3px solid #c8102e;padding-left:14px;margin:0 0 14px}
.dict-list{list-style:none;margin:0;padding:0;columns:2;column-gap:40px}
@media(max-width:760px){.dict-list{columns:1}}
.dict-list li{break-inside:avoid;padding:8px 0;border-bottom:1px solid #1b1b1e;font-size:.9rem;color:#c4c4c8}
.dict-list li b{color:#f4f4f5;font-weight:600}
.dict-list .pron{color:#8f8f93;font-style:italic}
.dict-empty{text-align:center;color:#8f8f93;padding:40px 0;display:none}

/* locations */
.loc-state{margin-bottom:44px}
.loc-state>h3{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:1.3rem;letter-spacing:.1em;color:#fff;border-bottom:2px solid #c8102e;padding-bottom:10px;margin:0 0 22px}
.loc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
.loc-card{background:#131313;border:1px solid #232327;border-radius:6px;padding:22px 24px;transition:border-color .2s,transform .2s}
.loc-card:hover{border-color:#3a3a40;transform:translateY(-3px)}
.loc-card h4{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:.95rem;color:#d4a24a;margin:0 0 6px}
.loc-card .loc-name{color:#fff;font-weight:600;margin:0 0 6px}
.loc-card p{color:#a5a5aa;font-size:.86rem;margin:0 0 4px}
.loc-card a{color:#c8102e;text-decoration:none;font-weight:600}
.loc-card a:hover{text-decoration:underline}

/* contact form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.form-grid .full{grid-column:1/-1}
.field label{display:block;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:#8f8f93;margin-bottom:7px;font-weight:600}
.field input,.field select,.field textarea{width:100%;background:#131313;border:1px solid #2c2c31;color:#f4f4f5;padding:13px 15px;font:inherit;font-size:.95rem;border-radius:4px;outline:none;transition:border-color .15s}
.field input:focus,.field textarea:focus,.field select:focus{border-color:#c8102e}
.field textarea{min-height:140px;resize:vertical}
@media(max-width:640px){.form-grid{grid-template-columns:1fr}}
.contact-cards{display:grid;gap:16px}
.contact-card{display:flex;gap:16px;align-items:center;background:#131313;border:1px solid #232327;border-radius:6px;padding:18px 22px;text-decoration:none;transition:border-color .2s,transform .2s}
.contact-card:hover{border-color:#c8102e;transform:translateY(-2px)}
.contact-card .ico{width:46px;height:46px;border-radius:4px;background:#1a1a1d;display:grid;place-items:center;font-size:1.1rem;flex-shrink:0}
.contact-card b{display:block;color:#fff;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:.88rem}
.contact-card span{color:#a5a5aa;font-size:.88rem}

/* ── Footer ─────────────────────────────────────────────── */
.site-footer{background:#060607;border-top:1px solid #1c1c1f;margin-top:40px}
.footer-inner{max-width:1200px;margin:0 auto;padding:60px 5vw 30px;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px}
@media(max-width:920px){.footer-inner{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.footer-inner{grid-template-columns:1fr}}
.site-footer h4{font-family:'Oswald',sans-serif;text-transform:uppercase;font-size:.82rem;letter-spacing:.16em;color:#fff;margin:0 0 16px}
.site-footer ul{list-style:none;margin:0;padding:0}
.site-footer li{margin-bottom:9px}
.site-footer a{color:#9a9a9f;text-decoration:none;font-size:.88rem;transition:color .15s}
.site-footer a:hover{color:#d4a24a}
.footer-brand img{height:40px;margin-bottom:16px}
.footer-brand p{color:#8f8f93;font-size:.86rem;max-width:300px;margin:0 0 18px}
.footer-bottom{border-top:1px solid #1c1c1f;padding:20px 5vw;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;max-width:1200px;margin:0 auto;font-size:.78rem;color:#6f6f74}
.footer-bottom a{color:#9a9a9f;text-decoration:none}

/* ── Reveal animations ────────────────────────────────── */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.2,.7,.3,1),transform .7s cubic-bezier(.2,.7,.3,1)}
.reveal.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){
  .reveal{opacity:1;transform:none;transition:none}
  .hero-bg{animation:none}
  html{scroll-behavior:auto}
}
`;

// ── Shared page JS ────────────────────────────────────────────────────────────
const SITE_JS = `
(function(){
  // sticky header shadow
  var hdr = document.querySelector('.site-header');
  var onScroll = function(){ if(hdr) hdr.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

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
      if (!li.querySelector('.m-sub')) return; // no submenu, navigate
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
        var dur = 1400;
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
    const cls = [
      'nav-links-item',
      item.children ? 'has-drop' : '',
      item.key === activeKey ? 'active' : '',
      item.accent ? 'nav-accent' : '',
    ].filter(Boolean).join(' ');
    const arrow = item.children ? ' <span class="nav-arrow">▾</span>' : '';
    const subs = item.children
      ? `<ul class="drop">${item.children
          .map((c) => `<li><a href="${c.href}">${esc(c.label)}</a></li>`)
          .join('')}</ul>`
      : '';
    return `<li class="${cls}"><a href="${item.href}"${item.key === activeKey ? ' class="active"' : ''}>${esc(item.label)}${arrow}</a>${subs}</li>`;
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
  </nav>`;
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
  return `<section class="page-hero" ${bg ? `style="background-image:url('${bg}')"` : 'style="background:#101013"'}>
    <div class="page-hero-inner">
      ${crumbHtml}
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h1>${title}</h1>
      ${lead ? `<p class="lead">${lead}</p>` : ''}
    </div>
  </section>`;
}

function sectionOpen(alt = false) {
  return alt ? `<div class="section alt"><div class="inner">` : `<div class="section">`;
}
function sectionClose(alt = false) {
  return alt ? `</div></div>` : `</div>`;
}

export { esc, IMG_ORIGIN, LOGO, pageShell, pageHero, siteHeader, siteFooter };

// ─────────────────────────────────────────────────────────────────────────────
//  team.imakarate.com — IMA Competition Team site.
//
//  Rebuilt from the old WordPress site (archived Sept 2025) after the domain
//  moved to Cloudflare. Same pages and content, served by this Worker.
//  Images live in /assets/team (Workers Static Assets).
//
//  Sponsor registration form → KV record + email to the notify list.
// ─────────────────────────────────────────────────────────────────────────────

import { sendEmail, DEFAULT_NOTIFY_EMAILS } from './notify.js';

export const TEAM_HOSTS = ['team.imakarate.com', 'www.team.imakarate.com'];

const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ENT[c]);

const A = '/team';
const NAV = [
  { href: '/', label: 'Home' },
  { href: '/events/', label: 'Event Schedule' },
  { href: '/sponsors/', label: 'Our Sponsors' },
  { href: '/become-a-sponsor/', label: 'Become A Sponsor' },
];

const CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#0b0b0c;color:#ececee;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:#efcc3a}
img{max-width:100%;display:block}
h1,h2,h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.02em;line-height:1.15;margin:0 0 .6em;color:#fff}
.wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.hdr{position:fixed;inset:0 0 auto 0;z-index:50;transition:background .3s,box-shadow .3s}
.hdr.solid{background:rgba(11,11,12,.94);backdrop-filter:blur(10px);box-shadow:0 1px 0 rgba(255,255,255,.06)}
.hdr .wrap{display:flex;align-items:center;justify-content:space-between;height:76px;gap:16px}
.hdr .logo img{height:44px;width:auto}
.nav{display:flex;gap:26px;align-items:center}
.nav a{color:#ececee;text-decoration:none;font-weight:500;font-size:15px;position:relative}
.nav a::after{content:'';position:absolute;left:0;right:100%;bottom:-6px;height:2px;background:#efcc3a;transition:right .25s}
.nav a:hover::after,.nav a.on::after{right:0}
.btn{display:inline-block;background:#efcc3a;color:#111;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:6px;border:0;cursor:pointer;font-size:15px;transition:transform .2s,box-shadow .2s;font-family:inherit}
.btn:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(239,204,58,.25)}
.btn.ghost{background:transparent;color:#efcc3a;box-shadow:inset 0 0 0 2px #efcc3a}
.menu-btn{display:none;background:none;border:0;color:#fff;cursor:pointer;padding:8px}
.menu-btn span{display:block;width:24px;height:2px;background:#fff;margin:5px 0;transition:.3s}
@media(max-width:860px){
 .menu-btn{display:block}
 .nav{position:fixed;inset:76px 0 auto 0;flex-direction:column;align-items:flex-start;background:#0b0b0c;padding:20px 24px 28px;gap:18px;transform:translateY(-130%);transition:transform .3s;box-shadow:0 12px 30px rgba(0,0,0,.5)}
 .nav.open{transform:none}
 .nav .btn{width:100%;text-align:center}
}
.hero{position:relative;min-height:78vh;display:flex;align-items:flex-end;padding:140px 0 70px;background:#000 center/cover no-repeat;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.6) 45%,rgba(0,0,0,.2) 100%),linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.35) 60%,#0b0b0c 100%)}
.hero.short{min-height:52vh}
.hero .wrap{position:relative;z-index:2;width:100%}
.hero h1,.hero p{text-shadow:0 2px 18px rgba(0,0,0,.55)}
.hero .kicker{color:#efcc3a;font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:13px;margin-bottom:12px}
.hero h1{font-size:clamp(36px,6vw,68px);max-width:880px}
.hero p{font-size:clamp(16px,1.6vw,19px);max-width:640px;color:#d6d6da;margin:0 0 26px}
.hero .ctas{display:flex;gap:14px;flex-wrap:wrap}
.hero-bg{position:absolute;inset:-6% 0 0 0;background:inherit;background-size:cover;background-position:center;will-change:transform}
section{padding:80px 0}
.lead{font-size:18px;color:#cfcfd4}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
@media(max-width:860px){.grid2,.grid3{grid-template-columns:1fr;gap:28px}}
.photo-stack{position:relative;min-height:440px}
.photo-stack img{border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.5);object-fit:cover}
.photo-stack .p1{width:62%;aspect-ratio:842/1024}
.photo-stack .p2{position:absolute;right:0;bottom:0;width:58%;aspect-ratio:4/3;border:4px solid #0b0b0c}
@media(max-width:860px){.photo-stack{min-height:0}.photo-stack .p1{width:72%}.photo-stack .p2{position:relative;width:64%;margin:-90px 0 0 auto}}
.card{background:#141416;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:30px;transition:transform .25s,border-color .25s}
.card:hover{transform:translateY(-4px);border-color:rgba(239,204,58,.5)}
.card h3{font-size:22px}
.badge{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#efcc3a;margin-bottom:10px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:34px}
.stat{border-left:3px solid #efcc3a;padding-left:16px}
.stat b{display:block;font-family:'Oswald',sans-serif;font-size:34px;color:#fff;line-height:1.1}
.stat span{font-size:14px;color:#a9a9b0}
@media(max-width:600px){.stats{grid-template-columns:1fr}}
.logos{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:center}
.logos a{background:#fff;border-radius:10px;padding:16px 22px;display:flex;align-items:center;justify-content:center;width:220px;height:100px;transition:transform .25s}
.logos a:hover{transform:translateY(-3px)}
.logos img{max-height:64px;width:auto;object-fit:contain}
.band{background:linear-gradient(135deg,#1a1608,#0b0b0c 60%);border-top:1px solid rgba(239,204,58,.18);border-bottom:1px solid rgba(239,204,58,.18)}
.timeline{position:relative;margin:30px 0 0;padding:0;list-style:none}
.timeline::before{content:'';position:absolute;left:18px;top:6px;bottom:6px;width:2px;background:linear-gradient(#efcc3a,rgba(239,204,58,.1))}
.timeline li{position:relative;padding:0 0 26px 56px}
.timeline li::before{content:'';position:absolute;left:11px;top:8px;width:16px;height:16px;border-radius:50%;background:#0b0b0c;border:3px solid #efcc3a}
.ev{background:#141416;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:20px 24px;display:grid;grid-template-columns:130px 1fr auto;gap:18px;align-items:center}
.ev .when{font-family:'Oswald',sans-serif;color:#efcc3a;text-transform:uppercase;font-size:17px;letter-spacing:.04em}
.ev h3{font-size:20px;margin:0 0 2px}
.ev .where{color:#a9a9b0;font-size:15px}
.ev a{font-size:14px;font-weight:600;text-decoration:none;white-space:nowrap}
@media(max-width:700px){.ev{grid-template-columns:1fr;gap:6px}.ev a{white-space:normal}}
.tier{position:relative;overflow:hidden}
.medal{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:15px;color:#1a1a1a;margin-bottom:18px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),0 6px 18px rgba(0,0,0,.4)}
.medal.gold{background:radial-gradient(circle at 35% 30%,#fff3b0,#efcc3a 45%,#b8901a)}
.medal.silver{background:radial-gradient(circle at 35% 30%,#fff,#c9ccd1 45%,#878b92)}
.medal.bronze{background:radial-gradient(circle at 35% 30%,#ffd9b3,#cd7f32 45%,#8a4f1c)}
.price{font-family:'Oswald',sans-serif;font-size:40px;color:#fff;line-height:1}
.price small{font-family:'Inter',sans-serif;font-size:13px;color:#a9a9b0;display:block;margin-top:6px;letter-spacing:.02em}
.perks{list-style:none;padding:0;margin:20px 0 0}
.perks li{position:relative;padding:0 0 10px 26px;font-size:15px;color:#d6d6da}
.perks li::before{content:'';position:absolute;left:0;top:8px;width:12px;height:7px;border-left:2px solid #efcc3a;border-bottom:2px solid #efcc3a;transform:rotate(-45deg)}
.tier.feat{border-color:rgba(239,204,58,.6);box-shadow:0 0 0 1px rgba(239,204,58,.25),0 20px 50px rgba(0,0,0,.4)}
.sp{display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:center;padding:26px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.sp .lg{background:#fff;border-radius:10px;padding:16px;display:flex;align-items:center;justify-content:center;height:110px}
.sp .lg img{max-height:78px;width:auto}
.sp h3{font-size:20px;margin-bottom:4px}
@media(max-width:700px){.sp{grid-template-columns:1fr}}
.friends{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.friends a,.friends span{background:#141416;border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:9px 16px;font-size:14px;color:#ececee;text-decoration:none;transition:border-color .2s}
.friends a:hover{border-color:#efcc3a}
form.reg{display:grid;grid-template-columns:1fr 1fr;gap:16px}
form.reg .full{grid-column:1/-1}
form.reg label{display:block;font-size:13px;font-weight:600;color:#c9c9cf;margin-bottom:6px}
form.reg input,form.reg select,form.reg textarea{width:100%;background:#0f0f11;border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;padding:12px 14px;font:inherit;font-size:15px}
form.reg input:focus,form.reg select:focus,form.reg textarea:focus{outline:none;border-color:#efcc3a;box-shadow:0 0 0 3px rgba(239,204,58,.18)}
form.reg .hp{position:absolute;left:-9999px}
@media(max-width:700px){form.reg{grid-template-columns:1fr}}
.note{border-radius:10px;padding:16px 20px;margin-bottom:24px}
.note.ok{background:rgba(52,199,89,.12);border:1px solid rgba(52,199,89,.45)}
.note.err{background:rgba(255,69,58,.12);border:1px solid rgba(255,69,58,.45)}
footer{border-top:1px solid rgba(255,255,255,.07);padding:44px 0 34px;color:#9a9aa2;font-size:14px}
footer .wrap{display:flex;flex-wrap:wrap;gap:20px;justify-content:space-between;align-items:center}
footer img{height:36px;width:auto}
footer a{color:#c9c9cf;text-decoration:none}
footer a:hover{color:#efcc3a}
.rv{opacity:0;transform:translateY(26px);transition:opacity .8s ease,transform .8s ease}
.rv.in{opacity:1;transform:none}
.rv.d1{transition-delay:.1s}.rv.d2{transition-delay:.2s}.rv.d3{transition-delay:.3s}
@media(prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}.hero-bg{transform:none!important}}
`;

const JS = `
(function(){
  var h=document.querySelector('.hdr');
  function onScroll(){ if(h) h.classList.toggle('solid', window.scrollY>30);
    var bg=document.querySelector('.hero-bg'); if(bg && window.scrollY<900) bg.style.transform='translateY('+(window.scrollY*0.25)+'px)'; }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  var b=document.querySelector('.menu-btn'), n=document.querySelector('.nav');
  if(b&&n) b.addEventListener('click',function(){ var o=n.classList.toggle('open'); b.setAttribute('aria-expanded',o); });
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in'); io.unobserve(e.target);} });},{threshold:.12});
    els.forEach(function(el){io.observe(el);});
  } else els.forEach(function(el){el.classList.add('in');});
  document.querySelectorAll('[data-count]').forEach(function(el){
    var end=+el.getAttribute('data-count'), suf=el.getAttribute('data-suffix')||'', done=false;
    var o=new IntersectionObserver(function(es){ if(es[0].isIntersecting && !done){ done=true; var t0=null;
      function step(t){ if(!t0)t0=t; var p=Math.min((t-t0)/1200,1); el.textContent=Math.round(end*(1-Math.pow(1-p,3)))+suf; if(p<1) requestAnimationFrame(step);} requestAnimationFrame(step);} });
    o.observe(el);
  });
})();
`;

function shell({ title, path, desc, body }) {
  const nav = NAV.map((n) => `<a href="${n.href}"${n.href === path ? ' class="on"' : ''}>${esc(n.label)}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="https://team.imakarate.com${A}/team-hero.jpg" />
<link rel="canonical" href="https://team.imakarate.com${path}" />
<link rel="icon" href="${A}/team-logo.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${CSS}</style>
</head>
<body>
<header class="hdr">
  <div class="wrap">
    <a class="logo" href="/" aria-label="IMA Competition Team home"><img src="${A}/team-logo.svg" alt="IMA Competition Team" width="192" height="44" /></a>
    <button class="menu-btn" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="nav">${nav}<a class="btn" href="/become-a-sponsor/sponsor-registration/">Sponsor the Team</a></nav>
  </div>
</header>
<main>${body}</main>
<footer>
  <div class="wrap">
    <img src="${A}/team-logo.svg" alt="IMA Competition Team" width="157" height="36" />
    <div>Team I.M.A. is a not for profit, 501(c)(3) organization (number 81-2829023).</div>
    <div><a href="https://imakarate.com/">imakarate.com</a> &nbsp;·&nbsp; <a href="/become-a-sponsor/">Become A Sponsor</a></div>
  </div>
  <div class="wrap" style="margin-top:14px"><div>&copy;${new Date().getFullYear()} Team IMA Development</div></div>
</footer>
<script>${JS}</script>
</body>
</html>`;
}

function hero({ img, kicker, title, text, ctas = '', short = false }) {
  return `<section class="hero${short ? ' short' : ''}" style="background-image:url('${img}')">
  <div class="hero-bg" style="background-image:url('${img}')"></div>
  <div class="wrap">
    ${kicker ? `<div class="kicker rv">${esc(kicker)}</div>` : ''}
    <h1 class="rv d1">${title}</h1>
    ${text ? `<p class="rv d2">${text}</p>` : ''}
    ${ctas ? `<div class="ctas rv d3">${ctas}</div>` : ''}
  </div>
</section>`;
}

// ── Content ───────────────────────────────────────────────────────────────────
const SPONSORS = {
  gold: [{
    name: 'Aquilant Advisors', url: 'https://www.aquilantadvisors.com/', logo: 'logo-aquilant.png', link: 'AquilantAdvisors.com',
    text: 'Aquilant Advisors is a Town &amp; Country, Missouri, professional service firm, a team of independent financial advisors with professional credentials and a wealth of experience of advising affluent individuals in greater St. Louis to achieve their professional goals.',
  }],
  silver: [{
    name: 'Gliffen', url: 'https://gliffen.com/', logo: 'logo-gliffen.png', link: 'Gliffen.com',
    text: 'Let us help you improve your presence on the web. We design, build, market &amp; optimize your business&rsquo;s web presence.',
  }],
  bronze: [
    {
      name: 'Maureen Thomm, D.C.', sub: 'Colorado Spine and Sport', url: 'https://coloradospineandsport.com/', logo: 'logo-colorado-spine.png', link: 'coloradospineandsport.com',
      text: 'Serving Boulder County&rsquo;s active families since 2001. Colorado Spine and Sport is a full service clinic providing chiropractic, physical therapy, sports medicine, massage therapy, and radiology services all onsite.',
    },
    {
      name: 'Jay Barta, DDS', sub: 'The Dentist in Louisville', url: 'https://thedentistinlouisville.com/', logo: 'logo-dentist-louisville.png', link: 'thedentistinlouisville.com',
      text: 'The Dentist in Louisville wants to be the dentist you can trust with your oral health no matter what your needs may be. Our team is ready to wow patients of all ages with results that will leave everyone smiling. Dr. Barta is passionate about achieving optimal oral health for his patients, but he also wants to give them newfound confidence with an attractive smile.',
    },
  ],
  friends: [
    ['Melcher Orthodontics', 'https://melcherorthodontics.com/'],
    ['Ace Hardware'],
    ['DP&rsquo;s Sweet Life', 'https://dpssweetlife.com/'],
    ['Fantasy Orchids', 'https://www.fantasyorchids.com/'],
    ['Firebreather Fine Art', 'https://firebreather-fine-art.square.site/'],
    ['Front Range Gardens', 'https://www.frontrangegardens.com/'],
    ['Hardy Boy Plant', 'https://www.hardyboyplant.com/'],
    ['JAX Outdoor'],
    ['Lafayette Florist', 'https://www.lafayetteflorist.com/'],
    ['Tractor Supply Co.'],
    ['Urban Garden', 'https://www.urbangardencolorado.com/'],
  ],
};

const HOME_LOGOS = [
  ['Aquilant Advisors', 'https://www.aquilantadvisors.com/', 'logo-aquilant.png'],
  ['Gliffen', 'https://gliffen.com/', 'logo-gliffen.png'],
  ['The Dentist in Louisville', 'https://thedentistinlouisville.com/', 'logo-dentist-louisville.png'],
  ['Colorado Spine and Sport', 'https://coloradospineandsport.com/about-us/meet-our-staff/maureen-thomm--dc--bs.html', 'logo-colorado-spine.png'],
  ['Kikin Inspection', 'http://www.kikininspection.com/', 'logo-kikin.jpg'],
];

const EVENTS = [
  ['US Open &amp; Junior International Cup', 'March/April', 'Location Varies', 'USA Karate', 'https://www.usankf.org/calendar'],
  ['Rocky Mountain Championship', 'May', 'Louisville, CO', 'IMA Karate', 'https://imakarate.com/'],
  ['AKR Open', 'June', 'Houston, TX', 'AKR Dojo', 'https://fb.me/e/1h78AZ6Jc'],
  ['National Karate Championships &amp; Team Trials', 'July', 'Location Varies', 'USA Karate', 'https://www.usankf.org/calendar'],
  ['Orlando International Open', 'September', 'Orlando, FL', 'Orlando International Open', 'https://oikousa.com'],
  ['Spirit of Denver', 'November', 'Aurora, CO', 'Spirit of Denver', 'https://www.colosseumdata.com/img/files/1663690322_903619.pdf'],
  ['Rien Cup Karate Championship', 'November', 'Pearland, TX (Houston)', 'Rien Cup Karate Championship', 'https://www.colosseumdata.com/img/files/1663690322_903619.pdf'],
  ['IMA Utah Championship', 'October/November', 'Salt Lake City, UT', 'IMA Utah Championship', 'https://www.utahshotokankarate.com/'],
  ['The Suzuki Cup', 'December', 'Plano, TX (Dallas/Ft. Worth)', '', ''],
];

const TIERS = [
  {
    key: 'gold', name: 'Gold Medalist', amount: 500, perks: [
      'Receive a Team IMA photo, autographed by all team members to proudly hang in your business.',
      '4 Tickets to join the IMA Competition Team end of season banquet and includes a &ldquo;Meet The Athletes&rdquo; pre-event.',
      'Logo and link to your business on our IMA Competition Team website.',
      'Large Logo on back of team t-shirt. Worn by all team athletes, coaches, parents and team supporters.',
      'Large Logo on traveling team banner.*',
      'Logo and link to your business from website homepage',
      '4 Tickets to attend the Rocky Mountain Championship',
    ],
  },
  {
    key: 'silver', name: 'Silver Medalist', amount: 250, perks: [
      'Receive a Team IMA photo, autographed by all team members to proudly hang in your business.',
      '2 Tickets to join the IMA Competition Team end of season banquet and includes a &ldquo;Meet The Athletes&rdquo; pre-event.',
      'Logo and link to your business on our IMA Competition Team website.',
      'Medium Logo on back of team t-shirt. Worn by all team athletes, coaches, parents and team supporters.',
      'Medium Logo on traveling team banner.*',
    ],
  },
  {
    key: 'bronze', name: 'Bronze Medalist', amount: 100, perks: [
      'Receive a Team IMA photo, autographed by all team members to proudly hang in your business.',
      '2 Tickets to join the IMA Competition Team end of season banquet and includes a &ldquo;Meet The Athletes&rdquo; pre-event.',
      'Logo and link to your business on our IMA Competition Team website.',
      'Small Logo on back of team t-shirt. Worn by all team athletes, coaches, parents and team supporters.',
    ],
  },
];

// ── Pages ─────────────────────────────────────────────────────────────────────
function homePage() {
  const logos = HOME_LOGOS.map(([n, u, l], i) => `<a class="rv d${i % 4}" href="${u}" target="_blank" rel="noopener"><img src="${A}/${l}" alt="${esc(n)}" loading="lazy" /></a>`).join('');
  const body = `
${hero({
    img: `${A}/team-hero.jpg`,
    kicker: 'Team I.M.A.',
    title: 'Welcome to the International Martial Arts Association Karate Competition Team',
    text: 'An elite competition team from the IMA Hombu Dojo in Louisville, CO.',
    ctas: '<a class="btn" href="/events/">View Events</a><a class="btn ghost" href="/become-a-sponsor/">Become a Sponsor</a>',
  })}
<section>
  <div class="wrap grid2">
    <div class="photo-stack rv">
      <a href="https://imakarate.com/" target="_blank" rel="noopener"><img class="p1" src="${A}/team-athlete.jpg" alt="IMA competition team athlete" loading="lazy" /></a>
      <img class="p2" src="${A}/usa-nationals-2021.jpg" alt="2021 USA Nationals" loading="lazy" />
    </div>
    <div>
      <p class="lead rv">The International Martial Arts Association Hombu Dojo has been in operation in Louisville, CO for over 30 years. During this time it has grown into an internationally recognized dojo. For those fortunate enough to find its doors we know what a special place it is, giving not only second-to-none karate instruction but also teaching the more important lessons of teamwork, discipline, and dedication to our children.</p>
      <p class="rv d1">The dojo has an elite competition team that trains as hard as any high school sports team and routinely has athletes winning major tournaments and even competing for spots on the US Olympic team. We currently receive no public revenue and our team&rsquo;s travel expenses are exclusively funded through members&rsquo; parents.</p>
      <p class="rv d2">Throughout the year parents, athletes, and coaches hold fundraising events to help offset equipment, tournament fees and training expenses for the athletes. The funds raised go directly to the athletes who are on the competition team that calendar year. Team I.M.A. is a not for profit, 501(c)(3) organization (number 81-2829023).</p>
      <div class="stats rv d3">
        <div class="stat"><b data-count="30" data-suffix="+">30+</b><span>Years in Louisville, CO</span></div>
        <div class="stat"><b>6-8</b><span>Tournaments each year</span></div>
        <div class="stat"><b>501(c)(3)</b><span>Not for profit</span></div>
      </div>
    </div>
  </div>
</section>
<section class="band">
  <div class="wrap grid2">
    <div class="card rv">
      <div class="badge">Events</div>
      <h2>Event Schedule</h2>
      <p>Each year our team attends 6-8 tournaments around the country. Explore our event schedule for this season.</p>
      <a class="btn" href="/events/">View Events</a>
    </div>
    <div class="card rv d1">
      <div class="badge">Sponsorship</div>
      <h2>Support the Team</h2>
      <p>We offer a number of sponsorship levels for businesses that would like to support our team.</p>
      <a class="btn" href="/become-a-sponsor/">Become a Sponsor</a>
    </div>
  </div>
</section>
<section>
  <div class="wrap" style="text-align:center">
    <h2 class="rv">Thank You to Our Sponsors</h2>
    <div class="logos" style="margin-top:28px">${logos}</div>
    <p class="rv" style="margin-top:28px"><a href="/sponsors/">See all sponsors &rarr;</a></p>
  </div>
</section>`;
  return shell({ title: 'IMA Competition Team – International Martial Arts Official Team Website', path: '/', desc: 'The International Martial Arts Association Karate Competition Team from the IMA Hombu Dojo in Louisville, CO.', body });
}

function eventsPage() {
  const items = EVENTS.map(([name, when, where, more, url]) => `<li class="rv"><div class="ev">
    <div class="when">${when}</div>
    <div><h3>${name}</h3><div class="where">${where}</div></div>
    <div>${url ? `<a href="${url}" target="_blank" rel="noopener">More info: ${more} &rarr;</a>` : ''}</div>
  </div></li>`).join('');
  const body = `
${hero({ img: '/img/competition-team.jpg', kicker: 'Upcoming Events', title: 'Events Schedule', short: true,
    text: 'The IMA competition team travels to a number of tournaments throughout the country on an annual basis. These tournaments include USA Karate Signature events, most USA Karate Sanctioned events as well as a handful of other tournaments each year.' })}
<section>
  <div class="wrap" style="max-width:900px">
    <ul class="timeline">${items}</ul>
  </div>
</section>`;
  return shell({ title: 'Events – IMA Competition Team', path: '/events/', desc: 'Annual tournament schedule for the IMA Karate Competition Team.', body });
}

function sponsorsPage() {
  const row = (s) => `<div class="sp rv">
    <a class="lg" href="${s.url}" target="_blank" rel="noopener"><img src="${A}/${s.logo}" alt="${esc(s.sub || s.name)}" loading="lazy" /></a>
    <div><h3>${s.name}</h3>${s.sub ? `<div class="badge" style="margin-bottom:8px">${s.sub}</div>` : ''}<p style="margin:0">${s.text} <a href="${s.url}" target="_blank" rel="noopener">${s.link}</a></p></div>
  </div>`;
  const level = (cls, label, list) => `<div style="margin-bottom:46px">
    <div style="display:flex;align-items:center;gap:14px" class="rv"><div class="medal ${cls}" style="margin:0;width:46px;height:46px;font-size:12px"></div><h2 style="margin:0">${label}</h2></div>
    ${list.map(row).join('')}
  </div>`;
  const friends = SPONSORS.friends.map(([n, u]) => (u ? `<a href="${u}" target="_blank" rel="noopener">${n}</a>` : `<span>${n}</span>`)).join('');
  const body = `
${hero({ img: '/img/team-track-suits.jpg', kicker: 'Our Sponsors', title: 'Thank You to Our Sponsors', short: true,
    text: 'These businesses and friends help our athletes travel, train and compete.' })}
<section>
  <div class="wrap" style="max-width:980px">
    ${level('gold', 'Gold Medal Sponsors', SPONSORS.gold)}
    ${level('silver', 'Silver Medal Sponsors', SPONSORS.silver)}
    ${level('bronze', 'Bronze Medal Sponsors', SPONSORS.bronze)}
    <h2 class="rv">Friends of Team IMA</h2>
    <div class="friends rv">${friends}</div>
  </div>
</section>
<section class="band">
  <div class="wrap" style="text-align:center">
    <h2 class="rv">Become a Sponsor</h2>
    <p class="rv d1" style="max-width:620px;margin:0 auto 22px">We offer a number of sponsorship levels for businesses that would like to support our team.</p>
    <a class="btn rv d2" href="/become-a-sponsor/">View Sponsorship Levels</a>
  </div>
</section>`;
  return shell({ title: 'Sponsors – IMA Competition Team', path: '/sponsors/', desc: 'Gold, Silver and Bronze Medal sponsors and friends of Team IMA.', body });
}

function becomeSponsorPage() {
  const cards = TIERS.map((t, i) => `<div class="card tier rv d${i}${i === 0 ? ' feat' : ''}">
    <div class="medal ${t.key}">${t.key === 'gold' ? '1st' : t.key === 'silver' ? '2nd' : '3rd'}</div>
    <h3>${t.name}</h3>
    <div class="price">$${t.amount}<small>Suggested minimum donation</small></div>
    <ul class="perks">${t.perks.map((p) => `<li>${p}</li>`).join('')}</ul>
    <a class="btn${i === 0 ? '' : ' ghost'}" style="margin-top:12px" href="/become-a-sponsor/sponsor-registration/?level=${t.key}">Become a ${t.name.split(' ')[0]} Sponsor</a>
  </div>`).join('');
  const body = `
${hero({ img: '/img/talking-competitors.jpg', kicker: 'Sponsorship', title: 'Become a Team I.M.A. Sponsor', short: true,
    text: 'We offer a few different sponsorship levels for businesses or individuals that would like to help support our team. IMA Competition Team is a not for profit, 501(c)(3) organization and funds are used to offset equipment, tournament fees and training expenses for the athletes.',
    ctas: '<a class="btn" href="/become-a-sponsor/sponsor-registration/">Sponsor Registration</a>' })}
<section>
  <div class="wrap">
    <div class="grid3">${cards}</div>
    <p class="rv" style="margin-top:30px;color:#a9a9b0;font-size:14px;max-width:860px">* Our Team banner travels with athletes to all the participating regional and national karate tournaments. Banner is proudly displayed for hundreds of spectators, athletes, coaches, volunteers and more at karate tournament events. Banner hangs at home IMA Headquarter Dojo in Louisville, CO when the team is not traveling.</p>
  </div>
</section>`;
  return shell({ title: 'Become A Sponsor – IMA Competition Team', path: '/become-a-sponsor/', desc: 'Gold, Silver and Bronze sponsorship levels for Team IMA, a 501(c)(3) not for profit.', body });
}

const LEVELS = { gold: 'Gold Medalist ($500)', silver: 'Silver Medalist ($250)', bronze: 'Bronze Medalist ($100)', friend: 'Friend of Team IMA' };

function registrationPage({ level = '', sent = false, error = '', values = {} } = {}) {
  const v = (k) => esc(values[k] || '');
  const opts = Object.entries(LEVELS).map(([k, l]) => `<option value="${k}"${(values.level || level) === k ? ' selected' : ''}>${l}</option>`).join('');
  const body = `
${hero({ img: `${A}/team-hero.jpg`, kicker: 'Become A Sponsor', title: 'Sponsor Registration', short: true,
    text: 'Fill in the form below to become a sponsor of our team. We will reach out to get a copy of your logo and finalize the registration process.' })}
<section>
  <div class="wrap" style="max-width:820px">
    ${sent ? '<div class="note ok"><strong>Thank you.</strong> Your sponsor registration was received. We will reach out to get a copy of your logo and finalize the registration process.</div>' : ''}
    ${error ? `<div class="note err">${esc(error)}</div>` : ''}
    <div class="card" style="padding:34px">
    <form class="reg" method="post" action="/become-a-sponsor/sponsor-registration/">
      <div class="full"><label for="company">Company Name</label><input id="company" name="company" value="${v('company')}" /></div>
      <div><label for="first">Primary Contact: First</label><input id="first" name="first" value="${v('first')}" required /></div>
      <div><label for="last">Primary Contact: Last</label><input id="last" name="last" value="${v('last')}" required /></div>
      <div><label for="phone">Phone</label><input id="phone" name="phone" type="tel" value="${v('phone')}" /></div>
      <div><label for="email">Email</label><input id="email" name="email" type="email" value="${v('email')}" required /></div>
      <div class="full"><label for="website">Website</label><input id="website" name="website" type="url" placeholder="https://" value="${v('website')}" /></div>
      <div class="full"><label for="street">Street Address</label><input id="street" name="street" value="${v('street')}" /></div>
      <div class="full"><label for="street2">Address Line 2</label><input id="street2" name="street2" value="${v('street2')}" /></div>
      <div><label for="city">City</label><input id="city" name="city" value="${v('city')}" /></div>
      <div><label for="state">State / Province / Region</label><input id="state" name="state" value="${v('state')}" /></div>
      <div><label for="zip">ZIP / Postal Code</label><input id="zip" name="zip" value="${v('zip')}" /></div>
      <div><label for="country">Country</label><input id="country" name="country" value="${v('country') || 'United States'}" /></div>
      <div class="full"><label for="level">Sponsorship Level</label><select id="level" name="level"><option value="">Select a level</option>${opts}</select></div>
      <div class="full"><label for="message">Message (optional)</label><textarea id="message" name="message" rows="4">${v('message')}</textarea></div>
      <div class="hp" aria-hidden="true"><label for="hp_url">Leave blank</label><input id="hp_url" name="hp_url" tabindex="-1" autocomplete="off" /></div>
      <div class="full"><button class="btn" type="submit">Submit Registration</button></div>
    </form>
    </div>
  </div>
</section>`;
  return shell({ title: 'Sponsor Registration – IMA Competition Team', path: '/become-a-sponsor/sponsor-registration/', desc: 'Register to sponsor the IMA Karate Competition Team.', body });
}

const FIELDS = ['company', 'first', 'last', 'phone', 'email', 'website', 'street', 'street2', 'city', 'state', 'zip', 'country', 'level', 'message'];

async function handleRegistration(request, env) {
  const fd = await request.formData();
  const values = {};
  for (const k of FIELDS) values[k] = String(fd.get(k) || '').trim().slice(0, 2000);
  if (String(fd.get('hp_url') || '').trim()) return redirect('/become-a-sponsor/sponsor-registration/?sent=1');
  if (!values.first || !values.last || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
    return html(registrationPage({ error: 'Please enter your first and last name and a valid email address.', values }), 400);
  }
  const id = `team-sponsor:${new Date().toISOString()}:${crypto.randomUUID().slice(0, 8)}`;
  const record = { ...values, levelLabel: LEVELS[values.level] || '', submittedAt: new Date().toISOString() };
  if (env.IMA_KARATE) await env.IMA_KARATE.put(id, JSON.stringify(record));

  const rows = [
    ['Company', values.company], ['Contact', `${values.first} ${values.last}`], ['Email', values.email], ['Phone', values.phone],
    ['Website', values.website], ['Address', [values.street, values.street2, values.city, values.state, values.zip, values.country].filter(Boolean).join(', ')],
    ['Level', record.levelLabel], ['Message', values.message],
  ].filter(([, x]) => x);
  const text = `New Team IMA sponsor registration (team.imakarate.com)\n\n${rows.map(([k, x]) => `${k}: ${x}`).join('\n')}\n`;
  const htmlBody = `<h2 style="font-family:Arial,sans-serif">New Team IMA sponsor registration</h2><table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows.map(([k, x]) => `<tr><td style="padding:6px 14px 6px 0;color:#666;vertical-align:top"><b>${esc(k)}</b></td><td style="padding:6px 0">${esc(x).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table><p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Submitted on team.imakarate.com. Reply to this email to reach the sponsor.</p>`;
  const subject = `Team IMA sponsor registration: ${values.company || `${values.first} ${values.last}`}${record.levelLabel ? ` (${record.levelLabel})` : ''}`;
  const r = await sendEmail(env, { to: DEFAULT_NOTIFY_EMAILS, subject, text, html: htmlBody, replyTo: values.email }).catch((e) => ({ ok: false, error: e.message }));
  if (!r.ok) console.error('team sponsor email failed', r.error);
  return redirect('/become-a-sponsor/sponsor-registration/?sent=1');
}

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', pdf: 'application/pdf' };
export async function teamAsset(env, name) {
  if (!/^[a-z0-9._-]+$/i.test(name) || !env.IMA_KARATE) return new Response('Not found', { status: 404 });
  const buf = await env.IMA_KARATE.get(`team-asset:${name}`, 'arrayBuffer');
  if (!buf) return new Response('Not found', { status: 404 });
  const ext = name.split('.').pop().toLowerCase();
  return new Response(buf, { headers: { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=604800' } });
}

// ── Router ────────────────────────────────────────────────────────────────────
function html(body, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store' } });
}
function redirect(loc, status = 303) { return new Response(null, { status, headers: { Location: loc } }); }

export async function handleTeamSite(request, env, url) {
  if (url.hostname === 'www.team.imakarate.com') {
    url.hostname = 'team.imakarate.com';
    return Response.redirect(url.toString(), 301);
  }
  let p = url.pathname;
  if (p.startsWith('/team/')) return teamAsset(env, p.slice(6));
  if (p !== '/' && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) return redirect(p + '/' + url.search, 301);
  if (p === '/become-a-sponsor/sponsor-registration/') {
    if (request.method === 'POST') return handleRegistration(request, env);
    const res = html(registrationPage({ level: url.searchParams.get('level') || '', sent: url.searchParams.get('sent') === '1' }));
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  if (p === '/') return html(homePage());
  if (p === '/events/') return html(eventsPage());
  if (p === '/sponsors/') return html(sponsorsPage());
  if (p === '/become-a-sponsor/') return html(becomeSponsorPage());
  if (p === '/feed/' || p.startsWith('/wp-')) return redirect('/', 301);
  return html(shell({ title: 'Page not found – IMA Competition Team', path: p, desc: '', body: `<section style="padding:180px 0 100px"><div class="wrap" style="text-align:center"><h1>Page not found</h1><p>That page isn&rsquo;t here.</p><a class="btn" href="/">Go to the team home page</a></div></section>` }), 404);
}

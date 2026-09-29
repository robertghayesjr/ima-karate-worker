// ─────────────────────────────────────────────────────────────────────────────
//  Main site pages: home, about family, programs, how-to-join, contact.
//  Copy follows the live imakarate.com content.
// ─────────────────────────────────────────────────────────────────────────────

import { esc, IMG, pageShell, pageHero } from './siteTheme.js';

const I = (name) => `${IMG}/${name}`;

// ═══════════════════════════════════════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════════════════════════════════════
export function buildHomePage() {
  const content = `
  <!-- HERO -->
  <section class="hero">
    <div class="hero-bg" style="background-image:url('${I('hero-main.jpg')}')"></div>
    <div class="hero-inner">
      <p class="eyebrow">Louisville, Colorado · Since 1991</p>
      <h1>Developing Karate Athletes of the Highest Level</h1>
      <p class="lead">A world-recognized Shotokan karate organization training students and instructors of all levels — from first class to world championship.</p>
      <div class="hero-ctas">
        <a href="/how-to-join" class="btn-primary btn-lg">Join IMA</a>
        <a href="/about" class="btn-outline btn-lg">Learn More</a>
      </div>
    </div>
  </section>

  <!-- STATS -->
  <div class="stats">
    <div class="stat"><b><span data-count="35"></span><span class="gold">+</span></b><span>Years teaching</span></div>
    <div class="stat"><b><span data-count="6"></span></b><span>US National Team members</span></div>
    <div class="stat"><b><span data-count="25"></span><span class="gold">+</span></b><span>Affiliated dojos worldwide</span></div>
    <div class="stat"><b><span data-count="8"></span></b><span>Belt tests each year</span></div>
  </div>

  <!-- WELCOME -->
  <div class="section">
    <div class="grid-2">
      <div class="reveal">
        <p class="eyebrow">Welcome to IMA Karate</p>
        <h2 class="sec">A Karate Family, Not Just a Dojo</h2>
        <div class="prose">
          <p>Our karate family invites you to join us to develop the highest level of technical and philosophical skills in <strong>Traditional and Sport Karate</strong>. We welcome dojos, clubs, and other organizations to learn about our unique methods of teaching karate for all ages and abilities.</p>
          <p>If you are looking for a strong and non-political karate organization, the International Martialarts Association (I.M.A) has built a reputation for producing students and instructors of the highest standards for over 35 years.</p>
        </div>
        <p style="margin-top:22px"><a href="/about" class="card-link">Learn more about IMA Karate →</a></p>
      </div>
      <div class="portrait-pair reveal" data-delay="120">
          <div class="p1"><img src="${I('hanshi-portrait.jpg')}" alt="Hanshi Cyrus Madani, Founder and Chief Instructor" loading="lazy" /></div>
          <div class="p2"><img src="${I('fariba-portrait.jpg')}" alt="Shihan Fariba Madani, Head Instructor" loading="lazy" /></div>
          <div class="pair-badge"><b>Hanshi & Shihan Madani</b>Founders, IMA Karate</div>
        </div>
    </div>
  </div>

  <!-- PROGRAMS -->
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">Programs</p>
        <h2 class="sec">Karate for Every Age & Ability</h2>
        <p class="lead">From four years old to adult, from first-time white belt to national competitor.</p>
      </div>
      <div class="grid-3">
        <a href="/programs#tiny-tigers" class="card reveal">
          <div class="card-img"><img src="${I('tiny-tigers-class.jpg')}" alt="Tiny Tigers class" loading="lazy" /></div>
          <div class="card-body"><h3>Tiny Tigers</h3><p>Ages 4–5. Respect, etiquette, and focus through playful karate fundamentals.</p><span class="card-link">Explore →</span></div>
        </a>
        <a href="/programs#little-dragons" class="card reveal" data-delay="90">
          <div class="card-img"><img src="${I('little-dragons.jpg')}" alt="Little Dragons class" loading="lazy" /></div>
          <div class="card-body"><h3>Little Dragons</h3><p>Ages 5–7. Emotional control and focus built through warmups and games.</p><span class="card-link">Explore →</span></div>
        </a>
        <a href="/programs#youth" class="card reveal" data-delay="180">
          <div class="card-img"><img src="${I('youth-class.jpg')}" alt="Youth class" loading="lazy" /></div>
          <div class="card-body"><h3>Youth Classes</h3><p>Traditional Shotokan techniques and forms with proper dojo etiquette.</p><span class="card-link">Explore →</span></div>
        </a>
        <a href="/programs#adults" class="card reveal">
          <div class="card-img"><img src="${I('adult-class.jpg')}" alt="Teen and adult class" loading="lazy" /></div>
          <div class="card-body"><h3>Teen / Adult</h3><p>Ages 13 and up, all levels. Conditioning, basics, kata, and kumite.</p><span class="card-link">Explore →</span></div>
        </a>
        <a href="/programs#competition" class="card reveal" data-delay="90">
          <div class="card-img"><img src="${I('team-track-suits.jpg')}" alt="IMA competition team" loading="lazy" /></div>
          <div class="card-body"><h3>Competition Team</h3><p>Invite-only elite team competing at national and international tournaments.</p><span class="card-link">Explore →</span></div>
        </a>
        <a href="/student-information/belt-testing-guidelines" class="card reveal" data-delay="180">
          <div class="card-img"><img src="${I('tiny-tiger-photo.jpg')}" alt="Belt testing" loading="lazy" /></div>
          <div class="card-body"><h3>Belt Testing</h3><p>Eight Kyu tests and two Dan tests per year. Register for the next test online.</p><span class="card-link">Explore →</span></div>
        </a>
      </div>
    </div>
  </div>

  <!-- NEWS -->
  <div class="section">
    <div class="section-head reveal">
      <p class="eyebrow">News & Announcements</p>
      <h2 class="sec">From the IMA Family</h2>
    </div>
    <div class="grid-2">
      <a href="/news-events" class="card reveal">
        <div class="card-img"><img src="${I('gasshuku-mountain.jpg')}" alt="2025 Gasshuku" loading="lazy" /></div>
        <div class="card-body">
          <h3>2025 Gasshuku</h3>
          <p>Another exciting Gasshuku in Colorado with special guest instructors Sensei Palmer from Peru and Sensei Obran — hundreds of national and international medals and titles between them.</p>
          <span class="card-link">Read more →</span>
        </div>
      </a>
      <a href="/news-events" class="card reveal" data-delay="120">
        <div class="card-img"><img src="${I('madani-flyer.png')}" alt="Rocky Mountain Championships" loading="lazy" /></div>
        <div class="card-body">
          <h3>Rocky Mountain Championships</h3>
          <p>Celebrating over 30 years of the tournament in Louisville, Colorado. A USA Karate sanctioned event with access to more training and competition opportunities.</p>
          <span class="card-link">Read more →</span>
        </div>
      </a>
    </div>
    <p style="margin-top:26px" class="reveal"><a href="/news-events" class="btn-outline">Read More News & Announcements</a></p>
  </div>

  <!-- JOIN BAND -->
  <section class="cta-band">
    <div class="bg" style="background-image:url('${I('join.jpg')}')"></div>
    <div class="inner reveal">
      <p class="eyebrow">Join IMA Honbu Dojo</p>
      <h2>Train With Us in Louisville, CO</h2>
      <ul class="check-list" style="display:inline-grid;grid-template-columns:1fr 1fr;text-align:left;gap:0 34px;margin-bottom:30px">
        <li>Conveniently scheduled, year-round training classes</li>
        <li>Convenient location for Boulder County and Denver residents</li>
        <li>Competitive monthly fees — no contract required</li>
        <li>World-recognized instructors for all levels and abilities</li>
      </ul>
      <div>
        <a href="/how-to-join" class="btn-primary btn-lg">Join IMA</a>
        <a href="/dojo-locations" class="btn-gold btn-lg" style="margin-left:10px">Find a Dojo Near You</a>
      </div>
    </div>
  </section>

  <!-- COMPETITION TEAM -->
  <div class="section">
    <div class="grid-2">
      <div class="img-frame reveal">
        <img src="${I('competition-team.jpg')}" alt="IMA Competition Team" loading="lazy" />
      </div>
      <div class="reveal" data-delay="120">
        <p class="eyebrow">IMA Competition Team</p>
        <h2 class="sec">Elite Athletes, Elite Results</h2>
        <div class="prose">
          <p>The dojo has an elite competition team that trains as hard as any high school sports team and routinely has athletes winning major tournaments — even competing for spots on the US Olympic team.</p>
        </div>
        <p style="margin-top:22px"><a href="/student-information/instructors" class="card-link">Meet the team →</a></p>
      </div>
    </div>
  </div>

  <!-- STUDENT RESOURCES -->
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">Student Resources</p>
        <h2 class="sec">Everything You Need to Progress</h2>
      </div>
      <div class="grid-2">
        <div class="img-frame reveal">
          <img src="${I('student-resources.jpg')}" alt="Student resources" loading="lazy" />
        </div>
        <div class="reveal" data-delay="120">
          <div class="prose">
            <p>Whether your interest in karate is simply a means of improving your physical fitness, helping yourself gain focus and concentration, or working to compete at the highest levels in tournaments worldwide — currently, 6 IMA students are members of the US National Team — most of the information you’re going to need can be found here.</p>
          </div>
          <ul class="arrow-list" style="margin-top:18px">
            <li><a href="/student-information/belt-testing-guidelines" style="text-decoration:none">Testing Guidelines</a></li>
            <li><a href="/student-information/class-schedule" style="text-decoration:none">Class Schedule</a></li>
            <li><a href="/student-information/karate-dictionary" style="text-decoration:none">Karate Dictionary</a></li>
            <li><a href="/student-information" style="text-decoration:none">More Resources</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- SCHEDULE CTA -->
  <section class="cta-band">
    <div class="bg" style="background-image:url('${I('adult-class.jpg')}')"></div>
    <div class="inner reveal">
      <p class="eyebrow">Class Schedule</p>
      <h2>Six Days a Week, Year-Round</h2>
      <p>Tiny Tigers, Little Dragons, Youth, Teen/Adult, and Black Belt classes — mornings, evenings, and Saturdays.</p>
      <a href="/student-information/class-schedule" class="btn-primary btn-lg">View the Class Schedule</a>
    </div>
  </section>`;

  return pageShell({
    title: 'IMA Karate | Shotokan Karate in Louisville, Colorado',
    description: 'A world-recognized karate organization developing athletes of the highest level in Traditional and Sport Karate. Louisville, Colorado. No contract required.',
    activeNav: 'home',
    content,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — overview
// ═══════════════════════════════════════════════════════════════════════════════
export function buildAboutPage() {
  const content = `
  ${pageHero({
    eyebrow: 'About',
    title: 'About IMA Karate',
    lead: 'A world-recognized karate organization teaching the principles and philosophy of Shotokan Karate.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div class="reveal">
        <div class="prose">
          <p>The IMA Karate family invites you to join us in studying at the highest level of technical skill and philosophy in Shotokan karate.</p>
          <p>We welcome individuals, schools, dojos, karate clubs, and other organizations to learn about our unique methods of teaching karate for all ages and abilities.</p>
        </div>
        <p style="margin-top:24px"><a href="/how-to-join" class="btn-primary">Join IMA</a></p>
      </div>
      <div class="portrait-pair reveal" data-delay="120">
        <div class="p1"><img src="${I('hanshi-portrait.jpg')}" alt="Hanshi Cyrus Madani" loading="lazy" /></div>
        <div class="p2"><img src="${I('fariba-portrait.jpg')}" alt="Shihan Fariba Madani" loading="lazy" /></div>
        <div class="pair-badge"><b>Hanshi & Shihan Madani</b>Founders, IMA Karate</div>
      </div>
    </div>
  </div>
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">Explore</p>
        <h2 class="sec">The IMA Organization</h2>
      </div>
      <div class="grid-3">
        ${[
          ['History of IMA', '/about/history', 'From a handful of students at the Louisville Rec Center in 1990 to a world-recognized organization.'],
          ['Hanshi Cyrus Madani', '/about/hanshi', 'Founder and Chief Instructor. 9th Dan with over 50 years of martial arts experience.'],
          ['Sensei Fariba Madani', '/about/sensei', 'Head Instructor. World and Pan American referee, pioneer for women in karate.'],
          ['Alliances', '/about/alliances', 'Affiliated dojos across the USA, Pan-America, Europe, Africa, and Asia.'],
          ['Organizational Structure', '/about/structure', 'Officers, technical committee, Shihan Kai, referee council, and coaches.'],
          ['Become an Affiliated Dojo', '/about/affiliated-dojo', 'Join the IMA Organization and grow your club with our support.'],
        ]
          .map(
            ([t, h, p], i) => `<a href="${h}" class="card reveal" data-delay="${(i % 3) * 90}">
          <div class="card-body"><h3>${t}</h3><p>${p}</p><span class="card-link">Explore →</span></div></a>`,
          )
          .join('')}
      </div>
    </div>
  </div>`;
  return pageShell({ title: 'About IMA Karate | Shotokan Karate Organization', description: 'The IMA Karate family invites you to join us in studying at the highest level of technical skill and philosophy in Shotokan karate.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — history
// ═══════════════════════════════════════════════════════════════════════════════
export function buildHistoryPage() {
  const content = `
  ${pageHero({
    eyebrow: 'About · History',
    title: 'History of IMA',
    lead: 'Teaching the principles of Shotokan Karate since 1991.',
    bg: I('gasshuku-2009.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'History' }],
  })}
  <div class="section">
    <div class="reveal prose" style="max-width:820px">
      <p>Hanshi Cyrus Madani began teaching Shotokan Karate classes at the Louisville, Colorado Recreation Center in 1990, with just a handful of students. In 1992, with a class size of about 20, he continued to teach and share his love and knowledge of karate with all of his students.</p>
      <p>With a strong sense of reinforcing an “extended family” idea, Hanshi Madani and his students worked together to shape the type of dojo that IMA would become. Even IMA’s symbol, a mountain, reflects the character of the organization and its members: strong, stable, and continuously striving to reach higher.</p>
      <p>By 1993, class sizes had grown and Hanshi Madani began looking for a larger home. In January of 1994, the IMA family moved to a small store front in Pine Street Plaza, in Louisville, Colorado.</p>
      <p>Old walls were torn down and new walls were put up, not by paid contractors, but by the IMA students and their families, eager to do their part to help build IMA into the type of dojo that they wanted to be a part of.</p>
    </div>
    <div class="grid-2" style="margin-top:44px">
      <div class="img-frame reveal"><img src="${I('front-view.png')}" alt="The original IMA dojo storefront" loading="lazy" /></div>
      <div class="img-frame reveal" data-delay="120"><img src="${I('side-view.png')}" alt="Side view of the original dojo" loading="lazy" /></div>
    </div>
    <div class="reveal prose" style="max-width:820px;margin-top:44px">
      <p>Our current facility has a 10,000 square foot main floor, including a 7,000 square foot exercise space and a small playroom for parents with small children.</p>
      <p>IMA’s sense of family has been a driving force behind the success of the organization from the very beginning. Since 1990, thousands of mothers and sons, fathers and daughters, sisters, brothers, and friends have walked through our doors to experience, share, and enjoy the true spirit of karate that is IMA.</p>
    </div>
    <div class="img-frame reveal" style="max-width:640px;margin-top:44px">
      <img src="${I('gasshuku-2009.jpg')}" alt="IMA Gasshuku 2009" loading="lazy" />
    </div>
  </div>`;
  return pageShell({ title: 'History of IMA | Since 1991', description: 'From a handful of students at the Louisville Rec Center in 1990 to a world-recognized Shotokan karate organization.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — hanshi
// ═══════════════════════════════════════════════════════════════════════════════
export function buildHanshiPage() {
  const content = `
  ${pageHero({
    eyebrow: 'About · Leadership',
    title: 'Hanshi Cyrus Madani, 9th Dan',
    lead: 'Founder and Chief Instructor of the International Martialarts Association.',
    bg: I('hanshi-portrait.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Hanshi Madani' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div>
        <div class="img-frame reveal" style="max-width:420px"><img src="${I('hanshi-portrait.jpg')}" alt="Hanshi Cyrus Madani" loading="lazy" /></div>
        <div class="img-frame reveal" data-delay="120" style="max-width:420px;margin-top:20px"><img src="${I('madani-nakayama.jpg')}" alt="Hanshi Madani with Master Nakayama" loading="lazy" /></div>
      </div>
      <div class="reveal" data-delay="90">
        <div class="prose">
          <p>Mr. Madani, the founder and Chief Instructor of the International Martialarts Association (IMA), began his karate training in 1964. He continued his training in several countries and, in addition to karate, has multiple degrees in Kobudo, Iai-do, and Shotokan karate.</p>
          <p>Mr. Madani held the highest license in kata/kumite for the PKF (Pan American Karate Federation) and WKF (World Karate Federation) from 1998–2021 and refereed in many countries.</p>
          <h3>A Teaching Legacy</h3>
          <p>During his long career, Mr. Madani has developed new methods for teaching traditional and sport karate, and includes comparative analyses between them and other methods in his seminars. He has spent over 20 years in research, development, and management in the corporate world, and holds several academic degrees in Business Administration and Electrical Engineering.</p>
          <h3>Karate Is a Family Affair</h3>
          <p>For the Madanis, karate is a family affair. Mr. Madani’s wife Fariba is a 6th Dan (now Hachidan), his son Kamran is a 2nd Dan and bronze-medal winner at the 2011 Junior World Championships in Malaysia and a Pan American medalist, and his daughter Kelara is a 3rd Dan and member of the IMA competition team.</p>
        </div>
      </div>
    </div>
    <div class="img-frame reveal" style="max-width:640px;margin-top:44px">
      <img src="${I('hanshi-ref.jpg')}" alt="Hanshi Madani refereeing" loading="lazy" />
    </div>
  </div>`;
  return pageShell({ title: 'Hanshi Cyrus Madani | Founder & Chief Instructor', description: 'Hanshi Cyrus Madani, 9th Dan, founder and Chief Instructor of the International Martialarts Association.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — sensei
// ═══════════════════════════════════════════════════════════════════════════════
export function buildSenseiPage() {
  const content = `
  ${pageHero({
    eyebrow: 'About · Leadership',
    title: 'Sensei Fariba Madani',
    lead: 'Head Instructor for IMA Karate and World Referee.',
    bg: I('fariba-portrait.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Sensei Madani' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div class="img-frame reveal" style="max-width:420px"><img src="${I('fariba-portrait.jpg')}" alt="Sensei Fariba Madani" loading="lazy" /></div>
      <div class="reveal" data-delay="90">
        <div class="prose">
          <p>Fariba Madani was born and raised in northern Iran, the second-to-youngest of five sisters. An athletic youth, Ms. Madani had her first bike at the age of 7 and was the only girl riding bikes in her neighborhood.</p>
          <p>After graduating from high school, Sensei Madani left Iran to continue her education in architecture in Paris, France. The combination of full-time studies and full-time work left little room for anything else — until karate.</p>
          <h3>A Childhood Dream Fulfilled</h3>
          <p>Two days after her graduation, Sensei Madani fulfilled a childhood dream of visiting the United States when she flew to visit her uncle in California. There she met Hanshi Madani. After four years of training, Sensei Madani achieved her first degree black belt in 1998. Her commitment to karate is unsurpassed — she trained nearly every day while completing her architecture degree.</p>
          <h3>Referee Pioneer</h3>
          <p>An extraordinary, goal-oriented woman, Sensei Madani was the first national karate referee from Colorado and the first U.S. female referee at the Pan American level, for both kata and kumite.</p>
          <p>As a U.S. representative to the referee committee, Sensei Madani is present at all national championships and signature events as well as the World Championships — ensuring her continued growth alongside the athletes.</p>
        </div>
      </div>
    </div>
    <div class="img-frame reveal" style="max-width:640px;margin-top:44px">
      <img src="${I('referees.jpg')}" alt="Sensei Madani refereeing at an international event" loading="lazy" />
    </div>
  </div>`;
  return pageShell({ title: 'Sensei Fariba Madani | Head Instructor & World Referee', description: 'Sensei Fariba Madani, Head Instructor for IMA Karate, national and international referee pioneer.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — alliances
// ═══════════════════════════════════════════════════════════════════════════════
export function buildAlliancesPage() {
  const groups = [
    ['USA', ['Arizona', 'Colorado (5 dojos)', 'Florida', 'Iowa', 'Kansas', 'Nevada (2 dojos)', 'New York', 'Pennsylvania', 'Texas (3 dojos)', 'Utah (6 dojos)']],
    ['Pan-American', ['Aruba', 'Belize', 'El Salvador', 'Nicaragua']],
    ['European', ['Belgium', 'Estonia', 'Romania']],
    ['African', ['Cameroon', 'Mali', 'Senegal']],
    ['Asian', ['India', 'Iran', 'Nepal', 'Pakistan']],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'About · Alliances',
    title: 'National & International Alliances',
    lead: 'IMA-affiliated dojos and organizations across five continents.',
    bg: I('us-map.gif'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Alliances' }],
  })}
  <div class="section">
    <div class="img-frame reveal" style="max-width:680px;margin-bottom:50px"><img src="${I('us-map.gif')}" alt="Map of IMA dojo locations" loading="lazy" /></div>
    <div class="grid-3">
      ${groups
        .map(
          ([region, countries], i) => `
      <div class="card reveal" data-delay="${(i % 3) * 90}">
        <div class="card-body">
          <h3 style="color:#d4a24a">${region}</h3>
          <ul class="arrow-list">
            ${countries.map((c) => `<li>${esc(c)}</li>`).join('')}
          </ul>
        </div>
      </div>`,
        )
        .join('')}
    </div>
    <p style="margin-top:40px" class="reveal"><a href="/about/affiliated-dojo" class="btn-primary">Become an IMA Affiliated Dojo</a></p>
  </div>`;
  return pageShell({ title: 'National & International Alliances | IMA Karate', description: 'IMA-affiliated dojos across the USA, Pan-America, Europe, Africa, and Asia.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — organizational structure
// ═══════════════════════════════════════════════════════════════════════════════
export function buildStructurePage() {
  const sections = [
    ['Officers', [
      'President and Founder: Cyrus Madani, Kudan',
      'Senior Vice President / Treasurer: Fariba Madani, Hachidan',
      '1st Vice President: Rashid Khodabakhsh (President of IMA in Iran), Kudan',
      '2nd Vice President: Walter Arevalo (President of IMA in Peru), Nanadan',
      '3rd Vice President: Kamran Madani (IMA head coach + USA coach), Yondan',
      'Legal Counsel: Michelle Prud’Homme, Nanadan',
    ]],
    ['Technical Committee', [
      'Chairman: Cyrus Madani (U.S.A.), Kudan',
      'Rashid Khodabakhsh (Chief Instructor of IMA Iran), Kudan',
      'Fariba Madani (USA), Hachidan',
      'Patrick Richoux (Chief Instructor of IMA in Central America), Hachidan',
      'Rick McGavin (U.S.A.), Nanadan',
      'Marius Gilca (USA), Nanadan',
      'Amadou Niang (USA), Nanadan',
      'Walter Arevalo (Chief Instructor of IMA in Peru), Nanadan',
      'Shanta Thokar (Chief Instructor of IMA in Nepal), Rokudan',
    ]],
    ['Shihan Kai', ['Fariba Madani', 'Patrick Richoux', 'Rashid Khodabakhsh', 'Rick McGavin', 'Amadou Niang', 'Marius Gilca', 'Walter Arevalo']],
    ['Referee Council', [
      'Chairwoman: Fariba Madani — World and Pan American referee council + Chairwoman of USA Referee Committee',
      'Patrick Richoux, World and Pan American licensee',
      'Walter Arevalo, World and Pan American licensee',
      'Amadou Niang, Pan American licensee',
      'Shanta Thokar, Pan American licensee',
      'Parkhai Rai, Pan American licensee',
    ]],
    ['Competition Team Coaches', [
      'Kamran Madani, IMA head coach',
      'Assistant Coaches: Kelara Madani, Josh Schmidt, AJ Best, Emre Kivanc, Conner Swanson',
    ]],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'About · Governance',
    title: 'IMA Organizational Structure',
    lead: 'The officers, committees, and councils that guide the IMA organization.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Structure' }],
  })}
  <div class="section" style="max-width:900px">
    ${sections
      .map(
        ([title, items], i) => `
    <details class="acc reveal" ${i === 0 ? 'open' : ''}>
      <summary>${title} <span class="nav-arrow">▾</span></summary>
      <div class="acc-body"><ul class="arrow-list">${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    </details>`,
      )
      .join('')}
  </div>`;
  return pageShell({ title: 'IMA Organizational Structure', description: 'Officers, technical committee, Shihan Kai, referee council, and competition team coaches of the IMA organization.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — benefits of IMA
// ═══════════════════════════════════════════════════════════════════════════════
export function buildBenefitsImaPage() {
  const content = `
  ${pageHero({
    eyebrow: 'About · For Clubs & Organizations',
    title: 'Benefits of the IMA Organization',
    lead: 'Support for instructors, coaches, and organizational leaders.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Benefits' }],
  })}
  <div class="section" style="max-width:900px">
    <div class="reveal prose">
      <h3>For Instructors and Coaches</h3>
      <p>The IMA organization offers numerous seminars and training sessions to assist Karate Senseis (instructors) and coaches to develop top-level athletes and to prepare those athletes for national and international competition. Topics include:</p>
    </div>
    <ul class="check-list reveal">
      <li>The differences between traditional and sport karate, and the advantages of each</li>
      <li>How to generate inner power and strength in karate techniques</li>
      <li>Developing speed and agility in kata & kumite at any age</li>
      <li>The development of appropriate training programs for competitors of all ages and abilities</li>
      <li>Becoming a successful coach for youth and adult students</li>
      <li>Ring management and refereeing techniques for competitions</li>
    </ul>
    <div class="reveal prose" style="margin-top:44px">
      <h3>For Organizational Leaders, Owners & Operators</h3>
      <p>In addition to the support you’ll receive for teaching, training, and helping your students successfully compete, the IMA organization offers several seminars on the successful management and operation of karate organizations:</p>
    </div>
    <ul class="check-list reveal">
      <li>New and updated methods for teaching students of all belt levels</li>
      <li>The development of successful manuals to be used for both Kyu (color belt) and Dan (black belt) exams</li>
      <li>How to train your instructors and staff to be more effective in helping to operate your business</li>
      <li>Training yourself physically and spiritually to be an effective instructor and role model for your students</li>
      <li>How to develop new, successful karate programs in your community</li>
      <li>Managing multiple karate facilities</li>
      <li>Teaching your students remotely</li>
      <li>Managing a successful karate dojo, club, or organization</li>
      <li>The basics of owning your own dojo</li>
      <li>Instructor certification</li>
      <li>Official Dan grades, registered in IMA’s headquarters</li>
    </ul>
    <div class="reveal" style="margin-top:44px;background:#131313;border-left:3px solid #c8102e;padding:24px;border-radius:4px">
      <p style="margin:0;color:#c4c4c8">Interested in learning more about the benefits of joining the IMA Organization? Contact our office at <a href="tel:+13036650339" style="color:#d4a24a;font-weight:600">303-665-0339</a> to speak with Hanshi Cyrus Madani to receive the IMA Organization membership package.</p>
    </div>
  </div>`;
  return pageShell({ title: 'Benefits of Joining the IMA Organization', description: 'Seminars, training, and operational support for instructors, coaches, and karate organization leaders.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ABOUT — become an affiliated dojo
// ═══════════════════════════════════════════════════════════════════════════════
export function buildAffiliatedDojoPage() {
  const content = `
  ${pageHero({
    eyebrow: 'About · Membership',
    title: 'Become an IMA Affiliated Dojo',
    lead: 'Join a world-recognized karate organization with over 35 years of history.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Affiliated Dojo' }],
  })}
  <div class="section" style="max-width:900px">
    <div class="reveal prose">
      <p>Contact our office at <a href="tel:+13036650339" style="color:#d4a24a;font-weight:600">303-665-0339</a> to speak with our IMA staff to receive the IMA Organization Membership Package. This package will include a Club Membership Application, Individual Membership Applications, and the current fee schedule.</p>
    </div>
    <h3 class="reveal" style="font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#fff;margin:38px 0 14px">Membership includes</h3>
    <ul class="check-list reveal">
      <li>Technical seminars for all levels and all ages</li>
      <li>Dojo management training and assistance</li>
      <li>Access to annual International Championships as part of the IMA Organization</li>
      <li>Access to special IMA training courses and videos</li>
      <li>Dan promotion with testing curriculum for all grades</li>
      <li>Invitations to our annual summer and winter karate camps</li>
      <li>Ongoing referee and instructor courses</li>
    </ul>
    <p style="margin-top:40px" class="reveal">
      <a href="tel:+13036650339" class="btn-primary">Call 303-665-0339</a>
      <a href="/contact" class="btn-outline" style="margin-left:10px">Contact Us Online</a>
    </p>
  </div>`;
  return pageShell({ title: 'Become an IMA Affiliated Dojo', description: 'Join the IMA Organization: technical seminars, dojo management training, international championships, and more.', activeNav: 'about', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROGRAMS
// ═══════════════════════════════════════════════════════════════════════════════
export function buildProgramsPage() {
  const programs = [
    ['tiny-tigers', 'Tiny Tigers', 'Ages 4–5', 'Tiny Tigers classes are for our youngest students ages 4–5. The focus of these classes is showing proper respect and etiquette towards the dojo, our instructors, and the other students. Students learn balance, coordination, and basic karate movements through age-appropriate games and drills.', 'tiny-tigers-class.jpg'],
    ['little-dragons', 'Little Dragons', 'Ages 5–7', 'The Little Dragons class is designed for students ages 5–7. These classes teach students to control their emotions and to stay focused on tasks. Class time is spent playing warmup games and learning basic techniques — all while building confidence and discipline.', 'little-dragons.jpg'],
    ['youth', 'Pre-Teen / Youth Class', 'Elementary & middle school', 'In the youth class, students focus on learning traditional Shotokan karate techniques and forms. Students learn and are expected to maintain proper etiquette around the dojo while developing strength, flexibility, and focus.', 'youth-class.jpg'],
    ['adults', 'Adult / Teen Class', 'Ages 13+', 'Our adult program is designed for students of all levels from age 13 and up. Classes start with time for warm-up, stretching, conditioning, and basics practice. Class focus work will include kata (forms) and kumite (sparring), with individualized attention for every level.', 'adult-class.jpg'],
    ['competition', 'Competition Team', 'Invite only', 'The IMA Competition Team is an invite-only group of dedicated karate practitioners who show the highest level of drive and commitment to the sport. The team travels to WKF tournaments nationally and internationally, with athletes routinely winning major tournaments and competing for spots on the US Olympic team.', 'team-track-suits.jpg'],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Programs',
    title: 'Karate Programs',
    lead: 'Traditional and sport karate for every age and ability — from 4 years old to adult.',
    bg: I('tiny-tigers-class.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Programs' }],
  })}
  ${programs
    .map(
      ([id, name, age, desc, img], i) => `
  <div class="section" id="${id}" style="${i % 2 ? 'background:#0d0d0f;max-width:none;padding-left:0;padding-right:0' : ''}">
    <div class="${i % 2 ? 'inner' : ''}" style="${i % 2 ? 'max-width:1200px;margin:0 auto;padding:78px 5vw' : ''}">
      <div class="grid-2">
        <div class="img-frame reveal"><img src="${I(img)}" alt="${name}" loading="lazy" /></div>
        <div class="reveal" data-delay="120">
          <p class="eyebrow">${age}</p>
          <h2 class="sec">${name}</h2>
          <div class="prose"><p>${desc}</p></div>
          <p style="margin-top:20px"><a href="/student-information/class-schedule" class="btn-outline">See Class Times</a> <a href="/how-to-join" class="btn-primary" style="margin-left:10px">Start Today</a></p>
        </div>
      </div>
    </div>
  </div>`,
    )
    .join('')}
  <section class="cta-band">
    <div class="bg" style="background-image:url('${I('join.jpg')}')"></div>
    <div class="inner reveal">
      <p class="eyebrow">Get Started</p>
      <h2>Your First Month + a Free Uniform</h2>
      <p>Receive one month of karate and a free uniform for only $150 — a 50% savings for new enrollments.</p>
      <a href="/how-to-join" class="btn-primary btn-lg">Claim the New Student Special</a>
    </div>
  </section>`;
  return pageShell({ title: 'Programs | IMA Karate', description: 'Tiny Tigers, Little Dragons, Youth, Teen/Adult, and Competition Team programs at IMA Karate in Louisville, Colorado.', activeNav: 'programs', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HOW TO JOIN
// ═══════════════════════════════════════════════════════════════════════════════
export function buildHowToJoinPage() {
  const content = `
  ${pageHero({
    eyebrow: 'Join Us',
    title: 'How to Join',
    lead: 'Start your karate journey at IMA — your first class is on us.',
    bg: I('join.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'How to Join' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div class="reveal">
        <p class="eyebrow">Students & Parents</p>
        <h2 class="sec">Join an Existing Class</h2>
        <div class="prose">
          <p>If you are interested in joining one of our existing clubs, please see our <a href="/student-information/class-schedule" style="color:#d4a24a">class schedule</a> and the list of <a href="/dojo-locations" style="color:#d4a24a">IMA dojos and training locations</a>, then call us at 303-665-0339 or use our <a href="/contact" style="color:#d4a24a">contact form</a>.</p>
        </div>
        <p style="margin-top:22px">
          <a href="tel:+13036650339" class="btn-primary">Call 303-665-0339</a>
          <a href="/contact" class="btn-outline" style="margin-left:10px">Contact Us Online</a>
        </p>
      </div>
      <div class="reveal" data-delay="120" style="background:#131313;border:1px solid #232327;border-top:3px solid #d4a24a;border-radius:6px;padding:34px 34px 38px">
        <p class="eyebrow">IMA New Student Special Offer</p>
        <h2 class="sec" style="font-size:1.8rem">One Month + Free Uniform</h2>
        <p style="font-family:'Oswald',sans-serif;font-size:3rem;color:#d4a24a;margin:14px 0 6px;font-weight:700">$150</p>
        <p style="color:#8f8f93;font-size:.85rem;margin:0 0 20px">A 50% savings — offer good for new enrollments only; no cash value.</p>
        <ul class="check-list">
          <li>One full month of karate classes</li>
          <li>A free karate uniform (gi)</li>
          <li>All ages and abilities welcome</li>
          <li>No contract required — ever</li>
        </ul>
        <a href="tel:+13036650399" class="btn-gold" style="margin-top:22px" onclick="return false" hidden></a>
        <a href="tel:+13036650339" class="btn-gold" style="margin-top:22px">Claim This Offer</a>
      </div>
    </div>
  </div>
  <div class="section alt">
    <div class="inner">
      <div class="reveal">
        <p class="eyebrow">Clubs & Organizations</p>
        <h2 class="sec">Enroll Your Karate Club</h2>
        <p class="lead">First, read more about the <a href="/about/benefits" style="color:#d4a24a">benefits of becoming an IMA-Affiliated Dojo</a>. Then contact our office at 303-665-0339 to speak with our staff to receive the IMA Organization Membership Package.</p>
      </div>
      <p style="margin-top:26px" class="reveal"><a href="/about/affiliated-dojo" class="btn-primary">Learn About Affiliation</a></p>
    </div>
  </div>`;
  return pageShell({ title: 'How to Join IMA Karate', description: 'Join IMA Karate: new student special — one month of karate and a free uniform for only $150. No contract required.', activeNav: 'join', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CONTACT
// ═══════════════════════════════════════════════════════════════════════════════
export function buildContactPage() {
  const content = `
  ${pageHero({
    eyebrow: 'Contact',
    title: 'Contact Us',
    lead: 'We would love to hear from you!',
    bg: I('lets-connect.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Contact' }],
  })}
  <div class="section">
    <div class="grid-2" style="align-items:start">
      <div>
        <div class="reveal prose">
          <p>If you can’t find the information you’re looking for on our website — including our <a href="/student-information/class-schedule" style="color:#d4a24a">class schedules</a> and information on <a href="/how-to-join" style="color:#d4a24a">how to join IMA</a> — please fill out this form and we will get back to you as soon as possible.</p>
        </div>
        <div class="contact-cards reveal" style="margin-top:26px">
          <a href="mailto:info@imakarate.com" class="contact-card">
            <div class="ico">✉</div>
            <div><b>Email</b><span>info@imakarate.com</span></div>
          </a>
          <a href="tel:+13036650339" class="contact-card">
            <div class="ico">☎</div>
            <div><b>Phone</b><span>303-665-0339</span></div>
          </a>
          <div class="contact-card">
            <div class="ico">⌖</div>
            <div><b>Honbu Dojo</b><span>1340 Main Street, Louisville, CO 80027</span></div>
          </div>
        </div>
        <div class="img-frame reveal" data-delay="120" style="margin-top:26px">
          <img src="${I('lets-connect.jpg')}" alt="Let’s connect — IMA Karate" loading="lazy" />
        </div>
      </div>
      <form class="reveal" data-delay="90" id="contact-form" action="/contact/submit" method="post" style="background:#131313;border:1px solid #232327;border-radius:6px;padding:30px">
        <h2 class="sec" style="font-size:1.4rem;margin-bottom:22px">Send Us a Message</h2>
        <div class="form-grid">
          <div class="field"><label for="cf-name">Your Name *</label><input id="cf-name" name="name" type="text" required placeholder="Full name" /></div>
          <div class="field"><label for="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" placeholder="(303) 555-0100" /></div>
          <div class="field full"><label for="cf-email">Email Address *</label><input id="cf-email" name="email" type="email" required placeholder="you@example.com" /></div>
          <div class="field full"><label for="cf-msg">Questions / Comments</label><textarea id="cf-msg" name="message" placeholder="How can we help?"></textarea></div>
          <div class="full"><button type="submit" class="btn-primary btn-lg" style="width:100%">Send Message</button></div>
        </div>
      </form>
    </div>
  </div>`;
  return pageShell({ title: 'Contact Us | IMA Karate', description: 'Contact IMA Karate: 1340 Main Street, Louisville, CO 80027. Phone 303-665-0339, email info@imakarate.com.', activeNav: 'contact', content });
}

export function buildContactThanksPage() {
  const content = `
  ${pageHero({ eyebrow: 'Contact', title: 'Message Sent', lead: 'Thank you — we’ll get back to you shortly.' })}
  <div class="section" style="text-align:center;max-width:600px">
    <p class="lead reveal">Your message has been received. A member of the IMA staff will respond as soon as possible. In the meantime, feel free to browse our <a href="/student-information/class-schedule" style="color:#d4a24a">class schedule</a> or learn <a href="/how-to-join" style="color:#d4a24a">how to join</a>.</p>
    <p style="margin-top:30px" class="reveal"><a href="/" class="btn-primary">Back to Home</a></p>
  </div>`;
  return pageShell({ title: 'Message Sent | IMA Karate', description: 'Thank you for contacting IMA Karate.', activeNav: 'contact', content });
}

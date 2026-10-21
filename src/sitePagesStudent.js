// ─────────────────────────────────────────────────────────────────────────────
//  Student Information pages. Copy follows imakarate.com.
// ─────────────────────────────────────────────────────────────────────────────

import { esc, IMG, pageShell, pageHero, slider } from './siteTheme.js';

const I = (name) => `${IMG}/${name}`;
const CRUMBS_STUDENT = [
  { label: 'Home', href: '/' },
  { label: 'Student Information', href: '/student-information' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
export function buildStudentInfoPage() {
  const links = [
    ['Benefits of Karate Training', '/student-information/benefits-of-karate', 'Why train at IMA: quality instruction, flexible programs, and a family atmosphere.'],
    ['History & Principles of Shotokan Karate', '/student-information/history-principles', 'From Gichin Funakoshi to the dojo kun — the roots of our art.'],
    ['Class Schedule', '/student-information/class-schedule', 'Six days a week: Tiny Tigers through Black Belt classes.'],
    ['Our Instructors', '/student-information/instructors', 'World-recognized instructors with decades of experience.'],
    ['Belt Testing Guidelines', '/student-information/belt-testing-guidelines', 'The testing process, evaluation, and the IMA stripe system.'],
    ['Rules of Competition', '/student-information/rules-of-competition', 'WKF and USA-NKF competition rules and resources.'],
    ['List of Katas', '/student-information/list-of-katas', 'Every kata from Taikyoku to the advanced forms.'],
    ['Karate Dictionary', '/student-information/karate-dictionary', 'Searchable Japanese terminology for techniques and commands.'],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Student Information',
    lead: 'Everything you need for your karate journey at IMA.',
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Student Information' }],
  })}
  <div class="section">
    <div class="grid-2" style="align-items:start">
      <div class="reveal prose">
        <p>Whether your interest in karate is simply a means of improving your physical fitness, helping yourself gain focus and concentration, or working to compete at the highest levels in tournaments worldwide — currently, 6 IMA students are members of the US National Team — most of the information you’re going to need can be found here.</p>
        <p style="margin-top:24px"><a href="/belt-testing" class="btn-primary">Register for the Next Belt Test</a></p>
      </div>
      <div class="img-frame reveal" data-delay="120">
        <img src="${I('talking-competitors.jpg')}" alt="IMA instructors with competitors" loading="lazy" />
      </div>
    </div>
  </div>
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">Resources</p>
        <h2 class="sec">Browse Student Resources</h2>
      </div>
      <div class="grid-3">
        ${links
          .map(
            ([t, h, p], i) => `<a href="${h}" class="card reveal" data-delay="${(i % 3) * 90}">
          <div class="card-body"><h3>${t}</h3><p>${p}</p><span class="card-link">Open →</span></div></a>`,
          )
          .join('')}
      </div>
    </div>
  </div>`;
  return pageShell({ title: 'Student Information | IMA Karate', description: 'Resources for IMA students: schedules, instructors, testing guidelines, katas, and the karate dictionary.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BENEFITS OF KARATE
// ═══════════════════════════════════════════════════════════════════════════════
export function buildBenefitsKaratePage() {
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Benefits of Karate Training',
    lead: 'A complete discipline — body, heart, and spirit.',
    crumbs: [...CRUMBS_STUDENT, { label: 'Benefits of Karate' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div class="reveal prose">
        <p>As an IMA student, you will study a dynamic and powerful traditional martial art called Shotokan Karate. You will learn how to generate speed, strength, and power through the correct practice of fundamentals (kihon), forms (kata), and sparring (kumite).</p>
        <p>Karate training at IMA is much more than just a physical experience, however. It is a complete discipline that also involves the heart and the spirit. It is through training in karate that one learns to respect others and oneself.</p>
        <p>The most important goal of IMA karate instructors and their students is to help one another develop a balance within themselves so that they may express their true nature — realizing their full potential as human beings.</p>
      </div>
      <div class="img-frame natural reveal" data-delay="120" style="max-width:340px;margin:0 auto;background:#0d0d0f;padding:10px">
        <img src="${I('rewarding-effort.jpg')}" alt="Rewarding effort in karate training" loading="lazy" />
      </div>
    </div>
  </div>
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">Why IMA</p>
        <h2 class="sec">Why You Should Choose IMA Karate</h2>
        <p class="lead">Choosing a karate school (dojo) is a very important first step for every karate student. You need to be sure that you find the place that is right for you and for your family.</p>
      </div>
      <div class="grid-2 reveal">
        <ul class="check-list">
          <li>Conveniently scheduled classes</li>
          <li>Convenient location for Boulder County and Denver residents</li>
          <li>No contract necessary — reasonable monthly fees with discounts available</li>
          <li>High quality of instruction with over forty years of experience</li>
          <li>Year-round training</li>
          <li>Special and often individualized attention by skilled instructors for students of all levels and abilities</li>
        </ul>
        <ul class="check-list">
          <li>Flexible programs — students can start karate at any time</li>
          <li>Special instruction to help youths develop motor skills and coordination</li>
          <li>Guidance to help youths respect their parents and honor their friendships, relationships, and obligations</li>
          <li>Special help for students with ADD and learning challenges</li>
          <li>A wide variety of classes in karate and weapons training</li>
          <li>Special seminars available for competitions, refereeing, and other martial arts programs</li>
        </ul>
      </div>
      <p style="margin-top:34px" class="reveal"><a href="/how-to-join" class="btn-primary">Start Training Today</a></p>
    </div>
  </div>
  <div class="section">
    <div class="section-head reveal">
      <p class="eyebrow">IMA Karate “Dojo Kun”</p>
      <h2 class="sec">Dojo Kun</h2>
      <p class="lead">IMA uses the traditional Shotokan “dojo kun” (karate school affirmations) in all of its classes. Our dojo kun is intended to remind students to carry the physical, mental, and spiritual benefits of karate into their everyday lives.</p>
    </div>
    <div class="grid-3">
      ${[
        ['Seek perfection of character', 'Jinkaku kansei ni tsutomuru koto'],
        ['Be faithful', 'Makoto no michi o mamoru koto'],
        ['Endeavor (to excel)', 'Doryoku no seishin o yashinau koto'],
        ['Respect others', 'Reigi o omonzuru koto'],
        ['Refrain from violent behavior', 'Keki no yū o imashimuru koto'],
        ['Love yourself and love others', 'Onore o shiri, tasha o shiru koto'],
      ]
        .map(
          ([en, jp], i) => `<div class="card spotlight reveal" data-delay="${(i % 3) * 90}">
          <div class="card-body">
            <span class="jp" style="display:block;margin-bottom:8px;font-size:.78rem">${jp}</span>
            <h3 style="font-size:.98rem">${en}</h3>
          </div>
        </div>`,
        )
        .join('')}
    </div>
    <p class="reveal" style="margin-top:30px;color:#c9c9cd;max-width:720px">We offer you and your family one free class and welcome you to learn more about our family-oriented IMA dojo — <a href="/how-to-join" style="color:#d4a24a">see how to join</a>.</p>
  </div>`;
  return pageShell({ title: 'Benefits of Karate Training | IMA Karate', description: 'The physical, mental, and spiritual benefits of Shotokan karate training at IMA in Louisville, Colorado.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HISTORY & PRINCIPLES
// ═══════════════════════════════════════════════════════════════════════════════
export function buildHistoryPrinciplesPage() {
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'History & Principles of Shotokan Karate',
    lead: 'From Gichin Funakoshi to the Japan Karate Association.',
    crumbs: [...CRUMBS_STUDENT, { label: 'History & Principles' }],
  })}
  <div class="section">
    <div class="grid-2" style="align-items:start">
      <div class="reveal prose">
        <h3>A Short History of Shotokan Karate</h3>
        <p>Gichin Funakoshi is widely considered the “father” of modern-day karate. He was born in the Shuri prefecture in Okinawa in 1868 and at the age of 11 began to study karate. In 1921, Funakoshi introduced karate to Japan, and in 1936 he built his first dojo in Tokyo — the Shotokan, from which the style takes its name.</p>
        <p>For Sensei Funakoshi, the word ‘karate’ eventually took on a deeper meaning than just martial arts training, transforming into what it has become known as today: karate-do, the way of the empty hand.</p>
        <p>Whereas his father was responsible for transforming karate from a mere fighting technique into a philosophical martial ‘do’ (way of life), Yoshitaka (his son) was put in charge of the physical development of karate — introducing new stances and techniques that define modern Shotokan.</p>
        <p>It is upon these concepts that in 1948, the Japan Karate Association (JKA) was founded. The establishment of the JKA led the way to the spread of Shotokan karate throughout the world.</p>
        <p>It was through Master Masatoshi Nakayama’s vision that Shotokan has spread throughout the world, enriching many people’s lives in many countries.</p>
      </div>
      <div class="img-frame natural reveal" data-delay="120" style="max-width:260px;background:#0d0d0f;padding:10px">
        <img src="${I('funakoshi.jpg')}" alt="Gichin Funakoshi, father of modern karate" loading="lazy" />
      </div>
    </div>
  </div>
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">The Niju Kun</p>
        <h2 class="sec">Funakoshi’s (Shotokan) Principles</h2>
      </div>
      <div class="grid-2 reveal">
        <ul class="arrow-list">
          <li>Never forget: Karate begins and ends with rei. Rei has the meaning of respect.</li>
          <li>There is no “first hand” in Karate. (Meaning there is no first attack, karate is about self-defense)</li>
          <li>Karate supports righteousness.</li>
          <li>First understand yourself, then understand others.</li>
          <li>The art of mind is more important than the art of technique.</li>
          <li>The mind needs to be freed.</li>
          <li>Trouble is born of negligence.</li>
          <li>Do not think that Karate is only in the dojo.</li>
          <li>The training of Karate requires a lifetime.</li>
          <li>Transform everything into Karate; therein lies the exquisiteness.</li>
        </ul>
        <ul class="arrow-list">
          <li>Genuine Karate is like hot water; it cools down if you do not keep heating it.</li>
          <li>Do not have an idea of winning, while the idea of losing is not necessary.</li>
          <li>Transform yourself according to the opponent.</li>
          <li>The outcome of the fight all depends on the maneuver.</li>
          <li>Imagine one’s arms and legs as swords.</li>
          <li>Once you leave the shelter of home there are a million enemies.</li>
          <li>Postures are for the beginner, later they are natural positions.</li>
          <li>Do the kata correctly, the real fight is a different matter.</li>
          <li>Do not forget the dynamics of power, the elasticity of the body, and the speed of technique.</li>
          <li>Always be good at the application of everything you have learned.</li>
        </ul>
      </div>
    </div>
  </div>`;
  return pageShell({ title: 'History & Principles of Shotokan Karate | IMA Karate', description: 'The history of Shotokan karate from Gichin Funakoshi and the twenty guiding principles (Niju Kun).', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CLASS SCHEDULE
// ═══════════════════════════════════════════════════════════════════════════════
export function buildClassSchedulePage() {
  const schedule = [
    ['MON', [['Tiny Tigers', '4:30 – 5:00 pm']]],
    ['TUE', [['All Levels — Teen/Adult', '12:00 – 1:00 pm'], ['Little Dragons', '5:00 – 6:00 pm'], ['Youth Class', '6:00 – 7:00 pm'], ['Black Belt — Teen/Adult', '7:00 – 8:15 pm']]],
    ['WED', [['Little Dragons', '5:00 – 6:00 pm'], ['Youth Class', '6:00 – 7:00 pm'], ['All Levels — Teen/Adult', '7:00 – 8:15 pm']]],
    ['THU', [['All Levels — Teen/Adult', '12:00 – 1:00 pm'], ['Little Dragons', '5:00 – 6:00 pm'], ['Youth Class', '6:00 – 7:00 pm'], ['Black Belt — Teen/Adult', '7:00 – 8:15 pm']]],
    ['FRI', [['Little Dragons', '5:00 – 6:00 pm'], ['Youth Class', '6:00 – 7:00 pm'], ['All Levels — Teen/Adult', '7:00 – 8:15 pm']]],
    ['SAT', [['Little Dragons / Youth', '10:00 – 11:00 am'], ['All Levels — Teen/Adult', '11:00 – 12:15 pm']]],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Class Schedule',
    lead: 'Six days a week at the Honbu Dojo in Louisville, Colorado.',
    bg: I('youth-class.jpg'),
    crumbs: [...CRUMBS_STUDENT, { label: 'Class Schedule' }],
  })}
  <div class="section">
    <div class="reveal" style="overflow-x:auto">
      <table class="sched">
        <thead><tr><th style="width:90px">Day</th><th>Classes</th></tr></thead>
        <tbody>
          ${schedule
            .map(
              ([day, classes]) => `
          <tr>
            <td>${day}</td>
            <td>
              ${classes.map(([name, time]) => `<div style="display:flex;justify-content:space-between;gap:18px;padding:3px 0"><span style="color:#e8e8ea">${name}</span><span style="color:#d4a24a;white-space:nowrap;font-weight:600">${time}</span></div>`).join('')}
            </td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="reveal" style="margin-top:34px;background:#131313;border-left:3px solid #d4a24a;padding:20px 24px;border-radius:4px;max-width:760px">
      <p style="margin:0;color:#c4c4c8">All classes are held at the <strong>IMA Honbu Dojo, 1340 Main Street, Louisville, CO 80027</strong>. Students may start at any time — <a href="/how-to-join" style="color:#d4a24a">see how to join</a>. For other locations, see the <a href="/dojo-locations" style="color:#d4a24a">dojo locations page</a>.</p>
    </div>
  </div>`;
  return pageShell({ title: 'Class Schedule | IMA Karate', description: 'IMA Karate class schedule: Tiny Tigers, Little Dragons, Youth, Teen/Adult, and Black Belt classes six days a week in Louisville, Colorado.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  INSTRUCTORS
// ═══════════════════════════════════════════════════════════════════════════════
export function buildInstructorsPage() {
  const people = [
    ['hanshi-portrait.jpg', 'Hanshi Cyrus Madani', 'Kudan · Chief Instructor', 'Founder and Chief Instructor of IMA. Began training in 1964 and has taught Shotokan karate in Louisville since 1990. Former PKF/WKF kata and kumite referee with the highest license.'],
    ['fariba-portrait.jpg', 'Shihan Fariba Madani', 'Hachidan · Head Instructor', 'First national karate referee from Colorado and the first U.S. female referee at the Pan American level for both kata and kumite. World and Pan American referee council member.'],
    ['inst-michelle.jpg', 'Sensei Michelle Prud’Homme', 'Rokudan', 'Started with Hanshi at the rec center before the dojo was built, October 26, 1993. National Referee A license.'],
    ['inst-bob.jpg', 'Sensei Bob McCormick', 'Rokudan', 'Joined IMA Honbu dojo in 1996 and began teaching in 1997 while an orange belt. Valued the family atmosphere from his first visit.'],
    ['inst-deborah.jpg', 'Sensei Deborah Keyek-Franssen', 'Godan', 'Studying with Hanshi since February 1999. Started at the YMCA in Lafayette with her two sons before moving to the Honbu dojo.'],
    ['inst-irina.jpg', 'Sensei Irina Petropavlovskikh', 'Yondan', 'Started at IMA in 2005 with her daughter, who is also a black belt. Born in Russia; came to the US for graduate studies.'],
    ['inst-kamran.jpg', 'Sensei Kamran Madani', 'Yondan · Head Coach', 'Bronze-medal winner at the 2011 Junior World Championships in Malaysia and Pan American medalist. IMA head coach and USA coach.'],
    ['inst-david.jpg', 'Sensei David Miller', 'Yondan', 'Studying martial arts since 1988; training with Hanshi Madani for over 23 years.'],
    ['inst-josh.jpg', 'Sensei Josh Schmidt', 'Sandan', 'The very first black belt under Hanshi Madani at the Honbu Dojo. Has continued his training to the rank of Sandan.'],
    ['inst-keith.jpg', 'Sensei Keith Nakasato', 'Sandan', 'Training with Hanshi for 14 years. His wife and two children also hold black belts with IMA karate.'],
    ['inst-kelara.jpg', 'Sensei Kelara Madani', 'Sandan', 'Training at the Honbu dojo since she was 4 years old. Speaks three languages and is learning a fourth. National-level competitor.'],
    ['inst-philippe.jpg', 'Senpai Philippe Lepercq', 'Senpai', 'Joined IMA in 2011 with his daughter. Began his martial arts experience in France, where he grew up.'],
    ['inst-joy.jpg', 'Sensei Joy Hierlmaier', 'Sandan', 'Former member of the IMA competition team with three national-level medals.'],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Our Instructors',
    lead: 'World-recognized instructors with decades of combined experience.',
    bg: I('hanshi-portrait.jpg'),
    crumbs: [...CRUMBS_STUDENT, { label: 'Our Instructors' }],
  })}
  <div class="section">
    <div class="section-head reveal">
      <p class="eyebrow">Leadership</p>
      <h2 class="sec">Chief & Head Instructors</h2>
    </div>
    <div class="people">
      ${people.slice(0, 2)
        .map(
          ([img, name, rank, bio], i) => `
      <div class="person reveal" data-delay="${i * 100}">
        <div class="person-img"><img src="${I(img)}" alt="${name}" loading="lazy" /></div>
        <div class="person-body"><h3>${name}</h3><p class="person-rank">${rank}</p><p>${bio}</p></div>
      </div>`,
        )
        .join('')}
    </div>
    <div class="section-head reveal" style="margin-top:64px">
      <p class="eyebrow">Teaching Staff</p>
      <h2 class="sec">Assistant Instructors</h2>
    </div>
    <div class="people">
      ${people.slice(2)
        .map(
          ([img, name, rank, bio], i) => `
      <div class="person reveal" data-delay="${(i % 4) * 80}">
        <div class="person-img"><img src="${I(img)}" alt="${name}" loading="lazy" /></div>
        <div class="person-body"><h3>${name}</h3><p class="person-rank">${rank}</p><p>${bio}</p></div>
      </div>`,
        )
        .join('')}
    </div>
  </div>`;
  return pageShell({ title: 'Our Instructors | IMA Karate', description: 'Meet the world-recognized instructors of IMA Karate, led by Hanshi Cyrus Madani and Shihan Fariba Madani.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  BELT TESTING GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════
export function buildBeltTestingPage() {
  const stripes = [
    ['Black', 'Awarded by instructors when students demonstrate skill in the techniques they have been working on. Acts as a progress report toward the next belt.', '#111'],
    ['Red', 'An IMA tradition to honor students who demonstrate positive character outside of class.', '#c8102e'],
    ['Yellow', 'Awarded to students who show improvement in their scholastic records or maintain strong academic records.', '#e8c33c'],
    ['Blue', 'Awarded for extra effort, focus in class, courtesy and respect, and setting a good example of positive attitude.', '#3b6fd4'],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Belt Testing Guidelines',
    lead: 'An important step in the study of karate.',
    crumbs: [...CRUMBS_STUDENT, { label: 'Belt Testing Guidelines' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div class="reveal prose">
        <p>An important step in the study of karate is testing for your next belt. The successful completion of each test brings the student one step closer to becoming a black belt. Students must demonstrate the skills required for their next belt level before testing.</p>
        <p>The specific skills required for each belt level are listed in the Student Progress Manual that each new student receives on their first day of class. An instructor or Hanshi Madani will discuss with each student when they are ready to test.</p>
        <h3>The Belt Testing Process</h3>
        <p>There are eight Kyu (color) belt tests and two Dan (black) tests available per year. The date of the test will be posted a minimum of 2 months before each test, and applications are handed out once you have earned the necessary stripes.</p>
        <p>Following the test, each student is evaluated by an instructor and provided a copy of the written evaluation. This evaluation is confidential and is for the use of the student and the student’s family. Suggestions of things to improve before the next test are provided.</p>
        <p>Upon successful completion of a belt test, students are presented a new belt at the testing date and a certification of rank shortly after.</p>
      </div>
      <div class="reveal" data-delay="120">
        <div style="background:#131313;border:1px solid #232327;border-top:3px solid #c8102e;border-radius:6px;padding:30px;position:sticky;top:110px">
          <p class="eyebrow">Next belt test</p>
          <h2 class="sec" style="font-size:1.5rem">Register Online</h2>
          <p style="color:#b0b0b4;font-size:.92rem">Sign up and pay for the next Kyu belt test in minutes — the waiver is signed online through DocuSign.</p>
          <ul class="check-list" style="margin-bottom:22px">
            <li>Eight Kyu tests per year</li>
            <li>Two Dan tests per year</li>
            <li>Test dates posted 2+ months ahead</li>
          </ul>
          <a href="/belt-testing" class="btn-primary btn-lg" style="width:100%;text-align:center">Register for the Next Test</a>
        </div>
      </div>
    </div>
  </div>
  <div class="section alt">
    <div class="inner">
      <div class="section-head reveal">
        <p class="eyebrow">Progress Tracking</p>
        <h2 class="sec">IMA’s Belt Stripe System</h2>
        <p class="lead">Throughout the year, students are awarded different colored stripes that are added to their belts. These stripes help the student understand their progress towards their next belt.</p>
      </div>
      <div class="grid-3">
        ${stripes
          .map(
            ([name, desc, color], i) => `
        <div class="card reveal" data-delay="${(i % 3) * 90}">
          <div class="card-body">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="display:inline-block;width:30px;height:8px;border-radius:4px;background:${color};border:1px solid #333"></span>
              <h3 style="margin:0">${name} Stripes</h3>
            </div>
            <p>${desc}</p>
          </div>
        </div>`,
          )
          .join('')}
      </div>
      <p class="reveal" style="margin-top:26px;color:#8f8f93;font-size:.9rem">The stripe system is explained in more detail in the Student Progress Manual.</p>
    </div>
  </div>`;
  return pageShell({ title: 'Belt Testing Guidelines | IMA Karate', description: 'The IMA belt testing process: eight Kyu tests and two Dan tests per year, evaluations, and the belt stripe system.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  RULES OF COMPETITION
// ═══════════════════════════════════════════════════════════════════════════════
export function buildRulesCompetitionPage() {
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Rules of Competition',
    lead: 'Competition rules from the world’s leading karate governing bodies.',
    bg: I('comp-team-2014.jpg'),
    crumbs: [...CRUMBS_STUDENT, { label: 'Rules of Competition' }],
  })}
  <div class="section">
    <div class="grid-2">
      <div class="reveal prose">
        <p>The following links direct you to the pages that contain downloads and information for competition rules for various karate governing bodies. Different tournaments follow slightly different rules for competition, so be sure to check which rules apply to your event.</p>
        <ul class="arrow-list" style="margin-top:20px">
          <li><a href="https://www.wkf.net/" target="_blank" rel="noopener" style="color:#d4a24a;text-decoration:none">World Karate Federation (WKF)</a></li>
          <li><a href="https://www.usankf.org/" target="_blank" rel="noopener" style="color:#d4a24a;text-decoration:none">USA National Karate-do Federation (USA-NKF)</a></li>
        </ul>
      </div>
      <div class="img-frame reveal" data-delay="120">
        <img src="${I('comp-team-2014.jpg')}" alt="IMA Competition Team, January 2014" loading="lazy" />
      </div>
    </div>
  </div>`;
  return pageShell({ title: 'Rules of Competition | IMA Karate', description: 'WKF and USA-NKF karate competition rules and resources for IMA students.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LIST OF KATAS
// ═══════════════════════════════════════════════════════════════════════════════
export function buildKatasPage() {
  // YouTube video IDs from the official IMA Karate channel (@imakarate)
  const groups = [
    ['Taikyoku', 'This is the most elementary kata practiced at IMA. Developed by Master Funakoshi’s son, Gigo, Taikyoku helps new students learn basic kata principles.', [
      ['太極初段', 'Taikyoku Shodan', 'first cause', 'l9N7EkzVyA0'],
    ]],
    ['Heian', 'Created relatively recently, the Heians were originally called Pinan from the Okinawan pronunciation of the Chinese word for safety. When introduced to Japan, Master Funakoshi opted to use the Japanese pronunciation Heian. Considered basic kata for beginning students.', [
      ['平安初段', 'Heian Shodan', 'peaceful mind, first level', 'GiYdnczpK-E'],
      ['平安二段', 'Heian Nidan', 'peaceful mind, second level', '6I9ypJ_izmk'],
      ['平安三段', 'Heian Sandan', 'peaceful mind, third level', 'Z40P4Zqwlhk'],
      ['平安四段', 'Heian Yondan', 'peaceful mind, fourth level', 'FX-uPwodJYw'],
      ['平安五段', 'Heian Godan', 'peaceful mind, fifth level', 'YlmbBkGPbeA'],
    ]],
    ['Tekki', 'Originally known in Okinawa as Naihanchi, the katas were renamed by Master Funakoshi upon its introduction to Japan to reflect the strength exhibited with kiba-dachi. Rich in fighting techniques, the Tekki family offers a plethora of close combat techniques.', [
      ['鉄騎初段', 'Tekki Shodan', 'iron horse riding, first level', 'mn2PeIPMYuw'],
      ['鉄騎弐段', 'Tekki Nidan', 'iron horse riding, second level', 'PbNEcqKJ-g8'],
      ['鉄騎参段', 'Tekki Sandan', 'iron horse riding, third level', 'Va0r5nQxU3A'],
    ]],
    ['Advanced Katas', 'The advanced katas practiced at IMA, from Bassai Dai through Unsu. Each emphasizes different combinations of power, speed, and athletic ability.', [
      ['', 'Bassai Dai', 'The strong techniques of this kata emphasize hip movement. Some resemble a battering ram being used against fortress walls.', 'edHiunQTjBg'],
      ['', 'Bassai Sho', 'This kata was derived from Bassai-Dai. It has a similar performance line.', null],
      ['', 'Kanku Dai', 'Most of the elements of the Heian Kata were derived from this kata. The first movement in this kata views the sky, which symbolizes the universe and shows your opponent that you are unarmed. It was Master Funakoshi’s preferred kata.', 'PH4k9n0rYas'],
      ['', 'Kanku Sho', 'Kanku Sho was created from Kanku Dai. The movements and performance line are similar.', null],
      ['', 'Hangetsu', 'This kata received its name from its principal stance, hangetsu dachi (half moon stance).', null],
      ['', 'Goju Shi Ho Dai', 'This kata is one of the most advanced kata of Shotokan. Master Funakoshi called it hotaku (knocking of a woodpecker) because some of the techniques resemble a woodpecker tapping its beak against a tree.', null],
      ['', 'Goju Shi Ho Sho', 'This is a smaller version of Goju Shi Ho Dai. It is also one of the most advanced kata of Shotokan.', null],
      ['', 'Enpi', 'The quick up and down movements of this kata are reminiscent of a flying swallow. Enpi is one of the oldest kata in Shotokan. Its former name was Wanshu.', 'X8LKb6PhjNU'],
      ['', 'Jion', 'Jion is a term in Buddhism. It is also the name of a temple in China. It uses basic stances and techniques. It is one of the most traditional kata in Shotokan.', 'mJlOf_c8wYc'],
      ['', 'Jiin', 'Jiin is another term in Buddhism. It has similar techniques and performance line as Jion.', null],
      ['', 'Jitte', 'The goal of this kata is to teach a student to fight against ten opponents. This is a strong kata, similar to Jion and Jiin.', null],
      ['', 'Meikyo', 'The first movements of this kata suggest the smoothing of water to make it as calm and even as a mirror. The triangle jump at the end of this kata is said to have a secret meaning portending to a miracle.', null],
      ['', 'Niju Shi Ho', 'The movements in this kata resemble waves breaking on a cliff. The former name of this kata was ni sei shi.', null],
      ['', 'Wankan', 'Wankan is the shortest kata in Shotokan.', null],
      ['', 'Gankaku', 'The main stance in this kata (tsuruashi dachi) resembles a crane ready to strike at its prey. The movements are supposed to simulate a fight in the narrow alleyways of Okinawa. The former name of this kata was Chinto.', null],
      ['', 'Sochin', 'The name of this kata comes from its stance (sochin dachi), a strong, rooted stance. The purpose of this kata is to teach defense against a stick. Its former name was Hakko.', null],
      ['', 'Chinte', 'Chinte has a lot of circular and roundhouse techniques. These are rare and are not typical of the shortest distance between two points concept of Shotokan.', null],
      ['', 'Unsu', 'Unsu has several techniques that symbolize parting the clouds with open hands. It is also one of the most advanced kata of Shotokan.', null],
    ]],
  ];
  // gallery slider — kata demonstrations from the official IMA YouTube channel
  const gallery = slider({
    slides: [
      { img: 'yt-bassai-dai.jpg', alt: 'Bassai Dai kata demonstration', title: 'Bassai Dai', text: 'To penetrate a fortress — strong techniques emphasizing hip movement.', href: 'https://www.youtube.com/watch?v=edHiunQTjBg' },
      { img: 'yt-kanku-dai.jpg', alt: 'Kanku Dai kata demonstration', title: 'Kanku Dai', text: 'To view the sky — Master Funakoshi’s preferred kata.', href: 'https://www.youtube.com/watch?v=PH4k9n0rYas' },
      { img: 'yt-heian-shodan.jpg', alt: 'Heian Shodan kata demonstration', title: 'Heian Shodan', text: 'Peaceful mind, first level — basic kata for beginning students.', href: 'https://www.youtube.com/watch?v=GiYdnczpK-E' },
      { img: 'yt-enpi.jpg', alt: 'Enpi kata demonstration', title: 'Enpi', text: 'Flying swallow — one of the oldest kata in Shotokan.', href: 'https://www.youtube.com/watch?v=X8LKb6PhjNU' },
      { img: 'yt-jion.jpg', alt: 'Jion kata demonstration', title: 'Jion', text: 'One of the most traditional kata in Shotokan.', href: 'https://www.youtube.com/watch?v=mJlOf_c8wYc' },
    ],
  });
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'List of Katas',
    lead: 'The katas of Shotokan karate, from Taikyoku to Unsu — with video demonstrations on YouTube.',
    crumbs: [...CRUMBS_STUDENT, { label: 'List of Katas' }],
  })}
  <div class="section" style="max-width:980px">
    <div class="section-head reveal">
      <p class="eyebrow">From the IMA YouTube Channel</p>
      <h2 class="sec">Kata Demonstrations</h2>
      <p class="lead">Filmed at the IMA Honbu Dojo — browse the full library on <a href="https://www.youtube.com/@imakarate" target="_blank" rel="noopener" style="color:#d4a24a">YouTube</a>.</p>
    </div>
    ${gallery}
    <div style="max-width:240px;margin:56px auto 0" class="img-frame natural reveal">
      <img src="${I('kubodo-kata.jpg')}" alt="Kobudo kata demonstration" loading="lazy" />
    </div>
  </div>
  <div class="section alt">
    <div class="inner" style="max-width:980px">
      ${groups
        .map(
          ([name, intro, katas], i) => `
    <details class="acc reveal" ${i === 0 ? 'open' : ''}>
      <summary>${name} <span class="nav-arrow">▾</span></summary>
      <div class="acc-body">
        <p>${intro}</p>
        <ul class="dict-list">
          ${katas.map(([jp, romaji, meaning, yt]) => `<li>${jp ? `<span class="jp">${jp}</span>` : ''}<b>${romaji}</b> — ${meaning}${yt ? ` · <a href="https://www.youtube.com/watch?v=${yt}" target="_blank" rel="noopener" style="color:#d4a24a">View on YouTube ↗</a>` : ''}</li>`).join('')}
        </ul>
      </div>
    </details>`,
        )
        .join('')}
    </div>
  </div>`;
  return pageShell({ title: 'List of Katas | IMA Karate', description: 'The complete list of Shotokan karate katas practiced at IMA: Taikyoku, Heian, Tekki, and the advanced katas — with video demonstrations on YouTube.', activeNav: 'student', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  KARATE DICTIONARY
// ═══════════════════════════════════════════════════════════════════════════════
export function buildDictionaryPage() {
  const dict = [
    ['Block (Uke — pronounced “oo-kay”)', [
      ['Age-uke', '(ah-geh oo-kay)', 'Upper block (raising)'],
      ['Shuto-uke', '(shoe-toe oo-kay)', 'Knife-hand block'],
      ['Uchi-uke', '(oo-chee oo-kay)', 'Inside center block'],
      ['Gedan-barai', '(geh-dahn bah-rye)', 'Down block'],
      ['Soto-uke', '(so-toh oo-kay)', 'Outside center block'],
      ['Chudan-uke', '(chew-dahn oo-kay)', 'Middle level block'],
      ['Jodan-uke', '(joe-dahn oo-kay)', 'Upper level block'],
      ['Gedan-uke', '(geh-dahn oo-kay)', 'Lower level block'],
      ['Hiza-uke', '(he-zah oo-kay)', 'Knee block'],
      ['Juji-uke', '(jew-gee oo-kay)', 'X-block'],
      ['Morote-uke', '(moe-row-the oo-kay)', 'Augmented block'],
      ['Nagashi-uke', '(nah-gah-she oo-kay)', 'Sweeping block'],
      ['Sashite-uke', '(sah-she-tay oo-kay)', 'Rising hand block'],
      ['Teishi-uke', '(tay-sho oo-kay)', 'Palm-heel block'],
    ]],
    ['Punch (Zuki — pronounced “zoo-key”)', [
      ['Age-zuki', '(ah-geh zoo-key)', 'Rising punch'],
      ['Awase-zuki', '(ah-wah-say zoo-key)', 'U-punch'],
      ['Choku-zuki', '(cho-koo zoo-key)', 'Straight punch'],
      ['Chudan-zuki', '(chew-dahn zoo-key)', 'Middle area punch'],
      ['Gyaku-zuki', '(gya-koo zoo-key)', 'Reverse punch'],
      ['Jodan-zuki', '(joe-dahn zoo-key)', 'Face level punch'],
      ['Morote-zuki', '(moe-row-the zoo-key)', 'Double “U” punch'],
      ['Oi-zuki', '(oh-ee zoo-key)', 'Lunge punch'],
      ['Tate-zuki', '(tah-the zoo-key)', 'Vertical punch'],
      ['Teisho-zuki', '(tay-show zoo-key)', 'Palm-heel punch'],
      ['Ura-zuki', '(oo-rah zoo-key)', 'Close punch'],
    ]],
    ['Kick (Geri — pronounced “geh-rhee”)', [
      ['Ashi-barai', '(ah-she bah-rye)', 'Foot sweep'],
      ['Fumikomi', '(foo-me-koh-me)', 'Stamping kick'],
      ['Keage', '(key-ah-geh)', 'Snap kick'],
      ['Kekomi', '(kay-koh-me)', 'Thrust kick'],
      ['Mae-geri', '(mah-eh geh-rhee)', 'Front kick'],
      ['Mae-geri-kaege', '(mah-eh geh-rhee kay-ah-geh)', 'Front snap kick'],
      ['Mae-geri-kakomi', '(mah-eh geh-rhee kay-koh-me)', 'Front thrust kick'],
      ['Mae-tobi-geri', '(mah-eh toe-be geh-rhee)', 'Jumping front kick'],
      ['Mawashi-geri', '(mah-wah-she geh-rhee)', 'Round kick'],
      ['Ushiro-geri', '(oo-she-row geh-rhee)', 'Back kick'],
      ['Yoko-geri-kaegi', '(yoh-koh geh-rhee key-ah-geh)', 'Side snap kick'],
      ['Yoko-geri-kekomi', '(yoh-koh geh-rhee kay-koh-me)', 'Side thrust kick'],
    ]],
    ['Strike (Uchi — pronounced “oo-chee”)', [
      ['Empi-uchi', '(en-pee oo-chee)', 'Elbow strike'],
      ['Haishu-uchi', '(hi-shoo oo-chee)', 'Back hand strike'],
      ['Haito-uchi', '(hi-toe oo-chee)', 'Ridge-hand strike'],
      ['Ippon-ken', '(eep-pone ken)', 'One-knuckle fist'],
      ['Nukite', '(noo-key-teh)', 'Spear hand'],
      ['Kentsui-uchi', '(ken-tsue-ee oo-chee)', 'Hammer fist strike'],
      ['Shuto-uchi', '(shoe-toe oo-chee)', 'Knife hand strike'],
      ['Teisho-uchi', '(tay-sho oo-chee)', 'Palm hand strike'],
      ['Uraken-uchi', '(oo-rah-ken oo-chee)', 'Back fist strike'],
    ]],
    ['Stance (Dachi — pronounced “dah-chee”)', [
      ['Fudo-dachi', '(foo-dough dah-chee)', 'Rooted stance'],
      ['Hachiji-dachi', '(hah-chee-gee dah-chee)', 'Open leg stance'],
      ['Hangetsu-dachi', '(hahn-geh-tsue dah-chee)', 'Half-moon stance'],
      ['Heiko-dachi', '(hay-koh dah-chee)', 'Parallel stance'],
      ['Kamae', '(kah-may)', 'Sparring posture'],
      ['Kiba-dachi', '(key-bah dah-chee)', 'Side stance (horse stance)'],
      ['Kokutsu-dachi', '(koe-koo-tsu dah-chee)', 'Back stance'],
      ['Kosa-dachi', '(koe-sah dah-chee)', 'Crossed legged stance'],
      ['Neko-ashi-dachi', '(neh-koh ah-she-dah-chee)', 'Cat stance'],
      ['Sanchin-dachi', '(sahn-chin dah-chee)', 'Hour-glass stance'],
      ['Shizentai', '(she-zen dah-chee)', 'Natural position'],
      ['Sochin-dachi', '(so-chin dah-chee)', 'Diagonal straddle-leg stance'],
      ['Teiji-dachi', '(tay-jee dah-chee)', 'T stance'],
      ['Zenkutsu-dachi', '(zen-koo-tsue dah-chee)', 'Front stance'],
    ]],
    ['Numbers', [
      ['Ichi', '(ih-chee)', 'One'],
      ['Ni', '(nee)', 'Two'],
      ['San', '(sahn)', 'Three'],
      ['Shi', '(she)', 'Four'],
      ['Go', '(goh)', 'Five'],
      ['Roku', '(roo-koo)', 'Six'],
      ['Shichi', '(shih-chee)', 'Seven'],
      ['Hachi', '(hah-chee)', 'Eight'],
      ['Ku', '(koo)', 'Nine'],
      ['Ju', '(joo)', 'Ten'],
    ]],
    ['General Terms', [
      ['Budo', '(boo-doh)', 'Martial way'],
      ['Bunkai', '(bun-kye)', 'Applications'],
      ['Chudan', '(chew-dahn)', 'Chest area'],
      ['Dan', '(dahn)', 'Black belt rank'],
      ['Do', '(doh)', 'Way / path'],
      ['Dojo', '(doh-joh)', 'Training area'],
      ['Domo Arigato Gozai-mashita', '(doh-moh ah-ree-gah-toh go-zye-mah-she-tah)', 'Thank you very much (past)'],
      ['Gasshuku', '(gah-shoo-koo)', 'Summer camp'],
      ['Gedan', '(geh-dahn)', 'Lower body area'],
      ['Gi (Karate-gi)', '(ghee)', 'Uniform'],
      ['Gohan-kumite', '(goh-hon koo-mih-tay)', 'Five step sparring'],
      ['Hai', '(hi)', 'Yes'],
      ['Hajime', '(hah-zhim-ay)', 'Begin'],
      ['Hidari', '(he-dah-rhee)', 'Left'],
      ['Hombu-Dojo', '(hohm-boo doh-joh)', 'Dojo headquarters'],
      ['Ippon kumite', '(eep-pohn koo-me-teh)', 'One step sparring'],
      ['Jiyu ippon', '(jye-oo ih-pon)', 'Free one step sparring'],
      ['Jiyu-kumite', '(gee-you koo-me-teh)', 'Free sparring'],
      ['Jodan', '(joh-dahn)', 'Face area'],
      ['Kamae', '(kah-mah-eh)', 'Sparring posture'],
      ['Karate', '(kah-rah-teh)', 'Empty hand'],
      ['KarateKa', '(kah-rah-teh-kah)', 'Karate student'],
      ['Kata', '(kah-tah)', 'Form'],
      ['Ki', '(key)', 'Mind, spirit, energy'],
      ['Kiai', '(kee-eye)', 'Focusing shout'],
      ['Kihon', '(key-hohn)', 'Basic technique'],
      ['Kihon kumite', '(key-hohn koo-me-teh)', 'Basic sparring'],
      ['Kime', '(key-may)', 'Focus of power'],
      ['Kumite', '(koo-me-teh)', 'Sparring'],
      ['Kyu', '(kyoo)', 'White / brown belt rank'],
      ['Mae', '(mah-eh)', 'Front'],
      ['Makiwara', '(mah-key-wha-rah)', 'Punching board'],
      ['Mawate-te', '(mah-wah-tay)', 'Turn around'],
      ['Migi', '(me-ghee)', 'Right'],
      ['Ohayo Gozaimasu', '(oh-ha-yoh go-zye-mah-soo)', 'Good morning'],
      ['Onegai-shimasu', '(oh-nih-guy-she-mah-soo)', 'Please teach me'],
      ['Osu', '(oh-soo)', 'Greeting'],
      ['Oyasumi nasai', '(oh-yah-soo-me nah-sigh)', 'Good night'],
      ['Rei', '(rey)', 'Bow'],
      ['Sanbon kumite', '(sahn-bohn koo-me-teh)', 'Three step sparring'],
      ['Seiza', '(say-zah)', 'Sitting position'],
      ['Sempai', '(sehm-pye)', 'Senior student'],
      ['Sensei', '(sehn-seh-ee)', 'Instructor'],
      ['Shizen-tai', '(she-zen tah-ee)', 'Natural position'],
      ['Tai sabaki', '(tye sah-bah-key)', 'Body movement'],
      ['Waza', '(wah-zah)', 'Technique'],
      ['Yame', '(yah-may)', 'Stop'],
      ['Yoi', '(yoy)', 'Ready'],
      ['Zanshin', '(zahn-shin)', 'Following through technique'],
    ]],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'Karate Dictionary',
    lead: 'Japanese terminology for techniques, stances, and commands — searchable.',
    crumbs: [...CRUMBS_STUDENT, { label: 'Karate Dictionary' }],
  })}
  <div class="section" style="max-width:1000px">
    <div class="dict-search reveal">
      <input id="dict-search-input" type="text" placeholder="Search terms — try “block”, “geri”, or “stance”" aria-label="Search dictionary" />
      <button type="button" onclick="document.getElementById('dict-search-input').focus()">Search</button>
    </div>
    ${dict
      .map(
        ([group, terms]) => `
    <div class="dict-group reveal">
      <h3>${esc(group)}</h3>
      <ul class="dict-list">
        ${terms.map(([term, pron, def]) => `<li><b>${term}</b> <span class="pron">${pron}</span> — ${def}</li>`).join('')}
      </ul>
    </div>`,
      )
      .join('')}
    <p class="dict-empty" id="dict-empty">No terms matched your search.</p>
  </div>`;
  return pageShell({ title: 'Karate Dictionary | IMA Karate', description: 'Searchable Japanese karate terminology: blocks, punches, kicks, strikes, stances, and general terms.', activeNav: 'student', content });
}

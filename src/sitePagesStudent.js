// ─────────────────────────────────────────────────────────────────────────────
//  Student Information pages. Copy follows imakarate.com.
// ─────────────────────────────────────────────────────────────────────────────

import { esc, IMG, pageShell, pageHero } from './siteTheme.js';

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
          <li>There is no “first hand” in Karate. (There is no first attack — karate is about self-defense.)</li>
          <li>Karate supports righteousness.</li>
          <li>First understand yourself, then understand others.</li>
          <li>The art of mind is more important than the art of technique.</li>
          <li>The mind needs to be freed.</li>
          <li>Trouble is born of negligence.</li>
          <li>Do not think that Karate is only in the dojo.</li>
        </ul>
        <ul class="arrow-list">
          <li>Karate training requires a lifetime.</li>
          <li>Transform everything into Karate; therein lies the exquisiteness.</li>
          <li>Genuine Karate is like hot water; it cools down if you do not keep heating it.</li>
          <li>Do not have thoughts of winning; rather, think of not losing.</li>
          <li>Move according to your opponent.</li>
          <li>Consider a person’s behavior in light of their character.</li>
          <li>Apply the way of Karate to all things. Therein lies its beauty.</li>
          <li>Karate is like boiling water; without heat, it returns to tepid water.</li>
          <li>Do not think that you have to win; think that you do not have to lose.</li>
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
  const groups = [
    ['Taikyoku', 'This is the most elementary kata practiced at IMA. Developed by Master Funakoshi’s son, Gigo, Taikyoku helps new students learn basic kata principles.', [
      ['太極初段', 'Taikyoku Shodan', 'first cause'],
    ]],
    ['Heian', 'Created relatively recently, the Heians were originally called Pinan, from the Okinawan pronunciation of the Chinese word for safety. When introduced to Japan, Master Funakoshi changed the name to Heian.', [
      ['平安初段', 'Heian Shodan', 'peaceful mind, first level'],
      ['平安二段', 'Heian Nidan', 'peaceful mind, second level'],
      ['平安三段', 'Heian Sandan', 'peaceful mind, third level'],
      ['平安四段', 'Heian Yondan', 'peaceful mind, fourth level'],
      ['平安五段', 'Heian Godan', 'peaceful mind, fifth level'],
    ]],
    ['Tekki', 'Originally known in Okinawa as Naihanchi, the katas were renamed by Master Funakoshi upon introduction to Japan to reflect the strength exhibited with kiba-dachi.', [
      ['鉄騎初段', 'Tekki Shodan', 'iron horse riding, first level'],
      ['鉄騎弐段', 'Tekki Nidan', 'iron horse riding, second level'],
      ['鉄騎参段', 'Tekki Sandan', 'iron horse riding, third level'],
    ]],
    ['Advanced Katas', 'The advanced katas practiced at IMA, from Bassai Dai through the Unsu. Each emphasizes different combinations of power, speed, and athletic ability.', [
      ['', 'Bassai Dai', 'to penetrate a fortress (big) — strong techniques emphasizing hip movement'],
      ['', 'Bassai Sho', 'to penetrate a fortress (small) — derived from Bassai Dai'],
      ['', 'Kanku Dai', 'to look at the sky — combining elements from the Heian and Tekki series'],
      ['', 'Kanku Sho', 'to look at the sky (small)'],
      ['', 'Empi', 'flying swallow — rapid movements and changes of direction'],
      ['', 'Jion', 'named after the temple Jion-ji'],
      ['', 'Hangetsu', 'half moon — breathing and tension'],
      ['', 'Gankaku', 'crane on a rock'],
      ['', 'Jitte', 'ten hands'],
      ['', 'Nijushiho', 'twenty-four steps'],
      ['', 'Sochin', 'preserved peace'],
      ['', 'Chinte', 'rare hands'],
      ['', 'Meikyo', 'bright mirror'],
      ['', 'Gojushiho Dai', 'fifty-four steps (big)'],
      ['', 'Gojushiho Sho', 'fifty-four steps (small)'],
      ['', 'Unsu', 'cloud hands — the most athletic of the Shotokan katas'],
      ['', 'Wankan', 'king’s crown'],
    ]],
  ];
  const content = `
  ${pageHero({
    eyebrow: 'Student Information',
    title: 'List of Katas',
    lead: 'The katas of Shotokan karate, from Taikyoku to Unsu.',
    crumbs: [...CRUMBS_STUDENT, { label: 'List of Katas' }],
  })}
  <div class="section" style="max-width:900px">
    <div class="img-frame natural reveal" style="max-width:240px;margin:0 auto 44px;background:#0d0d0f;padding:10px">
      <img src="${I('kubodo-kata.jpg')}" alt="Kobudo kata demonstration" loading="lazy" />
    </div>
    ${groups
      .map(
        ([name, intro, katas], i) => `
    <details class="acc reveal" ${i === 0 ? 'open' : ''}>
      <summary>${name} <span class="nav-arrow">▾</span></summary>
      <div class="acc-body">
        <p>${intro}</p>
        <ul class="dict-list">
          ${katas.map(([jp, romaji, meaning]) => `<li>${jp ? `<span class="jp">${jp}</span>` : ''}<b>${romaji}</b> — ${meaning}</li>`).join('')}
        </ul>
      </div>
    </details>`,
      )
      .join('')}
  </div>`;
  return pageShell({ title: 'List of Katas | IMA Karate', description: 'The complete list of Shotokan karate katas practiced at IMA: Taikyoku, Heian, Tekki, and the advanced katas.', activeNav: 'student', content });
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
      ['Teisho-uke', '(tay-sho oo-kay)', 'Palm-heel block'],
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
      ['Mawashi-geri', '(mah-wah-she geh-rhee)', 'Roundhouse kick'],
      ['Mikazuki-geri', '(me-kah-zoo-key geh-rhee)', 'Crescent kick'],
      ['Ushiro-geri', '(oo-she-row geh-rhee)', 'Back kick'],
      ['Yoko-geri-keage', '(yoh-koh geh-rhee key-ah-geh)', 'Side snap kick'],
      ['Yoko-geri-kekomi', '(yoh-koh geh-rhee kay-koh-me)', 'Side thrust kick'],
      ['Hiza-geri', '(he-zah geh-rhee)', 'Knee kick'],
      ['Kansetsu-geri', '(kahn-seh-tsu geh-rhee)', 'Joint kick'],
    ]],
    ['Strike (Uchi — pronounced “oo-chee”)', [
      ['Empi-uchi', '(em-pee oo-chee)', 'Elbow strike'],
      ['Shuto-uchi', '(shoe-toe oo-chee)', 'Knife-hand strike'],
      ['Tettsui-uchi', '(tet-sue-ee oo-chee)', 'Hammer-fist strike'],
      ['Uraken-uchi', '(oo-rah-ken oo-chee)', 'Back-fist strike'],
      ['Haito-uchi', '(hi-toe oo-chee)', 'Ridge-hand strike'],
      ['Nukite', '(noo-key-teh)', 'Spear-hand strike'],
    ]],
    ['Stance (Dachi — pronounced “dah-chee”)', [
      ['Zenkutsu-dachi', '(zen-koo-tsu dah-chee)', 'Front stance'],
      ['Kokutsu-dachi', '(ko-koo-tsu dah-chee)', 'Back stance'],
      ['Kiba-dachi', '(key-bah dah-chee)', 'Horse-riding stance'],
      ['Fudo-dachi', '(foo-doh dah-chee)', 'Immovable stance'],
      ['Neko-ashi-dachi', '(neh-koh ah-she dah-chee)', 'Cat stance'],
      ['Heisoku-dachi', '(hey-so-koo dah-chee)', 'Informal attention stance'],
      ['Musubi-dachi', '(moo-soo-bee dah-chee)', 'Formal attention stance'],
      ['Han-zenkutsu-dachi', '(han zen-koo-tsu dah-chee)', 'Half front stance'],
      ['Sanchin-dachi', '(sahn-chin dah-chee)', 'Hourglass stance'],
      ['Teiji-dachi', '(tay-jee dah-chee)', 'T-stance'],
    ]],
    ['General Terms', [
      ['Dojo', '(doh-joh)', 'Training hall'],
      ['Sensei', '(sen-say)', 'Teacher / instructor'],
      ['Hanshi', '(hahn-she)', 'Master instructor'],
      ['Shihan', '(she-hahn)', 'Master / expert instructor'],
      ['Senpai', '(sen-pie)', 'Senior student'],
      ['Kohai', '(koh-high)', 'Junior student'],
      ['Gi (Karate-gi)', '(gee)', 'Uniform'],
      ['Obi', '(oh-bee)', 'Belt'],
      ['Kata', '(kah-tah)', 'Form'],
      ['Kumite', '(koo-mee-teh)', 'Sparring'],
      ['Kihon', '(key-hone)', 'Basics / fundamentals'],
      ['Rei', '(ray)', 'Bow / respect'],
      ['Yoi', '(yoy)', 'Ready'],
      ['Yame', '(yah-meh)', 'Stop'],
      ['Hajime', '(hah-jee-meh)', 'Begin'],
      ['Mawatte', '(mah-waht-teh)', 'Turn'],
      ['Mokuso', '(moh-koo-so)', 'Meditation'],
      ['Kime', '(key-meh)', 'Focus'],
      ['Kiai', '(kee-eye)', 'Spirit shout'],
      ['Oss / Osu', '(oss)', 'Acknowledgment / sign of respect'],
      ['Karate-do', '(kah-rah-teh doh)', 'The way of the empty hand'],
      ['Hajime', '(hah-jee-meh)', 'Begin'],
      ['Seiza', '(say-zah)', 'Formal sitting position'],
      ['Shotokan', '(show-toh-kahn)', 'Style of karate founded by Gichin Funakoshi'],
      ['Kyu', '(queue)', 'Color belt grade'],
      ['Dan', '(dahn)', 'Black belt degree'],
      ['Honbu', '(hone-boo)', 'Headquarters'],
      ['Gasshuku', '(gah-shoo-koo)', 'Training camp'],
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

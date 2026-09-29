// ─────────────────────────────────────────────────────────────────────────────
//  News & Events + Dojo Locations pages. Copy follows imakarate.com.
// ─────────────────────────────────────────────────────────────────────────────

import { esc, IMG_ORIGIN, pageShell, pageHero } from './siteTheme.js';

const I = (path) => `${IMG_ORIGIN}/${path.replace(/^\//, '')}`;

// ═══════════════════════════════════════════════════════════════════════════════
//  NEWS & EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
export function buildNewsEventsPage() {
  const content = `
  ${pageHero({
    eyebrow: 'News & Events',
    title: 'News & Events',
    lead: 'The latest from the IMA family.',
    bg: I('2025/07/GASSUKUMountain-002-465x620.jpg'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'News & Events' }],
  })}

  <!-- 2025 Gasshuku -->
  <div class="section">
    <div class="grid-2" style="align-items:start">
      <div class="img-frame reveal" style="max-width:440px">
        <img src="${I('2025/07/GASSUKUMountain-002-465x620.jpg')}" alt="2025 IMA Gasshuku" loading="lazy" />
      </div>
      <div class="reveal" data-delay="90">
        <p class="eyebrow">Annual Training Camp</p>
        <h2 class="sec">2025 Gasshuku</h2>
        <div class="prose">
          <p>Please mark your calendar for another exciting Gasshuku in Colorado. We are excited to announce having special guests in addition to other great instructors.</p>
          <p>Sensei Palmer from Peru, in addition to Sensei Obran — with hundreds of national and international medals and titles between them — are our honored guests for the 2025 Gasshuku.</p>
          <p>There will be separate sessions for different levels with different emphases on the training. Please email the application form to info@imakarate.com. We offer several methods of payment such as PayPal, check, and cash.</p>
          <p>Do not miss this once-a-year opportunity.</p>
        </div>
        <p style="margin-top:22px">
          <a href="https://imakarate.com/wp-content/uploads/2025/07/2025-Gasshuku.pdf" target="_blank" rel="noopener" class="btn-primary">Download Schedule & Application</a>
        </p>
      </div>
    </div>
  </div>

  <!-- Rocky Mountain Championships -->
  <div class="section alt">
    <div class="inner">
      <div class="grid-2" style="align-items:start">
        <div class="reveal">
          <p class="eyebrow">Tournament</p>
          <h2 class="sec">Rocky Mountain Championships</h2>
          <div class="prose">
            <p>Dear IMA Family — it’s that time of year again to prepare for our annual Rocky Mountain Championships (RMC). We are beyond grateful for all the support and to be celebrating over 30 years of running the tournament here in Louisville, Colorado.</p>
            <p>This year the tournament is special as it is officially a USA Karate sanctioned event, allowing access to more training opportunities and competition for those exploring these options.</p>
            <p>Finally, we need help from our community to make this all happen. Volunteers for set up and takedown would be greatly appreciated — all Tournament Day table volunteers will receive the USA karate shirt.</p>
          </div>
        </div>
        <div class="reveal" data-delay="90">
          <div class="img-frame">
            <img src="${I('2025/03/MadaniFlyer.png')}" alt="2025 Rocky Mountain Championship flyer" loading="lazy" />
          </div>
          <div class="prose" style="margin-top:18px">
            <p><strong>2025 Rocky Mountain International Championship</strong> — held in Louisville, Colorado, USA at Monarch High School. It is with great pleasure that we invite you to the RMC tournament hosted by the International Martial Arts Association.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Event calendar CTA -->
  <div class="section">
    <div class="reveal" style="text-align:center;max-width:640px;margin:0 auto">
      <p class="eyebrow">Stay in the loop</p>
      <h2 class="sec">Don’t Miss an Event</h2>
      <p class="lead" style="margin:0 auto 26px">Check the event calendar for upcoming belt tests, tournaments, seminars, and camps.</p>
      <a href="mailto:info@imakarate.com?subject=IMA%20Event%20Calendar" class="btn-primary">Request the Event Calendar</a>
    </div>
  </div>`;
  return pageShell({ title: 'News & Events | IMA Karate', description: 'The latest news from IMA Karate: Gasshuku training camp, Rocky Mountain Championships, and upcoming events.', activeNav: 'news', content });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DOJO LOCATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export function buildDojoLocationsPage() {
  const states = [
    ['Colorado', [
      { name: 'IMA Honbu Dojo', head: 'Chief Instructor: Hanshi Cyrus Madani · Head Instructor: Shihan Fariba Madani', addr: '1340 Main Street, Louisville, CO 80027', phone: '(303) 665-0339', img: '2023/02/Hanshi-edited-1-620x620.jpg' },
      { name: 'Louisville Recreation Center', head: 'Head instructor: Sensei Brian Meyer, Godan', addr: '900 W Via Appia, Louisville, CO', note: 'Assistant instructors: Dasha Petropavlovskikh, Ben Gygi, Miriam Rosenshein' },
      { name: 'Boulder Valley YMCA — Arapahoe Campus', head: 'Instructor: Kamran Madani, Nidan', addr: '2800 Dagny Way, Lafayette, CO 80026', phone: '(303) 664-5450', note: 'Assistant instructors: Nisha Maheshwari, Alex Miller' },
      { name: 'North Fork Karate (Paonia)', head: 'Chief Instructor: Shihan Rick McGavin · Head Instructor: Jennifer McGavin, Nidan', addr: '311 Second Street, Paonia, CO 81428', phone: '(970) 527-5477', site: 'www.northforkkarate.com' },
    ]],
    ['Missouri', [
      { name: 'IMA Integrity Martial Arts Academy (Kansas City)', head: 'Chief Instructor: Shihan Rudolph Muhammad, Rokudan', addr: '11130 Holmes Rd., Kansas City, MO 64131', phone: '(816) 761-0143' },
    ]],
    ['Nevada', [
      { name: 'Las Vegas Karate-Do', head: 'Chief Instructor: Sensei Catalin (Nick) Neagu, Godan', addr: 'Las Vegas, NV', phone: '(702) 944-4346', site: 'www.karatekrav.com' },
    ]],
    ['New York', [
      { name: 'IMA Nihon Karate Do (Forest Hills)', head: 'Chief instructor: Shihan Shanta Thokar', addr: '113-25 Queens Blvd, Suite 117, Forest Hills, NY 11375', phone: '269-267-5882', site: 'www.imakarate.org', img: '2023/02/5f384ded-d426-44c5-a421-fd336b45a42e-1-465x620.jpg' },
      { name: 'IMA Nihon Karate Do (Woodside)', head: 'Chief instructor: Shihan Shanta Thokar', addr: '39-30 58th Street, Woodside, NY 11377', phone: '917-215-3685', site: 'www.imakarate.org' },
      { name: 'IMA New York (Queens)', head: 'Chief instructor: Sensei Parkai Rai', addr: '41-32 75th Street, Elmhurst, NY 11373', phone: '(646) 339-4410', img: '2024/05/parkhi-rai-495x620.jpg' },
    ]],
    ['Pennsylvania', [
      { name: 'Bethlehem YMCA', head: 'Chief Instructor: Senpai Ernesto Barnabas · Head Instructor: Senpai Sara Barnabas', addr: '430 E. Broad Street, Bethlehem, PA', note: 'Nidan-ho assistant instructors' },
    ]],
    ['Texas', [
      { name: 'IMA Karate Houston', head: 'Chief Instructor: Shihan Patrick Jean-Claude Richoux · Head Instructor: Robert Cutrera, Sandan', addr: '11850 #Z Bissonnet St., Houston, TX 77099', img: '2023/02/Houston-edited-620x620.jpg' },
    ]],
    ['Utah', [
      { name: 'IMA Utah (Cottonwood Heights)', head: 'Chief Instructor: Sensei Marius Gilca, Godan', addr: 'Cottonwood Heights Rec. Center, 7500 S. 2700 E., Cottonwood Heights, UT 84121', phone: '(801) 983-5262', site: 'www.imautah.com', note: 'Also: Alta Canyon Sports Center (Sandy) and Montessori Community School (Salt Lake City)', img: '2023/02/Shihan-Utah-edited-620x620.jpg' },
      { name: 'International Budokan Shotokan Karate (West Valley City)', head: 'Chief Instructor: Sensei Amadou Niang', addr: 'Redwood Recreation Center, 3060 Lester Ave, Salt Lake City, UT', phone: '(801) 450-6172', note: 'Also: Northwest Recreation Center and Central City Recreation Center', img: '2023/02/Utah-2-edited-620x620.jpg' },
    ]],
  ];

  const content = `
  ${pageHero({
    eyebrow: 'Locations',
    title: 'Dojo Locations',
    lead: 'Find an IMA-affiliated dojo near you.',
    bg: I('2010/09/us_map.gif'),
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Locations' }],
  })}
  <div class="section">
    <div class="reveal prose" style="max-width:820px">
      <p><strong>Students:</strong> the IMA Karate website provides class schedules and instructor information for the main dojo location (Honbu Dojo) in Louisville, Colorado. For information about other dojos and training locations, please contact the dojo directly using the details below.</p>
      <p><strong>Karate clubs, organizations and schools:</strong> interested in becoming an <a href="/about/affiliated-dojo" style="color:#d4a24a">IMA-Affiliated Dojo</a>? Read about the many <a href="/about/benefits" style="color:#d4a24a">benefits of joining the IMA Organization</a>.</p>
    </div>
    <div class="img-frame reveal" style="max-width:680px;margin:36px 0 54px">
      <img src="${I('2010/09/us_map.gif')}" alt="Map of IMA dojo locations across the United States" loading="lazy" />
    </div>
    ${states
      .map(
        ([state, dojos]) => `
    <div class="loc-state reveal">
      <h3>${esc(state)}</h3>
      <div class="loc-grid">
        ${dojos
          .map(
            (d) => `
        <div class="loc-card">
          <h4>${esc(d.name)}</h4>
          <p class="loc-name" style="font-size:.85rem;color:#d4a24a">${esc(d.head)}</p>
          <p>${esc(d.addr)}</p>
          ${d.phone ? `<p>☎ <a href="tel:${d.phone.replace(/[^\\d+]/g, '')}">${esc(d.phone)}</a></p>` : ''}
          ${d.site ? `<p><a href="https://${esc(d.site)}" target="_blank" rel="noopener">${esc(d.site)}</a></p>` : ''}
          ${d.note ? `<p style="color:#8f8f93;font-size:.8rem">${esc(d.note)}</p>` : ''}
          ${d.img ? `<div class="img-frame" style="margin-top:14px;aspect-ratio:1"><img src="${I(d.img)}" alt="${esc(d.name)} instructor" loading="lazy" style="aspect-ratio:1" /></div>` : ''}
        </div>`,
          )
          .join('')}
      </div>
    </div>`,
      )
      .join('')}
    <p class="reveal" style="margin-top:44px"><a href="/about/alliances" class="btn-outline">See International Alliances</a> <a href="/about/affiliated-dojo" class="btn-primary" style="margin-left:10px">Become an Affiliated Dojo</a></p>
  </div>`;
  return pageShell({ title: 'Dojo Locations | IMA Karate', description: 'IMA Karate dojo locations across Colorado, Missouri, Nevada, New York, Pennsylvania, Texas, and Utah.', activeNav: 'locations', content });
}

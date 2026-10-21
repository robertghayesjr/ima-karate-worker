import { validateDesign, applyDesign, readableHtml, pathMatches, checkHtml } from '../src/siteDesign.js';
import { validateDoc } from '../src/contentDocs.js';
import { renderBaseHtml, renderFullHtml, listEditablePaths } from '../src/pageRender.js';
import { handleAdminRoutes } from '../src/adminRoutes.js';
import worker from '../src/worker.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const kv = new Map();
const env = { IMA_KARATE: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); }, list: async () => ({ keys: [] }) }, ADMIN_PASSWORD: 'pw', DEMO_MODE: '1' };

// validation
ok(validateDesign({ css: '', edits: [], pages: [] }).ok, 'empty design valid');
ok(validateDoc('design', { css: 'h1{color:red}' }).ok, 'contentDocs routes design validation');
for (const [bad, why] of [
  [{ edits: [{ path: '/', find: 'abc', replace: '<script>x</script>' }] }, 'script'],
  [{ edits: [{ path: '/', find: 'abc', replace: '<img src=x onerror=alert(1)>' }] }, 'event handler'],
  [{ edits: [{ path: '/', find: 'abc', replace: '<a href="javascript:alert(1)">x</a>' }] }, 'javascript: url'],
  [{ edits: [{ path: '/', find: 'abc', replace: '<iframe src="https://evil.com"></iframe>' }] }, 'off-list iframe'],
  [{ edits: [{ path: '/', find: 'abc', replace: '<form action="https://evil.com">' }] }, 'off-site form'],
  [{ css: 'body{background:url(javascript:alert(1))}' }, 'css javascript url'],
  [{ css: '</style><script>alert(1)</script>' }, 'css breakout'],
  [{ css: '@import url(https://x.com/a.css);' }, 'css @import'],
  [{ pages: [{ path: '/admin', title: 'x', html: '<p>x</p>' }] }, 'reserved page path'],
  [{ pages: [{ path: '/Bad Path', title: 'x', html: '<p>x</p>' }] }, 'bad page path'],
  [{ edits: [{ path: '/', find: 'ab', replace: '' }] }, 'find too short'],
  [{ extra: 1 }, 'unknown field'],
]) ok(!validateDesign(bad).ok, 'rejects ' + why);
ok(!checkHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>', 'x'), 'allows YouTube embed');
ok(pathMatches('*', '/x') && pathMatches('/student-information/*', '/student-information/kata') && !pathMatches('/about', '/about-us'), 'path matching');

// apply: never edits inside script/style
const html = '<html><head><title>T</title></head><body><h1>Hello Dojo</h1><script>var s="Hello Dojo"</script><style>.a{content:"Hello Dojo"}</style><p>Hello Dojo</p></body></html>';
const r = applyDesign(html, { css: 'h1{color:gold}', edits: [{ path: '/', find: 'Hello Dojo', replace: 'Welcome' }, { path: '/', find: 'nope-nope', replace: '' }] }, '/');
ok(r.html.includes('<h1>Welcome</h1>') && r.html.includes('<p>Welcome</p>') && r.html.includes('var s="Hello Dojo"') && r.html.includes('content:"Hello Dojo"'), 'edits skip script/style blocks');
ok(r.html.includes('<style id="ima-design">h1{color:gold}</style>\n</head>'), 'css injected in head');
ok(r.unmatched.length === 1 && r.unmatched[0] === 1, 'unmatched edits reported');
ok(readableHtml(html).html.includes('<!-- (script) -->') && !readableHtml(html).html.includes('var s'), 'readable html strips scripts');

// real pages
const home = await renderBaseHtml(env, '/');
ok(home && home.includes('</nav>') || home.includes('<header'), 'renders home');
const paths = listEditablePaths({ pages: [{ path: '/summer-camp' }] });
ok(paths.includes('/') && paths.includes('/belt-testing') && paths.includes('/summer-camp') && paths.length > 10, 'lists pages (' + paths.length + ')');
for (const p of paths.filter((x) => x !== '/summer-camp')) {
  const h = await renderBaseHtml(env, p);
  if (!h) ok(false, 'page renders: ' + p);
}
ok(true, 'all built-in pages render');

// admin chat tool flow (mock Claude)
const login = await handleAdminRoutes(new Request('https://ima.rob-hayes.com/admin/api/login', { method: 'POST', body: JSON.stringify({ password: 'pw' }), headers: { 'Content-Type': 'application/json' } }), env, new URL('https://ima.rob-hayes.com/admin/api/login'));
const token = (await login.json()).token;
const H = { 'x-admin-auth': token, 'Content-Type': 'application/json' };
const call = (method, path, body) => handleAdminRoutes(new Request('https://ima.rob-hayes.com' + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined }), env, new URL('https://ima.rob-hayes.com' + path));
const readable = readableHtml(home).html;
const target = (readable.match(/<h1[^>]*>[\s\S]*?<\/h1>/) || [])[0];
ok(!!target, 'home has an h1 to edit');
const goodDoc = { css: '.hero h1{letter-spacing:.02em}', edits: [{ path: '/', find: target, replace: target.replace('</h1>', '</h1><p class="ima-test-line">Now enrolling for spring</p>'), note: 'Add spring line under headline' }, { path: '*', find: '</footer>', replace: '<div class="ima-test-foot">Test footer</div></footer>', note: 'Footer line' }], pages: [{ path: '/summer-camp', title: 'Summer Camp', html: '<section class="section"><div class="container"><h1>Summer Camp</h1><p>Info</p></div></section>' }] };
const badDoc = { ...goodDoc, edits: [{ path: '/', find: 'THIS TEXT IS NOT ON THE PAGE', replace: 'x' }] };
let step = 0; const seen = [];
env.ANTHROPIC_API_KEY = 'k';
globalThis.fetch = async (url, init) => {
  if (!String(url).includes('anthropic.com')) return new Response('Not found', { status: 404 });
  const body = JSON.parse(init.body);
  const last = body.messages[body.messages.length - 1];
  if (Array.isArray(last.content)) for (const c of last.content) if (c.type === 'tool_result') seen.push(JSON.parse(c.content));
  step++;
  const tu = (name, input) => new Response(JSON.stringify({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't' + step, name, input }] }));
  if (step === 1) return tu('list_pages', {});
  if (step === 2) return tu('get_page', { path: '/' });
  if (step === 3) return tu('save_draft', { key: 'design', doc: badDoc });
  if (step === 4) return tu('save_draft', { key: 'design', doc: goodDoc });
  return new Response(JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Draft saved, ready to preview.' }] }));
};
const chat = await call('POST', '/admin/api/chat', { messages: [{ role: 'user', content: 'Add a spring line under the headline, a footer line, and a summer camp page' }] });
const cj = await chat.json();
ok(seen[0]?.pages?.includes('/about') || seen[0]?.pages?.length > 10, 'tool: list_pages');
ok(seen[1]?.html?.includes(target), 'tool: get_page returns exact html');
ok(/Not saved/.test(seen[2]?.error || ''), 'tool: save rejected when find text missing');
ok(seen[3]?.ok || /draft/i.test(JSON.stringify(seen[3])), 'tool: valid design draft saved');
ok(cj.toolEvents?.some((e) => e.type === 'draft_saved' && e.key === 'design'), 'chat reports draft_saved');

// preview shows draft, live does not yet
const pv = await (await call('GET', '/admin/api/preview/design?path=/')).text();
ok(pv.includes('ima-test-line') && pv.includes('ima-test-foot') && pv.includes('id="ima-design"'), 'preview home has draft edits + css');
const pvNew = await (await call('GET', '/admin/api/preview/design?path=/summer-camp')).text();
ok(pvNew.includes('<h1>Summer Camp</h1>') && pvNew.includes('ima-test-foot') && pvNew.includes('<nav'), 'preview new page in theme with * edit');
const live = async (p) => worker.fetch(new Request('https://ima.rob-hayes.com' + p), env, { waitUntil() {}, passThroughOnException() {} });
ok(!(await (await live('/')).text()).includes('ima-test-line'), 'live unchanged before publish');

// publish → live; restore → back
const pub = await call('POST', '/admin/api/doc/design/publish');
ok(pub.status === 200, 'publish design');
const liveHome = await (await live('/')).text();
ok(liveHome.includes('ima-test-line') && liveHome.includes('ima-test-foot'), 'live home has published edits');
const liveCamp = await live('/summer-camp');
ok(liveCamp.status === 200 && (await liveCamp.text()).includes('Summer Camp'), 'new page served live');
const liveAbout = await (await live('/about')).text();
ok(liveAbout.includes('ima-test-foot') && !liveAbout.includes('ima-test-line'), '* edit on every page, / edit only on home');
const st = await (await call('GET', '/admin/api/doc/design')).json();
const firstRev = st.revisions[0];
ok(st.revisions.length >= 1, 'revision recorded');
// publish an empty design then restore the first one
await call('PUT', '/admin/api/doc/design/draft', { doc: { css: '', edits: [], pages: [] } });
await call('POST', '/admin/api/doc/design/publish');
ok(!(await (await live('/')).text()).includes('ima-test-line'), 'empty design publish removes edits');
ok((await live('/summer-camp')).status !== 200 || !(await (await live('/summer-camp')).text()).includes('<h1>Summer Camp</h1>'), 'new page gone after removal');
await call('POST', '/admin/api/doc/design/restore/' + firstRev.revId);
await call('POST', '/admin/api/doc/design/publish');
ok((await (await live('/')).text()).includes('ima-test-line'), 'restore brings edits back');

// requests endpoints gone
ok((await call('GET', '/admin/api/requests')).status === 404, 'developer request list removed');
console.log('\n' + fails + ' failures'); process.exit(fails ? 1 : 0);

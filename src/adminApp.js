// ─────────────────────────────────────────────────────────────────────────────
//  Admin SPA — served at /admin. Login, Claude chat with attachments,
//  draft/publish/restore for content docs, and belt-test settings.
// ─────────────────────────────────────────────────────────────────────────────

export function buildAdminApp() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>IMA Admin — Website Studio</title>
<meta name="robots" content="noindex,nofollow" />
<link rel="icon" href="https://cdn.prod.website-files.com/67294bbae93e819099f356c2/6729882799654f6726ad05d9_webp%20ima.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#0a0a0b;color:#f4f4f5;font-family:'Inter',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%}
a{color:#d4a24a}
h1,h2,h3{font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.03em}
button{cursor:pointer;font:inherit}
input,textarea,select{font:inherit;background:#101013;border:1px solid #2c2c31;color:#f4f4f5;padding:10px 14px;border-radius:6px;outline:none;width:100%}
input:focus,textarea:focus,select:focus{border-color:#c8102e;box-shadow:0 0 0 3px rgba(200,16,46,.15)}
::selection{background:#c8102e;color:#fff}

/* login */
#login{min-height:100vh;display:grid;place-items:center;padding:24px}
.login-card{background:#131316;border:1px solid #26262b;border-radius:12px;padding:44px 40px;width:min(420px,92vw);text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.login-card img{height:64px;margin:0 auto 18px}
.login-card h1{font-size:1.5rem;margin:0 0 6px}
.login-card p{color:#9a9a9f;font-size:.88rem;margin:0 0 26px}
#login-err{color:#e06a76;font-size:.85rem;min-height:20px;margin-top:12px}
.btn{display:inline-block;background:linear-gradient(135deg,#c8102e,#a00d24);color:#fff;border:0;padding:11px 24px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.07em;font-size:.85rem;border-radius:6px;transition:filter .2s,transform .2s}
.btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.btn-gold{background:linear-gradient(135deg,#d4a24a,#b8862f);color:#151004}
.btn-ghost{background:transparent;border:1px solid #3a3a40;color:#f4f4f5}

/* app */
#app{display:none;height:100vh;flex-direction:column}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 22px;background:#0d0d0f;border-bottom:1px solid #1f1f23}
.topbar .brand{display:flex;align-items:center;gap:14px}
.topbar img{height:38px}
.topbar h1{font-size:1.05rem;margin:0}
.topbar .sub{font-size:.72rem;color:#8f8f93;text-transform:uppercase;letter-spacing:.12em}
.main{flex:1;display:grid;grid-template-columns:minmax(0,1fr) 400px;min-height:0}
@media(max-width:980px){.main{grid-template-columns:1fr;overflow-y:auto}}

/* chat */
.chat{display:flex;flex-direction:column;min-height:0;border-right:1px solid #1f1f23}
@media(max-width:980px){.chat{border-right:0;max-height:70vh}}
.chat-log{flex:1;overflow-y:auto;padding:26px 26px 12px;display:flex;flex-direction:column;gap:14px}
.msg{max-width:min(680px,90%);padding:13px 17px;border-radius:12px;font-size:.93rem;white-space:pre-wrap;overflow-wrap:break-word}
.msg.user{align-self:flex-end;background:linear-gradient(135deg,#c8102e,#a00d24);border-bottom-right-radius:3px}
.msg.bot{align-self:flex-start;background:#161619;border:1px solid #26262b;border-bottom-left-radius:3px}
.msg.sys{align-self:center;background:rgba(212,162,74,.08);border:1px solid rgba(212,162,74,.3);color:#e4b666;font-size:.82rem;text-align:center}
.msg .att{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.msg .att img{width:86px;height:86px;object-fit:cover;border-radius:8px;border:1px solid #333}
.chat-input{padding:16px 20px 20px;border-top:1px solid #1f1f23;background:#0d0d0f}
.chat-input textarea{min-height:64px;resize:vertical;margin-bottom:10px}
.chat-input .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.chip{background:#131316;border:1px solid #2c2c31;border-radius:20px;padding:5px 12px;font-size:.78rem;color:#c9c9cd;display:inline-flex;gap:8px;align-items:center}
.chip button{background:none;border:0;color:#e06a76;font-size:.95rem;line-height:1;padding:0}
.att-strip{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.att-strip .att-item{position:relative}
.att-strip img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #333}
.att-strip .att-item .x{position:absolute;top:-6px;right:-6px;background:#c8102e;color:#fff;border-radius:50%;width:20px;height:20px;border:0;font-size:.7rem;line-height:1}
.att-strip .att-item .use{position:absolute;left:0;right:0;bottom:-24px;background:#131316;border:1px solid #3a3a40;color:#d4a24a;border-radius:4px;padding:2px 4px;font-size:.62rem;white-space:nowrap}
.att-strip .att-item{margin-bottom:28px}
.hint{font-size:.75rem;color:#77777c;margin-top:8px}

/* right panel */
.panel{display:flex;flex-direction:column;min-height:0;background:#0c0c0e}
@media(max-width:980px){.panel{border-top:1px solid #1f1f23}}
.tabs{display:flex;gap:4px;padding:12px 14px 0;border-bottom:1px solid #1f1f23}
.tabs button{flex:1;background:none;border:0;color:#9a9a9f;padding:10px 6px;font-family:'Oswald',sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:.8rem;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
.pv-path{background:#141416;color:#f4f4f5;border:1px solid #2a2a2e;border-radius:8px;padding:8px 10px;font:inherit;font-size:.85rem;max-width:200px}
.tabs button.on{color:#d4a24a;border-bottom-color:#d4a24a}
.tab-body{flex:1;overflow-y:auto;padding:20px 18px 30px}
.doc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.doc-head h2{margin:0;font-size:1rem}
.badge{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:12px}
.badge.draft{background:rgba(212,162,74,.14);color:#e4b666;border:1px solid rgba(212,162,74,.4)}
.badge.published{background:rgba(76,175,80,.12);color:#7bd47f;border:1px solid rgba(76,175,80,.35)}
.badge.off{background:rgba(255,255,255,.05);color:#8f8f93;border:1px solid #333}
.doc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.doc-actions .btn{padding:9px 16px;font-size:.78rem}
.rev-list{margin-top:20px;border-top:1px solid #1f1f23;padding-top:16px}
.rev-list h3{font-size:.85rem;margin:0 0 10px;color:#d4a24a}
.rev-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #19191c;font-size:.85rem;color:#c9c9cd}
.rev-item button{background:none;border:1px solid #3a3a40;color:#d4a24a;border-radius:5px;padding:4px 12px;font-size:.75rem;text-transform:uppercase;letter-spacing:.06em}
.rev-item button:hover{border-color:#d4a24a}
.cfg-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.cfg-grid .full{grid-column:1/-1}
.field label{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:#9a9a9f;margin-bottom:6px;font-weight:600}
.field .help{font-size:.72rem;color:#77777c;margin-top:4px}
.save-note{color:#7bd47f;font-size:.85rem;min-height:20px;margin-top:10px}

/* preview modal */
#preview-modal{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);z-index:100;display:none;flex-direction:column}
#preview-modal.open{display:flex}
.pv-head{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#131316;border-bottom:1px solid #26262b}
.pv-head h2{margin:0;font-size:1rem}
.pv-head .row{display:flex;gap:10px;align-items:center}
#preview-frame{flex:1;border:0;background:#0a0a0b;width:100%}
.notice{background:rgba(200,16,46,.08);border:1px solid rgba(200,16,46,.3);border-radius:8px;padding:12px 16px;font-size:.82rem;color:#e8a0a8;margin-bottom:16px}
.ds-table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}.ds-table th,.ds-table td{text-align:left;padding:10px 8px;border-bottom:1px solid #222;vertical-align:top}.ds-table a{color:#d4af37}
</style>
</head>
<body>

<div id="login">
  <div class="login-card">
    <img src="https://cdn.prod.website-files.com/67294bbae93e819099f356c2/672953cd9cf8c751045fb537_Logo.png" alt="IMA Karate" />
    <h1>Website Studio</h1>
    <p>Sign in to manage the IMA Karate website</p>
    <form id="login-form">
      <input type="password" id="login-pass" placeholder="Admin password" autocomplete="current-password" required />
      <div id="login-err"></div>
      <button class="btn" type="submit" style="width:100%">Sign In</button>
    </form>
  </div>
</div>

<div id="app">
  <div class="topbar">
    <div class="brand">
      <img src="https://cdn.prod.website-files.com/67294bbae93e819099f356c2/672953cd9cf8c751045fb537_Logo.png" alt="IMA" />
      <div>
        <h1>Website Studio</h1>
        <div class="sub">IMA Karate · admin</div>
      </div>
    </div>
    <button class="btn btn-ghost" id="logout">Sign out</button>
  </div>

  <div class="main">
    <div class="chat">
      <div class="chat-log" id="chat-log"></div>
      <div class="chat-input">
        <div class="att-strip" id="att-strip" style="display:none"></div>
        <textarea id="chat-text" placeholder="Ask Claude to update the site — e.g. "Add a news item about the December belt test""></textarea>
        <div class="row">
          <button class="btn btn-ghost" id="attach-btn" style="padding:10px 16px">📎 Attach</button>
          <input type="file" id="file-input" accept="image/png,image/jpeg,image/webp,image/gif,text/plain,text/csv" multiple hidden />
          <button class="btn" id="send-btn">Send</button>
        </div>
        <div class="hint">Claude saves changes as drafts — nothing goes live until you press Publish in the panel on the right.</div>
      </div>
    </div>

    <div class="panel">
      <div class="tabs">
        <button data-tab="news" class="on">News</button>
        <button data-tab="schedule">Schedule</button>
        <button data-tab="site">Site</button>
        <button data-tab="design">Design</button>
        <button data-tab="belt">Belt Test</button>
      </div>
      <div class="tab-body" id="tab-body"></div>
    </div>
  </div>
</div>

<div id="preview-modal">
  <div class="pv-head">
    <h2 id="pv-title">Preview</h2>
    <div class="row">
      <button class="btn btn-gold" id="pv-publish">Publish & Close</button>
      <button class="btn btn-ghost" id="pv-close">Close</button>
    </div>
  </div>
  <iframe id="preview-frame" title="Preview"></iframe>
</div>

<script>
(function(){
  var TOKEN = localStorage.getItem('ima-admin-token') || '';
  var currentTab = 'news';
  var docState = {};
  var pendingAttachments = [];   // [{id,name,type}]
  var beltConfig = null;
  var claudeConnected = false;

  function api(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
    if (TOKEN) opts.headers['x-admin-auth'] = TOKEN;
    return fetch(path, opts).then(function(r){
      if (r.status === 401) { showLogin(); throw new Error('Not signed in'); }
      return r.json().then(function(j){ if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; });
    });
  }

  function showLogin(){
    localStorage.removeItem('ima-admin-token'); TOKEN = '';
    document.getElementById('app').style.display = 'none';
    document.getElementById('login').style.display = 'grid';
  }
  function showApp(){
    document.getElementById('login').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
  }

  // ── login ──
  document.getElementById('login-form').addEventListener('submit', function(e){
    e.preventDefault();
    var pass = document.getElementById('login-pass').value;
    var err = document.getElementById('login-err');
    err.textContent = '';
    fetch('/admin/api/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({password:pass})})
      .then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); })
      .then(function(res){
        if (!res.ok) { err.textContent = res.j.error || 'Sign-in failed'; return; }
        TOKEN = res.j.token; localStorage.setItem('ima-admin-token', TOKEN);
        document.cookie = 'ima_admin_sess=' + TOKEN + '; path=/; max-age=604800; SameSite=Strict';
        showApp(); init();
      })
      .catch(function(){ err.textContent = 'Sign-in failed — try again'; });
  });
  document.getElementById('logout').addEventListener('click', function(){
    document.cookie = 'ima_admin_sess=; path=/; max-age=0; SameSite=Strict';
    api('/admin/api/logout', {method:'POST'}).catch(function(){}).then(showLogin);
  });

  // ── chat ──
  var chatHistory = [];  // [{role, content}]
  var chatLog = document.getElementById('chat-log');
  function addMsg(role, content, isHtml){
    var div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : role === 'sys' ? 'sys' : 'bot');
    if (isHtml) div.innerHTML = content; else div.textContent = content;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
    return div;
  }

  document.getElementById('send-btn').addEventListener('click', sendChat);
  document.getElementById('chat-text').addEventListener('keydown', function(e){
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendChat(); }
  });

  function sendChat(){
    var ta = document.getElementById('chat-text');
    var text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    chatHistory.push({role:'user', content:text});
    var userDiv = addMsg('user', text);
    if (pendingAttachments.length){
      var wrap = document.createElement('div'); wrap.className = 'att';
      pendingAttachments.forEach(function(a){
        if (/^image\\//.test(a.type)) {
          var im = document.createElement('img'); im.src = '/admin/api/attachment/' + a.id; im.alt = a.name; wrap.appendChild(im);
        } else {
          var s = document.createElement('span'); s.className='chip'; s.textContent = '📄 ' + a.name; wrap.appendChild(s);
        }
      });
      userDiv.appendChild(wrap);
    }
    var attIds = pendingAttachments.map(function(a){ return a.id; });
    pendingAttachments = []; renderAttStrip();

    if (!claudeConnected) { addMsg('sys', 'Claude is not connected yet — the site owner needs to add an Anthropic API key (ANTHROPIC_API_KEY) to the Worker.'); }
    var btn = document.getElementById('send-btn'); btn.disabled = true; btn.textContent = 'Thinking…';
    api('/admin/api/chat', {method:'POST', body: JSON.stringify({messages: chatHistory, attachments: attIds})})
      .then(function(j){
        chatHistory.push({role:'assistant', content:j.reply});
        addMsg('assistant', j.reply);
        (j.toolEvents || []).forEach(function(ev){
          if (ev.type === 'draft_saved') {
            addMsg('sys', '✎ Draft saved for “' + ev.key + '”' + (ev.note ? ' — ' + ev.note : '') + '. Preview it in the panel on the right, then press Publish.');
            loadDoc(ev.key);
          }
        });
      })
      .catch(function(e){ addMsg('sys', 'Error: ' + e.message); chatHistory.pop(); })
      .then(function(){ btn.disabled = false; btn.textContent = 'Send'; });
  }

  // ── attachments ──
  document.getElementById('attach-btn').addEventListener('click', function(){ document.getElementById('file-input').click(); });
  document.getElementById('file-input').addEventListener('change', function(e){
    var files = Array.prototype.slice.call(e.target.files);
    e.target.value = '';
    files.forEach(function(f){
      var reader = new FileReader();
      reader.onload = function(){
        api('/admin/api/upload', {method:'POST', body: JSON.stringify({name:f.name, type:f.type, dataUrl:reader.result})})
          .then(function(j){ pendingAttachments.push({id:j.id, name:j.name, type:j.type}); renderAttStrip(); })
          .catch(function(err){ addMsg('sys', 'Upload failed: ' + err.message); });
      };
      reader.readAsDataURL(f);
    });
  });
  function renderAttStrip(){
    var strip = document.getElementById('att-strip');
    strip.innerHTML = '';
    if (!pendingAttachments.length) { strip.style.display = 'none'; return; }
    strip.style.display = 'flex';
    pendingAttachments.forEach(function(a, i){
      var d = document.createElement('div'); d.className = 'att-item';
      if (/^image\\//.test(a.type)) {
        var im = document.createElement('img'); im.src = '/admin/api/attachment/' + a.id; im.alt = a.name; d.appendChild(im);
        var use = document.createElement('button'); use.className = 'use'; use.textContent = 'Use on site';
        use.title = 'Publish this image as a site image and copy its URL';
        use.onclick = function(){
          use.disabled = true; use.textContent = 'Publishing…';
          api('/admin/api/asset/publish', {method:'POST', body: JSON.stringify({attachmentId: a.id})})
            .then(function(j){
              use.textContent = 'URL copied ✓';
              var url = location.origin + j.url;
              if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function(){});
              addMsg('sys', 'Image published for the site at ' + j.url + ' — you can reference this URL in content, or just ask Claude to use the attached image.');
            })
            .catch(function(e){ use.disabled = false; use.textContent = 'Use on site'; addMsg('sys', 'Publish failed: ' + e.message); });
        };
        d.appendChild(use);
      } else {
        var c = document.createElement('span'); c.className = 'chip'; c.textContent = '📄 ' + a.name; d.appendChild(c);
      }
      var x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.title = 'Remove';
      x.onclick = function(){ pendingAttachments.splice(i,1); renderAttStrip(); };
      d.appendChild(x);
      strip.appendChild(d);
    });
  }

  // ── panel: tabs ──
  document.querySelectorAll('.tabs button').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.tabs button').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      currentTab = b.dataset.tab;
      renderTab();
    });
  });

  var ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ENT[c]; }); }

  function renderTab(){
    var body = document.getElementById('tab-body');
    if (currentTab === 'belt') { renderBeltTab(); return; }
    var k = currentTab; // 'news' | 'schedule'
    var st = docState[k] || {};
    var hasDraft = !!st.draft;
    var label = docLabel(k);
    body.innerHTML =
      '<div class="doc-head"><h2>' + label + '</h2>' +
      '<span class="badge ' + (hasDraft ? 'draft' : 'published') + '">' + (hasDraft ? 'Draft ready' : 'Published') + '</span></div>' +
      '<div class="notice">Publishing makes a new saved revision — you can always restore an older version below.</div>' +
      '<div class="doc-actions">' +
      (k === 'design' ? '<select id="pv-path" class="pv-path">' + designPaths(st.draft || st.published).map(function(x){ return '<option>' + esc(x) + '</option>'; }).join('') + '</select>' : '') +
      '<button class="btn" id="btn-preview">Preview ' + (hasDraft ? 'Draft' : 'Live') + '</button>' +
      (hasDraft ? '<button class="btn btn-gold" id="btn-publish">Publish Draft</button><button class="btn btn-ghost" id="btn-discard">Discard Draft</button>' : '') +
      '</div>' +
      '<div class="rev-list"><h3>Revision History</h3>' +
      ((st.revisions || []).length
        ? st.revisions.map(function(r){
            return '<div class="rev-item"><span>' + new Date(r.publishedAt).toLocaleString() + ' · ' + esc(r.actor) + '</span>' +
              '<button data-rev="' + r.revId + '">Restore</button></div>';
          }).join('')
        : '<div class="rev-item"><span>No revisions yet — the current live version is the original.</span></div>') +
      '</div>' +
      (k === 'site' ? siteSummaryHtml(st.draft || st.published) : '') +
      (k === 'design' ? designSummaryHtml(st.draft || st.published) : '');

    document.getElementById('btn-preview').addEventListener('click', function(){
      var sel = document.getElementById('pv-path');
      openPreview(k, sel ? sel.value : '');
    });
    var pub = document.getElementById('btn-publish');
    if (pub) pub.addEventListener('click', function(){
      if (!confirm('Publish this draft to the live site?')) return;
      api('/admin/api/doc/' + k + '/publish', {method:'POST'}).then(function(){ loadDoc(k); addMsg('sys','✓ Published ' + label + ' — it is now live.'); }).catch(function(e){ alert(e.message); });
    });
    var dis = document.getElementById('btn-discard');
    if (dis) dis.addEventListener('click', function(){
      if (!confirm('Discard this draft?')) return;
      api('/admin/api/doc/' + k + '/discard', {method:'POST'}).then(function(){ loadDoc(k); }).catch(function(e){ alert(e.message); });
    });
    body.querySelectorAll('.rev-item button[data-rev]').forEach(function(b){
      b.addEventListener('click', function(){
        if (!confirm('Restore this revision as a new draft? (Nothing goes live until you publish.)')) return;
        api('/admin/api/doc/' + k + '/restore/' + b.dataset.rev, {method:'POST'})
          .then(function(){ loadDoc(k); addMsg('sys','✓ Restored revision — it is now a draft ready to preview.'); })
          .catch(function(e){ alert(e.message); });
      });
    });
  }

  function siteSummaryHtml(d){
    if (!d) return '';
    var socials = (d.socials || []).map(function(x){ return '<div class="rev-item"><span>' + esc(x.platform) + '</span><span class="help">' + esc(x.url) + '</span></div>'; }).join('');
    var a = d.announcement || {};
    return '<div class="rev-list"><h3>Social links</h3>' + (socials || '<div class="rev-item"><span>None</span></div>') + '</div>' +
      '<div class="rev-list"><h3>Announcement bar</h3><div class="rev-item"><span>' + (a.enabled ? esc(a.text) : 'Off') + '</span>' + (a.enabled && a.href ? '<span class="help">' + esc(a.href) + '</span>' : '') + '</div></div>';
  }
  function docLabel(k){
    return k === 'news' ? 'News & Events' : k === 'schedule' ? 'Class Schedule' : k === 'design' ? 'Design & Pages' : 'Site Settings';
  }
  function designPaths(d){
    var out = ['/'];
    ((d && d.edits) || []).forEach(function(e){ var p = String(e.path || ''); if (p && p.indexOf('*') < 0 && out.indexOf(p) < 0) out.push(p); });
    ((d && d.pages) || []).forEach(function(pg){ if (out.indexOf(pg.path) < 0) out.push(pg.path); });
    return out;
  }
  function designSummaryHtml(d){
    d = d || {};
    var edits = (d.edits || []).map(function(e){
      return '<div class="rev-item"><span>' + esc(e.note || 'Edit') + '</span><span class="help">' + esc(e.path === '*' ? 'every page' : e.path) + '</span></div>';
    }).join('');
    var pages = (d.pages || []).map(function(pg){
      return '<div class="rev-item"><span>' + esc(pg.title) + '</span><span class="help">' + esc(pg.path) + '</span></div>';
    }).join('');
    var css = (d.css || '').trim();
    return '<div class="help" style="margin-top:14px">Ask Claude for any change: colors, fonts, layout, wording on any page, new sections, menu links, or new pages.</div>' +
      '<div class="rev-list"><h3>Page edits</h3>' + (edits || '<div class="rev-item"><span>None yet</span></div>') + '</div>' +
      '<div class="rev-list"><h3>New pages</h3>' + (pages || '<div class="rev-item"><span>None yet</span></div>') + '</div>' +
      '<div class="rev-list"><h3>Custom styling</h3><div class="rev-item"><span>' + (css ? css.split('}').length - 1 + ' style rules' : 'None') + '</span></div></div>';
  }

  function openPreview(k, path){
    var modal = document.getElementById('preview-modal');
    document.getElementById('pv-title').textContent = 'Preview — ' + docLabel(k) + (path ? ' — ' + path : '');
    document.getElementById('pv-publish').style.display = (docState[k] && docState[k].draft) ? '' : 'none';
    document.getElementById('preview-frame').src = '/admin/api/preview/' + k + (path ? '?path=' + encodeURIComponent(path) : '');
    modal.classList.add('open');
    document.getElementById('pv-publish').onclick = function(){
      if (!confirm('Publish this draft to the live site?')) return;
      api('/admin/api/doc/' + k + '/publish', {method:'POST'})
        .then(function(){ modal.classList.remove('open'); loadDoc(k); addMsg('sys','✓ Published — it is now live.'); })
        .catch(function(e){ alert(e.message); });
    };
  }
  document.getElementById('pv-close').addEventListener('click', function(){ document.getElementById('preview-modal').classList.remove('open'); });

  // ── belt tab ──
  function renderBeltTab(){
    var body = document.getElementById('tab-body');
    var c = beltConfig || {};
    var f = function(v){ return v == null ? '' : v; };
    var dollars = function(cents){ return cents == null ? '' : (cents / 100); };
    body.innerHTML =
      '<div class="doc-head"><h2>Belt Test Settings</h2><span class="badge published">Live config</span></div>' +
      '<div class="notice">These settings drive the belt-testing pages and checkout — dates, fees, and location.</div>' +
      '<div class="cfg-grid">' +
      '<div class="field full"><label>Test date (YYYY-MM-DD)</label><input id="cf-testDate" value="' + esc(f(c.testDate)) + '" /></div>' +
      '<div class="field full"><label>Test date display</label><input id="cf-testDateDisplay" value="' + esc(f(c.testDateDisplay)) + '" /></div>' +
      '<div class="field"><label>Late-fee cutoff (YYYY-MM-DD)</label><input id="cf-lateFeeCutoff" value="' + esc(f(c.lateFeeCutoff)) + '" /><div class="help">After this date the late fee is added automatically.</div></div>' +
      '<div class="field"><label>Late fee ($)</label><input id="cf-lateFee" type="number" step="1" value="' + esc(dollars(c.lateFeeCents)) + '" /></div>' +
      '<div class="field"><label>Student manual add-on ($)</label><input id="cf-manual" type="number" step="1" value="' + esc(dollars(c.manualAddonCents)) + '" /></div>' +
      '<div class="field"><label>Credit-card surcharge (%)</label><input id="cf-cc" type="number" step="0.1" value="' + esc(f(c.ccSurchargePct)) + '" /></div>' +
      '<div class="field full"><label>Testing location</label><input id="cf-location" value="' + esc(f(c.location)) + '" /></div>' +
      '</div>' +
      '<div class="save-note" id="cf-note"></div>' +
      '<div class="doc-actions" style="margin-top:16px"><button class="btn btn-gold" id="cf-save">Save Settings</button></div>' +
      '';


    document.getElementById('cf-save').addEventListener('click', function(){
      var patch = {
        testDate: document.getElementById('cf-testDate').value.trim(),
        testDateDisplay: document.getElementById('cf-testDateDisplay').value.trim(),
        lateFeeCutoff: document.getElementById('cf-lateFeeCutoff').value.trim(),
        lateFeeCents: Math.round((Number(document.getElementById('cf-lateFee').value) || 0) * 100),
        manualAddonCents: Math.round((Number(document.getElementById('cf-manual').value) || 0) * 100),
        ccSurchargePct: Number(document.getElementById('cf-cc').value) || 0,
        location: document.getElementById('cf-location').value.trim(),
      };
      api('/admin/api/belt-config', {method:'PUT', body: JSON.stringify(patch)})
        .then(function(j){ beltConfig = j.config; document.getElementById('cf-note').textContent = '✓ Saved — live immediately.'; })
        .catch(function(e){ document.getElementById('cf-note').textContent = '✗ ' + e.message; });
    });
  }

  // ── data loading ──
  function loadDoc(k){
    return api('/admin/api/doc/' + k).then(function(j){
      docState[k] = j;
      if (currentTab === k) renderTab();
    });
  }
  function init(){
    document.cookie = 'ima_admin_sess=' + TOKEN + '; path=/; max-age=604800; SameSite=Strict';
    api('/admin/api/state').then(function(j){
      claudeConnected = j.claudeConnected;
      beltConfig = j.beltConfig;
      if (!claudeConnected) {
        addMsg('sys', 'Claude is not connected yet — the site owner needs to add an Anthropic API key (ANTHROPIC_API_KEY secret) to the Worker. You can still use the panels on the right.');
      } else {
        addMsg('bot', 'Hi! I can change anything on the website: news, the class schedule, wording on any page, colors and layout, menu links, or whole new pages. Try: “Make the home page headline bigger” or “Add a Summer Camp page to the menu.” Attach a photo and tell me where it should go. Every change is a draft you preview before it goes live.');
      }
      return Promise.all(['news','schedule','site','design'].map(loadDoc));
    }).then(function(){ renderTab(); }).catch(function(e){ addMsg('sys', 'Could not load admin state: ' + e.message); });
  }

  if (TOKEN) {
    api('/admin/api/state').then(function(){ showApp(); init(); }).catch(function(){ showLogin(); });
  }
})();
</script>
</body>
</html>`;
}

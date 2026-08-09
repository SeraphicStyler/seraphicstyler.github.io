/* Seraphic Styler — the page concierge (nav-voice.js)
   ----------------------------------------------------------------------
   The homepage is fifteen sections long. Finding "how much does it cost"
   in that means scrolling, and scrolling is exactly what some people
   cannot comfortably do — a tremor, a trackpad they can't drag, a phone
   held in one hand, a screen reader user who does not want to hear the
   whole page to reach the last part of it.

   So: say or type what you're after and the page takes you there. Not a
   search box that highlights matches — a destination. It scrolls, and
   then it MOVES FOCUS to the landing section, because a scroll alone
   leaves a keyboard or screen-reader user exactly where they were while
   the sighted view runs off without them.

   Everything is offered twice over. The microphone is optional and
   press-to-talk; typing does everything it does; and every destination is
   also a plain tappable chip, so the whole feature works with no speech,
   no typing, and one tap. That chip list is the quiet accessibility win —
   a table of contents you can reach from anywhere on the page.

   Deterministic and local: sections and their headings are read from the
   DOM at load, so this works on any long page without being told what is
   on it, and there is no index to fall out of date. Matching folds the
   tone marks off both sides, so Vietnamese and a US keyboard both reach
   the same section.

   Exposes window.SS_NAVVOICE = { open, go }.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_NAVVOICE) return;

  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
  }
  function isVI() { return document.documentElement.getAttribute('lang') === 'vi'; }
  function t(k, en) { return window.SS_T ? window.SS_T(k, en) : en; }

  /* ---------- read the page ---------- */
  /* Synonyms are the whole trick: a client asks "how much", not "details".
     Keyed by section id, so a page without that id simply skips it. */
  var HINTS = {
    hero:      'start top beginning home',
    about:     'who you are stylist sandria personal background story',
    why:       'why bother difference product link value reason',
    services:  'service styling sourcing work with you options lanes packages',
    sizing:    'size sizes fit measurements small true to size chart',
    process:   'how it works steps process order flow what happens',
    estimate:  'estimate cost calculator how much price quote budget total',
    lookbook:  'lookbook photos gallery examples work portfolio looks',
    directory: 'directory brands houses shops boutiques 300 list where to shop',
    trust:     'trust safe scam legit reviews guarantee refund confidence',
    gift:      'gift present giftcard giving someone birthday',
    bulk:      'bulk group order many people together parcel wholesale',
    conscious: 'sustainable ethical conscious natural fibre vegan kinder environment',
    details:   'price pricing cost fees shipping policy policies terms payment refund how much',
    journey:   'journey timeline dream to wardrobe stages',
    contact:   'contact book message dm email inquiry get started talk reach begin'
  };
  var SECTIONS = [];
  function readPage() {
    SECTIONS = [];
    var seen = {};
    document.querySelectorAll('section[id], main [id][aria-labelledby], article[id]').forEach(function (el) {
      var id = el.id;
      if (!id || seen[id]) return;
      var h = el.querySelector('h1, h2');
      if (!h && !HINTS[id]) return;                    /* not a real landmark */
      var title = (h ? h.textContent : id).replace(/\s+/g, ' ').trim();
      if (!title) return;
      seen[id] = true;
      /* a little of the section's own prose, so "is it a scam" can reach a
         section whose heading never uses that word */
      var body = (el.textContent || '').replace(/\s+/g, ' ').slice(0, 700);
      SECTIONS.push({
        id: id, el: el, title: title,
        key: norm(title + ' ' + id + ' ' + (HINTS[id] || '') + ' ' + body)
      });
    });
  }

  /* ---------- match ---------- */
  /* "what size am i" must not be decided by the word "what". Question words and
     filler carry no destination, and left in they let any long section win on
     body text alone. */
  var STOP = (' what which where when how does did the this that they them there ' +
    'you your yours i im me my mine we our can could would should will want need ' +
    'show tell take give find get got have has had are was were and but for with ' +
    'from about into onto some any all please just like about more most much ' +
    'toi minh cua la co the nao gi ').split(/\s+/);
  function meaningful(w) { return w.length > 2 && STOP.indexOf(w) < 0; }
  function score(sec, q) {
    var terms = q.split(' ').filter(meaningful);
    if (!terms.length) return 0;
    var titleKey = norm(sec.title), idKey = norm(sec.id);
    var hintKey = ' ' + norm(HINTS[sec.id] || '') + ' ';
    var s = 0;
    terms.forEach(function (w) {
      if (idKey === w) s += 14;
      if (titleKey.indexOf(w) >= 0) s += 9;
      /* the curated synonyms are the phrasing a client actually uses, so they
         outrank a chance mention buried in another section's prose */
      if (hintKey.indexOf(' ' + w) >= 0) s += 10;
      else if (sec.key.indexOf(w) >= 0) s += 1;
    });
    return s;
  }
  function best(query) {
    var q = norm(query);
    if (!q) return [];
    return SECTIONS.map(function (s) { return { s: s, n: score(s, q) }; })
      .filter(function (r) { return r.n > 0; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 3);
  }

  /* ---------- go ----------
     Scroll AND move focus. Without the focus move a screen-reader or
     keyboard user is left behind at the old position while the visual
     viewport travels — the single most common bug in "jump to section". */
  function go(sec) {
    if (!sec || !sec.el) return;
    var el = sec.el;
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
    catch (e) { el.scrollIntoView(); }
    setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (e2) { el.focus(); } }, RM ? 0 : 420);
    try { history.replaceState(null, '', '#' + sec.id); } catch (e3) {}
    announce(fmt(t('nv.landed', 'Moved to {x}'), sec.title));
  }
  function fmt(s, x) { return String(s).replace('{x}', x); }

  /* ---------- styles ---------- */
  var css =
    '.nv-fab{position:fixed;left:1.1rem;bottom:1.1rem;z-index:60;display:inline-flex;align-items:center;gap:.5em;' +
      'height:48px;padding:0 1rem 0 .8rem;border-radius:999px;border:1px solid var(--surface-border,rgba(46,71,115,.16));' +
      'background:#fff;color:var(--accent-deep,#233a72);cursor:pointer;font:inherit;font-size:.82rem;font-weight:600;' +
      'box-shadow:0 12px 30px -18px rgba(35,58,114,.6);}' +
    '.nv-fab:hover{box-shadow:0 16px 36px -16px rgba(35,58,114,.55);}' +
    '.nv-fab:focus-visible{outline:2px solid var(--accent,#2e54ad);outline-offset:2px;}' +
    '.nv-fab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;}' +
    '@media(max-width:720px){.nv-fab{bottom:.8rem;left:.8rem;height:44px;font-size:.78rem;}}' +
    '.nv-panel{position:fixed;left:1.1rem;bottom:4.9rem;z-index:61;width:min(380px,calc(100vw - 2.2rem));' +
      'max-height:min(560px,72vh);display:flex;flex-direction:column;border-radius:18px;overflow:hidden;background:#fff;' +
      'border:1px solid var(--surface-border,rgba(46,71,115,.16));box-shadow:0 26px 60px -30px rgba(35,58,114,.6);' +
      (RM ? '' : 'transition:opacity .2s ease,transform .2s ease;') + '}' +
    '.nv-panel[hidden]{display:none;}' +
    '.nv-panel.off{opacity:0;transform:translateY(8px) scale(.985);pointer-events:none;}' +
    '@media(max-width:720px){.nv-panel{left:.6rem;right:.6rem;width:auto;bottom:4.2rem;max-height:68vh;}}' +
    '.nv-head{display:flex;align-items:center;gap:.55rem;padding:.85rem .95rem;border-bottom:1px solid rgba(46,71,115,.1);}' +
    '.nv-head b{font-size:.95rem;color:var(--accent-deep,#233a72);font-weight:600;}' +
    '.nv-head .s{font-size:.7rem;color:#51618f;}' +
    '.nv-x{all:unset;margin-left:auto;cursor:pointer;width:30px;height:30px;display:grid;place-items:center;border-radius:9px;color:#51618f;}' +
    '.nv-x:hover{background:rgba(46,71,115,.07);}.nv-x:focus-visible{outline:2px solid var(--accent,#2e54ad);}' +
    '.nv-body{flex:1;overflow-y:auto;padding:.8rem .95rem;}' +
    '.nv-lbl{font-size:.64rem;text-transform:uppercase;letter-spacing:.08em;color:#8b97b8;margin:.2rem 0 .45rem;}' +
    '.nv-list{display:grid;gap:.3rem;margin:0 0 .3rem;padding:0;list-style:none;}' +
    '.nv-go{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:.55rem;width:100%;' +
      'padding:.5rem .6rem;border-radius:10px;font-size:.83rem;color:#233a72;}' +
    '.nv-go:hover,.nv-go:focus-visible{background:rgba(46,84,173,.09);}' +
    '.nv-go:focus-visible{outline:2px solid var(--accent,#2e54ad);outline-offset:-2px;}' +
    '.nv-go .n{width:1.35rem;height:1.35rem;flex:none;border-radius:50%;display:grid;place-items:center;' +
      'background:rgba(46,84,173,.1);color:#2e54ad;font-size:.62rem;font-weight:700;}' +
    '.nv-msg{font-size:.8rem;line-height:1.55;color:#233a72;background:rgba(46,71,115,.06);border-radius:11px;padding:.5rem .7rem;margin:0 0 .5rem;}' +
    '.nv-foot{border-top:1px solid rgba(46,71,115,.1);padding:.7rem .8rem;display:flex;gap:.5rem;align-items:center;}' +
    '.nv-mic{flex:none;width:42px;height:42px;border-radius:50%;border:1px solid var(--surface-border,rgba(46,71,115,.16));' +
      'background:#fff;color:var(--accent,#2e54ad);cursor:pointer;display:grid;place-items:center;position:relative;}' +
    '.nv-mic.on{background:var(--accent,#2e54ad);color:#fff;}' +
    '.nv-mic:focus-visible{outline:2px solid var(--accent,#2e54ad);outline-offset:2px;}' +
    '.nv-mic svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;}' +
    '.nv-mic.on::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--accent,#2e54ad);' +
      (RM ? 'display:none;' : 'animation:nvp 1.5s ease-out infinite;') + '}' +
    '@keyframes nvp{from{opacity:.75;transform:scale(1);}to{opacity:0;transform:scale(1.6);}}' +
    '.nv-in{flex:1;min-width:0;font:inherit;font-size:.83rem;border:1px solid var(--surface-border,rgba(46,71,115,.16));' +
      'border-radius:999px;padding:.55rem .85rem;color:#233a72;background:#fff;}' +
    '.nv-in:focus{outline:2px solid var(--accent,#2e54ad);outline-offset:-1px;}' +
    '.nv-hint{font-size:.64rem;color:#8b97b8;padding:0 .95rem .7rem;line-height:1.5;}' +
    '.nv-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}' +
    '[data-theme="dark"] .nv-panel,[data-theme="dark"] .nv-fab{background:#1b2030;color:#e8ecf7;}' +
    '[data-theme="dark"] .nv-go{color:#e8ecf7;}' +
    '[data-theme="dark"] .nv-in{background:#1b2030;color:#e8ecf7;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- DOM ---------- */
  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>';
  var fab = document.createElement('button');
  fab.className = 'nv-fab';
  fab.type = 'button';
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = MIC + '<span>' + esc(t('nv.fab', 'Take me to…')) + '</span>';
  fab.setAttribute('aria-label', t('nv.fabA', 'Jump to a section of this page'));

  var panel = document.createElement('div');
  panel.className = 'nv-panel off';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', t('nv.title', 'Jump to a section'));

  var body, input, micBtn, live;
  function build() {
    panel.innerHTML =
      '<div class="nv-head"><div><b>' + esc(t('nv.title', 'Jump to a section')) + '</b>' +
        '<div class="s">' + esc(t('nv.sub', 'Say it, type it, or tap one — no scrolling')) + '</div></div>' +
        '<button class="nv-x" type="button" aria-label="' + esc(t('nv.close', 'Close')) + '">✕</button></div>' +
      '<div class="nv-body"></div>' +
      '<div class="nv-sr" role="status" aria-live="polite"></div>' +
      '<div class="nv-foot">' +
        '<button class="nv-mic" type="button" aria-pressed="false" aria-label="' + esc(t('nv.talk', 'Press to talk')) + '">' + MIC + '</button>' +
        '<input class="nv-in" type="text" autocomplete="off" placeholder="' + esc(t('nv.ph', 'e.g. how much does it cost')) + '" aria-label="' + esc(t('nv.ph', 'e.g. how much does it cost')) + '">' +
      '</div>' +
      '<div class="nv-hint">' + esc(t('nv.kbd', 'Esc closes · every destination below is also a link')) + '</div>';
    body = panel.querySelector('.nv-body');
    input = panel.querySelector('.nv-in');
    micBtn = panel.querySelector('.nv-mic');
    live = panel.querySelector('.nv-sr');
    panel.querySelector('.nv-x').addEventListener('click', close);
    micBtn.addEventListener('click', toggleListen);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && input.value.trim()) { ask(input.value.trim()); input.value = ''; }
    });
    listAll();
  }
  function announce(msg) { if (live) live.textContent = msg; }

  function renderList(secs, label) {
    body.innerHTML = '';
    if (label) { var l = document.createElement('p'); l.className = 'nv-lbl'; l.textContent = label; body.appendChild(l); }
    var ul = document.createElement('ul');
    ul.className = 'nv-list';
    secs.forEach(function (s, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nv-go';
      b.innerHTML = '<span class="n">' + (i + 1) + '</span><span></span>';
      b.lastChild.textContent = s.title;
      b.addEventListener('click', function () { go(s); close(); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    body.appendChild(ul);
  }
  function listAll() { renderList(SECTIONS, t('nv.all', 'Everything on this page')); }

  function ask(q) {
    var hits = best(q);
    if (!hits.length) {
      body.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'nv-msg';
      p.textContent = t('nv.none', 'I could not find that on this page. Here is everything on it:');
      body.appendChild(p);
      var ul = document.createElement('div'); body.appendChild(ul);
      renderListInto(ul, SECTIONS);
      announce(p.textContent);
      return;
    }
    if (hits.length === 1 || hits[0].n >= hits[1].n * 2) { go(hits[0].s); close(); return; }
    renderList(hits.map(function (h) { return h.s; }), t('nv.did', 'Which one did you mean?'));
    announce(t('nv.did', 'Which one did you mean?'));
  }
  function renderListInto(host, secs) {
    var ul = document.createElement('ul');
    ul.className = 'nv-list';
    secs.forEach(function (s, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'nv-go';
      b.innerHTML = '<span class="n">' + (i + 1) + '</span><span></span>';
      b.lastChild.textContent = s.title;
      b.addEventListener('click', function () { go(s); close(); });
      li.appendChild(b); ul.appendChild(li);
    });
    host.appendChild(ul);
  }

  /* ---------- speech (optional, press-to-talk) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, listening = false;
  function toggleListen() {
    if (!SR) { announce(t('nv.nosr', 'Speech is not available in this browser — typing works the same.')); input.focus(); return; }
    if (listening) { stopListen(); return; }
    rec = new SR();
    rec.lang = isVI() ? 'vi-VN' : 'en-US';
    rec.interimResults = true;
    var finalText = '';
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      input.value = (finalText + ' ' + interim).trim();   /* mirrored as text, always */
    };
    rec.onerror = function () { stopListen(); };
    rec.onend = function () {
      stopListen();
      var v = (finalText || input.value || '').trim();
      if (v) { input.value = ''; ask(v); }
    };
    listening = true;
    micBtn.classList.add('on');
    micBtn.setAttribute('aria-pressed', 'true');
    announce(t('nv.listening', 'Listening'));
    try { rec.start(); } catch (e) { stopListen(); }
  }
  function stopListen() {
    listening = false;
    if (micBtn) { micBtn.classList.remove('on'); micBtn.setAttribute('aria-pressed', 'false'); }
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
  }

  /* ---------- open / close ---------- */
  var isOpen = false, hideT = null;
  function open() {
    if (isOpen) { input.focus(); return; }
    isOpen = true;
    clearTimeout(hideT);
    readPage();
    build();
    panel.hidden = false;
    requestAnimationFrame(function () { if (isOpen) panel.classList.remove('off'); });
    fab.setAttribute('aria-expanded', 'true');
    input.focus();
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    stopListen();
    panel.classList.add('off');
    hideT = setTimeout(function () { if (!isOpen) panel.hidden = true; }, RM ? 0 : 220);
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }
  fab.addEventListener('click', function () { isOpen ? close() : open(); });
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (listening) { stopListen(); return; } if (isOpen) close(); return; }
    if (e.code === 'Space' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (e.shiftKey) { if (!isOpen) open(); toggleListen(); }
      else if (!isOpen) open(); else input.focus();
    }
  });

  function boot() {
    readPage();
    if (SECTIONS.length < 4) return; /* short page — a jump menu would be noise */
    document.body.appendChild(fab);
    document.body.appendChild(panel);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.SS_NAVVOICE = { open: open, go: function (id) { readPage(); var s = SECTIONS.filter(function (x) { return x.id === id; })[0]; if (s) go(s); } };
})();

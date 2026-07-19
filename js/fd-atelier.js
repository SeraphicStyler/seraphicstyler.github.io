/* Seraphic Styler — directory atelier layer (fd-atelier.js)
   ----------------------------------------------------------------------
   Adds on top of fashion-directory.html, without touching its renderer:
   1) PREVIEW  — hover / touch / keyboard image popup per card (brand logo
      today, b.img product shot whenever one is added to the data).
   2) MOODS    — a chip bar (Coquette, Minimal Workwear, Local Luxury,
      Sporty, Evening, Tailored) filtering via derived styleTags.
   3) BOARDS   — named boards ("Workwear", "Wedding Guest"…), add-to-board
      per card, #board=<id> view.
   4) NOTES    — per-brand private notes with a dot indicator.
   5) BUILD    — #build "Build a Look": occasion + district + tier → a
      3–5 store capsule, one store per complementary category.
   6) EXPORT   — download / restore all ss- and fd- browser data as JSON.

   Everything persists to localStorage behind try/catch and degrades to
   in-memory state if storage is blocked. Self-injecting: own <style>, own
   DOM, themed off the page's CSS variables. Cards are identified through
   the data-id their save button already carries, and re-decorated after
   every render() by wrapping the page's global render.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_ATELIER) return;

  var D = window.SS_DIRECTORY || [];
  if (!D.length || !document.getElementById('savedbtn')) return;

  /* ---------- tiny utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(k, en) { return window.SS_T ? window.SS_T(k, en) : en; }
  function bid(b) { return b.h || b.n; }
  function uid() { return 'bd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH = matchMedia('(hover: none)').matches;

  /* storage: in-memory first, localStorage as enhancement */
  var mem = {};
  function lsGet(k) { try { var v = localStorage.getItem(k); if (v != null) return v; } catch (e) {} return (k in mem) ? mem[k] : null; }
  function lsSet(k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} }

  /* id → brand (first door wins, same rule the page uses) */
  var byId = {};
  D.forEach(function (b) { var k = bid(b); if (!(k in byId)) byId[k] = b; });

  /* ---------- 0. enrichment: styleTags + cluster ---------- */
  function tagsOf(b) {
    if (b.__tags) return b.__tags;
    var s = ((b.no || '') + ' ' + (b.n || '')).toLowerCase(), tg = [];
    var has = function (re) { return re.test(s); };
    if (has(/minimal|timeless|slow fashion|essential|clean|quiet|understated|basic|workwear/)) tg.push('minimal');
    if (has(/romantic|feminine|coquette|soft|lace|floral|flower|delicate|bow|ribbon|dreamy|sweet|lingerie/) || b.cat === 'sleep') tg.push('romantic');
    if (has(/street|playful|urban|edgy|grunge|y2k|bold|graphic|hype|vintage|retro|thrift|second.?hand/)) tg.push('street');
    if (has(/elegant|luxur|refined|glamour|sophisticat/) || b.cat === 'luxury' || b.tier === 'luxury' || b.tier === 'couture') tg.push('elegant');
    if (has(/evening|gown|bridal|occasion|red.carpet|couture/)) tg.push('evening');
    if (has(/áo dài|ao dai|tailor|bespoke|made.to.measure|embroider|heritage|craft/) || b.cat === 'tailor') tg.push('heritage');
    if (b.cat === 'active' || has(/active|sport|swim|athleisure|yoga|gym/)) tg.push('sporty');
    if (!tg.length) tg.push('contemporary');
    b.__tags = tg; return tg;
  }
  var CLUSTERS = (function () {           /* streets holding ≥3 houses */
    var m = {};
    D.forEach(function (b) { var a = b.a || ''; var mm = a.match(/(?:^|[\s,])(?:\d[\w/]*\s)?([A-ZĐÀ-ỹ][\wÀ-ỹ]+(?:\s[A-ZĐÀ-ỹ][\wÀ-ỹ]+){1,3})/); if (mm) { m[mm[1]] = (m[mm[1]] || 0) + 1; } });
    return m;
  })();
  function clusterOf(b) {
    for (var s in CLUSTERS) { if (CLUSTERS[s] >= 3 && (b.a || '').indexOf(s) > -1) return s; }
    return b.area || '';
  }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent =
    '#previewPopup{position:fixed;z-index:340;width:180px;aspect-ratio:4/3;border-radius:8px;background:#111;box-shadow:0 18px 40px rgba(0,0,0,.14);overflow:hidden;pointer-events:none;opacity:0;transform:translateY(6px) scale(.97);' + (RM ? '' : 'transition:opacity .18s ease,transform .18s ease;') + '}' +
    '#previewPopup.on{opacity:1;transform:none}' +
    '#previewPopup img{width:100%;height:100%;object-fit:cover;display:block}' +
    '#previewPopup .ph{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:.3rem;width:100%;height:100%;color:#dfe4f2;font-family:var(--font-accent,sans-serif);padding:.6rem;text-align:center}' +
    '#previewPopup .ph b{font-size:.85rem;font-weight:600}' + '#previewPopup .ph i{font-style:normal;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;opacity:.7}' +
    (RM ? '' : '.card.is-dimmed{opacity:.45;transition:opacity .18s ease}') +
    '.at-mini{background:none;border:0;cursor:pointer;font:inherit;font-size:.72rem;color:var(--ink-mute,#777);padding:.2rem .3rem;min-height:auto;position:relative}' +
    '.at-mini:hover{color:var(--ink,#222)}' +
    '.at-mini .dot{position:absolute;top:.05rem;right:-.05rem;width:6px;height:6px;border-radius:99px;background:var(--lav,#8a76c9)}' +
    '@media(hover:hover){.at-pv{display:none}}' +
    '.at-chipbar{display:flex;gap:.45rem;overflow-x:auto;padding:.2rem .1rem .55rem;-webkit-overflow-scrolling:touch;scrollbar-width:none}' +
    '.at-chipbar::-webkit-scrollbar{display:none}' +
    '.at-chip{flex:none;font:inherit;font-size:.78rem;padding:.34rem .8rem;min-height:44px;min-width:44px;border-radius:999px;border:1px solid var(--line,rgba(120,120,140,.35));background:transparent;color:var(--ink-soft,#555);cursor:pointer}' +
    '.at-chip[aria-pressed="true"]{background:var(--ink,#233a72);color:var(--paper,#fff);border-color:var(--ink,#233a72)}' +
    '.at-note{position:fixed;z-index:350;inset:auto 0 0 0;margin:0 auto;max-width:480px;background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:14px 14px 0 0;padding:1rem;box-shadow:0 -14px 40px rgba(0,0,0,.18)}' +
    '.at-note textarea{width:100%;min-height:96px;font:inherit;font-size:.9rem;border:1px solid var(--line,#ccc);border-radius:8px;padding:.6rem;background:var(--paper,#fff);color:var(--ink,#222)}' +
    '.at-note .row{display:flex;justify-content:space-between;gap:.6rem;margin-top:.6rem}' +
    '.at-panel{position:fixed;z-index:350;inset:auto 0 0 0;margin:0 auto;max-width:560px;max-height:82vh;overflow:auto;background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:16px 16px 0 0;padding:1.1rem;box-shadow:0 -16px 44px rgba(0,0,0,.2)}' +
    '@media(min-width:900px){.at-panel,.at-note{inset:auto 1.2rem 1.2rem auto;border-radius:16px;width:420px}}' +
    '.at-panel h3{margin:.1rem 0 .6rem;font-size:1.05rem}' +
    '.at-panel .brow{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.5rem 0;border-bottom:1px solid var(--line,#eee)}' +
    '.at-panel .brow b{font-weight:600;font-size:.92rem}' +
    '.at-panel .brow small{color:var(--ink-mute,#777)}' +
    '.at-btn{font:inherit;font-size:.82rem;border:1px solid var(--line,#ccc);background:transparent;color:var(--ink,#222);border-radius:999px;padding:.4rem .85rem;min-height:44px;cursor:pointer}' +
    '.at-btn.pri{background:var(--ink,#233a72);color:var(--paper,#fff);border-color:var(--ink,#233a72)}' +
    '.at-x{position:absolute;top:.5rem;right:.7rem;font-size:1.1rem;background:none;border:0;cursor:pointer;color:var(--ink-mute,#777);min-width:44px;min-height:44px}' +
    '.at-field{width:100%;font:inherit;font-size:.9rem;border:1px solid var(--line,#ccc);border-radius:8px;padding:.55rem;background:var(--paper,#fff);color:var(--ink,#222);margin:.25rem 0}' +
    '.at-cap{border:1px solid var(--line,#eee);border-radius:12px;padding:.7rem .8rem;margin:.5rem 0}' +
    '.at-cap .cat{font-size:.64rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-mute,#888)}' +
    '.at-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';
  document.head.appendChild(css);

  /* ---------- 1. preview popup ---------- */
  var pop = document.createElement('div');
  pop.id = 'previewPopup'; pop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pop);
  var preloaded = {}, hoverTimer = null, curCard = null;

  function imgOf(b, card) {
    if (b && b.img) return b.img;
    var logo = card && card.querySelector('.blogo');
    return logo ? logo.getAttribute('src') : null;
  }
  function fillPop(b, card) {
    var src = imgOf(b, card);
    if (src) {
      if (!preloaded[src]) { var im = new Image(); im.src = src; preloaded[src] = 1; }
      pop.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(b.n) + '" width="180" height="135">';
    } else {
      pop.innerHTML = '<div class="ph"><b>' + esc(b.n) + '</b><i>' + esc(tagsOf(b).join(' · ')) + '</i></div>';
    }
  }
  function showPop(card, x, y) {
    var id = idOf(card), b = byId[id]; if (!b) return;
    fillPop(b, card);
    pop.classList.add('on'); pop.setAttribute('aria-hidden', 'false');
    movePop(x, y);
    if (!RM && !TOUCH) {
      curCard = card;
      Array.prototype.forEach.call(card.parentElement.children, function (s) { if (s !== card && s.classList) s.classList.toggle('is-dimmed', s.classList.contains('card')); });
    }
  }
  function movePop(x, y) {
    var w = 180, h = 135, pad = 14;
    var px = Math.min(x + 18, innerWidth - w - pad), py = Math.min(y + 18, innerHeight - h - pad);
    pop.style.left = Math.max(pad, px) + 'px'; pop.style.top = Math.max(pad, py) + 'px';
  }
  function hidePop() {
    pop.classList.remove('on'); pop.setAttribute('aria-hidden', 'true');
    if (curCard) { Array.prototype.forEach.call(curCard.parentElement.children, function (s) { s.classList && s.classList.remove('is-dimmed'); }); curCard = null; }
  }
  function idOf(card) { var sv = card.querySelector('.sv[data-id]'); return sv ? sv.getAttribute('data-id') : null; }

  document.addEventListener('mouseover', function (e) {
    if (TOUCH) return;
    var card = e.target.closest && e.target.closest('.card');
    if (!card || !idOf(card)) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { showPop(card, e.clientX, e.clientY); }, 100);
  });
  document.addEventListener('mousemove', function (e) {
    if (pop.classList.contains('on') && !TOUCH) movePop(e.clientX, e.clientY);
  });
  document.addEventListener('mouseout', function (e) {
    if (TOUCH) return;
    var card = e.target.closest && e.target.closest('.card');
    if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) { clearTimeout(hoverTimer); hidePop(); }
  });
  document.addEventListener('focusin', function (e) {
    var card = e.target.classList && e.target.classList.contains('card') ? e.target : null;
    if (!card) { return; }
    var r = card.getBoundingClientRect();
    showPop(card, Math.min(r.right + 6, innerWidth - 200), r.top);
  });
  document.addEventListener('focusout', function (e) {
    if (e.target.classList && e.target.classList.contains('card')) hidePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hidePop(); closeSheet(); } });
  addEventListener('scroll', hidePop, { passive: true });

  /* ---------- 2. mood chips ---------- */
  var MOODS = [
    ['all', 'All', null],
    ['coquette', 'Coquette', ['romantic']],
    ['minwork', 'Minimal Workwear', ['minimal']],
    ['locallux', 'Local Luxury', ['elegant']],
    ['sporty', 'Sporty', ['sporty']],
    ['evening', 'Evening', ['evening']],
    ['tailored', 'Tailored', ['heritage']]
  ];
  var mood = 'all', grid = null, live = null;

  function applyMood() {
    if (!grid) return;
    var def = MOODS.find(function (m) { return m[0] === mood; }), tags = def && def[2];
    var shown = 0, total = 0;
    Array.prototype.forEach.call(grid.querySelectorAll('.card'), function (card) {
      var b = byId[idOf(card)]; if (!b) return;
      total++;
      var ok = !tags || tagsOf(b).some(function (tg) { return tags.indexOf(tg) > -1; });
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    if (live) live.textContent = (tags ? shown + ' of ' + total + ' houses match "' + def[1] + '"' : total + ' houses');
    document.querySelectorAll('.at-chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.mood === mood)); });
  }
  function buildChipbar() {
    var firstCard = document.querySelector('.card');
    grid = firstCard && firstCard.parentElement;
    if (!grid || document.querySelector('.at-chipbar')) return;
    var bar = document.createElement('div');
    bar.className = 'at-chipbar';
    bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Mood filter');
    bar.innerHTML = MOODS.map(function (m) { return '<button class="at-chip" type="button" data-mood="' + m[0] + '" aria-pressed="' + String(m[0] === mood) + '">' + esc(m[1]) + '</button>'; }).join('');
    live = document.createElement('span'); live.className = 'at-live'; live.setAttribute('aria-live', 'polite');
    bar.appendChild(live);
    grid.parentElement.insertBefore(bar, grid);
    bar.addEventListener('click', function (e) {
      var c = e.target.closest('.at-chip'); if (!c) return;
      mood = c.dataset.mood; applyMood();
    });
  }

  /* ---------- 3+4. boards & notes ---------- */
  function boards() { try { return JSON.parse(lsGet('ss-boards') || '[]'); } catch (e) { return []; } }
  function saveBoards(a) { lsSet('ss-boards', JSON.stringify(a)); }
  function noteOf(id) { return lsGet('ss-note-' + id) || ''; }

  var sheet = null;
  function closeSheet() { if (sheet) { sheet.remove(); sheet = null; } }
  function openSheet(html) {
    closeSheet();
    sheet = document.createElement('div');
    sheet.className = 'at-panel'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'false');
    sheet.innerHTML = '<button class="at-x" aria-label="Close">✕</button>' + html;
    document.body.appendChild(sheet);
    sheet.querySelector('.at-x').addEventListener('click', closeSheet);
    return sheet;
  }

  function openNote(id) {
    var b = byId[id]; if (!b) return;
    var s = openSheet('<h3>' + esc(b.n) + ' — note</h3>' +
      '<textarea class="at-field" id="atNoteTa" placeholder="Sizes tried, pieces spotted, what to ask for…">' + esc(noteOf(id)) + '</textarea>' +
      '<div class="row" style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:.5rem">' +
      '<button class="at-btn" id="atNoteDel">Delete</button><button class="at-btn pri" id="atNoteSave">Save note</button></div>');
    s.querySelector('#atNoteSave').addEventListener('click', function () { var v = s.querySelector('#atNoteTa').value.trim(); if (v) lsSet('ss-note-' + id, v); else lsDel('ss-note-' + id); closeSheet(); decorate(); });
    s.querySelector('#atNoteDel').addEventListener('click', function () { lsDel('ss-note-' + id); closeSheet(); decorate(); });
    s.querySelector('#atNoteTa').focus();
  }

  function openBoardPicker(id) {
    var b = byId[id]; if (!b) return;
    var list = boards();
    var rows = list.map(function (bd) {
      var inb = bd.brandIds.indexOf(id) > -1;
      return '<div class="brow"><b>' + esc(bd.name) + '</b><small>' + bd.brandIds.length + '</small>' +
        '<button class="at-btn' + (inb ? '' : ' pri') + '" data-bd="' + bd.id + '">' + (inb ? 'Remove' : 'Add') + '</button></div>';
    }).join('') || '<p style="color:var(--ink-mute)">No boards yet — create your first below.</p>';
    var s = openSheet('<h3>Add “' + esc(b.n) + '” to a board</h3>' + rows +
      '<div style="display:flex;gap:.5rem;margin-top:.7rem"><input class="at-field" id="atNewBd" placeholder="New board — e.g. Wedding Guest" style="margin:0">' +
      '<button class="at-btn pri" id="atMkBd">Create</button></div>');
    s.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-bd]'); if (!btn) return;
      var all = boards(), bd = all.find(function (x) { return x.id === btn.dataset.bd; }); if (!bd) return;
      var i = bd.brandIds.indexOf(id);
      if (i > -1) bd.brandIds.splice(i, 1); else bd.brandIds.push(id);
      saveBoards(all); openBoardPicker(id);
    });
    s.querySelector('#atMkBd').addEventListener('click', function () {
      var name = s.querySelector('#atNewBd').value.trim(); if (!name) return;
      var all = boards(); all.push({ id: uid(), name: name, brandIds: [id], createdAt: Date.now() });
      saveBoards(all); openBoardPicker(id);
    });
  }

  function openBoardsHome() {
    var list = boards();
    var rows = list.map(function (bd) {
      return '<div class="brow"><b>' + esc(bd.name) + '</b><small>' + bd.brandIds.length + ' houses</small>' +
        '<span><button class="at-btn pri" data-view="' + bd.id + '">View</button> <button class="at-btn" data-del="' + bd.id + '" aria-label="Delete ' + esc(bd.name) + '">✕</button></span></div>';
    }).join('') || '<p style="color:var(--ink-mute)">No boards yet. Add a house to a board from any card (⊞).</p>';
    var s = openSheet('<h3>Your boards</h3>' + rows +
      '<div style="display:flex;gap:.5rem;margin-top:.9rem;flex-wrap:wrap">' +
      '<button class="at-btn" id="atExp">Export my data</button>' +
      '<button class="at-btn" id="atImp">Import data</button>' +
      '<button class="at-btn" id="atBuild">Build a Look →</button></div>' +
      '<p style="font-size:.72rem;color:var(--ink-mute);margin-top:.6rem">Boards, notes, hearts and basket live only in this browser. Export before clearing your history.</p>');
    s.addEventListener('click', function (e) {
      var v = e.target.closest('[data-view]'), d = e.target.closest('[data-del]');
      if (v) { location.hash = 'board=' + v.dataset.view; closeSheet(); }
      if (d) { saveBoards(boards().filter(function (x) { return x.id !== d.dataset.del; })); openBoardsHome(); }
    });
    s.querySelector('#atExp').addEventListener('click', exportData);
    s.querySelector('#atImp').addEventListener('click', importData);
    s.querySelector('#atBuild').addEventListener('click', function () { location.hash = 'build'; closeSheet(); });
  }

  /* ---------- 5. build a look ---------- */
  var OCC = {
    Work: { cats: ['women', 'access', 'men'], tags: ['minimal', 'contemporary'] },
    Event: { cats: ['women', 'luxury', 'access'], tags: ['evening', 'elegant'] },
    Vacation: { cats: ['women', 'active', 'access'], tags: ['romantic', 'street', 'sporty'] },
    Gift: { cats: ['access', 'sleep', 'women'], tags: ['romantic', 'elegant'] },
    Tailoring: { cats: ['tailor', 'luxury', 'access'], tags: ['heritage', 'elegant'] }
  };
  function capsule(occ, area, tier) {
    var def = OCC[occ] || OCC.Work, picks = [], usedClusters = {};
    def.cats.forEach(function (cat) {
      var pool = D.filter(function (b) { return b.cat === cat && b.city === 'SGN'; });
      if (tier) pool = pool.filter(function (b) { return b.tier === tier || (tier === 'luxury' && b.tier === 'couture'); });
      if (area) pool = pool.filter(function (b) { return (b.area || '').indexOf(area) > -1; });
      var scored = pool.map(function (b) {
        var sc = 0, tg = tagsOf(b);
        def.tags.forEach(function (x, i) { if (tg.indexOf(x) > -1) sc += (def.tags.length - i) * 2; });
        if (b.st === 'walk') sc += 1;
        if (b.flag) sc -= 2;
        var cl = clusterOf(b);
        if (picks.length && usedClusters[cl]) sc += 1.5;         /* same street as an earlier pick */
        else if (picks.length && picks.some(function (p) { return p.area === b.area; })) sc += 0.8;
        return { b: b, sc: sc };
      }).sort(function (a, b) { return b.sc - a.sc; });
      if (scored.length && scored[0].sc > 0) { picks.push(scored[0].b); usedClusters[clusterOf(scored[0].b)] = 1; }
    });
    /* top up to 3 minimum from the occasion's first category */
    if (picks.length < 3) {
      D.filter(function (b) { return b.cat === def.cats[0] && b.city === 'SGN' && picks.indexOf(b) < 0; })
        .slice(0, 3 - picks.length).forEach(function (b) { picks.push(b); });
    }
    return picks.slice(0, 5);
  }
  var AREAS = ['', 'D1', 'D2 · Thảo Điền', 'D3', 'D5', 'D7', 'Bình Thạnh', 'Phú Nhuận'];
  function openBuild() {
    var s = openSheet('<h3>Build a Look</h3>' +
      '<label style="font-size:.78rem">Occasion</label><select class="at-field" id="abOcc">' + Object.keys(OCC).map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select>' +
      '<label style="font-size:.78rem">District (optional)</label><select class="at-field" id="abArea">' + AREAS.map(function (a) { return '<option value="' + a + '">' + (a || 'Anywhere in Saigon') + '</option>'; }).join('') + '</select>' +
      '<label style="font-size:.78rem">Tier (optional)</label><select class="at-field" id="abTier"><option value="">Any budget</option><option value="mid">Mid</option><option value="premium">Premium</option><option value="luxury">Luxury / Couture</option></select>' +
      '<button class="at-btn pri" id="abGo" style="width:100%;margin-top:.4rem">Build my capsule</button><div id="abOut"></div>');
    s.querySelector('#abGo').addEventListener('click', function () {
      var occ = s.querySelector('#abOcc').value, area = s.querySelector('#abArea').value, tier = s.querySelector('#abTier').value;
      var picks = capsule(occ, area, tier);
      var CATL = { women: 'The outfit', men: 'Menswear', luxury: 'The showpiece', access: 'Accessories', active: 'Movement', sleep: 'The soft layer', tailor: 'Made-to-measure', market: 'The hunt' };
      s.querySelector('#abOut').innerHTML = picks.map(function (b) {
        return '<div class="at-cap"><span class="cat">' + esc(CATL[b.cat] || b.cat) + '</span><div style="display:flex;justify-content:space-between;gap:.5rem"><b>' + esc(b.n) + '</b><small style="color:var(--ink-mute)">' + esc(b.area || '') + '</small></div>' +
          '<small style="color:var(--ink-mute)">' + esc((b.no || '').slice(0, 80)) + '</small></div>';
      }).join('') +
      '<div style="display:flex;gap:.5rem;margin-top:.6rem"><button class="at-btn pri" id="abSave">Save as board</button></div>';
      var sv = s.querySelector('#abSave');
      sv.addEventListener('click', function () {
        var all = boards();
        all.push({ id: uid(), name: occ + (area ? ' · ' + area : '') + ' capsule', brandIds: picks.map(bid), createdAt: Date.now() });
        saveBoards(all); sv.textContent = 'Saved ✓';
      });
    });
  }

  /* ---------- 6. export / import ---------- */
  function exportData() {
    var out = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^(ss-|fd-)/.test(k)) out[k] = localStorage.getItem(k); } }
    catch (e) { for (var k2 in mem) out[k2] = mem[k2]; }
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'seraphic-styler-data.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function importData() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result);
          Object.keys(obj).forEach(function (k) { if (/^(ss-|fd-)/.test(k) && typeof obj[k] === 'string') lsSet(k, obj[k]); });
          location.reload();
        } catch (e) { alert('That file could not be read as Seraphic Styler data.'); }
      };
      rd.readAsText(f);
    });
    inp.click();
  }

  /* ---------- card decoration (after every render) ---------- */
  function decorate() {
    document.querySelectorAll('.card').forEach(function (card) {
      var id = idOf(card); if (!id) return;
      card.setAttribute('tabindex', '0');
      var acts = card.querySelector('.acts'); if (!acts || acts.querySelector('.at-bd')) return;
      var hasNote = !!noteOf(id);
      var frag = document.createElement('span');
      frag.innerHTML =
        (TOUCH ? '<button class="at-mini at-pv" data-pv="' + esc(id) + '" aria-label="Preview ' + esc(id) + '">👁</button>' : '') +
        '<button class="at-mini at-bd" data-bd-add="' + esc(id) + '" aria-label="Add to a board">⊞</button>' +
        '<button class="at-mini at-nt" data-nt="' + esc(id) + '" aria-label="Your note">✎' + (hasNote ? '<span class="dot"></span>' : '') + '</button>';
      while (frag.firstChild) acts.appendChild(frag.firstChild);
    });
    buildChipbar();
    applyMood();
  }
  document.addEventListener('click', function (e) {
    var pv = e.target.closest && e.target.closest('[data-pv]');
    var bd = e.target.closest && e.target.closest('[data-bd-add]');
    var nt = e.target.closest && e.target.closest('[data-nt]');
    if (pv) { var card = pv.closest('.card'); showPop(card, innerWidth / 2 - 90, innerHeight - 220); setTimeout(hidePop, 2600); }
    if (bd) openBoardPicker(bd.getAttribute('data-bd-add'));
    if (nt) openNote(nt.getAttribute('data-nt'));
  });

  /* wrap the page's render so decoration + mood survive every re-render */
  if (typeof window.render === 'function') {
    var origRender = window.render;
    window.render = function () { origRender.apply(this, arguments); decorate(); };
  }

  /* ---------- boards utility button + hash views ---------- */
  var bkBtn = document.getElementById('basketbtn');
  if (bkBtn) {
    var ub = document.createElement('button');
    ub.className = 'utilbtn'; ub.id = 'atelierbtn';
    ub.title = 'Boards, notes & Build a Look — saved in this browser.';
    ub.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><path d="M17 14v6M14 17h6"/></svg> Boards';
    bkBtn.after(ub);
    ub.addEventListener('click', openBoardsHome);
  }
  function routeHash() {
    var h = location.hash.replace(/^#/, '');
    var p = new URLSearchParams(h);
    if (h === 'build') { openBuild(); return; }
    var bdId = p.get('board');
    if (bdId) {
      var bd = boards().find(function (x) { return x.id === bdId; });
      if (bd && grid) {
        Array.prototype.forEach.call(grid.querySelectorAll('.card'), function (card) {
          card.style.display = bd.brandIds.indexOf(idOf(card)) > -1 ? '' : 'none';
        });
        if (live) live.textContent = 'Board: ' + bd.name + ' — ' + bd.brandIds.length + ' houses';
      }
    }
  }
  addEventListener('hashchange', function () { setTimeout(routeHash, 60); });

  /* ---------- quick-add tray + card declutter ---------- */
  /* "Show the signal, reveal the noise on demand": secondary card actions
     appear on hover/focus (pointer:fine only); metadata pills collapse into
     one quiet line; the bag opens a one-tap category tray with a tier-median
     price instead of dropping a blank form into the basket. */
  var css2 = document.createElement('style');
  css2.textContent =
    /* hover-reveal secondary actions; heart + bag stay persistent */
    '@media(hover:hover) and (pointer:fine){' +
      '.card .acts,.card .shr,.card .maplink{opacity:0;transition:opacity .16s ease}' +
      '.card:hover .acts,.card:focus-within .acts,.card:hover .shr,.card:focus-within .shr,.card:hover .maplink,.card:focus-within .maplink{opacity:1}' +
    '}' +
    /* one quiet metadata line: strip pill chrome, join with interpuncts */
    '.card .foot{gap:.15rem .4rem}' +
    '.card .foot .tierchip,.card .foot .fib,.card .foot .vibe,.card .foot .sub,.card .foot .price,.card .foot .area,.card .foot .st{' +
      'background:none!important;border:none!important;padding:0!important;color:var(--ink-mute)!important;font-size:.72rem!important;letter-spacing:0}' +
    '.card .foot>*+*:not(.badge):not(.strip)::before{content:"· ";color:var(--ink-mute);opacity:.6}' +
    '.card .foot .badge{background:none;border:none;padding:0;font-size:.7rem}' +
    /* softer card edges: alpha border + hover elevation */
    '.card{border-color:color-mix(in srgb,var(--line) 55%,transparent);transition:box-shadow .18s ease}' +
    '.card:hover{box-shadow:0 10px 30px -18px rgba(35,58,114,.35)}' +
    /* the tray */
    '.at-tray{grid-column:1/-1;margin-top:.55rem;border-top:1px solid var(--line,#eee);padding-top:.55rem}' +
    '.at-tray .lbl{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-mute);margin:0 0 .4rem}' +
    '.at-tray .chips{display:flex;flex-wrap:wrap;gap:.35rem}' +
    '.at-tray .chips button{font:inherit;font-size:.76rem;border:1px solid var(--line,#ccc);background:transparent;color:var(--ink,#222);border-radius:999px;padding:.3rem .7rem;min-height:34px;cursor:pointer}' +
    '.at-tray .chips button[aria-pressed="true"]{background:var(--cobalt,#233a72);color:#fff;border-color:var(--cobalt,#233a72)}' +
    '.at-tray .est{font-size:.74rem;color:var(--ink-mute);margin:.45rem 0}' +
    '.at-tray .row{display:flex;gap:.5rem}' +
    '.at-tray .go{font:inherit;font-size:.78rem;background:var(--cobalt,#233a72);color:#fff;border:0;border-radius:999px;padding:.42rem 1rem;cursor:pointer}' +
    '.at-tray .skip{font:inherit;font-size:.78rem;background:none;border:0;color:var(--ink-mute);cursor:pointer}';
  document.head.appendChild(css2);

  var TIER_PRICE = {                      /* median prefill + honest band label */
    mid:     { v: 500000,  band: '350K–700K₫' },
    premium: { v: 1200000, band: '800K–1.5M₫' },
    luxury:  { v: 2200000, band: '1.5M–3M₫' },
    couture: { v: 4000000, band: '3M₫+' }
  };
  var CATCHIPS = ['Dress', 'Top', 'Skirt', 'Trousers', 'Set', 'Shoes', 'Bag', 'Other'];

  function openTray(card, id) {
    closeTray();
    var b = byId[id]; if (!b) return;
    var tp = TIER_PRICE[b.tier];
    var tray = document.createElement('div');
    tray.className = 'at-tray';
    tray.innerHTML =
      '<p class="lbl">' + esc(t('fd.at.pick', 'Add to your brief — pick a piece')) + '</p>' +
      '<div class="chips">' + CATCHIPS.map(function (c) { return '<button type="button" data-c="' + c + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<p class="est">' + (tp ? esc(t('fd.at.typ', 'Typically ') + tp.band + t('fd.at.here', ' here — adjust in the basket any time.')) : esc(t('fd.at.price', 'Set a price later in the basket.'))) + '</p>' +
      '<div class="row"><button type="button" class="go">' + esc(t('fd.at.add', 'Add to brief')) + '</button><button type="button" class="skip">' + esc(t('fd.at.skip', 'Skip')) + '</button></div>';
    card.appendChild(tray);
    var picked = null;
    tray.querySelector('.chips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-c]'); if (!c) return;
      picked = c.dataset.c;
      tray.querySelectorAll('[data-c]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
    });
    tray.querySelector('.go').addEventListener('click', function () {
      window.SS_BASKET.addStructured(id, picked || '', tp ? tp.v : null);
      closeTray();
    });
    tray.querySelector('.skip').addEventListener('click', closeTray);
    tray.querySelector('.chips button').focus();
  }
  function closeTray() {
    var x = document.querySelector('.at-tray'); if (!x) return;
    var card = x.closest('.card'); x.remove();
    /* skip without adding → the bag goes back out */
    var bk = card && card.querySelector('.bk[data-id]');
    if (bk && window.SS_BASKET && !window.SS_BASKET.has(bk.getAttribute('data-id'))) {
      bk.classList.remove('on'); bk.setAttribute('aria-pressed', 'false');
    }
  }

  /* capture-phase: first bag-tap on a house opens the tray instead of the blank row */
  document.addEventListener('click', function (e) {
    var bk = e.target.closest && e.target.closest('.bk[data-id]');
    if (!bk || !window.SS_BASKET || !window.SS_BASKET.addStructured) return;
    var id = bk.getAttribute('data-id');
    if (window.SS_BASKET.has(id)) return;          /* already in → default open behaviour */
    e.stopPropagation(); e.preventDefault();
    var card = bk.closest('.card');
    if (card) openTray(card, id); else window.SS_BASKET.addStructured(id, '', null);
    bk.classList.add('on'); bk.setAttribute('aria-pressed', 'true');
  }, true);

  /* ---------- boot ---------- */
  function boot() { decorate(); routeHash(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);

  window.SS_ATELIER = { tagsOf: tagsOf, clusterOf: clusterOf, capsule: capsule, boards: boards, exportData: exportData };
})();

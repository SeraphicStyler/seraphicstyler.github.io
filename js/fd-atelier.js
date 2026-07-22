/* Seraphic Styler — directory atelier layer (fd-atelier.js)
   ----------------------------------------------------------------------
   Core only — browse, preview, add. Three things, no organiser clutter:

   1) PREVIEW — hover a house and see it, not just its logo. Brands with a
      real website get a captured screenshot (previews/<slug>.jpg). Instagram
      itself can't be embedded — IG login-walls anyone not signed in — so
      IG-only houses get a rich identity hovercard instead: logo, tier,
      mood tags, the note, and one prominent "Open Instagram" action
      (where the client is usually already logged in).
   2) MOODS  — a quiet chip bar (Coquette / Minimal Workwear / Local Luxury
      / Sporty / Evening / Tailored) filtering on derived style tags.
   3) ADD    — tapping the bag opens a one-tap category tray with a tier-
      median price, so the basket fills without a blank form; cards declutter
      (secondary actions on hover, one quiet metadata line).

   Self-injecting in the fd-basket / route-panel mold: own <style>, own DOM,
   themed off the page's CSS variables. Does not touch the page renderer.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_ATELIER) return;

  var D = window.SS_DIRECTORY || [];
  if (!D.length || !document.getElementById('savedbtn')) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(k, en) { return window.SS_T ? window.SS_T(k, en) : en; }
  function bid(b) { return b.h || b.n; }
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TOUCH = matchMedia('(hover: none)').matches;

  var byId = {};
  D.forEach(function (b) { var k = bid(b); if (!(k in byId)) byId[k] = b; });

  /* style tags — moods + the preview card caption */
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
  /* Preview = a real captured screenshot only (previews/<slug>.jpg, shot by
     tools/capture-previews.sh — no third party, no rate limit, always the shop).
     A house with no captured file simply doesn't preview (see fillWebsite's
     onerror). slug must match the capture script exactly:
     (b.h||b.n) → lowercase → non-alnum to dashes. */
  function slugOf(b) { return String(b.h || b.n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function localShot(b) { return 'previews/' + slugOf(b) + '.jpg'; }

  /* ---------- styles ---------- */
  var css = document.createElement('style');
  css.textContent =
    /* preview popup */
    '#previewPopup{position:fixed;z-index:340;width:210px;border-radius:10px;overflow:hidden;pointer-events:auto;opacity:0;visibility:hidden;transform:translateY(6px) scale(.97);background:var(--card-solid,#fff);box-shadow:0 18px 42px rgba(20,28,54,.22),0 0 0 1px rgba(120,120,150,.14);' + (RM ? '' : 'transition:opacity .18s ease,transform .18s ease,visibility .18s;') + '}' +
    '#previewPopup.on{visibility:visible}' +
    '#previewPopup .pv-shotlink{display:block;position:relative;text-decoration:none}' +
    '#previewPopup .pv-btn{display:inline-block;font-size:.75rem;font-weight:600;background:var(--cobalt,#2e54ad);color:#fff;border-radius:999px;padding:.42rem .95rem;text-decoration:none;margin-top:.3rem}' +
    '#previewPopup .pv-add{font:inherit;font-size:.73rem;background:none;border:1px solid var(--line,#ccc);border-radius:999px;padding:.36rem .85rem;color:var(--ink,#233a72);cursor:pointer;margin-top:.3rem}' +
    '#previewPopup .pv-cap .pv-add{align-self:flex-start;margin-top:.35rem}' +
    '#previewPopup.on{opacity:1;transform:none}' +
    '#previewPopup .pv-shot{width:100%;aspect-ratio:4/5;object-fit:cover;object-position:top center;display:block;background:#f2f3f7 center/48px no-repeat;opacity:0;transition:opacity .2s}' +
    '#previewPopup.loaded .pv-shot{opacity:1}' +
    '#previewPopup .pv-load{position:absolute;inset:0;background:#eef0f6 center/44px no-repeat;background-image:var(--lg);filter:grayscale(.2) opacity(.5)}' +
    '#previewPopup.loaded .pv-load{display:none}' +
    '#previewPopup .pv-cap{display:flex;flex-direction:column;gap:1px;padding:.5rem .6rem}' +
    '#previewPopup .pv-cap b{font-size:.85rem;color:var(--ink,#233a72)}' +
    '#previewPopup .pv-cap i{font-style:normal;font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-mute,#8a8aa0)}' +
    '#previewPopup .pv-card{display:flex;flex-direction:column;align-items:center;gap:.35rem;padding:1rem .8rem;text-align:center}' +
    '#previewPopup .pv-logo{width:52px;height:52px;border-radius:12px;object-fit:cover;background:#eef0f6}' +
    '#previewPopup .pv-mono{display:grid;place-items:center;font-size:1.2rem;font-weight:600;color:var(--cobalt,#2e54ad)}' +
    '#previewPopup .pv-card b{font-size:.9rem;color:var(--ink,#233a72)}' +
    '#previewPopup .pv-card i{font-style:normal;font-size:.64rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-mute,#8a8aa0)}' +
    '#previewPopup .pv-tags{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}' +
    '#previewPopup .pv-tags em{font-style:normal;font-size:.62rem;letter-spacing:.04em;text-transform:capitalize;border:1px solid var(--line,#ddd);border-radius:999px;padding:2px 8px;color:var(--ink-soft,#555)}' +
    '#previewPopup .pv-note{font-size:.72rem;color:var(--ink-soft,#555);line-height:1.45;margin-top:.1rem}' +
    '#previewPopup .pv-open{margin-top:.15rem;font-size:.7rem;color:var(--cobalt,#2e54ad)}' +
    /* mood chips */
    '.at-chipbar{display:flex;gap:.45rem;overflow-x:auto;padding:.2rem .1rem .55rem;-webkit-overflow-scrolling:touch;scrollbar-width:none}' +
    '.at-chipbar::-webkit-scrollbar{display:none}' +
    '.at-chip{flex:none;font:inherit;font-size:.78rem;padding:.34rem .8rem;min-height:40px;border-radius:999px;border:1px solid var(--line,rgba(120,120,140,.35));background:transparent;color:var(--ink-soft,#555);cursor:pointer}' +
    '.at-chip[aria-pressed="true"]{background:var(--ink,#233a72);color:var(--paper,#fff);border-color:var(--ink,#233a72)}' +
    '.at-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
    /* card declutter: the ⋯ menu button reveals on hover/focus; one quiet meta line
       (share/map/street live inside the menu now, always visible once it's open) */
    '@media(hover:hover) and (pointer:fine){' +
      '.card .cm-btn{opacity:0;transition:opacity .16s ease}' +
      '.card:hover .cm-btn,.card:focus-within .cm-btn,.card .cm-btn[aria-expanded="true"]{opacity:1}}' +
    '.card .foot{gap:.15rem .4rem}' +
    '.card .foot .tierchip,.card .foot .fib,.card .foot .vibe,.card .foot .sub,.card .foot .price,.card .foot .area,.card .foot .st{background:none!important;border:none!important;padding:0!important;color:var(--ink-mute)!important;font-size:.72rem!important;letter-spacing:0}' +
    '.card .foot>*+*:not(.badge):not(.strip)::before{content:"· ";color:var(--ink-mute);opacity:.6}' +
    '.card .foot .badge{background:none;border:none;padding:0;font-size:.7rem}' +
    '.card{border-color:color-mix(in srgb,var(--line) 55%,transparent);transition:box-shadow .18s ease}' +
    '.card:hover{box-shadow:0 10px 30px -18px rgba(35,58,114,.35)}' +
    /* quick-add tray */
    '.at-tray{grid-column:1/-1;margin-top:.55rem;border-top:1px solid var(--line,#eee);padding-top:.55rem}' +
    '.at-tray .lbl{font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-mute);margin:0 0 .4rem}' +
    '.at-tray .chips{display:flex;flex-wrap:wrap;gap:.35rem}' +
    '.at-tray .chips button{font:inherit;font-size:.76rem;border:1px solid var(--line,#ccc);background:transparent;color:var(--ink,#222);border-radius:999px;padding:.32rem .7rem;min-height:38px;cursor:pointer}' +
    '.at-tray .chips button[aria-pressed="true"]{background:var(--cobalt,#233a72);color:#fff;border-color:var(--cobalt,#233a72)}' +
    '.at-tray .est{font-size:.74rem;color:var(--ink-mute);margin:.45rem 0}' +
    '.at-tray .row{display:flex;gap:.5rem}' +
    '.at-tray .go{font:inherit;font-size:.78rem;background:var(--cobalt,#233a72);color:#fff;border:0;border-radius:999px;padding:.44rem 1rem;min-height:40px;cursor:pointer}' +
    '.at-tray .skip{font:inherit;font-size:.78rem;background:none;border:0;color:var(--ink-mute);cursor:pointer;min-height:40px}';
  document.head.appendChild(css);

  /* ---------- preview popup ---------- */
  var pop = document.createElement('div');
  pop.id = 'previewPopup'; pop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pop);
  var hoverTimer = null, shotOk = {};

  function idOf(card) { var sv = card.querySelector('.sv[data-id]'); return sv ? sv.getAttribute('data-id') : null; }
  function logoSrc(card) { var l = card && card.querySelector('.blogo'); return l ? l.getAttribute('src') : null; }

  /* The hovercard is INTERACTIVE (pins beside the card, mouse can travel
     into it). Website houses show their captured shopfront; Instagram-only
     houses — IG login-walls all outside viewers, so no live embed exists —
     get an identity card: logo, tier, mood tags, note, and one prominent
     "Open Instagram" action, enough to judge the vibe before leaving. */
  var hideTimer = null, curAnchor = null;

  /* card !== null → show the "Add to basket" button (directory grid);
     card === null → preview only (basket panel — already added). */
  function fillWebsite(b, logo, card) {
    pop.classList.remove('loaded');
    pop.style.setProperty('--lg', logo ? "url('" + logo + "')" : 'none');
    var addBtn = card ? '<button type="button" class="pv-add">＋ ' + esc(t('fd.at.add', 'Add to shortlist')) + '</button>' : '';
    pop.innerHTML = '<a class="pv-shotlink" href="' + esc(b.w) + '" target="_blank" rel="noopener">' +
        '<div class="pv-load"></div><img class="pv-shot" alt="' + esc(b.n) + ' shopfront"></a>' +
      '<div class="pv-cap"><b>' + esc(b.n) + '</b><i>' + esc(t('fd.pv.live', 'Their shop — click to open ↗')) + '</i>' + addBtn + '</div>';
    var im = pop.querySelector('.pv-shot');
    im.onload = function () { pop.classList.add('loaded'); };
    im.onerror = hidePop;   /* no captured screenshot → show nothing, never a broken/blank box */
    im.src = localShot(b);
    var ab = pop.querySelector('.pv-add');
    if (ab) ab.addEventListener('click', function () { hidePop(); if (card) openTray(card, bid(b)); });
  }
  /* IG-only houses: the identity card — no image to wait for, loaded at once */
  var TIERLBL = { mid: 'Mid', premium: 'Premium', luxury: 'Luxury', couture: 'Couture' };
  function fillInstagram(b, logo, card) {
    pop.classList.remove('loaded');
    var tags = tagsOf(b).slice(0, 3);
    var meta = [TIERLBL[b.tier] || null, b.area || null].filter(Boolean).join(' · ');
    var note = (b.no || '').replace(/⚠️\s*/g, '');
    if (note.length > 110) note = note.slice(0, 107).replace(/\s+\S*$/, '') + '…';
    var addBtn = card ? '<button type="button" class="pv-add">＋ ' + esc(t('fd.at.add', 'Add to shortlist')) + '</button>' : '';
    pop.innerHTML = '<div class="pv-card">' +
        (logo ? '<img class="pv-logo" src="' + esc(logo) + '" alt="">' : '<span class="pv-logo pv-mono">' + esc((b.n || '?').charAt(0)) + '</span>') +
        '<b>' + esc(b.n) + '</b>' +
        (meta ? '<i>' + esc(meta) + '</i>' : '') +
        (tags.length ? '<span class="pv-tags">' + tags.map(function (tg) { return '<em>' + esc(tg) + '</em>'; }).join('') + '</span>' : '') +
        (note ? '<span class="pv-note">' + esc(note) + '</span>' : '') +
        '<a class="pv-btn" href="https://instagram.com/' + esc(b.h) + '" target="_blank" rel="noopener">' + esc(t('fd.pv.ig', 'Open Instagram ↗')) + '</a>' +
        addBtn +
      '</div>';
    pop.classList.add('loaded');
    var ab = pop.querySelector('.pv-add');
    if (ab) ab.addEventListener('click', function () { hidePop(); if (card) openTray(card, bid(b)); });
  }
  function place(anchor) {
    var r = anchor.getBoundingClientRect(), w = 210, gap = 10;
    var h = pop.offsetHeight || 270;
    var left = (r.right + gap + w <= innerWidth - 8) ? r.right + gap
             : (r.left - gap - w >= 8) ? r.left - gap - w
             : Math.min(Math.max(8, r.right - w - 8), innerWidth - w - 8); /* tight column → overlap the neighbour */
    var top = Math.min(Math.max(10, r.top), innerHeight - h - 10);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  /* one preview engine for both the grid card and the basket brand-row */
  function showPreviewFor(b, anchor, card, logo) {
    if (TOUCH || innerWidth < 900) return;   /* desktop only — a phone popup just buries the neighbours */
    if (!b || (!b.w && !b.h)) return;        /* nothing to preview and nowhere to point */
    if (curAnchor === anchor && pop.classList.contains('on')) return;
    curAnchor = anchor;
    if (b.w) fillWebsite(b, logo, card);     /* captured shopfront */
    else fillInstagram(b, logo, card);       /* identity card + Open Instagram */
    pop.classList.add('on'); pop.setAttribute('aria-hidden', 'false');
    place(anchor);
  }
  function showPop(card) { showPreviewFor(byId[idOf(card)], card, card, logoSrc(card)); }
  function basketBrand(ghead) { var g = ghead.closest('.bk-group'), k = g && g.getAttribute('data-key'); return k ? byId[k] : null; }
  function hidePop() {
    clearTimeout(hoverTimer); clearTimeout(hideTimer);
    pop.classList.remove('on'); pop.setAttribute('aria-hidden', 'true');
    curAnchor = null;
  }
  function scheduleHide() { clearTimeout(hideTimer); hideTimer = setTimeout(hidePop, 400); }

  if (!TOUCH) {
    document.addEventListener('mouseover', function (e) {
      if (pop.contains(e.target)) { clearTimeout(hideTimer); return; }  /* inside the popup — keep it up */
      var card = e.target.closest && e.target.closest('.card');
      if (card && idOf(card)) {
        clearTimeout(hideTimer); clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () { showPop(card); }, 110);
        return;
      }
      var ghead = e.target.closest && e.target.closest('.bk-ghead');  /* tray brand-row */
      if (ghead) {
        var b = basketBrand(ghead);
        if (b && (b.w || b.h)) {
          clearTimeout(hideTimer); clearTimeout(hoverTimer);
          var lg = ghead.querySelector('.bk-glogo');
          var logo = (lg && lg.getAttribute && lg.getAttribute('src')) || null;
          hoverTimer = setTimeout(function () { showPreviewFor(b, ghead, null, logo); }, 110);
        }
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.relatedTarget && pop.contains(e.relatedTarget)) return;   /* moving into the popup — keep it */
      if (pop.contains(e.target)) { scheduleHide(); return; }
      var card = e.target.closest && e.target.closest('.card');
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) { clearTimeout(hoverTimer); scheduleHide(); return; }
      var ghead = e.target.closest && e.target.closest('.bk-ghead');
      if (ghead && (!e.relatedTarget || !ghead.contains(e.relatedTarget))) { clearTimeout(hoverTimer); scheduleHide(); }
    });
    document.addEventListener('focusin', function (e) {
      if (!e.target.classList || !e.target.classList.contains('card')) return;
      showPop(e.target);
    });
    document.addEventListener('focusout', function (e) {
      if (e.target.classList && e.target.classList.contains('card') && !(e.relatedTarget && pop.contains(e.relatedTarget))) scheduleHide();
    });
    pop.addEventListener('mouseover', function () { clearTimeout(hideTimer); });
    pop.addEventListener('mouseout', function (e) { if (!e.relatedTarget || !pop.contains(e.relatedTarget)) scheduleHide(); });
    addEventListener('scroll', function () { if (curAnchor) place(curAnchor); }, { passive: true });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hidePop(); closeTray(); } });

  /* ---------- mood chips ---------- */
  var MOODS = [
    ['all', 'All', null], ['coquette', 'Coquette', ['romantic']], ['minwork', 'Minimal Workwear', ['minimal']],
    ['locallux', 'Local Luxury', ['elegant']], ['sporty', 'Sporty', ['sporty']], ['evening', 'Evening', ['evening']], ['tailored', 'Tailored', ['heritage']]
  ];
  var mood = 'all', grid = null, live = null;
  function applyMood() {
    if (!grid) return;
    var def = MOODS.find(function (m) { return m[0] === mood; }), tags = def && def[2], shown = 0, total = 0;
    Array.prototype.forEach.call(grid.querySelectorAll('.card'), function (card) {
      var b = byId[idOf(card)]; if (!b) return;
      total++;
      var ok = !tags || tagsOf(b).some(function (tg) { return tags.indexOf(tg) > -1; });
      card.style.display = ok ? '' : 'none'; if (ok) shown++;
    });
    if (live) live.textContent = tags ? shown + ' of ' + total + ' houses match "' + def[1] + '"' : total + ' houses';
    document.querySelectorAll('.at-chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.mood === mood)); });
  }
  function buildChipbar() {
    var firstCard = document.querySelector('.card');
    grid = firstCard && firstCard.parentElement;
    if (!grid || document.querySelector('.at-chipbar')) return;
    var bar = document.createElement('div');
    bar.className = 'at-chipbar'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Mood filter');
    bar.innerHTML = MOODS.map(function (m) { return '<button class="at-chip" type="button" data-mood="' + m[0] + '" aria-pressed="' + String(m[0] === mood) + '">' + esc(m[1]) + '</button>'; }).join('');
    live = document.createElement('span'); live.className = 'at-live'; live.setAttribute('aria-live', 'polite'); bar.appendChild(live);
    grid.parentElement.insertBefore(bar, grid);
    bar.addEventListener('click', function (e) { var c = e.target.closest('.at-chip'); if (!c) return; mood = c.dataset.mood; applyMood(); });
  }

  /* ---------- quick-add tray ---------- */
  var TIER_PRICE = {
    mid: { v: 500000, band: '350K–700K₫' }, premium: { v: 1200000, band: '800K–1.5M₫' },
    luxury: { v: 2200000, band: '1.5M–3M₫' }, couture: { v: 4000000, band: '3M₫+' }
  };
  var CATCHIPS = ['Dress', 'Top', 'Skirt', 'Trousers', 'Set', 'Shoes', 'Bag', 'Other'];
  function openTray(card, id) {
    closeTray();
    var b = byId[id]; if (!b) return;
    var tp = TIER_PRICE[b.tier];
    var tray = document.createElement('div');
    tray.className = 'at-tray';
    tray.innerHTML =
      '<p class="lbl">' + esc(t('fd.at.pick', 'Add to your shortlist — pick a piece')) + '</p>' +
      '<div class="chips">' + CATCHIPS.map(function (c) { return '<button type="button" data-c="' + c + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<p class="est">' + (tp ? esc(t('fd.at.typ', 'Typically ') + tp.band + t('fd.at.here', ' here — adjust in your tray any time.')) : esc(t('fd.at.price', 'Set a price later in your tray.'))) + '</p>' +
      '<div class="row"><button type="button" class="go">' + esc(t('fd.at.add', 'Add to shortlist')) + '</button><button type="button" class="skip">' + esc(t('fd.at.skip', 'Skip')) + '</button></div>';
    card.appendChild(tray);
    var picked = null;
    tray.querySelector('.chips').addEventListener('click', function (e) {
      var c = e.target.closest('[data-c]'); if (!c) return;
      picked = c.dataset.c;
      tray.querySelectorAll('[data-c]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
    });
    tray.querySelector('.go').addEventListener('click', function () { window.SS_BASKET.addStructured(id, picked || '', tp ? tp.v : null); closeTray(); });
    tray.querySelector('.skip').addEventListener('click', closeTray);
    tray.querySelector('.chips button').focus();
  }
  function closeTray() {
    var x = document.querySelector('.at-tray'); if (!x) return;
    var card = x.closest('.card'); x.remove();
    var bk = card && card.querySelector('.bk[data-id]');
    if (bk && window.SS_BASKET && !window.SS_BASKET.has(bk.getAttribute('data-id'))) { bk.classList.remove('on'); bk.setAttribute('aria-pressed', 'false'); }
  }
  document.addEventListener('click', function (e) {
    var bk = e.target.closest && e.target.closest('.bk[data-id]');
    if (!bk || !window.SS_BASKET || !window.SS_BASKET.addStructured) return;
    var id = bk.getAttribute('data-id');
    if (window.SS_BASKET.has(id)) return;         /* already in → default open */
    e.stopPropagation(); e.preventDefault();
    var card = bk.closest('.card');
    if (card) openTray(card, id); else window.SS_BASKET.addStructured(id, '', null);
    bk.classList.add('on'); bk.setAttribute('aria-pressed', 'true');
  }, true);

  /* (Preview triggers from the card-level hover in showPop() — no separate
     handle listener needed; hovering the hostname link is inside the card.) */

  /* ---------- decorate after every render ---------- */
  function decorate() {
    document.querySelectorAll('.card').forEach(function (card) { if (idOf(card)) card.setAttribute('tabindex', '0'); });
    buildChipbar();
    applyMood();
  }
  if (typeof window.render === 'function') {
    var origRender = window.render;
    window.render = function () { origRender.apply(this, arguments); decorate(); };
  }
  function boot() { decorate(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);

  window.SS_ATELIER = { tagsOf: tagsOf };
})();

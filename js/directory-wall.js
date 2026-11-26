/* Seraphic Styler — the house wall (16 Nov 2026).
   ------------------------------------------------------------------------
   Her brief: people should be able to find, discover and look at all the
   brands at once, without clutter. So the directory now reads in one line:

     search → categories → a shelf by occasion → every house as a logo wall

   · THE WALL: every house is a logo and a name (about 12 to a phone screen,
     8 across on desktop), grouped by category. No paging.
   · THE QUICK LOOK: tapping a house opens one sheet with what it is, where
     it is, its own channels, a heart to save it, and the one next step
     (Sourcing or The Trace). Arrows step to the next house, so you can
     keep looking without going back.
   · DETAILS VIEW: the same houses as cards with their notes. It takes over
     by itself when someone types a search, and anyone can switch by hand.
   · TOOLS: Explore, Plan a visit, Compare, Piece board, Tray, Signature and
     Ask the directory sit under one button. Nothing was removed.

   Reuses the plate / next-step pieces from js/directory-featured.js
   (window.SS_HOUSE_PARTS) and is called by js/directory-workspace.js through
   window.SS_WALL_RENDER. Loads after featured, before workspace.            */
(function () {
  'use strict';
  var doc = document, rows = window.SS_DIRECTORY || [], P = window.SS_HOUSE_PARTS;
  if (!rows.length || !P) return;
  var esc = P.esc;
  function T(key, en) { return typeof window.SS_T === 'function' ? window.SS_T(key, en) : en; }
  function TF(key, en, vars) {
    if (typeof window.SS_TF === 'function') return window.SS_TF(key, en, vars);
    return en.replace(/\{(\w+)\}/g, function (m, k) { return vars[k]; });
  }
  function $(s, root) { return (root || doc).querySelector(s); }
  function el(tag, cls, html) { var n = doc.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

  var index = new Map(); rows.forEach(function (r, i) { index.set(r, i); });
  var STEP = 24;                       // detail cards shown per "Show more"
  var pref = null;                     // 'wall' | 'details' once the visitor chooses; otherwise automatic
  try { pref = sessionStorage.getItem('fd-view'); } catch (e) {}
  if (pref !== 'wall' && pref !== 'details') pref = null;
  var ctx = null, list = [], limit = STEP, lastKey = '';

  var STATUS = { walk: ['fd.dyn.st.walk', 'Walk-in'], appt: ['fd.dyn.st.appt', 'By appointment'], online: ['fd.dyn.st.online', 'Online'],
    hub: ['fd.wall.st.hub', 'Stocked in a multi-brand store'], popup: ['fd.wall.st.popup', 'Pop-up'] };
  var ICON = {
    heart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 20.5C7 16.2 3.5 13 3.5 8.9 3.5 6.4 5.4 4.5 7.8 4.5c1.6 0 3.1.8 4.2 2.3 1.1-1.5 2.6-2.3 4.2-2.3 2.4 0 4.3 1.9 4.3 4.4 0 4.1-3.5 7.3-8.5 11.6Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
    rowsI: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    filter: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/></svg>',
    tools: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };

  /* ---------- saved hearts (the tray keeps them; the page's own filter follows the ss:tray event) ---------- */
  function key(r) { return r.h || r.n; }
  function isSaved(r) { return !!(window.SS_TRAY && window.SS_TRAY.isSaved(key(r))); }
  function toggleSaved(r) {
    if (!window.SS_TRAY) return false;
    if (isSaved(r)) window.SS_TRAY.removeSaved(key(r)); else window.SS_TRAY.addSaved(key(r));
    return isSaved(r);
  }
  function paintHeart(btn, r) {
    var on = isSaved(r);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', (on ? T('fd.wall.unsave', 'Remove from saved') : T('fd.ws.save', 'Save')) + ' — ' + r.n);
    btn.title = on ? T('fd.savedlab', 'Saved') : T('fd.ws.save', 'Save');
  }
  function syncHearts() {
    doc.querySelectorAll('[data-save]').forEach(function (b) { paintHeart(b, rows[+b.dataset.save]); });
    doc.querySelectorAll('.fw-tile[data-house], .fs-tile[data-house]').forEach(function (t) { t.toggleAttribute('data-saved', isSaved(rows[+t.dataset.house])); });
  }
  doc.addEventListener('ss:tray', syncHearts);

  /* ---------- the wall ---------- */
  function tile(r) {
    return '<li><button type="button" class="fw-tile" data-house="' + index.get(r) + '"' + (isSaved(r) ? ' data-saved' : '') + '>' +
      P.plate(r, { cls: 'fw-plate', px: 132 }) + '<span class="fw-name">' + esc(r.n) + '</span></button></li>';
  }
  function meta(r) {
    var cat = P.category[r.cat] || '', tier = r.tier && r.tier !== 'none' ? T('fd.tiersel.' + r.tier, r.tier) : '';
    return esc(cat) + (tier ? ' <span class="ff-tier">' + esc(tier) + '</span>' : '');
  }
  function status(r) { var s = STATUS[r.st]; return s ? T(s[0], s[1]) : ''; }
  function card(r) {
    var i = index.get(r), ch = P.channel(r), why = '';
    if (ctx && ctx.q) { var m = ctx.catalog.ranking(ctx.catalog.fromLegacy(r), ctx.q).matched_on; if (m.length) why = '<span class="fw-why">Matched ' + esc(m.join(', ')) + '</span>'; }
    return '<li class="fw-card">' +
      '<button type="button" class="fw-card-open" data-house="' + i + '">' + P.plate(r, { cls: 'fw-card-plate', px: 64 }) +
      '<span class="fw-card-body"><span class="fw-card-name">' + esc(r.n) + '</span>' +
      '<span class="fw-card-meta">' + meta(r) + '</span>' +
      '<span class="fw-card-where">' + esc(r.area) + (status(r) ? ' · ' + esc(status(r)) : '') + '</span>' +
      '<span class="fw-card-note">' + esc(P.line(r.no)) + '</span>' + why + '</span></button>' +
      '<button type="button" class="fw-heart" data-save="' + i + '">' + ICON.heart + '</button>' +
      (ch ? '<a class="fw-card-ch" href="' + esc(ch.href) + '" target="_blank" rel="noopener noreferrer">' + esc(ch.label) + ' <span aria-hidden="true">↗</span></a>' : '') +
      '</li>';
  }
  function toggle(mode) {
    var g = el('div', 'fw-view'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', T('fd.wall.view', 'View'));
    [['wall', ICON.grid, T('fd.wall.logos', 'Logos')], ['details', ICON.rowsI, T('fd.wall.details', 'Details')]].forEach(function (v) {
      var b = el('button', '', v[1] + '<span>' + esc(v[2]) + '</span>'); b.type = 'button'; b.dataset.view = v[0];
      b.setAttribute('aria-pressed', String(mode === v[0]));
      b.addEventListener('click', function () {
        if (mode === v[0]) return;
        pref = v[0]; try { sessionStorage.setItem('fd-view', pref); } catch (e) {}
        window.SS_FD.refresh();
        var again = $('.fw-view [data-view="' + v[0] + '"]'); if (again) again.focus({ preventScroll: true });
      });
      g.append(b);
    });
    return g;
  }
  function service() {
    var trace = 'https://tally.so/r/gD10Kl?about=' + encodeURIComponent('I need The Trace for item identification') + '&source=directory';
    var a = el('aside', 'fw-service');
    a.setAttribute('data-vc-root', ''); a.lang = 'en';
    a.innerHTML = '<p class="fw-service-t">Found a piece you love?</p>' +
      '<p class="fw-service-p">A link with a price is <strong>Sourcing</strong>. A photo, a post or a custom size is <strong>The Trace</strong>.</p>' +
      '<p class="fw-service-a"><a href="estimate">I have a link: get my total <span aria-hidden="true">→</span></a>' +
      '<a href="' + esc(trace) + '">I have a photo: start The Trace <span aria-hidden="true">→</span></a></p>';
    return a;
  }
  function showMore(grid, host) {
    var left = list.length - limit; if (left <= 0) return null;
    var b = el('button', 'fw-more'); b.type = 'button';
    b.textContent = TF('fd.wall.more', 'Show {n} more', { n: Math.min(STEP, left) });
    b.addEventListener('click', function () {
      var from = limit; limit += STEP;
      grid.insertAdjacentHTML('beforeend', list.slice(from, limit).map(card).join(''));
      syncHearts();
      var next = showMore(grid, host); if (next) b.replaceWith(next); else b.remove();
      var first = grid.children[from]; if (first) first.querySelector('.fw-card-open').focus({ preventScroll: true });
    });
    return b;
  }

  window.SS_WALL_RENDER = function (c) {
    var engine = window.SS_FD; if (!engine || !engine.groups) return false;
    ctx = c; list = c.rows;
    var host = c.host, st = engine.state(), k = JSON.stringify(st);
    if (k !== lastKey) { limit = STEP; lastKey = k; }
    var mode = pref || (c.q ? 'details' : 'wall');
    doc.body.dataset.houseView = mode;
    host.replaceChildren();

    var head = el('div', 'fw-head');
    var h = el('h2', 'fd-results-title'); h.textContent = TF('fd.ws.count', '{n} houses', { n: c.shown.length });
    head.append(h);
    if (c.shown.length) head.append(toggle(mode));
    host.append(head);

    if (!c.shown.length) {
      var none = el('div', 'fw-empty');
      var p = el('p'); p.textContent = T('fd.wall.none', 'No houses match these filters. Remove a filter or clear the search to try again.');
      var clear = el('button', 'fw-more'); clear.type = 'button'; clear.textContent = T('fd.wall.clear', 'Clear all filters');
      clear.addEventListener('click', function () { var q = $('#q'); if (q && q.value) { var x = $('#qclear'); if (x) x.click(); } engine.reset(); });
      none.append(p, clear); host.append(none);
      return true;
    }

    if (mode === 'wall') {
      var grouped = st.sort === 'rec' && !c.q;
      if (grouped) {
        engine.groups().forEach(function (g) {
          var houses = list.filter(function (r) { return r.cat === g.id; });
          if (!houses.length) return;
          var sec = el('section', 'fw-sec'); sec.id = 'wall-' + g.id; sec.setAttribute('aria-labelledby', 'wall-h-' + g.id);
          sec.innerHTML = '<header class="fw-sec-head"><h3 id="wall-h-' + g.id + '">' + esc(g.title) + ' <span class="fw-n">' + houses.length + '</span></h3>' +
            '<p>' + esc(g.desc) + '</p></header><ol class="fw-grid">' + houses.map(tile).join('') + '</ol>';
          host.append(sec);
        });
      } else {
        host.append(el('ol', 'fw-grid', list.map(tile).join('')));
      }
    } else {
      var grid = el('ol', 'fw-cards', list.slice(0, limit).map(card).join(''));
      host.append(grid);
      var more = showMore(grid, host); if (more) host.append(more);
      syncHearts();
    }
    host.append(service());
    var note = el('p', 'fd-results-note');
    note.textContent = T('fd.ws.observations', 'Directory observations, not live stock. Confirm current hours before a visit.');
    host.append(note);
    return true;
  };

  /* ---------- the quick look ---------- */
  var dlg = el('dialog', 'fq'); dlg.id = 'fd-quick'; dlg.setAttribute('aria-labelledby', 'fq-name'); dlg.setAttribute('data-vc-root', '');
  dlg.innerHTML = '<div class="fq-bar">' +
    '<button type="button" class="fq-nav" data-step="-1">' + ICON.left + '</button>' +
    '<span class="fq-pos" aria-live="polite"></span>' +
    '<button type="button" class="fq-nav" data-step="1">' + ICON.right + '</button>' +
    '<button type="button" class="fq-close">' + ICON.close + '</button></div><div class="fq-body" tabindex="-1"></div>';
  doc.body.append(dlg);
  var body = $('.fq-body', dlg), pos = $('.fq-pos', dlg), order = [], at = 0, opener = null;

  function fill() {
    var r = order[at], i = index.get(r), ch = [], parts = P;
    if (r.h) ch.push('<a href="https://instagram.com/' + encodeURIComponent(r.h) + '" target="_blank" rel="noopener noreferrer">Instagram · @' + esc(r.h) + ' <span aria-hidden="true">↗</span></a>');
    if (r.w) { try { ch.push('<a href="' + esc(r.w) + '" target="_blank" rel="noopener noreferrer">' + esc(new URL(r.w).hostname.replace(/^www\./, '')) + ' <span aria-hidden="true">↗</span></a>'); } catch (e) {} }
    var street = r.st !== 'online' && ['SGN', 'HAN', 'VN'].indexOf(r.city) > -1;
    if (street && window.SS_FD.mapsUrl) ch.push('<a href="' + esc(window.SS_FD.mapsUrl(r)) + '" target="_blank" rel="noopener noreferrer">' + esc(T('fd.wall.map', 'Open in Maps')) + ' <span aria-hidden="true">↗</span></a>');
    var record = ctx ? ctx.href('record', ctx.catalog.fromLegacy(r).id) : '';
    body.innerHTML =
      '<div class="fq-top">' + parts.plate(r, { cls: 'fq-plate', px: 112, photo: true, eager: true }) +
        '<div class="fq-id"><p class="fq-cat">' + meta(r) + '</p><h2 id="fq-name">' + esc(r.n) + '</h2>' +
        '<p class="fq-where">' + esc(r.area) + (status(r) ? ' · ' + esc(status(r)) : '') + '</p></div>' +
        '<button type="button" class="fw-heart fq-heart" data-save="' + i + '">' + ICON.heart + '</button></div>' +
      '<p class="fq-note">' + esc(r.no) + '</p>' +
      (r.price ? '<p class="fq-fact"><span>' + esc(T('fd.wall.price', 'Price noted')) + '</span>' + esc(r.price) + '</p>' : '') +
      (street || r.st === 'online' ? '<p class="fq-fact"><span>' + esc(street ? T('fd.wall.address', 'Address') : T('fd.wall.orders', 'Orders')) + '</span>' + esc(r.a) + '</p>' : '') +
      (street ? '<p class="fq-small">' + esc(T('fd.wall.confirm', 'Shops here move often. Message the house before you visit.')) + '</p>' : '') +
      (ch.length ? '<p class="fq-links">' + ch.join('') + '</p>' : '') +
      '<div class="fq-step" lang="en"><p class="fq-step-t">Want a piece from this house?</p>' + parts.next(r, '') + '</div>' +
      '<p class="fq-foot"><button type="button" data-compare-house="' + i + '" aria-pressed="false">' + esc(T('fd.discovery.compare', 'Compare')) + '</button>' +
        (record ? '<a class="fq-record" href="' + esc(record) + '">' + esc(T('fd.wall.record', 'Full house record')) + ' <span aria-hidden="true">→</span></a>' : '') + '</p>';
    paintHeart($('.fq-heart', body), r);
    if (window.SS_COMPARE) window.SS_COMPARE.sync();
    pos.textContent = order.length > 1 ? (at + 1) + ' / ' + order.length : '';
    dlg.querySelectorAll('.fq-nav').forEach(function (b) {
      b.hidden = order.length < 2;
      b.setAttribute('aria-label', +b.dataset.step < 0 ? T('fd.wall.prev', 'Previous house') : T('fd.wall.next', 'Next house'));
    });
    $('.fq-close', dlg).setAttribute('aria-label', T('fd.wall.close', 'Close'));
    body.scrollTop = 0;
  }
  function openQuick(i, from) {
    var r = rows[i]; if (!r) return;
    /* Arrows walk the list the visitor was looking at: a shelf's eight houses, or everything on the wall. */
    var shelf = from && from.closest('.fs-rail');
    order = shelf ? Array.prototype.map.call(shelf.querySelectorAll('[data-house]'), function (b) { return rows[+b.dataset.house]; }) : list.slice();
    at = order.indexOf(r); if (at < 0) { order = [r]; at = 0; }
    opener = from || null;
    fill();
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    doc.documentElement.classList.add('fq-open');
    body.focus({ preventScroll: true });
  }
  function step(d) { if (order.length < 2) return; at = (at + d + order.length) % order.length; fill(); }
  function closeQuick() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () {
    doc.documentElement.classList.remove('fq-open');
    /* This event arrives a beat after the sheet closes. If the visitor has already moved on
       (say, straight into the search box), leave their focus alone. */
    var a = doc.activeElement;
    if (a && a !== doc.body && a !== opener && !dlg.contains(a)) return;
    /* Left for the full record or the comparison: focus goes to that view. */
    if (doc.body.dataset.directoryView !== 'search') { var m = $('[role="main"]'); if (m) m.focus({ preventScroll: true }); return; }
    /* Otherwise back to the tile you came from, or to the tile of the house you ended on. */
    var r = order[at], back = r && $('#main [data-house="' + index.get(r) + '"]');
    var target = (opener && opener.isConnected && (!back || opener.closest('.fs-rail'))) ? opener : back;
    if (target) target.focus({ preventScroll: true });
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) { closeQuick(); return; }                       // the dimmed area around the sheet
    var nav = e.target.closest('.fq-nav'); if (nav) { step(+nav.dataset.step); return; }
    if (e.target.closest('.fq-close')) { closeQuick(); return; }
    /* Leaving for the full record or the comparison: the sheet steps aside. */
    if (e.target.closest('.fq-record, [data-compare-house]')) closeQuick();
  });
  dlg.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  /* Swipe sideways on a phone to step through houses. */
  var sx = null, sy = null;
  dlg.addEventListener('touchstart', function (e) { var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
  dlg.addEventListener('touchend', function (e) {
    if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  doc.addEventListener('click', function (e) {
    var open = e.target.closest('.fw-tile, .fs-tile, .fw-card-open');
    if (open) { openQuick(+open.dataset.house, open); return; }
    var heart = e.target.closest('[data-save]');
    if (heart) { toggleSaved(rows[+heart.dataset.save]); syncHearts(); }
  });
  window.SS_WALL = { open: openQuick, close: closeQuick };

  /* ---------- one toolbar: search · Filters · Saved · Tools ---------- */
  var tools = el('dialog', 'ft'); tools.id = 'fd-toolbox'; tools.setAttribute('aria-labelledby', 'ft-title');
  function buildTools() {
    var items = [
      ['a', '?view=explore', T('fd.ws.explore', 'Explore'), 'Browse by wardrobe, by street and by fabric.'],
      ['a', '?view=visit', T('fd.ws.visit', 'Plan a visit'), 'The district map, and a walking route between houses.'],
      ['a', '?view=compare', T('fd.ws.compare', 'Compare'), 'Put up to three houses side by side.', '<span data-compare-count></span>'],
      ['a', '?view=buy', T('fd.ws.board', 'Piece board'), 'Collect the exact pieces you like.'],
      ['button', 'tray', T('fd.basketlab', 'Tray'), 'Everything you saved or shortlisted, in one place.'],
      ['button', 'sig', T('fd.siglab', 'Signature'), 'Show only the designer houses eligible for The Signature.'],
      ['button', 'ask', 'Ask the directory', 'Describe what you are looking for in your own words.']
    ];
    tools.innerHTML = '<div class="ft-head"><h2 id="ft-title">' + esc(T('fd.wall.tools', 'Tools')) + '</h2>' +
      '<button type="button" class="fq-close" aria-label="' + esc(T('fd.wall.close', 'Close')) + '">' + ICON.close + '</button></div><ul class="ft-list">' +
      items.map(function (it) {
        var inner = '<span class="ft-name">' + esc(it[2]) + (it[4] ? ' ' + it[4] : '') + '</span><span class="ft-hint" lang="en">' + esc(it[3]) + '</span>';
        return '<li>' + (it[0] === 'a' ? '<a href="' + it[1] + '">' + inner + '</a>' : '<button type="button" data-tool="' + it[1] + '">' + inner + '</button>') + '</li>';
      }).join('') + '</ul>';
    var sig = $('#sigbtn'), mine = $('[data-tool="sig"]', tools);
    if (sig && mine) mine.setAttribute('aria-pressed', sig.getAttribute('aria-pressed') || 'false');
    if (window.SS_COMPARE) window.SS_COMPARE.sync();
  }
  var toolsOpener = null;
  function openTools(from) {
    buildTools(); toolsOpener = from || null;
    if (tools.showModal) tools.showModal(); else tools.setAttribute('open', '');
  }
  tools.addEventListener('close', function () { if (toolsOpener && toolsOpener.isConnected) toolsOpener.focus({ preventScroll: true }); });
  tools.addEventListener('click', function (e) {
    if (e.target === tools || e.target.closest('.fq-close')) { tools.close(); return; }
    if (e.target.closest('a')) { toolsOpener = null; tools.close(); return; }      // the workspace router takes the link
    var b = e.target.closest('[data-tool]'); if (!b) return;
    var which = b.dataset.tool; toolsOpener = null; tools.close();
    if (which === 'tray' && window.SS_BASKET) window.SS_BASKET.open();
    if (which === 'sig') { var s = $('#sigbtn'); if (s) s.click(); showWall(); }
    if (which === 'ask' && window.SS_DIRECTORY_GUIDE) window.SS_DIRECTORY_GUIDE.open();
  });

  function showWall() {
    if (doc.body.dataset.directoryView !== 'search' && window.SS_WORKSPACE) window.SS_WORKSPACE.show('search');
    var top = $('.fd-search-top'); if (top) top.scrollIntoView({ block: 'start' });
  }
  function labelled(cls, icon, text, fn) {
    var b = el('button', 'utilbtn ' + cls, icon + '<span>' + esc(text) + '</span>'); b.type = 'button';
    b.addEventListener('click', function () { fn(b); }); return b;
  }
  function init() {
    doc.body.append(tools);
    var util = $('.fd-search-top .util'), saved = $('#savedbtn');
    if (util) {
      var filters = labelled('fw-filters', ICON.filter, T('fd.ws.filters', 'Filters'), function () { window.SS_FD.openFilters(); });
      filters.setAttribute('aria-haspopup', 'dialog'); filters.setAttribute('aria-controls', 'sheet');
      var more = labelled('fw-tools', ICON.tools, T('fd.wall.tools', 'Tools'), openTools);
      more.setAttribute('aria-haspopup', 'dialog');
      util.prepend(filters); util.append(more);
    }
    /* The category row gets its frosted surface only while it is pinned to the top. */
    var bar0 = $('.fd-catbar');
    if (bar0 && 'IntersectionObserver' in window) {
      var mark = el('div', 'fd-catbar-mark'); mark.setAttribute('aria-hidden', 'true'); bar0.before(mark);
      new IntersectionObserver(function (es) { bar0.classList.toggle('is-stuck', !es[0].isIntersecting && es[0].boundingClientRect.top < 0); },
        { rootMargin: '-1px 0px 0px 0px', threshold: 0 }).observe(mark);
    }
    /* Phone bar: Search · Filters · Saved · Tools. (Search and Filters keep their handlers in js/directory.js.) */
    var bar = $('.tabbar');
    if (bar) bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'search') { showWall(); var q = $('#q'); if (q) setTimeout(function () { q.focus({ preventScroll: true }); }, 60); }
      if (b.dataset.act === 'saved') { if (saved) saved.click(); showWall(); }
      if (b.dataset.act === 'tools') openTools(b);
    });
    /* The Saved count and state on the phone bar mirror the one real Saved button. */
    var n = $('#savedcount'), bub = $('#tbsavedn'), tab = $('#tbsaved');
    function mirror() {
      if (n && bub) { var v = (n.textContent.match(/\d+/) || ['0'])[0]; bub.textContent = v; bub.hidden = v === '0'; }
      if (saved && tab) tab.setAttribute('aria-pressed', saved.getAttribute('aria-pressed') || 'false');
    }
    if (n) new MutationObserver(mirror).observe(n, { childList: true, characterData: true, subtree: true });
    if (saved) new MutationObserver(mirror).observe(saved, { attributes: true, attributeFilter: ['aria-pressed'] });
    mirror();
    doc.addEventListener('ss:lang', function () {
      var f = $('.fw-filters span'), t = $('.fw-tools span');
      if (f) f.textContent = T('fd.ws.filters', 'Filters'); if (t) t.textContent = T('fd.wall.tools', 'Tools');
      if (dlg.open) fill();
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();

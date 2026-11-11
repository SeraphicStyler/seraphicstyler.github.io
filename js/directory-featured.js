/* Seraphic Styler — the directory's front wall (7 Nov 2026).
   ------------------------------------------------------------------------
   Her decision: a first look of a few houses per occasion, each with one
   clear next step, and the full directory behind "See all". Shown only on
   the plain landing (no search, filter or other view open).

   EDIT HERE: the houses per occasion. Names must match js/directory-data.js
   exactly (the build check below logs any that don't). These are a starting
   selection, not "editor's picks": the page never calls them that.

   The next step per house follows the service lines:
     · house with its own web shop → Sourcing ("Found it on their site?
       Get my total"), with The Trace as the quiet alternative;
     · Instagram-only, appointment or made-to-measure houses → The Trace.  */
(function () {
  'use strict';
  var OCCASIONS = [
    { id: 'aodai', label: 'Áo dài', line: 'Ready-to-wear and made-to-measure áo dài. Most will make the trousers to your measurements.',
      houses: ['Thuy Design House', 'Áo Dài Võ Việt Chung', 'Áo Dài Couture by Anna Hạnh', 'Linh Phung', 'LAHAVA', 'KINZU (Áo Dài Song Toàn)', 'SH Silk Embroidery', 'Áo Dài Thím Ba'] },
    { id: 'bridal', label: 'Bridal', line: 'Gowns and bridal áo dài to own. Almost all by appointment, so these go through The Trace.',
      houses: ['Linh Nga Couture', 'Chung Thanh Phong', 'Le Thanh Hoa', 'PHUONG MY', 'Hacchic Couture', "Cee's Bridal", 'Nicole Bridal', 'Meera Meera'] },
    { id: 'evening', label: 'Evening & wedding guest', line: 'Gowns, cocktail and occasion dresses from Vietnam’s red-carpet names.',
      houses: ['Valenciani', 'VUNGOC&SON', 'Đỗ Long', 'SIXDO', 'Fancì Club', 'Chérieon', 'Rosee de Matin', 'CHYMEOCHY'] },
    { id: 'everyday', label: 'Everyday', line: 'Polished ready-to-wear from Sài Gòn’s favourite contemporary labels.',
      houses: ['caleélilou', 'Huelley', 'Jubin Studio', 'LSOUL', 'Libé', 'Cocosin', 'Nosbyn', 'Kathy Atelier'] },
    { id: 'men', label: 'Menswear', line: 'Linen, streetwear and tailoring, from everyday labels to Vietnam’s oldest tailor.',
      houses: ['Mêman', 'emdash', 'Routine', 'Môi Điên', 'Cao Minh Saigon', 'SIR Tailor', 'Degrey', 'ICONDENIM'] }
  ];
  /* Logos we already hold in icons/ (others get a lettered plate). */
  var LOGO = {
    'Linh Nga Couture': 'Linh Nga Couture.jpg', 'Chung Thanh Phong': 'Chung Thanh Phong.jpg', 'Le Thanh Hoa': 'Le Thanh Hoa .jpg',
    'Valenciani': 'Valenciani.jpg', 'VUNGOC&SON': 'VUNGOC&SON.jpg', 'Đỗ Long': 'Do Long.jpg', 'SIXDO': 'SIXDO .jpg',
    'Fancì Club': 'Fanci Club.jpg', 'Chérieon': 'Cherieon.webp', 'caleélilou': 'caleelilou.jpg', 'Huelley': 'Huelley.jpg',
    'Jubin Studio': 'Jubin Studio.jpg', 'LSOUL': 'LSOUL.jpg', 'Libé': 'Libe.jpg', 'Cocosin': 'Cocosin.jpg', 'Nosbyn': 'Nosbyn.jpg',
    'Kathy Atelier': 'Kathy Atelier.jpeg', 'Cao Minh Saigon': 'Cao Minh Saigon.png'
  };
  /* Occasions whose houses always need a conversation, whatever their website. */
  var ALWAYS_TRACE = { aodai: 1, bridal: 1, tailor: 1 };

  var rows = window.SS_DIRECTORY || [];
  var host = document.getElementById('fd-featured');
  var byName = {};
  rows.forEach(function (r) { byName[r.n] = r; });
  OCCASIONS.forEach(function (o) { o.houses.forEach(function (n) { if (!byName[n]) console.warn('[featured] not in directory-data.js:', n); }); });

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* A short, buyer-facing line: drop opening hours, phone numbers and "see IG" housekeeping. */
  function line(note) {
    var s = String(note || '')
      .replace(/☎[^.;]*/g, '').replace(/\b\d{1,2}[:.]\d{2}\s*[–-]\s*\d{1,2}[:.]\d{2}\b[^.;]*/g, '')
      .replace(/Hotline[^.;]*/gi, '').replace(/\s*\(verify\)/gi, '').replace(/\s{2,}/g, ' ').replace(/\s+([.;,])/g, '$1').replace(/([.;,])[.;,]+/g, '$1').trim();
    s = s.split(/(?<=[.;])\s/)[0].replace(/[;,]$/, '.').replace(/\.{2,}$/, '.');
    return s.length > 96 ? s.slice(0, 93).replace(/\s\S*$/, '') + '…' : s;
  }
  function area(r) {
    var a = String(r.area || '');
    if (/online/i.test(a)) return 'Online';
    if (r.city === 'HAN' || /hanoi/i.test(a)) return 'Hà Nội';
    return 'Sài Gòn' + (r.st === 'appt' ? ' · by appointment' : '');
  }
  function channel(r) {
    if (r.h) return { href: 'https://instagram.com/' + encodeURIComponent(r.h), label: '@' + r.h };
    if (r.w) { try { return { href: r.w, label: new URL(r.w).hostname.replace(/^www\./, '') }; } catch (e) {} }
    return null;
  }
  // The Trace price comes from js/pricing.js (loaded before this file), so this line can never fall behind it again.
  function tracePrice() {
    var P = window.SS_PRICING;
    return P && P.data && P.data.trace ? P.fmt.usd0(P.data.trace.usd) : '$50';
  }
  function next(r, occ) {
    var trace = 'https://tally.so/r/gD10Kl?about=' + encodeURIComponent('I need The Trace for item identification') + '&source=directory&house=' + encodeURIComponent(r.n);
    var shop = r.w && !ALWAYS_TRACE[occ] && !ALWAYS_TRACE[r.cat] && r.cat !== 'tailor' && r.st !== 'appt';
    if (shop) return '<a class="ff-go" href="estimate">Found it on their site? Get my total <span aria-hidden="true">→</span></a>' +
      '<a class="ff-alt" href="' + trace + '">Only a photo? The Trace</a>';
    return '<a class="ff-go" href="' + trace + '">Trace a piece from here <span aria-hidden="true">→</span></a>' +
      '<span class="ff-alt-note">The Trace · ' + tracePrice() + ', paid first</span>';
  }
  function plate(r) {
    var f = LOGO[r.n] || (window.SS_HOUSE_LOGOS || {})[r.n];
    if (f) return '<span class="ff-plate"><img src="icons/' + encodeURIComponent(f) + '" alt="" loading="lazy" decoding="async" width="56" height="56"></span>';
    var letters = r.n.replace(/\(.*?\)/g, '').replace(/^(Áo Dài|Ao Dai)\s+/i, '').replace(/^Couture by\s+/i, '').trim().split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('');
    return '<span class="ff-plate ff-mono" aria-hidden="true">' + esc(letters.toUpperCase()) + '</span>';
  }
  function tile(r, occ) {
    var ch = channel(r);
    return '<li class="ff-tile">' + plate(r) +
      '<div class="ff-body"><h3 class="ff-name">' + esc(r.n) + '</h3>' +
      '<p class="ff-where">' + esc(area(r)) + (ch ? ' · <a href="' + esc(ch.href) + '" target="_blank" rel="noopener noreferrer">' + esc(ch.label) + ' <span aria-hidden="true">↗</span></a>' : '') + '</p>' +
      '<p class="ff-note">' + esc(line(r.no)) + '</p></div>' +
      '<div class="ff-next">' + next(r, occ) + '</div></li>';
  }

  /* The same card for search results (js/directory-workspace.js renders through this). */
  var CAT = { women: 'Womenswear', men: 'Menswear', tailor: 'Áo dài & tailoring', bridal: 'Bridal', luxury: 'Luxury & couture', access: 'Accessories',
    vintage: 'Vintage', active: 'Activewear', sleep: 'Loungewear', market: 'Markets', lingerie: 'Lingerie' };
  window.SS_HOUSE_CARD = function (r) {
    var li = document.createElement('li'); li.className = 'ff-tile ff-result';
    li.innerHTML = tile(r, '').replace(/^<li class="ff-tile">|<\/li>$/g, '');
    var where = li.querySelector('.ff-where');
    if (where && CAT[r.cat]) where.insertAdjacentHTML('beforebegin', '<p class="ff-cat">' + esc(CAT[r.cat]) +
      (r.tier && r.tier !== 'none' ? ' <span class="ff-tier">' + esc(r.tier) + '</span>' : '') + '</p>');
    return li;
  };
  if (!host || !rows.length) return;

  var total = rows.length;
  host.innerHTML =
    '<div class="ff-head"><p class="eyebrow">Start with the occasion</p>' +
    '<h2 id="ff-title">Find a Vietnamese house in a minute.</h2>' +
    '<p class="ff-lede">Pick what you are dressing for. Each house has one next step: a link with a price is <strong>Sourcing</strong>; a photo, a post or a custom size is <strong>The Trace</strong>.</p></div>' +
    '<div class="ff-tabs" role="tablist" aria-label="Occasions">' +
    OCCASIONS.map(function (o, i) {
      return '<button type="button" role="tab" id="ff-tab-' + o.id + '" aria-controls="ff-panel-' + o.id + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + esc(o.label) + '</button>';
    }).join('') + '</div>' +
    OCCASIONS.map(function (o, i) {
      var list = o.houses.map(function (n) { return byName[n]; }).filter(Boolean);
      return '<section class="ff-panel" role="tabpanel" id="ff-panel-' + o.id + '" aria-labelledby="ff-tab-' + o.id + '"' + (i ? ' hidden' : '') + '>' +
        '<p class="ff-line">' + esc(o.line) + '</p><ol class="ff-grid">' + list.map(function (r) { return tile(r, o.id); }).join('') + '</ol></section>';
    }).join('') +
    '<p class="ff-all"><a href="#main" data-ff-all>See all ' + total + ' houses, with search and filters <span aria-hidden="true">↓</span></a></p>';

  /* Tabs: click + arrow keys (roving tabindex). */
  var tabs = Array.prototype.slice.call(host.querySelectorAll('[role="tab"]'));
  function select(t, focus) {
    tabs.forEach(function (b) {
      var on = b === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (j == null) return; e.preventDefault(); select(tabs[(j + tabs.length) % tabs.length], true);
    });
  });

  /* Only on the plain landing: hide while searching, filtering or in another view. */
  var q = document.getElementById('q');
  function sync() {
    var view = document.body.dataset.directoryView || 'search';
    var h = location.hash.slice(1);
    var busy = view !== 'search' || /(^|&)(q|cat|city|tier|fib|occ|zone|walk|saved|sig)=[^&]+/.test(h) || (q && q.value.trim());
    host.hidden = !!busy;
  }
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-directory-view'] });
  addEventListener('hashchange', sync); addEventListener('popstate', sync);
  if (q) q.addEventListener('input', function () { setTimeout(sync, 300); });
  /* Filters and search rewrite the URL with replaceState (no event), but always re-render the results. */
  var main = document.getElementById('main');
  if (main) new MutationObserver(function () { setTimeout(sync, 0); }).observe(main, { childList: true });
  sync();
})();

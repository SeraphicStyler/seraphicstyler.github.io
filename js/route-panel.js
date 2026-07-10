/* ============================================================================
   route-panel.js — "Plan my route" UI for the Saigon fashion directory.
   Self-bootstrapping: injects its own styles + trigger + modal, reads the shared
   globals (SS_DIRECTORY, SS_COORDS, SS_ROUTE) and the saved shortlist from
   localStorage, and reuses the page's real zoneOf()/match() via window.SS_FD.
   The only edits to fashion-directory.html are the two <script> includes and the
   one-line SS_FD hook. Themes automatically via the page's CSS variables.
   ========================================================================== */
(function () {
  'use strict';
  function boot() {
    var R = window.SS_ROUTE, DIR = window.SS_DIRECTORY, CO = window.SS_COORDS;
    if (!R || !DIR || !CO) { console.warn('[route-panel] missing deps (SS_ROUTE/SS_DIRECTORY/SS_COORDS)'); return; }
    var FD = window.SS_FD || {};

    /* Labels are baked into the markup at build time, so a language switch has to
       rebuild the widget. Drop any previous instance before creating a new one. */
    var prev = document.querySelectorAll('.ssrp-open, .ssrp-ov');
    for (var i = 0; i < prev.length; i++) prev[i].remove();
    var VI = function () { return document.documentElement.getAttribute('lang') === 'vi'; };
    /* Chrome resolves through the page's language bundle (js/i18n/fd.<lang>.js) when one
       is loaded; the inline en/vi pair stays as the fallback, so this file still works on
       pages that use the older i18n engine. Keys are slugged from the English string —
       tools/i18n derives the same slug when it extracts them, so the two cannot drift. */
    var slug = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40); };
    var T = function (en, vi) {
      var fallback = VI() && vi ? vi : en;
      return window.SS_T ? window.SS_T('fd.rp.' + slug(en), fallback) : fallback;
    };

    // Popular, easy-to-find start points — the average traveler doesn't begin at Chợ Bà Chiểu
    var START_POINTS = [
      { id: 'benthanh', n: 'Bến Thành Market', lat: 10.7723, lng: 106.6980 },
      { id: 'notredame', n: 'Notre-Dame · Đồng Khởi', lat: 10.7798, lng: 106.6990 },
      { id: 'turtlelake', n: 'Hồ Con Rùa (Turtle Lake)', lat: 10.7827, lng: 106.6957 },
      { id: 'bachieu', n: 'Chợ Bà Chiểu', lat: 10.8016, lng: 106.6967 },
      { id: 'thaodien', n: 'Thảo Điền', lat: 10.8040, lng: 106.7360 }
    ];
    function startById(id) { for (var i = 0; i < START_POINTS.length; i++) if (START_POINTS[i].id === id) return START_POINTS[i]; return START_POINTS[0]; }

    // Six curated, elegantly-named "signature routes" — sequenced for a relaxed, walkable
    // browsing pace (generous dwell, tight clusters). Each carries a story for content.
    var PRESETS = [
      { id: 'p-tandinh', name: 'The Tân Định Morning', desc: '6 stops · walk · a gentle Hai Bà Trưng stroll',
        story: 'Begin where three labels share one door at 214 Hai Bà Trưng, then drift up the Tân Định corridor — a slow, feminine morning of romantic ready-to-wear and soft tailoring, taken before the heat arrives.',
        start: 'benthanh', mode: 'walk', dwell: 35,
        stores: ['Huelley Rose', 'Huelley', 'Stress Mama', 'Moodswings', 'Jenéa by Jenny', 'Floralpunk'] },
      { id: 'p-strip', name: 'The Design Strip', desc: '8 stops · walk · District 3’s one leafy lane',
        story: 'The single most concentrated design block in the city. Park once on Trần Quang Diệu and wander Kathy Atelier, Laneci and their neighbours on foot — the most relaxed, highest-yield hour in Saigon fashion.',
        start: 'turtlelake', mode: 'walk', dwell: 35,
        stores: ['Kathy Atelier', 'BaaBeeBoo', 'Laneci', 'Moulin Rose', 'Chan Club', 'Rêver', '18 Again', 'Whose Studio'] },
      { id: 'p-benthanh', name: 'The Bến Thành Circuit', desc: '6 stops · walk · the central icons',
        story: 'The names everyone asks for — Clothes Bar, Wephobia, OnOnMM — laced into a compact loop around Bến Thành Market, easy to fold into a single unhurried afternoon downtown.',
        start: 'benthanh', mode: 'walk', dwell: 30,
        stores: ['Clothes Bar', 'Wephobia', 'OnOnMM ®', 'Enuff Studio', 'CEM — Chị Em Mình', 'Nosbyn'] },
      { id: 'p-riverside', name: 'Riverside · Thảo Điền', desc: '5 stops · ride · the leafy east',
        story: 'Cross the river to Saigon’s calmest quarter. Fancì Club and Nosbyn’s studio sit among specialty coffee and shade trees — a route built for lingering over iced cà phê, not rushing.',
        start: 'thaodien', mode: 'bike', dwell: 35,
        stores: ['Nosbyn Studio', 'Fancì Club', 'Olaben', 'A Dong Silk', 'ONWAYS'] },
      { id: 'p-phunhuan', name: 'Phú Nhuận Creative', desc: '6 stops · ride · a café-and-concept afternoon',
        story: 'A gentle Phú Nhuận wander through founder-run labels, anchored by the 11 Garmentory creative hub and its café — the kind of afternoon that ends, naturally, over coffee.',
        start: 'bachieu', mode: 'bike', dwell: 35,
        stores: ['The Fancé', 'Tiela', 'L\'Espoir', 'Chou Chou', 'By Vee', 'Moon Me'] },
      { id: 'p-grand', name: 'The Grand Tour', desc: '7 stops · ride · the best of every district',
        story: 'If you have a single day, this is it: a Tân Định opener, the District 3 design strip, a Phú Nhuận café stop and a river crossing to Thảo Điền — the whole city, gracefully sequenced.',
        start: 'benthanh', mode: 'bike', dwell: 25,
        stores: ['Huelley Rose', 'Moodswings', 'Kathy Atelier', 'Moulin Rose', 'The Fancé', 'Nosbyn Studio', 'Fancì Club'] }
    ];

    /* ---- helpers ---- */
    function coordFor(b) { return CO[b.n]; }
    function zoneOf(b) { return FD.zoneOf ? FD.zoneOf(b) : localZoneOf(b); }
    function localZoneOf(b) { // fallback mirror of the page's zoneOf
      if (b.city !== 'SGN') return null; var a = b.area || '';
      if (/Thảo Điền|Thủ Đức/.test(a)) return 'td'; if (/Phú Nhuận/.test(a)) return 'pn';
      if (/Tân Phú/.test(a)) return 'tp'; if (/Tân Bình/.test(a)) return 'tb'; if (/Gò Vấp/.test(a)) return 'gv';
      if (/Bình Thạnh/.test(a)) return 'bt'; if (/Q5|Chợ Lớn|Chợ Quán/.test(a)) return 'q5';
      if (/D1|Đồng Khởi|Bến Thành|Bến Nghé|Tân Định|Đa Kao|Sài Gòn ward|Ký Con/.test(a)) return 'd1';
      if (/D3|Bàn Cờ|Nhiêu Lộc|Võ Thị Sáu/.test(a)) return 'd3'; return 'other';
    }
    var ZONELABEL = { d1: 'District 1', d3: 'District 3', pn: 'Phú Nhuận', bt: 'Bình Thạnh', td: 'Thảo Điền', q5: 'Q5 · Chợ Lớn', gv: 'Gò Vấp', tb: 'Tân Bình', tp: 'Tân Phú', other: 'Other' };

    function savedIds() { try { return new Set(JSON.parse(localStorage.getItem('fd-saved') || '[]')); } catch (e) { return new Set(); } }
    function bid(b) { return b.h || b.n; }

    // routeable directory entries (Saigon, has a coord)
    function routeable(list) { return list.filter(function (b) { return coordFor(b); }); }
    function seedSaved() { var s = savedIds(); return routeable(DIR.filter(function (b) { return s.has(bid(b)); })); }
    function seedFilter() { var m = FD.match || null; return routeable(DIR.filter(function (b) { return b.city === 'SGN' && (m ? m(b) : b.st === 'walk'); })); }
    function seedZone(z) { return routeable(DIR.filter(function (b) { return zoneOf(b) === z; })); }
    function zoneCounts() { var c = {}; DIR.forEach(function (b) { if (b.st === 'online' || !coordFor(b)) return; var z = zoneOf(b); if (z) c[z] = (c[z] || 0) + 1; }); return c; }

    /* ---- Google Maps multi-stop deep link (chunked past 10 stops) ---- */
    function pt(s) { return s.lat + ',' + s.lng; }
    function gmapsLinks(ordered) {
      var links = [], MAX = 10; // origin + up to 9 waypoints + destination fits the free deep link
      for (var i = 0; i < ordered.length; i += MAX - 1) {
        var chunk = ordered.slice(i, i + MAX);
        if (chunk.length < 2) break;
        var o = chunk[0], d = chunk[chunk.length - 1], mid = chunk.slice(1, -1);
        var u = 'https://www.google.com/maps/dir/?api=1&origin=' + pt(o) + '&destination=' + pt(d) +
          (mid.length ? '&waypoints=' + mid.map(pt).join('%7C') : '') + '&travelmode=driving';
        links.push(u);
        if (i + MAX >= ordered.length + 1) break;
      }
      return links;
    }

    /* ---- aspect-preserving projection of lat/lng into an SVG box ---- */
    function project(stops, W, H, pad) {
      var las = stops.map(function (s) { return s.lat; }), los = stops.map(function (s) { return s.lng; });
      var minLa = Math.min.apply(0, las), maxLa = Math.max.apply(0, las), minLo = Math.min.apply(0, los), maxLo = Math.max.apply(0, los);
      var spanLa = Math.max(maxLa - minLa, 0.004), spanLo = Math.max(maxLo - minLo, 0.004);
      var scale = Math.min((W - 2 * pad) / spanLo, (H - 2 * pad) / spanLa);
      var offX = (W - spanLo * scale) / 2, offY = (H - spanLa * scale) / 2;
      return stops.map(function (s) { return { x: offX + (s.lng - minLo) * scale, y: offY + (maxLa - s.lat) * scale }; });
    }

    function fmtVND(n) { return n.toLocaleString('vi-VN') + '₫'; }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

    /* ---- styles ---- */
    var css = document.createElement('style');
    css.id = 'ssrp-css';
    css.textContent = [
      '.ssrp-open{position:fixed;right:1.25rem;bottom:1.25rem;z-index:40;display:inline-flex;gap:.5em;align-items:center;',
      'padding:.62rem 1.1rem;border-radius:999px;border:1px solid rgba(255,255,255,.18);',
      'background:linear-gradient(135deg,var(--cobalt,#2e54ad),var(--peri,#8a93de));color:#fff;font-family:var(--font-body);',
      'font-size:.82rem;font-weight:600;letter-spacing:.02em;cursor:pointer;box-shadow:0 14px 32px -14px rgba(46,84,173,.6);',
      'transition:transform .32s cubic-bezier(.22,1,.36,1),box-shadow .32s ease}',
      '.ssrp-open:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 20px 40px -14px rgba(46,84,173,.72)}',
      '.ssrp-ov{position:fixed;inset:0;z-index:60;background:rgba(20,28,54,.44);backdrop-filter:blur(3px);display:flex;',
      'align-items:flex-start;justify-content:center;padding:4vh 3vw;overflow:auto}',
      '.ssrp-ov[hidden]{display:none}',
      '.ssrp-modal{width:min(920px,100%);background:var(--paper,#fff);color:var(--ink,#233a72);border-radius:var(--r,18px);',
      'border:1px solid var(--line,rgba(46,71,115,.14));box-shadow:var(--shadow,0 22px 48px -34px rgba(35,58,114,.45));',
      'font-family:var(--font-body);overflow:hidden}',
      '.ssrp-hd{display:flex;align-items:center;justify-content:space-between;padding:1.1em 1.3em;',
      'border-bottom:1px solid var(--line-soft,rgba(46,71,115,.08))}',
      '.ssrp-hd h2{margin:0;font-family:var(--font-display);font-weight:400;font-size:1.28rem;letter-spacing:.01em}',
      '.ssrp-hd .sub{font-size:.76rem;color:var(--ink-soft,#51618f);margin-top:.15em}',
      '.ssrp-x{border:0;background:none;font-size:1.5rem;line-height:1;color:var(--ink-faint,#8b97b8);cursor:pointer;padding:.1em .3em}',
      '.ssrp-body{padding:1.2em 1.3em;display:grid;gap:1.1em}',
      '.ssrp-row{display:flex;flex-wrap:wrap;gap:.5em .7em;align-items:center}',
      '.ssrp-lab{font-size:.7rem;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-faint,#8b97b8);width:100%;margin-bottom:-.2em}',
      '.ssrp-chip{padding:.42em .85em;border-radius:var(--r-pill,999px);border:1px solid var(--line,rgba(46,71,115,.14));',
      'background:var(--card-solid,#fff);color:var(--ink-soft,#51618f);font-size:.8rem;cursor:pointer;font-family:inherit}',
      '.ssrp-chip[aria-pressed="true"]{background:var(--cobalt,#2e54ad);color:#fff;border-color:var(--cobalt,#2e54ad)}',
      '.ssrp-chip:disabled{opacity:.4;cursor:not-allowed}',
      '.ssrp-preset{display:flex;flex-direction:column;align-items:flex-start;gap:.1em;text-align:left;padding:.6em .95em;min-width:150px;flex:1 1 180px}',
      '.ssrp-preset b{font-family:var(--font-display);font-weight:400;font-size:.94rem;color:var(--ink,#233a72)}',
      '.ssrp-preset span{font-size:.68rem;color:var(--ink-faint,#8b97b8);line-height:1.35}',
      '.ssrp-preset:hover{border-color:var(--cobalt,#2e54ad)}',
      '.ssrp-hr{display:flex;align-items:center;text-align:center;gap:.8em;color:var(--ink-faint,#8b97b8);font-size:.7rem;text-transform:uppercase;letter-spacing:.08em}',
      '.ssrp-hr:before,.ssrp-hr:after{content:"";flex:1;height:1px;background:var(--line-soft,rgba(46,71,115,.08))}',
      '.ssrp-field{display:inline-flex;align-items:center;gap:.4em;font-size:.8rem;color:var(--ink-soft,#51618f)}',
      '.ssrp-field select,.ssrp-field input{font-family:inherit;font-size:.8rem;padding:.4em .55em;border-radius:var(--r-sm,12px);',
      'border:1px solid var(--line,rgba(46,71,115,.14));background:var(--paper,#fff);color:var(--ink,#233a72)}',
      '.ssrp-go{padding:.75em 1.5em;border-radius:var(--r-pill,999px);border:0;cursor:pointer;font-family:inherit;font-weight:600;',
      'font-size:.9rem;color:#fff;background:linear-gradient(135deg,var(--cobalt,#2e54ad),var(--peri,#8a93de))}',
      '.ssrp-go:disabled{opacity:.45;cursor:not-allowed}',
      '.ssrp-out{display:grid;gap:1em}',
      '.ssrp-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:.6em}',
      '.ssrp-stat{background:var(--ice,#eef3fb);border:1px solid var(--line-soft,rgba(46,71,115,.08));border-radius:var(--r-sm,12px);padding:.7em .8em}',
      '.ssrp-stat b{display:block;font-family:var(--font-display);font-size:1.25rem;font-weight:400;color:var(--ink,#233a72)}',
      '.ssrp-stat span{font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-faint,#8b97b8)}',
      '.ssrp-badge{display:inline-block;font-size:.68rem;padding:.25em .7em;border-radius:999px;background:rgba(46,84,173,.1);',
      'color:var(--cobalt,#2e54ad);font-weight:600}',
      '.ssrp-routehd{border-left:3px solid var(--peri,#8a93de);padding:.1em 0 .1em .9em}',
      '.ssrp-routehd h3{margin:0;font-family:var(--font-display);font-weight:400;font-size:1.18rem;color:var(--ink,#233a72)}',
      '.ssrp-routehd p{margin:.35em 0 0;font-size:.82rem;line-height:1.55;color:var(--ink-soft,#51618f)}',
      '.ssrp-map{width:100%;height:auto;background:var(--ice,#eef3fb);border-radius:var(--r-sm,12px);border:1px solid var(--line-soft,rgba(46,71,115,.08))}',
      '.ssrp-list{list-style:none;margin:0;padding:0;display:grid;gap:.1em}',
      '.ssrp-it{display:grid;grid-template-columns:auto 1fr auto;gap:.7em;align-items:start;padding:.6em .2em;',
      'border-bottom:1px solid var(--line-soft,rgba(46,71,115,.08))}',
      '.ssrp-num{width:1.7em;height:1.7em;border-radius:50%;display:grid;place-items:center;font-size:.78rem;font-weight:600;',
      'background:var(--cobalt,#2e54ad);color:#fff}',
      '.ssrp-it.hub .ssrp-num{background:var(--ink-faint,#8b97b8)}',
      '.ssrp-it .nm{font-weight:600;font-size:.9rem}',
      '.ssrp-it .meta{font-size:.74rem;color:var(--ink-soft,#51618f)}',
      '.ssrp-it .leg{font-size:.72rem;color:var(--ink-faint,#8b97b8);text-align:right;white-space:nowrap}',
      '.ssrp-warn{color:var(--orchid,#c98fc4);font-size:.72rem;margin-top:.15em}',
      '.ssrp-approx{color:var(--ink-faint,#8b97b8);font-size:.68rem}',
      '.ssrp-acts{display:flex;flex-wrap:wrap;gap:.6em}',
      '.ssrp-acts a,.ssrp-acts button{text-decoration:none;padding:.6em 1.1em;border-radius:var(--r-pill,999px);font-size:.8rem;',
      'font-family:inherit;cursor:pointer;border:1px solid var(--line,rgba(46,71,115,.14));background:var(--card-solid,#fff);color:var(--cobalt,#2e54ad);font-weight:600}',
      '.ssrp-acts a.pri{background:var(--cobalt,#2e54ad);color:#fff;border-color:var(--cobalt,#2e54ad)}',
      '.ssrp-empty{color:var(--ink-soft,#51618f);font-size:.85rem;padding:.6em 0}',
      '@media(prefers-color-scheme:dark){.ssrp-ov{background:rgba(4,6,14,.6)}}'
    ].join('');
    if (!document.getElementById('ssrp-css')) document.head.appendChild(css);

    /* ---- build trigger + modal ---- */
    var openBtn = document.createElement('button');
    openBtn.className = 'ssrp-open'; openBtn.type = 'button';
    openBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 20l-5.4 1.8L4 4l5 3 6-3 5.4-1.8L19 20l-5 3-5-3z"/><path d="M9 7v13M15 4v13"/></svg><span>' + T('Plan a route', 'Lên lộ trình') + '</span>';
    document.body.appendChild(openBtn);

    var ov = document.createElement('div'); ov.className = 'ssrp-ov'; ov.hidden = true;
    ov.innerHTML =
      '<div class="ssrp-modal" role="dialog" aria-modal="true" aria-label="Route planner">' +
      '<div class="ssrp-hd"><div><h2>' + T('Plan my route', 'Lộ trình mua sắm') + '</h2>' +
      '<div class="sub">' + T('Optimized visiting order across your stops — traffic-aware, HCMC.', 'Thứ tự ghé tối ưu — có tính kẹt xe, HCMC.') + '</div></div>' +
      '<button class="ssrp-x" aria-label="Close">×</button></div>' +
      '<div class="ssrp-body">' +
      '<div><div class="ssrp-lab">' + T('Popular routes — one tap', 'Lộ trình gợi ý — một chạm') + '</div><div class="ssrp-row" id="ssrp-presets"></div></div>' +
      '<div class="ssrp-hr"><span>' + T('or build your own', 'hoặc tự tạo') + '</span></div>' +
      '<div><div class="ssrp-lab">' + T('Stops from', 'Nguồn điểm dừng') + '</div><div class="ssrp-row" id="ssrp-seed"></div></div>' +
      '<div class="ssrp-row" id="ssrp-opts"></div>' +
      '<div class="ssrp-row"><button class="ssrp-go" id="ssrp-run">' + T('Optimize route', 'Tối ưu lộ trình') + '</button>' +
      '<span id="ssrp-seedcount" class="ssrp-field"></span></div>' +
      '<div class="ssrp-out" id="ssrp-out"></div>' +
      '</div></div>';
    document.body.appendChild(ov);

    var out = ov.querySelector('#ssrp-out');
    var seedWrap = ov.querySelector('#ssrp-seed');
    var optsWrap = ov.querySelector('#ssrp-opts');
    var seedCountEl = ov.querySelector('#ssrp-seedcount');

    /* state */
    var state = { seed: 'saved', zone: 'd1', mode: 'bike', start: 'benthanh', startMin: 540, roundTrip: true, dwell: 25, geo: null };

    function currentStops() {
      if (state.seed === 'saved') return seedSaved();
      if (state.seed === 'filter') return seedFilter();
      return seedZone(state.zone);
    }
    function chip(label, pressed, on, dis) {
      var b = document.createElement('button'); b.className = 'ssrp-chip'; b.type = 'button';
      b.setAttribute('aria-pressed', pressed ? 'true' : 'false'); b.textContent = label; if (dis) b.disabled = true;
      b.addEventListener('click', on); return b;
    }

    function renderPresets() {
      var wrap = ov.querySelector('#ssrp-presets'); wrap.innerHTML = '';
      PRESETS.forEach(function (p) {
        var b = document.createElement('button'); b.className = 'ssrp-chip ssrp-preset'; b.type = 'button';
        b.innerHTML = '<b>' + p.name + '</b><span>' + p.desc + '</span>';
        b.addEventListener('click', function () { runPreset(p); });
        wrap.appendChild(b);
      });
    }
    function runPreset(p) {
      state.start = p.start;
      if (p.mode) state.mode = p.mode;
      if (p.dwell != null) state.dwell = p.dwell;
      renderOpts(); // reflect the route's relaxing mode / dwell / start in the controls
      var picks = p.stores.map(function (nm) { return DIR.filter(function (b) { return b.n === nm; })[0]; }).filter(function (b) { return b && coordFor(b); });
      if (picks.length < 2) { out.innerHTML = '<div class="ssrp-empty">' + T('This route is unavailable right now.', 'Lộ trình này hiện chưa sẵn sàng.') + '</div>'; return; }
      out.innerHTML = '<div class="ssrp-empty">' + T('Optimizing…', 'Đang tối ưu…') + '</div>';
      var start = startById(p.start);
      var stops = [{ n: start.n, lat: start.lat, lng: start.lng, isHub: true }].concat(
        picks.map(function (b) { var c = coordFor(b); return { n: b.n, area: b.area, tier: b.tier, lat: c.lat, lng: c.lng, hours: c.hours, approx: c.approx }; }));
      var plan;
      try { plan = R.solve(stops, { mode: state.mode, startMin: state.startMin, roundTrip: state.roundTrip, dwellMin: state.dwell, originIsStop: false }); }
      catch (e) { out.innerHTML = '<div class="ssrp-empty">Error: ' + esc(e.message) + '</div>'; return; }
      renderPlan(plan, stops, p);
    }
    function renderSeed() {
      seedWrap.innerHTML = '';
      var nSaved = seedSaved().length, nFilter = seedFilter().length;
      seedWrap.appendChild(chip(T('Saved shortlist', 'Đã lưu') + ' (' + nSaved + ')', state.seed === 'saved', function () { state.seed = 'saved'; syncSeed(); }, nSaved === 0));
      seedWrap.appendChild(chip(T('Current filter', 'Bộ lọc hiện tại') + ' (' + nFilter + ')', state.seed === 'filter', function () { state.seed = 'filter'; syncSeed(); }));
      var zoneSel = document.createElement('select');
      var counts = zoneCounts();
      Object.keys(ZONELABEL).forEach(function (z) { if (!counts[z]) return; var o = document.createElement('option'); o.value = z; o.textContent = ZONELABEL[z] + ' (' + counts[z] + ')'; if (z === state.zone) o.selected = true; zoneSel.appendChild(o); });
      zoneSel.addEventListener('change', function () { state.zone = zoneSel.value; state.seed = 'district'; syncSeed(); });
      var zc = chip(T('By district', 'Theo quận') + ':', state.seed === 'district', function () { state.seed = 'district'; syncSeed(); });
      var wrap = document.createElement('span'); wrap.className = 'ssrp-field'; wrap.appendChild(zc); wrap.appendChild(zoneSel);
      seedWrap.appendChild(wrap);
    }
    function syncSeed() { renderSeed(); var n = currentStops().length; seedCountEl.textContent = n + ' ' + T('routeable stop' + (n === 1 ? '' : 's'), 'điểm dừng'); }

    function renderOpts() {
      optsWrap.innerHTML = '';
      optsWrap.innerHTML =
        '<span class="ssrp-field">' + T('Mode', 'Phương tiện') + ': <span id="ssrp-mode"></span></span>' +
        '<label class="ssrp-field">' + T('Start', 'Xuất phát') + ' <select id="ssrp-start">' + START_POINTS.map(function (s) { return '<option value="' + s.id + '">' + s.n + '</option>'; }).join('') + '<option value="geo">' + T('My location', 'Vị trí của tôi') + '</option></select></label>' +
        '<label class="ssrp-field">' + T('Depart', 'Giờ đi') + ' <input type="time" id="ssrp-time" value="' + R.hm(state.startMin) + '"></label>' +
        '<label class="ssrp-field"><input type="checkbox" id="ssrp-rt"' + (state.roundTrip ? ' checked' : '') + '> ' + T('Round trip', 'Khứ hồi') + '</label>' +
        '<label class="ssrp-field">' + T('Min/shop', 'Phút/điểm') + ' <input type="number" id="ssrp-dwell" value="' + state.dwell + '" min="0" max="180" style="width:4em"></label>';
      var modeWrap = optsWrap.querySelector('#ssrp-mode');
      [['bike', T('Bike', 'Xe máy')], ['car', T('Car', 'Ô tô')], ['walk', T('Walk', 'Đi bộ')]].forEach(function (m) {
        modeWrap.appendChild(chip(m[1], state.mode === m[0], function () { state.mode = m[0]; renderOpts(); }));
      });
      optsWrap.querySelector('#ssrp-start').value = state.start;
      optsWrap.querySelector('#ssrp-start').addEventListener('change', function (e) { state.start = e.target.value; });
      optsWrap.querySelector('#ssrp-time').addEventListener('change', function (e) { var p = e.target.value.split(':'); state.startMin = (+p[0]) * 60 + (+p[1]); });
      optsWrap.querySelector('#ssrp-rt').addEventListener('change', function (e) { state.roundTrip = e.target.checked; });
      optsWrap.querySelector('#ssrp-dwell').addEventListener('change', function (e) { state.dwell = Math.max(0, +e.target.value || 0); });
    }

    function getStart(cb) {
      if (state.start === 'geo' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (p) { cb({ n: T('My location', 'Vị trí của tôi'), lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }); },
          function () { cb(startById('benthanh')); }, { timeout: 8000 });
      } else cb(startById(state.start));
    }

    function run() {
      var picks = currentStops();
      if (picks.length < 2) { out.innerHTML = '<div class="ssrp-empty">' + T('Pick at least 2 stops with a known location. Save some houses first, or choose a busier district.', 'Chọn ít nhất 2 điểm có vị trí. Hãy lưu vài nhà mốt hoặc chọn quận đông hơn.') + '</div>'; return; }
      out.innerHTML = '<div class="ssrp-empty">' + T('Optimizing…', 'Đang tối ưu…') + '</div>';
      getStart(function (start) {
        var stops = [{ n: start.n, lat: start.lat, lng: start.lng, isHub: true }].concat(
          picks.map(function (b) { var c = coordFor(b); return { n: b.n, area: b.area, tier: b.tier, lat: c.lat, lng: c.lng, hours: c.hours, approx: c.approx }; }));
        var plan;
        try { plan = R.solve(stops, { mode: state.mode, startMin: state.startMin, roundTrip: state.roundTrip, dwellMin: state.dwell, originIsStop: false }); }
        catch (e) { out.innerHTML = '<div class="ssrp-empty">Error: ' + esc(e.message) + '</div>'; return; }
        renderPlan(plan, stops);
      });
    }

    function tod(min) { return R.hm(min); }
    function renderPlan(plan, stops, preset) {
      var n = plan.stops.length;
      var routehd = preset ? '<div class="ssrp-routehd"><h3>' + esc(preset.name) + '</h3><p>' + esc(preset.story) + '</p></div>' : '';
      // stats (fares intentionally omitted — Grab prices vary too much to quote)
      var stats = '<div class="ssrp-stats">' +
        stat(plan.totalKm + ' km', T('total distance', 'tổng quãng đường')) +
        stat(plan.durationText, T('door-to-done', 'tổng thời gian')) +
        stat(plan.etaText, T('finish by', 'kết thúc lúc')) +
        stat(String(n - 1), T('stops', 'điểm dừng')) +
        '</div>';
      var badge = '<span class="ssrp-badge">' + (plan.improvedFrom.pct > 0 ? '−' + plan.improvedFrom.pct + '% ' + T('vs listed order', 'so với thứ tự ban đầu') : T('already optimal', 'đã tối ưu')) + '</span> ' +
        '<span class="ssrp-badge" title="algorithm">' + plan.method + '</span>';

      // map
      var proj = project(plan.stops, 900, 470, 40);
      var poly = proj.map(function (p) { return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + (plan.roundTrip ? ' ' + proj[0].x.toFixed(1) + ',' + proj[0].y.toFixed(1) : '');
      var dots = proj.map(function (p, i) {
        var s = plan.stops[i], hub = s.isHub;
        return '<g><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (hub ? 9 : 12) + '" fill="' + (hub ? '#8b97b8' : '#2e54ad') + '" stroke="#fff" stroke-width="2"/>' +
          '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 4).toFixed(1) + '" font-size="12" fill="#fff" text-anchor="middle" font-family="Montserrat,sans-serif">' + (hub ? '★' : i) + '</text></g>';
      }).join('');
      var svg = '<svg class="ssrp-map" viewBox="0 0 900 470" role="img" aria-label="Route map">' +
        '<polyline points="' + poly + '" fill="none" stroke="url(#ssrpg)" stroke-width="3" stroke-linejoin="round" stroke-dasharray="1 0" opacity=".8"/>' +
        '<defs><linearGradient id="ssrpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e54ad"/><stop offset="1" stop-color="#c98fc4"/></linearGradient></defs>' +
        dots + '</svg>';

      // itinerary
      var vios = {}; plan.window.violations.forEach(function (v) { vios[v.i] = v; });
      var items = plan.stops.map(function (s, i) {
        var leg = plan.legs[i]; // leg from stop i to i+1 (last leg on round trip returns to hub)
        var legTxt = leg ? (leg.km.toFixed(1) + ' km · ' + Math.round(leg.min) + ' min') : '';
        var v = vios[i], warn = '';
        if (v) warn = '<div class="ssrp-warn">⚠ ' + (v.type === 'early' ? T('arrive ' + tod(v.arrive) + ', opens ' + tod(v.open), 'đến ' + tod(v.arrive) + ', mở ' + tod(v.open)) : T('arrive ' + tod(v.arrive) + ', closes ' + tod(v.close), 'đến ' + tod(v.arrive) + ', đóng ' + tod(v.close))) + '</div>';
        var approx = s.approx ? ' <span class="ssrp-approx">(' + T('approx.', 'gần đúng') + ')</span>' : '';
        var meta = s.isHub ? T('start / return hub', 'điểm xuất phát') : (esc(s.area || '') + ' · ' + T('arrive', 'đến') + ' ' + tod(plan.arrivals[i]));
        return '<li class="ssrp-it' + (s.isHub ? ' hub' : '') + '"><span class="ssrp-num">' + (s.isHub ? '★' : i) + '</span>' +
          '<span><span class="nm">' + esc(s.n) + approx + '</span><div class="meta">' + meta + '</div>' + warn + '</span>' +
          '<span class="leg">' + legTxt + '</span></li>';
      }).join('');

      // actions — export the full multi-stop route to Google Maps (reliable waypoint support;
      // Apple Maps' URL scheme can't carry multiple stops, so we don't fake it)
      var seq = plan.stops.concat(plan.roundTrip ? [plan.stops[0]] : []);
      var links = gmapsLinks(seq);
      var gm = links.map(function (u, i) { return '<a class="pri" target="_blank" rel="noopener" href="' + u + '">' + (links.length > 1 ? T('Google Maps · leg ', 'Google Maps · chặng ') + (i + 1) : T('Open in Google Maps', 'Mở Google Maps')) + '</a>'; }).join('');
      var acts = '<div class="ssrp-acts">' + gm + '<button id="ssrp-copy">' + T('Copy as text', 'Sao chép') + '</button></div>';

      out.innerHTML = routehd + '<div>' + badge + '</div>' + stats + svg + '<ol class="ssrp-list">' + items + '</ol>' + acts;
      out.querySelector('#ssrp-copy').addEventListener('click', function () {
        var head = preset ? '✦ ' + preset.name + '\n' + preset.story + '\n\n' : '';
        var txt = head + plan.stops.map(function (s, i) { return (s.isHub ? '★' : i) + '. ' + s.n + (s.isHub ? '' : ' — ' + (s.area || '') + ' · ' + tod(plan.arrivals[i])); }).join('\n') +
          '\n\n' + plan.totalKm + ' km · ' + plan.durationText + ' · ' + (n - 1) + ' stops\nMap: ' + links[0] + '\nseraphicstyler.com';
        navigator.clipboard && navigator.clipboard.writeText(txt);
        this.textContent = T('Copied ✓', 'Đã chép ✓');
      });
    }
    function stat(big, small) { return '<div class="ssrp-stat"><b>' + esc(big) + '</b><span>' + esc(small) + '</span></div>'; }

    /* open/close */
    function open() { renderPresets(); renderSeed(); renderOpts(); syncSeed(); out.innerHTML = ''; ov.hidden = false; }
    function close() { ov.hidden = true; }
    openBtn.addEventListener('click', open);
    ov.querySelector('.ssrp-x').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!document.body.contains(ov)) return;   // a rebuilt widget owns the keyboard now
      if (e.key === 'Escape' && !ov.hidden) close();
    });
    ov.querySelector('#ssrp-run').addEventListener('click', run);

    // deep-link: open automatically on #route or ?route
    function maybeAutoOpen() {
      if (!document.body.contains(ov)) return;
      if (/(^|[#&])route(=|$|&)/.test(location.hash)) open();
    }
    maybeAutoOpen();
    window.addEventListener('hashchange', maybeAutoOpen);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* The panel's strings are baked in at build time, so re-run boot() whenever the
     i18n engine swaps <html lang>. Registered once; boot() never touches lang. */
  if (!window.__ssrpLangObserver && typeof MutationObserver !== 'undefined') {
    window.__ssrpLangObserver = new MutationObserver(function () {
      if (document.querySelector('.ssrp-open, .ssrp-ov')) boot();
    });
    window.__ssrpLangObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }
})();

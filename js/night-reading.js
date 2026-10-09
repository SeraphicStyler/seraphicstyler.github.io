/* Night bands — reading light (styles in css/night-reading.css).
   Each [data-rh] block colours the line at the reading line (48% down the
   viewport, just above centre) peach-orange; lines already read pass through
   a pale warm wake to white; lines ahead wait muted and brighten as they near. The colour is a per-line,
   hard-stop gradient clipped to the glyphs, so the DOM is never rewritten and
   the EN/VN swap keeps working. Lines are re-measured from the live layout
   every frame a block is on screen, so resizes, text size and translations
   need no bookkeeping. Off under reduced motion, high contrast and forced
   colours — the text is then simply white. */
(function () {
  var root = document.documentElement;
  var blocks = Array.prototype.slice.call(document.querySelectorAll('section.night [data-rh]'));
  if (!blocks.length || !('IntersectionObserver' in window)) return;

  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqForced = window.matchMedia('(forced-colors: active)');
  /* ---- Tuning ---- */
  var FOCUS = 0.48;          /* reading line, as a fraction of viewport height */
  /* Cascade stops, in lines past the reading line (negative = still ahead). */
  var T_AHEAD = -1.6;        /* fully muted at or before this */
  var T_APPROACH = -0.7;     /* brightening toward the current hue */
  var T_CURRENT_IN = -0.35;  /* current-line hue holds from here… */
  var T_CURRENT_OUT = 0.35;  /* …to here */
  var T_WAKE = 1.0;          /* pale warm wake peaks */
  var T_READ = 2.5;          /* settled to read white (~1.5-line fade) */
  var EASE = 1;              /* 0 = linear blends, 1 = smoothstep */

  var visible = new Set();
  var palette = null, queued = false, enabled = false;

  function isOff() {
    return mqMotion.matches || mqForced.matches || root.classList.contains('rm') || root.classList.contains('hc');
  }

  function rgb(s) {
    s = s.trim().replace('#', '');
    if (s.length === 3) s = s.replace(/./g, '$&$&');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }

  /* Keyframes over t = distance past the reading line, in lines (negative = ahead). */
  function readPalette() {
    var cs = getComputedStyle(blocks[0]);
    var v = function (n) { return rgb(cs.getPropertyValue(n) || '#ffffff'); };
    palette = [
      [T_AHEAD, v('--rh-ahead')],
      [T_APPROACH, v('--rh-approach')],
      [T_CURRENT_IN, v('--rh-current')],
      [T_CURRENT_OUT, v('--rh-current')],
      [T_WAKE, v('--rh-wake')],
      [T_READ, v('--rh-read')]
    ];
  }

  function colorAt(t) {
    var p = palette;
    if (t <= p[0][0]) return p[0][1];
    for (var i = 1; i < p.length; i++) {
      if (t <= p[i][0]) {
        var a = p[i - 1], b = p[i], k = (t - a[0]) / (b[0] - a[0]);
        k += EASE * (k * k * (3 - 2 * k) - k);
        return [0, 1, 2].map(function (j) { return Math.round(a[1][j] + (b[1][j] - a[1][j]) * k); });
      }
    }
    return p[p.length - 1][1];
  }

  /* Visual lines of a block, as [top, bottom] offsets from its top edge. */
  function lines(el, top) {
    var r = document.createRange();
    r.selectNodeContents(el);
    var rects = r.getClientRects(), out = [];
    for (var i = 0; i < rects.length; i++) {
      var q = rects[i];
      if (q.width < 1 || q.height < 1) continue;
      var t = q.top - top, b = q.bottom - top, c = (t + b) / 2, hit = null;
      for (var j = 0; j < out.length; j++) if (c >= out[j][0] && c <= out[j][1]) { hit = out[j]; break; }
      if (hit) { hit[0] = Math.min(hit[0], t); hit[1] = Math.max(hit[1], b); }
      else out.push([t, b]);
    }
    return out.sort(function (a, b) { return a[0] - b[0]; });
  }

  function paint(el, focusY) {
    var top = el.getBoundingClientRect().top, L = lines(el, top), n = L.length;
    if (!n) return;
    var lh = 0;
    for (var i = 0; i < n; i++) lh += L[i][1] - L[i][0];
    lh = Math.max(lh / n, 1);
    var stops = [];
    for (i = 0; i < n; i++) {
      var c = colorAt((focusY - (top + (L[i][0] + L[i][1]) / 2)) / lh);
      var col = 'rgb(' + c.join(',') + ')';
      var from = i === 0 ? '0px' : ((L[i - 1][1] + L[i][0]) / 2).toFixed(1) + 'px';
      var to = i === n - 1 ? '100%' : ((L[i][1] + L[i + 1][0]) / 2).toFixed(1) + 'px';
      stops.push(col + ' ' + from + ' ' + to);
    }
    el.style.backgroundImage = 'linear-gradient(180deg,' + stops.join(',') + ')';
    if (!el.classList.contains('rh-live')) el.classList.add('rh-live');
  }

  function frame() {
    queued = false;
    if (!enabled) return;
    var focusY = window.innerHeight * FOCUS;
    visible.forEach(function (el) { paint(el, focusY); });
  }
  function queue() { if (!queued && enabled) { queued = true; requestAnimationFrame(frame); } }

  function sync() {
    var on = !isOff();
    if (on) readPalette();
    if (on === enabled) { queue(); return; }
    enabled = on;
    if (!on) blocks.forEach(function (el) { el.classList.remove('rh-live'); el.style.backgroundImage = ''; });
    queue();
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
    queue();
  }, { rootMargin: '25% 0px 25% 0px' });
  blocks.forEach(function (el) { io.observe(el); });

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  [mqMotion, mqForced].forEach(function (m) { (m.addEventListener ? m.addEventListener('change', sync) : m.addListener(sync)); });
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class', 'lang'] });
  /* i18n-site.js swaps the copy then fires ss:lang — line counts change. */
  document.addEventListener('ss:lang', function () { requestAnimationFrame(queue); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  sync();
})();

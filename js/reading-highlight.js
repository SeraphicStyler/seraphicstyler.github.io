/* Reading highlight: shared by San Fitness, Sanraphically, The Soft Bunny and Seraphic Styler.
   Styles in reading-highlight.css; each site sets its palette there.

   Every reading block is coloured line by line as it passes a reading line
   near the middle of the viewport: unread lines wait faded, the line at the
   reading line takes the site's accent (solid or a gradient), and lines
   already read settle into the full ink colour and stay there. Progress
   comes only from scroll position, so it stops when scrolling stops and
   runs backwards when scrolling up.

   Which text reads:
   - any element marked data-rh, and
   - automatically, inside every [data-rh-scope] container: each paragraph,
     heading (h2–h4), list item, definition, quote, caption, table cell and
     any div holding text directly — the innermost one, on a plain surface (no background, gradient text or
     glow of its own), outside controls, dialogs and [data-rh-skip] subtrees. A scope's
     attribute value can add selectors (data-rh-scope=".price-line, .note").
     Content added later (translations, rendered widgets) is picked up too.

   The colour is a per-line, hard-stop gradient clipped to the glyphs. The
   DOM text is never rewritten (no spans, no duplicate text), so the copy
   stays selectable, screen readers read it once, and translations keep
   working. Lines are measured from the live layout every frame a block is on
   screen, so resizes, text size and font loading need no bookkeeping.

   Strict reading: exactly one line holds the accent at a time, with a short
   cross-fade at each hand-off. Every passage starts unread and ends read,
   even near the top or bottom of a short page (a /links page): there the
   reading line is sped up just enough at the start or end of the scroll to
   pass every line, and moves 1:1 with scroll everywhere else. A page too
   short to scroll shows the text plainly in the read colour.

   Off (plain text in the read colour) under prefers-reduced-motion, forced
   colours, browsers without color-mix(), or wherever the site's CSS sets
   --rh-off: 1 on the blocks (its own reduce-motion or high-contrast toggle).

   Tuning: --rh-focus on the blocks (or an ancestor) moves the reading line,
   as a fraction of viewport height from the top (default 0.5). */
(function () {
  var root = document.documentElement;
  if (!('IntersectionObserver' in window)) return;
  if (!(window.CSS && CSS.supports && CSS.supports('color', 'color-mix(in oklab, red 50%, blue)'))) return;
  if (!document.querySelector('[data-rh], [data-rh-scope]')) return;

  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqForced = window.matchMedia('(forced-colors: active)');

  /* Where each line is, in line-heights past the reading line (negative = still ahead). */
  var IN_START = -0.65;  /* starts warming toward the accent */
  var IN_END = -0.35;    /* full accent from here… */
  var OUT_START = 0.35;  /* …to here */
  var OUT_END = 0.65;    /* fully settled into the read colour */
  var MARGIN = 48;       /* px of lead-in before the first line / after the last */
  var MIN_SCROLL = 160;  /* below this much scroll room, show plain read text */

  var CANDIDATES = 'p, li, h2, h3, h4, dt, dd, blockquote, figcaption, td, th';
  var SKIP = 'button, label, select, textarea, option, input, dialog, [role="dialog"], [aria-hidden="true"], svg, [contenteditable], [data-rh-skip]';

  var blocks = [], seen = new WeakSet(), visible = new Set();
  var queued = false, enabled = false, span = null;

  function smooth(k) { return k * k * (3 - 2 * k); }

  /* How much of the accent a line shows (0–1) at distance t. */
  function accentWeight(t) {
    if (t <= IN_START || t >= OUT_END) return 0;
    if (t < IN_END) return smooth((t - IN_START) / (IN_END - IN_START));
    if (t <= OUT_START) return 1;
    return 1 - smooth((t - OUT_START) / (OUT_END - OUT_START));
  }

  function isOff() {
    if (mqMotion.matches || mqForced.matches) return true;
    return !!blocks.length && getComputedStyle(blocks[0]).getPropertyValue('--rh-off').trim() === '1';
  }

  function clearAlpha(c) { return c === 'transparent' || /,\s*0\)$/.test(c); }

  /* A block must sit on a plain surface: painting it would replace its own
     background or gradient text. */
  function plain(el) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.display === 'contents' || cs.display === 'inline') return false;
    if (cs.backgroundImage !== 'none' || !clearAlpha(cs.backgroundColor)) return false;
    if (clearAlpha(cs.webkitTextFillColor || 'x')) return false;
    if (cs.textShadow && cs.textShadow !== 'none') return false; /* a glow would cover the colour */
    return true;
  }

  function register(el) {
    if (seen.has(el)) return;
    seen.add(el);
    blocks.push(el);
    io.observe(el);
    if (ro) ro.observe(el);
    span = null;
  }

  function hasOwnText(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && /\S/.test(c.nodeValue)) return true;
    return false;
  }

  function scan() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-rh]'), register);
    Array.prototype.forEach.call(document.querySelectorAll('[data-rh-scope]'), function (scope) {
      var extra = (scope.getAttribute('data-rh-scope') || '').trim();
      var sel = CANDIDATES + (extra ? ', ' + extra : '');
      /* Candidates: the usual text elements, plus any div that holds text
         directly (body copy set in a plain div). The innermost one wins. */
      var list = Array.prototype.slice.call(scope.querySelectorAll(sel));
      Array.prototype.forEach.call(scope.querySelectorAll('div'), function (d) { if (hasOwnText(d)) list.push(d); });
      var set = new Set(list), outer = new Set();
      list.forEach(function (el) {
        for (var a = el.parentElement; a && a !== scope; a = a.parentElement) if (set.has(a)) outer.add(a);
      });
      list.forEach(function (el) {
        if (outer.has(el) || seen.has(el) || el.hasAttribute('data-rh')) return;
        if (el.closest(SKIP)) return;
        var up = el.parentElement && el.parentElement.closest('[data-rh]');
        if (up || el.querySelector('[data-rh]')) return;
        if (!(el.textContent || '').trim() || !plain(el)) return;
        el.setAttribute('data-rh', '');
        register(el);
      });
    });
    if (enabled) queue(); else sync();
  }
  var scanTimer = 0;
  function rescan() { clearTimeout(scanTimer); scanTimer = setTimeout(scan, 250); }

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

  /* First and last reading text on the page, in document coordinates.
     Cached; any resize of a block or of the page invalidates it. */
  function textSpan(y) {
    if (span) return span;
    var A = Infinity, Z = -Infinity;
    for (var i = 0; i < blocks.length; i++) {
      var r = blocks[i].getBoundingClientRect();
      if (!r.height) continue;
      A = Math.min(A, r.top + y); Z = Math.max(Z, r.bottom + y);
    }
    span = A === Infinity ? false : [A, Z];
    return span;
  }

  /* Where the reading line sits in the viewport for the current scroll.
     Natural: a fixed fraction of the viewport. Where the text starts above
     that line at scroll 0, or ends below it at full scroll, the line is eased
     over a stretch of scroll so every line is still read in order. */
  function focusLine(vh) {
    var focus = parseFloat(getComputedStyle(blocks[0]).getPropertyValue('--rh-focus'));
    if (!(focus >= 0 && focus <= 1)) focus = 0.5;
    var se = document.scrollingElement || root;
    var y = window.scrollY || se.scrollTop || 0;
    var S = Math.max(0, se.scrollHeight - vh);
    if (S < MIN_SCROLL) return null;
    var AZ = textSpan(y);
    if (!AZ) return null;
    var f = vh * focus;
    var lo = Math.min(f, AZ[0] - MARGIN);        /* reading position needed at scroll 0 */
    var hi = Math.max(S + f, AZ[1] + MARGIN);    /* … and at full scroll */
    var off0 = lo - f, off1 = hi - (S + f);      /* off0 ≤ 0, off1 ≥ 0 */
    var D0 = off0 ? Math.min(S, Math.max(vh * 0.5, -off0 * 1.5)) : 0;
    var D1 = off1 ? Math.min(S, Math.max(vh * 0.5, off1 * 1.5)) : 0;
    var R;
    if (D0 + D1 > S) R = lo + (hi - lo) * (y / S);
    else {
      R = y + f;
      if (D0 && y < D0) R += off0 * (1 - y / D0);
      if (D1 && y > S - D1) R += off1 * ((y - (S - D1)) / D1);
    }
    return R - y;
  }

  /* Top layer: unread/read per line, made transparent where the accent shows.
     Under it, the accent fill (--rh-fill) is painted only behind the lines that
     carry some accent, so a translucent unread colour never lets it bleed. */
  /* Safari and in-app browsers (WebKit) stop painting text clipped with
     background-clip:text while a child is animating on its own layer, so a
     passage goes live only after its own reveal animations have finished. */
  function busy(el) {
    if (!el.getAnimations) return false;
    var run = el.getAnimations({ subtree: true }).filter(function (a) { return a.playState === 'running' || a.playState === 'pending'; });
    if (!run.length) return false;
    if (!el.__rhWait) {
      el.__rhWait = true;
      Promise.all(run.map(function (a) { return a.finished.catch(function () {}); })).then(function () { el.__rhWait = false; queue(); });
    }
    return true;
  }

  function paint(el, focusY) {
    if (!el.classList.contains('rh-live') && busy(el)) return;
    var top = el.getBoundingClientRect().top, L = lines(el, top), n = L.length;
    if (!n) return;
    var lh = 0;
    for (var i = 0; i < n; i++) lh += L[i][1] - L[i][0];
    lh = Math.max(lh / n, 1);
    var stops = [], layers = [], sizes = ['100% 100%'], pos = ['0 0'];
    for (i = 0; i < n; i++) {
      var t = (focusY - (top + (L[i][0] + L[i][1]) / 2)) / lh;
      var base = t < 0 ? 'var(--rh-unread)' : 'var(--rh-read)';
      var keep = Math.round((1 - accentWeight(t)) * 1000) / 10;
      var col = keep >= 100 ? base : 'color-mix(in srgb, ' + base + ' ' + keep + '%, transparent)';
      var from = i === 0 ? '0px' : ((L[i - 1][1] + L[i][0]) / 2).toFixed(1) + 'px';
      var to = i === n - 1 ? '100%' : ((L[i][1] + L[i + 1][0]) / 2).toFixed(1) + 'px';
      stops.push(col + ' ' + from + ' ' + to);
      if (keep < 100) {
        var y0 = i === 0 ? 0 : (L[i - 1][1] + L[i][0]) / 2;
        var y1 = i === n - 1 ? el.offsetHeight || L[i][1] : (L[i][1] + L[i + 1][0]) / 2;
        layers.push('var(--rh-fill)');
        sizes.push('100% ' + Math.max(1, y1 - y0).toFixed(1) + 'px');
        pos.push('0 ' + y0.toFixed(1) + 'px');
      }
    }
    el.style.backgroundImage = ['linear-gradient(180deg,' + stops.join(',') + ')'].concat(layers).join(', ');
    el.style.backgroundSize = sizes.join(', ');
    el.style.backgroundPosition = pos.join(', ');
    if (!el.classList.contains('rh-live')) el.classList.add('rh-live');
  }

  function frame() {
    queued = false;
    if (!enabled || !blocks.length) return;
    var focusY = focusLine(window.innerHeight);
    if (focusY === null) { clear(); return; }
    visible.forEach(function (el) { paint(el, focusY); });
  }
  function queue() { if (!queued && enabled) { queued = true; requestAnimationFrame(frame); } }

  function clear() {
    blocks.forEach(function (el) {
      el.classList.remove('rh-live');
      el.style.backgroundImage = el.style.backgroundSize = el.style.backgroundPosition = '';
    });
  }

  function sync() {
    var on = !isOff();
    if (on === enabled) { queue(); return; }
    enabled = on;
    if (!on) clear();
    queue();
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target); });
    queue();
  }, { rootMargin: '25% 0px 25% 0px' });

  var ro = 'ResizeObserver' in window ? new ResizeObserver(function () { span = null; queue(); }) : null;
  if (ro) ro.observe(document.body);

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { span = null; queue(); });
  window.addEventListener('load', rescan);
  [mqMotion, mqForced].forEach(function (m) { (m.addEventListener ? m.addEventListener('change', sync) : m.addListener(sync)); });
  /* Theme, motion and contrast toggles live on <html> as classes or data-theme. */
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class', 'data-theme', 'lang'] });
  /* Translations and widgets that render later bring new text. */
  var mo = new MutationObserver(rescan);
  Array.prototype.forEach.call(document.querySelectorAll('[data-rh-scope]'), function (s) { mo.observe(s, { childList: true, subtree: true }); });
  document.addEventListener('ss:lang', function () { span = null; rescan(); requestAnimationFrame(queue); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { span = null; queue(); });
  scan();
})();

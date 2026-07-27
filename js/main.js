/* Seraphic Styler — site interactions (vanilla JS) */
(function () {
  'use strict';
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function ready() {
    /* ---- Transparent nav -> frosted on scroll ---- */
    var navBar = document.querySelector('.nav');
    if (navBar) {
      var onNavScroll = function () { navBar.classList.toggle('scrolled', window.pageYOffset > 24); };
      onNavScroll();
      window.addEventListener('scroll', onNavScroll, { passive: true });
    }

    /* ---- Mobile nav ---- */
    var ham = document.querySelector('.hamburger');
    var links = document.getElementById('navMenu');
    if (ham && links) {
      ham.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        ham.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          var ap = document.getElementById('a11yPanel'), ab = document.getElementById('a11yBtn');
          if (ap) ap.classList.remove('open');
          if (ab) ab.setAttribute('aria-expanded', 'false');
        }
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); ham.setAttribute('aria-expanded', 'false'); });
      });
    }

    /* ---- Desktop nav cue: pin the hover-revealed links open for touch/click/keyboard ---- */
    var navEl = document.querySelector('.nav');
    var cue = document.querySelector('.nav-cue');
    if (navEl && cue) {
      function unpin() { navEl.classList.remove('nav-pinned'); cue.setAttribute('aria-expanded', 'false'); }
      cue.addEventListener('click', function (e) {
        e.stopPropagation();
        var pinned = navEl.classList.toggle('nav-pinned');
        cue.setAttribute('aria-expanded', pinned ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) {
        if (navEl.classList.contains('nav-pinned') && !navEl.contains(e.target)) unpin();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navEl.classList.contains('nav-pinned')) { unpin(); cue.focus(); }
      });
      navEl.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', unpin);
      });
    }

    /* ---- Accessibility panel ---- */
    var aBtn = document.getElementById('a11yBtn');
    var aPanel = document.getElementById('a11yPanel');
    if (aBtn && aPanel) {
      function closePanel(returnFocus) {
        if (!aPanel.classList.contains('open')) return;
        aPanel.classList.remove('open'); aBtn.setAttribute('aria-expanded', 'false');
        if (returnFocus) aBtn.focus();
      }
      aBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = aPanel.classList.toggle('open');
        aBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          if (links) { links.classList.remove('open'); if (ham) ham.setAttribute('aria-expanded', 'false'); }
          var first = document.getElementById('langSelect'); if (first) first.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (!aPanel.contains(e.target) && e.target !== aBtn) closePanel(false);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(true); });
      var aClose = aPanel.querySelector('.a11y-close');
      if (aClose) aClose.addEventListener('click', function () { closePanel(true); });
    }

    /* ---- Text size ---- */
    function setText(size) {
      root.classList.remove('ts-lg', 'ts-xl');
      if (size === 'lg') root.classList.add('ts-lg');
      if (size === 'xl') root.classList.add('ts-xl');
      save('ss-textsize', size);
      document.querySelectorAll('[data-size]').forEach(function (b) {
        var on = b.getAttribute('data-size') === size; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    document.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () { setText(b.getAttribute('data-size')); });
    });
    setText(root.classList.contains('ts-xl') ? 'xl' : root.classList.contains('ts-lg') ? 'lg' : 'md');

    /* ---- Theme (Auto follows the OS day/night setting; Light/Dark/Mono are manual) ---- */
    var mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function applyTheme(mode) {
      var effective = mode;
      if (mode === 'auto') effective = (mqDark && mqDark.matches) ? 'dark' : 'light';
      root.classList.remove('dark', 'mono');
      if (effective === 'dark') root.classList.add('dark');
      else if (effective === 'mono') root.classList.add('mono');
      /* light => no class */
    }
    /* Theme FAB: one tap moves you along light -> dark -> mono. Auto is not in the
       cycle (it isn't a look, it's a rule) but stays available in the panel — and
       an Auto visitor entering the cycle starts from whatever Auto resolved to. */
    var THEMES = ['light', 'dark', 'mono'];
    var themeFab = document.getElementById('themeFab');
    function effectiveTheme(mode) {
      return mode === 'auto' ? ((mqDark && mqDark.matches) ? 'dark' : 'light') : mode;
    }
    /* Name a theme in the visitor's language by borrowing the panel button's own
       label, which i18n already translates — no second set of strings to maintain. */
    function themeName(mode) {
      var b = document.querySelector('.a11y-panel [data-theme="' + mode + '"]');
      return (b && b.textContent.trim()) || mode;
    }
    function syncThemeFab(mode) {
      if (!themeFab) return;
      var cur = effectiveTheme(mode);
      var next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
      themeFab.setAttribute('data-mode', cur);
      var label = themeName(cur) + ' → ' + themeName(next);
      themeFab.setAttribute('title', label);
      themeFab.setAttribute('aria-label', label);
    }
    function setTheme(mode) {
      applyTheme(mode);
      save('ss-theme', mode);
      document.querySelectorAll('[data-theme]').forEach(function (b) {
        var on = b.getAttribute('data-theme') === mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      syncThemeFab(mode);
    }
    document.querySelectorAll('[data-theme]').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme')); });
    });
    if (themeFab) {
      themeFab.addEventListener('click', function () {
        var cur = 'auto'; try { cur = localStorage.getItem('ss-theme') || 'auto'; } catch (e) {}
        setTheme(THEMES[(THEMES.indexOf(effectiveTheme(cur)) + 1) % THEMES.length]);
      });
    }
    /* Live-update when the OS flips light/dark, but only while the user is on Auto. */
    var onScheme = function () {
      var cur = 'auto'; try { cur = localStorage.getItem('ss-theme') || 'auto'; } catch (e) {}
      if (cur === 'auto') { applyTheme('auto'); syncThemeFab('auto'); }
    };
    if (mqDark) { if (mqDark.addEventListener) mqDark.addEventListener('change', onScheme); else if (mqDark.addListener) mqDark.addListener(onScheme); }
    /* The FAB's tooltip is built from translated text, so re-read it after a language swap. */
    if (typeof window.SS_setLang === 'function') {
      var _setLang = window.SS_setLang;
      window.SS_setLang = function () {
        var r = _setLang.apply(this, arguments);
        var cur = 'auto'; try { cur = localStorage.getItem('ss-theme') || 'auto'; } catch (e) {}
        syncThemeFab(cur);
        return r;
      };
    }
    var storedTheme = 'auto'; try { storedTheme = localStorage.getItem('ss-theme') || 'auto'; } catch (e) {}
    setTheme(storedTheme);

    /* ---- Toggles: high contrast + reduced motion ---- */
    function wireToggle(btnId, cls, key) {
      var b = document.getElementById(btnId);
      if (!b) return;
      function sync() { var on = root.classList.contains(cls); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'On' : 'Off'; }
      b.addEventListener('click', function () { root.classList.toggle(cls); save(key, root.classList.contains(cls) ? '1' : '0'); sync(); });
      sync();
    }
    wireToggle('contrastBtn', 'hc', 'ss-contrast');
    wireToggle('motionBtn', 'rm', 'ss-motion');

    /* ---- Scroll-spy ---- */
    var sections = document.querySelectorAll('section[id]');
    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var id = e.target.getAttribute('id');
            document.querySelectorAll('.nav-links a').forEach(function (a) {
              var on = a.getAttribute('href') === '#' + id;
              a.classList.toggle('active', on);
              if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            });
            /* The rail only carries eight of the sections; the ones it skips
               keep the nearest dot above them lit rather than blanking the rail. */
            var rl = document.querySelectorAll('.rail a');
            var hit = false;
            rl.forEach(function (a) { if (a.getAttribute('href') === '#' + id) hit = true; });
            if (hit) rl.forEach(function (a) {
              var on = a.getAttribute('href') === '#' + id;
              a.classList.toggle('active', on);
              if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---- Scroll reveal ---- */
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
        /* Once a cascaded cell has landed, take the entrance off it entirely:
           the delay must not leak into later transitions (theme, text size), and
           cards with their own hover transition get it back. Final state is
           identical with or without the classes, so removing them is invisible. */
        if (e.target.style.transitionDelay) {
          e.target.addEventListener('transitionend', function h() {
            e.target.style.transitionDelay = '';
            e.target.classList.remove('reveal', 'swing', 'in');
            e.target.removeEventListener('transitionend', h);
          });
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }) : null;

    function watch(nodes) {
      Array.prototype.forEach.call(nodes, function (el) {
        if (io) io.observe(el); else el.classList.add('in');
      });
    }

    /* A grid should arrive as a wave, not a slab: the middle of each row leads,
       the outer columns follow, and each row trails the one above it. Delay is
       capped so a long grid never keeps the reader waiting. */
    function cascade(box) {
      var kids = Array.prototype.slice.call(box.children);
      if (kids.length < 2) return kids;
      var tracks = getComputedStyle(box).gridTemplateColumns;
      var cols = (tracks && tracks !== 'none') ? tracks.split(' ').filter(Boolean).length : 1;
      var midCol = (cols - 1) / 2, midItem = (kids.length - 1) / 2;
      kids.forEach(function (k, i) {
        var d = (cols > 1)
          ? Math.floor(i / cols) * 0.05 + Math.abs((i % cols) - midCol) * 0.055
          : Math.abs(i - midItem) * 0.05;
        k.classList.add('reveal', 'swing');
        k.style.transitionDelay = Math.min(d, 0.4).toFixed(3) + 's';
      });
      return kids;
    }

    /* Opt a grid in only if it was already being revealed — either as a whole
       (.reveal on the container) or cell by cell. */
    document.querySelectorAll('.grid, .steps, .rows, .lp-links, .gift-grid').forEach(function (box) {
      var kids = Array.prototype.slice.call(box.children);
      if (!box.classList.contains('reveal') && !kids.some(function (k) { return k.classList.contains('reveal'); })) return;
      box.classList.remove('reveal');
      cascade(box);
    });

    watch(document.querySelectorAll('.reveal'));

    /* Content rendered after this point (lookbook tiles) can cascade too. */
    window.SS_cascade = function (box) { if (box) watch(cascade(box)); };

    /* ---- Quick language toggle (EN / VN) above the settings gear ---- */
    var langFab = document.getElementById('langFab');
    if (langFab) {
      var syncLangFab = function () {
        var cur = root.getAttribute('lang') || 'en';
        var toVN = cur !== 'vi';
        langFab.textContent = toVN ? 'VN' : 'EN';
        langFab.setAttribute('aria-label', toVN ? 'Switch to Vietnamese' : 'Switch to English');
        langFab.setAttribute('title', toVN ? 'Tiếng Việt' : 'English');
      };
      langFab.addEventListener('click', function () {
        var cur = root.getAttribute('lang') || 'en';
        var next = (cur === 'vi') ? 'en' : 'vi';
        if (typeof window.SS_setLang === 'function') window.SS_setLang(next);
        syncLangFab();
      });
      var lsel = document.getElementById('langSelect');
      if (lsel) lsel.addEventListener('change', syncLangFab);
      syncLangFab();
    }

    /* ---- Sticky mobile CTA (appears past the hero, hides over contact) ---- */
    var sticky = document.querySelector('.sticky-cta');
    if (sticky && 'IntersectionObserver' in window) {
      var sHero = document.getElementById('hero'), sContact = document.getElementById('contact');
      var sHeroVis = true, sContactVis = false;
      var syncSticky = function () { sticky.classList.toggle('show', !sHeroVis && !sContactVis); };
      if (sHero) new IntersectionObserver(function (es) { sHeroVis = es[0].isIntersecting; syncSticky(); }, { threshold: 0 }).observe(sHero);
      if (sContact) new IntersectionObserver(function (es) { sContactVis = es[0].isIntersecting; syncSticky(); }, { threshold: 0 }).observe(sContact);
    }

    /* ---- Footer year ---- */
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();

    /* ---- Gift tier currency toggle (reuses live USD rates) ---- */
    var giftCur = document.getElementById('giftCurrency');
    if (giftCur) {
      var GFB = { USD:1, EUR:0.92, GBP:0.79, AUD:1.5, CAD:1.36, SGD:1.34, JPY:155, KRW:1350, CNY:7.2, THB:36, AED:3.67, INR:83, VND:25800 };
      var gRates = null;
      var gRate = function (c) { return (gRates && gRates[c] != null) ? gRates[c] : (GFB[c] != null ? GFB[c] : 1); };
      var gFmt = function (n, c) {
        try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: (c === 'JPY' || c === 'KRW' || c === 'VND' || n >= 100 ? 0 : 2) }).format(n); }
        catch (e) { return '$' + Math.round(n); }
      };
      var gRender = function () {
        var c = giftCur.value;
        document.querySelectorAll('.gift-price').forEach(function (p) {
          var usd = parseFloat(p.getAttribute('data-usd')) || 0;
          var amt = p.querySelector('.gift-amt'); if (amt) amt.textContent = gFmt(usd * gRate(c), c);
          var vnd = p.querySelector('.vnd'); if (vnd) vnd.style.display = (c === 'VND') ? 'none' : '';
        });
      };
      giftCur.addEventListener('change', gRender);
      gRender();
      fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (d) { if (d && d.rates) { gRates = d.rates; gRender(); } }).catch(function () {});
    }

    /* ---- Estimate quiz stepper ---- */
    var quiz = document.getElementById('estQuiz');
    if (quiz) {
      var qSteps = quiz.querySelectorAll('.quiz-step');
      var qFill = document.getElementById('quizBarFill');
      var qNum = document.getElementById('quizStepNum');
      var qTotal = qSteps.length, qCur = 0;
      var qShow = function (i, noScroll) {
        qCur = Math.max(0, Math.min(qTotal - 1, i));
        qSteps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === qCur); });
        if (qFill) qFill.style.width = ((qCur + 1) / qTotal * 100) + '%';
        if (qNum) qNum.textContent = (qCur + 1);
        var head = qSteps[qCur].querySelector('.quiz-q');
        if (head) { head.setAttribute('tabindex', '-1'); try { head.focus({ preventScroll: true }); } catch (e) { head.focus(); } }
        if (!noScroll) quiz.scrollIntoView({ behavior: root.classList.contains('rm') ? 'auto' : 'smooth', block: 'start' });
      };
      var qWarned = false;
      quiz.addEventListener('click', function (e) {
        var t = e.target.closest('[data-next],[data-back],#quizRestart');
        if (!t || !quiz.contains(t)) return;
        if (t.id === 'quizRestart') qShow(0);
        else if (t.hasAttribute('data-back')) qShow(qCur - 1);
        else if (t.hasAttribute('data-next')) {
          // Gentle pause, not a wall: an empty basket gets one hint (a styling
          // tier can still be added on step 3), then Continue works as normal.
          var hint = document.getElementById('estStepHint');
          if (qCur === 0 && hint) {
            var any = false;
            quiz.querySelectorAll('.item-price').forEach(function (i) { if (/\d/.test(i.value)) any = true; });
            if (!any && !qWarned) { qWarned = true; hint.hidden = false; return; }
            hint.hidden = true;
          }
          qShow(qCur + 1);
        }
      });
      qShow(0, true);
    }

    /* ---- Inquiry form: a Tally embed (see index.html #inquiryEmbed) ----
       Tally links open as an on-site popup; the href stays as the no-JS /
       script-blocked fallback. Query params become Tally hidden fields
       (about / tier / estimate / source), which pre-fill the form. */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="https://tally.so/r/"]');
      if (!a || !window.Tally) return;
      e.preventDefault();
      var q = a.href.split('?'), fields = {};
      (q[1] || '').split('&').forEach(function (p) {
        if (!p) return;
        var kv = p.split('=');
        fields[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
      });
      window.Tally.openPopup(q[0].split('/').pop(), { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000, hiddenFields: fields });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();

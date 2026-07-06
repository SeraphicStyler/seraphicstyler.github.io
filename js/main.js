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
    function setTheme(mode) {
      applyTheme(mode);
      save('ss-theme', mode);
      document.querySelectorAll('[data-theme]').forEach(function (b) {
        var on = b.getAttribute('data-theme') === mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    document.querySelectorAll('[data-theme]').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme')); });
    });
    /* Live-update when the OS flips light/dark, but only while the user is on Auto. */
    var onScheme = function () {
      var cur = 'auto'; try { cur = localStorage.getItem('ss-theme') || 'auto'; } catch (e) {}
      if (cur === 'auto') applyTheme('auto');
    };
    if (mqDark) { if (mqDark.addEventListener) mqDark.addEventListener('change', onScheme); else if (mqDark.addListener) mqDark.addListener(onScheme); }
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
              a.classList.toggle('active', a.getAttribute('href') === '#' + id);
            });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---- Scroll reveal ---- */
    var items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && items.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
      items.forEach(function (el) { io.observe(el); });
    } else { items.forEach(function (el) { el.classList.add('in'); }); }

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
      quiz.addEventListener('click', function (e) {
        var t = e.target.closest('[data-next],[data-back],#quizRestart');
        if (!t || !quiz.contains(t)) return;
        if (t.id === 'quizRestart') qShow(0);
        else if (t.hasAttribute('data-back')) qShow(qCur - 1);
        else if (t.hasAttribute('data-next')) qShow(qCur + 1);
      });
      qShow(0, true);
    }

    /* ---- Inquiry wizard (3 steps: You -> Request -> Send) ---- */
    var iq = document.getElementById('inquiryForm');
    if (iq && iq.querySelector('[data-iqstep]')) {
      var iqSteps = iq.querySelectorAll('.quiz-step');
      var iqFill = document.getElementById('iqBarFill');
      var iqNum = document.getElementById('iqStepNum');
      var iqTotal = iqSteps.length, iqCur = 0;
      var iqShow = function (i, noScroll) {
        iqCur = Math.max(0, Math.min(iqTotal - 1, i));
        iqSteps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === iqCur); });
        if (iqFill) iqFill.style.width = ((iqCur + 1) / iqTotal * 100) + '%';
        if (iqNum) iqNum.textContent = (iqCur + 1);
        var h = iqSteps[iqCur].querySelector('.quiz-q'); if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) {} }
        if (!noScroll) iq.scrollIntoView({ behavior: root.classList.contains('rm') ? 'auto' : 'smooth', block: 'start' });
      };
      iq.addEventListener('click', function (e) {
        var nx = e.target.closest('[data-iqnext]'), bk = e.target.closest('[data-iqback]');
        if (nx) {
          var ok = true;
          iqSteps[iqCur].querySelectorAll('input, textarea').forEach(function (f) { if (ok && !f.checkValidity()) { f.reportValidity(); ok = false; } });
          if (ok) iqShow(iqCur + 1);
        } else if (bk) { iqShow(iqCur - 1); }
      });
      iqShow(0, true);
    }

    /* ---- Inquiry form -> mailto ---- */
    var form = document.getElementById('inquiryForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        var lines = [
          'Name: ' + f('inqName'),
          'Email: ' + f('inqEmail'),
          'Country / destination: ' + f('inqCountry'),
          'Looking for: ' + f('inqLooking'),
          'Size & measurements: ' + f('inqSize'),
          'Budget: ' + f('inqBudget'),
          'Inspiration links: ' + f('inqInspo'),
          'Timeline: ' + f('inqTimeline'),
          '', (f('inqNotes') || '')
        ];
        var subject = 'Seraphic Styler inquiry — ' + (f('inqName') || 'new client');
        var body = encodeURIComponent(lines.join('\n'));
        window.location.href = 'mailto:seraphicstyler@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + body;
        var ok = document.getElementById('inqSent');
        if (ok) ok.style.display = 'block';
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();

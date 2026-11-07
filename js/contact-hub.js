/* Seraphic Styler — floating "message me" button (7 Nov 2026)
   ----------------------------------------------------------------------
   One glowing round button, bottom-right. Tapping it opens a small frosted
   card with the ways to reach me:
     · DM on Instagram   → ig.me/m/seraphicstyler (new tab)
     · Send an email     → mailto with a prefilled subject
     · Fill out the form → the Tally form as a popup on the page. embed.js
                           loads only the first time the card opens; if it is
                           blocked or slow (~3s), the form opens in a new tab,
                           so the row never does nothing
     · Copy email address
   Closes with the button, Esc, or a tap outside. Keyboard-reachable, works
   in light/dark/mono/high-contrast, respects reduced motion, hidden in print.
   Styles: css/contact-hub.css (added by this script, so every page that
   loads this file gets the same button). Modelled on thesoftbunnyxx.com.
   ====================================================================== */
(function () {
  'use strict';
  if (document.documentElement.classList.contains('est-embedded')) return;   // not inside the embedded estimator

  var HANDLE = 'seraphicstyler';
  var EMAIL = 'seraphicstyler@gmail.com';
  var FORM_ID = 'gD10Kl';
  var TALLY = 'https://tally.so/r/' + FORM_ID;
  var FIELDS = { source: 'message-button' };

  var ICON = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.3A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
    form: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v2.5H9zM8.5 11h7M8.5 14.5h7M8.5 18h4"/></svg>'
  };

  function addStyles() {
    if (document.querySelector('link[data-chub-css]')) return;
    var src = (document.currentScript && document.currentScript.src) || '';
    var base = src ? src.replace(/js\/contact-hub\.js.*$/, '') : '';
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = base + 'css/contact-hub.css?v=2026-11-07b'; l.setAttribute('data-chub-css', '');
    document.head.appendChild(l);
  }
  addStyles();

  /* ---- Tally: loaded the first time the card opens, never on page load ---- */
  var tallyState = window.Tally ? 'ready' : 'idle', tallyWaiters = [];
  function loadTally() {
    if (tallyState !== 'idle') return;
    if (document.querySelector('script[src*="tally.so/widgets/embed.js"]')) { tallyState = 'loading'; poll(); return; }
    tallyState = 'loading';
    var s = document.createElement('script');
    s.src = 'https://tally.so/widgets/embed.js'; s.async = true;
    s.onload = function () { tallyState = window.Tally ? 'ready' : 'failed'; flush(); };
    s.onerror = function () { tallyState = 'failed'; flush(); };
    document.head.appendChild(s);
  }
  function poll() { var n = 0, t = setInterval(function () { if (window.Tally || ++n > 30) { clearInterval(t); tallyState = window.Tally ? 'ready' : 'failed'; flush(); } }, 100); }
  function flush() { var w = tallyWaiters; tallyWaiters = []; w.forEach(function (f) { f(); }); }
  function newTab() { window.open(TALLY + '?source=' + FIELDS.source, '_blank', 'noopener'); }
  function openForm() {
    if (window.Tally) { window.Tally.openPopup(FORM_ID, { layout: 'modal', width: 520, overlay: true, hiddenFields: FIELDS }); return; }
    if (tallyState === 'failed') { newTab(); return; }
    loadTally();
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; newTab(); } }, 3000);   // blocked or slow: never do nothing
    tallyWaiters.push(function () {
      if (done) return; done = true; clearTimeout(timer);
      if (window.Tally) window.Tally.openPopup(FORM_ID, { layout: 'modal', width: 520, overlay: true, hiddenFields: FIELDS });
      else newTab();
    });
  }

  function build() {
    if (document.querySelector('.chub')) return;
    var wrap = document.createElement('div');
    wrap.className = 'chub';
    wrap.innerHTML =
      '<div class="chub-pop" id="chub-pop" role="dialog" aria-label="Message me" hidden>' +
        '<p class="chub-pop-title">say hello</p>' +
        '<p class="chub-pop-sub">Pick whichever is easiest for you.</p>' +
        '<a class="chub-row" href="https://ig.me/m/' + HANDLE + '" target="_blank" rel="noopener noreferrer"><span class="chub-ic">' + ICON.instagram + '</span><span><strong>DM on Instagram</strong><small>@' + HANDLE + '</small></span></a>' +
        '<a class="chub-row" href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Hello from seraphicstyler.com') + '"><span class="chub-ic">' + ICON.email + '</span><span><strong>Send an email</strong><small>' + EMAIL + '</small></span></a>' +
        '<a class="chub-row chub-row-form" href="' + TALLY + '?source=' + FIELDS.source + '" target="_blank" rel="noopener"><span class="chub-ic">' + ICON.form + '</span><span><strong>Fill out the form</strong><small>a few quick questions</small></span></a>' +
        '<button type="button" class="chub-copy">Copy email address</button>' +
        '<p class="chub-copy-status" role="status" aria-live="polite"></p>' +
      '</div>' +
      '<button type="button" class="chub-fab" aria-label="Message me" aria-controls="chub-pop" aria-expanded="false">' +
        '<span class="chub-beacon" aria-hidden="true"></span>' +
        '<span class="chub-ring" aria-hidden="true"></span><span class="chub-ring chub-ring-2" aria-hidden="true"></span>' +
        '<span class="chub-icon chub-icon-chat">' + ICON.chat + '</span><span class="chub-icon chub-icon-close">' + ICON.close + '</span>' +
        '<span class="chub-tip" aria-hidden="true">message me</span>' +
      '</button>';
    document.body.appendChild(wrap);

    var fab = wrap.querySelector('.chub-fab'), pop = wrap.querySelector('.chub-pop');
    var status = wrap.querySelector('.chub-copy-status');
    function open() {
      loadTally();
      pop.hidden = false;
      requestAnimationFrame(function () { wrap.classList.add('open'); });
      fab.setAttribute('aria-expanded', 'true');
    }
    function close(refocus) {
      if (pop.hidden) return;
      wrap.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
      setTimeout(function () { if (!wrap.classList.contains('open')) pop.hidden = true; }, 260);
      if (refocus) fab.focus({ preventScroll: true });
    }
    fab.addEventListener('click', function () { pop.hidden ? open() : close(); });
    wrap.querySelector('.chub-row-form').addEventListener('click', function (e) { e.preventDefault(); close(); openForm(); });
    wrap.querySelector('.chub-copy').addEventListener('click', function () {
      var ok = function () { status.textContent = 'Copied ♡'; };
      var show = function () { status.textContent = EMAIL; };
      try { navigator.clipboard.writeText(EMAIL).then(ok, show); } catch (e) { show(); }
    });
    document.addEventListener('click', function (e) { if (!pop.hidden && !e.target.closest('.chub')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) close(true); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

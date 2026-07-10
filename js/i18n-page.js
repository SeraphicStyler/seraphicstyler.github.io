/* Seraphic Styler — per-page i18n engine (directory + field guide)
   ----------------------------------------------------------------------
   Why this exists instead of js/i18n.js + js/translations.js:
   those two pages use NONE of the 341 homepage keys, yet were loading the
   whole 597KB dictionary. Here each page loads exactly one bundle for the
   language actually chosen: js/i18n/<page>.<lang>.js (~10–20KB).

   Bundles are .js (not .json) on purpose — a <script> injection works over
   file:// and is cached by the service worker like any other static asset,
   whereas fetch() of a JSON file fails on file:// preview.

   Markup hooks:
     data-i18n="key"      → element.innerHTML
     data-i18n-ph="key"   → placeholder
     data-i18n-al="key"   → aria-label
     data-i18n-ti="key"   → title
   English lives inline in the HTML and is cached on load as the fallback,
   so a missing key degrades to English rather than to an empty node.

   Dynamic strings (built in JS, not markup) read window.SS_T(key, enDefault)
   and interpolate {placeholders} via window.SS_TF(key, enDefault, vars).

   Page declares itself with <html data-i18n-page="fd">.

   HONESTY RULE: the selector lists a language only if a validated bundle for THIS
   page actually shipped. js/i18n/manifest.js (generated) sets
   window.SS_I18N_AVAILABLE = {fd:[…], fg:[…]}. A language complete on one page and
   not the other is offered only where it is complete — never offered and then
   silently rendered in English. A missing manifest means English only.

   A preference the current page can't honour (chosen on a page that does have it)
   renders English WITHOUT overwriting the stored choice, so it survives navigation.
   ====================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var PAGE = root.getAttribute('data-i18n-page') || '';

  var LANGS = [
    { code: 'en', name: 'English' },      { code: 'vi', name: 'Tiếng Việt' },
    { code: 'zh', name: '中文 (简体)' },   { code: 'es', name: 'Español' },
    { code: 'ar', name: 'العربية' },       { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },     { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },        { code: 'de', name: 'Deutsch' },
    { code: 'ko', name: '한국어' },        { code: 'hi', name: 'हिन्दी' },
    { code: 'id', name: 'Bahasa Indonesia' }, { code: 'th', name: 'ไทย' },
    { code: 'it', name: 'Italiano' },      { code: 'tr', name: 'Türkçe' },
    { code: 'tl', name: 'Filipino' },      { code: 'pl', name: 'Polski' },
    { code: 'nl', name: 'Nederlands' },    { code: 'fa', name: 'فارسی' },
    { code: 'zgh', name: 'ⵜⴰⵎⴰⵣⵉⵖⵜ' }
  ];
  var RTL = { ar: 1, fa: 1, he: 1, ur: 1 };
  /* Tifinagh (Amazigh/Berber) is written left-to-right despite the region — do not add
     zgh here. Its glyphs need Noto Sans Tifinagh, loaded in the page <head>. */

  /* Only English plus the languages this page actually shipped a bundle for. */
  var avail = window.SS_I18N_AVAILABLE || {};
  var shipped = Array.isArray(avail) ? avail : (avail[PAGE] || []);
  var VALID = { en: 1 };
  shipped.forEach(function (c) { VALID[c] = 1; });
  LANGS = LANGS.filter(function (l) { return VALID[l.code]; });

  var DICT = {};                 // lang -> { key: string }
  var loaded = { en: true };     // en needs no bundle
  var pending = {};              // lang -> [callbacks]
  var cache = { html: {}, ph: {}, al: {}, ti: {} };
  var cur = 'en';

  /* Bundles call this on load. */
  window.SS_I18N_ADD = function (page, lang, obj) {
    if (page !== PAGE) return;                       // ignore a stray bundle
    DICT[lang] = Object.assign(DICT[lang] || {}, obj);
    loaded[lang] = true;
  };

  /* Dynamic-string lookup, with the English default carried at the call site. */
  window.SS_T = function (key, en) {
    var d = DICT[cur]; var v = d && d[key];
    return (v == null || v === '') ? en : v;
  };
  /* Same, then {placeholder} interpolation. Missing vars are left intact. */
  window.SS_TF = function (key, en, vars) {
    var s = window.SS_T(key, en);
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return (vars && vars[k] != null) ? vars[k] : m;
    });
  };
  window.SS_LANG = function () { return cur; };
  window.SS_LANGS_LIST = LANGS;

  function cacheEnglish() {
    var pairs = [['data-i18n', 'html'], ['data-i18n-ph', 'ph'], ['data-i18n-al', 'al'], ['data-i18n-ti', 'ti']];
    pairs.forEach(function (p) {
      document.querySelectorAll('[' + p[0] + ']').forEach(function (el) {
        var k = el.getAttribute(p[0]);
        if (cache[p[1]][k] != null) return;
        cache[p[1]][k] = p[1] === 'html' ? el.innerHTML
          : el.getAttribute(p[1] === 'ph' ? 'placeholder' : p[1] === 'al' ? 'aria-label' : 'title') || '';
      });
    });
  }

  function load(code, cb) {
    if (loaded[code]) return cb(true);
    if (pending[code]) { pending[code].push(cb); return; }
    pending[code] = [cb];
    var s = document.createElement('script');
    s.src = 'js/i18n/' + PAGE + '.' + code + '.js';
    s.async = true;
    var done = function (ok) {
      var q = pending[code]; delete pending[code];
      (q || []).forEach(function (f) { f(ok); });
    };
    s.onload = function () { done(!!loaded[code]); };
    s.onerror = function () { done(false); };   // network/missing bundle → stay English
    document.head.appendChild(s);
  }

  function paint(code, persist) {
    cur = code;
    var t = code === 'en' ? null : (DICT[code] || null);
    var pick = function (store, k) { var v = t && t[k]; return (v == null || v === '') ? store[k] : v; };

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = pick(cache.html, el.getAttribute('data-i18n'));
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = pick(cache.ph, el.getAttribute('data-i18n-ph'));
      if (v != null) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('[data-i18n-al]').forEach(function (el) {
      var v = pick(cache.al, el.getAttribute('data-i18n-al'));
      if (v != null) el.setAttribute('aria-label', v);
    });
    document.querySelectorAll('[data-i18n-ti]').forEach(function (el) {
      var v = pick(cache.ti, el.getAttribute('data-i18n-ti'));
      if (v != null) el.setAttribute('title', v);
    });

    /* Only record a language the reader actually got. Falling back to English
       must not clobber a preference they set on a page that does support it. */
    if (persist !== false) { try { localStorage.setItem('ss-lang', code); } catch (e) {} }
    var sel = document.getElementById('langSelect');
    if (sel && sel.value !== code) sel.value = code;

    /* LAST: pages observe <html lang> to re-render their dynamic strings —
       fire that only once the dictionary is in place. */
    root.setAttribute('dir', RTL[code] ? 'rtl' : 'ltr');
    root.setAttribute('lang', code);
  }

  /* Public: switch language (loads the bundle first, falls back to English). */
  function apply(code, persist) {
    if (!VALID[code]) return paint('en', false);   // not shipped → English, pref untouched
    if (code === 'en') return paint('en', persist);
    load(code, function (ok) { paint(ok ? code : 'en', ok ? persist : false); });
  }
  window.SS_setLang = apply;

  function init() {
    cacheEnglish();
    var sel = document.getElementById('langSelect');
    if (sel) {
      /* One language shipped (English) → a selector would be a menu of one. */
      if (LANGS.length < 2) { sel.hidden = true; }
      else {
        sel.innerHTML = '';
        LANGS.forEach(function (l) {
          var o = document.createElement('option');
          o.value = l.code; o.textContent = l.name;
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () { apply(sel.value); });
      }
    }
    var saved = 'en';
    try { saved = localStorage.getItem('ss-lang') || 'en'; } catch (e) {}
    apply(saved);   // an unshipped preference silently renders English, and survives
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

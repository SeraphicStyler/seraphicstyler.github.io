/* Directory/field-guide language loader. The manifest covers validated source
   bundles, not every new passage on a page. Load only the selected language;
   preserve unsupported preferences and reject stale asynchronous selections.
   DOM text, placeholders, accessible names, and titles use js/i18n-dom.js. */
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
  var revision = 0;
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

  function cacheEnglish() { window.SS_I18N_DOM.cache(); }

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
    window.SS_I18N_DOM.paint(t, code);

    /* Only record a language the reader actually got. Falling back to English
       must not clobber a preference they set on a page that does support it. */
    if (persist !== false) { try { localStorage.setItem('ss-lang', code); } catch (e) {} }
    var sel = document.getElementById('langSelect');
    if (sel && sel.value !== code) sel.value = code;

    /* LAST: pages observe <html lang> to re-render their dynamic strings —
       fire that only once the dictionary is in place. */
    root.setAttribute('dir', RTL[code] ? 'rtl' : 'ltr');
    root.setAttribute('lang', code);
    document.dispatchEvent(new CustomEvent('ss:lang', { detail: { lang: code } }));
  }

  /* Public: switch language (loads the bundle first, falls back to English). */
  function apply(code, persist) {
    var ticket = ++revision;
    if (!VALID[code]) return paint('en', false);   // not shipped → English, pref untouched
    if (code === 'en') return paint('en', persist);
    load(code, function (ok) { if (ticket === revision) paint(ok ? code : 'en', ok ? persist : false); });
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

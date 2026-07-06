/* Seraphic Styler — i18n engine (any number of languages)
   ----------------------------------------------------------------------
   How it works:
   - English is written directly in index.html (the default + fallback).
   - Each translatable element has data-i18n="key" (or data-i18n-ph for an
     input placeholder). On load this engine caches the English original.
   - Other languages live in js/translations.js as window.SS_TRANSLATIONS
     and are listed in window.SS_LANGS. To ADD A LANGUAGE: add one entry to
     SS_LANGS and one object of the same keys to SS_TRANSLATIONS. That's it.
   ====================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var LANGS = window.SS_LANGS || [{ code: 'en', name: 'English' }];
  var DICT = window.SS_TRANSLATIONS || {};
  var RTL = { ar: 1, he: 1, fa: 1, ur: 1 }; // right-to-left languages
  var cache = { html: {}, ph: {} };
  var cached = false;

  function cacheEnglish() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      cache.html[el.getAttribute('data-i18n')] = el.innerHTML;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      cache.ph[el.getAttribute('data-i18n-ph')] = el.getAttribute('placeholder') || '';
    });
    cached = true;
  }

  function apply(code) {
    if (!cached) cacheEnglish();
    var t = (code === 'en') ? null : (DICT[code] || null);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var v = t && t[k] != null ? t[k] : cache.html[k];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      var v = t && t[k] != null ? t[k] : cache.ph[k];
      if (v != null) el.setAttribute('placeholder', v);
    });
    root.setAttribute('lang', code);
    root.setAttribute('dir', RTL[code] ? 'rtl' : 'ltr');
    try { localStorage.setItem('ss-lang', code); } catch (e) {}
    var sel = document.getElementById('langSelect');
    if (sel && sel.value !== code) sel.value = code;
  }

  // Public API
  window.SS_setLang = apply;

  function init() {
    cacheEnglish();
    var sel = document.getElementById('langSelect');
    if (sel) {
      sel.innerHTML = '';
      LANGS.forEach(function (l) {
        var o = document.createElement('option');
        o.value = l.code; o.textContent = l.name; sel.appendChild(o);
      });
      sel.addEventListener('change', function () { apply(sel.value); });
    }
    var saved = 'en';
    try { saved = localStorage.getItem('ss-lang') || 'en'; } catch (e) {}
    if (!DICT[saved] && saved !== 'en') saved = 'en';
    apply(saved);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

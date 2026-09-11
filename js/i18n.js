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
  var cur = 'en';
  function cacheEnglish() { window.SS_I18N_DOM.cache(); }
  function apply(code, persist) {
    if (code !== 'en' && !DICT[code]) { code = 'en'; persist = false; }
    cur = code;
    window.SS_I18N_DOM.paint(code === 'en' ? null : DICT[code], code);
    root.setAttribute('lang', code);
    root.setAttribute('dir', RTL[code] ? 'rtl' : 'ltr');
    if (persist !== false) { try { localStorage.setItem('ss-lang', code); } catch (e) {} }
    document.querySelectorAll('#langSelect, .ss-lang-select').forEach(function (s) {
      if (s.value !== code) s.value = code;
    });
    document.dispatchEvent(new CustomEvent('ss:lang', { detail: { lang: code } }));
  }

  // Public API
  window.SS_setLang = apply;
  window.SS_LANG = function () { return cur; };
  /* Dynamic-string lookup (English default carried at the call site), with {placeholder} interpolation. */
  window.SS_T = function (key, en) {
    var t = (cur === 'en') ? null : (DICT[cur] || null);
    var v = t && t[key];
    return (v == null || v === '') ? en : v;
  };
  window.SS_TF = function (key, en, vars) {
    return String(window.SS_T(key, en)).replace(/\{(\w+)\}/g, function (m, k) {
      return (vars && vars[k] != null) ? vars[k] : m;
    });
  };

  function init() {
    cacheEnglish();
    function fillSelect(sel) {
      if (!sel) return;
      sel.innerHTML = '';
      LANGS.forEach(function (l) {
        var o = document.createElement('option');
        o.value = l.code; o.textContent = l.name; sel.appendChild(o);
      });
      sel.addEventListener('change', function () { apply(sel.value); });
    }
    fillSelect(document.getElementById('langSelect'));
    document.querySelectorAll('.ss-lang-select').forEach(fillSelect);
    var saved = 'en';
    try { saved = localStorage.getItem('ss-lang') || 'en'; } catch (e) {}
    apply(saved);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

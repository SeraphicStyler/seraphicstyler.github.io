/* Seraphic Styler — keyed translations.
   English is written inline in each page (default + fallback). Every other
   language lives in js/i18n/keys.<code>.js and is fetched only when a visitor
   chooses it, so English readers download none of them.
   TO ADD A LANGUAGE: add [code, name] below and a js/i18n/keys.<code>.js that
   calls SS_KEYS_ADD(code, {...}) with the same keys. Missing keys fall back to
   English. (Machine-assisted — have a native speaker review.) */
(function () {
  'use strict';
  window.SS_LANGS = [
    ['en', 'English'], ['vi', 'Tiếng Việt'], ['zh', '中文 (简体)'], ['es', 'Español'],
    ['ar', 'العربية'], ['fr', 'Français'], ['pt', 'Português'], ['ru', 'Русский'],
    ['ja', '日本語'], ['de', 'Deutsch'], ['ko', '한국어'], ['hi', 'हिन्दी'],
    ['id', 'Bahasa Indonesia'], ['th', 'ไทย'], ['it', 'Italiano'], ['tr', 'Türkçe'],
    ['tl', 'Filipino'], ['pl', 'Polski'], ['nl', 'Nederlands'], ['fa', 'فارسی'],
    ['km', 'ភាសាខ្មែរ']
  ].map(function (l) { return { code: l[0], name: l[1] }; });

  var T = window.SS_TRANSLATIONS = window.SS_TRANSLATIONS || {};
  var script = typeof document !== 'undefined' && document.currentScript;
  var base = script ? script.src.replace(/[^/]*$/, 'i18n/') : 'js/i18n/';
  /* A page with its own strings names them: data-page="links" loads
     js/i18n/links.<code>.js alongside the shared keys.<code>.js. */
  var bundles = ['keys'].concat(script && script.getAttribute('data-page') ? [script.getAttribute('data-page')] : []);
  var loads = {}, ready = {};

  /* Language files call this. Page strings (page = true) override shared ones,
     whichever arrives first; strings merged earlier by estimate-i18n.js are kept. */
  window.SS_KEYS_ADD = function (code, dict, page) {
    T[code] = page ? Object.assign(T[code] || {}, dict) : Object.assign({}, dict, T[code]);
    ready[(page ? 'page' : 'keys') + code] = true;
    if (window.SS_KEYS_AFTER) window.SS_KEYS_AFTER(code, T[code]);
  };

  function known(code) { return code !== 'en' && window.SS_LANGS.some(function (l) { return l.code === code; }); }
  function fetchOne(name, code) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = base + name + '.' + code + '.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error(name + '.' + code)); };
      document.head.appendChild(s);
    });
  }

  /* Resolves once `code` is ready. English and unknown codes resolve at once. */
  window.SS_KEYS = function (code) {
    if (!known(code)) return Promise.resolve();
    return loads[code] || (loads[code] = Promise.all(bundles.map(function (name) { return fetchOne(name, code); }))
      .catch(function (e) { delete loads[code]; throw e; }));
  };
  /* True when `code` can be painted right now, with no fetch. */
  window.SS_KEYS.has = function (code) {
    return !known(code) || (ready['keys' + code] && (bundles.length < 2 || ready['page' + code])) === true;
  };
})();

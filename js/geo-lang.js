/* Location-based language detection. Asks once via a soft consent card, never
   overrides a language the visitor picked manually. Only the country code is
   used; coordinates are never stored. Exposes window.SS_GEO_LANG for tests. */
(function () {
  'use strict';
  if (window.SS_GEO_LANG) return;

  var ASK_KEY = 'ss-geo-lang', LANG_KEY = 'ss-lang';
  var SUPPORTED = ['en', 'vi', 'zh', 'es', 'ar', 'fr', 'pt', 'ru', 'ja', 'de', 'ko', 'hi', 'id', 'th', 'it', 'tr', 'tl', 'pl', 'nl', 'fa', 'km'];
  var NAMES = {
    en: 'English', vi: 'Tiếng Việt', zh: '中文 (简体)', es: 'Español', ar: 'العربية', fr: 'Français',
    pt: 'Português', ru: 'Русский', ja: '日本語', de: 'Deutsch', ko: '한국어', hi: 'हिन्दी',
    id: 'Bahasa Indonesia', th: 'ไทย', it: 'Italiano', tr: 'Türkçe', tl: 'Filipino', pl: 'Polski',
    nl: 'Nederlands', fa: 'فارسی', km: 'ភាសាខ្មែរ'
  };
  var MAP = {
    VN: 'vi',
    CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es', GT: 'es', CU: 'es', DO: 'es', BO: 'es', PY: 'es', UY: 'es', SV: 'es', HN: 'es', NI: 'es', CR: 'es', PA: 'es',
    SA: 'ar', AE: 'ar', EG: 'ar', QA: 'ar', KW: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar', IQ: 'ar', JO: 'ar', LB: 'ar', BH: 'ar', OM: 'ar', YE: 'ar', SD: 'ar',
    FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr',
    PT: 'pt', BR: 'pt',
    RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru',
    JP: 'ja',
    DE: 'de', AT: 'de', CH: 'de', LI: 'de',
    KR: 'ko',
    IN: 'hi',
    ID: 'id',
    TH: 'th',
    IT: 'it', SM: 'it',
    TR: 'tr',
    PH: 'tl',
    PL: 'pl',
    NL: 'nl',
    IR: 'fa',
    KH: 'km'
  };

  function langForCountry(cc) { return MAP[String(cc || '').toUpperCase()] || 'en'; }
  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function current() {
    var fromEngine = typeof window.SS_LANG === 'function' ? window.SS_LANG() : null;
    return fromEngine || document.documentElement.lang || 'en';
  }
  function setLang(code) { if (typeof window.SS_setLang === 'function') window.SS_setLang(code); }

  var styles = document.createElement('style');
  styles.textContent =
    '.geo-lang-card,.geo-lang-toast{position:fixed;left:1rem;z-index:600;max-width:19rem;padding:.9rem 1rem;border:1px solid var(--surface-border);border-radius:1rem;background:color-mix(in srgb,var(--surface-solid) 85%,transparent);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:0 12px 32px -18px rgba(35,58,114,.45);font:400 .78rem/1.6 var(--font-body);color:var(--text-secondary)}' +
    '.geo-lang-card{bottom:5.5rem;animation:geo-lang-in .5s var(--ss-ease,ease)}' +
    '.geo-lang-toast{bottom:1.25rem;display:flex;align-items:center;gap:.75rem;animation:geo-lang-in .4s ease}' +
    '.geo-lang-card p{margin:0 0 .7rem}' +
    '.geo-lang-actions{display:flex;gap:.6rem}' +
    '.geo-lang-yes,.geo-lang-no,.geo-lang-undo{font:500 .68rem var(--font-accent);letter-spacing:.08em;text-transform:uppercase;min-height:36px;padding:.45rem .9rem;border-radius:99px;cursor:pointer}' +
    '.geo-lang-yes{border:1px solid var(--accent);background:var(--accent);color:var(--cta-text,#fff)}' +
    '.geo-lang-no,.geo-lang-undo{border:1px solid var(--surface-border);background:transparent;color:var(--text-primary)}' +
    '.geo-lang-undo{margin-left:auto;text-decoration:underline;border:0}' +
    '.geo-lang-row .a11y-h{flex:1 1 auto}' +
    '.geo-lang-row button{flex:0 0 auto}' +
    '@keyframes geo-lang-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    'html.rm .geo-lang-card,html.rm .geo-lang-toast{animation:none}';
  document.head.appendChild(styles);

  var card = null, toast = null, toastTimer = 0;

  function dismiss() { if (card) { card.remove(); card = null; } }
  function dismissToast() { if (toast) { toast.remove(); toast = null; } clearTimeout(toastTimer); }

  function showToast(message, undoCode) {
    dismissToast();
    toast = document.createElement('div');
    toast.className = 'geo-lang-toast';
    toast.setAttribute('role', 'status');
    var span = document.createElement('span');
    span.textContent = message;
    toast.appendChild(span);
    if (undoCode) {
      var undo = document.createElement('button');
      undo.type = 'button';
      undo.className = 'geo-lang-undo';
      undo.textContent = 'Undo';
      undo.addEventListener('click', function () { setLang(undoCode); dismissToast(); });
      toast.appendChild(undo);
    }
    document.body.appendChild(toast);
    toastTimer = setTimeout(dismissToast, 9000);
  }

  function apply(countryCode) {
    var code = langForCountry(countryCode);
    if (SUPPORTED.indexOf(code) < 0 || code === 'en' || code === current()) return;
    var previous = current();
    setLang(code);
    showToast('Switched to ' + (NAMES[code] || code) + ' — change anytime in Settings.', previous);
  }

  function reverseGeocode(lat, lon) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : 0;
    return fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=en',
      ctrl ? { signal: ctrl.signal } : {})
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { return data && data.countryCode; })
      .finally(function () { clearTimeout(timer); });
  }

  function detect(fromSettings) {
    dismiss();
    store(ASK_KEY, 'accepted');
    if (!navigator.geolocation) { store(ASK_KEY, 'unavailable'); return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        .then(function (cc) { if (cc) apply(cc); })
        .catch(function () {});
    }, function () {
      store(ASK_KEY, 'denied');
      if (fromSettings) showToast('Location unavailable — pick a language above.');
    }, { timeout: 8000, maximumAge: 86400000 });
  }

  function showCard() {
    if (card) return;
    card = document.createElement('div');
    card.className = 'geo-lang-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Language detection');
    var p = document.createElement('p');
    p.textContent = 'See the site in your language? Share your location once — nothing is stored; only your country is used to pick a language.';
    var actions = document.createElement('div');
    actions.className = 'geo-lang-actions';
    var yes = document.createElement('button');
    yes.type = 'button';
    yes.className = 'geo-lang-yes';
    yes.textContent = 'Use my location';
    yes.addEventListener('click', function () { detect(false); });
    var no = document.createElement('button');
    no.type = 'button';
    no.className = 'geo-lang-no';
    no.textContent = 'Not now';
    no.addEventListener('click', function () { store(ASK_KEY, 'declined'); dismiss(); });
    actions.appendChild(yes);
    actions.appendChild(no);
    card.appendChild(p);
    card.appendChild(actions);
    document.body.appendChild(card);
  }

  function injectSettingsRow() {
    var select = document.querySelector('#langSelect, .ss-lang-select');
    if (!select) return;
    var langRow = select.closest('.a11y-row');
    if (!langRow || !langRow.parentNode) return;
    var row = document.createElement('div');
    row.className = 'a11y-row geo-lang-row';
    var label = document.createElement('p');
    label.className = 'a11y-h';
    label.textContent = 'Detect from location';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'geo-lang-no';
    btn.textContent = 'Detect';
    btn.addEventListener('click', function () { detect(true); });
    row.appendChild(label);
    row.appendChild(btn);
    langRow.parentNode.insertBefore(row, langRow.nextSibling);
  }

  function boot() {
    injectSettingsRow();
    var host = location.hostname;
    var debug = /[?&]geolang=([A-Za-z]{2})\b/.exec(location.search);
    if (debug && (host === '127.0.0.1' || host === 'localhost')) { apply(debug[1]); return; }
    if (read(LANG_KEY) || read(ASK_KEY)) return;
    if (!navigator.geolocation) { store(ASK_KEY, 'unavailable'); return; }
    setTimeout(showCard, 1500);
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dismiss(); });

  window.SS_GEO_LANG = { ask: showCard, detect: detect, langForCountry: langForCountry };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

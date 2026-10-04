/* Language suggestion. From the visitor's time zone (no permission prompt), it
   offers the matching language once in a small card and never switches by
   itself or overrides a language the visitor picked. "Detect from location"
   in Settings still uses the browser's location, on request only.
   Exposes window.SS_GEO_LANG for tests. */
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

  /* The visitor's time zone names their country closely enough to suggest a
     language, with no permission prompt and nothing sent anywhere. */
  var TZ_COUNTRY = {
    'Asia/Ho_Chi_Minh':'VN','Asia/Saigon':'VN','Asia/Shanghai':'CN','Asia/Chongqing':'CN','Asia/Urumqi':'CN','Asia/Hong_Kong':'HK','Asia/Macau':'MO','Asia/Taipei':'TW',
    'Asia/Tokyo':'JP','Asia/Seoul':'KR','Asia/Bangkok':'TH','Asia/Jakarta':'ID','Asia/Makassar':'ID','Asia/Jayapura':'ID','Asia/Pontianak':'ID','Asia/Manila':'PH',
    'Asia/Phnom_Penh':'KH','Asia/Kolkata':'IN','Asia/Calcutta':'IN','Asia/Tehran':'IR','Asia/Riyadh':'SA','Asia/Dubai':'AE','Asia/Qatar':'QA','Asia/Kuwait':'KW',
    'Asia/Bahrain':'BH','Asia/Muscat':'OM','Asia/Amman':'JO','Asia/Beirut':'LB','Asia/Baghdad':'IQ','Asia/Aden':'YE','Africa/Cairo':'EG','Africa/Casablanca':'MA',
    'Africa/Algiers':'DZ','Africa/Tunis':'TN','Africa/Tripoli':'LY','Africa/Khartoum':'SD','Europe/Paris':'FR','Europe/Brussels':'BE','Europe/Luxembourg':'LU',
    'Europe/Monaco':'MC','Europe/Berlin':'DE','Europe/Vienna':'AT','Europe/Zurich':'CH','Europe/Madrid':'ES','Europe/Lisbon':'PT','Europe/Rome':'IT',
    'Europe/Warsaw':'PL','Europe/Amsterdam':'NL','Europe/Istanbul':'TR','Europe/Moscow':'RU','Europe/Minsk':'BY','Asia/Almaty':'KZ','Asia/Bishkek':'KG',
    'America/Mexico_City':'MX','America/Bogota':'CO','America/Lima':'PE','America/Santiago':'CL','America/Caracas':'VE','America/Guayaquil':'EC',
    'America/Argentina/Buenos_Aires':'AR','America/Buenos_Aires':'AR','America/Montevideo':'UY','America/Asuncion':'PY','America/La_Paz':'BO',
    'America/Sao_Paulo':'BR','America/Guatemala':'GT','America/Havana':'CU','America/Santo_Domingo':'DO','America/Panama':'PA','America/Costa_Rica':'CR'
  };
  function countryFromTimeZone() {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
    return TZ_COUNTRY[tz] || null;
  }
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

  var card = null, toast = null, toastTimer = 0, offerTimer = 0;
  var EN_NAMES = null;
  try { EN_NAMES = new Intl.DisplayNames(['en'], { type: 'language' }); } catch (_) {}
  function englishName(code) { return (EN_NAMES && EN_NAMES.of(code)) || NAMES[code] || code; }

  function dismiss() { clearTimeout(offerTimer); offerTimer = 0; if (card) { card.remove(); card = null; } }
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
    if (SUPPORTED.indexOf(code) < 0) return;
    if (code === current()) {
      showToast("You're already viewing in " + (code === 'en' ? 'English' : (NAMES[code] || code)) + '.');
      return;
    }
    var previous = current();
    setLang(code);
    showToast('Switched to ' + (NAMES[code] || code) + ' — change anytime in Settings.', previous);
  }

  function reverseGeocode(lat, lon) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timedOut = false;
    var timer = ctrl ? setTimeout(function () { timedOut = true; ctrl.abort(); }, 5000) : 0;
    return fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=en',
      ctrl ? { signal: ctrl.signal } : {})
      .then(function (res) { if (!res.ok) throw new Error('http'); return res.json(); })
      .then(function (data) {
        var cc = data && data.countryCode;
        if (typeof cc !== 'string' || !/^[A-Za-z]{2}$/.test(cc)) throw new Error('country');
        return cc;
      })
      .catch(function (err) {
        if (timedOut) throw new Error('timeout');
        if (err && (err.message === 'http' || err.message === 'country')) throw err;
        throw new Error('network');
      })
      .finally(function () { clearTimeout(timer); });
  }

  function detect(fromSettings) {
    dismiss();
    store(ASK_KEY, 'accepted');
    if (!navigator.geolocation) {
      store(ASK_KEY, 'unavailable');
      if (fromSettings) showToast('Language detection failed — retry Detect or pick a language above.');
      return;
    }
    navigator.geolocation.getCurrentPosition(function (pos) {
      reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        .then(function (cc) { apply(cc); })
        .catch(function (reason) {
          store(ASK_KEY, 'unavailable');
          if (fromSettings) showToast(
            reason && reason.message === 'timeout' ? 'Language detection timed out — retry Detect or pick a language above.' :
            reason && reason.message === 'country' ? 'Could not determine your country — retry Detect or pick a language above.' :
            'Language detection failed — retry Detect or pick a language above.');
        });
    }, function (err) {
      if (err && err.code === 3) {
        store(ASK_KEY, 'unavailable');
        if (fromSettings) showToast('Language detection timed out — retry Detect or pick a language above.');
        return;
      }
      store(ASK_KEY, 'denied');
      if (fromSettings) showToast('Location unavailable — pick a language above.');
    }, { timeout: 8000, maximumAge: 86400000 });
  }

  function offer(code) {
    if (card) return;
    card = document.createElement('div');
    card.className = 'geo-lang-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Language');
    var p = document.createElement('p');
    p.textContent = 'View this site in ' + (NAMES[code] || code) + '?';
    var actions = document.createElement('div');
    actions.className = 'geo-lang-actions';
    var yes = document.createElement('button');
    yes.type = 'button'; yes.className = 'geo-lang-yes'; yes.lang = code; yes.textContent = NAMES[code] || code;
    yes.addEventListener('click', function () { store(ASK_KEY, 'accepted'); var previous = current(); dismiss(); setLang(code); showToast('Switched to ' + (NAMES[code] || code) + ' — change anytime in Settings.', previous); });
    var no = document.createElement('button');
    no.type = 'button'; no.className = 'geo-lang-no'; no.textContent = 'Keep ' + englishName(current());
    no.addEventListener('click', function () { store(ASK_KEY, 'declined'); dismiss(); });
    actions.appendChild(yes); actions.appendChild(no);
    card.appendChild(p); card.appendChild(actions);
    document.body.appendChild(card);
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
    var code = langForCountry(countryFromTimeZone());
    if (SUPPORTED.indexOf(code) < 0 || code === 'en' || code === current()) return;   // English-speaking or unknown time zone: say nothing
    offerTimer = setTimeout(function () {
      offerTimer = 0;
      if (read(LANG_KEY) || read(ASK_KEY)) return;
      if (SUPPORTED.indexOf(code) < 0 || code === 'en' || code === current()) return;
      offer(code);
    }, 1500);
  }

  document.addEventListener('change', function (e) {
    if (e.target && e.target.matches && e.target.matches('#langSelect, .ss-lang-select')) dismiss();
  });
  document.addEventListener('ss:lang', function () { if (read(LANG_KEY) || current() !== 'en') dismiss(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dismiss(); });

  window.SS_GEO_LANG = { ask: showCard, offer: offer, detect: detect, langForCountry: langForCountry, countryFromTimeZone: countryFromTimeZone };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

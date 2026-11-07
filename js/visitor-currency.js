/* Seraphic Styler — prices in the visitor's own currency (7 Nov 2026).
   ------------------------------------------------------------------------
   Her decision: public pages show ONE currency, the visitor's, picked from
   their time zone (no permission, no pop-up). Đồng belongs on invoices.
   Currencies: USD + the 27 in pricing.js fx.display; everyone else sees USD. Converted
   figures use pricing.js fx.display: max(live, floor) × (1 + cushion),
   rounded up (7 Nov 2026).

   How it works, without touching any page's markup:
     · đồng shown beside a dollar figure (.money-alt, .gf-sub, .vnd,
       "6,250,000₫ · $250", "$100 ≈ 2,500,000₫") is dropped;
     · a đồng amount on its own ("350,000₫ minimum") becomes "~$14";
     · for a visitor outside the US, dollar amounts become "~€225" once
       live rates load (USD is shown until then), cushioned and rounded up;
     · exchange-rate statements ("26,300₫ to the dollar") are left alone.
   Skipped: the estimators (they already lead with the visitor's currency),
   forms, and anything marked [data-vc-skip]. If a page has [data-vc-root]
   elements, only those are touched.
   A visitor's own pick is shared with the estimator (localStorage
   'ss-est-cur'), so both always agree. Re-runs on language switches and on
   content added later (concierge answers). */
(function () {
  'use strict';
  var P = window.SS_PRICING && window.SS_PRICING.data;
  var PEG = (P && P.fx && P.fx.vndPerUsd) || 25000;
  /* USD + five currencies, with a cushion and a floor per currency (js/pricing.js fx.display). */
  var DFX = (P && P.fx && P.fx.display) || {};
  var LIST = DFX.currencies || ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
  var CUSHION = DFX.cushion || {}, FLOOR = DFX.floor || {};
  var KEY = 'ss-est-cur';
  var SKIP = 'script,style,noscript,textarea,input,select,option,code,pre,svg,form,[contenteditable],[data-vc-skip],' +
             '.money-alt,.gf-sub,.vnd,#estimate,.estimator,#btqEst,#boutique,.pr-btq,.sp-field,.vc-chip';

  /* ---- Which currency ------------------------------------------------- */
  var EURO = /^Europe\/(Paris|Berlin|Madrid|Rome|Amsterdam|Brussels|Vienna|Lisbon|Athens|Helsinki|Dublin|Luxembourg|Bratislava|Ljubljana|Tallinn|Riga|Vilnius|Malta|Zagreb|Monaco|Andorra|San_Marino|Vatican)$|^Atlantic\/(Madeira|Canary|Azores)$|^Asia\/(Nicosia|Famagusta)$/;
  var CANADA = /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Whitehorse|Yellowknife|Iqaluit|Glace_Bay|Goose_Bay|Swift_Current|Dawson_Creek|Fort_Nelson)$/;
  var EXACT = { 'Europe/London': 'GBP', 'Europe/Belfast': 'GBP', 'Europe/Jersey': 'GBP', 'Europe/Guernsey': 'GBP', 'Europe/Isle_of_Man': 'GBP',
    'Asia/Tokyo': 'JPY', 'Pacific/Auckland': 'NZD', 'Pacific/Chatham': 'NZD', 'Europe/Zurich': 'CHF', 'Europe/Vaduz': 'CHF',
    'Europe/Stockholm': 'SEK', 'Europe/Oslo': 'NOK', 'Europe/Copenhagen': 'DKK', 'Europe/Warsaw': 'PLN', 'Europe/Prague': 'CZK',
    'Asia/Singapore': 'SGD', 'Asia/Hong_Kong': 'HKD', 'Asia/Seoul': 'KRW', 'Asia/Taipei': 'TWD',
    'Asia/Shanghai': 'CNY', 'Asia/Chongqing': 'CNY', 'Asia/Harbin': 'CNY', 'Asia/Urumqi': 'CNY',
    'Asia/Bangkok': 'THB', 'Asia/Kuala_Lumpur': 'MYR', 'Asia/Kuching': 'MYR', 'Asia/Manila': 'PHP',
    'Asia/Jakarta': 'IDR', 'Asia/Makassar': 'IDR', 'Asia/Jayapura': 'IDR', 'Asia/Pontianak': 'IDR',
    'Asia/Kolkata': 'INR', 'Asia/Calcutta': 'INR', 'Asia/Dubai': 'AED', 'Asia/Riyadh': 'SAR',
    'America/Sao_Paulo': 'BRL', 'America/Bahia': 'BRL', 'America/Fortaleza': 'BRL', 'America/Recife': 'BRL', 'America/Manaus': 'BRL', 'America/Belem': 'BRL',
    'Africa/Johannesburg': 'ZAR' };
  var MEXICO = /^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana)$/;
  function zoneCurrency() {
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var c = EXACT[tz] || (/^Australia\//.test(tz) ? 'AUD' : EURO.test(tz) ? 'EUR' : CANADA.test(tz) ? 'CAD' : MEXICO.test(tz) ? 'MXN' : 'USD');
    return LIST.indexOf(c) >= 0 ? c : 'USD';
  }
  function picked() { try { var c = localStorage.getItem(KEY); return LIST.indexOf(c) >= 0 ? c : null; } catch (e) { return null; } }
  var cur = picked() || zoneCurrency();
  if (LIST.indexOf(cur) < 0) cur = 'USD';
  var rates = null;   // units of each currency per 1 USD

  /* ---- Formatting ----------------------------------------------------- */
  /* Units of the visitor's currency per US$1, as I quote it: never below the floor, plus the cushion. */
  function rate() {
    if (cur === 'USD') return 1;
    var live = rates && Number(rates[cur]);
    if (!(live > 0)) return NaN;
    return Math.max(live, Number(FLOOR[cur]) || 0) * (1 + (Number(CUSHION[cur]) || 0.05));
  }
  /* Round UP to a calm figure, so conversion never rounds against me. */
  function calm(v, c) {
    var step = c === 'JPY' ? (v >= 10000 ? 500 : v >= 1000 ? 100 : 10)
             : v >= 1000 ? Math.pow(10, Math.floor(Math.log10(v)) - 2)   // 3 significant figures: 1,240 · 36,800 · 4,530,000
             : v >= 100 ? 5 : v >= 10 ? 1 : 0.5;
    return Math.ceil(v / step - 1e-9) * step;
  }
  function shown() { return Number.isFinite(rate()) ? cur : 'USD'; }
  function money(usd) {
    var c = shown(), v = c === 'USD' ? usd : calm(usd * rate(), c);
    var whole = Math.abs(v) >= 10 || c === 'JPY' || c === 'KRW' || v % 1 === 0;
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'symbol',
        minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v);
    } catch (e) { return '$' + Math.round(usd); }
  }
  function range(lo, hi, approx) {
    var s = money(lo);
    if (hi != null) { var h = money(hi); s += '–' + h.replace(/^[^\d]*/, ''); }
    return (approx ? '~' : '') + s;
  }
  function num(s, unit) {
    var n = parseFloat(String(s).replace(/,/g, ''));
    return unit === 'k' ? n * 1e3 : unit === 'M' ? n * 1e6 : n;
  }

  /* ---- Text rewriting -------------------------------------------------- */
  var VN = '\\d[\\d.,]*(?:k|M)?(?:\\s*[–-]\\s*\\d[\\d.,]*(?:k|M)?)?\\s*₫';
  var RATE_AFTER = /^\s*(\/\s*\$|\/\s*USD|=\s*\$\s*1|to the dollar|to \$1|per (US)?\s?\$)/;
  var USD_RE = /(~|≈)?\s?(?<![A-Za-z$])\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s*[–-]\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?))?/g;
  function rewrite(s) {
    if (s.indexOf('₫') < 0 && (shown() === 'USD' || s.indexOf('$') < 0)) return s;
    // đồng next to a dollar figure: keep only the dollars.
    s = s.replace(new RegExp('(?:≈\\s*|~\\s*)?' + VN + '\\s*·\\s*(?=(?:≈\\s*|~\\s*)?\\$)', 'g'), '');
    s = s.replace(new RegExp('(\\$\\s?\\d[\\d,.]*(?:\\s*[–-]\\s*\\$?\\d[\\d,.]*)?)\\s*(?:·\\s*)?\\(?\\s*(?:≈|~)\\s*' + VN + '\\)?', 'g'), '$1');
    s = s.replace(new RegExp('(\\$\\s?\\d[\\d,.]*(?:\\s*[–-]\\s*\\$?\\d[\\d,.]*)?)\\s*\\(\\s*(?:≈|~)?\\s*' + VN + '\\s*\\)', 'g'), '$1');
    // đồng first, dollars in brackets ("~350,000₫ (~$14)"): keep the dollars.
    s = s.replace(new RegExp('(?:≈\\s*|~\\s*)?' + VN + '\\s*\\(\\s*((?:≈|~)?\\s*\\$\\s?\\d[\\d,.]*(?:\\s*[–-]\\s*\\$?\\d[\\d,.]*)?)\\s*\\)', 'g'), '$1');
    // Dollars → the visitor's currency (only outside the US, once rates are in).
    if (shown() !== 'USD') {
      s = s.replace(USD_RE, function (m, approx, a, b) {
        return (/^\s/.test(m) && !approx ? ' ' : '') + range(num(a), b != null ? num(b) : null, true);
      });
    }
    // A đồng amount on its own → "~$14". Exchange-rate statements stay.
    s = s.replace(new RegExp('(?:(≈|~)\\s?)?(\\d[\\d.,]*)(k|M)?(?:\\s*[–-]\\s*(\\d[\\d.,]*)(k|M)?)?\\s*₫', 'g'), function (m, ap, a, ua, b, ub, off, whole) {
      if (RATE_AFTER.test(whole.slice(off + m.length))) return m;
      var lo = num(a, ua) / PEG, hi = b != null ? num(b, ub || ua) / PEG : null;
      if (!(lo > 0)) return m;
      return range(lo, hi, true);
    });
    return s;
  }

  var orig = new WeakMap(), out = new WeakMap(), seen = new Set();
  function roots() { var r = document.querySelectorAll('[data-vc-root]'); return r.length ? Array.prototype.slice.call(r) : [document.body]; }
  function skipped(node) { var p = node.parentElement; return !p || !!p.closest(SKIP); }
  function processText(node) {
    if (out.has(node) && node.nodeValue === out.get(node)) {
      // already ours; refresh from the original (currency may have changed)
    } else { orig.set(node, node.nodeValue); }
    var base = orig.get(node);
    if (base.indexOf('₫') < 0 && base.indexOf('$') < 0) return;
    if (skipped(node)) return;
    var next = rewrite(base);
    seen.add(node);
    if (next !== node.nodeValue) node.nodeValue = next;
    out.set(node, next);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { processText(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) processText(n);
  }
  function inScope(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return false;
    var r = document.querySelectorAll('[data-vc-root]');
    if (!r.length) return true;
    for (var i = 0; i < r.length; i++) if (r[i].contains(el)) return true;
    return false;
  }
  function renderAll() {
    document.documentElement.classList.add('vc');
    document.documentElement.setAttribute('data-vc-cur', shown());
    roots().forEach(walk);
    notes(); chips();
  }

  /* ---- The one-line note + the "Prices in …" chip ---------------------- */
  function noteText() {
    return shown() === 'USD'
      ? 'Prices are in US dollars. A ~ means the figure is converted from the shop’s own price; your quote fixes the exact amount.'
      : 'Prices are shown in ' + shown() + ', converted at today’s rate with a small allowance for exchange and card fees. A ~ means converted; your quote fixes the exact amount.';
  }
  function notes() { document.querySelectorAll('[data-vc-note]').forEach(function (n) { n.textContent = noteText(); }); }
  function chips() {
    document.querySelectorAll('[data-vc-chip]').forEach(function (host) {
      var sel = host.querySelector('select');
      if (!sel) {
        host.classList.add('vc-chip');
        host.innerHTML = '<label><span>Prices in</span> <select aria-label="Show prices in"></select></label>';
        sel = host.querySelector('select');
        var names; try { names = new Intl.DisplayNames(['en'], { type: 'currency' }); } catch (e) {}
        LIST.forEach(function (c) {
          var o = document.createElement('option'), sym = '';
          try { sym = new Intl.NumberFormat('en', { style: 'currency', currency: c }).formatToParts(0).filter(function (p) { return p.type === 'currency'; })[0].value; } catch (e) {}
          o.value = c; o.textContent = c + (sym && sym !== c ? ' · ' + sym : '');
          if (names) o.title = names.of(c);   // the full name on hover; the label stays short
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () { setCurrency(sel.value, true); });
      }
      sel.value = cur;
    });
  }
  function setCurrency(c, remember) {
    if (LIST.indexOf(c) < 0) return;
    cur = c;
    if (remember) { try { localStorage.setItem(KEY, c); } catch (e) {} }
    if (cur !== 'USD' && !rates) loadRates();
    seen.forEach(function (n) { if (!n.isConnected) seen.delete(n); });
    renderAll();
    document.dispatchEvent(new CustomEvent('ss:currency', { detail: { currency: shown() } }));
  }

  /* ---- Rates: the same cache and sources as the estimator -------------- */
  function loadRates() {
    try {
      var c = JSON.parse(sessionStorage.getItem('ss-fx') || 'null');
      if (c && c.d && c.d.rates && (Date.now() - c.t) < 216e5) { rates = c.d.rates; return; }
    } catch (e) {}
    function keep(r, when) {
      rates = r;
      try { sessionStorage.setItem('ss-fx', JSON.stringify({ t: Date.now(), d: { rates: r, when: when || '' } })); } catch (e) {}
      renderAll();
    }
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.rates) throw 0; keep(d.rates, d.time_last_update_utc ? new Date(d.time_last_update_utc).toISOString().slice(0, 10) : ''); })
      .catch(function () {
        fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json').then(function (r) { return r.json(); })
          .then(function (d) { var s = d && d.usd, r = {}; if (!s) return; for (var k in s) r[k.toUpperCase()] = s[k]; keep(r, d.date); })
          .catch(function () {});
      });
  }

  /* ---- Start, then keep up with language switches and late content ----- */
  function style() {
    if (document.getElementById('vc-style')) return;
    var s = document.createElement('style'); s.id = 'vc-style';
    s.textContent =
      'html.vc .money-alt,html.vc .gf-sub,html.vc .gift-price .vnd{display:none!important}' +
      '.vc-chip{display:inline-flex;align-items:center;font:inherit;font-size:.82rem;color:var(--text-secondary,#4a5578)}' +
      '.vc-chip label{display:inline-flex;align-items:center;gap:.4rem;cursor:pointer}' +
      '.vc-chip select{font:inherit;font-weight:600;color:var(--accent-deep,#233a72);background:transparent;border:0;' +
      'border-bottom:1px solid currentColor;padding:.1rem 1rem .1rem .1rem;border-radius:0;max-width:11rem;cursor:pointer;' +
      'appearance:none;background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),linear-gradient(135deg,currentColor 50%,transparent 50%);' +
      'background-position:calc(100% - 7px) 55%,calc(100% - 3px) 55%;background-size:4px 4px;background-repeat:no-repeat}' +
      '.vc-chip select:focus-visible{outline:2px solid var(--accent,#2e54ad);outline-offset:3px}';
    document.head.appendChild(s);
  }
  function start() {
    style();
    if (cur !== 'USD') loadRates();
    renderAll();
    var queue = [], pending = false;
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') { if (m.target.nodeValue !== out.get(m.target)) queue.push(m.target); }
        else m.addedNodes.forEach(function (n) { queue.push(n); });
      });
      if (pending || !queue.length) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false; var q = queue; queue = [];
        q.forEach(function (n) { if (n.isConnected && inScope(n)) walk(n); });
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  window.SS_VC = { money: function (usd) { return money(usd); }, currency: shown, set: setCurrency, rewrite: rewrite };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

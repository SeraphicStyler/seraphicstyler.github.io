/* Plain-text translation layer. Current source copy can correct stale keyed text.
   Load after the page engine; bundles resolve against this script, not the page.
   ready is the current language operation; refresh(node?) also returns a Promise. */
(function () {
  'use strict';
  if (window.SS_SITE_I18N) return;
  var script = document.currentScript;
  var base = new URL('.', script && script.src || new URL('js/i18n-site.js', document.baseURI));
  var version = script && new URL(script.src, document.baseURI).searchParams.get('v');
  var languages = [
    ['en', 'English'], ['vi', 'Tiếng Việt'], ['zh', '中文 (简体)'],
    ['es', 'Español'], ['ar', 'العربية'], ['fr', 'Français'],
    ['pt', 'Português'], ['ru', 'Русский'], ['ja', '日本語'],
    ['de', 'Deutsch'], ['ko', '한국어'], ['hi', 'हिन्दी'],
    ['id', 'Bahasa Indonesia'], ['th', 'ไทย'], ['it', 'Italiano'],
    ['tr', 'Türkçe'], ['tl', 'Filipino'], ['pl', 'Polski'],
    ['nl', 'Nederlands'], ['fa', 'فارسی'], ['km', 'ភាសាខ្មែរ']
  ].map(function (l) { return { code: l[0], name: l[1] }; });
  var languageLabels = {
    en: 'Language', vi: 'Ngôn ngữ', zh: '语言', es: 'Idioma', ar: 'اللغة',
    fr: 'Langue', pt: 'Idioma', ru: 'Язык', ja: '言語', de: 'Sprache',
    ko: '언어', hi: 'भाषा', id: 'Bahasa', th: 'ภาษา', it: 'Lingua',
    tr: 'Dil', tl: 'Wika', pl: 'Język', nl: 'Taal', fa: 'زبان', km: 'ភាសា'
  };
  var attrs = ['aria-label', 'title', 'placeholder', 'alt'];
  var hooks = { 'aria-label': 'data-i18n-al', title: 'data-i18n-ti', placeholder: 'data-i18n-ph', alt: 'data-i18n-alt' };
  var skip = 'script,style,code,pre,textarea,[translate="no"],.notranslate,.ss-message-user,.brand-seraphic,.brand-styler';
  var originals = new WeakMap();
  var lastWritten = new WeakMap();
  var authoredEnglish = new WeakSet();
  var clearedEnglish = new WeakSet();
  var bundles = new Map();
  var keyedText = new Map();
  var templateCache = new WeakMap();
  var callsiteSources = new Map();
  var baseT = null;
  var locale = 'en';
  var dictionary = null;
  var revision = 0;
  var engine = null;
  var waiter = null;
  var started = false;
  var notifying = false;
  var resolveBoot;
  var api = window.SS_SITE_I18N = {
    ready: new Promise(function (resolve) { resolveBoot = resolve; }),
    refresh: function (node) {
      return api.ready.then(function () { paint(node || document.documentElement); });
    }
  };
  function normalize(value) { return value.trim().replace(/\s+/g, ' '); }
  function interpolate(value, vars) {
    return String(value).replace(/\{(\w+)\}/g, function (match, key) {
      return vars && Object.prototype.hasOwnProperty.call(vars, key) && vars[key] != null ? vars[key] : match;
    });
  }
  function templates(data) {
    if (templateCache.has(data)) return templateCache.get(data);
    var compiled = [];
    Object.keys(data).forEach(function (source) {
      var names = [];
      var pattern = '';
      var end = 0;
      var literalLength = 0;
      var ambiguous = false;
      function literal(text) {
        literalLength += text.length;
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      }
      var matcher = /\{(\w+)\}/g;
      var match;
      while ((match = matcher.exec(source))) {
        if (names.length && match.index === end) ambiguous = true;
        pattern += literal(source.slice(end, match.index));
        var previous = names.indexOf(match[1]);
        pattern += previous < 0 ? '([\\s\\S]*?)' : '(?:\\' + (previous + 1) + ')';
        if (previous < 0) names.push(match[1]);
        end = matcher.lastIndex;
      }
      if (!names.length) return;
      pattern += literal(source.slice(end));
      var translated = data[source];
      if (ambiguous || !literalLength || typeof translated !== 'string' || !translated.trim()) return;
      var targetNames = Array.from(translated.matchAll(/\{(\w+)\}/g), function (entry) { return entry[1]; });
      // A malformed translation must not drop or invent an inserted value.
      if (names.some(function (name) { return targetNames.indexOf(name) < 0; }) || targetNames.some(function (name) { return names.indexOf(name) < 0; })) return;
      compiled.push({ regex: new RegExp('^' + pattern + '$'), names: names, value: translated, weight: literalLength });
    });
    compiled.sort(function (a, b) { return b.weight - a.weight; });
    templateCache.set(data, compiled);
    return compiled;
  }
  function siteText(source) {
    if (!dictionary || typeof source !== 'string') return null;
    var key = normalize(source);
    var translated = Object.prototype.hasOwnProperty.call(dictionary, key) && dictionary[key];
    if (typeof translated !== 'string' || !translated.trim()) {
      translated = null;
      var candidates = templates(dictionary);
      for (var i = 0; i < candidates.length; i++) {
        var candidate = candidates[i];
        var match = candidate.regex.exec(source.trim());
        if (!match) continue;
        var vars = Object.create(null);
        candidate.names.forEach(function (name, index) { vars[name] = match[index + 1]; });
        translated = interpolate(candidate.value.trim(), vars);
        break;
      }
    } else translated = translated.trim();
    return translated === null ? null : source.match(/^\s*/)[0] + translated + source.match(/\s*$/)[0];
  }
  function lookup(key, en) {
    var currentSource = typeof en === 'string' ? siteText(en) : null;
    if (currentSource !== null) return { value: currentSource, english: en };
    var preferred = baseT ? baseT.call(window, key, null) : window.SS_TRANSLATIONS && window.SS_TRANSLATIONS[locale] && window.SS_TRANSLATIONS[locale][key];
    if (preferred != null && preferred !== '') return { value: preferred };
    // null is deliberately not a lookup key: keyed() relies on this sentinel.
    var translated = typeof en === 'string' ? siteText(en) : null;
    return translated === null ? { value: en } : { value: translated, english: en };
  }
  function rememberCallsite(value, english) {
    if (english != null && value !== english) {
      callsiteSources.set(value, english);
      // DOM nodes retain their own originals; bound provenance for new nodes.
      if (callsiteSources.size > 1024) callsiteSources.delete(callsiteSources.keys().next().value);
    }
    return value;
  }
  function valid(code) { return languages.some(function (l) { return l.code === code; }) ? code : 'en'; }
  function current() {
    return valid(typeof window.SS_LANG === 'function' ? window.SS_LANG() : window.SS_LANG || document.documentElement.lang);
  }
  // Deferred scripts run before DOMContentLoaded: record authored language tags
  // before the legacy engine adds its missing-translation annotations.
  if (current() === 'en') document.querySelectorAll('[data-i18n][lang="en"]').forEach(function (el) {
    authoredEnglish.add(el);
  });
  function excluded(el) {
    if (!el || el.closest(skip)) return true;
    var editable = el.closest('[contenteditable]');
    if (el.isContentEditable || (editable && editable.getAttribute('contenteditable') !== 'false')) return true;
    return !!el.closest('#langSelect,.ss-lang-select,[data-ss-site-language]');
  }
  function keyed(el, attr) {
    if (!engine || locale === 'en') return false;
    var owner = attr ? el : el.closest('[data-i18n]');
    var hook = attr ? hooks[attr] : 'data-i18n';
    if (!owner || !owner.hasAttribute(hook)) return false;
    var key = owner.getAttribute(hook);
    var value;
    if (typeof window.SS_T === 'function') value = window.SS_T(key, null);
    else value = window.SS_TRANSLATIONS && window.SS_TRANSLATIONS[locale] && window.SS_TRANSLATIONS[locale][key];
    if (typeof value !== 'string' || !value.trim()) return false;
    if (attr) return normalize(owner.getAttribute(attr) || '') === normalize(value);
    if (!keyedText.has(value)) {
      // Keyed dictionaries may contain markup/entities. Parse in an inert
      // template solely to compare rendered text; never replace live children.
      var template = document.createElement('template');
      template.innerHTML = value;
      keyedText.set(value, normalize(template.content.textContent));
    }
    return normalize(owner.textContent) === keyedText.get(value);
  }
  function field(node, attr, restore) {
    var el = attr ? node : node.parentElement;
    if (excluded(el) || (!attr && el.tagName === 'INPUT')) return;
    var name = attr || '#text';
    var value = attr ? node.getAttribute(attr) : node.nodeValue;
    if (value === null) {
      if (originals.has(node)) delete originals.get(node)[name];
      if (lastWritten.has(node)) delete lastWritten.get(node)[name];
      return;
    }
    var saved = originals.get(node);
    var written = lastWritten.get(node);
    if (!saved) { saved = Object.create(null); originals.set(node, saved); }
    if (!written) { written = Object.create(null); lastWritten.set(node, written); }
    // An external repaint is authoritative, even when reusing the same node.
    var ownValue = name in saved && value === written[name];
    if (!ownValue) saved[name] = callsiteSources.get(value) || value;
    if (!restore && keyed(el, attr)) {
      // A fallback can equal the keyed translation. Keep its English original
      // on subsequent refreshes so the legacy engine can later cache English.
      if (!ownValue) { delete saved[name]; delete written[name]; }
      return;
    }
    var source = saved[name];
    var result = source;
    if (!restore) {
      var translated = siteText(source);
      if (translated !== null) {
        result = translated;
        var owner = !attr && el.closest('[data-i18n][lang="en"]');
        if (engine && owner && !authoredEnglish.has(owner) && !keyed(el, null)) {
          owner.removeAttribute('lang');
          clearedEnglish.add(owner);
        }
      }
    }
    written[name] = result;
    if (value !== result) {
      if (attr) node.setAttribute(attr, result);
      else node.nodeValue = result;
    }
  }
  function paint(node, restore) {
    if (!node || (node !== document && !node.isConnected)) return;
    if (node.nodeType === 3) { field(node, null, restore); return; }
    if (node.nodeType !== 1 && node.nodeType !== 9) return;
    if (node.nodeType === 1) {
      if (excluded(node)) return;
      if (restore && clearedEnglish.has(node)) {
        if (!node.hasAttribute('lang') && !keyed(node, null)) node.setAttribute('lang', 'en');
        clearedEnglish.delete(node);
      }
      attrs.forEach(function (attr) { field(node, attr, restore); });
    }
    // Recursive traversal prunes excluded subtrees and preserves every element.
    for (var child = node.firstChild; child; child = child.nextSibling) paint(child, restore);
  }
  function load(code) {
    // Tamazight remains available through the directory's existing bundles.
    if (code === 'en' || code === 'zgh') return Promise.resolve(null);
    if (bundles.has(code)) return bundles.get(code);
    var url = new URL('i18n/site.' + code + '.json', base);
    if (version) url.searchParams.set('v', version);
    if (url.origin !== location.origin) return Promise.resolve(null);
    var promise = Promise.resolve().then(function () {
      return fetch(url.href, { credentials: 'same-origin', mode: 'same-origin', redirect: 'error' });
    }).then(function (response) {
      if (!response.ok) throw new Error('Missing site dictionary: ' + code);
      return response.json();
    }).then(function (data) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid site dictionary');
      return data;
    }).catch(function () { bundles.delete(code); return null; });
    bundles.set(code, promise);
    return promise;
  }
  function selectLanguage(code) {
    locale = valid(code);
    dictionary = null;
    var ticket = ++revision;
    // Restore surviving nodes immediately; the old engine may have replaced others.
    paint(document.documentElement, true);
    api.ready = load(locale).then(function (data) {
      if (ticket !== revision) return;
      dictionary = data;
      if (window.SS_I18N_DOM && window.SS_I18N_DOM.sourcePaint) window.SS_I18N_DOM.sourcePaint(data, locale);
      paint(document.documentElement);
    });
    return api.ready;
  }
  function metadata(code, persist) {
    code = valid(code);
    locale = code;
    document.documentElement.lang = code;
    document.documentElement.dir = /^(ar|fa)$/.test(code) ? 'rtl' : 'ltr';
    if (persist !== false) { try { localStorage.setItem('ss-lang', code); } catch (_) {} }
    document.querySelectorAll('#langSelect,.ss-lang-select').forEach(function (sel) {
      sel.value = code;
      var key = sel.getAttribute('data-i18n-al') || 'a11y.language';
      var label = typeof window.SS_T === 'function' && window.SS_T(key, null);
      sel.setAttribute('aria-label', typeof label === 'string' && label.trim() ? label : languageLabels[code] || 'Language');
    });
  }
  function standalone(code, persist) {
    metadata(code, persist);
    document.dispatchEvent(new CustomEvent('ss:lang', { detail: { lang: code } }));
  }
  function setLanguage(code, persist) {
    if (valid(code) !== code) persist = false;
    ++revision;
    dictionary = null;
    paint(document.documentElement, true);
    if (waiter) waiter.resolve();
    var resolve, reject;
    var promise = new Promise(function (yes, no) { resolve = yes; reject = no; });
    waiter = { resolve: resolve, reject: reject, code: valid(code), persist: persist };
    api.ready = promise;
    // The wrapper owns persistence, including locales unsupported by the engine.
    try { (engine || standalone).call(window, valid(code), false); }
    catch (error) { waiter = null; reject(error); }
    return promise;
  }
  function onLanguage(event) {
    if (!started || notifying) return;
    var pending = waiter;
    waiter = null;
    var reported = event.detail && event.detail.lang || current();
    var requested = pending ? pending.code : reported;
    metadata(requested, pending ? pending.persist : false);
    var ready = selectLanguage(requested);
    if (requested !== reported) {
      notifying = true;
      try { document.dispatchEvent(new CustomEvent('ss:lang', { detail: { lang: requested } })); }
      finally { notifying = false; }
    }
    if (pending) ready.then(pending.resolve, pending.reject);
  }
  document.addEventListener('ss:lang', onLanguage);
  window.addEventListener('ss:lang', function (event) { if (event.target === window) onLanguage(event); });
  var observer = new MutationObserver(function (records) {
    var subtrees = new Set();
    var fields = [];
    records.forEach(function (record) {
      if (record.type === 'childList') record.addedNodes.forEach(function (node) { subtrees.add(node); });
      else {
        var name = record.type === 'characterData' ? '#text' : record.attributeName;
        var value = name === '#text' ? record.target.nodeValue : record.target.getAttribute(name);
        var written = lastWritten.get(record.target);
        if (!written || written[name] !== value) fields.push([record.target, name]);
      }
    });
    function covered(node) {
      for (var parent = node.parentNode; parent; parent = parent.parentNode) if (subtrees.has(parent)) return true;
      return false;
    }
    subtrees.forEach(function (node) { if (!covered(node)) paint(node); });
    fields.forEach(function (entry) {
      if (!entry[0].isConnected || subtrees.has(entry[0]) || covered(entry[0])) return;
      field(entry[0], entry[1] === '#text' ? null : entry[1], false);
    });
  });
  function init() {
    if ((window.SS_LANGS_LIST || []).some(function (lang) { return lang.code === 'zgh'; })) {
      languages.push({ code: 'zgh', name: 'ⵜⴰⵎⴰⵣⵉⵖⵜ' });
    }
    var initial = current();
    try { initial = localStorage.getItem('ss-lang') || initial; } catch (_) {}
    engine = typeof window.SS_setLang === 'function' ? window.SS_setLang : null;
    baseT = typeof window.SS_T === 'function' ? window.SS_T : null;
    window.SS_T = function (key, en) {
      var result = lookup(key, en);
      return rememberCallsite(result.value, result.english);
    };
    window.SS_TF = function (key, en, vars) {
      var result = lookup(key, en);
      return rememberCallsite(interpolate(result.value, vars), result.english == null ? null : interpolate(result.english, vars));
    };
    // Ensure a legacy engine never caches our translated text as its English.
    if (window.SS_I18N_DOM) window.SS_I18N_DOM.cache();
    window.SS_setLang = setLanguage;
    window.SS_LANG = function () { return locale; };
    started = true;
      window.SS_LANGS = languages;
      window.SS_LANGS_LIST = languages;
      var selects = document.querySelectorAll('#langSelect,.ss-lang-select');
      if (!selects.length && document.body && !window.matchMedia('(max-width: 600px)').matches) {
        var label = document.createElement('label');
        label.setAttribute('data-ss-site-language', '');
        label.style.cssText = 'position:fixed;inset-block-end:1rem;inset-inline-end:1rem;z-index:1000;display:flex;align-items:center;gap:.4rem;padding:.4rem .6rem;border:1px solid #8886;border-radius:.6rem;background:Canvas;color:CanvasText;box-shadow:0 2px 10px #0002;font:14px/1.4 system-ui,sans-serif;max-width:calc(100vw - 2rem)';
        var globe = document.createElement('span');
        globe.textContent = '🌐';
        globe.setAttribute('aria-hidden', 'true');
        label.appendChild(globe);
        var select = document.createElement('select');
        select.className = 'ss-lang-select';
        select.setAttribute('aria-label', 'Language');
        select.style.cssText = 'font:inherit;color:inherit;background:Canvas;border:0;max-width:12rem;min-height:28px;cursor:pointer';
        label.appendChild(select);
        document.body.appendChild(label);
        selects = [select];
      }
      Array.prototype.forEach.call(selects, function (sel) {
        sel.replaceChildren();
        sel.hidden = false;
        languages.forEach(function (lang) {
          var option = document.createElement('option');
          option.value = lang.code;
          option.textContent = lang.name;
          sel.appendChild(option);
        });
        // Legacy engines close over their private apply function. Capture the
        // event so every user selection goes through the async wrapper instead.
        sel.addEventListener('change', function (event) {
          event.stopImmediatePropagation();
          setLanguage(sel.value);
        }, true);
      });
      setLanguage(initial, false).then(resolveBoot);
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attrs
    });
  }
  var navigation = window.performance && typeof window.performance.getEntriesByType === 'function' && window.performance.getEntriesByType('navigation')[0];
  // A deferred script sees "interactive" before DOMContentLoaded. Wait for the
  // bottom-of-page engines' registered init handlers to finish filling menus.
  if (document.readyState === 'loading' || (document.readyState === 'interactive' && (!navigation || !navigation.domContentLoadedEventStart))) document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

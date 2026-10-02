/* Shared DOM translation: retain each node's own English fallback and accessibility text. */
(() => {
  'use strict';
  const originals = new WeakMap();
  const hooks = [['data-i18n', null], ['data-i18n-ph', 'placeholder'], ['data-i18n-al', 'aria-label'], ['data-i18n-ti', 'title']];
  function cache() {
    for (const [hook, attr] of hooks) document.querySelectorAll('[' + hook + ']').forEach(el => {
      let saved = originals.get(el);
      if (!saved) { saved = { lang: el.getAttribute('lang') }; originals.set(el, saved); }
      if (!(hook in saved)) saved[hook] = attr ? el.getAttribute(attr) || '' : el.innerHTML;
    });
  }
  function paint(dictionary, language) {
    cache();
    for (const [hook, attr] of hooks) document.querySelectorAll('[' + hook + ']').forEach(el => {
      const saved = originals.get(el);
      if (!saved) return;
      const translated = dictionary?.[el.getAttribute(hook)];
      const available = typeof translated === 'string' && translated.trim() !== '';
      const value = available ? translated : saved[hook];
      if (attr) el.setAttribute(attr, value);
      else {
        // Avoid replacing descendants and their listeners when nothing changed.
        if (el.innerHTML !== value) el.innerHTML = value;
        if (language !== 'en' && !available) el.setAttribute('lang', 'en');
        else if (saved.lang) el.setAttribute('lang', saved.lang);
        else el.removeAttribute('lang');
      }
    });
  }
  // Reconcile current source copy with the site-wide dictionary. Legacy keys
  // can outlive an English rewrite (notably prices and policy paragraphs).
  // Only leaf text is replaced here; markup and interactive children stay intact.
  function sourcePaint(dictionary, language) {
    if (!dictionary || language === 'en') return;
    for (const [hook, attr] of hooks) document.querySelectorAll('[' + hook + ']').forEach(el => {
      if (el.closest('[translate="no"],.notranslate,[contenteditable],.ss-message-user')) return;
      const saved = originals.get(el);
      if (!saved || !(hook in saved)) return;
      const template = document.createElement('template');
      template.innerHTML = saved[hook];
      if (!attr && template.content.children.length) return;
      const source = (attr ? saved[hook] : template.content.textContent).replace(/\s+/g, ' ').trim();
      const value = dictionary[source];
      if (typeof value !== 'string' || !value.trim()) return;
      if (attr) el.setAttribute(attr, value);
      else if (!el.children.length) {
        if (el.firstChild?.nodeType === Node.TEXT_NODE && el.childNodes.length === 1) el.firstChild.nodeValue = value;
        else el.textContent = value;
        if (saved.lang) el.setAttribute('lang', saved.lang);
        else el.removeAttribute('lang');
      }
    });
  }
  window.SS_I18N_DOM = { cache, paint, sourcePaint };
})();

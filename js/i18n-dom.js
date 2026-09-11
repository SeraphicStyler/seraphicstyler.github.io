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
  window.SS_I18N_DOM = { cache, paint };
})();

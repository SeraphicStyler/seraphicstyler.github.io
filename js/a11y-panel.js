/* Display & accessibility on every page: language, text size, theme, high
   contrast, reduced motion — the same panel the homepage ships, injected where
   a page doesn't already have one. Self-contained: own styles, no dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" style="width:20px;height:20px;display:block;margin:auto"><path d="M4 8h9"/><path d="M19.5 8H20"/><circle cx="16" cy="8" r="2.3"/><path d="M4 16h3.5"/><path d="M12.5 16H20"/><circle cx="10" cy="16" r="2.3"/></svg>';

  var CSS =
    '.ss-a11y-wrap{position:fixed;left:1.25rem;bottom:1.25rem;z-index:300;display:flex;flex-direction:column;align-items:flex-start;gap:.6rem}' +
    '.ss-a11y-fab{width:44px;height:44px;border-radius:50%;border:1px solid var(--surface-border,#8884);background:var(--surface-solid,Canvas);color:var(--text-primary,CanvasText);box-shadow:0 8px 24px -8px rgba(0,0,0,.35);cursor:pointer;display:grid;place-items:center;padding:0;transition:transform .2s ease}' +
    '.ss-a11y-fab:hover{transform:translateY(-2px)}' +
    '.ss-a11y-fab:focus-visible{outline:2px solid var(--text-primary,CanvasText);outline-offset:3px}' +
    '.ss-a11y-panel{display:none;position:fixed;left:1.25rem;bottom:4.7rem;z-index:301;width:min(300px,calc(100vw - 2.5rem));max-height:calc(100dvh - 7rem);overflow-y:auto;padding:1rem 1.1rem;border-radius:1rem;border:1px solid var(--surface-border,#8884);background:var(--surface-solid,Canvas);color:var(--text-primary,CanvasText);box-shadow:0 24px 60px -20px rgba(0,0,0,.4);font:14px/1.5 var(--font-body,system-ui,sans-serif)}' +
    '.ss-a11y-panel.open{display:block}' +
    '.ss-a11y-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem}' +
    '.ss-a11y-eyebrow{font-weight:600;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-secondary,GrayText)}' +
    '.ss-a11y-close{border:0;background:none;color:inherit;font-size:1rem;cursor:pointer;padding:.25rem .5rem;min-width:44px;min-height:44px}' +
    '.ss-a11y-row{display:flex;align-items:center;justify-content:space-between;gap:.8rem;padding:.55rem 0;border-top:1px solid var(--surface-border,#8882)}' +
    '.ss-a11y-h{margin:0;font-weight:600;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-secondary,GrayText)}' +
    '.ss-a11y-panel select{font-size:16px;line-height:1.3;font-family:inherit;color:inherit;background:var(--surface-solid,Canvas);border:1px solid var(--surface-border,#8884);border-radius:.5rem;padding:.35rem .5rem;max-width:9.5rem;min-height:44px;cursor:pointer}' +
    '.ss-a11y-seg{display:flex;border:1px solid var(--surface-border,#8884);border-radius:.6rem;overflow:hidden}' +
    '.ss-a11y-seg button{border:0;background:none;color:inherit;padding:.4rem .55rem;min-height:44px;cursor:pointer;font:inherit}' +
    '.ss-a11y-seg button.on{background:var(--accent-soft,#8882)}' +
    '.ss-a11y-switch{border:1px solid var(--surface-border,#8884);background:none;color:inherit;border-radius:999px;padding:.35rem .8rem;min-height:44px;cursor:pointer;font:inherit}' +
    '.ss-a11y-switch.on{background:var(--accent,#345);color:var(--surface-solid,Canvas)}' +
    '.ss-a11y-panel :focus-visible{outline:2px solid var(--text-primary,CanvasText);outline-offset:2px}';

  function init() {
    if (document.getElementById('a11yBtn')) return;                       // page ships its own panel
    if (document.querySelector('.fd-quick-settings')) return;             // directory workspace prefs
    if (document.querySelector('script[src*="directory-workspace"]')) return;

    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var wrap = document.createElement('div');
    wrap.className = 'ss-a11y-wrap';
    wrap.innerHTML =
      '<button class="ss-a11y-fab" id="a11yBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Language & accessibility settings">' + SVG + '</button>' +
      '<div class="ss-a11y-panel" id="a11yPanel" role="dialog" aria-label="Language and accessibility">' +
        '<div class="ss-a11y-head"><span class="ss-a11y-eyebrow" data-i18n="a11y.title">Settings</span>' +
        '<button class="ss-a11y-close" type="button" aria-label="Close settings">✕</button></div>' +
        '<div class="ss-a11y-row" data-row="lang"><p class="ss-a11y-h" id="ssLangLbl" data-i18n="a11y.language">Language</p>' +
        '<select class="ss-lang-select" aria-labelledby="ssLangLbl"></select></div>' +
        '<div class="ss-a11y-row"><p class="ss-a11y-h" data-i18n="a11y.textsize">Text size</p>' +
        '<div class="ss-a11y-seg" role="group" aria-label="Text size">' +
        '<button type="button" data-size="md" aria-label="Default text size" aria-pressed="true" style="font-size:0.75rem">A</button>' +
        '<button type="button" data-size="lg" aria-label="Large text size" aria-pressed="false" style="font-size:0.9rem">A</button>' +
        '<button type="button" data-size="xl" aria-label="Extra large text size" aria-pressed="false" style="font-size:1.05rem">A</button></div></div>' +
        '<div class="ss-a11y-row" data-row="theme"><p class="ss-a11y-h" data-i18n="a11y.theme">Theme</p>' +
        '<div class="ss-a11y-seg" role="group" aria-label="Theme">' +
        '<button type="button" data-theme="auto" aria-pressed="true" data-i18n="theme.auto">Auto</button>' +
        '<button type="button" data-theme="light" aria-pressed="false" data-i18n="theme.light">Light</button>' +
        '<button type="button" data-theme="dark" aria-pressed="false" data-i18n="theme.dark">Dark</button>' +
        '<button type="button" data-theme="mono" aria-pressed="false" data-i18n="theme.mono">Mono</button></div></div>' +
        '<div class="ss-a11y-row"><p class="ss-a11y-h" data-i18n="a11y.contrast">High contrast</p>' +
        '<button class="ss-a11y-switch" id="contrastBtn" data-i18n-al="a11y.contrast" type="button" aria-pressed="false" aria-label="High contrast">Off</button></div>' +
        '<div class="ss-a11y-row"><p class="ss-a11y-h" data-i18n="a11y.motion">Reduce motion</p>' +
        '<button class="ss-a11y-switch" id="motionBtn" data-i18n-al="a11y.motion" type="button" aria-pressed="false" aria-label="Reduce motion">Off</button></div>' +
      '</div>';
    document.body.appendChild(wrap);

    var pill = document.querySelector('[data-ss-site-language]');
    if (pill) pill.remove();

    var btn = document.getElementById('a11yBtn');
    var panel = document.getElementById('a11yPanel');

    function closePanel(returnFocus) {
      if (!panel.classList.contains('open')) return;
      panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) panel.querySelector('.ss-a11y-close').focus();
    });
    document.addEventListener('click', function (e) { if (!panel.contains(e.target) && e.target !== btn) closePanel(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(true); });
    panel.querySelector('.ss-a11y-close').addEventListener('click', function () { closePanel(true); });

    var sel = panel.querySelector('select');
    var langRow = panel.querySelector('[data-row="lang"]');
    function fillLangs(langs) {
      if (sel.options.length) return;
      langs.forEach(function (l) {
        var o = document.createElement('option'); o.value = l.code; o.textContent = l.name; sel.appendChild(o);
      });
      syncLang();
    }
    function syncLang() {
      if (typeof window.SS_LANG === 'function' && sel.options.length) sel.value = window.SS_LANG();
    }
    var langs = window.SS_LANGS_LIST || window.SS_LANGS;
    if (langs && langs.length) {
      fillLangs(langs);
      sel.addEventListener('change', function () { if (window.SS_setLang) window.SS_setLang(sel.value); });
      document.addEventListener('ss:lang', syncLang);
    } else if (typeof window.SS_setLang === 'function') {
      document.addEventListener('ss:lang', function once() {
        var l2 = window.SS_LANGS_LIST || window.SS_LANGS;
        if (l2 && l2.length) { fillLangs(l2); sel.addEventListener('change', function () { window.SS_setLang(sel.value); }); document.addEventListener('ss:lang', syncLang); }
      }, { once: true });
    } else {
      langRow.hidden = true;
    }

    function setText(size) {
      root.classList.remove('ts-lg', 'ts-xl');
      if (size === 'lg') root.classList.add('ts-lg');
      if (size === 'xl') root.classList.add('ts-xl');
      save('ss-textsize', size);
      panel.querySelectorAll('[data-size]').forEach(function (b) {
        var on = b.getAttribute('data-size') === size;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    panel.querySelectorAll('[data-size]').forEach(function (b) {
      b.addEventListener('click', function () { setText(b.getAttribute('data-size')); });
    });
    setText(read('ss-textsize') || 'md');

    var themeRow = panel.querySelector('[data-row="theme"]');
    if (window.SS_THEME) {
      var syncTheme = function (mode) {
        panel.querySelectorAll('[data-theme]').forEach(function (b) {
          var on = b.getAttribute('data-theme') === mode;
          b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
      panel.querySelectorAll('[data-theme]').forEach(function (b) {
        b.addEventListener('click', function () { window.SS_THEME.set(b.getAttribute('data-theme')); });
      });
      document.addEventListener('ss:themechange', function (e) { syncTheme(e.detail.mode); });
      syncTheme(window.SS_THEME.mode);
    } else {
      themeRow.hidden = true;
    }

    function wireToggle(btnId, cls, key) {
      var b = document.getElementById(btnId);
      function sync() {
        var on = root.classList.contains(cls);
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = typeof window.SS_T === 'function' ? window.SS_T(on ? 'ui.on' : 'ui.off', on ? 'On' : 'Off') : (on ? 'On' : 'Off');
      }
      b.addEventListener('click', function () {
        root.classList.toggle(cls); save(key, root.classList.contains(cls) ? '1' : '0'); sync();
      });
      document.addEventListener('ss:lang', sync);
      if (read(key) === '1' && !root.classList.contains(cls)) root.classList.add(cls);
      sync();
    }
    wireToggle('contrastBtn', 'hc', 'ss-contrast');
    wireToggle('motionBtn', 'rm', 'ss-motion');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

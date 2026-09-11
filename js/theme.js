/* Shared appearance state. Snapshot transitions never animate layout or delay input. */
(() => {
  'use strict';
  if (window.SS_THEME) return;
  const root = document.documentElement;
  const modes = ['auto', 'light', 'dark', 'mono'];
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = matchMedia('(forced-colors: active)');
  let selected = read('ss-theme') || 'auto', revision = 0, active = null, timer = 0;
  function read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function effective(mode = selected) { return mode === 'auto' ? (scheme.matches ? 'dark' : 'light') : mode; }
  function reduced() { return motion.matches || contrast.matches || root.classList.contains('rm') || root.classList.contains('hc'); }
  function render() {
    const mode = effective();
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('mono', mode === 'mono');
    if (root.hasAttribute('data-ss-theme-tokens')) root.dataset.theme = mode;
    root.style.colorScheme = mode === 'dark' ? 'dark' : 'light';
    document.querySelectorAll('button[data-theme-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === selected)));
    document.querySelectorAll('[data-theme-cycle]').forEach(b => {
      const names = Object.fromEntries(['light','dark','mono'].map(key => [key, window.SS_T?.('theme.' + key, key[0].toUpperCase() + key.slice(1)) || key]));
      b.textContent = names[mode];
      b.setAttribute('aria-label', (window.SS_T?.('a11y.theme', 'Appearance') || 'Appearance') + ': ' + names[mode] + ' → ' + names[next()]);
      b.title = b.getAttribute('aria-label');
    });
    document.dispatchEvent(new CustomEvent('ss:themechange', { detail: { mode: selected, effective: mode } }));
  }
  function next() { const cycle = ['light', 'dark', 'mono']; return cycle[(cycle.indexOf(effective()) + 1) % cycle.length]; }
  function cleanup() { clearTimeout(timer); root.classList.remove('ss-theme-snapshot', 'ss-theme-fallback', 'ss-theme-instant'); }
  function settle() {
    ++revision;
    if (active) active.skipTransition();
    active = null; cleanup();
    root.classList.add('ss-theme-instant'); render();
    timer = setTimeout(cleanup, 80);
  }
  function set(mode, options = {}) {
    if (!modes.includes(mode)) mode = 'auto';
    const before = effective();
    selected = mode; // Update intent synchronously; rapid clicks cycle from the latest choice.
    if (options.persist !== false) { try { localStorage.setItem('ss-theme', mode); } catch (_) {} }
    const ticket = ++revision;
    if (active) active.skipTransition();
    active = null; cleanup();
    if (options.animate === false || reduced() || before === effective()) { settle(); return; }
    const apply = () => { if (ticket === revision) render(); };
    if (typeof document.startViewTransition === 'function' && document.visibilityState === 'visible') {
      // Suppress underlying color transitions so snapshots capture the final palette.
      root.classList.add('ss-theme-snapshot');
      try {
        const transition = document.startViewTransition(apply);
        active = transition;
        transition.ready.catch(() => {});
        transition.finished.then(() => {
          if (ticket === revision) { active = null; cleanup(); }
        }, () => { if (ticket === revision) { active = null; render(); cleanup(); } });
      } catch (_) { render(); cleanup(); }
    } else {
      root.classList.add('ss-theme-fallback'); apply();
      timer = setTimeout(cleanup, 280);
    }
  }
  window.SS_THEME = { set, cycle: () => set(next()), effective, get mode() { return selected; } };
  if (!modes.includes(selected)) selected = 'auto';
  if (read('ss-motion') === '1') root.classList.add('rm');
  if (read('ss-contrast') === '1') root.classList.add('hc');
  render();
  scheme.addEventListener('change', () => { if (selected === 'auto') set('auto', { persist: false, animate: false }); });
  [motion, contrast].forEach(mq => mq.addEventListener('change', () => { if (reduced()) settle(); }));
  new MutationObserver(() => { if (reduced() && (active || root.classList.contains('ss-theme-fallback'))) settle(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('storage', e => { if (e.key === 'ss-theme' || e.key === null) set(read('ss-theme') || 'auto', { persist: false, animate: false }); });
  addEventListener('pagehide', () => { ++revision; if (active) active.skipTransition(); active = null; cleanup(); render(); });
  document.addEventListener('ss:lang', () => { if (active) settle(); else render(); });
  addEventListener('resize', () => { if (active) settle(); });
  document.addEventListener('DOMContentLoaded', () => {
    const legacy = document.getElementById('theme');
    if (legacy) {
      legacy.removeAttribute('data-i18n-al'); legacy.removeAttribute('data-i18n-ti'); legacy.removeAttribute('aria-pressed');
      legacy.dataset.themeCycle = ''; legacy.addEventListener('click', () => window.SS_THEME.cycle());
    }
    document.addEventListener('click', e => { const b = e.target.closest('button[data-theme-choice]'); if (b) set(b.dataset.themeChoice); });
    render();
  });
})();

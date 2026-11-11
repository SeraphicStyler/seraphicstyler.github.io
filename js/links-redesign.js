/* Inline films: native posters/controls first, bounded playback as enhancement. */
(() => {
  const page = document.querySelector('.bio');
  if (!page) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const films = [...page.querySelectorAll('video')];
  const visible = new Set(), pausedByUser = new WeakSet();
  const icons = {
    Play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 5.9v12.2c0 .6.7 1 1.2.7l9.5-6.1a.8.8 0 0 0 0-1.4L9.6 5.2c-.5-.3-1.2.1-1.2.7z"/></svg>',
    Pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.8" y="5.2" width="3.4" height="13.6" rx="1.4"/><rect x="13.8" y="5.2" width="3.4" height="13.6" rx="1.4"/></svg>'
  };
  const quiet = () => reduce.matches || root.matches('.rm,.hc,.mono') || navigator.connection?.saveData;
  const exposed = video => !video.closest('details:not([open])');
  function sync() {
    let playing = 0;
    for (const video of films) {
      if (!document.hidden && !root.classList.contains('ss-menu-open') && !quiet() && visible.has(video) && exposed(video) && !pausedByUser.has(video) && playing < (innerWidth < 600 ? 1 : 2)) {
        playing++; video.play().catch(() => {});
      } else video.pause();
    }
  }
  for (const video of films) {
    video.muted = video.defaultMuted = video.playsInline = true;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'bio-film-toggle';
    const name = video.getAttribute('aria-label');
    const update = () => {
      const label = video.paused ? 'Play' : 'Pause';
      button.innerHTML = icons[label];
      button.setAttribute('aria-label', `${label} ${name}`);
      video.parentElement.classList.toggle('is-playing', !video.paused);
    };
    button.addEventListener('click', () => {
      if (video.paused) {
        pausedByUser.delete(video);
        films.filter(other => other !== video).forEach(other => { pausedByUser.add(other); other.pause(); });
        video.play().catch(() => { video.controls = true; update(); });
      } else { pausedByUser.add(video); video.pause(); }
    });
    const poster = document.createElement('img');
    poster.loading = 'lazy'; poster.alt = ''; poster.className = 'bio-film-poster'; poster.src = video.poster || video.dataset.poster;
    const fail = () => { video.parentElement.classList.add('is-failed'); button.hidden = true; };
    video.addEventListener('error', fail);
    video.addEventListener('play', update); video.addEventListener('pause', update);
    video.parentElement.prepend(poster); video.parentElement.append(button); video.controls = false; update();
    if (video.error) fail();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting && e.intersectionRatio >= .6 ? visible.add(e.target) : visible.delete(e.target)); sync();
    }, {threshold:[0,.6]});
    films.forEach(video => observer.observe(video));
  }
  page.querySelectorAll('details').forEach(details => details.addEventListener('toggle', () => { details.querySelectorAll('video[data-poster]').forEach(v => { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); }); sync(); }));
  reduce.addEventListener('change', sync);
  new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['class']});
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => films.forEach(video => video.pause()));
})();

/* Inline films: native posters/controls first, bounded playback as enhancement. */
(() => {
  const page = document.querySelector('.bio');
  if (!page) return;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const films = [...page.querySelectorAll('video')];
  const visible = new Set(), pausedByUser = new WeakSet();
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
    const update = () => { button.textContent = video.paused ? 'Play' : 'Pause'; button.setAttribute('aria-label', `${button.textContent} ${name}`); };
    button.addEventListener('click', () => {
      if (video.paused) {
        pausedByUser.delete(video);
        films.filter(other => other !== video).forEach(other => { pausedByUser.add(other); other.pause(); });
        video.play().catch(() => { video.controls = true; update(); });
      } else { pausedByUser.add(video); video.pause(); }
    });
    const poster = document.createElement('img');
    poster.src = video.poster; poster.alt = ''; poster.className = 'bio-film-poster'; poster.loading = 'lazy';
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
  page.querySelectorAll('details').forEach(details => details.addEventListener('toggle', sync));
  reduce.addEventListener('change', sync);
  new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['class']});
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => films.forEach(video => video.pause()));
})();

/* Seraphic Styler — lookbook data + renderer
   ----------------------------------------------------------------------
   One small data layer for the lookbook, shared by the public site and the
   admin panel (admin.html). Looks are stored as JSON.

   STORAGE: today it reads/writes the browser (localStorage) so you can use
   the editor immediately. To go live for everyone, swap the two functions
   below (load / save) for Supabase calls — the rest of the app is unchanged.
   See the SUPABASE hook at the bottom.

   A "look" object:
     { id, type, title, subtitle, url, image }
     type ∈ 'image' | 'youtube' | 'tiktok' | 'instagram' | 'link' | 'update' | 'placeholder'
   ====================================================================== */
(function () {
  'use strict';
  var KEY = 'ss-lookbook-v6';

  // the current tiles, used until you add your own
  var SEED = [
    // Self-hosted lookbook clips (assets/lookbook/*.mp4) — silent, autoplay, looped
    { id: 'ka1', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-1.mp4', aspect: '4/5' },
    { id: 'lc1', type: 'video', title: 'Lane Cì', subtitle: '', url: 'assets/lookbook/lane-1.mp4', aspect: '4/5' },
    { id: 'nn1', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-1.mp4', aspect: '4/5' },
    { id: 'vy1', type: 'video', title: 'Viery', subtitle: '', url: 'assets/lookbook/viery-1.mp4', aspect: '4/5' },

    { id: 'ka2', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-2.mp4', aspect: '1/1' },
    { id: 'lc2', type: 'video', title: 'Lane Cì', subtitle: '', url: 'assets/lookbook/lane-2.mp4', aspect: '1/1' },
    { id: 'nn2', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-2.mp4', aspect: '1/1' },
    { id: 'vy2', type: 'video', title: 'Viery', subtitle: '', url: 'assets/lookbook/viery-2.mp4', aspect: '1/1' },

    { id: 'ka3', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-3.mp4', aspect: '3/4' },
    { id: 'lc3', type: 'video', title: 'Lane Cì', subtitle: '', url: 'assets/lookbook/lane-3.mp4', aspect: '3/4' },
    { id: 'nn3', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-3.mp4', aspect: '3/4' },
    { id: 'vy3', type: 'video', title: 'Viery', subtitle: '', url: 'assets/lookbook/viery-3.mp4', aspect: '3/4' },

    { id: 'ka4', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-4.mp4', aspect: '4/5' },
    { id: 'lc4', type: 'video', title: 'Lane Cì', subtitle: '', url: 'assets/lookbook/lane-4.mp4', aspect: '4/5' },
    { id: 'nn4', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-4.mp4', aspect: '4/5' },
    { id: 'vy4', type: 'video', title: 'Viery', subtitle: '', url: 'assets/lookbook/viery-4.mp4', aspect: '4/5' },

    { id: 'ka5', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-5.mp4', aspect: '1/1' },
    { id: 'lc5', type: 'video', title: 'Lane Cì', subtitle: '', url: 'assets/lookbook/lane-5.mp4', aspect: '1/1' },
    { id: 'nn5', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-5.mp4', aspect: '1/1' },
    { id: 'vy5', type: 'video', title: 'Viery', subtitle: '', url: 'assets/lookbook/viery-5.mp4', aspect: '1/1' },

    { id: 'ka6', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-6.mp4', aspect: '3/4' },
    { id: 'nn6', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-6.mp4', aspect: '3/4' },
    { id: 'ka7', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-7.mp4', aspect: '4/5' },
    { id: 'nn7', type: 'video', title: 'Ninisesi', subtitle: '', url: 'assets/lookbook/ninisesi-7.mp4', aspect: '4/5' },
    { id: 'ka8', type: 'video', title: 'Kathy Atelier', subtitle: '', url: 'assets/lookbook/kathy-8.mp4', aspect: '1/1' }
  ];

  function load() {
    try { var s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {}
    return SEED.map(function (s) { return Object.assign({}, s); });
  }
  function save(looks) {
    try { localStorage.setItem(KEY, JSON.stringify(looks)); return true; } catch (e) { return false; }
  }
  function uid() { return 'l' + Math.random().toString(36).slice(2, 9); }

  // ---- url → embed id helpers ----
  function ytId(u) {
    if (!u) return '';
    var m = u.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    return m ? m[1] : '';
  }
  function ttId(u) {
    if (!u) return '';
    var m = u.match(/video\/(\d{6,})/);
    return m ? m[1] : '';
  }

  function esc(s) { return (s || '').replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---- build one tile element for a look ----
  function tile(lk) {
    var el = document.createElement(lk.type === 'link' ? 'a' : 'div');
    el.className = 'tile lb-tile lb-' + lk.type;
    var cap = '<div class="lb-cap"><div class="label">' + esc(lk.title) +
      '</div>' + (lk.subtitle ? '<div class="sub">' + esc(lk.subtitle) + '</div>' : '') + '</div>';

    if (lk.type === 'placeholder') {
      el.className = 'tile lb-tile lb-placeholder';
      el.innerHTML = '<div class="tile-ph"><div><div class="label">' + esc(lk.title) +
        '</div><div class="sub">' + esc(lk.subtitle) + '</div></div></div>';
    } else if (lk.type === 'video') {
      // Derive a first-frame poster from the video URL (foo/bar.mp4 → foo/posters/bar.jpg)
      // so tiles paint immediately; works for admin/localStorage data too. A missing
      // poster is harmless — the browser simply shows the plain video box.
      var pm = /^(.*\/)?([^\/]+)\.mp4$/i.exec(lk.url || '');
      var poster = pm ? (pm[1] || '') + 'posters/' + pm[2] + '.jpg' : '';
      el.innerHTML = '<video class="lazy-video" data-src="' + esc(lk.url) + '"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' preload="none" muted loop playsinline style="width: 100%; height: auto; display: block; aspect-ratio: ' + (lk.aspect || '3/4') + '; object-fit: cover;"></video>' +
        '<div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 1.4rem; padding-top: 3rem; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; z-index: 2; pointer-events: none;">' +
        '<div class="label" style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 300;">' + esc(lk.title) + '</div>' +
        (lk.subtitle ? '<div class="sub" style="font-family: var(--font-accent); font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; margin-top: 0.4rem; opacity: 0.95;">' + esc(lk.subtitle) + '</div>' : '') +
        '</div>';
    } else if (lk.type === 'image') {
      el.innerHTML = '<div class="lb-media" style="background-image:url(' + JSON.stringify(lk.image || lk.url) + ')"></div>' + cap;
    } else if (lk.type === 'youtube') {
      var yid = ytId(lk.url);
      el.innerHTML = '<div class="lb-embed">' + (yid ?
        '<iframe src="https://www.youtube.com/embed/' + yid + '" title="' + esc(lk.title) +
        '" loading="lazy" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'
        : '<div class="lb-warn">Add a YouTube link</div>') + '</div>' + cap;
    } else if (lk.type === 'tiktok') {
      el.innerHTML = '<div class="lb-embed"><blockquote class="tiktok-embed" cite="' + esc(lk.url) +
        '" data-video-id="' + ttId(lk.url) + '" style="margin:0;max-width:100%"><section></section></blockquote></div>' + cap;
    } else if (lk.type === 'instagram') {
      el.innerHTML = '<div class="lb-embed"><blockquote class="instagram-media" data-instgrm-permalink="' + esc(lk.url) +
        '" data-instgrm-version="14" style="margin:0;width:100%"></blockquote></div>' + cap;
    } else if (lk.type === 'link') {
      el.href = lk.url || '#'; el.target = '_blank'; el.rel = 'noopener';
      el.innerHTML = (lk.image ? '<div class="lb-media" style="background-image:url(' + JSON.stringify(lk.image) + ')"></div>' : '<div class="lb-linkbg"></div>') + cap;
    } else { // update
      el.innerHTML = '<div class="lb-updatebg"></div>' + cap;
    }
    return el;
  }

  function ensureScript(src, id) {
    if (document.getElementById(id)) {
      if (id === 'ig-embed' && window.instgrm) window.instgrm.Embeds.process();
      return;
    }
    var s = document.createElement('script'); s.id = id; s.async = true; s.src = src;
    document.body.appendChild(s);
  }

  function initLazyObserver(container) {
    if (!('IntersectionObserver' in window)) {
      // Fallback for very old browsers: just load and play all
      var vids = container.querySelectorAll('.lazy-video');
      vids.forEach(function(v) { v.src = v.getAttribute('data-src'); v.play(); });
      return;
    }
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          if (!video.src && video.getAttribute('data-src')) {
            video.src = video.getAttribute('data-src');
            video.load();
          }
          var p = video.play();
          if (p !== undefined) p.catch(function(){});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px', threshold: 0.1 });
    
    var lazyVideos = container.querySelectorAll('.lazy-video');
    lazyVideos.forEach(function(v) { observer.observe(v); });
  }

  function render() {
    var gal = document.querySelector('#lookbook .gallery');
    if (!gal) return;
    var looks = load();
    var limit = gal.getAttribute('data-limit');
    if (limit && limit !== 'all') {
      looks = looks.slice(0, parseInt(limit, 10));
    }
    gal.innerHTML = '';
    looks.forEach(function (lk) { gal.appendChild(tile(lk)); });
    initLazyObserver(gal);
    if (looks.some(function (l) { return l.type === 'tiktok'; })) ensureScript('https://www.tiktok.com/embed.js', 'tt-embed');
    if (looks.some(function (l) { return l.type === 'instagram'; })) ensureScript('https://www.instagram.com/embed.js', 'ig-embed');
  }

  // public API (used by admin.html)
  window.SS_Lookbook = {
    KEY: KEY, SEED: SEED, load: load, save: save, uid: uid, render: render,
    types: ['image', 'video', 'instagram', 'tiktok', 'youtube', 'link', 'update']
  };

  /* ---- SUPABASE hook (flip on when ready) -------------------------------
     1. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     2. var sb = supabase.createClient(URL, ANON_KEY);
     3. replace load():  const {data} = await sb.from('looks').select('*').order('pos');
        replace save():  await sb.from('looks').upsert(looks);  (admin only, behind auth)
     The render() + tile() code stays exactly the same.
     --------------------------------------------------------------------- */

  if (document.querySelector('#lookbook .gallery')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
  }
})();

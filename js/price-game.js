/* Seraphic Styler — the price game (guess, then the card flips).
   A carousel of real order scenarios: pick what you think it costs all-in,
   the card flips to the honest estimate with a short breakdown, then hands
   you to the real estimator below. Scenarios store INPUTS only — every
   number on screen is computed from window.CONFIG (js/estimator.js) at
   render time, so a repricing there reprices this game automatically.
   Mounts into #priceGame on index.html and estimate.html; renders nothing
   if the mount or CONFIG is missing. Flip + slide are class-driven CSS
   transitions — the global reduced-motion rules make them instant; no
   logic waits on transitionend. */
(function () {
  'use strict';

  var mount = document.getElementById('priceGame');
  if (!mount || !window.CONFIG || !window.CONFIG.styling) return;
  var C = window.CONFIG;

  /* Inputs only — prices come from CONFIG. */
  var SCENARIOS = [
    { id: 'capsule',  emoji: '🧳', styling: 'capsule',  items: [], region: 'us',      weight: 'light' },
    { id: 'dress',    emoji: '👗', styling: null, items: [4500000], region: 'oceania', weight: 'light', complex: true },
    { id: 'haul',     emoji: '🛍️', styling: null, items: [1200000, 800000, 2500000], region: 'eu', weight: 'light' },
    { id: 'gifttokyo',emoji: '🎁', styling: 'discovery', items: [], region: 'asia',   weight: 'light' },
    { id: 'atelier',  emoji: '✨', styling: 'atelier',  items: [], region: null },
    { id: 'onepiece', emoji: '📦', styling: null, items: [850000], region: 'us',      weight: 'light' }
  ];

  var L = {
    en: {
      eyebrow: 'The price game', title: 'Guess what it costs',
      sub: 'Six real orders. Pick a price — the card flips to the honest number, shipping included.',
      q: 'All-in, what would you guess?',
      prev: 'Previous scenario', next: 'Next scenario', dot: 'Scenario {n}',
      allin: 'all-in', verdictSpot: 'Spot on. You read Sài Gòn well.',
      verdictUnder: 'A little more than that — international shipping from Việt Nam is the honest surprise.',
      verdictOver: 'Less than you guessed — the pieces themselves are at cost, never marked up.',
      rows: { pieces: 'Pieces, at cost', fees: 'Service & base fees', styling: 'Styling tier — {tier}',
              complex: 'Rare-find sourcing', ship: 'Shipping (the honest variable)', shipNone: 'Shipping', none: 'none — it stays in Sài Gòn' },
      cta: 'Build your real estimate ↓', again: 'Try another scenario →',
      note: 'A ballpark from the same math as the estimator below — the exact quote is always confirmed by DM.',
      sc: {
        capsule: 'A 5-piece capsule from Saigon designers, styled to mix and match, shipped to Los Angeles.',
        dress: 'One rare designer dress, hunted down and verified in person, shipped to Sydney.',
        haul: 'Three pieces you found online from three different Saigon brands, ordered together to London.',
        gifttokyo: 'A gift: one thoughtful piece chosen from a style profile, sent to a friend in Tokyo.',
        atelier: 'The full atelier day in Sài Gòn — consultation, sourcing, and a two-hour in-shop try-on.',
        onepiece: 'A single 850,000₫ piece from a local label, verified and shipped to Toronto.'
      }
    },
    vi: {
      eyebrow: 'Trò chơi đoán giá', title: 'Đoán xem hết bao nhiêu',
      sub: 'Sáu đơn hàng thật. Chọn một mức giá — tấm thẻ lật ra con số thành thật, gồm cả phí gửi.',
      q: 'Tính hết mọi thứ, bạn đoán bao nhiêu?',
      prev: 'Tình huống trước', next: 'Tình huống sau', dot: 'Tình huống {n}',
      allin: 'trọn gói', verdictSpot: 'Chuẩn luôn. Bạn hiểu Sài Gòn đấy.',
      verdictUnder: 'Nhỉnh hơn một chút — phí gửi quốc tế từ Việt Nam là điều bất ngờ thành thật nhất.',
      verdictOver: 'Ít hơn bạn đoán — món đồ tính đúng giá gốc, không bao giờ cộng thêm.',
      rows: { pieces: 'Món đồ, giá gốc', fees: 'Phí dịch vụ & điều phối', styling: 'Gói styling — {tier}',
              complex: 'Săn món hiếm', ship: 'Phí gửi (biến số thành thật)', shipNone: 'Phí gửi', none: 'không có — nhận tại Sài Gòn' },
      cta: 'Tự tính ước lượng thật ↓', again: 'Thử tình huống khác →',
      note: 'Ước lượng từ đúng công thức của bảng tính bên dưới — báo giá chính xác luôn được xác nhận qua tin nhắn.',
      sc: {
        capsule: 'Một capsule 5 món từ các nhà thiết kế Sài Gòn, phối sẵn để mặc lẫn nhau, gửi đến Los Angeles.',
        dress: 'Một chiếc đầm thiết kế hiếm, săn tìm và kiểm tra tận nơi, gửi đến Sydney.',
        haul: 'Ba món bạn tìm thấy trên mạng từ ba thương hiệu Sài Gòn khác nhau, gom một đơn gửi London.',
        gifttokyo: 'Một món quà: một món đồ chọn theo hồ sơ phong cách, gửi cho người bạn ở Tokyo.',
        atelier: 'Trọn một ngày atelier tại Sài Gòn — tư vấn, tìm đồ và hai giờ thử đồ tại cửa hàng.',
        onepiece: 'Một món 850.000₫ từ nhãn địa phương, kiểm tra kỹ và gửi đến Toronto.'
      }
    }
  };
  function lang() { var l = document.documentElement.getAttribute('lang') || 'en'; return L[l] ? l : 'en'; }
  function t(k) { return L[lang()][k]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---- pricing, mirroring js/estimator.js ---- */
  function vndToUsd(v) { return v / (C.fx.fallbackVndPerUsd * (1 - C.fx.spread)); }
  function fmtVnd(n) { return Math.round(n).toLocaleString('en-US') + '₫'; }
  function fmtUsd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function friendly(usd) { return usd < 120 ? Math.round(usd / 5) * 5 : Math.round(usd / 10) * 10; }

  function price(s) {
    var sub = 0, fees = 0;
    (s.items || []).forEach(function (v) {
      sub += v;
      fees += Math.max(C.fee.minFee, v <= C.fee.midThreshold ? v * C.fee.midRate : v * C.fee.highRate);
    });
    var st = s.styling ? C.styling[s.styling] : null;
    var stylingNet = st ? st.vnd - Math.min(st.credit, sub) : 0;
    var complex = s.complex ? C.complexFee : 0;
    var stops = (s.extraStops || 0) * C.stops.perExtra;
    var ship = s.region ? C.shipping[s.region][s.weight || 'light'] : null;
    var shipMid = ship ? (ship[0] + ship[1]) / 2 : 0;
    var totalVnd = sub + fees + C.baseFee + stylingNet + complex + stops + shipMid;
    return { sub: sub, fees: fees + C.baseFee + stops, styling: st, stylingNet: stylingNet,
             complex: complex, ship: ship, totalVnd: totalVnd,
             usd: friendly(vndToUsd(totalVnd)) };
  }

  function options(s) {
    var truth = price(s).usd;
    var low = friendly(truth * 0.62), high = friendly(truth * 1.45);
    if (low >= truth) low = truth - (truth < 120 ? 15 : 30);
    if (high <= truth) high = truth + (truth < 120 ? 15 : 30);
    return { truth: truth, list: [low, truth, high] };
  }

  /* State survives language re-renders. */
  var state = { idx: 0, picked: {}, order: {} };
  SCENARIOS.forEach(function (s) {
    state.order[s.id] = [0, 1, 2].sort(function () { return Math.random() - 0.5; });
  });

  if (!document.getElementById('pg-css')) {
    var css = document.createElement('style');
    css.id = 'pg-css';
    css.textContent =
      '.pg{max-width:640px;margin:0 auto 2.4rem;text-align:center}' +
      '.pg .eyebrow{color:var(--eyebrow-ink)}' +
      '.pg h3{font-family:var(--font-display);font-weight:400;font-size:clamp(1.2rem,2.8vw,1.55rem);margin:0.3rem 0 0.45rem}' +
      '.pg-sub{color:var(--text-secondary);font-size:0.9rem;line-height:1.6;max-width:44ch;margin:0 auto 1.3rem}' +
      '.pg-shell{position:relative}' +
      '.pg-viewport{overflow:hidden;border-radius:var(--card-radius);touch-action:pan-y}' +
      '.pg-track{display:flex;transition:transform 0.5s cubic-bezier(0.33,1,0.68,1)}' +
      '.pg-slide{flex:0 0 100%;min-width:0;padding:0 2px}' +
      '.pg-flip{position:relative;perspective:1200px}' +
      '.pg-face{position:absolute;top:0;left:0;width:100%;backface-visibility:hidden;-webkit-backface-visibility:hidden;' +
        'transition:transform 0.6s cubic-bezier(0.33,1,0.68,1);' +
        'background:var(--surface);backdrop-filter:blur(var(--glass-blur)) saturate(150%);-webkit-backdrop-filter:blur(var(--glass-blur)) saturate(150%);' +
        'border:1px solid var(--surface-border);border-radius:var(--card-radius);' +
        'padding:1.5rem clamp(1rem,4vw,1.8rem) 1.7rem;display:flex;flex-direction:column;gap:0.75rem;align-items:center}' +
      '.pg-front{transform:rotateY(0deg)}.pg-back{transform:rotateY(-180deg)}' +
      '.pg-flipped .pg-front{transform:rotateY(180deg)}.pg-flipped .pg-back{transform:rotateY(0deg)}' +
      '.pg-emoji{font-size:1.7rem;line-height:1}' +
      '.pg-scene{color:var(--text-primary);font-size:0.95rem;line-height:1.6;max-width:46ch;margin:0}' +
      '.pg-q{font-family:var(--font-accent);font-size:0.74rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--eyebrow-ink);margin:0.2rem 0 0}' +
      '.pg-opts{display:flex;flex-wrap:wrap;justify-content:center;gap:0.6rem}' +
      '.pg-opt{font-family:var(--font-display);font-size:1.05rem;color:var(--text-primary);background:var(--surface-soft,var(--surface));' +
        'border:1px solid var(--surface-border);border-radius:var(--btn-radius);padding:0.6rem 1.35rem;min-height:44px;cursor:pointer;' +
        'transition:border-color 0.2s ease,transform 0.2s ease;animation:vqPop 0.4s cubic-bezier(0.22,1,0.36,1) both}' +
      '.pg-opt:nth-child(2){animation-delay:0.08s}.pg-opt:nth-child(3){animation-delay:0.16s}' +
      '.pg-opt:hover{border-color:var(--accent);transform:translateY(-2px)}' +
      '.pg-verdict{color:var(--text-primary);font-size:0.92rem;line-height:1.55;max-width:44ch;margin:0}' +
      '.pg-total{font-family:var(--font-display);font-weight:300;font-size:2rem;color:var(--accent);margin:0;font-variant-numeric:tabular-nums}' +
      '.pg-total small{display:block;font-family:var(--font-accent);font-size:0.66rem;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-secondary);margin-top:0.15rem}' +
      '.pg-rows{list-style:none;margin:0;padding:0;width:100%;max-width:24rem;text-align:left}' +
      '.pg-rows li{display:flex;justify-content:space-between;gap:1rem;padding:0.4rem 0;border-bottom:1px dashed var(--surface-border);' +
        'font-size:0.82rem;color:var(--text-secondary)}' +
      '.pg-rows li:last-child{border-bottom:none}' +
      '.pg-rows .v{font-variant-numeric:tabular-nums;white-space:nowrap;color:var(--text-primary)}' +
      '.pg-ctas{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:0.5rem 1.1rem;margin-top:0.2rem}' +
      '.pg-again{font-family:var(--font-accent);font-size:0.8rem;background:none;border:none;cursor:pointer;color:var(--accent-deep);' +
        'min-height:44px;padding:0;border-bottom:1px solid transparent}' +
      '.pg-again:hover,.pg-again:focus-visible{border-bottom-color:currentColor}' +
      '.pg-note{color:var(--text-secondary);font-size:0.74rem;line-height:1.55;font-style:italic;margin:0.9rem auto 0;max-width:48ch}' +
      '.pg-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:40px;height:40px;border-radius:50%;' +
        'border:1px solid var(--surface-border);background:var(--surface);color:var(--text-primary);font-size:1.2rem;line-height:1;' +
        'cursor:pointer;display:grid;place-items:center;transition:border-color 0.2s ease,opacity 0.2s ease}' +
      '.pg-arrow:hover{border-color:var(--text-primary)}' +
      '.pg-arrow[disabled]{opacity:0.25;cursor:default;pointer-events:none}' +
      '.pg-prev{left:-8px}.pg-next{right:-8px}' +
      '@media (max-width:720px){.pg-prev{left:2px}.pg-next{right:2px}}' +
      '.pg-dots{display:flex;justify-content:center;gap:0.5rem;margin-top:0.9rem}' +
      '.pg-dot{width:9px;height:9px;padding:0;border-radius:50%;border:none;cursor:pointer;background:var(--surface-border);' +
        'transition:background 0.25s ease,transform 0.25s ease}' +
      '.pg-dot[aria-current="true"]{background:var(--accent);transform:scale(1.25)}';
    document.head.appendChild(css);
  }

  function rm() {
    return document.documentElement.classList.contains('rm') ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function rowsHtml(s, p) {
    var R = t('rows');
    var out = '';
    if (p.sub) out += '<li><span>' + esc(R.pieces) + '</span><span class="v">' + esc(fmtVnd(p.sub)) + '</span></li>';
    if (p.styling) out += '<li><span>' + esc(R.styling.replace('{tier}', p.styling.label)) + '</span><span class="v">' + esc(fmtVnd(p.stylingNet)) + '</span></li>';
    out += '<li><span>' + esc(R.fees) + '</span><span class="v">' + esc(fmtVnd(p.fees)) + '</span></li>';
    if (p.complex) out += '<li><span>' + esc(R.complex) + '</span><span class="v">' + esc(fmtVnd(p.complex)) + '</span></li>';
    if (p.ship) out += '<li><span>' + esc(R.ship) + '</span><span class="v">' + esc(fmtVnd(p.ship[0])) + ' – ' + esc(fmtVnd(p.ship[1])) + '</span></li>';
    else out += '<li><span>' + esc(R.shipNone) + '</span><span class="v">' + esc(R.none) + '</span></li>';
    return out;
  }

  function slideHtml(s, i) {
    var opts = options(s);
    var picked = state.picked[s.id]; // undefined | picked USD value
    var p = price(s);
    var verdict = picked == null ? '' :
      picked === opts.truth ? t('verdictSpot') : picked < opts.truth ? t('verdictUnder') : t('verdictOver');
    return '<div class="pg-slide" data-sc="' + s.id + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + SCENARIOS.length + '">' +
      '<div class="pg-flip' + (picked != null ? ' pg-flipped' : '') + '">' +
        '<div class="pg-face pg-front"' + (picked != null ? ' aria-hidden="true"' : '') + '>' +
          '<span class="pg-emoji" aria-hidden="true">' + s.emoji + '</span>' +
          '<p class="pg-scene">' + esc(t('sc')[s.id]) + '</p>' +
          '<p class="pg-q">' + esc(t('q')) + '</p>' +
          '<div class="pg-opts" role="group">' +
            state.order[s.id].map(function (oi) {
              var v = opts.list[oi];
              return '<button type="button" class="pg-opt" data-usd="' + v + '"' + (picked != null ? ' disabled' : '') + '>' + esc(fmtUsd(v)) + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="pg-face pg-back"' + (picked == null ? ' aria-hidden="true"' : '') + '>' +
          '<p class="pg-verdict">' + esc(verdict) + '</p>' +
          '<p class="pg-total">≈ ' + esc(fmtUsd(p.usd)) + ' <small>' + esc(t('allin')) + ' · ' + esc(fmtVnd(p.totalVnd)) + '</small></p>' +
          '<ul class="pg-rows">' + rowsHtml(s, p) + '</ul>' +
          '<div class="pg-ctas">' +
            '<button type="button" class="btn btn-primary pg-cta">' + esc(t('cta')) + '</button>' +
            '<button type="button" class="pg-again">' + esc(t('again')) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var track, viewport, prevBtn, nextBtn, dotBtns, live;

  function render() {
    mount.innerHTML =
      '<div class="pg" role="group" aria-roledescription="carousel" aria-label="' + esc(t('title')) + '">' +
        '<span class="eyebrow">' + esc(t('eyebrow')) + '</span>' +
        '<h3>' + esc(t('title')) + '</h3>' +
        '<p class="pg-sub">' + esc(t('sub')) + '</p>' +
        '<div class="pg-shell">' +
          '<div class="pg-viewport"><div class="pg-track">' +
            SCENARIOS.map(slideHtml).join('') +
          '</div></div>' +
          '<button type="button" class="pg-arrow pg-prev" aria-label="' + esc(t('prev')) + '">‹</button>' +
          '<button type="button" class="pg-arrow pg-next" aria-label="' + esc(t('next')) + '">›</button>' +
        '</div>' +
        '<div class="pg-dots"></div>' +
        '<p class="pg-note">' + esc(t('note')) + '</p>' +
        '<p class="sr-only" role="status" aria-live="polite" data-pg-say></p>' +
      '</div>';
    viewport = mount.querySelector('.pg-viewport');
    track = mount.querySelector('.pg-track');
    prevBtn = mount.querySelector('.pg-prev');
    nextBtn = mount.querySelector('.pg-next');
    live = mount.querySelector('[data-pg-say]');
    var dots = mount.querySelector('.pg-dots');
    dotBtns = SCENARIOS.map(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'pg-dot';
      d.setAttribute('aria-label', t('dot').replace('{n}', i + 1));
      d.addEventListener('click', function () { goTo(i); });
      dots.appendChild(d);
      return d;
    });
    sizeFlips();
    apply();
    observeFaces();
  }

  function sizeFlips() {
    mount.querySelectorAll('.pg-flip').forEach(function (flip) {
      var h = 0;
      flip.querySelectorAll('.pg-face').forEach(function (f) { h = Math.max(h, f.offsetHeight); });
      if (h) flip.style.height = h + 'px';
    });
  }

  function apply() {
    track.style.transform = 'translateX(' + (-state.idx * 100) + '%)';
    prevBtn.disabled = state.idx === 0;
    nextBtn.disabled = state.idx === SCENARIOS.length - 1;
    dotBtns.forEach(function (d, i) { d.setAttribute('aria-current', i === state.idx ? 'true' : 'false'); });
    mount.querySelectorAll('.pg-slide').forEach(function (sl, i) {
      if (i === state.idx) sl.removeAttribute('aria-hidden');
      else sl.setAttribute('aria-hidden', 'true');
      sl.querySelectorAll('button').forEach(function (b) {
        if (i === state.idx) b.removeAttribute('tabindex'); else b.setAttribute('tabindex', '-1');
      });
    });
  }

  function goTo(i) {
    state.idx = Math.max(0, Math.min(SCENARIOS.length - 1, i));
    apply();
  }

  function refreshSlide(s) {
    var old = mount.querySelector('.pg-slide[data-sc="' + s.id + '"]');
    if (!old) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = slideHtml(s, SCENARIOS.indexOf(s));
    var freshFlip = tmp.querySelector('.pg-flip');
    /* Insert un-flipped, then add the class a frame later so the turn animates. */
    freshFlip.classList.remove('pg-flipped');
    old.innerHTML = '';
    old.appendChild(freshFlip);
    sizeFlips();
    apply();
    observeFaces();
    if (state.picked[s.id] != null) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { freshFlip.classList.add('pg-flipped'); });
      });
    }
  }

  mount.addEventListener('click', function (e) {
    var opt = e.target.closest ? e.target.closest('.pg-opt') : null;
    if (opt) {
      var slide = opt.closest('.pg-slide');
      var s = SCENARIOS.filter(function (x) { return x.id === slide.getAttribute('data-sc'); })[0];
      if (!s || state.picked[s.id] != null) return;
      state.picked[s.id] = parseInt(opt.getAttribute('data-usd'), 10);
      refreshSlide(s);
      var p = price(s);
      if (live) live.textContent = '≈ ' + fmtUsd(p.usd) + ' ' + t('allin') + '. ' +
        (state.picked[s.id] === p.usd ? t('verdictSpot') : state.picked[s.id] < p.usd ? t('verdictUnder') : t('verdictOver'));
      return;
    }
    if (e.target.closest && e.target.closest('.pg-again')) {
      goTo(state.idx < SCENARIOS.length - 1 ? state.idx + 1 : 0);
      return;
    }
    if (e.target.closest && e.target.closest('.pg-cta')) {
      var quiz = document.getElementById('estQuiz');
      if (!quiz) return;
      quiz.scrollIntoView({ behavior: rm() ? 'auto' : 'smooth', block: 'start' });
      var head = quiz.querySelector('.quiz-q');
      if (head) {
        head.setAttribute('tabindex', '-1');
        try { head.focus({ preventScroll: true }); } catch (err) { head.focus(); }
      }
    }
  });

  mount.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.target.closest && e.target.closest('.pg-opts')) return; // let buttons keep native arrow behavior
    var back = e.key === (document.documentElement.getAttribute('dir') === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    goTo(state.idx + (back ? -1 : 1));
    e.preventDefault();
  });

  /* Swipe */
  var px = 0, py = 0, tracking = false, swiped = false;
  mount.addEventListener('pointerdown', function (e) {
    if (!e.target.closest || !e.target.closest('.pg-viewport')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    px = e.clientX; py = e.clientY; tracking = true; swiped = false;
  });
  mount.addEventListener('pointerup', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - px, dy = e.clientY - py;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      goTo(state.idx + (dx < 0 ? 1 : -1));
    }
  });
  mount.addEventListener('pointercancel', function () { tracking = false; });
  mount.addEventListener('click', function (e) {
    if (swiped) { swiped = false; e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* Faces are absolutely positioned, so the mount never resizes with them —
     watch the faces themselves (font loads, viewport width, language). */
  var ro = window.ResizeObserver ? new ResizeObserver(function () { sizeFlips(); }) : null;
  function observeFaces() {
    if (!ro) return;
    ro.disconnect();
    mount.querySelectorAll('.pg-face').forEach(function (f) { ro.observe(f); });
  }
  if (!ro) window.addEventListener('resize', sizeFlips);

  new MutationObserver(function () { render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();

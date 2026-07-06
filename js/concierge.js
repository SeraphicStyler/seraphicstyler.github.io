/* Seraphic Styler — Concierge widget (unified Shop + Help)
   ----------------------------------------------------------------------
   One floating button (bottom-right) opens a frosted-glass panel with two
   tabs: Shop (style quiz, brand directory, dictionary) and Help (searchable
   FAQ + contact). Navigation uses an iOS-style push/pop slide — a chevron
   "back", a hairline close, no heavy chips. Brand/term/quiz data lives in
   js/assistant-data.js. No backend; the contact form composes a mailto.
   Replaces the old help.js + assistant.js widgets. EN + VI chrome. */
(function () {
  'use strict';
  var EMAIL = 'seraphicstyler@gmail.com';

  var L = {
    en: {
      brand: 'Concierge', shopTab: 'Shop', helpTab: 'Help',
      shopSub: 'Vietnamese brands, curated for you', helpSub: 'Replies within 1–2 business days',
      shopIntro: 'What can I help you find today?',
      quiz: 'Discover your style', browse: 'Browse all brands', terms: 'Dictionary',
      quizIntro: 'A few quick questions — then I’ll suggest a few brands.', step: 'Question',
      results: 'Your matches', resultsMsg: 'Here are your closest matches:',
      noResults: 'No exact match — here are a few you might still love:',
      restart: 'Start over', enquire: 'Ask me about these',
      browseIntro: 'Every brand & store I can source, grouped by how confirmed it is.',
      termsIntro: 'Tap a term to see what it means.', related: 'You might like',
      search: 'Search for help', suggested: 'Suggested articles', contact: 'Contact me',
      none: 'No articles matched — try contacting me below.', back: 'Back', close: 'Close',
      name: 'Your name', email: 'Email address', topic: 'What can I help with?',
      subject: 'Subject', message: 'Your message', send: 'Send',
      sent: '✓ Opening your email app with your message ready to send.',
      topics: ['General question', 'Sourcing request', 'Order & payment', 'Shipping & customs', 'Returns', 'Gift styling', 'Something else'],
      cat: { clothing: 'Clothing & textiles', shoes: 'Shoes', eyewear: 'Eyewear', accessories: 'Accessories & bags', vintage: 'Vintage & secondhand' },
      stat: { verified: '✅ Verified stores', online: '🌐 Online / appointment-only', unverified: '❓ To confirm — DM me', research: '📝 On my research list' }
    },
    vi: {
      brand: 'Trợ lý', shopTab: 'Mua sắm', helpTab: 'Trợ giúp',
      shopSub: 'Thương hiệu Việt, tuyển chọn cho bạn', helpSub: 'Phản hồi trong 1–2 ngày làm việc',
      shopIntro: 'Hôm nay mình giúp bạn tìm gì nhé?',
      quiz: 'Khám phá phong cách', browse: 'Xem tất cả thương hiệu', terms: 'Từ điển',
      quizIntro: 'Vài câu hỏi nhanh — rồi mình sẽ gợi ý vài thương hiệu.', step: 'Câu hỏi',
      results: 'Gợi ý cho bạn', resultsMsg: 'Đây là những lựa chọn hợp nhất với bạn:',
      noResults: 'Chưa khớp hoàn toàn — nhưng đây là vài cái bạn có thể thích:',
      restart: 'Làm lại', enquire: 'Hỏi mình về những thương hiệu này',
      browseIntro: 'Tất cả thương hiệu mình có thể tìm, nhóm theo mức độ xác minh.',
      termsIntro: 'Chạm vào một từ để xem nghĩa.', related: 'Có thể bạn thích',
      search: 'Tìm trợ giúp', suggested: 'Bài viết gợi ý', contact: 'Liên hệ với mình',
      none: 'Không có bài viết phù hợp — hãy liên hệ với mình bên dưới.', back: 'Quay lại', close: 'Đóng',
      name: 'Tên của bạn', email: 'Địa chỉ email', topic: 'Mình giúp gì được?',
      subject: 'Tiêu đề', message: 'Lời nhắn của bạn', send: 'Gửi',
      sent: '✓ Đang mở ứng dụng email với nội dung soạn sẵn cho bạn.',
      topics: ['Câu hỏi chung', 'Yêu cầu tìm hàng', 'Đơn hàng & thanh toán', 'Vận chuyển & hải quan', 'Đổi trả', 'Quà tặng phong cách', 'Khác'],
      cat: { clothing: 'Quần áo & vải vóc', shoes: 'Giày', eyewear: 'Kính mắt', accessories: 'Phụ kiện & túi', vintage: 'Vintage & đồ cũ' },
      stat: { verified: '✅ Cửa hàng đã xác minh', online: '🌐 Online / hẹn trước', unverified: '❓ Cần xác nhận — nhắn mình', research: '📝 Đang tìm hiểu' }
    }
  };
  function lang() { var l = document.documentElement.getAttribute('lang') || 'en'; return L[l] ? l : 'en'; }
  function t(k) { return L[lang()][k]; }

  var BRANDS = window.SS_BRANDS || [], TERMS = window.SS_TERMS || [], QUIZ = window.SS_QUIZ || [];
  var STATUS_ORDER = ['verified', 'online', 'unverified', 'research'];
  function statusOf(b) { return b.status || 'verified'; }
  function quizEligible(b) { var s = statusOf(b); return s === 'verified' || s === 'online'; }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function note(b) {
    var l = lang(), T = window.SS_TRANSLATIONS;
    if (l !== 'en' && b.noteKey && T && T[l] && T[l][b.noteKey]) return T[l][b.noteKey];
    return b.note || '';
  }
  function articles() {
    var out = [];
    document.querySelectorAll('.faq details').forEach(function (d) {
      var s = d.querySelector('summary'), a = d.querySelector('.a');
      if (s && a) out.push({ q: s.textContent.trim(), a: a.innerHTML });
    });
    return out;
  }

  var fab, panel, head, stage, titleEl, subEl, backBtn, tabsEl, tabBtns, progEl, progBar;
  var tab = 'shop', stack = [], currentView = null, answers = {};

  function build() {
    fab = document.createElement('button');
    fab.className = 'cc-fab'; fab.type = 'button'; fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'cc-panel');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg><span class="lbl"></span>';

    panel = document.createElement('div');
    panel.className = 'cc-panel'; panel.id = 'cc-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Concierge'); panel.setAttribute('tabindex', '-1');
    panel.innerHTML =
      '<div class="cc-head">' +
        '<button class="cc-back" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<div class="cc-titles"><div class="cc-title"></div><div class="cc-sub"></div></div>' +
        '<button class="cc-close" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<div class="cc-tabs" role="tablist">' +
          '<button class="cc-tab" type="button" role="tab" data-tab="shop"></button>' +
          '<button class="cc-tab" type="button" role="tab" data-tab="help"></button>' +
        '</div>' +
        '<div class="cc-progress" aria-hidden="true"><span class="cc-progress-bar"></span></div>' +
      '</div>' +
      '<div class="cc-stage"></div>';

    document.body.appendChild(fab); document.body.appendChild(panel);
    head = panel.querySelector('.cc-head'); stage = panel.querySelector('.cc-stage');
    titleEl = panel.querySelector('.cc-title'); subEl = panel.querySelector('.cc-sub');
    backBtn = panel.querySelector('.cc-back'); tabsEl = panel.querySelector('.cc-tabs');
    tabBtns = panel.querySelectorAll('.cc-tab'); progEl = panel.querySelector('.cc-progress'); progBar = panel.querySelector('.cc-progress-bar');

    fab.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
    panel.querySelector('.cc-close').addEventListener('click', close);
    backBtn.addEventListener('click', back);
    backBtn.setAttribute('aria-label', t('back')); panel.querySelector('.cc-close').setAttribute('aria-label', t('close'));
    tabBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var nt = b.getAttribute('data-tab');
        if (nt === tab && stack.length === 1) return;
        tab = nt; setRoot(rootScreen());
      });
    });
    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(
          panel.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
          function (el) { return el.offsetParent !== null && !el.disabled; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', syncHeadHeight);
    // Re-render live when the site language changes
    new MutationObserver(function () {
      refreshChrome();
      if (panel.classList.contains('open') && stack.length) renderScreen(stack[stack.length - 1], 'none');
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    refreshChrome();
  }

  function refreshChrome() {
    fab.querySelector('.lbl').textContent = t('brand');
    fab.setAttribute('aria-label', t('brand'));
    if (tabBtns) tabBtns.forEach(function (b) { b.textContent = b.getAttribute('data-tab') === 'shop' ? t('shopTab') : t('helpTab'); });
  }

  function open() { refreshChrome(); setRoot(rootScreen()); panel.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); syncHeadHeight();
    var f = panel.querySelector('.cc-tab') || panel.querySelector('.cc-close') || panel; try { f.focus(); } catch (e) {} }
  function close() { panel.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

  // ---- Navigation ----
  function setRoot(screen) { stack = [screen]; renderScreen(screen, 'fade'); }
  function navTo(screen) { stack.push(screen); renderScreen(screen, 'push'); }
  function back() { if (stack.length <= 1) return; stack.pop(); renderScreen(stack[stack.length - 1], 'pop'); }

  function renderScreen(screen, dir) {
    var v = document.createElement('div'); v.className = 'cc-view';
    screen.build(v);
    var rm = document.documentElement.classList.contains('rm');
    var old = currentView;
    if (rm || dir === 'none') {
      if (old && old.parentNode) old.parentNode.removeChild(old);
      stage.appendChild(v);
    } else if (dir === 'push') {
      v.style.transform = 'translateX(100%)'; stage.appendChild(v); void v.offsetWidth;
      v.style.transform = 'translateX(0)'; fadeOut(old, 'left');
    } else if (dir === 'pop') {
      v.style.transform = 'translateX(-26%)'; v.style.opacity = '0.5'; stage.insertBefore(v, stage.firstChild); void v.offsetWidth;
      v.style.transform = 'translateX(0)'; v.style.opacity = '1'; fadeOut(old, 'right');
    } else { // fade
      v.style.opacity = '0'; stage.appendChild(v); void v.offsetWidth; v.style.opacity = '1'; fadeOut(old, 'fade');
    }
    currentView = v; v.scrollTop = 0;
    updateHeader(screen);
  }
  function fadeOut(old, way) {
    if (!old) return;
    if (way === 'left') { old.style.transform = 'translateX(-26%)'; old.style.opacity = '0.5'; }
    else if (way === 'right') { old.style.transform = 'translateX(100%)'; }
    else { old.style.opacity = '0'; }
    setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 440);
  }
  function updateHeader(screen) {
    titleEl.textContent = screen.title || t('brand');
    subEl.textContent = screen.sub || '';
    var root = stack.length === 1;
    head.classList.toggle('at-root', root);
    backBtn.style.display = root ? 'none' : '';
    tabsEl.style.display = root ? '' : 'none';
    subEl.style.display = root ? '' : 'none';
    tabBtns.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === tab ? 'true' : 'false'); });
    if (screen.progress) { progEl.style.opacity = '1'; progBar.style.width = (screen.progress.i / screen.progress.n * 100) + '%'; }
    else { progEl.style.opacity = '0'; }
    syncHeadHeight();
  }
  function syncHeadHeight() {
    requestAnimationFrame(function () { if (head) panel.style.setProperty('--cc-head-h', (head.offsetHeight + 10) + 'px'); });
  }

  // ---- Screens ----
  function rootScreen() { return tab === 'shop' ? shopRoot() : helpRoot(); }

  function shopRoot() {
    return { title: t('brand'), sub: t('shopSub'), build: function (v) {
      v.innerHTML = '<p class="cc-msg">' + esc(t('shopIntro')) + '</p>';
      var menu = document.createElement('div'); menu.className = 'cc-menu';
      [['quiz', '✨', t('quiz')], ['browse', '👜', t('browse')], ['terms', '📖', t('terms')]].forEach(function (o) {
        var b = document.createElement('button'); b.className = 'cc-opt'; b.type = 'button';
        b.innerHTML = '<span aria-hidden="true">' + o[1] + '</span><span>' + esc(o[2]) + '</span>';
        b.addEventListener('click', function () {
          if (o[0] === 'quiz') { answers = {}; navTo(quizScreen(0)); }
          else if (o[0] === 'browse') navTo(browseScreen());
          else navTo(dictScreen());
        });
        menu.appendChild(b);
      });
      v.appendChild(menu);
    } };
  }

  function helpRoot() {
    return { title: t('brand'), sub: t('helpSub'), build: function (v) {
      var arts = articles();
      v.innerHTML =
        '<input class="cc-search" type="search" placeholder="' + esc(t('search')) + '" aria-label="' + esc(t('search')) + '">' +
        '<span class="cc-lbl">' + esc(t('suggested')) + '</span><div class="cc-list cc-menu"></div>' +
        '<button class="btn btn-primary cc-cta" type="button">' + esc(t('contact')) + '</button>';
      var list = v.querySelector('.cc-list');
      function render(f) {
        list.innerHTML = ''; f = (f || '').toLowerCase();
        var shown = arts.filter(function (a) { return !f || a.q.toLowerCase().indexOf(f) > -1 || a.a.toLowerCase().indexOf(f) > -1; });
        if (!shown.length) { list.innerHTML = '<p class="cc-art-a">' + esc(t('none')) + '</p>'; return; }
        shown.forEach(function (a) {
          var b = document.createElement('button'); b.className = 'cc-opt'; b.type = 'button';
          b.innerHTML = '<span aria-hidden="true">📖</span><span>' + esc(a.q) + '</span>';
          b.addEventListener('click', function () { navTo(articleScreen(a)); });
          list.appendChild(b);
        });
      }
      render('');
      v.querySelector('.cc-search').addEventListener('input', function (e) { render(e.target.value); });
      v.querySelector('.cc-cta').addEventListener('click', function () { navTo(contactScreen()); });
    } };
  }

  function quizScreen(i) {
    if (i >= QUIZ.length) return quizResults();
    var step = QUIZ[i];
    return { title: t('quiz'), progress: { i: i + 1, n: QUIZ.length }, build: function (v) {
      var html = '';
      if (i === 0) html += '<p class="cc-msg">' + esc(t('quizIntro')) + '</p>';
      html += '<p class="cc-lbl">' + esc(t('step')) + ' ' + (i + 1) + ' / ' + QUIZ.length + '</p>';
      html += '<p class="cc-q">' + esc(step.q[lang()] || step.q.en) + '</p><div class="cc-menu">';
      step.answers.forEach(function (a, idx) { html += '<button class="cc-opt" data-i="' + idx + '"><span>' + esc(a.label[lang()] || a.label.en) + '</span></button>'; });
      html += '</div>';
      v.innerHTML = html;
      v.querySelectorAll('.cc-opt').forEach(function (b) {
        b.addEventListener('click', function () { answers[step.key] = step.answers[+b.getAttribute('data-i')]; navTo(quizScreen(i + 1)); });
      });
    } };
  }

  function quizResults() {
    return { title: t('results'), progress: { i: QUIZ.length, n: QUIZ.length }, build: function (v) {
      var cat = answers.category && answers.category.category;
      var style = answers.style && answers.style.tag;
      var budget = answers.budget && answers.budget.tag;
      var preloved = answers.preloved ? answers.preloved.preloved : undefined;
      var scored = BRANDS.filter(quizEligible).map(function (b) {
        var s = 0;
        if (cat && b.category === cat) s += 3;
        if (style && b.tags.indexOf(style) > -1) s += 2;
        if (budget && b.tags.indexOf(budget) > -1) s += 1;
        return { b: b, s: s };
      }).filter(function (x) {
        if (preloved === true) return x.b.category === 'vintage';
        if (preloved === false) return x.b.category !== 'vintage';
        return true;
      });
      scored.sort(function (a, b) { return b.s - a.s; });
      var top = scored.filter(function (x) { return x.s > 0; }).slice(0, 5);
      var exact = top.length > 0;
      if (!exact) top = scored.slice(0, 3);
      var html = '<p class="cc-msg">' + esc(exact ? t('resultsMsg') : t('noResults')) + '</p>';
      html += top.map(function (x) { return brandCard(x.b); }).join('');
      html += '<div class="cc-menu" style="margin-top:.6rem">' +
        '<a class="btn btn-primary cc-cta" href="#contact">' + esc(t('enquire')) + '</a>' +
        '<button class="cc-opt cc-restart" type="button"><span>' + esc(t('restart')) + '</span></button></div>';
      v.innerHTML = html;
      v.querySelector('.cc-cta').addEventListener('click', close);
      v.querySelector('.cc-restart').addEventListener('click', function () { stack = [shopRoot()]; answers = {}; navTo(quizScreen(0)); });
    } };
  }

  function brandCard(b) {
    var link = b.url ? '<a class="cc-card-link" href="' + esc(b.url) + '" target="_blank" rel="noopener">↗</a>' : '';
    var n = note(b), noteHtml = n ? '<p class="cc-card-note">' + esc(n) + '</p>' : '';
    return '<div class="cc-card"><div class="cc-card-top"><span class="cc-card-name">' + esc(b.name) + '</span>' +
      '<span class="cc-card-cat">' + esc(t('cat')[b.category] || b.category) + '</span>' + link + '</div>' + noteHtml + '</div>';
  }

  function browseScreen() {
    return { title: t('browse'), build: function (v) {
      var html = '<p class="cc-msg">' + esc(t('browseIntro')) + '</p>';
      STATUS_ORDER.forEach(function (st) {
        var group = BRANDS.filter(function (b) { return statusOf(b) === st; });
        if (!group.length) return;
        html += '<p class="cc-lbl">' + esc(t('stat')[st]) + ' · ' + group.length + '</p>';
        html += group.map(brandCard).join('');
      });
      v.innerHTML = html;
    } };
  }

  function dictScreen() {
    return { title: t('terms'), build: function (v) {
      var html = '<p class="cc-msg">' + esc(t('termsIntro')) + '</p><div class="cc-menu">';
      TERMS.forEach(function (term, i) { html += '<button class="cc-opt" data-i="' + i + '"><span>' + esc(term.term) + '</span></button>'; });
      html += '</div>';
      v.innerHTML = html;
      v.querySelectorAll('.cc-opt').forEach(function (b) { b.addEventListener('click', function () { navTo(termScreen(TERMS[+b.getAttribute('data-i')])); }); });
    } };
  }

  function termScreen(term) {
    return { title: term.term, build: function (v) {
      var def = (lang() === 'vi' && term.def_vi) ? term.def_vi : term.def;
      var html = '<p class="cc-card-note" style="font-size:.92rem;line-height:1.7">' + esc(def) + '</p>';
      var rel = term.relatedTags || [];
      var matches = BRANDS.filter(function (b) { return rel.some(function (tag) { return b.tags.indexOf(tag) > -1; }); }).slice(0, 4);
      if (matches.length) { html += '<p class="cc-lbl">' + esc(t('related')) + '</p>' + matches.map(brandCard).join(''); }
      v.innerHTML = html;
    } };
  }

  function articleScreen(a) {
    return { title: a.q, build: function (v) {
      v.innerHTML = '<div class="cc-art-a">' + a.a + '</div><button class="btn btn-primary cc-cta" type="button">' + esc(t('contact')) + '</button>';
      v.querySelector('.cc-cta').addEventListener('click', function () { navTo(contactScreen()); });
    } };
  }

  function contactScreen() {
    return { title: t('contact'), build: function (v) {
      var opts = t('topics').map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('');
      v.innerHTML =
        '<form class="cc-form">' +
          '<div class="cc-field"><label>' + esc(t('topic')) + '</label><select id="ccTopic">' + opts + '</select></div>' +
          '<div class="cc-field"><label>' + esc(t('name')) + '</label><input id="ccName" type="text"></div>' +
          '<div class="cc-field"><label>' + esc(t('email')) + '</label><input id="ccEmail" type="email"></div>' +
          '<div class="cc-field"><label>' + esc(t('subject')) + '</label><input id="ccSubject" type="text"></div>' +
          '<div class="cc-field"><label>' + esc(t('message')) + '</label><textarea id="ccMsg"></textarea></div>' +
          '<button class="btn btn-primary cc-cta" type="submit">' + esc(t('send')) + '</button>' +
          '<p class="cc-art-a" id="ccSent" style="display:none;color:var(--accent-deep);margin-top:0.6rem"></p>' +
        '</form>';
      v.querySelector('.cc-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        var subj = '[Seraphic Styler] ' + (val('ccTopic') || '') + (val('ccSubject') ? ' — ' + val('ccSubject') : '');
        var bodyTxt = ['Topic: ' + val('ccTopic'), 'Name: ' + val('ccName'), 'Email: ' + val('ccEmail'), '', val('ccMsg')].join('\n');
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(bodyTxt);
        var s = document.getElementById('ccSent'); if (s) { s.textContent = t('sent'); s.style.display = 'block'; }
      });
    } };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

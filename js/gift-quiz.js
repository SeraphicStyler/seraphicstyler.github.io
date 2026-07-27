/* Seraphic Styler — gift finder.
   Three little questions that route a gift-giver to the tier that actually
   fits, with the smaller option always in view. Self-contained (EN + VI
   chrome, same pattern as sizequiz.js); renders into #giftQuiz and reads the
   tier names, prices and Tally links straight from the gift cards in the DOM,
   so prices can never drift from the cards. Price source of record:
   CONFIG.styling in js/estimator.js + the card markup itself.
   Honesty guardrails: a small gesture is never upsold — see recommend(). */
(function () {
  'use strict';

  var L = {
    en: {
      eyebrow: 'Gift finder', title: '✨ Which gift fits them?',
      sub: 'Three little questions — and the smaller option always stays in view.',
      q1: 'What’s the moment?',
      q1o: ['A small thank-you, or just because', 'A birthday or anniversary', 'A milestone — a wedding, a graduation, a new chapter'],
      q2: 'How well do you know their taste?',
      q2o: ['Exactly — I could name the piece', 'Roughly — I know the feeling', 'Barely — which is rather the point of a stylist'],
      q3: 'What should arrive?',
      q3o: ['One lovely piece', 'A few pieces that work together', 'A wardrobe moment — the full experience'],
      q4: 'Will they be in Sài Gòn?',
      q4o: ['They live there, or will visit', 'No — styled remotely'],
      prompt: 'Answer the three questions above and the suggestion appears here.',
      suggest: 'For this, I’d suggest',
      gift: 'Gift this →', see: 'Read the tier ↑',
      runnerDown: 'If that feels large — {tier}, {price}.',
      runnerUp: 'And if you’d like to go further — {tier}, {price}.',
      why: [
        'For a small gesture, one perfect piece says more than a parcel of maybes.',
        'A few pieces, chosen around what you already know of them — generous without guessing too far.',
        'When the moment is bigger than one piece, a capsule dresses their everyday — and the style profile means nothing is guessed.',
        'For a true milestone — the full experience, shaped around them in person or live on video.'
      ],
      points: [
        ['One piece, verified in person and photographed for their approval', 'A small, quietly luxurious gesture — never an obligation'],
        ['Begins with a consultation, so the pieces are theirs, not a guess', 'Three to five pieces from Saigon’s local designers'],
        ['A full style profile first — their days, their taste, their fit', 'Eight to twelve coordinated pieces, with a lookbook to wear them together'],
        ['In Saigon: a two-hour in-shop try-on — often no shipping at all', 'From abroad: I shop live on video, and nothing ships without their yes']
      ]
    },
    vi: {
      eyebrow: 'Chọn quà nhanh', title: '✨ Gói quà nào hợp với người ấy?',
      sub: 'Ba câu hỏi nhỏ — và lựa chọn nhẹ nhàng hơn luôn được giữ trong tầm mắt.',
      q1: 'Dịp gì vậy?',
      q1o: ['Một lời cảm ơn nhỏ, hoặc chẳng cần dịp gì', 'Sinh nhật hay kỷ niệm', 'Một cột mốc — đám cưới, tốt nghiệp, một chương mới'],
      q2: 'Bạn hiểu gu của người ấy đến đâu?',
      q2o: ['Rất rõ — mình có thể gọi tên món đồ', 'Đại khái — mình biết cảm giác họ thích', 'Gần như không — nên mới cần stylist'],
      q3: 'Món quà nên là gì?',
      q3o: ['Một món thật ưng', 'Vài món phối được với nhau', 'Cả một tủ đồ — trải nghiệm trọn vẹn'],
      q4: 'Người ấy có ở Sài Gòn không?',
      q4o: ['Ở đó, hoặc sắp ghé', 'Không — styling từ xa'],
      prompt: 'Trả lời ba câu trên, gợi ý sẽ hiện ở đây.',
      suggest: 'Với dịp này, mình gợi ý',
      gift: 'Tặng gói này →', see: 'Xem chi tiết gói ↑',
      runnerDown: 'Nếu thấy hơi nhiều — {tier}, {price}.',
      runnerUp: 'Còn nếu muốn trọn vẹn hơn — {tier}, {price}.',
      why: [
        'Với một cử chỉ nhỏ, một món thật ưng nói được nhiều hơn cả một kiện đồ “có lẽ”.',
        'Vài món, chọn quanh những gì bạn đã biết về người ấy — hào phóng mà không đoán quá xa.',
        'Khi dịp lớn hơn một món đồ, capsule lo trọn trang phục thường ngày — và hồ sơ phong cách nghĩa là không gì phải đoán.',
        'Cho một cột mốc thực sự — trải nghiệm trọn vẹn, theo đúng người ấy, tận nơi hoặc qua video trực tiếp.'
      ],
      points: [
        ['Một món duy nhất, kiểm tra tận nơi và chụp ảnh để người ấy duyệt', 'Một cử chỉ nhỏ mà sang — không bao giờ là gánh nặng'],
        ['Bắt đầu bằng một buổi tư vấn, để món đồ là của người ấy, không phải phỏng đoán', 'Ba đến năm món từ các nhà thiết kế Sài Gòn'],
        ['Hồ sơ phong cách trước tiên — nhịp sống, gu và dáng của người ấy', 'Tám đến mười hai món phối được với nhau, kèm lookbook hướng dẫn mặc'],
        ['Ở Sài Gòn: hai giờ thử đồ tại cửa hàng — thường chẳng cần gửi hàng', 'Từ xa: mình đi mua qua video trực tiếp, chưa có cái gật đầu thì chưa gửi gì']
      ]
    }
  };
  function lang() { var l = document.documentElement.getAttribute('lang') || 'en'; return L[l] ? l : 'en'; }
  function t(k) { return L[lang()][k]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var mount = document.getElementById('giftQuiz');
  if (!mount) return;

  /* Tiers from the DOM, ordered by price — matched by data-usd, never by
     i18n key or card position (the gift.* keys are historically shuffled). */
  var tiers = [];
  document.querySelectorAll('.gift-grid-4 .gift-card').forEach(function (card) {
    var price = card.querySelector('.gift-price');
    var cta = card.querySelector('a.btn');
    var h = card.querySelector('h3');
    if (!price || !cta || !h) return;
    tiers.push({ usd: parseFloat(price.getAttribute('data-usd')) || 0, card: card, href: cta.href, nameEl: h });
  });
  tiers.sort(function (a, b) { return a.usd - b.usd; });
  if (tiers.length !== 4) return; // leave the static fallback in place

  function tierName(i) { return tiers[i].nameEl.textContent.trim(); }
  function tierPrice(i) { return '$' + Math.round(tiers[i].usd); }
  function quizHref(i) { return tiers[i].href.replace('source=home-gift', 'source=home-gift-quiz'); }

  /* Scores per option (tier scale 1 = Discovery … 4 = Atelier). The Capsule
     band is deliberately the widest — ambiguous, mixed answers land there —
     but the guardrails below mean a small gesture is NEVER upsold. */
  var W1 = [1, 2.5, 3.5], W2 = [1.5, 2.5, 3], W3 = [1, 2, 3.75], W4 = [0.75, 0];
  var ans = [null, null, null, null];

  function recommend() {
    var score = (W1[ans[0]] + W2[ans[1]] + W3[ans[2]]) / 3 + (ans[3] === 0 ? W4[0] : 0);
    var rec;
    if (ans[0] === 0 && ans[2] === 0) rec = 0;                       // small thank-you + one piece → always Discovery
    else {
      rec = score < 1.5 ? 0 : score < 2.3 ? 1 : score <= 3.4 ? 2 : 3;
      if (ans[2] === 0) rec = Math.min(rec, 1);                      // "one lovely piece" caps at The Edit
      if (rec === 3 && !(ans[2] === 2 || ans[3] === 0)) rec = 2;     // Atelier needs the full-experience answer or Saigon
    }
    // Runner-up: the adjacent tier nearer the raw score — smaller stays visible.
    var mids = [1.0, 1.9, 2.85, 3.7];
    var runner = rec + (score > mids[rec] ? 1 : -1);
    if (runner < 0) runner = 1;
    if (runner > 3) runner = 2;
    if (ans[0] === 0 && ans[2] === 0) runner = 1;
    return { rec: rec, runner: runner };
  }

  function segRow(qi, label, opts) {
    return '<div class="gq-row" data-q="' + qi + '">' +
      '<p class="gq-label" id="gqL' + qi + '">' + esc(label) + '</p>' +
      '<div class="vn-seg gq-seg" role="group" aria-labelledby="gqL' + qi + '">' +
      opts.map(function (o, i) {
        var on = ans[qi] === i;
        return '<button type="button" data-q="' + qi + '" data-i="' + i + '" aria-pressed="' + on + '">' + esc(o) + '</button>';
      }).join('') +
      '</div></div>';
  }

  function renderResult() {
    var box = mount.querySelector('.gq-result');
    if (!box) return;
    if (ans[0] === null || ans[1] === null || ans[2] === null) {
      box.innerHTML = '<p class="vq-bucket">' + esc(t('prompt')) + '</p>';
      return;
    }
    var r = recommend();
    var runnerKey = r.runner < r.rec ? 'runnerDown' : 'runnerUp';
    var runnerLine = t(runnerKey).replace('{tier}', tierName(r.runner)).replace('{price}', tierPrice(r.runner));
    box.innerHTML =
      '<div class="vq-line">' + esc(t('suggest')) + ' — <strong>' + esc(tierName(r.rec)) + '</strong> · ' + esc(tierPrice(r.rec)) + '</div>' +
      '<p class="vq-bucket">' + esc(t('why')[r.rec]) + '</p>' +
      '<ul class="gq-points">' + t('points')[r.rec].map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      '<div class="gq-ctas">' +
        '<a class="btn btn-primary" href="' + quizHref(r.rec) + '" target="_blank" rel="noopener">' + esc(t('gift')) + '</a>' +
        '<button type="button" class="gq-see">' + esc(t('see')) + '</button>' +
      '</div>' +
      '<p class="gq-runner">' + esc(runnerLine) + '</p>';
    box.classList.remove('vq-pop'); void box.offsetWidth; box.classList.add('vq-pop');
    var see = box.querySelector('.gq-see');
    if (see) see.addEventListener('click', function () {
      var card = tiers[r.rec].card;
      card.scrollIntoView({ behavior: document.documentElement.classList.contains('rm') ? 'auto' : 'smooth', block: 'center' });
      card.classList.add('is-suggested');
      setTimeout(function () { card.classList.remove('is-suggested'); }, 2200);
    });
  }

  function render() {
    mount.innerHTML =
      '<span class="eyebrow">' + esc(t('eyebrow')) + '</span>' +
      '<h3>' + esc(t('title')) + '</h3>' +
      '<p class="vn-quiz-sub">' + esc(t('sub')) + '</p>' +
      segRow(0, t('q1'), t('q1o')) +
      segRow(1, t('q2'), t('q2o')) +
      segRow(2, t('q3'), t('q3o')) +
      segRow(3, t('q4'), t('q4o')) +
      '<div class="gq-result" aria-live="polite"></div>';
    renderResult();
  }

  mount.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-q]');
    if (!b || !mount.contains(b)) return;
    var qi = parseInt(b.getAttribute('data-q'), 10), i = parseInt(b.getAttribute('data-i'), 10);
    ans[qi] = (ans[qi] === i && qi === 3) ? null : i; // Q4 can be un-picked; Q1–3 just switch
    var seg = b.parentElement;
    seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b && ans[qi] !== null ? 'true' : 'false'); });
    renderResult();
  });

  new MutationObserver(function () { render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();

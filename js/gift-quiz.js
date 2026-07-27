/* Seraphic Styler — gift finder v2.
   A premium decision tool, not a prose quiz: four semantic radio-card
   questions (fieldset/legend/real radios), a recommendation panel that stays
   in view (sticky rail on desktop), visible logic ("Because you said …"),
   and the smaller option always shown. Self-contained EN + VI chrome, same
   pattern as sizequiz.js; renders into #giftQuiz and reads tier names,
   prices and Tally links straight from the gift cards in the DOM so prices
   can never drift. Price source of record: CONFIG.styling in js/estimator.js
   + the card markup itself.
   Honesty guardrails: a small gesture is never upsold — see recommend(). */
(function () {
  'use strict';

  var L = {
    en: {
      eyebrow: 'Gift finder', title: '✨ Which gift fits them?',
      sub: 'Four quick questions — the last one is optional — and the smaller option always stays in view.',
      optional: 'optional',
      q1: 'What’s the moment?',
      q1o: ['A small thank-you, or just because', 'A birthday or anniversary', 'A milestone — a wedding, a graduation, a new chapter'],
      q1s: ['a small gesture', 'a birthday', 'a milestone'],
      q2: 'How well do you know their taste?',
      q2o: ['Exactly — I could name the piece', 'Roughly — I know the feeling', 'Barely — which is rather the point of a stylist'],
      q2s: ['taste known exactly', 'taste roughly known', 'taste unknown'],
      q3: 'What should arrive?',
      q3o: ['One lovely piece', 'A few pieces that work together', 'A wardrobe moment — the full experience'],
      q3s: ['one piece', 'a few pieces', 'a wardrobe moment'],
      q4: 'Will they be in Sài Gòn?',
      q4o: ['They live there, or will visit', 'No — styled remotely'],
      q4s: ['in Sài Gòn', 'styled remotely'],
      waiting: 'Answer the first three questions — my suggestion appears here.',
      suggest: 'My suggestion',
      said: 'Because you said',
      gift: 'Gift this →', see: 'Read the tier ↑',
      runnerDown: 'If that feels large — {tier}, {price}.',
      runnerUp: 'And if you’d like to go further — {tier}, {price}.',
      profile: 'Preview the style profile they’ll receive →',
      assure: 'Their code arrives within 24 hours — and nothing is bought without their yes.',
      why: [
        'For a small gesture, one perfect piece says more than a parcel of maybes.',
        'A few pieces, chosen around what you already know of them — generous without guessing too far.',
        'When the moment is bigger than one piece, a capsule dresses their everyday.',
        'For a true milestone — the full experience, shaped around them.'
      ],
      whyTaste: 'The full style profile does the knowing for you.',
      whySaigon: 'And since they’ll be in Sài Gòn, the two-hour in-shop try-on is theirs.',
      whyRemote: 'Styled remotely and sent worldwide — distance changes nothing.',
      points: [
        ['One piece, verified in person and photographed for their approval', 'A small, quietly luxurious gesture — never an obligation'],
        ['Begins with a consultation, so the pieces are theirs, not a guess', 'Three to five pieces from Saigon’s local designers'],
        ['A full style profile first — their days, their taste, their fit', 'Eight to twelve coordinated pieces, with a lookbook to wear them together'],
        ['In Saigon: a two-hour in-shop try-on — often no shipping at all', 'From abroad: I shop live on video, and nothing ships without their yes']
      ]
    },
    vi: {
      eyebrow: 'Chọn quà nhanh', title: '✨ Gói quà nào hợp với người ấy?',
      sub: 'Bốn câu hỏi nhanh — câu cuối không bắt buộc — và lựa chọn nhẹ nhàng hơn luôn được giữ trong tầm mắt.',
      optional: 'không bắt buộc',
      q1: 'Dịp gì vậy?',
      q1o: ['Một lời cảm ơn nhỏ, hoặc chẳng cần dịp gì', 'Sinh nhật hay kỷ niệm', 'Một cột mốc — đám cưới, tốt nghiệp, một chương mới'],
      q1s: ['một cử chỉ nhỏ', 'sinh nhật', 'một cột mốc'],
      q2: 'Bạn hiểu gu của người ấy đến đâu?',
      q2o: ['Rất rõ — mình có thể gọi tên món đồ', 'Đại khái — mình biết cảm giác họ thích', 'Gần như không — nên mới cần stylist'],
      q2s: ['rất hiểu gu', 'hiểu đại khái', 'chưa rõ gu'],
      q3: 'Món quà nên là gì?',
      q3o: ['Một món thật ưng', 'Vài món phối được với nhau', 'Cả một tủ đồ — trải nghiệm trọn vẹn'],
      q3s: ['một món', 'vài món', 'cả tủ đồ'],
      q4: 'Người ấy có ở Sài Gòn không?',
      q4o: ['Ở đó, hoặc sắp ghé', 'Không — styling từ xa'],
      q4s: ['ở Sài Gòn', 'styling từ xa'],
      waiting: 'Trả lời ba câu đầu — gợi ý của mình sẽ hiện ở đây.',
      suggest: 'Gợi ý của mình',
      said: 'Vì bạn chọn',
      gift: 'Tặng gói này →', see: 'Xem chi tiết gói ↑',
      runnerDown: 'Nếu thấy hơi nhiều — {tier}, {price}.',
      runnerUp: 'Còn nếu muốn trọn vẹn hơn — {tier}, {price}.',
      profile: 'Xem trước hồ sơ phong cách người ấy sẽ nhận →',
      assure: 'Mã quà đến trong vòng 24 giờ — và chưa có cái gật đầu của người ấy thì chưa mua gì.',
      why: [
        'Với một cử chỉ nhỏ, một món thật ưng nói được nhiều hơn cả một kiện đồ “có lẽ”.',
        'Vài món, chọn quanh những gì bạn đã biết về người ấy — hào phóng mà không đoán quá xa.',
        'Khi dịp lớn hơn một món đồ, capsule lo trọn trang phục thường ngày.',
        'Cho một cột mốc thực sự — trải nghiệm trọn vẹn, theo đúng người ấy.'
      ],
      whyTaste: 'Hồ sơ phong cách đầy đủ sẽ thay bạn hiểu gu người ấy.',
      whySaigon: 'Và vì người ấy ở Sài Gòn, hai giờ thử đồ tại cửa hàng là của họ.',
      whyRemote: 'Styling từ xa, gửi đi khắp thế giới — khoảng cách không thay đổi gì.',
      points: [
        ['Một món duy nhất, kiểm tra tận nơi và chụp ảnh để người ấy duyệt', 'Một cử chỉ nhỏ mà sang — không bao giờ là gánh nặng'],
        ['Bắt đầu bằng một buổi tư vấn, để món đồ là của người ấy, không phải phỏng đoán', 'Ba đến năm món từ các nhà thiết kế Sài Gòn'],
        ['Hồ sơ phong cách trước tiên — nhịp sống, gu và dáng của người ấy', 'Tám đến mười hai món phối được với nhau, kèm lookbook hướng dẫn mặc'],
        ['Ở Sài Gòn: hai giờ thử đồ tại cửa hàng — thường chẳng cần gửi hàng', 'Từ xa: mình đi mua qua video trực tiếp, chưa gật đầu thì chưa gửi gì']
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

  var PROFILE_TIER = { 49: 'discovery', 149: 'edit', 249: 'capsule', 349: 'atelier' };
  function tierName(i) { return tiers[i].nameEl.textContent.trim(); }
  function tierPrice(i) { return '$' + Math.round(tiers[i].usd); }
  function quizHref(i) { return tiers[i].href.replace('source=home-gift', 'source=home-gift-quiz'); }
  function profileHref(i) { return 'style-profile.html?tier=' + (PROFILE_TIER[Math.round(tiers[i].usd)] || 'edit') + '&from=gift-finder'; }

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

  function whyLine(rec) {
    var s = t('why')[rec];
    if (rec >= 2 && ans[1] === 2) s += ' ' + t('whyTaste');
    if (rec === 3) s += ' ' + (ans[3] === 0 ? t('whySaigon') : t('whyRemote'));
    return s;
  }

  function fieldset(qi, legendKey, optsKey, isOptional) {
    var name = 'gq' + qi;
    return '<fieldset class="gq-q">' +
      '<legend>' + esc(t(legendKey)) + (isOptional ? ' <em class="gq-optional">' + esc(t('optional')) + '</em>' : '') + '</legend>' +
      '<div class="gq-opts gq-opts-' + t(optsKey).length + '">' +
      t(optsKey).map(function (o, i) {
        var checked = ans[qi] === i ? ' checked' : '';
        return '<label class="gq-opt"><input type="radio" name="' + name + '" value="' + i + '"' + checked + '>' +
          '<span class="gq-card"><span class="gq-mark" aria-hidden="true"></span><span class="gq-txt">' + esc(o) + '</span></span></label>';
      }).join('') +
      '</div></fieldset>';
  }

  function renderResult() {
    var box = mount.querySelector('.gq-result');
    if (!box) return;
    if (ans[0] === null || ans[1] === null || ans[2] === null) {
      var n = [ans[0], ans[1], ans[2]].filter(function (a) { return a !== null; }).length;
      box.innerHTML = '<p class="gq-waiting">' + esc(t('waiting')) + '</p>' +
        '<div class="gq-dots" aria-hidden="true">' + [0, 1, 2].map(function (i) { return '<span class="' + (i < n ? 'on' : '') + '"></span>'; }).join('') + '</div>';
      box.classList.remove('gq-live');
      return;
    }
    var r = recommend();
    var saidBits = [t('q1s')[ans[0]], t('q2s')[ans[1]], t('q3s')[ans[2]]];
    if (ans[3] !== null) saidBits.push(t('q4s')[ans[3]]);
    var runnerKey = r.runner < r.rec ? 'runnerDown' : 'runnerUp';
    var runnerLine = t(runnerKey).replace('{tier}', tierName(r.runner)).replace('{price}', tierPrice(r.runner));
    box.innerHTML =
      '<span class="gq-r-eyebrow">' + esc(t('suggest')) + '</span>' +
      '<div class="gq-r-tier">' + esc(tierName(r.rec)) + ' <span class="gq-r-price">' + esc(tierPrice(r.rec)) + '</span></div>' +
      '<p class="gq-r-said">' + esc(t('said')) + ': <em>' + esc(saidBits.join(' · ')) + '</em></p>' +
      '<p class="gq-r-why">' + esc(whyLine(r.rec)) + '</p>' +
      '<ul class="gq-points">' + t('points')[r.rec].map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      '<div class="gq-ctas">' +
        '<a class="btn btn-primary" href="' + quizHref(r.rec) + '" target="_blank" rel="noopener">' + esc(t('gift')) + '</a>' +
        '<button type="button" class="gq-see">' + esc(t('see')) + '</button>' +
      '</div>' +
      '<p class="gq-runner">' + esc(runnerLine) + '</p>' +
      '<a class="gq-profile" href="' + profileHref(r.rec) + '">' + esc(t('profile')) + '</a>' +
      '<p class="gq-assure">' + esc(t('assure')) + '</p>';
    box.classList.add('gq-live');
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
      '<div class="gq-layout">' +
        '<form class="gq-form" novalidate>' +
          fieldset(0, 'q1', 'q1o', false) +
          fieldset(1, 'q2', 'q2o', false) +
          fieldset(2, 'q3', 'q3o', false) +
          fieldset(3, 'q4', 'q4o', true) +
        '</form>' +
        '<aside class="gq-rail"><div class="gq-result" role="status" aria-live="polite"></div></aside>' +
      '</div>';
    renderResult();
  }

  mount.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'radio' || !/^gq\d$/.test(input.name)) return;
    ans[parseInt(input.name.slice(2), 10)] = parseInt(input.value, 10);
    renderResult();
  });
  mount.addEventListener('submit', function (e) { e.preventDefault(); });

  new MutationObserver(function () { render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
})();

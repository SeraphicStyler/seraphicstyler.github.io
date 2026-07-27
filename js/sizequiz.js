/* Seraphic Styler — "What size am I likely to be in Vietnam?" mini estimator.
   Self-contained, no backend, and deliberately storage-free: nothing typed
   here is saved, stored, or sent anywhere — it lives in the page and is gone
   on reload. Two modes:
     · "I know my size" — pick a home system + usual size (original behaviour)
     · "Start from measurements" — bust / waist / hips (+ optional height)
   The size map is anchored to the Sizing & fit table (US runs ~2 sizes smaller
   than the VN label), so the widget and the table never disagree.
   Conversions: UK = US+4 · EU = US+32 · AU/NZ = US+4. EN + VI chrome. */
(function () {
  'use strict';

  // One row per size step. Anchored to the table + the VN XS/S note.
  var ROWS = [
    { us: '00', uk: '2',  eu: '30', au: '2',  vn: 'XS',       b: 'petite' },
    { us: '0',  uk: '4',  eu: '32', au: '4',  vn: 'XS–S',     b: 'petite' },
    { us: '2',  uk: '6',  eu: '34', au: '6',  vn: 'M',        b: 'standard' },
    { us: '4',  uk: '8',  eu: '36', au: '8',  vn: 'M–L',      b: 'standard' },
    { us: '6',  uk: '10', eu: '38', au: '10', vn: 'L',        b: 'standard' },
    { us: '8',  uk: '12', eu: '40', au: '12', vn: 'XL',       b: 'upper' },
    { us: '10', uk: '14', eu: '42', au: '14', vn: 'XL–2XL',   b: 'upper' },
    { us: '12', uk: '16', eu: '44', au: '16', vn: '2XL',      b: 'large' },
    { us: '14', uk: '18', eu: '46', au: '18', vn: '2XL–3XL',  b: 'large' },
    { us: '16', uk: '20', eu: '48', au: '20', vn: '3XL',      b: 'inclusive' },
    { us: '18', uk: '22', eu: '50', au: '22', vn: '3XL–4XL',  b: 'inclusive' },
    { us: '20', uk: '24', eu: '52', au: '24', vn: '4XL',      b: 'inclusive' },
    { us: '22', uk: '26', eu: '54', au: '26', vn: '4XL–5XL+', b: 'inclusive' }
  ];

  /* Reference body measurements per row, in cm — simplified from the ASTM
     D5585 (Misses, straight-size) body-measurement tables, smoothed to a
     monotonic ladder. Bands, not verdicts: the mapper rounds toward comfort
     and the result always carries the "cuts vary, I confirm in person" caveat. */
  var MEAS = [
    { bust: 78,  waist: 60,  hip: 85 },   // US 00
    { bust: 80,  waist: 62,  hip: 87 },   // US 0
    { bust: 83,  waist: 65,  hip: 90 },   // US 2
    { bust: 86,  waist: 68,  hip: 93 },   // US 4
    { bust: 89,  waist: 71,  hip: 96 },   // US 6
    { bust: 92,  waist: 74,  hip: 99 },   // US 8
    { bust: 95,  waist: 77,  hip: 103 },  // US 10
    { bust: 99,  waist: 81,  hip: 107 },  // US 12
    { bust: 103, waist: 85,  hip: 111 },  // US 14
    { bust: 108, waist: 90,  hip: 116 },  // US 16
    { bust: 114, waist: 96,  hip: 122 },  // US 18
    { bust: 120, waist: 102, hip: 128 },  // US 20
    { bust: 126, waist: 108, hip: 134 }   // US 22
  ];
  // Sanity ranges in cm — outside these, ask for a re-measure rather than guess.
  var RANGE = { bust: [60, 170], waist: [45, 160], hip: [65, 180], height: [130, 210] };

  var L = {
    en: {
      eyebrow: 'Quick check', title: '✨ What size am I likely to be in Vietnam?',
      sub: 'A playful estimate — I always confirm real garment measurements before we buy.',
      sysLabel: 'Your home sizing system', usually: 'I usually wear a…',
      result: 'In Vietnam, you’re most likely a', approx: 'That’s roughly',
      reassure: 'The tag will read a larger size than you’re used to — that’s the local cut, not a verdict on your body.',
      cta: 'Not sure? Send me your measurements →',
      modeSize: 'I know my size', modeMeas: 'Start from measurements',
      modeLabel: 'How would you like to check?', unitLabel: 'Units',
      bust: 'Bust', waist: 'Waist', hip: 'Hips', height: 'Height (optional)',
      privacy: 'Nothing you type here is saved or sent automatically — it stays on your device and disappears when you leave, unless you choose to send me the result. Education only, never a verdict.',
      howSum: 'How to measure at home',
      how: [
        'A soft tape measure, over light clothing or none — a mirror or a friend helps.',
        'Bust — around the fullest point, keeping the tape level from front to back.',
        'Waist — the natural waist, the narrowest point where you bend sideways, without pulling in.',
        'Hips — around the widest point of hips and seat, feet together.'
      ],
      howRule: 'The rule: snug, never tight — a flat tape with a fingertip of ease, measured twice.',
      measPrompt: 'Enter bust, waist and hips — I’ll read the size for you.',
      measCaveat: 'Mapped from standard US body tables and rounded toward comfort — Vietnamese cuts vary, so I confirm real garment measurements before we buy.',
      waistNote: 'Your waist suggests cuts with ease through the middle — I’ll flag those.',
      petiteNote: 'At your height, petite lengths will sit best — I check sleeve and hem lengths in person.',
      invalid: 'That looks outside the range I can read — double-check the number?',
      buckets: {
        petite: 'The smallest local sizes — petite & junior frames.',
        standard: 'The widest selection in Saigon boutiques sits here.',
        upper: 'Often the top of a standard shop’s range — I check shoulders, sleeves & rise in person.',
        large: 'Limited in general stores, so I source labels that truly pattern this size.',
        inclusive: 'Through size-inclusive labels like Himistore (to 6XL) & Cow’s House.'
      }
    },
    vi: {
      eyebrow: 'Thử nhanh', title: '✨ Ở Việt Nam mình mặc size nào?',
      sub: 'Chỉ là ước tính cho vui — mình luôn xác nhận số đo thực của trang phục trước khi mua.',
      sysLabel: 'Hệ size bạn quen dùng', usually: 'Mình thường mặc…',
      result: 'Ở Việt Nam, bạn nhiều khả năng mặc', approx: 'Tức là khoảng',
      reassure: 'Nhãn sẽ ghi size lớn hơn bạn quen — đó là cách cắt may địa phương, không phải lời phán xét về cơ thể bạn.',
      cta: 'Chưa chắc? Gửi mình số đo của bạn →',
      modeSize: 'Mình biết size', modeMeas: 'Bắt đầu từ số đo',
      modeLabel: 'Bạn muốn thử theo cách nào?', unitLabel: 'Đơn vị',
      bust: 'Vòng ngực', waist: 'Vòng eo', hip: 'Vòng mông', height: 'Chiều cao (không bắt buộc)',
      privacy: 'Số đo bạn nhập không được lưu hay tự gửi đi đâu — chỉ nằm trên thiết bị của bạn và biến mất khi rời trang, trừ khi bạn chủ động gửi kết quả cho mình. Chỉ để tham khảo, không bao giờ là lời phán xét.',
      howSum: 'Cách tự đo tại nhà',
      how: [
        'Dùng thước dây mềm, đo trên lớp áo mỏng hoặc sát da — có gương hoặc người giúp càng tốt.',
        'Vòng ngực — quanh chỗ đầy nhất, giữ thước song song mặt đất.',
        'Vòng eo — eo tự nhiên, chỗ nhỏ nhất khi bạn nghiêng người sang ngang, không hóp bụng.',
        'Vòng mông — quanh chỗ rộng nhất của hông và mông, hai chân khép lại.'
      ],
      howRule: 'Nguyên tắc: thước ôm vừa, không siết — chừa lọt một ngón tay, và đo hai lần.',
      measPrompt: 'Nhập vòng ngực, eo và mông — mình sẽ đọc size giúp bạn.',
      measCaveat: 'Quy đổi từ bảng số đo chuẩn của Mỹ và làm tròn theo hướng thoải mái — mỗi nhà may Việt cắt một kiểu, nên mình luôn xác nhận số đo thực của trang phục trước khi mua.',
      waistNote: 'Vòng eo của bạn hợp những dáng suông nhẹ ở giữa — mình sẽ ưu tiên các kiểu đó.',
      petiteNote: 'Với chiều cao của bạn, các dáng petite sẽ đẹp nhất — mình kiểm tra chiều dài tay áo và gấu tận nơi.',
      invalid: 'Con số này nằm ngoài khoảng mình đọc được — bạn kiểm tra lại giúp nhé?',
      buckets: {
        petite: 'Những size nội địa nhỏ nhất — dáng nhỏ nhắn & teen.',
        standard: 'Nơi có nhiều lựa chọn nhất ở các boutique Sài Gòn.',
        upper: 'Thường là mức cao nhất của cửa hàng thường — mình kiểm tra vai, tay áo & cạp tận nơi.',
        large: 'Hạn chế ở cửa hàng phổ thông, nên mình tìm các nhãn thực sự dựng rập cho size này.',
        inclusive: 'Qua các nhãn thân thiện mọi size như Himistore (đến 6XL) & Cow’s House.'
      }
    }
  };
  function lang() { var l = document.documentElement.getAttribute('lang') || 'en'; return L[l] ? l : 'en'; }
  function t(k) { return L[lang()][k]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var sysGroup = document.getElementById('vqSys');
  var sizeSel = document.getElementById('vqSize');
  var resultEl = document.getElementById('vqResult');
  if (!sysGroup || !sizeSel || !resultEl) return;

  // Measurements-mode elements — all optional, so the widget degrades to
  // size-only if a cached page predates them.
  var modeGroup = document.getElementById('vqMode');
  var unitGroup = document.getElementById('vqUnit');
  var sizePanel = document.getElementById('vqSizePanel');
  var measPanel = document.getElementById('vqMeasure');
  var mIn = { bust: document.getElementById('vqBust'), waist: document.getElementById('vqWaist'), hip: document.getElementById('vqHip'), height: document.getElementById('vqHeight') };
  var hasMeas = !!(modeGroup && unitGroup && sizePanel && measPanel && mIn.bust && mIn.waist && mIn.hip);

  var sys = 'us', idx = 3;          // default: US 4 -> VN M–L
  var mode = 'size', unit = 'cm';

  function fillSizes() {
    sizeSel.innerHTML = ROWS.map(function (r, i) {
      return '<option value="' + i + '">' + sys.toUpperCase() + ' ' + r[sys] + '</option>';
    }).join('');
    sizeSel.value = String(idx);
  }

  /* The sizing result CTA carries the read into the contact form ("about"
     is an existing Tally field), so no one has to retype their own answer. */
  function ctaHref(r, fromMeas) {
    var about = 'Sizing help — VN ' + r.vn + ' (US ' + r.us + (fromMeas ? ', from measurements' : '') + ')';
    return 'https://tally.so/r/gD10Kl?about=' + encodeURIComponent(about) + '&source=home-sizing';
  }

  function render(r, notes, fromMeas) {
    var conv = 'US ' + r.us + ' · UK ' + r.uk + ' · EU ' + r.eu + ' · AU ' + r.au;
    var extra = (notes || []).map(function (n) { return '<p class="vq-note">' + esc(n) + '</p>'; }).join('');
    resultEl.innerHTML =
      '<div class="vq-line">' + esc(t('result')) + ' <strong>VN ' + esc(r.vn) + '</strong></div>' +
      '<div class="vq-conv"><span class="vq-approx">' + esc(t('approx')) + '</span> ' + esc(conv) + '</div>' +
      '<p class="vq-bucket">' + esc(t('buckets')[r.b]) + '</p>' +
      extra +
      '<p class="vq-reassure">' + esc(t('reassure')) + '</p>' +
      '<a class="vq-cta" href="' + ctaHref(r, fromMeas) + '">' + esc(t('cta')) + '</a>';
    // retrigger the gentle pop
    resultEl.classList.remove('vq-pop'); void resultEl.offsetWidth; resultEl.classList.add('vq-pop');
  }
  function renderPrompt(msg) {
    resultEl.innerHTML = '<p class="vq-bucket">' + esc(msg) + '</p>';
  }

  /* ---------- measurements mode ---------- */
  function parseNum(s) {
    s = String(s == null ? '' : s).trim().replace(',', '.');
    return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN;
  }
  function toCm(v) { return unit === 'in' ? v * 2.54 : v; }
  function readField(k) {
    var input = mIn[k]; if (!input) return { state: 'empty' };
    var raw = input.value.trim();
    if (!raw) return { state: 'empty' };
    var v = parseNum(raw);
    if (isNaN(v)) return { state: 'bad' };
    var cm = toCm(v);
    if (cm < RANGE[k][0] || cm > RANGE[k][1]) return { state: 'bad' };
    return { state: 'ok', cm: cm };
  }
  // Nearest band per measurement; scanning up + `<=` prefers the LARGER row on
  // a tie — in Vietnamese sizing, too small is the failure mode, not too big.
  function nearest(k, cm) {
    var bi = 0, best = Infinity;
    for (var i = 0; i < MEAS.length; i++) {
      var d = Math.abs(MEAS[i][k] - cm);
      if (d <= best) { best = d; bi = i; }
    }
    return bi;
  }
  function renderMeas() {
    if (!hasMeas) return;
    var bad = false;
    var f = {};
    ['bust', 'waist', 'hip', 'height'].forEach(function (k) {
      f[k] = readField(k);
      if (mIn[k]) mIn[k].setAttribute('aria-invalid', f[k].state === 'bad' ? 'true' : 'false');
      if (f[k].state === 'bad') bad = true;
    });
    if (bad) { renderPrompt(t('invalid')); return; }
    if (f.bust.state !== 'ok' || f.waist.state !== 'ok' || f.hip.state !== 'ok') { renderPrompt(t('measPrompt')); return; }
    var iB = nearest('bust', f.bust.cm), iW = nearest('waist', f.waist.cm), iH = nearest('hip', f.hip.cm);
    var final = Math.max(iB, iH);           // size to the larger of bust/hip — err toward comfort
    var notes = [t('measCaveat')];
    if (iW > final) notes.push(t('waistNote'));
    if (f.height.state === 'ok' && f.height.cm < 157) notes.push(t('petiteNote'));
    idx = final; sizeSel.value = String(idx); // keep the size-mode picker in step
    render(ROWS[final], notes, true);
  }

  function setMode(m) {
    mode = m;
    if (!hasMeas) return;
    modeGroup.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
    sizePanel.hidden = (m !== 'size');
    measPanel.hidden = (m !== 'meas');
    if (m === 'size') render(ROWS[idx], [], false); else renderMeas();
  }
  var PLACEHOLDER = { cm: { bust: '92', waist: '74', hip: '99', height: '165' }, in: { bust: '36', waist: '29', hip: '39', height: '65' } };
  function paintUnit() {
    measPanel.querySelectorAll('.vq-suffix').forEach(function (sfx) { sfx.textContent = unit; });
    ['bust', 'waist', 'hip', 'height'].forEach(function (k) {
      if (mIn[k]) mIn[k].setAttribute('placeholder', PLACEHOLDER[unit][k]);
    });
  }
  function setUnit(u) {
    if (u === unit || !hasMeas) return;
    // convert whatever is already typed so nobody re-measures for a toggle
    ['bust', 'waist', 'hip', 'height'].forEach(function (k) {
      var input = mIn[k]; if (!input) return;
      var v = parseNum(input.value);
      if (!isNaN(v)) input.value = String(u === 'in' ? Math.round(v / 2.54 * 10) / 10 : Math.round(v * 2.54 * 10) / 10);
    });
    unit = u;
    unitGroup.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-unit') === u ? 'true' : 'false'); });
    paintUnit();
    renderMeas();
  }

  function refreshChrome() {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('vqEyebrow', t('eyebrow')); set('vqTitle', t('title')); set('vqSub', t('sub')); set('vqUsually', t('usually'));
    sysGroup.setAttribute('aria-label', t('sysLabel'));
    if (hasMeas) {
      modeGroup.setAttribute('aria-label', t('modeLabel'));
      unitGroup.setAttribute('aria-label', t('unitLabel'));
      modeGroup.querySelectorAll('button').forEach(function (b) {
        b.textContent = b.getAttribute('data-mode') === 'size' ? t('modeSize') : t('modeMeas');
      });
      set('vqLblBust', t('bust')); set('vqLblWaist', t('waist')); set('vqLblHip', t('hip')); set('vqLblHeight', t('height'));
      set('vqPrivacy', t('privacy'));
      set('vqHowSum', t('howSum'));
      var body = document.getElementById('vqHowBody');
      if (body) body.innerHTML = t('how').map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') + '<p><em>' + esc(t('howRule')) + '</em></p>';
    }
    fillSizes();
    if (mode === 'meas') renderMeas(); else render(ROWS[idx], [], false);
  }

  sysGroup.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      sys = b.getAttribute('data-sys');
      sysGroup.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      fillSizes(); render(ROWS[idx], [], false);
    });
  });
  sizeSel.addEventListener('change', function () { idx = parseInt(sizeSel.value, 10) || 0; render(ROWS[idx], [], false); });
  if (hasMeas) {
    modeGroup.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });
    unitGroup.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { setUnit(b.getAttribute('data-unit')); });
    });
    ['bust', 'waist', 'hip', 'height'].forEach(function (k) {
      if (mIn[k]) mIn[k].addEventListener('input', renderMeas);
    });
  }
  new MutationObserver(function () { refreshChrome(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  if (hasMeas) paintUnit();
  refreshChrome();
})();

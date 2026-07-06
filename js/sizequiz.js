/* Seraphic Styler — "What size am I likely to be in Vietnam?" mini estimator.
   Self-contained, no backend. Pick your home sizing system + usual size; it
   projects your most-likely Vietnamese label and shows the cross-system
   conversions, so a larger local tag is never a shock. EN + VI chrome.
   The size map is anchored to the Sizing & fit table (US runs ~2 sizes smaller
   than the VN label), so the widget and the table never disagree.
   Conversions: UK = US+4 · EU = US+32 · AU/NZ = US+4. */
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

  var L = {
    en: {
      eyebrow: 'Quick check', title: '✨ What size am I likely to be in Vietnam?',
      sub: 'A playful estimate — I always confirm real garment measurements before we buy.',
      sysLabel: 'Your home sizing system', usually: 'I usually wear a…',
      result: 'In Vietnam, you’re most likely a', approx: 'That’s roughly',
      reassure: 'The tag will read a larger size than you’re used to — that’s the local cut, not a verdict on your body.',
      cta: 'Not sure? Send me your measurements →',
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
  var sys = 'us', idx = 3; // default: US 4 -> VN M–L

  function fillSizes() {
    sizeSel.innerHTML = ROWS.map(function (r, i) {
      return '<option value="' + i + '">' + sys.toUpperCase() + ' ' + r[sys] + '</option>';
    }).join('');
    sizeSel.value = String(idx);
  }
  function render() {
    var r = ROWS[idx];
    var conv = 'US ' + r.us + ' · UK ' + r.uk + ' · EU ' + r.eu + ' · AU ' + r.au;
    resultEl.innerHTML =
      '<div class="vq-line">' + esc(t('result')) + ' <strong>VN ' + esc(r.vn) + '</strong></div>' +
      '<div class="vq-conv"><span class="vq-approx">' + esc(t('approx')) + '</span> ' + esc(conv) + '</div>' +
      '<p class="vq-bucket">' + esc(t('buckets')[r.b]) + '</p>' +
      '<p class="vq-reassure">' + esc(t('reassure')) + '</p>' +
      '<a class="vq-cta" href="#contact">' + esc(t('cta')) + '</a>';
    // retrigger the gentle pop
    resultEl.classList.remove('vq-pop'); void resultEl.offsetWidth; resultEl.classList.add('vq-pop');
  }
  function refreshChrome() {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('vqEyebrow', t('eyebrow')); set('vqTitle', t('title')); set('vqSub', t('sub')); set('vqUsually', t('usually'));
    sysGroup.setAttribute('aria-label', t('sysLabel'));
    fillSizes(); render();
  }

  sysGroup.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      sys = b.getAttribute('data-sys');
      sysGroup.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      fillSizes(); render();
    });
  });
  sizeSel.addEventListener('change', function () { idx = parseInt(sizeSel.value, 10) || 0; render(); });
  new MutationObserver(function () { refreshChrome(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  refreshChrome();
})();

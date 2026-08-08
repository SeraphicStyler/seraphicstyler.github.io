/* Seraphic Styler — voice concierge (fd-voice.js)
   ----------------------------------------------------------------------
   A stylist command bar, not a chatbot. One sentence — "premium womenswear
   in D3 for birthdays that ships worldwide", "tôi cần áo dài lụa" — becomes
   visible, editable filter chips plus ranked results, immediately. Nothing
   is ever gated behind a question: the concierge answers first and offers
   refinements after, so a missed word costs a tap, not a restart.

   Everything is deterministic and client-side. Recognition is the browser's
   Web Speech API (en-US / vi-VN, switchable); comprehension is a bilingual
   diacritic-normalised lexicon plus fuzzy brand matching; read-back is
   speechSynthesis, voice-matched per language so Vietnamese house names are
   spoken by a Vietnamese voice instead of mangled by an English one. No
   servers, no API keys, no build step. Where speech is unavailable or
   refused, the identical flow runs on typed input.

   State drives the page's own deep link (#cat=…&zone=…&tier=…), so filters,
   chips, the map and shareable URLs stay in sync — the concierge's result
   IS a link. Self-injecting in the fd-basket.js mold: own <style>, own DOM,
   themed off the page's CSS variables, so dark mode comes free.

   Accessibility: every spoken line is also text, an aria-live region
   announces listening/processing/result-count changes, the microphone is
   press-to-talk (never always-on), and there is full keyboard parity —
   Cmd/Ctrl+Space focuses the concierge, Cmd/Ctrl+Shift+Space toggles
   push-to-talk, Escape cancels.

   Storage: localStorage 'fd-vc' {lang, last:{intent,label,ts}}.
   Exposes window.SS_VOICE = { open }.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_VOICE) return;
  var B = window.SS_DIRECTORY, FD = window.SS_FD;
  if (!B || !FD || !document.getElementById('main')) return; /* directory page only */

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function isVI() { return document.documentElement.getAttribute('lang') === 'vi'; }
  /* normalise for matching: lowercase, strip diacritics, đ→d, squeeze spaces */
  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
  }
  var VI_CHARS = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- i18n: site bundle first (fd.vc.* keys), then built-in EN/VI ---------- */
  var EN = {
    fab: 'Voice concierge', title: 'Concierge', sub: 'Say or type it in one sentence',
    hint: 'Try “premium womenswear in D3 for birthdays” · “vegan, ship to me” · “clear fabric” · “read top 5”',
    mic: 'Push to talk', micStop: 'Stop listening', typed: 'Say or type what you want…',
    listening: 'Listening…', processing: 'Working…',
    noSpeech: 'I didn’t hear anything. Tap the mic again, or type it.',
    denied: 'The microphone is blocked — the typed box does everything the mic does.',
    noSR: 'This browser has no speech recognition. Typing does everything the mic would.',
    resume: 'Pick up where you left off:',
    hello: 'Tell me what you want in one sentence — an occasion, a fabric, a feeling. I’ll filter as you speak, and you can edit anything after.',
    /* Discovery: the answer to "I don't know what's available" — what Vietnam is
       actually known for, taught rather than filtered. */
    discoverH: 'New to Vietnamese fashion? This is what it’s known for:',
    disc: {
      tailor: ['Áo dài & made-to-measure', 'The national dress, and the tailoring tradition behind it — cut to your measurements.'],
      luxury: ['Couture', 'The houses on the Paris, Milan, London and New York calendars.'],
      bridal: ['Bridal', 'Gowns and áo dài cưới made to buy and keep — not rented.'],
      silk: ['Natural fibre', 'Houses that name their cloth — linen, cotton, hemp, silk.'],
      plant: ['Plant-based · no silk', 'Vegan-friendly: stated cloth is linen, cotton, hemp or TENCEL, with no silk named.'],
      circular: ['Upcycled & vintage', 'Reworked one-offs and Saigon’s secondhand trade.'],
      women: ['Everyday designer', 'Small local labels — the wardrobe Saigon actually wears.']
    },
    stateH: 'Showing', clearAll: 'Clear all', removeF: 'Remove {x}',
    refineH: 'Narrow it:', moreWays: 'Other ways in:',
    guessH: 'I’m not sure I caught that. Did you mean:',
    missed: 'I didn’t catch a filter in that. Try naming a garment, an occasion, a fabric or a budget.',
    match1: '1 house', matchN: '{n} houses', match0: 'Nothing matches all of that. Drop one and it opens up:',
    without: 'Without {x}',
    browse: 'See them in the directory ↓', speak: 'Read these out', again: 'Start over',
    undone: 'Reverted.', nothingUndo: 'Nothing to undo yet.',
    savedN: 'Saved {n} to your tray.', trayMissing: 'The tray isn’t loaded on this page.',
    routeGo: 'Opening the route planner.', routeMissing: 'The route planner isn’t loaded on this page.',
    mapCmd: 'Opening the cluster map.', mapFor: 'Opening the map for {x}.',
    resetCmd: 'Cleared — all {n} houses are back.',
    heard: 'I read that as: {x}', heardNothing: 'Nothing is filtered yet.',
    langSwitched: 'Listening in {x} now.',
    cleared: 'Cleared {x}.', notSet: '{x} wasn’t set.',
    shipBadge: 'ships worldwide',
    shipNote: '{n} of these say they ship worldwide themselves. Sourcing and sending the rest is exactly what Seraphic does, so don’t rule a house out for that.',
    visitNote: 'Addresses are on every card, and the route planner will string them into one trip.',
    aodaiGloss: 'Áo dài — the Vietnamese national dress: a long fitted tunic over wide trousers, almost always made to your measurements.',
    applied: 'Directory filtered behind this panel.',
    a11yApplied: '{n} houses match. {x}',
    kbdHint: 'Cmd/Ctrl+Space focuses this · Cmd/Ctrl+Shift+Space talks · Esc closes',
    cats: { women: 'Womenswear', men: 'Menswear', luxury: 'Luxury & couture', bridal: 'Bridal & wedding', tailor: 'Áo dài & tailors', active: 'Athleisure', access: 'Accessories', sleep: 'Sleep & loungewear', vintage: 'Vintage & preloved', market: 'Markets' },
    tiers: { mid: 'Mid', premium: 'Premium', luxury: 'Luxury', couture: 'Couture' },
    fibs: { plant: 'plant-based', natural: 'natural fibre', linen: 'linen', cotton: 'cotton', silk: 'silk', hemp: 'hemp', tencel: 'TENCEL', circular: 'upcycled' },
    occs: { event: 'balls & formal', night: 'nightlife', bday: 'birthdays' },
    zones: { d1: 'District 1', d3: 'District 3', pn: 'Phú Nhuận', td: 'Thảo Điền', bt: 'Bình Thạnh', tb: 'Tân Bình', tp: 'Tân Phú', gv: 'Gò Vấp', q5: 'Q5 · Chợ Lớn', other: 'Online & hubs' },
    modes: { ship: 'ship to me', visit: 'visiting Saigon' },
    walk: 'walk-in', sig: 'signature houses', han: 'Hanoi',
    facet: { cat: 'category', zone: 'district', city: 'city', tier: 'budget', fib: 'fabric', occ: 'occasion', walk: 'walk-in', sig: 'signature', mode: 'delivery' },
    close: 'Close concierge', langBtn: 'Listening language'
  };
  var VI = {
    fab: 'Trợ lý giọng nói', title: 'Trợ lý', sub: 'Nói hoặc gõ trong một câu',
    hint: 'Thử “đồ nữ premium ở Q3 cho sinh nhật” · “thuần chay, gửi tới tôi” · “bỏ chất liệu” · “đọc 5 nhà đầu”',
    mic: 'Nhấn để nói', micStop: 'Dừng nghe', typed: 'Nói hoặc gõ điều bạn muốn…',
    listening: 'Đang nghe…', processing: 'Đang xử lý…',
    noSpeech: 'Mình chưa nghe thấy gì. Chạm micro lần nữa, hoặc gõ chữ.',
    denied: 'Micro bị chặn — ô gõ chữ làm được mọi thứ micro làm.',
    noSR: 'Trình duyệt này không nhận dạng giọng nói. Gõ chữ làm được mọi thứ.',
    resume: 'Tiếp tục lần trước:',
    hello: 'Nói cho mình trong một câu — một dịp, một chất liệu, một cảm giác. Mình lọc ngay, và bạn sửa gì cũng được sau đó.',
    discoverH: 'Mới biết thời trang Việt? Đây là những thứ làm nên tên tuổi:',
    disc: {
      tailor: ['Áo dài & may đo', 'Quốc phục, và cả truyền thống may đo phía sau nó — cắt theo số đo của bạn.'],
      luxury: ['Couture', 'Những nhà đã lên sàn Paris, Milan, London và New York.'],
      bridal: ['Cưới', 'Váy cưới và áo dài cưới để mua và giữ — không phải thuê.'],
      silk: ['Sợi tự nhiên', 'Những nhà công bố rõ chất vải — lanh, cotton, gai dầu, lụa.'],
      plant: ['Thuần chay · không lụa', 'Vải lanh, cotton, gai dầu hoặc TENCEL, không có lụa.'],
      circular: ['Tái chế & vintage', 'Đồ làm lại độc bản và chợ đồ si Sài Gòn.'],
      women: ['Thiết kế thường ngày', 'Các label nội địa nhỏ — tủ đồ Sài Gòn mặc thật.']
    },
    stateH: 'Đang xem', clearAll: 'Xoá hết', removeF: 'Bỏ {x}',
    refineH: 'Thu hẹp thêm:', moreWays: 'Cách khác để bắt đầu:',
    guessH: 'Mình chưa chắc đã nghe đúng. Ý bạn là:',
    missed: 'Mình chưa bắt được bộ lọc nào. Thử nói món đồ, dịp, chất liệu hoặc ngân sách.',
    match1: '1 nhà', matchN: '{n} nhà', match0: 'Không có nhà nào khớp hết. Bỏ bớt một tiêu chí:',
    without: 'Bỏ {x}',
    browse: 'Xem trong danh bạ ↓', speak: 'Đọc to', again: 'Bắt đầu lại',
    undone: 'Đã hoàn tác.', nothingUndo: 'Chưa có gì để hoàn tác.',
    savedN: 'Đã lưu {n} vào khay.', trayMissing: 'Khay chưa được tải trên trang này.',
    routeGo: 'Đang mở trình lên lộ trình.', routeMissing: 'Trình lộ trình chưa được tải.',
    mapCmd: 'Đang mở bản đồ cụm.', mapFor: 'Đang mở bản đồ cho {x}.',
    resetCmd: 'Đã xoá — cả {n} nhà đã trở lại.',
    heard: 'Mình hiểu là: {x}', heardNothing: 'Chưa lọc gì cả.',
    langSwitched: 'Giờ nghe bằng {x}.',
    cleared: 'Đã bỏ {x}.', notSet: 'Chưa đặt {x}.',
    shipBadge: 'gửi quốc tế',
    shipNote: '{n} nhà tự nói có gửi quốc tế. Mua hộ và gửi phần còn lại chính là việc Seraphic làm, nên đừng loại một nhà chỉ vì vậy.',
    visitNote: 'Địa chỉ nằm trên từng thẻ, và trình lộ trình sẽ nối chúng thành một chuyến.',
    aodaiGloss: 'Áo dài — quốc phục Việt Nam: áo dài ôm dáng mặc cùng quần rộng, gần như luôn may theo số đo.',
    applied: 'Danh bạ phía sau đã lọc.',
    a11yApplied: '{n} nhà phù hợp. {x}',
    kbdHint: 'Cmd/Ctrl+Space để vào · Cmd/Ctrl+Shift+Space để nói · Esc để đóng',
    cats: { women: 'Thời trang nữ', men: 'Thời trang nam', luxury: 'Cao cấp & couture', bridal: 'Cưới', tailor: 'Áo dài & may đo', active: 'Đồ tập', access: 'Phụ kiện', sleep: 'Đồ ngủ & mặc nhà', vintage: 'Vintage & đồ si', market: 'Chợ phiên' },
    tiers: { mid: 'Tầm trung', premium: 'Premium', luxury: 'Cao cấp', couture: 'Couture' },
    fibs: { plant: 'thuần chay', natural: 'sợi tự nhiên', linen: 'vải lanh', cotton: 'cotton', silk: 'lụa', hemp: 'gai dầu', tencel: 'TENCEL', circular: 'tái chế' },
    occs: { event: 'dạ hội & trang trọng', night: 'đi chơi tối', bday: 'sinh nhật' },
    zones: { d1: 'Quận 1', d3: 'Quận 3', pn: 'Phú Nhuận', td: 'Thảo Điền', bt: 'Bình Thạnh', tb: 'Tân Bình', tp: 'Tân Phú', gv: 'Gò Vấp', q5: 'Q5 · Chợ Lớn', other: 'Online & hub' },
    modes: { ship: 'gửi tới tôi', visit: 'tới Sài Gòn' },
    walk: 'ghé trực tiếp', sig: 'nhà tiêu biểu', han: 'Hà Nội',
    facet: { cat: 'danh mục', zone: 'quận', city: 'thành phố', tier: 'ngân sách', fib: 'chất liệu', occ: 'dịp', walk: 'ghé trực tiếp', sig: 'tiêu biểu', mode: 'cách nhận' },
    close: 'Đóng trợ lý', langBtn: 'Ngôn ngữ nghe'
  };
  function L() { return isVI() ? VI : EN; }
  function t(key) { var d = L()[key]; return window.SS_T ? window.SS_T('fd.vc.' + key, d) : d; }
  function fill(key, vals) {
    return String(t(key)).replace(/\{(\w+)\}/g, function (m, k) { return vals && vals[k] != null ? vals[k] : m; });
  }

  /* ---------- lexicon (patterns run on norm()ed text) ---------- */
  var RX = {
    zones: [
      ['td', /\b(thao dien|thu duc|d2\b|district 2|quan 2)\b/],
      ['pn', /\bphu nhuan\b/], ['bt', /\bbinh thanh\b/], ['tb', /\btan binh\b/],
      ['tp', /\btan phu\b/], ['gv', /\bgo vap\b/],
      ['q5', /\b(cho lon|quan 5|district 5|q5)\b/],
      ['d3', /\b(district 3|quan 3|q3|d3)\b/],
      ['d1', /\b(district 1|quan 1|q1|d1|dong khoi|ben thanh)\b/],
      ['other', /\bonline\b/]
    ],
    han: /\b(ha noi|hanoi)\b/,
    weddingGuest: /\b(wedding guest|guest at|du (dam )?cuoi|di (dam )?cuoi ban|attend)\b/,
    cats: [
      ['bridal', /\b(vay cuoi|ao cuoi|ao dai cuoi|bridal|brides?|weddings?|co dau|dam cuoi|cuoi)\b/],
      ['tailor', /\b(ao dai|tailor(s|ing)?|may do|dat may|bespoke|tho may|embroider(y|ed)?|theu)\b/],
      ['sleep', /\b(sleepwear|p[ay]jamas?|do ngu|nightwear|loungewear|do mac nha)\b/],
      ['vintage', /\b(vintage|secondhand|second hand|do si|2hand|preloved|thrift(ing|s)?|do cu)\b/],
      ['active', /\b(activewear|athleisure|gym|yoga|pilates|do tap|the thao|leggings?)\b/],
      ['access', /\b(accessor(y|ies)|phu kien|jewel(le)?ry|jewels?|trang suc|shoes?|giay|heels?|guoc|bags?|tui( xach)?|eyewear|sunglass(es)?|kinh( mat)?)\b/],
      ['market', /\b(markets?|cho phien|flea|hoi cho)\b/],
      ['men', /\b(menswear|mens|men'?s|for men|do nam|quan ao nam|streetwear|suits?|vest nam)\b/],
      ['women', /\b(womenswear|do nu|quan ao nu|dress(es)?|dam|vay|feminine|gowns?)\b/]
    ],
    catLux: /\b(luxury|couture|cao cap|sang trong|high end|designers?|thiet ke)\b/,
    tiers: [
      ['couture', /\b(couture|haute|dat may rieng)\b/],
      ['luxury', /\b(luxury|sang trong|cao cap|high end|xa xi)\b/],
      ['premium', /\b(premium|thiet ke|designer)\b/],
      ['mid', /\b(cheap|affordable|budget|binh dan|gia re|re thoi|sinh vien|mid|tam trung)\b/]
    ],
    fibs: [ /* plant first: "vegan", "no silk" must never fall through to the silk rule */
      ['plant', /\b(vegan|plant[ -]?based|cruelty[ -]?free|no silk|without silk|silk[ -]?free|animal[ -]?free|thuan chay|khong (dung )?lua|khong to tam)\b/],
      ['silk', /\b(silk|lua|to tam)\b/],
      ['linen', /\b(linen|vai lanh|lanh)\b/],
      ['cotton', /\b(cotton|vai bong)\b/],
      ['hemp', /\b(hemp|gai dau)\b/],
      ['tencel', /\b(tencel|modal|lyocell)\b/],
      ['circular', /\b(upcycl(e|ed|ing)|tai che|deadstock)\b/],
      ['natural', /\b(natural fib|soi tu nhien|thien nhien|breathable|thoang mat)\b/]
    ],
    occs: [ /* birthday before night — "birthday party" is a birthday */
      ['bday', /\b(birthdays?|sinh nhat)\b/],
      ['event', /\b(balls?|galas?|formal(wear)?|prom|da hoi|su kien|black tie|trang trong)\b/],
      ['night', /\b(part(y|ies)|club(bing)?|nightlife|di bar|tiec|dem|night out)\b/]
    ],
    walk: /\b(walk(ing)?[ -]?in(to)?|ghe (mua|xem)|open now|dang mo|drop in)\b/,
    sig: /\b(signature|the best|best houses|noi bat|tieu bieu|dac sac)\b/,
    /* How the client meets the clothes — the question that actually matters to
       someone who has never been to Saigon, in place of "which district". */
    modeShip: /\b(ship|shipping|send it|send to|deliver|delivery|post it|from abroad|overseas|cant (travel|come)|cannot (travel|come)|not (travelling|traveling|coming)|remote|gui (ve|toi)|ship ve)\b/,
    modeVisit: /\b(visit(ing)?|travel(l)?ing to|coming to|trip to|i(')?ll be in|in town|when i(')?m there|my trip|sap toi|se den|di sai gon|du lich)\b/,
    /* Plain description → facets, so no fashion vocabulary is required. */
    plain: [
      ['fib', 'natural', /\b(beach|holiday|vacation|resort|tropical|hot weather|humid|breathable|summer|di bien|nghi mat|nong)\b/],
      ['occ', 'night', /\b(going out|night out|drinks|dinner|date night|cocktail|di choi (toi|dem)|an toi)\b/],
      ['occ', 'event', /\b(black tie|red carpet|ceremony|graduation|gala dinner|tot nghiep|le trao)\b/],
      ['cat', 'women', /\b(floaty|flowy|romantic|feminine|soft|pretty|elegant|bay bay|nu tinh|diu dang)\b/],
      ['cat', 'women', /\b(office|work wear|workwear|business|professional|di lam|cong so)\b/],
      ['sig', true, /\b(unique|distinctive|special|statement|one[ -]of[ -]a[ -]kind|cant get (at home|anywhere)|can(')?t find at home|nothing like it|only in vietnam|souvenir|dac biet|doc dao|doc ban)\b/],
      ['cat', 'tailor', /\b(traditional|national dress|cultural|heritage|truyen thong|quoc phuc)\b/]
    ],
    aodai: /\bao dai\b/,
    /* ---- commands: state edits, not new searches ---- */
    cmdReset: /\b(reset|start over|clear (all|everything|filters)|xoa (het|bo loc)|lam lai|bat dau lai)\b/,
    cmdUndo: /\b(undo|go back|revert|hoan tac|quay lai)\b/,
    cmdClear: /\b(clear|remove|drop|forget|bo|xoa)\b/,
    cmdMap: /\b(show|open|xem|mo)\b.*\b(map|ban do)\b|^\s*(map|ban do)\s*$/,
    cmdRead: /\b(read (them |these |it |top |the )?|doc |noi )\b.*\b(out|aloud|to|list|results|nha|to len)\b|^\s*read( top)?( \d+)?\s*$|^\s*doc\b/,
    cmdSave: /\b(save|shortlist|add|luu|them)\b/,
    cmdRoute: /\b(route|plan a? ?(walking )?route|itinerary|lo trinh|len lo trinh)\b/,
    cmdHeard: /\b(what did you (hear|catch|get)|what have you got|current filters|ban nghe (gi|duoc gi))\b/,
    cmdLang: /\b(switch to|speak|in) (vietnamese|tieng viet|english|tieng anh)\b|^\s*(vietnamese|tieng viet|english)\s*$/,
    firstN: /\b(first|top|dau|đau)\s*(\d+)\b|\b(\d+)\s*(dau|first)\b/
  };

  /* ---------- derived signals ----------
     All read off what a house says about itself in `no` — same philosophy as the
     `fib` facet: an untagged house is unstated, never accused. Nothing here is a
     hard filter; it only decides what a first-time visitor sees first. */
  var RE_SHIP = /worldwide|international shipping|ships? (world|global)|global shipping/i;
  var RE_PRESTIGE = /paris|milan|new york|london|tokyo|seoul|fashion week|haute couture calendar|forbes|internationally cited/i;
  var RE_CRAFT = /hand-?(woven|made|painted|crafted|dyed|applied)|embroider|theu|made-to-measure|bespoke|upcycl|deadstock|seed-to-garment|artisan|craft|zero-waste|organic/i;
  var RE_CHAIN = /\b\d+\s*(stores?|doors?|branches)|nationwide|store locator|chain\b|multi-branch/i;
  function noteOf(b) { return b.no || ''; }
  function shipsWorldwide(b) { return RE_SHIP.test(noteOf(b)); }
  function isPrestige(b) { return RE_PRESTIGE.test(noteOf(b)); }
  function isCraft(b) { return RE_CRAFT.test(noteOf(b)); }
  function isChain(b) { return RE_CHAIN.test(noteOf(b) + ' ' + (b.area || '')); }
  /* Foreign labels merely stocked in Vietnam: the opposite of what someone
     shopping Vietnam from abroad came here for. */
  function isForeign(b) { return b.city === 'INTL'; }
  /* The most persuasive sentence a house has about itself — quoted, never invented. */
  function distinctLine(b) {
    var n = noteOf(b);
    if (!RE_PRESTIGE.test(n) && !RE_CRAFT.test(n)) return '';
    var sents = n.split(/(?:[.;])\s+/);
    for (var i = 0; i < sents.length; i++) {
      if (RE_PRESTIGE.test(sents[i]) || RE_CRAFT.test(sents[i])) {
        var s = sents[i].trim().replace(/[.;]$/, '');
        return s.length > 112 ? s.slice(0, 109).replace(/\s\S*$/, '') + '…' : s;
      }
    }
    return '';
  }
  /* Rank for a first-time, mostly-remote audience: prestige and craft above
     everything, chains and foreign stockists last. */
  function score(b, it) {
    var s = 0;
    if (b.sig) s += 6;
    if (isPrestige(b)) s += 5;
    if (b.pick) s += 4; /* editor's picks are how a flat category gets a front row */
    if (b.tier === 'couture') s += 3; else if (b.tier === 'luxury') s += 2;
    if (isCraft(b)) s += 2;
    if (it && it.mode === 'ship' && shipsWorldwide(b)) s += 3;
    if (it && it.mode === 'visit' && b.st === 'walk') s += 1;
    if (isChain(b)) s -= 4;
    if (isForeign(b)) s -= 7;
    return s;
  }

  /* ---------- fuzzy brand lookup ---------- */
  var BRANDS = B.map(function (b) { return { b: b, n: norm(b.n), h: norm(b.h || '') }; });
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prev = p[0]; p[0] = i;
      for (j = 1; j <= b.length; j++) {
        var cur = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = p[j]; p[j] = cur;
      }
    }
    return p[b.length];
  }
  function findBrand(nt) {
    for (var i = 0; i < BRANDS.length; i++) {
      var r = BRANDS[i];
      if (r.n.length >= 4 && nt.indexOf(r.n) >= 0) return r.b;
      if (r.h.length >= 4 && nt.indexOf(r.h) >= 0) return r.b;
    }
    if (nt.length >= 4 && nt.length <= 26) { /* the whole utterance may BE a misheard brand */
      var best = null, bd = 3;
      for (var k = 0; k < BRANDS.length; k++) {
        var d = lev(nt, BRANDS[k].n);
        if (d < bd) { bd = d; best = BRANDS[k].b; }
      }
      if (bd <= 2) return best;
    }
    return null;
  }

  /* ---------- intent ---------- */
  var FACETS = ['cat', 'zone', 'city', 'tier', 'fib', 'occ', 'walk', 'sig', 'brand'];
  function facetCount(it) {
    return FACETS.reduce(function (n, k) { return n + (it[k] ? 1 : 0); }, 0);
  }
  function parseFacets(text) {
    var nt = norm(text); /* idempotent, so callers may pass raw or normalised */
    var it = {}, i;
    for (i = 0; i < RX.zones.length; i++) if (RX.zones[i][1].test(nt)) { it.zone = RX.zones[i][0]; break; }
    if (!it.zone && RX.han.test(nt)) it.city = 'HAN';
    for (i = 0; i < RX.cats.length; i++) if (RX.cats[i][1].test(nt)) { it.cat = RX.cats[i][0]; break; }
    if (it.cat === 'bridal' && RX.weddingGuest.test(nt)) { it.cat = 'women'; it.occ = 'event'; }
    for (i = 0; i < RX.tiers.length; i++) if (RX.tiers[i][1].test(nt)) { it.tier = RX.tiers[i][0]; break; }
    var m = nt.match(/(?:under|duoi|below|less than|khoang|tam|around)?\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|million|mil\b|tr\b)/);
    if (m && !it.tier) { /* price → tier band: houses carry tiers, not prices */
      var v = parseFloat(m[1].replace(',', '.'));
      it.tier = v <= 2 ? 'mid' : v <= 5 ? 'premium' : v <= 15 ? 'luxury' : 'couture';
    }
    for (i = 0; i < RX.fibs.length; i++) if (RX.fibs[i][1].test(nt)) { it.fib = RX.fibs[i][0]; break; }
    for (i = 0; i < RX.occs.length; i++) if (RX.occs[i][1].test(nt)) { it.occ = RX.occs[i][0]; break; }
    if (RX.walk.test(nt)) it.walk = true;
    if (RX.sig.test(nt)) it.sig = true;
    if (RX.modeShip.test(nt)) it.mode = 'ship';
    else if (RX.modeVisit.test(nt) || it.walk) it.mode = 'visit';
    for (i = 0; i < RX.plain.length; i++) { /* named vocabulary always beats inferred */
      var p = RX.plain[i];
      if (!it[p[0]] && p[2].test(nt)) it[p[0]] = p[1];
    }
    if (RX.aodai.test(nt)) it.sawAodai = true;
    if ((it.tier === 'luxury' || it.tier === 'couture') && RX.catLux.test(nt) && facetCount(it) === 1) it.luxAlone = true;
    return it;
  }
  /* Which facet is a "clear X" command aiming at? */
  function facetNamed(nt) {
    if (/\b(fabric|fibre|fiber|chat lieu|vai)\b/.test(nt)) return 'fib';
    if (/\b(occasion|dip)\b/.test(nt)) return 'occ';
    if (/\b(budget|tier|price|ngan sach|gia)\b/.test(nt)) return 'tier';
    if (/\b(district|area|location|zone|quan|khu)\b/.test(nt)) return 'zone';
    if (/\b(category|type|danh muc|loai)\b/.test(nt)) return 'cat';
    if (/\b(walk|ghe)\b/.test(nt)) return 'walk';
    if (/\b(signature|tieu bieu)\b/.test(nt)) return 'sig';
    if (/\b(shipping|delivery|cach nhan)\b/.test(nt)) return 'mode';
    return null;
  }

  /* ---------- matching (mirrors the page's match(), via SS_FD.zoneOf) ---------- */
  var NATURAL = ['linen', 'cotton', 'silk', 'hemp'];
  /* Mirrors fibMatch() in fashion-directory.html — silk is natural but not vegan,
     so `plant` is the cut a vegan wardrobe actually needs. */
  var PLANT = ['linen', 'cotton', 'hemp', 'tencel'];
  function fibHit(b, f) {
    var fb = Array.isArray(b.fib) ? b.fib : (b.fib ? [b.fib] : []);
    if (!fb.length) return false;
    if (f === 'natural') return fb.some(function (x) { return NATURAL.indexOf(x) >= 0; });
    if (f === 'plant') return fb.some(function (x) { return PLANT.indexOf(x) >= 0; }) && fb.indexOf('silk') < 0;
    return fb.indexOf(f) >= 0;
  }
  function hit(b, it) {
    if (it.brand) return b === it.brand;
    if (it.cat && b.cat !== it.cat) return false;
    if (it.city && b.city !== it.city) return false;
    if (it.zone && FD.zoneOf(b) !== it.zone) return false;
    if (it.tier && b.tier !== it.tier) return false;
    if (it.walk && b.st !== 'walk') return false;
    if (it.sig && !b.sig) return false;
    if (it.fib && !fibHit(b, it.fib)) return false;
    if (it.occ) {
      var o = Array.isArray(b.occ) ? b.occ : (b.occ ? [b.occ] : []);
      if (o.indexOf(it.occ) < 0) return false;
    }
    return true;
  }
  function matches(it) { return B.filter(function (b) { return hit(b, it); }); }
  function ranked(it) {
    return matches(it).map(function (b, i) { return { b: b, i: i, s: score(b, it) }; })
      .sort(function (x, y) { return y.s - x.s || x.i - y.i; })
      .map(function (r) { return r.b; });
  }

  /* ---------- apply: drive the page's own deep-link hash ---------- */
  function applyIntent(it) {
    var p = new URLSearchParams();
    if (it.brand) p.set('q', it.brand.n);
    if (it.cat) p.set('cat', it.cat);
    if (it.city) p.set('city', it.city);
    if (it.zone) p.set('zone', it.zone);
    if (it.tier) p.set('tier', it.tier);
    if (it.fib) p.set('fib', it.fib);
    if (it.occ) p.set('occ', it.occ);
    if (it.walk) p.set('walk', '1');
    if (it.sig) p.set('sig', '1');
    var h = p.toString();
    if (('#' + h) !== location.hash) location.hash = h; /* hashchange → applyHash + syncUI */
  }

  /* ---------- labels ---------- */
  function valueLabel(k, v) {
    var S = L();
    if (k === 'cat') return S.cats[v] || v;
    if (k === 'zone') return S.zones[v] || v;
    if (k === 'city') return v === 'HAN' ? S.han : v;
    if (k === 'tier') return S.tiers[v] || v;
    if (k === 'fib') return S.fibs[v] || v;
    if (k === 'occ') return S.occs[v] || v;
    if (k === 'walk') return S.walk;
    if (k === 'sig') return S.sig;
    if (k === 'mode') return S.modes[v] || v;
    if (k === 'brand') return v && v.n ? v.n : v;
    return String(v);
  }
  var CHIP_ORDER = ['brand', 'cat', 'fib', 'occ', 'tier', 'zone', 'city', 'walk', 'sig', 'mode'];
  function activeChips(it) {
    var out = [];
    CHIP_ORDER.forEach(function (k) { if (it[k]) out.push({ k: k, label: valueLabel(k, it[k]) }); });
    return out;
  }
  function intentLabel(it) {
    return activeChips(it).map(function (c) { return c.label; }).join(' · ');
  }
  function whyChips(b, it) {
    var S = L(), out = [];
    if (it.cat && b.cat === it.cat) out.push(S.cats[it.cat]);
    if (it.zone && FD.zoneOf(b) === it.zone) out.push(S.zones[it.zone]);
    if (it.tier && b.tier === it.tier) out.push(S.tiers[it.tier]);
    if (it.fib && fibHit(b, it.fib)) out.push(S.fibs[it.fib]);
    if (it.occ) out.push(S.occs[it.occ]);
    if (it.walk && b.st === 'walk') out.push(S.walk);
    return out;
  }

  /* ---------- speech synthesis ----------
     The default utterance sounds robotic mostly for three fixable reasons: the
     browser picks a low-quality fallback voice, the whole paragraph is queued as
     one breathless utterance, and Vietnamese house names get read by an English
     voice. So: choose the best installed voice per language, split on sentence
     boundaries so the engine breathes, and route Vietnamese names to a Vietnamese
     voice when one exists. */
  var GOOD_EN = ['samantha', 'ava', 'allison', 'serena', 'zoe', 'google us english', 'microsoft aria', 'microsoft jenny', 'karen', 'moira'];
  var GOOD_VI = ['linh', 'google tiếng việt', 'google tieng viet', 'microsoft hoaimy', 'my an'];
  var voiceCache = {};
  function pickVoice(lang) {
    if (!window.speechSynthesis) return null;
    if (voiceCache[lang] !== undefined) return voiceCache[lang];
    var all = [];
    try { all = speechSynthesis.getVoices() || []; } catch (e) { all = []; }
    if (!all.length) return null; /* not loaded yet — don't cache a miss */
    var base = lang.slice(0, 2).toLowerCase();
    var pool = all.filter(function (v) { return (v.lang || '').slice(0, 2).toLowerCase() === base; });
    if (!pool.length) pool = all;
    var wanted = base === 'vi' ? GOOD_VI : GOOD_EN;
    var best = null, bestRank = 1e9;
    pool.forEach(function (v) {
      var nm = (v.name || '').toLowerCase();
      var idx = wanted.findIndex(function (w) { return nm.indexOf(w) >= 0; });
      var rank = idx >= 0 ? idx : 500 + (v.localService ? 0 : 50); /* named favourites, then local */
      if (rank < bestRank) { bestRank = rank; best = v; }
    });
    voiceCache[lang] = best;
    return best;
  }
  if (window.speechSynthesis && typeof speechSynthesis.addEventListener === 'function') {
    speechSynthesis.addEventListener('voiceschanged', function () { voiceCache = {}; });
  }
  function stopSpeaking() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
  /* parts: [{text, lang}] — queued as separate utterances so the engine pauses
     naturally between them instead of racing through one long string */
  function speakParts(parts) {
    if (!window.speechSynthesis) return;
    stopSpeaking();
    parts.forEach(function (p) {
      if (!p.text || !String(p.text).trim()) return;
      var u = new SpeechSynthesisUtterance(String(p.text).trim());
      var lang = p.lang || recLang;
      u.lang = lang;
      var v = pickVoice(lang);
      if (v) u.voice = v;
      u.rate = 0.97;   /* a shade under default: the default clips consonants */
      u.pitch = 1;
      u.volume = 1;
      try { speechSynthesis.speak(u); } catch (e) {}
    });
  }
  /* A house name in Vietnamese script read by an English voice is the single
     worst-sounding thing here — give it to a Vietnamese voice when one exists. */
  function nameParts(names) {
    var viVoice = pickVoice('vi-VN');
    var out = [];
    names.forEach(function (n, i) {
      var isVn = VI_CHARS.test(n);
      out.push({ text: n + (i < names.length - 1 ? ',' : '.'), lang: (isVn && viVoice) ? 'vi-VN' : recLang });
    });
    return out;
  }

  /* ---------- persistence ---------- */
  function store(patch) {
    var d = {};
    try { d = JSON.parse(localStorage.getItem('fd-vc') || '{}'); } catch (e) {}
    for (var k in patch) d[k] = patch[k];
    try { localStorage.setItem('fd-vc', JSON.stringify(d)); } catch (e2) {}
    return d;
  }
  function stored() { try { return JSON.parse(localStorage.getItem('fd-vc') || '{}'); } catch (e) { return {}; } }

  /* ---------- speech recognition ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recLang = 'en-US';
  try { recLang = stored().lang || (isVI() ? 'vi-VN' : 'en-US'); } catch (e) {}
  var rec = null, listening = false;

  /* ---------- styles ---------- */
  var css =
    '.vc-fab{position:fixed;left:1.25rem;bottom:1.25rem;z-index:40;width:52px;height:52px;border-radius:50%;border:1px solid var(--line);' +
      'background:var(--card-solid);color:var(--cobalt);cursor:pointer;display:grid;place-items:center;box-shadow:var(--shadow-sm);}' +
    '.vc-fab:hover{box-shadow:var(--halo);}' +
    '.vc-fab:focus-visible{outline:2px solid var(--cobalt);outline-offset:2px;}' +
    '@media(max-width:720px){.vc-fab{bottom:calc(var(--tabbar-h) + 12px);}}' +
    '.vc-panel{position:fixed;left:1.25rem;bottom:5.9rem;z-index:64;width:min(400px,calc(100vw - 2rem));max-height:min(600px,76vh);' +
      'display:flex;flex-direction:column;border:1px solid var(--line);border-radius:18px;overflow:hidden;' +
      'background:var(--card-solid);box-shadow:var(--shadow);font-family:var(--font-body);' +
      (RM ? '' : 'transition:opacity .22s ease,transform .22s ease;') + '}' +
    '.vc-panel[hidden]{display:none;}' +
    '.vc-panel.off{opacity:0;transform:translateY(10px) scale(.98);pointer-events:none;}' +
    '@media(max-width:720px){.vc-panel{left:10px;right:10px;width:auto;bottom:calc(var(--tabbar-h) + 74px);max-height:70vh;}}' +
    '.vc-head{display:flex;align-items:center;gap:9px;padding:12px 14px;border-bottom:1px solid var(--line-soft);}' +
    '.vc-head b{font-family:var(--font-display);font-weight:400;font-size:1.02rem;color:var(--ink);letter-spacing:.02em;}' +
    '.vc-head .vc-sub{font-size:.7rem;color:var(--ink-mute);margin-top:1px;}' +
    '.vc-x{all:unset;cursor:pointer;margin-left:auto;width:30px;height:30px;display:grid;place-items:center;border-radius:9px;color:var(--ink-soft);}' +
    '.vc-x:hover{background:var(--mist);}.vc-x:focus-visible{outline:2px solid var(--cobalt);}' +
    /* the live, always-visible state — every constraint editable in one tap */
    '.vc-state{display:none;flex-wrap:wrap;gap:6px;align-items:center;padding:9px 14px;border-bottom:1px solid var(--line-soft);' +
      'background:color-mix(in srgb,var(--mist) 45%,transparent);}' +
    '.vc-state.on{display:flex;}' +
    '.vc-state .lab{font-size:.66rem;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-mute);}' +
    '.vc-state .cnt{font-size:.72rem;font-weight:600;color:var(--peri-text);margin-left:auto;}' +
    '.vc-fchip{display:inline-flex;align-items:center;gap:5px;font-size:.73rem;color:var(--ink);' +
      'background:var(--card-solid);border:1px solid var(--line);border-radius:999px;padding:3px 4px 3px 10px;}' +
    '.vc-fchip button{all:unset;cursor:pointer;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;' +
      'color:var(--ink-mute);font-size:.7rem;}' +
    '.vc-fchip button:hover{background:var(--mist);color:var(--ink);}' +
    '.vc-fchip button:focus-visible{outline:2px solid var(--cobalt);}' +
    '.vc-clear{all:unset;cursor:pointer;font-size:.68rem;color:var(--cobalt);text-decoration:underline;}' +
    '.vc-conv{flex:1;overflow-y:auto;padding:13px 14px;display:flex;flex-direction:column;gap:9px;scroll-behavior:smooth;}' +
    '.vc-msg{max-width:88%;font-size:.82rem;line-height:1.55;border-radius:13px;padding:8px 12px;' + (RM ? '' : 'animation:vcin .2s ease both;') + '}' +
    '@keyframes vcin{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:none;}}' +
    '.vc-msg.bot{background:var(--mist);color:var(--ink);align-self:flex-start;}' +
    '.vc-msg.me{background:var(--cobalt);color:#fff;align-self:flex-end;}' +
    '[data-theme=dark] .vc-msg.me{color:#161a26;}' +
    '.vc-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:97%;}' +
    '.vc-chip{font:inherit;font-size:.76rem;cursor:pointer;border:1px solid var(--line);background:var(--card-solid);' +
      'color:var(--ink-soft);border-radius:999px;padding:5px 11px;}' +
    '.vc-chip:hover{border-color:var(--peri);color:var(--ink);}' +
    '.vc-chip b{font-weight:600;color:var(--peri-text);margin-left:4px;}' +
    '.vc-chip:disabled{opacity:.45;cursor:default;}' +
    '.vc-lbl{font-size:.66rem;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-mute);align-self:flex-start;}' +
    '.vc-res{align-self:stretch;border:1px solid var(--line-soft);border-radius:13px;padding:10px 12px;background:color-mix(in srgb,var(--mist) 55%,transparent);}' +
    '.vc-res .vc-count{font-size:.8rem;color:var(--ink);font-weight:600;margin-bottom:6px;}' +
    '.vc-house{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;padding:5px 0;border-top:1px solid var(--line-soft);font-size:.8rem;}' +
    '.vc-house:first-of-type{border-top:0;}' +
    '.vc-house .n{color:var(--ink);font-weight:600;}' +
    '.vc-house .a{color:var(--ink-mute);font-size:.72rem;}' +
    '.vc-house a{color:var(--cobalt);text-decoration:none;font-size:.72rem;}' +
    '.vc-house a:hover{text-decoration:underline;}' +
    '.vc-why{width:100%;display:flex;flex-wrap:wrap;gap:4px;font-size:.66rem;color:var(--ok);}' +
    '.vc-why span::before{content:"✓ ";}' +
    /* the house's own claim to distinction — quoted, never invented */
    '.vc-dist{width:100%;font-size:.7rem;line-height:1.45;color:var(--ink-soft);font-style:italic;margin-top:2px;}' +
    '.vc-ship{font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ok);' +
      'background:var(--ok-bg);border-radius:999px;padding:2px 7px;}' +
    '.vc-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}' +
    /* discovery primer for a client who has never shopped Vietnam */
    '.vc-disc{display:grid;gap:6px;align-self:stretch;}' +
    '.vc-dcard{font:inherit;text-align:left;cursor:pointer;border:1px solid var(--line);border-radius:12px;' +
      'padding:9px 12px;background:var(--card-solid);display:grid;gap:2px;}' +
    '.vc-dcard:hover{border-color:var(--peri);box-shadow:var(--shadow-sm);}' +
    '.vc-dcard:disabled{opacity:.45;cursor:default;box-shadow:none;}' +
    '.vc-dcard .h{font-size:.82rem;font-weight:600;color:var(--ink);display:flex;align-items:baseline;gap:7px;}' +
    '.vc-dcard .h b{font-weight:600;color:var(--peri-text);font-size:.72rem;}' +
    '.vc-dcard .d{font-size:.7rem;line-height:1.45;color:var(--ink-mute);}' +
    '.vc-foot{border-top:1px solid var(--line-soft);padding:10px 12px;display:flex;gap:8px;align-items:center;}' +
    '.vc-mic{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--card-solid);' +
      'color:var(--cobalt);cursor:pointer;display:grid;place-items:center;position:relative;}' +
    '.vc-mic:hover{border-color:var(--peri);}' +
    '.vc-mic:focus-visible{outline:2px solid var(--cobalt);outline-offset:2px;}' +
    '.vc-mic.on{background:var(--cobalt);color:#fff;border-color:var(--cobalt);}' +
    '[data-theme=dark] .vc-mic.on{color:#161a26;}' +
    '.vc-mic.on::before,.vc-mic.on::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:1px solid var(--peri);' +
      (RM ? 'display:none;' : 'animation:vcpulse 1.6s ease-out infinite;') + '}' +
    '.vc-mic.on::after{animation-delay:.8s;}' +
    '@keyframes vcpulse{from{opacity:.8;transform:scale(1);}to{opacity:0;transform:scale(1.65);}}' +
    '.vc-in{flex:1;min-width:0;font:inherit;font-size:.82rem;border:1px solid var(--line);border-radius:999px;padding:9px 14px;' +
      'background:var(--card-solid);color:var(--ink);}' +
    '.vc-in::placeholder{color:var(--ink-mute);}' +
    '.vc-in:focus{outline:2px solid var(--cobalt);outline-offset:-1px;}' +
    '.vc-lang{flex:none;font:inherit;font-size:.68rem;font-weight:600;letter-spacing:.04em;cursor:pointer;border:1px solid var(--line);' +
      'background:var(--card-solid);color:var(--ink-soft);border-radius:999px;padding:6px 9px;}' +
    '.vc-lang:hover{border-color:var(--peri);}' +
    '.vc-hint{font-size:.64rem;color:var(--ink-mute);padding:0 14px 10px;line-height:1.5;}' +
    '.vc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}' +
    'html.rm .vc-panel,html.rm .vc-msg{animation:none;transition:none;}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- DOM ---------- */
  var micSvg = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
    '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>';
  var fab = document.createElement('button');
  fab.className = 'vc-fab';
  fab.innerHTML = micSvg;
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-haspopup', 'dialog');
  fab.setAttribute('aria-label', EN.fab);
  document.body.appendChild(fab);

  var panel = document.createElement('div');
  panel.className = 'vc-panel off';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  document.body.appendChild(panel);

  var conv, input, micBtn, langBtn, stateBar, live;
  function buildPanel() {
    panel.setAttribute('aria-label', t('title'));
    fab.setAttribute('aria-label', t('fab'));
    fab.title = t('fab');
    panel.innerHTML =
      '<div class="vc-head">' + micSvg.replace('width="21" height="21"', 'width="17" height="17"') +
        '<div><b>' + esc(t('title')) + '</b><div class="vc-sub">' + esc(t('sub')) + '</div></div>' +
        '<button class="vc-x" aria-label="' + esc(t('close')) + '">✕</button></div>' +
      '<div class="vc-state" aria-label="' + esc(t('stateH')) + '"></div>' +
      '<div class="vc-conv"></div>' +
      '<div class="vc-sr" role="status" aria-live="polite" aria-atomic="true"></div>' +
      '<div class="vc-foot">' +
        '<button class="vc-mic"' + (SR ? '' : ' hidden') + ' aria-label="' + esc(t('mic')) + '" aria-pressed="false">' + micSvg + '</button>' +
        '<input class="vc-in" type="text" placeholder="' + esc(t('typed')) + '" aria-label="' + esc(t('typed')) + '" autocomplete="off">' +
        '<button class="vc-lang"' + (SR ? '' : ' hidden') + ' aria-label="' + esc(t('langBtn')) + '"></button></div>' +
      '<div class="vc-hint">' + esc(t('hint')) + '<br>' + esc(t('kbdHint')) + '</div>';
    conv = panel.querySelector('.vc-conv');
    input = panel.querySelector('.vc-in');
    micBtn = panel.querySelector('.vc-mic');
    langBtn = panel.querySelector('.vc-lang');
    stateBar = panel.querySelector('.vc-state');
    live = panel.querySelector('.vc-sr');
    syncLangBtn();
    panel.querySelector('.vc-x').addEventListener('click', close);
    micBtn.addEventListener('click', toggleListen);
    langBtn.addEventListener('click', function () { setLang(recLang === 'vi-VN' ? 'en-US' : 'vi-VN'); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && input.value.trim()) { handle(input.value.trim()); input.value = ''; }
    });
  }
  function syncLangBtn() { if (langBtn) langBtn.textContent = recLang === 'vi-VN' ? 'VI' : 'EN'; }
  function setLang(l) {
    recLang = l; store({ lang: l }); voiceCache = {}; syncLangBtn();
    say(fill('langSwitched', { x: l === 'vi-VN' ? 'Tiếng Việt' : 'English' }));
  }
  function announce(msg) { if (live) live.textContent = msg; }

  /* ---------- conversation rendering ---------- */
  function say(text, cls) {
    var m = document.createElement('div');
    m.className = 'vc-msg ' + (cls || 'bot');
    m.textContent = text;
    conv.appendChild(m);
    conv.scrollTop = conv.scrollHeight;
    return m;
  }
  function sayHTML(html) {
    var m = document.createElement('div');
    m.className = 'vc-msg bot';
    m.innerHTML = html;
    conv.appendChild(m);
    conv.scrollTop = conv.scrollHeight;
    return m;
  }
  function sayChips(items, onPick, label) {
    if (label) {
      var l = document.createElement('div'); l.className = 'vc-lbl'; l.textContent = label; conv.appendChild(l);
    }
    var w = document.createElement('div');
    w.className = 'vc-chips';
    items.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'vc-chip';
      b.textContent = c.label;
      if (c.count != null) { var s = document.createElement('b'); s.textContent = c.count; b.appendChild(s); }
      b.addEventListener('click', function () { onPick(c, b, w); });
      w.appendChild(b);
    });
    conv.appendChild(w);
    conv.scrollTop = conv.scrollHeight;
    return w;
  }

  /* ---------- flow state ---------- */
  var intent = {}, history = [];
  function snapshot() { var c = {}; for (var k in intent) c[k] = intent[k]; return c; }
  function pushHistory() { history.push(snapshot()); if (history.length > 25) history.shift(); }

  /* ---------- the state bar: every constraint visible and editable ---------- */
  function renderState() {
    if (!stateBar) return;
    var chips = activeChips(intent);
    if (!chips.length) { stateBar.classList.remove('on'); stateBar.innerHTML = ''; return; }
    stateBar.classList.add('on');
    stateBar.innerHTML = '<span class="lab">' + esc(t('stateH')) + '</span>';
    chips.forEach(function (c) {
      var w = document.createElement('span');
      w.className = 'vc-fchip';
      w.appendChild(document.createTextNode(c.label));
      var x = document.createElement('button');
      x.textContent = '✕';
      x.setAttribute('aria-label', fill('removeF', { x: c.label }));
      x.addEventListener('click', function () { clearFacet(c.k, true); });
      w.appendChild(x);
      stateBar.appendChild(w);
    });
    var cnt = document.createElement('span');
    cnt.className = 'cnt';
    cnt.textContent = countLabel(matches(intent).length);
    stateBar.appendChild(cnt);
    var all = document.createElement('button');
    all.className = 'vc-clear';
    all.textContent = t('clearAll');
    all.addEventListener('click', function () { resetAll(true); });
    stateBar.appendChild(all);
  }
  function countLabel(n) { return n === 1 ? t('match1') : fill('matchN', { n: n }); }

  /* ---------- refinements: offered, never required ---------- */
  var REFINE_DIMS = [
    { k: 'cat', vals: ['women', 'bridal', 'tailor', 'luxury', 'vintage', 'sleep', 'access', 'men', 'active', 'market'] },
    { k: 'fib', vals: ['plant', 'silk', 'linen', 'cotton', 'circular'] },
    { k: 'occ', vals: ['event', 'night', 'bday'] },
    { k: 'tier', vals: ['mid', 'premium', 'luxury', 'couture'] },
    { k: 'zone', vals: ['d1', 'd3', 'pn', 'td', 'bt', 'q5'] },
    { k: 'sig', vals: [true] }
  ];
  function refineChips(it) {
    var total = matches(it).length, out = [];
    REFINE_DIMS.forEach(function (d) {
      if (it[d.k]) return;                               /* already decided */
      if (d.k === 'zone' && it.mode !== 'visit') return; /* geography only for someone standing in it */
      var best = null;
      d.vals.forEach(function (v) {
        var probe = snapshotOf(it); probe[d.k] = v;
        var n = matches(probe).length;
        if (!n || n === total) return;                   /* a filter that changes nothing isn't a filter */
        if (!best || n > best.count) best = { k: d.k, v: v, label: valueLabel(d.k, v), count: n };
      });
      if (best) out.push(best);
    });
    return out.sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
  }
  function snapshotOf(it) { var c = {}; for (var k in it) c[k] = it[k]; return c; }

  /* ---------- results: rendered every turn, never gated ---------- */
  function renderResults(opts) {
    opts = opts || {};
    var old = conv.querySelector('.vc-res');
    if (old) { /* one live result view, not a growing pile */
      var oldLbl = old.previousElementSibling;
      if (oldLbl && oldLbl.classList.contains('vc-lbl')) oldLbl.remove();
      old.remove();
    }
    var oldRefine = conv.querySelector('[data-refine]');
    if (oldRefine) { var rl = oldRefine.previousElementSibling; if (rl && rl.classList.contains('vc-lbl')) rl.remove(); oldRefine.remove(); }

    var list = ranked(intent), n = list.length;
    renderState();

    if (!n) {
      say(t('match0'));
      var drops = FACETS.concat(['mode']).filter(function (k) { return intent[k]; }).map(function (k) {
        var probe = snapshotOf(intent); delete probe[k];
        return { k: k, label: fill('without', { x: valueLabel(k, intent[k]) }), count: matches(probe).length };
      }).filter(function (o) { return o.count > 0; });
      if (drops.length) sayChips(drops, function (c) { clearFacet(c.k, true); });
      announce(t('match0'));
      return;
    }

    var top = list.slice(0, 5);
    var res = document.createElement('div');
    res.className = 'vc-res';
    res.innerHTML = '<div class="vc-count">' + esc(countLabel(n)) + (intentLabel(intent) ? ' — ' + esc(intentLabel(intent)) : '') + '</div>' +
      top.map(function (b) {
        var why = whyChips(b, intent), dl = distinctLine(b);
        return '<div class="vc-house"><span class="n">' + esc(b.n) + '</span>' +
          '<span class="a">' + esc(b.area) + '</span>' +
          (shipsWorldwide(b) ? '<span class="vc-ship">' + esc(t('shipBadge')) + '</span>' : '') +
          (b.st !== 'online' ? '<a href="' + esc(FD.mapsUrl(b)) + '" target="_blank" rel="noopener noreferrer">Map ↗</a>' : '') +
          (dl ? '<span class="vc-dist">' + esc(dl) + '</span>' : '') +
          (why.length ? '<span class="vc-why">' + why.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</span>' : '') +
          '</div>';
      }).join('') +
      '<div class="vc-acts">' +
        '<button class="vc-chip" data-act="browse">' + esc(t('browse')) + '</button>' +
        (window.speechSynthesis ? '<button class="vc-chip" data-act="speak">' + esc(t('speak')) + '</button>' : '') +
        '<button class="vc-chip" data-act="again">' + esc(t('again')) + '</button></div>';
    conv.appendChild(res);
    res.querySelector('[data-act=browse]').addEventListener('click', function () {
      close();
      var m = document.getElementById('main');
      if (m) m.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    });
    var sp = res.querySelector('[data-act=speak]');
    if (sp) sp.addEventListener('click', function () { readOut(5); });
    res.querySelector('[data-act=again]').addEventListener('click', function () { resetAll(true); });

    /* the honest answer to "can it reach me" */
    if (intent.mode === 'ship') say(fill('shipNote', { n: list.filter(shipsWorldwide).length }));
    else if (intent.mode === 'visit') say(t('visitNote'));

    var rc = refineChips(intent);
    if (rc.length) {
      var w = sayChips(rc, function (c) {
        pushHistory();
        intent[c.k] = c.v;
        say(c.label, 'me');
        applyAndRender();
      }, t('refineH'));
      w.setAttribute('data-refine', '1');
    }
    conv.scrollTop = conv.scrollHeight;
    announce(fill('a11yApplied', { n: n, x: intentLabel(intent) }));
  }

  function applyAndRender() {
    applyIntent(intent);
    remember();
    renderResults();
  }

  /* ---------- discovery primer ---------- */
  var DISCOVER = [
    { k: 'tailor', intent: { cat: 'tailor' } },
    { k: 'luxury', intent: { cat: 'luxury' } },
    { k: 'bridal', intent: { cat: 'bridal' } },
    { k: 'plant', intent: { fib: 'plant' } },
    { k: 'silk', intent: { fib: 'natural' } },
    { k: 'circular', intent: { cat: 'vintage' } },
    { k: 'women', intent: { cat: 'women' } }
  ];
  function discover() {
    var S = L();
    say(t('discoverH'));
    var wrap = document.createElement('div');
    wrap.className = 'vc-disc';
    DISCOVER.forEach(function (d) {
      var meta = S.disc[d.k] || [d.k, ''];
      var n = matches(d.intent).length;
      if (!n) return;
      var b = document.createElement('button');
      b.className = 'vc-dcard';
      b.innerHTML = '<span class="h">' + esc(meta[0]) + '<b>' + n + '</b></span><span class="d">' + esc(meta[1]) + '</span>';
      b.addEventListener('click', function () {
        wrap.remove();
        say(meta[0], 'me');
        pushHistory();
        for (var k in d.intent) intent[k] = d.intent[k];
        if (d.k === 'tailor') say(t('aodaiGloss'));
        applyAndRender();
      });
      wrap.appendChild(b);
    });
    conv.appendChild(wrap);
  }

  function greet() {
    conv.innerHTML = '';
    intent = {}; history = [];
    renderState();
    say(t('hello'));
    var last = stored().last;
    if (last && last.intent && facetCount(last.intent) && (Date.now() - (last.ts || 0)) < 30 * 864e5) {
      if (last.intent.brandName) {
        var br = BRANDS.filter(function (r) { return r.b.n === last.intent.brandName; })[0];
        if (br) last.intent.brand = br.b;
        delete last.intent.brandName;
      }
      sayChips([{ label: last.label || intentLabel(last.intent), count: matches(last.intent).length }], function (c, btn, w) {
        w.remove();
        intent = last.intent;
        applyAndRender();
      }, t('resume'));
      return;
    }
    discover();
  }

  /* ---------- commands ---------- */
  function clearFacet(k, render) {
    pushHistory();
    delete intent[k];
    if (render) applyAndRender();
  }
  function resetAll(render) {
    pushHistory();
    intent = {};
    if (location.hash) location.hash = '';
    if (render) { conv.innerHTML = ''; say(fill('resetCmd', { n: B.length })); renderState(); discover(); announce(fill('resetCmd', { n: B.length })); }
  }
  function readOut(limit) {
    var list = ranked(intent).slice(0, limit || 5);
    if (!list.length) { say(t('match0')); return; }
    var lead = countLabel(matches(intent).length) + '.';
    speakParts([{ text: lead, lang: recLang }].concat(nameParts(list.map(function (b) { return b.n; }))));
    say(lead + ' ' + list.map(function (b) { return b.n; }).join(', '));
  }
  function doSave(nt) {
    var m = nt.match(RX.firstN), count = m ? parseInt(m[2] || m[3], 10) : 0;
    var picks = [];
    var brand = findBrand(nt.replace(/\b(save|shortlist|add|luu|them)\b/g, '').trim());
    if (brand) picks = [brand];
    else picks = ranked(intent).slice(0, count || 1);
    if (!picks.length) { say(t('match0')); return; }
    if (!window.SS_TRAY) { say(t('trayMissing')); return; }
    picks.forEach(function (b) { try { SS_TRAY.addSaved(b.h || b.n); } catch (e) {} });
    var msg = fill('savedN', { n: picks.length }) + ' ' + picks.map(function (b) { return b.n; }).join(', ');
    say(msg); announce(msg);
  }
  function doRoute() {
    var btn = document.querySelector('.ssrp-open');
    if (!btn) { say(t('routeMissing')); return; }
    say(t('routeGo')); announce(t('routeGo'));
    close(); btn.click();
  }
  function doMap(nt) {
    var brand = findBrand(nt);
    if (brand && brand.st !== 'online') {
      say(fill('mapFor', { x: brand.n }));
      window.open(FD.mapsUrl(brand), '_blank', 'noopener');
      return;
    }
    say(t('mapCmd'));
    if (window.__fdMapOpen) window.__fdMapOpen(true);
    var el = document.getElementById('map');
    if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }
  /* Returns true when the utterance was a state command rather than a search. */
  function runCommand(nt, raw) {
    if (RX.cmdReset.test(nt)) { resetAll(true); return true; }
    if (RX.cmdUndo.test(nt)) {
      if (!history.length) { say(t('nothingUndo')); return true; }
      intent = history.pop();
      say(t('undone'));
      applyIntent(intent); remember(); renderResults();
      return true;
    }
    if (RX.cmdHeard.test(nt)) {
      say(facetCount(intent) || intent.mode ? fill('heard', { x: intentLabel(intent) }) : t('heardNothing'));
      return true;
    }
    if (RX.cmdLang.test(nt)) { setLang(/vietnamese|tieng viet/.test(nt) ? 'vi-VN' : 'en-US'); return true; }
    if (RX.cmdRoute.test(nt)) { doRoute(); return true; }
    if (RX.cmdSave.test(nt) && !/\b(add|them)\b.*\b(filter|loc)\b/.test(nt)) { doSave(nt); return true; }
    if (RX.cmdRead.test(nt)) {
      var m = nt.match(RX.firstN);
      readOut(m ? parseInt(m[2] || m[3], 10) : 5);
      return true;
    }
    if (RX.cmdMap.test(nt) || /^\s*(open|show|mo|xem)\b.*\bmap\b/.test(nt)) { doMap(nt); return true; }
    /* "clear fabric" / "bỏ chất liệu" — an edit of live state, not a new search */
    if (RX.cmdClear.test(nt)) {
      var f = facetNamed(nt);
      if (f) {
        if (!intent[f]) { say(fill('notSet', { x: L().facet[f] || f })); return true; }
        var lbl = valueLabel(f, intent[f]);
        clearFacet(f, true);
        say(fill('cleared', { x: lbl }));
        return true;
      }
    }
    return false;
  }

  /* ---------- low-confidence recovery: interpretations, not a dead end ---------- */
  function guesses(nt) {
    var toks = nt.split(' ').filter(function (w) { return w.length >= 3; });
    if (!toks.length) return [];
    var cands = [];
    REFINE_DIMS.forEach(function (d) {
      d.vals.forEach(function (v) {
        if (v === true) return;
        /* compare against the bare value and each word of its label, not the whole
           label: "brydal" is 1 edit from "bridal" but 10 from "bridal & wedding" */
        var forms = [String(v)].concat(norm(valueLabel(d.k, v)).split(/[^a-z0-9]+/))
          .filter(function (f) { return f && f.length >= 3; });
        var best = 9;
        toks.forEach(function (w) {
          forms.forEach(function (f) { var dd = lev(w, f); if (dd < best) best = dd; });
        });
        if (best <= 2) {
          var probe = snapshotOf(intent); probe[d.k] = v;
          cands.push({ k: d.k, v: v, label: valueLabel(d.k, v), d: best, count: matches(probe).length });
        }
      });
    });
    var brand = findBrand(nt);
    if (brand) cands.push({ k: 'brand', v: brand, label: brand.n, d: 0, count: 1 });
    return cands.filter(function (c) { return c.count > 0; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
  }

  /* ---------- the single entry point ---------- */
  function handle(text) {
    say(text, 'me');
    var nt = norm(text);
    announce(t('processing'));
    if (runCommand(nt, text)) return;

    var brand = findBrand(nt);
    var it = brand ? { brand: brand } : parseFacets(nt);

    if (!facetCount(it) && !it.mode) {
      var g = guesses(nt);
      if (g.length) {
        sayChips(g.map(function (c) { return { label: c.label, count: c.count, k: c.k, v: c.v }; }), function (c) {
          pushHistory();
          intent[c.k] = c.v;
          say(c.label, 'me');
          applyAndRender();
        }, t('guessH'));
      } else {
        say(t('missed'));
        announce(t('missed'));
      }
      return;
    }

    var glossAodai = it.sawAodai && !intent.glossed;
    delete it.sawAodai;
    /* a lone "luxury"/"couture" opens the Luxury & couture group, but refines an
       existing search by tier — "bridal in D3" then "couture" must stay bridal */
    if (it.luxAlone) {
      delete it.luxAlone;
      if (!facetCount(intent)) { it.cat = 'luxury'; delete it.tier; }
    }
    pushHistory();
    for (var k in it) intent[k] = it[k];   /* a follow-up refines, never replaces */
    if (glossAodai) { intent.glossed = true; say(t('aodaiGloss')); }
    applyAndRender();
  }

  function remember() {
    var it = snapshot();
    if (it.brand) { it.brandName = it.brand.n; delete it.brand; }
    store({ last: { intent: it, label: intentLabel(intent), ts: Date.now() } });
  }

  /* ---------- listening (press-to-talk, never always-on) ---------- */
  function toggleListen() {
    if (listening) { stopListen(); return; }
    if (!SR) return;
    rec = new SR();
    rec.lang = recLang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    var interimMsg = null, finalText = '';
    rec.onresult = function (e) {
      var interim = '', fin = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (fin) finalText += fin;
      var shown = (finalText + ' ' + interim).trim();
      if (shown) { /* mirror speech as text, live — never audio-only */
        if (!interimMsg) interimMsg = say('', 'me');
        interimMsg.textContent = shown;
        conv.scrollTop = conv.scrollHeight;
      }
    };
    rec.onerror = function (e) {
      stopListen();
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { say(t('denied')); announce(t('denied')); }
      else if (e.error === 'no-speech') { say(t('noSpeech')); announce(t('noSpeech')); }
    };
    rec.onend = function () {
      var was = listening;
      stopListen();
      if (interimMsg) { interimMsg.remove(); interimMsg = null; }
      var txt = finalText.trim();
      if (txt) handle(txt);
      else if (was) { say(t('noSpeech')); announce(t('noSpeech')); }
    };
    listening = true;
    micBtn.classList.add('on');
    micBtn.setAttribute('aria-pressed', 'true');
    micBtn.setAttribute('aria-label', t('micStop'));
    input.placeholder = t('listening');
    announce(t('listening'));
    vibrate(10);
    try { rec.start(); } catch (e) { stopListen(); }
  }
  function stopListen() {
    listening = false;
    if (micBtn) {
      micBtn.classList.remove('on');
      micBtn.setAttribute('aria-pressed', 'false');
      micBtn.setAttribute('aria-label', t('mic'));
    }
    if (input) input.placeholder = t('typed');
    vibrate(6);
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
  }

  /* ---------- open / close ---------- */
  var isOpen = false, hideTimer = null;
  function open() {
    if (isOpen) { input.focus(); return; }
    isOpen = true;
    clearTimeout(hideTimer);
    buildPanel();
    greet();
    if (!SR) say(t('noSR'));
    panel.hidden = false;
    requestAnimationFrame(function () { if (isOpen) panel.classList.remove('off'); });
    fab.setAttribute('aria-expanded', 'true');
    input.focus();
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    stopListen();
    stopSpeaking();
    panel.classList.add('off');
    hideTimer = setTimeout(function () { if (!isOpen) panel.hidden = true; }, RM ? 0 : 240);
    fab.setAttribute('aria-expanded', 'false');
    fab.focus();
  }
  fab.addEventListener('click', function () { isOpen ? close() : open(); });

  /* Keyboard parity: focus is not recording. Cmd/Ctrl+Space opens and focuses;
     only Cmd/Ctrl+Shift+Space actually opens the microphone. */
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (listening) { stopListen(); return; }
      if (isOpen) close();
      return;
    }
    if (e.code === 'Space' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (e.shiftKey) { if (!isOpen) open(); toggleListen(); }
      else if (!isOpen) open(); else input.focus();
    }
  });

  window.SS_VOICE = { open: open };
})();

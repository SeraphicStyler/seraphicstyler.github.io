/* Seraphic Styler — the style profile.
   The intake instrument the tiers promise: The Discovery's short style
   intake (depth 1), The Edit's consultation (depth 2), and the full profile
   behind The Capsule & Atelier (depth 3).

   Self-rendering, so one instrument serves three homes: the standalone page
   (style-profile.html), the popup on the home page, and any link that points
   at it. Deliberately storage-free — answers live in the page and go only to
   her, only on send, through the same Tally form as every other funnel
   (hidden field `style`).

   The send step now ends on a result card built to be screenshotted: the
   direction read back from the answers, then the answers themselves, with a
   short reference code so a picture in her DMs matches a payment.

   API:  SSProfile.mount(el, {tier, from})   → renders the instrument
         SSProfile.open({tier, from})        → renders it inside the popup
*/
(function () {
  'use strict';

  var TALLY_ID = 'gD10Kl';
  var TALLY = 'https://tally.so/r/' + TALLY_ID;
  var EMAIL = 'seraphicstyler@gmail.com';
  var IG = 'https://instagram.com/seraphicstyler';
  var DEPTH_OF = { discovery: 1, edit: 2, capsule: 3, atelier: 3 };
  var LABEL_OF = { discovery: 'The Discovery', edit: 'The Edit', capsule: 'The Capsule', atelier: 'The Atelier' };
  var DEPTH_LABEL = { 1: 'The short style intake', 2: 'The consultation', 3: 'The full style match' };
  var MINS = { 1: 'About two minutes', 2: 'About four minutes', 3: 'About six minutes' };

  var MARK = '<svg class="brand-mark" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22.3,27.0 C18.4,18.0 21.6,8.4 31.6,6.6 C38.2,5.4 41.0,11.4 37.8,18.0 C35.0,24.2 28.6,27.4 23.0,28.6 Z"/><path d="M22.6,29.4 C26.8,31.2 32.2,33.0 35.0,38.0 C36.6,40.8 36.0,43.8 33.6,43.4 C29.6,42.7 25.0,35.6 22.4,30.4 Z"/><path d="M22.3,27.0 C21.5,28.8 21.5,30.6 22.6,32.2"/><path d="M22.3,27.0 C19.9,22.2 17.2,18.4 13.4,16.4"/><path d="M22.3,27.0 C20.6,21.8 18.8,17.2 16.0,13.8"/><circle cx="13.4" cy="16.4" r="1.2" fill="currentColor" stroke="none"/><circle cx="16.0" cy="13.8" r="1.2" fill="currentColor" stroke="none"/></svg>';

  /* ── The questions ──────────────────────────────────────────────
     Voice switches between "them" (a gift) and "you" (for themselves)
     the moment the first chip is pressed — the same questions, asked
     the way the answerer would say them. */
  var Q = [
    { k: 'who', min: 1, single: true, legend: { them: 'Who is this for?', me: 'Who is this for?' },
      chips: [['It’s a gift', 'A gift'], ['It’s for me', 'For myself']],
      fields: [{ id: 'spName', label: { them: 'Their first name', me: 'Your first name' }, opt: true, ph: 'Mai' }] },

    { k: 'days', min: 1, legend: { them: 'What do their weeks hold?', me: 'What do your weeks hold?' },
      chips: [['Work & meetings'], ['Café days & errands'], ['Evenings out'], ['Travel'], ['Celebrations ahead'], ['Quiet days at home']] },

    { k: 'drawn', min: 1, legend: { them: 'What are they drawn to?', me: 'What are you drawn to?' },
      hint: 'Pick one or two — whichever you choose first leads.',
      chips: [['Soft & feminine'], ['Minimal & clean'], ['Romantic coquette'], ['Modern áo dài'], ['Easy street style'], ['Vintage soul'], ['Quiet neutrals'], ['Bold colour']],
      note: 'In plain terms — <b>Modern áo dài</b> is the traditional cut reworked for every day; <b>Vintage soul</b> means old-world pieces and second-hand finds; <b>Romantic coquette</b> is ribbons, lace and soft frills.' },

    { k: 'colours', min: 1, legend: { them: 'Colours', me: 'Colours' },
      hint: 'Whole families are fine — soft pastels, jewel tones, warm neutrals.',
      fields: [
        { id: 'spColLove', label: { them: 'Colours to love', me: 'Colours to love' }, ph: 'cream, sage, soft blue', half: true },
        { id: 'spColAvoid', label: { them: 'Colours to avoid', me: 'Colours to avoid' }, ph: 'neon, very bright red', half: true }
      ] },

    { k: 'loved', min: 1, legend: { them: 'One piece they already love', me: 'One piece you already love' },
      fields: [
        { id: 'spLoved', label: { them: 'In a few words', me: 'In a few words' }, ph: 'The black áo dài she wears to every event' },
        { id: 'spLovedLink', label: { them: 'A link, if you have one', me: 'A link, if you have one' }, opt: true, ph: 'instagram.com/p/…' }
      ] },

    { k: 'fit', min: 2, legend: { them: 'Fit & silhouette', me: 'Fit & silhouette' },
      chips: [['Fitted & tailored'], ['Relaxed & flowing'], ['Cropped is fine'], ['Longer lengths'], ['High-waisted'], ['Modest cuts']] },

    { k: 'fabric', min: 2, legend: { them: 'Fabric feelings', me: 'Fabric feelings' },
      chips: [['Linen'], ['Cotton'], ['Silk'], ['Breathable for heat'], ['No wool'], ['No preference']] },

    { k: 'sizes', min: 2, legend: { them: 'Sizes, if known <em>— not required</em>', me: 'Sizes, if known <em>— not required</em>' },
      fields: [{ id: 'spSizes', label: { them: 'Anything you know', me: 'Anything you know' }, ph: 'US 6 · usually a medium · tall' }],
      note: 'Not sure? The <a href="./#sizing">quick size check</a> reads it from measurements — and I confirm real garment measurements before anything is bought.' },

    { k: 'job', min: 3, legend: { them: 'What should this wardrobe do?', me: 'What should this wardrobe do?' },
      chips: [['A mix-and-match capsule'], ['Looks for an occasion'], ['Refreshing the everyday'], ['A new chapter']] },

    { k: 'never', min: 3, legend: { them: 'The never-wear list', me: 'The never-wear list' },
      fields: [{ id: 'spNever', type: 'textarea', sr: 'Never-wear list', ph: 'No strapless, nothing scratchy, no logos…' }] },

    { k: 'timing', min: 3, legend: { them: 'Timing', me: 'Timing' },
      fields: [{ id: 'spTiming', label: { them: 'Any date this should be ready for?', me: 'Any date this should be ready for?' }, ph: 'A wedding on 20 September' }] }
  ];

  /* Four to six short rooms rather than one long corridor — each gated by the
     same depth as the questions inside it. */
  var SECTIONS = [
    { min: 1, title: { them: 'About them', me: 'About you' }, keys: ['who'] },
    { min: 1, title: { them: 'Their days', me: 'Your days' }, keys: ['days'] },
    { min: 1, title: { them: 'What they’re drawn to', me: 'What you’re drawn to' }, keys: ['drawn'] },
    { min: 1, title: { them: 'Colour & references', me: 'Colour & references' }, keys: ['colours', 'loved'] },
    { min: 2, title: { them: 'Fit & fabric', me: 'Fit & fabric' }, keys: ['fit', 'fabric', 'sizes'] },
    { min: 3, title: { them: 'The finer points', me: 'The finer points' }, keys: ['job', 'never', 'timing'] }
  ];

  /* Phrase tables — how a chip reads inside a sentence rather than on a pill. */
  var AESTHETIC = {
    'Soft & feminine': 'soft, feminine', 'Minimal & clean': 'quiet and minimal', 'Romantic coquette': 'romantic',
    'Modern áo dài': 'modern áo dài', 'Easy street style': 'easy, street-leaning', 'Vintage soul': 'vintage-souled',
    'Quiet neutrals': 'neutral', 'Bold colour': 'colour-forward'
  };
  var FIT_PHRASE = {
    'Fitted & tailored': 'cut close', 'Relaxed & flowing': 'relaxed and flowing', 'Cropped is fine': 'happy cropped',
    'Longer lengths': 'in longer lengths', 'High-waisted': 'high-waisted', 'Modest cuts': 'modestly cut'
  };
  var FABRIC_PHRASE = { 'Linen': 'linen', 'Cotton': 'cotton', 'Silk': 'silk', 'Breathable for heat': 'fabrics that breathe in the heat' };
  var DAY_PHRASE = {
    'Work & meetings': 'work and meetings', 'Café days & errands': 'café days', 'Evenings out': 'evenings out',
    'Travel': 'travel', 'Celebrations ahead': 'a celebration ahead', 'Quiet days at home': 'quiet days at home'
  };
  var JOB_PHRASE = {
    'A mix-and-match capsule': 'a capsule that mixes and matches', 'Looks for an occasion': 'looks for an occasion',
    'Refreshing the everyday': 'a refreshed everyday', 'A new chapter': 'a new chapter'
  };

  /* A small colour vocabulary, so the card can show a swatch instead of a word. */
  var SWATCH = {
    cream: '#f6efe2', ivory: '#f7f3ea', white: '#ffffff', black: '#1c1c1c', charcoal: '#3a3f47', grey: '#9aa0a8', gray: '#9aa0a8',
    silver: '#c9ced6', navy: '#22304f', cobalt: '#2e54ad', blue: '#7ba7d7', sky: '#bcd8f0', denim: '#4a6fa5', teal: '#4a8c8c',
    turquoise: '#62c3c3', sage: '#b4c2ac', green: '#6f8f6a', emerald: '#2f7d5c', olive: '#7e8459', mint: '#bfe0cd', khaki: '#b3a679',
    blush: '#f1bcd3', pink: '#f3a8c8', rose: '#e7a2ac', coral: '#f08a72', red: '#c0392b', burgundy: '#6d2733', wine: '#6d2733',
    plum: '#6b4160', purple: '#7f5fa8', violet: '#8a6fc0', lavender: '#c9b6e8', lilac: '#c9b6e8', peach: '#f6c6a8', apricot: '#f3b98d',
    orange: '#e08a45', terracotta: '#c2724f', yellow: '#ecd27a', lemon: '#f2e28a', mustard: '#d0a92b', gold: '#c9a54d', bronze: '#a2763f',
    brown: '#7a5a42', chocolate: '#4e342e', camel: '#c8a479', beige: '#e6d9c6', taupe: '#b8a894', nude: '#e3c9b6', neon: '#d4ff33'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function list(arr, join) {
    arr = arr.filter(Boolean);
    if (arr.length < 2) return arr[0] || '';
    return arr.slice(0, -1).join(', ') + ' ' + (join || 'and') + ' ' + arr[arr.length - 1];
  }

  /* ── Markup ─────────────────────────────────────────────────────── */
  function fieldHTML(f, voice) {
    var label = f.sr
      ? '<span class="sr-only">' + esc(f.sr) + '</span>'
      : '<span>' + esc(f.label[voice]) + (f.opt ? ' <em style="text-transform:none;letter-spacing:0">(optional)</em>' : '') + '</span>';
    var input = f.type === 'textarea'
      ? '<textarea id="' + f.id + '" rows="2" placeholder="' + esc(f.ph) + '"></textarea>'
      : '<input type="text" id="' + f.id + '" autocomplete="off" placeholder="' + esc(f.ph) + '">';
    return '<label class="sp-field">' + label + input + '</label>';
  }

  function questionHTML(q, voice) {
    var h = '<fieldset class="sp-q" data-min="' + q.min + '" data-k="' + q.k + '">';
    h += '<legend>' + q.legend[voice] + '</legend>';
    if (q.hint) h += '<p class="sp-hint">' + q.hint + '</p>';
    if (q.chips) {
      h += '<div class="sp-chips"' + (q.single ? ' data-single' : '') + '>';
      q.chips.forEach(function (c) {
        h += '<button type="button" class="sp-chip" data-v="' + esc(c[1] || c[0]) + '" aria-pressed="false">' + esc(c[0]) + '</button>';
      });
      h += '</div>';
    }
    if (q.fields) {
      var two = q.fields.length > 1 && q.fields[0].half;
      h += '<div class="sp-fields' + (two ? ' two' : '') + '"' + (q.chips ? ' style="margin-top:0.75rem"' : '') + '>';
      q.fields.forEach(function (f) { h += fieldHTML(f, voice); });
      h += '</div>';
    }
    if (q.note) h += '<p class="sp-note">' + q.note + '</p>';
    return h + '</fieldset>';
  }

  function shellHTML(voice) {
    var h = '<div class="sp-depths"><div class="vn-seg" role="group" data-sp="depth" aria-label="How deep should we go?">' +
      '<button type="button" data-depth="1" aria-pressed="false">The Discovery · short intake</button>' +
      '<button type="button" data-depth="2" aria-pressed="true">The Edit · consultation</button>' +
      '<button type="button" data-depth="3" aria-pressed="false">The Capsule &amp; Atelier · full match</button>' +
      '</div></div>' +
      '<p class="sp-mins" data-sp="mins">About four minutes.</p>' +
      '<form class="sp-form" data-sp="form" novalidate>';
    SECTIONS.forEach(function (sec, si) {
      var inner = '';
      sec.keys.forEach(function (k) {
        var q = null;
        Q.forEach(function (item) { if (item.k === k) q = item; });
        if (q) inner += questionHTML(q, voice);
      });
      if (!inner) return;
      h += '<section class="sp-sec" data-min="' + sec.min + '" data-sec="' + si + '">' +
        '<h3 class="sp-sec-h">' + esc(sec.title[voice]) + '</h3>' + inner + '</section>';
    });
    h += '</form>' +
      '<div class="glass sp-send" data-sp="send">' +
      '<p class="sp-privacy">Your answers are sent only to me, and copied to your clipboard — nothing is stored on this site.</p>' +
      '<button class="btn btn-primary btn-lg" type="button" data-sp="see" style="min-width:min(100%,22rem)">See the profile →</button>' +
      '<p class="sp-next">Send it and I reply within one to two business days with a first direction — and what I would look for.</p>' +
      '<p class="sp-copied" data-sp="msg" role="status"></p>' +
      '</div>' +
      '<div class="sp-result" data-sp="result" hidden></div>';
    return h;
  }

  /* ── An instance ────────────────────────────────────────────────── */
  function mount(el, opts) {
    opts = opts || {};
    var tier = (opts.tier || '').toLowerCase();
    var tierLabel = LABEL_OF[tier] || null;
    var depth = DEPTH_OF[tier] || 2;
    var voice = 'them';

    el.classList.add('sp-root');
    el.innerHTML = shellHTML(voice);

    var form = el.querySelector('[data-sp="form"]');
    var depthSeg = el.querySelector('[data-sp="depth"]');
    var minsEl = el.querySelector('[data-sp="mins"]');
    var sendPanel = el.querySelector('[data-sp="send"]');
    var seeBtn = el.querySelector('[data-sp="see"]');
    var msgEl = el.querySelector('[data-sp="msg"]');
    var resultEl = el.querySelector('[data-sp="result"]');

    function q(k) { return form.querySelector('.sp-q[data-k="' + k + '"]'); }
    /* Chips answer in the order they were pressed, not the order they were
       drawn — so "whichever you choose first leads" is true of the direction
       sentence and the card. */
    var pickSeq = 0;
    function pressed(k) {
      var fs = q(k);
      if (!fs) return [];
      var on = Array.prototype.slice.call(fs.querySelectorAll('.sp-chip[aria-pressed="true"]'));
      on.sort(function (a, b) {
        return (parseInt(a.getAttribute('data-pick'), 10) || 0) - (parseInt(b.getAttribute('data-pick'), 10) || 0);
      });
      return on.map(function (c) { return c.getAttribute('data-v') || c.textContent.trim(); });
    }
    function val(id) { var f = el.querySelector('#' + id); return f ? f.value.trim() : ''; }
    function visible(min) { return depth >= min; }

    /* progress — a gentle count, never a bar racing to 100% */
    function answered() {
      var n = 0;
      Q.forEach(function (item) {
        if (item.min > depth || item.k === 'who') return;
        var got = pressed(item.k).length > 0;
        if (!got && item.fields) got = item.fields.some(function (f) { return val(f.id); });
        if (got) n++;
      });
      return n;
    }
    function totalQs() { return Q.filter(function (item) { return item.min <= depth && item.k !== 'who'; }).length; }
    function refreshMins() {
      var n = answered();
      minsEl.innerHTML = MINS[depth] + '.' + (n ? ' <b>' + n + ' of ' + totalQs() + ' answered</b>' : '');
    }

    function setDepth(d) {
      depth = d;
      el.setAttribute('data-depth', String(d));
      depthSeg.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-depth') === String(d) ? 'true' : 'false');
      });
      refreshMins();
    }

    function setVoice(v) {
      if (v === voice) return;
      voice = v;
      SECTIONS.forEach(function (sec, i) {
        var hEl = el.querySelector('.sp-sec[data-sec="' + i + '"] .sp-sec-h');
        if (hEl) hEl.textContent = sec.title[voice];
      });
      Q.forEach(function (item) {
        var fs = q(item.k);
        if (!fs) return;
        var lg = fs.querySelector('legend');
        if (lg) lg.innerHTML = item.legend[voice];
        (item.fields || []).forEach(function (f) {
          if (f.sr || !f.label) return;
          var lbl = el.querySelector('#' + f.id);
          var span = lbl && lbl.parentElement.querySelector('span');
          if (span) span.innerHTML = esc(f.label[voice]) + (f.opt ? ' <em style="text-transform:none;letter-spacing:0">(optional)</em>' : '');
        });
      });
    }

    depthSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-depth]');
      if (b) setDepth(parseInt(b.getAttribute('data-depth'), 10));
    });

    form.addEventListener('click', function (e) {
      var chip = e.target.closest('.sp-chip');
      if (!chip) return;
      e.preventDefault();
      var group = chip.parentElement;
      var on = chip.getAttribute('aria-pressed') === 'true';
      if (group.hasAttribute('data-single')) {
        group.querySelectorAll('.sp-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); c.removeAttribute('data-pick'); });
        chip.setAttribute('aria-pressed', on ? 'false' : 'true');
      } else {
        chip.setAttribute('aria-pressed', on ? 'false' : 'true');
      }
      if (chip.getAttribute('aria-pressed') === 'true') chip.setAttribute('data-pick', String(++pickSeq));
      else chip.removeAttribute('data-pick');
      if (group.closest('.sp-q[data-k="who"]')) setVoice(pressed('who')[0] === 'For myself' ? 'me' : 'them');
      refreshMins();
    });
    form.addEventListener('input', refreshMins);
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    /* ── What the answers say ──────────────────────────────────────── */
    function direction() {
      var drawn = pressed('drawn').slice(0, 2).map(function (v) { return AESTHETIC[v] || v.toLowerCase(); });
      var fab = pressed('fabric');
      var cloth = fab.map(function (v) { return v === 'Breathable for heat' ? null : FABRIC_PHRASE[v]; }).filter(Boolean);
      var heat = fab.indexOf('Breathable for heat') > -1;
      var fitv = pressed('fit')[0];
      var days = pressed('days').slice(0, 2).map(function (v) { return DAY_PHRASE[v] || v.toLowerCase(); });
      var job = visible(3) ? pressed('job')[0] : null;

      var s = '';
      if (drawn.length) s = list(drawn) + ' pieces';
      else if (cloth.length || fitv || heat) s = 'Pieces';
      if (!s) {
        if (days.length) return cap('A wardrobe for ' + list(days) + ' — the rest we shape together.');
        return 'A direction we’ll shape together — tell me the rest when you write.';
      }
      if (visible(2)) {
        if (cloth.length) s += ' in ' + list(cloth.slice(0, 2));
        else if (heat) s += ' in fabrics that breathe';
        if (fitv) s += ', ' + FIT_PHRASE[fitv];
      }
      if (days.length) s += ' — for ' + list(days);
      s += '.';
      if (job && JOB_PHRASE[job]) s += ' Toward ' + JOB_PHRASE[job] + '.';
      return cap(s);
    }

    function swatches(text, negative) {
      if (!text) return '';
      return text.split(/[,;/]|·/).map(function (part) {
        var word = part.trim();
        if (!word) return '';
        var hex = '';
        var lower = word.toLowerCase();
        Object.keys(SWATCH).forEach(function (key) { if (!hex && lower.indexOf(key) > -1) hex = SWATCH[key]; });
        return '<span class="sp-tag' + (negative ? ' no' : '') + '">' +
          (hex ? '<span class="sw" style="background:' + hex + '"></span>' : '') + esc(word) + '</span>';
      }).join('');
    }
    function tags(arr) {
      if (!arr.length) return '';
      return '<div class="sp-tags">' + arr.map(function (v) { return '<span class="sp-tag">' + esc(v) + '</span>'; }).join('') + '</div>';
    }
    function row(label, inner) { return inner ? '<div class="sp-card-row"><dt>' + esc(label) + '</dt><dd>' + inner + '</dd></div>' : ''; }
    function textRow(label, v) { return v ? row(label, esc(v)) : ''; }

    function refCode(seed) {
      var h = 0, i;
      for (i = 0; i < seed.length; i++) { h = (h * 31 + seed.charCodeAt(i)) >>> 0; }
      var n = (h ^ (Math.floor(Date.now() / 60000) >>> 0)) >>> 0;
      return 'SP-' + ('0000' + n.toString(36).toUpperCase()).slice(-4);
    }

    /* Plain text — what lands on the clipboard, in her inbox, and in the form. */
    function compose(ref) {
      var who = pressed('who')[0] || '';
      var name = val('spName');
      var lines = ['Style profile — ' + (tierLabel || DEPTH_LABEL[depth])];
      if (who || name) lines[0] += ' (' + [who ? who.toLowerCase() : '', name ? 'for ' + name : ''].filter(Boolean).join(', ') + ')';
      lines.push('Direction: ' + direction());
      var add = function (label, v) { if (v && v.length) lines.push(label + ': ' + (Array.isArray(v) ? v.join(', ') : v)); };
      add(voice === 'me' ? 'My days' : 'Their days', pressed('days'));
      add('Drawn to', pressed('drawn'));
      var love = val('spColLove'), avoid = val('spColAvoid');
      if (love || avoid) lines.push('Colours — love: ' + (love || '—') + ' · avoid: ' + (avoid || '—'));
      add('A piece already loved', [val('spLoved'), val('spLovedLink')].filter(Boolean).join(' — '));
      if (visible(2)) {
        add('Fit', pressed('fit'));
        add('Fabrics', pressed('fabric'));
        add('Sizes', val('spSizes'));
      }
      if (visible(3)) {
        add('Wardrobe job', pressed('job'));
        add('Never-wear', val('spNever'));
        add('Ready by', val('spTiming'));
      }
      if (ref) lines.push('Ref ' + ref);
      return lines;
    }

    function hasAnswers() {
      if (answered() > 0) return true;
      return !!val('spName');
    }

    /* ── The card ──────────────────────────────────────────────────── */
    var lastText = '', lastRef = '';

    function buildCard() {
      var name = val('spName');
      var mine = pressed('who')[0] === 'For myself';
      var title = name ? 'For ' + name : (mine ? 'For me' : 'A style profile');
      var tierLine = (tierLabel ? tierLabel + ' · ' : '') + DEPTH_LABEL[depth];
      var love = val('spColLove'), avoid = val('spColAvoid');

      lastRef = refCode(compose('').join('|'));
      lastText = compose(lastRef).join('\n');

      var rows = '';
      rows += row(mine ? 'My days' : 'Their days', tags(pressed('days')));
      rows += row('Drawn to', tags(pressed('drawn')));
      if (love) rows += row('Colours to love', '<div class="sp-tags">' + swatches(love, false) + '</div>');
      if (avoid) rows += row('Colours to avoid', '<div class="sp-tags">' + swatches(avoid, true) + '</div>');
      if (visible(2)) {
        rows += row('Fit', tags(pressed('fit')));
        rows += row('Fabrics', tags(pressed('fabric')));
        rows += textRow('Sizes', val('spSizes'));
      }
      rows += textRow(mine ? 'A piece I love' : 'A piece already loved', [val('spLoved'), val('spLovedLink')].filter(Boolean).join(' — '));
      if (visible(3)) {
        rows += row('The wardrobe’s job', tags(pressed('job')));
        rows += textRow('Never-wear', val('spNever'));
        rows += textRow('Ready by', val('spTiming'));
      }
      resultEl.innerHTML =
        '<article class="sp-card" tabindex="-1">' +
          '<div class="sp-card-head">' + MARK +
            '<span class="sp-card-brand">Seraphic</span>' +
            '<span class="sp-card-kicker">Styler</span>' +
          '</div>' +
          '<h3 class="sp-card-title">' + esc(title) + '</h3>' +
          '<p class="sp-card-tier">' + esc(tierLine) + '</p>' +
          '<p class="sp-card-direction">' + esc(direction()) + '</p>' +
          '<hr class="sp-card-rule">' +
          '<dl class="sp-card-rows">' + rows + '</dl>' +
          '<div class="sp-card-foot"><span class="sp-card-ref">' + esc(lastRef) + '</span><span>seraphicstyler.com</span></div>' +
        '</article>' +
        '<p class="sp-shot">Screenshot this card and send it to me on <a href="' + IG + '" target="_blank" rel="noopener">Instagram</a> — or use a button below. Nothing is bought without a yes.</p>' +
        '<div class="sp-actions">' +
          '<button class="btn btn-primary" type="button" data-sp="send-form">Send it to me →</button>' +
          '<button class="btn btn-ghost" type="button" data-sp="copy">Copy as text</button>' +
          '<a class="btn btn-ghost" data-sp="email" href="#">Email it</a>' +
        '</div>' +
        '<button class="sp-back" type="button" data-sp="back">← Change an answer</button>';

      var mailto = 'mailto:' + EMAIL +
        '?subject=' + encodeURIComponent('Style profile — ' + (tierLabel || DEPTH_LABEL[depth]) + ' (' + lastRef + ')') +
        '&body=' + encodeURIComponent(lastText);
      resultEl.querySelector('[data-sp="email"]').setAttribute('href', mailto);
      return resultEl;
    }

    function showResult() {
      if (!hasAnswers()) {
        msgEl.textContent = 'Answer anything above first — even one line is a beginning.';
        msgEl.style.display = 'block';
        return;
      }
      buildCard();
      form.hidden = true;
      sendPanel.hidden = true;
      el.querySelector('.sp-depths').hidden = true;
      minsEl.hidden = true;
      resultEl.hidden = false;
      var card = resultEl.querySelector('.sp-card');
      if (card) card.focus({ preventScroll: true });
      var ov = el.closest('.sp-overlay');
      if (ov) ov.scrollTo({ top: 0, behavior: 'smooth' });
      else if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showForm() {
      resultEl.hidden = true;
      form.hidden = false;
      sendPanel.hidden = false;
      el.querySelector('.sp-depths').hidden = false;
      minsEl.hidden = false;
      msgEl.style.display = 'none';
    }

    function sendToForm() {
      var about = 'Style profile — ' + (tierLabel || DEPTH_LABEL[depth]);
      var fields = { about: about, style: lastText, ref: lastRef, source: 'style-profile' + (opts.from ? '-' + opts.from : '') };
      if (navigator.clipboard) navigator.clipboard.writeText(lastText).catch(function () {});
      if (window.Tally) {
        window.Tally.openPopup(TALLY_ID, { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000, hiddenFields: fields });
      } else {
        window.open(TALLY + '?about=' + encodeURIComponent(about) +
          '&style=' + encodeURIComponent(lastText.slice(0, 5000)) +
          '&ref=' + encodeURIComponent(lastRef) +
          '&source=' + encodeURIComponent(fields.source), '_blank', 'noopener');
      }
    }

    resultEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sp]');
      if (!b) return;
      var what = b.getAttribute('data-sp');
      if (what === 'back') { showForm(); }
      else if (what === 'send-form') { sendToForm(); }
      else if (what === 'copy') {
        if (navigator.clipboard) navigator.clipboard.writeText(lastText).then(function () {
          b.textContent = '✓ Copied';
          setTimeout(function () { b.textContent = 'Copy as text'; }, 2200);
        }).catch(function () {});
      }
    });

    seeBtn.addEventListener('click', showResult);

    setDepth(depth);
    return { el: el, setDepth: setDepth };
  }

  /* ── The popup ──────────────────────────────────────────────────── */
  var overlay = null, lastFocus = null;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'sp-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="sp-dialog" role="dialog" aria-modal="true" aria-labelledby="spDialogTitle">' +
        '<button class="sp-dialog-close" type="button" aria-label="Close the style profile">✕</button>' +
        '<div class="sp-head">' +
          '<span class="badge-pill">The style profile</span>' +
          '<h2 id="spDialogTitle">Tell me about them — or about you</h2>' +
          '<p>A quiet intake about days, taste and fit — never weight, never a verdict. Answer what you can; skip what you can’t. It ends on a card you can screenshot and send me.</p>' +
        '</div>' +
        '<div class="sp-mount"></div>' +
        '<span class="sp-standalone"><a href="style-profile.html">Open it as its own page →</a></span>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('.sp-dialog-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function open(opts) {
    if (!overlay) buildOverlay();
    lastFocus = document.activeElement;
    var host = overlay.querySelector('.sp-mount');
    host.innerHTML = '';
    mount(host, opts || {});
    var link = overlay.querySelector('.sp-standalone a');
    var qs = [];
    if (opts && opts.tier) qs.push('tier=' + encodeURIComponent(opts.tier));
    if (opts && opts.from) qs.push('from=' + encodeURIComponent(opts.from));
    link.setAttribute('href', 'style-profile.html' + (qs.length ? '?' + qs.join('&') : ''));
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sp-locked');
    var close_ = overlay.querySelector('.sp-dialog-close');
    if (close_) close_.focus();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('sp-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.SSProfile = { mount: mount, open: open, close: close };

  /* Auto-mount: any element with [data-style-profile] hosts the instrument.
     On the standalone page, tier/from come from the query string. */
  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(location.search);
    document.querySelectorAll('[data-style-profile]').forEach(function (host) {
      mount(host, { tier: host.getAttribute('data-tier') || params.get('tier') || '', from: params.get('from') || '' });
    });

    /* Links pointing at the profile open the popup instead of navigating —
       the href stays as the no-JS (and new-tab) fallback. */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="style-profile"]');
      if (!a || document.querySelector('[data-style-profile]')) return;
      if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || a.closest('.sp-dialog')) return;
      e.preventDefault();
      var qs = new URLSearchParams((a.getAttribute('href').split('?')[1] || ''));
      open({ tier: qs.get('tier') || '', from: qs.get('from') || 'home' });
    });
  });
})();

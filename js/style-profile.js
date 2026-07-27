/* Seraphic Styler — the style profile.
   The intake instrument the tiers promise: The Discovery's short style
   intake (depth 1), The Edit's consultation (depth 2), and the full profile
   behind The Capsule & Atelier (depth 3). Deliberately storage-free —
   answers live in the page and go only to her, only on send, through the
   same Tally form as every other funnel (hidden field `style`). */
(function () {
  'use strict';

  var TALLY = 'https://tally.so/r/gD10Kl';
  var DEPTH_OF = { discovery: 1, edit: 2, capsule: 3, atelier: 3 };
  var LABEL_OF = { discovery: 'The Discovery', edit: 'The Edit', capsule: 'The Capsule', atelier: 'The Atelier' };
  var MINS = { 1: 'About two minutes.', 2: 'About four minutes.', 3: 'About six minutes.' };

  var form = document.getElementById('spForm');
  var depthSeg = document.getElementById('spDepth');
  var minsEl = document.getElementById('spMins');
  var sendBtn = document.getElementById('spSend');
  var copiedEl = document.getElementById('spCopied');
  if (!form || !depthSeg || !sendBtn) return;

  var params = new URLSearchParams(location.search);
  var tier = (params.get('tier') || '').toLowerCase();
  var tierLabel = LABEL_OF[tier] || null;
  var depth = DEPTH_OF[tier] || 2;

  function setDepth(d) {
    depth = d;
    document.body.setAttribute('data-depth', String(d));
    depthSeg.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-depth') === String(d) ? 'true' : 'false');
    });
    if (minsEl) minsEl.textContent = MINS[d];
  }

  depthSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-depth]');
    if (b) setDepth(parseInt(b.getAttribute('data-depth'), 10));
  });

  /* chips — aria-pressed toggles; [data-single] groups behave like radios */
  form.addEventListener('click', function (e) {
    var chip = e.target.closest('.sp-chip');
    if (!chip) return;
    e.preventDefault();
    var group = chip.parentElement;
    var on = chip.getAttribute('aria-pressed') === 'true';
    if (group.hasAttribute('data-single')) {
      group.querySelectorAll('.sp-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      chip.setAttribute('aria-pressed', on ? 'false' : 'true');
    } else {
      chip.setAttribute('aria-pressed', on ? 'false' : 'true');
    }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  function pressed(k) {
    var fs = form.querySelector('.sp-q[data-k="' + k + '"]');
    if (!fs) return [];
    return Array.prototype.map.call(fs.querySelectorAll('.sp-chip[aria-pressed="true"]'), function (c) {
      return c.getAttribute('data-v') || c.textContent.trim();
    });
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function visible(minDepth) { return depth >= minDepth; }

  function compose() {
    var who = pressed('who')[0] || '';
    var name = val('spName');
    var title = 'Style profile — ' + (tierLabel || ['', 'The Discovery', 'The Edit', 'The Capsule'][depth]);
    var sub = [];
    if (who) sub.push(who.toLowerCase());
    if (name) sub.push('for ' + name);
    var lines = [title + (sub.length ? ' (' + sub.join(', ') + ')' : '')];
    var add = function (label, v) { if (v && v.length) lines.push(label + ': ' + (Array.isArray(v) ? v.join(', ') : v)); };
    add('Days', pressed('days'));
    add('Drawn to', pressed('drawn'));
    var love = val('spColLove'), avoid = val('spColAvoid');
    if (love || avoid) lines.push('Colours — love: ' + (love || '—') + ' · avoid: ' + (avoid || '—'));
    add('A piece they love', val('spLoved'));
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
    if (lines.length === 1) return null; // nothing answered yet
    return lines.join('\n');
  }

  function send() {
    var text = compose();
    if (!text) {
      if (copiedEl) {
        copiedEl.textContent = 'Answer anything above first — even one line is a beginning.';
        copiedEl.style.display = 'block';
      }
      return;
    }
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
    var about = 'Style profile — ' + (tierLabel || 'a styling tier');
    var fields = { about: about, style: text, source: 'style-profile' + (params.get('from') ? '-' + params.get('from') : '') };
    if (copiedEl) {
      copiedEl.textContent = '✓ Profile copied & opened pre-filled in the form.';
      copiedEl.style.display = 'block';
    }
    if (window.Tally) {
      window.Tally.openPopup('gD10Kl', { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000, hiddenFields: fields });
    } else {
      var url = TALLY + '?about=' + encodeURIComponent(about) + '&style=' + encodeURIComponent(text.length < 5000 ? text : text.slice(0, 5000)) + '&source=' + encodeURIComponent(fields.source);
      window.open(url, '_blank', 'noopener');
    }
  }
  sendBtn.addEventListener('click', send);

  setDepth(depth);
})();

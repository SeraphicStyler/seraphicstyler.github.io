/* Seraphic Styler — service-card renderer
   ----------------------------------------------------------------------
   The six #services cards are authored as one i18n string per card, four
   lines separated by newlines:
       line 0  — scenario   ("For a piece you already have in mind.")
       line 1  — description (one sentence)
       line 2  — a fact      ("Turnaround: 1–3 days")
       line 3  — a fact      ("You send: …" / "From: …")

   This turns that flat text into a legible, accessible layout — an italic
   scenario opener, a short description, then a real <dl> of label/value
   facts. The fact labels are read straight from each line's own prefix
   ("You send", "Bạn gửi", "时间", "起步"…), so it works in every language
   with no extra translation keys.

   It re-renders whenever the i18n engine rewrites a card (language switch)
   by observing each .body. If JavaScript is off, the original four-line
   text simply shows as-is — still readable.
   ====================================================================== */
(function () {
  'use strict';

  // Split "Label: value" → {label, value}; only treat an early colon
  // (within the first 24 chars) as a label so prose colons are left alone.
  function splitFact(line) {
    var i = line.search(/[:：]/);
    if (i > -1 && i <= 24) {
      return { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() };
    }
    return { value: line.trim() };
  }

  function render(body) {
    // textContent gives the decoded four lines regardless of entities.
    var lines = body.textContent.split('\n')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; });
    if (lines.length < 2) return; // not the expected shape — leave it alone

    var frag = document.createDocumentFragment();

    var scenario = document.createElement('p');
    scenario.className = 'svc-for';
    scenario.textContent = lines[0];
    frag.appendChild(scenario);

    var desc = document.createElement('p');
    desc.className = 'svc-desc';
    desc.textContent = lines[1];
    frag.appendChild(desc);

    var facts = lines.slice(2);
    if (facts.length) {
      var dl = document.createElement('dl');
      dl.className = 'svc-facts';
      facts.forEach(function (line) {
        var f = splitFact(line);
        if (f.label) {
          var dt = document.createElement('dt');
          dt.textContent = f.label;
          var dd = document.createElement('dd');
          dd.textContent = f.value;
          dl.appendChild(dt);
          dl.appendChild(dd);
        } else {
          var solo = document.createElement('dd');
          solo.className = 'svc-fact-solo';
          solo.textContent = f.value;
          dl.appendChild(solo);
        }
      });
      frag.appendChild(dl);
    }

    body.textContent = '';
    body.appendChild(frag);
    body.classList.add('svc-structured');
  }

  function setup(body) {
    var paint = function () {
      // Skip if already structured — prevents the observer from looping on
      // our own DOM writes; only re-render when i18n has reset it to text.
      if (!body.querySelector('.svc-facts')) render(body);
    };
    paint();
    new MutationObserver(paint).observe(body, { childList: true, characterData: true, subtree: true });
  }

  function init() {
    var bodies = document.querySelectorAll('[data-svc-cards] .service .body');
    Array.prototype.forEach.call(bodies, setup);
  }

  // Run after i18n (included earlier) has cached English and applied the
  // saved language, so the cache never captures our restructured markup.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

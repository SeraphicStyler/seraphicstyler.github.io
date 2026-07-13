/* Seraphic Styler — floating inquiry beacon
   ----------------------------------------------------------------------
   A bottom-right glowing button (chat bubble with a radiating pulse) that
   opens the Tally inquiry form as a centered modal in ONE tap. It used to
   expand into a channel menu (Concierge / Messenger / Instagram); those
   were retired 13 Jul 2026 — the form is the funnel now. The old channel
   code lives in git history if a menu is ever wanted again.
   ====================================================================== */
(function () {
  'use strict';

  var FORM_ID = 'gD10Kl';
  var TALLY = 'https://tally.so/r/' + FORM_ID;
  var FIELDS = { about: 'An inquiry — I\'m looking for something', source: 'contact-hub' };

  var BUBBLE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.5 8.5 0 1 1 21 11.5z"/></svg>';

  function openInquiry() {
    if (window.Tally) {
      window.Tally.openPopup(FORM_ID, { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000, hiddenFields: FIELDS });
    } else {
      // Tally script blocked or not yet loaded: fall back to the hosted form
      window.open(TALLY + '?about=' + encodeURIComponent(FIELDS.about) + '&source=' + FIELDS.source, '_blank', 'noopener');
    }
  }

  function build() {
    var wrap = document.createElement('div');
    wrap.className = 'chub';

    var fab = document.createElement('button');
    fab.className = 'chub-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Send an inquiry');
    fab.innerHTML =
      '<span class="chub-beacon" aria-hidden="true"></span>' +
      '<span class="chub-ring" aria-hidden="true"></span>' +
      '<span class="chub-ring chub-ring-2" aria-hidden="true"></span>' +
      '<span class="chub-icon" aria-hidden="true">' + BUBBLE_ICON + '</span>';
    fab.addEventListener('click', openInquiry);

    wrap.appendChild(fab);
    document.body.appendChild(wrap);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

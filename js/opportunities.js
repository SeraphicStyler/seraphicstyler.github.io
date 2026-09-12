/* Opportunities application — conditional questions, word hints, validation,
   and a review-and-submit step. The page itself stores nothing: the applicant
   reviews a composed brief, then sends it through the Tally application form
   (opens in a new tab), with copy/email as fallbacks. */
(() => {
  'use strict';
  const form = document.getElementById('opp-form');
  if (!form) return;
  const review = document.getElementById('opp-review');
  const reviewText = document.getElementById('opp-review-text');
  const copyBtn = document.getElementById('opp-copy');
  const mailBtn = document.getElementById('opp-mailto');
  const tallyBtn = document.getElementById('opp-tally');
  const editBtn = document.getElementById('opp-edit');

  /* Path-dependent questions. The bilingual translation role usually runs as a
     supervised placement, so it follows the internship requirements question. */
  const condIntern = document.getElementById('cond-intern');
  const condCreative = document.getElementById('cond-creative');
  const qi = document.getElementById('qi');
  const qc = document.getElementById('qc');
  function syncPath() {
    const v = (form.querySelector('input[name="path"]:checked') || {}).value || '';
    const intern = v.indexOf('Internship') !== -1 || v.indexOf('Translation') !== -1 || v.indexOf('Multiple') !== -1;
    const creative = v.indexOf('Creative') !== -1 || v.indexOf('Multiple') !== -1;
    condIntern.hidden = !intern;
    condCreative.hidden = !creative;
    qi.required = intern;
    qc.required = creative;
  }
  form.querySelectorAll('input[name="path"]').forEach(r => r.addEventListener('change', syncPath));
  syncPath();

  /* Word-count hint on the first question */
  const q1 = document.getElementById('q1');
  const wc = form.querySelector('.opp-wordcount[data-for="q1"]');
  if (q1 && wc) {
    q1.addEventListener('input', () => {
      const words = (q1.value.trim().match(/\S+/g) || []).length;
      wc.textContent = words + ' words · aim for 75–150';
      wc.classList.toggle('ok', words >= 60 && words <= 180);
    });
  }

  const val = name => (form.elements[name] && form.elements[name].value || '').trim();

  function compose() {
    const L = [];
    const push = (label, value) => { if (value) { L.push(label, value, ''); } };
    push('FULL NAME', val('name'));
    push('EMAIL', val('email'));
    push('COUNTRY · TIME ZONE', val('country') + (val('timezone') ? ' · ' + val('timezone') : ''));
    push('PATH', val('path'));
    push('LINKEDIN', val('linkedin'));
    push('RÉSUMÉ / CV', val('resume'));
    push('BACKGROUND SUMMARY', val('summary'));
    push('PORTFOLIO / WORK LINK', val('work'));
    push('LANGUAGES', val('languages'));
    push('AVAILABILITY', val('availability'));
    L.push('— ANSWERS —', '');
    push('1 · Why Seraphic Styler?', val('why'));
    push('2 · A project I’m proud of', val('project'));
    push('3 · Region / community & my connection', val('region'));
    push('4 · What I want to learn', val('learn'));
    push('5 · A commitment I kept under constraints', val('commitment'));
    push('6 · Bilingual Vietnamese–English experience (optional)', val('bilingual'));
    if (!condIntern.hidden) push('7 · University requirements', val('university_requirements'));
    if (!condCreative.hidden) push('8 · Collaboration kind & support needed', val('collaboration_terms'));
    L.push('ACKNOWLEDGED', 'I understand Seraphic Styler currently has no salary, stipend, or creator-fee budget, and that this application does not establish a placement or collaboration.');
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const text = compose();
    reviewText.textContent = text;
    const subject = 'Collaboration interest — ' + val('name') + ' — ' + (val('path').indexOf('Multiple') === 0 ? 'Multiple paths' : val('path').split('&')[0].split('/')[0].trim());
    mailBtn.href = 'mailto:seraphicstyler@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    /* The Tally form is the submission destination. Prefill keys only land when
       the form's field names match; Tally silently ignores unknown params. */
    if (tallyBtn) {
      const u = new URL('https://tally.so/r/81XQql');
      u.searchParams.set('source', 'opportunities-page');
      if (val('name')) u.searchParams.set('name', val('name'));
      if (val('email')) u.searchParams.set('email', val('email'));
      tallyBtn.href = u.toString();
    }
    review.hidden = false;
    review.focus({ preventScroll: true });
    review.scrollIntoView({ behavior: document.documentElement.classList.contains('rm') ? 'instant' : 'smooth', block: 'start' });
  });

  copyBtn.addEventListener('click', async () => {
    const text = reviewText.textContent;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied ✓';
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(reviewText);
      const sel = getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      try { document.execCommand('copy'); copyBtn.textContent = 'Copied ✓'; } catch (e) { copyBtn.textContent = 'Select & copy manually'; }
      sel.removeAllRanges();
    }
    setTimeout(() => { copyBtn.textContent = 'Copy application'; }, 2600);
  });

  editBtn.addEventListener('click', () => {
    review.hidden = true;
    form.scrollIntoView({ behavior: document.documentElement.classList.contains('rm') ? 'instant' : 'smooth', block: 'start' });
  });
})();

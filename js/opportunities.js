/* Opportunities application — multi-path checkboxes, path-dependent questions,
   live word counts, a progress hint, validation, and a review-and-submit step.
   The page itself stores nothing: the applicant reviews a composed brief, then
   sends it through the Tally application form (opens in a new tab), with
   copy/email as fallbacks. */
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
     supervised placement, so it follows the internship requirements question;
     its own translation question only appears (and is only required) when the
     translation path is actually chosen. "Not sure yet" shows everything,
     optionally. */
  const condIntern = document.getElementById('cond-intern');
  const condCreative = document.getElementById('cond-creative');
  const condTranslate = document.getElementById('cond-translate');
  const qi = document.getElementById('qi');
  const qc = document.getElementById('qc');
  const qt = document.getElementById('q6');
  const qtReq = document.getElementById('q6-req');
  const pathInputs = Array.from(form.querySelectorAll('input[name="path"]'));
  const paths = () => pathInputs.filter(i => i.checked).map(i => i.value);

  function syncPath() {
    const v = paths().join(' ');
    const unsure = v.indexOf('Multiple') !== -1;
    const intern = v.indexOf('Internship') !== -1 || v.indexOf('Translation') !== -1 || unsure;
    const creative = v.indexOf('Creative') !== -1 || unsure;
    const translate = v.indexOf('Translation') !== -1 || unsure;
    condIntern.hidden = !intern;
    condCreative.hidden = !creative;
    condTranslate.hidden = !translate;
    qi.required = intern;
    qc.required = creative;
    qt.required = v.indexOf('Translation') !== -1;
    if (qtReq) qtReq.style.display = qt.required ? '' : 'none';
    syncProgress();
  }

  /* Live word counts on every long answer */
  const counters = Array.from(form.querySelectorAll('.opp-wordcount[data-for]'));
  function syncCount(el, p) {
    const words = (el.value.trim().match(/\S+/g) || []).length;
    if (el.id === 'q1') {
      p.textContent = words + ' words · aim for 75–150';
      p.classList.toggle('ok', words >= 60 && words <= 180);
    } else {
      p.textContent = words + (words === 1 ? ' word' : ' words');
      p.classList.remove('ok');
    }
  }
  counters.forEach(p => {
    const el = document.getElementById(p.dataset.for);
    if (!el) return;
    el.addEventListener('input', () => { syncCount(el, p); syncProgress(); });
    syncCount(el, p);
  });

  /* Progress hint — required answers completed, including conditionals that
     are currently visible. */
  const progText = document.getElementById('opp-progress-text');
  const progFill = document.getElementById('opp-progress-fill');
  function syncProgress() {
    const required = Array.from(form.querySelectorAll('input[required]:not([type="checkbox"]):not([type="radio"]), textarea[required]'))
      .filter(el => !el.closest('[hidden]'));
    const done = required.filter(el => el.value.trim()).length + (paths().length ? 1 : 0) + (document.getElementById('f-ack').checked ? 1 : 0);
    const total = required.length + 2;
    if (progText) progText.textContent = done + ' of ' + total + ' answered';
    if (progFill) progFill.style.width = Math.round(done / total * 100) + '%';
  }
  form.addEventListener('input', syncProgress);
  form.addEventListener('change', syncProgress);
  pathInputs.forEach(i => i.addEventListener('change', () => { pathInputs[0].setCustomValidity(''); syncPath(); }));
  syncPath();

  const val = name => (form.elements[name] && form.elements[name].value || '').trim();

  function compose() {
    const L = [];
    const push = (label, value) => { if (value) { L.push(label, value, ''); } };
    push('FULL NAME', val('name'));
    push('EMAIL', val('email'));
    push('COUNTRY · TIME ZONE', val('country') + (val('timezone') ? ' · ' + val('timezone') : ''));
    push('PATHS', paths().join(' + '));
    push('LINKEDIN', val('linkedin'));
    push('RÉSUMÉ / CV', val('resume'));
    push('BACKGROUND SUMMARY', val('summary'));
    push('PORTFOLIO / WORK LINK', val('work'));
    push('LANGUAGES', val('languages'));
    push('AVAILABILITY', val('availability'));
    L.push('— ANSWERS —', '');
    push('1 · Why Seraphic Styler & what I want to learn', val('why'));
    push('2 · A project I’m proud of', val('project'));
    push('3 · Region / community & my connection', val('region'));
    let n = 4;
    if (!condTranslate.hidden) { push(n + ' · Vietnamese–English translation experience', val('bilingual')); n++; }
    if (!condIntern.hidden) { push(n + ' · University requirements', val('university_requirements')); n++; }
    if (!condCreative.hidden) { push(n + ' · Collaboration kind & support needed', val('collaboration_terms')); n++; }
    L.push('ACKNOWLEDGED', 'I understand Seraphic Styler currently has no salary, stipend, or creator-fee budget, and that this application does not establish a placement or collaboration.');
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    pathInputs[0].setCustomValidity(paths().length ? '' : 'Choose at least one path');
    if (!form.reportValidity()) { syncProgress(); return; }
    const text = compose();
    reviewText.textContent = text;
    const first = paths()[0] || '';
    const short = first.indexOf('Multiple') === 0 ? 'Multiple paths' : first.split('&')[0].split('/')[0].trim();
    const subject = 'Collaboration interest — ' + val('name') + (paths().length > 1 ? ' — Multiple paths' : ' — ' + short);
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

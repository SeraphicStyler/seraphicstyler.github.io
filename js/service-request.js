/* Local, explicit review-and-copy intake; no personal answers in URLs or storage. */
(() => {
  'use strict';
  const form = document.getElementById('service-request-form');
  const review = document.getElementById('request-review');
  const context = document.getElementById('service-context');
  const descriptions = {
    sourcing: 'Direct sourcing purchases a specific, in-stock Vietnamese item without research. Price, size, stock, and shipping can be confirmed with the identified seller.',
    trace: 'The Trace investigates one item at $25 per item. A rare small-group exception must be confirmed before payment. Alternatives and broad curation require styling.',
    styling: 'Reference interpretation, Vietnamese equivalents, alternatives, outfits, and wardrobe direction are paid styling. Your confirmed tier and clothing budget define the scope.',
    gift: 'Choose a gift budget or tier. Styling begins after the booking is confirmed and paid.',
    bulk: 'A professional buying quote requires a defined brief. Exploratory research is prepaid; buying fees are quoted before work begins.',
    unsure: 'Request a free service recommendation or quote. This does not include item research, selections, or personalized styling advice.'
  };
  const source = document.getElementById('item-source');
  const traceCount = document.getElementById('trace-count');
  const reviewButton = document.getElementById('review-request');
  function choose(service) {
    form.querySelector(`[name="service"][value="${service}"]`).checked = true;
    update();
    const fields=form.querySelector(`[data-fields="${service}"]`);
    fields.setAttribute('tabindex','-1');fields.focus({preventScroll:true});
    fields.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.classList.contains('rm')?'instant':'smooth'});
  }
  function update() {
    const choice = form.querySelector('[name="service"]:checked')?.value;
    form.querySelectorAll('[data-fields]').forEach(fieldset => { const active = fieldset.dataset.fields === choice; fieldset.disabled = !active; fieldset.hidden = !active; });
    const direct = choice === 'sourcing' && ['link', 'precise'].includes(source.value);
    document.getElementById('direct-fields').disabled = !direct;
    document.getElementById('direct-fields').hidden = !direct;
    source.setCustomValidity(['unknown', 'inspiration'].includes(source.value) && choice === 'sourcing' ? 'Choose The Trace for identification, or styling for inspiration and alternatives.' : '');
    context.textContent = descriptions[choice] || 'Choose a service to see the relevant questions.';
    reviewButton.textContent = choice === 'unsure' ? 'Get my recommendation →' : 'Continue to review →';
  }
  source.addEventListener('change', () => {
    if (source.value === 'unknown') { choose('trace'); return; }
    if (source.value === 'inspiration') { choose('styling'); return; }
    update();
    document.getElementById('source-guidance').textContent = 'Provide the exact seller and in-stock item below. If identifying either requires research, choose The Trace.';
  });
  traceCount.addEventListener('change', () => {
    if (traceCount.value.startsWith('6+')) { choose('styling'); return; }
    document.getElementById('trace-guidance').textContent = traceCount.value && traceCount.value !== '1' ? 'The default is $25 per item. A shared fee for this group is available only if Seraphic Styler explicitly confirms it before payment.' : '';
  });
  form.querySelectorAll('[name="service"]').forEach(el => el.addEventListener('change', update));
  const params = new URLSearchParams(location.search);
  const service = params.get('service');
  if (Object.hasOwn(descriptions, service)) form.querySelector(`[value="${service}"]`).checked = true;
  const tier = document.getElementById('request-tier');
  if ([...tier.options].some(o => o.value === params.get('tier'))) tier.value = params.get('tier');
  const giftTier = document.getElementById('gift-request-tier');
  if ([...giftTier.options].some(o => o.value === params.get('tier'))) giftTier.value = params.get('tier');
  update();
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form), service = data.get('service');
    const lines = ['SERAPHIC STYLER · SERVICE REQUEST', '', 'Service: ' + service];
    for (const [key, value] of data) {
      if (key === 'service' || !String(value).trim()) continue;
      lines.push('', key + ':', key === 'Styling tier' ? tier.selectedOptions[0].textContent : key === 'Gift tier' ? giftTier.selectedOptions[0].textContent : value);
    }
    document.getElementById('request-summary').value = lines.join('\n');
    const url = new URL('https://tally.so/r/gD10Kl');
    url.searchParams.set('source', 'service-intake');
    url.searchParams.set('about', ({sourcing:'I want to purchase an identified Vietnamese item', trace:'I need The Trace for item identification', styling:'I want to book a styling service', gift:'I want to gift a styling experience', bulk:'I need a boutique or bulk-buying quote', unsure:'I need help choosing a service'})[service]);
    if (service === 'styling') url.searchParams.set('tier', tier.selectedOptions[0].textContent);
    if (service === 'gift') url.searchParams.set('tier', giftTier.selectedOptions[0].textContent);
    document.getElementById('continue-request').href = url.href;
    form.hidden = true; review.hidden = false;
    document.getElementById('copy-status').textContent = '';
    document.getElementById('review-heading').focus();
  });
  document.getElementById('edit-request').addEventListener('click', () => { review.hidden = true; form.hidden = false; form.querySelector('[name="service"]:checked')?.focus(); });
  document.getElementById('copy-request').addEventListener('click', async () => {
    const summary = document.getElementById('request-summary');
    try {
      await navigator.clipboard.writeText(summary.value);
      document.getElementById('copy-status').textContent = 'Copied. Open the inquiry form and paste your brief into its message field.';
    } catch (_) {
      summary.focus(); summary.select();
      document.getElementById('copy-status').textContent = 'Select and copy the highlighted brief, then paste it into the inquiry form.';
    }
  });
})();

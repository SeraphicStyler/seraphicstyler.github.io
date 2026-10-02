/* Shared navigation and service search. Native dialogs provide focus containment. */
(() => {
  'use strict';
  const linksPage = !!document.querySelector('.lp');
  const bioPage = document.body.classList.contains('ss-bio');
  const comparisonPage = document.body.classList.contains('ss-service-comparison');
  const sourcing = bioPage ? 'sourcingandstyling.html#sourcing' : comparisonPage ? '#sourcing' : linksPage ? '#lp-sourcing' : '#lane-sourcing';
  const styling = bioPage ? 'sourcingandstyling.html#prices' : comparisonPage ? '#prices' : linksPage ? '#lp-styling' : '#lane-styling';
  const home = !!document.querySelector('#hero');
  const section = (id, alternate) => home ? '#' + id : linksPage ? alternate : 'index.html#' + id;
  const launcher = document.createElement('button');
  launcher.type = 'button'; launcher.className = 'ss-guide-launch';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'ss-service-guide');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-label', 'Open menu. Command or Control K');
  launcher.innerHTML = '<span data-i18n="ui.menu">Menu</span> <span aria-hidden="true">⌄</span>';
  document.body.append(launcher);
  // Every figure in the menu comes from js/pricing.js (loaded first); without it the menu links to /prices instead.
  const P = window.SS_PRICING || null;
  const D = P && P.data, F = P && P.fmt;
  const tierHref = t => t.from ? '#custom-wardrobe' : styling;
  const back = '<button type="button" class="ss-back" data-view="explore"><span aria-hidden="true">←</span> All services</button>';
  // Three plain choices, sourcing first. Each opens a short page inside the menu.
  const sourcingPanel = `<section class="ss-view" data-panel="sourcing" hidden>${back}<h3 tabindex="-1">Sourcing</h3><p class="ss-view-lead">You have a link or know the exact item. I buy it, check it and ship it to you.</p><ol class="ss-steps"><li>Type the shop price, and paste the link.</li><li>Choose where it ships.</li><li>Send it to me. I confirm the exact total before you pay.</li></ol>${P ? `<p class="ss-view-fine">My fee is ${F.fromVnd(D.sourcing.minFeeVnd)} per item, plus ${F.fromVnd(D.sourcing.orderFeeVnd)} per order. <a href="prices#buy">How sourcing is priced</a></p>` : ''}<div class="ss-est-wrap"><iframe class="ss-est-frame" title="Sourcing estimator"></iframe></div><a href="estimate">Open the estimator on its own page ↗</a><p class="ss-view-fine">Only have a photo, no link? <a href="service-request.html?service=trace">The Trace</a> finds it first.</p></section>`;
  const stylingPanel = `<section class="ss-view" data-panel="styling" hidden>${back}<h3 tabindex="-1">Styling</h3><p class="ss-view-lead">You want me to choose pieces for you. Each tier is my styling fee plus money spent on your clothes.</p>${P ? `<div class="ss-table-wrap" role="region" aria-label="Styling prices" tabindex="0">${P.html.stylingTable(tierHref)}</div>` : ''}<p><a class="ss-action" href="service-request.html?service=styling">Book styling <span aria-hidden="true">→</span></a></p><a href="prices#styling">All styling details</a></section>`;
  const boutiquePanel = `<section class="ss-view" data-panel="boutique" hidden>${back}<h3 tabindex="-1">Boutiques</h3><p class="ss-view-lead">You own a store. I scout Saigon’s designers, buy what you choose and ship it in one parcel. In US dollars.</p>${P ? P.html.boutiqueTrio() + '<div data-bcalc-menu></div>' : ''}<a href="for-boutiques">How a buying round works</a></section>`;
  const choice = (view, n, title, line) => `<button type="button" class="ss-choice" data-view="${view}"><span class="ss-choice-n" aria-hidden="true">${n}</span><span class="ss-choice-t">${title}</span><span class="ss-choice-s">${line}</span><span class="ss-choice-go" aria-hidden="true">→</span></button>`;
  const dialog = document.createElement('dialog');
  dialog.id = 'ss-service-guide'; dialog.className = 'ss-guide';
  dialog.setAttribute('aria-labelledby', 'ss-guide-title');
  dialog.innerHTML = `<div class="ss-menu-bokeh" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="ss-menu-top"><span>A Saigon styling &amp; sourcing atelier</span><button type="button" data-close aria-label="Close menu">Close <span aria-hidden="true">×</span></button></header>
    <div class="ss-menu-layout"><div class="ss-menu-identity"><div class="ss-menu-brand" aria-label="Seraphic Styler"><span class="ss-menu-wordmark">Seraphic</span><span class="ss-menu-script">Styler</span></div><h2 id="ss-guide-title">What do you need?</h2><p>Pick one. Not sure? <a href="service-request.html?service=unsure">Ask me</a>.</p></div>
    <div class="ss-menu-content">
    <div data-explore><nav class="ss-choices" aria-label="Services">${choice('sourcing', '01', 'Sourcing', 'You have a link or know the item. I buy it for you.')}${choice('styling', '02', 'Styling', 'You want me to choose pieces for you.' + (P ? ' From ' + F.usd(D.styling[0].totalUsd) + '.' : ''))}${choice('boutique', '03', 'Boutiques', 'You own a store and want stock from Saigon.')}</nav>
    <nav class="ss-menu-secondary" aria-label="More"><a href="service-request.html?service=trace">The Trace <small>a photo, no link</small></a><a href="service-request.html?service=bulk">Group orders</a><a href="${home ? '#prices' : 'prices'}">All prices</a><a href="${section('gift', '#lp-gift')}" data-i18n="nav.gift">Gifting</a><a href="fashion-directory" data-i18n="nav.directory">Fashion directory</a><a href="about" data-i18n="nav.about">About the atelier</a></nav></div>
    <label class="sr-only" for="ss-guide-query">Search services, prices, and answers</label><div class="ss-search-wrap" data-search><span aria-hidden="true">⌕</span><input id="ss-guide-query" type="search" placeholder="Or search: shipping, fees, wardrobe…" autocomplete="off"><kbd>⌘ / Ctrl K</kbd></div>
    <div class="ss-guide-results" aria-label="Search results" hidden></div><p data-empty role="status" hidden>No matches. Try “wardrobe”, “shipping”, or “fees”.</p>
    ${sourcingPanel}${stylingPanel}${boutiquePanel}
    <footer class="ss-menu-footer"><span>Thoughtfully chosen in Saigon. Sent worldwide.</span><button type="button" data-settings data-i18n="a11y.title">Display &amp; accessibility</button><label><input type="checkbox" data-shortcuts> Enable O / M shortcuts</label><span>Esc to close</span></footer></div></div>`;
  const mark = document.querySelector('.brand-mark, .lp-brand-mark');
  if (mark) dialog.querySelector('.ss-menu-brand').prepend(mark.cloneNode(true));
  document.body.append(dialog);
  // A compact biography page sends detailed service routes to their full pages.
  function bioDestination(href) {
    if (!bioPage) return href;
    if (href === '#custom-wardrobe') return 'index.html#custom-wardrobe';
    if (/^[a-z][a-z-]*$/.test(href)) return href + '.html';
    return href;
  }
  if (bioPage) dialog.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', bioDestination(a.getAttribute('href'))));
  const input = dialog.querySelector('input[type="search"]');
  const results = dialog.querySelector('.ss-guide-results');
  const panels = [...dialog.querySelectorAll('[data-panel]')];
  const estFrame = dialog.querySelector('.ss-est-frame');
  // The embedded estimator reports its own height (js/estimate-page.js).
  window.addEventListener('message', e => {
    if (e.origin === location.origin && e.data && e.data.type === 'ss-estimate-height' && e.source === estFrame.contentWindow) estFrame.style.height = e.data.height + 'px';
  });
  const explore = dialog.querySelector('[data-explore]');
  const entries = [
    ['Sourcing or styling?', 'sourcingandstyling', 'Compare identified-item purchase assistance, paid research, and styling'],
    ['Sourcing services & fees', sourcing, 'Exact in-stock Vietnamese item purchase fees; unknown-item research uses The Trace', 'individual'],
    ...(P ? [
      ['Personal styling · from ' + F.fromUsd(D.styling[0].totalUsd), styling, 'Edit Capsule Atelier Signature outfits occasion trip capsule', 'individual'],
      ['Custom Wardrobe · from ' + F.fromUsd(P.tier('custom-wardrobe').totalUsd), '#custom-wardrobe', '15 pieces to 20 pieces, multiple looks and occasions. ' + F.fromUsd(P.tier('custom-wardrobe').feeUsd) + ' styling fee + ' + F.fromUsd(P.tier('custom-wardrobe').creditUsd) + ' spent on your clothes. 60 days support', 'individual'],
      ['Custom Wardrobe+ · from ' + F.fromUsd(P.tier('custom-wardrobe-plus').totalUsd), '#custom-wardrobe', '21–30+ pieces, made to measure, rush timeline, complex ordering', 'individual'],
      ['Signature · ' + F.fromUsd(P.tier('signature').totalUsd), 'signature', F.fromUsd(P.tier('signature').feeUsd) + ' styling fee + ' + F.fromUsd(P.tier('signature').creditUsd) + ' spent on your clothes, designer commission and 60 days support', 'individual']
    ] : []),
    ['Style questionnaire', 'style-profile', 'Measurements lifestyle preferences body shape', 'individual'],
    ['Shipping & order process', section('process', '#lp-how'), 'Worldwide delivery tracking approval'],
    ['Fashion directory', 'fashion-directory', 'Browse Vietnamese brands boutiques designers'],
    ['Start a request', 'service-request.html', 'Sourcing styling unsure intake consultation contact'],
    ['Every price', home ? '#prices' : 'prices', 'Prices fees costs sourcing styling The Trace gift cards group orders boutique buying'],
    ['Estimate your order', 'estimate', 'Estimator calculator item prices shipping fees total', 'individual'],
    ...(P ? [
      ['Group order · ' + F.pct(D.group.pct) + ' of the order', 'service-request.html?service=bulk', 'Sorority bridal party team shared order, ' + F.pct(D.group.rushPct) + ' with made-to-measure or rush', 'individual'],
      ['Price your boutique buy', 'boutique-calculator', 'Budget pieces rush calculator: ' + F.usd0(D.boutique.scoutUsd) + ' scouting fee, ' + F.pct(D.boutique.pct) + ' buying fee, total and when you pay', 'boutique'],
      ['Boutique fees · ' + F.usd0(D.boutique.scoutUsd) + ' scouting + ' + F.pct(D.boutique.pct), 'prices?for=boutiques', 'Scouting fee once per round, ' + F.pct(D.boutique.pct) + ' buying fee (' + F.pct(D.boutique.rushPct) + ' rush), $0 markup, ' + F.usd0(D.boutique.perPieceUsd) + ' a piece minimum', 'boutique']
    ] : []),
    ['Boutique buying agent', 'for-boutiques', 'Stock Saigon designers: scouting round, line sheet, stockist terms, one export shipment', 'boutique']
  ];
  document.querySelectorAll('section[id]').forEach(el => {
    const heading = el.querySelector('h2, h3');
    if (heading) entries.push([heading.textContent.trim(), '#' + el.id, el.textContent.replace(/\s+/g, ' ').trim(), /boutique|btq/.test(el.id) ? 'boutique' : '']);
  });
  // Search ranks boutique results last unless this is a boutique page.
  const audience = /boutique/.test(location.pathname) ? 'boutique' : 'individual';
  const audLabel = { individual: 'Individual', boutique: 'Boutique' };
  if (P) P.mountBoutiqueCalc(dialog.querySelector('[data-bcalc-menu]'), { compact: true, params: false, fullBase: bioDestination('boutique-calculator') });
  let view = 'explore', previousFocus, destination = null, closing = false, closeTimer;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.matches('.rm, .hc, .mono');
  function render() {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searching = words.length > 0;
    const rank = e => e[3] === audience ? 0 : e[3] ? 2 : 1;
    const matches = searching ? entries.filter(e => words.every(w => e.slice(0, 3).join(' ').toLowerCase().includes(w))).sort((a, b) => rank(a) - rank(b)).slice(0, 10) : [];
    explore.hidden = searching || view !== 'explore'; results.hidden = !searching;
    dialog.dataset.view = searching ? 'search' : view;
    dialog.querySelector('[data-search]').hidden = !searching && view !== 'explore';
    panels.forEach(panel => { panel.hidden = searching || panel.dataset.panel !== view; });
    // The sourcing estimator loads the first time Sourcing is chosen.
    if (view === 'sourcing' && !estFrame.getAttribute('src')) estFrame.setAttribute('src', bioDestination('estimate') + '?embed=links');
    results.replaceChildren();
    matches.forEach(([title, href, detail, aud]) => {
      const a = document.createElement('a'); a.href = bioDestination(href); a.textContent = title;
      if (aud) { const chip = document.createElement('em'); chip.className = 'ss-aud-chip'; chip.dataset.aud = aud; chip.textContent = audLabel[aud]; a.append(' ', chip); }
      const span = document.createElement('span'); span.textContent = detail.length > 125 ? detail.slice(0, 122) + '…' : detail;
      a.append(span); results.append(a);
    });
    dialog.querySelector('[data-empty]').hidden = !searching || matches.length > 0;
  }
  // Choosing a service shows its page; "All services" returns to the choices. Focus follows.
  function show(next) {
    const from = view; view = next; input.value = ''; render(); dialog.scrollTop = 0;
    if (next === 'explore') dialog.querySelector(`.ss-choice[data-view="${from}"]`)?.focus({preventScroll:true});
    else dialog.querySelector(`[data-panel="${next}"] h3`)?.focus({preventScroll:true});
  }
  function open(mode = 'explore') {
    if (document.querySelector('dialog[open]') && !dialog.open) return;
    clearTimeout(closeTimer); closing = false; dialog.classList.remove('is-closing'); destination = null;
    if (!dialog.open) { previousFocus = document.activeElement; dialog.showModal(); }
    document.documentElement.classList.add('ss-menu-open'); launcher.setAttribute('aria-expanded', 'true');
    view = mode; input.value = ''; render(); dialog.scrollTop = 0;
    if (matchMedia('(pointer:fine)').matches) input.focus({preventScroll:true}); else dialog.querySelector('[data-close]').focus({preventScroll:true});
  }
  function close(target) {
    if (!dialog.open || closing) return;
    closing = true; destination = target || null; dialog.classList.add('is-closing');
    closeTimer = setTimeout(() => dialog.close(), reduced() ? 0 : 220);
  }
  launcher.addEventListener('click', () => open());
  document.querySelectorAll('[data-service-menu]').forEach(trigger => {
    // Older triggers asked for "prices" (the styling tiers) or "estimate" (the sourcing estimator).
    const wanted = { prices: 'styling', estimate: 'sourcing' }[trigger.dataset.serviceMenu] || trigger.dataset.serviceMenu;
    trigger.addEventListener('click', e => { e.preventDefault(); open(['sourcing', 'styling', 'boutique'].includes(wanted) ? wanted : 'explore'); });
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => close());
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('close', () => {
    closing = false; dialog.classList.remove('is-closing'); document.documentElement.classList.remove('ss-menu-open'); launcher.setAttribute('aria-expanded', 'false');
    if (destination) {
      const target = document.getElementById(destination.slice(1));
      if (target) {
        for (let p = target.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
        target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); target.scrollIntoView({behavior:reduced() ? 'instant' : 'smooth', block:'start'}); history.replaceState(null, '', destination);
      }
    } else previousFocus?.focus({preventScroll:true});
    destination = null;
  });
  dialog.addEventListener('click', e => {
    const b = e.target.closest('[data-view]'); if (b) show(b.dataset.view);
    if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); }
    const a = e.target.closest('a');
    if (a && a.getAttribute('href').startsWith('#')) { e.preventDefault(); close(a.hash); }
  });
  const settings = dialog.querySelector('[data-settings]');
  if (document.getElementById('a11yBtn')) settings.addEventListener('click', () => {
    dialog.addEventListener('close', () => document.getElementById('a11yBtn')?.click(), {once:true}); close();
  });
  else {
    settings.textContent = 'Switch light / dark / mono';
    settings.addEventListener('click', () => window.SS_THEME.cycle());
  }
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); results.querySelector('a')?.focus(); }
    if (e.key === 'Enter') { e.preventDefault(); results.querySelector('a')?.click(); }
  });
  const shortcuts = dialog.querySelector('[data-shortcuts]');
  try { shortcuts.checked = localStorage.getItem('ss-letter-shortcuts') === 'on'; } catch (_) {}
  shortcuts.addEventListener('change', () => { try { localStorage.setItem('ss-letter-shortcuts', shortcuts.checked ? 'on' : 'off'); } catch (_) {} });
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.repeat || e.isComposing) return;
    const key = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && !e.altKey && key === 'k') { e.preventDefault(); if (dialog.open) close(); else open(); return; }
    if (!shortcuts.checked || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]') || e.target.closest('input, textarea, select, button, a, [contenteditable], [role="textbox"]')) return;
    if (key === 'o' || key === 'm') { e.preventDefault(); open('explore'); }
  });
  document.querySelectorAll('#lane-sourcing + .grid .service, #lane-styling + .grid .service, .lp-tier').forEach(card => {
    const tag = document.createElement('span'); tag.className = 'ss-service-tag';
    tag.textContent = card.closest('#lane-sourcing + .grid') ? 'Sourcing' : 'Styling'; card.prepend(tag);
  });
  // Scope acknowledgement before existing styling checkouts. Original payment URLs are retained.
  const consent = document.createElement('dialog'); consent.className = 'ss-booking'; consent.setAttribute('aria-labelledby', 'ss-booking-title');
  consent.innerHTML = `<form method="dialog"><button class="ss-booking-close" value="cancel" formnovalidate aria-label="Close booking details">×</button><span class="eyebrow">Before you book · Personal styling</span><h2 id="ss-booking-title">Pieces chosen for you.</h2><p>This tier helps you decide what to buy. For a fuller capsule or several occasions, <a href="#custom-wardrobe" data-custom>explore Custom Wardrobe</a>.</p><ul class="ss-booking-facts"><li><strong>Styling fee</strong><span>Pays for selection and direction.</span></li><li><strong>Clothing credit</strong><span>Goes toward pieces you approve.</span></li><li><strong>Shipping</strong><span>Added separately after the parcel is weighed.</span></li></ul><label class="ss-consent"><input type="checkbox" required><span>I understand that sourcing is for an exact, identified item. Research, alternatives, outfits, and recommendations are paid services confirmed before work begins.</span></label><button class="ss-action" value="continue">Continue to secure checkout ↗</button></form>`;
  document.body.append(consent);
  let checkout = '', bookingFocus;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="https://buy.stripe.com/"]');
    if (!a || !a.closest('#lane-styling + .grid, .lp-tier, #qeStyPanel') || a.href.includes('00w5kE3nx')) return;
    e.preventDefault(); checkout = a.href; bookingFocus = a; consent.querySelector('input').checked = false; consent.returnValue = ''; consent.showModal();
  });
  consent.querySelector('[data-custom]').addEventListener('click', () => consent.close());
  consent.addEventListener('close', () => { if (consent.returnValue === 'continue' && consent.querySelector('input').checked) location.assign(checkout); else bookingFocus?.focus({preventScroll:true}); });
})();

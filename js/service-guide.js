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
  const individualPrices = P ? `<h3>Personal styling</h3><p>Choose the amount of direction you need. Every booking is my styling fee plus money spent on your clothes; shipping is added separately. Đồng first, dollars in brackets.</p><div class="ss-table-wrap" role="region" aria-label="Styling prices" tabindex="0">${P.html.stylingTable(tierHref)}</div><p>Item counts depend on fit, inventory, and garment prices.</p><h3>Item sourcing</h3><p>For an exact piece you've already found.</p><ul class="ss-facts">${P.html.sourcingFacts().map(f => `<li>${f}</li>`).join('')}</ul>` : '';
  const boutiquePrices = P ? `<h3>Boutique buying <span class="ss-cur">US dollars</span></h3>${P.html.boutiqueTrio()}<div data-bcalc-menu></div>` : '';
  const dialog = document.createElement('dialog');
  dialog.id = 'ss-service-guide'; dialog.className = 'ss-guide';
  dialog.setAttribute('aria-labelledby', 'ss-guide-title');
  dialog.innerHTML = `<div class="ss-menu-bokeh" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="ss-menu-top"><span>A Saigon styling &amp; sourcing atelier</span><button type="button" data-close aria-label="Close menu">Close <span aria-hidden="true">×</span></button></header>
    <div class="ss-menu-layout"><div class="ss-menu-identity"><div class="ss-menu-brand" aria-label="Seraphic Styler"><span class="ss-menu-wordmark">Seraphic</span><span class="ss-menu-script">Styler</span></div><h2 id="ss-guide-title"><span data-for="individual">A little direction.<br>A world of possibilities.</span><span data-for="boutique" hidden>Saigon's designers.<br>On your shop floor.</span></h2><p data-for="individual">Find a piece you love.<br>Or discover what belongs together.</p><p data-for="boutique" hidden>Tell me your budget.<br>See your whole buy, fees included.</p><a class="ss-action" data-for="individual" href="service-request.html?service=unsure">Find your service <span aria-hidden="true">↗</span></a><a class="ss-action" data-for="boutique" href="boutique-calculator" hidden>Price a buy for your boutique <span aria-hidden="true">↗</span></a></div>
    <div class="ss-menu-content"><label class="sr-only" for="ss-guide-query">Search services, prices, and answers</label><div class="ss-search-wrap"><span aria-hidden="true">⌕</span><input id="ss-guide-query" type="search" placeholder="Find a service, price, or answer…" autocomplete="off"><kbd>⌘ / Ctrl K</kbd></div>
    <div class="ss-audience" role="group" aria-label="Who is this for?"><button type="button" data-aud="individual" aria-pressed="true">For individuals</button><button type="button" data-aud="boutique" aria-pressed="false">For boutiques</button></div>
    <div class="ss-menu-tabs" role="group" aria-label="Menu view"><button type="button" data-view="explore" aria-pressed="true">Explore</button><button type="button" data-view="prices" aria-pressed="false" data-i18n="nav.services">Services &amp; prices</button></div>
    <div data-explore><p class="ss-menu-prompt">What do you need today?</p><nav class="ss-menu-primary" aria-label="For individuals" data-for="individual"><a href="${styling}"><span>01</span>Personal styling <small>Choose a piece, an outfit, or a wardrobe</small></a><a href="${sourcing}"><span>02</span>Item sourcing <small>Buy an exact item from a known seller</small></a><a href="service-request.html?service=trace"><span>03</span>The Trace <small>Identify one item from a photo${P ? ' · ' + F.fromUsd(D.trace.usd) : ''}</small></a><a href="service-request.html?service=bulk"><span>04</span>Group order <small>A sorority, bridal party, or team${P ? ' · ' + F.pct(D.group.pct) + ' of the order' : ''}</small></a><a href="prices"><span>05</span>Every price <small>Sourcing, styling, gifts and group orders, worked out</small></a></nav><nav class="ss-menu-primary" aria-label="For boutiques" data-for="boutique" hidden><a href="boutique-calculator"><span>01</span>Price your buy <small>Budget and pieces in, your whole buy out</small></a><a href="for-boutiques"><span>02</span>How a buying round works <small>Scouting, line sheet, approval, one shipment</small></a><a href="prices?for=boutiques"><span>03</span>Boutique fees <small>${P ? P.boutiqueTrio().map(f => f.big + ' ' + f.label).join(' · ') : 'Scouting fee, buying fee, no markup'}</small></a><a href="service-request.html?service=bulk"><span>04</span>Start a buy brief <small>Tell me your shop, budget, and timeline</small></a></nav><nav class="ss-menu-secondary" aria-label="Explore more"><a href="${section('process', '#lp-how')}" data-i18n="nav.process">How it works</a><a href="fashion-directory" data-i18n="nav.directory">Fashion directory</a><a href="${section('lookbook', 'index.html#lookbook')}" data-i18n="nav.lookbook">Lookbook</a><a href="${section('gift', '#lp-gift')}" data-i18n="nav.gift">Gifting</a><a href="about" data-i18n="nav.about">About the atelier</a><a href="service-request.html" data-i18n="nav.contact">Start a request</a></nav></div>
    <div class="ss-guide-results" aria-label="Search results" hidden></div><p data-empty role="status" hidden>No matches. Try “wardrobe”, “shipping”, or “fees”.</p>
    <section data-prices hidden><div data-for="individual">${individualPrices}<a href="prices">All prices, worked out →</a><p class="ss-aud-note">Buying a range to stock a shop? <button type="button" data-aud="boutique">See boutique pricing</button></p></div>
    <div data-for="boutique" hidden>${boutiquePrices}<a class="ss-action" href="prices?for=boutiques">All boutique prices <span aria-hidden="true">↗</span></a><p class="ss-aud-note">Ordering a few pieces for yourself or a group? <button type="button" data-aud="individual">See individual pricing</button></p></div></section>
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
  const prices = dialog.querySelector('[data-prices]');
  const explore = dialog.querySelector('[data-explore]');
  const tabs = dialog.querySelector('.ss-menu-tabs');
  const underline = document.createElement('span');
  underline.className = 'ss-menu-tab-indicator'; underline.setAttribute('aria-hidden', 'true'); tabs.append(underline);
  function syncTabIndicator() {
    if (!dialog.open) return;
    const active = tabs.querySelector('[aria-pressed="true"]');
    underline.style.width = active.offsetWidth + 'px';
    underline.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }
  // Re-measure only when labels or the available width change, including zoom.
  const tabObserver = new ResizeObserver(syncTabIndicator);
  tabObserver.observe(tabs); tabs.querySelectorAll('button').forEach(b => tabObserver.observe(b));
  dialog.querySelectorAll('.ss-menu-primary a').forEach(a => {
    const arrow = document.createElement('i'); arrow.className = 'ss-menu-row-arrow';
    arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true'); a.append(arrow);
  });
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
    ['Every price', 'prices', 'Prices fees costs sourcing styling The Trace gift cards group orders boutique buying'],
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
  // Audience ("For individuals | For boutiques") is shared with /prices through js/pricing.js:
  // deep links (?for=boutiques), boutique pages and the stored choice all agree. Works without storage.
  let audience = P ? P.audience.initial() : (/boutique/.test(location.pathname) ? 'boutique' : 'individual');
  const audLabel = { individual: 'Individual', boutique: 'Boutique' };
  if (P) P.mountBoutiqueCalc(dialog.querySelector('[data-bcalc-menu]'), { compact: true, params: false, fullBase: bioDestination('boutique-calculator') });
  function setAudience(next) {
    audience = next;
    if (P) P.audience.set(next); else try { localStorage.setItem('ss-menu-audience', next); } catch (_) {}
    render();
  }
  window.addEventListener('ss:audience', e => { if (e.detail.audience !== audience) { audience = e.detail.audience; render(); } });
  let view = 'explore', previousFocus, destination = null, closing = false, closeTimer;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.matches('.rm, .hc, .mono');
  function render() {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searching = words.length > 0;
    const rank = e => e[3] === audience ? 0 : e[3] ? 2 : 1;
    const matches = searching ? entries.filter(e => words.every(w => e.slice(0, 3).join(' ').toLowerCase().includes(w))).sort((a, b) => rank(a) - rank(b)).slice(0, 10) : [];
    dialog.querySelectorAll('[data-for]').forEach(el => { el.hidden = el.dataset.for !== audience; });
    dialog.querySelectorAll('.ss-audience [data-aud]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.aud === audience)));
    explore.hidden = searching || view !== 'explore'; prices.hidden = searching || view !== 'prices'; results.hidden = !searching;
    results.replaceChildren();
    matches.forEach(([title, href, detail, aud]) => {
      const a = document.createElement('a'); a.href = bioDestination(href); a.textContent = title;
      if (aud) { const chip = document.createElement('em'); chip.className = 'ss-aud-chip'; chip.dataset.aud = aud; chip.textContent = audLabel[aud]; a.append(' ', chip); }
      const span = document.createElement('span'); span.textContent = detail.length > 125 ? detail.slice(0, 122) + '…' : detail;
      a.append(span); results.append(a);
    });
    dialog.querySelector('[data-empty]').hidden = !searching || matches.length > 0;
    dialog.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    syncTabIndicator();
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
    trigger.addEventListener('click', e => { e.preventDefault(); open(trigger.dataset.serviceMenu === 'prices' ? 'prices' : 'explore'); });
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
    const b = e.target.closest('[data-view]'); if (b) { view = b.dataset.view; input.value = ''; render(); }
    const aud = e.target.closest('button[data-aud]');
    if (aud) { setAudience(aud.dataset.aud); if (!aud.closest('.ss-audience')) dialog.querySelector(`.ss-audience [data-aud="${audience}"]`).focus({preventScroll:true}); }
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
  // The switch is a pair of toggle buttons; arrow keys move between them, like radio buttons.
  dialog.querySelector('.ss-audience').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next = audience === 'individual' ? 'boutique' : 'individual';
    setAudience(e.key === 'Home' ? 'individual' : e.key === 'End' ? 'boutique' : next);
    dialog.querySelector(`.ss-audience [data-aud="${audience}"]`).focus();
  });
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
    if (key === 'o' || key === 'm') { e.preventDefault(); open(key === 'm' ? 'prices' : 'explore'); }
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

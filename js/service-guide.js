/* Shared navigation and service search. Native dialogs provide focus containment. */
(() => {
  'use strict';
  const linksPage = !!document.querySelector('.lp');
  const bioPage = document.body.classList.contains('ss-bio');
  const home = !!document.querySelector('#hero');
  const section = (id, alternate) => home ? '#' + id : linksPage ? alternate : 'index.html#' + id;
  const mac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform || navigator.platform);
  const launcher = document.createElement('button');
  launcher.type = 'button'; launcher.className = 'ss-guide-launch';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-controls', 'ss-service-guide');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-label', 'Open menu. Command or Control K');
  launcher.setAttribute('aria-keyshortcuts', 'Meta+K Control+K');
  launcher.innerHTML = `<span data-i18n="ui.menu">Menu</span> <span aria-hidden="true">⌄</span> <kbd class="ss-launch-kbd" aria-hidden="true">${mac ? '⌘K' : 'Ctrl K'}</kbd>`;
  document.body.append(launcher);
  // Every figure in the menu comes from js/pricing.js (loaded first); without it the doors carry no price line.
  const P = window.SS_PRICING || null;
  const D = P && P.data, F = P && P.fmt;
  // Three doors, sourcing first — real links to the estimator, the price list and the boutique calculator.
  const door = (id, n, title, line, price, href) => `<li><a class="ss-door" href="${href}" data-door="${id}" data-track="menu-door-${id}" aria-labelledby="ss-door-${id}" aria-describedby="ss-door-${id}-s${price ? ` ss-door-${id}-p` : ''}"><span class="ss-door-n" aria-hidden="true">${n}</span><span class="ss-door-t" id="ss-door-${id}">${title}</span><span class="ss-door-s" id="ss-door-${id}-s">${line}</span>${price ? `<span class="ss-door-p" id="ss-door-${id}-p">${price}</span>` : ''}<span class="ss-door-go" aria-hidden="true">→</span></a></li>`;
  const doors =
    door('sourcing', '01', 'Sourcing', 'You have a link or know the item. I buy it for you.', P ? 'Per item · ~' + F.vnd(D.sourcing.minFeeVnd) + ' (~' + F.usd(D.sourcing.minFeeVnd / D.fx.vndPerUsd) + ')' : '', 'estimate') +
    door('styling', '02', 'Styling', 'You want me to choose pieces for you.', P ? 'From ' + F.usd(D.styling[0].totalUsd) : '', 'prices#styling') +
    door('boutiques', '03', 'Boutiques', 'You own a store and want stock from Saigon.', P ? F.usd0(D.boutique.scoutUsd) + ' + ' + F.pct(D.boutique.pct) : '', 'boutique-calculator');
  const dialog = document.createElement('dialog');
  dialog.id = 'ss-service-guide'; dialog.className = 'ss-guide';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Services menu');
  dialog.innerHTML = `<div class="ss-menu-bokeh" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="ss-menu-top"><span>A Saigon styling &amp; sourcing atelier</span><button type="button" data-close aria-label="Close menu">Close <span aria-hidden="true">×</span></button></header>
    <div class="ss-menu-layout"><div class="ss-menu-identity"><div class="ss-menu-brand"><span class="ss-menu-wordmark">Seraphic</span><span class="ss-menu-script">Styler</span></div><h2 id="ss-guide-title">What do you need?</h2><p>Pick one. Not sure? <a href="service-request.html?service=unsure">Ask me <span aria-hidden="true">→</span></a></p></div>
    <div class="ss-menu-content">
    <label class="sr-only" for="ss-guide-query">Search services, prices, and answers</label><div class="ss-search-wrap" data-search><span aria-hidden="true">⌕</span><input id="ss-guide-query" type="search" placeholder="Or search: shipping, fees, wardrobe…" autocomplete="off"><kbd>⌘ / Ctrl K</kbd></div>
    <div class="ss-guide-results" role="group" aria-label="Search results" hidden></div><p data-empty role="status" hidden>No matches. Try “wardrobe”, “shipping”, or “fees”.</p>
    <div data-explore><nav aria-label="Services"><ul class="ss-doors" role="list">${doors}</ul></nav>
    <a class="ss-menu-more" href="prices#trace" data-track="menu-trace">Only have a photo, no link? The Trace finds it first <span aria-hidden="true">→</span></a></div>
    <footer class="ss-menu-footer"><span>Thoughtfully chosen in Saigon. Sent worldwide.</span><button type="button" data-settings data-i18n="a11y.title">Display &amp; accessibility</button><span>Esc to close</span></footer></div></div>`;
  const mark = document.querySelector('.brand-mark, .lp-brand-mark');
  if (mark) dialog.querySelector('.ss-menu-brand').prepend(mark.cloneNode(true));
  document.body.append(dialog);
  // A compact biography page sends detailed service routes to their full pages.
  function bioDestination(href) {
    if (!bioPage) return href;
    if (href === '#custom-wardrobe') return 'index.html#custom-wardrobe';
    if (/^[a-z][a-z-]*$/.test(href)) return href + '.html';
    if (/^[a-z][a-z-]*#/.test(href)) return href.replace('#', '.html#');
    return href;
  }
  if (bioPage) dialog.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', bioDestination(a.getAttribute('href'))));
  const input = dialog.querySelector('input[type="search"]');
  const results = dialog.querySelector('.ss-guide-results');
  const explore = dialog.querySelector('[data-explore]');
  const entries = [
    ['Sourcing or styling?', 'sourcingandstyling', 'Compare identified-item purchase assistance, paid research, and styling'],
    ['Sourcing services & fees', 'estimate', 'Exact in-stock Vietnamese item purchase fees; unknown-item research uses The Trace', 'individual'],
    ...(P ? [
      ['Personal styling · from ' + F.fromUsd(D.styling[0].totalUsd), 'prices#styling', 'Edit Capsule Atelier Signature outfits occasion trip capsule', 'individual'],
      ['Custom Wardrobe · from ' + F.fromUsd(P.tier('custom-wardrobe').totalUsd), '#custom-wardrobe', '15 pieces to 20 pieces, multiple looks and occasions. ' + F.fromUsd(P.tier('custom-wardrobe').feeUsd) + ' styling fee + ' + F.fromUsd(P.tier('custom-wardrobe').creditUsd) + ' spent on your clothes. 60 days support', 'individual'],
      ['Custom Wardrobe+ · from ' + F.fromUsd(P.tier('custom-wardrobe-plus').totalUsd), '#custom-wardrobe', '21–30+ pieces, made to measure, rush timeline, complex ordering', 'individual'],
      ['Signature · ' + F.fromUsd(P.tier('signature').totalUsd), 'signature', F.fromUsd(P.tier('signature').feeUsd) + ' styling fee + ' + F.fromUsd(P.tier('signature').creditUsd) + ' spent on your clothes, designer commission and 60 days support', 'individual']
    ] : []),
    ['The Trace · a photo, no link', 'prices#trace', 'Photo only, no link: I identify the item first', 'individual'],
    ['Style questionnaire', 'style-profile', 'Measurements lifestyle preferences body shape', 'individual'],
    ['Shipping & order process', section('process', '#lp-how'), 'Worldwide delivery tracking approval'],
    ['Fashion directory', 'fashion-directory', 'Browse Vietnamese brands boutiques designers'],
    ['Gifting', section('gift', '#lp-gift'), 'Gift a styling experience gift card'],
    ['About the atelier', 'about', 'Who I am, Saigon atelier'],
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
  let previousFocus, destination = null, closing = false, closeTimer;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.matches('.rm, .hc, .mono');
  function render() {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searching = words.length > 0;
    const rank = e => e[3] === audience ? 0 : e[3] ? 2 : 1;
    const matches = searching ? entries.filter(e => words.every(w => e.slice(0, 3).join(' ').toLowerCase().includes(w))).sort((a, b) => rank(a) - rank(b)).slice(0, 10) : [];
    explore.hidden = searching; results.hidden = !searching;
    dialog.dataset.view = searching ? 'search' : 'explore';
    results.replaceChildren();
    matches.forEach(([title, href, detail, aud]) => {
      const a = document.createElement('a'); a.href = bioDestination(href); a.textContent = title;
      if (aud) { const chip = document.createElement('em'); chip.className = 'ss-aud-chip'; chip.dataset.aud = aud; chip.textContent = audLabel[aud]; a.append(' ', chip); }
      const span = document.createElement('span'); span.textContent = detail.length > 125 ? detail.slice(0, 122) + '…' : detail;
      a.append(span); results.append(a);
    });
    dialog.querySelector('[data-empty]').hidden = !searching || matches.length > 0;
  }
  function open() {
    if (document.querySelector('dialog[open]') && !dialog.open) return;
    clearTimeout(closeTimer); closing = false; dialog.classList.remove('is-closing'); destination = null;
    if (!dialog.open) { previousFocus = document.activeElement; dialog.showModal(); }
    document.documentElement.classList.add('ss-menu-open'); launcher.setAttribute('aria-expanded', 'true');
    input.value = ''; render(); dialog.scrollTop = 0;
    if (matchMedia('(pointer:fine)').matches) input.focus({preventScroll:true}); else dialog.querySelector('[data-close]').focus({preventScroll:true});
  }
  function close(target) {
    if (!dialog.open || closing) return;
    closing = true; destination = target || null; dialog.classList.add('is-closing');
    closeTimer = setTimeout(() => dialog.close(), reduced() ? 0 : 220);
  }
  launcher.addEventListener('click', () => open());
  // Older triggers asked for a specific panel; the menu now simply opens on its three doors.
  document.querySelectorAll('[data-service-menu]').forEach(trigger => {
    trigger.addEventListener('click', e => { e.preventDefault(); open(); });
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => close());
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    // Arrows walk the active list — the results while searching, the three doors otherwise.
    const items = [...(results.hidden ? dialog.querySelectorAll('.ss-door') : results.querySelectorAll('a'))];
    if (e.target === input) {
      if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); items[0].focus(); }
      return;
    }
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    if (e.key === 'ArrowDown') items[Math.min(i + 1, items.length - 1)].focus();
    else if (e.key === 'ArrowUp') (i === 0 ? input : items[i - 1]).focus();
    else if (e.key === 'Home') items[0].focus();
    else items[items.length - 1].focus();
  });
  dialog.addEventListener('close', () => {
    closing = false; dialog.classList.remove('is-closing'); document.documentElement.classList.remove('ss-menu-open'); launcher.setAttribute('aria-expanded', 'false');
    if (destination) {
      const target = document.getElementById(destination.slice(1));
      if (target) {
        for (let p = target.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
        target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); target.scrollIntoView({behavior:reduced() ? 'instant' : 'smooth', block:'start'}); history.replaceState(null, '', destination);
      }
    } else (previousFocus && previousFocus.isConnected && previousFocus !== document.body ? previousFocus : launcher).focus({preventScroll:true});
    destination = null;
  });
  dialog.addEventListener('click', e => {
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
    if (e.key === 'Enter' && !results.hidden) { e.preventDefault(); results.querySelector('a')?.click(); }
  });
  // ⌘K / Ctrl+K toggles the menu — except while typing in a field.
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.repeat || e.isComposing) return;
    if (!(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 'k') return;
    if (e.target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) return;
    e.preventDefault();
    if (dialog.open) close(); else open();
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

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
  const tiers = [['Edit', '$235', '$135', '$100'], ['Capsule', '$460', '$270', '$190'], ['Atelier', '$600', '$310', '$290'], ['Signature', '$790', '$310', '$480'], ['Custom Wardrobe', 'From $1,500', '$800', '$700'], ['Custom Wardrobe+', 'From $2,000', 'From $1,100', 'Agreed in quote']];
  const dialog = document.createElement('dialog');
  dialog.id = 'ss-service-guide'; dialog.className = 'ss-guide';
  dialog.setAttribute('aria-labelledby', 'ss-guide-title');
  dialog.innerHTML = `<div class="ss-menu-bokeh" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="ss-menu-top"><span>A Saigon styling &amp; sourcing atelier</span><button type="button" data-close aria-label="Close menu">Close <span aria-hidden="true">×</span></button></header>
    <div class="ss-menu-layout"><div class="ss-menu-identity"><div class="ss-menu-brand" aria-label="Seraphic Styler"><span class="ss-menu-wordmark">Seraphic</span><span class="ss-menu-script">Styler</span></div><h2 id="ss-guide-title"><span data-for="individual">A little direction.<br>A world of possibilities.</span><span data-for="boutique" hidden>Saigon's designers.<br>On your shop floor.</span></h2><p data-for="individual">Find a piece you love.<br>Or discover what belongs together.</p><p data-for="boutique" hidden>Tell me your budget.<br>See your whole buy, fees included.</p><a class="ss-action" data-for="individual" href="service-request.html?service=unsure">Find your service <span aria-hidden="true">↗</span></a><a class="ss-action" data-for="boutique" href="boutique-calculator" hidden>Price a buy for your boutique <span aria-hidden="true">↗</span></a></div>
    <div class="ss-menu-content"><label class="sr-only" for="ss-guide-query">Search services, prices, and answers</label><div class="ss-search-wrap"><span aria-hidden="true">⌕</span><input id="ss-guide-query" type="search" placeholder="Find a service, price, or answer…" autocomplete="off"><kbd>⌘ / Ctrl K</kbd></div>
    <div class="ss-audience" role="group" aria-label="Who is this for?"><button type="button" data-aud="individual" aria-pressed="true">For individuals</button><button type="button" data-aud="boutique" aria-pressed="false">For boutiques</button></div>
    <div class="ss-menu-tabs" role="group" aria-label="Menu view"><button type="button" data-view="explore" aria-pressed="true">Explore</button><button type="button" data-view="prices" aria-pressed="false" data-i18n="nav.services">Services &amp; prices</button></div>
    <div data-explore><p class="ss-menu-prompt">What do you need today?</p><nav class="ss-menu-primary" aria-label="For individuals" data-for="individual"><a href="${styling}"><span>01</span>Personal styling <small>Choose a piece, an outfit, or a wardrobe</small></a><a href="${sourcing}"><span>02</span>Item sourcing <small>Buy an exact item from a known seller</small></a><a href="service-request.html?service=trace"><span>03</span>The Trace <small>Identify one item from a photo · $25</small></a><a href="service-request.html?service=bulk"><span>04</span>Group order <small>A sorority, bridal party, or team · 15% of the order</small></a><a href="sourcingandstyling#prices"><span>05</span>Pricing help <small>Compare services and booking totals</small></a></nav><nav class="ss-menu-primary" aria-label="For boutiques" data-for="boutique" hidden><a href="boutique-calculator"><span>01</span>Price your buy <small>Budget and pieces in, your whole buy out</small></a><a href="for-boutiques"><span>02</span>How a buying round works <small>Scouting, line sheet, approval, one shipment</small></a><a href="${section('boutique', 'index.html#boutique')}"><span>03</span>Boutique fees <small>$250 scouting fee · 15% buying fee · $0 markup</small></a><a href="service-request.html?service=bulk"><span>04</span>Start a buy brief <small>Tell me your shop, budget, and timeline</small></a></nav><nav class="ss-menu-secondary" aria-label="Explore more"><a href="${section('process', '#lp-how')}" data-i18n="nav.process">How it works</a><a href="fashion-directory" data-i18n="nav.directory">Fashion directory</a><a href="${section('lookbook', 'index.html#lookbook')}" data-i18n="nav.lookbook">Lookbook</a><a href="${section('gift', '#lp-gift')}" data-i18n="nav.gift">Gifting</a><a href="about" data-i18n="nav.about">About the atelier</a><a href="service-request.html" data-i18n="nav.contact">Start a request</a></nav></div>
    <div class="ss-guide-results" aria-label="Search results" hidden></div><p data-empty role="status" hidden>No matches. Try “wardrobe”, “shipping”, or “fees”.</p>
    <section data-prices hidden><div data-for="individual"><h3>Personal styling <span class="ss-cur">USD</span></h3><p>Choose the amount of direction you need. Every booking splits into a styling fee and a clothing credit toward pieces you approve; shipping is added separately.</p><div class="ss-table-wrap" role="region" aria-label="Styling prices" tabindex="0"><table><thead><tr><th scope="col">Service</th><th scope="col">Booking</th><th scope="col">Styling fee</th><th scope="col">Clothing credit</th></tr></thead><tbody>${tiers.map((t,i) => `<tr><th scope="row"><a href="${i > 3 ? '#custom-wardrobe' : styling}">${t[0]}</a></th>${t.slice(1).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>Item counts depend on fit, inventory, and garment prices.</p><h3>Item sourcing <span class="ss-cur">VND</span></h3><p>For an exact piece you've already found. Per item: 8% of store price (7% above 5,000,000₫), minimum 350,000₫. Coordination: 250,000₫ per order. The Trace is US$25 per item for identification research and is credited toward an order under the current terms.</p><a href="links.html#lp-sourcing">Full sourcing fees &amp; payment costs →</a><p class="ss-aud-note">Buying a range to stock a shop? <button type="button" data-aud="boutique">See boutique pricing</button></p></div>
    <div data-for="boutique" hidden><h3>Boutique buying <span class="ss-cur">USD</span></h3><div class="ss-btq-facts"><div><b>$250</b><span>Scouting fee, once per round</span></div><div><b>15%</b><span>Buying fee on the pieces you choose</span></div><div><b>$0</b><span>Markup. You pay the designer's price</span></div></div><form class="ss-btq-calc" onsubmit="return false"><label>Budget for pieces (USD)<input type="number" data-btq="budget" min="0" step="50" inputmode="decimal" value="3000"></label><label>Number of pieces<input type="number" data-btq="pieces" min="1" step="1" inputmode="numeric" value="30"></label><label class="ss-btq-rush"><input type="checkbox" data-btq="rush"> Rush or made-to-measure (20% instead of 15%)</label></form><p class="ss-btq-total" aria-live="polite">Your buy: <strong data-btq-out="total">$3,700</strong> + shipping</p><p class="ss-btq-note" data-btq-out="note" hidden></p><ol class="ss-btq-steps"><li><span>To start: scouting fee</span><b>$250</b></li><li><span>Pieces chosen: pieces + half the buying fee</span><b data-btq-out="s2">$3,225</b></li><li><span>All approved: rest of the fee + shipping</span><b data-btq-out="s3">$225 + shipping</b></li></ol><p>The buying fee is at least $14 a piece and $25 a buy. Shipping is the courier's actual cost.</p><a class="ss-action" href="boutique-calculator">Price your buy <span aria-hidden="true">↗</span></a><p class="ss-aud-note">Ordering a few pieces for yourself or a group? <button type="button" data-aud="individual">See individual pricing</button></p></div></section>
    <footer class="ss-menu-footer"><span>Thoughtfully chosen in Saigon. Sent worldwide.</span><button type="button" data-settings data-i18n="a11y.title">Display &amp; accessibility</button><label><input type="checkbox" data-shortcuts> Enable O / M shortcuts</label><span>Esc to close</span></footer></div></div>`;
  const mark = document.querySelector('.brand-mark, .lp-brand-mark');
  if (mark) dialog.querySelector('.ss-menu-brand').prepend(mark.cloneNode(true));
  document.body.append(dialog);
  // A compact biography page sends detailed service routes to their full pages.
  function bioDestination(href) {
    if (!bioPage) return href;
    if (href === '#custom-wardrobe') return 'index.html#custom-wardrobe';
    if (href === 'links.html#lp-sourcing') return sourcing;
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
    ['Personal styling · from $235', styling, 'Edit Capsule Atelier Signature outfits occasion trip capsule', 'individual'],
    ['Custom Wardrobe · from $1,500', '#custom-wardrobe', '15 pieces to 20 pieces, multiple looks and occasions. $800 fee + $700 clothing credit. 60 days support', 'individual'],
    ['Custom Wardrobe+ · from $2,000', '#custom-wardrobe', '21–30+ pieces, made to measure, rush timeline, complex ordering', 'individual'],
    ['Signature · $790', 'signature', '$310 styling fee + $480 clothing credit, designer commission and 60 days support', 'individual'],
    ['Style questionnaire', 'style-profile', 'Measurements lifestyle preferences body shape', 'individual'],
    ['Shipping & order process', section('process', '#lp-how'), 'Worldwide delivery tracking approval'],
    ['Fashion directory', 'fashion-directory', 'Browse Vietnamese brands boutiques designers'],
    ['Start a request', 'service-request.html', 'Sourcing styling unsure intake consultation contact'],
    ['Group order · 15% of the order', 'service-request.html?service=bulk', 'Sorority bridal party team shared order, 20% with made-to-measure or rush', 'individual'],
    ['Price your boutique buy', 'boutique-calculator', 'Budget pieces rush calculator: $250 scouting fee, 15% buying fee, total and when you pay', 'boutique'],
    ['Boutique buying agent', 'for-boutiques', 'Stock Saigon designers: scouting round, line sheet, stockist terms, one export shipment', 'boutique'],
    ['Boutique fees · $250 scouting + 15%', section('boutique', 'index.html#boutique'), 'Scouting fee once per round, 15% buying fee (20% rush), $0 markup, $14 a piece minimum', 'boutique']
  ];
  document.querySelectorAll('section[id]').forEach(el => {
    const heading = el.querySelector('h2, h3');
    if (heading) entries.push([heading.textContent.trim(), '#' + el.id, el.textContent.replace(/\s+/g, ' ').trim(), /boutique|btq/.test(el.id) ? 'boutique' : '']);
  });
  // Audience is a per-viewer convenience; the menu works the same without storage.
  let audience = /boutique/.test(location.pathname) ? 'boutique' : 'individual';
  try { if (!/boutique/.test(location.pathname)) audience = localStorage.getItem('ss-menu-audience') === 'boutique' ? 'boutique' : 'individual'; } catch (_) {}
  const audLabel = { individual: 'Individual', boutique: 'Boutique' };
  const btq = { scout: 250, pct: 0.15, rushPct: 0.20, perPiece: 14, perBuy: 25 }; // keep in step with boutique-calculator
  const usd = x => '$' + Math.round(x).toLocaleString('en-US');
  function priceBuy() {
    const get = k => dialog.querySelector(`[data-btq="${k}"]`), out = k => dialog.querySelector(`[data-btq-out="${k}"]`);
    const b = Math.max(0, parseFloat(get('budget').value) || 0), p = Math.max(0, parseInt(get('pieces').value, 10) || 0), rush = get('rush').checked;
    const pct = rush ? btq.rushPct : btq.pct;
    let fee = b * pct, note = '';
    if (p * btq.perPiece > fee) { fee = p * btq.perPiece; note = `The $14-a-piece minimum applies: ${p} × $14 = ${usd(fee)}.`; }
    if (b > 0 && fee < btq.perBuy) { fee = btq.perBuy; note = 'The $25 minimum buying fee applies.'; }
    if (!(b > 0)) fee = 0;
    out('total').textContent = usd(b + btq.scout + fee);
    out('s2').textContent = usd(b + fee / 2); out('s3').textContent = usd(fee / 2) + ' + shipping';
    out('note').textContent = note; out('note').hidden = !note;
    const link = bioDestination('boutique-calculator') + `?budget=${b}&pieces=${p}${rush ? '&rush=1' : ''}`;
    dialog.querySelectorAll('a[href^="boutique-calculator"]').forEach(a => a.setAttribute('href', link));
  }
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
    if (aud) { audience = aud.dataset.aud; try { localStorage.setItem('ss-menu-audience', audience); } catch (_) {} render(); if (!aud.closest('.ss-audience')) dialog.querySelector(`.ss-audience [data-aud="${audience}"]`).focus({preventScroll:true}); }
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
  dialog.querySelectorAll('[data-btq]').forEach(el => { el.addEventListener('input', priceBuy); el.addEventListener('change', priceBuy); });
  priceBuy();
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

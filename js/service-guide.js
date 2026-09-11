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
  const tiers = [['Discovery', '$49', '$15', '$34'], ['Edit', '$149', '$45', '$104'], ['Capsule', '$249', '$75', '$174'], ['Atelier', '$349', '$110', '$239'], ['Signature', '$750', '$290', '$460'], ['Custom Wardrobe', 'From $1,100', '$475', '$625'], ['Custom Wardrobe+', 'From $1,500', 'From $750', 'Agreed in quote']];
  const dialog = document.createElement('dialog');
  dialog.id = 'ss-service-guide'; dialog.className = 'ss-guide';
  dialog.setAttribute('aria-labelledby', 'ss-guide-title');
  dialog.innerHTML = `<div class="ss-menu-bokeh" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="ss-menu-top"><span>A Saigon styling &amp; sourcing atelier</span><button type="button" data-close aria-label="Close menu">Close <span aria-hidden="true">×</span></button></header>
    <div class="ss-menu-layout"><div class="ss-menu-identity"><div class="ss-menu-brand" aria-label="Seraphic Styler"><span class="ss-menu-wordmark">Seraphic</span><span class="ss-menu-script">Styler</span></div><h2 id="ss-guide-title">A little direction.<br>A world of possibilities.</h2><p>Find a piece you love.<br>Or discover what belongs together.</p><a class="ss-action" href="service-request.html?service=unsure">Find your service <span aria-hidden="true">↗</span></a></div>
    <div class="ss-menu-content"><label class="sr-only" for="ss-guide-query">Search services, prices, and answers</label><div class="ss-search-wrap"><span aria-hidden="true">⌕</span><input id="ss-guide-query" type="search" placeholder="Find a service, price, or answer…" autocomplete="off"><kbd>⌘ / Ctrl K</kbd></div>
    <div class="ss-menu-tabs" role="group" aria-label="Menu view"><button type="button" data-view="explore" aria-pressed="true">Explore</button><button type="button" data-view="prices" aria-pressed="false" data-i18n="nav.services">Services &amp; prices</button></div>
    <div data-explore><p class="ss-menu-prompt">What do you need today?</p><nav class="ss-menu-primary" aria-label="Primary"><a href="${styling}"><span>01</span>Personal styling <small>Choose a piece, an outfit, or a wardrobe</small></a><a href="${sourcing}"><span>02</span>Item sourcing <small>Buy an exact item from a known seller</small></a><a href="service-request.html?service=trace"><span>03</span>The Trace <small>Identify one item from a photo · $25</small></a><a href="service-request.html?service=bulk"><span>04</span>Group or boutique <small>Plan a shared order or a retail buy</small></a><a href="sourcingandstyling#prices"><span>05</span>Pricing help <small>Compare services and booking totals</small></a></nav><nav class="ss-menu-secondary" aria-label="Explore more"><a href="${section('process', '#lp-how')}" data-i18n="nav.process">How it works</a><a href="fashion-directory" data-i18n="nav.directory">Fashion directory</a><a href="${section('lookbook', 'index.html#lookbook')}" data-i18n="nav.lookbook">Lookbook</a><a href="${section('gift', '#lp-gift')}" data-i18n="nav.gift">Gifting</a><a href="about" data-i18n="nav.about">About the atelier</a><a href="service-request.html" data-i18n="nav.contact">Start a request</a></nav></div>
    <div class="ss-guide-results" aria-label="Search results" hidden></div><p data-empty role="status" hidden>No matches. Try “wardrobe”, “shipping”, or “fees”.</p>
    <section data-prices hidden><h3>Personal styling <span>USD</span></h3><p>Start with the amount of direction you need. Every booking separates the styling fee from clothing credit; shipping is additional.</p><div class="ss-tier-picks"><a href="${styling}"><strong>Discovery</strong><span>One focused need</span><b>$49 total · $34 clothing credit</b></a><a href="${styling}"><strong>Capsule</strong><span>A coordinated selection</span><b>$249 total · $174 clothing credit</b></a><a href="#custom-wardrobe"><strong>Custom Wardrobe</strong><span>Several occasions</span><b>From $1,100 · $625 clothing credit</b></a></div><details class="ss-price-details"><summary>See every styling tier and fee split</summary><div class="ss-table-wrap" role="region" aria-label="Styling prices" tabindex="0"><table><thead><tr><th scope="col">Service</th><th scope="col">Booking</th><th scope="col">Fee</th><th scope="col">Clothes</th></tr></thead><tbody>${tiers.map((t,i) => `<tr><th scope="row"><a href="${i > 4 ? '#custom-wardrobe' : styling}">${t[0]}</a></th>${t.slice(1).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details><p>Clothing credit is a budget toward approved pieces. Item counts depend on fit, inventory, and garment prices.</p><h3>Item sourcing <span>VND</span></h3><p>Per item: 8% of store price (7% above 5,000,000₫), minimum 350,000₫. Coordination: 250,000₫ per order. The Trace is US$25 per item for identification research and is credited toward an order under the current terms.</p><a href="links.html#lp-sourcing">Full sourcing fees &amp; payment costs →</a></section>
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
    ['Sourcing services & fees', sourcing, 'Exact in-stock Vietnamese item purchase fees; unknown-item research uses The Trace'],
    ['Personal styling · from $49', styling, 'Discovery Edit Capsule Atelier Signature outfits occasion trip capsule'],
    ['Custom Wardrobe · from $1,100', '#custom-wardrobe', '15 pieces to 20 pieces, multiple looks and occasions. $475 fee + $625 clothing credit. 60 days support'],
    ['Custom Wardrobe+ · from $1,500', '#custom-wardrobe', '21–30+ pieces, made to measure, rush timeline, complex ordering'],
    ['Signature · $750', 'signature', '$290 styling fee + $460 clothing credit, designer commission and 60 days support'],
    ['Style questionnaire', 'style-profile', 'Measurements lifestyle preferences body shape'],
    ['Shipping & order process', section('process', '#lp-how'), 'Worldwide delivery tracking approval'],
    ['Fashion directory', 'fashion-directory', 'Browse Vietnamese brands boutiques designers'],
    ['Start a request', 'service-request.html', 'Sourcing styling unsure intake consultation contact']
  ];
  document.querySelectorAll('section[id]').forEach(el => {
    const heading = el.querySelector('h2, h3');
    if (heading) entries.push([heading.textContent.trim(), '#' + el.id, el.textContent.replace(/\s+/g, ' ').trim()]);
  });
  let view = 'explore', previousFocus, destination = null, closing = false, closeTimer;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.matches('.rm, .hc, .mono');
  function render() {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searching = words.length > 0;
    const matches = searching ? entries.filter(e => words.every(w => e.join(' ').toLowerCase().includes(w))).slice(0, 10) : [];
    explore.hidden = searching || view !== 'explore'; prices.hidden = searching || view !== 'prices'; results.hidden = !searching;
    results.replaceChildren();
    matches.forEach(([title, href, detail]) => {
      const a = document.createElement('a'); a.href = bioDestination(href); a.textContent = title;
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

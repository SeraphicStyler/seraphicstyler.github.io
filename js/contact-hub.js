/* Seraphic Styler — floating contact hub
   ----------------------------------------------------------------------
   A bottom-right beacon button (chat bubble with a radiating pulse) that
   expands into a stack of contact-channel pills, à la the reference site:
       Live chat · Zalo · Messenger · Instagram · WhatsApp · Call us

   "Live chat" opens the on-site concierge assistant; the rest are direct
   links. Channels with an empty value below are simply not shown, so there
   are never any dead links — fill one in to reveal its pill.

   >>> EDIT YOUR HANDLES HERE <<<
   ====================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    liveChat:  true,                                   // opens the concierge panel
    zalo:      '',                                     // e.g. 'https://zalo.me/84xxxxxxxxx'
    messenger: 'https://m.me/seraphicstyler',          // confirm your Messenger username
    instagram: 'https://instagram.com/seraphicstyler', // live
    whatsapp:  '',                                     // e.g. 'https://wa.me/84xxxxxxxxx'
    phone:     ''                                      // e.g. 'tel:+84xxxxxxxxx'
  };

  // brand colour per channel (recognisable icons; the rest of the widget stays on-brand cobalt/ivory)
  var ICONS = {
    bubble:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.6-.8L3 21l1.9-5.1A8.5 8.5 0 1 1 21 11.5z"/></svg>',
    sparkle:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></svg>',
    zalo:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.4a8.4 8.4 0 0 1-8.5 8.4 8.6 8.6 0 0 1-3.6-.8L3 20.5l1.9-4.9A8.4 8.4 0 1 1 21 11.4z"/><path d="M8.5 9.2h3.2L8.5 13.6h3.4M14.6 9v4.6M16.8 11a1.4 1.4 0 1 1 0 1.7" stroke-width="1.4"/></svg>',
    messenger: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2C6.4 2.2 2.1 6.3 2.1 11.6c0 2.9 1.3 5.4 3.4 7.1v3.1l3.1-1.7c.9.3 1.9.4 2.9.4 5.6 0 9.9-4.1 9.9-9.4S17.6 2.2 12 2.2z"/><path d="M5.9 14.5l3.4-3.6 1.8 1.9 3.1-1.9-3.4 3.6-1.7-1.9z" fill="#fff"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="4.6"/><circle cx="12" cy="12" r="3.7"/><circle cx="16.8" cy="7.2" r="1.1" fill="currentColor" stroke="none"/></svg>',
    whatsapp:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.4 9.4 0 0 0-8 14.3L2.6 21.5l4.8-1.3A9.4 9.4 0 1 0 12 2.5zm5.5 13.2c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3-.8a10.4 10.4 0 0 1-4.2-3.8c-.3-.5-1-1.5-1-2.8s.7-2 .9-2.3a1 1 0 0 1 .7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c0 .2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7a8 8 0 0 0 3 2.6c.4.2.6.2.8 0l.9-1c.2-.3.4-.2.6-.1l1.8.9c.3.1.4.2.5.3s.1.7-.1 1.3z"/></svg>',
    phone:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16.9v2.8a1.9 1.9 0 0 1-2.1 1.9 18.7 18.7 0 0 1-8.1-2.9 18.4 18.4 0 0 1-5.7-5.7A18.7 18.7 0 0 1 2.3 4.9 1.9 1.9 0 0 1 4.2 2.8h2.8a1.9 1.9 0 0 1 1.9 1.6c.1.9.3 1.8.7 2.7a1.9 1.9 0 0 1-.5 2L8 12.3a14.8 14.8 0 0 0 5.7 5.7l1.2-1.1a1.9 1.9 0 0 1 2-.5c.9.4 1.8.6 2.7.7a1.9 1.9 0 0 1 1.6 1.9z"/></svg>'
  };

  // order, label, brand colour, icon, and how to resolve the link
  var CHANNELS = [
    { key: 'liveChat',  label: 'Concierge', color: '#2e54ad', icon: ICONS.sparkle,   action: 'concierge' },
    { key: 'zalo',      label: 'Zalo',      color: '#0068ff', icon: ICONS.zalo,      action: 'link' },
    { key: 'messenger', label: 'Messenger', color: '#0084ff', icon: ICONS.messenger, action: 'link' },
    { key: 'instagram', label: 'Instagram', color: '#d62976', icon: ICONS.instagram, action: 'link', grad: 'linear-gradient(45deg,#feda75,#d62976 45%,#962fbf 80%,#4f5bd5)' },
    { key: 'whatsapp',  label: 'WhatsApp',  color: '#25d366', icon: ICONS.whatsapp,  action: 'link' },
    { key: 'phone',     label: 'Call us',   color: '#2e54ad', icon: ICONS.phone,     action: 'link' }
  ];

  function build() {
    var wrap = document.createElement('div');
    wrap.className = 'chub';

    // channel menu
    var menu = document.createElement('div');
    menu.className = 'chub-menu';
    menu.id = 'chubMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Contact channels');

    var shown = 0;
    CHANNELS.forEach(function (c) {
      var enabled = c.key === 'liveChat' ? CONFIG.liveChat : CONFIG[c.key];
      if (!enabled) return;
      shown++;
      var el = c.action === 'concierge' ? document.createElement('button') : document.createElement('a');
      el.className = c.action === 'concierge' ? 'chub-pill chub-pill--concierge' : 'chub-pill';
      el.setAttribute('role', 'menuitem');
      if (c.action === 'concierge') {
        el.type = 'button';
        el.addEventListener('click', openLiveChat);
      } else {
        el.href = CONFIG[c.key];
        if (CONFIG[c.key].indexOf('tel:') !== 0) { el.target = '_blank'; el.rel = 'noopener'; }
      }
      el.innerHTML =
        '<span class="chub-ic" style="background:' + (c.grad || c.color) + '">' + c.icon + '</span>' +
        '<span class="chub-lbl">' + c.label + '</span>';
      menu.appendChild(el);
    });

    // beacon + button
    var fab = document.createElement('button');
    fab.className = 'chub-fab';
    fab.type = 'button';
    fab.setAttribute('aria-haspopup', 'menu');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'chubMenu');
    fab.setAttribute('aria-label', 'Contact us');
    fab.innerHTML =
      '<span class="chub-beacon" aria-hidden="true"></span>' +
      '<span class="chub-ring" aria-hidden="true"></span>' +
      '<span class="chub-ring chub-ring-2" aria-hidden="true"></span>' +
      '<span class="chub-icon" aria-hidden="true">' + ICONS.bubble + '</span>';

    wrap.appendChild(menu);
    wrap.appendChild(fab);
    document.body.appendChild(wrap);

    if (!shown) { wrap.style.display = 'none'; return; }

    // stagger pills so the one nearest the button animates in first
    var pills = menu.children;
    for (var i = 0; i < pills.length; i++) pills[i].style.setProperty('--i', pills.length - 1 - i);

    function setOpen(open) {
      wrap.classList.toggle('open', open);
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var first = menu.querySelector('.chub-pill');
        if (first) first.focus();
      }
    }
    fab.addEventListener('click', function () { setOpen(!wrap.classList.contains('open')); });
    document.addEventListener('click', function (e) {
      if (wrap.classList.contains('open') && !wrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('open')) { setOpen(false); fab.focus(); }
    });

    // Consolidate: the concierge button's role now lives inside this hub, so hide it.
    var cc = document.querySelector('.cc-fab');
    if (cc) cc.classList.add('chub-hidden');
  }

  function openLiveChat() {
    // close our menu, then open the on-site concierge; fall back to the contact form.
    var wrap = document.querySelector('.chub');
    if (wrap) wrap.classList.remove('open');
    var cc = document.querySelector('.cc-fab');
    if (cc) { cc.click(); }
    else { window.location.hash = '#contact'; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();

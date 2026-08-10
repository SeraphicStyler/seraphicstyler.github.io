/* Seraphic Styler — "Find it in Saigon" photo finder (js/find.js)
   ----------------------------------------------------------------------
   Drop / pick / paste a photo of Vietnamese fashion. With the owner's
   Anthropic API key saved in this browser, the photo plus the 320-brand
   index go straight from the browser to api.anthropic.com (never to this
   site's host) and Claude matches the piece against the directory.
   Without a key the page still works as a visitor tool: preview, quick
   directory search, and the concierge hand-off.
   Classic script, no build step. Page globals: window.SS_DIRECTORY
   (js/directory-data.js), optional window.SS_T for i18n.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';

  var FIND = {
    MODEL: "claude-opus-4-8",   /* $5/$25 per MTok. Cheaper: "claude-sonnet-5" ($3/$15,
                                   intro $2/$10 through 2026-08-31), "claude-haiku-4-5" ($1/$5).
                                   No temperature/top_p/top_k on Opus 4.8 (API rejects them). */
    EFFORT: "medium", MAX_TOKENS: 4000,
    MAX_EDGE: 1568, RETRY_EDGE: 1200, MAX_FILE: 30 * 1024 * 1024,
    KEY_LS: "ss-find-key", HIST_LS: "ss-find-history",
    HIST_CAP: 10, THUMB_EDGE: 160, THUMB_Q: 0.6
  };

  var API_URL = 'https://api.anthropic.com/v1/messages';

  /* ---------- system prompt (verbatim from the build plan) ---------- */
  FIND.SYSTEM = `You are the in-house fashion analyst for Seraphic Styler, a personal styling and
sourcing studio in Saigon (Ho Chi Minh City). You identify fashion items in photos —
usually Instagram screenshots or phone photos of Vietnamese fashion — and match them
against the studio's directory of 320 Vietnamese fashion houses, given below as the
BRAND INDEX.

You know Vietnamese fashion in both English and Vietnamese: áo dài and its modern
variants (áo dài cách tân), áo bà ba, lụa / silk (including lụa Hà Đông), gấm /
brocade, thêu tay / hand embroidery, đũi / raw silk, linen minimalism, đầm / dresses,
may đo / bespoke tailoring, and the current Saigon scene — Y2K and coquette revivals,
corsetry, streetwear, gorpcore, vintage and đồ si secondhand, and the minimalist
ready-to-wear labels of D1 and D3.

ANALYSIS
1. Identify each distinct fashion item worn or shown — garments first, then notable
   bags, shoes, jewelry or eyewear. Report at most 4 items, most prominent first. If
   there is no identifiable fashion item, return an empty items array and explain in
   overall_notes.
2. For each item: a short name in English (name_en) and in natural fashion Vietnamese
   (name_vi — how a Saigon boutique would write it, not a literal translation), the
   garment type, the materials you can judge from texture and drape, motifs and
   details (embroidery, brocade, prints, hardware, silhouette), dominant colors,
   style keywords, and a price-tier guess.
3. Read any visible text: clothing tags, watermarks, Instagram handles, shop signs.
   Put it in visible_brand_text (empty string if none). A visible handle or brand
   name that equals an index entry's name or @handle is the strongest match signal.
4. confidence (0 to 1) is your certainty about the item identification itself.

MATCHING
5. Match only against the BRAND INDEX. Never invent a brand. Write "brand" EXACTLY
   as the name appears before the first "|" of its index line, character for
   character, including diacritics.
6. Give 0 to 5 matches per item, best first, each with confidence 0 to 1: 0.9+ only
   for a visible handle or label match; 0.5–0.8 when category, tier, fabric and the
   style notes genuinely line up; under 0.4 for a plausible category fit only. An
   empty matches array is a good answer when nothing fits — many index entries
   describe logistics rather than style, so a thin entry is not evidence either way,
   and a generic item (a plain white tee) should get few or no matches.
7. Weigh cat/sub, tier, city/area and the free-text notes together. An entry marked
   ⚑ needs re-verification (it may have moved or closed): you may still match it,
   but say so in the reason.
8. Each reason is one short, useful sentence in English (e.g. "Their romantic RTW
   signature, and the watermark in your screenshot is their handle").

FALLBACK SEARCHES
9. For every item, give 3–6 search_queries mixing English and Vietnamese, written
   the way a local would type them (e.g. "áo dài cách tân lụa trắng", "white silk
   modern ao dai vietnam", plus brand-guess queries if visible_brand_text has
   anything), and 2–4 instagram_hashtags (no # symbol, no spaces).

overall_notes: 1–3 warm, plain sentences for the client — what you saw, how sure you
are, and the next step you'd take (visit a matched house, send the photo to the
Seraphic Styler concierge, or run the searches).`;

  /* Header of the second (cached) system block; the index lines follow it. */
  var INDEX_HEADER = `BRAND INDEX — 320 Vietnamese fashion houses, one per line:
Name | @instagram | cat/sub | tier | city area | access | tags | notes
cat: women|men|luxury|tailor|active|access|sleep|market · tier: mid|premium|luxury|
couture|none · access: walk=walk-in, appt=appointment, online, hub=stocked in
multi-brand hubs, popup · city: SGN=Saigon, HAN=Hanoi, VN=elsewhere Vietnam,
INTL=international · ⚑ = listing needs re-verification`;

  /* ---------- JSON schema (structured outputs; verbatim from the plan) ---------- */
  FIND.SCHEMA = {
    "type": "object",
    "properties": {
      "items": { "type": "array", "items": { "type": "object", "properties": {
        "name_en": { "type": "string" }, "name_vi": { "type": "string" },
        "garment_type": { "type": "string" },
        "directory_category": { "type": "string", "enum": ["women", "men", "luxury", "tailor", "active", "access", "lingerie", "sleep", "market", "other"] },
        "materials": { "type": "array", "items": { "type": "string" } },
        "motifs": { "type": "array", "items": { "type": "string" } },
        "colors": { "type": "array", "items": { "type": "string" } },
        "style_keywords": { "type": "array", "items": { "type": "string" } },
        "price_tier_guess": { "type": "string", "enum": ["mid", "premium", "luxury", "couture", "unknown"] },
        "visible_brand_text": { "type": "string" },
        "confidence": { "type": "number" },
        "matches": { "type": "array", "items": { "type": "object", "properties": {
          "brand": { "type": "string", "description": "Exact name from the BRAND INDEX" },
          "confidence": { "type": "number" }, "reason": { "type": "string" } },
          "required": ["brand", "confidence", "reason"], "additionalProperties": false } },
        "search_queries": { "type": "array", "items": { "type": "string" } },
        "instagram_hashtags": { "type": "array", "items": { "type": "string" } }
      },
      "required": ["name_en", "name_vi", "garment_type", "directory_category", "materials", "motifs", "colors", "style_keywords", "price_tier_guess", "visible_brand_text", "confidence", "matches", "search_queries", "instagram_hashtags"],
      "additionalProperties": false } },
      "overall_notes": { "type": "string" }
    },
    "required": ["items", "overall_notes"], "additionalProperties": false
  };

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(key, en) { return window.SS_T ? window.SS_T(key, en) : en; }
  function $(id) { return document.getElementById(id); }
  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }
  function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); } /* strip Vietnamese diacritics */
  function pct(c) { return Math.round(Math.max(0, Math.min(1, +c || 0)) * 100); }

  /* ---------- elements (the ID contract with find.html) ---------- */
  var el = {
    drop: $('dropzone'), file: $('file'), pick: $('pickbtn'),
    preview: $('preview'), previmg: $('previmg'), clearimg: $('clearimg'),
    hint: $('hint'), analyze: $('analyze'), note: $('visitor-note'),
    results: $('results'),
    keybtn: $('keybtn'), drawer: $('keydrawer'), keyinput: $('keyinput'),
    keysave: $('keysave'), keytest: $('keytest'), keyclear: $('keyclear'), keystatus: $('keystatus'),
    qf: $('qf'), qfresults: $('qfresults'),
    history: $('history'), histstrip: $('histstrip'), histclear: $('histclear')
  };
  if (!el.drop || !el.analyze || !el.results) return; /* wrong page — bail quietly */

  /* ---------- directory index ---------- */
  var DIR = window.SS_DIRECTORY || [];
  var byName = new Map();
  DIR.forEach(function (b) { if (b && b.n && !byName.has(b.n)) byName.set(b.n, b); });

  function buildIndex() {
    var D = DIR;
    return D.map(b => [ b.n, b.h ? "@"+b.h : "-", b.cat + (b.sub ? "/"+b.sub : ""), b.tier || "-",
      ((b.city||"") + " " + (b.area||"")).trim() || "-", b.st || "-",
      [b.vibe, (b.fib||[]).join("/"), b.price].filter(Boolean).join("; ") || "-",
      (b.flag ? "⚑ " : "") + (b.no||"").slice(0,160) ].join(" | ")).join("\n");
  }
  var _indexBlock = null; /* built once — deterministic bytes → stable cache prefix */
  function indexBlock() {
    if (_indexBlock == null) _indexBlock = INDEX_HEADER + "\n" + buildIndex();
    return _indexBlock;
  }

  /* ---------- state machine ---------- */
  var state = 'idle';               /* idle | image-ready | calling | results | error */
  var curFile = null, curUrl = null, lastResult = null;

  function setState(s) {
    state = s;
    var busy = s === 'calling';
    el.analyze.disabled = busy || !curFile;
    el.analyze.textContent = busy ? t('find.up.busy', 'Analyzing…') : t('find.up.go', 'Identify it');
  }

  /* ---------- key handling ---------- */
  var memKey = ''; /* session fallback when localStorage is unavailable */
  function getKey() {
    try { return localStorage.getItem(FIND.KEY_LS) || memKey; } catch (e) { return memKey; }
  }
  function setKeyStatus(msg) { el.keystatus.textContent = msg || ''; }
  function syncMode() {
    var has = !!getKey();
    document.body.classList.toggle('haskey', has);
    el.analyze.hidden = !has;
    el.note.hidden = has;
  }
  function openDrawer() {
    el.drawer.hidden = false;
    el.keybtn.setAttribute('aria-expanded', 'true');
    el.keyinput.focus();
  }

  el.keybtn.addEventListener('click', function () {
    var open = el.drawer.hidden;
    el.drawer.hidden = !open;
    this.setAttribute('aria-expanded', String(open));
    if (open) el.keyinput.focus();
  });

  el.keysave.addEventListener('click', function () {
    var v = el.keyinput.value.trim();
    if (!v) { setKeyStatus(t('find.keys.empty', 'Paste a key first.')); return; }
    memKey = v;
    var stored = false;
    try { localStorage.setItem(FIND.KEY_LS, v); stored = true; } catch (e) {}
    setKeyStatus(stored
      ? t('find.keys.saved', 'Key saved to this browser.')
      : t('find.keys.savedTemp', 'Saved for this visit only — this browser is blocking storage.'));
    syncMode();
  });

  el.keyclear.addEventListener('click', function () {
    memKey = '';
    try { localStorage.removeItem(FIND.KEY_LS); } catch (e) {}
    el.keyinput.value = '';
    setKeyStatus(t('find.keys.cleared', 'Key removed from this browser.'));
    syncMode();
  });

  el.keytest.addEventListener('click', function () {
    var k = el.keyinput.value.trim() || getKey();
    if (!k) { setKeyStatus(t('find.keys.empty', 'Paste a key first.')); return; }
    setKeyStatus(t('find.keys.testing', 'Testing…'));
    fetch(API_URL, {
      method: 'POST',
      headers: headers(k),
      body: JSON.stringify({ model: FIND.MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] })
    }).then(function (r) {
      if (r.ok) {
        return r.json().then(function (data) {
          console.log('[find] usage', data.usage);
          setKeyStatus(t('find.keys.ok', 'Key works.'));
        });
      }
      return r.json().catch(function () { return null; }).then(function (body) {
        var msg = (body && body.error && body.error.message) || '';
        setKeyStatus(httpMessage(r.status, msg));
      });
    }).catch(function () {
      setKeyStatus(t('find.err.net', "Couldn't reach the AI service — check your connection."));
    });
  });

  /* ---------- image intake ---------- */
  function setFile(f) {
    if (!f) return;
    if (f.size > FIND.MAX_FILE) {
      showError(t('find.err.big', 'Photo too large — try a screenshot of it.'));
      return;
    }
    curFile = f;
    if (curUrl) { try { URL.revokeObjectURL(curUrl); } catch (e) {} curUrl = null; }
    try { curUrl = URL.createObjectURL(f); el.previmg.src = curUrl; } catch (e) {}
    el.preview.hidden = false;
    setState('image-ready');
  }

  el.file.addEventListener('change', function () {
    setFile(this.files && this.files[0]);
    this.value = ''; /* re-choosing the same file must refire change */
  });

  el.drop.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('#pickbtn')) return; /* pickbtn handles itself */
    el.file.click();
  });
  el.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.file.click(); }
  });
  el.pick.addEventListener('click', function () { el.file.click(); });

  el.drop.addEventListener('dragover', function (e) { e.preventDefault(); el.drop.classList.add('drag'); });
  el.drop.addEventListener('dragleave', function () { el.drop.classList.remove('drag'); });
  el.drop.addEventListener('drop', function (e) {
    e.preventDefault();
    el.drop.classList.remove('drag');
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    setFile(f);
  });

  window.addEventListener('paste', function (e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image/') === 0) {
        var f = items[i].getAsFile();
        if (f) { setFile(f); break; }
      }
    }
  });

  el.clearimg.addEventListener('click', function () {
    curFile = null;
    if (curUrl) { try { URL.revokeObjectURL(curUrl); } catch (e) {} curUrl = null; }
    el.previmg.removeAttribute('src');
    el.preview.hidden = true;
    setState('idle');
  });

  /* ---------- downscale + JPEG encode (strips EXIF via canvas re-encode) ---------- */
  function fileToJpegBase64(blob, maxEdge, quality) {
    quality = quality == null ? 0.85 : quality;
    function draw(w, h, source) {
      var scale = Math.min(1, maxEdge / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
      var cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      cv.getContext('2d').drawImage(source, 0, 0, cw, ch);
      var dataUrl = cv.toDataURL('image/jpeg', quality);
      return { dataUrl: dataUrl, b64: dataUrl.slice(dataUrl.indexOf(',') + 1) };
    }
    return new Promise(function (resolve, reject) {
      var p = (typeof createImageBitmap === 'function')
        ? createImageBitmap(blob)
        : Promise.reject(new Error('no createImageBitmap'));
      p.then(function (bmp) {
        var out = draw(bmp.width, bmp.height, bmp);
        if (bmp.close) bmp.close();
        resolve(out);
      }).catch(function () {
        /* fallback: <img> + object URL; if this fails too the format is undecodable (HEIC etc.) */
        var url;
        try { url = URL.createObjectURL(blob); } catch (e) { reject({ code: 'decode' }); return; }
        var img = new Image();
        img.onload = function () {
          var out = null;
          try { out = draw(img.naturalWidth, img.naturalHeight, img); } catch (e) {}
          URL.revokeObjectURL(url);
          if (out) resolve(out); else reject({ code: 'decode' });
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject({ code: 'decode' }); };
        img.src = url;
      });
    });
  }

  /* ---------- API ---------- */
  function headers(key) {
    return {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true' /* enables browser CORS */
    };
  }

  function apiRequest(key, b64, hint) {
    return fetch(API_URL, {
      method: 'POST',
      headers: headers(key),
      body: JSON.stringify({
        model: FIND.MODEL, max_tokens: FIND.MAX_TOKENS,
        /* thinking omitted on purpose (extraction task); adaptive is the quality knob later */
        output_config: { effort: FIND.EFFORT,
          format: { type: 'json_schema', schema: FIND.SCHEMA } },
        system: [
          { type: 'text', text: FIND.SYSTEM },
          { type: 'text', text: indexBlock(),          /* header + buildIndex() */
            cache_control: { type: 'ephemeral' } }     /* ~12k stable tokens ≥ Opus 4.8's 4096 min;
                                                          repeat searches ≤5 min read at ~0.1× */
        ],
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
          { type: 'text', text: 'Identify the fashion item(s) in this photo and match them against the brand index.' + (hint ? ' Client hint: ' + hint : '') }
        ] }]
      })
    });
  }

  /* Retry ladder: 413/oversized-400 → one retry at 1200px; 500 → one retry after 2s;
     529 → one retry after 3s. Everything else surfaces through mapError(). */
  function callApi(key, file, hint) {
    var retried413 = false, retried500 = false, retried529 = false;
    function attempt(edge) {
      return fileToJpegBase64(file, edge).then(function (img) {
        return apiRequest(key, img.b64, hint).catch(function () { throw { code: 'network' }; });
      }).then(function (r) {
        if (r.ok) return r.json().catch(function () { throw { code: 'parse', raw: '' }; });
        return r.json().catch(function () { return null; }).then(function (body) {
          var msg = (body && body.error && body.error.message) || '';
          var oversized = r.status === 413 ||
            (r.status === 400 && /image|pixel|dimension|too large|exceeds|megabyte/i.test(msg));
          if (oversized && !retried413 && edge > FIND.RETRY_EDGE) {
            retried413 = true;
            return attempt(FIND.RETRY_EDGE);
          }
          if (oversized) throw { http: 413, apiMsg: msg };
          if (r.status === 500 && !retried500) {
            retried500 = true;
            return delay(2000).then(function () { return attempt(edge); });
          }
          if (r.status === 529 && !retried529) {
            retried529 = true;
            return delay(3000).then(function () { return attempt(edge); });
          }
          throw { http: r.status, apiMsg: msg };
        });
      });
    }
    return attempt(FIND.MAX_EDGE);
  }

  /* Check stop_reason before parsing; the text block's text IS the JSON (structured outputs). */
  function extract(data) {
    if (data.stop_reason === 'refusal') throw { code: 'refusal' };
    var txt = '';
    (data.content || []).forEach(function (b) { if (b.type === 'text') txt += b.text; });
    var parsed = null;
    try { parsed = JSON.parse(txt); } catch (e) {}
    if (!parsed || !Array.isArray(parsed.items)) {
      if (data.stop_reason === 'max_tokens') throw { code: 'cutoff' };
      throw { code: 'parse', raw: txt };
    }
    return parsed;
  }

  /* ---------- analyze flow ---------- */
  el.analyze.addEventListener('click', runAnalyze);

  function runAnalyze() {
    var key = getKey();
    if (!key) { openDrawer(); setKeyStatus(t('find.keys.need', 'Paste your Anthropic API key here to run AI searches.')); return; }
    if (!curFile || state === 'calling') return;
    var f = curFile;
    var hint = el.hint.value.trim();
    setState('calling');
    el.results.hidden = false;
    el.results.innerHTML = '<p class="mut">' + esc(t('find.busy', 'Analyzing the photo against 320 Vietnamese houses… this usually takes under a minute.')) + '</p>';
    callApi(key, f, hint).then(function (data) {
      console.log('[find] usage', data.usage);
      var parsed = extract(data);
      renderResults(parsed);
      setState('results');
      saveToHistory(f, hint, parsed);
    }).catch(function (err) {
      handleFailure(err);
    });
  }

  /* ---------- error map ---------- */
  function httpMessage(status, apiMsg) {
    if (status === 401) return t('find.err.401', 'That key was rejected — check it in the AI settings.');
    if (status === 403) return t('find.err.403', "This key doesn't have API access (check billing on console.anthropic.com).");
    if (status === 413) return t('find.err.413', 'Photo too large — try a screenshot of it.');
    if (status === 429) return t('find.err.429', 'Rate limited — wait a minute and try again.');
    if (status === 500) return t('find.err.500', 'The AI service had an internal error — tried twice, no luck. Try again in a minute.');
    if (status === 529) return t('find.err.529', 'The AI service is overloaded — tried twice. Wait a few minutes, or just send me the photo below.');
    if (status === 400) return t('find.err.400', 'The AI service rejected the request.' + (apiMsg ? ' (' + apiMsg + ')' : ''));
    return t('find.err.http', 'The AI service returned an error (HTTP ' + status + ').');
  }

  function handleFailure(err) {
    err = err || {};
    if (err.code === 'decode') {
      showError(t('find.err.heic', "Couldn't decode this photo (that usually means HEIC): screenshot it — screenshots are PNG — or set the camera to Most Compatible."));
    } else if (err.code === 'network') {
      showError(t('find.err.net', "Couldn't reach the AI service — check your connection."));
    } else if (err.code === 'refusal') {
      showError(t('find.err.refusal', 'The model declined to analyze this image.'));
    } else if (err.code === 'cutoff') {
      showError(t('find.err.cutoff', 'The answer got cut off — try again.'));
    } else if (err.code === 'parse') {
      showError(t('find.err.parse', "Couldn't read the model's answer as JSON — try again."), err.raw || '');
    } else if (err.http) {
      var raw = (err.http === 401 || err.http === 403 || err.http === 400) ? '' : (err.apiMsg || '');
      showError(httpMessage(err.http, err.apiMsg), raw);
    } else {
      showError(t('find.err.unknown', 'Something unexpected went wrong — try again.'), (err && err.message) || '');
    }
  }

  function conciergeLinks() {
    return '<div class="qrow">' +
      '<a class="btn-primary" href="https://tally.so/r/gD10Kl?about=I%20want%20help%20sourcing%20or%20buying%20specific%20items&source=find" target="_blank" rel="noopener">' + esc(t('find.err.send', 'Send it to Seraphic Styler →')) + '</a>' +
      '<a class="btn-ghost" href="https://instagram.com/seraphicstyler" target="_blank" rel="noopener noreferrer">' + esc(t('find.err.dm', 'DM @seraphicstyler')) + '</a>' +
      '</div>';
  }

  /* Every error card ends with the concierge links. */
  function showError(msg, raw) {
    var h = '<div class="err-card"><p>' + esc(msg) + '</p>';
    if (raw) h += '<details><summary>' + esc(t('find.err.raw', 'Details')) + '</summary><pre>' + esc(raw) + '</pre></details>';
    h += conciergeLinks() + '</div>';
    el.results.hidden = false;
    el.results.innerHTML = h;
    setState('error');
  }

  /* ---------- renderer ---------- */
  function renderResults(res) {
    lastResult = res;
    var h = '<h2>' + esc(t('find.res.h', 'What I found')) + '</h2>';
    if (res.overall_notes) h += '<p class="notes">' + esc(res.overall_notes) + '</p>';
    if (!res.items.length) h += '<p class="mut">' + esc(t('find.res.none', 'No identifiable fashion item in this photo.')) + '</p>';
    res.items.forEach(function (it) { h += itemCard(it); });
    h += '<div class="qrow tools">' +
      '<button type="button" class="btn-ghost" data-act="copydesc">' + esc(t('find.res.copy', 'Copy description')) + '</button>' +
      '<button type="button" class="btn-ghost" data-act="copyjson">' + esc(t('find.res.copyjson', 'Copy JSON')) + '</button>' +
      '</div>' +
      '<div class="resend"><a class="btn-primary" href="https://tally.so/r/gD10Kl?about=I%20want%20help%20sourcing%20or%20buying%20specific%20items&source=find-results" target="_blank" rel="noopener">' + esc(t('find.res.send', 'Send this to Seraphic Styler →')) + '</a></div>';
    el.results.innerHTML = h;
    el.results.hidden = false;
  }

  function itemCard(it) {
    var h = '<article class="res-item">';
    h += '<h3>' + esc(it.name_en) + (it.name_vi ? ' <span class="vi">· ' + esc(it.name_vi) + '</span>' : '') + '</h3>';
    h += '<p class="mut">' + esc(it.garment_type) + ' · ' + esc(t('find.res.conf', 'ID confidence')) + ' ' + pct(it.confidence) + '%</p>';
    var chips = [].concat(it.materials || [], it.colors || [], it.motifs || [], it.style_keywords || []);
    if (chips.length) {
      h += '<div class="chiprow">' + chips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div>';
    }
    if (it.visible_brand_text) {
      h += '<p class="mut">' + esc(t('find.res.text', 'Text in the photo:')) + ' “' + esc(it.visible_brand_text) + '”</p>';
    }
    /* Anti-hallucination / anti-injection: keep only brands that exist verbatim in the directory. */
    var ms = (it.matches || []).filter(function (m) { return m && byName.has(m.brand); });
    ms.forEach(function (m) { h += matchCard(m, byName.get(m.brand)); });
    if (!ms.length) h += browseChips(it);
    h += fallbackRow(it);
    h += '</article>';
    return h;
  }

  function matchCard(m, b) {
    var meta = [b.area, b.tier, b.st, b.a].filter(Boolean).map(esc).join(' · ');
    var h = '<div class="match-card">';
    h += '<p class="mname">' + esc(m.brand) + ' <span class="mut">' + pct(m.confidence) + '%</span></p>';
    h += '<div class="conf-bar"><span style="width:' + pct(m.confidence) + '%"></span></div>';
    h += '<p class="reason">' + esc(m.reason) + '</p>';
    if (meta) h += '<p class="mut">' + meta + '</p>';
    if (b.flag) h += '<p class="flagnote">⚑ ' + esc(t('find.res.flag', 'listed as needing re-verification — check before you go')) + '</p>';
    h += '<div class="qrow">';
    if (b.h) h += '<a class="qpill" href="https://instagram.com/' + encodeURIComponent(b.h) + '" target="_blank" rel="noopener noreferrer">@' + esc(b.h) + '</a>';
    if (b.w && /^https?:\/\//i.test(b.w)) h += '<a class="qpill" href="' + esc(b.w) + '" target="_blank" rel="noopener noreferrer">' + esc(t('find.res.site', 'Website')) + '</a>';
    h += '<a class="viewbtn" href="fashion-directory#q=' + encodeURIComponent(b.n) + '">' + esc(t('find.res.view', 'View in directory →')) + '</a>';
    h += '</div></div>';
    return h;
  }

  function browseChips(it) {
    var chips = '';
    if (it.directory_category && it.directory_category !== 'other') {
      chips += '<a class="qpill" href="fashion-directory#cat=' + encodeURIComponent(it.directory_category) + '">' +
        esc(t('find.res.browsecat', 'Browse')) + ' ' + esc(it.directory_category) + ' →</a>';
    }
    if (it.price_tier_guess && it.price_tier_guess !== 'unknown') {
      chips += '<a class="qpill" href="fashion-directory#tier=' + encodeURIComponent(it.price_tier_guess) + '">' +
        esc(t('find.res.browsetier', 'Browse')) + ' ' + esc(it.price_tier_guess) + ' →</a>';
    }
    if (!chips) return '';
    return '<p class="mut">' + esc(t('find.res.nomatch', 'No confident match in the directory — browse the closest shelves:')) + '</p>' +
      '<div class="qrow">' + chips + '</div>';
  }

  function fallbackRow(it) {
    var qs = (it.search_queries || []).slice(0, 6);
    var tags = (it.instagram_hashtags || []).slice(0, 4);
    if (!qs.length && !tags.length) return '';
    var h = '<p class="mut">' + esc(t('find.res.search', 'Keep hunting with these searches:')) + '</p><div class="qrow">';
    qs.forEach(function (q) {
      h += '<a class="qpill" href="https://www.google.com/search?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener">' + esc(q) + '</a>';
    });
    if (qs[0]) {
      h += '<a class="qpill" href="https://www.google.com/search?udm=2&q=' + encodeURIComponent(qs[0]) + '" target="_blank" rel="noopener">' + esc(t('find.res.gimg', 'Google Images')) + '</a>';
      h += '<a class="qpill" href="https://shopee.vn/search?keyword=' + encodeURIComponent(qs[0]) + '" target="_blank" rel="noopener">Shopee</a>';
    }
    tags.forEach(function (tag) {
      var tg = String(tag).replace(/[#\s]/g, '');
      if (tg) h += '<a class="qpill" href="https://instagram.com/explore/tags/' + encodeURIComponent(tg) + '/" target="_blank" rel="noopener noreferrer">#' + esc(tg) + '</a>';
    });
    h += '</div><p class="mut">' + esc(t('find.res.lens', 'Tip: Google Lens on the saved photo (camera icon in the Google app or Chrome) is the best exact-match finder.')) + '</p>';
    return h;
  }

  /* Copy buttons (delegated — results re-render wholesale) */
  el.results.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || !lastResult) return;
    var txt = b.dataset.act === 'copyjson'
      ? JSON.stringify(lastResult, null, 2)
      : descText(lastResult);
    copyText(txt, b);
  });

  function descText(res) {
    var lines = [];
    (res.items || []).forEach(function (it, i) {
      lines.push((i + 1) + '. ' + it.name_en + ' / ' + it.name_vi + ' — ' + it.garment_type);
      if ((it.materials || []).length) lines.push('   materials: ' + it.materials.join(', '));
      if ((it.colors || []).length) lines.push('   colors: ' + it.colors.join(', '));
      if ((it.motifs || []).length) lines.push('   details: ' + it.motifs.join(', '));
      if (it.visible_brand_text) lines.push('   text in photo: ' + it.visible_brand_text);
      var ms = (it.matches || []).filter(function (m) { return m && byName.has(m.brand); });
      if (ms.length) lines.push('   possible houses: ' + ms.map(function (m) { return m.brand + ' (' + pct(m.confidence) + '%)'; }).join(', '));
    });
    if (res.overall_notes) { lines.push(''); lines.push(res.overall_notes); }
    return lines.join('\n');
  }

  function copyText(txt, btn) {
    function done(ok) {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = ok ? t('find.copied', 'Copied ✓') : t('find.copyfail', 'Copy failed');
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    try {
      navigator.clipboard.writeText(txt).then(function () { done(true); }, function () { done(false); });
    } catch (e) { done(false); }
  }

  /* ---------- history (ss-find-history, cap 10, quota-safe) ---------- */
  function loadHist() {
    try {
      var d = JSON.parse(localStorage.getItem(FIND.HIST_LS) || '[]');
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }
  function persistHist(list) {
    try { localStorage.setItem(FIND.HIST_LS, JSON.stringify(list)); return true; }
    catch (e) {
      if (list.length > 1) { /* quota: evict oldest, retry once, else skip */
        try { localStorage.setItem(FIND.HIST_LS, JSON.stringify(list.slice(0, list.length - 1))); return true; } catch (e2) {}
      }
      return false;
    }
  }
  function saveToHistory(file, hint, result) {
    fileToJpegBase64(file, FIND.THUMB_EDGE, FIND.THUMB_Q).then(function (img) {
      pushHist(img.dataUrl);
    }).catch(function () {
      pushHist('');
    });
    function pushHist(thumb) {
      var list = loadHist();
      list.unshift({ t: Date.now(), thumb: thumb, hint: hint, model: FIND.MODEL, result: result });
      if (list.length > FIND.HIST_CAP) list = list.slice(0, FIND.HIST_CAP);
      persistHist(list);
      renderHist();
    }
  }
  function renderHist() {
    var list = loadHist();
    el.history.hidden = !list.length;
    el.histstrip.innerHTML = list.map(function (en, i) {
      var d = new Date(en.t || 0);
      return '<button type="button" data-i="' + i + '" title="' + esc(en.hint || '') + '">' +
        (en.thumb ? '<img src="' + esc(en.thumb) + '" alt="" />' : '') +
        '<span class="mut">' + esc(d.toLocaleDateString()) + '</span></button>';
    }).join('');
  }
  el.histstrip.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button[data-i]') : null;
    if (!b) return;
    var en = loadHist()[+b.dataset.i];
    if (en && en.result) { /* re-renders fully offline — no API call */
      renderResults(en.result);
      setState(curFile ? 'image-ready' : 'idle');
      el.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  el.histclear.addEventListener('click', function () {
    try { localStorage.removeItem(FIND.HIST_LS); } catch (e) {} /* never touches ss-find-key */
    renderHist();
  });

  /* ---------- quickFind — keyword scorer over the directory ---------- */
  function quickFind(q) {
    var toks = fold(q).split(/\s+/).filter(Boolean);
    if (!toks.length) { el.qfresults.innerHTML = ''; return; }
    var scored = [];
    DIR.forEach(function (b) {
      var n = fold(b.n), hnd = fold(b.h), no = fold(b.no), area = fold(b.area), a = fold(b.a),
          cat = fold(b.cat), sub = fold(b.sub), fib = fold((b.fib || []).join(' ')), vibe = fold(b.vibe);
      var score = 0, all = true;
      toks.forEach(function (tk) {
        var s = 0;
        if (n === tk) s = 60; else if (n.indexOf(tk) === 0) s = 40; else if (n.indexOf(tk) > -1) s = 24;
        if (hnd && hnd.indexOf(tk) > -1) s = Math.max(s, 28);
        if (area.indexOf(tk) > -1 || a.indexOf(tk) > -1) s = Math.max(s, 12);
        if (cat.indexOf(tk) > -1 || sub.indexOf(tk) > -1) s = Math.max(s, 10);
        if (fib.indexOf(tk) > -1 || vibe.indexOf(tk) > -1) s = Math.max(s, 8);
        if (no.indexOf(tk) > -1) s = Math.max(s, 5);
        if (!s) all = false; else score += s;
      });
      if (all) scored.push([score, b]);
    });
    scored.sort(function (x, y) { return y[0] - x[0]; });
    el.qfresults.innerHTML = scored.slice(0, 10).map(function (p) {
      var b = p[1];
      var meta = [b.cat, b.area || b.city].filter(Boolean).join(' · ');
      return '<a class="qfrow" href="fashion-directory#q=' + encodeURIComponent(b.n) + '">' +
        '<span>' + esc(b.n) + '</span><span class="mut">' + esc(meta) + '</span></a>';
    }).join('') || '<p class="mut">' + esc(t('find.qf.none', 'Nothing in the directory matches that — try the concierge above.')) + '</p>';
  }
  el.qf.addEventListener('input', debounce(function () { quickFind(el.qf.value); }, 140));

  /* ---------- i18n live re-render ---------- */
  window.addEventListener('ss:lang', function () {
    renderHist();
    if (lastResult && state === 'results') renderResults(lastResult);
    setState(state);
  });

  /* ---------- boot ---------- */
  syncMode();
  renderHist();
  setState('idle');

  /* ---------- theme toggle (verbatim from fashion-directory.html) ---------- */
  document.getElementById("theme").addEventListener("click",function(){
    const d=document.documentElement.getAttribute("data-theme")==="dark";
    const next=d?"light":"dark";
    document.documentElement.setAttribute("data-theme",next);
    this.setAttribute("aria-pressed",String(next==="dark"));
    try{localStorage.setItem("ss-theme",next);}catch(e){}});
  document.getElementById("theme").setAttribute("aria-pressed",
    String(document.documentElement.getAttribute("data-theme")==="dark"));

})();

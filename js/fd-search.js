/* Seraphic Styler — directory search (fd-search.js)
   ----------------------------------------------------------------------
   The directory is Vietnamese. Almost nobody types Vietnamese.

   A client on a US keyboard types "ao dai", "phu nhuan", "thao dien",
   "district 3" — and a plain substring match over the raw records finds
   none of them, because the data says "áo dài", "Phú Nhuận", "Thảo Điền"
   and "D3". This module is that fix and nothing more: it folds both sides
   of the comparison down to unaccented lowercase, teaches the query the
   handful of ways a Saigon district gets written, and lets a few English
   words reach the taxonomy the data only stores in code (cat/tier/st/
   fib/occ).

   The model — a query is a list of TERMS; each term carries one or more
   ALTERNATIVES. A house matches when every term has at least one
   alternative present in its key: AND across terms, OR inside one. That
   is what makes word order stop mattering, so "studio resel" and "resel
   studio" are the same two terms.

   Deliberately NOT here: fuzzy/typo matching. It buys little on 300
   curated names and every false positive it invents lands in a directory
   whose whole value is that its rows are true.

   Everything is offline and synchronous — one pass over the records at
   boot, then string work. No network, no index files, no dependencies.

   window.SS_SEARCH = { fold, index, keyOf, parse, test, score }
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_SEARCH) return;

  /* — Folding. NFD splits a letter from its tone marks so the marks can be
       dropped; đ is a letter in its own right, does not decompose, and has
       to be mapped by hand. This is the whole reason "ao dai" failed. — */
  function fold(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  /* Taxonomy tokens are prefixed with '~' so they can never collide with
     anything a client types or anything the data says. */
  var TOK = '~';

  /* A district as the DATA writes it: "D3", "Q.3", "Q10". Ward numbers
     ("P.5") are not districts and must not be read as one. */
  var DOC_DISTRICT = /\b[dq]\.?\s?(\d{1,2})\b/g;
  /* A district as a CLIENT writes it: "district 3", "dist 3", "quan 3",
     "quận 3" (folded to "quan"), "q3", "q.3", "d3". */
  var QUERY_DISTRICT = /\b(?:districts?|dist|quan|[dq])\s*\.?\s*(\d{1,2})\b/g;

  /* Multi-word phrasings, matched before the query is split into words.
     Longest first so "wedding dress" wins over "wedding". The literal
     phrase stays an alternative — these widen a search, never narrow it. */
  var PHRASES = {
    'ao dai cuoi': [TOK + 'cat-bridal'],
    'wedding dress': [TOK + 'cat-bridal'],
    'wedding gown': [TOK + 'cat-bridal'],
    'made to measure': [TOK + 'cat-tailor'],
    'ready to wear': [TOK + 'cat-women'],
    'second hand': [TOK + 'cat-vintage', TOK + 'fib-circular'],
    'date night': [TOK + 'occ-night'],
    'night out': [TOK + 'occ-night'],
    'noi y': [TOK + 'cat-lingerie'],
    'do lot': [TOK + 'cat-lingerie'],
    'bra fitting': [TOK + 'cat-lingerie'],
    'ao nguc': [TOK + 'cat-lingerie'],
    'ao dai': [TOK + 'cat-tailor'],
    'ao cuoi': [TOK + 'cat-bridal'],
    'pop up': [TOK + 'st-popup', TOK + 'cat-market'],
    'walk in': [TOK + 'st-walk']
  };

  /* Single words a client reaches for that the data files under a code. */
  var WORDS = {
    /* category */
    wedding: [TOK + 'cat-bridal'], bridal: [TOK + 'cat-bridal'], bride: [TOK + 'cat-bridal'],
    gown: [TOK + 'cat-bridal'], gowns: [TOK + 'cat-bridal'],
    men: [TOK + 'cat-men'], mens: [TOK + 'cat-men'], menswear: [TOK + 'cat-men'],
    women: [TOK + 'cat-women'], womens: [TOK + 'cat-women'], womenswear: [TOK + 'cat-women'],
    tailor: [TOK + 'cat-tailor'], tailors: [TOK + 'cat-tailor'], tailoring: [TOK + 'cat-tailor'],
    bespoke: [TOK + 'cat-tailor'], atelier: [TOK + 'cat-tailor'], custom: [TOK + 'cat-tailor'],
    embroidery: [TOK + 'cat-tailor'],
    vintage: [TOK + 'cat-vintage'], thrift: [TOK + 'cat-vintage'], preloved: [TOK + 'cat-vintage'],
    secondhand: [TOK + 'cat-vintage'], upcycled: [TOK + 'cat-vintage', TOK + 'fib-circular'],
    activewear: [TOK + 'cat-active'], athleisure: [TOK + 'cat-active'], gym: [TOK + 'cat-active'],
    yoga: [TOK + 'cat-active'], pilates: [TOK + 'cat-active'], sportswear: [TOK + 'cat-active'],
    lingerie: [TOK + 'cat-lingerie'], underwear: [TOK + 'cat-lingerie'], intimates: [TOK + 'cat-lingerie'],
    bra: [TOK + 'cat-lingerie'], bras: [TOK + 'cat-lingerie'], bralette: [TOK + 'cat-lingerie'],
    bralettes: [TOK + 'cat-lingerie'], knickers: [TOK + 'cat-lingerie'], panties: [TOK + 'cat-lingerie'],
    briefs: [TOK + 'cat-lingerie'], corset: [TOK + 'cat-lingerie'], corsetry: [TOK + 'cat-lingerie'],
    sleepwear: [TOK + 'cat-sleep'], nightwear: [TOK + 'cat-sleep'], loungewear: [TOK + 'cat-sleep'],
    pyjamas: [TOK + 'cat-sleep'], pajamas: [TOK + 'cat-sleep'], pjs: [TOK + 'cat-sleep'],
    accessories: [TOK + 'cat-access'], jewelry: [TOK + 'cat-access'], jewellery: [TOK + 'cat-access'],
    bags: [TOK + 'cat-access'], shoes: [TOK + 'cat-access'], heels: [TOK + 'cat-access'],
    eyewear: [TOK + 'cat-access'], sunglasses: [TOK + 'cat-access'],
    market: [TOK + 'cat-market'], markets: [TOK + 'cat-market'], popup: [TOK + 'st-popup'],
    luxury: [TOK + 'cat-luxury'], designer: [TOK + 'cat-luxury'],
    /* fabric */
    linen: [TOK + 'fib-linen'], silk: [TOK + 'fib-silk'], cotton: [TOK + 'fib-cotton'],
    hemp: [TOK + 'fib-hemp'], tencel: [TOK + 'fib-tencel'],
    sustainable: [TOK + 'fib-circular'], eco: [TOK + 'fib-circular'],
    circular: [TOK + 'fib-circular'], natural: [TOK + 'fib-cotton', TOK + 'fib-linen', TOK + 'fib-silk'],
    /* occasion */
    birthday: [TOK + 'occ-bday'], bday: [TOK + 'occ-bday'],
    formal: [TOK + 'occ-event'], ball: [TOK + 'occ-event'], gala: [TOK + 'occ-event'],
    event: [TOK + 'occ-event'], party: [TOK + 'occ-night'], nightlife: [TOK + 'occ-night'],
    club: [TOK + 'occ-night'],
    /* tier + access */
    couture: [TOK + 'tier-couture'], premium: [TOK + 'tier-premium'],
    online: [TOK + 'st-online'], appointment: [TOK + 'st-appt'], appt: [TOK + 'st-appt'],
    /* place */
    saigon: [TOK + 'city-sgn'], hcmc: [TOK + 'city-sgn'], sgn: [TOK + 'city-sgn'],
    hanoi: [TOK + 'city-han'], downtown: [TOK + 'q1'], centre: [TOK + 'q1'], center: [TOK + 'q1']
  };

  /* Page furniture, not data. "shops in district 3" must not fail on
     "shops" and "in". */
  var STOP = {
    a: 1, an: 1, the: 1, in: 1, on: 1, at: 1, of: 1, for: 1, to: 1, and: 1, or: 1,
    near: 1, me: 1, my: 1, i: 1, is: 1, are: 1, with: 1, any: 1,
    shop: 1, shops: 1, store: 1, stores: 1, brand: 1, brands: 1, house: 1, houses: 1
  };

  var PHRASE_KEYS = Object.keys(PHRASES).sort(function (a, b) { return b.length - a.length; });

  /* — The searchable key for one house: everything it can be found by,
       folded, plus its taxonomy as tokens. — */
  function keyOf(b) {
    var text = fold([b.n, b.h, b.a, b.no, b.area].join(' '));
    var tok = [];
    var place = fold((b.area || '') + ' ' + (b.a || ''));
    var m;
    DOC_DISTRICT.lastIndex = 0;
    while ((m = DOC_DISTRICT.exec(place))) tok.push(TOK + 'q' + parseInt(m[1], 10));
    if (b.cat) tok.push(TOK + 'cat-' + b.cat);
    if (b.tier) tok.push(TOK + 'tier-' + b.tier);
    if (b.st) tok.push(TOK + 'st-' + b.st);
    if (b.city) tok.push(TOK + 'city-' + fold(b.city));
    if (b.sig) tok.push(TOK + 'signature');
    (b.fib || []).forEach(function (f) { tok.push(TOK + 'fib-' + f); });
    (b.occ || []).forEach(function (o) { tok.push(TOK + 'occ-' + o); });
    var seen = {}, out = [];
    tok.forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } });
    return text + ' ' + out.join(' ');
  }

  /* Stamped non-enumerably so the tray, the route planner and anything else
     that serialises a record never sees it. */
  function index(list) {
    (list || []).forEach(function (b) {
      if (!b || b._sk) return;
      try {
        Object.defineProperty(b, '_sk', { value: keyOf(b), enumerable: false, writable: true, configurable: true });
      } catch (e) { b._sk = keyOf(b); }
    });
    return list;
  }

  /* — Query → terms. Districts first (they consume "district 3" whole),
       then phrases, then what is left word by word. — */
  function parse(q) {
    var f = fold(q).replace(/[^a-z0-9\s.'&\/-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!f) return [];
    var terms = [];

    QUERY_DISTRICT.lastIndex = 0;
    f = f.replace(QUERY_DISTRICT, function (_, d) {
      terms.push([TOK + 'q' + parseInt(d, 10)]);
      return ' ';
    });

    PHRASE_KEYS.forEach(function (p) {
      if (f.indexOf(p) < 0) return;
      terms.push([p].concat(PHRASES[p]));
      f = f.split(p).join(' ');
    });

    f.split(/\s+/).forEach(function (w) {
      w = w.replace(/^[.'&\/-]+|[.'&\/-]+$/g, '');
      if (!w || STOP[w]) return;
      terms.push([w].concat(WORDS[w] || []));
    });

    /* A query of nothing but stopwords should show the whole directory
       rather than nothing at all. */
    return terms;
  }

  /* AND across terms, OR inside one. */
  function test(key, terms) {
    for (var i = 0; i < terms.length; i++) {
      var alts = terms[i], hit = false;
      for (var j = 0; j < alts.length; j++) {
        if (alts[j] && key.indexOf(alts[j]) >= 0) { hit = true; break; }
      }
      if (!hit) return false;
    }
    return true;
  }

  /* Relevance, so a house whose NAME is the query outranks one that merely
     mentions it in a note. Taxonomy tokens are skipped — they say a row
     qualifies, not that it is a better answer. */
  function score(b, terms) {
    var n = fold(b.n), h = fold(b.h || ''),
        place = fold((b.area || '') + ' ' + (b.a || '')), note = fold(b.no || '');
    var s = 0;
    terms.forEach(function (alts) {
      alts.forEach(function (a) {
        if (!a || a.charAt(0) === TOK) return;
        if (n === a) s += 100;
        else if (n.indexOf(a) === 0) s += 50;
        else if (n.indexOf(a) >= 0) s += 25;
        else if (h.indexOf(a) >= 0) s += 12;
        else if (place.indexOf(a) >= 0) s += 6;
        else if (note.indexOf(a) >= 0) s += 2;
      });
    });
    return s;
  }

  window.SS_SEARCH = { fold: fold, index: index, keyOf: keyOf, parse: parse, test: test, score: score };
})();

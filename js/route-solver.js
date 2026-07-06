/* ============================================================================
   SS_ROUTE — a small, dependency-free route optimizer for the Saigon fashion
   directory. Solves the multi-stop shopping run as a Traveling Salesman Problem:
   build a road-distance matrix, construct with nearest-neighbour, then improve
   with 2-opt (neighbour-list + early-termination pruning) and Or-opt. For small
   sets (<=12 stops) it also runs an exact Held–Karp DP and keeps the shorter.

   Everything is offline: distances are haversine × an HCMC road-circuity factor,
   times layer a time-of-day traffic multiplier over an effective mode speed, and
   cost reproduces Grab's per-leg fare bands. No API, no key, no backend.

   stops: [{ n, lat, lng, hours? }]  — stops[0] is treated as the fixed origin.
   Usage:  const plan = SS_ROUTE.solve(stops, { mode:'bike', startMin:540,
                                                roundTrip:true, dwellMin:25 });
   ========================================================================== */
(function (root) {
  'use strict';

  var R = 6371;          // Earth radius, km
  var CIRCUITY = 1.4;    // straight-line → street-distance factor for HCMC
  var SPEED = { walk: 4.5, bike: 20, car: 16 }; // effective door-to-door km/h
  var FX = 24500;        // ₫ per USD
  // Grab per-leg fare bands (₫): a multi-stop day is separate rides, one per leg.
  var FARE = { walk: { base: 0, perKm: 0 }, bike: { base: 12000, perKm: 4000 }, car: { base: 29000, perKm: 11000 } };

  var toRad = function (d) { return d * Math.PI / 180; };

  function haversine(a, b) {
    var dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }
  function roadKm(a, b) { return haversine(a, b) * CIRCUITY; }
  function speedKmh(mode) { return SPEED[mode] || SPEED.bike; }

  /* HCMC time-of-day traffic multiplier (minutes since midnight). Pure heuristic
     — the offline stand-in for a live feed. Evening rush is the worst. */
  function trafficMult(m) {
    m = ((m % 1440) + 1440) % 1440;
    if (m >= 420 && m < 540) return 1.6;    // 07:00–09:00 morning rush
    if (m >= 990 && m < 1170) return 1.7;   // 16:30–19:30 evening rush
    if (m >= 660 && m < 780) return 1.25;   // 11:00–13:00 lunch
    if (m >= 1320 || m < 360) return 0.85;  // 22:00–06:00 clear night
    return 1.0;
  }
  function segMinutes(km, mode, minOfDay) { return km / speedKmh(mode) * 60 * trafficMult(minOfDay); }

  /* Symmetric road-distance matrix (km). Optimisation minimises distance, which
     is order-invariant to a single departure-time multiplier; the realistic,
     rush-hour-aware clock is applied later in schedule(). */
  function buildMatrix(stops) {
    var n = stops.length, dist = [], i, k;
    for (i = 0; i < n; i++) {
      dist[i] = [];
      for (k = 0; k < n; k++) dist[i][k] = (i === k) ? 0 : roadKm(stops[i], stops[k]);
    }
    return { dist: dist };
  }

  function tourLen(order, D, roundTrip) {
    var n = order.length, s = 0, i;
    for (i = 0; i < n - 1; i++) s += D[order[i]][order[i + 1]];
    if (roundTrip && n > 1) s += D[order[n - 1]][order[0]];
    return s;
  }

  /* Greedy construction from the fixed origin (index 0). */
  function nearestNeighbor(D, start) {
    start = start || 0;
    var n = D.length, visited = new Array(n), order = [start], i, cur, best, bj;
    for (i = 0; i < n; i++) visited[i] = false;
    visited[start] = true;
    while (order.length < n) {
      cur = order[order.length - 1]; best = Infinity; bj = -1;
      for (i = 0; i < n; i++) {
        if (!visited[i] && D[cur][i] < best) { best = D[cur][i]; bj = i; }
      }
      order.push(bj); visited[bj] = true;
    }
    return order;
  }

  function buildNeighbors(D, K) {
    var n = D.length, nbr = [], i, j, list;
    for (i = 0; i < n; i++) {
      list = [];
      for (j = 0; j < n; j++) if (j !== i) list.push(j);
      list.sort(function (a, b) { return D[i][a] - D[i][b]; });
      nbr[i] = list.slice(0, K);
    }
    return nbr;
  }

  /* 2-opt with sorted neighbour lists + early termination (the pruning idea
     borrowed from RAPTOR's transfer scan): once the candidate edge (c1,c2) is no
     shorter than the edge we'd remove, no later neighbour can improve it → break.
     Index 0 (origin) is never moved. */
  function twoOpt(order, D, opts) {
    opts = opts || {};
    var roundTrip = !!opts.roundTrip, n = order.length;
    if (n < 4) return order.slice();
    var K = Math.min(n - 1, opts.neighbors || 10);
    var nbr = buildNeighbors(D, K);
    var route = order.slice(), pos = new Array(n), i;
    for (i = 0; i < n; i++) pos[route[i]] = i;

    function reverse(a, b) { // reverse positions a..b (a>=1 keeps origin fixed)
      while (a < b) { var x = route[a], y = route[b]; route[a] = y; route[b] = x; pos[y] = a; pos[x] = b; a++; b--; }
    }

    var improved = true, guard = 0;
    while (improved && guard++ < 1000) {
      improved = false;
      for (var p1 = 0; p1 <= n - 2; p1++) {
        var c1 = route[p1], succ = route[p1 + 1], dRemove = D[c1][succ];
        var nb = nbr[c1];
        for (var t = 0; t < nb.length; t++) {
          var c2 = nb[t];
          if (D[c1][c2] >= dRemove) break;          // early termination
          var k = pos[c2];
          if (k <= p1) continue;                     // forward segments only
          if (!roundTrip && k === n - 1) continue;   // open path: no edge past the end
          var kSucc = route[(k + 1) % n];
          var delta = (D[c1][c2] + D[succ][kSucc]) - (dRemove + D[c2][kSucc]);
          if (delta < -1e-9) { reverse(p1 + 1, k); improved = true; break; }
        }
      }
    }
    return route;
  }

  /* Or-opt: relocate runs of length 1–3 (optionally reversed) to a better slot.
     Catches improvements 2-opt structurally can't. Origin stays at index 0. */
  function orOpt(order, D, opts) {
    opts = opts || {};
    var roundTrip = !!opts.roundTrip, n = order.length;
    if (n < 4) return order.slice();
    var route = order.slice(), improved = true, guard = 0;
    while (improved && guard++ < 1000) {
      improved = false;
      for (var L = 1; L <= 3 && L < n - 1; L++) {
        for (var i = 1; i + L <= n; i++) {
          var seg = route.slice(i, i + L);
          var rest = route.slice(0, i).concat(route.slice(i + L));
          var baseBest = tourLen(route, D, roundTrip);
          var bestOrder = null, bestLen = baseBest;
          for (var q = 0; q < rest.length; q++) {
            if (q === 0) continue; // never insert before the fixed origin
            var fwd = rest.slice(0, q).concat(seg, rest.slice(q));
            var lf = tourLen(fwd, D, roundTrip);
            if (lf < bestLen - 1e-9) { bestLen = lf; bestOrder = fwd; }
            var rev = rest.slice(0, q).concat(seg.slice().reverse(), rest.slice(q));
            var lr = tourLen(rev, D, roundTrip);
            if (lr < bestLen - 1e-9) { bestLen = lr; bestOrder = rev; }
          }
          if (bestOrder) { route = bestOrder; improved = true; break; }
        }
        if (improved) break;
      }
    }
    return route;
  }

  /* Exact optimum via Held–Karp bitmask DP (n<=12). Fixed start at index 0. */
  function heldKarp(D, roundTrip) {
    var n = D.length;
    if (n > 12 || n < 2) return null;
    var FULL = 1 << n, INF = Infinity, mask, j, k;
    var dp = [], par = [];
    for (mask = 0; mask < FULL; mask++) { dp[mask] = new Float64Array(n).fill(INF); par[mask] = new Int8Array(n).fill(-1); }
    dp[1][0] = 0;
    for (mask = 1; mask < FULL; mask++) {
      if (!(mask & 1)) continue;
      for (j = 0; j < n; j++) {
        if (!(mask & (1 << j)) || dp[mask][j] === INF) continue;
        for (k = 0; k < n; k++) {
          if (mask & (1 << k)) continue;
          var nm = mask | (1 << k), nd = dp[mask][j] + D[j][k];
          if (nd < dp[nm][k]) { dp[nm][k] = nd; par[nm][k] = j; }
        }
      }
    }
    var full = FULL - 1, best = INF, end = -1;
    for (j = 0; j < n; j++) {
      if (dp[full][j] === INF) continue;
      var tot = dp[full][j] + (roundTrip ? D[j][0] : 0);
      if (tot < best) { best = tot; end = j; }
    }
    if (end < 0) return null;
    var order = [], m = full, cur = end, p;
    while (cur !== -1) { order.push(cur); p = par[m][cur]; m ^= (1 << cur); cur = p; }
    order.reverse();
    return order;
  }

  /* Opening hours "10:00–21:00" / "8:30-21:40 daily" → {open,close} in minutes. */
  function parseHours(str) {
    if (!str) return null;
    var m = String(str).match(/(\d{1,2})[:h](\d{2})\s*[–\-—]\s*(\d{1,2})[:h](\d{2})/);
    if (!m) return null;
    var open = +m[1] * 60 + +m[2], close = +m[3] * 60 + +m[4];
    return { open: open, close: close };
  }

  function windowFeasible(order, stops, arrivals) {
    var violations = [], p, s, h, a;
    for (p = 0; p < order.length; p++) {
      s = stops[order[p]]; h = s && s.hours ? parseHours(s.hours) : null;
      if (!h) continue;
      a = ((arrivals[p] % 1440) + 1440) % 1440;
      if (a < h.open) violations.push({ i: p, n: s.n, arrive: a, open: h.open, close: h.close, type: 'early' });
      else if (a > h.close) violations.push({ i: p, n: s.n, arrive: a, open: h.open, close: h.close, type: 'late' });
    }
    return { ok: violations.length === 0, violations: violations };
  }

  /* Walk the order on a real clock (rush-hour multipliers applied per leg) to get
     arrivals, per-leg travel minutes, and totals. dwellMin = shopping time/stop. */
  function schedule(order, stops, opts) {
    opts = opts || {};
    var mode = opts.mode || 'bike';
    var startMin = opts.startMin == null ? 540 : opts.startMin;
    var dwell = opts.dwellMin == null ? 25 : opts.dwellMin;
    var roundTrip = !!opts.roundTrip;
    var originIsStop = opts.originIsStop !== false;
    var n = order.length, legs = [], arrivals = [], clock = startMin, travel = 0, p;
    arrivals[0] = clock;
    for (p = 1; p < n; p++) {
      clock += (p === 1 ? (originIsStop ? dwell : 0) : dwell); // shop previous stop before leaving
      var from = order[p - 1], to = order[p];
      var km = roadKm(stops[from], stops[to]);
      var mins = km / speedKmh(mode) * 60 * trafficMult(clock);
      clock += mins; travel += mins;
      legs.push({ from: from, to: to, km: km, min: mins });
      arrivals[p] = clock;
    }
    clock += dwell; // shop the last stop
    if (roundTrip && n > 1) {
      var f = order[n - 1], t = order[0], km2 = roadKm(stops[f], stops[t]);
      var mn2 = km2 / speedKmh(mode) * 60 * trafficMult(clock);
      clock += mn2; travel += mn2;
      legs.push({ from: f, to: t, km: km2, min: mn2 });
    }
    var totalKm = legs.reduce(function (a, l) { return a + l.km; }, 0);
    return { legs: legs, arrivals: arrivals, totalKm: totalKm, travelMin: travel, finishMin: clock, durationMin: clock - startMin };
  }

  function estimateCost(legs, opts) {
    opts = opts || {};
    var mode = opts.mode || 'bike', surge = opts.surge || 1;
    var rate = FARE[mode] || FARE.bike;
    var byLeg = legs.map(function (l) { return Math.round((rate.base + rate.perKm * l.km) * surge); });
    var vnd = byLeg.reduce(function (a, b) { return a + b; }, 0);
    return { vnd: vnd, usd: +(vnd / FX).toFixed(1), byLeg: byLeg };
  }

  function pad(x) { return (x < 10 ? '0' : '') + x; }
  function hm(min) { var m = Math.round(((min % 1440) + 1440) % 1440); return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function dur(min) { var m = Math.round(min), h = Math.floor(m / 60), r = m % 60; return (h ? h + ' h ' : '') + r + ' m'; }

  /* Orchestrator — returns the plan contract consumed by the panel. */
  function solve(stops, opts) {
    opts = opts || {};
    var roundTrip = !!opts.roundTrip, n = stops.length;
    if (n === 0) return null;
    var D = buildMatrix(stops).dist;
    var baseKm = tourLen(stops.map(function (_, i) { return i; }), D, roundTrip);

    var order, method;
    if (n <= 3) {
      order = stops.map(function (_, i) { return i; }); method = 'trivial';
    } else {
      order = nearestNeighbor(D, 0);
      order = twoOpt(order, D, { roundTrip: roundTrip, neighbors: opts.neighbors });
      order = orOpt(order, D, { roundTrip: roundTrip });
      method = 'nn+2opt+oropt';
    }
    if (n >= 2 && n <= 12) {
      var hk = heldKarp(D, roundTrip);
      if (hk) {
        var hkLen = tourLen(hk, D, roundTrip), curLen = tourLen(order, D, roundTrip);
        if (hkLen < curLen - 1e-9) { order = hk; method = 'heldKarp'; }
        else if (Math.abs(hkLen - curLen) < 1e-6 && method !== 'trivial') method = 'nn+2opt+oropt (proven optimal)';
        else if (method === 'trivial') { order = hk; method = 'heldKarp'; }
      }
    }

    var optKm = tourLen(order, D, roundTrip);
    var sched = schedule(order, stops, opts);
    var cost = estimateCost(sched.legs, opts);
    var window = windowFeasible(order, stops, sched.arrivals);
    return {
      order: order,
      stops: order.map(function (i) { return stops[i]; }),
      legs: sched.legs,
      totalKm: +optKm.toFixed(2),
      totalMin: Math.round(sched.durationMin),
      travelMin: Math.round(sched.travelMin),
      finishMin: Math.round(sched.finishMin),
      etaText: hm(sched.finishMin),
      durationText: dur(sched.durationMin),
      arrivals: sched.arrivals.map(function (a) { return Math.round(a); }),
      cost: cost,
      window: window,
      method: method,
      improvedFrom: { km: +baseKm.toFixed(2), pct: baseKm > 0 ? Math.max(0, Math.round((baseKm - optKm) / baseKm * 100)) : 0 },
      roundTrip: roundTrip
    };
  }

  var SS_ROUTE = {
    haversine: haversine, roadKm: roadKm, speedKmh: speedKmh, trafficMult: trafficMult, segMinutes: segMinutes,
    buildMatrix: buildMatrix, tourLen: tourLen, nearestNeighbor: nearestNeighbor,
    twoOpt: twoOpt, orOpt: orOpt, heldKarp: heldKarp,
    parseHours: parseHours, windowFeasible: windowFeasible, schedule: schedule, estimateCost: estimateCost,
    hm: hm, dur: dur, solve: solve,
    CONST: { CIRCUITY: CIRCUITY, SPEED: SPEED, FX: FX, FARE: FARE }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SS_ROUTE;
  if (typeof window !== 'undefined') window.SS_ROUTE = SS_ROUTE;
  root.SS_ROUTE = SS_ROUTE;
})(typeof globalThis !== 'undefined' ? globalThis : this);

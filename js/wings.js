/* The butterfly: vector wings redrawn every frame at the screen's own resolution, shared by every page.
   Light: pearl with fine cobalt veins. Dark: luminous. Mono: engraved in ink. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  /* ---- The butterfly. Each outline is a chain of anchors [x, y, direction, handle in, handle out]. ---- */
  var Wings = (function () {
    var FORE = [[5, -11, -63, 0, 57], [103, -105, -9, 54, 3.6], [108.5, -98, 115, 3.6, 40], [79, -18, 110, 38, 10], [63, -4.5, 180, 12, 22], [5, -5, 187, 22, 0]];
    var HIND = [[4, -5, 1, 0, 26], [62, -2, 27, 22, 10], [75, 17, 99, 12, 26], [27, 74, 152, 30, 9], [13, 64, 264, 9, 20], [5, 9, 268, 17, 0]];
    var FV = [[8, -12, 27, -34, 46, -54, 64, -68], [8, -11, 31, -27, 54, -42, 76, -56], [64, -68, 76, -77, 90, -88, 101, -95], [64, -68, 78, -73, 92, -77, 104, -81], [64, -68, 74, -64, 86, -60, 98, -58], [76, -56, 81, -48, 85, -40, 90, -34], [44, -28, 58, -24, 69, -18, 75, -12]];
    var HV = [[6, -3, 22, 3, 42, 9, 58, 12], [58, 12, 64, 14, 70, 16, 75, 19], [58, 12, 62, 24, 62, 34, 60, 44], [6, -2, 20, 14, 36, 30, 50, 50], [6, 0, 14, 22, 22, 44, 29, 70], [6, 2, 9, 22, 13, 44, 18, 66]];
    var D = Math.PI / 180;
    function chain(a) { var s = []; for (var i = 0; i < a.length - 1; i++) { var p = a[i], q = a[i + 1], u = p[2] * D, v = q[2] * D; s.push([p[0], p[1], p[0] + Math.cos(u) * p[4], p[1] + Math.sin(u) * p[4], q[0] - Math.cos(v) * q[3], q[1] - Math.sin(v) * q[3], q[0], q[1]]); } return s; }
    function outline(s) { var P = new Path2D(); P.moveTo(s[0][0], s[0][1]); s.forEach(function (c) { P.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]); }); P.closePath(); return P; }
    function veins(l) { var P = new Path2D(); l.forEach(function (v) { P.moveTo(v[0], v[1]); P.bezierCurveTo(v[2], v[3], v[4], v[5], v[6], v[7]); }); return P; }
    function at(c, t) { var u = 1 - t; return [u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6], u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7]]; }
    function spots(seg, base, inset, n, r) { var P = new Path2D(); for (var i = 0; i < n; i++) { var p = at(seg, (i + .5) / n), dx = base[0] - p[0], dy = base[1] - p[1], d = Math.hypot(dx, dy) || 1, x = p[0] + dx / d * inset, y = p[1] + dy / d * inset, q = r * (i % 2 ? .72 : 1); P.moveTo(x + q, y); P.arc(x, y, q, 0, TAU); } return P; }
    var fs = chain(FORE), hs = chain(HIND);
    var P = { fore: outline(fs), hind: outline(hs), fv: veins(FV), hv: veins(HV), fd: spots(fs[2], [5, -9], 9, 6, 1.9), hd: spots(hs[2], [5, -3], 9, 6, 1.9) };
    var body = new Path2D('M0-24C2.4-24 3.6-21 3.4-18C3.8-12 3.6-5 2.8 0C2.6 14 1.8 32 0 44C-1.8 32-2.6 14-2.8 0C-3.6-5-3.8-12-3.4-18C-3.6-21-2.4-24 0-24Z');
    var feel = new Path2D('M1.2-23C5-36 12-47 23-55M-1.2-23C-5-36-12-47-23-55');
    var knobs = new Path2D(); knobs.ellipse(23.6, -55.6, 1.9, 1.1, -.7, 0, TAU); knobs.ellipse(-23.6, -55.6, 1.9, 1.1, .7, 0, TAU);
    var INK = {
      light: { veins: 'rgba(74,88,176,.5)', spots: 'rgba(124,112,204,.62)', body: '#34488e', stops: [[0, '#fff'], [.5, '#fff'], [.78, '#efe7fb'], [1, '#d9e6fd']] },
      dark: { veins: 'rgba(120,136,240,.55)', spots: 'rgba(120,120,236,.72)', body: '#fff', stops: [[0, '#fff'], [.58, '#fbfaff'], [.84, '#e4e6ff'], [1, '#c6d3ff']] },
      mono: { veins: '#173451', spots: '#173451', body: '#173451', stops: [[0, '#fbfdff'], [1, '#eef4fb']] }
    };
    var cache = {};
    function style(g, theme) {
      if (cache[theme]) return cache[theme];
      var I = INK[theme], mk = function (cx, cy, r) { var m = g.createRadialGradient(cx, cy, 0, cx, cy, r); I.stops.forEach(function (s) { m.addColorStop(s[0], s[1]); }); return m; };
      var edge = function (x1, y1, x2, y2) {
        if (theme === 'mono') return '#173451';
        var e = g.createLinearGradient(x1, y1, x2, y2), c = theme === 'dark' ? ['#fff', '#E4C1F9', '#FFADD3', '#FCF6BD', '#D0F4DE', '#A9DEF9'] : ['#8fb4ea', '#c295ee', '#ff8fc4', '#e9cf6e', '#7fdcaa', '#6fc5f2'];
        c.forEach(function (k, i) { e.addColorStop(i / (c.length - 1), k); }); return e;
      };
      return (cache[theme] = { I: I, fFill: mk(5, -9, 120), hFill: mk(5, -3, 92), fEdge: edge(5, -105, 108, -5), hEdge: edge(4, -5, 75, 74) });
    }
    /* fore / hind: fold of each wing pair in radians. yaw: turn around the body. Vector every frame, so it is sharp at any size */
    function draw(g, size, fore, hind, yaw, theme) {
      var u = size / 200, st = style(g, theme), I = st.I, hair = .7 / u, fine = .48 / u;
      g.save(); g.scale(u, u); g.lineJoin = 'round'; g.lineCap = 'round';
      (yaw > 0 ? [1, -1] : [-1, 1]).forEach(function (side) {
        var f = fore - side * yaw, h = hind - side * yaw, fx = Math.max(.05, Math.cos(f)), hx = Math.max(.05, Math.cos(h));
        [[hx, -Math.sin(h) * .2, P.hind, P.hv, P.hd, st.hFill, st.hEdge], [fx, -Math.sin(f) * .3, P.fore, P.fv, P.fd, st.fFill, st.fEdge]].forEach(function (w) {
          g.save(); g.transform(side * w[0], w[1], 0, 1, 0, 0);
          g.fillStyle = w[5]; g.fill(w[2]);
          g.save(); g.clip(w[2]); g.strokeStyle = I.veins; g.lineWidth = fine; g.stroke(w[3]); g.fillStyle = I.spots; g.fill(w[4]); g.restore();
          g.strokeStyle = w[6]; g.lineWidth = hair; g.stroke(w[2]);
          g.restore();
        });
      });
      g.fillStyle = I.body; g.fill(body); g.strokeStyle = I.body; g.lineWidth = fine; g.stroke(feel); g.fill(knobs);
      g.restore();
    }
    return { draw: draw };
  })();

  /* A soft pool of light for behind a wing: separate from its edge, so the edge stays clean */
  function pool(g, x, y, r, c, a) { var p = g.createRadialGradient(x, y, 0, x, y, r); p.addColorStop(0, 'rgba(' + c + ',' + a + ')'); p.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = p; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  window.SkyWings = { Wings: Wings, pool: pool };
})();

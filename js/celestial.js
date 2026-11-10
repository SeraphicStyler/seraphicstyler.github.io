/* The celestial sky behind the homepage. One fixed canvas paints a light-to-deep sky with
   luminous corners, sideways sweeps of blue, iridescent orbs and prism light, all slowly
   moving; a second, smaller canvas in the opening screen carries the glitter and butterflies.
   Decorative only: it takes no clicks, and pauses when the tab is hidden. */
(function () {
  'use strict';
  var stage = document.querySelector('.hero-stage');
  if (!stage) return;
  var root = document.documentElement, h1 = stage.querySelector('h1'), lead = stage.querySelector('.lead'), eyebrow = stage.querySelector('.eyebrow');
  var still = function () { return root.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var night = function () { return root.classList.contains('dark'); };
  var plain = function () { return root.classList.contains('mono') || root.classList.contains('hc'); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  /* ---- The sky ---- */
  var sky = document.createElement('canvas'), grain = document.createElement('div');
  sky.className = 'ss-sky-canvas'; grain.className = 'ss-grain';
  sky.setAttribute('aria-hidden', 'true'); grain.setAttribute('aria-hidden', 'true');
  var gl = sky.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' });
  var U = {};
  var FRAG = [
    'precision highp float;uniform vec2 R;uniform float T,S,D,N;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p=p*2.1+7.3;a*=.5;}return v;}',
    'vec3 film(float t){return .55+.45*cos(6.2832*(t+vec3(0.,.33,.67)));}',
    /* cream, ice, periwinkle, cobalt, royal, midnight */
    'vec3 ramp(float x){vec3 c=vec3(.976,.961,.941);c=mix(c,vec3(.86,.905,.975),smoothstep(0.,.18,x));c=mix(c,vec3(.60,.71,.93),smoothstep(.18,.38,x));c=mix(c,vec3(.20,.42,.78),smoothstep(.38,.6,x));c=mix(c,vec3(.10,.23,.58),smoothstep(.6,.82,x));return mix(c,vec3(.05,.10,.30),smoothstep(.82,1.,x));}',
    /* a pearl: pink, sky and peach clouds around a white heart, a line of beads, a soft rim */
    'vec4 pearl(vec2 q,float r,float s){float d=length(q*vec2(1.,1.04+.05*sin(T*.2+s)))/r;if(d>1.75)return vec4(0.);vec2 u=q/r;vec2 w=vec2(fb(u*1.4+s+T*.05),fb(u*1.4-s-T*.04+3.));',
    'vec3 c=mix(vec3(1.,.70,.85),vec3(.62,.80,1.),smoothstep(.3,.7,w.x));c=mix(c,vec3(1.,.89,.74),smoothstep(.45,.8,w.y));c=mix(c,vec3(1.),smoothstep(.58,.0,length(u+(w-.5)*.6)));',
    'c+=exp(-pow(u.y*24.,2.))*pow(.5+.5*sin(u.x*26.+T*.6+s),14.)*.9*smoothstep(.86,.55,d);float rim=smoothstep(.6,.98,d)*smoothstep(1.14,.98,d);c=mix(c,vec3(1.,.94,.91)+film(d*1.6+atan(q.y,q.x)*.12+T*.02)*.14,rim*.85);',
    'float al=smoothstep(1.16,.84,d);float au=exp(-pow(max(d-.95,0.)*2.2,2.))*.42;return vec4(c,max(al,au*(1.-al)));}',
    'void main(){vec2 uv=gl_FragCoord.xy/R;float A=R.x/R.y;vec2 p=(uv-.5)*vec2(A,1.);float t=T,sc=S*.72;',
    'vec2 w=vec2(fb(p*1.3+vec2(t*.035,-t*.02)),fb(p*1.3+vec2(-t*.03,t*.025)+4.7))-.45;',
    /* light above, deep below, deepening as you travel down the page, with bands sweeping sideways */
    'float g=1.-uv.y+w.y*.22;float x=mix(.02+g*.62,.5+g*.46,D);float sd=dot(p,vec2(.82,.57))+w.x*.55+.1*sin(t*.07);x+=.16*sin(sd*2.6+t*.05+S*.8)*(1.-.35*D);',
    'vec3 col=N>.5?vec3(0.):ramp(clamp(x,0.,1.));',
    /* the corners stay full of light */
    'vec2 cn=(uv-.5)*2.;float k=smoothstep(.72,1.5,length(cn+w*.3))*(.55+.45*uv.y);col=mix(col,N>.5?vec3(.2,.2,.36):vec3(.955,.935,.98),k*(N>.5?.38:1.-.25*D));',
    /* the great blue field and its orb, behind the words */
    'vec2 c0=vec2(0.,-.03+sc);float rx=.2+.33*A,R0=min(.395,.2+.2*A);float e=length((p-c0+w*.1)/vec2(rx,.37));float f=1.-smoothstep(.55,1.18,e);',
    'float cl=fb((p-c0)*2.2+vec2(t*.05,-t*.03));float c2=fb((p-c0)*1.7+vec2(-t*.04,t*.05)+9.);vec3 fd=N>.5?mix(vec3(.05,.08,.26),vec3(.13,.16,.42),cl):mix(vec3(.17,.40,.78),vec3(.33,.48,.88),cl);fd+=(N>.5?vec3(.2,.1,.26):vec3(.42,.16,.34))*smoothstep(.42,.72,c2)*.55;col=mix(col,fd,f*.97);',
    'float r=length(p-c0)+(w.x+w.y)*.012,an=atan(p.y-c0.y,p.x-c0.x);float ins=smoothstep(R0,R0-.015,r);col=mix(col,vec3(.72,.82,1.),pow(r/R0,4.)*ins*.42);',
    'float rg=exp(-pow((r-R0)/.012,2.)),gw=exp(-pow((r-R0)/.075,2.));col+=(film(r*6.+an*.16+t*.03)*.55+.45)*rg*.5+(film(r*2.5+an*.1+t*.02)*.5+.5)*gw*.13;',
    /* pearls that float beside the words, then keep you company down the page */
    'vec4 o=pearl(p-vec2(-.33*A,-.27+sc*1.25)-.018*vec2(sin(t*.2),cos(t*.17)),.095+.035*A,1.3);col=mix(col,o.rgb,o.a);',
    'o=pearl(p-vec2(.27*A,.31+sc*1.1)-.02*vec2(cos(t*.16),sin(t*.21)),.05+.025*A,4.1);col=mix(col,o.rgb,o.a);',
    'for(int i=0;i<2;i++){float m=floor(sc/1.6)+float(i);o=pearl(p-vec2((mod(m,2.)<1.?-.46:.46)*A,-1.1-m*1.6+sc+.02*sin(t*.2+m)),.2,m*2.3+.7);col=mix(col,o.rgb,o.a*.92);}',
    /* prism light drifting through the corners */
    'for(int i=0;i<4;i++){float fi=float(i),an2=.85+fi*.37+.12*sin(t*.06+fi);vec2 dr=vec2(cos(an2),sin(an2));vec2 q=p-vec2((fi<2.?-1.:1.)*(.34+.06*fi)*A,mod(fi,2.)<1.?.3:-.22)-.06*vec2(sin(t*.11+fi),cos(t*.09+fi*2.));float l=dot(q,dr),a2=dot(q,vec2(-dr.y,dr.x)),wd=.035+.012*fi;float s=exp(-pow(l/.34,2.))*exp(-pow(a2/wd,2.)),pu=.55+.45*sin(t*.23+fi*1.7);col=mix(col,film(a2/wd*.28+.1*fi+t*.02)+.25,s*pu*(N>.5?.28:.4));col+=exp(-pow(l/.16,2.))*exp(-pow(a2/(wd*.3),2.))*pu*.4;}',
    'col+=(h(gl_FragCoord.xy+T)-.5)/110.;float al=N>.5?clamp(max(col.r,max(col.g,col.b))*1.5,0.,1.):1.;gl_FragColor=vec4(col,al);}'
  ].join('\n');
  function compile() {
    var make = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    var v = make(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'), f = make(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) return false;
    var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    ['R', 'T', 'S', 'D', 'N'].forEach(function (n) { U[n] = gl.getUniformLocation(p, n); });
    return true;
  }
  if (!gl || !compile()) return;   // without it the page keeps its plain gradient
  document.body.prepend(grain); document.body.prepend(sky);

  (function () { // fine paper grain, one small tile
    var c = document.createElement('canvas'); c.width = c.height = 180;
    var g = c.getContext('2d'), im = g.createImageData(180, 180), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = Math.random() < .5 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() * 15; }
    g.putImageData(im, 0, 0);
    c.toBlob(function (b) { if (b) grain.style.backgroundImage = 'url(' + URL.createObjectURL(b) + ')'; });
  })();

  var skyW = 0, skyH = 0, quality = .62, slow = 0, beats = 0;
  function sizeSky() {
    var w = root.clientWidth, h = window.innerHeight;
    if (skyW === w && Math.abs(skyH - h) < 120) return;
    skyW = w; skyH = h;
    var q = Math.min(quality, 900 / Math.max(w, h));
    sky.width = Math.round(w * q); sky.height = Math.round(h * q);
    gl.viewport(0, 0, sky.width, sky.height);
  }
  function drawSky(t) {
    var s = scrollY / Math.max(1, skyH);
    gl.uniform2f(U.R, sky.width, sky.height); gl.uniform1f(U.T, t); gl.uniform1f(U.S, s);
    gl.uniform1f(U.D, 1 - Math.exp(-s * 1.25)); gl.uniform1f(U.N, night() ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---- The opening screen: glitter, butterflies, bunnies, a silver orbit ---- */
  var BUNNY = '<ellipse cx="21.5" cy="34" rx="11" ry="11.5"/><circle cx="13.5" cy="21" r="7"/><ellipse cx="11.5" cy="8" rx="2.3" ry="8" transform="rotate(-7 11.5 8)"/><ellipse cx="17" cy="8.5" rx="2.3" ry="8" transform="rotate(9 17 8.5)"/><circle cx="32" cy="40" r="3"/><ellipse cx="13" cy="44" rx="5" ry="2"/>';
  var box = document.createElement('div');
  box.className = 'ss-fx play'; box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<i class="ss-horizon"></i><canvas class="ss-sparks"></canvas><i class="ss-bun-light"></i><svg class="ss-bun" viewBox="0 0 36 46">' + BUNNY + '</svg><svg class="ss-bun kit" viewBox="0 0 36 46">' + BUNNY + '</svg>';
  stage.prepend(box);
  var heading = stage.querySelector('.hero-heading');
  if (heading) {
    var orbit = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    orbit.setAttribute('class', 'ss-orbit'); orbit.setAttribute('viewBox', '0 0 1000 420'); orbit.setAttribute('aria-hidden', 'true');
    orbit.innerHTML = '<defs><linearGradient id="ss-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#b9c4dc"/><stop offset=".4" stop-color="#f7dcf0"/><stop offset=".58" stop-color="#fff"/><stop offset=".74" stop-color="#b6e4ee"/><stop offset="1" stop-color="#c9c4ec"/></linearGradient></defs>' +
      '<ellipse class="ss-orbit-line" cx="500" cy="210" rx="492" ry="200" pathLength="1000"/><ellipse class="ss-orbit-glint" cx="500" cy="210" rx="492" ry="200" pathLength="1000"/>';
    heading.prepend(orbit);
  }

  var cv = box.querySelector('.ss-sparks'), ctx = cv.getContext('2d');
  var W = 0, H = 0, HZ = 0, DPR = 1, mobile = false, TEXT = { l: 0, r: 0, t: 0, b: 0 };
  var glints = [], flares = [], flies = [], rings = [], dust = [], sp = {};

  function drawFly(size, fore, hind, yaw) { SkyWings.pool(ctx, 0, 0, size * .85, '150,172,255', .22); SkyWings.Wings.draw(ctx, size, fore, hind, yaw, 'dark'); }
  function sprite(size, draw) { var c = document.createElement('canvas'); c.width = c.height = size; var g = c.getContext('2d'); g.translate(size / 2, size / 2); draw(g, size / 2); return c; }
  sp.dots = ['#ffffff', '#e3e6ff', '#c9c4ff', '#fff1cf'].map(function (color) {
    return sprite(24, function (g, r) { var p = g.createRadialGradient(0, 0, 0, 0, 0, r); p.addColorStop(0, '#fff'); p.addColorStop(.3, color); p.addColorStop(.5, color + '5c'); p.addColorStop(1, color + '00'); g.fillStyle = p; g.fillRect(-r, -r, 2 * r, 2 * r); });
  });
  sp.flare = sprite(192, function (g, r) {
    var p = g.createRadialGradient(0, 0, 0, 0, 0, r * .3); p.addColorStop(0, 'rgba(255,255,255,1)'); p.addColorStop(.25, 'rgba(255,255,255,.42)'); p.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = p; g.fillRect(-r, -r, 2 * r, 2 * r);
    [['rgba(255,176,212,.42)', 1.8, 1], ['rgba(150,190,255,.42)', -1.8, 1], ['rgba(255,236,170,.3)', .9, .82], ['#fff', 0, 1]].forEach(function (s) {
      g.fillStyle = s[0];
      [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, .3], [3 * Math.PI / 4, .3]].forEach(function (a) { var L = r * s[2] * a[1]; g.save(); g.rotate(a[0]); g.translate(s[1], 0); g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -1.2, L, 0); g.quadraticCurveTo(0, 1.2, -L, 0); g.fill(); g.restore(); });
    });
  });

  function seed() {
    var i, y, n = mobile ? 90 : 240;
    glints = []; flares = []; flies = [];
    for (i = 0; i < n; i++) {
      var line = i < n * .24;
      y = line ? HZ + rand(-3, 3) : rand(H * .03, H);
      glints.push({ x: rand(0, W), y: y, s: rand(2.5, mobile ? 5.5 : 7), f: rand(.5, 2.3), p: rand(0, 7), i: i % 4 });
    }
    [[.09, .2, 74], [.9, .62, 96], [.2, .83, 42], [.78, .1, 46], [.5, .94, 30], [.97, .3, 34]].slice(0, mobile ? 4 : 6).forEach(function (f) {
      flares.push({ x: f[0] * W, y: f[1] * H, s: f[2] * (mobile ? .72 : 1.25), f: rand(.2, .42), p: rand(0, 7) });
    });
    var left = Math.max(30, TEXT.l), right = Math.min(W - 30, TEXT.r);
    for (i = 0; i < (mobile ? 3 : 7); i++) {
      var x = i % 2 === 0 ? rand(.03 * W, Math.max(.05 * W, left - 20)) : rand(Math.min(right + 20, W - 60), W - 30);
      flies.push({ x: x, y: rand(H * .08, H * .8), a: 1, size: mobile ? rand(26, 36) : i < 2 ? rand(46, 60) : rand(30, 42), ph: rand(0, 7), v: rand(5, 11), w: rand(1.7, 2.8), yaw: rand(.18, .5) * (Math.random() < .5 ? -1 : 1), hd: 0 });
    }
  }
  function place() {
    sizeSky();
    var o = stage.getBoundingClientRect(), r = h1.getBoundingClientRect(), l = lead.getBoundingClientRect(), e = (eyebrow || h1).getBoundingClientRect();
    W = stage.clientWidth; H = stage.clientHeight; mobile = W < 861;
    HZ = Math.round(l.bottom - o.top + Math.max(26, (o.bottom - l.bottom) * .42));
    box.style.setProperty('--bh', HZ + 'px');
    box.style.setProperty('--bunx', Math.round(mobile ? W - 84 : W * .71) + 'px');
    TEXT = { l: Math.min(r.left, l.left) - o.left - 14, r: Math.max(r.right, l.right) - o.left + 14, t: e.top - o.top - 10, b: l.bottom - o.top + 8 };
    DPR = Math.min(devicePixelRatio || 1, 2.5);
    cv.width = W * DPR; cv.height = H * DPR;
    seed(); wake();
  }
  function drawFx(t, dt) {
    var calm = still(), fade = calm ? 1 : Math.max(0, Math.min(1, (t - 1.2) / 2.2));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    glints.forEach(function (g) {
      var a = Math.sin(t * g.f + g.p); if (a <= .08) return;
      ctx.globalAlpha = Math.pow(a, 2.4) * fade; ctx.drawImage(sp.dots[g.i], g.x - g.s / 2, g.y - g.s / 2, g.s, g.s);
    });
    flares.forEach(function (p) {
      var a = .55 + .45 * Math.sin(t * p.f + p.p), z = p.s * (.78 + .22 * a);
      ctx.globalAlpha = a * fade; ctx.drawImage(sp.flare, p.x - z / 2, p.y - z / 2, z, z);
    });
    flies.forEach(function (b) {
      if (!calm && dt) {
        var vx = Math.sin(t * .31 + b.ph) * b.v * 1.1 + Math.cos(t * .13 + b.ph * 2) * b.v * .6, vy = -b.v * (.55 + .45 * Math.sin(t * .23 + b.ph * 1.7));
        b.x += vx * dt; b.y += vy * dt; b.hd += (Math.atan2(vx, -vy) * .65 - b.hd) * Math.min(1, dt * 1.3);
        if (b.y < H * .04) b.y = H * rand(.7, .9);
        if (b.x < -60) b.x = W + 58; else if (b.x > W + 60) b.x = -58;
      }
      var behind = b.x > TEXT.l && b.x < TEXT.r && b.y > TEXT.t && b.y < TEXT.b;   // they dim behind the words
      b.a += ((behind ? .08 : 1) - b.a) * (calm ? 1 : Math.min(1, dt * 3));
      var edge = Math.max(0, Math.min(1, (b.y - H * .04) / (H * .08), (H - b.y) / (H * .08))) * b.a * fade; if (edge <= 0) return;
      var glide = .6 + .4 * Math.sin(t * .37 + b.ph * 3), ph = t * b.w + b.ph;
      ctx.globalAlpha = edge; ctx.save(); ctx.translate(b.x, b.y + Math.cos(ph) * b.size * .04); ctx.rotate(b.hd);
      drawFly(b.size, .24 + glide * (.5 + .5 * Math.sin(ph)), .24 + .9 * glide * (.5 + .5 * Math.sin(ph - .45)), b.yaw * Math.sin(t * .19 + b.ph)); ctx.restore();
    });
    ctx.lineWidth = .8;
    rings = rings.filter(function (r) {
      var a = (t - r.t) / 2.6; if (a >= 1) return false;
      for (var k = 0; k < 3; k++) { var q = a - k * .13; if (q <= 0) continue; ctx.globalAlpha = (1 - a) * (1 - a) * .85; ctx.strokeStyle = ['#fff', '#ffe0ee', '#d6e8ff'][k]; ctx.beginPath(); ctx.ellipse(r.x, r.y, q * 110, q * 32, 0, 0, 7); ctx.stroke(); }
      return true;
    });
    dust = dust.filter(function (d) {
      var q = (t - d.t) / d.life; if (q >= 1) return false;
      ctx.globalAlpha = (1 - q) * (1 - q); ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x + d.dx * q, d.y + d.dy * q * q, d.r * (1 - q * .5), 0, 7); ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  /* ---- One clock for both ---- */
  var on = false, stageSeen = true, last = 0, t0 = performance.now(), tick = 0, lastY = -1, stillFrame = 0;
  function sync() { root.classList.toggle('ss-sky-on', !plain()); }
  function frame(now) {
    if (!on) return;
    var t = (now - t0) / 1000, moved = scrollY !== lastY;
    tick++; lastY = scrollY;
    if (now - last > 45) slow++;                     // on a struggling machine, paint fewer pixels
    if (++beats === 90) { if (slow > 40 && quality > .3) { quality *= .7; skyW = 0; sizeSky(); } beats = slow = 0; }
    var covered = root.classList.contains('ss-menu-open');   // behind the open menu the sky holds still, so its blur costs nothing
    if (!covered && !plain() && (moved || tick % 2 === 0)) drawSky(t);   // slow light needs only 30 frames a second
    if (!covered && stageSeen) { drawFx(t, Math.min(.05, (now - last) / 1000)); }
    last = now;
    if (!document.hidden && !still()) requestAnimationFrame(frame); else on = false;
  }
  function wake() {
    if (!W || !H) return;
    if (still()) {
      if (stillFrame) return;
      stillFrame = requestAnimationFrame(function () { stillFrame = 0; if (!plain()) drawSky(12); drawFx(20, 0); });
      return;
    }
    if (!on && !document.hidden) { on = true; last = performance.now(); requestAnimationFrame(frame); }
  }
  sky.addEventListener('webglcontextlost', function () { on = false; root.classList.remove('ss-sky-on'); sky.remove(); grain.remove(); });
  var form = document.querySelector('.hero-form'), showing = new Set();
  var seen = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) showing.add(e.target); else showing.delete(e.target); });
    stageSeen = showing.has(stage); root.classList.toggle('ss-hero-lit', showing.size > 0);
  });
  seen.observe(stage); if (form) seen.observe(form);
  document.addEventListener('visibilitychange', wake);
  new MutationObserver(function () { sync(); wake(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('scroll', function () { if (still()) wake(); }, { passive: true });

  /* A passing hand leaves dust; a touch sends out a ring of light. */
  var near = function (e) { var r = box.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  var lastDust = 0;
  stage.addEventListener('pointermove', function (e) {
    if (still() || e.pointerType !== 'mouse' || e.timeStamp - lastDust < 46) return;
    lastDust = e.timeStamp;
    var p = near(e);
    dust.push({ x: p.x + rand(-3, 3), y: p.y + rand(-3, 3), dx: rand(-9, 9), dy: rand(10, 26), r: rand(.5, 1.35), c: Math.random() < .2 ? '#ffe9d0' : '#fff', t: (performance.now() - t0) / 1000, life: rand(.8, 1.5) });
    if (dust.length > 60) dust.shift();
  }, { passive: true });
  stage.addEventListener('pointerdown', function (e) {
    if (still()) return;
    var p = near(e); rings.push({ x: p.x, y: p.y, t: (performance.now() - t0) / 1000 });
    if (rings.length > 4) rings.shift();
  }, { passive: true });

  var settle;
  addEventListener('resize', function () { clearTimeout(settle); settle = setTimeout(place, 140); }, { passive: true });
  document.addEventListener('ss:lang', place);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  setTimeout(place, 1500);
  sync();
  place();
})();

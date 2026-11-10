/* Sky scenes: light painted from its real optics, in two layers.
   Underneath, WebGL for what is truly soft: air, glow, fluid, the sheets of an aurora.
   On top, a vector layer at the screen's full resolution for everything that has an edge:
   stars, hairlines, wings, shooting stars. Nothing with an edge is ever stretched or blurred.

   One palette throughout: FFADD3, FCF6BD, D0F4DE, A9DEF9, E4C1F9.

   dawn    a pastel aurora on white: one ribbon of light folding back on itself
   edge    the limb of a world: marbled fluid under differential rotation, a hot rim, dipole field loops
   bow     Descartes' rainbow: red outside, violet inside, secondary bow reversed, Alexander's dark band
   aurora  a real curtain: rays rise along the field from one folded lower edge */
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---- Shared shader code ---- */
  var HEAD = [
    'precision highp float;uniform vec2 R,M,C,S;uniform float T,P,RP;',
    'float h21(vec2 p){vec3 a=fract(vec3(p.xyx)*.1031);a+=dot(a,a.yzx+33.33);return fract((a.x+a.y)*a.z);}',
    'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}',
    'const mat2 ROT=mat2(.8,.6,-.6,.8);',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p=ROT*p*2.03+vec2(3.1,1.7);a*=.5;}return v;}',
    'float fb3(vec2 p){float v=0.,a=.56;for(int i=0;i<3;i++){v+=a*n2(p);p=ROT*p*2.03+vec2(3.1,1.7);a*=.5;}return v;}',
    /* w: 0 is 400 nm, 1 is 700 nm */
    'float sq(float x){return x*x;}float q4(float x){x*=x;return x*x;}',
    'vec3 spectrum(float w){return vec3(exp(-sq((w-.74)/.2))+.3*exp(-sq((w-.05)/.08)),exp(-sq((w-.47)/.17)),exp(-sq((w-.2)/.14)));}',
    'vec3 pal(float x){x=fract(x);vec3 c=vec3(1.,.678,.827);c=mix(c,vec3(.988,.965,.741),smoothstep(0.,.2,x));c=mix(c,vec3(.816,.957,.871),smoothstep(.2,.4,x));c=mix(c,vec3(.663,.871,.976),smoothstep(.4,.6,x));c=mix(c,vec3(.894,.757,.976),smoothstep(.6,.8,x));c=mix(c,vec3(1.,.678,.827),smoothstep(.8,1.,x));return c;}',
    'vec4 done(vec3 c,float a){c+=(h21(gl_FragCoord.xy+fract(T)*97.)-.5)/170.;return vec4(clamp(c,0.,1.)*a,a);}'
  ].join('\n');

  var EDGE = HEAD + [
    'void main(){float A=R.x/R.y;vec2 uv=gl_FragCoord.xy/R,p=(uv-.5)*vec2(A,1.);',
    'vec2 v=p-C;float d=length(v)-RP,th=atan(v.x,v.y),t0=atan(S.x-C.x,S.y-C.y),dt=th-t0,sd=length(p-S);',
    /* deep space, and the thin air above the world */
    'float nb=fb3(p*2.3+vec2(T*.006,-T*.004));vec3 col=mix(vec3(.008,.010,.046),vec3(.05,.04,.17),smoothstep(.34,.82,nb));',
    'float glowArc=.32+.68*exp(-dt*dt*6.);',
    'col+=vec3(.17,.10,.38)*exp(-max(d,0.)*5.2)*(.4+.6*exp(-dt*dt*5.));',
    'if(d<.012){float z=max(-d,0.),vv=sqrt(z*2./RP);vec2 s=vec2(dt*RP*1.25,vv*RP*1.25);',
    /* the fluid winds up around the bright point and is sheared by rotation: energy circulating */
    'float sw=2.1*exp(-sd*2.4)+T*.03,cs=cos(sw),sn=sin(sw);vec2 q=mat2(cs,-sn,sn,cs)*s;q.x+=T*.012*(1.+.5*sin(vv*3.));q*=1.9;',
    'vec2 w1=vec2(fb3(q+vec2(0.,T*.02)),fb3(q+vec2(5.2,1.3)-T*.016));',
    'vec2 w2=vec2(fb3(q+3.5*w1+vec2(1.7,9.2)),fb3(q+3.5*w1+vec2(8.3,2.8)));',
    'float f=fbm(q+3.7*w2),rd=1.-abs(2.*w2.x-1.);',
    'vec3 m=mix(vec3(.25,.13,.58),vec3(.56,.33,.88),smoothstep(.2,.42,f));m=mix(m,vec3(.98,.60,.84),smoothstep(.38,.56,f));m=mix(m,vec3(1.,.93,.97),smoothstep(.52,.7,f));',
    /* hot filaments: white core, then rose, then the fire colours */
    'm+=vec3(1.,.62,.42)*pow(rd,9.)*.6;m=mix(m,vec3(1.),pow(rd,28.)*.85);',
    'float pale=smoothstep(0.,.5,vv);m=mix(m*vec3(.52,.46,.88),m+.14,pale);m*=.56+.44*exp(-dt*dt*3.)+pale*.26;',
    'col=mix(col,m,smoothstep(.003,-.003,d));}',
    /* the line itself */
    'col+=vec3(.62,.44,1.)*exp(-abs(d)*36.)*glowArc*.8+vec3(1.,.85,.92)*exp(-d*d*1.8e4)*glowArc;',
    /* corona: streamers that rise from the rim */
    'if(d>0.){float c=pow(fb3(vec2(dt*92.,d*5.-T*.14)),4.)*exp(-d*16.);col+=mix(vec3(1.,.58,.46),vec3(.76,.54,1.),smoothstep(0.,.12,d))*c*2.6*glowArc;}',
    'col+=vec3(1.,.94,.97)*exp(-sd*sd*150.)*.9+vec3(.86,.6,1.)*exp(-sd*4.6)*(.34+P*.3);',
    'col=1.-exp(-col*1.3);float e=smoothstep(0.,.13,uv.y)*smoothstep(1.,.86,uv.y);gl_FragColor=done(col,e);}'
  ].join('\n');

  var BOW = HEAD + [
    'float top(float x){return .16+.13*exp(-sq((x+.62)/.36))+.21*exp(-sq((x-.05)/.3))+.11*exp(-sq((x-.72)/.38));}',
    /* inner to outer: mauve, uranian blue, nyanza, lemon, lavender pink */
    'vec3 band(float w){vec3 c=vec3(.894,.757,.976);c=mix(c,vec3(.663,.871,.976),smoothstep(.1,.3,w));c=mix(c,vec3(.816,.957,.871),smoothstep(.3,.5,w));c=mix(c,vec3(.988,.965,.741),smoothstep(.5,.7,w));c=mix(c,vec3(1.,.678,.827),smoothstep(.7,.92,w));return c;}',
    /* cloud as a height above the plane; billows are low-contrast so shading stays airbrushed */
    'float dens(vec2 p){float b=0.,a=.5;vec2 q=p*vec2(3.1,4.1);for(int i=0;i<4;i++){b+=a*(1.-abs(2.*n2(q)-1.));q=ROT*q*2.02+1.7;a*=.5;}return top(p.x)+.2*(b-.46)-p.y;}',
    'void main(){float A=R.x/R.y;vec2 uv=gl_FragCoord.xy/R,p=vec2((uv.x-.5)*A,uv.y);',
    /* periwinkle above, lilac, then blush at the horizon */
    'vec3 sky=mix(vec3(.74,.88,.975),vec3(.89,.83,.98),smoothstep(.78,.46,uv.y));sky=mix(sky,vec3(1.,.90,.945),smoothstep(.52,.22,uv.y));',
    'float r0=mix(.6,1.5,smoothstep(.5,2.3,A)),bw=r0*.064+.012,cy=.68-r0;vec2 v=p-vec2(.05*A,cy);float rho=length(v),th=atan(v.x,v.y);',
    /* brighter inside the bow; Alexander\'s dark band between the bows */
    'float r2=r0*1.215;sky+=.045*smoothstep(r0-bw*14.,r0-bw*1.4,rho)*smoothstep(r0,r0-bw*1.2,rho);sky*=1.-.028*smoothstep(r0+bw,r0+bw*2.,rho)*smoothstep(r2-bw*2.,r2-bw,rho);',
    'float streak=.93+.14*n2(vec2(th*640.,rho*3.));',
    'float s1=(rho-r0)/bw,a1=exp(-q4(s1/1.16))*streak;sky=mix(sky,band(clamp(s1*.5+.5,0.,1.)),a1*.94);',
    'float s2=(rho-r2)/(bw*.8),a2=exp(-q4(s2/1.16))*streak;sky=mix(sky,band(clamp(.5-s2*.5,0.,1.)),a2*.3);',
    'if(p.y<top(p.x)+.26){vec2 q=p+vec2(T*.005,0.);float e0=.022,D=dens(q),dx=(dens(q+vec2(e0,0.))-dens(q-vec2(e0,0.)))/(2.*e0),dy=(dens(q+vec2(0.,e0))-dens(q-vec2(0.,e0)))/(2.*e0);',
    'float m=smoothstep(-.012,.06,D+.02*(fb3(p*16.+T*.01)-.5));vec3 n=normalize(vec3(-dx*.62,-dy*.62,1.)),L=normalize(vec3(-.4,.74,.55));float lam=clamp(dot(n,L),0.,1.),dep=clamp(D/.34,0.,1.);',
    'vec3 cc=mix(vec3(.87,.78,.975),vec3(1.,.83,.91),smoothstep(.2,.62,lam));cc=mix(cc,vec3(1.,.99,.985),smoothstep(.56,.94,lam));cc=mix(cc,vec3(.86,.80,.98),dep*dep*.55);',
    'sky=mix(sky,cc,m);}float e=smoothstep(1.,.74,uv.y);gl_FragColor=done(sky,e);}'
  ].join('\n');

  var AURORA = HEAD + [
    'void main(){float A=R.x/R.y;vec2 uv=gl_FragCoord.xy/R,p=vec2((uv.x-.5)*A,uv.y);',
    'vec3 c=mix(vec3(.06,.36,.50),vec3(.04,.20,.44),smoothstep(0.,.5,uv.y));c=mix(c,vec3(.02,.08,.27),smoothstep(.45,1.,uv.y));',
    'float h=fb3(p*2.1+vec2(T*.012,-T*.006));c+=vec3(.05,.13,.17)*smoothstep(.35,.8,h)*smoothstep(0.,.6,1.-uv.y);',
    'float e=smoothstep(1.,.74,uv.y);gl_FragColor=done(c,e);}'
  ].join('\n');

  /* one sheet of the ribbon. uv.x runs along the lower edge, uv.y rises from it along the field */
  var RIBBON = HEAD + [
    'varying vec2 uv;uniform float N,I;',
    'void main(){float s=uv.x,v=clamp(uv.y,0.,1.);',
    /* rays: fine ones riding on broad ones, and they stay straight because they are functions of s alone */
    'float r1=n2(vec2(s*(210.+I*40.)+I*13.,T*.1+I)),r2=n2(vec2(s*52.-T*.04,I*3.+v*.5));float ray=r1*r1+r2*.72;',
    'float ends=smoothstep(0.,.05,s)*smoothstep(1.,.95,s)*smoothstep(1.,.45,v);vec3 c=pal(s*.9+I*.31+.03*sin(T*.1));',
    'if(N>.5){c=mix(c,clamp(vec3(1.)-(vec3(1.)-c)*2.3,0.,1.),.62);float a=(exp(-v*2.8)*.66+sq(1.-v)*.22)*(.12+ray*.82)*ends;',
    /* white-mint along the lower border, mauve as it fades upward */
    'c=mix(c,vec3(.92,1.,.98),exp(-v*30.)*.7);c=mix(c,vec3(.86,.72,1.),smoothstep(.45,1.,v)*.5);',
    'float e=smoothstep(1.,.74,gl_FragCoord.y/R.y);gl_FragColor=vec4(c*a*e,a*e*.5);}',
    'else{float a=(exp(-v*2.3)*.8+sq(1.-v)*.3)*(.55+ray*.64)*ends;c=mix(c,vec3(1.),pow(r1,6.)*.75);a=clamp(a,0.,.95);gl_FragColor=vec4(c*a,a);}}'
  ].join('\n');

  /* Lower edges as hand-placed points [x, y] in the frame, running right to left so that the folds fall where they should */
  var FOLDS = {
    dawn: {
      wide: [[[.72, .10], [.5, .15], [.34, .2], [.24, .3], [.36, .37], [.22, .41], [.04, .39], [-.14, .34]],
        [[1.12, .22], [.88, .31], [.68, .37], [.59, .47], [.71, .54], [.745, .565], [.61, .6], [.41, .635], [.30, .73], [.42, .825], [.45, .85], [.3, .885], [.1, .85], [-.14, .77]]],
      tall: [[[1.15, .10], [.62, .13], [.3, .17], [-.2, .15]],
        [[1.26, .2], [.84, .27], [.52, .32], [.36, .41], [.62, .49], [.76, .52], [.5, .57], [.24, .64], [.18, .73], [.5, .81], [.62, .84], [.26, .875], [-.2, .85]]]
    },
    aurora: {
      wide: [[[.8, .1], [.56, .16], [.37, .2], [.27, .32], [.4, .39], [.27, .43], [.08, .41], [-.14, .35]],
        [[1.14, .3], [.9, .37], [.7, .43], [.61, .54], [.73, .6], [.775, .63], [.62, .67], [.44, .69], [.34, .76], [.45, .825], [.48, .84], [.33, .85], [.12, .82], [-.14, .74]]],
      tall: [[[1.2, .12], [.62, .16], [.28, .2], [-.25, .18]],
        [[1.3, .26], [.84, .34], [.52, .4], [.36, .5], [.64, .58], [.78, .61], [.5, .66], [.24, .71], [.18, .78], [.52, .83], [.62, .85], [.26, .87], [-.2, .82]]]
    }
  };
  function sway(x) { return Math.sin(x) * .5 + Math.sin(x * 2.3 + 1.1) * .3 + Math.sin(x * 5.1 + 2.7) * .2; }
  /* a smooth curve through the points, moving slowly, with a small wave running along it */
  function ribbonPath(src, t, W, H, id) {
    var P = src.map(function (q, i) { return [q[0] + .012 * Math.sin(t * .21 + i * 1.7 + id), q[1] + .012 * Math.cos(t * .17 + i * 2.3 + id)]; });
    var out = [], SUB = 16, i, k;
    for (i = 0; i < P.length - 1; i++) {
      var a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
      for (k = 0; k < SUB; k++) {
        var u = k / SUB, u2 = u * u, u3 = u2 * u;
        out.push([.5 * (2 * b[0] + (c[0] - a[0]) * u + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * u2 + (3 * b[0] - a[0] - 3 * c[0] + d[0]) * u3) * W,
          .5 * (2 * b[1] + (c[1] - a[1]) * u + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * u2 + (3 * b[1] - a[1] - 3 * c[1] + d[1]) * u3) * H]);
      }
    }
    out.push([P[P.length - 1][0] * W, P[P.length - 1][1] * H]);
    var L = [0], n = out.length;
    for (i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    var total = L[n - 1] || 1, res = [];
    for (i = 0; i < n; i++) {
      var A = out[Math.max(0, i - 1)], B = out[Math.min(n - 1, i + 1)], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, s = L[i] / total, w = Math.sin(s * 34 - t * 1.05 + id) * 1.6 * Math.min(W, H) / 620;
      res.push({ x: out[i][0] - dy / l * w, y: out[i][1] + dx / l * w, s: s, tx: dx / l });
    }
    return res;
  }

  /* ---- Marks with an edge. All vector, all drawn at device resolution ---- */
  /* a four-point star with needle arms: a superellipse, so the arms taper like light, not like a kite */
  function starPath(e) { var P = new Path2D(); for (var i = 0; i <= 96; i++) { var a = i / 96 * TAU, c = Math.cos(a), s = Math.sin(a), x = Math.pow(Math.abs(c), e) * (c < 0 ? -1 : 1), y = Math.pow(Math.abs(s), e) * (s < 0 ? -1 : 1); i ? P.lineTo(x, y) : P.moveTo(x, y); } P.closePath(); return P; }
  var NEEDLE = starPath(7), STAR = starPath(4.6);
  function sparkle(g, x, y, R, ratio, fill, alpha, rot) {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(R * (ratio || .66), R);
    g.globalAlpha = alpha == null ? 1 : alpha; g.fillStyle = fill || '#fff'; g.fill(R > 26 ? NEEDLE : STAR);
    g.restore();
  }
  /* eight rays: a long cross with a short one laid across it */
  function burst8(g, x, y, R, fill, alpha, rot) { sparkle(g, x, y, R, .86, fill, alpha, rot); sparkle(g, x, y, R * .44, .9, fill, alpha, (rot || 0) + Math.PI / 4); }
  /* the soft five-point star: rounded at every corner, clean at the edge, its colour in a separate pool of light */
  var PUFF = (function () {
    var P = new Path2D(), p = [], i;
    for (i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .5 : 1; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    var lerp = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    for (i = 0; i < 10; i++) { var c = p[i], k = i % 2 ? .26 : .34, a2 = lerp(c, p[(i + 9) % 10], k), b2 = lerp(c, p[(i + 1) % 10], k); i ? P.lineTo(a2[0], a2[1]) : P.moveTo(a2[0], a2[1]); P.quadraticCurveTo(c[0], c[1], b2[0], b2[1]); }
    P.closePath(); return P;
  })();
  function puff(g, x, y, R, rot, tint, glow, alpha) {
    pool(g, x, y, R * 2.7, glow, .78 * alpha);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(R, R); g.globalAlpha = alpha;
    var f = g.createRadialGradient(0, 0, .1, 0, 0, 1); f.addColorStop(0, '#fff'); f.addColorStop(.42, '#fff'); f.addColorStop(1, tint);
    g.fillStyle = f; g.fill(PUFF); g.restore();
  }
  /* a shooting star: one tapered sliver, bright at the head, nothing blurred */
  function streak(g, hx, hy, tx, ty, w, head, tail, alpha) {
    var dx = tx - hx, dy = ty - hy, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
    var gr = g.createLinearGradient(hx, hy, tx, ty); gr.addColorStop(0, head); gr.addColorStop(.3, tail); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.globalAlpha = alpha == null ? 1 : alpha; g.fillStyle = gr; g.beginPath(); g.moveTo(hx + nx, hy + ny); g.lineTo(tx, ty); g.lineTo(hx - nx, hy - ny); g.closePath(); g.fill(); g.restore();
  }

  var Wings = window.SkyWings.Wings, pool = window.SkyWings.pool;

  /* ---- Mounting a scene into a section ---- */
  function mount(host, opt) {
    var theme = opt.theme, still = opt.still || function () { return false; };
    var glc = document.createElement('canvas'), ink = document.createElement('canvas');
    [glc, ink].forEach(function (c) { c.setAttribute('aria-hidden', 'true'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none'; host.prepend(c); });
    host.prepend(glc);
    var gl = glc.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, powerPreference: 'low-power' });
    var g2 = ink.getContext('2d'), programs = {}, active = null;
    var W = 0, H = 0, D = 1, quality = 1, slow = 0, beats = 0, seen = false, raf = 0, t0 = performance.now(), last = 0;
    var geom = { A: 1, RP: 1.3, C: [0, 0], S: [0, 0] }, M = [.5, .5], Mt = [.5, .5], P = 0;
    var stars = null, spark = [], flies = [], shots = [], shotAt = 3, marks = [], bursts = [], moon = null, ribbons = [], beads = [], puffs = [], dots = [];

    function current() { var m = theme(); return opt.kind === 'edge' ? (m === 'dark' ? 'edge' : 'dawn') : (m === 'dark' ? 'aurora' : m === 'mono' ? 'mono' : 'bow'); }
    function program(key) {
      if (!gl) return null;
      if (programs[key]) return programs[key];
      var src = { edge: EDGE, bow: BOW, aurora: AURORA, ribbon: RIBBON }[key]; if (!src) return null;
      var mk = function (t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { if (window.console) console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
      var vs = key === 'ribbon' ? 'attribute vec4 a;varying vec2 uv;void main(){uv=a.zw;gl_Position=vec4(a.xy,0.,1.);}' : 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
      var v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, src);
      if (!v || !f) return null;
      var p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { if (window.console) console.warn(gl.getProgramInfoLog(p)); return null; }
      var U = {}; ['R', 'M', 'C', 'S', 'T', 'P', 'RP', 'N', 'I'].forEach(function (n) { U[n] = gl.getUniformLocation(p, n); });
      return (programs[key] = { p: p, U: U });
    }
    var quad = null, mesh = null;
    if (gl) { quad = gl.createBuffer(); mesh = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); }

    function glSize() { if (!gl) return; var q = Math.min(window.devicePixelRatio || 1, 1.4) * quality; q = Math.min(q, Math.sqrt(2.2e6 / Math.max(1, W * H))); glc.width = Math.max(2, Math.round(W * q)); glc.height = Math.max(2, Math.round(H * q)); gl.viewport(0, 0, glc.width, glc.height); }
    function layout() {
      var A = W / H, RP = Math.max(A * 1.35, 1.25), Cx = -A * .22, Cy = .17 - RP, sx = A * .16 - Cx, Sy = Math.sqrt(Math.max(0, RP * RP - sx * sx)) + Cy;
      geom = { A: A, RP: RP, C: [Cx, Cy], S: [A * .16, Sy] };
    }
    function toX(x) { return (x + geom.A / 2) * H; }
    function toY(y) { return (.5 - y) * H; }
    function limbY(px) { var x = px / H - geom.A / 2, dx = x - geom.C[0], s = geom.RP * geom.RP - dx * dx; return s > 0 ? toY(Math.sqrt(s) + geom.C[1]) : H; }

    function seed() {
      var key = current(), i, n, x, y, mob = W < 700;
      stars = document.createElement('canvas'); stars.width = W * D; stars.height = H * D; var s = stars.getContext('2d'); s.scale(D, D);
      spark = []; marks = []; moon = null; beads = []; puffs = []; dots = []; ribbons = [];
      if (key === 'edge') {
        s.fillStyle = '#fff';
        for (i = 0, n = mob ? 150 : 340; i < n; i++) { x = rand(0, W); y = rand(0, limbY(x) - 8); if (y < H * .08) continue; s.globalAlpha = Math.min(1, rand(.25, 1) * (y / (H * .14))); s.beginPath(); s.arc(x, y, Math.random() < .08 ? rand(.9, 1.3) : rand(.3, .75), 0, TAU); s.fill(); }
        for (i = 0, n = mob ? 7 : 14; i < n; i++) { x = rand(.03, .97) * W; y = rand(H * .13, Math.max(H * .15, limbY(x) - 30)); spark.push({ x: x, y: y, R: rand(5, 15), r: .62, a: rand(.55, 1), f: rand(.3, 1), p: rand(0, 7) }); }
      } else if (key === 'dawn') {
        for (i = 0; i < 3; i++) marks.push({ cx: rand(.36, .64), cy: rand(.38, .62), rx: rand(.46, .74), ry: rand(.16, .3), rot: rand(-.42, .42), v: rand(.02, .05) * (i % 2 ? 1 : -1), p: rand(0, 7), w: 0 });
        seedRibbonStars(key, mob);
      } else if (key === 'bow' || key === 'aurora' || key === 'mono') {
        var dark = key === 'aurora', fg = key === 'mono' ? '#173451' : '#fff', topL = H * .08, botL = H * (dark ? .92 : .46);
        s.fillStyle = fg;
        for (i = 0, n = mob ? 90 : 220; i < n; i++) { x = rand(0, W); y = rand(topL, botL + (dark ? H * .1 : 0)); s.globalAlpha = Math.min(1, (y - topL) / (H * .12)) * rand(.35, .95); s.beginPath(); s.arc(x, y, Math.random() < .07 ? rand(.8, 1.15) : rand(.3, .7), 0, TAU); s.fill(); }
        for (i = 0, n = mob ? 8 : 16; i < n; i++) spark.push({ x: rand(.03, .97) * W, y: rand(topL + 10, botL), R: rand(3.5, 9.5), r: .74, a: rand(.7, 1), f: rand(.3, 1.1), p: rand(0, 7) });
        if (!dark) moon = { x: W * (mob ? .24 : .3), y: H * .22, r: mob ? 15 : 22 };
        if (dark) seedRibbonStars(key, mob);
        if (key === 'bow') seedBowStars(mob);
      }
      if (opt.flies && (key === 'dawn' || key === 'edge') && !flies.length) {
        for (i = 0, n = mob ? 3 : 6; i < n; i++) flies.push({ x: rand(.08, .92) * W, y: rand(.2, .74) * H, size: i < 2 ? rand(54, 74) : rand(30, 44), ph: rand(0, 7), v: rand(6, 12), w: rand(1.8, 2.9), yaw: rand(.2, .5) * (Math.random() < .5 ? -1 : 1), hd: 0, fx: 0, fy: 0 });
      }
    }
    var TINTS = [['#FFADD3', '255,173,211'], ['#FCF6BD', '252,246,189'], ['#D0F4DE', '208,244,222'], ['#A9DEF9', '169,222,249'], ['#E4C1F9', '228,193,249']];
    function foldSet(key) { var f = FOLDS[key][W / H > .9 ? 'wide' : 'tall']; return f; }
    function seedRibbonStars(key, mob) {
      var f = foldSet(key), main = ribbonPath(f[f.length - 1], 0, W, H, 1), i, n, p, dawn = key === 'dawn';
      beads = [];
      for (i = 0, n = mob ? 34 : 70; i < n; i++) beads.push({ s: rand(.22, .82), v: rand(.003, .012) * (Math.random() < .5 ? 1 : -1), up: Math.pow(Math.random(), 2.2) * (mob ? 12 : 20), r: rand(.5, 1.5), f: rand(.6, 2), p: rand(0, 7) });
      for (i = 0, n = mob ? 7 : 13; i < n; i++) {
        p = main[Math.floor(rand(.14, .9) * main.length)];
        spark.push({ x: p.x + rand(-26, 26), y: p.y - rand(14, H * (dawn ? .17 : .3)), R: i < 3 ? rand(20, mob ? 30 : 42) : rand(6, 15), r: .86, a: 1, f: rand(.3, .8), p: rand(0, 7), burst: true });
      }
      if (dawn) {
        for (i = 0, n = mob ? 20 : 44; i < n; i++) { p = main[Math.floor(rand(.1, .92) * main.length)]; var c = TINTS[i % 5]; dots.push({ x: p.x + rand(-60, 60), y: p.y + rand(-H * .2, H * .09), r: rand(.8, 2.6), c: i % 3 ? '#fff' : c[0], f: rand(.4, 1.2), p: rand(0, 7) }); }
        for (i = 0, n = mob ? 4 : 8; i < n; i++) { p = main[Math.floor(rand(.42, .94) * main.length)]; var t2 = TINTS[i % 5]; puffs.push({ x: p.x + rand(-90, 90), y: p.y + rand(-70, 70), R: i < 2 ? rand(mob ? 19 : 26, mob ? 25 : 38) : rand(mob ? 10 : 13, mob ? 15 : 21), rot: rand(-.5, .5), tint: t2[0], glow: t2[1], f: rand(.25, .55), p: rand(0, 7) }); }
      }
    }
    function bowGeom() { var A = W / H, sm = Math.max(0, Math.min(1, (A - .5) / 1.8)), e = sm * sm * (3 - 2 * sm), r0 = .6 + (1.5 - .6) * e; return { r0: r0, bw: r0 * .064 + .012, cy: .68 - r0, cx: .05 * A }; }
    function seedBowStars(mob) {
      var b = bowGeom(), A = W / H, i, n, c = function (a, off) { var r = b.r0 + off * b.bw; return [(b.cx + Math.sin(a) * r + A / 2) * H, (1 - (b.cy + Math.cos(a) * r)) * H]; }, lim = Math.min(1.25, Math.asin(Math.min(1, (A * .62) / b.r0)));
      for (i = 0, n = mob ? 14 : 30; i < n; i++) { var q = c(rand(-lim, lim), rand(-1.05, 1.05)); spark.push({ x: q[0], y: q[1], R: i < 5 ? rand(11, mob ? 16 : 22) : rand(4, 9), r: .86, a: 1, f: rand(.4, 1.1), p: rand(0, 7), burst: true }); }
      for (i = 0, n = mob ? 26 : 70; i < n; i++) { var d = c(rand(-lim, lim), rand(-1.2, 1.2)); dots.push({ x: d[0], y: d[1], r: rand(.6, 2), c: '#fff', f: rand(.5, 1.4), p: rand(0, 7) }); }
      for (i = 0, n = mob ? 3 : 6; i < n; i++) { var t3 = TINTS[i % 5], e2 = c(rand(-lim * .9, lim * .9), rand(1.8, 3.4) * (i % 2 ? 1 : -1)); puffs.push({ x: e2[0], y: e2[1], R: i < 2 ? rand(mob ? 15 : 20, mob ? 20 : 30) : rand(mob ? 9 : 11, mob ? 13 : 17), rot: rand(-.5, .5), tint: t3[0], glow: t3[1], f: rand(.25, .55), p: rand(0, 7) }); }
    }
    function resize() {
      var r = host.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h || (w === W && h === H)) return;
      var ow = W, oh = H; W = w; H = h; D = Math.min(window.devicePixelRatio || 1, 3);
      ink.width = W * D; ink.height = H * D; layout(); glSize();
      if (ow) flies.forEach(function (b) { b.x *= W / ow; b.y *= H / oh; });
      seed(); paint(clock());
      if (opt.onLayout) opt.onLayout(api);
    }

    /* ---- Painting ---- */
    function uniforms(pg, t) {
      var U = pg.U;
      gl.uniform2f(U.R, glc.width, glc.height); gl.uniform1f(U.T, t); gl.uniform1f(U.P, P); gl.uniform2f(U.M, M[0], M[1]);
      gl.uniform2f(U.C, geom.C[0], geom.C[1]); gl.uniform2f(U.S, geom.S[0], geom.S[1]); gl.uniform1f(U.RP, geom.RP);
    }
    function fullscreen(key, t) {
      var pg = program(key); if (!pg) return;
      gl.useProgram(pg.p); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); uniforms(pg, t); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    /* each ribbon: the lower edge, and for every point of it the top of its ray */
    function drawRibbons(key, t) {
      var pg = program('ribbon'), f = foldSet(key), night = key === 'aurora', Zx = W * .5, Zy = -H * 1.5; if (!pg) return;
      ribbons = f.map(function (src, id) { return ribbonPath(src, t, W, H, id + 1); });
      gl.useProgram(pg.p); uniforms(pg, t); gl.uniform1f(pg.U.N, night ? 1 : 0); gl.bindBuffer(gl.ARRAY_BUFFER, mesh); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); if (night) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      ribbons.forEach(function (rb, id) {
        var A = new Float32Array(rb.length * 8), i = 0, run = 0, prev = null, grow = H * .2;
        rb.forEach(function (q) {
          /* where the sheet runs back on itself we see its underside: the rays there are short,
             and they lengthen gradually as the sheet comes out of the fold */
          var e = Math.max(0, Math.min(1, (-q.tx + .35) / .7)), front = e * e * (3 - 2 * e);
          run = front < .15 ? 0 : run + (prev ? Math.hypot(q.x - prev.x, q.y - prev.y) : grow); prev = q;
          var g2w = Math.min(1, run / grow); front *= g2w * g2w * (3 - 2 * g2w);
          var h = (night ? H * (.1 + .62 * front) : H * (.075 + .3 * front)) * (.82 + .3 * sway(q.s * 9 + id * 2 + t * .12));
          var dx = night ? Zx - q.x : 0, dy = night ? Zy - q.y : -1, l = Math.hypot(dx, dy) || 1, tx = q.x + dx / l * h, ty = q.y + dy / l * h;
          A[i++] = q.x / W * 2 - 1; A[i++] = 1 - q.y / H * 2; A[i++] = q.s; A[i++] = 0;
          A[i++] = tx / W * 2 - 1; A[i++] = 1 - ty / H * 2; A[i++] = q.s; A[i++] = 1;
        });
        gl.uniform1f(pg.U.I, id + (night ? 1 : 0)); gl.bufferData(gl.ARRAY_BUFFER, A, gl.DYNAMIC_DRAW); gl.drawArrays(gl.TRIANGLE_STRIP, 0, rb.length * 2);
      });
      gl.disable(gl.BLEND);
    }
    function drawGL(t, key) {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (key === 'aurora') { fullscreen('aurora', t); drawRibbons('aurora', t); }
      else if (key === 'dawn') drawRibbons('dawn', t);
      else fullscreen(key, t);
    }
    function drawEdges(key, t) {
      var dawn = key === 'dawn';
      ribbons.forEach(function (rb, id) {
        var P = new Path2D(); rb.forEach(function (q, i) { i ? P.lineTo(q.x, q.y) : P.moveTo(q.x, q.y); });
        if (dawn) { var gr = g2.createLinearGradient(0, 0, W, H); ['#ff8fc4', '#efd76e', '#7fdcaa', '#6fc5f2', '#c295ee', '#ff8fc4'].forEach(function (c, i, l) { gr.addColorStop(i / (l.length - 1), c); }); g2.strokeStyle = gr; }
        else g2.strokeStyle = '#fff';
        g2.globalAlpha = dawn ? .85 : .82 - id * .05; g2.lineWidth = dawn ? .8 : .9; g2.lineJoin = 'round'; g2.stroke(P);
      });
      g2.globalAlpha = 1;
      var main = ribbons[ribbons.length - 1]; if (!main) return;
      /* charge beading along the lower edge */
      g2.fillStyle = '#fff';
      beads.forEach(function (b) {
        var s = b.s + (t * b.v) % .6; s = s < .1 ? s + .7 : s > .9 ? s - .7 : s;
        var q = main[Math.floor(s * (main.length - 1))]; g2.globalAlpha = .45 + .55 * (.5 + .5 * Math.sin(t * b.f + b.p));
        g2.beginPath(); g2.arc(q.x, q.y - b.up, b.r, 0, TAU); g2.fill();
      });
      g2.globalAlpha = 1;
    }
    function drawFlies(t, dt, m) {
      flies.forEach(function (b) {
        if (dt) {
          var vx = Math.sin(t * .31 + b.ph) * b.v * 1.1 + Math.cos(t * .13 + b.ph * 2) * b.v * .6, vy = -b.v * (.55 + .45 * Math.sin(t * .23 + b.ph * 1.7));
          b.x += vx * dt; b.y += vy * dt; b.hd += (Math.atan2(vx, -vy) * .65 - b.hd) * Math.min(1, dt * 1.3);
          var hx = b.x - hand.x, hy = b.y - hand.y, d = Math.hypot(hx, hy);
          if (t - hand.t < 1.4 && d < 170 && d > 1) { var pf = 1 - d / 170; b.fx += hx / d * pf * 320 * dt; b.fy += hy / d * pf * 320 * dt; }
          var drag = 1 - Math.min(1, dt * 2.2); b.fx *= drag; b.fy *= drag; b.x += b.fx * dt; b.y += b.fy * dt;
          if (b.y < H * .1) { b.y = H * .76; b.x = rand(.08, .92) * W; }
          if (b.x < -80) b.x = W + 70; else if (b.x > W + 80) b.x = -70;
        }
        var edge = Math.max(0, Math.min(1, (b.y - H * .1) / (H * .07), (H * .9 - b.y) / (H * .08)));
        if (edge <= 0) return;
        var glide = .6 + .4 * Math.sin(t * .37 + b.ph * 3), ph = t * b.w + b.ph;
        g2.globalAlpha = edge;
        pool(g2, b.x, b.y, b.size * .9, m === 'dark' ? '150,172,255' : '214,202,250', m === 'dark' ? .22 : .3);
        g2.save(); g2.translate(b.x, b.y + Math.cos(ph) * b.size * .04); g2.rotate(b.hd);
        Wings.draw(g2, b.size, .24 + glide * (.5 + .5 * Math.sin(ph)), .24 + .9 * glide * (.5 + .5 * Math.sin(ph - .45)), b.yaw * Math.sin(t * .19 + b.ph), m === 'dark' ? 'dark' : 'light');
        g2.restore();
      });
      g2.globalAlpha = 1;
    }
    function drawShots(t, fg, tail, many) {
      if (t > shotAt && shots.length < (many ? 3 : 1)) {
        var x0 = rand(.08, .95) * W, y0 = rand(.08, .3) * H, rx = W * .5, ry = -H * .4, dd = Math.hypot(x0 - rx, y0 - ry) || 1, L = rand(240, 420), fromR = !many && Math.random() < .7;
        shots.push(many ? { x: x0, y: y0, dx: (x0 - rx) / dd * L, dy: (y0 - ry) / dd * L, t: t, d: rand(.9, 1.5) } : { x: rand(.35, .95) * W, y: rand(.14, .34) * H, dx: (fromR ? -1 : 1) * rand(260, 440), dy: rand(90, 190), t: t, d: rand(1.1, 1.7) });
        shotAt = t + (many ? rand(.8, 3.4) : rand(5.5, 12));
      }
      shots = shots.filter(function (o) {
        var a = (t - o.t) / o.d; if (a >= 1) return false;
        var e = a * a * (3 - 2 * a), hx = o.x + o.dx * e, hy = o.y + o.dy * e, L = Math.min(.42, e), f = a < .1 ? a / .1 : a > .78 ? (1 - a) / .22 : 1;
        streak(g2, hx, hy, hx - o.dx * L, hy - o.dy * L, 1, fg, tail, f); sparkle(g2, hx, hy, 6, .7, fg, f);
        return true;
      });
    }
    function drawBursts(t, fg) {
      bursts = bursts.filter(function (b) {
        var a = (t - b.t) / 1.5; if (a >= 1) return false;
        var e = 1 - Math.pow(1 - a, 3), f = 1 - a;
        sparkle(g2, b.x, b.y, 34 * e + 4, .62, fg, f);
        b.s.forEach(function (s) { sparkle(g2, b.x + Math.cos(s.a) * s.d * e, b.y + Math.sin(s.a) * s.d * e, s.r * (1 - a * .4), .7, fg, f * f, s.a); });
        return true;
      });
    }
    function paint(t, dt) {
      if (!W) return;
      var key = current(), m = theme();
      if (gl) { if (key !== 'mono') drawGL(t, key); else { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } }
      g2.setTransform(D, 0, 0, D, 0, 0); g2.clearRect(0, 0, W, H);
      if (stars && key !== 'dawn') g2.drawImage(stars, 0, 0, W, H);
      if (key === 'dawn') {
        marks.forEach(function (o) {
          var cx = o.cx * W + Math.sin(t * o.v + o.p) * 18, cy = o.cy * H + Math.cos(t * o.v * .8 + o.p) * 14, rx = o.rx * W, ry = o.ry * H, rot = o.rot + Math.sin(t * o.v + o.p) * .09;
          var gr = g2.createLinearGradient(cx - rx, cy, cx + rx, cy); ['#fff', '#cdd8ff', '#f6cfee', '#ffe9c4', '#c9f6e4', '#bfe6ff', '#fff'].forEach(function (c, i, l) { gr.addColorStop(i / (l.length - 1), c); });
          g2.strokeStyle = gr; g2.beginPath(); g2.ellipse(cx, cy, rx, ry, rot, 0, TAU);
          g2.globalAlpha = .7; g2.lineWidth = .8; g2.stroke();
        });
        g2.globalAlpha = 1;
      }
      var fg = key === 'mono' ? '#173451' : '#fff';
      if (key === 'dawn' || key === 'aurora') drawEdges(key, t);
      dots.forEach(function (d) { g2.globalAlpha = .5 + .5 * (.5 + .5 * Math.sin(t * d.f + d.p)); g2.fillStyle = d.c; g2.beginPath(); g2.arc(d.x, d.y, d.r, 0, TAU); g2.fill(); });
      g2.globalAlpha = 1;
      puffs.forEach(function (o) { var q = .5 + .5 * Math.sin(t * o.f + o.p); puff(g2, o.x, o.y + Math.sin(t * o.f + o.p) * 4, o.R * (.92 + .08 * q), o.rot + Math.sin(t * o.f * .7 + o.p) * .08, o.tint, o.glow, .9 + .1 * q); });
      spark.forEach(function (s) { var q = .5 + .5 * Math.sin(t * s.f + s.p), z = s.R * (.72 + .28 * q); if (s.burst) burst8(g2, s.x, s.y, z, fg, s.a * (.55 + .45 * q)); else sparkle(g2, s.x, s.y, z, s.r, fg, s.a * (.45 + .55 * q)); });
      if (key === 'edge') {
        var Sx = toX(geom.S[0]), Sy = toY(geom.S[1]), Cx = toX(geom.C[0]), Cy = toY(geom.C[1]), Rpx = geom.RP * H, ang = Math.atan2(Sy - Cy, Sx - Cx);
        var lg = g2.createLinearGradient(Sx - W * .8, 0, Sx + W * .8, 0); lg.addColorStop(0, 'rgba(226,200,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.95)'); lg.addColorStop(1, 'rgba(226,200,255,0)');
        g2.strokeStyle = lg; g2.lineWidth = .9; g2.beginPath(); g2.arc(Cx, Cy, Rpx, ang - 1.1, ang + 1.1); g2.stroke();
        /* dipole loops standing on the rim, with charge flowing along them */
        g2.save(); g2.translate(Sx, Sy); g2.rotate(ang + Math.PI / 2);
        var base = Math.min(W, H) * .085;
        for (var i = 0; i < 6; i++) {
          var a = base * (1 + i * .62), h = a * (1.25 + i * .05), al = .34 - i * .035;
          g2.beginPath(); g2.moveTo(-a, 0); g2.bezierCurveTo(-a * 1.05, -h * 1.34, a * 1.05, -h * 1.34, a, 0);
          g2.lineCap = 'round'; g2.setLineDash([]); g2.strokeStyle = 'rgba(214,202,255,' + al + ')'; g2.lineWidth = .7; g2.stroke();
          g2.setLineDash([.01, 26 + i * 6]); g2.lineDashOffset = -t * (34 + i * 7) * (i % 2 ? 1 : -1); g2.strokeStyle = i % 2 ? '#fff' : '#ffd6ec'; g2.lineWidth = 1.5; g2.stroke();
        }
        g2.restore(); g2.setLineDash([]);
        /* the point of light on the limb */
        var pulse = .82 + .18 * Math.sin(t * .8), R = Math.min(W, H) * .17 * pulse;
        g2.globalCompositeOperation = 'lighter';
        pool(g2, Sx, Sy, R * .34, '255,255,255', .9); sparkle(g2, Sx, Sy, R * 1.7, .96, '#fff', 1); sparkle(g2, Sx, Sy, R * .62, 1, '#ffd6ec', .85, Math.PI / 4);
        g2.globalCompositeOperation = 'source-over';
      }
      if (key === 'mono') {
        g2.strokeStyle = '#173451'; g2.globalAlpha = 1;
        var r0 = Math.max(W * .62, H * .7), mcx = W * .52, mcy = H * 1.02 - H * .1 + r0 * .32;
        for (var k = 0; k < 7; k++) { g2.lineWidth = .8; g2.globalAlpha = .75 - k * .08; g2.beginPath(); g2.arc(mcx, mcy, r0 - k * 8, Math.PI, TAU); g2.stroke(); }
        g2.globalAlpha = 1;
      }
      if (moon) {
        g2.save(); g2.fillStyle = key === 'mono' ? '#173451' : '#fff'; g2.translate(moon.x, moon.y); g2.rotate(.5);
        var r1 = moon.r, r2 = r1 * .9, dd = r1 * .5, ix = (dd * dd + r1 * r1 - r2 * r2) / (2 * dd), iy = Math.sqrt(Math.max(0, r1 * r1 - ix * ix)), a1 = Math.atan2(iy, ix), a2 = Math.atan2(iy, ix - dd);
        g2.beginPath(); g2.arc(0, 0, r1, a1, TAU - a1, false); g2.arc(dd, 0, r2, -a2, a2, true); g2.closePath(); g2.fill(); g2.restore();
      }
      if (key === 'dawn' || key === 'edge') drawFlies(t, dt || 0, m);
      if ((key === 'bow' || key === 'aurora') && dt) drawShots(t, '#fff', key === 'aurora' ? 'rgba(190,240,255,.6)' : 'rgba(255,255,255,.75)', key === 'aurora');
      if (key !== 'mono') drawBursts(t, '#fff');
    }

    function clock() { return still() ? 24 : (performance.now() - t0) / 1000; }
    function frame(now) {
      raf = 0; if (!seen || document.hidden || still()) return;
      var t = clock(), dt = Math.min(.05, Math.max(0, t - last)); last = t;
      M[0] += (Mt[0] - M[0]) * Math.min(1, dt * 3); M[1] += (Mt[1] - M[1]) * Math.min(1, dt * 3); P *= 1 - Math.min(1, dt * 2.4);
      if (++beats >= 45) { if (slow > 30 && quality > .5) { quality *= .8; glSize(); } beats = 0; slow = 0; }
      var a = performance.now(); paint(t, dt); var cost = performance.now() - a;
      if (dt > .024 || cost > 18) slow++;
      raf = requestAnimationFrame(frame);
    }
    function wake() { if (still()) { paint(clock(), 0); return; } if (!raf && seen && !document.hidden) { last = clock(); raf = requestAnimationFrame(frame); } }

    var hand = { x: -1e4, y: -1e4, t: -9 };
    if (opt.interactive) {
      host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; Mt[0] = x / r.width; Mt[1] = 1 - y / r.height; hand.x = x; hand.y = y; hand.t = clock(); });
      host.addEventListener('pointerdown', function (e) {
        var r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = clock(), s = []; P = 1; hand.x = x; hand.y = y; hand.t = t;
        for (var i = 0; i < 8; i++) s.push({ a: rand(0, TAU), d: rand(40, 120), r: rand(4, 12) });
        bursts.push({ x: x, y: y, t: t, s: s }); if (bursts.length > 5) bursts.shift();
        if (still()) { paint(t + .3, 0); }
      });
    }
    var api = { limbY: limbY, refresh: function () { active = null; if (W) { seed(); paint(clock(), 0); } }, width: function () { return W; } };
    new ResizeObserver(resize).observe(host); resize();
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; if (seen) wake(); }, { rootMargin: '120px' }).observe(host);
    document.addEventListener('visibilitychange', wake);
    return api;
  }

  window.SkyScenes = { mount: mount, Wings: Wings, sparkle: sparkle, burst8: burst8, puff: puff, streak: streak, pool: pool };
})();

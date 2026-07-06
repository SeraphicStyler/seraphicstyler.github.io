/* ============================================================================
   FaultyTerminal — flickering CRT/terminal WebGL background.
   Ported from the reactbits FaultyTerminal component to a plain script for this
   static site. Requires the ogl UMD global (load ogl.umd.js before this file).

   Usage:
     const handle = window.initFaultyTerminal(containerEl, { tint:'#86aceb', ... });
     handle.dispose();
   ============================================================================ */
(function () {
  'use strict';

  if (!window.ogl) {
    console.error('[faulty-terminal] ogl UMD global not found — load ogl.umd.js first');
    return;
  }
  var Renderer = window.ogl.Renderer,
    Program = window.ogl.Program,
    Mesh = window.ogl.Mesh,
    Color = window.ogl.Color,
    Triangle = window.ogl.Triangle;

  var vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  var fragmentShader = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;

  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;

  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;

  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);

  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);

  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;

        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }

    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);

        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }

    p = fract(p);
    p *= uDigitSize;

    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);

    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;

    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);

    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){

    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;

    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);

    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));

    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }

    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    gl_FragColor = vec4(col, 1.0);
}
`;

  function hexToRgb(hex) {
    var h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var num = parseInt(h, 16);
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  }

  var DEFAULTS = {
    scale: 1, gridMul: [2, 1], digitSize: 1.5, timeScale: 0.3, pause: false,
    scanlineIntensity: 0.3, glitchAmount: 1, flickerAmount: 1, noiseAmp: 0,
    chromaticAberration: 0, dither: 0, curvature: 0.2, tint: '#ffffff',
    mouseReact: true, mouseStrength: 0.2, pageLoadAnimation: true, brightness: 1
  };

  function initFaultyTerminal(container, options) {
    if (!container) return null;
    var o = Object.assign({}, DEFAULTS, options || {});
    var dpr = o.dpr || Math.min(window.devicePixelRatio || 1, 2);
    var tintVec = hexToRgb(o.tint);
    var ditherValue = typeof o.dither === 'boolean' ? (o.dither ? 1 : 0) : o.dither;

    var renderer = new Renderer({ dpr: dpr });
    var gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    var geometry = new Triangle(gl);

    var program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uScale: { value: o.scale },
        uGridMul: { value: new Float32Array(o.gridMul) },
        uDigitSize: { value: o.digitSize },
        uScanlineIntensity: { value: o.scanlineIntensity },
        uGlitchAmount: { value: o.glitchAmount },
        uFlickerAmount: { value: o.flickerAmount },
        uNoiseAmp: { value: o.noiseAmp },
        uChromaticAberration: { value: o.chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: o.curvature },
        uTint: { value: new Color(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseStrength: { value: o.mouseStrength },
        uUseMouse: { value: o.mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: o.pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: o.pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: o.brightness }
      }
    });

    var mesh = new Mesh(gl, { geometry: geometry, program: program });

    var mouse = { x: 0.5, y: 0.5 };
    var smoothMouse = { x: 0.5, y: 0.5 };
    var loadStart = 0;
    var timeOffset = Math.random() * 100;
    var frozen = 0;

    function resize() {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.iResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }
    var ro = new ResizeObserver(function () { resize(); });
    ro.observe(container);
    resize();

    function handleMove(e) {
      var rect = container.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1 - (e.clientY - rect.top) / rect.height;
    }
    if (o.mouseReact) container.addEventListener('mousemove', handleMove);

    var rafId = 0;
    function update(t) {
      rafId = requestAnimationFrame(update);
      if (o.pageLoadAnimation && loadStart === 0) loadStart = t;

      if (!o.pause) {
        var elapsed = (t * 0.001 + timeOffset) * o.timeScale;
        program.uniforms.iTime.value = elapsed;
        frozen = elapsed;
      } else {
        program.uniforms.iTime.value = frozen;
      }

      if (o.pageLoadAnimation && loadStart > 0) {
        var progress = Math.min((t - loadStart) / 2000, 1);
        program.uniforms.uPageLoadProgress.value = progress;
      }

      if (o.mouseReact) {
        var damp = 0.08;
        smoothMouse.x += (mouse.x - smoothMouse.x) * damp;
        smoothMouse.y += (mouse.y - smoothMouse.y) * damp;
        var mu = program.uniforms.uMouse.value;
        mu[0] = smoothMouse.x;
        mu[1] = smoothMouse.y;
      }

      renderer.render({ scene: mesh });
    }
    rafId = requestAnimationFrame(update);
    container.appendChild(gl.canvas);

    return {
      dispose: function () {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        if (o.mouseReact) container.removeEventListener('mousemove', handleMove);
        if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      }
    };
  }

  window.initFaultyTerminal = initFaultyTerminal;
})();

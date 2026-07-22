/* Exercise the REAL hover path in fd-atelier.js: dispatch a mouseover on a
   website-house card, run the debounce timer, assert the popup opens and its
   screenshot <img> points at previews/<slug>.jpg. Catches the fill/fillWebsite
   class of bug that node --check cannot. */
const fs = require('fs');

function classList() {
  const s = new Set();
  return { add: x => s.add(x), remove: x => s.delete(x), toggle: (x, on) => (on ? s.add(x) : s.delete(x)),
           contains: x => s.has(x), _set: s };
}
function El(tag) {
  const el = {
    tag: tag || 'div', _id: '', dataset: {}, style: { setProperty() {} }, classList: classList(),
    _attrs: {}, _kids: [], _qs: {}, _on: {}, offsetHeight: 200, innerHTML: '',
    setAttribute(k, v) { this._attrs[k] = v; if (k === 'id') this._id = v; },
    getAttribute(k) { return this._attrs[k] != null ? this._attrs[k] : null; },
    addEventListener(t, fn) { (this._on[t] = this._on[t] || []).push(fn); },
    appendChild(c) { this._kids.push(c); return c; },
    removeChild(c) { this._kids = this._kids.filter(k => k !== c); },
    remove() {}, focus() {}, contains() { return false; },
    getBoundingClientRect() { return { left: 40, right: 240, top: 60, bottom: 300, width: 200, height: 240 }; },
    /* stable cached child per selector so pop.querySelector('.pv-shot') is one object */
    querySelector(sel) { if (!(sel in this._qs)) this._qs[sel] = El('x'); return this._qs[sel]; },
    querySelectorAll() { return []; }
  };
  Object.defineProperty(el, 'id', { get() { return this._id; }, set(v) { this._id = v; this._attrs.id = v; } });
  return el;
}

const timers = [];
global.setTimeout = (fn, ms) => { timers.push(fn); return timers.length; };
global.clearTimeout = () => {};
function runTimers() { const t = timers.splice(0); t.forEach(fn => { try { fn(); } catch (e) { console.log('TIMER ERR', e.message); } }); }

const docListeners = {};
const body = El('body'), head = El('head');
global.window = global;
global.matchMedia = q => ({ matches: /hover: none|max-width|reduced/.test(q) ? false : false, addEventListener() {} });
global.innerWidth = 1300; global.innerHeight = 900;
global.addEventListener = () => {};
global.requestAnimationFrame = fn => fn();
global.CSS = { escape: s => s };
global.navigator = {};
global.location = { hash: '', origin: 'x' };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.fetch = () => Promise.reject();
global.document = {
  head, body, readyState: 'complete',
  createElement: t => El(t),
  getElementById: id => (id === 'savedbtn' || id === 'basketbtn' ? El('b') : null),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener(t, fn) { (docListeners[t] = docListeners[t] || []).push(fn); }
};

/* load data + modules */
eval(fs.readFileSync(process.env.REPO + '/js/directory-data.js', 'utf8'));
eval(fs.readFileSync(process.env.REPO + '/js/fd-basket.js', 'utf8'));
eval(fs.readFileSync(process.env.REPO + '/js/fd-atelier.js', 'utf8'));

/* the popup element the module appended to body */
const pop = body._kids.find(k => k._id === 'previewPopup');
if (!pop) { console.log('FAIL: no #previewPopup created'); process.exit(1); }

/* pick a real website house and a real IG-only house */
const web = window.SS_DIRECTORY.find(b => b.w);
const ig  = window.SS_DIRECTORY.find(b => !b.w && b.h);
const bidOf = b => b.h || b.n;
const slug = String(bidOf(web)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function fakeCard(b) {
  const card = El('article'); card.classList.add('card');
  card._qs['.sv[data-id]'] = { getAttribute: () => bidOf(b) };
  card._qs['.blogo'] = { getAttribute: () => 'icons/x.png' };
  card.closest = sel => (sel === '.card' ? card : null);
  return card;
}
function hover(card) {
  const mo = docListeners['mouseover'] || [];
  mo.forEach(fn => fn({ target: card, relatedTarget: null }));
  runTimers(); /* fire the 110ms debounce → showPop */
}

/* TEST 1: website house opens popup with local screenshot src */
hover(fakeCard(web));
const img = pop._qs['.pv-shot'];
const ok1 = pop.classList.contains('on');
const ok2 = img && img.src === 'previews/' + slug + '.jpg';
console.log('website house:', web.n, '(slug ' + slug + ')');
console.log('  popup opened:      ', ok1 ? 'PASS' : 'FAIL');
console.log('  local shot src:    ', ok2 ? 'PASS' : 'FAIL — got ' + (img && img.src));

/* TEST 1b: fallback to thum.io when the local file 404s */
if (img && typeof img.onerror === 'function') { img.onerror(); }
const ok3 = img && /thum\.io/.test(img.src);
console.log('  thum.io fallback:  ', ok3 ? 'PASS' : 'FAIL — got ' + (img && img.src));

/* TEST 2: IG-only house does NOT open the popup */
pop.classList.remove('on');
hover(fakeCard(ig));
const ok4 = !pop.classList.contains('on');
console.log('ig-only house:', ig.n);
console.log('  no popup:          ', ok4 ? 'PASS' : 'FAIL (popup opened for IG-only)');

/* TEST 3: basket brand-row (.bk-ghead in a .bk-group[data-key=bid]) opens preview, no add button */
pop.classList.remove('on');
function fakeGhead(b) {
  const ghead = El('div'); ghead.classList.add('bk-ghead');
  const group = El('section'); group.classList.add('bk-group'); group.setAttribute('data-key', bidOf(b));
  ghead.closest = sel => (sel === '.bk-ghead' ? ghead : sel === '.bk-group' ? group : null);
  ghead._qs['.bk-glogo'] = { getAttribute: () => 'icons/x.png' };
  return ghead;
}
(docListeners['mouseover'] || []).forEach(fn => fn({ target: fakeGhead(web), relatedTarget: null }));
runTimers();
const ok5 = pop.classList.contains('on');
const ok6 = !/pv-add/.test(pop.innerHTML);   /* basket preview must NOT show "Add to basket" (already in) */
console.log('basket brand-row:', web.n);
console.log('  popup opened:      ', ok5 ? 'PASS' : 'FAIL');
console.log('  no add button:     ', ok6 ? 'PASS' : 'FAIL (add button shown in basket preview)');

const allPass = ok1 && ok2 && ok3 && ok4 && ok5 && ok6;
console.log(allPass ? '\nALL PASS' : '\nSOME FAILED');
process.exit(allPass ? 0 : 1);

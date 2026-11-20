// DOM-adapter integration tests. These do NOT replace a browser/device test.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import * as domains from '../src/react-app/experience/domains.ts';
import * as opening from '../src/react-app/experience/opening.ts';
import * as pages from '../src/react-app/experience/pages.ts';

const source = readFileSync('src/react-app/experience/controller.ts', 'utf8').replaceAll('import.meta.env.DEV', 'true');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

const compiled = compile(source);
const compiledClock = compile(readFileSync('src/react-app/experience/clock.ts', 'utf8'));

async function harness(path = '/', reducedMotion = false, imageFailure = false) {
  let now = 0, nextFrame = 0;
  const frames = new Map(), animations = [], nodes = new Map(), history = [];
  let historyIndex = 0;
  const location = new URL(path, 'https://plexigent.test');
  const document = new EventTarget();
  Object.assign(document, { hidden: false, activeElement: null, title: '', documentElement: { scrollHeight: 844 }, querySelector: () => ({ setAttribute() {} }) });
  const context = new Proxy({ canvas: {} }, { get(target, key) {
    if (key === 'canvas') return target.canvas;
    if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; } });
  class Element extends EventTarget {
    constructor(name) { super(); this.name = name; this.hidden = false; this.dataset = {}; this.attributes = {}; this.classes = new Set(); this.clientWidth = 390; this.clientHeight = name === '.px-origin' ? 300 : 220;
      this.classList = { add: value => this.classes.add(value), remove: value => this.classes.delete(value), toggle: (value, yes) => yes ? this.classes.add(value) : this.classes.delete(value) };
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    focus() { document.activeElement = this; }
    closest() { return null; }
    getContext() { return context; }
    animate() { const animation = { canceled: false, currentTime: 0, pause() {}, cancel() { this.canceled = true; } }; animations.push(animation); return animation; }
    querySelector(selector) { return selector === 'a' ? links[1] : nodes.get(selector); }
    querySelectorAll(selector) { return selector === '[data-go]' ? links : links.slice(1); }
    get outerHTML() { return '<span class="px-mark">xi</span>'; }
  }
  for (const name of ['.px-scene','.px-copy','.px-title','.px-prompt','.px-kicker','.px-contact','.px-next','.px-next-label','.px-back','.px-position','.px-menu','.px-menu-toggle','.px-footer','.px-replay','.px-canvas','.px-origin','.px-fallback','.px-home .px-mark','.px-home','.px-menu-label']) nodes.set(name, new Element(name));
  nodes.get('.px-menu').hidden = true;
  const root = new Element('root');
  const links = pages.pages.map((page, index) => { const link = index === 0 ? nodes.get('.px-home') : new Element(page.path); link.dataset.go = String(index); return link; });
  const reduced = new EventTarget(); reduced.matches = reducedMotion;
  const window = new EventTarget();
  const frameSource = { request: callback => { frames.set(++nextFrame, callback); return nextFrame; }, cancel: id => frames.delete(id) };
  // Native frame methods require their Window receiver. Exercise the production adapter.
  window.requestAnimationFrame = function (callback) {
    if (this !== window) throw new TypeError('Illegal invocation: requestAnimationFrame');
    return frameSource.request(callback);
  };
  window.cancelAnimationFrame = function (id) {
    if (this !== window) throw new TypeError('Illegal invocation: cancelAnimationFrame');
    frameSource.cancel(id);
  };
  const clockExports = {};
  vm.runInNewContext(compiledClock, { exports: clockExports, window,
    requestAnimationFrame: window.requestAnimationFrame, cancelAnimationFrame: window.cancelAnimationFrame });
  let intersect;
  const observers = [];
  const setURL = value => { const url = new URL(value, location); location.href = url.href; };
  const hist = {
    pushState(_, __, path) { history.splice(historyIndex + 1); history.push(path); historyIndex++; setURL(path); },
    replaceState(_, __, path) { history[historyIndex] = path; setURL(path); },
  };
  history[0] = path;
  Object.assign(window, { innerHeight: 844, scrollTo() {}, visualViewport: null, setTimeout });
  const scope = {
    exports: {}, require: name => ({ './clock': clockExports, './domains': domains, './opening': opening, './pages': pages }[name] ?? { default: name }),
    window, document, location, history: hist, matchMedia: () => reduced, AbortController, devicePixelRatio: 2,
    performance: { now: () => now }, requestAnimationFrame: frameSource.request, cancelAnimationFrame: frameSource.cancel,
    innerHeight: 844, visualViewport: null, URLSearchParams, clearTimeout,
    Image: class { complete = false; naturalWidth = 1168; decode() { return Promise.resolve(); } set src(value) { this.url = value; queueMicrotask(() => { this.complete = true; if (imageFailure) { this.naturalWidth = 0; this.onerror?.(); } else this.onload?.(); }); } },
    ResizeObserver: class { constructor(cb) { this.cb = cb; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    IntersectionObserver: class { constructor(cb) { intersect = cb; observers.push(this); } observe() { queueMicrotask(() => this.cb?.([{ isIntersecting: true }])); this.cb = intersect; } disconnect() { this.disconnected = true; } },
  };
  window.IntersectionObserver = scope.IntersectionObserver;
  vm.runInNewContext(compiled, scope);
  let cleanup = scope.exports.mountExperience(root);
  await new Promise(setImmediate);
  const event = (target, name, values = {}) => { const e = new Event(name, { cancelable: true }); Object.assign(e, values); target.dispatchEvent(e); return e; };
  const h = { root, nodes, links, history, animations, frames, document, reduced,
    get path() { return location.pathname; },
    tick(delta) { now += delta; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb(now)); },
    click(selector) { event(nodes.get(selector), 'click', { button: 0 }); },
    go(index) { event(links[index], 'click', { button: 0 }); },
    key(key, values) { return event(root, 'keydown', { key, ...values }); },
    wheel(deltaY) { event(root, 'wheel', { deltaY, deltaX: 0, deltaMode: 0, ctrlKey: false }); },
    back() { if (historyIndex) { setURL(history[--historyIndex]); event(window, 'popstate'); } },
    forward() { if (historyIndex + 1 < history.length) { setURL(history[++historyIndex]); event(window, 'popstate'); } },
    hidden(value) { document.hidden = value; event(document, 'visibilitychange'); },
    offscreen(value) { intersect([{ isIntersecting: !value }]); },
    reduce(value) { reduced.matches = value; event(reduced, 'change'); },
    resize() { event(window, 'resize'); },
    async settle() { await new Promise(setImmediate); this.tick(0); this.tick(800); },
    async remount() { cleanup(); cleanup = scope.exports.mountExperience(root); await new Promise(setImmediate); },
    cleanup() { cleanup(); assert.equal(frames.size, 0); assert.ok(observers.every(o => o.disconnected)); assert.ok(animations.every(a => a.canceled)); },
  };
  return h;
}

test('direct entry, navigation, focus, history, and unknown URL normalization', async () => {
  const h = await harness('/engineering-six');
  try {
    assert.equal(h.path, '/engineering-six/'); assert.equal(h.nodes.get('.px-title').textContent, 'Engineering SiX');
    assert.ok(h.nodes.get('.px-origin').hidden);
    h.click('.px-next'); await h.settle(); assert.equal(h.path, '/back-office-six/');
    assert.equal(h.document.activeElement, h.nodes.get('.px-title'));
    h.back(); await h.settle(); assert.equal(h.path, '/engineering-six/');
    h.forward(); await h.settle(); assert.equal(h.path, '/back-office-six/');
    h.go(5); await h.settle(); h.click('.px-next'); await h.settle();
    assert.equal(h.path, '/contact/'); assert.equal(h.nodes.get('.px-contact').hidden, false);
  } finally { h.cleanup(); }
  const unknown = await harness('/does-not-exist');
  assert.equal(unknown.path, '/'); assert.equal(unknown.history.length, 1); unknown.cleanup();
});

test('menu pauses the opening, traps focus, closes with Escape, and resumes without hidden time', async () => {
  const h = await harness();
  try {
    h.tick(0); h.tick(4800); const time = h.root.dataset.originTime;
    h.click('.px-menu-toggle'); assert.equal(h.document.activeElement, h.links[1]);
    assert.equal(h.frames.size, 0); h.tick(10000); assert.equal(h.root.dataset.originTime, time);
    h.links[6].focus(); h.key('Tab'); assert.equal(h.document.activeElement, h.nodes.get('.px-home'));
    h.key('Tab', { shiftKey: true }); assert.equal(h.document.activeElement, h.links[6]);
    h.key('Escape'); assert.equal(h.document.activeElement, h.nodes.get('.px-menu-toggle'));
    h.tick(0); assert.equal(h.root.dataset.originTime, time); h.tick(1000); assert.equal(h.root.dataset.originTime, '5.800');
    h.hidden(true); h.tick(10000); h.hidden(false); h.tick(0); assert.equal(h.root.dataset.originTime, '5.800');
    h.offscreen(true); h.tick(10000); h.offscreen(false); h.tick(0); assert.equal(h.root.dataset.originTime, '5.800');
  } finally { h.cleanup(); }
});

test('full opening settles, replay resets, completed Home return holds, images may fail safely', async () => {
  const h = await harness('/', false, true);
  try {
    h.tick(0); h.tick(14600); assert.equal(h.root.dataset.originPhase, 'butterfly'); assert.equal(h.frames.size, 0);
    h.go(1); await h.settle(); h.go(0); await h.settle(); assert.equal(h.root.dataset.originTime, '14.600');
    assert.equal(h.frames.size, 0);
    h.click('.px-replay'); await new Promise(setImmediate); h.tick(0);
    assert.equal(h.root.dataset.originTime, '0.000'); assert.ok(h.nodes.get('.px-footer').classes.has('px-waiting'));
    h.reduce(true); await new Promise(setImmediate); assert.equal(h.root.dataset.originTime, '14.600');
    assert.equal(h.nodes.get('.px-replay').hidden, true); assert.equal(h.frames.size, 0);
  } finally { h.cleanup(); }
});

test('rapid interruptions, resize, strict remount, and reduced-motion domain navigation remain coherent', async () => {
  const h = await harness('/labs/');
  try {
    h.go(2); h.tick(0); h.tick(100); h.go(3); h.go(6); await h.settle();
    assert.equal(h.nodes.get('.px-title').textContent, 'Contact'); assert.equal(h.nodes.get('.px-contact').hidden, false);
    assert.equal(h.frames.size, 0);
    h.go(4); h.tick(0); h.tick(100); h.resize(); h.tick(50); h.reduce(true);
    assert.equal(h.nodes.get('.px-title').textContent, 'Back Office SiX'); assert.equal(h.frames.size, 0);
    await h.remount(); h.go(0); await h.settle();
    assert.ok(h.nodes.get('.px-title').innerHTML.startsWith('Ple')); assert.equal(h.root.dataset.originTime, '14.600');
  } finally { h.cleanup(); }
});

test('wheel intent advances once per gesture and ordinary overflow keeps native scrolling', async () => {
  const h = await harness('/labs/', true);
  try {
    h.tick(1000); h.wheel(40); assert.equal(h.path, '/labs/'); h.wheel(50); assert.equal(h.path, '/dynamic-ux/');
    h.tick(900); h.wheel(50); assert.equal(h.path, '/dynamic-ux/');
    // Above is a fresh gesture after 900ms, still below the threshold.
    h.document.documentElement.scrollHeight = 1200;
    h.wheel(500); h.key('PageDown'); assert.equal(h.path, '/dynamic-ux/');
    h.document.documentElement.scrollHeight = 844;
    h.key('PageDown'); assert.equal(h.path, '/engineering-six/');
  } finally { h.cleanup(); }
});

test('selecting each menu destination after interrupting the opening renders its own copy', async () => {
  const h = await harness();
  try {
    h.tick(0); h.tick(1000);
    assert.equal(h.root.dataset.originTime, '1.000');
    for (const [index, page] of pages.pages.entries()) {
      if (index === 0) continue;
      h.click('.px-menu-toggle'); h.go(index); await h.settle();
      assert.equal(h.path, page.path);
      assert.equal(h.nodes.get('.px-title').textContent, page.title);
      assert.equal(h.nodes.get('.px-prompt').textContent, page.prompt);
    }
  } finally { h.cleanup(); }
});

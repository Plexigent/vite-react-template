import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { MotionClock } from '../src/react-app/experience/clock.ts';
import { createOpeningRenderer } from '../src/react-app/experience/opening.ts';
import { domainPoints, interpolatePoints } from '../src/react-app/experience/domains.ts';
import { pages, resolvePage, previousPage } from '../src/react-app/experience/pages.ts';

const reference = readFileSync(new URL('../Plexigent_Website_Handoff/reference/approved-study.fragment.html', import.meta.url), 'utf8');
const geometry = JSON.parse(readFileSync(new URL('../src/react-app/experience/geometry.json', import.meta.url)));
const contract = JSON.parse(readFileSync(new URL('../Plexigent_Website_Handoff/contract.json', import.meta.url)));
const sha = data => createHash('sha256').update(data).digest('hex');

function recordingContext() {
  const trace = [];
  const context = new Proxy({ canvas: {} }, {
    get(target, key) {
      if (key === 'canvas') return target.canvas;
      if (key === 'createRadialGradient') return (...args) => {
        trace.push(['createRadialGradient', ...args]);
        return { addColorStop: (...args) => trace.push(['addColorStop', ...args]) };
      };
      return (...args) => trace.push([key, ...args]);
    },
    set(target, key, value) { trace.push([key, typeof value === 'object' ? 'gradient' : value]); target[key] = value; return true; },
  });
  return { context, trace };
}

function originalRenderer(context, images, width) {
  const begin = reference.indexOf('  const clamp=');
  const end = reference.indexOf('  function step(now)');
  const noOp = () => {};
  const scope = {
    c: context, images, original: geometry, active: 0,
    window: {}, root: { hasAttribute: () => false, dataset: {} },
    scene: { classList: { add: noOp } }, footer: { classList: { remove: noOp } },
    replay: {}, reduced: { matches: false },
  };
  return vm.runInNewContext(`(function(){${reference.slice(begin, end)}\nwidth=${width};return frameAt;})()`, scope);
}

test('frozen handoff, externalized geometry and specimen bytes are unchanged', () => {
  assert.equal(sha(reference), contract.reference.sha256);
  assert.deepEqual(geometry, JSON.parse(readFileSync('Plexigent_Website_Handoff/assets/original-geometry.json')));
  for (const name of ['caterpillar', 'chrysalis']) {
    assert.equal(sha(readFileSync(`src/react-app/assets/${name}-line-art.png`)), geometry[name].sha256);
  }
});

for (const width of [320, 360, 390, 430, 768, 1100, 1366, 1920]) {
  test(`all six opening frames have identical canvas commands to the frozen reference at width ${width}`, () => {
    const images = { caterpillar: { complete: true, naturalWidth: 1168 }, chrysalis: { complete: true, naturalWidth: 1250 } };
    const expected = recordingContext(), actual = recordingContext();
    const baseline = originalRenderer(expected.context, images, width);
    const port = createOpeningRenderer(actual.context, images);
    port.resize(width, 300, 1);
    for (const { seconds } of contract.opening.qa_keyframes) {
      actual.trace.length = expected.trace.length = 0;
      baseline(seconds); port.draw(seconds);
      // JSON removes cross-realm prototypes, retaining exact operation order and numeric values.
      assert.equal(JSON.stringify(actual.trace), JSON.stringify(expected.trace), `Mismatch at ${seconds}s`);
      for (const operation of actual.trace) for (const value of operation) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    }
  });
}

test('all domain geometry matches the approved source exactly', () => {
  const begin = reference.indexOf('      function points(mode)');
  const end = reference.indexOf('      function draw(ps)');
  const baseline = vm.runInNewContext(`(()=>{const count=86;${reference.slice(begin, end)};return points;})()`);
  for (let index = 0; index < pages.length; index++) assert.equal(JSON.stringify(domainPoints(index)), JSON.stringify(baseline(index)));
  const from = domainPoints(1), to = domainPoints(2);
  assert.deepEqual(interpolatePoints(from, to, 0), from);
  interpolatePoints(from, to, 1).forEach((p, i) => {
    assert.ok(Math.abs(p.x - to[i].x) < 1e-12);
    assert.ok(Math.abs(p.y - to[i].y) < 1e-12);
  });
});

function frameHarness() {
  let id = 0;
  const pending = new Map();
  const source = { request: cb => { pending.set(++id, cb); return id; }, cancel: key => pending.delete(key) };
  return { clock: new MotionClock(source), pending, tick(now) {
    const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach(cb => cb(now));
    assert.ok(pending.size <= 1, 'at most one scheduled frame');
  } };
}

test('active clock preserves progress through menu, hidden-tab and offscreen pauses and stops at rest', () => {
  const h = frameHarness(), frames = [];
  let completions = 0;
  h.clock.start(14.6, t => frames.push(t), () => completions++);
  h.tick(0); h.tick(4800); assert.equal(h.clock.elapsed, 4.8);
  h.clock.pause(true); assert.equal(h.pending.size, 0);
  h.tick(25000); h.clock.pause(false); h.clock.pause(false);
  h.tick(30000); assert.equal(h.clock.elapsed, 4.8);
  h.tick(31000); assert.equal(h.clock.elapsed, 5.8);
  h.tick(40000); assert.equal(h.clock.elapsed, 14.6);
  assert.equal(h.pending.size, 0); assert.equal(completions, 1);
  h.clock.pause(true); h.clock.pause(false); h.tick(50000);
  assert.equal(completions, 1); assert.equal(frames.at(-1), 14.6);
});

test('replay resets elapsed time; interruption cancels old callbacks; cleanup cancels all work', () => {
  const h = frameHarness();
  let oldComplete = 0, newComplete = 0;
  h.clock.start(14.6, () => {}, () => oldComplete++); h.tick(0); h.tick(5000);
  h.clock.start(.72, () => {}, () => newComplete++);
  assert.equal(h.clock.elapsed, 0); assert.equal(h.pending.size, 1);
  h.tick(6000); h.tick(6720);
  assert.equal(oldComplete, 0); assert.equal(newComplete, 1);
  h.clock.start(14.6, () => {}); h.clock.stop(); assert.equal(h.pending.size, 0);
});

test('reduced motion resolves immediately, including while paused or mid-transition', () => {
  const h = frameHarness(); let frame = 0, completed = 0;
  h.clock.pause(true);
  h.clock.start(14.6, t => { frame = t; }, () => completed++, 14.6);
  assert.equal(frame, 14.6); assert.equal(completed, 1); assert.equal(h.pending.size, 0);
  h.clock.start(.72, t => { frame = t; }, () => completed++);
  h.clock.finish(); assert.equal(frame, .72); assert.equal(completed, 2); assert.equal(h.pending.size, 0);
});

test('elapsed-time pacing is identical at 60Hz and 120Hz', () => {
  for (const hz of [60, 120]) {
    const h = frameHarness(); h.clock.start(14.6, () => {});
    for (let i = 0; i <= hz * 15; i++) h.tick(i * 1000 / hz);
    assert.equal(h.clock.elapsed, 14.6); assert.equal(h.pending.size, 0);
  }
});

test('addressable destinations, exact copy, journey, and unknown route recovery', () => {
  pages.forEach((page, index) => {
    assert.equal(resolvePage(page.path).index, index);
    assert.equal(resolvePage(page.path.replace(/\/$/, '')).index, index);
    assert.equal(page.label, contract.states[index].label);
    const expectedPrompt = page.path === '/about/'
      ? 'For now, we are in the chrysalis. Soon, we emerge.'
      : contract.states[index].copy;
    assert.equal(page.prompt, expectedPrompt);
    assert.equal(page.invitation, contract.states[index].invitation);
    assert.equal(contract.states[page.next].id, contract.states[index].next);
  });
  assert.deepEqual(resolvePage('/missing/'), { index: 0, known: false });
  assert.equal(previousPage(6), 4); assert.equal(previousPage(1), 0);
});

test('static Cloudflare configuration has no worker runtime', () => {
  const config = JSON.parse(readFileSync('wrangler.json'));
  assert.equal(config.main, undefined);
  assert.equal(config.assets.not_found_handling, 'single-page-application');
  assert.equal(config.assets.directory, './dist/client');
  assert.equal(config.assets.run_worker_first, undefined);
  const pkg = JSON.parse(readFileSync('package.json'));
  assert.ok(pkg.scripts.deploy.endsWith('wrangler deploy --config wrangler.json'));
});

if (process.env.CHECK_BUILD) test('production output stays within free static limits and excludes QA hooks', () => {
  const files = [];
  function walk(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`; if (entry.isDirectory()) walk(file); else files.push(file);
  } }
  walk('dist/client');
  assert.ok(files.length < 20000);
  for (const file of files) {
    assert.ok(statSync(file).size < 25 * 1024 * 1024);
    assert.ok(!file.includes('_qa') && !file.includes('Handoff'));
    if (file.endsWith('.js')) {
      const code = readFileSync(file, 'utf8');
      assert.ok(!code.includes('sceneTime') && !code.includes('originPhase') && !code.includes('frameP95'));
    }
  }
  assert.ok(files.includes('dist/client/plexigent-butterfly.svg'));
});

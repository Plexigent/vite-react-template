import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { accentBands } from '../src/react-app/wordmarkAccents.ts';
import { NODE_BRIGHT, NODE_TEAL } from '../src/react-app/scenePalette.ts';

test('x accent follows only the bottom-left to top-right stroke through the crossing', () => {
  const width=41,height=31, alpha=new Uint8Array(width*height);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const rising=36-y, falling=5+y;
    if(Math.abs(x-rising)<=2 || Math.abs(x-falling)<=2) alpha[y*width+x]=255;
  }
  const bands=accentBands('x',alpha,width,height);
  assert.equal(bands.length,height);
  for(const band of bands) {
    const wanted=36-band.y, other=5+band.y;
    assert.ok(wanted>=band.left && wanted<band.right,'requested rising stroke must be included');
    assert.ok(band.right>band.left && band.right-band.left<=6,'crossing must not color the whole x');
    if(Math.abs(wanted-other)>6) assert.ok(other<band.left || other>=band.right,'the descending stroke must remain white');
  }
});

test('i accent isolates its dot without coloring the stem and handles empty glyphs safely', () => {
  const width=20,height=30, alpha=new Uint8Array(width*height);
  for(let y=3;y<=6;y++) for(let x=7;x<=11;x++) alpha[y*width+x]=255;
  for(let y=12;y<height;y++) for(let x=8;x<=10;x++) alpha[y*width+x]=255;
  assert.deepEqual(accentBands('i',alpha,width,height).map(row=>row.y),[3,4,5,6]);
  assert.deepEqual(accentBands('x',new Uint8Array(100),10,10),[]);
  assert.deepEqual(accentBands('i',new Uint8Array(100),10,10),[]);
});

test('accent pulse shares the foreground wing cadence, node colors, and motion safeguards', () => {
  const css=readFileSync(new URL('../src/react-app/App.css',import.meta.url),'utf8');
  const keyframeStops=name=>{
    const body=css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))[1];
    return [...body.matchAll(/([\d%,\s]+)\s*\{/g)].map(match=>match[1].replace(/\s/g,''));
  };
  assert.deepEqual(keyframeStops('wordmark-node-pulse'),keyframeStops('wing-foreground'));
  for(const name of ['wing-foreground','wordmark-node-pulse']) {
    assert.ok(css.includes(`animation: ${name} var(--wing-duration) ease-in-out var(--wing-delay) infinite;`));
  }
  assert.ok(css.includes(`var(--node-teal, ${NODE_TEAL})`));
  assert.ok(css.includes(`var(--node-bright, ${NODE_BRIGHT})`));
  for(const state of ['hidden','reduced-motion','frozen']) {
    assert.match(css,new RegExp(`\\[data-${state}="true"\\] :is\\([^)]*\\.letter-accent-pulse`));
  }
  assert.ok(!css.includes('.question-trigger::before'),'the question button must not regain its circular decoration');
  assert.ok(css.includes('top: calc(100% + 18px);'));
  assert.ok(css.includes('left: var(--question-x, 50%);'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { artworkPoints } from '../src/react-app/artworkPoints.ts';
import { butterflyDots } from '../src/react-app/sceneGeometry.ts';
import {
  TIMING, PARTICLE_COUNT, arrivalTime, artworkPoint, artworkRect, butterflyPoint,
  canvasRatio, fitScene, flightPoint, formationPoint, particleRadius, phaseAt,
  transferSources,
} from '../src/react-app/sceneModel.ts';

const sizes = [[320,568],[390,844],[430,932],[768,1024],[844,390],[1280,720],[1440,900],[2560,1080]];
const close = (a,b) => assert.ok(Math.abs(a-b)<.0001, `${a} != ${b}`);

test('particle geometry belongs to the current artwork and has safe insets', () => {
  for (const [name, shape] of Object.entries(artworkPoints)) {
    const bytes = readFileSync(new URL(`../src/react-app/assets/${name}-line-art.png`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), shape.sha256);
    assert.equal(shape.points.length, 192);
    assert.equal(new Set(shape.points.map(p=>p.slice(0,2).join(','))).size, 192);
    for (const [x,y,inset] of shape.points) {
      assert.ok(x>0 && x<1 && y>0 && y<1 && inset>0);
    }
  }
});

test('one shared proportional transform keeps both shapes and particles aligned', () => {
  for (const [width,height] of sizes) {
    const scene=fitScene(width,height);
    assert.ok(scene.width<=width+.001 && scene.height<=height+.001);
    for (const name of ['caterpillar','chrysalis']) {
      const rect=artworkRect(name,scene), shape=artworkPoints[name];
      close(rect.width/rect.height,shape.width/shape.height);
      for (let i=0;i<PARTICLE_COUNT;i++) {
        const p=artworkPoint(name,i,scene), normalized=shape.points[i];
        close((p.x-rect.x)/rect.width,normalized[0]);
        close((p.y-rect.y)/rect.height,normalized[1]);
        assert.ok(particleRadius(i,scene)*1.08 < normalized[2]*rect.width);
      }
    }
    for(let i=0;i<PARTICLE_COUNT;i++) {
      const settled=formationPoint(i,TIMING.settled,scene);
      const end=formationPoint(i,TIMING.morphEnd,scene);
      close(settled.x,artworkPoint('caterpillar',i,scene).x);
      close(settled.y,artworkPoint('caterpillar',i,scene).y);
      close(end.x,artworkPoint('chrysalis',i,scene).x);
      close(end.y,artworkPoint('chrysalis',i,scene).y);
    }
  }
});

test('the same 23 particles reach the permanent butterfly without a position jump or clipping', () => {
  assert.equal(new Set(transferSources).size,butterflyDots.length);
  close(arrivalTime(22),TIMING.arrival);
  for(const [width,height] of sizes) {
    const scene=fitScene(width,height);
    for(let i=0;i<butterflyDots.length;i++) {
      const start=flightPoint(i,TIMING.release,scene);
      const source=artworkPoint('chrysalis',transferSources[i],scene);
      close(start.x,source.x); close(start.y,source.y);
      const arrived=flightPoint(i,arrivalTime(i),scene), final=butterflyPoint(i,TIMING.done,scene);
      close(arrived.x,final.x); close(arrived.y,final.y);
      for(let time=TIMING.release;time<=TIMING.done;time+=20) {
        const point=flightPoint(i,time,scene);
        assert.ok(point.x>8 && point.x<scene.width-8 && point.y>8 && point.y<scene.height-8);
      }
    }
  }
});

test('phase boundaries and bitmap budget are deterministic across devices', () => {
  assert.equal(phaseAt(0),'swarm');
  assert.equal(phaseAt(TIMING.settled),'caterpillar');
  assert.equal(phaseAt(TIMING.morph),'chrysalis');
  assert.equal(phaseAt(TIMING.release),'reveal');
  assert.equal(phaseAt(TIMING.done),'done');
  for(const [width,height] of [...sizes,[5120,2880]]) {
    const scene=fitScene(width,height), ratio=canvasRatio(scene,1.75,3);
    assert.ok(scene.width*scene.height*ratio*ratio<=2400001);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { artworkPoints } from '../src/react-app/artworkPoints.ts';
import { butterflyDots, butterflyDetailLines, butterflyLineIndexes } from '../src/react-app/sceneGeometry.ts';
import {
  TIMING, PARTICLE_COUNT, SEED_ALPHA, arrivalTime, artworkPoint, artworkRect, butterflyPoint,
  canvasRatio, fitScene, flightPoint, formationPoint, particleRadius, phaseAt,
  chrysalisParticle, particleOrbits, particleSeeds, scenePoint, seedRadius, transferSources, transferTargets,
} from '../src/react-app/sceneModel.ts';
import { WINGBEAT, butterflyHinge, butterflyPart, wingProjection } from '../src/react-app/butterflyMotion.ts';

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

test('metamorphosis reduces 192 particles to exactly 23 separate seeds before release', () => {
  const scene=fitScene(390,844);
  assert.ok(TIMING.condense >= TIMING.morph && TIMING.condense < TIMING.morphEnd);
  assert.ok(TIMING.condenseEnd < TIMING.release);
  let count=PARTICLE_COUNT;
  const alpha=Array(PARTICLE_COUNT).fill(1);
  for(let time=TIMING.condense;time<=TIMING.condenseEnd;time+=25) {
    const particles=Array.from({length:PARTICLE_COUNT},(_,i)=>chrysalisParticle(i,time,scene));
    const visible=particles.filter(p=>p.alpha>.002).length;
    assert.ok(visible<=count); count=visible;
    for(let i=0;i<PARTICLE_COUNT;i++) {
      if(transferTargets[i]>=0) { assert.ok(particles[i].alpha>=.78); continue; }
      assert.ok(particles[i].alpha<=alpha[i]); alpha[i]=particles[i].alpha;
      assert.ok(transferTargets[particleSeeds[i]]>=0);
    }
    for(let i=0;i<PARTICLE_COUNT;i++) for(let j=i+1;j<PARTICLE_COUNT;j++) {
      const a=particles[i],b=particles[j];
      if(a.alpha>.05 && b.alpha>.05) {
        assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>a.radius+b.radius,'visible dot cores must not merge during consolidation');
      }
    }
  }
  assert.equal(count,23);
  for(const [width,height] of sizes) {
    const scene=fitScene(width,height);
    for(let i=0;i<23;i++) {
      const source=transferSources[i];
      const seed=chrysalisParticle(source,TIMING.release,scene);
      const flight=flightPoint(i,TIMING.release,scene);
      close(seed.x,flight.x); close(seed.y,flight.y);
      close(seed.radius,seedRadius(source,scene)); close(seed.alpha,SEED_ALPHA);
      assert.ok(seed.radius < artworkPoints.chrysalis.points[source][2]*artworkRect('chrysalis',scene).width);
      for(let j=i+1;j<23;j++) {
        const other=chrysalisParticle(transferSources[j],TIMING.release,scene);
        assert.ok(Math.hypot(seed.x-other.x,seed.y-other.y)>3*(seed.radius+other.radius),'seeds must not merge into a glow clump');
      }
    }
    for(let time=TIMING.morphEnd;time<TIMING.condenseEnd;time+=50) {
      for(let i=0;i<PARTICLE_COUNT;i++) {
        if(transferTargets[i]>=0) continue;
        const particle=chrysalisParticle(i,time,scene);
        if(particle.alpha<=.002) continue;
        for(const source of transferSources) {
          const seed=chrysalisParticle(source,time,scene);
          assert.ok(Math.hypot(particle.x-seed.x,particle.y-seed.y)>particle.radius+seed.radius,'a fading dot must remain separate from every seed');
        }
      }
    }
  }
});

test('wing layers preserve the open pose, fixed body hinge, and unclipped shallow folds', () => {
  assert.ok(WINGBEAT.delay>=1150); // Wordmark and button finish appearing first.
  const parts=butterflyDots.map(dot=>butterflyPart(dot.className));
  assert.equal(parts.filter(part=>part==='body').length,5);
  for(const [from,to] of butterflyLineIndexes) {
    assert.ok(parts[from]==='body' || parts[from]===parts[to],'no vein may bridge independently moving wings');
  }
  const points=[...butterflyDots,...butterflyDetailLines.flatMap(line=>[line,{x:line.x2,y:line.y2,className:line.className}])];
  for(const [width,height] of sizes) {
    const scene=fitScene(width,height), hinge=butterflyHinge(scene);
    for(const item of points) {
      const point=scenePoint(item,'butterfly',scene);
      const open=wingProjection(point,0,scene);
      close(open.x,point.x); close(open.y,point.y);
      const part=butterflyPart(item.className);
      if(part==='body') continue;
      for(let fraction=0;fraction<=1;fraction+=.1) {
        const folded=wingProjection(point,WINGBEAT[part]*fraction,scene);
        assert.ok(folded.x>4 && folded.x<scene.width-4 && folded.y>4 && folded.y<scene.height-4);
      }
    }
    for(const angle of [WINGBEAT.foreground,WINGBEAT.background]) {
      const fixed=wingProjection(hinge,angle,scene);
      close(fixed.x,hinge.x); close(fixed.y,hinge.y);
      const body=scenePoint(butterflyDots[1],'butterfly',scene), axis=wingProjection(body,angle,scene);
      close(axis.x,body.x); close(axis.y,body.y);
    }
  }
});

test('chrysalis satellites hold bright, orbit inside the artwork, and fade only near the end', () => {
  assert.ok(TIMING.condenseEnd-TIMING.condense>=5000);
  assert.ok(TIMING.orbitFade-TIMING.orbit>=1500);
  // Only the chrysalis beat is lengthened: the approach and butterfly choreography stay intact.
  assert.equal(TIMING.settled,3600); assert.equal(TIMING.morphEnd,5850);
  assert.equal(TIMING.flight,2100); assert.equal(TIMING.stagger,20);
  assert.equal(TIMING.done-TIMING.release,3500);
  const scene=fitScene(390,844), width=artworkRect('chrysalis',scene).width;
  for(let i=0;i<PARTICLE_COUNT;i++) {
    if(transferTargets[i]>=0) continue;
    const lane=particleOrbits[i], seed=particleSeeds[i];
    const anchor=artworkPoint('chrysalis',seed,scene);
    assert.ok(lane.radius+lane.dotRadius < artworkPoints.chrysalis.points[seed][2],'the full orbit and core must fit inside the silhouette');
    assert.ok(Math.abs(lane.turns)>.5 && Math.abs(lane.turns)<1);
    for(const time of [TIMING.orbit,TIMING.orbitFade]) {
      const particle=chrysalisParticle(i,time,scene);
      close(particle.alpha,.78);
      close(Math.hypot(particle.x-anchor.x,particle.y-anchor.y),lane.radius*width);
    }
    const first=chrysalisParticle(i,TIMING.orbit,scene);
    const later=chrysalisParticle(i,TIMING.orbitFade,scene);
    assert.ok(Math.hypot(first.x-later.x,first.y-later.y)>lane.radius*width,'a visible satellite should make a pronounced arc before fading');
    const settled=chrysalisParticle(i,TIMING.morphEnd,scene), original=artworkPoint('chrysalis',i,scene);
    close(settled.x,original.x); close(settled.y,original.y);
    close(chrysalisParticle(i,TIMING.condenseEnd,scene).alpha,0);
    for(const time of [TIMING.morphEnd,TIMING.orbit,TIMING.orbitFade,TIMING.condenseEnd]) {
      const before=chrysalisParticle(i,time-.01,scene), after=chrysalisParticle(i,time+.01,scene);
      assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<.001,'orbital phase boundaries must not jump');
    }
  }
});

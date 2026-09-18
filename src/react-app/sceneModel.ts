import { artworkPoints } from "./artworkPoints.ts";
import { butterflyDots, type Point } from "./sceneGeometry.ts";

export type Phase = "loading" | "swarm" | "caterpillar" | "chrysalis" | "reveal" | "done";
export type SceneSize = { width: number; height: number; portrait: boolean };
export type Rect = Point & { width: number; height: number };
export type Artwork = keyof typeof artworkPoints;
export const TIMING = {
	settled: 3600,
	morph: 4350,
	morphEnd: 5850,
	condense: 4550,
	orbit: 6950,
	orbitFade: 8450,
	condenseEnd: 9950,
	release: 10800,
	flight: 2100,
	stagger: 20,
	arrival: 13340,
	done: 14300,
} as const;
export const PARTICLE_COUNT = artworkPoints.caterpillar.points.length;
export const SEED_ALPHA = .94;
export const SEED_SCALE = 1.3;

export function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
export function progress(time: number, start: number, duration: number) { return clamp((time - start) / duration); }
export function smooth(value: number) { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); }
export function mix(a: number, b: number, t: number) { return a + (b - a) * t; }
export function random(index: number, salt: number) {
	const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
	return value - Math.floor(value);
}

export function phaseAt(time: number): Phase {
	if (time < TIMING.settled) return "swarm";
	if (time < TIMING.morph) return "caterpillar";
	if (time < TIMING.release) return "chrysalis";
	if (time < TIMING.done) return "reveal";
	return "done";
}

export function fitScene(width: number, height: number): SceneSize {
	const portrait = height > width;
	if (!portrait) return { width, height, portrait };
	const fittedWidth = Math.min(width, height * 390 / 844);
	return { width: fittedWidth, height: fittedWidth * 844 / 390, portrait };
}

export function artworkRect(name: Artwork, scene: SceneSize): Rect {
	const width = scene.portrait ? scene.width * .86 : Math.min(scene.width * .34, scene.height * 1.15);
	const height = width * artworkPoints[name].height / artworkPoints[name].width;
	return {
		x: scene.width * (scene.portrait ? .5 : .53) - width / 2,
		y: scene.height * (scene.portrait ? .455 : .49) - height / 2,
		width, height,
	};
}

export function artworkPoint(name: Artwork, index: number, scene: SceneSize): Point {
	const rect = artworkRect(name, scene);
	const [x, y] = artworkPoints[name].points[index];
	return { x: rect.x + x * rect.width, y: rect.y + y * rect.height };
}

export function particleRadius(index: number, scene: SceneSize) {
	const width = artworkRect("caterpillar", scene).width;
	const inset = Math.min(artworkPoints.caterpillar.points[index][2], artworkPoints.chrysalis.points[index][2]);
	return Math.min(width * (.0031 + random(index, 9) * .0015), width * inset * .7);
}

export function scenePoint(point: Point, group: "star" | "mesh" | "butterfly", scene: SceneSize): Point {
	if (group === "butterfly") {
		// Uniform scale preserves the wing proportions on portrait and landscape.
		const scale = scene.portrait ? scene.width * .40 / 320 : Math.min(scene.width / 1600, scene.height / 900);
		return {
			x: scene.width * (scene.portrait ? .74 : .79) + (point.x - 78.3) * 16 * scale,
			y: scene.height * (scene.portrait ? .22 : .24) + (point.y - 23.4) * 9 * scale,
		};
	}
	let { x, y } = point;
	if (scene.portrait) {
		if (group === "star") { x = 7 + x * .82; y = 69 + (y - 58) * .66; }
		else { x = 18 + (x - 39) * 1.24; y = 73 + (y - 67) * .98; }
	}
	return { x: x * scene.width / 100, y: y * scene.height / 100 };
}

// Farthest-point selection keeps the 23 seeds spread across the real silhouette,
// not merely separated along x (which can leave near-overlapping neighbours).
const chrysalisAspect = artworkPoints.chrysalis.height / artworkPoints.chrysalis.width;
const shapeDistance = (a: readonly number[], b: readonly number[]) =>
	(a[0] - b[0]) ** 2 + ((a[1] - b[1]) * chrysalisAspect) ** 2;
const candidates = artworkPoints.chrysalis.points;
const seedIndexes: number[] = [];
const nearestSeed = new Array<number>(PARTICLE_COUNT).fill(Infinity);
let nextSeed = candidates.reduce((best, point, index) =>
	shapeDistance(point, [.5, .5]) < shapeDistance(candidates[best], [.5, .5]) ? index : best, 0);
for (let count = 0; count < butterflyDots.length; count++) {
	seedIndexes.push(nextSeed);
	for (let i = 0; i < PARTICLE_COUNT; i++) {
		nearestSeed[i] = Math.min(nearestSeed[i], shapeDistance(candidates[i], candidates[nextSeed]));
	}
	// Interior seeds leave room for complete orbits inside the actual silhouette.
	nextSeed = nearestSeed.reduce((best, distance, index) =>
		candidates[index][2] >= .025 && distance > nearestSeed[best] ? index : best, nextSeed);
}
const sourcesByX = seedIndexes.map(index => ({ index, x: candidates[index][0] })).sort((a, b) => a.x - b.x);
const targetsByX = butterflyDots.map((point, index) => ({ index, x: point.x })).sort((a, b) => a.x - b.x);
export const transferSources = new Array<number>(butterflyDots.length);
targetsByX.forEach((target, rank) => {
	transferSources[target.index] = sourcesByX[rank].index;
});
export const transferTargets = new Int16Array(PARTICLE_COUNT).fill(-1);
transferSources.forEach((source, target) => { transferTargets[source] = target; });

export const particleSeeds = candidates.map(point => transferSources.reduce((best, source) =>
	shapeDistance(point, candidates[source]) < shapeDistance(point, candidates[best]) ? source : best, transferSources[0]));

// One-time orbital layout: ordered lanes prevent satellites overtaking each other.
// All distances are normalized to artwork width so phone/desktop motion matches.
export const particleOrbits = new Array<{ startAngle: number; angle: number; radius: number; dotRadius: number; turns: number }>(PARTICLE_COUNT);
for (const seed of transferSources) {
	const origin = candidates[seed];
	const neighbours = transferSources.filter(other => other !== seed);
	const nearest = Math.sqrt(Math.min(...neighbours.map(other => shapeDistance(origin, candidates[other]))));
	const radius = Math.min(origin[2] * .78, nearest * .40);
	const satellites = particleSeeds.map((source, index) => ({ source, index }))
		.filter(item => item.source === seed && item.index !== seed)
		.map(({ index }) => ({ index, angle: Math.atan2((candidates[index][1] - origin[1]) * chrysalisAspect, candidates[index][0] - origin[0]) }))
		.sort((a, b) => a.angle - b.angle);
	const spacing = Math.PI * 2 / Math.max(1, satellites.length);
	const offset = satellites.reduce((total, item, rank) => total + item.angle - rank * spacing, 0) / Math.max(1, satellites.length);
	const dotRadius = Math.min(.0038, radius * Math.sin(Math.PI / Math.max(2, satellites.length)) * .65, (nearest / 2 - radius) * .8);
	const turns = (seed % 2 ? 1 : -1) * (.72 + random(seed, 12) * .16);
	satellites.forEach((item, rank) => {
		// Slightly unequal spacing/sizes make rotation legible instead of a static dotted ring.
		const offsetAngle = (random(item.index, 14) - .5) * spacing * .18;
		particleOrbits[item.index] = { startAngle: item.angle, angle: offset + rank * spacing + offsetAngle,
			radius, dotRadius: dotRadius * (.8 + random(item.index, 15) * .2), turns };
	});
}

export function condensation(time: number) {
	return smooth(progress(time, TIMING.condense, TIMING.condenseEnd - TIMING.condense));
}

export function seedRadius(index: number, scene: SceneSize) { return particleRadius(index, scene) * SEED_SCALE; }

export function chrysalisParticle(index: number, time: number, scene: SceneSize) {
	const point = formationPoint(index, time, scene);
	const t = condensation(time);
	if (t === 0) return { ...point, radius: particleRadius(index, scene), alpha: .78 };
	if (transferTargets[index] >= 0) {
		return { ...point, radius: particleRadius(index, scene) * mix(1, SEED_SCALE, t), alpha: mix(.78, SEED_ALPHA, t) };
	}
	const seed = particleSeeds[index];
	const anchor = formationPoint(seed, time, scene);
	const dx = point.x - anchor.x, dy = point.y - anchor.y;
	const distance = Math.hypot(dx, dy) || 1;
	const gather = smooth(progress(time, TIMING.morphEnd, TIMING.orbit - TIMING.morphEnd));
	if (gather === 0) return { ...point, radius: particleRadius(index, scene), alpha: .78 };
	const lane = particleOrbits[index];
	const width = artworkRect("chrysalis", scene).width;
	const orbit = smooth(progress(time, TIMING.orbit, TIMING.condenseEnd - TIMING.orbit));
	const fadeStart = TIMING.orbitFade + random(index, 13) * 250;
	const fade = smooth(progress(time, fadeStart, TIMING.condenseEnd - fadeStart));
	const angle = mix(lane.startAngle, lane.angle, gather) + orbit * lane.turns * Math.PI * 2;
	const radius = mix(particleRadius(index, scene), Math.min(particleRadius(index, scene), lane.dotRadius * width), gather) * mix(1, .75, fade);
	// The lane never collapses into its seed: satellites finish their arc as they fade.
	const remaining = mix(distance, lane.radius * width, gather);
	return { x: anchor.x + Math.cos(angle) * remaining, y: anchor.y + Math.sin(angle) * remaining,
		radius, alpha: .78 * (1 - fade) };
}

export function arrivalTime(target: number) { return TIMING.release + target * TIMING.stagger + TIMING.flight; }

export function butterflyPoint(index: number, _time: number, scene: SceneSize): Point {
	// Ambient motion is applied to the entire cached canvas after the finale.
	return scenePoint(butterflyDots[index], "butterfly", scene);
}

export function flightPoint(index: number, time: number, scene: SceneSize): Point {
	const start = artworkPoint("chrysalis", transferSources[index], scene);
	const end = butterflyPoint(index, time, scene);
	const t = smooth(progress(time, TIMING.release + index * TIMING.stagger, TIMING.flight));
	const dx = end.x - start.x, dy = end.y - start.y;
	const distance = Math.hypot(dx, dy) || 1;
	const arc = Math.sin(t * Math.PI) * Math.min(scene.width * .065, 40) * (.45 + random(index, 8) * .55);
	return { x: mix(start.x, end.x, t) - dy / distance * arc, y: mix(start.y, end.y, t) + dx / distance * arc };
}

export function formationPoint(index: number, time: number, scene: SceneSize): Point {
	const caterpillar = artworkPoint("caterpillar", index, scene);
	if (time >= TIMING.morph) {
		const chrysalis = artworkPoint("chrysalis", index, scene);
		const t = smooth(progress(time, TIMING.morph, TIMING.morphEnd - TIMING.morph));
		return { x: mix(caterpillar.x, chrysalis.x, t), y: mix(caterpillar.y, chrysalis.y, t) };
	}
	const delay = random(index, 2) * 480;
	const t = smooth(progress(time, delay, 2650 + random(index, 3) * 430));
	const angle = random(index, 4) * Math.PI * 2;
	const radius = Math.sqrt(random(index, 5));
	const startX = scene.width * (.18 + Math.cos(angle) * .25 * radius);
	const startY = scene.height * (.83 + Math.sin(angle) * .17 * radius);
	const bend = Math.sin(t * Math.PI) * Math.min(scene.width * .075, 60);
	return { x: mix(startX, caterpillar.x, t) - bend * .35, y: mix(startY, caterpillar.y, t) - bend };
}

export function canvasRatio(scene: SceneSize, quality: number, deviceRatio: number) {
	return Math.min(deviceRatio || 1, quality, Math.sqrt(2_400_000 / Math.max(1, scene.width * scene.height)));
}

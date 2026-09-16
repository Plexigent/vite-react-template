import { useEffect, useRef, type RefObject } from "react";
import caterpillarUrl from "./assets/caterpillar-line-art.png";
import chrysalisUrl from "./assets/chrysalis-line-art.png";
import {
	starDots, meshDots, meshLineIndexes, butterflyDots, butterflyLineIndexes,
	butterflyDetailLines, type Point,
} from "./sceneGeometry.ts";
import {
	TIMING, PARTICLE_COUNT, arrivalTime, artworkRect, butterflyPoint, canvasRatio,
	fitScene, flightPoint, formationPoint, mix, particleRadius, phaseAt, progress,
	random, scenePoint, smooth, transferSources, transferTargets, type Phase, type SceneSize,
} from "./sceneModel.ts";

type Surface = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };
type Props = { stageRef: RefObject<HTMLDivElement | null>; onPhase: (phase: Phase) => void };

function surface(width: number, height: number, ratio = 1): Surface | null {
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.ceil(width * ratio));
	canvas.height = Math.max(1, Math.ceil(height * ratio));
	const context = canvas.getContext("2d");
	if (!context) return null;
	context.setTransform(ratio, 0, 0, ratio, 0, 0);
	return { canvas, context };
}

function dotSprite(): HTMLCanvasElement | null {
	const cache = surface(64, 64);
	if (!cache) return null;
	const { context, canvas } = cache;
	const halo = context.createRadialGradient(32, 32, 0, 32, 32, 32);
	halo.addColorStop(0, "rgba(181,255,246,.35)");
	halo.addColorStop(.35, "rgba(126,239,225,.13)");
	halo.addColorStop(1, "rgba(126,239,225,0)");
	context.fillStyle = halo;
	context.fillRect(0, 0, 64, 64);
	const core = context.createRadialGradient(29, 29, 1, 32, 32, 9);
	core.addColorStop(0, "#f3fffc");
	core.addColorStop(.55, "#bbf5eb");
	core.addColorStop(1, "rgba(140,230,224,.25)");
	context.fillStyle = core;
	context.beginPath();
	context.arc(32, 32, 9, 0, Math.PI * 2);
	context.fill();
	return canvas;
}

function drawDot(context: CanvasRenderingContext2D, sprite: HTMLCanvasElement, point: Point, radius: number, alpha: number) {
	if (alpha <= .002) return;
	const size = radius * 64 / 9;
	context.globalAlpha = Math.min(1, alpha);
	context.drawImage(sprite, point.x - size / 2, point.y - size / 2, size, size);
}

function drawLine(context: CanvasRenderingContext2D, a: Point, b: Point, alpha: number, fraction = 1) {
	if (alpha <= .002 || fraction <= 0) return;
	context.globalAlpha = alpha;
	context.strokeStyle = "#a5eae6";
	context.lineWidth = .75;
	context.beginPath();
	context.moveTo(a.x, a.y);
	context.lineTo(mix(a.x, b.x, fraction), mix(a.y, b.y, fraction));
	context.stroke();
}

async function loadArtwork(src: string) {
	const image = new Image();
	image.src = src;
	try { await image.decode(); return image; }
	catch { return null; } // The particle silhouettes remain legible if an asset fails.
}

export function ParticleScene({ stageRef, onPhase }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const stage = stageRef.current;
		const host = stage?.parentElement;
		const context = canvas?.getContext("2d");
		const sprite = dotSprite();
		if (!canvas || !context || !stage || !host || !sprite) {
			onPhase("done");
			return;
		}
		const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const params = import.meta.env.DEV ? new URLSearchParams(location.search) : null;
		const requestedTime = params?.get("sceneTime");
		const freezeTime = requestedTime !== null && requestedTime !== undefined && Number.isFinite(Number(requestedTime))
			? Math.max(0, Number(requestedTime)) : null;
		const reduced = () => motion.matches || params?.get("sceneMotion") === "reduce";
		let stopped = false;
		let ready = false;
		let frame = 0;
		let elapsed = 0;
		let previous = 0;
		let phase: Phase = "loading";
		let scene: SceneSize = { width: 1, height: 1, portrait: false };
		let ratio = 1;
		let quality = Math.min(window.devicePixelRatio || 1, 1.75);
		let needsResize = false;
		let field: Surface | null = null;
		let butterfly: Surface | null = null;
		let butterflyBounds = { x: 0, y: 0, width: 1, height: 1 };
		let caterpillar: HTMLImageElement | null = null;
		let chrysalis: HTMLImageElement | null = null;
		let samples = 0, slowFrames = 0, renderTotal = 0, frameTotal = 0, renders = 0;

		const finalRadius = (size = .5) => size * (scene.portrait ? 5 : 7);
		const rebuild = () => {
			const bounds = host.getBoundingClientRect();
			scene = fitScene(Math.max(1, bounds.width), Math.max(1, bounds.height));
			stage.style.width = `${scene.width}px`;
			stage.style.height = `${scene.height}px`;
			stage.style.setProperty("--scene-width", `${scene.width}px`);
			stage.dataset.layout = scene.portrait ? "portrait" : "landscape";
			ratio = canvasRatio(scene, quality, window.devicePixelRatio);
			canvas.width = Math.max(1, Math.round(scene.width * ratio));
			canvas.height = Math.max(1, Math.round(scene.height * ratio));
			context.setTransform(ratio, 0, 0, ratio, 0, 0);
			field = surface(scene.width, scene.height, ratio);
			if (field) {
				for (const [from, to] of meshLineIndexes) {
					drawLine(field.context, scenePoint(meshDots[from], "mesh", scene), scenePoint(meshDots[to], "mesh", scene), .23);
				}
				for (const dot of starDots) drawDot(field.context, sprite, scenePoint(dot, "star", scene), finalRadius(dot.size) * .7, (dot.opacity ?? .5) * .8);
				for (const dot of meshDots) drawDot(field.context, sprite, scenePoint(dot, "mesh", scene), finalRadius(dot.size), (dot.opacity ?? .7) * .85);
			}
			const allPoints = [...butterflyDots, ...butterflyDetailLines.flatMap(line => [line, { x: line.x2, y: line.y2 }])]
				.map(point => scenePoint(point, "butterfly", scene));
			const xs = allPoints.map(point => point.x), ys = allPoints.map(point => point.y);
			butterflyBounds = { x: Math.min(...xs) - 24, y: Math.min(...ys) - 24,
				width: Math.max(...xs) - Math.min(...xs) + 48, height: Math.max(...ys) - Math.min(...ys) + 48 };
			butterfly = surface(butterflyBounds.width, butterflyBounds.height, ratio);
			if (butterfly) {
				butterfly.context.translate(-butterflyBounds.x, -butterflyBounds.y);
				for (const [from, to] of butterflyLineIndexes) {
					drawLine(butterfly.context, scenePoint(butterflyDots[from], "butterfly", scene), scenePoint(butterflyDots[to], "butterfly", scene), .38);
				}
				for (const line of butterflyDetailLines) {
					drawLine(butterfly.context, scenePoint(line, "butterfly", scene), scenePoint({ x: line.x2, y: line.y2 }, "butterfly", scene), (line.opacity ?? .5) * .62);
				}
			}
		};

		const paint = (time: number) => {
			const started = performance.now();
			context.globalAlpha = 1;
			context.clearRect(0, 0, scene.width, scene.height);
			// Ordinary alpha compositing keeps overlapping particles from bleaching the art.
			context.globalCompositeOperation = "source-over";
			const morph = smooth(progress(time, TIMING.morph, TIMING.morphEnd - TIMING.morph));
			const shell = 1 - smooth(progress(time, TIMING.release + 100, 1300));
			if (time < TIMING.release + 1400) {
				if (caterpillar) {
					const rect = artworkRect("caterpillar", scene);
					context.globalAlpha = smooth(progress(time, 1500, 1700)) * (1 - morph) * .47;
					context.drawImage(caterpillar, rect.x, rect.y, rect.width, rect.height);
				}
				if (chrysalis && morph > 0) {
					const rect = artworkRect("chrysalis", scene);
					context.globalAlpha = morph * shell * .27;
					context.drawImage(chrysalis, rect.x, rect.y, rect.width, rect.height);
				}
			}
			if (field && time > 8000) {
				context.globalAlpha = smooth(progress(time, 8000, 1950));
				context.drawImage(field.canvas, 0, 0, scene.width, scene.height);
			}
			// Lines appear only after both permanent endpoints have arrived.
			if (time >= TIMING.arrival + 550 && butterfly) {
				context.globalAlpha = 1;
				context.drawImage(butterfly.canvas, butterflyBounds.x, butterflyBounds.y, butterflyBounds.width, butterflyBounds.height);
			} else if (time > TIMING.release) {
				for (const [from, to] of butterflyLineIndexes) {
					const fraction = smooth(progress(time, Math.max(arrivalTime(from), arrivalTime(to)), 400));
					drawLine(context, butterflyPoint(from, time, scene), butterflyPoint(to, time, scene), .38 * fraction, fraction);
				}
				const outline = smooth(progress(time, TIMING.arrival, 550));
				if (outline > 0) for (const line of butterflyDetailLines) {
					drawLine(context, scenePoint(line, "butterfly", scene), scenePoint({ x: line.x2, y: line.y2 }, "butterfly", scene), (line.opacity ?? .5) * .62 * outline);
				}
			}
			if (time < TIMING.release + 1600) {
				for (let i = 0; i < PARTICLE_COUNT; i++) {
					if (time >= TIMING.release && transferTargets[i] >= 0) continue;
					const fadeIn = smooth(progress(time, random(i, 2) * 480, 600));
					const fadeOut = 1 - smooth(progress(time, TIMING.release + random(i, 6) * 500, 1000));
					const point = formationPoint(i, time, scene);
					// A small, bounded exhale replaces the old size/brightness explosion.
					const breathe = 1 + Math.sin(progress(time, TIMING.morphEnd, TIMING.release - TIMING.morphEnd) * Math.PI) * .08;
					drawDot(context, sprite, point, particleRadius(i, scene) * breathe, fadeIn * fadeOut * .78);
				}
			}
			if (time >= TIMING.release) {
				for (let target = 0; target < butterflyDots.length; target++) {
					const source = transferSources[target];
					const t = smooth(progress(time, TIMING.release + target * TIMING.stagger, TIMING.flight));
					const dot = butterflyDots[target];
					drawDot(context, sprite, flightPoint(target, time, scene), mix(particleRadius(source, scene), finalRadius(dot.size), t), mix(.78, dot.opacity ?? .8, t));
				}
			}
			context.globalAlpha = 1;
			const nextPhase = phaseAt(time);
			if (nextPhase !== phase) { phase = nextPhase; onPhase(phase); }
			renders++;
			renderTotal += performance.now() - started;
			if (import.meta.env.DEV && (renders % 30 === 0 || time >= TIMING.done || freezeTime !== null)) {
				canvas.dataset.sceneElapsed = time.toFixed(0);
				canvas.dataset.sceneRenderMs = (renderTotal / renders).toFixed(2);
				canvas.dataset.sceneDpr = ratio.toFixed(2);
				canvas.dataset.sceneFrames = String(renders);
				canvas.dataset.sceneFrameMs = (frameTotal / Math.max(1, samples)).toFixed(2);
			}
		};

		const tick = (now: number) => {
			frame = 0;
			if (stopped || document.hidden || !ready) return;
			if (needsResize) { rebuild(); needsResize = false; }
			const delta = previous && elapsed < TIMING.done && freezeTime === null ? now - previous : 0;
			previous = now;
			if (delta > 0) {
				frameTotal += delta;
				samples++;
				if (delta > 24) slowFrames++;
				if (samples >= 120) {
					if (slowFrames > 36 && quality > 1) { quality = Math.max(1, quality - .25); rebuild(); }
					samples = slowFrames = frameTotal = 0;
				}
			}
			elapsed = freezeTime ?? (reduced() ? TIMING.done : Math.min(TIMING.done, elapsed + Math.min(delta, 64)));
			paint(elapsed);
			if (elapsed < TIMING.done && freezeTime === null) frame = requestAnimationFrame(tick);
			// After the finale the canvas stops. A tiny compositor transform provides ambient movement.
		};
		const schedule = () => {
			if (!frame && !stopped && ready && !document.hidden) frame = requestAnimationFrame(tick);
		};
		// Coalesce toolbar/orientation/ResizeObserver events into one rebuild per frame.
		const resize = () => { needsResize = true; schedule(); };
		const visibility = () => {
			stage.dataset.hidden = String(document.hidden);
			if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
			previous = 0;
			schedule();
		};
		const preferences = () => {
			stage.dataset.reducedMotion = String(reduced());
			if (reduced()) elapsed = TIMING.done;
			previous = 0;
			schedule();
		};
		const observer = new ResizeObserver(resize);
		observer.observe(host);
		window.addEventListener("resize", resize);
		document.addEventListener("visibilitychange", visibility);
		motion.addEventListener("change", preferences);
		rebuild();
		stage.dataset.reducedMotion = String(reduced());
		stage.dataset.frozen = String(freezeTime !== null);
		void Promise.all([loadArtwork(caterpillarUrl), loadArtwork(chrysalisUrl)]).then(images => {
			if (stopped) return;
			[caterpillar, chrysalis] = images;
			ready = true;
			elapsed = freezeTime ?? (reduced() ? TIMING.done : 0);
			paint(elapsed);
			schedule();
		});
		return () => {
			stopped = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("resize", resize);
			document.removeEventListener("visibilitychange", visibility);
			motion.removeEventListener("change", preferences);
		};
	}, [stageRef, onPhase]);

	return <canvas className="scene-canvas" ref={canvasRef} aria-hidden="true" />;
}

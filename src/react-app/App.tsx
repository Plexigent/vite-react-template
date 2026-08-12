import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
	type RefObject,
} from "react";
import { flushSync } from "react-dom";
import caterpillarLineArt from "./assets/caterpillar-line-art.png";
import chrysalisLineArt from "./assets/chrysalis-line-art.png";
import "./App.css";

type Dot = {
	x: number;
	y: number;
	size?: number;
	opacity?: number;
	delay?: number;
	className?: string;
};

type Line = {
	x: number;
	y: number;
	x2: number;
	y2: number;
	opacity?: number;
	delay?: number;
	className?: string;
};

type DotGroup = "star" | "mesh" | "butterfly";
type IntroPhase = "swarm" | "caterpillar" | "chrysalis" | "reveal" | "done";
type SceneLayout = "landscape" | "portrait";

type IntroSwarmDot = {
	amplitude: number;
	delay: number;
	duration: number;
	endX: number;
	endY: number;
	frequency: number;
	index: number;
	phase: number;
	radius: number;
	startX: number;
	startY: number;
};

type IntroCanvasBounds = {
	height: number;
	left: number;
	top: number;
	width: number;
};

type RevealWord = {
	baseStart: number;
	length: number;
	text: string;
	wordStart: number;
};

const WORDMARK = "Plexigent";
const REVEAL_WORDS = ["ComPlex", "exigent", "Intelligent", "Plexippus"];
const REVEAL_FADE_DURATION = 1000;
const REVEAL_HOLD_DURATION = 1000;
const INTRO_PHASES: Array<{ duration: number; phase: IntroPhase }> = [
	{ duration: 5600, phase: "caterpillar" },
	{ duration: 1300, phase: "chrysalis" },
	{ duration: 2550, phase: "reveal" },
	{ duration: 4400, phase: "done" },
];
const INTRO_SWARM_DOT_COUNT = 192;
const INTRO_CANVAS_BOUNDS: Record<"swarm" | "reveal", IntroCanvasBounds> = {
	swarm: { height: 76, left: -8, top: 32, width: 84 },
	reveal: { height: 58, left: 38, top: 8, width: 55 },
};
const PORTRAIT_INTRO_CANVAS_BOUNDS: Record<"swarm" | "reveal", IntroCanvasBounds> = {
	swarm: { height: 58, left: -42, top: 31, width: 146 },
	reveal: { height: 100, left: 0, top: 0, width: 100 },
};

function sleep(duration: number) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, duration);
	});
}

function nextPaint() {
	return new Promise((resolve) => {
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(resolve);
		});
	});
}

const starDots: Dot[] = [
	{ x: 4, y: 86, size: 0.36, opacity: 0.44, delay: -4 },
	{ x: 7, y: 78, size: 0.48, opacity: 0.66, delay: -1 },
	{ x: 8, y: 92, size: 0.28, opacity: 0.38, delay: -9 },
	{ x: 11, y: 84, size: 0.31, opacity: 0.42, delay: -12 },
	{ x: 13, y: 72, size: 0.4, opacity: 0.56, delay: -6 },
	{ x: 15, y: 91, size: 0.24, opacity: 0.32, delay: -3 },
	{ x: 17, y: 80, size: 0.34, opacity: 0.48, delay: -10 },
	{ x: 19, y: 69, size: 0.29, opacity: 0.4, delay: -2 },
	{ x: 20, y: 88, size: 0.45, opacity: 0.52, delay: -7 },
	{ x: 22, y: 76, size: 0.24, opacity: 0.34, delay: -13 },
	{ x: 24, y: 93, size: 0.3, opacity: 0.36, delay: -5 },
	{ x: 25, y: 66, size: 0.38, opacity: 0.5, delay: -11 },
	{ x: 27, y: 83, size: 0.26, opacity: 0.34, delay: -8 },
	{ x: 29, y: 72, size: 0.33, opacity: 0.42, delay: -14 },
	{ x: 31, y: 89, size: 0.22, opacity: 0.3, delay: -4 },
	{ x: 32, y: 61, size: 0.46, opacity: 0.66, delay: -1 },
	{ x: 34, y: 78, size: 0.3, opacity: 0.38, delay: -9 },
	{ x: 36, y: 68, size: 0.25, opacity: 0.34, delay: -6 },
	{ x: 37, y: 86, size: 0.36, opacity: 0.44, delay: -12 },
	{ x: 39, y: 74, size: 0.28, opacity: 0.36, delay: -2 },
	{ x: 3, y: 95, size: 0.22, opacity: 0.28, delay: -15 },
	{ x: 6, y: 69, size: 0.25, opacity: 0.36, delay: -17 },
	{ x: 10, y: 89, size: 0.2, opacity: 0.28, delay: -16 },
	{ x: 14, y: 64, size: 0.24, opacity: 0.34, delay: -19 },
	{ x: 18, y: 95, size: 0.26, opacity: 0.3, delay: -18 },
	{ x: 21, y: 60, size: 0.22, opacity: 0.32, delay: -21 },
	{ x: 24, y: 81, size: 0.2, opacity: 0.28, delay: -16 },
	{ x: 28, y: 96, size: 0.24, opacity: 0.3, delay: -20 },
	{ x: 31, y: 66, size: 0.21, opacity: 0.28, delay: -17 },
	{ x: 34, y: 92, size: 0.22, opacity: 0.26, delay: -22 },
	{ x: 38, y: 58, size: 0.24, opacity: 0.34, delay: -18 },
];

const meshDots: Dot[] = [
	{ x: 39, y: 67, size: 0.46, opacity: 0.62, delay: -1, className: "mesh-dot secondary" },
	{ x: 42, y: 58, size: 0.58, opacity: 0.82, delay: -3, className: "mesh-dot" },
	{ x: 43.5, y: 72, size: 0.4, opacity: 0.56, delay: -8, className: "mesh-dot secondary" },
	{ x: 46, y: 63, size: 0.5, opacity: 0.74, delay: -5, className: "mesh-dot" },
	{ x: 48, y: 53, size: 0.62, opacity: 0.86, delay: -2, className: "mesh-dot" },
	{ x: 50.5, y: 68, size: 0.42, opacity: 0.6, delay: -11, className: "mesh-dot secondary" },
	{ x: 52, y: 58, size: 0.5, opacity: 0.74, delay: -7, className: "mesh-dot" },
	{ x: 54, y: 48, size: 0.56, opacity: 0.8, delay: -4, className: "mesh-dot" },
	{ x: 55.8, y: 64, size: 0.38, opacity: 0.56, delay: -12, className: "mesh-dot secondary" },
	{ x: 57.2, y: 54, size: 0.48, opacity: 0.7, delay: -9, className: "mesh-dot" },
	{ x: 59, y: 43.5, size: 0.52, opacity: 0.78, delay: -6, className: "mesh-dot" },
	{ x: 60.8, y: 58, size: 0.36, opacity: 0.52, delay: -13, className: "mesh-dot secondary" },
	{ x: 62.5, y: 50, size: 0.42, opacity: 0.64, delay: -10, className: "mesh-dot" },
	{ x: 64.2, y: 39.5, size: 0.46, opacity: 0.7, delay: -14, className: "mesh-dot" },
	{ x: 65.8, y: 53.5, size: 0.34, opacity: 0.48, delay: -15, className: "mesh-dot secondary" },
	{ x: 67.2, y: 45.5, size: 0.42, opacity: 0.62, delay: -5, className: "mesh-dot" },
	{ x: 68.5, y: 36.2, size: 0.46, opacity: 0.72, delay: -16, className: "mesh-dot" },
	{ x: 69.9, y: 48.5, size: 0.32, opacity: 0.46, delay: -7, className: "mesh-dot secondary" },
	{ x: 71, y: 41.2, size: 0.4, opacity: 0.6, delay: -17, className: "mesh-dot" },
	{ x: 72.2, y: 33.8, size: 0.42, opacity: 0.68, delay: -8, className: "mesh-dot" },
	{ x: 73.2, y: 44.3, size: 0.3, opacity: 0.44, delay: -18, className: "mesh-dot secondary" },
	{ x: 74.1, y: 38.2, size: 0.36, opacity: 0.56, delay: -12, className: "mesh-dot" },
	{ x: 75, y: 31.8, size: 0.4, opacity: 0.64, delay: -4, className: "mesh-dot" },
	{ x: 75.8, y: 40.6, size: 0.28, opacity: 0.42, delay: -19, className: "mesh-dot secondary" },
	{ x: 76.6, y: 35.4, size: 0.34, opacity: 0.54, delay: -10, className: "mesh-dot" },
	{ x: 77.3, y: 29.8, size: 0.36, opacity: 0.6, delay: -14, className: "mesh-dot" },
	{ x: 77.9, y: 37.2, size: 0.27, opacity: 0.4, delay: -20, className: "mesh-dot secondary" },
	{ x: 78.5, y: 32.8, size: 0.32, opacity: 0.52, delay: -6, className: "mesh-dot" },
	{ x: 79.1, y: 28.4, size: 0.34, opacity: 0.58, delay: -16, className: "mesh-dot" },
];

const butterflyDots: Dot[] = [
	{ x: 82.4, y: 24.2, size: 0.5, opacity: 0.98, delay: -1, className: "butterfly-body" },
	{ x: 83.1, y: 26.2, size: 0.44, opacity: 0.92, delay: -4, className: "butterfly-body" },
	{ x: 83.8, y: 28.2, size: 0.34, opacity: 0.78, delay: -7, className: "butterfly-body" },
	{ x: 84.4, y: 22.2, size: 0.24, opacity: 0.72, delay: -10, className: "butterfly-antenna" },
	{ x: 86.2, y: 20, size: 0.22, opacity: 0.66, delay: -13, className: "butterfly-antenna" },
	{ x: 75.4, y: 14.6, size: 0.64, opacity: 0.96, delay: -2, className: "wing foreground upper" },
	{ x: 76.8, y: 17.5, size: 0.7, opacity: 1, delay: -5, className: "wing foreground upper" },
	{ x: 77.4, y: 20.8, size: 0.56, opacity: 0.92, delay: -8, className: "wing foreground upper" },
	{ x: 76.6, y: 24, size: 0.48, opacity: 0.86, delay: -11, className: "wing foreground core" },
	{ x: 74.2, y: 21.4, size: 0.36, opacity: 0.72, delay: -14, className: "wing foreground rim" },
	{ x: 72.6, y: 25.8, size: 0.34, opacity: 0.68, delay: -17, className: "wing foreground rim" },
	{ x: 74.4, y: 29.2, size: 0.5, opacity: 0.86, delay: -3, className: "wing foreground lower" },
	{ x: 76.8, y: 31.2, size: 0.58, opacity: 0.9, delay: -6, className: "wing foreground lower" },
	{ x: 79.4, y: 31, size: 0.46, opacity: 0.78, delay: -9, className: "wing foreground lower" },
	{ x: 72.2, y: 33.5, size: 0.32, opacity: 0.58, delay: -12, className: "wing foreground rim" },
	{ x: 69.8, y: 30.4, size: 0.26, opacity: 0.46, delay: -15, className: "wing foreground rim" },
	{ x: 80.2, y: 17, size: 0.46, opacity: 0.58, delay: -18, className: "wing background upper" },
	{ x: 81.8, y: 19.5, size: 0.42, opacity: 0.52, delay: -4, className: "wing background upper" },
	{ x: 81.2, y: 22.2, size: 0.34, opacity: 0.46, delay: -7, className: "wing background core" },
	{ x: 82.2, y: 30.4, size: 0.36, opacity: 0.48, delay: -10, className: "wing background lower" },
	{ x: 80.6, y: 33.4, size: 0.32, opacity: 0.44, delay: -13, className: "wing background lower" },
	{ x: 78.5, y: 34.4, size: 0.28, opacity: 0.38, delay: -16, className: "wing background lower" },
	{ x: 84.9, y: 29.8, size: 0.24, opacity: 0.36, delay: -19, className: "wing background rim" },
];

const caterpillarSegments = [
	{ x: 45.8, y: 52.8, rx: 1.25, ry: 1.65 },
	{ x: 47.5, y: 51.7, rx: 1.45, ry: 1.9 },
	{ x: 49.4, y: 50.8, rx: 1.62, ry: 2.1 },
	{ x: 51.4, y: 50.5, rx: 1.72, ry: 2.16 },
	{ x: 53.4, y: 50.5, rx: 1.72, ry: 2.16 },
	{ x: 55.4, y: 50.8, rx: 1.68, ry: 2.05 },
	{ x: 57.3, y: 51.5, rx: 1.52, ry: 1.86 },
	{ x: 59, y: 52.2, rx: 1.34, ry: 1.62 },
	{ x: 60.6, y: 51.3, rx: 1.26, ry: 1.84 },
	{ x: 62, y: 49.5, rx: 1.12, ry: 2.06 },
	{ x: 63.4, y: 48.2, rx: 0.98, ry: 1.82 },
	{ x: 64.5, y: 48.7, rx: 0.82, ry: 1.42 },
];

function seededUnit(index: number, salt: number) {
	const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
	return value - Math.floor(value);
}

function createSwarmStartPoint(index: number) {
	const angle = seededUnit(index, 10) * Math.PI * 2;
	const radius = Math.sqrt(seededUnit(index, 11));
	const edgeBias = seededUnit(index, 12) > 0.72 ? 1.18 : 1;
	const raggedness = 0.82 + seededUnit(index, 13) * 0.46;
	const spillX = seededUnit(index, 14) > 0.8 ? -5.5 * seededUnit(index, 15) : 0;
	const spillY = seededUnit(index, 16) > 0.76 ? 5.8 * seededUnit(index, 17) : 0;

	return {
		startX: 18 + Math.cos(angle) * 32 * radius * edgeBias * raggedness + spillX,
		startY: 82 + Math.sin(angle) * 24 * radius * edgeBias * raggedness + spillY,
	};
}

function createIntroSwarmDots(): IntroSwarmDot[] {
	return Array.from({ length: INTRO_SWARM_DOT_COUNT }, (_, index) => {
		const angle = index * 2.39996323;
		const bodyCount = 164;
		const legStart = bodyCount;
		const antennaStart = 184;
		const startPoint = createSwarmStartPoint(index);
		let endX = 42;
		let endY = 52;

		if (index >= legStart && index < antennaStart) {
			const legIndex = index - legStart;
			const leg = legIndex % 10;
			const row = Math.floor(legIndex / 10);
			endX = 46.4 + leg * 1.72 + (row - 0.5) * 0.32;
			endY = 53.4 + row * 1.15 + Math.sin(leg * 1.2) * 0.24;
		} else if (index >= antennaStart) {
			const antenna = index - antennaStart;
			const side = antenna % 2 === 0 ? -1 : 1;
			const step = Math.floor(antenna / 2);
			endX = 63.5 + step * 0.5;
			endY = 46.7 - step * 0.72 + side * 0.38;
		} else {
			const segment = caterpillarSegments[index % caterpillarSegments.length];
			const radius = Math.sqrt(seededUnit(index, 2));
			const localAngle = angle + seededUnit(index, 3) * 0.9;
			endX = segment.x + Math.cos(localAngle) * segment.rx * radius;
			endY = segment.y + Math.sin(localAngle) * segment.ry * radius;
		}

		return {
			amplitude: 34 + seededUnit(index, 4) * 66,
			delay: seededUnit(index, 5) * 820 + endX * 9,
			duration: 3000 + seededUnit(index, 6) * 1200,
			endX,
			endY,
			frequency: 0.75 + seededUnit(index, 7) * 2.85,
			index,
			phase: seededUnit(index, 8) * Math.PI * 2,
			radius: 2.65 + seededUnit(index, 9) * 2.1,
			startX: startPoint.startX,
			startY: startPoint.startY,
		};
	});
}

const introSwarmDots = createIntroSwarmDots();
const butterflyTransferDots = butterflyDots.map(
	(_, index) => introSwarmDots[Math.floor(index * (164 / butterflyDots.length))],
);

const meshLineIndexes = [
	[0, 1],
	[2, 3],
	[3, 4],
	[5, 6],
	[6, 7],
	[8, 9],
	[9, 10],
	[10, 12],
	[11, 12],
	[12, 13],
	[13, 15],
	[14, 15],
	[15, 16],
	[16, 18],
	[17, 18],
	[18, 19],
	[19, 21],
	[19, 22],
	[20, 21],
	[20, 23],
	[21, 22],
	[22, 24],
	[23, 24],
	[23, 26],
	[24, 25],
	[25, 27],
	[25, 28],
	[26, 27],
	[26, 28],
	[27, 28],
] as const;

const butterflyLineIndexes = [
	[0, 1], [1, 2], [0, 3], [3, 4],
	[0, 5], [0, 6], [0, 7], [1, 8],
	[5, 6], [6, 7], [7, 8], [8, 9], [8, 10],
	[1, 11], [1, 12], [2, 13], [11, 12], [12, 13],
	[11, 14], [14, 15], [10, 15],
	[0, 16], [0, 17], [17, 18], [16, 17],
	[1, 19], [2, 20], [20, 21], [19, 20], [21, 22],
] as const;

const butterflyDetailLines: Line[] = [
	...polyline([[82.5, 24.2], [79.8, 18.2], [76.5, 13.4], [73.8, 11.6], [72.2, 14.2], [72.4, 18.2], [74.2, 21.4], [76.6, 24], [82.5, 24.2]], "butterfly-line butterfly-detail foreground-line", 0.86),
	...polyline([[82.9, 26.2], [79.2, 29.6], [75.6, 33.4], [71.6, 35.2], [68.4, 32.8], [69.6, 29.2], [72.6, 25.8], [76.6, 24], [82.9, 26.2]], "butterfly-line butterfly-detail foreground-line", 0.8),
	...polyline([[82.2, 24], [80.4, 17.6], [78.4, 14.2], [76.4, 13.8]], "butterfly-line butterfly-detail foreground-line", 0.58),
	...polyline([[82.1, 24.7], [79.2, 20.2], [75.2, 18.2], [72.8, 17.8]], "butterfly-line butterfly-detail foreground-line", 0.56),
	...polyline([[82, 25.4], [78.2, 23], [74.2, 22.6]], "butterfly-line butterfly-detail foreground-line", 0.54),
	...polyline([[82.6, 26.3], [78.5, 28.8], [73.4, 29.6], [69.6, 29.2]], "butterfly-line butterfly-detail foreground-line", 0.56),
	...polyline([[83, 27.3], [79.8, 31.6], [75.6, 33.4]], "butterfly-line butterfly-detail foreground-line", 0.54),
	...polyline([[76.5, 13.4], [76.8, 17.5], [77.4, 20.8], [76.6, 24]], "butterfly-line butterfly-detail foreground-line", 0.48),
	...polyline([[73.8, 11.6], [75.4, 14.6], [76.8, 17.5]], "butterfly-line butterfly-detail foreground-line", 0.46),
	...polyline([[71.6, 35.2], [72.2, 33.5], [74.4, 29.2], [76.6, 24]], "butterfly-line butterfly-detail foreground-line", 0.5),
	...polyline([[68.4, 32.8], [69.8, 30.4], [72.6, 25.8]], "butterfly-line butterfly-detail foreground-line", 0.44),
	...polyline([[82.6, 24.4], [84.2, 22.4], [85.8, 20.8], [87.4, 19.8]], "butterfly-line butterfly-detail antenna-line", 0.62),
	...polyline([[82.8, 24.8], [84.6, 23.7], [86.6, 23.2], [88.2, 23.6]], "butterfly-line butterfly-detail antenna-line", 0.52),
	...polyline([[82.2, 24.6], [83.2, 26.2], [84.1, 28.6], [83, 30.4]], "butterfly-line butterfly-detail body-line", 0.82),
	...polyline([[82.4, 24.2], [81.4, 20.4], [80.2, 17], [78.6, 15.4]], "butterfly-line butterfly-detail background-line", 0.36),
	...polyline([[83, 26.2], [82.2, 30.4], [80.6, 33.4], [78.5, 34.4]], "butterfly-line butterfly-detail background-line", 0.34),
	...polyline([[80.2, 17], [81.8, 19.5], [81.2, 22.2]], "butterfly-line butterfly-detail background-line", 0.32),
];

function polyline(
	points: Array<[number, number]>,
	className: string,
	opacity: number,
): Line[] {
	return points.slice(0, -1).map(([x, y], index) => ({
		x,
		y,
		x2: points[index + 1][0],
		y2: points[index + 1][1],
		className,
		opacity,
		delay: -((index % 11) + 1),
	}));
}

function orbitDot(dot: Dot, index: number, group: DotGroup, time: number): Dot {
	const amplitude = group === "star" ? 0.42 : group === "mesh" ? 0.28 : 0.14;
	const phase = (index * 1.732 + (dot.delay ?? 0)) * 0.74;
	const speed = 0.11 + ((index % 7) * 0.011);
	const wobble = 0.57 + ((index % 5) * 0.08);

	return {
		...dot,
		x: dot.x + Math.cos(time * speed + phase) * amplitude,
		y: dot.y + Math.sin(time * speed * wobble + phase * 1.17) * amplitude * 0.68,
	};
}

function flexFreeLine(line: Line, index: number, time: number): Line {
	const start = orbitDot(line, index, "butterfly", time);
	const end = orbitDot({ x: line.x2, y: line.y2 }, index + 37, "butterfly", time);

	return {
		...line,
		x: start.x,
		y: start.y,
		x2: end.x,
		y2: end.y,
	};
}

function lineBetween(from: Dot, to: Dot): Pick<Line, "x" | "y" | "x2" | "y2"> {
	return {
		x: from.x,
		y: from.y,
		x2: to.x,
		y2: to.y,
	};
}

function portraitPoint(x: number, y: number, group: DotGroup) {
	if (group === "star") {
		return { x: 7 + x * 0.82, y: 69 + (y - 58) * 0.66 };
	}

	if (group === "mesh") {
		return { x: 18 + (x - 39) * 1.24, y: 72 + (y - 67) * 0.88 };
	}

	return { x: 64 + (x - 68.4) * 1.24, y: 11 + (y - 11.6) * 0.94 };
}

function layoutDot(dot: Dot, group: DotGroup, layout: SceneLayout): Dot {
	if (layout === "landscape") {
		return dot;
	}

	return { ...dot, ...portraitPoint(dot.x, dot.y, group) };
}

function layoutLine(line: Line, group: DotGroup, layout: SceneLayout): Line {
	if (layout === "landscape") {
		return line;
	}

	const start = portraitPoint(line.x, line.y, group);
	const end = portraitPoint(line.x2, line.y2, group);
	return { ...line, x: start.x, y: start.y, x2: end.x, y2: end.y };
}

function dotStyle(dot: Dot): CSSProperties {
	return {
		"--x": `${dot.x}%`,
		"--y": `${dot.y}%`,
		"--size": `${dot.size ?? 0.5}rem`,
		"--dot-opacity": dot.opacity ?? 0.7,
		"--delay": `${dot.delay ?? 0}s`,
	} as CSSProperties;
}

function revealOrderStyle(order: number): CSSProperties {
	return {
		"--reveal-order": order,
	} as CSSProperties;
}

function getLeftToRightOrder(dots: Dot[]) {
	return dots
		.map((dot, index) => ({ index, x: dot.x }))
		.sort((first, second) => first.x - second.x)
		.reduce<Record<number, number>>((orders, dot, order) => {
			orders[dot.index] = order;
			return orders;
		}, {});
}

function lineStyle(line: Line, sceneAspect: number): CSSProperties {
	const yScale = sceneAspect;
	const dx = line.x2 - line.x;
	const dy = (line.y2 - line.y) * yScale;

	return {
		"--line-x": `${line.x}%`,
		"--line-y": `${line.y}%`,
		"--line-width": `${Math.hypot(dx, dy)}%`,
		"--line-angle": `${Math.atan2(dy, dx) * (180 / Math.PI)}deg`,
		"--line-opacity": line.opacity ?? 0.5,
		"--delay": `${line.delay ?? 0}s`,
	} as CSSProperties;
}

function useSceneLayout() {
	const [layout, setLayout] = useState<SceneLayout>(() =>
		window.matchMedia("(max-width: 720px), (orientation: portrait)").matches
			? "portrait"
			: "landscape",
	);

	useEffect(() => {
		const media = window.matchMedia("(max-width: 720px), (orientation: portrait)");
		const update = () => setLayout(media.matches ? "portrait" : "landscape");
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);

	return layout;
}

function useSceneAspect(sceneRef: RefObject<HTMLDivElement | null>) {
	const [aspect, setAspect] = useState(9 / 16);

	useLayoutEffect(() => {
		const scene = sceneRef.current;
		if (!scene) return undefined;

		const update = () => {
			const bounds = scene.getBoundingClientRect();
			if (bounds.width > 0) setAspect(bounds.height / bounds.width);
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(scene);
		return () => observer.disconnect();
	}, [sceneRef]);

	return aspect;
}

function getRevealWord(text: string): RevealWord {
	const base = WORDMARK.toLowerCase();
	const word = text.toLowerCase();
	let best = {
		baseStart: 0,
		length: 0,
		wordStart: 0,
	};

	for (let baseStart = 0; baseStart < base.length; baseStart += 1) {
		for (let wordStart = 0; wordStart < word.length; wordStart += 1) {
			let length = 0;

			while (
				base[baseStart + length] &&
				word[wordStart + length] &&
				base[baseStart + length] === word[wordStart + length]
			) {
				length += 1;
			}

			if (length > best.length) {
				best = { baseStart, length, wordStart };
			}
		}
	}

	return { ...best, text };
}

function isMatchedLetter(index: number, revealWord: RevealWord | undefined) {
	if (!revealWord) {
		return false;
	}

	return (
		index >= revealWord.baseStart &&
		index < revealWord.baseStart + revealWord.length
	);
}

function useOverlayOffset(revealWord: RevealWord | undefined) {
	const wordmarkRef = useRef<HTMLHeadingElement>(null);
	const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
	const [offset, setOffset] = useState(0);

	useLayoutEffect(() => {
		if (!revealWord || !wordmarkRef.current) {
			setOffset(0);
			return undefined;
		}

		const updateOffset = () => {
			const wordmark = wordmarkRef.current;
			const anchor = letterRefs.current[revealWord.baseStart];

			if (!wordmark || !anchor) {
				return;
			}

			const styles = window.getComputedStyle(wordmark);
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			const prefix = revealWord.text.slice(0, revealWord.wordStart);
			const wordmarkBounds = wordmark.getBoundingClientRect();
			const anchorBounds = anchor.getBoundingClientRect();

			let prefixWidth = 0;
			if (context) {
				context.font = styles.font;
				prefixWidth = context.measureText(prefix).width;
			}

			setOffset(anchorBounds.left - wordmarkBounds.left - prefixWidth);
		};

		updateOffset();
		window.addEventListener("resize", updateOffset);

		return () => window.removeEventListener("resize", updateOffset);
	}, [revealWord]);

	return { letterRefs, offset, wordmarkRef };
}

function useMotionTime(introPhase: IntroPhase) {
	const [time, setTime] = useState(0);

	useEffect(() => {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		if (reducedMotion.matches || introPhase !== "done") {
			return undefined;
		}

		let animationFrame = 0;
		let previous = 0;

		const animate = (now: number) => {
			if (now - previous > 33) {
				setTime(now / 1000);
				previous = now;
			}

			animationFrame = requestAnimationFrame(animate);
		};

		animationFrame = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animationFrame);
	}, [introPhase]);

	return time;
}

function useIntroPhase() {
	const [introPhase, setIntroPhase] = useState<IntroPhase>("swarm");

	useEffect(() => {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		if (reducedMotion.matches) {
			setIntroPhase("done");
			return undefined;
		}

		const timers: number[] = [];
		let elapsed = 0;

		for (const phase of INTRO_PHASES) {
			elapsed += phase.duration;
			timers.push(window.setTimeout(() => setIntroPhase(phase.phase), elapsed));
		}

		return () => {
			for (const timer of timers) {
				window.clearTimeout(timer);
			}
		};
	}, []);

	return introPhase;
}

function easeInOutCubic(t: number) {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getCurvedSwarmPosition(dot: IntroSwarmDot, progress: number) {
	const easedT = easeInOutCubic(progress);
	const x = dot.startX + (dot.endX - dot.startX) * easedT;
	const y = dot.startY + (dot.endY - dot.startY) * easedT;
	const dx = dot.endX - dot.startX;
	const dy = dot.endY - dot.startY;
	const length = Math.hypot(dx, dy) || 1;
	const perpendicularX = -dy / length;
	const perpendicularY = dx / length;
	const wave = Math.sin(easedT * Math.PI * dot.frequency + dot.phase) * dot.amplitude;
	const taper = Math.sin(easedT * Math.PI);
	const offset = wave * taper;

	return {
		x,
		y,
		offsetX: perpendicularX * offset,
		offsetY: perpendicularY * offset,
	};
}

function getIntroCanvasBounds(phase: IntroPhase, layout: SceneLayout): IntroCanvasBounds {
	const bounds = layout === "portrait" ? PORTRAIT_INTRO_CANVAS_BOUNDS : INTRO_CANVAS_BOUNDS;
	return phase === "reveal" ? bounds.reveal : bounds.swarm;
}

function introLayoutPoint(x: number, y: number, layout: SceneLayout) {
	return layout === "portrait"
		? { x: 20 + (x - 42) * 2.25, y: y - 5.5 }
		: { x, y };
}

function introCanvasBoundsStyle(bounds: IntroCanvasBounds): CSSProperties {
	return {
		"--intro-canvas-height": `${bounds.height}%`,
		"--intro-canvas-left": `${bounds.left}%`,
		"--intro-canvas-top": `${bounds.top}%`,
		"--intro-canvas-width": `${bounds.width}%`,
	} as CSSProperties;
}

function toCanvasPoint(
	x: number,
	y: number,
	width: number,
	height: number,
	bounds: IntroCanvasBounds,
) {
	return {
		x: ((x - bounds.left) / bounds.width) * width,
		y: ((y - bounds.top) / bounds.height) * height,
	};
}

function createChrysalisCanvasPath(
	context: CanvasRenderingContext2D,
	width: number,
	height: number,
	bounds: IntroCanvasBounds,
	layout: SceneLayout,
) {
	const point = (x: number, y: number) => {
		const scenePoint = introLayoutPoint(x, y, layout);
		return toCanvasPoint(scenePoint.x, scenePoint.y, width, height, bounds);
	};
	const start = point(42.5, 54);

	context.beginPath();
	context.moveTo(start.x, start.y);
	const curves: Array<[number, number, number, number, number, number]> = [
		[44.8, 50.3, 49, 46.9, 54.2, 46.9],
		[59, 47, 63, 50.4, 64.8, 54],
		[65.8, 51.6, 66.3, 47.7, 67.6, 46.8],
		[68.4, 49.9, 65.4, 54.4, 63, 55.3],
		[58.6, 57, 53.5, 55.9, 48.7, 56.3],
		[45.3, 56.6, 43.1, 55.5, 42.5, 54],
	];

	for (const [cp1X, cp1Y, cp2X, cp2Y, x, y] of curves) {
		const cp1 = point(cp1X, cp1Y);
		const cp2 = point(cp2X, cp2Y);
		const end = point(x, y);
		context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
	}

	context.closePath();
}

function IntroSwarmCanvas({ introPhase, layout }: { introPhase: IntroPhase; layout: SceneLayout }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const introPhaseRef = useRef(introPhase);
	const layoutRef = useRef(layout);
	const canvasBoundsRef = useRef(getIntroCanvasBounds(introPhase, layout));
	const phaseStartedAtRef = useRef(0);

	useEffect(() => {
		introPhaseRef.current = introPhase;
		layoutRef.current = layout;
		canvasBoundsRef.current = getIntroCanvasBounds(introPhase, layout);
		phaseStartedAtRef.current = performance.now();
	}, [introPhase, layout]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext("2d");

		if (!canvas || !context) {
			return undefined;
		}

		let animationFrame = 0;
		let width = 0;
		let height = 0;
		let pixelRatio = 1;
		let startTime = 0;
		phaseStartedAtRef.current = performance.now();
		const userAgent = window.navigator.userAgent;
		const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
		const isDesktopSafari = isSafari && /Macintosh/i.test(userAgent);

		const resize = () => {
			const bounds = canvas.getBoundingClientRect();
			pixelRatio = Math.min(window.devicePixelRatio || 1, isDesktopSafari ? 1.25 : 2);
			width = bounds.width;
			height = bounds.height;
			canvas.width = Math.floor(width * pixelRatio);
			canvas.height = Math.floor(height * pixelRatio);
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		};

		const drawDot = (
			dot: IntroSwarmDot,
			x: number,
			y: number,
			progress: number,
			hardenProgress: number,
			alphaMultiplier = 1,
		) => {
			const minSide = Math.min(width, height);
			const scale = Math.max(0.78, minSide / 720);
			const radius = dot.radius * scale * (1 + hardenProgress * 1.65);
			const alpha =
				Math.min(1, progress / 0.18) *
				(0.76 + seededUnit(dot.index, 12) * 0.14 + hardenProgress * 0.22) *
				alphaMultiplier;
			const gradient = context.createRadialGradient(
				x - radius * 0.32,
				y - radius * 0.34,
				radius * 0.1,
				x,
				y,
				radius * 2.9,
			);

			gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
			gradient.addColorStop(0.38, `rgba(247, 255, 253, ${(0.84 + hardenProgress * 0.12) * alpha})`);
			gradient.addColorStop(1, `rgba(185, 244, 242, ${(0.1 + hardenProgress * 0.32) * alpha})`);

			context.fillStyle = gradient;
			context.beginPath();
			context.arc(x, y, radius, 0, Math.PI * 2);
			context.fill();
		};

		const drawTransferDot = (
			source: IntroSwarmDot,
			target: Dot,
			index: number,
			revealProgress: number,
		) => {
			const easedT = easeInOutCubic(revealProgress);
			const bounds = canvasBoundsRef.current;
			const sourcePoint = introLayoutPoint(source.endX, source.endY, layoutRef.current);
			const targetPoint = layoutDot(target, "butterfly", layoutRef.current);
			const start = toCanvasPoint(sourcePoint.x, sourcePoint.y, width, height, bounds);
			const end = toCanvasPoint(targetPoint.x, targetPoint.y, width, height, bounds);
			const startX = start.x;
			const startY = start.y;
			const endX = end.x;
			const endY = end.y;
			const dx = endX - startX;
			const dy = endY - startY;
			const length = Math.hypot(dx, dy) || 1;
			const perpendicularX = -dy / length;
			const perpendicularY = dx / length;
			const arc = Math.sin(easedT * Math.PI) * (22 + seededUnit(index, 22) * 34);
			const x = startX + dx * easedT + perpendicularX * arc;
			const y = startY + dy * easedT + perpendicularY * arc;
			const fade = revealProgress < 0.78 ? 1 : Math.max(0, 1 - (revealProgress - 0.78) / 0.22);
			const radius = (2.8 + seededUnit(index, 23) * 2.2) * Math.max(0.78, Math.min(width, height) / 720);
			const gradient = context.createRadialGradient(
				x - radius * 0.28,
				y - radius * 0.28,
				radius * 0.1,
				x,
				y,
				radius * 2.4,
			);

			gradient.addColorStop(0, `rgba(255, 255, 255, ${0.94 * fade})`);
			gradient.addColorStop(0.42, `rgba(196, 255, 249, ${0.82 * fade})`);
			gradient.addColorStop(1, `rgba(118, 238, 230, ${0.14 * fade})`);

			context.fillStyle = gradient;
			context.beginPath();
			context.arc(x, y, radius, 0, Math.PI * 2);
			context.fill();
		};

		const render = (now: number) => {
			if (!startTime) {
				startTime = now;
			}

			context.clearRect(0, 0, width, height);
			context.globalCompositeOperation = "lighter";
			const phase = introPhaseRef.current;
			const canvasBounds = canvasBoundsRef.current;
			const isRevealPhase = phase === "reveal";
			const isChrysalisPhase = phase === "chrysalis";
			const chrysalisProgress = isChrysalisPhase
				? Math.max(0, Math.min((now - phaseStartedAtRef.current) / 1300, 1))
				: isRevealPhase
					? 1
					: 0;
			const revealElapsed = isRevealPhase ? now - phaseStartedAtRef.current : 0;
			const dissolveProgress = isRevealPhase
				? Math.max(0, Math.min(revealElapsed / 850, 1))
				: 0;
			const transferProgress = isRevealPhase
				? Math.max(0, Math.min((revealElapsed - 850) / 2050, 1))
				: 0;

			for (const dot of introSwarmDots) {
				const rawProgress = (now - startTime - dot.delay) / dot.duration;
				const progress = Math.max(0, Math.min(rawProgress, 1));
				if (isChrysalisPhase || isRevealPhase) {
					continue;
				}
				const position =
					progress >= 1
						? { x: dot.endX, y: dot.endY, offsetX: 0, offsetY: 0 }
						: getCurvedSwarmPosition(dot, progress);
				const scenePoint = introLayoutPoint(position.x, position.y, layoutRef.current);
				const point = toCanvasPoint(scenePoint.x, scenePoint.y, width, height, canvasBounds);
				const x = point.x + position.offsetX;
				const y = point.y + position.offsetY;

				if (progress > 0) {
					drawDot(dot, x, y, progress, 0);
				}
			}

			if (chrysalisProgress > 0) {
				context.save();
				createChrysalisCanvasPath(
					context,
					width,
					height,
					canvasBounds,
					layoutRef.current,
				);
				context.clip();

				for (const dot of introSwarmDots) {
					const rawProgress = (now - startTime - dot.delay) / dot.duration;
					const progress = Math.max(0, Math.min(rawProgress, 1));
					const position =
						progress >= 1
							? { x: dot.endX, y: dot.endY, offsetX: 0, offsetY: 0 }
							: getCurvedSwarmPosition(dot, progress);
					const scenePoint = introLayoutPoint(position.x, position.y, layoutRef.current);
					const point = toCanvasPoint(scenePoint.x, scenePoint.y, width, height, canvasBounds);
					const x = point.x + position.offsetX;
					const y = point.y + position.offsetY;

					if (progress > 0) {
						drawDot(dot, x, y, progress, chrysalisProgress, 1 - dissolveProgress);
					}
				}

				context.restore();
			}

			if (isRevealPhase && transferProgress > 0 && transferProgress < 1) {
				for (const [index, source] of butterflyTransferDots.entries()) {
					drawTransferDot(source, butterflyDots[index], index, transferProgress);
				}
			}

			animationFrame = window.requestAnimationFrame(render);
		};

		resize();
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(canvas);
		window.addEventListener("resize", resize);
		animationFrame = window.requestAnimationFrame(render);

		return () => {
			window.cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<canvas
			className="intro-swarm-canvas"
			ref={canvasRef}
			style={introCanvasBoundsStyle(getIntroCanvasBounds(introPhase, layout))}
		/>
	);
}

function IntroCaterpillarDrawing() {
	return (
		<img
			alt=""
			className="intro-caterpillar-drawing"
			aria-hidden="true"
			src={caterpillarLineArt}
		/>
	);
}

function IntroChrysalisDrawing() {
	return (
		<img
			alt=""
			className="intro-chrysalis-drawing"
			aria-hidden="true"
			src={chrysalisLineArt}
		/>
	);
}

function App() {
	const introPhase = useIntroPhase();
	const time = useMotionTime(introPhase);
	const layout = useSceneLayout();
	const sceneRef = useRef<HTMLDivElement>(null);
	const sceneAspect = useSceneAspect(sceneRef);
	const revealWords = useMemo(
		() => REVEAL_WORDS.map((word) => getRevealWord(word)),
		[],
	);
	const starRevealOrders = useMemo(() => getLeftToRightOrder(starDots), []);
	const meshRevealOrders = useMemo(() => getLeftToRightOrder(meshDots), []);
	const butterflyRevealOrders = useMemo(() => getLeftToRightOrder(butterflyDots), []);
	const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
	const [isRevealVisible, setIsRevealVisible] = useState(false);
	const [isSequenceRunning, setIsSequenceRunning] = useState(false);
	const sequenceRunRef = useRef(0);
	const activeReveal =
		activeRevealIndex === null ? undefined : revealWords[activeRevealIndex];
	const { letterRefs, offset, wordmarkRef } = useOverlayOffset(activeReveal);
	const layoutStars = useMemo(
		() => starDots.map((dot) => layoutDot(dot, "star", layout)),
		[layout],
	);
	const layoutMeshDots = useMemo(
		() => meshDots.map((dot) => layoutDot(dot, "mesh", layout)),
		[layout],
	);
	const layoutButterflyDots = useMemo(
		() => butterflyDots.map((dot) => layoutDot(dot, "butterfly", layout)),
		[layout],
	);
	const movingStars = useMemo(
		() => layoutStars.map((dot, index) => orbitDot(dot, index, "star", time)),
		[layoutStars, time],
	);
	const movingMeshDots = useMemo(
		() => layoutMeshDots.map((dot, index) => orbitDot(dot, index, "mesh", time)),
		[layoutMeshDots, time],
	);
	const movingButterflyDots = useMemo(
		() => layoutButterflyDots.map((dot, index) => orbitDot(dot, index, "butterfly", time)),
		[layoutButterflyDots, time],
	);
	const movingMeshLines = useMemo(
		() =>
			meshLineIndexes.map(([from, to], index) => ({
				...lineBetween(movingMeshDots[from], movingMeshDots[to]),
				opacity: index % 3 === 0 ? 0.5 : 0.36,
				delay: -((index % 18) + 1),
				className: "",
			})),
		[movingMeshDots],
	);
	const movingButterflyLines = useMemo(
		() => [
			...butterflyLineIndexes.map(([from, to], index) => ({
				...lineBetween(movingButterflyDots[from], movingButterflyDots[to]),
				opacity: index < 21 ? 0.68 : 0.36,
				delay: -((index % 16) + 1),
				className: `butterfly-line ${index < 21 ? "foreground-line" : "background-line"}`,
			})),
			...butterflyDetailLines.map((line, index) =>
				flexFreeLine(layoutLine(line, "butterfly", layout), index, time),
			),
		],
		[layout, movingButterflyDots, time],
	);
	const startRevealSequence = async () => {
		if (isSequenceRunning) {
			return;
		}

		const runId = sequenceRunRef.current + 1;
		sequenceRunRef.current = runId;
		setIsSequenceRunning(true);
		setIsRevealVisible(false);

		for (let index = 0; index < revealWords.length; index += 1) {
			if (sequenceRunRef.current !== runId) {
				return;
			}

			flushSync(() => {
				setActiveRevealIndex(index);
				setIsRevealVisible(false);
			});
			await nextPaint();
			setIsRevealVisible(true);
			await sleep(REVEAL_FADE_DURATION + REVEAL_HOLD_DURATION);
			setIsRevealVisible(false);
			await sleep(REVEAL_FADE_DURATION);
		}

		if (sequenceRunRef.current === runId) {
			setActiveRevealIndex(null);
			setIsSequenceRunning(false);
		}
	};

	return (
		<main className={`landing phase-${introPhase}`} aria-label="Plexigent introduction">
			<div className="aura aura-one" />
			<div className="aura aura-two" />
			<div className="signal-grid" />
			<div className="scene-safe-area">
			<div className={`scene-stage scene-${layout}`} ref={sceneRef}>
			{introPhase !== "done" ? (
				<div className="intro-theater" aria-hidden="true">
					<div className="intro-swarm">
						<IntroSwarmCanvas introPhase={introPhase} layout={layout} />
					</div>
					<div className="intro-caterpillar">
						<IntroCaterpillarDrawing />
						<IntroChrysalisDrawing />
					</div>
					<div className="intro-butterfly-wire">
						{butterflyDetailLines.map((sourceLine, index) => {
							const line = layoutLine(sourceLine, "butterfly", layout);
							return (
							<span
								key={`intro-butterfly-wire-${index}`}
								className="intro-wire-line"
								style={
									{
										...lineStyle(line, sceneAspect),
										"--line-order": index,
									} as CSSProperties
								}
							/>
							);
						})}
					</div>
				</div>
			) : null}
			<div className="emergence" aria-hidden="true">
				<div className="mesh-lines">
					{movingMeshLines.map((line, index) => (
						<span
							key={`mesh-line-${index}`}
							className={line.className}
							style={{
								...lineStyle(line, sceneAspect),
								...revealOrderStyle(index),
							}}
						/>
					))}
					{movingButterflyLines.map((line, index) => (
						<span
							key={`butterfly-line-${index}`}
							className={line.className}
							style={{
								...lineStyle(line, sceneAspect),
								...revealOrderStyle(index),
							}}
						/>
					))}
				</div>
				<div className="dot-field">
					{movingStars.map((dot, index) => (
						<span
							key={`star-${index}`}
							className={`dot star ${dot.className ?? ""}`}
							style={{
								...dotStyle(dot),
								...revealOrderStyle(starRevealOrders[index]),
							}}
						/>
					))}
					{movingMeshDots.map((dot, index) => (
						<span
							key={`mesh-dot-${index}`}
							className={`dot ${dot.className ?? ""}`}
							style={{
								...dotStyle(dot),
								...revealOrderStyle(meshRevealOrders[index]),
							}}
						/>
					))}
					{movingButterflyDots.map((dot, index) => (
						<span
							key={`butterfly-${index}`}
							className={`dot ${dot.className ?? ""}`}
							style={{
								...dotStyle(dot),
								...revealOrderStyle(butterflyRevealOrders[index]),
							}}
						/>
					))}
				</div>
			</div>
			<div className="wordmark-stage">
				<h1 className="wordmark" ref={wordmarkRef}>
					<span className="wordmark-base" aria-label={WORDMARK}>
						{WORDMARK.split("").map((letter, index) => (
							<span
								key={`${letter}-${index}`}
								ref={(element) => {
									letterRefs.current[index] = element;
								}}
								className={`base-letter ${
									isRevealVisible && isMatchedLetter(index, activeReveal)
										? "matched"
										: ""
								} ${
									isRevealVisible && !isMatchedLetter(index, activeReveal)
										? "dimmed"
										: ""
								}`}
							>
								{letter}
							</span>
						))}
					</span>
					{activeReveal ? (
						<span
							aria-hidden="true"
							className={`wordmark-overlay ${isRevealVisible ? "visible" : ""}`}
							style={
								{
									"--overlay-left": `${offset}px`,
								} as CSSProperties
							}
						>
							{activeReveal.text.split("").map((letter, index) => {
								const isBorrowed =
									index >= activeReveal.wordStart &&
									index < activeReveal.wordStart + activeReveal.length;

								return (
									<span
										key={`${activeReveal.text}-${letter}-${index}`}
										className={isBorrowed ? "borrowed-letter" : ""}
									>
										{letter}
									</span>
								);
							})}
						</span>
					) : null}
				</h1>
				<button
					type="button"
					className={`question-orb ${isSequenceRunning ? "hidden" : ""}`}
					aria-label="Reveal Plexigent word associations"
					onClick={startRevealSequence}
				>
					<span aria-hidden="true">?</span>
				</button>
			</div>
			</div>
			</div>
		</main>
	);
}

export default App;

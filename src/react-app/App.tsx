import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
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

type RevealWord = {
	baseStart: number;
	length: number;
	text: string;
	wordStart: number;
};

const WORDMARK = "Plexigent";
const REVEAL_WORDS = ["ComPlex", "Intelligent", "exigent", "Plexippus"];
const REVEAL_FADE_DURATION = 1000;
const REVEAL_HOLD_DURATION = 1000;

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

function dotStyle(dot: Dot): CSSProperties {
	return {
		"--x": `${dot.x}%`,
		"--y": `${dot.y}%`,
		"--size": `${dot.size ?? 0.5}rem`,
		"--dot-opacity": dot.opacity ?? 0.7,
		"--delay": `${dot.delay ?? 0}s`,
	} as CSSProperties;
}

function lineStyle(line: Line): CSSProperties {
	const yScale = 0.5625;
	const dx = line.x2 - line.x;
	const dy = (line.y2 - line.y) * yScale;

	return {
		"--line-x": `${line.x}%`,
		"--line-y": `${line.y}%`,
		"--line-width": `${Math.hypot(dx, dy)}vw`,
		"--line-angle": `${Math.atan2(dy, dx) * (180 / Math.PI)}deg`,
		"--line-opacity": line.opacity ?? 0.5,
		"--delay": `${line.delay ?? 0}s`,
	} as CSSProperties;
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

function useMotionTime() {
	const [time, setTime] = useState(0);

	useEffect(() => {
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

		if (reducedMotion.matches) {
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
	}, []);

	return time;
}

function App() {
	const time = useMotionTime();
	const revealWords = useMemo(
		() => REVEAL_WORDS.map((word) => getRevealWord(word)),
		[],
	);
	const [activeRevealIndex, setActiveRevealIndex] = useState<number | null>(null);
	const [isRevealVisible, setIsRevealVisible] = useState(false);
	const [isSequenceRunning, setIsSequenceRunning] = useState(false);
	const sequenceRunRef = useRef(0);
	const activeReveal =
		activeRevealIndex === null ? undefined : revealWords[activeRevealIndex];
	const { letterRefs, offset, wordmarkRef } = useOverlayOffset(activeReveal);
	const movingStars = useMemo(
		() => starDots.map((dot, index) => orbitDot(dot, index, "star", time)),
		[time],
	);
	const movingMeshDots = useMemo(
		() => meshDots.map((dot, index) => orbitDot(dot, index, "mesh", time)),
		[time],
	);
	const movingButterflyDots = useMemo(
		() => butterflyDots.map((dot, index) => orbitDot(dot, index, "butterfly", time)),
		[time],
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
			...butterflyDetailLines.map((line, index) => flexFreeLine(line, index, time)),
		],
		[movingButterflyDots, time],
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
		<main className="landing" aria-label="Plexigent introduction">
			<div className="aura aura-one" />
			<div className="aura aura-two" />
			<div className="signal-grid" />
			<div className="emergence" aria-hidden="true">
				<div className="mesh-lines">
					{movingMeshLines.map((line, index) => (
						<span
							key={`mesh-line-${index}`}
							className={line.className}
							style={lineStyle(line)}
						/>
					))}
					{movingButterflyLines.map((line, index) => (
						<span
							key={`butterfly-line-${index}`}
							className={line.className}
							style={lineStyle(line)}
						/>
					))}
				</div>
				<div className="dot-field">
					{movingStars.map((dot, index) => (
						<span
							key={`star-${index}`}
							className={`dot star ${dot.className ?? ""}`}
							style={dotStyle(dot)}
						/>
					))}
					{movingMeshDots.map((dot, index) => (
						<span
							key={`mesh-dot-${index}`}
							className={`dot ${dot.className ?? ""}`}
							style={dotStyle(dot)}
						/>
					))}
					{movingButterflyDots.map((dot, index) => (
						<span
							key={`butterfly-${index}`}
							className={`dot ${dot.className ?? ""}`}
							style={dotStyle(dot)}
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
		</main>
	);
}

export default App;

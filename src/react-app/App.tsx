import type { CSSProperties } from "react";
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
	width: number;
	angle: number;
	opacity?: number;
	delay?: number;
	className?: string;
};

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
	{ x: 41, y: 82, size: 0.2, opacity: 0.25, delay: -23 },
];

const meshDots: Dot[] = [
	{ x: 42, y: 60, size: 0.58, opacity: 0.8, delay: -3, className: "mesh-dot" },
	{ x: 47, y: 51, size: 0.64, opacity: 0.86, delay: -8, className: "mesh-dot" },
	{ x: 52, y: 57, size: 0.44, opacity: 0.62, delay: -5, className: "mesh-dot secondary" },
	{ x: 55, y: 43, size: 0.58, opacity: 0.78, delay: -1, className: "mesh-dot" },
	{ x: 61, y: 36, size: 0.5, opacity: 0.72, delay: -7, className: "mesh-dot" },
	{ x: 66, y: 40, size: 0.36, opacity: 0.52, delay: -10, className: "mesh-dot secondary" },
	{ x: 68, y: 29, size: 0.54, opacity: 0.76, delay: -4, className: "mesh-dot" },
	{ x: 73, y: 25, size: 0.42, opacity: 0.68, delay: -12, className: "mesh-dot" },
];

const butterflyDots: Dot[] = [
	{ x: 79.5, y: 23.2, size: 0.48, opacity: 0.96, delay: -1, className: "butterfly-body" },
	{ x: 80.4, y: 25.3, size: 0.42, opacity: 0.9, delay: -3, className: "butterfly-body" },
	{ x: 81.1, y: 27.2, size: 0.34, opacity: 0.78, delay: -6, className: "butterfly-body" },
	{ x: 82.1, y: 21.8, size: 0.3, opacity: 0.66, delay: -8, className: "butterfly-antenna" },
	{ x: 76.8, y: 18.1, size: 0.82, opacity: 0.98, delay: -2, className: "wing foreground" },
	{ x: 75.3, y: 20.8, size: 0.68, opacity: 0.88, delay: -5, className: "wing foreground" },
	{ x: 74.6, y: 23.9, size: 0.54, opacity: 0.82, delay: -7, className: "wing foreground" },
	{ x: 77.2, y: 26.8, size: 0.62, opacity: 0.9, delay: -9, className: "wing foreground" },
	{ x: 78.6, y: 29.7, size: 0.46, opacity: 0.74, delay: -4, className: "wing foreground" },
	{ x: 72.9, y: 21.7, size: 0.36, opacity: 0.54, delay: -11, className: "wing foreground rim" },
	{ x: 73.6, y: 27.5, size: 0.3, opacity: 0.48, delay: -13, className: "wing foreground rim" },
	{ x: 84.1, y: 19.2, size: 0.54, opacity: 0.56, delay: -3, className: "wing background" },
	{ x: 86.4, y: 21.5, size: 0.42, opacity: 0.46, delay: -6, className: "wing background" },
	{ x: 85.2, y: 25.2, size: 0.46, opacity: 0.5, delay: -8, className: "wing background" },
	{ x: 83.6, y: 28.1, size: 0.38, opacity: 0.42, delay: -10, className: "wing background" },
	{ x: 88, y: 24.1, size: 0.26, opacity: 0.34, delay: -12, className: "wing background rim" },
];

const meshLines: Line[] = [
	{ x: 42, y: 60, width: 10, angle: -52, opacity: 0.64, delay: -1 },
	{ x: 47, y: 51, width: 6.4, angle: 27, opacity: 0.42, delay: -5 },
	{ x: 47, y: 51, width: 10.8, angle: -31, opacity: 0.72, delay: -3 },
	{ x: 52, y: 57, width: 8.6, angle: -58, opacity: 0.42, delay: -8 },
	{ x: 55, y: 43, width: 8.4, angle: -29, opacity: 0.74, delay: -6 },
	{ x: 61, y: 36, width: 6.6, angle: 18, opacity: 0.46, delay: -2 },
	{ x: 61, y: 36, width: 10.6, angle: -39, opacity: 0.62, delay: -9 },
	{ x: 68, y: 29, width: 6.2, angle: -20, opacity: 0.52, delay: -4 },
];

const butterflyLines: Line[] = [
	{ x: 79.8, y: 24.1, width: 6.2, angle: -154, opacity: 0.74, delay: -1, className: "butterfly-line foreground-line" },
	{ x: 79.9, y: 24.8, width: 5.6, angle: -122, opacity: 0.68, delay: -4, className: "butterfly-line foreground-line" },
	{ x: 80.2, y: 25.8, width: 4.8, angle: 154, opacity: 0.66, delay: -7, className: "butterfly-line foreground-line" },
	{ x: 80.4, y: 26.2, width: 4.6, angle: 124, opacity: 0.62, delay: -9, className: "butterfly-line foreground-line" },
	{ x: 76.8, y: 18.1, width: 4.6, angle: 116, opacity: 0.5, delay: -6, className: "butterfly-line foreground-line" },
	{ x: 75.3, y: 20.8, width: 3.8, angle: 74, opacity: 0.46, delay: -11, className: "butterfly-line foreground-line" },
	{ x: 80.2, y: 24.4, width: 4.4, angle: -55, opacity: 0.34, delay: -3, className: "butterfly-line background-line" },
	{ x: 80.7, y: 25.5, width: 5.2, angle: 9, opacity: 0.28, delay: -8, className: "butterfly-line background-line" },
	{ x: 84.1, y: 19.2, width: 4.1, angle: 49, opacity: 0.22, delay: -5, className: "butterfly-line background-line" },
];

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
	return {
		"--line-x": `${line.x}%`,
		"--line-y": `${line.y}%`,
		"--line-width": `${line.width}vw`,
		"--line-angle": `${line.angle}deg`,
		"--line-opacity": line.opacity ?? 0.5,
		"--delay": `${line.delay ?? 0}s`,
	} as CSSProperties;
}

function App() {
	return (
		<main className="landing" aria-label="Plexigent introduction">
			<div className="aura aura-one" />
			<div className="aura aura-two" />
			<div className="signal-grid" />
			<div className="emergence" aria-hidden="true">
				<div className="mesh-lines">
					{meshLines.map((line, index) => (
						<span
							key={`mesh-line-${index}`}
							className={line.className}
							style={lineStyle(line)}
						/>
					))}
					{butterflyLines.map((line, index) => (
						<span
							key={`butterfly-line-${index}`}
							className={line.className}
							style={lineStyle(line)}
						/>
					))}
				</div>
				<div className="dot-field">
					{starDots.map((dot, index) => (
						<span
							key={`star-${index}`}
							className={`dot star ${dot.className ?? ""}`}
							style={dotStyle(dot)}
						/>
					))}
					{meshDots.map((dot, index) => (
						<span
							key={`mesh-dot-${index}`}
							className={`dot ${dot.className ?? ""}`}
							style={dotStyle(dot)}
						/>
					))}
					{butterflyDots.map((dot, index) => (
						<span
							key={`butterfly-${index}`}
							className={`dot ${dot.className ?? ""}`}
							style={dotStyle(dot)}
						/>
					))}
				</div>
			</div>
			<h1>Plexigent</h1>
		</main>
	);
}

export default App;

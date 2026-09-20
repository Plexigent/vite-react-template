type Run = { left: number; right: number };
type InkRow = { y: number; runs: Run[] };
export type AccentBand = { y: number; left: number; right: number };
type Glyph = { bands: AccentBand[]; originX: number; baseline: number };
const SAMPLE_SIZE = 256;
const glyphCache = new Map<string, Glyph>();

// Read the browser's actual glyph, not assumed Arial/SF/Inter proportions.
// The raster is only used for clipping measurements: visible text stays HTML.
export function accentBands(letter: "x" | "i", alpha: ArrayLike<number>, width: number, height: number): AccentBand[] {
	const rows: InkRow[] = [];
	for (let y = 0; y < height; y++) {
		const runs: Run[] = [];
		let left = -1;
		for (let x = 0; x <= width; x++) {
			const ink = x < width && alpha[y * width + x] > 16;
			if (ink && left < 0) left = x;
			if (!ink && left >= 0) { runs.push({ left, right: x }); left = -1; }
		}
		if (runs.length) rows.push({ y, runs });
	}
	if (!rows.length) return [];
	if (letter === "i") {
		const dot: AccentBand[] = [];
		for (const row of rows) {
			if (dot.length && row.y > dot[dot.length - 1].y + 1) break;
			dot.push({ y: row.y, left: row.runs[0].left, right: row.runs[row.runs.length - 1].right });
		}
		return dot;
	}
	const mid = (rows[0].y + rows[rows.length - 1].y) / 2;
	const upperRows = rows.filter(row => row.y < mid && row.runs.length >= 2);
	const upper = upperRows[upperRows.length - 1];
	const lower = rows.find(row => row.y > mid && row.runs.length >= 2);
	if (!upper || !lower) return [];
	const a = upper.runs[upper.runs.length - 1], b = lower.runs[0];
	return rows.map(row => {
		if (row.runs.length >= 2) {
			return { y: row.y, ...(row.y < mid ? row.runs[row.runs.length - 1] : row.runs[0]) };
		}
		// Continue only the rising stroke through the joined centre of the x.
		const t = (row.y - upper.y) / (lower.y - upper.y);
		return { y: row.y, left: Math.max(row.runs[0].left, a.left + (b.left - a.left) * t),
			right: Math.min(row.runs[0].right, a.right + (b.right - a.right) * t) };
	});
}

function sampleGlyph(letter: "x" | "i", style: CSSStyleDeclaration): Glyph | null {
	const font = `${style.fontStyle} ${style.fontWeight} ${SAMPLE_SIZE}px ${style.fontFamily}`;
	const key = `${letter}:${font}`;
	const cached = glyphCache.get(key);
	if (cached) return cached;
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) return null;
	context.font = font;
	const metrics = context.measureText(letter);
	const originX = 8 + Math.ceil(Math.max(0, metrics.actualBoundingBoxLeft));
	const baseline = 8 + Math.ceil(metrics.actualBoundingBoxAscent);
	canvas.width = Math.ceil(originX + Math.max(metrics.width, metrics.actualBoundingBoxRight) + 8);
	canvas.height = Math.ceil(baseline + Math.max(0, metrics.actualBoundingBoxDescent) + 8);
	context.font = font;
	context.fillText(letter, originX, baseline);
	const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
	const alpha = new Uint8Array(canvas.width * canvas.height);
	for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
	const glyph = { bands: accentBands(letter, alpha, canvas.width, canvas.height), originX, baseline };
	if (!glyph.bands.length) return null;
	glyphCache.set(key, glyph);
	return glyph;
}

export function clearAccentCache() { glyphCache.clear(); }

export function measureAccent(letter: "x" | "i", element: HTMLElement, baseline: number) {
	const style = getComputedStyle(element);
	const glyph = sampleGlyph(letter, style);
	if (!glyph) return null;
	const bounds = element.getBoundingClientRect();
	if (!bounds.width || !bounds.height) return null;
	const scale = parseFloat(style.fontSize) / SAMPLE_SIZE;
	const x = (value: number) => (value - glyph.originX) * scale;
	const y = (value: number) => baseline + (value - glyph.baseline) * scale;
	if (letter === "i") {
		const cutoff = y(glyph.bands[glyph.bands.length - 1].y + 2);
		const center = (Math.min(...glyph.bands.map(row => row.left)) + Math.max(...glyph.bands.map(row => row.right))) / 2;
		return { clip: `inset(0 0 ${((1 - cutoff / bounds.height) * 100).toFixed(3)}% 0)`, center: x(center) };
	}
	const bands = glyph.bands.filter((_, index, all) => index % 2 === 0 || index === all.length - 1);
	const point = (xx: number, yy: number) => `${(x(xx) / bounds.width * 100).toFixed(3)}% ${(y(yy) / bounds.height * 100).toFixed(3)}%`;
	const clip = [...bands.map(row => point(row.left - 1, row.y)),
		...bands.slice().reverse().map(row => point(row.right + 1, row.y + 1))];
	return { clip: `polygon(${clip.join(",")})`, center: bounds.width / 2 };
}

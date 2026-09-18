import { butterflyDots, type Point } from "./sceneGeometry.ts";
import { scenePoint, type SceneSize } from "./sceneModel.ts";

export type ButterflyPart = "background" | "foreground" | "body";
export const BUTTERFLY_PARTS: ButterflyPart[] = ["background", "foreground", "body"];
// Both wings hinge on the slanted body axis, not the rectangular canvas edge.
export const WINGBEAT = { duration: 6200, delay: 1200, foreground: 25, background: -32 } as const;
const axisX = (butterflyDots[1].x - butterflyDots[0].x) * 16;
const axisY = (butterflyDots[1].y - butterflyDots[0].y) * 9;
const axisLength = Math.hypot(axisX, axisY);
export const wingAxis = { x: axisX / axisLength, y: axisY / axisLength };

export function butterflyPart(className = ""): ButterflyPart {
	return className.includes("background") ? "background" : className.includes("foreground") ? "foreground" : "body";
}

export function butterflyHinge(scene: SceneSize) { return scenePoint(butterflyDots[0], "butterfly", scene); }

// Orthographic projection matches CSS rotate3d with no perspective distortion.
// Used to verify every point, shared hinge and extreme wing pose without a browser.
export function wingProjection(point: Point, degrees: number, scene: SceneSize): Point {
	const hinge = butterflyHinge(scene);
	const dx = point.x - hinge.x, dy = point.y - hinge.y;
	const along = dx * wingAxis.x + dy * wingAxis.y;
	const across = (-dx * wingAxis.y + dy * wingAxis.x) * Math.cos(degrees * Math.PI / 180);
	return { x: hinge.x + along * wingAxis.x - across * wingAxis.y,
		y: hinge.y + along * wingAxis.y + across * wingAxis.x };
}

export type Dot = {
    x: number;
    y: number;
    r: number;
    alpha: number;
};
// Coordinates and connectivity are unchanged from the approved study.
export function domainPoints(mode: number): Dot[] {
    return Array.from({ length: 86 }, (_, i) => {
        const t = i / 85, a = i * 2.3999632297;
        let x: number, y: number;
        if (mode === 1) {
            const r = .06 + .31 * Math.sqrt(t);
            x = .5 + Math.cos(a) * r;
            y = .49 + Math.sin(a) * r * .92;
        }
        else if (mode === 2) {
            const col = i % 12, row = Math.floor(i / 12);
            x = .2 + col * .054;
            y = .27 + row * .071 + Math.sin(col * .45) * .035;
        }
        else if (mode === 3) {
            const ring = i < 60, angle = (ring ? i / 60 : (i - 60) / 26) * Math.PI * 2;
            const rad = ring ? .32 : .19;
            x = .5 + Math.cos(angle) * rad;
            y = .48 + Math.sin(angle) * rad * .8;
        }
        else if (mode === 4) {
            const lane = i % 4, u = Math.floor(i / 4) / 21;
            x = .15 + u * .7;
            y = .25 + lane * .15 + (u < .55 ? Math.sin(u * Math.PI * 2 + lane * .8) * .06 : 0);
        }
        else {
            x = .16 + t * .68;
            y = .75 - .5 * t + Math.sin(t * Math.PI * 3) * .045;
        }
        return { x, y, r: i % 17 === 0 ? 2.1 : 1.15, alpha: i % 7 === 0 ? .85 : .32 };
    });
}
export function interpolatePoints(from: Dot[], to: Dot[], progress: number) {
    const e = 1 - (1 - Math.min(1, Math.max(0, progress))) ** 3;
    return to.map((q, i) => ({ ...q, x: from[i].x + (q.x - from[i].x) * e, y: from[i].y + (q.y - from[i].y) * e }));
}
export function drawDomain(ctx: CanvasRenderingContext2D, ps: Dot[], w: number, h: number) {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = .65;
    ps.forEach((p, i) => {
        if (i + 1 < ps.length) {
            const q = ps[i + 1], d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < .12) {
                ctx.strokeStyle = 'rgba(76,226,242,.13)';
                ctx.beginPath();
                ctx.moveTo(p.x * w, p.y * h);
                ctx.lineTo(q.x * w, q.y * h);
                ctx.stroke();
            }
        }
        ctx.fillStyle = 'rgba(76,226,242,' + p.alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
    });
}

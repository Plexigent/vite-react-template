// Faithful port of the frozen study's drawing expressions. See checks/RESULTS.md.
import original from './geometry.json' with { type: 'json' };
export type Point = {
    x: number;
    y: number;
};
type Specimen = 'caterpillar' | 'chrysalis';
export type SpecimenImages = Partial<Record<Specimen, HTMLImageElement>>;
export const OPENING_DURATION = 14.6;
export function createOpeningRenderer(c: CanvasRenderingContext2D, images: SpecimenImages) {
    let width = 0, height = 300;
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const smooth = (v: number) => { v = clamp(v); return v * v * v * (v * (v * 6 - 15) + 10); };
    const mix = (a: number, b: number, p: number) => a + (b - a) * p;
    const rand = (i: number, k = 1) => { const q = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return q - Math.floor(q); };
    const ease = (t: number, a: number, b: number) => smooth((t - a) / (b - a));
    const total = 14.6;
    const cat = original.caterpillar.points, pupa = original.chrysalis.points;
    const selected = original.sourceIndices.slice();
    const used = new Set(selected);
    while (selected.length < original.butterfly.length + original.mesh.length + original.stars.length) {
        let best = -1, score = -1;
        pupa.forEach((p, i) => { if (used.has(i))
            return; let d = Infinity; selected.forEach(j => { d = Math.min(d, (p[0] - pupa[j][0]) ** 2 + ((p[1] - pupa[j][1]) * .284) ** 2); }); if (d > score) {
            score = d;
            best = i;
        } });
        used.add(best);
        selected.push(best);
    }
    const selectIndex = new Map(selected.map((i, j) => [i, j]));
    const neighbors = pupa.map(p => selected.reduce((a, b) => Math.hypot(p[0] - pupa[b][0], (p[1] - pupa[b][1]) * .284) < Math.hypot(p[0] - pupa[a][0], (p[1] - pupa[a][1]) * .284) ? b : a, selected[0]));
    function box(kind: Specimen, t: number) { const art = original[kind], bw = Math.min(width * .84, 490), bh = bw * art.height / art.width; const walk = kind === 'caterpillar' ? Math.sin(clamp((t - 3.4) / 3) * Math.PI) * 7 : 0; return { x: (width - bw) / 2 + walk, y: 145 - bh / 2, w: bw, h: bh }; }
    function specimen(kind: Specimen, i: number, t: number) { const b = box(kind, t), p = original[kind].points[i]; return { x: b.x + p[0] * b.w, y: b.y + p[1] * b.h }; }
    function wingPosition(p: Point, t: number, cls = '') {
        const s = Math.min(.78, width * .49 / 316.8), cx = width * .57, cy = 127;
        let x = (p.x - 78.3) * 16, y = (p.y - 23.4) * 9;
        if (cls.includes('wing') || cls.includes('foreground') || cls.includes('background')) {
            const hx = (82.5 - 78.3) * 16, hy = (25.4 - 23.4) * 9, ax = .528, ay = .849;
            const dx = x - hx, dy = y - hy, along = dx * ax + dy * ay, across = -dx * ay + dy * ax;
            let opening = .18 + .82 * ease(t, 11.1, 13.45);
            if (t > 13.45 && t < 14.55)
                opening *= 1 - .18 * Math.sin((t - 13.45) / 1.1 * Math.PI);
            x = hx + along * ax - across * ay * opening;
            y = hy + along * ay + across * ax * opening;
        }
        return { x: cx + x * s, y: cy + y * s };
    }
    function destinations(t: number) {
        const b = original.butterfly.map(p => wingPosition(p, t, p.className));
        const anchor = wingPosition({ x: 74.4, y: 29.2 }, total, 'foreground');
        const m = original.mesh.map(p => ({ x: mix(width * .16, anchor.x, (p.x - 39) / 40.1), y: mix(235, anchor.y, (72 - p.y) / 44) }));
        const st = original.stars.map(p => ({ x: width * (.06 + p.x * .009), y: 206 + (p.y - 58) * 1.55 }));
        return [...b, ...m, ...st];
    }
    function dot(p: Point, r: number, a: number, bright = false) {
        if (a < .008 || !Number.isFinite(p.x))
            return;
        c.globalAlpha = clamp(a);
        c.fillStyle = bright ? '#e0fcff' : '#8ee8ed';
        if (bright) {
            const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
            g.addColorStop(0, 'rgba(76,226,242,.27)');
            g.addColorStop(1, 'rgba(76,226,242,0)');
            c.fillStyle = g;
            c.beginPath();
            c.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#e0fcff';
        }
        c.beginPath();
        c.arc(p.x, p.y, r, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;
    }
    function line(a: Point, b: Point, alpha: number) { if (alpha < .005)
        return; c.globalAlpha = alpha; c.strokeStyle = '#80dbe5'; c.lineWidth = .8; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.globalAlpha = 1; }
    function outline(kind: Specimen, t: number, alpha: number) { const img = images[kind]; if (!img || !img.complete || !img.naturalWidth || alpha < .003)
        return; const b = box(kind, t); c.globalAlpha = alpha; c.drawImage(img, b.x, b.y, b.w, b.h); c.globalAlpha = 1; }
    function frameAt(t: number) {
        if (!width)
            return;
        c.clearRect(0, 0, width, height);
        const morph = ease(t, 6.35, 8.2), condense = ease(t, 8.4, 10.7), dest = destinations(t), live: Point[] = [];
        const shell = (1 - morph) * ease(t, 2.4, 3.4);
        outline('caterpillar', t, shell * .42);
        outline('chrysalis', t, morph * (1 - ease(t, 10.65, 11.8)) * .36);
        cat.forEach((p, i) => {
            const seed = { x: width * (.08 + rand(i, 2) * .84), y: 45 + rand(i, 4) * 215 };
            const cp = specimen('caterpillar', i, t), ch = specimen('chrysalis', i, t);
            const gather = ease(t, .8 + rand(i, 3) * .7, 3.3 + rand(i, 8) * .45);
            let x = mix(seed.x + Math.sin(t * .7 + i) * 2, cp.x, gather), y = mix(seed.y + Math.cos(t * .6 + i) * 2, cp.y, gather) - Math.sin(gather * Math.PI) * 14;
            if (t > 3.4 && t < 6.35)
                y += Math.sin(t * 2.4 - i * .22) * 1.1;
            x = mix(x, ch.x, morph);
            y = mix(y, ch.y, morph);
            let alpha = .75, rad = .85 + Math.min(1.5, p[2] * 22);
            const idx = selectIndex.get(i);
            if (idx === undefined) {
                const q = specimen('chrysalis', neighbors[i], t), angle = rand(i, 9) * Math.PI * 2 + condense * Math.PI * 2;
                const orbit = 3 + rand(i, 5) * 7, shrink = ease(t, 9, 10.9);
                x = mix(x, q.x + Math.cos(angle) * orbit * (1 - shrink), condense);
                y = mix(y, q.y + Math.sin(angle) * orbit * (1 - shrink), condense);
                alpha *= 1 - ease(t, 9.65, 10.95);
            }
            else {
                if (t < 10.85) {
                    x += Math.sin(t * 2 + idx) * condense * 1.2;
                    y += Math.cos(t * 1.7 + idx) * condense * 1.2;
                }
                const fly = ease(t, 10.85 + (idx % 9) * .025, 13.25 + (idx % 7) * .035), target = dest[idx];
                const bend = Math.sin(fly * Math.PI) * (idx < 23 ? 20 : 10);
                x = mix(x, target.x, fly) + bend * (rand(idx, 7) - .5);
                y = mix(y, target.y, fly) - bend;
                const endRadius = idx < 23 ? Math.max(1.15, original.butterfly[idx].size * 4) : idx < 52 ? 1.05 : .8;
                const endAlpha = idx < 23 ? original.butterfly[idx].opacity : idx < 52 ? .46 : .24;
                rad = mix(rad, endRadius, fly);
                alpha = mix(alpha, endAlpha, fly);
                live[idx] = { x, y };
            }
            dot({ x, y }, rad, alpha, idx !== undefined && idx < 23 && t > 10.85);
        });
        // Discrete signals enter the raised head, then travel into the body.
        if (t < 6.5) {
            const b = box('caterpillar', t), mouth = { x: b.x + b.w * .88, y: b.y + b.h * .39 };
            for (let i = 0; i < 56; i++) {
                const begin = 2.65 + i * .053, finish = begin + .95 + rand(i, 14) * .3, travel = ease(t, begin, finish);
                if (travel >= 1)
                    continue;
                const sx = width * (.63 + rand(i, 11) * .32), sy = 48 + rand(i, 12) * 210;
                const p = { x: mix(sx, mouth.x, travel), y: mix(sy, mouth.y, travel) + Math.sin(travel * Math.PI) * (rand(i, 15) - .5) * 28 };
                dot(p, .8 + rand(i, 13) * .8, (1 - ease(t, finish - .15, finish)) * .65, travel > .5);
            }
            if (t > 3.4) {
                const wave = clamp((t - 3.4) / 2.9);
                for (let k = 0; k < 9; k++) {
                    const u = (wave * 2.2 + k / 9) % 1;
                    const sample = Math.floor((.82 - u * .65) * (cat.length - 1));
                    const p = specimen('caterpillar', sample, t);
                    dot(p, 1.7, Math.sin(u * Math.PI) * .35, true);
                }
            }
        }
        const links = ease(t, 12.2, 13.7);
        original.edges.forEach(([a, b]) => { if (live[a] && live[b])
            line(live[a], live[b], links * .52); });
        original.details.forEach(d => line(wingPosition(d, t, d.className), wingPosition({ x: d.x2, y: d.y2 }, t, d.className), ease(t, 12.8, 14.1) * (d.opacity || .5) * .9));
        original.meshEdges.forEach(([a, b]) => { if (live[a + 23] && live[b + 23])
            line(live[a + 23], live[b + 23], links * .18); });
        if (live[51] && live[11])
            line(live[51], live[11], links * .24);
        // A brief concentration of light resolves with the butterfly; no repeating effect.
        if (t > 12.9 && t < 14.1) {
            const p = wingPosition({ x: 82.5, y: 25.4 }, t);
            dot(p, 2.3, Math.sin((t - 12.9) / 1.2 * Math.PI) * .55, true);
        }
    }
    return {
        draw: frameAt,
        resize(w: number, h: number, dpr: number) {
            width = w;
            height = h;
            c.canvas.width = Math.round(w * dpr);
            c.canvas.height = Math.round(h * dpr);
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
        },
    };
}

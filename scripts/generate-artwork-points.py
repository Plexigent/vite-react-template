"""Generate normalized particle destinations from the committed artwork.

Requires Pillow and NumPy only; no image processing occurs in the browser.
Prints JSON to stdout. Original images are never modified.
"""
from collections import deque
import hashlib
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
COUNT = 192


def shape(name):
    source = ROOT / "src/react-app/assets" / f"{name}-line-art.png"
    image = Image.open(source).convert("RGBA")
    width = 512
    height = round(width * image.height / image.width)
    alpha = image.getchannel("A").resize((width, height), Image.Resampling.LANCZOS)
    # Close tiny breaks in the line drawing, then fill the enclosed body.
    ink = alpha.point(lambda value: 255 if value > 48 else 0)
    barrier = np.asarray(ink.filter(ImageFilter.MaxFilter(5))) > 0
    outside = np.zeros_like(barrier)
    queue = deque([(0, 0)])
    outside[0, 0] = True
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and not barrier[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                queue.append((nx, ny))
    filled = Image.fromarray((~outside).astype("uint8") * 255).filter(ImageFilter.MinFilter(5))
    mask = np.asarray(filled) > 0
    # Conservative inset distance (Chebyshev metric) protects the complete dot core.
    distance = np.zeros((height, width), dtype=float)
    eroded = filled
    for _ in range(100):
        active = np.asarray(eroded) > 0
        if not active.any():
            break
        distance += active
        eroded = eroded.filter(ImageFilter.MinFilter(3))
    ys, xs = np.where(distance >= 4)
    candidates = np.column_stack((xs, ys)).astype(float)
    # Seeded farthest-point sampling gives repeatable, evenly distributed filling.
    rng = np.random.default_rng(73)
    candidates = candidates[rng.permutation(len(candidates))[:16000]]
    chosen = []
    nearest = np.full(len(candidates), np.inf)
    index = int(np.argmin(np.sum((candidates - candidates.mean(axis=0)) ** 2, axis=1)))
    for _ in range(COUNT):
        point = candidates[index]
        chosen.append(point)
        nearest = np.minimum(nearest, np.sum((candidates - point) ** 2, axis=1))
        index = int(np.argmax(nearest))
    chosen.sort(key=lambda point: (point[0], point[1]))
    points = [[round(float(x / width), 6), round(float(y / height), 6),
               round(float(distance[int(y), int(x)] / width), 6)] for x, y in chosen]
    # Row spans allow deterministic containment checks without re-reading the PNG.
    spans = []
    for y, row in enumerate(mask):
        transitions = np.diff(np.pad(row.astype(int), (1, 1)))
        for start, end in zip(np.where(transitions == 1)[0], np.where(transitions == -1)[0]):
            spans.append([y, int(start), int(end)])
    return {"width": image.width, "height": image.height,
            "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "maskWidth": width, "maskHeight": height, "spans": spans, "points": points}


def match_particles(first, second):
    """Minimum-cost assignment, computed once rather than during animation."""
    count = len(first)
    costs = [[(a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 * .12 for b in second] for a in first]
    u, v, p, way = ([0] * (count + 1) for _ in range(4))
    for i in range(1, count + 1):
        p[0] = i
        j0 = 0
        minimum, used = [float("inf")] * (count + 1), [False] * (count + 1)
        while True:
            used[j0] = True
            i0, delta, j1 = p[j0], float("inf"), 0
            for j in range(1, count + 1):
                if not used[j]:
                    cost = costs[i0 - 1][j - 1] - u[i0] - v[j]
                    if cost < minimum[j]:
                        minimum[j], way[j] = cost, j0
                    if minimum[j] < delta:
                        delta, j1 = minimum[j], j
            for j in range(count + 1):
                if used[j]:
                    u[p[j]] += delta
                    v[j] -= delta
                else:
                    minimum[j] -= delta
            j0 = j1
            if p[j0] == 0:
                break
        while j0:
            j1 = way[j0]
            p[j0] = p[j1]
            j0 = j1
    result = [None] * count
    for j in range(1, count + 1):
        result[p[j] - 1] = second[j - 1]
    return result


if __name__ == "__main__":
    shapes = {name: shape(name) for name in ("caterpillar", "chrysalis")}
    shapes["chrysalis"]["points"] = match_particles(shapes["caterpillar"]["points"], shapes["chrysalis"]["points"])
    if "--check" in sys.argv:
        committed = (ROOT / "src/react-app/artworkPoints.ts").read_text()
        arrays = re.findall(r"points:\s*(\[[\s\S]*?\n\t\t\])", committed)
        assert len(arrays) == 2
        for array, (name, data) in zip(arrays, shapes.items()):
            points = json.loads(re.sub(r",\s*]", "]", array))
            assert points == data["points"], f"{name}: regenerate destinations after changing artwork"
            assert data["sha256"] in committed
            print(f"{name}: 192 destinations match the filled artwork mask and minimum-cost pairing")
    else:
        print(json.dumps(shapes, separators=(",", ":")))

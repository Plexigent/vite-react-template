#!/usr/bin/env python3
"""Generate deterministic reference keyframes without changing approved source."""
import json
from reference_tools import ROOT, FRAGMENT, wrap


def main() -> None:
    source = FRAGMENT.read_text(encoding="utf-8")
    contract = json.loads((ROOT / "contract.json").read_text())
    output = ROOT / "_qa"
    output.mkdir(exist_ok=True)
    root_id = 'id="plexigent-emergence-study"'
    if source.count(root_id) != 1:
        raise SystemExit("Expected one study root; refusing to generate ambiguous fixtures.")
    (output / "live.html").write_text(wrap(source), encoding="utf-8")
    panels = []
    for frame in contract["opening"]["qa_keyframes"]:
        name, at = frame["name"], frame["seconds"]
        frozen = source.replace(root_id, root_id + f' data-preview-time="{at}"', 1)
        (output / f"{name}.html").write_text(wrap(frozen), encoding="utf-8")
        panels.append(
            f'<section><h2>{name} · {at}s</h2>'
            f'<iframe title="{name}" src="{name}.html" width="390" height="650"></iframe></section>'
        )
    gallery = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<title>Plexigent reference QA</title><style>'
        'body{margin:20px;background:#181b20;color:#e8edf0;font:14px Arial,sans-serif}'
        'main{display:flex;flex-wrap:wrap;gap:20px}section{max-width:100%}'
        'iframe{border:0;max-width:100%}h2{font-size:15px;font-weight:400}'
        'a{color:#4ce2f2}</style></head><body>'
        '<p>QA-only fixtures. <a href="live.html">Play the full reference</a>.</p><main>'
        + ''.join(panels) + '</main></body></html>'
    )
    (output / "index.html").write_text(gallery, encoding="utf-8")
    print(f"Generated {len(panels)} frozen keyframes plus live reference in {output}")
    print("Run python3 tools/preview.py --qa; keep these QA pages out of production.")


if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""Verify transferred files, exact reference embedding, and extracted assets."""
import base64
import hashlib
import json
import re
import sys
from reference_tools import ROOT, FRAGMENT, wrap


def main() -> int:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    failures = []
    for entry in manifest["files"]:
        path = ROOT / entry["path"]
        if not path.is_file():
            failures.append("Missing: " + entry["path"])
            continue
        data = path.read_bytes()
        if len(data) != entry["size_bytes"]:
            failures.append("Size mismatch: " + entry["path"])
        if hashlib.sha256(data).hexdigest() != entry["sha256"]:
            failures.append("SHA-256 mismatch: " + entry["path"])
    fragment = FRAGMENT.read_text(encoding="utf-8")
    if (ROOT / "reference/index.html").read_text(encoding="utf-8") != wrap(fragment):
        failures.append("Standalone reference is not the expected exact wrapper.")
    images_match = re.search(r"const imageSources=(\{[^\n]+\});", fragment)
    geometry_match = re.search(r"const original=(\{[^\n]+\});", fragment)
    if not images_match or not geometry_match:
        failures.append("Reference asset declarations could not be found.")
    else:
        for name, uri in json.loads(images_match.group(1)).items():
            embedded = base64.b64decode(uri.split(",", 1)[1], validate=True)
            if embedded != (ROOT / "assets" / f"{name}-line-art.png").read_bytes():
                failures.append("Embedded artwork mismatch: " + name)
        extracted = json.loads((ROOT / "assets/original-geometry.json").read_text())
        if json.loads(geometry_match.group(1)) != extracted:
            failures.append("Extracted geometry differs from the reference.")
    contract = json.loads((ROOT / "contract.json").read_text())
    actual_hash = hashlib.sha256(FRAGMENT.read_bytes()).hexdigest()
    if actual_hash != contract["reference"]["sha256"]:
        failures.append("Reference differs from the contract's approved SHA-256.")
    if failures:
        print("Verification FAILED:\n" + "\n".join(failures), file=sys.stderr)
        return 1
    print(f"Verified {len(manifest['files'])} files, exact reference wrapper, artwork, and geometry.")
    print("Approved reference SHA-256: " + actual_hash)
    print("Integrity verification is not browser/device acceptance testing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


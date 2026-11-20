#!/usr/bin/env python3
"""Serve the reference or generated QA pages locally; no dependencies."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from reference_tools import ROOT


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765, help="Use 0 for a free ephemeral port")
    parser.add_argument("--qa", action="store_true", help="Serve pages created by make_qa.py")
    args = parser.parse_args()
    directory = ROOT / ("_qa" if args.qa else "reference")
    if not (directory / "index.html").exists():
        parser.error("QA pages are missing; run python3 tools/make_qa.py first.")
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Open http://127.0.0.1:{server.server_port}/", flush=True)
        print("Ctrl-C stops the preview. This local address is for this computer only.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()


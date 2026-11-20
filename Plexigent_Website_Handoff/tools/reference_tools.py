"""Standard-library helpers for the preserved Plexigent reference."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRAGMENT = ROOT / "reference" / "approved-study.fragment.html"


def wrap(fragment: str, title: str = "Plexigent — approved reference") -> str:
    return (
        '<!doctype html>\n<html lang="en"><head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f'<title>{title}</title>\n'
        '<style>body{margin:0;background:#070b10}.cursor-interaction{cursor:pointer}</style>\n'
        '</head><body>\n' + fragment + '\n</body></html>\n'
    )


"""Export Drose favicon PNG/ICO assets from drose-favicon.svg."""

from __future__ import annotations

from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SVG_PATH = ROOT / "tools/static/tools/images/drose-favicon.svg"
OUT_DIR = ROOT / "tools/static/tools/images"
ICO_SIZES = (16, 32, 48, 64, 128, 192, 256)


def _export_png(svg_data: str, out_path: Path, size: int) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    html = f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body {{
      margin: 0;
      width: {size}px;
      height: {size}px;
      background: transparent;
      overflow: hidden;
    }}
    svg {{
      display: block;
      width: {size}px;
      height: {size}px;
    }}
  </style>
</head>
<body>
{svg_data}
</body>
</html>
"""

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(
            viewport={"width": size, "height": size, "device_scale_factor": 1}
        )
        page.set_content(html, wait_until="networkidle")
        page.locator("svg").screenshot(path=str(out_path), omit_background=True)
        browser.close()

    print(f"Wrote {out_path} ({size}x{size})")


def _export_ico(source_png: Path, out_path: Path) -> None:
    master = Image.open(source_png).convert("RGBA")
    master.save(
        out_path,
        format="ICO",
        sizes=[(size, size) for size in ICO_SIZES],
    )
    print(f"Wrote {out_path} ({', '.join(f'{s}x{s}' for s in ICO_SIZES)})")


def main() -> None:
    svg_data = SVG_PATH.read_text(encoding="utf-8")
    png_192 = OUT_DIR / "drose-favicon-192.png"
    png_96 = OUT_DIR / "drose-favicon-96.png"
    ico_path = OUT_DIR / "drose-favicon.ico"

    _export_png(svg_data, png_192, 192)
    _export_png(svg_data, png_96, 96)
    _export_ico(png_192, ico_path)


if __name__ == "__main__":
    main()

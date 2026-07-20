"""Export Drose logo PNG assets from SVG sources."""

from __future__ import annotations

import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HERO_SVG = ROOT / "tools/templates/tools/includes/drose_logo_hero.svg"
EMAIL_SVG = ROOT / "tools/static/tools/images/drose-logo.svg"
EMAIL_DARK_SVG = ROOT / "tools/static/tools/images/drose-logo-dark.svg"
OUT_DIR = ROOT / "tools/static/tools/images"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _hero_rest_svg(mode: str) -> str:
    svg = _read(HERO_SVG)
    svg = re.sub(
        r'<g class="drose-lens-focused">.*?</g>\s*</g>\s*</svg>',
        "</g>\n</svg>",
        svg,
        count=1,
        flags=re.DOTALL,
    )

    if mode == "light":
        svg = svg.replace(
            'class="drose-hex-fill" fill-rule="evenodd"',
            'class="drose-hex-fill" fill="#b45309" fill-rule="evenodd"',
        )
        svg = svg.replace(
            'class="drose-hex-sky" d=',
            'class="drose-hex-sky" fill="url(#droseHeroSkyFillLight)" d=',
        )
        svg = svg.replace(
            'class="drose-hex-sky-glow" d=',
            'class="drose-hex-sky-glow" fill="url(#droseHeroSkyGlowLight)" d=',
        )
        svg = svg.replace(
            'class="drose-star"',
            'class="drose-star" opacity="0.96" stroke="#7eb8f0" stroke-width="0.45" paint-order="stroke fill"',
        )
    elif mode == "dark":
        svg = svg.replace(
            'class="drose-hex-fill" fill-rule="evenodd"',
            'class="drose-hex-fill" fill="#fbbf24" fill-rule="evenodd"',
        )
        svg = svg.replace(
            'class="drose-hex-sky" d=',
            'class="drose-hex-sky" fill="url(#droseHeroSkyFillDark)" d=',
        )
        svg = svg.replace(
            'class="drose-hex-sky-glow" d=',
            'class="drose-hex-sky-glow" fill="url(#droseHeroSkyGlowDark)" d=',
        )
        svg = svg.replace('class="drose-star"', 'class="drose-star" opacity="0.94"')
    else:
        raise ValueError(f"Unknown mode: {mode}")

    return svg


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
        page = browser.new_page(viewport={"width": size, "height": size, "device_scale_factor": 1})
        page.set_content(html, wait_until="networkidle")
        page.locator("svg").screenshot(path=str(out_path), omit_background=True)
        browser.close()

    print(f"Wrote {out_path} ({size}x{size})")


def main() -> None:
    _export_png(_hero_rest_svg("light"), OUT_DIR / "drose-logo-hero-light.png", 512)
    _export_png(_hero_rest_svg("dark"), OUT_DIR / "drose-logo-hero-dark.png", 512)
    _export_png(_read(EMAIL_SVG), OUT_DIR / "drose-logo-email.png", 512)
    _export_png(_read(EMAIL_SVG), OUT_DIR / "drose-logo-email-96.png", 96)
    _export_png(_read(EMAIL_DARK_SVG), OUT_DIR / "drose-logo-email-dark.png", 512)
    _export_png(_read(EMAIL_DARK_SVG), OUT_DIR / "drose-logo-email-dark-96.png", 96)


if __name__ == "__main__":
    main()

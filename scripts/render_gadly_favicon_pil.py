"""Render sharp Gadly favicon PNGs/ICO from the gear geometry (supersampled)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "tools/static/tools/images"
PNG_SIZES = (48, 96, 192, 512)
ICO_SIZES = (16, 32, 48, 64, 128, 192, 256)

OUTER = [
    (20, 4), (22.6, 8.4), (27.3, 7.2), (28.5, 11.9), (33.1, 13.1), (32, 17.8), (36, 20),
    (32, 22.2), (33.1, 26.9), (28.5, 28.1), (27.3, 32.8), (22.6, 31.6), (20, 36),
    (17.4, 31.6), (12.7, 32.8), (11.5, 28.1), (6.9, 26.9), (8, 22.2), (4, 20),
    (8, 17.8), (6.9, 13.1), (11.5, 11.9), (12.7, 7.2), (17.4, 8.4),
]
HOLE_R = 5.0
CX = CY = 20.0


def lerp_color(t: float) -> tuple[int, int, int]:
    c0 = (0x00, 0x7B, 0xFF)
    c1 = (0x00, 0x3F, 0x7F)
    return tuple(int(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))  # type: ignore[return-value]


def render(size: int, scale: int = 8) -> Image.Image:
    s = size * scale

    def map_pt(x: float, y: float) -> tuple[float, float]:
        return (x / 40.0 * s, y / 40.0 * s)

    pts = [map_pt(x, y) for x, y in OUTER]
    r = HOLE_R / 40.0 * s
    cx, cy = map_pt(CX, CY)

    # Alpha mask: gear body minus center hole (true punch-through)
    mask = Image.new("L", (s, s), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(pts, fill=255)
    md.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)

    # RGB with diagonal gradient
    rgb = Image.new("RGB", (s, s), (0, 0, 0))
    px = rgb.load()
    denom = 2 * (s - 1) or 1
    for y in range(s):
        for x in range(s):
            t = (x + y) / denom
            px[x, y] = lerp_color(t)

    rgba = rgb.convert("RGBA")
    rgba.putalpha(mask)
    return rgba.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    for size in PNG_SIZES:
        img = render(size)
        path = ROOT / f"favicon-{size}.png"
        img.save(path, format="PNG", optimize=True)
        print(f"Wrote {path.name} ({size}x{size}, {path.stat().st_size} bytes)")

    master = Image.open(ROOT / "favicon-512.png").convert("RGBA")
    ico = ROOT / "favicon.ico"
    master.save(ico, format="ICO", sizes=[(s, s) for s in ICO_SIZES])
    print(f"Wrote {ico.name} ({ico.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

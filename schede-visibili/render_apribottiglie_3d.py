#!/usr/bin/env python3
"""Anteprime isometriche 3D dell'apribottiglie (senza browser)."""
from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/opt/cursor/artifacts"
GAL = "/workspace/schede-visibili"
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 900
STEEL = (120, 168, 210)
STEEL_D = (55, 112, 165)
ORANGE = (220, 120, 40)
ORANGE_D = (170, 85, 25)
WHITE = (255, 255, 255)
BG = (26, 35, 48)
CAP = (210, 168, 70)
RED = (198, 40, 40)
DARK = (17, 24, 32)


def font(sz):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


F18 = font(22)
F22 = font(28)
F14 = font(18)


def iso(x, y, z, ox=520, oy=480, s=7.2):
    """Proiezione isometrica (mm → px). Asse pezzo = X."""
    px = ox + (x - z) * math.cos(math.radians(30)) * s
    py = oy + (x + z) * math.sin(math.radians(30)) * s - y * s
    return px, py


def shade(rgb, k):
    return tuple(max(0, min(255, int(c * k))) for c in rgb)


def draw_cyl_iso(d, x0, x1, r, rgb, segs=28):
    """Cilindro lungo X, centro Y=0 Z=0."""
    # faccia posteriore (ellisse a x0) + corpo + faccia anteriore (x1)
    back = []
    front = []
    for i in range(segs + 1):
        a = 2 * math.pi * i / segs
        y, z = r * math.sin(a), r * math.cos(a)
        back.append(iso(x0, y, z))
        front.append(iso(x1, y, z))

    # bande laterali (solo metà “visibile”)
    for i in range(segs):
        a0 = 2 * math.pi * i / segs
        a1 = 2 * math.pi * (i + 1) / segs
        # factor luce da normale
        mid = (a0 + a1) / 2
        k = 0.55 + 0.45 * max(0, math.cos(mid - 0.6))
        poly = [
            iso(x0, r * math.sin(a0), r * math.cos(a0)),
            iso(x0, r * math.sin(a1), r * math.cos(a1)),
            iso(x1, r * math.sin(a1), r * math.cos(a1)),
            iso(x1, r * math.sin(a0), r * math.cos(a0)),
        ]
        d.polygon(poly, fill=shade(rgb, k))

    d.polygon(front, fill=shade(rgb, 0.92), outline=shade(rgb, 0.45))
    # alone bordo
    d.line(front + [front[0]], fill=shade(rgb, 0.35), width=2)


def draw_hole(d, x, r=3, depth=10):
    """Foro passante (asse Z) visto in iso — ellisse scura sulla testa."""
    pts = []
    for i in range(36):
        a = 2 * math.pi * i / 36
        y, z = r * math.sin(a), r * math.cos(a)
        pts.append(iso(x, y, z))
    d.polygon(pts, fill=DARK, outline=(0, 0, 0))
    # alone interno
    pts2 = []
    for i in range(36):
        a = 2 * math.pi * i / 36
        y, z = (r - 0.8) * math.sin(a), (r - 0.8) * math.cos(a)
        pts2.append(iso(x, y, z))
    d.polygon(pts2, fill=(40, 50, 60))


def draw_hook(d):
    """Gancio 68..80 con bocca."""
    # corpo gancio (tronco di cilindro)
    draw_cyl_iso(d, 68, 78, 8.5, ORANGE, segs=24)
    # uncino sotto (prisma)
    tip = [
        iso(72, -2, -6),
        iso(80, -1, -5),
        iso(80, -6, -2),
        iso(74, -9, 2),
        iso(70, -7, 4),
        iso(69, -3, 2),
    ]
    d.polygon(tip, fill=ORANGE_D, outline=(80, 40, 10))
    tip2 = [
        iso(72, -2, 6),
        iso(80, -1, 5),
        iso(80, -6, 2),
        iso(74, -9, -2),
        iso(70, -7, -4),
        iso(69, -3, -2),
    ]
    d.polygon(tip2, fill=shade(ORANGE, 0.75), outline=(80, 40, 10))
    # bocca (zona bianca)
    mouth = [
        iso(71, 1, -5),
        iso(76.5, 0, -4),
        iso(77, -3, -1),
        iso(74, -5.5, 2),
        iso(71.5, -4, 3),
        iso(70.5, -1, 1),
    ]
    d.polygon(mouth, fill=(255, 245, 230), outline=RED)
    # freccia bocca
    ax, ay = iso(74, -8, 0)
    d.line([(ax, ay), (ax, ay + 55)], fill=RED, width=3)
    d.polygon([(ax, ay), (ax - 8, ay + 14), (ax + 8, ay + 14)], fill=RED)


def label(d, x, y, z, text, col, dy=-28):
    px, py = iso(x, y, z)
    tw = d.textlength(text, font=F18)
    bx1, by1 = px - tw / 2 - 10, py + dy - 8
    bx2, by2 = px + tw / 2 + 10, py + dy + 26
    d.rounded_rectangle([bx1, by1, bx2, by2], radius=8, fill=(10, 20, 35, 220), outline=col, width=2)
    d.text((px - tw / 2, py + dy), text, fill=WHITE, font=F18)


def render(path, title, yaw_shift=0):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img, "RGBA")

    # pavimento
    for i in range(-2, 14):
        for j in range(-6, 7):
            p1 = iso(i * 8 + yaw_shift, -12, j * 8)
            p2 = iso((i + 1) * 8 + yaw_shift, -12, j * 8)
            p3 = iso((i + 1) * 8 + yaw_shift, -12, (j + 1) * 8)
            p4 = iso(i * 8 + yaw_shift, -12, (j + 1) * 8)
            col = (35, 48, 62) if (i + j) % 2 == 0 else (30, 42, 55)
            d.polygon([p1, p2, p3, p4], fill=col)

    # pezzo
    draw_cyl_iso(d, 0, 50, 8, STEEL)
    draw_cyl_iso(d, 50, 68, 9, STEEL_D)
    draw_hole(d, 58, r=3)
    draw_hook(d)

    # capsula fantasma vicino alla bocca
    cx, cy = 74, -14
    for rr, col in ((7.2, CAP), (6.2, shade(CAP, 0.85))):
        pts = [iso(cx, cy + 2 + rr * math.sin(a), rr * math.cos(a)) for a in [i * 2 * math.pi / 24 for i in range(25)]]
        d.polygon(pts, fill=col, outline=(120, 90, 30))
    d.text((iso(cx, cy - 4, 0)[0] - 40, iso(cx, cy - 4, 0)[1] + 40), "capsula", fill=CAP, font=F14)

    label(d, 25, 10, 0, "1 CORPO Ø16×50", STEEL, dy=-40)
    label(d, 59, 12, 0, "2 TESTA + foro Ø6", (150, 200, 240), dy=-50)
    label(d, 74, 10, 0, "3 GANCIO + BOCCA", (255, 180, 100), dy=-45)

    # titolo
    d.rectangle([0, 0, W, 70], fill=(10, 20, 35))
    d.text((24, 18), title, fill=WHITE, font=F22)
    d.text((24, 48), "Vista 3D isometrica · L tot. 80 mm · grezzo Ø20×100", fill=(160, 180, 200), font=F14)

    # legenda
    d.rounded_rectangle([24, H - 120, 420, H - 24], radius=12, fill=(10, 20, 35), outline=(58, 81, 104), width=2)
    rows = [
        (STEEL, "1 CORPO — manico"),
        (STEEL_D, "2 TESTA — con foro"),
        (ORANGE, "3 GANCIO — apre bottiglia"),
        (WHITE, "BOCCA bianca — entra la capsula"),
    ]
    for i, (c, t) in enumerate(rows):
        yy = H - 108 + i * 22
        d.rectangle([40, yy, 56, yy + 14], fill=c, outline=(0, 0, 0))
        d.text((66, yy - 2), t, fill=WHITE, font=F14)

    img = img.convert("RGB")
    img.save(path, "PNG", optimize=True)
    print("saved", path)


def main():
    render(os.path.join(OUT, "apribottiglie_3d_vista.png"), "APRIBOTTIGLIE — come è fatto in 3D")
    render(os.path.join(GAL, "apribottiglie_3d_vista.png"), "APRIBOTTIGLIE — come è fatto in 3D")
    # seconda angolazione (shift pavimento / titolo diverso)
    render(os.path.join(OUT, "apribottiglie_3d_bocca.png"), "Dettaglio: BOCCA del gancio (zona bianca)")
    render(os.path.join(GAL, "apribottiglie_3d_bocca.png"), "Dettaglio: BOCCA del gancio (zona bianca)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Scheda dedicata: COME È FATTO IL GANCIO (spiegazione visuale chiara)."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/opt/cursor/artifacts"
GAL = "/workspace/progetti-ferro-gallery"
VIS = "/workspace/schede-visibili"
for p in (OUT, GAL, VIS):
    os.makedirs(p, exist_ok=True)

W, H = 1240, 1754
BLACK = (0, 0, 0)
GRAY = (50, 50, 50)
WHITE = (255, 255, 255)
LIGHT = (210, 225, 240)
ACCENT = (0, 70, 130)
ORANGE = (220, 120, 40)
ORANGE_D = (160, 80, 20)
STEEL_D = (55, 110, 165)
CAP = (210, 168, 60)
CAP_D = (160, 120, 40)
RED = (190, 50, 45)
GLASS = (150, 200, 220)
OK = (30, 120, 70)
FOOT = H - 48


def font(sz):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


F12, F13, F14, F16, F18, F22 = font(18), font(20), font(22), font(24), font(26), font(30)
Fs = font(16)


def box(d, x, y, w, h, title, fill=LIGHT):
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + 36], fill=fill, outline=BLACK, width=2)
    d.text((x + 12, y + 8), title, fill=BLACK, font=F14)
    return y + 46


def draw_blank_end(d, cx, cy, scale=1.0):
    """Dopo tornio: cilindro pieno arancione (ancora senza bocca)."""
    w, h = int(110 * scale), int(90 * scale)
    d.rectangle([cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2], fill=ORANGE, outline=BLACK, width=3)
    # hatching = materiale pieno
    for i in range(-h // 2 + 8, h // 2, 12):
        d.line([cx - w // 2 + 6, cy + i, cx + w // 2 - 6, cy + i], fill=ORANGE_D, width=1)


def draw_hook_side(d, cx, cy, scale=1.0, show_mouth_label=True):
    """Vista laterale del gancio finito — forma a uncino leggibile."""
    s = scale
    # profilo esterno (come un apribottiglie vero, vista di lato)
    # punti relativi al centro-ish
    outer = [
        (cx - 55 * s, cy - 48 * s),  # attacco alto da testa
        (cx + 50 * s, cy - 42 * s),
        (cx + 62 * s, cy - 10 * s),
        (cx + 58 * s, cy + 28 * s),
        (cx + 10 * s, cy + 55 * s),  # punta uncino
        (cx - 25 * s, cy + 40 * s),
        (cx - 40 * s, cy + 18 * s),
        (cx - 55 * s, cy + 48 * s),  # attacco basso
    ]
    d.polygon(outer, fill=ORANGE, outline=BLACK)

    # BOCCA = intaglio bianco a C (dove entra il bordo capsula)
    mouth = [
        (cx - 35 * s, cy - 8 * s),
        (cx + 28 * s, cy - 14 * s),
        (cx + 38 * s, cy + 6 * s),
        (cx + 8 * s, cy + 32 * s),
        (cx - 22 * s, cy + 22 * s),
        (cx - 32 * s, cy + 4 * s),
    ]
    d.polygon(mouth, fill=WHITE, outline=RED)
    d.line([(cx - 55 * s, cy - 48 * s), (cx - 55 * s, cy + 48 * s)], fill=BLACK, width=3)

    if show_mouth_label:
        d.line([cx + 5 * s, cy + 8 * s, cx + 5 * s, cy + 78 * s], fill=RED, width=3)
        d.polygon(
            [(cx + 5 * s, cy + 5 * s), (cx - 8 * s, cy + 22 * s), (cx + 18 * s, cy + 22 * s)],
            fill=RED,
        )


def draw_hook_front(d, cx, cy, scale=1.0):
    """Vista frontale: si vede la bocca come apertura."""
    s = scale
    # corpo arancione ellisse/cilindro
    d.ellipse([cx - 55 * s, cy - 55 * s, cx + 55 * s, cy + 55 * s], fill=ORANGE, outline=BLACK, width=3)
    # bocca = apertura orizzontale bianca in basso
    d.rectangle([cx - 38 * s, cy + 5 * s, cx + 38 * s, cy + 32 * s], fill=WHITE, outline=RED, width=3)
    # uncino sotto (labbro)
    d.polygon(
        [
            (cx - 38 * s, cy + 32 * s),
            (cx + 38 * s, cy + 32 * s),
            (cx + 20 * s, cy + 52 * s),
            (cx - 20 * s, cy + 52 * s),
        ],
        fill=ORANGE_D,
        outline=BLACK,
    )
    d.text((cx - 28 * s, cy + 12 * s), "BOCCA", fill=RED, font=F13)


def draw_cap_engage(d, bx, by):
    """Capsula + uncino sotto il bordo — GRANDE e chiaro."""
    # bottiglia
    d.rectangle([bx + 40, by + 90, bx + 120, by + 220], fill=GLASS, outline=(40, 90, 120), width=2)
    # capsula
    d.ellipse([bx + 28, by + 48, bx + 132, by + 78], fill=CAP, outline=BLACK, width=2)
    d.rectangle([bx + 32, by + 62, bx + 128, by + 100], fill=CAP, outline=BLACK, width=2)
    # labbro capsula (bordo)
    d.polygon(
        [
            (bx + 128, by + 100),
            (bx + 140, by + 100),
            (bx + 132, by + 118),
            (bx + 118, by + 118),
            (bx + 118, by + 100),
        ],
        fill=CAP_D,
        outline=BLACK,
    )
    # freccia "bordo"
    d.text((bx + 145, by + 100), "bordo", fill=CAP_D, font=F12)

    # uncino arancione SOTTO il labbro
    hook = [
        (bx + 125, by + 78),
        (bx + 210, by + 85),
        (bx + 215, by + 115),
        (bx + 130, by + 125),
        (bx + 122, by + 112),
        (bx + 185, by + 108),
        (bx + 180, by + 95),
        (bx + 130, by + 90),
    ]
    d.polygon(hook, fill=ORANGE, outline=BLACK)
    # evidenzia punto di presa
    d.ellipse([bx + 118, by + 108, bx + 138, by + 128], outline=RED, width=3)
    d.text((bx + 145, by + 140), "1. uncino SOTTO", fill=ORANGE, font=F13)
    d.text((bx + 145, by + 168), "2. alzi la leva → apre", fill=RED, font=F13)


def draw_file_steps(d, x, y):
    """3 passi di limatura."""
    steps = [
        ("A", "DOPO TORNIO", "Cilindro pieno\nØ18 × 12 mm\n(niente bocca)"),
        ("B", "LIMA LA BOCCA", "Togli materiale\nal centro-basso\n→ foro bianco"),
        ("C", "FORMA UNCINO", "Arrotondi la punta\nin basso\n→ prende capsula"),
    ]
    gap = 280
    for i, (n, title, desc) in enumerate(steps):
        xx = x + i * gap
        d.ellipse([xx, y, xx + 36, y + 36], fill=ACCENT, outline=BLACK, width=2)
        tw = d.textlength(n, font=F16)
        d.text((xx + 18 - tw / 2, y + 6), n, fill=WHITE, font=F16)
        d.text((xx + 48, y + 6), title, fill=ACCENT, font=F14)

        cy = y + 120
        if i == 0:
            draw_blank_end(d, xx + 110, cy, 0.95)
        elif i == 1:
            # bocca iniziata
            draw_blank_end(d, xx + 110, cy, 0.95)
            d.polygon(
                [
                    (xx + 80, cy - 5),
                    (xx + 140, cy - 10),
                    (xx + 145, cy + 15),
                    (xx + 100, cy + 30),
                    (xx + 75, cy + 18),
                ],
                fill=WHITE,
                outline=RED,
            )
        else:
            draw_hook_side(d, xx + 110, cy, 0.85, show_mouth_label=False)

        for j, line in enumerate(desc.split("\n")):
            d.text((xx + 20, y + 200 + j * 24), line, fill=GRAY, font=F12)

        if i < 2:
            d.polygon(
                [(xx + 230, y + 110), (xx + 255, y + 95), (xx + 255, y + 125)],
                fill=ACCENT,
            )


def main():
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, W - 10, H - 10], outline=BLACK, width=2)
    d.rectangle([10, 10, W - 10, 88], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, 20), "APRIBOTTIGLIE — COME È FATTO IL GANCIO", fill=BLACK, font=F22)
    d.text((24, 54), "Solo la parte arancione · limatura a mano dopo la tornitura", fill=GRAY, font=F13)
    d.rectangle([W - 210, 20, W - 24, 74], outline=ACCENT, width=2)
    d.text((W - 198, 28), "2ª CLASSE", fill=ACCENT, font=F13)
    d.text((W - 198, 50), "dettaglio gancio", fill=ACCENT, font=Fs)
    d.rectangle([10, FOOT, W - 10, H - 10], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, FOOT + 12), "Idea: il gancio è un UNCINO. La bocca bianca è il vuoto dove entra il bordo della capsula.", fill=GRAY, font=Fs)

    # IDEA IN 1 FRASE
    y = box(d, 24, 100, W - 48, 78, "IN UNA FRASE")
    d.text((40, y + 4), "Il gancio NON è un pezzo tondo pieno: in basso c’è un intaglio (BOCCA) e una punta", fill=BLACK, font=F14)
    d.text((40, y + 32), "che va SOTTO il bordo della capsula; poi fai leva e la capsula salta.", fill=BLACK, font=F14)

    # TRE PASSI
    y = box(d, 24, 194, W - 48, 320, "3 PASSI DI LIMATURA (dal pezzo tornito)")
    draw_file_steps(d, 50, y + 10)

    # DUE VISTE GRANDI
    y = box(d, 24, 530, 590, 420, "VISTA DI LATO (come sulla scheda)")
    draw_hook_side(d, 280, y + 160, 2.2, show_mouth_label=True)
    d.rounded_rectangle([60, y + 310, 560, y + 370], radius=8, fill=(255, 235, 230), outline=RED, width=2)
    d.text((80, y + 328), "Zona BIANCA = BOCCA (ci entra la capsula)", fill=RED, font=F14)

    y2 = box(d, 630, 530, W - 24 - 630, 420, "VISTA DAVANTI (guarda la bocca)")
    draw_hook_front(d, 920, y2 + 160, 2.0)
    d.rounded_rectangle([650, y2 + 310, 1185, y2 + 370], radius=8, fill=(255, 235, 230), outline=RED, width=2)
    d.text((670, y2 + 328), "Apertura in basso = dove passa il bordo", fill=RED, font=F13)

    # COME APRE
    y = box(d, 24, 970, W - 48, 380, "COME APRE LA BOTTIGLIA")
    draw_cap_engage(d, 80, y + 10)
    # mini note a destra
    d.rectangle([520, y + 20, 1185, y + 320], fill=(248, 250, 252), outline=BLACK, width=2)
    notes = [
        "FORMA da ottenere:",
        "• sopra: dorso pieno (appoggia sulla capsula)",
        "• sotto: uncino che entra sotto il bordo",
        "• in mezzo: BOCCA vuota (bianca sul disegno)",
        "",
        "Errori tipici:",
        "• bocca troppo piccola → non entra",
        "• uncino troppo corto → non fa presa",
        "• uncino a punta fragile → si spezza",
        "",
        "Prova: con il docente, su una bottiglia.",
    ]
    for i, ln in enumerate(notes):
        col = ACCENT if ln.endswith(":") else (RED if ln.startswith("• b") or ln.startswith("• u") else BLACK)
        if ln.startswith("Errori"):
            col = RED
        if ln.startswith("FORMA") or ln.startswith("Prova"):
            col = ACCENT
        d.text((540, y + 36 + i * 26), ln, fill=col if ln else GRAY, font=F13)

    # salva
    name = "09-gancio-come-e-fatto.png"
    for folder in (GAL, OUT, VIS):
        img.save(os.path.join(folder, name), "PNG", optimize=True)
    img.save(os.path.join(OUT, "gancio_come_e_fatto.png"), "PNG", optimize=True)
    img.save(os.path.join(VIS, "gancio_come_e_fatto.png"), "PNG", optimize=True)
    # crop solo le viste grandi per allegato chat
    crop = img.crop((20, 520, 1220, 960))
    crop.save(os.path.join(OUT, "gancio_viste.png"), "PNG")
    crop.save(os.path.join(VIS, "gancio_viste.png"), "PNG")
    crop2 = img.crop((20, 960, 1220, 1360))
    crop2.save(os.path.join(OUT, "gancio_come_apre.png"), "PNG")
    print("saved", name)


if __name__ == "__main__":
    main()

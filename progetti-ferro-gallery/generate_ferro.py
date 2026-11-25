#!/usr/bin/env python3
"""Schede A4 — progetti FERRO al tornio (2ª–5ª), grezzo Ø20×100 mm."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/opt/cursor/artifacts/progetti-ferro"
GAL = "/workspace/progetti-ferro-gallery"
os.makedirs(OUT, exist_ok=True)
os.makedirs(GAL, exist_ok=True)

W, H = 1240, 1754
BLACK = (0, 0, 0)
GRAY = (55, 55, 55)
LIGHT = (228, 228, 228)
FILL = (235, 235, 235)
STEEL = (168, 176, 184)
STEEL_D = (120, 128, 136)
ACCENT = (0, 55, 100)
WHITE = (255, 255, 255)
SOFT = (200, 200, 200)
BLUEBOX = (232, 240, 255)
WARN = (90, 30, 20)

FOOT_TOP = H - 52


def font(size):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def font_b(size):
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return font(size)


F11, F12, F13, F14 = font_b(20), font_b(21), font_b(22), font_b(23)
F15b, F16b, F18b, F22b = font_b(24), font_b(25), font_b(28), font_b(34)
Fm, Fsmall = font_b(19), font(17)


def new_sheet(classe, titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([12, 12, W - 12, H - 12], outline=BLACK, width=2)
    d.rectangle([12, 12, W - 12, 104], fill=(246, 246, 246), outline=BLACK, width=2)
    d.text((28, 26), f"{classe}  ·  {titolo}", fill=BLACK, font=F22b)
    d.text((28, 64), sub, fill=GRAY, font=F12)
    d.rectangle([W - 230, 24, W - 28, 88], outline=ACCENT, width=2)
    d.text((W - 216, 32), "TORNIO · FERRO", fill=ACCENT, font=F13)
    d.text((W - 216, 56), "barra Ø20 × 100", fill=ACCENT, font=F11)
    d.rectangle([12, FOOT_TOP, W - 12, H - 12], fill=(246, 246, 246), outline=BLACK, width=2)
    d.text(
        (28, FOOT_TOP + 14),
        "Quote in mm · tolleranza ±0,2 mm (tornitura) · laboratorio meccanico",
        fill=GRAY,
        font=Fm,
    )
    return img, d


def panel(d, x, y, w, h, title):
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + 32], fill=LIGHT, outline=BLACK, width=2)
    d.text((x + 10, y + 6), title, fill=BLACK, font=F15b)
    return y + 38


def dim_h(d, x1, x2, y, label):
    d.line([x1, y, x2, y], fill=BLACK, width=2)
    d.line([x1, y - 5, x1, y + 5], fill=BLACK, width=2)
    d.line([x2, y - 5, x2, y + 5], fill=BLACK, width=2)
    tw = d.textlength(label, font=F13)
    lx = (x1 + x2) / 2 - tw / 2
    d.rectangle([lx - 2, y - 18, lx + tw + 2, y - 2], fill=WHITE)
    d.text((lx, y - 17), label, fill=BLACK, font=F13)


def dim_v(d, y1, y2, x, label):
    d.line([x, y1, x, y2], fill=BLACK, width=2)
    d.line([x - 5, y1, x + 5, y1], fill=BLACK, width=2)
    d.line([x - 5, y2, x + 5, y2], fill=BLACK, width=2)
    tw = d.textlength(label, font=F13)
    d.rectangle([x + 6, (y1 + y2) / 2 - 9, x + 10 + tw, (y1 + y2) / 2 + 7], fill=WHITE)
    d.text((x + 8, (y1 + y2) / 2 - 9), label, fill=BLACK, font=F13)


def table(d, x, y, headers, rows, col_w, rh=26):
    cx = x
    for i, hdg in enumerate(headers):
        d.rectangle([cx, y, cx + col_w[i], y + rh], fill=LIGHT, outline=BLACK, width=1)
        d.text((cx + 4, y + 5), hdg, fill=BLACK, font=Fm)
        cx += col_w[i]
    for r, row in enumerate(rows):
        cy = y + (r + 1) * rh
        cx = x
        bg = (250, 250, 250) if r % 2 else WHITE
        for i, cell in enumerate(row):
            d.rectangle([cx, cy, cx + col_w[i], cy + rh], fill=bg, outline=BLACK, width=1)
            d.text((cx + 4, cy + 5), str(cell), fill=BLACK, font=Fm)
            cx += col_w[i]
    return y + (len(rows) + 1) * rh


def student_block(d, x, y, y_max):
    fields = [
        "Alunno/a: ________________________________",
        "Classe: ________    Data: ____ / ____ / ______",
        "Voto /10: ______    Firma docente: _______________",
        "Note sicurezza / osservazioni: _______________________________",
        "____________________________________________________________",
    ]
    yy = y
    for ln in fields:
        if yy > y_max - 22:
            break
        d.text((x, yy), ln, fill=BLACK, font=F12)
        yy += 28
    return yy


def cyl(d, x, y, w, h, fill=STEEL, outline=BLACK):
    """Axis-horizontal cylinder body (rectangle + end ellipses simplified as rect with round hint)."""
    d.rectangle([x, y, x + w, y + h], fill=fill, outline=outline, width=2)
    # centerline
    cy = y + h / 2
    d.line([x - 8, cy, x + w + 8, cy], fill=SOFT, width=1)
    return cy


def save(img, name):
    p1 = os.path.join(OUT, name)
    p2 = os.path.join(GAL, name)
    img.save(p1, "PNG", optimize=True)
    img.save(p2, "PNG", optimize=True)
    print("saved", name)


# ─────────────────────────────────────────────────────────────
# 2ª — PORTACHIAVI
# ─────────────────────────────────────────────────────────────
def make_2a():
    img, d = new_sheet(
        "2ª CLASSE",
        "PORTACHIAVI",
        "Pezzo grezzo: barra tonda acciaio Ø20 × 100 mm  ·  pezzo finito da portare a casa",
    )
    # Obiettivo
    y = panel(d, 28, 118, W - 56, 110, "OBIETTIVO DIDATTICO")
    for i, ln in enumerate(
        [
            "Primo pezzo al tornio: sfacciatura, tornitura longitudinale, smussi e foratura.",
            "Risultato utile: portachiavi in ferro da appendere al mazzo personale.",
            "Materiale unico: barra Ø20 × 100 → ricavare il pezzo (avanzo in scarto / altro pezzo).",
        ]
    ):
        d.text((40, y + 4 + i * 24), "•  " + ln, fill=BLACK, font=F12)

    # Disegno tecnico
    y = panel(d, 28, 244, W - 56, 520, "DISEGNO TECNICO — vista laterale (scala ~4:1)")
    # Drawing area: finished piece L=60, Ø14 body, head Ø16 with hole Ø5, groove
    # scale 4px/mm → 60mm = 240px, Ø14 = 56px
    ox, oy = 120, 360
    sc = 4.0
    L = 60
    # sections: head 12mm Ø16, neck groove 3mm Ø10, body 45mm Ø14
    # total 12+3+45=60
    h_head, h_groove, h_body = 12, 3, 45
    d_head, d_groove, d_body = 16, 10, 14

    def Ytop(diam):
        return oy + (20 - diam) * sc / 2  # center on Ø20 reference mid

    mid_y = oy + 10 * sc

    # head
    x = ox
    wh, hh = h_head * sc, d_head * sc
    d.rectangle([x, mid_y - hh / 2, x + wh, mid_y + hh / 2], fill=STEEL, outline=BLACK, width=2)
    # hole indication (circle on head end - side view as two lines / oval)
    hole_cx = x + wh * 0.45
    d.ellipse([hole_cx - 5 * sc / 2, mid_y - 5 * sc / 2, hole_cx + 5 * sc / 2, mid_y + 5 * sc / 2], outline=BLACK, width=2)
    d.text((hole_cx - 18, mid_y - 5 * sc / 2 - 22), "Ø5", fill=BLACK, font=F12)

    # groove
    x2 = x + wh
    wg, hg = h_groove * sc, d_groove * sc
    d.rectangle([x2, mid_y - hg / 2, x2 + wg, mid_y + hg / 2], fill=STEEL_D, outline=BLACK, width=2)

    # body
    x3 = x2 + wg
    wb, hb = h_body * sc, d_body * sc
    d.rectangle([x3, mid_y - hb / 2, x3 + wb, mid_y + hb / 2], fill=STEEL, outline=BLACK, width=2)
    # end chamfer hint
    d.line([x3 + wb - 8, mid_y - hb / 2, x3 + wb, mid_y - hb / 2 + 8], fill=BLACK, width=2)
    d.line([x3 + wb - 8, mid_y + hb / 2, x3 + wb, mid_y + hb / 2 - 8], fill=BLACK, width=2)

    # centerline
    d.line([ox - 20, mid_y, x3 + wb + 30, mid_y], fill=SOFT, width=1)

    # dimensions
    dim_h(d, ox, ox + wh, mid_y - d_head * sc / 2 - 28, "12")
    dim_h(d, x2, x2 + wg, mid_y - d_head * sc / 2 - 28, "3")
    dim_h(d, x3, x3 + wb, mid_y - d_head * sc / 2 - 28, "45")
    dim_h(d, ox, x3 + wb, mid_y + d_head * sc / 2 + 40, "60")
    dim_v(d, mid_y - d_head * sc / 2, mid_y + d_head * sc / 2, ox - 36, "Ø16")
    dim_v(d, mid_y - d_body * sc / 2, mid_y + d_body * sc / 2, x3 + wb + 36, "Ø14")
    dim_v(d, mid_y - d_groove * sc / 2, mid_y + d_groove * sc / 2, x2 + wg / 2, "Ø10")

    d.text((ox, mid_y + d_head * sc / 2 + 70), "Smusso 1×45° alle estremità  ·  superficie satinata", fill=GRAY, font=F12)

    # Grezzo + distinta
    y = panel(d, 28, 780, 580, 280, "GREZZO E DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Misura grezzo", "Q.tà"],
        [
            ["Barra tonda", "Acciaio S235 / C40", "Ø20 × 100", "1"],
            ["Anello portachiavi", "Acciaio zincato", "Ø25 ca.", "1"],
        ],
        [140, 180, 150, 60],
    )
    d.text((40, y + 100), "Dal grezzo Ø20×100 si ricava il pezzo L=60;", fill=BLACK, font=F12)
    d.text((40, y + 124), "il resto (≈40 mm) resta come scorta per prova.", fill=BLACK, font=F12)
    d.text((40, y + 156), "Fasi: 1) sfacciatura  2) tornitura Ø16/Ø14", fill=BLACK, font=F12)
    d.text((40, y + 180), "3) gola Ø10  4) smussi  5) foratura Ø5  6) carteggio", fill=BLACK, font=F12)

    y2 = panel(d, 628, 780, W - 28 - 628, 280, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ Lunghezza 60 ±0,3",
            "□ Ø corpo 14 ±0,2",
            "□ Ø testa 16 ±0,2",
            "□ Foro Ø5 centrato",
            "□ Smussi uniformi",
            "□ Superficie senza strappi",
            "□ Anello montato",
        ]
    ):
        d.text((642, y2 + 6 + i * 28), ln, fill=BLACK, font=F13)

    y = panel(d, 28, 1080, W - 56, FOOT_TOP - 1080 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 4, FOOT_TOP - 16)
    save(img, "01-2a-portachiavi.png")


# ─────────────────────────────────────────────────────────────
# 3ª — FERMACARTE
# ─────────────────────────────────────────────────────────────
def make_3a():
    img, d = new_sheet(
        "3ª CLASSE",
        "FERMACARTE DA SCRIVANIA",
        "Pezzo grezzo: barra tonda acciaio Ø20 × 100 mm  ·  oggetto utile e bello da tenere in classe o a casa",
    )
    y = panel(d, 28, 118, W - 56, 110, "OBIETTIVO DIDATTICO")
    for i, ln in enumerate(
        [
            "Tornitura a più diametri con spallamenti netti e raccordo.",
            "Pezzo finito: fermacarte / pressacarte cilindrico da scrivania.",
            "Si usa quasi tutto il grezzo (L finita 90 mm): attenzione alle quote successive.",
        ]
    ):
        d.text((40, y + 4 + i * 24), "•  " + ln, fill=BLACK, font=F12)

    y = panel(d, 28, 244, W - 56, 520, "DISEGNO TECNICO — vista laterale (scala ~3,5:1)")
    # Base Ø20×25 + stelo Ø12×40 + testa Ø18×25 = 90
    sc = 3.5
    ox, mid_y = 100, 430
    parts = [
        (25, 20, STEEL),  # base
        (40, 12, STEEL_D),  # stem
        (25, 18, STEEL),  # head
    ]
    x = ox
    tops = []
    for L, dia, col in parts:
        ww, hh = L * sc, dia * sc
        d.rectangle([x, mid_y - hh / 2, x + ww, mid_y + hh / 2], fill=col, outline=BLACK, width=2)
        tops.append((x, ww, hh, L, dia))
        x += ww
    d.line([ox - 20, mid_y, x + 25, mid_y], fill=SOFT, width=1)
    # small dome hint on head end
    hx, hw, hh, _, _ = tops[2]
    d.ellipse([hx + hw - 6, mid_y - hh / 2, hx + hw + 10, mid_y + hh / 2], outline=BLACK, width=2)

    # dims
    dim_h(d, tops[0][0], tops[0][0] + tops[0][1], mid_y - 20 * sc / 2 - 30, "25")
    dim_h(d, tops[1][0], tops[1][0] + tops[1][1], mid_y - 20 * sc / 2 - 30, "40")
    dim_h(d, tops[2][0], tops[2][0] + tops[2][1], mid_y - 20 * sc / 2 - 30, "25")
    dim_h(d, ox, x, mid_y + 20 * sc / 2 + 38, "90")
    dim_v(d, mid_y - 20 * sc / 2, mid_y + 20 * sc / 2, ox - 40, "Ø20")
    dim_v(d, mid_y - 12 * sc / 2, mid_y + 12 * sc / 2, tops[1][0] + tops[1][1] / 2, "Ø12")
    dim_v(d, mid_y - 18 * sc / 2, mid_y + 18 * sc / 2, x + 34, "Ø18")

    d.text((ox, mid_y + 20 * sc / 2 + 70), "Spallamenti a 90°  ·  smusso 1×45° sulla base  ·  testa leggermente bombata", fill=GRAY, font=F12)

    y = panel(d, 28, 780, 580, 280, "GREZZO E DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Misura grezzo", "Q.tà"],
        [["Barra tonda", "Acciaio S235 / C40", "Ø20 × 100", "1"]],
        [140, 180, 150, 60],
    )
    d.text((40, y + 80), "Fasi: 1) sfacciatura a L=90  2) base Ø20", fill=BLACK, font=F12)
    d.text((40, y + 104), "3) stelo Ø12 con spalla  4) testa Ø18", fill=BLACK, font=F12)
    d.text((40, y + 128), "5) bombatura / smusso testa  6) satinatura", fill=BLACK, font=F12)
    d.text((40, y + 160), "Opzionale: marchiatura iniziale classe sul fondo.", fill=BLACK, font=F12)

    y2 = panel(d, 628, 780, W - 28 - 628, 280, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ Lunghezza 90 ±0,3",
            "□ Base Ø20 (grezzo finito)",
            "□ Stelo Ø12 ±0,2",
            "□ Testa Ø18 ±0,2",
            "□ Spalle nette a 90°",
            "□ Appoggia stabile in piano",
            "□ Finitura uniforme",
        ]
    ):
        d.text((642, y2 + 6 + i * 28), ln, fill=BLACK, font=F13)

    y = panel(d, 28, 1080, W - 56, FOOT_TOP - 1080 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 4, FOOT_TOP - 16)
    save(img, "02-3a-fermacarte.png")


# ─────────────────────────────────────────────────────────────
# 4ª — CACCIAVITE
# ─────────────────────────────────────────────────────────────
def make_4a():
    img, d = new_sheet(
        "4ª CLASSE",
        "CACCIAVITE A TAGLIO",
        "Pezzo grezzo: barra tonda acciaio Ø20 × 100 mm  ·  utensile da portare a casa",
    )
    y = panel(d, 28, 118, W - 56, 110, "OBIETTIVO DIDATTICO")
    for i, ln in enumerate(
        [
            "Tornitura di precisione + zigrinatura del manico + formatura lama a taglio.",
            "Pezzo finito: cacciavite monopezzo (manico e lama dallo stesso grezzo).",
            "Lavori tipici del meccanico: gole di scarico, smussi, controllo concentricità.",
        ]
    ):
        d.text((40, y + 4 + i * 24), "•  " + ln, fill=BLACK, font=F12)

    y = panel(d, 28, 244, W - 56, 520, "DISEGNO TECNICO — vista laterale (scala ~3,5:1)")
    # Manico Ø18×45 (knurl) + gola Ø10×5 + collo Ø12×20 + lama Ø8→taglio 30mm = 100
    # 45+5+20+30 = 100
    sc = 3.5
    ox, mid_y = 80, 420
    parts = [
        (45, 18, STEEL, "manico zigrinato"),
        (5, 10, STEEL_D, "gola"),
        (20, 12, STEEL, "collo"),
        (30, 8, STEEL_D, "lama"),
    ]
    x = ox
    segs = []
    for L, dia, col, _ in parts:
        ww, hh = L * sc, dia * sc
        d.rectangle([x, mid_y - hh / 2, x + ww, mid_y + hh / 2], fill=col, outline=BLACK, width=2)
        segs.append((x, ww, hh, L, dia))
        x += ww
    # knurl pattern on handle
    hx, hw, hh, _, _ = segs[0]
    for i in range(6):
        xx = hx + 8 + i * (hw - 16) / 5
        d.line([xx, mid_y - hh / 2 + 4, xx + 10, mid_y + hh / 2 - 4], fill=SOFT, width=1)
        d.line([xx + 10, mid_y - hh / 2 + 4, xx, mid_y + hh / 2 - 4], fill=SOFT, width=1)
    # blade tip flatten
    lx, lw, lh, _, _ = segs[3]
    d.polygon(
        [
            (lx + lw - 2, mid_y - lh / 2),
            (lx + lw + 14, mid_y),
            (lx + lw - 2, mid_y + lh / 2),
        ],
        fill=STEEL_D,
        outline=BLACK,
    )
    d.line([ox - 15, mid_y, x + 30, mid_y], fill=SOFT, width=1)

    dim_h(d, segs[0][0], segs[0][0] + segs[0][1], mid_y - 18 * sc / 2 - 32, "45")
    dim_h(d, segs[1][0], segs[1][0] + segs[1][1], mid_y - 18 * sc / 2 - 32, "5")
    dim_h(d, segs[2][0], segs[2][0] + segs[2][1], mid_y - 18 * sc / 2 - 32, "20")
    dim_h(d, segs[3][0], segs[3][0] + segs[3][1] + 14, mid_y - 18 * sc / 2 - 32, "30")
    dim_h(d, ox, x + 14, mid_y + 18 * sc / 2 + 40, "100")
    dim_v(d, mid_y - 18 * sc / 2, mid_y + 18 * sc / 2, ox - 38, "Ø18")
    dim_v(d, mid_y - 12 * sc / 2, mid_y + 12 * sc / 2, segs[2][0] + segs[2][1] / 2, "Ø12")
    dim_v(d, mid_y - 8 * sc / 2, mid_y + 8 * sc / 2, segs[3][0] + 8, "Ø8")

    d.text((ox, mid_y + 18 * sc / 2 + 72), "Zigrinatura media sul manico  ·  lama a taglio rettificata a mano (lima fina)", fill=GRAY, font=F12)
    d.text((ox, mid_y + 18 * sc / 2 + 96), "Gola di scarico Ø10 tra manico e collo", fill=GRAY, font=F12)

    y = panel(d, 28, 780, 580, 280, "GREZZO E DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Misura grezzo", "Q.tà"],
        [["Barra tonda", "Acciaio C40 (consigliato)", "Ø20 × 100", "1"]],
        [140, 190, 150, 60],
    )
    d.text((40, y + 80), "Fasi: 1) sfacciatura  2) manico Ø18 + zigrinatura", fill=BLACK, font=F12)
    d.text((40, y + 104), "3) gola Ø10  4) collo Ø12  5) gambo lama Ø8", fill=BLACK, font=F12)
    d.text((40, y + 128), "6) formatura taglio a lima  7) tempratura lama*", fill=BLACK, font=F12)
    d.text((40, y + 156), "*solo se previsto dal docente (forno / bruciatore)", fill=GRAY, font=F12)

    y2 = panel(d, 628, 780, W - 28 - 628, 280, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ Lunghezza totale 100 ±0,5",
            "□ Manico Ø18 zigrinato",
            "□ Collo Ø12 ±0,2",
            "□ Lama allineata all’asse",
            "□ Taglio simmetrico",
            "□ Gola senza spigoli vivi",
            "□ Prova su vite M4/M5",
        ]
    ):
        d.text((642, y2 + 6 + i * 28), ln, fill=BLACK, font=F13)

    y = panel(d, 28, 1080, W - 56, FOOT_TOP - 1080 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 4, FOOT_TOP - 16)
    save(img, "03-4a-cacciavite.png")


# ─────────────────────────────────────────────────────────────
# 5ª — MARTELLINO
# ─────────────────────────────────────────────────────────────
def make_5a():
    img, d = new_sheet(
        "5ª CLASSE",
        "MARTELLINO DA OFFICINA",
        "Pezzo grezzo: barra tonda acciaio Ø20 × 100 mm (+ manico Ø12 × 180)  ·  utensile completo",
    )
    y = panel(d, 28, 118, W - 56, 110, "OBIETTIVO DIDATTICO")
    for i, ln in enumerate(
        [
            "Progetto d’insieme: testa tornita dal grezzo Ø20×100 + manico separato.",
            "Foratura trasversale, accoppiamento con interferenza/adesivo, bilanciatura.",
            "Pezzo finito: martellino utile in laboratorio (può restare a scuola o andare a casa).",
        ]
    ):
        d.text((40, y + 4 + i * 24), "•  " + ln, fill=BLACK, font=F12)

    y = panel(d, 28, 244, W - 56, 560, "DISEGNO TECNICO — testa + insieme")
    # Head from Ø20×100: length 70 finished, with through hole Ø12 for handle
    # Head shape: cylindrical Ø20 × 70 with slight peen on one side / flat faces
    sc = 3.2
    # TOP: head alone (side view) — axis horizontal along length 70
    d.text((40, y + 4), "A) Testa (dal grezzo Ø20×100) — vista laterale", fill=BLACK, font=F14)
    ox, mid_y = 100, y + 110
    L_head, D_head = 70, 20
    ww, hh = L_head * sc, D_head * sc
    d.rectangle([ox, mid_y - hh / 2, ox + ww, mid_y + hh / 2], fill=STEEL, outline=BLACK, width=2)
    # faces slightly crowned: small arcs
    d.arc([ox - 8, mid_y - hh / 2, ox + 8, mid_y + hh / 2], 90, 270, fill=BLACK, width=2)
    d.arc([ox + ww - 8, mid_y - hh / 2, ox + ww + 8, mid_y + hh / 2], 270, 90, fill=BLACK, width=2)
    # hole through (vertical in real use) — show as rectangle crossing
    hole = 12 * sc
    hx = ox + ww / 2 - hole / 2
    d.rectangle([hx, mid_y - hh / 2 - 2, hx + hole, mid_y + hh / 2 + 2], fill=WHITE, outline=BLACK, width=2)
    d.text((hx - 4, mid_y - hh / 2 - 24), "Ø12", fill=BLACK, font=F12)
    d.line([ox - 15, mid_y, ox + ww + 20, mid_y], fill=SOFT, width=1)

    dim_h(d, ox, ox + ww, mid_y - hh / 2 - 36, "70")
    dim_v(d, mid_y - hh / 2, mid_y + hh / 2, ox + ww + 30, "Ø20")
    dim_h(d, hx, hx + hole, mid_y + hh / 2 + 28, "Ø12")

    # Assembly sketch
    d.text((40, mid_y + hh / 2 + 55), "B) Insieme montato (schema)", fill=BLACK, font=F14)
    ay = mid_y + hh / 2 + 95
    # handle vertical
    hand_h, hand_w = 160, 12 * 2.2
    hx0 = 200
    d.rectangle([hx0 - hand_w / 2, ay, hx0 + hand_w / 2, ay + hand_h], fill=(160, 120, 80), outline=BLACK, width=2)
    # head horizontal on handle
    d.rectangle([hx0 - ww / 2, ay + 35, hx0 + ww / 2, ay + 35 + hh], fill=STEEL, outline=BLACK, width=2)
    d.text((hx0 + ww / 2 + 16, ay + 40), "testa L=70", fill=BLACK, font=F12)
    d.text((hx0 + hand_w / 2 + 10, ay + hand_h - 40), "manico Ø12 × 180", fill=BLACK, font=F12)
    dim_v(d, ay, ay + hand_h, hx0 - hand_w / 2 - 28, "180")

    # notes on right of assembly
    d.text((520, ay + 10), "Manico: barra Ø12 × 180 (acciaio o legno duro).", fill=BLACK, font=F12)
    d.text((520, ay + 36), "Accoppiamento: interferenza leggera o", fill=BLACK, font=F12)
    d.text((520, ay + 60), "adesivo anaerobico + spine (se previsto).", fill=BLACK, font=F12)
    d.text((520, ay + 90), "Dal grezzo Ø20×100: testa L=70 +", fill=BLACK, font=F12)
    d.text((520, ay + 114), "avanzo ≈30 mm per prove foratura.", fill=BLACK, font=F12)

    y = panel(d, 28, 820, 580, 240, "GREZZO E DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Misura grezzo", "Q.tà"],
        [
            ["Testa martello", "Acciaio C40 / S235", "Ø20 × 100", "1"],
            ["Manico", "Acciaio Ø12 o faggio", "Ø12 × 180", "1"],
        ],
        [150, 180, 150, 60],
    )
    d.text((40, y + 100), "Fasi testa: sfacciatura → L=70 → foratura Ø12", fill=BLACK, font=F12)
    d.text((40, y + 124), "passante centrata → smussi → finitura.", fill=BLACK, font=F12)
    d.text((40, y + 152), "Poi montaggio manico e prova di percussione", fill=BLACK, font=F12)
    d.text((40, y + 176), "controllata (solo con docente).", fill=BLACK, font=F12)

    y2 = panel(d, 628, 820, W - 28 - 628, 240, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ Testa L=70 ±0,3",
            "□ Foro Ø12 centrato",
            "□ Foro ortogonale all’asse",
            "□ Manico ben fissato",
            "□ Bilanciatura accettabile",
            "□ Nessuna cricca / bava",
        ]
    ):
        d.text((642, y2 + 6 + i * 28), ln, fill=BLACK, font=F13)

    y = panel(d, 28, 1080, W - 56, FOOT_TOP - 1080 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 4, FOOT_TOP - 16)
    save(img, "04-5a-martellino.png")


if __name__ == "__main__":
    make_2a()
    make_3a()
    make_4a()
    make_5a()
    print("ALL DONE")

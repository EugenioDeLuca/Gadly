#!/usr/bin/env python3
"""Schede A4 — parti del tornio + leve (colorate, dettagliate, diciture grandi)."""
from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/opt/cursor/artifacts/progetti-ferro"
GAL = "/workspace/progetti-ferro-gallery"
ART = "/opt/cursor/artifacts"
os.makedirs(OUT, exist_ok=True)
os.makedirs(GAL, exist_ok=True)

W, H = 1240, 1754
BLACK = (0, 0, 0)
GRAY = (40, 40, 40)
WHITE = (255, 255, 255)
LIGHT = (210, 230, 245)
ACCENT = (0, 70, 130)
WARN_BG = (255, 236, 200)
WARN = (140, 50, 10)
FOOT = H - 48

# Palette colorata parti
C_HEAD = (45, 90, 150)       # blu testa
C_HEAD_L = (90, 140, 200)
C_CHUCK = (90, 100, 115)     # grigio mandrino
C_JAW = (210, 170, 60)       # oro griffe
C_BED = (70, 110, 90)        # verde-grigio letto
C_BED_L = (120, 160, 140)
C_CARR = (50, 130, 150)      # teal carrello
C_CARR_L = (80, 170, 190)
C_TAIL = (120, 80, 140)      # viola contropunta
C_TAIL_L = (160, 120, 180)
C_WORK = (210, 160, 90)      # ottone pezzo
C_LEAD = (40, 40, 45)        # vite madre
C_FEED = (30, 60, 90)        # barra comando
C_BASE = (85, 95, 105)
C_TOOL = (35, 35, 40)


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


F11 = font_b(18)
F12 = font_b(20)
F13 = font_b(22)
F14 = font_b(24)
F15 = font_b(26)
F18 = font_b(28)
F22 = font_b(32)
Fm = font_b(17)
Fs = font(17)


def new_sheet(titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, W - 10, H - 10], outline=BLACK, width=2)
    d.rectangle([10, 10, W - 10, 88], fill=(235, 245, 255), outline=BLACK, width=2)
    d.text((24, 18), titolo, fill=BLACK, font=F22)
    d.text((24, 54), sub, fill=GRAY, font=F12)
    d.rectangle([W - 210, 18, W - 24, 74], fill=ACCENT, outline=BLACK, width=2)
    d.text((W - 198, 26), "TORNIO", fill=WHITE, font=F13)
    d.text((W - 198, 48), "MANUALE", fill=WHITE, font=F13)
    d.rectangle([10, FOOT, W - 10, H - 10], fill=(235, 245, 255), outline=BLACK, width=2)
    d.text((24, FOOT + 12), "Laboratorio meccanico · scheda a colori · tenere vicino al tornio", fill=GRAY, font=Fm)
    return img, d


def panel(d, x, y, w, h, title, fill=LIGHT):
    hdr = 38
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + hdr], fill=fill, outline=BLACK, width=2)
    d.text((x + 12, y + 8), title, fill=BLACK, font=F14)
    return y + hdr + 10


def badge(d, n, tx, ty, color=ACCENT, r=18):
    d.ellipse([tx - r, ty - r, tx + r, ty + r], fill=color, outline=BLACK, width=2)
    tw = d.textlength(str(n), font=F14)
    d.text((tx - tw / 2, ty - 11), str(n), fill=WHITE, font=F14)


def callout(d, n, tx, ty, lx, ly, color=ACCENT):
    d.line([tx, ty, lx, ly], fill=color, width=3)
    d.ellipse([lx - 5, ly - 5, lx + 5, ly + 5], fill=BLACK)
    badge(d, n, tx, ty, color=color)


def save(img, name, stampa=None):
    img.save(os.path.join(OUT, name), "PNG", optimize=True)
    img.save(os.path.join(GAL, name), "PNG", optimize=True)
    img.save(os.path.join(ART, name), "PNG", optimize=True)
    if stampa:
        img.save(os.path.join(ART, stampa), "PNG", optimize=True)
    print("saved", name)


def draw_lathe_color(d, ox=30, oy=150):
    """Tornio parallelo grande, colorato, dettagliato. Ritorna punti callout."""
    bed_y = oy + 360
    bed_x1, bed_x2 = ox + 30, ox + 1140

    # —— Basamento / piedi ——
    d.rectangle([bed_x1 + 20, bed_y + 75, bed_x1 + 150, bed_y + 185], fill=C_BASE, outline=BLACK, width=2)
    d.rectangle([bed_x2 - 150, bed_y + 75, bed_x2 - 20, bed_y + 185], fill=C_BASE, outline=BLACK, width=2)
    # vasca trucioli
    d.rectangle([bed_x1, bed_y + 160, bed_x2, bed_y + 200], fill=(100, 110, 120), outline=BLACK, width=2)

    # —— Bancale (letto) con guide a V ——
    d.rectangle([bed_x1, bed_y, bed_x2, bed_y + 80], fill=C_BED, outline=BLACK, width=3)
    # guide
    d.polygon(
        [(bed_x1 + 40, bed_y + 8), (bed_x1 + 70, bed_y + 8), (bed_x1 + 55, bed_y + 28)],
        fill=C_BED_L, outline=BLACK,
    )
    for gx in range(bed_x1 + 100, bed_x2 - 80, 90):
        d.line([gx, bed_y + 10, gx + 60, bed_y + 10], fill=C_BED_L, width=3)
        d.line([gx, bed_y + 22, gx + 60, bed_y + 22], fill=(50, 80, 65), width=2)
    d.rectangle([bed_x1 + 15, bed_y + 40, bed_x2 - 15, bed_y + 70], fill=(55, 90, 75), outline=BLACK, width=1)

    # —— Testa motrice ——
    hx1, hx2 = bed_x1, bed_x1 + 300
    hy1 = oy + 30
    d.rectangle([hx1, hy1, hx2, bed_y], fill=C_HEAD, outline=BLACK, width=3)
    # carter / finestre
    d.rectangle([hx1 + 18, hy1 + 25, hx1 + 130, hy1 + 130], fill=C_HEAD_L, outline=BLACK, width=2)
    d.rectangle([hx1 + 145, hy1 + 25, hx1 + 275, hy1 + 95], fill=(30, 70, 120), outline=BLACK, width=2)
    # leve velocità colorate
    for i, (lx, col) in enumerate([(hx1 + 35, (220, 80, 60)), (hx1 + 95, (240, 180, 40)), (hx1 + 155, (60, 180, 90))]):
        d.rectangle([lx, hy1 + 155, lx + 36, hy1 + 182], fill=col, outline=BLACK, width=2)
        d.line([lx + 18, hy1 + 182, lx + 18, hy1 + 225], fill=BLACK, width=4)
        d.ellipse([lx + 6, hy1 + 218, lx + 30, hy1 + 242], fill=col, outline=BLACK, width=2)

    # —— Mandrino a 3 griffe ——
    chuck_cx, chuck_cy = hx2 + 48, oy + 230
    d.ellipse([chuck_cx - 62, chuck_cy - 62, chuck_cx + 62, chuck_cy + 62], fill=C_CHUCK, outline=BLACK, width=3)
    d.ellipse([chuck_cx - 42, chuck_cy - 42, chuck_cx + 42, chuck_cy + 42], fill=(70, 78, 90), outline=BLACK, width=2)
    d.ellipse([chuck_cx - 14, chuck_cy - 14, chuck_cx + 14, chuck_cy + 14], fill=WHITE, outline=BLACK, width=2)
    for ang in (90, 210, 330):
        a = math.radians(ang)
        x1 = chuck_cx + 16 * math.cos(a)
        y1 = chuck_cy - 16 * math.sin(a)
        x2 = chuck_cx + 55 * math.cos(a)
        y2 = chuck_cy - 55 * math.sin(a)
        d.line([x1, y1, x2, y2], fill=C_JAW, width=7)
        d.ellipse([x2 - 8, y2 - 8, x2 + 8, y2 + 8], fill=C_JAW, outline=BLACK, width=1)

    # —— Pezzo (ottone) ——
    pz1 = chuck_cx + 58
    pz2 = ox + 800
    d.rectangle([pz1, chuck_cy - 16, pz2, chuck_cy + 16], fill=C_WORK, outline=BLACK, width=2)
    # riflesso
    d.line([pz1 + 4, chuck_cy - 8, pz2 - 4, chuck_cy - 8], fill=(240, 200, 140), width=2)
    # asse pezzo
    d.line([hx1 + 8, chuck_cy, ox + 1100, chuck_cy], fill=(160, 160, 160), width=1)

    # —— Contropunta ——
    tx1, tx2 = ox + 860, ox + 1100
    d.rectangle([tx1, oy + 130, tx2, bed_y], fill=C_TAIL, outline=BLACK, width=3)
    d.rectangle([tx1 + 12, oy + 145, tx2 - 12, oy + 220], fill=C_TAIL_L, outline=BLACK, width=1)
    # canotto
    d.rectangle([tx1 - 80, chuck_cy - 20, tx1 + 12, chuck_cy + 20], fill=(90, 60, 110), outline=BLACK, width=2)
    d.polygon(
        [(tx1 - 80, chuck_cy - 12), (tx1 - 110, chuck_cy), (tx1 - 80, chuck_cy + 12)],
        fill=(220, 220, 230), outline=BLACK,
    )
    # volantino contropunta
    d.ellipse([tx2 - 8, chuck_cy - 48, tx2 + 80, chuck_cy + 48], fill=C_TAIL_L, outline=BLACK, width=3)
    d.ellipse([tx2 + 18, chuck_cy - 22, tx2 + 58, chuck_cy + 22], fill=WHITE, outline=BLACK, width=2)
    # leve blocco
    d.rectangle([tx1 + 35, oy + 150, tx1 + 115, oy + 178], fill=(230, 90, 50), outline=BLACK, width=2)
    d.rectangle([tx1 + 25, bed_y - 40, tx1 + 120, bed_y - 12], fill=(230, 90, 50), outline=BLACK, width=2)

    # —— Carrello ——
    cx1, cx2 = ox + 470, ox + 740
    d.rectangle([cx1, oy + 255, cx2, bed_y], fill=C_CARR, outline=BLACK, width=3)
    # grembiule
    d.rectangle([cx1, oy + 305, cx2, bed_y], fill=C_CARR_L, outline=BLACK, width=2)
    # slitta trasversale
    d.rectangle([cx1 + 25, oy + 175, cx2 - 25, oy + 255], fill=(40, 110, 130), outline=BLACK, width=2)
    # torretta
    d.rectangle([cx1 + 70, oy + 95, cx2 - 70, oy + 175], fill=C_HEAD, outline=BLACK, width=3)
    # utensile
    d.polygon(
        [
            (cx1 + 100, oy + 110),
            (cx1 + 175, oy + 110),
            (cx1 + 195, oy + 145),
            (cx1 + 100, oy + 145),
        ],
        fill=C_TOOL, outline=BLACK,
    )
    d.line([cx1 + 195, oy + 128, pz1 + 180, chuck_cy - 16], fill=C_TOOL, width=3)

    # volantini
    d.ellipse([cx1 + 20, oy + 325, cx1 + 100, oy + 405], fill=(30, 100, 120), outline=BLACK, width=3)
    d.ellipse([cx1 + 42, oy + 347, cx1 + 78, oy + 383], fill=WHITE, outline=BLACK, width=2)
    d.ellipse([cx1 + 125, oy + 195, cx1 + 185, oy + 255], fill=(30, 90, 110), outline=BLACK, width=2)
    d.ellipse([cx1 + 142, oy + 212, cx1 + 168, oy + 238], fill=WHITE, outline=BLACK, width=1)
    d.ellipse([cx2 - 60, oy + 105, cx2 - 15, oy + 150], fill=(30, 90, 110), outline=BLACK, width=2)
    # leve avanzamento
    d.rectangle([cx1 + 170, oy + 335, cx1 + 215, oy + 365], fill=(240, 160, 40), outline=BLACK, width=2)
    d.rectangle([cx1 + 225, oy + 335, cx1 + 270, oy + 365], fill=(240, 160, 40), outline=BLACK, width=2)

    # —— Vite madre (filettatura) ——
    d.rectangle([hx2 + 10, bed_y + 14, tx1 - 10, bed_y + 32], fill=C_LEAD, outline=BLACK, width=2)
    for i in range(22):
        x = hx2 + 20 + i * 26
        if x < tx1 - 15:
            d.line([x, bed_y + 14, x + 12, bed_y + 32], fill=(180, 140, 60), width=2)
    # —— Barra di comando ——
    d.rectangle([hx2 + 10, bed_y + 40, tx1 - 10, bed_y + 54], fill=C_FEED, outline=BLACK, width=2)

    # (nomi solo in legenda — niente etichette sul disegno)

    pts = {
        1: (hx1 + 150, hy1 + 70),
        2: (chuck_cx, chuck_cy),
        3: ((bed_x1 + bed_x2) / 2, bed_y + 40),
        4: ((cx1 + cx2) / 2, oy + 290),
        5: ((cx1 + cx2) / 2, oy + 215),
        6: ((cx1 + cx2) / 2 - 10, oy + 130),
        7: ((tx1 + tx2) / 2, oy + 200),
        8: (tx1 - 40, chuck_cy),
        9: ((hx2 + tx1) / 2, bed_y + 23),
        10: ((hx2 + tx1) / 2, bed_y + 47),
        11: (cx1 + 60, oy + 365),
        12: (bed_x1 + 85, bed_y + 130),
    }
    colors = {
        1: C_HEAD, 2: C_CHUCK, 3: C_BED, 4: C_CARR, 5: C_CARR_L, 6: C_HEAD,
        7: C_TAIL, 8: C_TAIL_L, 9: (180, 140, 60), 10: C_FEED, 11: C_CARR, 12: C_BASE,
    }
    return pts, colors


def make_parti():
    img, d = new_sheet(
        "TORNIO MANUALE — LE PARTI",
        "Schema laterale a COLORI · nomi e funzione (tornio parallelo)",
    )

    draw_h = 780
    panel(d, 24, 100, W - 48, draw_h, "SCHEMA LATERALE COLORATO")
    pts, colors = draw_lathe_color(d, ox=28, oy=145)

    # Callout distanziati — linee che non si incrociano
    callouts = [
        (1, 70, 160),
        (2, 420, 150),
        (3, 760, 840),
        (4, 300, 700),
        (5, 860, 190),
        (6, 500, 130),
        (7, 1175, 190),
        (8, 900, 150),
        (9, 1050, 840),
        (10, 200, 820),
        (11, 280, 760),
        (12, 100, 780),
    ]
    for n, tx, ty in callouts:
        lx, ly = pts[n]
        callout(d, n, tx, ty, lx, ly, color=colors[n])

    # Legenda a 2 colonne — font grandi, riempie fino al footer
    leg_y = 100 + draw_h + 10
    leg_h = FOOT - leg_y - 8
    y = panel(d, 24, leg_y, W - 48, leg_h, "LEGENDA — PARTI PRINCIPALI (stessi colori del disegno)")
    parts = [
        ("1", "Testa motrice", "Mandrino, ingranaggi, comandi velocità.", C_HEAD),
        ("2", "Mandrino a griffe", "Serraggio pezzo (3 o 4 griffe dorate).", C_CHUCK),
        ("3", "Bancale (letto)", "Guide per carrello e contropunta.", C_BED),
        ("4", "Carrello (carro)", "Avanzamento longitudinale + grembiule.", C_CARR),
        ("5", "Slitta trasversale", "Profondità di passata (asse X).", C_CARR_L),
        ("6", "Torretta / utensile", "Fissa l’utensile; slitta orientabile.", C_HEAD),
        ("7", "Contropunta", "Sostiene pezzi lunghi / foratura.", C_TAIL),
        ("8", "Canotto", "Avanza punta o centro verso il pezzo.", C_TAIL_L),
        ("9", "Vite madre", "SOLO per filettatura (rapporti giusti).", (180, 140, 60)),
        ("10", "Barra di comando", "Avanzamento automatico (non filetto).", C_FEED),
        ("11", "Volantino longitudinale", "Movimento manuale del carrello (asse Z).", C_CARR),
        ("12", "Basamento / piedi", "Sostegno macchina + vasca trucioli.", C_BASE),
    ]
    row_h = max(52, (leg_h - 60) // 6)
    for i, (n, title, desc, col) in enumerate(parts):
        col_i = i % 2
        row = i // 2
        xx = 40 + col_i * 590
        yy = y + 6 + row * row_h
        badge(d, n, xx + 18, yy + 20, color=col, r=18)
        d.text((xx + 48, yy + 4), title, fill=BLACK, font=F15)
        d.text((xx + 48, yy + 34), desc, fill=GRAY, font=F13)

    save(img, "05-tornio-parti.png", "STAMPA-tornio-parti.png")


def make_leve_full():
    img, d = new_sheet(
        "TORNIO MANUALE — LEVE E COMANDI",
        "A cosa serve ogni leva / volantino (imparale prima di accendere)",
    )

    regola_y, regola_h = 100, 120
    y = panel(d, 24, regola_y, W - 48, regola_h, "REGOLA D’ORO", fill=WARN_BG)
    d.text((36, y + 6), "Macchina FERMA per: cambiare velocità · invertire senso · spostare contropunta.", fill=WARN, font=F14)
    d.text((36, y + 40), "Occhiali sempre. Capelli/maniche raccolti. Non toccare pezzo o mandrino in moto.", fill=WARN, font=F14)

    # Schema colorato più grande
    schem_y = regola_y + regola_h + 12
    schem_h = 320
    panel(d, 24, schem_y, W - 48, schem_h, "POSIZIONE DEI COMANDI (schema a colori)")
    my = schem_y + 160
    # bed
    d.rectangle([60, my + 90, 1160, my + 140], fill=C_BED, outline=BLACK, width=3)
    # headstock
    d.rectangle([60, my - 50, 300, my + 90], fill=C_HEAD, outline=BLACK, width=3)
    d.ellipse([270, my, 360, my + 90], fill=C_CHUCK, outline=BLACK, width=3)
    for ang in (90, 210, 330):
        a = math.radians(ang)
        d.line(
            [315 + 12 * math.cos(a), my + 45 - 12 * math.sin(a),
             315 + 40 * math.cos(a), my + 45 - 40 * math.sin(a)],
            fill=C_JAW, width=5,
        )
    # pezzo
    d.rectangle([360, my + 30, 900, my + 55], fill=C_WORK, outline=BLACK, width=2)
    # carriage
    d.rectangle([520, my + 10, 750, my + 90], fill=C_CARR, outline=BLACK, width=3)
    d.rectangle([545, my - 50, 725, my + 10], fill=C_CARR_L, outline=BLACK, width=2)
    d.rectangle([590, my - 100, 680, my - 50], fill=C_HEAD, outline=BLACK, width=2)
    # handwheels
    d.ellipse([545, my + 40, 615, my + 110], fill=(30, 100, 120), outline=BLACK, width=2)
    d.ellipse([635, my - 30, 690, my + 25], fill=(30, 90, 110), outline=BLACK, width=2)
    # tailstock
    d.rectangle([900, my - 20, 1120, my + 90], fill=C_TAIL, outline=BLACK, width=3)
    d.ellipse([1100, my + 5, 1180, my + 85], fill=C_TAIL_L, outline=BLACK, width=2)
    # lead screw
    d.rectangle([300, my + 100, 900, my + 118], fill=C_LEAD, outline=BLACK, width=1)
    for i in range(15):
        x = 320 + i * 38
        d.line([x, my + 100, x + 14, my + 118], fill=(180, 140, 60), width=2)

    def letter(x, y_, L, col=ACCENT):
        d.rectangle([x, y_, x + 28, y_ + 28], fill=col, outline=BLACK, width=2)
        d.text((x + 6, y_ + 3), L, fill=WHITE, font=F13)

    letter(90, my - 40, "A", C_HEAD)
    letter(170, my + 15, "B", C_HEAD)
    letter(100, my + 50, "C", (200, 60, 50))
    letter(550, my + 115, "D", C_CARR)
    letter(640, my - 55, "E", C_CARR)
    letter(690, my - 110, "F", C_HEAD)
    letter(720, my + 40, "G", (230, 90, 50))
    letter(570, my + 55, "H", (240, 160, 40))
    letter(660, my + 55, "I", (240, 160, 40))
    letter(420, my + 125, "J", (180, 140, 60))
    letter(1110, my - 30, "K", C_TAIL)
    letter(940, my - 15, "L", (230, 90, 50))
    letter(960, my + 55, "M", (230, 90, 50))
    letter(610, my - 110, "N", C_HEAD)

    # Tabelle — riempiono fino al footer
    com_y = schem_y + schem_h + 12
    com_h = FOOT - com_y - 8
    left = [
        ("A", "Selettore velocità", "Giri/min. Bassi = pezzi grandi, zigrinatura, acciaio. Solo a macchina ferma."),
        ("B", "Senso di rotazione", "Orario / antiorario. Inverti solo a macchina ferma."),
        ("C", "Avvio / STOP", "Moto mandrino. Impara dove sta l’emergenza sul tuo tornio."),
        ("D", "Volantino longitudinale", "Muove a mano il carrello lungo il pezzo (asse Z)."),
        ("E", "Volantino trasversale", "Profondità di passata: avvicina o allontana l’utensile (asse X)."),
        ("F", "Volantino slitta superiore", "Smussi, conicità, piccole correzioni."),
        ("G", "Bloccaggio carrello", "Fissa il carrello sul bancale (es. in sfacciatura)."),
    ]
    right = [
        ("H", "Avanzamento longitudinale", "Automatico lungo il pezzo. Per cilindri lunghi."),
        ("I", "Avanzamento trasversale", "Automatico in profondità. Mai insieme ad H."),
        ("J", "Vite madre (filettatura)", "Innesto per filettare. Solo con rapporti giusti. Mai con H o I."),
        ("K", "Volantino contropunta", "Fa uscire o rientrare il canotto (centro o punta)."),
        ("L", "Bloccaggio canotto", "Blocca il canotto dopo il posizionamento."),
        ("M", "Bloccaggio contropunta", "Fissa la contropunta sul bancale."),
        ("N", "Bloccaggio utensile", "Serraggio sulla torretta. Utensile a centro pezzo."),
    ]

    def wrap_text(d, x, y0, text, font, max_w, fill, line_h=24):
        words = text.split()
        line, ly = "", y0
        for w_ in words:
            test = (line + " " + w_).strip()
            if d.textlength(test, font=font) > max_w:
                d.text((x, ly), line, fill=fill, font=font)
                ly += line_h
                line = w_
            else:
                line = test
        if line:
            d.text((x, ly), line, fill=fill, font=font)
            ly += line_h
        return ly

    item_h = max(78, (com_h - 50) // 7)

    y = panel(d, 24, com_y, 580, com_h, "COMANDI A – G")
    for i, (n, title, desc) in enumerate(left):
        yy = y + 4 + i * item_h
        d.rectangle([36, yy, 66, yy + 28], fill=ACCENT, outline=BLACK, width=2)
        d.text((44, yy + 4), n, fill=WHITE, font=F14)
        d.text((76, yy + 4), title, fill=BLACK, font=F14)
        wrap_text(d, 76, yy + 34, desc, F13, 500, GRAY, 24)

    y = panel(d, 620, com_y, W - 24 - 620, com_h, "COMANDI H – N")
    for i, (n, title, desc) in enumerate(right):
        yy = y + 4 + i * item_h
        d.rectangle([632, yy, 662, yy + 28], fill=ACCENT, outline=BLACK, width=2)
        d.text((640, yy + 4), n, fill=WHITE, font=F14)
        d.text((672, yy + 4), title, fill=BLACK, font=F14)
        wrap_text(d, 672, yy + 34, desc, F13, 500, GRAY, 24)

    save(img, "06-tornio-leve.png", "STAMPA-tornio-leve.png")


def make_uso():
    img, d = new_sheet(
        "TORNIO MANUALE — SEQUENZA DI LAVORO",
        "Ordine corretto delle operazioni + errori da non fare",
    )

    # Usa tutto lo spazio fino al footer
    dat_h = 160
    bad_h = 400
    seq_h = FOOT - 100 - 12 - bad_h - 12 - dat_h - 8
    y = panel(d, 24, 100, W - 48, seq_h, "SEQUENZA TIPICA (tornitura di un cilindro)")
    steps = [
        ("1", "Controllo macchina", "Pulizia, protezioni, livello olio, STOP emergenza individuato.", C_HEAD),
        ("2", "Montaggio pezzo", "Nel mandrino (o tra centri). Serraggio forte; pezzo corto se possibile.", C_CHUCK),
        ("3", "Montaggio utensile", "A centro pezzo, sporgenza minima, ben bloccato sulla torretta.", C_TOOL),
        ("4", "Contropunta (se serve)", "Punta sul centro; blocca canotto e contropunta sul bancale.", C_TAIL),
        ("5", "Scelta giri", "A macchina FERMA. n ≈ (v×1000)/(π×Ø) — chiedi al docente la v di taglio.", C_HEAD),
        ("6", "Avvicinamento", "A mano coi volantini: tocca il pezzo, azzera i tamburi/quote se presenti.", C_CARR),
        ("7", "Passata", "Profondità col volantino trasversale; avanza lungo il pezzo (mano o auto).", C_CARR_L),
        ("8", "Misura", "Ferma, misura col calibro, correggi. Ripeti fino a quota.", (60, 140, 80)),
        ("9", "Finitura", "Passata leggera, giri più alti se possibile, buona lubrificazione.", (240, 160, 40)),
        ("10", "Fine lavoro", "Arresto → togli utensile/pezzo → pulizia bancale e vasca trucioli.", C_BASE),
    ]
    step_h = max(58, (seq_h - 55) // len(steps))
    for i, (n, t, desc, col) in enumerate(steps):
        yy = y + 4 + i * step_h
        badge(d, n, 58, yy + 20, color=col, r=20)
        d.text((90, yy + 4), t, fill=BLACK, font=F15)
        d.text((90, yy + 34), desc, fill=GRAY, font=F13)

    bad_y = 100 + seq_h + 12
    y = panel(d, 24, bad_y, W - 48, bad_h, "NON FARE MAI", fill=WARN_BG)
    bad = [
        "Cambiare velocità o invertire il senso con mandrino in moto.",
        "Lasciare la chiave del mandrino inserita (diventa un proiettile).",
        "Misurare il pezzo mentre gira.",
        "Innestare insieme avanzamento longitudinale + trasversale + vite madre.",
        "Zigrinare o filettare a giri troppo alti.",
        "Allontanarsi con pezzo ancora in rotazione.",
        "Usare guanti con pezzi in rotazione (rischio trascinamento).",
        "Ignorare vibrazioni / rumori strani: STOP e chiama il docente.",
    ]
    bad_step = max(40, (bad_h - 55) // len(bad))
    for i, ln in enumerate(bad):
        d.text((40, y + 6 + i * bad_step), f"✗  {ln}", fill=WARN, font=F14)

    dat_y = bad_y + bad_h + 12
    y = panel(d, 24, dat_y, W - 48, FOOT - dat_y - 8, "DATI ALUNNO / VERIFICA")
    d.text((36, y + 16), "Alunno/a: _____________________  Classe: ______  Data: __/__/____", fill=BLACK, font=F15)
    d.text((36, y + 56), "Ho saputo indicare almeno 8 parti e 6 leve:  SÌ □    NO □", fill=BLACK, font=F15)
    d.text((36, y + 96), "Firma docente: _______________________    Voto: ______", fill=BLACK, font=F15)

    save(img, "07-tornio-uso-sicurezza.png", "STAMPA-tornio-uso-sicurezza.png")


if __name__ == "__main__":
    make_parti()
    make_leve_full()
    make_uso()
    print("ALL DONE")

#!/usr/bin/env python3
"""Schede A4 — parti del tornio manuale + leve/comandi (disegno preciso)."""
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
GRAY = (45, 45, 45)
LIGHT = (224, 224, 224)
ACCENT = (0, 55, 100)
WHITE = (255, 255, 255)
SOFT = (170, 170, 170)
BED = (108, 116, 126)
HEAD = (78, 86, 98)
CAST = (148, 154, 162)
CAST_D = (105, 112, 122)
WARN_BG = (255, 244, 230)
WARN = (120, 50, 10)
BLUE_BG = (232, 240, 248)
FOOT = H - 48


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


F11 = font_b(17)
F12 = font_b(18)
F13 = font_b(20)
F14 = font_b(22)
F15 = font_b(23)
F18 = font_b(26)
F22 = font_b(30)
Fm = font_b(16)
Fs = font(15)


def new_sheet(titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, W - 10, H - 10], outline=BLACK, width=2)
    d.rectangle([10, 10, W - 10, 88], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, 20), titolo, fill=BLACK, font=F22)
    d.text((24, 54), sub, fill=GRAY, font=F12)
    d.rectangle([W - 210, 20, W - 24, 74], outline=ACCENT, width=2)
    d.text((W - 198, 28), "TORNIO", fill=ACCENT, font=F13)
    d.text((W - 198, 50), "MANUALE", fill=ACCENT, font=F13)
    d.rectangle([10, FOOT, W - 10, H - 10], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, FOOT + 12), "Laboratorio meccanico · scheda didattica · tenere vicino al tornio", fill=GRAY, font=Fm)
    return img, d


def panel(d, x, y, w, h, title, fill=LIGHT):
    hdr = 34
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + hdr], fill=fill, outline=BLACK, width=2)
    d.text((x + 12, y + 7), title, fill=BLACK, font=F13)
    return y + hdr + 10


def callout(d, n, tx, ty, lx, ly):
    r = 14
    d.line([tx, ty, lx, ly], fill=ACCENT, width=2)
    d.ellipse([lx - 4, ly - 4, lx + 4, ly + 4], fill=BLACK)
    d.ellipse([tx - r, ty - r, tx + r, ty + r], fill=ACCENT, outline=BLACK, width=1)
    tw = d.textlength(str(n), font=F13)
    d.text((tx - tw / 2, ty - 9), str(n), fill=WHITE, font=F13)


def save(img, name, stampa=None):
    img.save(os.path.join(OUT, name), "PNG", optimize=True)
    img.save(os.path.join(GAL, name), "PNG", optimize=True)
    img.save(os.path.join(ART, name), "PNG", optimize=True)
    if stampa:
        img.save(os.path.join(ART, stampa), "PNG", optimize=True)
    print("saved", name)


def draw_lathe(d, ox=40, oy=200):
    """Disegno laterale più dettagliato e grande del tornio parallelo.
    Ritorna dict di punti chiave per i callout.
    """
    # Coordinate relative
    bed_y = oy + 340
    bed_x1, bed_x2 = ox + 40, ox + 1120

    # —— Bancale (letto) con guide a V stilizzate ——
    d.rectangle([bed_x1, bed_y, bed_x2, bed_y + 70], fill=BED, outline=BLACK, width=2)
    # guide superiori
    d.line([bed_x1 + 20, bed_y + 8, bed_x2 - 20, bed_y + 8], fill=SOFT, width=2)
    d.line([bed_x1 + 20, bed_y + 18, bed_x2 - 20, bed_y + 18], fill=SOFT, width=1)
    # piedi
    d.rectangle([bed_x1 + 30, bed_y + 70, bed_x1 + 130, bed_y + 170], fill=CAST_D, outline=BLACK, width=2)
    d.rectangle([bed_x2 - 130, bed_y + 70, bed_x2 - 30, bed_y + 170], fill=CAST_D, outline=BLACK, width=2)
    # vasca
    d.rectangle([bed_x1 + 10, bed_y + 155, bed_x2 - 10, bed_y + 185], fill=CAST, outline=BLACK, width=1)

    # —— Testa motrice ——
    hx1, hx2 = bed_x1, bed_x1 + 280
    hy1 = oy + 40
    d.rectangle([hx1, hy1, hx2, bed_y], fill=HEAD, outline=BLACK, width=2)
    # finestrella / carter
    d.rectangle([hx1 + 20, hy1 + 30, hx1 + 120, hy1 + 120], fill=CAST_D, outline=BLACK, width=1)
    d.rectangle([hx1 + 140, hy1 + 30, hx1 + 250, hy1 + 90], fill=CAST, outline=BLACK, width=1)
    # leve velocità (3)
    for i, lx in enumerate([hx1 + 40, hx1 + 90, hx1 + 140]):
        d.rectangle([lx, hy1 + 150, lx + 28, hy1 + 175], fill=CAST_D, outline=BLACK, width=1)
        d.line([lx + 14, hy1 + 175, lx + 14, hy1 + 210], fill=BLACK, width=3)
        d.ellipse([lx + 6, hy1 + 205, lx + 22, hy1 + 221], fill=ACCENT, outline=BLACK)
    # mandrino / griffe
    chuck_cx, chuck_cy = hx2 + 40, oy + 220
    d.ellipse([chuck_cx - 55, chuck_cy - 55, chuck_cx + 55, chuck_cy + 55], fill=CAST, outline=BLACK, width=2)
    d.ellipse([chuck_cx - 35, chuck_cy - 35, chuck_cx + 35, chuck_cy + 35], fill=CAST_D, outline=BLACK, width=2)
    d.ellipse([chuck_cx - 12, chuck_cy - 12, chuck_cx + 12, chuck_cy + 12], fill=WHITE, outline=BLACK, width=1)
    # 3 griffe hint
    for ang in (90, 210, 330):
        a = math.radians(ang)
        d.line(
            [
                chuck_cx + 14 * math.cos(a),
                chuck_cy - 14 * math.sin(a),
                chuck_cx + 48 * math.cos(a),
                chuck_cy - 48 * math.sin(a),
            ],
            fill=BLACK,
            width=3,
        )

    # —— Pezzo ——
    pz1 = chuck_cx + 50
    pz2 = ox + 820
    d.rectangle([pz1, chuck_cy - 14, pz2, chuck_cy + 14], fill=(195, 175, 140), outline=BLACK, width=2)
    # asse
    d.line([hx1 + 10, chuck_cy, ox + 1080, chuck_cy], fill=(120, 120, 120), width=1)

    # —— Contropunta ——
    tx1, tx2 = ox + 880, ox + 1080
    d.rectangle([tx1, oy + 140, tx2, bed_y], fill=CAST, outline=BLACK, width=2)
    # canotto
    d.rectangle([tx1 - 70, chuck_cy - 18, tx1 + 10, chuck_cy + 18], fill=CAST_D, outline=BLACK, width=2)
    # punta
    d.polygon(
        [
            (tx1 - 70, chuck_cy - 10),
            (tx1 - 95, chuck_cy),
            (tx1 - 70, chuck_cy + 10),
        ],
        fill=SOFT,
        outline=BLACK,
    )
    # volantino contropunta
    d.ellipse([tx2 - 10, chuck_cy - 40, tx2 + 70, chuck_cy + 40], fill=CAST_D, outline=BLACK, width=2)
    d.ellipse([tx2 + 15, chuck_cy - 18, tx2 + 50, chuck_cy + 18], fill=WHITE, outline=BLACK, width=1)
    # leva blocco canotto
    d.rectangle([tx1 + 40, oy + 155, tx1 + 100, oy + 175], fill=ACCENT, outline=BLACK, width=1)
    # leva blocco contropunta sul letto
    d.rectangle([tx1 + 20, bed_y - 35, tx1 + 90, bed_y - 10], fill=ACCENT, outline=BLACK, width=1)

    # —— Carrello ——
    cx1, cx2 = ox + 480, ox + 720
    d.rectangle([cx1, oy + 250, cx2, bed_y], fill=CAST, outline=BLACK, width=2)
    # grembiule
    d.rectangle([cx1, oy + 300, cx2, bed_y], fill=CAST_D, outline=BLACK, width=2)
    # slitta trasversale
    d.rectangle([cx1 + 30, oy + 175, cx2 - 30, oy + 250], fill=CAST, outline=BLACK, width=2)
    # slitta superiore / torretta
    d.rectangle([cx1 + 70, oy + 100, cx2 - 70, oy + 175], fill=HEAD, outline=BLACK, width=2)
    # utensile
    d.polygon(
        [
            (cx1 + 95, oy + 115),
            (cx1 + 160, oy + 115),
            (cx1 + 175, oy + 140),
            (cx1 + 95, oy + 140),
        ],
        fill=(40, 40, 40),
        outline=BLACK,
    )
    d.line([cx1 + 175, oy + 128, pz1 + 200, chuck_cy - 14], fill=BLACK, width=2)

    # volantino longitudinale (grande, grembiule)
    d.ellipse([cx1 + 25, oy + 320, cx1 + 95, oy + 390], fill=CAST, outline=BLACK, width=2)
    d.ellipse([cx1 + 45, oy + 340, cx1 + 75, oy + 370], fill=WHITE, outline=BLACK, width=1)
    # volantino trasversale
    d.ellipse([cx1 + 120, oy + 200, cx1 + 175, oy + 255], fill=CAST_D, outline=BLACK, width=2)
    d.ellipse([cx1 + 135, oy + 215, cx1 + 160, oy + 240], fill=WHITE, outline=BLACK, width=1)
    # volantino slitta superiore
    d.ellipse([cx2 - 55, oy + 110, cx2 - 15, oy + 150], fill=CAST_D, outline=BLACK, width=2)
    # leve avanzamento sul grembiule
    d.rectangle([cx1 + 160, oy + 330, cx1 + 200, oy + 355], fill=ACCENT, outline=BLACK, width=1)
    d.rectangle([cx1 + 210, oy + 330, cx1 + 250, oy + 355], fill=ACCENT, outline=BLACK, width=1)

    # —— Vite madre ——
    d.rectangle([hx2, bed_y + 12, tx1, bed_y + 28], fill=(55, 55, 55), outline=BLACK, width=1)
    for i in range(20):
        x = hx2 + 15 + i * 28
        if x < tx1 - 10:
            d.line([x, bed_y + 12, x + 10, bed_y + 28], fill=SOFT, width=1)
    # —— Barra di comando ——
    d.rectangle([hx2, bed_y + 36, tx1, bed_y + 48], fill=(40, 40, 40), outline=BLACK, width=1)

    pts = {
        1: (hx1 + 140, hy1 + 60),           # testa motrice
        2: (chuck_cx, chuck_cy),             # mandrino
        3: ((bed_x1 + bed_x2) / 2, bed_y + 35),  # bancale
        4: ((cx1 + cx2) / 2, oy + 280),      # carrello
        5: ((cx1 + cx2) / 2, oy + 210),      # slitta trasversale
        6: ((cx1 + cx2) / 2 - 20, oy + 130), # torretta
        7: ((tx1 + tx2) / 2, oy + 200),      # contropunta
        8: (tx1 - 30, chuck_cy),             # canotto
        9: ((hx2 + tx1) / 2, bed_y + 20),    # vite madre
        10: ((hx2 + tx1) / 2, bed_y + 42),   # barra
        11: (cx1 + 60, oy + 355),            # volantino long.
        12: (bed_x1 + 80, bed_y + 120),      # piede
    }
    return pts


def make_parti():
    img, d = new_sheet(
        "TORNIO MANUALE — LE PARTI",
        "Schema laterale dettagliato · nomi e funzione (tornio parallelo)",
    )

    draw_h = 640
    y = panel(d, 24, 100, W - 48, draw_h, "SCHEMA LATERALE — tornio parallelo")
    pts = draw_lathe(d, ox=30, oy=130)

    # Callout positions (around the drawing, no overlap)
    callouts = [
        (1, 55, 150),
        (2, 380, 145),
        (3, 640, 700),
        (4, 430, 600),
        (5, 780, 190),
        (6, 560, 120),
        (7, 1180, 190),
        (8, 820, 145),
        (9, 900, 690),
        (10, 400, 710),
        (11, 430, 660),
        (12, 160, 720),
    ]
    for n, tx, ty in callouts:
        lx, ly = pts[n]
        callout(d, n, tx, ty, lx, ly)

    # Legenda compatta a 2 colonne
    y = panel(d, 24, 760, W - 48, FOOT - 760 - 8, "LEGENDA — PARTI PRINCIPALI")
    parts = [
        ("1", "Testa motrice", "Mandrino, ingranaggi, comandi velocità."),
        ("2", "Mandrino a griffe", "Serraggio pezzo (3 o 4 griffe)."),
        ("3", "Bancale (letto)", "Guide per carrello e contropunta."),
        ("4", "Carrello (carro)", "Avanzamento longitudinale + grembiule."),
        ("5", "Slitta trasversale", "Profondità di passata (asse X)."),
        ("6", "Torretta / utensile", "Fissa l’utensile; slitta orientabile."),
        ("7", "Contropunta", "Sostiene pezzi lunghi / foratura."),
        ("8", "Canotto", "Avanza punta o centro."),
        ("9", "Vite madre", "Solo per filettatura."),
        ("10", "Barra di comando", "Avanzamento automatico (non filetto)."),
        ("11", "Volantino longitudinale", "Movimento manuale del carrello."),
        ("12", "Basamento / piedi", "Sostegno + vasca trucioli."),
    ]
    for i, (n, title, desc) in enumerate(parts):
        col = i % 2
        row = i // 2
        xx = 40 + col * 590
        yy = y + 6 + row * 48
        d.ellipse([xx, yy, xx + 26, yy + 26], fill=ACCENT, outline=BLACK)
        tw = d.textlength(n, font=F12)
        d.text((xx + 13 - tw / 2, yy + 4), n, fill=WHITE, font=F12)
        d.text((xx + 34, yy + 1), title, fill=BLACK, font=F13)
        d.text((xx + 34, yy + 22), desc, fill=GRAY, font=Fs)

    save(img, "05-tornio-parti.png", "STAMPA-tornio-parti.png")


def make_leve_full():
    img, d = new_sheet(
        "TORNIO MANUALE — LEVE E COMANDI",
        "A cosa serve ogni leva / volantino (imparale prima di accendere)",
    )

    regola_y, regola_h = 100, 110
    y = panel(d, 24, regola_y, W - 48, regola_h, "REGOLA D’ORO", fill=WARN_BG)
    d.text((36, y + 4), "Macchina FERMA per: cambiare velocità · invertire senso · spostare contropunta.", fill=WARN, font=F13)
    d.text((36, y + 32), "Occhiali sempre. Capelli/maniche raccolti. Non toccare pezzo o mandrino in moto.", fill=WARN, font=F13)

    # Mini lathe strip
    y = panel(d, 24, regola_y + regola_h + 12, W - 48, 260, "POSIZIONE DEI COMANDI (schema semplificato)")
    my = 320
    # bed
    d.rectangle([60, my + 80, 1160, my + 120], fill=BED, outline=BLACK, width=2)
    # headstock
    d.rectangle([60, my - 40, 280, my + 80], fill=HEAD, outline=BLACK, width=2)
    d.ellipse([250, my + 5, 330, my + 85], fill=CAST, outline=BLACK, width=2)
    # carriage
    d.rectangle([520, my + 10, 720, my + 80], fill=CAST, outline=BLACK, width=2)
    d.rectangle([540, my - 40, 700, my + 10], fill=CAST_D, outline=BLACK, width=2)
    d.rectangle([580, my - 80, 660, my - 40], fill=HEAD, outline=BLACK, width=2)
    # handwheels
    d.ellipse([540, my + 35, 600, my + 95], fill=CAST_D, outline=BLACK, width=2)
    d.ellipse([620, my - 20, 665, my + 25], fill=CAST_D, outline=BLACK, width=2)
    # tailstock
    d.rectangle([900, my - 10, 1100, my + 80], fill=CAST, outline=BLACK, width=2)
    d.ellipse([1080, my + 10, 1150, my + 80], fill=CAST_D, outline=BLACK, width=2)
    # lead screw
    d.rectangle([280, my + 90, 900, my + 102], fill=(50, 50, 50), outline=BLACK, width=1)
    # workpiece
    d.rectangle([330, my + 30, 900, my + 50], fill=(195, 175, 140), outline=BLACK, width=1)

    def letter(x, y_, L):
        d.rectangle([x, y_, x + 24, y_ + 24], fill=ACCENT, outline=BLACK)
        d.text((x + 5, y_ + 3), L, fill=WHITE, font=F12)

    letter(90, my - 30, "A")   # velocità
    letter(160, my + 20, "B")  # senso
    letter(100, my + 45, "C")  # start
    letter(545, my + 100, "D") # vol long
    letter(630, my - 45, "E")  # vol trasv
    letter(670, my - 95, "F")  # slitta sup
    letter(700, my + 40, "G")  # blocco carrello
    letter(560, my + 55, "H")  # avv long
    letter(650, my + 55, "I")  # avv trasv
    letter(400, my + 105, "J") # vite madre
    letter(1090, my - 20, "K") # vol contropunta
    letter(940, my - 5, "L")   # blocco canotto
    letter(960, my + 55, "M")  # blocco contropunta
    letter(600, my - 95, "N")  # blocco utensile

    # Tabelle comandi
    left = [
        ("A", "Selettore velocità", "Giri/min mandrino. Bassi = pezzi grandi / zigrinatura / acciaio. Alti = pezzi piccoli / finitura. Solo a macchina ferma."),
        ("B", "Senso di rotazione", "Orario / antiorario. Inverti solo a FERMO."),
        ("C", "Avvio / STOP", "Moto mandrino. Impara dove sta l’emergenza sul tuo tornio."),
        ("D", "Volantino longitudinale", "Muove a mano il carrello lungo il pezzo (asse Z)."),
        ("E", "Volantino trasversale", "Profondità di passata: avvicina/allontana l’utensile (asse X)."),
        ("F", "Volantino slitta superiore", "Smussi, conicità, piccole correzioni."),
        ("G", "Bloccaggio carrello", "Fissa il carrello sul bancale (es. in sfacciatura)."),
    ]
    right = [
        ("H", "Avanzamento longitudinale", "Automatico lungo il pezzo (barra di comando). Per cilindri lunghi."),
        ("I", "Avanzamento trasversale", "Automatico in profondità (sfacciatura). Mai insieme ad H."),
        ("J", "Vite madre (filettatura)", "Innesto per filettare. Solo con rapporti giusti. Mai con H/I."),
        ("K", "Volantino contropunta", "Fa uscire/rientrate il canotto (centro o punta)."),
        ("L", "Bloccaggio canotto", "Blocca il canotto dopo il posizionamento."),
        ("M", "Bloccaggio contropunta", "Fissa la contropunta sul bancale."),
        ("N", "Bloccaggio utensile", "Serraggio sulla torretta. Utensile a centro pezzo."),
    ]

    com_y = regola_y + regola_h + 12 + 260 + 14
    y = panel(d, 24, com_y, 580, FOOT - com_y - 8, "COMANDI A – G")
    yy = y + 2
    for n, title, desc in left:
        d.rectangle([36, yy, 62, yy + 24], fill=ACCENT, outline=BLACK)
        d.text((42, yy + 3), n, fill=WHITE, font=F12)
        d.text((70, yy + 2), title, fill=BLACK, font=F13)
        # wrap
        words = desc.split()
        line, ly = "", yy + 26
        for w_ in words:
            test = (line + " " + w_).strip()
            if d.textlength(test, font=Fs) > 530:
                d.text((70, ly), line, fill=GRAY, font=Fs)
                ly += 16
                line = w_
            else:
                line = test
        if line:
            d.text((70, ly), line, fill=GRAY, font=Fs)
            ly += 16
        yy = ly + 8

    y = panel(d, 620, com_y, W - 24 - 620, FOOT - com_y - 8, "COMANDI H – N")
    yy = y + 2
    for n, title, desc in right:
        d.rectangle([632, yy, 658, yy + 24], fill=ACCENT, outline=BLACK)
        d.text((638, yy + 3), n, fill=WHITE, font=F12)
        d.text((666, yy + 2), title, fill=BLACK, font=F13)
        words = desc.split()
        line, ly = "", yy + 26
        for w_ in words:
            test = (line + " " + w_).strip()
            if d.textlength(test, font=Fs) > 520:
                d.text((666, ly), line, fill=GRAY, font=Fs)
                ly += 16
                line = w_
            else:
                line = test
        if line:
            d.text((666, ly), line, fill=GRAY, font=Fs)
            ly += 16
        yy = ly + 8

    save(img, "06-tornio-leve.png", "STAMPA-tornio-leve.png")


def make_uso():
    img, d = new_sheet(
        "TORNIO MANUALE — SEQUENZA DI LAVORO",
        "Ordine corretto delle operazioni + errori da non fare",
    )

    y = panel(d, 24, 100, W - 48, 560, "SEQUENZA TIPICA (tornitura di un cilindro)")
    steps = [
        ("1", "Controllo macchina", "Pulizia, protezioni, livello olio, STOP emergenza individuato."),
        ("2", "Montaggio pezzo", "Nel mandrino (o tra centri). Serraggio forte; pezzo corto se possibile."),
        ("3", "Montaggio utensile", "A centro pezzo, sporgenza minima, ben bloccato sulla torretta."),
        ("4", "Contropunta (se serve)", "Punta sul centro; blocca canotto e contropunta sul bancale."),
        ("5", "Scelta giri", "A macchina FERMA. n ≈ (v×1000)/(π×Ø) — chiedi al docente la velocità di taglio v."),
        ("6", "Avvicinamento", "A mano coi volantini: tocca il pezzo, azzera i tamburi/quote se presenti."),
        ("7", "Passata", "Profondità col volantino trasversale; avanza lungo il pezzo (mano o automatico)."),
        ("8", "Misura", "Ferma, misura col calibro, correggi. Ripeti fino a quota."),
        ("9", "Finitura", "Passata leggera, giri più alti se possibile, buona lubrificazione."),
        ("10", "Fine lavoro", "Arresto → togli utensile/pezzo → pulizia bancale e vasca trucioli."),
    ]
    for i, (n, t, desc) in enumerate(steps):
        yy = y + 4 + i * 50
        d.ellipse([40, yy, 68, yy + 28], fill=ACCENT, outline=BLACK)
        tw = d.textlength(n, font=F12)
        d.text((54 - tw / 2, yy + 5), n, fill=WHITE, font=F12)
        d.text((80, yy + 2), t, fill=BLACK, font=F14)
        d.text((80, yy + 26), desc, fill=GRAY, font=F12)

    y = panel(d, 24, 676, W - 48, 400, "NON FARE MAI", fill=WARN_BG)
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
    for i, ln in enumerate(bad):
        d.text((40, y + 6 + i * 44), f"✗  {ln}", fill=WARN, font=F13)

    y = panel(d, 24, 1092, W - 48, FOOT - 1092 - 8, "DATI ALUNNO / VERIFICA")
    d.text((36, y + 10), "Alunno/a: _____________________  Classe: ______  Data: __/__/____", fill=BLACK, font=F13)
    d.text((36, y + 48), "Ho saputo indicare almeno 8 parti e 6 leve:  SÌ □    NO □", fill=BLACK, font=F13)
    d.text((36, y + 86), "Firma docente: _______________________    Voto: ______", fill=BLACK, font=F13)

    save(img, "07-tornio-uso-sicurezza.png", "STAMPA-tornio-uso-sicurezza.png")


if __name__ == "__main__":
    make_parti()
    make_leve_full()
    make_uso()
    print("ALL DONE")

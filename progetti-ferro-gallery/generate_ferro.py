#!/usr/bin/env python3
"""Schede A4 — progetti FERRO al tornio (2ª–5ª), grezzo Ø20×100 mm.
Pezzi utili e stimolanti + guida zigrinatura."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

OUT = "/opt/cursor/artifacts/progetti-ferro"
GAL = "/workspace/progetti-ferro-gallery"
os.makedirs(OUT, exist_ok=True)
os.makedirs(GAL, exist_ok=True)

W, H = 1240, 1754
BLACK = (0, 0, 0)
GRAY = (50, 50, 50)
LIGHT = (226, 226, 226)
STEEL = (165, 173, 182)
STEEL_D = (115, 124, 134)
BRASS = (196, 164, 90)
ACCENT = (0, 55, 100)
WHITE = (255, 255, 255)
SOFT = (195, 195, 195)
WARN_BG = (255, 244, 230)
WARN = (120, 50, 10)
OK_BG = (230, 242, 235)

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


F11, F12, F13, F14 = font_b(19), font_b(20), font_b(21), font_b(22)
F15b, F16b, F18b, F22b = font_b(23), font_b(24), font_b(27), font_b(32)
Fm = font_b(18)
Fsmall = font(16)


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


def panel(d, x, y, w, h, title, fill=LIGHT):
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + 30], fill=fill, outline=BLACK, width=2)
    d.text((x + 10, y + 5), title, fill=BLACK, font=F15b)
    return y + 36


def dim_h(d, x1, x2, y, label):
    d.line([x1, y, x2, y], fill=BLACK, width=2)
    d.line([x1, y - 5, x1, y + 5], fill=BLACK, width=2)
    d.line([x2, y - 5, x2, y + 5], fill=BLACK, width=2)
    tw = d.textlength(label, font=F13)
    lx = (x1 + x2) / 2 - tw / 2
    d.rectangle([lx - 2, y - 17, lx + tw + 2, y - 2], fill=WHITE)
    d.text((lx, y - 16), label, fill=BLACK, font=F13)


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


def bullets(d, x, y, lines, fnt=F12, step=24):
    for i, ln in enumerate(lines):
        d.text((x, y + i * step), "•  " + ln, fill=BLACK, font=fnt)
    return y + len(lines) * step


def student_block(d, x, y, y_max):
    fields = [
        "Alunno/a: ________________________________",
        "Classe: ________    Data: ____ / ____ / ______",
        "Voto /10: ______    Firma docente: _______________",
        "Note sicurezza / osservazioni: _______________________________",
    ]
    yy = y
    for ln in fields:
        if yy > y_max - 22:
            break
        d.text((x, yy), ln, fill=BLACK, font=F12)
        yy += 28


def knurl_pattern(d, x, y, w, h, step=9):
    """Draw diamond knurl hatch inside a rectangle."""
    d.rectangle([x, y, x + w, y + h], fill=STEEL, outline=BLACK, width=2)
    # clip-like: only draw lines inside by intersecting conceptually with short segments
    for i in range(-int(h), int(w + h), step):
        x1 = x + max(i, 0)
        y1 = y + max(-i, 0)
        x2 = x + min(i + h, w)
        y2 = y + min(h, w - i) if i < w else y + h
        # diagonal \
        xa, ya = x + max(i, 0), y + max(0, -i) if False else None
    # simpler cross-hatch
    for i in range(0, int(w + h), step):
        # \
        p1 = (x + i, y)
        p2 = (x + i - h, y + h)
        if i < w:
            d.line([x + i, y + 2, x + i - (h - 4), y + h - 2], fill=SOFT, width=1)
        # /
        d.line([x + i - h + 4, y + 2, x + i, y + h - 2], fill=SOFT, width=1)


def save(img, name):
    img.save(os.path.join(OUT, name), "PNG", optimize=True)
    img.save(os.path.join(GAL, name), "PNG", optimize=True)
    # stampa copies
    short = name.replace("01-", "").replace("02-", "").replace("03-", "").replace("04-", "")
    img.save(os.path.join("/opt/cursor/artifacts", f"STAMPA-{short}"), "PNG", optimize=True)
    print("saved", name)


# ═══════════════════════════════════════════════════════════
# 2ª — APRIBOTTIGLIE
# ═══════════════════════════════════════════════════════════
def make_2a():
    img, d = new_sheet(
        "2ª CLASSE",
        "APRIBOTTIGLIE",
        "Grezzo Ø20 × 100 mm  ·  pezzo figo da portare a casa e usare subito",
    )
    y = panel(d, 28, 118, W - 56, 100, "PERCHÉ QUESTO PEZZO")
    bullets(
        d,
        40,
        y,
        [
            "Utile davvero: apre bottiglie, lo tieni nel cassetto o nel mazzo chiavi.",
            "Al tornio: sfacciatura, tornitura, foro, smussi — poi lima per il gancio.",
            "Dal grezzo Ø20×100 ricavi il corpo L=80 (avanzo ≈20 mm per prove).",
        ],
    )

    y = panel(d, 28, 234, W - 56, 480, "DISEGNO TECNICO — vista laterale (scala ~3,5:1)")
    # Body Ø16×55 + head Ø18×15 with hole + hook tip 10 → ~80
    sc = 3.5
    ox, mid = 90, 400
    # shaft
    d.rectangle([ox, mid - 8 * sc, ox + 55 * sc, mid + 8 * sc], fill=STEEL, outline=BLACK, width=2)
    # head thicker
    d.rectangle([ox + 55 * sc, mid - 9 * sc, ox + 70 * sc, mid + 9 * sc], fill=STEEL_D, outline=BLACK, width=2)
    # hole in head
    hc = ox + 62 * sc
    d.ellipse([hc - 3 * sc, mid - 3 * sc, hc + 3 * sc, mid + 3 * sc], outline=BLACK, width=2)
    d.text((hc - 14, mid - 9 * sc - 22), "Ø6", fill=BLACK, font=F12)
    # hook / lever tip (bottle opener lip) — triangular beak under head
    tip_x = ox + 70 * sc
    d.polygon(
        [
            (tip_x, mid - 4 * sc),
            (tip_x + 12 * sc, mid + 2 * sc),
            (tip_x, mid + 9 * sc),
        ],
        fill=STEEL_D,
        outline=BLACK,
    )
    d.line([ox - 12, mid, tip_x + 14 * sc, mid], fill=SOFT, width=1)

    dim_h(d, ox, ox + 55 * sc, mid - 9 * sc - 28, "55")
    dim_h(d, ox + 55 * sc, tip_x + 12 * sc, mid - 9 * sc - 28, "25")
    dim_h(d, ox, tip_x + 12 * sc, mid + 9 * sc + 36, "80")
    dim_v(d, mid - 8 * sc, mid + 8 * sc, ox - 36, "Ø16")
    dim_v(d, mid - 9 * sc, mid + 9 * sc, tip_x + 12 * sc + 28, "Ø18")

    d.text((ox, mid + 9 * sc + 68), "Gancio a leva: dopo la tornitura, limare a forma di uncino (vedi schema).", fill=GRAY, font=F12)
    # small hook detail sketch
    d.text((720, 280), "Dettaglio gancio (vista)", fill=BLACK, font=F13)
    gx, gy = 760, 340
    d.rectangle([gx, gy, gx + 70, gy + 50], fill=STEEL, outline=BLACK, width=2)
    d.arc([gx + 40, gy + 15, gx + 95, gy + 70], 200, 40, fill=BLACK, width=3)
    d.text((gx, gy + 60), "uncino sotto il", fill=GRAY, font=Fsmall)
    d.text((gx, gy + 78), "bordo della capsula", fill=GRAY, font=Fsmall)

    y = panel(d, 28, 730, 580, 300, "GREZZO · FASI · DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Grezzo", "Q.tà"],
        [
            ["Corpo apribottiglie", "Acciaio S235/C40", "Ø20 × 100", "1"],
            ["Anello (opzionale)", "Acciaio zincato", "Ø25", "1"],
        ],
        [170, 160, 130, 60],
    )
    bullets(
        d,
        40,
        y + 100,
        [
            "1) Sfacciatura → L=80",
            "2) Corpo Ø16 e testa Ø18",
            "3) Foro Ø6 sulla testa",
            "4) Smussi 1×45°",
            "5) Limatura uncino + carteggio",
            "6) Prova su bottiglia (con docente)",
        ],
        F12,
        26,
    )

    y2 = panel(d, 628, 730, W - 28 - 628, 300, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ L = 80 ±0,5",
            "□ Ø corpo 16 ±0,2",
            "□ Foro Ø6 pulito",
            "□ Uncino senza bave",
            "□ Apre davvero la capsula",
            "□ Superficie satinata",
            "□ Sicuro da impugnare",
        ]
    ):
        d.text((642, y2 + 8 + i * 30), ln, fill=BLACK, font=F13)

    y = panel(d, 28, 1050, W - 56, FOOT_TOP - 1050 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 6, FOOT_TOP - 16)
    save(img, "01-2a-apribottiglie.png")


# ═══════════════════════════════════════════════════════════
# 3ª — POMOLO MANIGLIA (con intro zigrinatura)
# ═══════════════════════════════════════════════════════════
def make_3a():
    img, d = new_sheet(
        "3ª CLASSE",
        "POMOLO MANIGLIA M8",
        "Grezzo Ø20 × 100 mm  ·  pomolo zigrinato per cassetto / anta — regalo utile",
    )
    y = panel(d, 28, 118, W - 56, 100, "PERCHÉ QUESTO PEZZO")
    bullets(
        d,
        40,
        y,
        [
            "Si monta su cassetto o anta (filetto M8): pezzo che si vede e si usa ogni giorno.",
            "Introduzione alla zigrinatura (presa antiscivolo) + filettatura interna o vite prigioniera.",
            "Finitura bella = pezzo da mostrare a casa.",
        ],
    )

    y = panel(d, 28, 234, W - 56, 400, "DISEGNO TECNICO — pomolo (scala ~4:1)")
    sc = 4.0
    ox, mid = 120, 380
    # knob: Ø20×18 knurled + neck Ø12×8 + boss Ø14×10 with M8 = 36 total from one end of bar
    # Use L=36 finished from 100 stock
    knurl_pattern(d, ox, mid - 10 * sc, 18 * sc, 20 * sc, step=8)
    d.rectangle([ox + 18 * sc, mid - 6 * sc, ox + 26 * sc, mid + 6 * sc], fill=STEEL_D, outline=BLACK, width=2)
    d.rectangle([ox + 26 * sc, mid - 7 * sc, ox + 36 * sc, mid + 7 * sc], fill=STEEL, outline=BLACK, width=2)
    # M8 hole dashed on boss end
    d.line([ox + 28 * sc, mid, ox + 36 * sc + 8, mid], fill=BLACK, width=1)
    d.text((ox + 36 * sc + 12, mid - 10), "M8×1,25", fill=BLACK, font=F13)
    d.text((ox + 36 * sc + 12, mid + 12), "(foro cieco 12 mm)", fill=GRAY, font=Fsmall)
    d.line([ox - 15, mid, ox + 36 * sc + 5, mid], fill=SOFT, width=1)

    dim_h(d, ox, ox + 18 * sc, mid - 10 * sc - 28, "18")
    dim_h(d, ox + 18 * sc, ox + 26 * sc, mid - 10 * sc - 28, "8")
    dim_h(d, ox + 26 * sc, ox + 36 * sc, mid - 10 * sc - 28, "10")
    dim_h(d, ox, ox + 36 * sc, mid + 10 * sc + 34, "36")
    dim_v(d, mid - 10 * sc, mid + 10 * sc, ox - 40, "Ø20")
    dim_v(d, mid - 6 * sc, mid + 6 * sc, ox + 22 * sc, "Ø12")

    d.text((ox, mid + 10 * sc + 62), "Zigrinatura a rombi (doppia) sul Ø20  ·  smusso 1×45° sul bordo pomolo", fill=GRAY, font=F12)

    # Mini knurl tip box
    d.rectangle([700, 270, 1180, 520], fill=WARN_BG, outline=WARN, width=2)
    d.text((715, 280), "PRIMA ZIGRINATURA — idea base", fill=WARN, font=F14)
    for i, ln in enumerate(
        [
            "1. Utensile a rullare a 2 rulli (rombi).",
            "2. Giri bassi: circa 60–100 giri/min.",
            "3. Abbondante olio da taglio.",
            "4. Avvicina i rulli al pezzo in moto,",
            "   poni pressione finché “mordono”.",
            "5. Avanza piano lungo i 18 mm.",
            "6. Il diametro cresce un po’: normale!",
            "   (non tornire dopo, se possibile)",
            "Dettaglio completo → scheda 4ª classe.",
        ]
    ):
        d.text((715, 312 + i * 22), ln, fill=BLACK, font=F12)

    y = panel(d, 28, 650, 580, 320, "GREZZO · FASI · DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Grezzo", "Q.tà"],
        [
            ["Pomolo", "Acciaio C40", "Ø20 × 100", "1"],
            ["Vite M8 (opz.)", "Acciaio 8.8", "M8 × 30", "1"],
        ],
        [120, 140, 140, 60],
    )
    bullets(
        d,
        40,
        y + 100,
        [
            "1) Sfacciatura → L=36",
            "2) Pomolo Ø20 + zigrinatura",
            "3) Collo Ø12 e boccola Ø14",
            "4) Foro Ø6,8 + maschio M8 cieco",
            "5) Smussi e satinatura",
            "6) Montaggio su anta/cassetto",
        ],
        F12,
        26,
    )

    y2 = panel(d, 628, 650, W - 28 - 628, 320, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ L = 36 ±0,3",
            "□ Zigrinatura regolare",
            "□ Nessun dente “saltato”",
            "□ Filetto M8 ok (vite entra)",
            "□ Presa comoda a mano",
            "□ Finitura da “oggetto bello”",
        ]
    ):
        d.text((642, y2 + 10 + i * 32), ln, fill=BLACK, font=F13)

    y = panel(d, 28, 990, W - 56, FOOT_TOP - 990 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 6, FOOT_TOP - 16)
    save(img, "02-3a-pomolo-maniglia.png")


# ═══════════════════════════════════════════════════════════
# 4ª — CACCIAVITE + GUIDA ZIGRINATURA COMPLETA
# ═══════════════════════════════════════════════════════════
def make_4a():
    img, d = new_sheet(
        "4ª CLASSE",
        "CACCIAVITE A TAGLIO",
        "Grezzo Ø20 × 100 mm  ·  utensile monopezzo + zigrinatura spiegata passo-passo",
    )
    y = panel(d, 28, 118, W - 56, 78, "PERCHÉ QUESTO PEZZO")
    bullets(
        d,
        40,
        y,
        [
            "Utensile vero: lo usi in officina e a casa. Manico zigrinato = non scivola.",
            "Qui impari bene la zigrinatura (vedi riquadro sotto) e la lama a taglio.",
        ],
        F12,
        24,
    )

    y = panel(d, 28, 212, W - 56, 300, "DISEGNO TECNICO — vista laterale (scala ~3,2:1)")
    sc = 3.2
    ox, mid = 70, 320
    # 42 knurl + 5 gola + 18 collo + 35 lama = 100
    knurl_pattern(d, ox, mid - 9 * sc, 42 * sc, 18 * sc, step=7)
    d.rectangle([ox + 42 * sc, mid - 5 * sc, ox + 47 * sc, mid + 5 * sc], fill=STEEL_D, outline=BLACK, width=2)
    d.rectangle([ox + 47 * sc, mid - 6 * sc, ox + 65 * sc, mid + 6 * sc], fill=STEEL, outline=BLACK, width=2)
    d.rectangle([ox + 65 * sc, mid - 4 * sc, ox + 95 * sc, mid + 4 * sc], fill=STEEL_D, outline=BLACK, width=2)
    tip = ox + 95 * sc
    d.polygon([(tip, mid - 4 * sc), (tip + 10 * sc, mid), (tip, mid + 4 * sc)], fill=STEEL_D, outline=BLACK)
    d.line([ox - 10, mid, tip + 12 * sc, mid], fill=SOFT, width=1)

    dim_h(d, ox, ox + 42 * sc, mid - 9 * sc - 24, "42")
    dim_h(d, ox + 42 * sc, ox + 47 * sc, mid - 9 * sc - 24, "5")
    dim_h(d, ox + 47 * sc, ox + 65 * sc, mid - 9 * sc - 24, "18")
    dim_h(d, ox + 65 * sc, tip + 10 * sc, mid - 9 * sc - 24, "35")
    dim_h(d, ox, tip + 10 * sc, mid + 9 * sc + 28, "100")
    dim_v(d, mid - 9 * sc, mid + 9 * sc, ox - 34, "Ø18")
    dim_v(d, mid - 6 * sc, mid + 6 * sc, ox + 56 * sc, "Ø12")
    dim_v(d, mid - 4 * sc, mid + 4 * sc, ox + 80 * sc, "Ø8")
    d.text((ox + 42 * sc - 6, mid + 9 * sc + 8), "gola Ø10", fill=GRAY, font=Fsmall)

    # ===== ZIGRINATURA HOW-TO (big panel) =====
    y = panel(d, 28, 528, W - 56, 520, "COME SI FA LA ZIGRINATURA (passo-passo)", fill=(220, 230, 240))

    # two columns
    left = [
        "COSA SERVE",
        "• Utensile zigrinatore a 2 rulli (rombi)",
        "• Olio da taglio / fluido abbondante",
        "• Pezzo già al diametro finito (Ø18)",
        "• Giri bassi, pezzo ben serrato",
        "",
        "PARAMETRI CONSIGLIATI (acciaio)",
        "• Velocità: 60–120 giri/min",
        "• Avanzamento: lento e costante",
        "• Pressione: aumenta a piccoli passi",
        "• Tipo: zigrinatura a rombi (doppia)",
    ]
    right = [
        "SEQUENZA OPERATIVA",
        "1. Monta lo zigrinatore sul carrello",
        "   (rulli allineati all’asse del pezzo).",
        "2. Metti in moto a giri bassi + olio.",
        "3. Avvicina i rulli finché toccano.",
        "4. Dai pressione: devono “entrare”",
        "   e creare il disegno a rombi.",
        "5. Avanza lungo tutto il manico (42 mm)",
        "   senza fermarti a metà.",
        "6. Controlla: rombi regolari, niente",
        "   doppie tracce / denti saltati.",
        "7. Non tornire dopo: rovinerebbe",
        "   la zigrinatura. Solo sbavatura leggera.",
    ]
    for i, ln in enumerate(left):
        f = F13 if ln and not ln.startswith("•") and not ln.startswith("PARAM") and ln == ln.upper() and len(ln) < 30 else F12
        if ln in ("COSA SERVE", "PARAMETRI CONSIGLIATI (acciaio)"):
            d.text((44, y + 4 + i * 22), ln, fill=ACCENT, font=F13)
        else:
            d.text((44, y + 4 + i * 22), ln, fill=BLACK, font=F12)
    for i, ln in enumerate(right):
        if ln == "SEQUENZA OPERATIVA":
            d.text((640, y + 4 + i * 22), ln, fill=ACCENT, font=F13)
        else:
            d.text((640, y + 4 + i * 22), ln, fill=BLACK, font=F12)

    # safety strip
    d.rectangle([40, y + 310, W - 40, y + 372], fill=WARN_BG, outline=WARN, width=2)
    d.text((52, y + 318), "SICUREZZA", fill=WARN, font=F13)
    d.text((52, y + 344), "Occhiali sempre · pezzo corto e ben bloccato · mai toccare i rulli in moto · se vibra: stop, riprendi con meno pressione.", fill=BLACK, font=F12)

    # checklist + student compact
    y = panel(d, 28, 1064, 700, FOOT_TOP - 1064 - 8, "CONTROLLO + DATI")
    d.text((40, y + 4), "□ Zigrinatura ok   □ L=100   □ Lama simmetrica   □ Prova vite M4/M5", fill=BLACK, font=F12)
    d.text((40, y + 36), "Alunno/a: _____________________  Classe: ______  Data: __/__/____", fill=BLACK, font=F12)
    d.text((40, y + 66), "Voto /10: ______  Firma docente: ________________", fill=BLACK, font=F12)
    d.text((40, y + 96), "Note: _______________________________________________", fill=BLACK, font=F12)

    y2 = panel(d, 748, 1064, W - 28 - 748, FOOT_TOP - 1064 - 8, "DISTINTA")
    d.text((760, y2 + 8), "1× barra Ø20×100 C40", fill=BLACK, font=F12)
    d.text((760, y2 + 36), "Olio da taglio", fill=BLACK, font=F12)
    d.text((760, y2 + 64), "Zigrinatore a rombi", fill=BLACK, font=F12)
    d.text((760, y2 + 92), "Lima fina (lama)", fill=BLACK, font=F12)

    save(img, "03-4a-cacciavite.png")


# ═══════════════════════════════════════════════════════════
# 5ª — MORSETTO A VITE (C-clamp mini) / vite di bloccaggio bella
# Actually: TIMBRINO PERSONALE or MORSETTO
# 5ª — VITE DI PRESSIONE CON POMOLO (clamp screw) useful in school
# Better liked: SET DA SCRIVANIA - fermacarte was boring
# 5ª MARTELLO migliorato estetico OR "CHIUDIPORTO / fermaporte elegante"
# I'll do: PUNZONE DI CENTRO + MANICO ZIGRINATO as precision tool
# OR: APPOGGIO / SUPPORTO UTENSILE
# Most stimulating: **Mini morsa a vite da banco** (body from bar + screw)
# ═══════════════════════════════════════════════════════════
def make_5a():
    img, d = new_sheet(
        "5ª CLASSE",
        "VITE DI BLOCCAGGIO M10",
        "Grezzo Ø20 × 100 mm  ·  vite a pomolo per fissare pezzi — resta in officina o a casa",
    )
    y = panel(d, 28, 118, W - 56, 100, "PERCHÉ QUESTO PEZZO")
    bullets(
        d,
        40,
        y,
        [
            "Serve davvero: stringe pezzi su dima, guida o morsa artigianale.",
            "Unisce zigrinatura + filettatura esterna M10 + spallamento di precisione.",
            "Progetto da 5ª: quote strette, finitura professionale, pezzo “da meccanico”.",
        ],
    )

    y = panel(d, 28, 234, W - 56, 420, "DISEGNO TECNICO — vista laterale (scala ~3,5:1)")
    sc = 3.5
    ox, mid = 80, 380
    # Pomolo zigrinato Ø20×22 + sottotesta Ø16×8 + gambo filettato M10×70 = 100
    knurl_pattern(d, ox, mid - 10 * sc, 22 * sc, 20 * sc, step=7)
    d.rectangle([ox + 22 * sc, mid - 8 * sc, ox + 30 * sc, mid + 8 * sc], fill=STEEL, outline=BLACK, width=2)
    # threaded shaft as rectangle with pitch marks
    sx = ox + 30 * sc
    d.rectangle([sx, mid - 5 * sc, sx + 70 * sc, mid + 5 * sc], fill=STEEL_D, outline=BLACK, width=2)
    for i in range(14):
        xx = sx + 4 + i * 5 * sc / 1.1
        if xx < sx + 68 * sc:
            d.line([xx, mid - 5 * sc, xx + 2, mid + 5 * sc], fill=SOFT, width=1)
    # tip chamfer
    d.polygon(
        [
            (sx + 70 * sc, mid - 5 * sc),
            (sx + 74 * sc, mid),
            (sx + 70 * sc, mid + 5 * sc),
        ],
        fill=STEEL_D,
        outline=BLACK,
    )
    d.line([ox - 12, mid, sx + 76 * sc, mid], fill=SOFT, width=1)

    dim_h(d, ox, ox + 22 * sc, mid - 10 * sc - 28, "22")
    dim_h(d, ox + 22 * sc, ox + 30 * sc, mid - 10 * sc - 28, "8")
    dim_h(d, sx, sx + 70 * sc, mid - 10 * sc - 28, "70")
    dim_h(d, ox, sx + 70 * sc, mid + 10 * sc + 34, "100")
    dim_v(d, mid - 10 * sc, mid + 10 * sc, ox - 38, "Ø20")
    dim_v(d, mid - 5 * sc, mid + 5 * sc, sx + 35 * sc, "M10")

    d.text((ox, mid + 10 * sc + 62), "Filetto M10 × 1,5  ·  zigrinatura a rombi sul pomolo  ·  smusso all’inizio filetto", fill=GRAY, font=F12)
    d.text((ox, mid + 10 * sc + 86), "Opzionale: punta bombata (per non segnare il pezzo) o punta piana.", fill=GRAY, font=F12)

    y = panel(d, 28, 670, 580, 300, "GREZZO · FASI · DISTINTA")
    table(
        d,
        40,
        y,
        ["Pezzo", "Materiale", "Grezzo", "Q.tà"],
        [["Vite di bloccaggio", "Acciaio C40", "Ø20 × 100", "1"]],
        [180, 140, 140, 60],
    )
    bullets(
        d,
        40,
        y + 80,
        [
            "1) Sfacciatura a L=100",
            "2) Pomolo Ø20 + zigrinatura",
            "3) Sottotesta Ø16",
            "4) Gambo Ø10 per 70 mm",
            "5) Filettatura M10×1,5 (filiera o tornio)",
            "6) Smusso ingresso filetto + finitura",
        ],
        F12,
        26,
    )

    y2 = panel(d, 628, 670, W - 28 - 628, 300, "CONTROLLO QUALITÀ")
    for i, ln in enumerate(
        [
            "□ L = 100 ±0,3",
            "□ Zigrinatura regolare",
            "□ Filetto entra in madrevite M10",
            "□ Nessuna sbavatura sul filetto",
            "□ Pomolo comodo da stringere",
            "□ Allineamento asse ok",
            "□ Aspetto “da banco”",
        ]
    ):
        d.text((642, y2 + 8 + i * 30), ln, fill=BLACK, font=F13)

    # quick knurl reminder
    d.rectangle([28, 990, W - 28, 1088], fill=OK_BG, outline=ACCENT, width=2)
    d.text((42, 1000), "RICORDA LA ZIGRINATURA (vedi scheda 4ª per i dettagli)", fill=ACCENT, font=F13)
    d.text((42, 1030), "Giri bassi · olio · pressione progressiva · non tornire dopo. Se i rombi “ballano”: riparti con pezzo più", fill=BLACK, font=F12)
    d.text((42, 1056), "rigido (contropunta) e meno avanzamento.", fill=BLACK, font=F12)

    y = panel(d, 28, 1100, W - 56, FOOT_TOP - 1100 - 8, "DATI ALUNNO")
    student_block(d, 40, y + 4, FOOT_TOP - 16)
    save(img, "04-5a-vite-bloccaggio.png")


if __name__ == "__main__":
    make_2a()
    make_3a()
    make_4a()
    make_5a()
    print("ALL DONE")

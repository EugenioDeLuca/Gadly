#!/usr/bin/env python3
"""Schede A4 — parti del tornio manuale + leve/comandi spiegati."""
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
LIGHT = (226, 226, 226)
ACCENT = (0, 55, 100)
WHITE = (255, 255, 255)
SOFT = (190, 190, 190)
BED = (120, 128, 138)
HEAD = (90, 98, 110)
CAST = (145, 152, 160)
CAST_D = (100, 108, 118)
WARN_BG = (255, 244, 230)
WARN = (120, 50, 10)
BLUE_BG = (232, 240, 248)
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


F11, F12, F13, F14 = font_b(18), font_b(19), font_b(20), font_b(21)
F15b, F16b, F18b, F22b = font_b(22), font_b(23), font_b(26), font_b(30)
Fm = font_b(17)
Fs = font(15)


def new_sheet(titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([12, 12, W - 12, H - 12], outline=BLACK, width=2)
    d.rectangle([12, 12, W - 12, 100], fill=(246, 246, 246), outline=BLACK, width=2)
    d.text((28, 24), titolo, fill=BLACK, font=F22b)
    d.text((28, 60), sub, fill=GRAY, font=F12)
    d.rectangle([W - 210, 24, W - 28, 82], outline=ACCENT, width=2)
    d.text((W - 196, 34), "TORNIO", fill=ACCENT, font=F14)
    d.text((W - 196, 56), "MANUALE", fill=ACCENT, font=F14)
    d.rectangle([12, FOOT_TOP, W - 12, H - 12], fill=(246, 246, 246), outline=BLACK, width=2)
    d.text(
        (28, FOOT_TOP + 14),
        "Laboratorio meccanico · scheda didattica · tenere vicino al tornio",
        fill=GRAY,
        font=Fm,
    )
    return img, d


def panel(d, x, y, w, h, title, fill=LIGHT):
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + 28], fill=fill, outline=BLACK, width=2)
    d.text((x + 10, y + 4), title, fill=BLACK, font=F15b)
    return y + 34


def callout(d, n, tx, ty, lx, ly, text_right=True):
    """Numbered circle + line to (lx,ly) point on machine."""
    r = 12
    d.ellipse([tx - r, ty - r, tx + r, ty + r], fill=ACCENT, outline=BLACK, width=1)
    tw = d.textlength(str(n), font=F13)
    d.text((tx - tw / 2, ty - 9), str(n), fill=WHITE, font=F13)
    d.line([tx, ty, lx, ly], fill=ACCENT, width=2)
    d.ellipse([lx - 3, ly - 3, lx + 3, ly + 3], fill=BLACK)


def save(img, name):
    img.save(os.path.join(OUT, name), "PNG", optimize=True)
    img.save(os.path.join(GAL, name), "PNG", optimize=True)
    img.save(os.path.join("/opt/cursor/artifacts", name), "PNG", optimize=True)
    print("saved", name)


# ─────────────────────────────────────────────
# PAGINA 1 — PARTI PRINCIPALI
# ─────────────────────────────────────────────
def make_parti():
    img, d = new_sheet(
        "TORNIO MANUALE — LE PARTI",
        "Conosci la macchina: nomi delle parti principali (tornio parallelo)",
    )

    y = panel(d, 28, 114, W - 56, 620, "SCHEMA LATERALE (semplificato)")

    # --- Draw simplified lathe side view ---
    # Bed
    bed_y = 520
    d.rectangle([80, bed_y, 1100, bed_y + 55], fill=BED, outline=BLACK, width=2)
    # legs
    d.rectangle([100, bed_y + 55, 180, bed_y + 140], fill=CAST_D, outline=BLACK, width=2)
    d.rectangle([980, bed_y + 55, 1060, bed_y + 140], fill=CAST_D, outline=BLACK, width=2)
    # drip pan
    d.rectangle([90, bed_y + 130, 1070, bed_y + 155], fill=CAST, outline=BLACK, width=1)

    # Headstock (left)
    d.rectangle([80, 280, 320, bed_y], fill=HEAD, outline=BLACK, width=2)
    # spindle/chuck
    d.ellipse([280, 360, 380, 460], fill=CAST, outline=BLACK, width=2)
    d.ellipse([300, 380, 360, 440], fill=WHITE, outline=BLACK, width=2)
    # speed levers on headstock
    d.rectangle([100, 300, 160, 330], fill=CAST_D, outline=BLACK, width=1)
    d.line([130, 330, 130, 355], fill=BLACK, width=3)
    d.ellipse([122, 350, 138, 366], fill=ACCENT, outline=BLACK)

    # Tailstock (right)
    d.rectangle([860, 340, 1040, bed_y], fill=CAST, outline=BLACK, width=2)
    d.rectangle([820, 390, 900, 430], fill=CAST_D, outline=BLACK, width=2)  # quill
    d.ellipse([800, 395, 830, 425], fill=SOFT, outline=BLACK, width=2)  # center
    # tailstock handwheel
    d.ellipse([1000, 380, 1060, 440], fill=CAST_D, outline=BLACK, width=2)
    d.ellipse([1015, 395, 1045, 425], fill=WHITE, outline=BLACK, width=1)

    # Carriage
    d.rectangle([480, 400, 700, bed_y], fill=CAST, outline=BLACK, width=2)
    # cross slide
    d.rectangle([500, 340, 680, 400], fill=CAST_D, outline=BLACK, width=2)
    # compound / tool post
    d.rectangle([540, 280, 640, 340], fill=HEAD, outline=BLACK, width=2)
    d.rectangle([560, 250, 620, 290], fill=BLACK, outline=BLACK, width=1)  # tool bit hint
    # apron handwheels
    d.ellipse([500, 450, 560, 510], fill=CAST_D, outline=BLACK, width=2)  # long feed HW
    d.ellipse([580, 430, 630, 480], fill=CAST_D, outline=BLACK, width=2)  # cross HW
    # lead screw
    d.rectangle([320, bed_y + 8, 860, bed_y + 22], fill=(80, 80, 80), outline=BLACK, width=1)
    for i in range(12):
        x = 340 + i * 40
        d.line([x, bed_y + 8, x + 8, bed_y + 22], fill=SOFT, width=1)
    # feed rod
    d.rectangle([320, bed_y + 28, 860, bed_y + 38], fill=(60, 60, 60), outline=BLACK, width=1)

    # workpiece between chuck and center
    d.rectangle([380, 400, 800, 420], fill=(200, 180, 140), outline=BLACK, width=1)

    # Callouts (number positions around drawing)
    # 1 headstock, 2 chuck, 3 bed, 4 carriage, 5 cross slide, 6 toolpost,
    # 7 tailstock, 8 quill, 9 lead screw, 10 feed rod, 11 handwheels, 12 legs/base
    callout(d, 1, 60, 250, 200, 300)
    callout(d, 2, 400, 320, 340, 410)
    callout(d, 3, 600, 700, 600, bed_y + 20)
    callout(d, 4, 440, 560, 520, 480)
    callout(d, 5, 720, 300, 640, 360)
    callout(d, 6, 580, 200, 590, 260)
    callout(d, 7, 1120, 300, 960, 380)
    callout(d, 8, 780, 320, 850, 410)
    callout(d, 9, 750, 640, 700, bed_y + 15)
    callout(d, 10, 400, 640, 450, bed_y + 33)
    callout(d, 11, 460, 560, 530, 480)
    callout(d, 12, 200, 700, 140, bed_y + 100)

    # Legend
    y = panel(d, 28, 760, W - 56, 520, "LEGENDA — PARTI PRINCIPALI")
    parts = [
        ("1", "Testa motrice (testa fissa)", "Contiene il mandrino, gli ingranaggi e i comandi di velocità. Trasmette il moto al pezzo."),
        ("2", "Mandrino (a griffe)", "Serraggio del pezzo. Di solito a 3 griffe (autocentrante) o 4 griffe (indipendenti)."),
        ("3", "Bancale (letto)", "Struttura di guida a “V”/piane. Su di esso scorrono carrello e contropunta."),
        ("4", "Carrello (carro)", "Si muove lungo il bancale (avanzamento longitudinale). Porta la grembiule e le slitte."),
        ("5", "Slitta trasversale", "Movimento perpendicolare all’asse: regola la profondità di passata."),
        ("6", "Torretta / slitta portautensili", "Fissa l’utensile. Può essere orientata (slitta superiore) per conicità/smussi."),
        ("7", "Contropunta (coda mobile)", "Sostiene pezzi lunghi, serve per forare con punta o per tornire tra centri."),
        ("8", "Canotto della contropunta", "Parte estraibile: avanza la punta/centri o la punta da forare."),
        ("9", "Vite madre", "Vite lunga usata soprattutto per la filettatura (innesto dedicato)."),
        ("10", "Barra di comando (barra scanalata)", "Trasmette l’avanzamento automatico longitudinale/trasversale (non filettatura)."),
        ("11", "Volantini del carrello", "Movimento manuale: longitudinale (carrello) e trasversale (slitta)."),
        ("12", "Basamento / piedi", "Sostiene la macchina; spesso con vasca raccogli-trucioli e liquido lubrorefrigerante."),
    ]
    for i, (n, title, desc) in enumerate(parts):
        yy = y + 4 + i * 38
        d.ellipse([40, yy, 64, yy + 24], fill=ACCENT, outline=BLACK)
        tw = d.textlength(n, font=F12)
        d.text((52 - tw / 2, yy + 3), n, fill=WHITE, font=F12)
        d.text((74, yy), title, fill=BLACK, font=F13)
        d.text((74, yy + 18), desc, fill=GRAY, font=Fs)

    save(img, "05-tornio-parti.png")


# ─────────────────────────────────────────────
# PAGINA 2 — LEVE E COMANDI
# ─────────────────────────────────────────────
def make_leve():
    img, d = new_sheet(
        "TORNIO MANUALE — LEVE E COMANDI",
        "A cosa serve ogni leva / volantino (prima di accendere, sapile a memoria)",
    )

    y = panel(d, 28, 114, W - 56, 70, "REGOLA D’ORO", fill=WARN_BG)
    d.text((40, y + 4), "Macchina ferma per cambiare velocità / invertire / spostare contropunta.", fill=WARN, font=F13)
    d.text((40, y + 30), "Occhiali sempre. Capelli e maniche raccolti. Non toccare pezzo o mandrino in moto.", fill=WARN, font=F13)

    # Two columns of controls
    controls_left = [
        ("A", "Leva / selettore velocità",
         "Sceglie i giri/min del mandrino (o si cambia sulla puleggia a cinghia). "
         "Giri bassi = pezzi grandi / zigrinatura / acciaio duro. Giri alti = pezzi piccoli / finitura."),
        ("B", "Leva senso di rotazione",
         "Orario / antiorario. Di solito: verso di taglio “sopra” l’utensile verso di te. "
         "Inverti a macchina FERMA."),
        ("C", "Avvio / arresto (motore o frizione)",
         "Accende il moto del mandrino. Impara dove sta l’STOP di emergenza sul tuo tornio."),
        ("D", "Volantino longitudinale (carrello)",
         "Muove a mano il carrello lungo il pezzo (asse Z). Usalo per avvicinarti e per passate corte."),
        ("E", "Volantino trasversale (slitta X)",
         "Avvicina/allontana l’utensile al pezzo: regola la profondità di passata (quanto togli)."),
        ("F", "Volantino slitta superiore",
         "Muove l’utensile lungo la slitta orientabile. Serve per smussi, conicità e piccole correzioni."),
        ("G", "Leva bloccaggio carrello",
         "Fissa il carrello sul bancale quando non deve muoversi (es. tornitura trasversale / sfacciatura)."),
    ]

    controls_right = [
        ("H", "Leva avanzamento longitudinale",
         "Innesta l’avanzamento automatico lungo il pezzo (via barra di comando). "
         "Per tornitura cilindrica lunga e uniforme."),
        ("I", "Leva avanzamento trasversale",
         "Innesta l’avanzamento automatico in profondità (sfacciatura automatica). "
         "Non usarla insieme alla longitudinale."),
        ("J", "Leva vite madre (filettatura)",
         "Collega il carrello alla vite madre per filettare. Solo con rapporto/ingranaggi giusti. "
         "Mai insieme agli altri avanzamenti."),
        ("K", "Volantino contropunta",
         "Fa uscire/rientrate il canotto: punta di centraggio o avanzamento punta da forare."),
        ("L", "Leva bloccaggio canotto",
         "Blocca il canotto dopo averlo posizionato, così non arretra sotto carico."),
        ("M", "Leva / vite bloccaggio contropunta",
         "Fissa la contropunta sul bancale nella posizione scelta lungo il letto."),
        ("N", "Vite / leva bloccaggio utensile",
         "Serraggio dell’utensile sulla torretta. Utensile a centro pezzo, sporgente il giusto."),
    ]

    y = panel(d, 28, 200, 580, 1100, "COMANDI — COLONNA A")
    yy = y + 2
    for n, title, desc in controls_left:
        d.rectangle([40, yy, 68, yy + 26], fill=ACCENT, outline=BLACK)
        d.text((48, yy + 4), n, fill=WHITE, font=F13)
        d.text((78, yy + 2), title, fill=BLACK, font=F13)
        # wrap description manually in short lines
        words = desc.split()
        line = ""
        ly = yy + 28
        for w_ in words:
            test = (line + " " + w_).strip()
            if d.textlength(test, font=Fs) > 520:
                d.text((78, ly), line, fill=GRAY, font=Fs)
                ly += 17
                line = w_
            else:
                line = test
        if line:
            d.text((78, ly), line, fill=GRAY, font=Fs)
            ly += 17
        yy = ly + 10

    y = panel(d, 628, 200, W - 28 - 628, 1100, "COMANDI — COLONNA B")
    yy = y + 2
    for n, title, desc in controls_right:
        d.rectangle([640, yy, 668, yy + 26], fill=ACCENT, outline=BLACK)
        d.text((648, yy + 4), n, fill=WHITE, font=F13)
        d.text((678, yy + 2), title, fill=BLACK, font=F13)
        words = desc.split()
        line = ""
        ly = yy + 28
        for w_ in words:
            test = (line + " " + w_).strip()
            if d.textlength(test, font=Fs) > 500:
                d.text((678, ly), line, fill=GRAY, font=Fs)
                ly += 17
                line = w_
            else:
                line = test
        if line:
            d.text((678, ly), line, fill=GRAY, font=Fs)
            ly += 17
        yy = ly + 10

    # bottom tip - if space leftover within FOOT
    # The panels already fill most space; footer is enough.

    save(img, "06-tornio-leve.png")


# ─────────────────────────────────────────────
# PAGINA 3 — COME SI USA (sequenza + sicurezza)
# ─────────────────────────────────────────────
def make_uso():
    img, d = new_sheet(
        "TORNIO MANUALE — SEQUENZA DI LAVORO",
        "Ordine corretto delle operazioni + errori da non fare",
    )

    y = panel(d, 28, 114, W - 56, 520, "SEQUENZA TIPICA (tornitura di un cilindro)")
    steps = [
        ("1", "Controllo macchina", "Pulizia, protezioni, livello olio, STOP emergenza individuato."),
        ("2", "Montaggio pezzo", "Nel mandrino (o tra centri). Serraggio forte, pezzo corto se possibile."),
        ("3", "Montaggio utensile", "A centro pezzo, sporgenza minima, ben bloccato sulla torretta."),
        ("4", "Contropunta (se serve)", "Punta sul centro; blocca canotto e contropunta sul bancale."),
        ("5", "Scelta giri", "A macchina FERMA. Formula indicativa: n ≈ (v×1000)/(π×Ø)  — chiedi al docente la v."),
        ("6", "Avvicinamento", "A mano con i volantini: tocca il pezzo, azzera i tamburi/quote se presenti."),
        ("7", "Passata", "Profondità con volantino trasversale; avanza lungo il pezzo (a mano o automatico)."),
        ("8", "Misura", "Ferma, misura col calibro, correggi. Ripeti fino a quota."),
        ("9", "Finitura", "Passata leggera, giri più alti se il pezzo lo permette, buona lubrificazione."),
        ("10", "Fine lavoro", "Arresto → togli utensile/pezzo → pulizia bancale e vasca trucioli."),
    ]
    for i, (n, t, desc) in enumerate(steps):
        yy = y + 6 + i * 46
        d.ellipse([42, yy, 70, yy + 28], fill=ACCENT, outline=BLACK)
        tw = d.textlength(n, font=F12)
        d.text((56 - tw / 2, yy + 5), n, fill=WHITE, font=F12)
        d.text((84, yy + 2), t, fill=BLACK, font=F14)
        d.text((84, yy + 24), desc, fill=GRAY, font=F12)

    y = panel(d, 28, 650, W - 56, 420, "NON FARE MAI", fill=WARN_BG)
    bad = [
        "Cambiare velocità o invertire il senso con mandrino in moto.",
        "Lasciare la chiave del mandrino inserita (diventa un proiettile).",
        "Misurare il pezzo mentre gira.",
        "Innestare insieme avanzamento longitudinale + trasversale + vite madre.",
        "Zigrinare o filettare a giri troppo alti.",
        "Allontanarsi dalla macchina con pezzo ancora in rotazione.",
        "Usare guanti con pezzi in rotazione (rischio trascinamento).",
        "Ignorare vibrazioni / rumori strani: STOP e chiama il docente.",
    ]
    for i, ln in enumerate(bad):
        d.text((44, y + 8 + i * 44), f"✗  {ln}", fill=WARN, font=F13)

    y = panel(d, 28, 1090, W - 56, FOOT_TOP - 1090 - 8, "DATI ALUNNO / VERIFICA")
    d.text((40, y + 8), "Alunno/a: _____________________  Classe: ______  Data: __/__/____", fill=BLACK, font=F13)
    d.text((40, y + 42), "Ho saputo indicare almeno 8 parti e 6 leve:  SÌ □    NO □", fill=BLACK, font=F13)
    d.text((40, y + 76), "Firma docente: _______________________    Voto: ______", fill=BLACK, font=F13)

    save(img, "07-tornio-uso-sicurezza.png")


if __name__ == "__main__":
    make_parti()
    make_leve()
    make_uso()
    print("ALL DONE")

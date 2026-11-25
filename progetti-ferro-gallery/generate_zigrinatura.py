#!/usr/bin/env python3
"""Scheda A4 dedicata: COME SI FA LA ZIGRINATURA."""
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
STEEL = (168, 176, 184)
STEEL_D = (110, 118, 128)
SOFT = (90, 90, 90)
WARN_BG = (255, 245, 230)
WARN = (110, 45, 10)
OK_BG = (232, 245, 232)
OK = (20, 90, 40)
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


F12, F13, F14 = font_b(20), font_b(22), font_b(24)
F15, F18, F22 = font_b(26), font_b(28), font_b(32)
Fm, Fs = font_b(17), font(17)


def panel(d, x, y, w, h, title, fill=LIGHT):
    hdr = 34
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + hdr], fill=fill, outline=BLACK, width=2)
    d.text((x + 12, y + 7), title, fill=BLACK, font=F13)
    return y + hdr + 10


def _clip(x0, y0, x1, y1, left, top, right, bottom):
    dx, dy = x1 - x0, y1 - y0
    p = [-dx, dx, -dy, dy]
    q = [x0 - left, right - x0, y0 - top, bottom - y0]
    u1, u2 = 0.0, 1.0
    for pi, qi in zip(p, q):
        if pi == 0:
            if qi < 0:
                return None
            continue
        t = qi / pi
        if pi < 0:
            if t > u2:
                return None
            if t > u1:
                u1 = t
        else:
            if t < u1:
                return None
            if t < u2:
                u2 = t
    return (x0 + u1 * dx, y0 + u1 * dy, x0 + u2 * dx, y0 + u2 * dy)


def knurl_rect(d, x, y, w, h):
    d.rectangle([x, y, x + w, y + h], fill=STEEL, outline=BLACK, width=2)
    left, top, right, bottom = x + 2, y + 2, x + w - 2, y + h - 2
    step = 7
    for i in range(-int(h), int(w + h) + step, step):
        seg = _clip(x + i, y, x + i + h, y + h, left, top, right, bottom)
        if seg:
            d.line([seg[0], seg[1], seg[2], seg[3]], fill=SOFT, width=1)
        seg = _clip(x + i, y + h, x + i + h, y, left, top, right, bottom)
        if seg:
            d.line([seg[0], seg[1], seg[2], seg[3]], fill=SOFT, width=1)
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)


def make():
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, W - 10, H - 10], outline=BLACK, width=2)
    d.rectangle([10, 10, W - 10, 88], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, 20), "COME SI FA LA ZIGRINATURA", fill=BLACK, font=F22)
    d.text((24, 54), "Scheda pratica per il tornio  ·  acciaio  ·  zigrinatore a 2 rulli (rombi)", fill=GRAY, font=F12)
    d.rectangle([W - 210, 20, W - 24, 74], outline=ACCENT, width=2)
    d.text((W - 198, 28), "TORNIO · FERRO", fill=ACCENT, font=F12)
    d.text((W - 198, 50), "scheda dedicata", fill=ACCENT, font=F12)
    d.rectangle([10, FOOT, W - 10, H - 10], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, FOOT + 12), "Tieni questa scheda vicino al tornio  ·  zigrinatura = impronta a freddo, non asportazione", fill=GRAY, font=Fm)

    # COS'È — padding generoso sopra il bordo inferiore
    cose_y, cose_h = 100, 140
    y = panel(d, 24, cose_y, W - 48, cose_h, "COS’È")
    d.text((36, y + 2), "La zigrinatura crea una superficie a rombi (o a linee) premendo due rulli sul pezzo che gira.", fill=BLACK, font=F12)
    d.text((36, y + 28), "Non toglie truciolo: deforma il metallo. Per questo dopo NON si torna a tornire sul tratto zigrinato.", fill=BLACK, font=F12)
    d.text((36, y + 54), "Serve per manici, pomoli, viti a mano: presa antiscivolo.", fill=GRAY, font=F12)

    # DISEGNO ATTREZZO + PEZZO
    schema_y = cose_y + cose_h + 12
    y = panel(d, 24, schema_y, W - 48, 420, "SCHEMA — zigrinatore a 2 rulli sul pezzo")

    # Pezzo orizzontale
    mid = 400
    knurl_rect(d, 280, mid - 40, 420, 80)
    d.rectangle([200, mid - 28, 280, mid + 28], fill=STEEL_D, outline=BLACK, width=2)
    d.rectangle([700, mid - 28, 780, mid + 28], fill=STEEL_D, outline=BLACK, width=2)
    # axis
    d.line([180, mid, 800, mid], fill=(110, 110, 110), width=1)
    d.text((820, mid - 10), "asse pezzo", fill=GRAY, font=Fs)

    # Rullo sopra
    d.ellipse([430, mid - 150, 550, mid - 30], outline=BLACK, width=3, fill=(150, 155, 162))
    d.ellipse([460, mid - 120, 520, mid - 60], outline=BLACK, width=1, fill=WHITE)
    # knurl marks on roller
    for a in range(0, 360, 20):
        ang = math.radians(a)
        x0 = 490 + 55 * math.cos(ang)
        y0 = mid - 90 + 55 * math.sin(ang)
        x1 = 490 + 48 * math.cos(ang)
        y1 = mid - 90 + 48 * math.sin(ang)
        d.line([x0, y0, x1, y1], fill=SOFT, width=1)

    # Rullo sotto
    d.ellipse([430, mid + 30, 550, mid + 150], outline=BLACK, width=3, fill=(150, 155, 162))
    d.ellipse([460, mid + 60, 520, mid + 120], outline=BLACK, width=1, fill=WHITE)

    # frecce pressione
    d.polygon([(490, mid - 28), (478, mid - 48), (502, mid - 48)], fill=ACCENT)
    d.polygon([(490, mid + 28), (478, mid + 48), (502, mid + 48)], fill=ACCENT)
    d.text((560, mid - 130), "rullo superiore", fill=BLACK, font=F12)
    d.text((560, mid + 100), "rullo inferiore", fill=BLACK, font=F12)
    d.text((560, mid - 20), "pressione →", fill=ACCENT, font=F13)
    d.text((300, mid + 55), "pezzo (già a Ø finito)", fill=BLACK, font=F12)
    d.text((300, mid - 70), "zona zigrinata a rombi", fill=BLACK, font=F12)

    # tip box
    d.rectangle([40, 250, 250, 380], fill=BLUE_BG, outline=ACCENT, width=2)
    d.text((52, 262), "PRIMA", fill=ACCENT, font=F13)
    d.text((52, 292), "1. Pezzo al Ø giusto", fill=BLACK, font=F12)
    d.text((52, 318), "2. Ben serrato", fill=BLACK, font=F12)
    d.text((52, 344), "3. Corto / contropunta", fill=BLACK, font=F12)

    d.rectangle([960, 250, 1185, 380], fill=OK_BG, outline=OK, width=2)
    d.text((972, 262), "DOPO", fill=OK, font=F13)
    d.text((972, 292), "• Solo sbavatura", fill=BLACK, font=F12)
    d.text((972, 318), "• NON tornire", fill=BLACK, font=F12)
    d.text((972, 344), "• Controlla rombi", fill=BLACK, font=F12)

    # PARAMETRI (sotto lo schema, con margine)
    par_y = schema_y + 420 + 14
    y = panel(d, 24, par_y, 580, 200, "PARAMETRI (acciaio)")
    for i, ln in enumerate(
        [
            "• Velocità: 60 – 120 giri/min  (bassi!)",
            "• Olio da taglio: abbondante e continuo",
            "• Pressione: a piccoli passi, non di colpo",
            "• Avanzamento: lento e costante",
            "• Rulli: a rombi (doppia) allineati all’asse",
            "• Pezzo: già tornito al Ø finale della zona",
        ]
    ):
        d.text((36, y + 6 + i * 26), ln, fill=BLACK, font=F12)

    y2 = panel(d, 620, par_y, W - 24 - 620, 200, "ERRORI TIPICI", fill=WARN_BG)
    for i, ln in enumerate(
        [
            "✗ Giri troppo alti → denti saltati",
            "✗ Poca olio → grippaggio / bruciatura",
            "✗ Pressione eccessiva subito",
            "✗ Fermarsi a metà passata",
            "✗ Tornire dopo la zigrinatura",
            "✗ Pezzo lungo e non sostenuto",
        ]
    ):
        d.text((632, y2 + 6 + i * 26), ln, fill=WARN, font=F12)

    # SEQUENZA
    seq_y = par_y + 200 + 14
    y = panel(d, 24, seq_y, W - 48, 400, "SEQUENZA PASSO-PASSO")
    steps = [
        ("1", "Prepara il pezzo", "Porta a misura il Ø della zona da zigrinare. Smussa i bordi. Serraggio saldo."),
        ("2", "Monta lo zigrinatore", "Sulla torretta, rulli paralleli all’asse del pezzo. Controlla l’allineamento."),
        ("3", "Giri bassi + olio", "Imposta 60–120 giri/min a macchina FERMA. Bagna bene pezzo e rulli."),
        ("4", "Contatto leggero", "Avvicina i rulli fino a toccare. Accendi. Aumenta la pressione a piccoli passi."),
        ("5", "Formazione dei rombi", "Quando i rombi sono netti, avanza lungo la lunghezza senza fermarti."),
        ("6", "Controllo", "Ferma. Controlla: rombi regolari, stessa profondità, niente doppie tracce."),
        ("7", "Finitura", "Solo lima fina / carta per sbavare i bordi. Non tornire sulla zigrinatura."),
    ]
    for i, (n, t, desc) in enumerate(steps):
        yy = y + 4 + i * 50
        d.ellipse([40, yy, 68, yy + 28], fill=ACCENT, outline=BLACK)
        tw = d.textlength(n, font=F13)
        d.text((54 - tw / 2, yy + 5), n, fill=WHITE, font=F13)
        d.text((80, yy + 2), t, fill=BLACK, font=F14)
        d.text((80, yy + 26), desc, fill=GRAY, font=F12)

    # Footer student
    dati_y = seq_y + 400 + 12
    y = panel(d, 24, dati_y, W - 48, FOOT - dati_y - 8, "DATI ALUNNO")
    d.text((36, y + 8), "Alunno/a: _____________________  Classe: ______  Data: __/__/____", fill=BLACK, font=F13)
    d.text((36, y + 40), "Ho eseguito una zigrinatura regolare:  SÌ □    NO □     Firma docente: _______________", fill=BLACK, font=F13)

    name = "08-zigrinatura.png"
    img.save(os.path.join(OUT, name), "PNG", optimize=True)
    img.save(os.path.join(GAL, name), "PNG", optimize=True)
    img.save(os.path.join(ART, "STAMPA-zigrinatura.png"), "PNG", optimize=True)
    img.save(os.path.join(ART, name), "PNG", optimize=True)
    print("saved", name)


if __name__ == "__main__":
    make()

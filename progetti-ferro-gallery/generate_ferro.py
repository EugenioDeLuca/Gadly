#!/usr/bin/env python3
"""Schede A4 ferro al tornio — disegni grandi, quote precise, diciture chiare."""
from __future__ import annotations

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
LIGHT = (210, 225, 240)
STEEL = (120, 168, 210)       # azzurro metallo
STEEL_D = (55, 110, 165)      # blu più scuro (gradini)
STEEL_L = (180, 210, 235)     # azzurro chiaro
ACCENT = (0, 70, 130)
WHITE = (255, 255, 255)
SOFT = (40, 70, 100)
CL = (80, 120, 160)
WARN_BG = (255, 236, 200)
WARN = (140, 60, 10)
ORANGE = (220, 120, 40)
CAP_GOLD = (210, 170, 60)
CAP_RED = (190, 55, 50)
GLASS = (150, 200, 220)
DIM_COL = (0, 50, 100)        # quote blu scuro
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


F11 = font_b(19)
F12 = font_b(21)
F13 = font_b(24)   # diciture quote — più grandi
F14 = font_b(25)
F15 = font_b(27)
F16 = font_b(28)   # diametri / quote principali
F18 = font_b(30)
F22 = font_b(32)
Fm = font_b(17)
Fs = font(17)
FDIM = font_b(26)  # font quote


def new_sheet(classe, titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, W - 10, H - 10], outline=BLACK, width=2)
    d.rectangle([10, 10, W - 10, 88], fill=(245, 245, 245), outline=BLACK, width=2)
    # Badge a destra PRIMA del titolo: lascia spazio e non sovrapporre
    badge_l, badge_r = W - 200, W - 24
    d.rectangle([badge_l, 16, badge_r, 76], fill=ACCENT, outline=BLACK, width=2)
    d.text((badge_l + 12, 24), "TORNIO", fill=WHITE, font=F13)
    d.text((badge_l + 12, 48), "Ø20 × 100", fill=WHITE, font=F12)
    title = f"{classe}  ·  {titolo}"
    # titolo non invade il badge
    max_title_w = badge_l - 40
    tf = F22
    for sz in range(32, 20, -1):
        tf = font_b(sz)
        if d.textlength(title, font=tf) <= max_title_w:
            break
    d.text((24, 16), title, fill=BLACK, font=tf)
    sf = F12
    for sz in range(21, 14, -1):
        sf = font_b(sz)
        if d.textlength(sub, font=sf) <= max_title_w:
            break
    d.text((24, 54), sub, fill=GRAY, font=sf)
    d.rectangle([10, FOOT, W - 10, H - 10], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, FOOT + 12), "Quote in mm · tolleranze: Ø ±0,2 · lunghezze ±0,3 (salvo diversa indicazione)", fill=GRAY, font=Fm)
    return img, d


def panel(d, x, y, w, h, title):
    """Disegna pannello. Ritorna y del contenuto (sotto l’header)."""
    hdr = 36
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + hdr], fill=LIGHT, outline=BLACK, width=2)
    # titolo centrato verticalmente nell’header, aria sopra e sotto
    f = F13
    tw = d.textlength(title, font=f)
    th = 22
    d.text((x + 12, y + (hdr - th) / 2), title, fill=BLACK, font=f)
    return y + hdr + 10


def write_obiettivo(d, lines, y0=96):
    """Riquadro OBIETTIVO: testo compatto, poco spazio tra le righe."""
    x, w = 24, W - 48
    hdr = 34
    pad_top, pad_bot = 8, 10
    line_h = 24
    h = hdr + pad_top + len(lines) * line_h + pad_bot
    d.rectangle([x, y0, x + w, y0 + h], outline=BLACK, width=2)
    d.rectangle([x, y0, x + w, y0 + hdr], fill=LIGHT, outline=BLACK, width=2)
    d.text((x + 12, y0 + 7), "OBIETTIVO", fill=BLACK, font=F13)
    cy = y0 + hdr + pad_top
    max_w = w - 28
    for i, item in enumerate(lines):
        if isinstance(item, tuple):
            text, fill = item
        else:
            text, fill = item, BLACK
        f = F12
        for sz in range(19, 13, -1):
            f = font_b(sz)
            if d.textlength(text, font=f) <= max_w:
                break
        d.text((x + 14, cy + i * line_h), text, fill=fill, font=f)
    return y0 + h + 8


def list_step(n, avail, lo=22, hi=28):
    """Passo verticale per elenchi: vicino, senza allargare a riempire il box."""
    if n <= 0:
        return lo
    return min(hi, max(lo, avail // n))


def arrow_h(d, x, y, left=True):
    if left:
        d.polygon([(x, y), (x + 9, y - 4), (x + 9, y + 4)], fill=BLACK)
    else:
        d.polygon([(x, y), (x - 9, y - 4), (x - 9, y + 4)], fill=BLACK)


def arrow_v(d, x, y, up=True):
    if up:
        d.polygon([(x, y), (x - 4, y + 9), (x + 4, y + 9)], fill=BLACK)
    else:
        d.polygon([(x, y), (x - 4, y - 9), (x + 4, y - 9)], fill=BLACK)


def dim_h(d, x1, x2, y, label, above=True):
    """Quota orizzontale con frecce e testo grande."""
    if x2 < x1:
        x1, x2 = x2, x1
    d.line([x1, y, x2, y], fill=DIM_COL, width=2)
    arrow_h(d, x1, y, left=True)
    arrow_h(d, x2, y, left=False)
    tw = d.textlength(label, font=FDIM)
    lx = (x1 + x2) / 2 - tw / 2
    ty = y - 26 if above else y + 6
    d.rectangle([lx - 4, ty - 2, lx + tw + 4, ty + 22], fill=WHITE)
    d.text((lx, ty), label, fill=DIM_COL, font=FDIM)


def dim_dia_below(d, cx, y_top, y_bot, y_label, label):
    """Quota diametro sotto il pezzo: lineette verticali + quota orizzontale sotto."""
    # extension lines down from diameters
    d.line([cx - (y_bot - y_top) / 2, y_bot, cx - (y_bot - y_top) / 2, y_label], fill=BLACK, width=1)
    d.line([cx + (y_bot - y_top) / 2, y_bot, cx + (y_bot - y_top) / 2, y_label], fill=BLACK, width=1)
    x1 = cx - (y_bot - y_top) / 2
    x2 = cx + (y_bot - y_top) / 2
    dim_h(d, x1, x2, y_label, label, above=False)


def label_dia(d, x, y, text, side="left"):
    """Dicitura Ø a lato — SOPRA la linea d’asse (niente overlap)."""
    tw = d.textlength(text, font=F15)
    margin = 28
    gap = 28
    box_h = 28
    ly = y - 18
    if side == "left":
        tx = max(margin, x - gap - tw)
        d.line([x, y, x - 12, y], fill=DIM_COL, width=2)
        d.line([x - 12, y, x - 12, ly], fill=DIM_COL, width=2)
        d.line([x - 12, ly, tx + tw + 4, ly], fill=DIM_COL, width=2)
        d.rectangle([tx - 4, ly - box_h / 2, tx + tw + 6, ly + box_h / 2], fill=WHITE, outline=DIM_COL, width=1)
        d.text((tx, ly - 11), text, fill=DIM_COL, font=F15)
    else:
        tx = min(W - margin - tw, x + gap)
        d.line([x, y, x + 12, y], fill=DIM_COL, width=2)
        d.line([x + 12, y, x + 12, ly], fill=DIM_COL, width=2)
        d.line([x + 12, ly, tx - 4, ly], fill=DIM_COL, width=2)
        d.rectangle([tx - 4, ly - box_h / 2, tx + tw + 6, ly + box_h / 2], fill=WHITE, outline=DIM_COL, width=1)
        d.text((tx, ly - 11), text, fill=DIM_COL, font=F15)


def label_note(d, x, y, text):
    d.text((x, y), text, fill=GRAY, font=F13)


def centerline(d, x1, x2, y):
    x = x1
    while x < x2:
        d.line([x, y, min(x + 12, x2), y], fill=CL, width=1)
        x += 20


def _clip_diag(x0, y0, x1, y1, left, top, right, bottom):
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


def knurl_box(d, x, y, w, h):
    """Zigrinatura a rombi (solo 5ª)."""
    d.rectangle([x, y, x + w, y + h], fill=STEEL, outline=BLACK, width=2)
    left, top, right, bottom = x + 2, y + 2, x + w - 2, y + h - 2
    step = 8
    for i in range(-int(h), int(w + h) + step, step):
        seg = _clip_diag(x + i, y, x + i + h, y + h, left, top, right, bottom)
        if seg:
            d.line([seg[0], seg[1], seg[2], seg[3]], fill=SOFT, width=1)
        seg = _clip_diag(x + i, y + h, x + i + h, y, left, top, right, bottom)
        if seg:
            d.line([seg[0], seg[1], seg[2], seg[3]], fill=SOFT, width=1)
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)


def intacchi_box(d, x, y, w, h, n=6):
    """Intacchi anulari (scanalature) in vista laterale — NON zigrinatura."""
    d.rectangle([x, y, x + w, y + h], fill=STEEL, outline=BLACK, width=2)
    # scanalature verticali = intacchi circolari visti di lato
    groove = max(3, int(w / (n * 2.2)))
    gap = (w - n * groove) / (n + 1)
    for i in range(n):
        gx = x + gap + i * (groove + gap)
        # intaglio: più scuro, rientra un po’ dal bordo
        d.rectangle(
            [gx, y + 3, gx + groove, y + h - 3],
            fill=(230, 238, 245), outline=SOFT, width=1,
        )
        # linea di fondo intaglio
        d.line([gx + groove / 2, y + 3, gx + groove / 2, y + h - 3], fill=(40, 70, 100), width=1)
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)


def text_fit(d, text, font, max_w):
    """Ritorna il testo solo se entra; altrimenti None (per fallback)."""
    if d.textlength(text, font=font) <= max_w:
        return text
    return None


def text_in_box(d, x, y, w, h, text, font, fill, pad=8):
    """Scrive testo DENTRO il box: preferisce font più piccolo al wrap; mai fuori."""
    max_w = max(20, w - 2 * pad)
    max_h = max(12, h - 2 * pad)
    start = font.size if hasattr(font, "size") else 19
    # Una sola riga se l’altezza non regge due righe
    for sz in range(min(start, int(max_h)), 10, -1):
        f = font_b(sz)
        if d.textlength(text, font=f) <= max_w:
            ty = y + pad + max(0, (max_h - sz) / 2)
            # lascia almeno 4px sopra il bordo inferiore (descender)
            if ty + sz + 4 > y + h - 2:
                ty = y + h - sz - 6
            if ty < y + 2:
                ty = y + 2
            d.text((x + pad, ty), text, fill=fill, font=f)
            return
    # wrap solo se c’è spazio verticale per 2 righe
    if max_h >= 28:
        f = font_b(max(11, min(13, int(max_h / 2) - 2)))
        words = text.split()
        line1, line2 = "", ""
        for w0 in words:
            trial = (line1 + " " + w0).strip()
            if d.textlength(trial, font=f) <= max_w:
                line1 = trial
            else:
                line2 = (line2 + " " + w0).strip()
        d.text((x + pad, y + pad), line1, fill=fill, font=f)
        if line2 and y + pad + f.size + 6 < y + h - 4:
            d.text((x + pad, y + pad + f.size + 2), line2, fill=fill, font=f)
        return
    # ultima spiaggia: testo tagliato in larghezza con font piccolo
    f = font_b(11)
    t = text
    while len(t) > 1 and d.textlength(t, font=f) > max_w:
        t = t[:-1]
    d.text((x + pad, y + pad), t, fill=fill, font=f)


def draw_hook_detail(d, bx1, by1, bx2, by2):
    """Dettaglio tappo + uncino — TUTTO dentro il riquadro."""
    pad = 14
    hdr_h = 36
    d.rectangle([bx1, by1, bx2, by2], fill=(255, 250, 240), outline=BLACK, width=2)
    d.rectangle([bx1, by1, bx2, by1 + hdr_h], fill=(255, 210, 150), outline=BLACK, width=2)
    text_in_box(d, bx1, by1, bx2 - bx1, hdr_h, "DETTAGLIO GANCIO", F13, WARN, pad=8)

    # Fascia testi in basso (riservata, non tagliata)
    foot_h = 72
    foot_top = by2 - foot_h
    d.rectangle([bx1 + 2, foot_top, bx2 - 2, by2 - 2], fill=(255, 248, 235), outline=None)

    avail_w = bx2 - bx1 - 2 * pad
    cx = bx1 + pad + avail_w * 0.36
    neck_w = min(44, avail_w * 0.26)
    neck_top = by1 + hdr_h + 28
    bottom = foot_top - 10

    d.rectangle([cx - neck_w / 2, neck_top + 28, cx + neck_w / 2, bottom], fill=GLASS, outline=(40, 90, 120), width=2)

    cap_l = max(cx - neck_w / 2 - 14, bx1 + pad)
    cap_r = min(cx + neck_w / 2 + 14, bx2 - pad - 90)
    cap_top = neck_top
    d.ellipse([cap_l + 4, cap_top - 8, cap_r - 4, cap_top + 14], fill=CAP_GOLD, outline=BLACK, width=2)
    d.rectangle([cap_l, cap_top + 2, cap_r, cap_top + 28], fill=CAP_GOLD, outline=BLACK, width=2)
    d.polygon(
        [
            (cap_r, cap_top + 28),
            (cap_r + 2, cap_top + 28),
            (cap_r - 4, cap_top + 42),
            (cap_r - 14, cap_top + 42),
            (cap_r - 14, cap_top + 28),
        ],
        fill=(180, 140, 40),
        outline=BLACK,
    )

    hx2 = min(cap_r + 70, bx2 - pad - 8)
    hook = [
        (cap_r + 4, cap_top + 16),
        (hx2, cap_top + 22),
        (hx2 - 4, cap_top + 40),
        (cap_r - 6, cap_top + 42),
        (cap_r - 6, cap_top + 34),
        (hx2 - 20, cap_top + 32),
        (hx2 - 22, cap_top + 24),
        (cap_r + 6, cap_top + 20),
    ]
    d.polygon(hook, fill=ORANGE, outline=BLACK)

    # Due righe legenda completamente dentro la fascia inferiore
    tw = bx2 - bx1 - 2 * pad
    text_in_box(d, bx1 + pad, foot_top + 4, tw, 30, "1. uncino SOTTO il bordo del tappo", F12, ORANGE, pad=4)
    text_in_box(d, bx1 + pad, foot_top + 36, tw, 30, "2. alzi la leva → il tappo salta", F12, CAP_RED, pad=4)


def ext_tick(d, x, y1, y2):
    """Linea di richiamo verticale da pezzo a quota."""
    d.line([x, y1, x, y2], fill=BLACK, width=1)


def save(img, name, stampa=None):
    img.save(os.path.join(OUT, name), "PNG", optimize=True)
    img.save(os.path.join(GAL, name), "PNG", optimize=True)
    if stampa:
        img.save(os.path.join(ART, stampa), "PNG", optimize=True)
    print("saved", name)


# ═══════════════════════════════════════════
# 2ª TESTA DI MARTELLO — da BARRA (non cilindro)
# Barra 20×20 · L=60 = 20+24+16 · solo ferro
# ═══════════════════════════════════════════
def make_2a():
    img, d = new_sheet(
        "2ª CLASSE",
        "TESTA DI MARTELLO",
        "Barra acciaio 20 × 20 × 100 mm  ·  SOLO testa in ferro  ·  L = 60 mm",
    )
    # badge: BARRA (non cilindro / non solo Ø)
    d.rectangle([W - 200, 16, W - 24, 76], fill=ACCENT, outline=BLACK, width=2)
    d.text((W - 188, 24), "BARRA", fill=WHITE, font=F13)
    d.text((W - 188, 48), "20 × 20", fill=WHITE, font=F12)

    draw_top = write_obiettivo(
        d,
        [
            "Si parte da una BARRA 20×20 (non da un cilindro). Solo la testa in ferro.",
            ("Faccia piatta · occhio Ø10 · penna a cuneo. Manico di legno = DOPO.", GRAY),
        ],
    )

    fasi = [
        "1. Taglio barra → L = 60",
        "2. Squadro facce (20×20)",
        "3. Foratura occhio Ø10",
        "4. Penna a cuneo (lima/sega)",
        "5. Smusso sulla faccia",
        "6. Satinatura + controllo",
    ]
    ctrl = [
        "□ L = 60 ± 0,3",
        "□ Sezione 20 × 20",
        "□ Occhio Ø10 passante",
        "□ Penna a cuneo L = 16",
        "□ Solo ferro (no manico)",
        "□ Superficie satinata",
    ]
    step = 26
    bh = 40 + max(len(fasi), len(ctrl)) * step + 20
    draw_h = 580
    bot = draw_top + draw_h + 8
    if bot + bh > FOOT - 8:
        bh = FOOT - bot - 8
    else:
        slack = FOOT - 8 - bh - bot
        if slack > 0:
            draw_h += min(slack, 60)
            bot = draw_top + draw_h + 8
            bh = FOOT - bot - 8
    panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO PRINCIPALE — testa da BARRA (scala 8:1)")
    panel_bottom = draw_top + draw_h

    FACE_C = (70, 110, 150)
    IRON = (55, 58, 62)
    PEEN_C = (70, 130, 90)
    IRON_L = (120, 125, 132)
    IRON_D = (35, 38, 42)

    info_x1, info_x2 = 930, W - 36
    leggi_bottom = draw_top + 418 + 36 + 5 * 26 + 10 + 8
    d.rectangle([info_x1, draw_top + 44, info_x2, leggi_bottom], fill=(248, 250, 252), outline=BLACK, width=2)
    d.rectangle([info_x1, draw_top + 44, info_x2, draw_top + 76], fill=LIGHT, outline=BLACK, width=2)
    d.text((info_x1 + 10, draw_top + 50), "LEGGI QUI", fill=ACCENT, font=F14)

    blocks = [
        (FACE_C, "FACCIA", "20 × 20", "Piatta (da barra)"),
        (IRON, "OCCHIO", "foro Ø10", "Manico = DOPO"),
        (PEEN_C, "PENNA", "cuneo L = 16", "A taglio"),
    ]
    for i, (col, title, line1, line2) in enumerate(blocks):
        yy = draw_top + 86 + i * 72
        d.rounded_rectangle([info_x1 + 8, yy, info_x2 - 8, yy + 64], radius=6, fill=WHITE, outline=col, width=3)
        d.ellipse([info_x1 + 16, yy + 14, info_x1 + 48, yy + 46], fill=col, outline=BLACK, width=2)
        num = str(i + 1)
        tw = d.textlength(num, font=F14)
        d.text((info_x1 + 32 - tw / 2, yy + 22), num, fill=WHITE, font=F14)
        tx = info_x1 + 58
        d.text((tx, yy + 6), f"{num}  {title}", fill=BLACK, font=F13)
        d.text((tx, yy + 28), line1, fill=GRAY, font=F12)
        text_in_box(d, tx, yy + 46, info_x2 - 16 - tx, 16, line2, F12, GRAY, pad=0)

    d.rectangle([info_x1 + 8, draw_top + 310, info_x2 - 8, draw_top + 400], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(d, info_x1 + 8, draw_top + 316, info_x2 - info_x1 - 16, 28, "È UNA BARRA", F14, WARN, pad=4)
    text_in_box(d, info_x1 + 8, draw_top + 348, info_x2 - info_x1 - 16, 44, "Non un cilindro. Manico = DOPO", F13, WARN, pad=4)

    # ── Testa rettangolare da BARRA (come in foto) ──
    sc = 8.0
    mid = draw_top + 200
    ox = 100
    Lf, Lo, Lp = 20, 24, 16   # mm
    # sezione barra 20×20 → altezza disegno = 20
    h = 10 * sc               # metà altezza 20 mm
    tip_h = 2.0 * sc

    x0 = ox
    x1 = ox + Lf * sc
    x2 = ox + (Lf + Lo) * sc
    end_x = x2 + Lp * sc
    peen_mid = x2 + Lp * sc * 0.5
    hx = (x1 + x2) / 2

    def P(xm, ym):
        return (xm, mid + ym)

    # Corpo = BARRA rettangolare (spigoli vivi, non cilindro)
    # faccia + occhio = un unico blocco 20×20
    d.rectangle([x0, mid - h, x2, mid + h], fill=IRON, outline=BLACK, width=3)
    # faccia (sinistra) colorata
    d.rectangle([x0, mid - h, x1, mid + h], fill=FACE_C, outline=BLACK, width=2)
    # faccia battente: quadrato visto di lato = bordo piatto
    d.rectangle([x0, mid - h + 4, x0 + 6, mid + h - 4], fill=IRON_L, outline=BLACK, width=2)
    # linee di spigolo (aspetto barra)
    d.line([x0 + 6, mid - h, x1 - 2, mid - h + 6], fill=IRON_D, width=1)
    d.line([x1, mid - h, x2, mid - h], fill=BLACK, width=2)
    d.line([x1, mid + h, x2, mid + h], fill=BLACK, width=2)

    # PENNA a cuneo (continua dalla barra)
    penna = [
        P(x2, -h), P(x2 + 8, -h + 4),
        P(end_x - 4, -tip_h), P(end_x, -tip_h),
        P(end_x, tip_h), P(end_x - 4, tip_h),
        P(x2 + 8, h - 4), P(x2, h),
    ]
    d.polygon(penna, fill=PEEN_C, outline=BLACK, width=2)
    d.line([x2 + 4, mid - h + 6, end_x - 6, mid - tip_h], fill=IRON_D, width=2)
    d.line([x2 + 4, mid + h - 6, end_x - 6, mid + tip_h], fill=IRON_D, width=2)

    # OCCHIO
    hole_rx, hole_ry = 4.0 * sc, 4.6 * sc
    d.ellipse([hx - hole_rx, mid - hole_ry, hx + hole_rx, mid + hole_ry], fill=WHITE, outline=BLACK, width=3)
    d.ellipse(
        [hx - hole_rx + 5, mid - hole_ry + 4, hx + hole_rx - 5, mid + hole_ry - 4],
        fill=(230, 235, 240), outline=IRON_D, width=1,
    )
    d.line([hx, mid - hole_ry, hx, mid - h - 10], fill=CAP_RED, width=2)
    d.line([hx, mid + hole_ry, hx, mid + h + 10], fill=CAP_RED, width=2)
    arrow_v(d, hx, mid - h - 10, up=True)
    arrow_v(d, hx, mid + h + 10, up=False)

    # asse barra
    centerline(d, x0 - 12, end_x + 14, mid)

    top_r = mid - h
    q1 = top_r - 30
    q0 = q1 - 28
    for xx in (x0, x1, x2, end_x):
        ext_tick(d, xx, top_r, q0 - 2)
    dim_h(d, x0, x1, q1, "20")
    dim_h(d, x1, x2, q1, "24")
    dim_h(d, x2, end_x, q1, "16")
    dim_h(d, x0, end_x, q0, "60")

    def lab_box(cx, yy, text, col):
        tw = d.textlength(text, font=F13)
        d.rectangle([cx - tw / 2 - 4, yy - 2, cx + tw / 2 + 4, yy + 20], fill=WHITE, outline=col, width=1)
        d.text((cx - tw / 2, yy), text, fill=col, font=F13)

    # quota sezione BARRA (non Ø)
    lab_box((x0 + x1) / 2, mid - h - 28, "20 × 20", DIM_COL)
    lab_box(peen_mid, mid - h - 28, "penna", (40, 100, 50))

    def badge(cx, cy, n, bg):
        d.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=bg, outline=BLACK, width=2)
        tw = d.textlength(n, font=F13)
        d.text((cx - tw / 2, cy - 9), n, fill=WHITE, font=F13)

    badge_y = mid + h + 26
    badge((x0 + x1) / 2, badge_y, "1", FACE_C)
    badge(hx, badge_y, "2", IRON)
    badge(peen_mid, badge_y, "3", PEEN_C)

    ftxt = "SOLO TESTA da BARRA — manico DOPO · foro Ø10"
    ftw = d.textlength(ftxt, font=F13) + 14
    fy = badge_y + 22
    d.rectangle([hx - ftw / 2, fy, hx + ftw / 2, fy + 26], fill=(255, 235, 230), outline=CAP_RED, width=2)
    d.text((hx - ftw / 2 + 7, fy + 4), ftxt, fill=CAP_RED, font=F13)

    # Barra di partenza (prima del pezzo)
    bx, by = ox, fy + 55
    d.text((bx, by), "BARRA DI PARTENZA (non cilindro):", fill=ACCENT, font=F13)
    d.rectangle([bx, by + 28, bx + 160, by + 56], fill=IRON_L, outline=BLACK, width=2)
    d.line([bx + 160, by + 28, bx + 172, by + 20], fill=BLACK, width=2)
    d.line([bx + 160, by + 56, bx + 172, by + 48], fill=BLACK, width=2)
    d.line([bx + 172, by + 20, bx + 172, by + 48], fill=BLACK, width=2)
    d.line([bx, by + 28, bx + 12, by + 20], fill=BLACK, width=2)
    d.line([bx + 12, by + 20, bx + 172, by + 20], fill=BLACK, width=2)
    d.text((bx + 180, by + 30), "20 × 20 × 100", fill=BLACK, font=F13)
    d.text((bx + 180, by + 50), "→ taglio L=60 → testa", fill=GRAY, font=F12)

    note_y = by + 70
    text_in_box(
        d, ox, note_y, info_x1 - ox - 24, 24,
        "Da BARRA 20×20: faccia 20 · occhio 24 · penna 16 → L = 60. Foro Ø10.",
        F13, BLACK, pad=2,
    )
    text_in_box(
        d, ox, note_y + 26, info_x1 - ox - 24, 24,
        "S235/C40 · spigoli da barra · smusso faccia · satinatura. Manico = dopo.",
        F12, GRAY, pad=2,
    )

    legend = [
        ("1 FACCIA 20×20", FACE_C, WHITE),
        ("2 OCCHIO Ø10", IRON, WHITE),
        ("3 PENNA L=16", PEEN_C, WHITE),
    ]
    tag_y = note_y + 58
    gap = 8
    chip_w = (info_x1 - 40 - 2 * gap) / 3
    for i, (lab, fill, tcol) in enumerate(legend):
        xa = 36 + i * (chip_w + gap)
        d.rounded_rectangle([xa, tag_y, xa + chip_w, tag_y + 28], radius=6, fill=fill, outline=BLACK, width=2)
        text_in_box(d, xa, tag_y, chip_w, 28, lab, F12, tcol, pad=3)

    tip_y = tag_y + 38
    tips = [
        "ATTENZIONE: si parte dalla BARRA 20×20, non da un cilindro.",
        "• Occhiali · pezzo stretto in morsa · foratura occhio con punta Ø10",
        "• Controlla L=60 e sezione 20×20 · manico dopo",
    ]
    tip_step = 22
    tip_h_box = 10 + len(tips) * tip_step + 6
    d.rectangle([36, tip_y, info_x1 - 20, tip_y + tip_h_box], fill=(245, 250, 255), outline=ACCENT, width=2)
    for i, ln in enumerate(tips):
        fill = ACCENT if i == 0 else BLACK
        f = F13 if i == 0 else F12
        d.text((48, tip_y + 6 + i * tip_step), ln, fill=fill, font=f)

    right_y = draw_top + 418
    checks = ["□ Solo testa", "□ Sez. 20×20", "□ Occhio Ø10", "□ Penna L=16", "□ L=60 ±0,3"]
    rh = 36 + len(checks) * 26 + 10
    d.rectangle([info_x1 + 8, right_y, info_x2 - 8, right_y + rh], fill=WHITE, outline=BLACK, width=2)
    d.text((info_x1 + 16, right_y + 8), "CHECK RAPIDO", fill=ACCENT, font=F13)
    for i, ln in enumerate(checks):
        text_in_box(d, info_x1 + 12, right_y + 34 + i * 26, info_x2 - info_x1 - 28, 24, ln, F12, BLACK, pad=2)

    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    for i, ln in enumerate(fasi):
        text_in_box(d, 32, y + 2 + i * step, 384, step - 2, ln, F13, BLACK, pad=3)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    for i, ln in enumerate(ctrl):
        text_in_box(d, 448, y2 + 2 + i * step, 364, step - 2, ln, F13, BLACK, pad=3)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    text_in_box(d, 848, y3 + 6, 340, 24, "Alunno/a:", F13, BLACK, pad=2)
    d.line([848, y3 + 32, 1190, y3 + 32], fill=BLACK, width=1)
    text_in_box(d, 848, y3 + 40, 340, 24, "Classe: ____  Data: __/__/__", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 72, 340, 24, "Voto /10: ______", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 104, 340, 24, "Firma docente:", F13, BLACK, pad=2)
    d.line([848, y3 + 132, 1190, y3 + 132], fill=BLACK, width=1)

    save(img, "01-2a-testa-martello.png", "STAMPA-2a-testa-martello.png")


# ═══════════════════════════════════════════
# 3ª PERNO A SPALLAMENTI + INTACCHI (non zigrinatura)
# ═══════════════════════════════════════════
def make_3a():
    img, d = new_sheet(
        "3ª CLASSE",
        "PERNO A SPALLAMENTI",
        "Barra tonda acciaio Ø20 × 100 mm  ·  pezzo finito L = 70 mm  ·  con intacchi",
    )

    draw_top = write_obiettivo(
        d,
        [
            "Perno a 4 diametri (spallamenti) + INTACCHI (scanalature) sul corpo Ø16.",
            ("Intacchi = tacche anulari per la presa. NON è zigrinatura a rombi.", GRAY),
        ],
    )

    fasi = [
        "1. Sfacciatura → L = 70",
        "2. Tornitura Ø18 × 15",
        "3. Tornitura Ø16 × 15",
        "4. Intacchi sul Ø16",
        "5. Tornitura Ø14 e Ø10",
        "6. Smussi + satinatura",
    ]
    ctrl = [
        "□ L = 70 ± 0,3",
        "□ Ø18/16/14/10 ± 0,2",
        "□ Intacchi regolari",
        "□ Spallamenti netti",
        "□ Smussi + satinatura",
    ]
    step = 26
    bh = 40 + max(len(fasi), len(ctrl)) * step + 20
    bot = FOOT - bh - 8
    draw_h = bot - draw_top - 8
    panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO PRINCIPALE — 4 diametri + intacchi (scala 10:1)")
    panel_bottom = draw_top + draw_h

    info_x1, info_x2 = 930, W - 36
    # LEGGI QUI alto quanto il contenuto (niente box vuoto enorme)
    leggi_h = 84 + 4 * 78 + 100
    d.rectangle([info_x1, draw_top + 44, info_x2, draw_top + 44 + leggi_h], fill=(248, 250, 252), outline=BLACK, width=2)
    d.rectangle([info_x1, draw_top + 44, info_x2, draw_top + 76], fill=LIGHT, outline=BLACK, width=2)
    d.text((info_x1 + 10, draw_top + 50), "LEGGI QUI", fill=ACCENT, font=F14)

    blocks = [
        (STEEL_D, "TESTA", "Ø18 × 15", "Parte grossa"),
        (STEEL, "CORPO", "Ø16 × 15", "CON INTACCHI"),
        ((100, 160, 190), "COLLO", "Ø14 × 20", "Diametro medio"),
        ((90, 150, 100), "GAMBO", "Ø10 × 20", "Parte sottile"),
    ]
    for i, (col, title, line1, line2) in enumerate(blocks):
        yy = draw_top + 84 + i * 78
        d.rounded_rectangle([info_x1 + 8, yy, info_x2 - 8, yy + 70], radius=6, fill=WHITE, outline=col, width=3)
        d.ellipse([info_x1 + 16, yy + 16, info_x1 + 48, yy + 48], fill=col, outline=BLACK, width=2)
        num = str(i + 1)
        tw = d.textlength(num, font=F13)
        d.text((info_x1 + 32 - tw / 2, yy + 24), num, fill=WHITE, font=F13)
        tx = info_x1 + 58
        d.text((tx, yy + 6), f"{num}  {title}", fill=BLACK, font=F13)
        d.text((tx, yy + 28), line1, fill=GRAY, font=F12)
        # testo dentro il box (niente overflow sul bordo)
        text_in_box(d, tx, yy + 46, info_x2 - 16 - tx, 20, line2, F12, ORANGE if "INTACCH" in line2 else GRAY, pad=0)

    warn_y = draw_top + 84 + 4 * 78 + 8
    d.rectangle([info_x1 + 8, warn_y, info_x2 - 8, warn_y + 90], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(d, info_x1 + 8, warn_y + 6, info_x2 - info_x1 - 16, 28, "INTACCHI ≠ zigrinatura", F13, WARN, pad=4)
    text_in_box(d, info_x1 + 8, warn_y + 40, info_x2 - info_x1 - 16, 42, "Tacche anulari sul Ø16 (utensile da taglio)", F12, WARN, pad=4)

    sc = 10.0
    mid = draw_top + 280
    ox = 70
    segs = [
        (15, 18, STEEL_D, False),
        (15, 16, STEEL, True),   # intacchi
        (20, 14, (100, 160, 190), False),
        (20, 10, (90, 150, 100), False),
    ]
    x = ox
    xs = []
    for L, Dia, col, has_int in segs:
        ww, hh = L * sc, Dia * sc
        if has_int:
            intacchi_box(d, x, mid - hh / 2, ww, hh, n=6)
        else:
            d.rectangle([x, mid - hh / 2, x + ww, mid + hh / 2], fill=col, outline=BLACK, width=3)
        xs.append((x, ww, hh, L, Dia, col, has_int))
        x += ww
    end_x = x

    d.polygon([(ox, mid - xs[0][2] / 2), (ox + 10, mid - xs[0][2] / 2), (ox, mid - xs[0][2] / 2 + 10)], fill=WHITE, outline=BLACK)
    d.polygon([(ox, mid + xs[0][2] / 2), (ox + 10, mid + xs[0][2] / 2), (ox, mid + xs[0][2] / 2 - 10)], fill=WHITE, outline=BLACK)
    d.polygon([(end_x, mid - xs[3][2] / 2), (end_x - 8, mid - xs[3][2] / 2), (end_x, mid - xs[3][2] / 2 + 8)], fill=WHITE, outline=BLACK)
    d.polygon([(end_x, mid + xs[3][2] / 2), (end_x - 8, mid + xs[3][2] / 2), (end_x, mid + xs[3][2] / 2 - 8)], fill=WHITE, outline=BLACK)

    centerline(d, ox - 16, end_x + 16, mid)

    # Quote lunghezze SOPRA — compatte, senza overlap
    top_r = mid - 18 * sc / 2
    q1 = top_r - 32
    q0 = q1 - 30
    ticks = [ox] + [s[0] for s in xs[1:]] + [end_x]
    for xx in ticks:
        ext_tick(d, xx, top_r, q0 - 2)
    dim_h(d, xs[0][0], xs[0][0] + xs[0][1], q1, "15")
    dim_h(d, xs[1][0], xs[1][0] + xs[1][1], q1, "15")
    dim_h(d, xs[2][0], xs[2][0] + xs[2][1], q1, "20")
    dim_h(d, xs[3][0], xs[3][0] + xs[3][1], q1, "20")
    dim_h(d, ox, end_x, q0, "70")

    # Diametri SOTTO il pezzo (niente testo sopra il metallo)
    bot_r = mid + 18 * sc / 2
    y_dia = bot_r + 36

    def dia_lab(cx, y_from, lab):
        d.line([cx, y_from, cx, y_dia], fill=DIM_COL, width=2)
        tw = d.textlength(lab, font=F14)
        d.rectangle([cx - tw / 2 - 4, y_dia + 2, cx + tw / 2 + 4, y_dia + 22], fill=WHITE, outline=DIM_COL, width=1)
        d.text((cx - tw / 2, y_dia + 4), lab, fill=DIM_COL, font=F14)

    for s, lab in zip(xs, ["Ø18", "Ø16", "Ø14", "Ø10"]):
        dia_lab(s[0] + s[1] / 2, mid + s[2] / 2, lab)

    def badge(cx, cy, n, bg):
        d.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=bg, outline=BLACK, width=2)
        tw = d.textlength(n, font=F13)
        d.text((cx - tw / 2, cy - 9), n, fill=WHITE, font=F13)

    badge_y = y_dia + 52
    for i, s in enumerate(xs):
        badge(s[0] + s[1] / 2, badge_y, str(i + 1), s[5])

    # etichetta INTACCHI sotto il solo corpo Ø16 (non sopra Ø14)
    sx = xs[1][0] + xs[1][1] / 2
    int_lab = "↑ INTACCHI"
    tw = d.textlength(int_lab, font=F13)
    iy = badge_y + 22
    d.rectangle([sx - tw / 2 - 6, iy, sx + tw / 2 + 6, iy + 24], fill=WHITE, outline=ORANGE, width=2)
    d.text((sx - tw / 2, iy + 3), int_lab, fill=ORANGE, font=F13)

    note_y = iy + 34
    text_in_box(d, ox, note_y, info_x1 - ox - 20, 24, "4 spallamenti: Ø18 → Ø16 (con intacchi) → Ø14 → Ø10", F13, BLACK, pad=2)
    text_in_box(d, ox, note_y + 26, info_x1 - ox - 20, 24, "Intacchi: scanalature anulari col utensile · regolari · stessa profondità.", F12, GRAY, pad=2)

    legend = [
        ("1 Ø18", STEEL_D, WHITE),
        ("2 Ø16 intacchi", STEEL, BLACK),
        ("3 Ø14", (100, 160, 190), BLACK),
        ("4 Ø10", (90, 150, 100), WHITE),
    ]
    tag_y = note_y + 58
    gap = 8
    chip_w = (info_x1 - 40 - 3 * gap) / 4
    for i, (lab, fill, tcol) in enumerate(legend):
        xa = 36 + i * (chip_w + gap)
        d.rounded_rectangle([xa, tag_y, xa + chip_w, tag_y + 28], radius=6, fill=fill, outline=BLACK, width=2)
        text_in_box(d, xa, tag_y, chip_w, 28, lab, F12, tcol, pad=3)

    tip_y = tag_y + 38
    tips = [
        "ATTENZIONE IN OFFICINA",
        "• Occhiali · pezzo stretto · giri giusti per Ø",
        "• Intacchi solo sul Ø16 · stessa profondità · NON zigrinatura",
        "• Controlla ogni spallamento col calibro prima del successivo",
    ]
    tip_step = 22
    tip_h = 10 + len(tips) * tip_step + 6
    d.rectangle([36, tip_y, info_x1 - 20, tip_y + tip_h], fill=(245, 250, 255), outline=ACCENT, width=2)
    for i, ln in enumerate(tips):
        fill = ACCENT if i == 0 else BLACK
        f = F13 if i == 0 else F12
        d.text((48, tip_y + 6 + i * tip_step), ln, fill=fill, font=f)

    right_y = warn_y + 100
    checks3 = ["□ L = 70", "□ Ø18/16/14/10", "□ Intacchi", "□ Spallamenti", "□ Satinatura"]
    rh = 36 + len(checks3) * 26 + 10
    if right_y + rh < panel_bottom - 16:
        d.rectangle([info_x1 + 8, right_y, info_x2 - 8, right_y + rh], fill=WHITE, outline=BLACK, width=2)
        d.text((info_x1 + 16, right_y + 8), "CHECK RAPIDO", fill=ACCENT, font=F13)
        for i, ln in enumerate(checks3):
            d.text((info_x1 + 16, right_y + 36 + i * 26), ln, fill=BLACK, font=F12)

    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    for i, ln in enumerate(fasi):
        text_in_box(d, 32, y + 2 + i * step, 384, step - 2, ln, F13, BLACK, pad=3)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    for i, ln in enumerate(ctrl):
        text_in_box(d, 448, y2 + 2 + i * step, 364, step - 2, ln, F13, BLACK, pad=3)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    text_in_box(d, 848, y3 + 6, 340, 24, "Alunno/a:", F13, BLACK, pad=2)
    d.line([848, y3 + 32, 1190, y3 + 32], fill=BLACK, width=1)
    text_in_box(d, 848, y3 + 40, 340, 24, "Classe: ____  Data: __/__/__", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 72, 340, 24, "Voto /10: ______", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 104, 340, 24, "Firma docente:", F13, BLACK, pad=2)
    d.line([848, y3 + 132, 1190, y3 + 132], fill=BLACK, width=1)

    save(img, "02-3a-perno-spallamenti.png", "STAMPA-3a-perno-spallamenti.png")


# ═══════════════════════════════════════════
# 4ª CACCIAVITE (senza zigrinatura)
# ═══════════════════════════════════════════
def make_4a():
    img, d = new_sheet(
        "4ª CLASSE",
        "CACCIAVITE A TAGLIO",
        "Barra tonda acciaio C40 Ø20 × 100 mm  ·  utensile monopezzo L = 100 mm",
    )

    draw_top = write_obiettivo(
        d,
        ["Cacciavite monopezzo: manico liscio, gola di scarico, lama a taglio limata a mano (niente zigrinatura)."],
    )
    draw_h = 620
    y = panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO TECNICO — vista laterale  (scala 6,5:1)")

    sc = 6.5
    mid = draw_top + 250
    ox = 70
    segs = [
        (42, 18, STEEL),
        (5, 10, STEEL_D),
        (18, 12, STEEL),
        (30, 8, STEEL_D),
    ]
    x = ox
    xs = []
    for L, Dia, fill in segs:
        ww, hh = L * sc, Dia * sc
        d.rectangle([x, mid - hh / 2, x + ww, mid + hh / 2], fill=fill, outline=BLACK, width=3)
        xs.append((x, ww, hh, L, Dia))
        x += ww

    tip_l = 5 * sc
    lx, lw, lh, _, _ = xs[3]
    tip_x = lx + lw
    d.polygon(
        [(tip_x, mid - lh / 2), (tip_x + tip_l, mid), (tip_x, mid + lh / 2)],
        fill=STEEL_D, outline=BLACK,
    )
    end_x = tip_x + tip_l
    centerline(d, ox - 30, end_x + 40, mid)

    top_r = mid - 18 * sc / 2
    q1 = top_r - 34
    q0 = q1 - 32
    for xx in (ox, xs[1][0], xs[2][0], xs[3][0], end_x):
        ext_tick(d, xx, top_r, q0 - 4)
    dim_h(d, xs[0][0], xs[0][0] + xs[0][1], q1, "42")
    dim_h(d, xs[1][0], xs[1][0] + xs[1][1], q1, "5")
    dim_h(d, xs[2][0], xs[2][0] + xs[2][1], q1, "18")
    dim_h(d, xs[3][0], end_x, q1, "35")
    dim_h(d, ox, end_x, q0, "100")

    bot_r = mid + 18 * sc / 2

    def dia_below(cx, y_from, y_lab, lab):
        d.line([cx, y_from, cx, y_lab], fill=DIM_COL, width=2)
        tw = d.textlength(lab, font=F15)
        d.rectangle([cx - tw / 2 - 4, y_lab + 2, cx + tw / 2 + 4, y_lab + 24], fill=WHITE, outline=DIM_COL, width=1)
        d.text((cx - tw / 2, y_lab + 4), lab, fill=DIM_COL, font=F15)

    c0 = xs[0][0] + xs[0][1] / 2
    c1 = xs[1][0] + xs[1][1] / 2
    c2 = xs[2][0] + xs[2][1] / 2
    dia_below(c0, bot_r, bot_r + 36, "Ø18")
    dia_below(c2, mid + 12 * sc / 2, bot_r + 36, "Ø12")
    dia_below(end_x - tip_l / 2, mid + 8 * sc / 2, bot_r + 36, "Ø8")
    dia_below(c1, mid + 10 * sc / 2, bot_r + 78, "Ø10")

    ny = bot_r + 110
    max_note_y = draw_top + draw_h - 40
    text_in_box(d, ox, min(ny, max_note_y - 72), W - 80 - ox, 24, "Manico LISCIO Ø18 (niente zigrinatura)", F13, BLACK, pad=2)
    text_in_box(d, ox, min(ny + 26, max_note_y - 48), W - 80 - ox, 24, "Gola Ø10 · lama a taglio limata a mano", F13, BLACK, pad=2)
    text_in_box(d, ox, min(ny + 52, max_note_y - 24), W - 80 - ox, 24, "L tot. 100 = 42 + 5 + 18 + 35", F13, GRAY, pad=2)

    zg = draw_top + draw_h + 8
    bot_reserve = 200
    zg_h = max(220, FOOT - zg - bot_reserve - 8)
    y = panel(d, 24, zg, W - 48, zg_h, "COME SI FA LA LAMA A TAGLIO (a mano)")
    col1 = [
        "COSA SERVE",
        "• Lima piatta fina",
        "• Morsa da banco",
        "• Occhiali",
        "• Vite M4/M5 di prova",
        "ATTENZIONE",
        "• Lima poco per volta",
        "• Controlla la simmetria",
    ]
    col2 = [
        "SEQUENZA",
        "1. Blocca manico in morsa",
        "2. Segna punta ≈ 5 mm",
        "3. Lima un lato inclinato",
        "4. Lima l’altro lato uguale",
        "5. Controlla simmetria",
        "6. Prova su vite M4/M5",
        "7. Sbava e satina",
    ]
    lh = list_step(max(len(col1), len(col2)), zg_h - 48, lo=20, hi=26)
    for i, ln in enumerate(col1):
        yy = y + 2 + i * lh
        if yy + 18 > zg + zg_h - 6:
            break
        fill = ACCENT if ln in ("COSA SERVE", "ATTENZIONE") else BLACK
        f = F14 if ln in ("COSA SERVE", "ATTENZIONE") else F13
        d.text((40, yy), ln, fill=fill, font=f)
    for i, ln in enumerate(col2):
        yy = y + 2 + i * lh
        if yy + 18 > zg + zg_h - 6:
            break
        fill = ACCENT if ln == "SEQUENZA" else BLACK
        f = F14 if ln == "SEQUENZA" else F13
        d.text((640, yy), ln, fill=fill, font=f)

    bot = zg + zg_h + 8
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 560, bh, "CONTROLLO / DATI")
    text_in_box(d, 32, y + 4, 540, 26, "□ L=100±0,5  □ Ø18 / Ø12 / Ø8  □ Gola Ø10", F13, BLACK, pad=3)
    text_in_box(d, 32, y + 32, 540, 26, "□ Lama simmetrica  □ Prova su vite M4 o M5", F13, BLACK, pad=3)
    text_in_box(d, 32, y + 60, 540, 26, "Alunno/a: ______________  Classe: ______", F13, BLACK, pad=3)
    text_in_box(d, 32, y + 88, 540, 26, "Data: __/__/____  Voto: ____  Firma: ________", F13, BLACK, pad=3)

    y2 = panel(d, 600, bot, W - 24 - 600, bh, "DISTINTA")
    text_in_box(d, 608, y2 + 4, 560, 26, "1 × barra Ø20 × 100 — C40", F13, BLACK, pad=3)
    text_in_box(d, 608, y2 + 32, 560, 26, "Olio da taglio", F13, BLACK, pad=3)
    text_in_box(d, 608, y2 + 60, 560, 26, "Lima fina (per il taglio)", F13, BLACK, pad=3)
    text_in_box(d, 608, y2 + 88, 560, 26, "Vite M4/M5 di prova", F13, BLACK, pad=3)

    save(img, "03-4a-cacciavite.png", "STAMPA-4a-cacciavite.png")


# ═══════════════════════════════════════════
# 5ª VITE BLOCCAGGIO
# ═══════════════════════════════════════════
def make_5a():
    img, d = new_sheet(
        "5ª CLASSE",
        "VITE DI BLOCCAGGIO M10",
        "Barra tonda acciaio C40 Ø20 × 100 mm  ·  pezzo finito L = 100 mm  ·  filetto M10 × 1,5",
    )

    draw_top = write_obiettivo(
        d,
        ["Vite a pomolo per fissare pezzi su dima/guida. Zigrinatura + filettatura esterna M10×1,5."],
    )
    draw_h = 740
    y = panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO TECNICO — vista laterale  (scala 7:1)")

    sc = 7.0
    mid = draw_top + 270
    ox = 120

    knurl_box(d, ox, mid - 10 * sc, 22 * sc, 20 * sc)
    x2 = ox + 22 * sc
    d.rectangle([x2, mid - 8 * sc, x2 + 8 * sc, mid + 8 * sc], fill=STEEL, outline=BLACK, width=2)
    x3 = x2 + 8 * sc
    gambo_l = 70 * sc
    tip = x3 + gambo_l
    chamfer = 5 * sc
    d.rectangle([x3, mid - 5 * sc, tip - chamfer, mid + 5 * sc], fill=STEEL_D, outline=BLACK, width=2)
    d.polygon(
        [(tip - chamfer, mid - 5 * sc), (tip, mid), (tip - chamfer, mid + 5 * sc)],
        fill=STEEL_D, outline=BLACK,
    )
    usable = gambo_l - chamfer - 12
    for i in range(18):
        xx = x3 + 10 + i * usable / 17
        d.line([xx, mid - 5 * sc, xx + 4, mid + 5 * sc], fill=SOFT, width=1)

    centerline(d, ox - 30, tip + 45, mid)

    top_r = mid - 10 * sc
    q1 = top_r - 32
    q0 = q1 - 30
    for xx in (ox, x2, x3, tip):
        ext_tick(d, xx, top_r, q0 - 4)
    dim_h(d, ox, x2, q1, "22")
    dim_h(d, x2, x3, q1, "8")
    dim_h(d, x3, tip, q1, "70")
    dim_h(d, ox, tip, q0, "100")

    label_dia(d, ox, mid, "Ø20", side="left")

    c16 = x2 + 4 * sc
    y16 = mid + 10 * sc + 40
    d.line([c16, mid + 8 * sc, c16, y16], fill=DIM_COL, width=2)
    tw = d.textlength("Ø16", font=F15)
    d.rectangle([c16 - tw / 2 - 4, y16 + 2, c16 + tw / 2 + 4, y16 + 24], fill=WHITE, outline=DIM_COL, width=1)
    d.text((c16 - tw / 2, y16 + 4), "Ø16", fill=DIM_COL, font=F15)

    c_m = x3 + (tip - x3) * 0.55
    y_m = mid + 10 * sc + 40
    d.line([c_m, mid + 5 * sc, c_m, y_m], fill=DIM_COL, width=2)
    twm = d.textlength("M10×1,5", font=F15)
    d.rectangle([c_m - twm / 2 - 4, y_m + 2, c_m + twm / 2 + 4, y_m + 24], fill=WHITE, outline=DIM_COL, width=1)
    d.text((c_m - twm / 2, y_m + 4), "M10×1,5", fill=DIM_COL, font=F15)

    ny = y16 + 36
    text_in_box(d, ox, ny, W - 80 - ox, 24, "Zigrinatura a rombi (doppia) sul pomolo Ø20", F13, BLACK, pad=2)
    text_in_box(d, ox, ny + 26, W - 80 - ox, 24, "Filetto ISO M10 × 1,5 per 70 mm · smusso entrata 1×45°", F13, BLACK, pad=2)
    text_in_box(d, ox, ny + 52, W - 80 - ox, 24, "Punta: bombata (non segna) oppure piana · L=22+8+70", F13, GRAY, pad=2)

    zb = draw_top + draw_h - 72
    d.rectangle([40, zb, W - 40, zb + 58], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(
        d, 40, zb + 2, W - 80, 26,
        "ZIGRINATURA: giri bassi (60–120) · olio · pressione progressiva · non tornire dopo.",
        F12, WARN, pad=8,
    )
    text_in_box(
        d, 40, zb + 30, W - 80, 24,
        "Solo in 5ª: zigrinatura a rombi sul pomolo (3ª = intacchi, 4ª liscia).",
        F12, GRAY, pad=8,
    )

    bot = draw_top + draw_h + 8
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    fasi5 = [
        "1. Sfacciatura → L = 100",
        "2. Pomolo Ø20 + zigrinatura",
        "3. Sottotesta Ø16",
        "4. Gambo Ø9,8–10 × 70",
        "5. Filettatura M10×1,5",
        "6. Smusso ingresso + finitura",
    ]
    step5 = list_step(len(fasi5), bh - 48)
    for i, ln in enumerate(fasi5):
        d.text((36, y + 2 + i * step5), ln, fill=BLACK, font=F12)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    ctrl5 = [
        "□ L = 100 ± 0,3",
        "□ Zigrinatura regolare",
        "□ Entra in madrevite M10",
        "□ Filetto senza bave",
        "□ Pomolo comodo",
        "□ Asse allineato",
    ]
    step5c = list_step(len(ctrl5), bh - 48)
    for i, ln in enumerate(ctrl5):
        d.text((452, y2 + 2 + i * step5c), ln, fill=BLACK, font=F12)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    d.text((848, y3 + 6), "Alunno/a:", fill=BLACK, font=F12)
    d.line([848, y3 + 30, 1185, y3 + 30], fill=BLACK, width=1)
    d.text((848, y3 + 42), "Classe: ______  Data: __/__/____", fill=BLACK, font=F12)
    d.text((848, y3 + 72), "Voto /10: ______", fill=BLACK, font=F12)
    d.text((848, y3 + 102), "Firma docente:", fill=BLACK, font=F12)
    d.line([848, y3 + 128, 1185, y3 + 128], fill=BLACK, width=1)
    d.text((848, y3 + 142), "Note: ________________________", fill=BLACK, font=F12)

    save(img, "04-5a-vite-bloccaggio.png", "STAMPA-5a-vite-bloccaggio.png")


if __name__ == "__main__":
    make_2a()
    make_3a()
    make_4a()
    make_5a()
    print("ALL DONE")

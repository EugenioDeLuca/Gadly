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


F11 = font_b(17)
F12 = font_b(19)
F13 = font_b(22)   # diciture quote — più grandi
F14 = font_b(23)
F15 = font_b(25)
F16 = font_b(26)   # diametri / quote principali
F18 = font_b(28)
F22 = font_b(30)
Fm = font_b(16)
Fs = font(16)
FDIM = font_b(24)  # font quote


def new_sheet(classe, titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([10, 10, W - 10, H - 10], outline=BLACK, width=2)
    d.rectangle([10, 10, W - 10, 84], fill=(245, 245, 245), outline=BLACK, width=2)
    d.text((24, 18), f"{classe}  ·  {titolo}", fill=BLACK, font=F22)
    d.text((24, 52), sub, fill=GRAY, font=F12)
    d.rectangle([W - 210, 18, W - 24, 70], outline=ACCENT, width=2)
    d.text((W - 198, 26), "TORNIO · FERRO", fill=ACCENT, font=F12)
    d.text((W - 198, 48), "grezzo Ø20 × 100", fill=ACCENT, font=F11)
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
    """Riquadro OBIETTIVO: titolo e testo lontani da tutte le linee del box."""
    x, w = 24, W - 48
    hdr = 40
    pad_top, pad_bot = 16, 22
    line_h = 30
    h = hdr + pad_top + len(lines) * line_h + pad_bot
    d.rectangle([x, y0, x + w, y0 + h], outline=BLACK, width=2)
    d.rectangle([x, y0, x + w, y0 + hdr], fill=LIGHT, outline=BLACK, width=2)
    # titolo centrato nell’header (aria sopra e sotto la linea)
    d.text((x + 12, y0 + 10), "OBIETTIVO", fill=BLACK, font=F13)
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
    return y0 + h + 12


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
    """Dicitura Ø a lato del pezzo — resta dentro i margini foglio."""
    tw = d.textlength(text, font=F15)
    margin = 28
    if side == "left":
        tx = max(margin, x - 18 - tw)
        d.line([x, y, tx + tw + 4, y], fill=DIM_COL, width=2)
        d.rectangle([tx - 2, y - 11, tx + tw + 4, y + 13], fill=WHITE)
        d.text((tx, y - 9), text, fill=DIM_COL, font=F15)
    else:
        tx = min(W - margin - tw, x + 18)
        d.line([x, y, tx - 2, y], fill=DIM_COL, width=2)
        d.rectangle([tx - 2, y - 11, tx + tw + 4, y + 13], fill=WHITE)
        d.text((tx, y - 9), text, fill=DIM_COL, font=F15)


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
# 2ª APRIBOTTIGLIE
# ═══════════════════════════════════════════
def make_2a():
    img, d = new_sheet(
        "2ª CLASSE",
        "APRIBOTTIGLIE",
        "Barra tonda acciaio Ø20 × 100 mm  ·  pezzo finito L = 80 mm",
    )

    # Margini interni del foglio
    LEFT, RIGHT = 36, W - 36

    draw_top = write_obiettivo(
        d,
        ["Tornitura + limatura del gancio. Grezzo → L=80 (avanzo ≈20 mm)."],
    )

    # ——— PANNELLO DISEGNO: profilo CHIARO + legenda numerata ———
    draw_h = 540
    panel(d, 24, draw_top, W - 48, draw_h, "COME È FATTO — vista laterale (scala 9:1)")
    panel_bottom = draw_top + draw_h

    # Riquadro spiegazione a destra (sempre leggibile)
    info_x1, info_x2 = 920, RIGHT
    d.rectangle([info_x1, draw_top + 40, info_x2, panel_bottom - 60], fill=(248, 250, 252), outline=BLACK, width=2)
    text_in_box(d, info_x1, draw_top + 44, info_x2 - info_x1, 28, "LEGGI QUI", F13, ACCENT, pad=8)
    for i, (num, col, title, desc) in enumerate(
        [
            ("1", STEEL, "CORPO", "manico Ø16 × 50"),
            ("2", STEEL_D, "TESTA", "Ø18 + foro Ø6"),
            ("3", ORANGE, "GANCIO", "uncino limato"),
        ]
    ):
        yy = draw_top + 85 + i * 95
        d.ellipse([info_x1 + 14, yy, info_x1 + 48, yy + 34], fill=col, outline=BLACK, width=2)
        tw = d.textlength(num, font=F15)
        d.text((info_x1 + 31 - tw / 2, yy + 5), num, fill=WHITE if i else BLACK, font=F15)
        d.text((info_x1 + 58, yy + 2), title, fill=BLACK, font=F14)
        text_in_box(d, info_x1 + 58, yy + 28, info_x2 - info_x1 - 70, 24, desc, F12, GRAY, pad=0)

    d.rectangle([info_x1 + 12, draw_top + 380, info_x2 - 12, draw_top + 490], fill=(255, 235, 230), outline=CAP_RED, width=2)
    text_in_box(d, info_x1 + 12, draw_top + 388, info_x2 - info_x1 - 24, 40, "BOCCA = zona bianca", F13, CAP_RED, pad=8)
    text_in_box(d, info_x1 + 12, draw_top + 432, info_x2 - info_x1 - 24, 48, "prende il bordo del tappo", F12, CAP_RED, pad=8)

    # Profilo a sinistra (spazio ampio)
    sc = 9.0
    mid = draw_top + 270
    ox = 70
    L_corpo, D_corpo = 50, 16
    L_testa, D_testa = 18, 18
    L_gancio = 12
    x0 = ox
    x1 = x0 + L_corpo * sc
    x2 = x1 + L_testa * sc
    end_x = x2 + L_gancio * sc
    g = L_gancio * sc

    # CORPO
    cy0, cy1 = mid - D_corpo * sc / 2, mid + D_corpo * sc / 2
    d.rectangle([x0, cy0, x1, cy1], fill=STEEL, outline=BLACK, width=3)
    d.polygon([(x0, cy0), (x0 + 10, cy0), (x0, cy0 + 10)], fill=WHITE, outline=BLACK)
    d.polygon([(x0, cy1), (x0 + 10, cy1), (x0, cy1 - 10)], fill=WHITE, outline=BLACK)

    # TESTA
    ty0, ty1 = mid - D_testa * sc / 2, mid + D_testa * sc / 2
    d.rectangle([x1, ty0, x2, ty1], fill=STEEL_D, outline=BLACK, width=3)
    hole_r = 3 * sc
    hx = x1 + L_testa * sc * 0.48
    d.ellipse([hx - hole_r, mid - hole_r, hx + hole_r, mid + hole_r], fill=WHITE, outline=BLACK, width=3)

    # GANCIO — profilo a C (dorso sopra, uncino sotto, bocca verso il basso)
    hook_outer = [
        (x2, ty0),
        (x2 + g * 0.92, ty0 + 2),
        (x2 + g, mid - 20),
        (x2 + g * 0.95, mid + 30),
        (x2 + g * 0.25, ty1 + 48),   # punta uncino
        (x2 + g * 0.08, ty1 + 22),
        (x2 + g * 0.35, mid + 18),   # risalita dentro la bocca
        (x2 + g * 0.55, mid + 8),
        (x2 + g * 0.50, mid - 6),
        (x2 + g * 0.15, mid - 10),   # dorso che appoggia sul tappo
        (x2, mid - 14),
    ]
    d.polygon(hook_outer, fill=ORANGE, outline=BLACK, width=3)
    # Bocca = vuoto bianco dove entra il TAPPO
    mouth = [
        (x2 + g * 0.18, mid - 6),
        (x2 + g * 0.58, mid - 4),
        (x2 + g * 0.62, mid + 10),
        (x2 + g * 0.38, mid + 20),
        (x2 + g * 0.15, mid + 16),
        (x2 + g * 0.12, mid + 2),
    ]
    d.polygon(mouth, fill=WHITE, outline=CAP_RED, width=3)
    d.line([(x2, ty0), (x2, ty1)], fill=BLACK, width=3)
    # mini etichette sul pezzo
    d.text((x2 + g * 0.55, ty0 - 22), "dorso", fill=ACCENT, font=F12)
    d.text((x2 + g * 0.05, ty1 + 52), "uncino", fill=ORANGE, font=F12)

    centerline(d, x0 - 16, end_x + 20, mid)

    # Quote sopra
    q1 = ty0 - 40
    q0 = q1 - 40
    for xx in (x0, x1, x2, end_x):
        ext_tick(d, xx, ty0, q0 - 2)
    dim_h(d, x0, x1, q1, "50")
    dim_h(d, x1, x2, q1, "18")
    dim_h(d, x2, end_x, q1, "12")
    dim_h(d, x0, end_x, q0, "80")

    # Diametri (dentro le zone colorate, niente overflow)
    d.text((x0 + 14, mid - 12), "Ø16", fill=DIM_COL, font=F15)
    d.text((x1 + 14, ty0 + 8), "Ø18", fill=WHITE, font=F14)

    # Pallini numerati DENTRO ogni pezzo
    def badge(cx, cy, n):
        d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=WHITE, outline=BLACK, width=2)
        tw = d.textlength(n, font=F15)
        d.text((cx - tw / 2, cy - 11), n, fill=BLACK, font=F15)

    badge((x0 + x1) / 2, mid, "1")
    badge((x1 + x2) / 2, mid + hole_r + 26, "2")
    badge(x2 + g * 0.62, ty0 + 20, "3")

    # Foro: richiamo sotto la testa, box largo abbastanza
    o6 = "foro Ø6 passante"
    o6w = d.textlength(o6, font=F13) + 20
    o6x = max(x1, hx - o6w / 2)
    if o6x + o6w > x2 + 8:
        o6x = x2 + 8 - o6w
    o6y = ty1 + 14
    d.line([hx, mid + hole_r, hx, o6y], fill=DIM_COL, width=2)
    d.rectangle([o6x, o6y, o6x + o6w, o6y + 30], fill=WHITE, outline=DIM_COL, width=2)
    d.text((o6x + 10, o6y + 5), o6, fill=DIM_COL, font=F13)

    # Bocca: freccia + box SOLO sotto il gancio (non sul pezzo)
    mx = x2 + g * 0.48
    mouth_y = mid + 26
    boc_t = max(o6y + 40, ty1 + 55)
    d.line([mx, mouth_y, mx, boc_t - 4], fill=CAP_RED, width=3)
    d.polygon([(mx, mouth_y - 4), (mx - 9, mouth_y + 12), (mx + 9, mouth_y + 12)], fill=CAP_RED)
    boc_w = 260
    boc_l = min(max(LEFT, mx - boc_w / 2), info_x1 - boc_w - 16)
    boc_h = 44
    # non coprire la legenda in basso
    if boc_t + boc_h > panel_bottom - 56:
        boc_t = panel_bottom - 56 - boc_h
    d.rectangle([boc_l, boc_t, boc_l + boc_w, boc_t + boc_h], fill=(255, 235, 230), outline=CAP_RED, width=3)
    text_in_box(d, boc_l, boc_t, boc_w, boc_h, "BOCCA — ci entra il TAPPO", F14, CAP_RED, pad=8)

    # Barra legenda in basso (testi corti, chip larghi)
    legend = [
        ("1 CORPO (manico)", STEEL, BLACK),
        ("2 TESTA (foro)", STEEL_D, WHITE),
        ("3 GANCIO (apre)", ORANGE, WHITE),
    ]
    tag_y = panel_bottom - 46
    gap = 10
    chip_w = (info_x1 - 16 - LEFT - 2 * gap) / 3
    for i, (lab, fill, tcol) in enumerate(legend):
        xa = LEFT + i * (chip_w + gap)
        d.rounded_rectangle([xa, tag_y, xa + chip_w, tag_y + 32], radius=6, fill=fill, outline=BLACK)
        text_in_box(d, xa, tag_y, chip_w, 32, lab, F12, tcol, pad=6)

    # ——— RIGA SOTTO: PRIMA/DOPO | DETTAGLIO ———
    row_y = panel_bottom + 10
    row_h = 280
    # Prima → Dopo
    d.rectangle([24, row_y, 600, row_y + row_h], outline=BLACK, width=2)
    d.rectangle([24, row_y, 600, row_y + 28], fill=LIGHT, outline=BLACK, width=2)
    d.text((36, row_y + 5), "PRIMA → DOPO limatura", fill=ACCENT, font=F13)
    d.rectangle([60, row_y + 70, 200, row_y + 150], fill=STEEL_D, outline=BLACK, width=2)
    d.text((80, row_y + 165), "dopo tornio", fill=GRAY, font=F12)
    d.polygon([(230, row_y + 110), (270, row_y + 95), (270, row_y + 125)], fill=ACCENT)
    d.polygon(
        [
            (300, row_y + 70), (420, row_y + 75), (440, row_y + 105),
            (380, row_y + 120), (430, row_y + 145), (350, row_y + 160), (300, row_y + 140),
        ],
        fill=ORANGE, outline=BLACK,
    )
    d.text((320, row_y + 175), "dopo lima (uncino)", fill=ORANGE, font=F12)
    text_in_box(d, 36, row_y + 214, 540, 24, "Smusso 1×45° · materiale S235 oppure C40", F12, GRAY, pad=2)
    text_in_box(d, 36, row_y + 242, 540, 24, "La bocca bianca prende il bordo del tappo.", F12, BLACK, pad=2)

    # Dettaglio gancio (testi interni al box)
    draw_hook_detail(d, 620, row_y, W - 24, row_y + row_h)

    # ——— FONDO ———
    bot = row_y + row_h + 10
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    for i, ln in enumerate(
        [
            "1. Sfacciatura → L = 80",
            "2. Tornitura corpo Ø16",
            "3. Tornitura testa Ø18",
            "4. Foratura Ø6 sulla testa",
            "5. Smussi 1×45°",
            "6. Limatura gancio + carteggio",
            "7. Prova bottiglia (con docente)",
        ]
    ):
        text_in_box(d, 36, y + 2 + i * 24, 370, 22, ln, F12, BLACK, pad=2)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    for i, ln in enumerate(
        [
            "□ L = 80 ± 0,5",
            "□ Ø corpo 16 ± 0,2",
            "□ Ø testa 18 ± 0,2",
            "□ Foro Ø6 pulito",
            "□ Gancio senza bave",
            "□ Apre il tappo",
            "□ Superficie satinata",
        ]
    ):
        text_in_box(d, 452, y2 + 2 + i * 24, 350, 22, ln, F12, BLACK, pad=2)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    d.text((848, y3 + 4), "Alunno/a:", fill=BLACK, font=F12)
    d.line([848, y3 + 28, 1185, y3 + 28], fill=BLACK, width=1)
    text_in_box(d, 848, y3 + 40, 340, 24, "Classe: ______  Data: __/__/____", F12, BLACK, pad=2)
    d.text((848, y3 + 72), "Voto /10: ______", fill=BLACK, font=F12)
    d.text((848, y3 + 104), "Firma docente:", fill=BLACK, font=F12)
    d.line([848, y3 + 130, 1185, y3 + 130], fill=BLACK, width=1)

    save(img, "01-2a-apribottiglie.png", "STAMPA-2a-apribottiglie.png")


# ═══════════════════════════════════════════
# 3ª POMOLO
# ═══════════════════════════════════════════
def make_3a():
    img, d = new_sheet(
        "3ª CLASSE",
        "POMOLO MANIGLIA M8",
        "Barra tonda acciaio Ø20 × 100 mm  ·  pezzo finito L = 36 mm  ·  filetto M8 × 1,25",
    )

    draw_top = write_obiettivo(
        d,
        [
            "Pomolo zigrinato per cassetto/anta. Prima zigrinatura + foro cieco filettato M8.",
            ("Dal grezzo si ricava L=36; l’avanzo serve per prove di zigrinatura.", GRAY),
        ],
    )
    draw_h = 680
    y = panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO TECNICO — vista laterale  (scala 12:1)")

    sc = 12.0
    mid = draw_top + 290
    ox = 140

    L1, D1 = 18, 20
    L2, D2 = 8, 12
    L3, D3 = 10, 14

    knurl_box(d, ox, mid - D1 * sc / 2, L1 * sc, D1 * sc)
    x2 = ox + L1 * sc
    d.rectangle([x2, mid - D2 * sc / 2, x2 + L2 * sc, mid + D2 * sc / 2], fill=STEEL_D, outline=BLACK, width=2)
    x3 = x2 + L2 * sc
    d.rectangle([x3, mid - D3 * sc / 2, x3 + L3 * sc, mid + D3 * sc / 2], fill=STEEL, outline=BLACK, width=2)

    d.line([ox, mid - D1 * sc / 2, ox + 8, mid - D1 * sc / 2 + 8], fill=BLACK, width=2)
    d.line([ox, mid + D1 * sc / 2, ox + 8, mid + D1 * sc / 2 - 8], fill=BLACK, width=2)

    hole_d = 6.8 * sc
    hole_depth = 12 * sc
    hx0 = x3 + L3 * sc - hole_depth
    end = x3 + L3 * sc
    d.rectangle([hx0, mid - hole_d / 2, end, mid + hole_d / 2], fill=WHITE, outline=BLACK, width=2)
    for i in range(5):
        xx = hx0 + 10 + i * 18
        if xx < end - 6:
            d.line([xx, mid - hole_d / 2, xx + 5, mid + hole_d / 2], fill=SOFT, width=1)

    centerline(d, ox - 35, end + 55, mid)

    q1 = mid - D1 * sc / 2 - 36
    q0 = q1 - 42
    for xx in (ox, x2, x3, end):
        ext_tick(d, xx, mid - D1 * sc / 2, q0 - 4)
    dim_h(d, ox, x2, q1, "18")
    dim_h(d, x2, x3, q1, "8")
    dim_h(d, x3, end, q1, "10")
    dim_h(d, ox, end, q0, "36")

    # Diametri fuori profilo
    label_dia(d, ox, mid, "Ø20", side="left")
    # Ø12 sotto il collo, con richiamo
    cy12 = mid + D1 * sc / 2 + 36
    d.line([x2 + L2 * sc / 2, mid + D2 * sc / 2, x2 + L2 * sc / 2, cy12], fill=BLACK, width=1)
    tw = d.textlength("Ø12", font=F16)
    d.rectangle([x2 + L2 * sc / 2 - tw / 2 - 3, cy12 + 2, x2 + L2 * sc / 2 + tw / 2 + 3, cy12 + 26], fill=WHITE)
    d.text((x2 + L2 * sc / 2 - tw / 2, cy12 + 4), "Ø12", fill=DIM_COL, font=F16)

    label_dia(d, end, mid, "Ø14", side="right")

    # Quota profondità foro sotto
    qf = mid + D1 * sc / 2 + 70
    ext_tick(d, hx0, mid + hole_d / 2, qf)
    ext_tick(d, end, mid + hole_d / 2, qf)
    dim_h(d, hx0, end, qf, "12", above=False)
    d.text((hx0, qf + 28), "foro cieco Ø6,8  →  maschio M8 × 1,25", fill=DIM_COL, font=F15)

    ny = qf + 55
    label_note(d, ox, ny, "Zigrinatura a rombi (doppia) su tutta la lunghezza del Ø20")
    label_note(d, ox, ny + 26, "Smusso 1 × 45° sul bordo anteriore del pomolo")

    # Vista frontale
    bx1, by1 = 940, 230
    d.rectangle([bx1, by1, 1185, 500], outline=BLACK, width=2)
    d.rectangle([bx1, by1, 1185, by1 + 28], fill=LIGHT, outline=BLACK, width=2)
    d.text((bx1 + 10, by1 + 5), "VISTA FRONTALE", fill=BLACK, font=F12)
    cx, cy, R = 1062, 375, 90
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=STEEL, outline=BLACK, width=2)
    d.ellipse([cx - R + 12, cy - R + 12, cx + R - 12, cy + R - 12], outline=SOFT, width=1)
    r2 = 22
    d.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], fill=WHITE, outline=BLACK, width=2)
    d.text((cx - 36, cy + R + 12), "Ø20  ·  M8", fill=BLACK, font=F12)

    # Zigrinatura breve — testi sempre dentro il riquadro
    zg_box_w = 1185 - bx1
    d.rectangle([bx1, 520, 1185, draw_top + draw_h - 16], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(d, bx1, 524, zg_box_w, 28, "ZIGRINATURA — base", F13, WARN, pad=10)
    for i, ln in enumerate(
        [
            "• Rulli a rombi (2 rulli)",
            "• 60–100 giri/min",
            "• Olio abbondante",
            "• Pressione a piccoli passi",
            "• Avanza sui 18 mm",
            "• Non tornire dopo",
            "Dettaglio → scheda 4ª",
        ]
    ):
        text_in_box(d, bx1 + 4, 558 + i * 28, zg_box_w - 8, 26, ln, F12, BLACK, pad=8)

    bot = draw_top + draw_h + 12
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    for i, ln in enumerate(
        [
            "1. Sfacciatura → L = 36",
            "2. Pomolo Ø20 + zigrinatura",
            "3. Collo Ø12 e boccola Ø14",
            "4. Foro Ø6,8 × 12 (cieco)",
            "5. Maschio M8 × 1,25",
            "6. Smusso + satinatura",
        ]
    ):
        d.text((36, y + 6 + i * 30), ln, fill=BLACK, font=F12)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    for i, ln in enumerate(
        [
            "□ L = 36 ± 0,3",
            "□ Zigrinatura regolare",
            "□ Nessun dente saltato",
            "□ Vite M8 entra bene",
            "□ Presa comoda",
            "□ Finitura curata",
        ]
    ):
        d.text((452, y2 + 6 + i * 30), ln, fill=BLACK, font=F12)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    d.text((848, y3 + 8), "Alunno/a:", fill=BLACK, font=F12)
    d.line([848, y3 + 36, 1185, y3 + 36], fill=BLACK, width=1)
    d.text((848, y3 + 52), "Classe: ______  Data: __/__/____", fill=BLACK, font=F12)
    d.text((848, y3 + 90), "Voto /10: ______", fill=BLACK, font=F12)
    d.text((848, y3 + 128), "Firma docente:", fill=BLACK, font=F12)
    d.line([848, y3 + 158, 1185, y3 + 158], fill=BLACK, width=1)
    d.text((848, y3 + 178), "Note: ________________________", fill=BLACK, font=F12)

    save(img, "02-3a-pomolo-maniglia.png", "STAMPA-3a-pomolo-maniglia.png")


# ═══════════════════════════════════════════
# 4ª CACCIAVITE
# ═══════════════════════════════════════════
def make_4a():
    img, d = new_sheet(
        "4ª CLASSE",
        "CACCIAVITE A TAGLIO",
        "Barra tonda acciaio C40 Ø20 × 100 mm  ·  utensile monopezzo L = 100 mm",
    )

    draw_top = write_obiettivo(
        d,
        ["Cacciavite monopezzo: zigrinatura del manico, gola di scarico, lama a taglio."],
    )
    draw_h = 600
    y = panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO TECNICO — vista laterale  (scala 6,5:1)")

    sc = 6.5
    mid = draw_top + 280
    ox = 70
    # 42+5+18+30+5 = 100
    segs = [
        (42, 18, True),
        (5, 10, False),
        (18, 12, False),
        (30, 8, False),
    ]
    x = ox
    xs = []
    for L, Dia, kn in segs:
        ww, hh = L * sc, Dia * sc
        if kn:
            knurl_box(d, x, mid - hh / 2, ww, hh)
        else:
            fill = STEEL_D if Dia <= 10 else STEEL
            d.rectangle([x, mid - hh / 2, x + ww, mid + hh / 2], fill=fill, outline=BLACK, width=2)
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

    # Quote lunghezze
    top_r = mid - 18 * sc / 2
    q1 = top_r - 36
    q0 = q1 - 42
    for xx in (ox, xs[1][0], xs[2][0], xs[3][0], end_x):
        ext_tick(d, xx, top_r, q0 - 4)
    dim_h(d, xs[0][0], xs[0][0] + xs[0][1], q1, "42")
    dim_h(d, xs[1][0], xs[1][0] + xs[1][1], q1, "5")
    dim_h(d, xs[2][0], xs[2][0] + xs[2][1], q1, "18")
    dim_h(d, xs[3][0], end_x, q1, "35")
    dim_h(d, ox, end_x, q0, "100")

    # Diametri — tutti sotto, in posizioni sfalsate per non sovrapporsi
    bot_r = mid + 18 * sc / 2
    # Ø18 sotto manico
    c0 = xs[0][0] + xs[0][1] / 2
    y_d = bot_r + 40
    d.line([c0, bot_r, c0, y_d], fill=BLACK, width=1)
    tw = d.textlength("Ø18", font=F16)
    d.rectangle([c0 - tw / 2 - 3, y_d + 2, c0 + tw / 2 + 3, y_d + 26], fill=WHITE)
    d.text((c0 - tw / 2, y_d + 4), "Ø18", fill=DIM_COL, font=F16)

    # Ø10 sotto gola
    c1 = xs[1][0] + xs[1][1] / 2
    y_d1 = bot_r + 75
    d.line([c1, mid + 10 * sc / 2, c1, y_d1], fill=DIM_COL, width=2)
    tw = d.textlength("Ø10", font=F16)
    d.rectangle([c1 - tw / 2 - 3, y_d1 + 2, c1 + tw / 2 + 3, y_d1 + 26], fill=WHITE)
    d.text((c1 - tw / 2, y_d1 + 4), "Ø10", fill=DIM_COL, font=F16)

    # Ø12 sotto collo
    c2 = xs[2][0] + xs[2][1] / 2
    y_d2 = bot_r + 40
    d.line([c2, mid + 12 * sc / 2, c2, y_d2], fill=DIM_COL, width=2)
    tw = d.textlength("Ø12", font=F16)
    d.rectangle([c2 - tw / 2 - 3, y_d2 + 2, c2 + tw / 2 + 3, y_d2 + 26], fill=WHITE)
    d.text((c2 - tw / 2, y_d2 + 4), "Ø12", fill=DIM_COL, font=F16)

    # Ø8 a destra punta
    label_dia(d, end_x, mid, "Ø8", side="right")

    ny = bot_r + 105
    label_note(d, ox, ny, "Manico: zigrinatura a rombi (doppia) su Ø18")
    label_note(d, ox, ny + 26, "Gola di scarico Ø10 tra manico e collo  ·  lama a taglio limata a mano (simmetrica)")
    label_note(d, ox, ny + 52, "L tot. 100 = 42 + 5 + 18 + 35  (gambo 30 + taglio 5)", )

    # Zigrinatura
    zg = draw_top + draw_h + 10
    zg_h = 300
    y = panel(d, 24, zg, W - 48, zg_h, "COME SI FA LA ZIGRINATURA")
    col1 = [
        "COSA SERVE",
        "• Zigrinatore a 2 rulli (rombi)",
        "• Olio da taglio abbondante",
        "• Pezzo già a Ø18 finito",
        "• Pezzo corto e ben serrato",
        "",
        "PARAMETRI (acciaio)",
        "• Velocità: 60–120 giri/min",
        "• Avanzamento: lento, costante",
        "• Pressione: a piccoli passi",
    ]
    col2 = [
        "SEQUENZA",
        "1. Allinea i rulli all’asse del pezzo",
        "2. Moto a giri bassi + olio",
        "3. Avvicina i rulli fino al contatto",
        "4. Aumenta pressione: nascono i rombi",
        "5. Avanza sui 42 mm senza fermarti",
        "6. Controlla: rombi regolari, no doppie tracce",
        "7. Non tornire dopo (solo sbavatura)",
        "",
        "SICUREZZA: occhiali · non toccare rulli in moto",
    ]
    for i, ln in enumerate(col1):
        if ln in ("COSA SERVE", "PARAMETRI (acciaio)"):
            d.text((40, y + 2 + i * 24), ln, fill=ACCENT, font=F13)
        else:
            d.text((40, y + 2 + i * 24), ln, fill=BLACK, font=F12)
    for i, ln in enumerate(col2):
        if ln == "SEQUENZA":
            d.text((640, y + 2 + i * 24), ln, fill=ACCENT, font=F13)
        else:
            d.text((640, y + 2 + i * 24), ln, fill=BLACK, font=F12)

    bot = zg + zg_h + 10
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 560, bh, "CONTROLLO / DATI")
    d.text((36, y + 4), "□ Zigrinatura ok   □ L=100±0,5   □ Ø18 / Ø12 / Ø8", fill=BLACK, font=F12)
    d.text((36, y + 32), "□ Lama simmetrica   □ Prova su vite M4 o M5", fill=BLACK, font=F12)
    d.text((36, y + 64), "Alunno/a: ________________  Classe: ______", fill=BLACK, font=F12)
    d.text((36, y + 94), "Data: __/__/____   Voto: ______   Firma: __________", fill=BLACK, font=F12)

    y2 = panel(d, 600, bot, W - 24 - 600, bh, "DISTINTA")
    d.text((612, y2 + 8), "1 × barra Ø20 × 100 — acciaio C40", fill=BLACK, font=F12)
    d.text((612, y2 + 36), "Olio da taglio", fill=BLACK, font=F12)
    d.text((612, y2 + 64), "Zigrinatore a rombi", fill=BLACK, font=F12)
    d.text((612, y2 + 92), "Lima fina (per il taglio)", fill=BLACK, font=F12)

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
    draw_h = 720
    y = panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO TECNICO — vista laterale  (scala 7:1)")

    sc = 7.0
    mid = draw_top + 290
    ox = 90

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
    q1 = top_r - 36
    q0 = q1 - 42
    for xx in (ox, x2, x3, tip):
        ext_tick(d, xx, top_r, q0 - 4)
    dim_h(d, ox, x2, q1, "22")
    dim_h(d, x2, x3, q1, "8")
    dim_h(d, x3, tip, q1, "70")
    dim_h(d, ox, tip, q0, "100")

    # Diametri fuori
    label_dia(d, ox, mid, "Ø20", side="left")

    # Ø16 sotto sottotesta
    c16 = x2 + 4 * sc
    y16 = mid + 10 * sc + 40
    d.line([c16, mid + 8 * sc, c16, y16], fill=BLACK, width=1)
    tw = d.textlength("Ø16", font=F16)
    d.rectangle([c16 - tw / 2 - 3, y16 + 2, c16 + tw / 2 + 3, y16 + 26], fill=WHITE)
    d.text((c16 - tw / 2, y16 + 4), "Ø16", fill=DIM_COL, font=F16)

    # M10 a destra
    label_dia(d, tip, mid, "M10×1,5", side="right")

    ny = mid + 10 * sc + 80
    label_note(d, ox, ny, "Zigrinatura a rombi (doppia) sul pomolo Ø20")
    label_note(d, ox, ny + 28, "Filetto metrico ISO M10 × 1,5 per 70 mm  ·  smusso di entrata sul filetto 1 × 45°")
    label_note(d, ox, ny + 56, "Punta: a scelta bombata (non segna il pezzo) oppure piana")
    label_note(d, ox, ny + 84, "L tot. 100 = 22 (pomolo) + 8 (sottotesta) + 70 (gambo filettato)")

    # Nota zigrinatura — testo intero dentro il riquadro
    zb = draw_top + draw_h - 90
    d.rectangle([40, zb, W - 40, zb + 70], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(
        d, 40, zb + 6, W - 80, 30,
        "ZIGRINATURA: giri bassi (60–120) · olio · pressione progressiva · non tornire dopo.",
        F12, WARN, pad=12,
    )
    text_in_box(
        d, 40, zb + 36, W - 80, 28,
        "Dettaglio completo sulla scheda 4ª classe (cacciavite).",
        F12, GRAY, pad=12,
    )

    bot = draw_top + draw_h + 12
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    for i, ln in enumerate(
        [
            "1. Sfacciatura → L = 100",
            "2. Pomolo Ø20 + zigrinatura",
            "3. Sottotesta Ø16",
            "4. Gambo Ø9,8–10 × 70",
            "5. Filettatura M10×1,5",
            "6. Smusso ingresso + finitura",
        ]
    ):
        d.text((36, y + 6 + i * 30), ln, fill=BLACK, font=F12)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    for i, ln in enumerate(
        [
            "□ L = 100 ± 0,3",
            "□ Zigrinatura regolare",
            "□ Entra in madrevite M10",
            "□ Filetto senza bave",
            "□ Pomolo comodo",
            "□ Asse allineato",
        ]
    ):
        d.text((452, y2 + 6 + i * 30), ln, fill=BLACK, font=F12)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    d.text((848, y3 + 8), "Alunno/a:", fill=BLACK, font=F12)
    d.line([848, y3 + 36, 1185, y3 + 36], fill=BLACK, width=1)
    d.text((848, y3 + 52), "Classe: ______  Data: __/__/____", fill=BLACK, font=F12)
    d.text((848, y3 + 90), "Voto /10: ______", fill=BLACK, font=F12)
    d.text((848, y3 + 128), "Firma docente:", fill=BLACK, font=F12)
    d.line([848, y3 + 158, 1185, y3 + 158], fill=BLACK, width=1)
    d.text((848, y3 + 178), "Note: ________________________", fill=BLACK, font=F12)

    save(img, "04-5a-vite-bloccaggio.png", "STAMPA-5a-vite-bloccaggio.png")


if __name__ == "__main__":
    make_2a()
    make_3a()
    make_4a()
    make_5a()
    print("ALL DONE")

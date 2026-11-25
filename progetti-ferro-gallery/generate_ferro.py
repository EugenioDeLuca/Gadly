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
    """Dicitura Ø a lato — offset largo, SOPRA la linea d’asse (niente overlap)."""
    tw = d.textlength(text, font=F15)
    margin = 28
    gap = 36
    box_h = 30
    # sposta la dicitura 22px SOPRA l’asse così non passa sulla centerline
    ly = y - 22
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
# 2ª TESTA DI MARTELLO (solo ferro — manico dopo)
# ═══════════════════════════════════════════
def make_2a():
    img, d = new_sheet(
        "2ª CLASSE",
        "TESTA DI MARTELLO",
        "Barra tonda acciaio Ø20 × 100 mm  ·  solo la testa in ferro  ·  L = 50 mm",
    )

    draw_top = write_obiettivo(
        d,
        [
            "Solo la TESTA in ferro. Il manico si inserisce DOPO nel foro (non si fa in questo pezzo).",
            ("Tornitura + foratura Ø10 passante per il manico.", GRAY),
        ],
    )

    draw_h = 720
    panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO PRINCIPALE — testa di ferro (scala 12:1)")
    panel_bottom = draw_top + draw_h

    info_x1, info_x2 = 900, W - 36
    d.rectangle([info_x1, draw_top + 48, info_x2, panel_bottom - 58], fill=(248, 250, 252), outline=BLACK, width=2)
    d.rectangle([info_x1, draw_top + 48, info_x2, draw_top + 88], fill=LIGHT, outline=BLACK, width=2)
    d.text((info_x1 + 12, draw_top + 56), "LEGGI QUI", fill=ACCENT, font=F14)

    blocks = [
        (STEEL_D, "CORPO", "Ø20 × 50 mm", "Testa in ferro"),
        (WHITE, "FORO", "Ø10 passante", "Per il manico"),
        ((90, 150, 100), "FACCE", "piatte 1×45°", "Dove si batte"),
    ]
    for i, (col, title, line1, line2) in enumerate(blocks):
        yy = draw_top + 110 + i * 110
        outline = BLACK if col != WHITE else ACCENT
        d.rounded_rectangle([info_x1 + 12, yy, info_x2 - 12, yy + 96], radius=8, fill=WHITE, outline=outline if col == WHITE else col, width=3)
        fill_b = col if col != WHITE else ACCENT
        d.ellipse([info_x1 + 22, yy + 28, info_x1 + 58, yy + 64], fill=fill_b, outline=BLACK, width=2)
        num = str(i + 1)
        tw = d.textlength(num, font=F15)
        d.text((info_x1 + 40 - tw / 2, yy + 36), num, fill=WHITE, font=F15)
        tx = info_x1 + 72
        d.text((tx, yy + 12), f"{num}  {title}", fill=BLACK, font=F14)
        d.text((tx, yy + 44), line1, fill=GRAY, font=F13)
        d.text((tx, yy + 70), line2, fill=GRAY, font=F12)

    d.rectangle([info_x1 + 12, draw_top + 450, info_x2 - 12, draw_top + 580], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(d, info_x1 + 12, draw_top + 460, info_x2 - info_x1 - 24, 40, "MANICO = DOPO", F14, WARN, pad=8)
    text_in_box(d, info_x1 + 12, draw_top + 508, info_x2 - info_x1 - 24, 56, "Si infila nel foro Ø10 (legno o altro)", F13, WARN, pad=8)

    # Disegno grande: cilindro corto con foro passante (vista laterale)
    sc = 12.0
    mid = draw_top + 300
    ox = 120
    L, Dia = 50, 20
    ww, hh = L * sc, Dia * sc
    # corpo
    d.rectangle([ox, mid - hh / 2, ox + ww, mid + hh / 2], fill=STEEL_D, outline=BLACK, width=3)
    # smussi facce
    d.polygon([(ox, mid - hh / 2), (ox + 12, mid - hh / 2), (ox, mid - hh / 2 + 12)], fill=WHITE, outline=BLACK)
    d.polygon([(ox, mid + hh / 2), (ox + 12, mid + hh / 2), (ox, mid + hh / 2 - 12)], fill=WHITE, outline=BLACK)
    d.polygon([(ox + ww, mid - hh / 2), (ox + ww - 12, mid - hh / 2), (ox + ww, mid - hh / 2 + 12)], fill=WHITE, outline=BLACK)
    d.polygon([(ox + ww, mid + hh / 2), (ox + ww - 12, mid + hh / 2), (ox + ww, mid + hh / 2 - 12)], fill=WHITE, outline=BLACK)

    # foro manico (ellisse al centro = sezione passante)
    hole_r = 5 * sc  # Ø10
    hx = ox + ww / 2
    d.ellipse([hx - hole_r * 0.45, mid - hole_r, hx + hole_r * 0.45, mid + hole_r], fill=WHITE, outline=BLACK, width=3)
    # linee tratteggiate foro passante (verso di uscita)
    d.line([hx, mid - hole_r, hx, mid - hh / 2 - 8], fill=CAP_RED, width=2)
    d.line([hx, mid + hole_r, hx, mid + hh / 2 + 8], fill=CAP_RED, width=2)

    centerline(d, ox - 20, ox + ww + 20, mid)

    # Quote
    top_r = mid - hh / 2
    q1 = top_r - 48
    q0 = q1 - 48
    ext_tick(d, ox, top_r, q0 - 2)
    ext_tick(d, ox + ww, top_r, q0 - 2)
    dim_h(d, ox, ox + ww, q1, "50")
    dim_h(d, ox, ox + ww, q0, "L = 50")

    # Ø20
    tw = d.textlength("Ø20", font=F16)
    d.rectangle([ox + 20, mid - 28, ox + 20 + tw + 12, mid - 2], fill=WHITE, outline=DIM_COL, width=1)
    d.text((ox + 26, mid - 24), "Ø20", fill=DIM_COL, font=F16)

    # etichetta foro
    foro_y = mid + hh / 2 + 50
    d.line([hx, mid + hole_r, hx, foro_y], fill=CAP_RED, width=2)
    ftxt = "foro Ø10 — per il manico"
    ftw = d.textlength(ftxt, font=F14) + 20
    d.rectangle([hx - ftw / 2, foro_y + 4, hx + ftw / 2, foro_y + 38], fill=(255, 235, 230), outline=CAP_RED, width=2)
    d.text((hx - ftw / 2 + 10, foro_y + 10), ftxt, fill=CAP_RED, font=F14)

    # Vista frontale a destra del pezzo (prima della legenda)
    vx, vy, vr = 720, mid, 70
    d.ellipse([vx - vr, vy - vr, vx + vr, vy + vr], fill=STEEL, outline=BLACK, width=3)
    d.ellipse([vx - 28, vy - 28, vx + 28, vy + 28], fill=WHITE, outline=BLACK, width=3)
    d.text((vx - 70, vy + vr + 12), "VISTA FRONTALE", fill=BLACK, font=F13)
    d.text((vx - 55, vy + vr + 40), "Ø20  ·  foro Ø10", fill=GRAY, font=F12)

    note_y = foro_y + 55
    text_in_box(d, ox, note_y, info_x1 - ox - 30, 28, "Il manico NON si fa ora: si inserisce dopo nel foro.", F14, BLACK, pad=2)
    text_in_box(d, ox, note_y + 32, info_x1 - ox - 30, 28, "Materiale S235 o C40 · smussi 1×45° sulle due facce.", F13, GRAY, pad=2)

    legend = [
        ("1 CORPO Ø20×50", STEEL_D, WHITE),
        ("2 FORO Ø10", ACCENT, WHITE),
        ("3 FACCE piatte", (90, 150, 100), WHITE),
    ]
    tag_y = panel_bottom - 52
    gap = 10
    chip_w = (info_x1 - 40 - 2 * gap) / 3
    for i, (lab, fill, tcol) in enumerate(legend):
        xa = 36 + i * (chip_w + gap)
        d.rounded_rectangle([xa, tag_y, xa + chip_w, tag_y + 36], radius=8, fill=fill, outline=BLACK, width=2)
        text_in_box(d, xa, tag_y, chip_w, 36, lab, F12, tcol, pad=4)

    bot = panel_bottom + 12
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    fasi = [
        "1. Sfacciatura → L = 50",
        "2. Tornitura corpo Ø20",
        "3. Foratura Ø10 passante",
        "4. Smussi 1×45° sulle facce",
        "5. Controllo + satinatura",
        "6. Manico: si mette DOPO",
    ]
    step = max(28, (bh - 55) // len(fasi))
    for i, ln in enumerate(fasi):
        text_in_box(d, 32, y + 4 + i * step, 384, step - 6, ln, F13, BLACK, pad=4)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    ctrl = [
        "□ L = 50 ± 0,3",
        "□ Ø20 ± 0,2",
        "□ Foro Ø10 passante",
        "□ Facce piatte",
        "□ Smussi 1×45°",
        "□ Superficie satinata",
    ]
    step_c = max(26, (bh - 55) // len(ctrl))
    for i, ln in enumerate(ctrl):
        text_in_box(d, 448, y2 + 4 + i * step_c, 364, step_c - 4, ln, F13, BLACK, pad=4)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    text_in_box(d, 848, y3 + 8, 340, 28, "Alunno/a:", F13, BLACK, pad=2)
    d.line([848, y3 + 38, 1190, y3 + 38], fill=BLACK, width=1)
    text_in_box(d, 848, y3 + 48, 340, 28, "Classe: ____  Data: __/__/__", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 86, 340, 28, "Voto /10: ______", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 124, 340, 28, "Firma docente:", F13, BLACK, pad=2)
    d.line([848, y3 + 156, 1190, y3 + 156], fill=BLACK, width=1)

    save(img, "01-2a-testa-martello.png", "STAMPA-2a-testa-martello.png")


# ═══════════════════════════════════════════
# 3ª PERNO A SPALLAMENTI + SCALINATURE
# ═══════════════════════════════════════════
def make_3a():
    img, d = new_sheet(
        "3ª CLASSE",
        "PERNO A SPALLAMENTI",
        "Barra tonda acciaio Ø20 × 100 mm  ·  pezzo finito L = 70 mm  ·  con scalinature",
    )

    draw_top = write_obiettivo(
        d,
        [
            "Perno a 4 diametri (spallamenti) + scalinatura (zigrinatura) sul corpo Ø16.",
            ("Più preciso della 2ª: un diametro in più e presa zigrinata.", GRAY),
        ],
    )

    draw_h = 720
    panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO PRINCIPALE — 4 diametri + scalinatura (scala 10:1)")
    panel_bottom = draw_top + draw_h

    info_x1, info_x2 = 900, W - 36
    d.rectangle([info_x1, draw_top + 48, info_x2, panel_bottom - 58], fill=(248, 250, 252), outline=BLACK, width=2)
    d.rectangle([info_x1, draw_top + 48, info_x2, draw_top + 88], fill=LIGHT, outline=BLACK, width=2)
    d.text((info_x1 + 12, draw_top + 56), "LEGGI QUI", fill=ACCENT, font=F14)

    blocks = [
        (STEEL_D, "TESTA", "Ø18 × 15", "Parte grossa"),
        (STEEL, "CORPO", "Ø16 × 15", "SCALINATO"),
        ((100, 160, 190), "COLLO", "Ø14 × 20", "Diametro medio"),
        ((90, 150, 100), "GAMBO", "Ø10 × 20", "Parte sottile"),
    ]
    for i, (col, title, line1, line2) in enumerate(blocks):
        yy = draw_top + 100 + i * 95
        d.rounded_rectangle([info_x1 + 12, yy, info_x2 - 12, yy + 86], radius=8, fill=WHITE, outline=col, width=3)
        d.ellipse([info_x1 + 22, yy + 24, info_x1 + 56, yy + 58], fill=col, outline=BLACK, width=2)
        num = str(i + 1)
        tw = d.textlength(num, font=F15)
        d.text((info_x1 + 39 - tw / 2, yy + 32), num, fill=WHITE, font=F15)
        tx = info_x1 + 68
        d.text((tx, yy + 10), f"{num}  {title}", fill=BLACK, font=F14)
        d.text((tx, yy + 38), line1, fill=GRAY, font=F13)
        d.text((tx, yy + 60), line2, fill=ORANGE if "SCALIN" in line2 else GRAY, font=F12)

    d.rectangle([info_x1 + 12, draw_top + 490, info_x2 - 12, draw_top + 580], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(d, info_x1 + 12, draw_top + 498, info_x2 - info_x1 - 24, 36, "SCALINATURA = zigrinatura", F13, WARN, pad=6)
    text_in_box(d, info_x1 + 12, draw_top + 536, info_x2 - info_x1 - 24, 36, "sul Ø16 (rombi) · olio · giri bassi", F12, WARN, pad=6)

    sc = 10.0
    mid = draw_top + 310
    ox = 70
    # 15+15+20+20 = 70
    segs = [
        (15, 18, STEEL_D, False),
        (15, 16, STEEL, True),   # scalinato
        (20, 14, (100, 160, 190), False),
        (20, 10, (90, 150, 100), False),
    ]
    x = ox
    xs = []
    for L, Dia, col, kn in segs:
        ww, hh = L * sc, Dia * sc
        if kn:
            knurl_box(d, x, mid - hh / 2, ww, hh)
        else:
            d.rectangle([x, mid - hh / 2, x + ww, mid + hh / 2], fill=col, outline=BLACK, width=3)
        xs.append((x, ww, hh, L, Dia, col, kn))
        x += ww
    end_x = x

    d.polygon([(ox, mid - xs[0][2] / 2), (ox + 10, mid - xs[0][2] / 2), (ox, mid - xs[0][2] / 2 + 10)], fill=WHITE, outline=BLACK)
    d.polygon([(ox, mid + xs[0][2] / 2), (ox + 10, mid + xs[0][2] / 2), (ox, mid + xs[0][2] / 2 - 10)], fill=WHITE, outline=BLACK)
    d.polygon([(end_x, mid - xs[3][2] / 2), (end_x - 8, mid - xs[3][2] / 2), (end_x, mid - xs[3][2] / 2 + 8)], fill=WHITE, outline=BLACK)
    d.polygon([(end_x, mid + xs[3][2] / 2), (end_x - 8, mid + xs[3][2] / 2), (end_x, mid + xs[3][2] / 2 - 8)], fill=WHITE, outline=BLACK)

    centerline(d, ox - 16, end_x + 16, mid)

    top_r = mid - 18 * sc / 2
    q1 = top_r - 48
    q0 = q1 - 48
    ticks = [ox] + [s[0] for s in xs[1:]] + [end_x]
    for xx in ticks:
        ext_tick(d, xx, top_r, q0 - 2)
    dim_h(d, xs[0][0], xs[0][0] + xs[0][1], q1, "15")
    dim_h(d, xs[1][0], xs[1][0] + xs[1][1], q1, "15")
    dim_h(d, xs[2][0], xs[2][0] + xs[2][1], q1, "20")
    dim_h(d, xs[3][0], xs[3][0] + xs[3][1], q1, "20")
    dim_h(d, ox, end_x, q0, "70")

    for (x0s, ww, hh, L, Dia, col, kn), lab in zip(xs, ["Ø18", "Ø16", "Ø14", "Ø10"]):
        tw = d.textlength(lab, font=F16)
        cx = x0s + ww / 2
        ty = mid - 28
        d.rectangle([cx - tw / 2 - 6, ty - 4, cx + tw / 2 + 6, ty + 24], fill=WHITE, outline=DIM_COL, width=1)
        d.text((cx - tw / 2, ty), lab, fill=DIM_COL, font=F16)

    def badge(cx, cy, n, bg):
        d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=bg, outline=BLACK, width=2)
        tw = d.textlength(n, font=F14)
        d.text((cx - tw / 2, cy - 10), n, fill=WHITE, font=F14)

    badge_y = mid + 18 * sc / 2 + 38
    for i, s in enumerate(xs):
        badge(s[0] + s[1] / 2, badge_y, str(i + 1), s[5])

    # freccia scalinatura sotto il corpo zigrinato
    sx = xs[1][0] + xs[1][1] / 2
    d.line([sx, mid + xs[1][2] / 2, sx, badge_y - 22], fill=ORANGE, width=2)
    text_in_box(d, sx - 90, badge_y + 28, 200, 28, "← SCALINATURA", F13, ORANGE, pad=2)

    note_y = badge_y + 60
    text_in_box(d, ox, note_y, info_x1 - ox - 20, 28, "4 spallamenti: Ø18 → Ø16 (scalinato) → Ø14 → Ø10", F13, BLACK, pad=2)
    text_in_box(d, ox, note_y + 30, info_x1 - ox - 20, 28, "Scalinatura: rulli a rombi · 60–100 giri/min · olio · non tornire dopo.", F12, GRAY, pad=2)

    legend = [
        ("1 Ø18", STEEL_D, WHITE),
        ("2 Ø16 scal.", STEEL, BLACK),
        ("3 Ø14", (100, 160, 190), BLACK),
        ("4 Ø10", (90, 150, 100), WHITE),
    ]
    tag_y = panel_bottom - 52
    gap = 8
    chip_w = (info_x1 - 40 - 3 * gap) / 4
    for i, (lab, fill, tcol) in enumerate(legend):
        xa = 36 + i * (chip_w + gap)
        d.rounded_rectangle([xa, tag_y, xa + chip_w, tag_y + 36], radius=8, fill=fill, outline=BLACK, width=2)
        text_in_box(d, xa, tag_y, chip_w, 36, lab, F12, tcol, pad=4)

    bot = panel_bottom + 12
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 400, bh, "FASI DI LAVORO")
    fasi = [
        "1. Sfacciatura → L = 70",
        "2. Tornitura Ø18 × 15",
        "3. Tornitura Ø16 × 15",
        "4. Scalinatura sul Ø16",
        "5. Tornitura Ø14 e Ø10",
        "6. Smussi + satinatura",
    ]
    step = max(26, (bh - 55) // len(fasi))
    for i, ln in enumerate(fasi):
        text_in_box(d, 32, y + 4 + i * step, 384, step - 6, ln, F13, BLACK, pad=4)

    y2 = panel(d, 440, bot, 380, bh, "CONTROLLO")
    ctrl = [
        "□ L = 70 ± 0,3",
        "□ Ø18/16/14/10 ± 0,2",
        "□ Scalinatura regolare",
        "□ Spallamenti netti",
        "□ Smussi + satinatura",
    ]
    step_c = max(26, (bh - 55) // len(ctrl))
    for i, ln in enumerate(ctrl):
        text_in_box(d, 448, y2 + 4 + i * step_c, 364, step_c - 4, ln, F13, BLACK, pad=4)

    y3 = panel(d, 836, bot, W - 24 - 836, bh, "DATI ALUNNO")
    text_in_box(d, 848, y3 + 8, 340, 28, "Alunno/a:", F13, BLACK, pad=2)
    d.line([848, y3 + 38, 1190, y3 + 38], fill=BLACK, width=1)
    text_in_box(d, 848, y3 + 48, 340, 28, "Classe: ____  Data: __/__/__", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 86, 340, 28, "Voto /10: ______", F13, BLACK, pad=2)
    text_in_box(d, 848, y3 + 124, 340, 28, "Firma docente:", F13, BLACK, pad=2)
    d.line([848, y3 + 156, 1190, y3 + 156], fill=BLACK, width=1)

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
    draw_h = 680
    y = panel(d, 24, draw_top, W - 48, draw_h, "DISEGNO TECNICO — vista laterale  (scala 6,5:1)")

    sc = 6.5
    mid = draw_top + 270
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
    q1 = top_r - 40
    q0 = q1 - 44
    for xx in (ox, xs[1][0], xs[2][0], xs[3][0], end_x):
        ext_tick(d, xx, top_r, q0 - 4)
    dim_h(d, xs[0][0], xs[0][0] + xs[0][1], q1, "42")
    dim_h(d, xs[1][0], xs[1][0] + xs[1][1], q1, "5")
    dim_h(d, xs[2][0], xs[2][0] + xs[2][1], q1, "18")
    dim_h(d, xs[3][0], end_x, q1, "35")
    dim_h(d, ox, end_x, q0, "100")

    bot_r = mid + 18 * sc / 2
    # Diametri BEN SOTTO il pezzo (niente overlap col profilo)
    def dia_below(cx, y_from, y_lab, lab):
        d.line([cx, y_from, cx, y_lab], fill=DIM_COL, width=2)
        tw = d.textlength(lab, font=F16)
        d.rectangle([cx - tw / 2 - 6, y_lab + 2, cx + tw / 2 + 6, y_lab + 30], fill=WHITE, outline=DIM_COL, width=1)
        d.text((cx - tw / 2, y_lab + 5), lab, fill=DIM_COL, font=F16)

    c0 = xs[0][0] + xs[0][1] / 2
    c1 = xs[1][0] + xs[1][1] / 2
    c2 = xs[2][0] + xs[2][1] / 2
    # Diametri tutti dentro il pannello disegno, lontani dal bordo inferiore
    dia_below(c0, bot_r, bot_r + 48, "Ø18")
    dia_below(c2, mid + 12 * sc / 2, bot_r + 48, "Ø12")
    dia_below(end_x - tip_l / 2, mid + 8 * sc / 2, bot_r + 48, "Ø8")
    dia_below(c1, mid + 10 * sc / 2, bot_r + 100, "Ø10")

    ny = bot_r + 145
    # note dentro il pannello (lascia 40px sopra il bordo)
    max_note_y = draw_top + draw_h - 50
    text_in_box(d, ox, min(ny, max_note_y - 90), W - 80 - ox, 28, "Manico LISCIO Ø18 (niente zigrinatura)", F13, BLACK, pad=2)
    text_in_box(d, ox, min(ny + 30, max_note_y - 60), W - 80 - ox, 28, "Gola Ø10 · lama a taglio limata a mano", F13, BLACK, pad=2)
    text_in_box(d, ox, min(ny + 60, max_note_y - 30), W - 80 - ox, 28, "L tot. 100 = 42 + 5 + 18 + 35", F13, GRAY, pad=2)

    # Limatura taglio — altezza calcolata così NON taglia i pannelli sotto
    zg = draw_top + draw_h + 10
    bot_reserve = 220  # spazio per CONTROLLO + DISTINTA + footer
    zg_h = max(240, FOOT - zg - bot_reserve - 12)
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
    lh = max(22, (zg_h - 55) // max(len(col1), len(col2)))
    for i, ln in enumerate(col1):
        yy = y + 4 + i * lh
        if yy + 20 > zg + zg_h - 8:
            break
        fill = ACCENT if ln in ("COSA SERVE", "ATTENZIONE") else BLACK
        f = F14 if ln in ("COSA SERVE", "ATTENZIONE") else F13
        d.text((40, yy), ln, fill=fill, font=f)
    for i, ln in enumerate(col2):
        yy = y + 4 + i * lh
        if yy + 20 > zg + zg_h - 8:
            break
        fill = ACCENT if ln == "SEQUENZA" else BLACK
        f = F14 if ln == "SEQUENZA" else F13
        d.text((640, yy), ln, fill=fill, font=f)

    bot = zg + zg_h + 12
    bh = FOOT - bot - 8
    y = panel(d, 24, bot, 560, bh, "CONTROLLO / DATI")
    text_in_box(d, 32, y + 8, 540, 30, "□ L=100±0,5  □ Ø18 / Ø12 / Ø8  □ Gola Ø10", F13, BLACK, pad=4)
    text_in_box(d, 32, y + 44, 540, 30, "□ Lama simmetrica  □ Prova su vite M4 o M5", F13, BLACK, pad=4)
    text_in_box(d, 32, y + 80, 540, 30, "Alunno/a: ______________  Classe: ______", F13, BLACK, pad=4)
    text_in_box(d, 32, y + 116, 540, 30, "Data: __/__/____  Voto: ____  Firma: ________", F13, BLACK, pad=4)

    y2 = panel(d, 600, bot, W - 24 - 600, bh, "DISTINTA")
    text_in_box(d, 608, y2 + 10, 560, 30, "1 × barra Ø20 × 100 — C40", F13, BLACK, pad=4)
    text_in_box(d, 608, y2 + 48, 560, 30, "Olio da taglio", F13, BLACK, pad=4)
    text_in_box(d, 608, y2 + 86, 560, 30, "Lima fina (per il taglio)", F13, BLACK, pad=4)
    text_in_box(d, 608, y2 + 124, 560, 30, "Vite M4/M5 di prova", F13, BLACK, pad=4)

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
    ox = 120  # più spazio a sinistra per Ø20

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

    # Ø20 a sinistra
    label_dia(d, ox, mid, "Ø20", side="left")

    # Ø16 sotto sottotesta — lontano dal pezzo
    c16 = x2 + 4 * sc
    y16 = mid + 10 * sc + 55
    d.line([c16, mid + 8 * sc, c16, y16], fill=DIM_COL, width=2)
    tw = d.textlength("Ø16", font=F16)
    d.rectangle([c16 - tw / 2 - 6, y16 + 2, c16 + tw / 2 + 6, y16 + 30], fill=WHITE, outline=DIM_COL, width=1)
    d.text((c16 - tw / 2, y16 + 5), "Ø16", fill=DIM_COL, font=F16)

    # M10 sotto il gambo (non a lato sulla punta)
    c_m = x3 + (tip - x3) * 0.55
    y_m = mid + 10 * sc + 55
    d.line([c_m, mid + 5 * sc, c_m, y_m], fill=DIM_COL, width=2)
    twm = d.textlength("M10×1,5", font=F16)
    d.rectangle([c_m - twm / 2 - 6, y_m + 2, c_m + twm / 2 + 6, y_m + 30], fill=WHITE, outline=DIM_COL, width=1)
    d.text((c_m - twm / 2, y_m + 5), "M10×1,5", fill=DIM_COL, font=F16)

    ny = y16 + 45
    text_in_box(d, ox, ny, W - 80 - ox, 28, "Zigrinatura a rombi (doppia) sul pomolo Ø20", F13, BLACK, pad=2)
    text_in_box(d, ox, ny + 30, W - 80 - ox, 28, "Filetto ISO M10 × 1,5 per 70 mm · smusso entrata 1×45°", F13, BLACK, pad=2)
    text_in_box(d, ox, ny + 60, W - 80 - ox, 28, "Punta: bombata (non segna) oppure piana · L=22+8+70", F13, GRAY, pad=2)

    # Nota zigrinatura in fondo pannello
    zb = draw_top + draw_h - 85
    d.rectangle([40, zb, W - 40, zb + 68], fill=WARN_BG, outline=WARN, width=2)
    text_in_box(
        d, 40, zb + 4, W - 80, 28,
        "ZIGRINATURA: giri bassi (60–120) · olio · pressione progressiva · non tornire dopo.",
        F12, WARN, pad=10,
    )
    text_in_box(
        d, 40, zb + 34, W - 80, 28,
        "Solo in 5ª: zigrinatura sul pomolo (3ª e 4ª sono lisce).",
        F12, GRAY, pad=10,
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

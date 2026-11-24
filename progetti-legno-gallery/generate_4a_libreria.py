#!/usr/bin/env python3
"""Generate A4 technical sheet: 4ª Libreria bassa a 2 ripiani (1240×1754 @ 150 DPI)."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1240, 1754
MARGIN = 36
INK = (28, 28, 28)
MUTED = (90, 90, 90)
ACCENT = (30, 90, 168)
LINE = (40, 40, 40)
PANEL = (255, 255, 255)
BG = (246, 246, 246)
QC_BG = (236, 244, 252)
LIGHT = (210, 220, 235)


def font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


F_TITLE = font(28, True)
F_SUB = font(16)
F_H = font(18, True)
F_B = font(14, True)
F_N = font(13)
F_S = font(12)
F_XS = font(11)
F_DIM = font(12, True)


def text_w(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[2] - b[0]


def text_h(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[3] - b[1]


def rounded_rect(draw, box, fill=None, outline=INK, width=2):
    draw.rounded_rectangle(box, radius=8, fill=fill, outline=outline, width=width)


def labeled_panel(draw, x0, y0, x1, y1, title):
    rounded_rect(draw, (x0, y0, x1, y1), fill=PANEL, outline=INK, width=2)
    tw = text_w(draw, title, F_H)
    pad = 10
    draw.rectangle((x0 + 14, y0 - 2, x0 + 14 + tw + pad * 2, y0 + 18), fill=PANEL)
    draw.text((x0 + 14 + pad, y0 - 2), title, fill=INK, font=F_H)
    return y0 + 26


def dim_h(draw, x0, x1, y, label, tick=8):
    draw.line((x0, y, x1, y), fill=INK, width=1)
    draw.line((x0, y - tick, x0, y + tick), fill=INK, width=1)
    draw.line((x1, y - tick, x1, y + tick), fill=INK, width=1)
    tw = text_w(draw, label, F_DIM)
    mid = (x0 + x1) / 2
    draw.rectangle((mid - tw / 2 - 4, y - 9, mid + tw / 2 + 4, y + 9), fill=PANEL)
    draw.text((mid - tw / 2, y - 7), label, fill=INK, font=F_DIM)


def dim_v(draw, x, y0, y1, label, tick=8):
    draw.line((x, y0, x, y1), fill=INK, width=1)
    draw.line((x - tick, y0, x + tick, y0), fill=INK, width=1)
    draw.line((x - tick, y1, x + tick, y1), fill=INK, width=1)
    th = text_h(draw, label, F_DIM)
    tw = text_w(draw, label, F_DIM)
    mid = (y0 + y1) / 2
    draw.rectangle((x - tw / 2 - 3, mid - th / 2 - 3, x + tw / 2 + 3, mid + th / 2 + 3), fill=PANEL)
    draw.text((x - tw / 2, mid - th / 2), label, fill=INK, font=F_DIM)


def draw_label(draw, x, y, text, f=F_B):
    tw = text_w(draw, text, f)
    th = text_h(draw, text, f)
    draw.rectangle((x - 3, y - 2, x + tw + 3, y + th + 2), fill=PANEL)
    draw.text((x, y), text, fill=ACCENT, font=f)


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Outer frame
    d.rectangle((MARGIN - 8, MARGIN - 8, W - MARGIN + 8, H - MARGIN + 8), outline=INK, width=2)

    # Header
    d.text((MARGIN + 8, MARGIN + 4), "4ª · Libreria bassa a 2 ripiani", fill=INK, font=F_TITLE)
    d.text(
        (MARGIN + 8, MARGIN + 40),
        "Difficoltà media · sp. 18 mm · 600×280×800 · tempo 6–8 h · solo chiodi e viti",
        fill=MUTED,
        font=F_SUB,
    )
    badge = (W - MARGIN - 210, MARGIN + 6, W - MARGIN - 8, MARGIN + 48)
    rounded_rect(d, badge, fill=QC_BG, outline=ACCENT, width=2)
    d.text((badge[0] + 18, badge[1] + 10), "SOLO CHIODI E VITI", fill=ACCENT, font=F_B)

    # === VISTE QUOTATE ===
    vx0, vy0, vx1, vy1 = MARGIN, 100, W - MARGIN, 620
    cy = labeled_panel(d, vx0, vy0, vx1, vy1, "VISTE QUOTATE")

    # --- Front elevation (left) ---
    # Scale: 600mm -> 360px, 800mm -> 360px  => 0.45 px/mm for front; use 0.42
    s = 0.42
    fx = vx0 + 70
    fy = cy + 40
    fw, fh = int(600 * s), int(800 * s)  # 252 x 336
    # sides thickness visual
    t = max(6, int(18 * s))
    # shelves thickness
    st = max(5, int(18 * s))

    # Outer box
    d.rectangle((fx, fy, fx + fw, fy + fh), outline=LINE, width=2)
    # left/right side fill hint
    d.rectangle((fx, fy, fx + t, fy + fh), fill=LIGHT, outline=LINE, width=1)
    d.rectangle((fx + fw - t, fy, fx + fw, fy + fh), fill=LIGHT, outline=LINE, width=1)
    # shelves: top flush, mid at 400 from floor (center), bottom at 18 from floor
    # heights from top: top shelf under top edge, mid at 400mm from bottom = 800-400=400 from top
    shelf_ys = [
        fy + t,  # top shelf underside of top? better: top shelf at top
        fy + int((800 - 400) * s) - st // 2,  # mid ~400 from floor
        fy + fh - t - st,  # bottom near floor
    ]
    # Redefine: three shelves between sides
    # Top shelf: top face at y=fy (flush with top) -> draw inside
    shelves = [
        (fy + 8, "R1"),  # top
        (fy + int(400 * s), "R2"),  # mid (400 from top => 400 clear below top? wait)
        (fy + fh - st - 10, "R3"),  # bottom
    ]
    # Better spacing: R1 at top (0), R2 at mid height (shelf top at 400 from bottom? ), R3 at bottom
    # Clear openings ~370 mm between shelves
    # R3 bottom face near floor: shelf top at fh - st - small
    # R2: midway
    # R1: top
    r1y = fy + 6
    r3y = fy + fh - st - 8
    r2y = (r1y + r3y) // 2
    for y, code in ((r1y, "R1"), (r2y, "R2"), (r3y, "R3")):
        d.rectangle((fx + t, y, fx + fw - t, y + st), fill=(230, 236, 245), outline=LINE, width=1)
        draw_label(d, fx + fw // 2 - 10, y + 1, code, F_XS)

    draw_label(d, fx + 4, fy + fh // 2 - 8, "F", F_B)
    draw_label(d, fx + fw - 18, fy + fh // 2 - 8, "F", F_B)

    d.text((fx, fy - 22), "PROSPETTO FRONTE", fill=MUTED, font=F_S)
    dim_h(d, fx, fx + fw, fy + fh + 28, "600")
    dim_v(d, fx - 28, fy, fy + fh, "800")
    # mid shelf height dim from floor
    dim_v(d, fx + fw + 22, r2y + st, fy + fh, "≈370")

    # --- Side view (center) ---
    sx = fx + fw + 110
    sy = fy
    sw, sh = int(280 * s), fh  # 118 x 336
    d.text((sx, sy - 22), "LATERALE", fill=MUTED, font=F_S)
    d.rectangle((sx, sy, sx + sw, sy + sh), outline=LINE, width=2)
    # wall optional none - freestanding
    # shelves
    for y in (r1y, r2y, r3y):
        d.rectangle((sx + 2, y, sx + sw - 2, y + st), fill=(230, 236, 245), outline=LINE, width=1)
    # back rail
    rail_w = max(5, int(50 * s))
    d.rectangle((sx, r2y + st + 8, sx + rail_w, r3y - 4), fill=LIGHT, outline=LINE, width=1)
    draw_label(d, sx + 4, (r2y + r3y) // 2, "T", F_XS)
    draw_label(d, sx + sw // 2 - 8, r1y + 1, "R", F_XS)
    dim_h(d, sx, sx + sw, sy + sh + 28, "280")
    dim_v(d, sx + sw + 22, sy, sy + sh, "800")

    # --- Top view / pianta ---
    px = sx + sw + 100
    py = fy + 40
    pw, pd = int(600 * 0.35), int(280 * 0.35)  # 210 x 98
    d.text((px, py - 22), "PIANTA (dal alto)", fill=MUTED, font=F_S)
    d.rectangle((px, py, px + pw, py + pd), outline=LINE, width=2)
    tt = max(5, int(18 * 0.35))
    d.rectangle((px, py, px + tt, py + pd), fill=LIGHT, outline=LINE, width=1)
    d.rectangle((px + pw - tt, py, px + pw, py + pd), fill=LIGHT, outline=LINE, width=1)
    # shelf area
    d.rectangle((px + tt, py + 2, px + pw - tt, py + pd - 2), fill=(230, 236, 245), outline=LINE, width=1)
    # rear rail
    d.rectangle((px + tt, py, px + pw - tt, py + max(4, int(50 * 0.35))), fill=LIGHT, outline=LINE, width=1)
    draw_label(d, px + 2, py + pd // 2 - 6, "F", F_XS)
    draw_label(d, px + pw - 14, py + pd // 2 - 6, "F", F_XS)
    draw_label(d, px + pw // 2 - 8, py + pd // 2 - 6, "R1", F_XS)
    draw_label(d, px + pw // 2 - 6, py + 2, "T", F_XS)
    dim_h(d, px, px + pw, py + pd + 24, "600")
    dim_v(d, px + pw + 20, py, py + pd, "280")

    # Legend box
    lx, ly = px, py + pd + 55
    d.text((lx, ly), "LEGENDA PEZZI", fill=ACCENT, font=F_B)
    legend = [
        "F  fianco sx/dx  800×280×18 (×2)",
        "R1 ripiano alto  564×280×18",
        "R2 ripiano medio 564×280×18",
        "R3 ripiano basso 564×280×18",
        "T  traversa post. 564×50×18",
    ]
    yy = ly + 22
    for line in legend:
        d.text((lx, yy), line, fill=INK, font=F_S)
        yy += 18

    d.text(
        (vx0 + 16, vy1 - 28),
        "Ripiani inseriti tra i fianchi · 3 viti Ø4×40 per testa · traverso T sotto R2 per rigidità · non zoppica",
        fill=MUTED,
        font=F_S,
    )

    # === DISTINTA PEZZI ===
    tx0, ty0, tx1, ty1 = MARGIN, 640, W - MARGIN, 920
    cy = labeled_panel(d, tx0, ty0, tx1, ty1, "DISTINTA PEZZI  (mm)")

    headers = ["Cod.", "Pezzo", "Q.tà", "L", "W", "S", "Note"]
    cols = [70, 280, 60, 70, 70, 50, 380]
    x = tx0 + 16
    y = cy + 8
    for h, cw in zip(headers, cols):
        d.text((x, y), h, fill=ACCENT, font=F_B)
        x += cw
    y += 22
    d.line((tx0 + 12, y, tx1 - 12, y), fill=LIGHT, width=1)
    y += 8

    rows = [
        ("F", "Fianco sx / dx", "2", "800", "280", "18", "Pezzi verticali; fori punta sui bordi lunghi"),
        ("R1", "Ripiano alto", "1", "564", "280", "18", "Tra i fianchi, a filo superiore"),
        ("R2", "Ripiano medio", "1", "564", "280", "18", "Luce libera ≈ 350–370 sotto R1"),
        ("R3", "Ripiano basso", "1", "564", "280", "18", "A ≈ 20–30 dal pavimento interno"),
        ("T", "Traversa posteriore", "1", "564", "50", "18", "Sotto R2, a filo posteriore"),
    ]
    for row in rows:
        x = tx0 + 16
        for cell, cw in zip(row, cols):
            d.text((x, y), cell, fill=INK, font=F_N)
            x += cw
        y += 28

    d.text(
        (tx0 + 16, ty1 - 36),
        "Ferramenta: viti 4×40 (×30) · carta 80/120/180 · colla opzionale non strutturale · olio/vernice a scelta",
        fill=INK,
        font=F_S,
    )
    d.text(
        (tx0 + 16, ty1 - 18),
        "Legno: abete/pino lamellare o massello sp. 18 · 564 = 600 − 2×18 (ripiani tra i fianchi)",
        fill=MUTED,
        font=F_XS,
    )

    # === Bottom columns ===
    gap = 16
    col_w = (W - 2 * MARGIN - gap) // 2
    bx0, by0 = MARGIN, 940
    bx1, by1 = bx0 + col_w, H - MARGIN - 28
    rx0, ry0 = bx1 + gap, 940
    rx1, ry1 = W - MARGIN, H - MARGIN - 28

    # Sequenza
    cy = labeled_panel(d, bx0, by0, bx1, by1, "SEQUENZA DI MONTAGGIO")
    steps = [
        "1. Squadrare e segnare tutti i pezzi (quote ±1).",
        "2. Tagliare F×2, R1, R2, R3, T.",
        "3. Sbavare i tagli (carta 80 → 120).",
        "4. Su ogni fianco F: segnare quote ripiani",
        "    (alto / medio / basso) sui due interni.",
        "5. Fori di punta Ø2,5–3 sui fianchi in asse",
        "    ai ripiani (3 fori per testa).",
        "6. Avvitare R3 tra i due F (squadra a 90°).",
        "7. Avvitare R2, poi R1; controllare parallelismo.",
        "8. Fissare traversa T sotto R2 a filo posteriore.",
        "9. Verificare che non zoppichi; ritoccare piedi.",
        "10. Carteggiare spigoli (180) e rifinire.",
        "11. Marchiare nome/classe sotto R3.",
    ]
    yy = cy + 6
    for line in steps:
        d.text((bx0 + 14, yy), line, fill=INK, font=F_S)
        yy += 20

    # QC box
    qy0 = yy + 10
    rounded_rect(d, (bx0 + 12, qy0, bx1 - 12, by1 - 14), fill=QC_BG, outline=ACCENT, width=2)
    d.text((bx0 + 24, qy0 + 10), "CONTROLLO QUALITÀ", fill=ACCENT, font=F_B)
    checks = [
        "☐  Quote ±1 mm",
        "☐  Fianchi a 90° / parallelismo",
        "☐  Ripiani in bolla",
        "☐  Non zoppica a terra",
        "☐  Viti allineate e a filo",
        "☐  Traversa T salda",
        "☐  Niente schegge / spigoli vivi",
        "☐  Carico prova libri OK (docente)",
    ]
    yy = qy0 + 36
    for c in checks:
        d.text((bx0 + 28, yy), c, fill=INK, font=F_S)
        yy += 22

    # Note didattiche
    cy = labeled_panel(d, rx0, ry0, rx1, ry1, "NOTE DIDATTICHE / SICUREZZA")
    blocks = [
        ("Obiettivo", "Struttura verticale a squadra, ripiani paralleli, rigidità con traversa; precisione foratura e avvitatura."),
        ("Perché al posto della mensola", "Progetto autonomo (non a muro): utile in aula/laboratorio, scala difficoltà tra sgabello e porta-attrezzi."),
        ("Errori tipici", "Ripiani troppo lunghi (non entrano); fori fuori asse; squadra persa dopo il primo ripiano; T dimenticata → oscillazione."),
        ("Sicurezza", "Occhiali; pezzo in morsa; spingitoio in sega; avvitatore a frizione; no carico prova senza docente."),
        ("Valutazione /10", "quote/squadra (3) · montaggio/rigidità (3) · finitura (2) · ordine/sicurezza (2)"),
    ]
    yy = cy + 4
    for title, body in blocks:
        d.text((rx0 + 14, yy), title, fill=ACCENT, font=F_B)
        yy += 20
        # wrap body
        words = body.split()
        line = ""
        for w in words:
            test = (line + " " + w).strip()
            if text_w(d, test, F_S) > (rx1 - rx0 - 32):
                d.text((rx0 + 14, yy), line, fill=INK, font=F_S)
                yy += 17
                line = w
            else:
                line = test
        if line:
            d.text((rx0 + 14, yy), line, fill=INK, font=F_S)
            yy += 17
        yy += 10

    d.text((rx0 + 14, yy + 4), "Punteggio: ____ / 10", fill=INK, font=F_B)
    d.text((rx0 + 14, yy + 28), "Variante: larghezza 500 se spazio ridotto (ripiani 464).", fill=MUTED, font=F_XS)

    # Footer
    d.text(
        (MARGIN, H - MARGIN - 6),
        "Quote in mm · tolleranza ±1 mm · laboratorio legno professionale · sostituisce la mensola a muro",
        fill=MUTED,
        font=F_XS,
    )

    out_dirs = [
        Path("/workspace/progetti-legno-gallery"),
        Path("/opt/cursor/artifacts/progetti-legno"),
        Path("/opt/cursor/artifacts"),
    ]
    name = "03-4a-libreria.png"
    for folder in out_dirs:
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / name
        img.save(path, "PNG", optimize=True)
        print("wrote", path, img.size)

    # also friendly name
    img.save("/opt/cursor/artifacts/4a-libreria.png", "PNG", optimize=True)
    print("wrote /opt/cursor/artifacts/4a-libreria.png")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""A4 scheda: 4ª Manico cacciaviti al tornio (1240×1754)."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1240, 1754
M = 36
INK = (28, 28, 28)
MUTED = (90, 90, 90)
ACC = (30, 90, 168)
LINE = (40, 40, 40)
PANEL = (255, 255, 255)
BG = (246, 246, 246)
QC = (236, 244, 252)
WOOD = (232, 214, 180)
WOOD2 = (210, 180, 130)
METAL = (180, 190, 200)
LIGHT = (210, 220, 235)


def font(size, bold=False):
    cands = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in cands:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


FT = font(28, True)
FS = font(16)
FH = font(18, True)
FB = font(14, True)
FN = font(13)
FSm = font(12)
FX = font(11)
FD = font(12, True)


def tw(d, t, f):
    b = d.textbbox((0, 0), t, font=f)
    return b[2] - b[0]


def th(d, t, f):
    b = d.textbbox((0, 0), t, font=f)
    return b[3] - b[1]


def panel(d, box, title):
    d.rounded_rectangle(box, radius=8, fill=PANEL, outline=INK, width=2)
    x0, y0, x1, y1 = box
    t = title
    w = tw(d, t, FH)
    d.rectangle((x0 + 14, y0 - 2, x0 + 14 + w + 20, y0 + 18), fill=PANEL)
    d.text((x0 + 24, y0 - 2), t, fill=INK, font=FH)
    return y0 + 26


def dim_h(d, x0, x1, y, label, tick=7):
    d.line((x0, y, x1, y), fill=INK, width=1)
    d.line((x0, y - tick, x0, y + tick), fill=INK, width=1)
    d.line((x1, y - tick, x1, y + tick), fill=INK, width=1)
    w = tw(d, label, FD)
    mid = (x0 + x1) / 2
    d.rectangle((mid - w / 2 - 4, y - 9, mid + w / 2 + 4, y + 9), fill=PANEL)
    d.text((mid - w / 2, y - 7), label, fill=INK, font=FD)


def dim_v(d, x, y0, y1, label, tick=7):
    d.line((x, y0, x, y1), fill=INK, width=1)
    d.line((x - tick, y0, x + tick, y0), fill=INK, width=1)
    d.line((x - tick, y1, x + tick, y1), fill=INK, width=1)
    w = tw(d, label, FD)
    hh = th(d, label, FD)
    mid = (y0 + y1) / 2
    d.rectangle((x - w / 2 - 3, mid - hh / 2 - 3, x + w / 2 + 3, mid + hh / 2 + 3), fill=PANEL)
    d.text((x - w / 2, mid - hh / 2), label, fill=INK, font=FD)


def label(d, x, y, text, f=FB):
    w = tw(d, text, f)
    hh = th(d, text, f)
    d.rectangle((x - 3, y - 2, x + w + 3, y + hh + 2), fill=PANEL)
    d.text((x, y), text, fill=ACC, font=f)


def wrap(d, text, f, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if tw(d, t, f) > max_w:
            if cur:
                lines.append(cur)
            cur = w
        else:
            cur = t
    if cur:
        lines.append(cur)
    return lines


def handle_profile(d, ox, oy, scale=3.2):
    """Draw longitudinal profile. Lengths in mm along X, radii along Y from axis.
    Overall L=110. Zones: pomello 0-18, body 18-78, neck 78-95, ferrule 95-110.
    """
    # centerline
    L = 110 * scale
    axis = oy
    # outline points (x_mm, r_mm) upper half then mirror
    pts = [
        (0, 8),
        (6, 12),
        (14, 14),  # pomello / end
        (22, 15),
        (35, 16),  # max grip Ø32
        (50, 15.5),
        (65, 14),
        (78, 11),
        (88, 9),  # neck
        (95, 9),
        (95, 10),  # under ferrule wood
        (110, 10),
    ]
    upper = [(ox + x * scale, axis - r * scale) for x, r in pts]
    lower = [(ox + x * scale, axis + r * scale) for x, r in reversed(pts)]
    poly = upper + lower
    d.polygon(poly, fill=WOOD, outline=LINE)
    # centerline
    d.line((ox, axis, ox + L, axis), fill=(160, 140, 100), width=1)
    # ferrule metal sleeve 95-110, Ø20 (r=10)
    fx0 = ox + 95 * scale
    fx1 = ox + 110 * scale
    fr = 10 * scale
    d.rectangle((fx0, axis - fr, fx1, axis + fr), fill=METAL, outline=LINE, width=2)
    # tang hole hint on profile (dashed tube)
    hx0 = ox + 55 * scale
    hx1 = ox + 108 * scale
    hr = 2.5 * scale
    d.rectangle((hx0, axis - hr, hx1, axis + hr), outline=ACC, width=1)
    return ox, axis, L, scale


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle((M - 8, M - 8, W - M + 8, H - M + 8), outline=INK, width=2)

    # Header
    d.text((M + 8, M + 4), "4ª · Manico per cacciaviti (tornio)", fill=INK, font=FT)
    d.text(
        (M + 8, M + 40),
        "Difficoltà media · legno duro · L 110 · Ø max 32 · tempo 4–6 h · lavoro al tornio",
        fill=MUTED,
        font=FS,
    )
    badge = (W - M - 230, M + 6, W - M - 8, M + 48)
    d.rounded_rectangle(badge, radius=8, fill=QC, outline=ACC, width=2)
    d.text((badge[0] + 14, badge[1] + 10), "PROGETTO AL TORNIO", fill=ACC, font=FB)

    # === VISTE ===
    cy = panel(d, (M, 100, W - M, 640), "VISTE QUOTATE / PROFILO DI TORNITURA")

    # Profile
    d.text((M + 20, cy + 4), "PROFILO LONGITUDINALE (quota Ø = diametro finito)", fill=MUTED, font=FSm)
    ox, axis, L, sc = handle_profile(d, M + 80, cy + 130, scale=3.4)

    # Dimension lengths on profile
    y_dim = axis + 16 * sc + 28
    dim_h(d, ox, ox + 110 * sc, y_dim, "110")
    dim_h(d, ox, ox + 95 * sc, y_dim + 26, "95  legno")
    dim_h(d, ox + 95 * sc, ox + 110 * sc, y_dim + 26, "15  ghiera")
    # diameter callouts above
    d.line((ox + 35 * sc, axis - 16 * sc, ox + 35 * sc, axis - 16 * sc - 36), fill=INK, width=1)
    label(d, ox + 35 * sc - 22, axis - 16 * sc - 54, "Ø32 max", FX)
    d.line((ox + 10 * sc, axis - 12 * sc, ox + 10 * sc, axis - 12 * sc - 22), fill=INK, width=1)
    label(d, ox + 10 * sc - 16, axis - 12 * sc - 40, "Ø28", FX)
    d.line((ox + 88 * sc, axis - 9 * sc, ox + 88 * sc, axis - 9 * sc - 30), fill=INK, width=1)
    label(d, ox + 88 * sc - 18, axis - 9 * sc - 48, "Ø18 collo", FX)
    label(d, ox + 98 * sc - 10, axis - 10 * sc - 22, "G Ø20", FX)
    label(d, ox + 70 * sc, axis - 4, "foro Ø5 × 50", FX)

    # End view (right of profile top)
    ex = M + 520
    ey = cy + 40
    d.text((ex, ey), "VISTA FRONTALE (sezioni Ø)", fill=MUTED, font=FSm)
    cx, cy2 = ex + 90, ey + 95
    for r, col in ((16 * sc / 3.4 * 2.2, WOOD), (14 * 2.2, WOOD2), (9 * 2.2, (245, 235, 210)), (2.5 * 2.2, PANEL)):
        d.ellipse((cx - r, cy2 - r, cx + r, cy2 + r), fill=col, outline=LINE, width=1)
    d.ellipse((cx - 2, cy2 - 2, cx + 2, cy2 + 2), fill=ACC)
    label(d, cx + 40, cy2 - 50, "Ø32", FX)
    label(d, cx + 40, cy2 - 20, "Ø28", FX)
    label(d, cx + 40, cy2 + 8, "Ø18", FX)
    label(d, cx + 40, cy2 + 36, "foro Ø5", FX)

    # Section
    sx = ex + 220
    sy = ey
    d.text((sx, sy), "SEZIONE (alloggiamento lama)", fill=MUTED, font=FSm)
    # simplified section box
    s_sc = 2.8
    sox, say = sx + 20, sy + 95
    # wood body short
    d.rectangle((sox, say - 14 * s_sc, sox + 70 * s_sc, say + 14 * s_sc), fill=WOOD, outline=LINE, width=2)
    # ferrule
    d.rectangle((sox + 55 * s_sc, say - 10 * s_sc, sox + 70 * s_sc, say + 10 * s_sc), fill=METAL, outline=LINE, width=2)
    # hole
    d.rectangle((sox + 20 * s_sc, say - 2.5 * s_sc, sox + 68 * s_sc, say + 2.5 * s_sc), fill=(250, 250, 250), outline=ACC, width=1)
    # blade stub
    d.rectangle((sox + 68 * s_sc, say - 2 * s_sc, sox + 95 * s_sc, say + 2 * s_sc), fill=(120, 120, 130), outline=LINE, width=1)
    label(d, sox + 25 * s_sc, say - 14 * s_sc - 18, "prof. foro 50", FX)
    label(d, sox + 72 * s_sc, say - 18, "lama", FX)
    label(d, sox + 56 * s_sc, say + 14 * s_sc + 6, "ghiera G", FX)
    dim_h(d, sox, sox + 70 * s_sc, say + 14 * s_sc + 36, "≈70 corpo")

    # Blank drawing bottom of views
    bx = M + 40
    by = cy + 320
    d.text((bx, by), "SBOZZO DI PARTENZA (prima del tornio)", fill=MUTED, font=FSm)
    # square blank 35x35x130
    bw, bh = 280, 70
    d.rectangle((bx, by + 28, bx + bw, by + 28 + bh), fill=WOOD2, outline=LINE, width=2)
    # center marks
    d.line((bx + 8, by + 28 + bh // 2, bx + 22, by + 28 + bh // 2), fill=ACC, width=2)
    d.line((bx + 15, by + 28 + bh // 2 - 7, bx + 15, by + 28 + bh // 2 + 7), fill=ACC, width=2)
    d.line((bx + bw - 22, by + 28 + bh // 2, bx + bw - 8, by + 28 + bh // 2), fill=ACC, width=2)
    d.line((bx + bw - 15, by + 28 + bh // 2 - 7, bx + bw - 15, by + 28 + bh // 2 + 7), fill=ACC, width=2)
    dim_h(d, bx, bx + bw, by + 28 + bh + 22, "130 (sbozzo)")
    dim_v(d, bx + bw + 24, by + 28, by + 28 + bh, "35×35")
    d.text((bx + bw + 60, by + 40), "Legno duro: faggio / frassino / noce", fill=INK, font=FSm)
    d.text((bx + bw + 60, by + 60), "Centri sulle due estremità · montaggio tra punte", fill=INK, font=FSm)
    d.text((bx + bw + 60, by + 80), "Dopo tornitura: tagliare a L=110 e forare", fill=MUTED, font=FX)

    d.text(
        (M + 16, 640 - 26),
        "Template: copiare il profilo su cartoncino e verificare i diametri col calibro a corsoio durante la tornitura.",
        fill=MUTED,
        font=FX,
    )

    # === DISTINTA ===
    cy = panel(d, (M, 660, W - M, 920), "DISTINTA PEZZI / MATERIALI")
    headers = ["Cod.", "Pezzo / materiale", "Q.tà", "Misure", "Note"]
    cols = [70, 320, 60, 200, 420]
    x = M + 16
    y = cy + 6
    for h, cw in zip(headers, cols):
        d.text((x, y), h, fill=ACC, font=FB)
        x += cw
    y += 22
    d.line((M + 12, y, W - M - 12, y), fill=LIGHT, width=1)
    y += 8
    rows = [
        ("S", "Sbozzo legno duro", "1", "35 × 35 × 130", "Faggio/frassino/noce ben stagionato"),
        ("M", "Manico finito", "1", "L 110 · Ø32→18", "Profilo secondo disegno"),
        ("G", "Ghiera metallica", "1", "Ø20 × L 15", "Ottone/acciaio · pressata a caldo/colla"),
        ("L", "Lama cacciaviti", "1", "lama + codolo Ø≈5", "Piatta o a croce · fornita dal lab"),
        ("—", "Abrasivi", "—", "80 / 120 / 180 / 240", "Carteggiatura al tornio + a mano"),
        ("—", "Finitura", "—", "olio / cera / vernice", "A scelta docente"),
    ]
    for row in rows:
        x = M + 16
        for cell, cw in zip(row, cols):
            d.text((x, y), cell, fill=INK, font=FN)
            x += cw
        y += 26

    d.text(
        (M + 16, 920 - 40),
        "Utensili tornio: sgorbia a canale · scalpello piatto · troncatore · punta da centri · trapano Ø5 (in testa o in morsa).",
        fill=INK,
        font=FSm,
    )
    d.text(
        (M + 16, 920 - 22),
        "Fissaggio lama: colla epossidica nel foro + ghiera (non è un giunto a chiodi: il lavoro didattico è la tornitura).",
        fill=MUTED,
        font=FX,
    )

    # === columns ===
    gap = 16
    col_w = (W - 2 * M - gap) // 2
    lx0, ly0, lx1, ly1 = M, 940, M + col_w, H - M - 28
    rx0, ry0, rx1, ry1 = lx1 + gap, 940, W - M, H - M - 28

    cy = panel(d, (lx0, ly0, lx1, ly1), "SEQUENZA AL TORNIO")
    steps = [
        "1. Tagliare lo sbozzo 35×35×130; segnare i centri.",
        "2. Montare tra punte (controtesta + punta motrice).",
        "3. Velocità bassa: arrotondare a cilindro Ø≈33.",
        "4. Tracciare quote longitudinali (pomello, max,",
        "    collo, sede ghiera) con matita a pezzo fermo.",
        "5. Tornire il profilo a template (Ø32 → Ø18).",
        "6. Controllare i diametri col calibro (±0,5 mm).",
        "7. Carteggiare al tornio 80→240 (pezzofisso? no:",
        "    pezzo in rotazione, carta sostenuta con cura).",
        "8. Troncare / spianare a L=110; smontare.",
        "9. Forare in asse Ø5 × prof. 50 (lama).",
        "10. Calzare ghiera G; inserire lama + epoxy; asciugare.",
        "11. Rifinire a mano e marchiare nome/classe.",
    ]
    yy = cy + 4
    for line in steps:
        d.text((lx0 + 12, yy), line, fill=INK, font=FSm)
        yy += 19

    qy = yy + 8
    d.rounded_rectangle((lx0 + 10, qy, lx1 - 10, ly1 - 12), radius=8, fill=QC, outline=ACC, width=2)
    d.text((lx0 + 22, qy + 8), "CONTROLLO QUALITÀ", fill=ACC, font=FB)
    checks = [
        "☐  Profilo simmetrico / senza scalini",
        "☐  Ø max 32 ±0,5 · collo Ø18 ±0,5",
        "☐  Lunghezza 110 ±1",
        "☐  Foro centrato e diritto",
        "☐  Ghiera aderente, senza gioco",
        "☐  Superficie liscia, niente bruciature",
        "☐  Lama allineata all’asse",
        "☐  Impugnatura comoda in mano",
    ]
    yy = qy + 32
    for c in checks:
        d.text((lx0 + 24, yy), c, fill=INK, font=FSm)
        yy += 20

    cy = panel(d, (rx0, ry0, rx1, ry1), "NOTE DIDATTICHE / SICUREZZA TORNIO")
    blocks = [
        ("Obiettivo", "Padronanza del tornio: cilindratura, profilo a quote, controllo diametri, foratura in asse, montaggio utensile."),
        ("Perché questo progetto", "Sostituisce mensola/libreria: pezzo piccolo, alto valore tecnico, ogni alunno lavora al tornio sul proprio manico."),
        ("Errori tipici", "Velocità troppo alta a pezzo squadrato; pressione eccessiva della sgorbia; quote non segnate; foro fuori asse; ghiera ovalizzata."),
        ("Sicurezza", "Occhiali + capelli raccolti; niente maniche larghe; utensili appoggiati sul poggia-utensili vicino al pezzo; fermare il tornio per misurare; docente presente all’avvio."),
        ("Valutazione /10", "quote/profilo (3) · finitura (3) · foro/montaggio (2) · sicurezza/metodo (2)"),
    ]
    yy = cy + 2
    for title, body in blocks:
        d.text((rx0 + 14, yy), title, fill=ACC, font=FB)
        yy += 18
        for line in wrap(d, body, FSm, rx1 - rx0 - 30):
            d.text((rx0 + 14, yy), line, fill=INK, font=FSm)
            yy += 16
        yy += 8

    d.text((rx0 + 14, yy + 2), "Punteggio: ____ / 10", fill=INK, font=FB)
    d.text((rx0 + 14, yy + 26), "Variante: manico Ø28 più snello · o pomello sferico.", fill=MUTED, font=FX)
    d.text((rx0 + 14, yy + 44), "Coppia: se pochi torni, turni di 20–25 min a rotazione.", fill=MUTED, font=FX)

    d.text(
        (M, H - M - 6),
        "Quote in mm · tolleranza diametri ±0,5 · laboratorio legno professionale · 4ª — tornitura",
        fill=MUTED,
        font=FX,
    )

    outs = [
        Path("/workspace/progetti-legno-gallery/03-4a-manico-cacciaviti.png"),
        Path("/opt/cursor/artifacts/progetti-legno/03-4a-manico-cacciaviti.png"),
        Path("/opt/cursor/artifacts/03-4a-manico-cacciaviti.png"),
        Path("/opt/cursor/artifacts/4a-manico-cacciaviti.png"),
    ]
    for p in outs:
        p.parent.mkdir(parents=True, exist_ok=True)
        img.save(p, "PNG", optimize=True)
        print("wrote", p, img.size)


if __name__ == "__main__":
    main()

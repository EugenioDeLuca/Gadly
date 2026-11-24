#!/usr/bin/env python3
"""A4 scheda: 4ª Manico cacciaviti al tornio — barra di NYLON (1240×1754)."""

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
NYLON = (245, 245, 248)       # bianco opaco
NYLON2 = (230, 232, 238)
NYLON_SHADE = (210, 214, 222)
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


def handle_profile(d, ox, oy, scale=3.4):
    axis = oy
    pts = [
        (0, 8),
        (6, 12),
        (14, 14),
        (22, 15),
        (35, 16),
        (50, 15.5),
        (65, 14),
        (78, 11),
        (88, 9),
        (95, 9),
        (95, 10),
        (110, 10),
    ]
    upper = [(ox + x * scale, axis - r * scale) for x, r in pts]
    lower = [(ox + x * scale, axis + r * scale) for x, r in reversed(pts)]
    d.polygon(upper + lower, fill=NYLON, outline=LINE)
    # subtle shade band for plastic look
    d.line((ox, axis, ox + 110 * scale, axis), fill=NYLON_SHADE, width=1)
    fx0 = ox + 95 * scale
    fx1 = ox + 110 * scale
    fr = 10 * scale
    d.rectangle((fx0, axis - fr, fx1, axis + fr), fill=METAL, outline=LINE, width=2)
    hx0 = ox + 55 * scale
    hx1 = ox + 108 * scale
    hr = 2.5 * scale
    d.rectangle((hx0, axis - hr, hx1, axis + hr), outline=ACC, width=1)
    return ox, axis, scale


def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle((M - 8, M - 8, W - M + 8, H - M + 8), outline=INK, width=2)

    d.text((M + 8, M + 4), "4ª · Manico per cacciaviti (tornio)", fill=INK, font=FT)
    d.text(
        (M + 8, M + 40),
        "Difficoltà media · NYLON (barra tonda) · L 110 · Ø max 32 · tempo 3–5 h · non è legno",
        fill=MUTED,
        font=FS,
    )
    badge = (W - M - 250, M + 6, W - M - 8, M + 48)
    d.rounded_rectangle(badge, radius=8, fill=QC, outline=ACC, width=2)
    d.text((badge[0] + 12, badge[1] + 10), "BARRA DI NYLON Ø35", fill=ACC, font=FB)

    cy = panel(d, (M, 100, W - M, 640), "VISTE QUOTATE / PROFILO DI TORNITURA")

    d.text((M + 20, cy + 4), "PROFILO LONGITUDINALE — materiale: nylon PA6 (bianco opaco, non plexiglass)", fill=MUTED, font=FSm)
    ox, axis, sc = handle_profile(d, M + 80, cy + 130, scale=3.4)

    y_dim = axis + 16 * sc + 28
    dim_h(d, ox, ox + 110 * sc, y_dim, "110")
    dim_h(d, ox, ox + 95 * sc, y_dim + 26, "95  nylon")
    dim_h(d, ox + 95 * sc, ox + 110 * sc, y_dim + 26, "15  ghiera")
    d.line((ox + 35 * sc, axis - 16 * sc, ox + 35 * sc, axis - 16 * sc - 36), fill=INK, width=1)
    label(d, ox + 35 * sc - 22, axis - 16 * sc - 54, "Ø32 max", FX)
    d.line((ox + 10 * sc, axis - 12 * sc, ox + 10 * sc, axis - 12 * sc - 22), fill=INK, width=1)
    label(d, ox + 10 * sc - 16, axis - 12 * sc - 40, "Ø28", FX)
    d.line((ox + 88 * sc, axis - 9 * sc, ox + 88 * sc, axis - 9 * sc - 30), fill=INK, width=1)
    label(d, ox + 88 * sc - 18, axis - 9 * sc - 48, "Ø18 collo", FX)
    label(d, ox + 98 * sc - 10, axis - 10 * sc - 22, "G Ø20", FX)
    label(d, ox + 70 * sc, axis - 4, "foro Ø5 × 50", FX)

    ex = M + 520
    ey = cy + 40
    d.text((ex, ey), "VISTA FRONTALE (sezioni Ø)", fill=MUTED, font=FSm)
    cx, cy2 = ex + 90, ey + 95
    for r, col in ((16 * 2.2, NYLON), (14 * 2.2, NYLON2), (9 * 2.2, (250, 250, 252)), (2.5 * 2.2, PANEL)):
        d.ellipse((cx - r, cy2 - r, cx + r, cy2 + r), fill=col, outline=LINE, width=1)
    d.ellipse((cx - 2, cy2 - 2, cx + 2, cy2 + 2), fill=ACC)
    label(d, cx + 40, cy2 - 50, "Ø32", FX)
    label(d, cx + 40, cy2 - 20, "Ø28", FX)
    label(d, cx + 40, cy2 + 8, "Ø18", FX)
    label(d, cx + 40, cy2 + 36, "foro Ø5", FX)

    sx = ex + 220
    sy = ey
    d.text((sx, sy), "SEZIONE (alloggiamento lama)", fill=MUTED, font=FSm)
    s_sc = 2.8
    sox, say = sx + 20, sy + 95
    d.rectangle((sox, say - 14 * s_sc, sox + 70 * s_sc, say + 14 * s_sc), fill=NYLON, outline=LINE, width=2)
    d.rectangle((sox + 55 * s_sc, say - 10 * s_sc, sox + 70 * s_sc, say + 10 * s_sc), fill=METAL, outline=LINE, width=2)
    d.rectangle((sox + 20 * s_sc, say - 2.5 * s_sc, sox + 68 * s_sc, say + 2.5 * s_sc), fill=(250, 250, 250), outline=ACC, width=1)
    d.rectangle((sox + 68 * s_sc, say - 2 * s_sc, sox + 95 * s_sc, say + 2 * s_sc), fill=(120, 120, 130), outline=LINE, width=1)
    label(d, sox + 25 * s_sc, say - 14 * s_sc - 18, "prof. foro 50", FX)
    label(d, sox + 72 * s_sc, say - 18, "lama", FX)
    label(d, sox + 56 * s_sc, say + 14 * s_sc + 6, "ghiera G", FX)
    dim_h(d, sox, sox + 70 * s_sc, say + 14 * s_sc + 36, "≈70 corpo")

    # Cylindrical blank (NOT square wood)
    bx = M + 40
    by = cy + 300
    d.text((bx, by), "SBOZZO DI PARTENZA — BARRA TONDA DI NYLON (già cilindrica)", fill=MUTED, font=FSm)
    # isometric-ish cylinder side view
    bl = 300
    br = 28  # visual radius for Ø35
    by0 = by + 55
    d.ellipse((bx, by0 - br, bx + br * 2, by0 + br), fill=NYLON2, outline=LINE, width=2)
    d.rectangle((bx + br, by0 - br, bx + br + bl, by0 + br), fill=NYLON, outline=LINE, width=2)
    d.ellipse((bx + bl, by0 - br, bx + bl + br * 2, by0 + br), fill=NYLON2, outline=LINE, width=2)
    # center marks on ends
    d.line((bx + br - 8, by0, bx + br + 8, by0), fill=ACC, width=2)
    d.line((bx + br, by0 - 8, bx + br, by0 + 8), fill=ACC, width=2)
    d.line((bx + bl + br - 8, by0, bx + bl + br + 8, by0), fill=ACC, width=2)
    d.line((bx + bl + br, by0 - 8, bx + bl + br, by0 + 8), fill=ACC, width=2)
    dim_h(d, bx + br, bx + bl + br, by0 + br + 22, "130 (spezzone)")
    dim_v(d, bx + bl + br * 2 + 28, by0 - br, by0 + br, "Ø35")
    d.text((bx + bl + br * 2 + 70, by0 - 30), "Nylon PA6 (poliammide) — bianco opaco", fill=INK, font=FSm)
    d.text((bx + bl + br * 2 + 70, by0 - 10), "NON è plexiglass (PMMA) · NON è legno", fill=ACC, font=FSm)
    d.text((bx + bl + br * 2 + 70, by0 + 10), "In lab a volte: Delrin / POM (simile, più rigido)", fill=MUTED, font=FX)
    d.text((bx + bl + br * 2 + 70, by0 + 28), "Montaggio: mandrino o tra punte · centri sulle basi", fill=INK, font=FX)

    d.text(
        (M + 16, 640 - 26),
        "Il nylon si torna bene a velocità media-bassa; evita surriscaldamento (bruciature / filamenti). Raffredda con aria se serve.",
        fill=MUTED,
        font=FX,
    )

    cy = panel(d, (M, 660, W - M, 920), "DISTINTA PEZZI / MATERIALI")
    headers = ["Cod.", "Pezzo / materiale", "Q.tà", "Misure", "Note"]
    cols = [70, 340, 60, 200, 400]
    x = M + 16
    y = cy + 6
    for h, cw in zip(headers, cols):
        d.text((x, y), h, fill=ACC, font=FB)
        x += cw
    y += 22
    d.line((M + 12, y, W - M - 12, y), fill=LIGHT, width=1)
    y += 8
    rows = [
        ("N", "Barra tonda nylon PA6", "1", "Ø35 × L 130", "Bianco opaco · spezzone da barra"),
        ("M", "Manico finito", "1", "L 110 · Ø32→18", "Profilo secondo disegno"),
        ("G", "Ghiera metallica", "1", "Ø20 × L 15", "Ottone/acciaio · pressata / colla"),
        ("L", "Lama cacciaviti", "1", "lama + codolo Ø≈5", "Piatta o a croce · dal laboratorio"),
        ("—", "Abrasivi", "—", "120 / 180 / 240 / 400", "Carteggiatura a pezzo in rotazione"),
        ("—", "Finitura", "—", "opzionale", "Nylon spesso si lascia grezzo-liscio"),
    ]
    for row in rows:
        x = M + 16
        for cell, cw in zip(row, cols):
            d.text((x, y), cell, fill=INK, font=FN)
            x += cw
        y += 26

    d.text(
        (M + 16, 920 - 40),
        "Utensili: sgorbia / scalpello per plastica · troncatore · calibro · punta da centri · trapano Ø5.",
        fill=INK,
        font=FSm,
    )
    d.text(
        (M + 16, 920 - 22),
        "Materiale didattico: NYLON (poliammide). Alternativa ammessa dal docente: POM/Delrin. Non usare plexiglass (si scheggia/fonderà male).",
        fill=MUTED,
        font=FX,
    )

    gap = 16
    col_w = (W - 2 * M - gap) // 2
    lx0, ly0, lx1, ly1 = M, 940, M + col_w, H - M - 28
    rx0, ry0, rx1, ry1 = lx1 + gap, 940, W - M, H - M - 28

    cy = panel(d, (lx0, ly0, lx1, ly1), "SEQUENZA AL TORNIO")
    steps = [
        "1. Tagliare spezzone Ø35 × 130 da barra di nylon.",
        "2. Segnare i centri sulle due basi circolari.",
        "3. Montare tra punte (o in mandrino a tre griffe",
        "    con protezione, se previsto dal docente).",
        "4. Velocità media-bassa: cilindrare a Ø≈33.",
        "5. Segnare quote (pomello, max, collo, ghiera).",
        "6. Tornire il profilo a template (Ø32 → Ø18).",
        "7. Controllare diametri col calibro (±0,5).",
        "8. Carteggiare 120→400 (non surriscaldare).",
        "9. Troncare / spianare a L=110; smontare.",
        "10. Forare in asse Ø5 × prof. 50.",
        "11. Calzare ghiera; lama + epoxy; asciugare.",
        "12. Marchiare nome/classe (punzone o laser lab).",
    ]
    yy = cy + 4
    for line in steps:
        d.text((lx0 + 12, yy), line, fill=INK, font=FSm)
        yy += 18

    qy = yy + 6
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
    yy = qy + 30
    for c in checks:
        d.text((lx0 + 24, yy), c, fill=INK, font=FSm)
        yy += 19

    cy = panel(d, (rx0, ry0, rx1, ry1), "NOTE DIDATTICHE / SICUREZZA TORNIO")
    blocks = [
        ("Materiale", "NYLON PA6 in barra tonda Ø35 — plastica bianca opaca, non legno e non plexiglass. In magazzino lab spesso etichettata solo «nylon» o «barra bianca»."),
        ("Obiettivo", "Tornitura su plastica: cilindratura, profilo a quote, controllo Ø, foratura in asse, montaggio lama/ghiera."),
        ("Errori tipici", "Giri troppo alti → fusione/filamenti; utensile poco affilato; quote non segnate; foro fuori asse; confusione con PMMA."),
        ("Sicurezza", "Occhiali; capelli raccolti; niente maniche larghe; utensile sul poggia-utensili; fermare il tornio per misurare; attenzione al calore del truciolo di nylon."),
        ("Valutazione /10", "quote/profilo (3) · finitura (3) · foro/montaggio (2) · sicurezza/metodo (2)"),
    ]
    yy = cy + 2
    for title, body in blocks:
        d.text((rx0 + 14, yy), title, fill=ACC, font=FB)
        yy += 18
        for line in wrap(d, body, FSm, rx1 - rx0 - 30):
            d.text((rx0 + 14, yy), line, fill=INK, font=FSm)
            yy += 15
        yy += 7

    d.text((rx0 + 14, yy + 2), "Punteggio: ____ / 10", fill=INK, font=FB)
    d.text((rx0 + 14, yy + 24), "Variante docente: POM/Delrin stessa geometria.", fill=MUTED, font=FX)
    d.text((rx0 + 14, yy + 42), "Se la barra è Ø40: cilindrare prima a Ø35.", fill=MUTED, font=FX)

    d.text(
        (M, H - M - 6),
        "Quote in mm · Ø ±0,5 · laboratorio · 4ª tornitura plastica — nylon (non legno, non plexiglass)",
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
        print("wrote", p)


if __name__ == "__main__":
    main()

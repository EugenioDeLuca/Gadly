from PIL import Image, ImageDraw, ImageFont
import os, zipfile

OUT = "/opt/cursor/artifacts/progetti-legno"
GAL = "/workspace/progetti-legno-gallery"
os.makedirs(OUT, exist_ok=True)
os.makedirs(GAL, exist_ok=True)

W, H = 1240, 1754
BLACK = (0, 0, 0)
GRAY = (0, 0, 0)
LIGHT = (228, 228, 228)
FILL = (238, 238, 238)
ACCENT = (0, 40, 90)
WHITE = (255, 255, 255)
LINE = (0, 0, 0)
SOFT = (200, 200, 200)
BLUEBOX = (232, 240, 255)

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

F11, F12, F13, F14 = font_b(20), font_b(21), font_b(22), font_b(23)
F15b, F16b, F18b, F22b = font_b(24), font_b(25), font_b(28), font_b(34)
Fm = font_b(19)

FOOT_TOP = H - 52

def new_sheet(classe, titolo, sub):
    img = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(img)
    d.rectangle([12, 12, W - 12, H - 12], outline=BLACK, width=2)
    d.rectangle([12, 12, W - 12, 104], fill=(246, 246, 246), outline=BLACK, width=2)
    d.text((28, 28), f"{classe}  ·  {titolo}", fill=BLACK, font=F22b)
    d.text((28, 64), sub, fill=GRAY, font=F12)
    d.rectangle([W - 210, 28, W - 28, 82], outline=ACCENT, width=2)
    d.text((W - 196, 38), "SOLO", fill=ACCENT, font=F11)
    d.text((W - 196, 56), "CHIODI E VITI", fill=ACCENT, font=F13)
    d.rectangle([12, FOOT_TOP, W - 12, H - 12], fill=(246, 246, 246), outline=BLACK, width=2)
    d.text((28, FOOT_TOP + 14), "Quote in mm · tolleranza ±1 mm · laboratorio legno professionale", fill=GRAY, font=Fm)
    return img, d

def panel(d, x, y, w, h, title):
    d.rectangle([x, y, x + w, y + h], outline=BLACK, width=2)
    d.rectangle([x, y, x + w, y + 32], fill=LIGHT, outline=BLACK, width=2)
    d.text((x + 10, y + 6), title, fill=BLACK, font=F15b)
    return y + 32  # content top

def dim_h(d, x1, x2, y, label):
    d.line([x1, y, x2, y], fill=BLACK, width=2)
    d.line([x1, y - 4, x1, y + 4], fill=BLACK, width=2)
    d.line([x2, y - 4, x2, y + 4], fill=BLACK, width=2)
    tw = d.textlength(label, font=F13)
    # clear background behind label to avoid clash
    lx = (x1 + x2) / 2 - tw / 2
    d.rectangle([lx - 2, y - 15, lx + tw + 2, y - 2], fill=WHITE)
    d.text((lx, y - 16), label, fill=BLACK, font=F13)

def dim_v(d, y1, y2, x, label):
    d.line([x, y1, x, y2], fill=BLACK, width=2)
    d.line([x - 4, y1, x + 4, y1], fill=BLACK, width=2)
    d.line([x - 4, y2, x + 4, y2], fill=BLACK, width=2)
    tw = d.textlength(label, font=F13)
    d.rectangle([x + 5, (y1 + y2) / 2 - 8, x + 8 + tw, (y1 + y2) / 2 + 6], fill=WHITE)
    d.text((x + 7, (y1 + y2) / 2 - 8), label, fill=BLACK, font=F13)

def table(d, x, y, headers, rows, col_w, rh=25):
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


def fill_lines(d, x, y0, y1, lines, fnt):
    """Draw lines filling vertical space from y0 to y1 (no huge empty bottom)."""
    usable = [ln for ln in lines]
    n = max(len(usable), 1)
    # leave 8px padding at bottom
    avail = max(y1 - y0 - 8, n * 18)
    step = avail / n
    # clamp step so text doesn't overlap too much
    step = max(step, 18)
    # if still short of bottom, we'll pad with blank score lines after
    yy = y0
    for ln in usable:
        d.text((x, yy), ln, fill=BLACK, font=fnt)
        yy += step
    return yy

def student_block(d, x, y, y_max, fnt, fntb):
    """Fill remaining space with nome/classe/voto fields."""
    fields = [
        "Alunno/a: ________________________________",
        "Classe: ________    Data: ____ / ____ / ______",
        "Voto /10: ______    Firma docente: _______________",
        "Osservazioni docente:",
        "______________________________________________",
        "______________________________________________",
    ]
    d.rectangle([x - 8, y - 4, x + 548, y_max - 2], outline=BLACK, width=3)
    n = len(fields)
    step = max(24, (y_max - 8 - y) / n)
    yy = y + 2
    for i, f in enumerate(fields):
        d.text((x, yy), f, fill=BLACK, font=fntb if i < 3 else fnt)
        yy += step
    return yy


HDR = ["Cod.", "Pezzo", "Q.tà", "L", "W", "S", "Note"]

def save(img, name):
    img.save(f"{OUT}/{name}", "PNG", optimize=True)
    img.save(f"{GAL}/{name}", "PNG", optimize=True)
    print("ok", name)

# =========================================================
# 2ª PORTAPENNE
# =========================================================
img, d = new_sheet("2ª", "Portapenne / organizer da banco",
                   "Difficoltà bassa · sp. 10 mm · ingombro 200×120×100 · tempo 3–4 h")

ct = panel(d, 20, 108, 1200, 500, "VISTE QUOTATE")
# Pianta — left
d.text((40, ct + 10), "PIANTA", fill=ACCENT, font=F14)
ox, oy = 55, ct + 40
bw, bh = 380, 228
d.rectangle([ox, oy, ox + bw, oy + bh], fill=FILL, outline=LINE, width=2)
d.rectangle([ox, oy, ox + bw, oy + 20], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox, oy + bh - 20, ox + bw, oy + bh], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox, oy, ox + 20, oy + bh], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox + bw - 20, oy, ox + bw, oy + bh], fill=SOFT, outline=LINE, width=1)
d.line([ox + 20, oy + bh / 2, ox + bw - 20, oy + bh / 2], fill=ACCENT, width=3)
d.text((ox + bw / 2 - 8, oy + 40), "A", fill=BLACK, font=F16b)
d.text((ox + bw / 2 - 8, oy + bh - 48), "A", fill=BLACK, font=F16b)
d.text((ox + 32, oy + bh / 2 - 10), "B", fill=BLACK, font=F16b)
d.text((ox + bw - 50, oy + bh / 2 - 10), "B", fill=BLACK, font=F16b)
d.text((ox + bw / 2 - 8, oy + bh / 2 - 24), "C", fill=ACCENT, font=F16b)
dim_h(d, ox, ox + bw, oy + bh + 22, "200")
dim_v(d, oy, oy + bh, ox + bw + 22, "120")

# Prospetto — right
d.text((520, ct + 10), "PROSPETTO FRONTE", fill=ACCENT, font=F14)
ox2, oy2 = 540, ct + 50
d.rectangle([ox2, oy2, ox2 + 400, oy2 + 160], fill=FILL, outline=LINE, width=2)
d.rectangle([ox2, oy2 + 160, ox2 + 400, oy2 + 178], fill=SOFT, outline=LINE, width=2)
d.text((ox2 + 145, oy2 + 70), "A (fronte)", fill=BLACK, font=F15b)
d.text((ox2 + 175, oy2 + 162), "F fondo", fill=BLACK, font=F12)
dim_h(d, ox2, ox2 + 400, oy2 + 200, "200")
dim_v(d, oy2, oy2 + 160, ox2 + 420, "90")
dim_v(d, oy2, oy2 + 178, ox2 + 455, "100")

# Sezione + fissaggio — bottom of views, clear of dims above
d.text((40, ct + 310), "SEZIONE TRASVERSALE", fill=ACCENT, font=F14)
ox3, oy3 = 80, ct + 340
d.rectangle([ox3, oy3, ox3 + 18, oy3 + 85], fill=FILL, outline=LINE, width=2)
d.rectangle([ox3 + 180, oy3, ox3 + 198, oy3 + 85], fill=FILL, outline=LINE, width=2)
d.rectangle([ox3, oy3 + 85, ox3 + 198, oy3 + 100], fill=SOFT, outline=LINE, width=2)
d.line([ox3 + 99, oy3, ox3 + 99, oy3 + 85], fill=ACCENT, width=3)
d.text((ox3 - 20, oy3 + 35), "B", fill=BLACK, font=F14)
d.text((ox3 + 208, oy3 + 35), "B", fill=BLACK, font=F14)
d.text((ox3 + 108, oy3 + 35), "C", fill=ACCENT, font=F14)
dim_h(d, ox3, ox3 + 198, oy3 + 118, "120")
dim_v(d, oy3, oy3 + 85, ox3 + 230, "90")

d.text((420, ct + 310), "FISSAGGIO", fill=ACCENT, font=F14)
d.rectangle([420, ct + 340, 900, ct + 455], fill=FILL, outline=LINE, width=1)
d.rectangle([450, ct + 355, 470, ct + 400], fill=SOFT, outline=LINE, width=1)
d.rectangle([450, ct + 400, 820, ct + 418], fill=SOFT, outline=LINE, width=1)
for hx in (458, 540, 620, 700, 780):
    d.ellipse([hx, ct + 405, hx + 8, ct + 413], fill=ACCENT)
d.text((450, ct + 430), "Viti 3,5×25  ·  passo ≈ 50 mm  ·  foro punta Ø 2–2,5", fill=GRAY, font=F12)

# Distinta — taller to fit ferramenta inside
y0 = 620
ct2 = panel(d, 20, y0, 1200, 220, "DISTINTA PEZZI  (L × W × S in mm)")
rows = [
    ["A", "Fronte / Retro", "2", "200", "90", "10", "Sui bordi lunghi della base F"],
    ["B", "Fianco sx / dx", "2", "100", "90", "10", "Inseriti tra i pezzi A"],
    ["C", "Divisore centrale", "1", "100", "85", "10", "Altezza –5 mm rispetto ai lati"],
    ["F", "Fondo / base", "1", "200", "120", "10", "Pezzo di riferimento"],
]
ty = table(d, 40, ct2 + 12, HDR, rows, [65, 230, 55, 60, 60, 45, 520], 30)
d.text((40, ty + 12), "Ferramenta: viti 3,5×25 (×16)  ·  carta abrasiva 120/180  ·  olio/vernice opzionale", fill=BLACK, font=F12)

# Bottom columns
y1 = 860
h1 = FOOT_TOP - y1
ct3 = panel(d, 20, y1, 590, h1, "SEQUENZA DI MONTAGGIO")
steps = [
    "1. Segnare e squadrare tutti i pezzi.",
    "2. Tagliare A×2, B×2, C, F.",
    "3. Sbavare i tagli (carta 120).",
    "4. Forare di punta Ø2–2,5 su A e B.",
    "5. Avvitare i due A sulla base F.",
    "6. Inserire i fianchi B e avvitarli.",
    "7. Fissare il divisore C a metà.",
    "8. Controllare squadra interna.",
    "9. Carteggiare spigoli (180).",
    "10. Marchiare nome/classe sotto.",
]
ct4 = panel(d, 630, y1, 590, h1, "NOTE DIDATTICHE / SICUREZZA")
notes = [
    "Obiettivo: taglio diritto, foratura,",
    "avvitatura e parallelismo.",
    "",
    "Errori tipici da evitare:",
    "• B troppo lunghi (non entrano)",
    "• avvitatura senza foro di punta",
    "• C fuori squadra",
    "• viti che escono di lato",
    "",
    "Sicurezza:",
    "• occhiali sempre",
    "• spingitoio sulla sega",
    "• pezzo bloccato in morsa",
    "• no percussione su pezzi piccoli",
    "",
    "Valutazione /10:",
    "• precisione quote ……… 3",
    "• montaggio/squadra …… 3",
    "• finitura ……………… 2",
    "• ordine/sicurezza ……… 2",
    "",
    "Materiale: abete/multistrato sp. 10 mm.",
    "Controllare squadra dopo ogni pezzo.",
    "Non forzare i pezzi B: ritagliare 1 mm.",
]
# LEFT: steps + QC filling column
yy = ct3 + 10
steps_end = ct3 + int((FOOT_TOP - ct3) * 0.45)
sh = max(26, (steps_end - yy) / len(steps))
for s in steps:
    d.text((36, yy), s, fill=BLACK, font=F14)
    yy += sh
d.rectangle([36, int(yy) + 4, 590, FOOT_TOP - 8], fill=BLUEBOX, outline=BLACK, width=3)
d.text((48, int(yy) + 14), "CONTROLLO QUALITÀ", fill=BLACK, font=F15b)
checks = ["□ Quote ±1 mm", "□ Angoli 90°", "□ Viti allineate", "□ Superfici carteggiate", "□ Non zoppica sul banco", "□ Niente schegge", "□ Nome sotto il pezzo"]
cy0 = int(yy) + 48
ch = max(28, (FOOT_TOP - 30 - cy0) / len(checks))
for i, c in enumerate(checks):
    d.text((48, cy0 + i * ch), c, fill=BLACK, font=F14)
# RIGHT: notes fill + student
yy = fill_lines(d, 650, ct4 + 10, FOOT_TOP - 195, notes, F14)
student_block(d, 650, FOOT_TOP - 188, FOOT_TOP - 8, F13, F14)
save(img, "01-2a-portapenne.png")

# =========================================================
# 3ª SGABELLO
# =========================================================
img, d = new_sheet("3ª", "Sgabello basso da officina",
                   "Difficoltà media-bassa · sp. 18 mm · ingombro 300×300×418")

ct = panel(d, 20, 108, 1200, 500, "VISTE QUOTATE")
d.text((40, ct + 8), "PIANTA", fill=ACCENT, font=F14)
ox, oy = 50, ct + 35
s = 300
d.rectangle([ox, oy, ox + s, oy + s], fill=FILL, outline=LINE, width=2)
for lx, ly in [(ox + 20, oy + 20), (ox + s - 42, oy + 20), (ox + 20, oy + s - 92), (ox + s - 42, oy + s - 92)]:
    d.rectangle([lx, ly, lx + 20, ly + 70], fill=SOFT, outline=LINE, width=1)
d.text((ox + s / 2 - 45, oy + s / 2 - 8), "inset 15 mm", fill=GRAY, font=F12)
dim_h(d, ox, ox + s, oy + s + 20, "300")
dim_v(d, oy, oy + s, ox + s + 20, "300")

d.text((430, ct + 8), "PROSPETTO FRONTE", fill=ACCENT, font=F14)
ox2, oy2 = 450, ct + 40
d.rectangle([ox2, oy2, ox2 + 300, oy2 + 18], fill=FILL, outline=LINE, width=2)
d.rectangle([ox2 + 22, oy2 + 18, ox2 + 40, oy2 + 250], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox2 + 260, oy2 + 18, ox2 + 278, oy2 + 250], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox2 + 40, oy2 + 170, ox2 + 260, oy2 + 188], fill=FILL, outline=ACCENT, width=2)
d.text((ox2 + 140, oy2 + 2), "P", fill=BLACK, font=F13)
d.text((ox2 + 135, oy2 + 172), "T1", fill=ACCENT, font=F13)
dim_h(d, ox2, ox2 + 300, oy2 - 14, "300")
dim_v(d, oy2, oy2 + 250, ox2 + 300, "418")
dim_v(d, oy2 + 188, oy2 + 250, ox2 + 335, "80")

d.text((860, ct + 8), "LATERALE", fill=ACCENT, font=F14)
ox3, oy3 = 880, ct + 40
d.rectangle([ox3, oy3, ox3 + 180, oy3 + 18], fill=FILL, outline=LINE, width=2)
d.rectangle([ox3 + 18, oy3 + 18, ox3 + 36, oy3 + 240], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox3 + 144, oy3 + 18, ox3 + 162, oy3 + 240], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox3 + 36, oy3 + 165, ox3 + 144, oy3 + 183], fill=FILL, outline=ACCENT, width=2)
d.text((ox3 + 75, oy3 + 167), "T2", fill=ACCENT, font=F13)
dim_h(d, ox3, ox3 + 180, oy3 + 265, "300")
dim_h(d, ox3 + 36, ox3 + 144, oy3 + 290, "160")
# legend clear area bottom-right of views panel
d.text((860, ct + 360), "G = 400×70×18 (×4)", fill=GRAY, font=F12)
d.text((860, ct + 382), "P = 300×300×18", fill=GRAY, font=F12)
d.text((860, ct + 404), "T1 = 230×50×18 (×2)", fill=GRAY, font=F12)
d.text((860, ct + 426), "T2 = 160×50×18 (×2)", fill=GRAY, font=F12)

y0 = 620
ct2 = panel(d, 20, y0, 1200, 220, "DISTINTA PEZZI  (L × W × S in mm)")
rows = [
    ["P", "Piano di seduta", "1", "300", "300", "18", "Fori svasati per gambe"],
    ["G", "Gamba", "4", "400", "70", "18", "Altezza totale ≈ 418 mm"],
    ["T1", "Traversa lunga", "2", "230", "50", "18", "Lati lunghi, a 80 mm da terra"],
    ["T2", "Traversa corta", "2", "160", "50", "18", "Chiude il telaio basso"],
]
ty = table(d, 40, ct2 + 12, HDR, rows, [65, 230, 55, 60, 60, 45, 520], 30)
d.text((40, ty + 12), "Ferramenta: viti 4×50 (×8) piano–gambe  ·  viti 4×40 (×16) traverse  ·  carta 80/120/180", fill=BLACK, font=F12)

y1 = 860
h1 = FOOT_TOP - y1
ct3 = panel(d, 20, y1, 590, h1, "SEQUENZA DI MONTAGGIO")
steps = [
    "1. Tagliare P, G×4, T1×2, T2×2.",
    "2. Smussare spigoli del piano.",
    "3. Segnare inset 15 mm sotto P.",
    "4. Posizionare le 4 gambe.",
    "5. 2 viti 4×50 svasate per gamba.",
    "6. Avvitare gambe dal piano.",
    "7. Montare T1 a 80 mm da terra.",
    "8. Montare T2 e chiudere telaio.",
    "9. Verificare stabilità a 4 piedi.",
    "10. Carteggiare e rifinire.",
]
ct4 = panel(d, 630, y1, 590, h1, "NOTE DIDATTICHE / SICUREZZA")
notes = [
    "Obiettivo: struttura portante,",
    "allineamento e stabilità.",
    "",
    "Punti critici:",
    "• gambe non perpendicolari",
    "• traverse a quote diverse",
    "• viti troppo corte / spaccano",
    "",
    "Sicurezza:",
    "• occhiali e protezione udito",
    "• pezzi lunghi con appoggio",
    "• avvitatura con pezzo bloccato",
    "",
    "Valutazione /10:",
    "• quote/squadra ……… 3",
    "• stabilità …………… 3",
    "• finitura …………… 2",
    "• metodo/sicurezza …… 2",
    "",
    "Test carico solo con docente.",
    "Legno: abete/pino sp. 18 mm.",
    "Segnare tutte le quote prima di forare.",
]
yy = ct3 + 10
steps_end = ct3 + int((FOOT_TOP - ct3) * 0.45)
sh = max(26, (steps_end - yy) / len(steps))
for s in steps:
    d.text((36, yy), s, fill=BLACK, font=F14)
    yy += sh
d.rectangle([36, int(yy) + 4, 590, FOOT_TOP - 8], fill=BLUEBOX, outline=BLACK, width=3)
d.text((48, int(yy) + 14), "CONTROLLO QUALITÀ", fill=BLACK, font=F15b)
checks = ["□ Piano a livello", "□ Non zoppica", "□ Traverse a 80 mm", "□ Viti a filo", "□ Spigoli smussati", "□ Rigidità laterale OK", "□ Nome sotto il piano"]
cy0 = int(yy) + 48
ch = max(28, (FOOT_TOP - 30 - cy0) / len(checks))
for i, c in enumerate(checks):
    d.text((48, cy0 + i * ch), c, fill=BLACK, font=F14)
yy = fill_lines(d, 650, ct4 + 10, FOOT_TOP - 195, notes, F14)
student_block(d, 650, FOOT_TOP - 188, FOOT_TOP - 8, F13, F14)
save(img, "02-3a-sgabello.png")

# =========================================================
# 4ª MENSOLA — careful spacing between views
# =========================================================
img, d = new_sheet("4ª", "Mensola a muro con staffe a L",
                   "Difficoltà media · sp. 18 mm · 700×200×220 · carico 8–12 kg")

ct = panel(d, 20, 108, 1200, 500, "VISTE QUOTATE")
# Front view top — leave room below for dims before next titles
d.text((40, ct + 8), "PROSPETTO FRONTE", fill=ACCENT, font=F14)
ox, oy = 50, ct + 38
d.rectangle([ox, oy, ox + 700, oy + 22], fill=FILL, outline=LINE, width=2)
d.rectangle([ox + 80, oy + 22, ox + 98, oy + 140], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox + 602, oy + 22, ox + 620, oy + 140], fill=SOFT, outline=LINE, width=1)
d.text((ox + 310, oy + 3), "R ripiano", fill=BLACK, font=F13)
d.text((ox + 84, oy + 80), "V", fill=BLACK, font=F13)
d.text((ox + 606, oy + 80), "V", fill=BLACK, font=F13)
dim_h(d, ox, ox + 700, oy + 160, "700")
dim_h(d, ox, ox + 80, oy + 182, "80")
dim_h(d, ox + 620, ox + 700, oy + 182, "80")

# Laterale — starts BELOW front dims (oy+182 + gap)
lat_title_y = ct + 230
d.text((40, lat_title_y), "LATERALE", fill=ACCENT, font=F14)
ox2, oy2 = 55, lat_title_y + 28
d.line([ox2, oy2 - 5, ox2, oy2 + 200], fill=GRAY, width=1)
d.text((ox2 - 38, oy2), "muro", fill=GRAY, font=Fm)
d.rectangle([ox2, oy2, ox2 + 16, oy2 + 180], fill=SOFT, outline=LINE, width=2)
d.rectangle([ox2, oy2, ox2 + 160, oy2 + 16], fill=FILL, outline=LINE, width=2)
d.rectangle([ox2, oy2 + 16, ox2 + 145, oy2 + 32], fill=(225, 235, 250), outline=ACCENT, width=2)
d.text((ox2 + 90, oy2 + 1), "R", fill=BLACK, font=F12)
d.text((ox2 + 70, oy2 + 17), "H", fill=ACCENT, font=F12)
d.text((ox2 + 28, oy2 + 95), "V", fill=BLACK, font=F13)
dim_h(d, ox2, ox2 + 160, oy2 - 16, "200")
dim_h(d, ox2, ox2 + 145, oy2 + 205, "180")
dim_v(d, oy2, oy2 + 180, ox2 + 185, "200")

# Vista dal basso — right of laterale, same vertical band
d.text((340, lat_title_y), "VISTA DAL BASSO", fill=ACCENT, font=F14)
ox3, oy3 = 350, lat_title_y + 28
d.rectangle([ox3, oy3, ox3 + 520, oy3 + 130], fill=FILL, outline=LINE, width=2)
d.rectangle([ox3, oy3, ox3 + 520, oy3 + 20], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox3 + 70, oy3 + 20, ox3 + 145, oy3 + 40], fill=(220, 230, 245), outline=ACCENT, width=1)
d.rectangle([ox3 + 375, oy3 + 20, ox3 + 450, oy3 + 40], fill=(220, 230, 245), outline=ACCENT, width=1)
d.text((ox3 + 190, oy3 + 3), "L listello 50×18", fill=BLACK, font=F12)
d.text((ox3 + 100, oy3 + 22), "H", fill=ACCENT, font=F12)
d.text((ox3 + 405, oy3 + 22), "H", fill=ACCENT, font=F12)
dim_h(d, ox3, ox3 + 520, oy3 + 155, "700")
dim_v(d, oy3, oy3 + 130, ox3 + 540, "200")

d.text((40, ct + 460), "Staffe a 80 mm dalle estremità  ·  3 viti Ø4×40 nell’angolo  ·  livello a bolla obbligatorio", fill=GRAY, font=F12)

y0 = 620
ct2 = panel(d, 20, y0, 1200, 220, "DISTINTA PEZZI  (L × W × S in mm)")
rows = [
    ["R", "Ripiano", "1", "700", "200", "18", "Spigoli superiori arrotondati"],
    ["V", "Braccio verticale staffa", "2", "200", "80", "18", "A muro"],
    ["H", "Braccio orizzontale staffa", "2", "180", "80", "18", "Sotto ripiano"],
    ["L", "Listello posteriore", "1", "700", "50", "18", "Fissaggio a muro + livello"],
]
ty = table(d, 40, ct2 + 12, HDR, rows, [65, 260, 55, 60, 60, 45, 490], 26)
d.text((40, ty + 12), "Ferramenta: viti 4×40 (×20)  ·  tasselli Ø6–8 + viti a muro (×4)  ·  livella a bolla", fill=BLACK, font=F12)

y1 = 860
h1 = FOOT_TOP - y1
ct3 = panel(d, 20, y1, 590, h1, "SEQUENZA DI MONTAGGIO")
steps = [
    "1. Tagliare R, V×2, H×2, L.",
    "2. Assemblare staffe V+H a 90°.",
    "3. 3 viti nell’angolo; verifica.",
    "4. Fissare listello L sotto R.",
    "5. Staffe a 80 mm dalle estremità.",
    "6. Segnare fori muro in bolla.",
    "7. Tasselli e viti a muro ×4.",
    "8. Appendere e test carico.",
    "9. Carteggiare e rifinire.",
]
yy = ct3 + 14
for s in steps:
    d.text((36, yy), s, fill=BLACK, font=F13)
    yy += 30
d.rectangle([36, yy + 8, 590, FOOT_TOP - 16], fill=BLUEBOX, outline=ACCENT, width=2)
d.text((48, yy + 18), "CONTROLLO QUALITÀ", fill=ACCENT, font=F14)
for i, c in enumerate(["□ Staffe a 90°", "□ Ripiano in bolla", "□ Simmetria 80–80", "□ Fissaggio solido", "□ Viti non sporgenti", "□ Test 8–12 kg OK"]):
    d.text((48, yy + 48 + i * 28), c, fill=BLACK, font=F13)

ct4 = panel(d, 630, y1, 590, h1, "NOTE DIDATTICHE / SICUREZZA")
notes = [
    "Obiettivo: precisione, carico,",
    "fissaggio a muro sicuro.",
    "",
    "Punti critici:",
    "• staffa non a squadra",
    "• fori muro fuori livello",
    "• tassello sbagliato per il muro",
    "",
    "Sicurezza:",
    "• occhiali in foratura",
    "• verificare impianti dietro muro",
    "• non caricare a sbalzo eccessivo",
    "",
    "Valutazione /10:",
    "• squadra staffe ……… 3",
    "• montaggio/livello …… 3",
    "• finitura …………… 2",
    "• sicurezza fissaggio … 2",
    "",
    "Variante: ripiano 600 mm",
    "se lo spazio muro è ridotto.",
]
yy = ct4 + 14
for n in notes:
    d.text((650, yy), n, fill=BLACK, font=F13)
    yy += 24
# skip mensola — 4ª is manico nylon
# save(img, "03-4a-mensola.png")

# =========================================================
# 5ª PORTA-ATTREZZI — labels clear of holes/hooks
# =========================================================
img, d = new_sheet("5ª", "Porta-attrezzi da muro",
                   "Difficoltà media-alta · 15–18 mm · pannello 800×500 · officina")

ct = panel(d, 20, 108, 1200, 500, "VISTE QUOTATE")
d.text((40, ct + 8), "PROSPETTO FRONTE", fill=ACCENT, font=F14)
ox, oy = 45, ct + 38
pw, ph = 640, 340
d.rectangle([ox, oy, ox + pw, oy + ph], fill=FILL, outline=LINE, width=2)
d.rectangle([ox, oy, ox + pw, oy + 24], fill=SOFT, outline=LINE, width=2)
d.text((ox + pw / 2 - 10, oy + 4), "M", fill=BLACK, font=F13)
# Bar B — holes, label to the LEFT outside bar
by = oy + 95
d.rectangle([ox + 30, by, ox + pw - 30, by + 30], fill=(220, 230, 245), outline=ACCENT, width=2)
for i in range(13):
    hx = ox + 55 + i * 42
    d.ellipse([hx - 5, by + 10, hx + 5, by + 20], outline=LINE, width=1)
d.text((ox + 36, by - 18), "B  barra forata", fill=ACCENT, font=F12)

# Hook rail G — label to the right, clear of hooks
gy = oy + 165
d.rectangle([ox + 30, gy, ox + pw - 30, gy + 18], fill=SOFT, outline=LINE, width=2)
for i in range(6):
    hx = ox + 70 + i * 90
    d.line([hx, gy + 18, hx, gy + 40], fill=LINE, width=2)
    d.arc([hx - 6, gy + 34, hx + 6, gy + 46], 0, 180, fill=LINE, width=2)
d.text((ox + pw - 150, gy - 2), "G  listello ganci", fill=BLACK, font=F12)

# Boxes C
box_y = oy + 240
d.rectangle([ox + 40, box_y, ox + 180, oy + ph - 18], fill=(228, 228, 228), outline=LINE, width=2)
d.rectangle([ox + 210, box_y, ox + 350, oy + ph - 18], fill=(228, 228, 228), outline=LINE, width=2)
d.text((ox + 95, box_y + 30), "C", fill=BLACK, font=F16b)
d.text((ox + 265, box_y + 30), "C", fill=BLACK, font=F16b)
# P label in open space right of boxes, not on hooks
d.text((ox + 420, oy + ph / 2 + 20), "P  pannello", fill=GRAY, font=F14)

dim_h(d, ox, ox + pw, oy + ph + 22, "800")
dim_v(d, oy, oy + ph, ox + pw + 20, "500")

d.text((780, ct + 8), "LATERALE", fill=ACCENT, font=F14)
ox2, oy2 = 820, ct + 40
d.line([ox2, oy2, ox2, oy2 + 320], fill=GRAY, width=1)
d.text((ox2 - 40, oy2 - 5), "muro", fill=GRAY, font=Fm)
d.rectangle([ox2, oy2, ox2 + 14, oy2 + 320], fill=FILL, outline=LINE, width=2)
d.rectangle([ox2, oy2, ox2 + 100, oy2 + 16], fill=SOFT, outline=LINE, width=2)
d.polygon([(ox2 + 14, oy2 + 16), (ox2 + 80, oy2 + 16), (ox2 + 14, oy2 + 75)], fill=(220, 230, 245), outline=ACCENT)
d.text((ox2 + 88, oy2 + 40), "S", fill=ACCENT, font=F13)  # outside triangle
d.rectangle([ox2, oy2 + 95, ox2 + 20, oy2 + 120], fill=(220, 230, 245), outline=ACCENT, width=1)
d.rectangle([ox2, oy2 + 165, ox2 + 18, oy2 + 180], fill=SOFT, outline=LINE, width=1)
d.rectangle([ox2, oy2 + 240, ox2 + 80, oy2 + 315], fill=(228, 228, 228), outline=LINE, width=2)
dim_h(d, ox2, ox2 + 100, oy2 - 16, "160")
dim_v(d, oy2, oy2 + 320, ox2 + 120, "500")
d.text((780, ct + 400), "B: fori Ø12 passo 40 mm", fill=GRAY, font=F12)
d.text((780, ct + 422), "Ganci a vite ×6 · tasselli Ø8 ×4", fill=GRAY, font=F12)

y0 = 620
ct2 = panel(d, 20, y0, 1200, 250, "DISTINTA PEZZI  (L × W × S in mm)")
rows = [
    ["P", "Pannello posteriore", "1", "800", "500", "15", "Fissaggio a muro"],
    ["M", "Mensola superiore", "1", "800", "160", "18", "Su P + supporti S"],
    ["S", "Supporto mensola", "2", "140", "100", "18", "Squadretta / triangolo"],
    ["B", "Barra porta-utensili", "1", "800", "70", "18", "Fori Ø12 passo 40"],
    ["G", "Listello ganci", "1", "800", "50", "18", "Ganci a vite ×6"],
    ["C1", "Fondo cassetta", "2", "180", "120", "10", "Contenitori aperti"],
    ["C2", "Fianchi cassetta", "4", "120", "90", "10", "Altezza utile ≈ 90"],
    ["C3", "Fronte/retro cassetta", "4", "180", "90", "10", "Tra i fianchi"],
]
ty = table(d, 40, ct2 + 8, HDR, rows, [55, 230, 50, 60, 60, 40, 540], 26)
d.text((40, ty + 10), "Ferramenta: viti 4×40 (×30)  ·  3,5×25 (×24)  ·  ganci a vite (×6)  ·  tasselli Ø8 (×4)", fill=BLACK, font=F12)

y1 = 890
h1 = FOOT_TOP - y1
ct3 = panel(d, 20, y1, 590, h1, "SEQUENZA DI MONTAGGIO")
steps = [
    "1. Tagliare pezzi; forare B Ø12.",
    "2. Avvitare M e S su pannello P.",
    "3. Fissare barra B e listello G.",
    "4. Assemblare le due cassette C.",
    "5. Avvitare cassette in basso su P.",
    "6. Montare i 6 ganci su G.",
    "7. Segnare fori muro a livello.",
    "8. Tasselli Ø8 e appendere.",
    "9. Carteggiare e rifinire.",
]
ct4 = panel(d, 630, y1, 590, h1, "NOTE DIDATTICHE / SICUREZZA")
notes = [
    "Obiettivo: progetto officina completo",
    "(foratura seriale, moduli, muro).",
    "",
    "Punti critici:",
    "• fori B non in linea",
    "• mensola fuori squadra",
    "• cassette non parallele",
    "• tassello sbagliato",
    "",
    "Sicurezza:",
    "• occhiali in foratura",
    "• impianti dietro il muro",
    "• non sovraccaricare mensola",
    "",
    "Valutazione /10:",
    "• precisione fori/quote … 3",
    "• montaggio …………… 3",
    "• finitura/ordine ……… 2",
    "• sicurezza/fissaggio …… 2",
    "",
    "Usare livella a bolla sul pannello.",
    "Forare B con dima / passo fisso 40.",
]
yy = ct3 + 10
steps_end = ct3 + int((FOOT_TOP - ct3) * 0.42)
sh = max(26, (steps_end - yy) / len(steps))
for s in steps:
    d.text((36, yy), s, fill=BLACK, font=F14)
    yy += sh
d.rectangle([36, int(yy) + 4, 590, FOOT_TOP - 8], fill=BLUEBOX, outline=BLACK, width=3)
d.text((48, int(yy) + 14), "CONTROLLO QUALITÀ", fill=BLACK, font=F15b)
checks = ["□ Fori B allineati", "□ Mensola a squadra", "□ Cassette salde", "□ Pannello in bolla", "□ Utensili nei fori OK", "□ Niente schegge", "□ Nome sul retro P"]
cy0 = int(yy) + 48
ch = max(28, (FOOT_TOP - 30 - cy0) / len(checks))
for i, c in enumerate(checks):
    d.text((48, cy0 + i * ch), c, fill=BLACK, font=F14)
yy = fill_lines(d, 650, ct4 + 10, FOOT_TOP - 195, notes, F14)
student_block(d, 650, FOOT_TOP - 188, FOOT_TOP - 8, F13, F14)
save(img, "04-5a-porta-attrezzi.png")

with zipfile.ZipFile(f"{OUT}/progetti-legno-schede.zip", "w") as z:
    for n in ["01-2a-portapenne.png", "02-3a-sgabello.png", "03-4a-manico-cacciaviti.png", "04-5a-porta-attrezzi.png"]:
        z.write(f"{OUT}/{n}", n)

print("all done")

# friendly copies for chat download
import shutil
for src, dst in [
    ("01-2a-portapenne.png", "2a-portapenne.png"),
    ("02-3a-sgabello.png", "3a-sgabello.png"),
    ("04-5a-porta-attrezzi.png", "5a-porta-attrezzi.png"),
]:
    shutil.copy(f"{OUT}/{src}", f"/opt/cursor/artifacts/{dst}")
print("copied friendly names")

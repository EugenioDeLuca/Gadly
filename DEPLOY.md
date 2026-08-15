# Deploy Gadly su Render

## Prerequisiti

- Account GitHub (gratuito)
- Account Render (gratuito)
- Codice su un repository GitHub

---

## Passo 1: Crea il repository su GitHub

1. Vai su [github.com](https://github.com) e accedi
2. Clicca **New repository**
3. Nome: `gadly` (o altro)
4. **Non** selezionare "Add README" se hai già codice
5. Clicca **Create repository**

---

## Passo 2: Carica il codice su GitHub

Sul tuo PC, nella cartella del progetto:

```bash
cd /home/mint/Documents/Tools_Site

# Inizializza git (se non già fatto)
git init

# Aggiungi tutto
git add .
git commit -m "Initial commit"

# Collega a GitHub (sostituisci TUO_USERNAME e TUO_REPO)
git remote add origin https://github.com/TUO_USERNAME/TUO_REPO.git
git branch -M main
git push -u origin main
```

**Importante:** crea un file `.gitignore` per non caricare:
- `venv/`
- `db.sqlite3`
- `__pycache__/`
- `.env`
- `media/` (upload utenti)

---

## Passo 3: Crea il servizio su Render

1. Vai su [render.com](https://render.com) e registrati (con GitHub)
2. Clicca **New** → **Web Service**
3. Collega il repository GitHub (autorizza Render)
4. Seleziona il repository `gadly`
5. Configura:
   - **Name:** `gadly`
   - **Region:** Frankfurt (o la più vicina)
   - **Branch:** `main`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input`
   - **Start Command:** `gunicorn config.wsgi:application`

---

## Passo 4: Variabili d'ambiente su Render

Nella sezione **Environment** del servizio, aggiungi:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | (Genera su [djecrety.ir](https://djecrety.ir/) - stringa lunga random) |
| `DJANGO_DEBUG` | `0` |
| `ALLOWED_HOSTS` | `gadly.onrender.com,gadly.it,www.gadly.it` |

(Sostituisci `gadly.onrender.com` con l'URL reale che Render ti assegna, tipo `gadly-xxxx.onrender.com`)

---

## Passo 5: Deploy

Clicca **Create Web Service**. Render avvierà il build e il deploy (5-10 minuti la prima volta).

Al termine avrai un URL tipo: `https://gadly-xxxx.onrender.com`

---

## Passo 6: Collega gadly.it (dominio personalizzato)

1. Su Render: **Settings** → **Custom Domains** → **Add Custom Domain**
2. Inserisci: `gadly.it` e `www.gadly.it`
3. Render ti darà un **CNAME** (es. `gadly-xxxx.onrender.com`)
4. Su Aruba (Gestione DNS di gadly.it):
   - **CNAME** per `www` → punta a `gadly-xxxx.onrender.com`
   - **A** per `@` (root) → usa l'IP che Render indica per il redirect

Render mostra le istruzioni DNS precise quando aggiungi il dominio.

---

## Passo 7: Cloudinary (foto/video che restano dopo i riavvii)

Su Render il disco si svuota a ogni deploy/riavvio. Gli upload (portfolio Drose, avatar) vanno su Cloudinary.

1. Crea un account free su [cloudinary.com](https://cloudinary.com)
2. Nella dashboard copia **Cloud name**, **API Key**, **API Secret**
   (oppure la stringa unica **CLOUDINARY_URL**)
3. Su Render → tuo Web Service → **Environment** → aggiungi una di queste due opzioni:

**Opzione A (consigliata):** una sola variabile

| Key | Value |
|-----|-------|
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |

**Opzione B:** tre variabili

| Key | Value |
|-----|-------|
| `CLOUDINARY_CLOUD_NAME` | (dalla dashboard) |
| `CLOUDINARY_API_KEY` | (dalla dashboard) |
| `CLOUDINARY_API_SECRET` | (dalla dashboard) |

4. Salva: Render ridistruisce. Poi **ricarica** foto/video dalla gestione Lavori Drose (i vecchi file solo su disco Render non tornano da soli).

In locale, **senza** queste variabili, i file restano in `media/` come prima.

---

## Note

- **SQLite:** i dati potrebbero resettarsi ai redeploy (filesystem efimero). Quando servono dati stabili, aggiungi Postgres free esterno (Neon/Supabase) o Postgres a pagamento.
- **Email:** le email (reset password, verifica) vanno in console in sviluppo. Per produzione configura SMTP.
- **Media files:** con Cloudinary configurato (Passo 7) foto/video/avatar restano dopo i riavvii di Render.

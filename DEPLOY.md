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

## Note

- **SQLite:** i dati potrebbero resettarsi ai redeploy (filesystem efimero). Per produzione seria, aggiungi PostgreSQL da Render.
- **Email:** le email (reset password, verifica) vanno in console in sviluppo. Per produzione configura SMTP.
- **Media files:** gli upload (avatar, ecc.) su Render free potrebbero non persistere. Considera storage esterno (S3, Cloudflare R2) in futuro.

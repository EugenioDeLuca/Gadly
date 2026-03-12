# Gadly – Guida al deploy in produzione

## Variabili d'ambiente da impostare

```bash
# Obbligatorio: genera una chiave sicura (python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
export SECRET_KEY="la-tua-chiave-sicura"

# Disabilita debug
export DJANGO_DEBUG=0

# Domini autorizzati (separati da virgola)
export ALLOWED_HOSTS="tuodominio.com,www.tuodominio.com"
```

## Comandi pre-deploy

```bash
# Raccogli i file statici
python manage.py collectstatic --noinput

# Eventuali migrazioni
python manage.py migrate
```

## Server (es. Gunicorn + Nginx)

```bash
# Installa Gunicorn
pip install gunicorn

# Avvio (esempio)
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

## HTTPS (consigliato)

Se usi HTTPS, abilita in `config/settings.py` (nella sezione `if not DEBUG`):

```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## Checklist

- [ ] `SECRET_KEY` generata e non committata
- [ ] `DEBUG = False` (via `DJANGO_DEBUG=0`)
- [ ] `ALLOWED_HOSTS` configurato
- [ ] `collectstatic` eseguito
- [ ] HTTPS attivo
- [ ] Firewall / rate limiting sul Video Downloader (opzionale)

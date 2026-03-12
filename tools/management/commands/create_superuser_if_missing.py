"""
Create superuser from env vars if not exists. For Render deploy (no Shell).
Prints clear messages to stdout for Render logs.
"""
import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Create superuser from DJANGO_SUPERUSER_* env vars if not exists"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "").strip()

        # Debug: show what we see (no secrets)
        has_u = "yes" if username else "no"
        has_e = "yes" if email else "no"
        has_p = f"yes (len={len(password)})" if password else "no"
        print(f"[GADLY] Env: USERNAME={has_u}, EMAIL={has_e}, PASSWORD={has_p}")

        if not username:
            print("[GADLY] Superuser NOT created: DJANGO_SUPERUSER_USERNAME is empty. Add it in Render Environment.")
            return
        if not email:
            print("[GADLY] Superuser NOT created: DJANGO_SUPERUSER_EMAIL is empty. Add it in Render Environment.")
            return
        if not password:
            print("[GADLY] Superuser NOT created: DJANGO_SUPERUSER_PASSWORD is empty. Add it in Render Environment.")
            return

        if User.objects.filter(username=username).exists():
            print(f"[GADLY] Superuser '{username}' already exists.")
            return

        try:
            # Use set_password to bypass strict validators (env var is trusted)
            user = User(username=username, email=email, is_staff=True, is_superuser=True)
            user.set_password(password)
            user.save()
            print(f"[GADLY] Superuser '{username}' created successfully.")
            # Verify credentials work
            from django.contrib.auth import authenticate
            auth_user = authenticate(username=username, password=password)
            print(f"[GADLY] Login test: {'OK' if auth_user else 'FAILED - wrong password?'}")
        except Exception as e:
            print(f"[GADLY] Superuser creation FAILED: {e}")
            # Do not exit(1) - site must start even without admin

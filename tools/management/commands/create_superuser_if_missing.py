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
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "")

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
            User.objects.create_superuser(username=username, email=email, password=password)
            print(f"[GADLY] Superuser '{username}' created successfully.")
        except Exception as e:
            print(f"[GADLY] Superuser creation FAILED: {e}")
            print("[GADLY] Password must be 12+ chars, not common, not numeric-only.")
            # Do not exit(1) - site must start even without admin

"""
Create or refresh the bootstrap superuser from env vars (Render deploy, no Shell).

Set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD
in Render Environment. On every deploy the password is synced from env so login
stays predictable after SQLite resets or credential drift.
"""
import os

from django.contrib.auth import authenticate, get_user_model
from django.core.management.base import BaseCommand

from tools.models import UserProfile


class Command(BaseCommand):
    help = "Create or refresh superuser from DJANGO_SUPERUSER_* env vars"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip()
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "").strip()

        has_u = "yes" if username else "no"
        has_e = "yes" if email else "no"
        has_p = f"yes (len={len(password)})" if password else "no"
        print(f"[GADLY] Env: USERNAME={has_u}, EMAIL={has_e}, PASSWORD={has_p}")

        if not username:
            print(
                "[GADLY] Superuser NOT created: DJANGO_SUPERUSER_USERNAME is empty. "
                "Add it in Render Environment."
            )
            return
        if not email:
            print(
                "[GADLY] Superuser NOT created: DJANGO_SUPERUSER_EMAIL is empty. "
                "Add it in Render Environment."
            )
            return
        if not password:
            print(
                "[GADLY] Superuser NOT created: DJANGO_SUPERUSER_PASSWORD is empty. "
                "Add it in Render Environment."
            )
            return

        existing = User.objects.filter(username=username).first()
        try:
            if existing is None:
                user = User(
                    username=username,
                    email=email,
                    is_staff=True,
                    is_superuser=True,
                )
                user.set_password(password)
                user.save()
                print(f"[GADLY] Superuser '{username}' created successfully.")
            else:
                user = existing
                user.email = email
                user.is_staff = True
                user.is_superuser = True
                user.set_password(password)
                user.save()
                print(f"[GADLY] Superuser '{username}' updated (password synced from env).")

            profile, _created = UserProfile.objects.get_or_create(user=user)
            if not profile.email_verified:
                profile.email_verified = True
                profile.save(update_fields=["email_verified"])

            self._reset_login_lockouts(username)

            auth_user = authenticate(username=username, password=password)
            print(f"[GADLY] Login test: {'OK' if auth_user else 'FAILED - check Axes/backends'}")
        except Exception as exc:
            print(f"[GADLY] Superuser bootstrap FAILED: {exc}")

    def _reset_login_lockouts(self, username: str) -> None:
        try:
            from axes.utils import reset

            cleared = reset(username=username)
            if cleared:
                print(f"[GADLY] Cleared {cleared} Axes lockout record(s) for '{username}'.")
        except Exception as exc:
            print(f"[GADLY] Axes reset skipped: {exc}")

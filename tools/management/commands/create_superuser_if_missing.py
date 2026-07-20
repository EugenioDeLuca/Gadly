"""
Create or refresh the bootstrap superuser from env vars (Render deploy, no Shell).

Set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD
in Render Environment. On every deploy the password is synced from env so login
stays predictable after SQLite resets or credential drift.
"""
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
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

        self._reset_all_login_lockouts()

        existing = User.objects.filter(username=username).first()
        if existing is None and email:
            existing = User.objects.filter(email__iexact=email).first()

        try:
            if existing is None:
                user = User(
                    username=username,
                    email=email,
                    is_staff=True,
                    is_superuser=True,
                    is_active=True,
                )
                user.set_password(password)
                user.save()
                print(f"[GADLY] Superuser '{username}' created successfully.")
            else:
                user = existing
                if user.username != username:
                    print(
                        f"[GADLY] Found existing user '{user.username}' by email; "
                        f"syncing staff flags and password."
                    )
                user.email = email
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.set_password(password)
                user.save()
                print(f"[GADLY] Superuser '{user.username}' updated (password synced from env).")

            profile, _created = UserProfile.objects.get_or_create(user=user)
            if not profile.email_verified:
                profile.email_verified = True
                profile.save(update_fields=["email_verified"])

            password_ok = check_password(password, user.password)
            print(
                f"[GADLY] Password hash check: {'OK' if password_ok else 'FAILED'} "
                f"(login with username '{user.username}')"
            )
        except Exception as exc:
            print(f"[GADLY] Superuser bootstrap FAILED: {exc}")

    def _reset_all_login_lockouts(self) -> None:
        """Clear Axes lockouts after deploy / failed login bursts (403 on POST)."""
        try:
            from axes.utils import reset

            cleared = reset()
            if cleared:
                print(f"[GADLY] Cleared {cleared} Axes lockout record(s) (all users/IPs).")
            else:
                print("[GADLY] No Axes lockout records to clear.")
        except Exception as exc:
            print(f"[GADLY] Axes reset skipped: {exc}")

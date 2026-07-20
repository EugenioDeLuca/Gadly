"""Bootstrap the production admin user from environment variables."""
from __future__ import annotations

import os
import sys
import threading

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db import connection, transaction

from tools.models import UserProfile

_lock = threading.Lock()
_done = False


def _env_credentials() -> tuple[str, str, str]:
    username = (
        os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip()
        or os.environ.get("GADLY_ADMIN_USERNAME", "").strip()
    )
    password = (
        os.environ.get("DJANGO_SUPERUSER_PASSWORD", "").strip()
        or os.environ.get("GADLY_ADMIN_PASSWORD", "").strip()
    )
    email = (
        os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        or os.environ.get("GADLY_ADMIN_EMAIL", "").strip()
        or (f"{username}@gadly.it" if username else "")
    )
    return username, email, password


def _log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def _reset_axes_lockouts() -> None:
    try:
        from axes.utils import reset

        cleared = reset()
        if cleared:
            _log(f"[GADLY] Cleared {cleared} Axes lockout record(s).")
    except Exception as exc:
        _log(f"[GADLY] Axes reset skipped: {exc}")


def bootstrap_admin_from_env(*, force: bool = False) -> bool:
    """
    Create or refresh the staff superuser from env vars.
    Returns True when a user was created/updated successfully.
    """
    global _done
    if _done and not force:
        return False

    with _lock:
        if _done and not force:
            return False

        username, email, password = _env_credentials()
        _log(
            f"[GADLY] Bootstrap check: username={'yes' if username else 'NO'}, "
            f"password={'yes (len=' + str(len(password)) + ')' if password else 'NO'}"
        )

        if not username or not password:
            _log(
                "[GADLY] Admin NOT created: set DJANGO_SUPERUSER_USERNAME and "
                "DJANGO_SUPERUSER_PASSWORD in Render Environment."
            )
            _done = True
            return False

        # Migrations must have run (auth_user table exists).
        if "auth_user" not in connection.introspection.table_names():
            _log("[GADLY] Admin bootstrap waiting: auth_user table not ready yet.")
            return False

        User = get_user_model()
        _reset_axes_lockouts()

        existing = User.objects.filter(username=username).first()
        if existing is None and email:
            existing = User.objects.filter(email__iexact=email).first()

        try:
            with transaction.atomic():
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
                    _log(f"[GADLY] Superuser '{username}' CREATED.")
                else:
                    user = existing
                    user.email = email
                    user.is_staff = True
                    user.is_superuser = True
                    user.is_active = True
                    user.set_password(password)
                    user.save()
                    _log(f"[GADLY] Superuser '{user.username}' UPDATED (password synced).")

                profile, _ = UserProfile.objects.get_or_create(user=user)
                if not profile.email_verified:
                    profile.email_verified = True
                    profile.save(update_fields=["email_verified"])

            ok = check_password(password, user.password)
            _log(f"[GADLY] Password hash check: {'OK' if ok else 'FAILED'}")
            _log("[GADLY] === LOGIN WITH THIS USERNAME ===")
            _log(f"[GADLY] https://www.gadly.it/admin/  username={user.username}")
            _done = True
            return ok
        except Exception as exc:
            _log(f"[GADLY] Admin bootstrap FAILED: {exc}")
            _done = True
            return False


class BootstrapAdminMiddleware:
    """Run admin bootstrap on the first HTTP request (reliable on Render)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        bootstrap_admin_from_env()
        return self.get_response(request)

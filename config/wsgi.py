"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_wsgi_application()


def _bootstrap_admin_from_env() -> None:
    """
    Render start command may omit create_superuser_if_missing; ensure the
    bootstrap admin exists whenever DJANGO_SUPERUSER_* env vars are set.
    Safe to call on every worker start (idempotent).
    """
    if not os.environ.get("DJANGO_SUPERUSER_USERNAME", "").strip():
        return
    try:
        from django.core.management import call_command

        call_command("create_superuser_if_missing", verbosity=1)
    except Exception as exc:
        print(f"[GADLY] Bootstrap admin on startup failed: {exc}", flush=True)


_bootstrap_admin_from_env()

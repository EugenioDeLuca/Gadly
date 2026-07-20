"""
Create or refresh the bootstrap superuser from env vars (Render deploy, no Shell).

Set DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD in Render Environment.
Aliases: GADLY_ADMIN_USERNAME / GADLY_ADMIN_PASSWORD.
"""
from django.core.management.base import BaseCommand

from tools.bootstrap_admin import bootstrap_admin_from_env


class Command(BaseCommand):
    help = "Create or refresh superuser from DJANGO_SUPERUSER_* env vars"

    def handle(self, *args, **options):
        bootstrap_admin_from_env(force=True)

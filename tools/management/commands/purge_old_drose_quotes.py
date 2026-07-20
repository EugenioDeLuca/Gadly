"""
Elimina definitivamente i preventivi Drose nel cestino da più di N giorni.

Esempio (cron / Render scheduled job, giornaliero):
    python manage.py purge_old_drose_quotes

Prova senza cancellare:
    python manage.py purge_old_drose_quotes --dry-run
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from tools.models import DroseQuoteRequest


class Command(BaseCommand):
    help = (
        "Permanently delete Drose quote requests that have been in the trash "
        "longer than the retention period (default: 60 days)."
    )

    def add_arguments(self, parser):
        default_days = getattr(settings, "DROSE_QUOTE_TRASH_RETENTION_DAYS", 60)
        parser.add_argument(
            "--days",
            type=int,
            default=default_days,
            help=f"Trash retention in days (default: {default_days}).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="List matching quotes without deleting them.",
        )

    def handle(self, *args, **options):
        days = max(1, int(options["days"]))
        dry_run = bool(options["dry_run"])
        cutoff = timezone.now() - timedelta(days=days)

        quotes = DroseQuoteRequest.objects.filter(
            deleted_at__isnull=False,
            deleted_at__lt=cutoff,
        ).order_by("deleted_at")

        count = quotes.count()
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"No removed quotes older than {days} days (before {cutoff:%Y-%m-%d %H:%M %Z})."
                )
            )
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"Dry run: {count} quote(s) would be permanently deleted "
                    f"(removed before {cutoff:%Y-%m-%d %H:%M %Z}):"
                )
            )
            for quote in quotes[:50]:
                self.stdout.write(
                    f"  - {quote.reference} ({quote.full_name}) "
                    f"removed {quote.deleted_at:%Y-%m-%d %H:%M}"
                )
            if count > 50:
                self.stdout.write(f"  ... and {count - 50} more")
            return

        references = list(quotes.values_list("reference", flat=True)[:20])
        deleted_total, _details = quotes.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Permanently deleted {deleted_total} quote request(s) "
                f"removed more than {days} days ago."
            )
        )
        if references:
            shown = ", ".join(references[:10])
            suffix = f" (+{len(references) - 10} more)" if len(references) > 10 else ""
            self.stdout.write(f"References: {shown}{suffix}")

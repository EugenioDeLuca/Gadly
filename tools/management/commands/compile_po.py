"""
Compile GNU gettext .po files to .mo without msgfmt / GNU gettext.

Use when `python manage.py compilemessages` fails with:
  CommandError: Can't find msgfmt

Usage:
  python manage.py compile_po
  python manage.py compile_po -l it
"""
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

try:
    import polib
except ImportError:  # pragma: no cover - exercised at runtime
    polib = None


class Command(BaseCommand):
    help = "Compile locale .po -> .mo using polib (no gettext/msgfmt required)."

    def add_arguments(self, parser):
        parser.add_argument(
            "-l",
            "--locale",
            dest="locale",
            help="Only this language code (e.g. it). Default: all languages under LOCALE_PATHS.",
        )

    def handle(self, *args, **options):
        if polib is None:
            raise CommandError(
                'Missing dependency "polib". Install with: pip install polib'
            )
        only = (options.get("locale") or "").strip() or None

        for locale_root in settings.LOCALE_PATHS:
            root = Path(locale_root)
            if not root.is_dir():
                self.stderr.write(self.style.WARNING(f"Skip missing path: {root}"))
                continue

            for lang_dir in sorted(root.iterdir()):
                if not lang_dir.is_dir():
                    continue
                if only and lang_dir.name != only:
                    continue
                lc = lang_dir / "LC_MESSAGES"
                if not lc.is_dir():
                    continue
                for po_path in sorted(lc.glob("*.po")):
                    mo_path = po_path.with_suffix(".mo")
                    try:
                        po = polib.pofile(str(po_path), encoding="utf-8")
                        po.save_as_mofile(str(mo_path))
                    except Exception as exc:
                        raise CommandError(f"Failed {po_path}: {exc}") from exc
                    self.stdout.write(
                        self.style.SUCCESS(f"Compiled {po_path.name} -> {mo_path.name} ({lang_dir.name})")
                    )

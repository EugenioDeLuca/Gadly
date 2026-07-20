"""Inline JPEG data-URIs for Drose home service cards (no flash on refresh)."""

from __future__ import annotations

import base64
import os
from io import BytesIO

from django.conf import settings
from django.core.cache import cache

SERVICE_PHOTO_FILES = {
    "aerial": "drose-service-aerial.jpg",
    "inspection": "drose-service-inspection.jpg",
    "mapping": "drose-service-mapping.jpg",
    "events": "drose-service-events.jpg",
}


def _static_image_path(filename: str) -> str:
    return os.path.join(
        settings.BASE_DIR,
        "tools",
        "static",
        "tools",
        "images",
        filename,
    )


def service_photo_data_uri(key: str, *, max_edge: int = 960, quality: int = 78) -> str:
    """Return a JPEG data URI for a service card photo, cached by mtime."""
    filename = SERVICE_PHOTO_FILES.get(key)
    if not filename:
        return ""

    path = _static_image_path(filename)
    if not os.path.isfile(path):
        return ""

    mtime = int(os.path.getmtime(path))
    cache_key = f"drose-svc-inline-v2:{filename}:{max_edge}:{quality}:{mtime}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        from PIL import Image, ImageOps
    except ImportError:
        return ""

    try:
        img = ImageOps.exif_transpose(Image.open(path))
        img = img.convert("RGB")
        resample = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS
        img.thumbnail((max_edge, max_edge), resample)
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        data_uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception:
        return ""

    cache.set(cache_key, data_uri, timeout=60 * 60 * 24 * 30)
    return data_uri


def drose_service_photo_uris() -> dict[str, str]:
    return {key: service_photo_data_uri(key) for key in SERVICE_PHOTO_FILES}

"""Tiny inline data-URI avatars for flicker-free header/account paint on refresh."""

from __future__ import annotations

import base64
import os
from io import BytesIO

from django.core.cache import cache


def avatar_inline_data_uri(avatar_field, max_px: int) -> str:
    """Return a JPEG data URI sized for display (max_px), cached by file mtime."""
    if not avatar_field or not getattr(avatar_field, "name", None):
        return ""

    try:
        storage_path = avatar_field.path
    except (ValueError, AttributeError):
        return avatar_field.url

    if not os.path.isfile(storage_path):
        return avatar_field.url

    mtime = int(os.path.getmtime(storage_path))
    cache_key = f"gadly-av-inline-v2:{avatar_field.name}:{max_px}:{mtime}"
    cached = cache.get(cache_key)
    if cached:
        return cached

    try:
        from PIL import Image, ImageOps
    except ImportError:
        return avatar_field.url

    try:
        img = ImageOps.exif_transpose(Image.open(storage_path))
        img = img.convert("RGBA")
        resample = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS
        img.thumbnail((max_px, max_px), resample)
        flat = Image.new("RGB", img.size, (255, 255, 255))
        flat.paste(img, mask=img.split()[3])
        buf = BytesIO()
        flat.save(buf, format="JPEG", quality=82, optimize=True)
        data_uri = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception:
        return avatar_field.url

    cache.set(cache_key, data_uri, timeout=60 * 60 * 24 * 30)
    return data_uri

"""Drose portfolio uploads: validation and slot helpers."""

import io

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.utils.translation import gettext_lazy as _

from .models import DroseWorkItem

PHOTO_EXTENSIONS = frozenset({"jpg", "jpeg", "png", "webp", "gif"})
VIDEO_EXTENSIONS = frozenset({"mp4", "webm", "mov"})
PHOTO_MAX_BYTES = 12 * 1024 * 1024
VIDEO_MAX_BYTES = 80 * 1024 * 1024
# Griglia galleria: thumb piccole + data-URI in pagina (niente race cache/decode al refresh)
PHOTO_THUMB_MAX_EDGE = 420
PHOTO_THUMB_QUALITY = 72
PHOTO_THUMB_INLINE_MAX_BYTES = 48_000


def photo_thumb_storage_name(file_name: str) -> str:
    base = file_name.rsplit(".", 1)[0] if "." in (file_name or "") else (file_name or "thumb")
    if base.endswith(".thumb"):
        return f"{base}.jpg"
    return f"{base}.thumb.jpg"


def delete_photo_thumb(item) -> None:
    if not item or item.media_type != DroseWorkItem.MEDIA_PHOTO or not item.file:
        return
    storage = item.file.storage
    thumb_name = photo_thumb_storage_name(item.file.name)
    if storage.exists(thumb_name):
        storage.delete(thumb_name)


def _pil_resampling():
    from PIL import Image as PILImage

    return PILImage.Resampling.LANCZOS if hasattr(PILImage, "Resampling") else PILImage.LANCZOS


def write_photo_thumb(item) -> bool:
    """Create/replace JPEG thumb next to the original. Returns True on success."""
    if not item or item.media_type != DroseWorkItem.MEDIA_PHOTO or not item.file:
        return False
    from PIL import Image as PILImage

    storage = item.file.storage
    thumb_name = photo_thumb_storage_name(item.file.name)
    try:
        with item.file.open("rb") as src:
            img = PILImage.open(src)
            img.load()
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            rgba = img.convert("RGBA")
            canvas = PILImage.new("RGB", rgba.size, (255, 255, 255))
            canvas.paste(rgba, mask=rgba.split()[-1])
            img = canvas
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((PHOTO_THUMB_MAX_EDGE, PHOTO_THUMB_MAX_EDGE), _pil_resampling())
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=PHOTO_THUMB_QUALITY, optimize=True)
        buf.seek(0)
        if storage.exists(thumb_name):
            storage.delete(thumb_name)
        storage.save(thumb_name, ContentFile(buf.read()))
        return True
    except Exception:
        return False


def ensure_photo_thumb_url(item, *, force: bool = False) -> str:
    """URL for gallery grid (small JPEG). Falls back to original if thumb fails."""
    if not item or not item.file:
        return ""
    if item.media_type != DroseWorkItem.MEDIA_PHOTO:
        return item.file.url
    storage = item.file.storage
    thumb_name = photo_thumb_storage_name(item.file.name)
    if force or not storage.exists(thumb_name):
        write_photo_thumb(item)
    if storage.exists(thumb_name):
        return storage.url(thumb_name)
    return item.file.url


def ensure_photo_thumb_src(item, *, force: bool = False) -> str:
    """
    Src for public gallery tiles: prefer data-URI so first paint already has pixels
    (avoids empty→image flash on repeated refresh). Falls back to thumb URL.
    """
    if not item or not item.file:
        return ""
    if item.media_type != DroseWorkItem.MEDIA_PHOTO:
        return item.file.url

    import base64

    storage = item.file.storage
    thumb_name = photo_thumb_storage_name(item.file.name)
    if force or not storage.exists(thumb_name):
        write_photo_thumb(item)
    if not storage.exists(thumb_name):
        return item.file.url
    try:
        size = storage.size(thumb_name)
        if size and size <= PHOTO_THUMB_INLINE_MAX_BYTES:
            with storage.open(thumb_name, "rb") as fh:
                raw = fh.read()
            return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")
    except Exception:
        pass
    return storage.url(thumb_name)


def attach_gallery_thumb_urls(photo_items_by_slot, *, inline: bool = True):
    """Set gallery_thumb_url / gallery_thumb_src for templates."""
    for item in photo_items_by_slot.values():
        if not item:
            continue
        item.gallery_thumb_url = ensure_photo_thumb_url(item)
        item.gallery_thumb_src = (
            ensure_photo_thumb_src(item) if inline else item.gallery_thumb_url
        )


def slot_range(media_type):
    count = (
        DroseWorkItem.PHOTO_SLOT_COUNT
        if media_type == DroseWorkItem.MEDIA_PHOTO
        else DroseWorkItem.VIDEO_SLOT_COUNT
    )
    return range(1, count + 1)


def validate_work_slot(media_type, slot):
    if media_type not in (DroseWorkItem.MEDIA_PHOTO, DroseWorkItem.MEDIA_VIDEO):
        raise ValidationError(_("Invalid media type."))
    try:
        slot = int(slot)
    except (TypeError, ValueError):
        raise ValidationError(_("Invalid slot.")) from None
    if slot not in slot_range(media_type):
        raise ValidationError(_("Invalid slot."))
    return media_type, slot


def validate_work_upload(media_type, slot, uploaded_file):
    media_type, slot = validate_work_slot(media_type, slot)
    if not uploaded_file:
        raise ValidationError(_("Choose a file to upload."))

    name = (uploaded_file.name or "").lower()
    ext = name.rsplit(".", 1)[-1] if "." in name else ""
    if media_type == DroseWorkItem.MEDIA_PHOTO:
        if ext not in PHOTO_EXTENSIONS:
            raise ValidationError(_("Photos must be JPG, PNG, WebP, or GIF."))
        if uploaded_file.size > PHOTO_MAX_BYTES:
            raise ValidationError(_("Photo file is too large (max 12 MB)."))
    else:
        if ext not in VIDEO_EXTENSIONS:
            raise ValidationError(_("Videos must be MP4, WebM, or MOV."))
        if uploaded_file.size > VIDEO_MAX_BYTES:
            raise ValidationError(_("Video file is too large (max 80 MB)."))

    return media_type, slot


def work_items_by_slot(media_type):
    return {
        item.slot: item
        for item in DroseWorkItem.objects.filter(media_type=media_type)
    }


def save_work_item(media_type, slot, uploaded_file):
    existing = DroseWorkItem.objects.filter(media_type=media_type, slot=slot).first()
    if existing and existing.file:
        delete_photo_thumb(existing)
        existing.file.delete(save=False)
    item, _created = DroseWorkItem.objects.update_or_create(
        media_type=media_type,
        slot=slot,
        defaults={"file": uploaded_file},
    )
    if item.media_type == DroseWorkItem.MEDIA_PHOTO:
        ensure_photo_thumb_url(item, force=True)
    return item


def remove_work_item(media_type, slot):
    item = DroseWorkItem.objects.filter(media_type=media_type, slot=slot).first()
    if not item:
        return False
    if item.file:
        delete_photo_thumb(item)
        item.file.delete(save=False)
    item.delete()
    return True

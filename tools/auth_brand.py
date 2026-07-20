"""Drose vs Gadly branding for shared auth pages (/accounts/*)."""

from urllib.parse import quote

DROSE_AUTH_NEXT_SESSION_KEY = "drose_auth_next"
DROSE_HOME_PATH = "/drose/"
DROSE_LOGO_ASSET_VERSION = "30"
DROSE_EMAIL_LOGO_ASSET = "tools/images/drose-logo-email.png"
DROSE_EMAIL_LOGO_DARK_ASSET = "tools/images/drose-logo-email-dark.png"
DROSE_EMAIL_LOGO_SIZE = 68
GADLY_EMAIL_LOGO_SIZE = 58
DROSE_EMAIL_TAGLINE_FONT_SIZE = 15
DROSE_BRAND_TAGLINE = "Drone Services"
GADLY_EMAIL_LOGO_ASSET = "tools/images/logo.svg"


def is_drose_path(path: str) -> bool:
    if not path:
        return False
    normalized = path.rstrip("/") or "/"
    return normalized == "/drose" or path.startswith("/drose/")


def safe_drose_next(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw.startswith("/") or raw.startswith("//"):
        return ""
    path_only = raw.split("?")[0].split("#")[0]
    if not is_drose_path(path_only):
        return ""
    return raw


def resolve_auth_next(request):
    """Return a safe /drose/* return path, or empty string for Gadly default."""
    path = getattr(request, "path", "") or "/"
    session = getattr(request, "session", None)

    next_raw = request.GET.get("next") or request.POST.get("next") or ""
    safe_next = safe_drose_next(next_raw)
    session_next = ""
    if session is not None:
        session_next = safe_drose_next(session.get(DROSE_AUTH_NEXT_SESSION_KEY, ""))

    on_drose = is_drose_path(path)

    if on_drose:
        if session is not None:
            session[DROSE_AUTH_NEXT_SESSION_KEY] = path
        return path

    if safe_next:
        if session is not None:
            session[DROSE_AUTH_NEXT_SESSION_KEY] = safe_next
        return safe_next

    if path.startswith("/accounts/") and session_next:
        return session_next

    if session is not None and not path.startswith("/accounts/"):
        session.pop(DROSE_AUTH_NEXT_SESSION_KEY, None)

    return ""


def auth_url_with_next(url_name, auth_next: str) -> str:
    from django.urls import reverse

    base = reverse(url_name)
    if not auth_next:
        return base
    return f"{base}?next={quote(auth_next, safe='/')}"


def drose_brand_context(request):
    path = getattr(request, "path", "") or "/"
    normalized = path.rstrip("/") or "/"
    auth_next = resolve_auth_next(request)
    on_drose = is_drose_path(path)
    return {
        "is_drose_site": on_drose or bool(auth_next),
        "is_drose_home": normalized == "/drose",
        "auth_next": auth_next,
    }


def is_drose_brand_request(request) -> bool:
    """True when auth flows should use Drose branding (browse or return to /drose/*)."""
    return bool(resolve_auth_next(request))


def _brand_logo_url(request, static_path: str) -> str:
    from django.templatetags.static import static

    return f"{request.build_absolute_uri(static(static_path))}?v={DROSE_LOGO_ASSET_VERSION}"


def email_brand_context(request) -> dict:
    """Logo/colors/copy flags for transactional HTML emails."""
    is_drose = is_drose_brand_request(request)
    if is_drose:
        return {
            "is_drose_brand": True,
            "brand_logo_url": _brand_logo_url(request, DROSE_EMAIL_LOGO_ASSET),
            "brand_logo_dark_url": _brand_logo_url(request, DROSE_EMAIL_LOGO_DARK_ASSET),
            "brand_name": "Drose",
            "brand_tagline": DROSE_BRAND_TAGLINE,
            "brand_color": "#b45309",
            "button_bg": "#b45309",
            "brand_logo_size": DROSE_EMAIL_LOGO_SIZE,
            "brand_header_gap": 10,
            "brand_tagline_spacing": "0",
            "brand_tagline_font_size": DROSE_EMAIL_TAGLINE_FONT_SIZE,
        }
    return {
        "is_drose_brand": False,
        "brand_logo_url": _brand_logo_url(request, GADLY_EMAIL_LOGO_ASSET),
        "brand_name": "Gadly",
        "brand_tagline": "",
        "brand_color": "#003f7f",
        "button_bg": "#003f7f",
        "brand_logo_size": GADLY_EMAIL_LOGO_SIZE,
        "brand_header_gap": 10,
        "brand_tagline_spacing": "2px 0 0",
        "brand_tagline_font_size": 13,
    }


def drose_email_brand_preview(request) -> dict:
    """Drose brand context for email template previews (DEBUG pages)."""
    return {
        "is_drose_brand": True,
        "brand_logo_url": _brand_logo_url(request, DROSE_EMAIL_LOGO_ASSET),
        "brand_logo_dark_url": _brand_logo_url(request, DROSE_EMAIL_LOGO_DARK_ASSET),
        "brand_name": "Drose",
        "brand_tagline": DROSE_BRAND_TAGLINE,
        "brand_color": "#b45309",
        "button_bg": "#b45309",
        "brand_logo_size": DROSE_EMAIL_LOGO_SIZE,
        "brand_header_gap": 10,
        "brand_tagline_spacing": "0",
        "brand_tagline_font_size": DROSE_EMAIL_TAGLINE_FONT_SIZE,
    }


def resolve_logout_redirect(request) -> str:
    """Return Drose home path when logout should land on /drose/, else empty string."""
    path = getattr(request, "path", "") or "/"
    if is_drose_path(path):
        return DROSE_HOME_PATH

    session = getattr(request, "session", None)
    if session is not None and safe_drose_next(session.get(DROSE_AUTH_NEXT_SESSION_KEY, "")):
        return DROSE_HOME_PATH

    next_raw = (request.POST.get("next") or request.GET.get("next") or "").strip()
    if next_raw:
        path_only = next_raw.split("?")[0].split("#")[0]
        if path_only.rstrip("/") == DROSE_HOME_PATH.rstrip("/") or is_drose_path(path_only):
            return DROSE_HOME_PATH

    referer = request.META.get("HTTP_REFERER", "")
    if referer:
        from urllib.parse import urlparse

        parsed = urlparse(referer)
        host = (request.get_host() or "").split(":")[0]
        ref_host = (parsed.netloc or "").split(":")[0]
        if ref_host in ("", host) and is_drose_path(parsed.path):
            return DROSE_HOME_PATH

    return ""

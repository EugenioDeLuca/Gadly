from .auth_brand import drose_brand_context
from .avatar_inline import avatar_inline_data_uri
from .models import UserProfile


def drose_staff_quotes(request):
    """Unviewed / trashed Drose quote counts for staff UI."""
    if request.user.is_authenticated and request.user.is_staff:
        from .models import DroseQuoteRequest

        active = DroseQuoteRequest.objects.filter(deleted_at__isnull=True)
        return {
            "drose_unviewed_quote_count": active.filter(staff_viewed_at__isnull=True).count(),
            "drose_deleted_quote_count": DroseQuoteRequest.objects.filter(
                deleted_at__isnull=False
            ).count(),
        }
    return {"drose_unviewed_quote_count": 0, "drose_deleted_quote_count": 0}


def canonical_url(request):
    """Absolute URL of the current path for <link rel=canonical> and og:url."""
    try:
        from .noindex_auth import is_auth_noindex_path

        path = getattr(request, "path", "") or "/"
        # Auth/account pages: no canonical (avoids reinforcing index signals)
        if is_auth_noindex_path(path):
            return {"canonical_url": ""}
        return {"canonical_url": request.build_absolute_uri(path)}
    except Exception:
        return {"canonical_url": ""}


def auth_noindex(request):
    """Flag for <meta name=robots noindex> on login/account/auth pages."""
    try:
        from .noindex_auth import is_auth_noindex_path

        return {"auth_noindex": is_auth_noindex_path(getattr(request, "path", "") or "/")}
    except Exception:
        return {"auth_noindex": False}


def drose_site(request):
    return drose_brand_context(request)


def user_profile(request):
    """Add user_profile to context (or None). Creates profile if missing."""
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        tools = profile.home_hidden_tools
        if not isinstance(tools, list):
            tools = []
        ctx = {
            "user_profile": profile,
            "user_home_hidden_tools": tools,
        }
        if profile.avatar:
            ctx["user_avatar_inline_header"] = avatar_inline_data_uri(profile.avatar, 56)
            ctx["user_avatar_inline_account"] = avatar_inline_data_uri(profile.avatar, 160)
        else:
            ctx["user_avatar_inline_header"] = ""
            ctx["user_avatar_inline_account"] = ""
        return ctx
    return {"user_profile": None, "user_home_hidden_tools": []}


def home_layout(request):
    """Home first-paint layout: prehide CSS + hidden URL set for SSR classes."""
    match = getattr(request, "resolver_match", None)
    if not match or match.url_name != "home":
        return {
            "home_hidden_prehide_css": "",
            "home_hidden_url_set": set(),
            "home_section_paths_json": "{}",
        }

    from .home_hidden_prehide import (
        build_home_hidden_prehide_css,
        hidden_url_set as build_hidden_url_set,
        home_section_paths_json,
    )

    tools = []
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        stored = profile.home_hidden_tools
        if isinstance(stored, list):
            tools = stored

    hidden = build_hidden_url_set(tools)
    return {
        "home_hidden_prehide_css": build_home_hidden_prehide_css(tools) if hidden else "",
        "home_hidden_url_set": hidden,
        "home_section_paths_json": home_section_paths_json(),
    }

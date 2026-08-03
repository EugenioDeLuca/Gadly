"""Keep auth/account URLs out of search indexes (no layout impact)."""
from __future__ import annotations


def is_auth_noindex_path(path: str) -> bool:
    """True for login, register, password, profile, verify, lockout, short auth links."""
    p = (path or "/").split("?", 1)[0]
    if not p.startswith("/"):
        p = "/" + p
    if len(p) > 1 and p.endswith("/"):
        p_noslash = p.rstrip("/")
    else:
        p_noslash = p

    if p.startswith("/accounts/") or p_noslash == "/accounts":
        return True
    # Short password-reset / email-verify links
    if p.startswith("/rp/") or p.startswith("/v/"):
        return True
    return False


class AuthNoindexMiddleware:
    """Add X-Robots-Tag on auth/account responses (backup to meta noindex)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if is_auth_noindex_path(getattr(request, "path", "") or "/"):
            response["X-Robots-Tag"] = "noindex, nofollow"
        return response

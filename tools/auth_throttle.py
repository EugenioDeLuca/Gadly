"""Auth rate limiting helpers: Axes username normalization + DB throttles for email flows."""

from __future__ import annotations

from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.http import HttpRequest
from django.utils import timezone
from django.utils.translation import gettext as _


SCOPE_PASSWORD_RESET = "password_reset"
SCOPE_RESEND_VERIFY = "resend_verify"


def axes_username_callable(request, credentials):
    """Normalize email logins to username so Axes lockout keys stay consistent."""
    login = (credentials.get(settings.AXES_USERNAME_FORM_FIELD) or credentials.get("username") or "").strip()
    if "@" in login:
        user = get_user_model().objects.filter(email__iexact=login).first()
        if user is not None:
            return user.get_username()
    return login


def axes_failure_limit(request, credentials):
    """Staff/superuser: 3 attempts; everyone else: 5."""
    User = get_user_model()
    username = axes_username_callable(request, credentials or {})
    staff_limit = int(getattr(settings, "AXES_FAILURE_LIMIT_STAFF", 3))
    default_limit = int(getattr(settings, "AXES_FAILURE_LIMIT_DEFAULT", 5))
    if not username:
        return default_limit
    user = User.objects.filter(username__iexact=username).only("is_staff", "is_superuser").first()
    if user is not None and (user.is_staff or user.is_superuser):
        return staff_limit
    return default_limit


def client_ip(request: HttpRequest) -> str:
    forwarded = (request.META.get("HTTP_X_FORWARDED_FOR") or "").split(",")[0].strip()
    if forwarded:
        return forwarded
    return (request.META.get("REMOTE_ADDR") or "").strip() or "unknown"


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _limit_for(scope: str, kind: str) -> int:
    if scope == SCOPE_PASSWORD_RESET:
        if kind == "email":
            return int(getattr(settings, "AUTH_THROTTLE_PASSWORD_RESET_EMAIL_LIMIT", 5))
        return int(getattr(settings, "AUTH_THROTTLE_PASSWORD_RESET_IP_LIMIT", 10))
    if kind == "email":
        return int(getattr(settings, "AUTH_THROTTLE_RESEND_VERIFY_EMAIL_LIMIT", 5))
    return int(getattr(settings, "AUTH_THROTTLE_RESEND_VERIFY_IP_LIMIT", 10))


def _window_seconds(scope: str) -> int:
    if scope == SCOPE_PASSWORD_RESET:
        return int(getattr(settings, "AUTH_THROTTLE_PASSWORD_RESET_WINDOW_SECONDS", 3600))
    return int(getattr(settings, "AUTH_THROTTLE_RESEND_VERIFY_WINDOW_SECONDS", 3600))


def throttle_message(retry_after_seconds: Optional[int] = None) -> str:
    if retry_after_seconds and retry_after_seconds > 0:
        minutes = max(1, (retry_after_seconds + 59) // 60)
        return _("Too many requests. Please try again in %(minutes)s minutes.") % {
            "minutes": minutes
        }
    return _("Too many requests. Please try again later.")


@transaction.atomic
def check_and_increment_throttle(
    *,
    scope: str,
    identifier: str,
    limit: int,
    window_seconds: int,
) -> tuple[bool, int]:
    """
    Return (allowed, retry_after_seconds).
    Increments the counter when allowed; when blocked, does not bump the window.
    """
    from .models import AuthThrottle

    identifier = (identifier or "").strip()
    if not identifier or limit <= 0:
        return True, 0

    now = timezone.now()
    row, _created = AuthThrottle.objects.select_for_update().get_or_create(
        scope=scope,
        identifier=identifier[:190],
        defaults={
            "count": 0,
            "window_starts": now,
            "window_ends": now + timedelta(seconds=window_seconds),
        },
    )

    if row.window_ends <= now:
        row.count = 0
        row.window_starts = now
        row.window_ends = now + timedelta(seconds=window_seconds)

    if row.count >= limit:
        retry_after = max(1, int((row.window_ends - now).total_seconds()))
        return False, retry_after

    row.count += 1
    row.save(update_fields=["count", "window_starts", "window_ends", "updated_at"])
    return True, 0


def allow_email_flow(request: HttpRequest, *, scope: str, email: str) -> tuple[bool, str]:
    """
    Enforce per-email and per-IP limits for password reset / resend verification.
    Returns (allowed, error_message). Message is empty when allowed.
    """
    window = _window_seconds(scope)
    email_key = normalize_email(email)
    ip_key = f"ip:{client_ip(request)}"

    if email_key:
        ok_email, retry_email = check_and_increment_throttle(
            scope=scope,
            identifier=f"email:{email_key}",
            limit=_limit_for(scope, "email"),
            window_seconds=window,
        )
        if not ok_email:
            return False, throttle_message(retry_email)

    ok_ip, retry_ip = check_and_increment_throttle(
        scope=scope,
        identifier=ip_key,
        limit=_limit_for(scope, "ip"),
        window_seconds=window,
    )
    if not ok_ip:
        return False, throttle_message(retry_ip)

    return True, ""

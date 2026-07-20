from django import template

register = template.Library()


def _initials_from_user(user):
    username = (getattr(user, "username", None) or "").strip()
    if not username:
        return "?"
    return username[:2].upper()


@register.filter
def user_initials(user):
    if not user or not getattr(user, "is_authenticated", False):
        return ""
    return _initials_from_user(user)

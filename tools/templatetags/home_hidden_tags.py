from django import template
from django.urls import NoReverseMatch, reverse
from django.utils.safestring import mark_safe

from tools.home_hidden_prehide import HOME_SECTION_URL_NAMES, hidden_url_set, normalize_tool_url

register = template.Library()

_HIDDEN_ATTRS = mark_safe(' hidden style="display:none!important"')


def _ctx_hidden_set(context):
    hidden = context.get("home_hidden_url_set")
    if hidden is not None:
        return hidden
    return hidden_url_set(context.get("user_home_hidden_tools") or [])


def _tool_path(url_name: str) -> str | None:
    try:
        return normalize_tool_url(reverse(url_name))
    except NoReverseMatch:
        return None


def _section_all_hidden(hidden, category_id: str) -> bool:
    paths = []
    for name in HOME_SECTION_URL_NAMES.get(category_id) or []:
        path = _tool_path(name)
        if path:
            paths.append(path)
    return bool(paths and all(path in hidden for path in paths))


def _is_tool_hidden(context, url_name: str) -> bool:
    hidden = _ctx_hidden_set(context)
    if not hidden:
        return False
    path = _tool_path(url_name)
    return bool(path and path in hidden)


@register.simple_tag(takes_context=True)
def home_tool_is_hidden(context, url_name):
    """True se il tool è nel cestino — non renderizzare il wrap in home."""
    return _is_tool_hidden(context, url_name)


@register.simple_tag(takes_context=True)
def home_section_is_hidden(context, category_id):
    """True se tutta la categoria è nel cestino — non renderizzare la section."""
    hidden = _ctx_hidden_set(context)
    if not hidden:
        return False
    return _section_all_hidden(hidden, category_id)


@register.simple_tag(takes_context=True)
def home_hidden_tool_class(context, url_name):
    # Legacy: classi solo se il nodo è ancora in DOM (es. anon / partial).
    return " tool-btn-wrap--hidden-home" if _is_tool_hidden(context, url_name) else ""


@register.simple_tag(takes_context=True)
def home_hidden_tool_hidden(context, url_name):
    return _HIDDEN_ATTRS if _is_tool_hidden(context, url_name) else ""


@register.simple_tag(takes_context=True)
def home_hidden_section_class(context, category_id):
    hidden = _ctx_hidden_set(context)
    if not hidden:
        return ""
    return " tool-section--all-hidden" if _section_all_hidden(hidden, category_id) else ""


@register.simple_tag(takes_context=True)
def home_hidden_section_hidden(context, category_id):
    hidden = _ctx_hidden_set(context)
    if not hidden:
        return ""
    return _HIDDEN_ATTRS if _section_all_hidden(hidden, category_id) else ""

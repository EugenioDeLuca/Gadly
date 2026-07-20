from django import template

from tools.auth_brand import auth_url_with_next

register = template.Library()


@register.simple_tag(takes_context=True)
def auth_link(context, url_name):
    auth_next = context.get("auth_next") or ""
    return auth_url_with_next(url_name, auth_next)

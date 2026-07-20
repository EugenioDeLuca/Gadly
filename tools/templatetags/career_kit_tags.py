from django import template
from django.urls import reverse

from ..career_kit import get_career_kit_flow_context

register = template.Library()


@register.inclusion_tag("tools/includes/career_kit_flow_nav.html", takes_context=True)
def career_kit_flow_nav(context, step_id):
    request = context.get("request")
    lang_code = context.get("LANGUAGE_CODE") or "en"
    flow = get_career_kit_flow_context(step_id, lang_code)
    if not flow:
        return {}

    from_kit = request.GET.get("from") == "kit" if request else False
    query = "?from=kit"

    next_url = ""
    if flow["next_step"]:
        next_url = reverse(flow["next_step"]["url_name"]) + query

    return {
        **flow,
        "from_kit": from_kit,
        "kit_url": reverse("career_cv_page"),
        "next_url": next_url,
        "LANGUAGE_CODE": lang_code,
    }

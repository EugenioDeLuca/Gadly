"""CSS prehide rules for home hidden tools (first paint, before body classes)."""
from __future__ import annotations

import json
from urllib.parse import urlparse

from django.urls import NoReverseMatch, reverse

# category-btn id → url names in that section (must match home.html)
HOME_SECTION_URL_NAMES: dict[str, list[str]] = {
    "category-text": [
        "word_counter",
        "translator",
        "markdown_preview",
        "remove_spaces",
        "username_generator",
        "diff_checker",
        "json_formatter",
        "case_converter",
        "uuid_generator",
    ],
    "category-social": [
        "bio_generator",
        "hashtag_generator",
        "caption_generator",
    ],
    "category-career": [
        "career_cv_page",
        "cv_generator",
        "cv_optimizer",
        "cover_letter_generator",
        "application_email_generator",
        "interview_simulator",
    ],
    "category-file": [
        "file_analyzer",
        "pdf_merger",
        "pdf_split",
    ],
    "category-image": [
        "image_editor",
        "data_viz",
        "color_converter",
    ],
    "category-finance": [
        "calc_percentage",
        "calc_vat",
        "calc_net_salary",
        "calc_interest",
        "calc_currency",
        "calc_loan",
        "calc_discount",
        "calc_margin",
        "calc_split_bill",
    ],
    "category-web": [
        "meta_tag_checker",
        "sitemap_extractor",
        "robots_txt_generator",
        "site_speed_check",
        "lorem_ipsum",
        "regex_tester",
        "cron_explainer",
    ],
    "category-security": [
        "password_gen",
        "qr_generator",
        "qr_decoder",
        "base64_encoder",
        "hash_generator",
    ],
}


def normalize_tool_url(raw: str) -> str:
    if not raw:
        return ""
    raw = str(raw).strip()
    if "://" in raw:
        path = urlparse(raw).path or "/"
    else:
        path = raw.split("?")[0].split("#")[0] or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path[:-1]
    return path


def _css_escape_attr(value: str) -> str:
    return str(value).replace("\\", "\\\\").replace('"', '\\"')


def _href_variants(url: str) -> list[str]:
    variants = [url]
    if len(url) > 1:
        if url.endswith("/"):
            variants.append(url[:-1])
        else:
            variants.append(url + "/")
    return variants


def hidden_url_set(hidden_tools) -> set[str]:
    seen: set[str] = set()
    for item in hidden_tools or []:
        if not isinstance(item, dict):
            continue
        url = normalize_tool_url(item.get("url") or "")
        if url:
            seen.add(url)
    return seen


def home_section_paths() -> dict[str, list[str]]:
    """Map category-btn id → normalized tool paths (for anon head JS)."""
    out: dict[str, list[str]] = {}
    for cat_id, names in HOME_SECTION_URL_NAMES.items():
        paths: list[str] = []
        for name in names:
            try:
                paths.append(normalize_tool_url(reverse(name)))
            except NoReverseMatch:
                continue
        if paths:
            out[cat_id] = paths
    return out


def home_section_paths_json() -> str:
    return json.dumps(home_section_paths(), separators=(",", ":"))


def build_home_hidden_prehide_css(hidden_tools) -> str:
    """Hide removed tools and fully empty categories before any paint."""
    hidden = hidden_url_set(hidden_tools)
    if not hidden:
        return ""

    rules: list[str] = []
    for url in sorted(hidden):
        for href in _href_variants(url):
            esc = _css_escape_attr(href)
            rules.append(
                f'body.homepage .tool-btn-wrap:has(> a.tool-btn[href="{esc}"])'
                "{display:none!important}"
            )

    for cat_id, paths in home_section_paths().items():
        if paths and all(path in hidden for path in paths):
            esc = _css_escape_attr(cat_id)
            rules.append(
                f'body.homepage .tool-section:has(#{esc})'
                "{display:none!important}"
            )

    return "\n".join(rules)

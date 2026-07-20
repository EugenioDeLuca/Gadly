"""Sitemap XML for public HTML pages (tools, hubs, help, static pages)."""

from django.contrib.sitemaps import Sitemap
from django.urls import reverse

# Named URL patterns under tools.urls — exclude API/POST-only endpoints.
_GADLY_PAGE_NAMES = (
    "home",
    "faq",
    "privacy",
    "about",
    "contact",
    "drose",
    "drose_faq",
    "drose_about",
    "drose_works",
    "drose_privacy",
    "drose_contact",
    "word_counter",
    "calculator",
    "calc_percentage",
    "calc_vat",
    "calc_net_salary",
    "calc_interest",
    "calc_currency",
    "calc_loan",
    "calc_discount",
    "calc_margin",
    "calc_split_bill",
    "translator",
    "file_analyzer",
    "image_editor",
    "data_viz",
    "pdf_merger",
    "pdf_split",
    "qr_generator",
    "qr_decoder",
    "password_gen",
    "help_password_gen",
    "remove_spaces",
    "username_generator",
    "bio_generator",
    "markdown_preview",
    "diff_checker",
    "json_formatter",
    "base64_encoder",
    "case_converter",
    "uuid_generator",
    "lorem_ipsum",
    "regex_tester",
    "cron_explainer",
    "help_cron_explainer",
    "hash_generator",
    "color_converter",
    "meta_tag_checker",
    "sitemap_extractor",
    "robots_txt_generator",
    "site_speed_check",
    "hashtag_generator",
    "caption_generator",
    "cv_generator",
    "cv_preview_web",
    "cv_optimizer",
    "cover_letter_generator",
    "application_email_generator",
    "interview_simulator",
    "text_tools_page",
    "social_media_page",
    "career_cv_page",
    "file_image_page",
    "finance_page",
    "web_seo_page",
    "security_misc_page",
    "top_tools_page",
    "help_robots_txt",
    "help_json_guide",
    "help_diff_checker",
    "help_text_tools",
    "help_cv_generator",
    "help_cv_optimizer",
    "help_cover_letter",
    "help_application_email",
    "help_interview_simulator",
)


class GadlyPageSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7

    def items(self):
        return _GADLY_PAGE_NAMES

    def location(self, item):
        return reverse(item)


gadly_sitemaps = {"pages": GadlyPageSitemap}

from django.apps import AppConfig


class ToolsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tools"

    def ready(self) -> None:
        # Also try at startup (WSGI / runserver); middleware retries on first request.
        from tools.bootstrap_admin import bootstrap_admin_from_env

        bootstrap_admin_from_env()
        _patch_admin_view_site_url()


def _patch_admin_view_site_url() -> None:
    """Make admin “View site” return to Drose or Gadly home based on entry brand."""
    from django.contrib import admin

    if getattr(admin.site, "_gadly_view_site_patched", False):
        return

    original_each_context = admin.site.each_context

    def each_context(request, *args, **kwargs):
        from tools.auth_brand import resolve_admin_view_site_url

        context = original_each_context(request, *args, **kwargs)
        context["site_url"] = resolve_admin_view_site_url(request)
        return context

    admin.site.each_context = each_context
    admin.site._gadly_view_site_patched = True
from django.apps import AppConfig


class ToolsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "tools"

    def ready(self) -> None:
        # Also try at startup (WSGI / runserver); middleware retries on first request.
        from tools.bootstrap_admin import bootstrap_admin_from_env

        bootstrap_admin_from_env()

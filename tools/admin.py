from django.contrib import admin

from .models import DroseQuoteRequest, DroseWorkItem, AuthThrottle


@admin.register(DroseQuoteRequest)
class DroseQuoteRequestAdmin(admin.ModelAdmin):
    list_display = ("reference", "full_name", "email", "status", "created_at", "offer_sent_at")
    list_filter = ("status", "created_at")
    search_fields = ("reference", "full_name", "email")
    readonly_fields = ("reference", "response_token", "created_at", "updated_at", "offer_sent_at", "responded_at")


@admin.register(DroseWorkItem)
class DroseWorkItemAdmin(admin.ModelAdmin):
    list_display = ("media_type", "slot", "caption", "updated_at")
    list_filter = ("media_type",)
    ordering = ("media_type", "slot")


@admin.register(AuthThrottle)
class AuthThrottleAdmin(admin.ModelAdmin):
    list_display = ("scope", "identifier", "count", "window_starts", "window_ends", "updated_at")
    list_filter = ("scope",)
    search_fields = ("identifier",)
    readonly_fields = ("updated_at",)

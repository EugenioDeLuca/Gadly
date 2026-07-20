from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


def user_avatar_path(instance, filename):
    ext = filename.rsplit('.', 1)[-1] if '.' in filename else 'jpg'
    return f"avatars/{instance.user_id}.{ext}"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    email_verified = models.BooleanField(default=False)
    pending_email = models.EmailField(max_length=254, blank=True, default="")
    avatar = models.ImageField(upload_to=user_avatar_path, blank=True, null=True)
    home_hidden_tools = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.username} profile"


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Verification for {self.user.email}"


class DroseQuoteRequest(models.Model):
    STATUS_RECEIVED = "received"
    STATUS_OFFER_SENT = "offer_sent"
    STATUS_ACCEPTED = "accepted"
    STATUS_DECLINED = "declined"

    STATUS_CHOICES = (
        (STATUS_RECEIVED, _("Received")),
        (STATUS_OFFER_SENT, _("Offer sent")),
        (STATUS_ACCEPTED, _("Accepted")),
        (STATUS_DECLINED, _("Declined")),
    )

    reference = models.CharField(max_length=32, unique=True, blank=True)
    response_token = models.CharField(max_length=64, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RECEIVED)
    language = models.CharField(max_length=5, default="en")

    full_name = models.CharField(max_length=120)
    email = models.EmailField(max_length=254)
    phone = models.CharField(max_length=40, blank=True, default="")
    company_name = models.CharField(max_length=160, blank=True, default="")
    service_type = models.CharField(max_length=32)
    service_label = models.CharField(max_length=120)
    deliverables = models.JSONField(default=list, blank=True)
    deliverables_label = models.TextField(blank=True, default="")
    budget_range = models.CharField(max_length=32)
    budget_label = models.CharField(max_length=64)
    location = models.CharField(max_length=160, blank=True, default="")
    preferred_timeline = models.CharField(max_length=120, blank=True, default="")
    reference_links = models.CharField(max_length=500, blank=True, default="")
    project_details = models.TextField()

    valid_until = models.DateField(null=True, blank=True)
    offer_scope = models.TextField(blank=True, default="")
    offer_deliverables = models.JSONField(default=list, blank=True)
    price_subtotal = models.CharField(max_length=64, blank=True, default="")
    price_total = models.CharField(max_length=64, blank=True, default="")
    offer_timeline = models.TextField(blank=True, default="")
    offer_notes = models.TextField(blank=True, default="")
    offer_sent_at = models.DateTimeField(null=True, blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    staff_viewed_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.reference or 'pending'} — {self.full_name}"

    def save(self, *args, **kwargs):
        if not self.response_token:
            import secrets

            self.response_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)
        if not self.reference:
            self.reference = f"DS-{self.created_at.year}-{self.pk:04d}"
            super().save(update_fields=["reference"])

    @property
    def can_respond_to_offer(self):
        return self.status == self.STATUS_OFFER_SENT

    @property
    def needs_staff_attention(self):
        return self.staff_viewed_at is None and self.deleted_at is None

    @property
    def is_in_trash(self):
        return self.deleted_at is not None


def drose_work_item_path(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    return f"drose/works/{instance.media_type}/{instance.slot}.{ext}"


class DroseWorkItem(models.Model):
    MEDIA_PHOTO = "photo"
    MEDIA_VIDEO = "video"
    MEDIA_CHOICES = (
        (MEDIA_PHOTO, _("Photo")),
        (MEDIA_VIDEO, _("Video")),
    )

    PHOTO_SLOT_COUNT = 20
    VIDEO_SLOT_COUNT = 10

    media_type = models.CharField(max_length=10, choices=MEDIA_CHOICES)
    slot = models.PositiveSmallIntegerField()
    file = models.FileField(upload_to=drose_work_item_path)
    caption = models.CharField(max_length=200, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("media_type", "slot")
        constraints = [
            models.UniqueConstraint(
                fields=("media_type", "slot"),
                name="unique_drose_work_slot",
            ),
        ]

    def __str__(self):
        return f"{self.media_type} #{self.slot}"


class AuthThrottle(models.Model):
    """Sliding-window counters for password-reset / verification-email spam control."""

    scope = models.CharField(max_length=40, db_index=True)
    identifier = models.CharField(max_length=190, db_index=True)
    count = models.PositiveIntegerField(default=0)
    window_starts = models.DateTimeField()
    window_ends = models.DateTimeField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("scope", "identifier"),
                name="unique_auth_throttle_scope_identifier",
            ),
        ]
        indexes = [
            models.Index(fields=("window_ends",), name="auth_throttle_window_ends"),
        ]

    def __str__(self):
        return f"{self.scope}:{self.identifier} ({self.count})"

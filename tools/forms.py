from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, AuthenticationForm
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.urls import reverse
from django.utils.html import format_html

from .models import UserProfile


class DroseCustomSelect(forms.Select):
    template_name = "tools/widgets/drose_custom_select.html"

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        display_label = ""
        display_value = ""
        selected_found = False
        first_option = None
        for _group_name, group_choices, _index in context["widget"]["optgroups"]:
            for option in group_choices:
                if first_option is None:
                    first_option = option
                if option.get("selected"):
                    display_label = option["label"]
                    display_value = option["value"]
                    selected_found = True
                    break
            if selected_found:
                break
        if not selected_found and first_option is not None:
            display_label = first_option["label"]
            display_value = first_option["value"]
        context["display_label"] = display_label
        context["display_value"] = display_value
        return context


class DroseDatePickerInput(forms.DateInput):
    """Custom calendar UI for staff quote offers (hidden ISO value + popup)."""

    input_type = "hidden"
    template_name = "tools/widgets/drose_date_picker.html"

    def __init__(self, attrs=None):
        super().__init__(attrs=attrs, format="%Y-%m-%d")


class DroseQuoteRequestForm(forms.Form):
    full_name = forms.CharField(max_length=120, label=_("Full name"))
    email = forms.EmailField(max_length=254, label=_("Email"))
    phone = forms.CharField(max_length=40, label=_("Phone"))
    company_name = forms.CharField(max_length=160, required=False, label=_("Company name (optional)"))
    service_type = forms.ChoiceField(
        label=_("Service needed"),
        widget=DroseCustomSelect(),
        choices=(
            ("aerial_photo", _("Aerial photography")),
            ("inspection", _("Inspection")),
            ("insurance_claims", _("Insurance and accident documentation")),
            ("mapping", _("Mapping and surveys")),
            ("events", _("Events")),
            ("other", _("Other")),
        ),
    )
    deliverables = forms.MultipleChoiceField(
        label=_("Materials and files you need"),
        help_text=_(
            "Choose what you want to receive after the flight. "
            "You can select several options; if something is missing, describe it in project details."
        ),
        required=False,
        widget=forms.CheckboxSelectMultiple,
        choices=(
            ("raw_photos", _("Raw photos (unedited JPG or RAW files)")),
            ("edited_photos", _("Edited photos (ready for web or print)")),
            ("social_video", _("Edited social video (Reels, TikTok, short clips)")),
            ("inspection_report", _("Inspection report with notes and findings")),
            ("orthophoto", _("Orthophoto / mapping export (GIS-ready)")),
            ("other", _("Other (describe in project details)")),
        ),
    )
    budget_range = forms.ChoiceField(
        label=_("Estimated budget range"),
        widget=DroseCustomSelect(),
        choices=(
            ("not_sure", _("Not sure yet")),
            ("under_300", _("Under 300 EUR")),
            ("300_700", _("300 to 700 EUR")),
            ("700_1500", _("700 to 1500 EUR")),
            ("1500_plus", _("Over 1500 EUR")),
        ),
    )
    project_details = forms.CharField(
        label=_("Project details"),
        widget=forms.Textarea(
            attrs={
                "rows": 4,
                "class": "drose-quote-textarea--autogrow",
            }
        ),
        max_length=2000,
    )
    location = forms.CharField(max_length=160, label=_("Location"))
    preferred_timeline = forms.CharField(
        max_length=120,
        required=False,
        label=_("Preferred timeline (optional)"),
    )
    reference_links = forms.CharField(
        max_length=500,
        required=False,
        label=_("Reference links (optional)"),
        widget=forms.Textarea(attrs={"rows": 1}),
    )
    gdpr_consent = forms.BooleanField(
        label=_("I authorize Drose to process these data for quote and project follow-up."),
        required=True,
        widget=forms.CheckboxInput(attrs={"required": "required"}),
        error_messages={
            "required": _(
                "You must authorize data processing before sending your quote request."
            ),
        },
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Asterischi rossi sulle label: niente testo "Questo campo è obbligatorio".
        for name, field in self.fields.items():
            if name == "gdpr_consent" or not field.required:
                continue
            field.error_messages = {**field.error_messages, "required": ""}

    def clean_gdpr_consent(self):
        if not self.cleaned_data.get("gdpr_consent"):
            raise forms.ValidationError(
                _("You must authorize data processing before sending your quote request.")
            )
        return True


class DroseQuoteOfferForm(forms.Form):
    valid_until = forms.DateField(
        label=_("Valid until"),
        input_formats=["%Y-%m-%d"],
        widget=DroseDatePickerInput(),
    )
    offer_scope = forms.CharField(
        label=_("Project scope"),
        widget=forms.Textarea(attrs={"rows": 4}),
    )
    offer_deliverables_text = forms.CharField(
        label=_("Deliverables included (one per line)"),
        widget=forms.Textarea(attrs={"rows": 5}),
        help_text=_("Enter each deliverable on its own line."),
    )
    price_subtotal = forms.CharField(label=_("Subtotal"), max_length=64)
    price_total = forms.CharField(label=_("Total"), max_length=64)
    offer_timeline = forms.CharField(
        label=_("Timeline"),
        widget=forms.Textarea(attrs={"rows": 2}),
    )
    offer_notes = forms.CharField(
        label=_("Notes"),
        required=False,
        widget=forms.Textarea(attrs={"rows": 3}),
    )

    def clean_offer_deliverables_text(self):
        lines = [line.strip() for line in self.cleaned_data.get("offer_deliverables_text", "").splitlines()]
        items = [line for line in lines if line]
        if not items:
            raise forms.ValidationError(_("Add at least one deliverable."))
        return "\n".join(items)

    def deliverables_list(self):
        return [line.strip() for line in self.cleaned_data["offer_deliverables_text"].splitlines() if line.strip()]


class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        max_length=254,
        help_text=_("Required. We'll send a verification link so you can reset your password anytime."),
    )

    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError(_("This email is already registered."))
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user


class ProfileUpdateForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        required=True,
        help_text="",
    )
    email = forms.EmailField(max_length=254, required=True)

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        if user:
            self.fields['username'].initial = user.username
            self.fields['email'].initial = user.email

    def clean_username(self):
        username = (self.cleaned_data.get('username') or '').strip()
        if not username:
            raise forms.ValidationError(_("Username is required."))
        if len(username) < 3:
            raise forms.ValidationError(_("Username must be at least 3 characters."))
        qs = User.objects.filter(username__iexact=username)
        if self.user:
            qs = qs.exclude(pk=self.user.pk)
        if qs.exists():
            raise forms.ValidationError(_("This username is already taken."))
        return username

    def clean_email(self):
        email = (self.cleaned_data.get('email') or '').strip()
        if not email:
            raise forms.ValidationError(_("Email is required."))
        qs = User.objects.filter(email__iexact=email)
        if self.user:
            qs = qs.exclude(pk=self.user.pk)
        if qs.exists():
            raise forms.ValidationError(_("This email is already registered."))
        pending_qs = UserProfile.objects.filter(pending_email__iexact=email)
        if self.user:
            pending_qs = pending_qs.exclude(user_id=self.user.pk)
        if pending_qs.exists():
            raise forms.ValidationError(_("This email is already registered."))
        return email


class AvatarUploadForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['avatar']
        widgets = {
            'avatar': forms.FileInput(attrs={'accept': 'image/*'}),
        }


class VerifiedEmailAuthenticationForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].label = _("Username or email")
        self.fields["username"].widget.attrs.setdefault(
            "placeholder", _("Username or email")
        )
        self.fields["username"].widget.attrs.setdefault(
            "autocomplete", "username email"
        )

    def clean_username(self):
        login = (self.cleaned_data.get("username") or "").strip()
        if "@" in login:
            user = User.objects.filter(email__iexact=login).first()
            if user is not None:
                return user.get_username()
        return login

    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if user.is_staff or user.is_superuser:
            return
        profile, created = UserProfile.objects.get_or_create(user=user)
        if not profile.email_verified:
            resend_url = reverse("request_verification_email_page")
            raise forms.ValidationError(
                format_html(
                    "{} <a href=\"{}\">{}</a>.",
                    _("Please verify your email before signing in. Check your inbox or"),
                    resend_url,
                    _("request a new verification email"),
                ),
                code="email_not_verified",
            )

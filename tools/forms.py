from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, AuthenticationForm
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _

from .models import UserProfile


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
        return email


class AvatarUploadForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['avatar']
        widgets = {
            'avatar': forms.FileInput(attrs={'accept': 'image/*'}),
        }


class VerifiedEmailAuthenticationForm(AuthenticationForm):
    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if user.is_staff or user.is_superuser:
            return
        profile, created = UserProfile.objects.get_or_create(user=user)
        if not profile.email_verified:
            raise forms.ValidationError(
                _("Please verify your email before signing in. Check your inbox or request a new verification email."),
                code="email_not_verified",
            )

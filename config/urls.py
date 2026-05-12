"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.i18n import JavaScriptCatalog
from tools import views as tools_views
from tools.forms import VerifiedEmailAuthenticationForm

urlpatterns = [
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript_catalog'),
    path('i18n/', include('django.conf.urls.i18n')),
    path('admin/', admin.site.urls),
    path('accounts/', tools_views.accounts_home, name='accounts_home'),
    path('accounts/register/', tools_views.register, name='register'),
    path('accounts/verify-email-sent/', tools_views.verify_email_sent, name='verify_email_sent'),
    path('accounts/verify-email/<str:token>/', tools_views.verify_email, name='verify_email'),
    path('v/<str:token>/', tools_views.verify_email, name='verify_email_short'),
    path('accounts/resend-verification/', tools_views.resend_verification_email, name='resend_verification'),
    path('accounts/request-verification-email/', tools_views.request_verification_email_page, name='request_verification_email_page'),
    path('accounts/resend-verification-public/', tools_views.resend_verification_email_public, name='resend_verification_public'),
    path('api/check-username/', tools_views.check_username, name='check_username'),
    path('accounts/profile/', tools_views.account_profile, name='account_profile'),
    path('accounts/delete/', tools_views.account_delete_confirm, name='account_delete'),
    path(
        'accounts/login/',
        auth_views.LoginView.as_view(
            template_name='registration/login.html',
            authentication_form=VerifiedEmailAuthenticationForm,
        ),
        name='login',
    ),
    path(
        'accounts/password_reset/',
        tools_views.LocalizedPasswordResetView.as_view(
            template_name='registration/password_reset_form.html',
            email_template_name='registration/password_reset_email.html',
            html_email_template_name='registration/password_reset_email_html.html',
            subject_template_name='registration/password_reset_subject.txt',
        ),
        name='password_reset',
    ),
    path(
        'rp/<uidb64>/<token>/',
        auth_views.PasswordResetConfirmView.as_view(
            template_name='registration/password_reset_confirm.html',
        ),
        name='password_reset_confirm_short',
    ),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', include('tools.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

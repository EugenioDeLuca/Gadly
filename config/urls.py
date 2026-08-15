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
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.templatetags.static import static as static_url
from django.views.generic import RedirectView
from django.views.i18n import JavaScriptCatalog
from django.views.static import serve as media_serve
from django.contrib.sitemaps.views import sitemap
from tools import views as tools_views
from tools.forms import VerifiedEmailAuthenticationForm
from tools.sitemaps import gadly_sitemaps
from tools.pwa_cleanup import pwa_sw_cleanup
from django.contrib.auth import urls as auth_urls

_auth_urlpatterns = [p for p in auth_urls.urlpatterns if p.name != "logout"]

_admin_urlpatterns = [path(settings.ADMIN_URL, admin.site.urls)]
# When admin lives on a secret path, /admin/ must not expose Django login.
if settings.ADMIN_URL != "admin/":
    _admin_urlpatterns.append(path("admin/", RedirectView.as_view(url="/", permanent=False)))

urlpatterns = [
    path(
        'favicon.ico',
        RedirectView.as_view(url=static_url('tools/images/favicon.ico'), permanent=True),
    ),
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript_catalog'),
    path(
        'sitemap.xml',
        sitemap,
        {'sitemaps': gadly_sitemaps},
        name='sitemap_xml',
    ),
    path('robots.txt', tools_views.robots_txt, name='robots_txt'),
    path('sw.js', pwa_sw_cleanup, name='pwa_sw_cleanup'),
    path('i18n/', include('django.conf.urls.i18n')),
    *_admin_urlpatterns,
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
    path('accounts/', include(_auth_urlpatterns)),
    path('accounts/logout/', tools_views.DroseAwareLogoutView.as_view(), name='logout'),
    path('', include('tools.urls')),
]
# Local: django.conf.urls.static.static() only works with DEBUG=True.
# Production without Cloudinary: serve /media/ from disk (ephemeral on Render).
# With Cloudinary, file.url points to res.cloudinary.com — no local /media/ needed.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif not getattr(settings, "USE_CLOUDINARY", False):
    urlpatterns += [
        re_path(
            r"^media/(?P<path>.*)$",
            media_serve,
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]

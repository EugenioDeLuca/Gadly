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
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from tools import views as tools_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', tools_views.accounts_home, name='accounts_home'),
    path('accounts/register/', tools_views.register, name='register'),
    path('accounts/verify-email-sent/', tools_views.verify_email_sent, name='verify_email_sent'),
    path('accounts/verify-email/<str:token>/', tools_views.verify_email, name='verify_email'),
    path('accounts/resend-verification/', tools_views.resend_verification_email, name='resend_verification'),
    path('api/check-username/', tools_views.check_username, name='check_username'),
    path('accounts/profile/', tools_views.account_profile, name='account_profile'),
    path('accounts/delete/', tools_views.account_delete_confirm, name='account_delete'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('', include('tools.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from .models import UserProfile


def user_profile(request):
    """Add user_profile to context (or None). Creates profile if missing."""
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return {'user_profile': profile}
    return {'user_profile': None}

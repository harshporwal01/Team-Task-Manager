from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.views import UserRegisterView, CustomTokenObtainPairView, UserProfileView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

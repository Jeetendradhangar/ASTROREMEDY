from django.urls import path
from .views import (
    RegisterView,
    SendOTPView,
    VerifyOTPView,
    LoginView,
    CookieTokenRefreshView,
    LogoutView,
    UserProfileView,
    GoogleStartView,
    GoogleCallbackView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', UserProfileView.as_view(), name='auth_me'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('google/start/', GoogleStartView.as_view(), name='google_start'),
    path('google/callback/', GoogleCallbackView.as_view(), name='google_callback'),
    path('send-otp/', SendOTPView.as_view(), name='auth_send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth_verify_otp'),
]

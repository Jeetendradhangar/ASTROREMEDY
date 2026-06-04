import requests
from urllib.parse import urlencode
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .serializers import CustomUserSerializer, RegisterSerializer
from .utils import generate_otp, verify_otp

User = get_user_model()

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Automatically log the user in on registration
            refresh = RefreshToken.for_user(user)
            response = Response({
                "success": True,
                "user": CustomUserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
            # Set access/refresh tokens in HTTP-only cookies
            response.set_cookie(
                'access_token',
                str(refresh.access_token),
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
            response.set_cookie(
                'refresh_token',
                str(refresh),
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class SendOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        phone_number = request.data.get('phone_number')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        if not phone_number:
            return Response({"error": "phone_number is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Rate Limit Guard: IP-based rate limit (3 attempts per minute per IP)
        from django.core.cache import cache
        import time

        ip_address = get_client_ip(request)
        ip_limit_key = f"otp_send_limit_ip_{ip_address}"
        ip_request_history = cache.get(ip_limit_key, [])
        now = time.time()
        ip_request_history = [t for t in ip_request_history if now - t < 60]

        if len(ip_request_history) >= 3:
            return Response({"error": "Too many OTP generation requests. Limit is 3 attempts per minute per IP address."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Phone-number cooldown: 60-second cooldown and max 3 requests per 10 minutes
        cooldown_key = f"otp_cooldown_{phone_number}"
        if cache.get(cooldown_key):
            return Response({"error": "Please wait 60 seconds before requesting another OTP."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        limit_key = f"otp_limit_{phone_number}"
        request_history = cache.get(limit_key, [])
        request_history = [t for t in request_history if now - t < 600]

        if len(request_history) >= 3:
            return Response({"error": "Too many OTP requests. Please try again after 10 minutes."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            user = User.objects.get(phone_number=phone_number)
            if first_name:
                return Response({"error": "An account with this phone number already exists."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            if first_name:
                cleaned_phone = phone_number.replace("+", "").replace(" ", "").replace("-", "")
                email = f"{cleaned_phone}@astrology.local"
                
                if User.objects.filter(email=email).exists():
                    return Response({"error": "An account with this phone number already exists."}, status=status.HTTP_400_BAD_REQUEST)
                
                username = cleaned_phone
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{cleaned_phone}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    email=email,
                    username=username,
                    phone_number=phone_number,
                    first_name=first_name,
                    last_name=last_name or '',
                    password=None
                )
            else:
                return Response({"error": "User with this phone number does not exist. Please register first."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            generate_otp(user)
            # Set cooldown for 60 seconds
            cache.set(cooldown_key, True, 60)
            # Append timestamp to histories and save
            request_history.append(now)
            cache.set(limit_key, request_history, 600)
            
            ip_request_history.append(now)
            cache.set(ip_limit_key, ip_request_history, 60)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({"message": f"OTP sent successfully to {phone_number}"}, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp_code = request.data.get('otp_code')
        if not phone_number or not otp_code:
            return Response({"error": "phone_number and otp_code are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Rate Limit Guard: IP-based rate limit (5 attempts per minute per IP)
        from django.core.cache import cache
        import time

        ip_address = get_client_ip(request)
        ip_limit_key = f"otp_verify_limit_ip_{ip_address}"
        ip_request_history = cache.get(ip_limit_key, [])
        now = time.time()
        ip_request_history = [t for t in ip_request_history if now - t < 60]

        if len(ip_request_history) >= 5:
            return Response({"error": "Too many OTP verification requests. Limit is 5 attempts per minute per IP address."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Record this attempt
        ip_request_history.append(now)
        cache.set(ip_limit_key, ip_request_history, 60)

        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        success, msg = verify_otp(user, otp_code)
        if not success:
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        response = Response({
            'user': CustomUserSerializer(user).data
        }, status=status.HTTP_200_OK)
        
        response.set_cookie(
            'access_token',
            str(refresh.access_token),
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        response.set_cookie(
            'refresh_token',
            str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        return response


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username and not email:
            return Response({"error": "Username or email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Try to find user by email first
        if email and not username:
            try:
                user_obj = User.objects.get(email=email)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
                
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.is_active:
            return Response({"error": "User account is disabled."}, status=status.HTTP_403_FORBIDDEN)
            
        # User is valid, generate tokens
        refresh = RefreshToken.for_user(user)
        response = Response({
            "success": True,
            "user": CustomUserSerializer(user).data
        }, status=status.HTTP_200_OK)
        
        # Set cookies
        response.set_cookie(
            'access_token',
            str(refresh.access_token),
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        response.set_cookie(
            'refresh_token',
            str(refresh),
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        return response


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        refresh_token = None
        
        try:
            if request.data and isinstance(request.data, dict):
                refresh_token = request.data.get('refresh')
        except Exception as e:
            logger.warning(f"Could not parse refresh token from request body: {e}")
            
        if not refresh_token:
            refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({"detail": "Refresh token is missing."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            serializer = self.get_serializer(data={'refresh': refresh_token})
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            logger.warning(f"Refresh token validation failed: {e}")
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)
            
        data = serializer.validated_data
        new_access = data.get('access')
        new_refresh = data.get('refresh')
        
        response = Response({"success": True}, status=status.HTTP_200_OK)
        
        # Set new access token cookie
        response.set_cookie(
            'access_token',
            new_access,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        
        # If refresh token was rotated, set the new refresh token cookie
        if new_refresh:
            response.set_cookie(
                'refresh_token',
                new_refresh,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
            
        return response


class LogoutView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        refresh_token = None
        
        try:
            if request.data and isinstance(request.data, dict):
                refresh_token = request.data.get('refresh')
        except Exception as e:
            logger.warning(f"Could not parse refresh token from request body: {e}")
            
        if not refresh_token:
            refresh_token = request.COOKIES.get('refresh_token')
        
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                # Ignore if token is already expired, blacklisted, or invalid
                logger.warning(f"Blacklisting token failed during logout: {e}")
                
        response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        return response


class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleStartView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        client_id = settings.GOOGLE_CLIENT_ID
        if not client_id:
            return Response({"error": "Google OAuth is not configured on the server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        # Build redirect URI matching what we registered in Google Cloud Console
        redirect_uri = settings.BACKEND_URL + '/api/auth/google/callback/'
        
        auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'online',
            'prompt': 'select_account'
        }
        return redirect(f"{auth_url}?{urlencode(params)}")


class GoogleCallbackView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        code = request.GET.get('code')
        error = request.GET.get('error')
        
        frontend_url = settings.FRONTEND_URL
        
        if error:
            return redirect(f"{frontend_url}/auth/google/callback?error={error}")
            
        if not code:
            return redirect(f"{frontend_url}/auth/google/callback?error=no_code")
            
        client_id = settings.GOOGLE_CLIENT_ID
        client_secret = settings.GOOGLE_CLIENT_SECRET
        if not client_id or not client_secret:
            return redirect(f"{frontend_url}/auth/google/callback?error=not_configured")
            
        redirect_uri = settings.BACKEND_URL + '/api/auth/google/callback/'
        
        try:
            # Exchange auth code for access token
            token_res = requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    'code': code,
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code'
                },
                timeout=5
            )
            if token_res.status_code != 200:
                return redirect(f"{frontend_url}/auth/google/callback?error=invalid_code_exchange")
                
            token_data = token_res.json()
            access_token = token_data.get('access_token')
            
            # Fetch user details
            userinfo_res = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                params={"access_token": access_token},
                timeout=5
            )
            if userinfo_res.status_code != 200:
                return redirect(f"{frontend_url}/auth/google/callback?error=failed_userinfo")
                
            data = userinfo_res.json()
            email = data.get('email')
            name = data.get('name', 'Google User')
            
            if not email:
                return redirect(f"{frontend_url}/auth/google/callback?error=no_email")
                
            first_name = data.get('given_name', name)
            last_name = data.get('family_name', '')
            
            username = email.split('@')[0]
            # Resolve username collision if creating a new user
            if not User.objects.filter(email=email).exists():
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

            # Find or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
            
            # Create session tokens
            refresh = RefreshToken.for_user(user)
            
            # Route based on role
            target_path = '/dashboard'
            if user.is_astrologer:
                target_path = '/admin'
                
            response = redirect(frontend_url + target_path)
            
            # Set http-only cookies
            response.set_cookie(
                'access_token',
                str(refresh.access_token),
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
            response.set_cookie(
                'refresh_token',
                str(refresh),
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
            return response
            
        except Exception as e:
            print("Google OAuth exception:", e)
            return redirect(f"{frontend_url}/auth/google/callback?error=exception")

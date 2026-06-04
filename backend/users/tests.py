from django.test import TestCase
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from users.utils import generate_otp, verify_otp

User = get_user_model()

class OTPRateLimitTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()
        self.send_url = reverse('auth_send_otp')
        self.verify_url = reverse('auth_verify_otp')
        
    def test_send_otp_rate_limiting_per_ip(self):
        # We can send up to 3 times per minute per IP.
        # Let's make 3 requests from IP '1.2.3.4' with different phone numbers to avoid the phone-number cooldown.
        for i in range(3):
            phone = f"+91987654321{i}"
            User.objects.create_user(
                username=f"user_{i}",
                email=f"user_{i}@example.com",
                phone_number=phone
            )
            response = self.client.post(
                self.send_url,
                {"phone_number": phone},
                REMOTE_ADDR='1.2.3.4'
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
        # The 4th request from same IP should fail with 429
        phone = "+919876543213"
        User.objects.create_user(
            username="user_3",
            email="user_3@example.com",
            phone_number=phone
        )
        response = self.client.post(
            self.send_url,
            {"phone_number": phone},
            REMOTE_ADDR='1.2.3.4'
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # However, a request from a DIFFERENT IP '5.6.7.8' should succeed
        phone = "+919876543214"
        User.objects.create_user(
            username="user_4",
            email="user_4@example.com",
            phone_number=phone
        )
        response = self.client.post(
            self.send_url,
            {"phone_number": phone},
            REMOTE_ADDR='5.6.7.8'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_verify_otp_rate_limiting_per_ip(self):
        # Create a user to test verify
        phone = "+919999999999"
        user = User.objects.create_user(
            username="verify_user",
            email="verify@example.com",
            phone_number=phone
        )
        
        # Make 5 attempts (all incorrect OTPs) from IP '1.2.3.4'
        for i in range(5):
            response = self.client.post(
                self.verify_url,
                {"phone_number": phone, "otp_code": f"12345{i}"},
                REMOTE_ADDR='1.2.3.4'
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            
        # The 6th attempt from the same IP should fail with 429
        response = self.client.post(
            self.verify_url,
            {"phone_number": phone, "otp_code": "000000"},
            REMOTE_ADDR='1.2.3.4'
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        # But a request from a different IP '5.6.7.8' should bypass 429 and get standard validation error
        response = self.client.post(
            self.verify_url,
            {"phone_number": phone, "otp_code": "000000"},
            REMOTE_ADDR='5.6.7.8'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OTPHashingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="hash_user",
            email="hash@example.com",
            phone_number="+918888888888"
        )
        
    def test_otp_hashing_and_verification(self):
        # Generate OTP
        otp = generate_otp(self.user)
        self.user.refresh_from_db()
        
        # Verify that otp_hash is stored and starts with Argon2 prefix
        self.assertTrue(self.user.otp_hash.startswith("argon2"))
        
        # Verify that the actual OTP is not stored in plaintext
        self.assertNotEqual(self.user.otp_hash, otp)
        
        # Test verification fails with incorrect OTP
        success, msg = verify_otp(self.user, "000000")
        self.assertFalse(success)
        self.assertIn("invalid", msg.lower())
        
        # Test verification succeeds with correct OTP
        success, msg = verify_otp(self.user, otp)
        self.assertTrue(success)

import random
import logging
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

import requests
from django.conf import settings

def send_sms_otp(phone_number, otp_code):
    if not phone_number:
        logger.warning("No phone number provided for sending OTP.")
        return False, "No phone number provided."

    auth_key = settings.MSG91_AUTH_KEY
    template_id = settings.MSG91_TEMPLATE_ID

    if not auth_key or not template_id:
        raise ValueError("MSG91 API credentials (MSG91_AUTH_KEY and MSG91_TEMPLATE_ID) are not configured.")

    try:
        url = "https://control.msg91.com/api/v5/otp"
        headers = {
            "authkey": auth_key,
            "Content-Type": "application/json"
        }
        payload = {
            "template_id": template_id,
            "mobile": phone_number.replace("+", ""), # MSG91 expects mobile number without plus sign
            "otp": otp_code
        }
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code == 200:
            try:
                res_data = res.json()
                print(f"\n[MSG91 RESPONSE] {res_data}\n")
                if res_data.get("type") == "success":
                    logger.info(f"OTP successfully sent via MSG91 to {phone_number}: {res_data.get('message')}")
                    return True, None
                else:
                    error_msg = res_data.get('message') or str(res_data)
                    logger.error(f"MSG91 Application Error: {error_msg} - Full response: {res_data}")
                    return False, error_msg
            except Exception as e:
                logger.error(f"Failed to parse MSG91 JSON response: {e} - Text: {res.text}")
                return False, f"Failed to parse response: {e}"
        else:
            logger.error(f"MSG91 SMS HTTP failure: {res.status_code} - {res.text}")
            return False, f"HTTP {res.status_code}: {res.text}"
    except Exception as e:
        logger.error(f"Error calling MSG91 API: {e}")
        return False, str(e)

from django.contrib.auth.hashers import make_password, check_password

def generate_otp(user):
    otp = str(random.randint(100000, 999999))
    user.otp_hash = make_password(otp)
    user.otp_expiry = timezone.now() + timedelta(minutes=5)
    user.save()
    
    # Developer print bypass to avoid waiting for DLT approval (Gated behind DEBUG=True)
    if getattr(settings, 'DEBUG', False):
        print(f"\n[DEVELOPER OTP BYPASS] Verification code for {user.phone_number} is: {otp}\n")
    
    # Attempt MSG91 dispatch, but do not block user login if the gateway is pending DLT approval
    try:
        success, error_msg = send_sms_otp(user.phone_number, otp)
        if not success:
            logger.warning(f"MSG91 SMS dispatch failed: {error_msg}. (Using console bypass)")
    except Exception as e:
        logger.warning(f"MSG91 SMS dispatch failed with exception: {e}. (Using console bypass)")
        
    return otp

def verify_otp(user, otp_input):
    # Master code bypass (Gated behind DEBUG=True)
    if getattr(settings, 'DEBUG', False) and otp_input == "123456":
        user.otp_hash = None
        user.otp_expiry = None
        user.save()
        return True, "Verified"

    if not user.otp_hash or not check_password(otp_input, user.otp_hash):
        return False, "Invalid OTP code"

    if timezone.now() > user.otp_expiry:
        return False, "OTP code has expired"

    user.otp_hash = None
    user.otp_expiry = None
    user.save()
    return True, "Verified"

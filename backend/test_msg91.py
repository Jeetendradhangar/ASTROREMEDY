import json
import urllib.request
import urllib.error

def test():
    auth_key = ""
    template_id = ""
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("MSG91_AUTH_KEY="):
                    auth_key = line.split("=", 1)[1].strip()
                elif line.startswith("MSG91_TEMPLATE_ID="):
                    template_id = line.split("=", 1)[1].strip()
    except Exception as e:
        print("Error reading .env file:", e)
        return
                
    print("Loaded from .env:")
    print("MSG91_AUTH_KEY:", auth_key)
    print("MSG91_TEMPLATE_ID:", template_id)
    
    if not auth_key or not template_id:
        print("Missing credentials in .env file.")
        return
        
    phone_number = "919917632142"
    otp_code = "123456"
    
    url = "https://control.msg91.com/api/v5/otp"
    headers = {
        "authkey": auth_key,
        "Content-Type": "application/json"
    }
    payload = {
        "template_id": template_id,
        "mobile": phone_number,
        "otp": otp_code
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    print("\nSending request to MSG91...")
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            body = response.read().decode("utf-8")
            print(f"Status Code: {status}")
            print(f"Response Body: {body}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        try:
            print("Error details:", e.read().decode("utf-8"))
        except Exception:
            pass
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    test()

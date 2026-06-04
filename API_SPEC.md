# Astrology Consultation Platform — API Specification

All protected backend endpoints expect a JSON Web Token (JWT) in the HTTP Authorization header:
`Authorization: Bearer <access_token>`

---

## 1. Authentication Endpoints

### 1.1. Register Account
*   **Endpoint:** `POST /api/auth/register/`
*   **Auth:** `None`
*   **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "username": "user123",
      "phone_number": "+919917632142",
      "password": "strongpassword123"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": 12,
      "email": "user@example.com",
      "username": "user123",
      "phone_number": "+919917632142",
      "is_astrologer": false
    }
    ```

### 1.2. Request OTP Code
*   **Endpoint:** `POST /api/auth/send-otp/`
*   **Auth:** `None`
*   **Request Body:**
    ```json
    {
      "phone_number": "+919917632142"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "OTP sent successfully to +919917632142"
    }
    ```

### 1.3. Verify OTP Code
*   **Endpoint:** `POST /api/auth/verify-otp/`
*   **Auth:** `None`
*   **Request Body:**
    ```json
    {
      "phone_number": "+919917632142",
      "otp_code": "123456"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 12,
        "email": "user@example.com",
        "phone_number": "+919917632142",
        "is_astrologer": false
      }
    }
    ```

### 1.4. Google OAuth Exchange
*   **Endpoint:** `POST /api/auth/google/`
*   **Auth:** `None`
*   **Request Body:**
    ```json
    {
      "access_token": "ya29.a0AfH6S..."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access": "eyJhbGciOiJIUzI1NiIsIn...",
      "refresh": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 12,
        "email": "user@example.com",
        "is_astrologer": false
      }
    }
    ```

### 1.5. Refresh Token
*   **Endpoint:** `POST /api/auth/token/refresh/`
*   **Auth:** `None` (Requires Refresh Token)
*   **Request Body:**
    ```json
    {
      "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "access": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```

### 1.6. Logout
*   **Endpoint:** `POST /api/auth/logout/`
*   **Auth:** `Bearer Token`
*   **Request Body:**
    ```json
    {
      "refresh": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Token blacklisted successfully."
    }
    ```

### 1.7. Get Current User Profile
*   **Endpoint:** `GET /api/auth/me/`
*   **Auth:** `Bearer Token`
*   **Response (200 OK):**
    ```json
    {
      "id": 12,
      "email": "user@example.com",
      "username": "user123",
      "phone_number": "+919917632142",
      "profile_photo": "https://res.cloudinary.com/.../profile.jpg",
      "is_astrologer": false
    }
    ```

### 1.8. Update Profile Details
*   **Endpoint:** `PATCH /api/auth/me/`
*   **Auth:** `Bearer Token`
*   **Request Body:**
    ```json
    {
      "username": "user_new",
      "profile_photo": "https://res.cloudinary.com/.../new_profile.jpg"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "id": 12,
      "email": "user@example.com",
      "username": "user_new",
      "phone_number": "+919917632142",
      "profile_photo": "https://res.cloudinary.com/.../new_profile.jpg",
      "is_astrologer": false
    }
    ```

---

## 2. Consultation Endpoints

### 2.1. List Consultations
*   **Endpoint:** `GET /api/consultations/`
*   **Auth:** `Bearer Token (User / Admin)`
*   **Query Params (Optional):** `page` (integer), `status` (string)
*   **Response (200 OK):**
    ```json
    {
      "count": 1,
      "next": null,
      "previous": null,
      "results": [
        {
          "id": 101,
          "date_of_birth": "1995-04-12",
          "birth_time": "14:30:00",
          "birth_place": "Mumbai, India",
          "problem_desc": "Career guidance and timing for job change.",
          "status": "paid",
          "amount_paid": "500.00",
          "created_at": "2026-06-01T12:00:00Z"
        }
      ]
    }
    ```

### 2.2. Create Consultation Request
*   **Endpoint:** `POST /api/consultations/`
*   **Auth:** `Bearer Token (User)`
*   **Request Body:**
    ```json
    {
      "date_of_birth": "1995-04-12",
      "birth_time": "14:30:00",
      "birth_place": "Mumbai, India",
      "problem_desc": "Career guidance and timing for job change."
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": 101,
      "date_of_birth": "1995-04-12",
      "birth_time": "14:30:00",
      "birth_place": "Mumbai, India",
      "problem_desc": "Career guidance and timing for job change.",
      "status": "pending",
      "amount_paid": null,
      "created_at": "2026-06-02T13:00:00Z"
    }
    ```

### 2.3. Get Consultation Details
*   **Endpoint:** `GET /api/consultations/{id}/`
*   **Auth:** `Bearer Token (User / Admin)`
*   **Response (200 OK):**
    ```json
    {
      "id": 101,
      "user": 12,
      "date_of_birth": "1995-04-12",
      "birth_time": "14:30:00",
      "birth_place": "Mumbai, India",
      "problem_desc": "Career guidance and timing for job change.",
      "status": "replied",
      "amount_paid": "500.00",
      "voice_note": {
        "file_url": "https://res.cloudinary.com/.../voice_note.mp3",
        "duration": 45
      },
      "voice_reply": {
        "file_url": "https://res.cloudinary.com/.../voice_reply.mp3",
        "duration": 180,
        "astrologer": 2
      },
      "recommendations": [
        {
          "product": {
            "id": 5,
            "name": "3 Mukhi Rudraksh",
            "price": "1200.00"
          },
          "instructions": "Wear it on a yellow thread on Monday morning after chanting Surya Mantra."
        }
      ],
      "created_at": "2026-06-01T12:00:00Z"
    }
    ```

### 2.4. Upload User Voice Note
*   **Endpoint:** `POST /api/consultations/{id}/upload-voice/`
*   **Auth:** `Bearer Token (User)`
*   **Request Format:** `multipart/form-data`
*   **Request Body:**
    *   `voice_note`: File (Binary, max 10MB)
*   **Response (200 OK):**
    ```json
    {
      "message": "Voice note uploaded successfully.",
      "file_url": "https://res.cloudinary.com/.../voice_note.mp3"
    }
    ```

### 2.5. Get Astrologer Voice Reply
*   **Endpoint:** `GET /api/consultations/{id}/voice-reply/`
*   **Auth:** `Bearer Token (User)`
*   **Response (200 OK):**
    ```json
    {
      "file_url": "https://res.cloudinary.com/.../voice_reply.mp3",
      "duration": 180,
      "created_at": "2026-06-02T10:00:00Z"
    }
    ```

### 2.6. Update Consultation Status
*   **Endpoint:** `PATCH /api/consultations/{id}/status/`
*   **Auth:** `Bearer Token (Admin/Astrologer)`
*   **Request Body:**
    ```json
    {
      "status": "in_review"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "id": 101,
      "status": "in_review"
    }
    ```

### 2.7. Upload Voice Reply + Remedy Recommendation
*   **Endpoint:** `POST /api/consultations/{id}/reply/`
*   **Auth:** `Bearer Token (Admin/Astrologer)`
*   **Request Format:** `multipart/form-data`
*   **Request Body:**
    *   `voice_reply`: File (Binary, audio)
    *   `product_ids`: Stringified JSON Array of Product IDs (e.g. `"[5]"`)
    *   `instructions`: Text (Instructions for the remedy)
*   **Response (200 OK):**
    ```json
    {
      "message": "Astrologer reply and recommendations saved successfully.",
      "voice_reply_url": "https://res.cloudinary.com/.../voice_reply.mp3"
    }
    ```

---

## 3. Payment Endpoints

### 3.1. Create Razorpay Order
*   **Endpoint:** `POST /api/payments/create-order/`
*   **Auth:** `Bearer Token (User)`
*   **Request Body:**
    ```json
    {
      "consultation_id": 101,
      "amount": 50000
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "razorpay_order_id": "order_OkT2hJ39nKls9a",
      "amount": 50000,
      "currency": "INR"
    }
    ```

### 3.2. Verify Payment Signature
*   **Endpoint:** `POST /api/payments/verify/`
*   **Auth:** `Bearer Token (User)`
*   **Request Body:**
    ```json
    {
      "razorpay_order_id": "order_OkT2hJ39nKls9a",
      "razorpay_payment_id": "pay_PlK3hU92nJs0o1",
      "razorpay_signature": "8a0c20f12d8a0c20f12d8a0c20f12d...",
      "consultation_id": 101
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Payment verified and consultation activated."
    }
    ```

### 3.3. Get Payment Webhook
*   **Endpoint:** `POST /api/payments/webhook/`
*   **Auth:** `Razorpay Custom Header Signature Verification`
*   **Request Body:** (Razorpay Standard Webhook Payload)
*   **Response (200 OK):**
    ```json
    {
      "status": "acknowledged"
    }
    ```

---

## 4. Order & E-commerce Endpoints

### 4.1. List Orders
*   **Endpoint:** `GET /api/orders/`
*   **Auth:** `Bearer Token (User)`
*   **Response (200 OK):**
    ```json
    [
      {
        "id": 501,
        "status": "shipped",
        "total_amount": "1200.00",
        "tracking_number": "DTDC123456789",
        "created_at": "2026-06-02T11:00:00Z"
      }
    ]
    ```

### 4.2. Create Remedy Order
*   **Endpoint:** `POST /api/orders/`
*   **Auth:** `Bearer Token (User)`
*   **Request Body:**
    ```json
    {
      "product_id": 5,
      "shipping_address": "Flat 302, Green Meadows, Bandra West, Mumbai, 400050",
      "total_amount": 1200.00
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": 501,
      "status": "received",
      "total_amount": "1200.00",
      "shipping_address": "Flat 302, Green Meadows, Bandra West, Mumbai, 400050",
      "created_at": "2026-06-02T13:10:00Z"
    }
    ```

### 4.3. Update Shipping Status (Admin)
*   **Endpoint:** `PATCH /api/orders/{id}/status/`
*   **Auth:** `Bearer Token (Admin)`
*   **Request Body:**
    ```json
    {
      "status": "shipped",
      "tracking_number": "DTDC123456789"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "id": 501,
      "status": "shipped",
      "tracking_number": "DTDC123456789"
    }
    ```

### 4.4. Generate Pre-filled WhatsApp link
*   **Endpoint:** `GET /api/orders/whatsapp-link/?product_id=5`
*   **Auth:** `Bearer Token (User)`
*   **Response (200 OK):**
    ```json
    {
      "whatsapp_url": "https://wa.me/91XXXXXXXXXX?text=Hi%2C%20I%20would%20like%20to%20order%20the%20recommended%205%20Mukhi%20Rudraksh%20bead%20from%20my%20consultation%20%23101."
    }
    ```

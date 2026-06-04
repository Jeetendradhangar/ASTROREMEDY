# AstroRemedy — Backend Setup Guide

> Django 6.0 REST API with Celery task queue, Redis broker, and PostgreSQL/SQLite database.

---

## Tech Stack

| Component          | Version / Tool                  |
| ------------------ | ------------------------------- |
| Language           | Python 3.11+                    |
| Framework          | Django 6.0.5                    |
| REST API           | Django REST Framework 3.17      |
| Auth               | SimpleJWT (HTTP-only cookies)   |
| Task Queue         | Celery 5.6                      |
| Broker / Cache     | Redis 7                         |
| Database (Dev)     | SQLite 3                        |
| Database (Prod)    | PostgreSQL 15                   |
| SMS Gateway        | MSG91                           |
| Payments           | Razorpay                        |
| Media Storage      | Cloudinary                      |
| Password Hashing   | Argon2                          |

---

## Prerequisites

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Redis** — Required for Celery. Use Docker or [Memurai](https://www.memurai.com/) on Windows.
- **PostgreSQL 15** *(optional for dev)* — SQLite works out of the box.

### Quick Redis + Postgres via Docker

From the **project root** (where `docker-compose.yml` lives):

```powershell
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` and Redis on `localhost:6379`.

---

## Step-by-Step Setup

### 1. Clone the Repository

```powershell
git clone <repository-url>
cd ASTROLOGY/backend
```

### 2. Create Virtual Environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

> **Note:** If you get an execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### 3. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 4. Create `.env` File

Copy the example and fill in your credentials:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and replace placeholder values with your actual keys. See the **Environment Variables** section below for details.

### 5. Run Database Migrations

```powershell
python manage.py migrate
```

### 6. Seed Sample Data *(Optional)*

```powershell
python seed_data.py
```

This creates a sample astrologer account and test products.

### 7. Start the Development Server

```powershell
python manage.py runserver
```

The API will be available at `http://localhost:8000`.

### 8. Start Celery Worker *(Separate Terminal)*

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
celery -A config worker --loglevel=info --pool=solo
```

> **Windows Note:** The `--pool=solo` flag is required on Windows.

---

## Environment Variables

Create a `.env` file in the `backend/` directory. All keys are listed in `.env.example`.

| Variable                   | Required | Description                                      |
| -------------------------- | -------- | ------------------------------------------------ |
| `SECRET_KEY`               | ✅       | Django secret key (generate a strong random key) |
| `DEBUG`                    | ✅       | `True` for development, `False` for production   |
| `ALLOWED_HOSTS`            | ✅       | Comma-separated hostnames                        |
| `USE_POSTGRES`             | ❌       | Set `True` to use PostgreSQL instead of SQLite   |
| `DB_NAME`                  | ❌       | PostgreSQL database name                         |
| `DB_USER`                  | ❌       | PostgreSQL username                              |
| `DB_PASSWORD`              | ❌       | PostgreSQL password                              |
| `DB_HOST`                  | ❌       | PostgreSQL host                                  |
| `DB_PORT`                  | ❌       | PostgreSQL port                                  |
| `REDIS_URL`                | ✅       | Redis connection URL for Celery                  |
| `CLOUDINARY_CLOUD_NAME`    | ✅       | Cloudinary cloud name                            |
| `CLOUDINARY_API_KEY`       | ✅       | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET`    | ✅       | Cloudinary API secret                            |
| `RAZORPAY_KEY_ID`          | ✅       | Razorpay test/live key ID                        |
| `RAZORPAY_KEY_SECRET`      | ✅       | Razorpay test/live key secret                    |
| `MSG91_AUTH_KEY`            | ✅       | MSG91 authentication key                         |
| `MSG91_TEMPLATE_ID`        | ✅       | MSG91 OTP template ID                            |
| `WHATSAPP_BUSINESS_NUMBER` | ✅       | WhatsApp number (format: `919XXXXXXXXX`)         |
| `GOOGLE_CLIENT_ID`         | ❌       | Google OAuth 2.0 client ID                       |
| `GOOGLE_CLIENT_SECRET`     | ❌       | Google OAuth 2.0 client secret                   |
| `JWT_SECRET_KEY`           | ✅       | JWT signing key (can reuse `SECRET_KEY`)         |
| `FRONTEND_URL`             | ✅       | Frontend origin for CORS                         |
| `BACKEND_URL`              | ✅       | Backend base URL                                 |

---

## API Endpoints Overview

| Method | Endpoint                              | Description                    |
| ------ | ------------------------------------- | ------------------------------ |
| POST   | `/api/auth/send-otp/`                 | Send SMS OTP to phone          |
| POST   | `/api/auth/verify-otp/`               | Verify OTP and login           |
| GET    | `/api/auth/google/start/`             | Start Google OAuth flow        |
| GET    | `/api/auth/me/`                       | Get current user profile       |
| POST   | `/api/auth/logout/`                   | Logout and blacklist tokens    |
| GET    | `/api/consultations/`                 | List user consultations        |
| POST   | `/api/consultations/`                 | Create new consultation        |
| GET    | `/api/orders/`                        | List user orders               |
| POST   | `/api/orders/{id}/cancel/`            | Cancel an order                |
| GET    | `/api/orders/whatsapp-link/`          | Generate WhatsApp order link   |
| PATCH  | `/api/orders/{id}/status/`            | Update order status (admin)    |
| POST   | `/api/payments/create-order/`         | Create Razorpay payment order  |
| POST   | `/api/payments/verify/`               | Verify Razorpay payment        |
| GET    | `/api/orders/products/`               | List remedy products           |
| GET    | `/api/reviews/`                       | List reviews                   |

---

## Running Tests

```powershell
python manage.py test --verbosity=2
```

---

## Project Structure

```
backend/
├── config/           # Django project settings, urls, celery, wsgi
├── users/            # Custom user model, auth views, OTP, Google OAuth
├── consultations/    # Consultation model, voice notes, recommendations
├── orders/           # Product catalog, orders, WhatsApp checkout
├── payments/         # Razorpay integration
├── reviews/          # User testimonials
├── media/            # Uploaded files (gitignored)
├── manage.py
├── requirements.txt
├── seed_data.py
└── .env.example
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: No module named 'django'` | Activate virtual environment: `.\.venv\Scripts\Activate.ps1` |
| `OperationalError: no such table` | Run migrations: `python manage.py migrate` |
| `Connection refused on port 6379` | Start Redis: `docker compose up -d redis` |
| `argon2-cffi installation fails` | Install Visual C++ Build Tools or use `pip install argon2-cffi-bindings` |
| `CORS error from frontend` | Ensure `FRONTEND_URL` in `.env` matches your frontend origin |
| `MSG91 SMS not sending` | Check `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` are valid. Dev uses console bypass + master code `123456`. |
| `Celery worker won't start on Windows` | Use `--pool=solo` flag: `celery -A config worker --loglevel=info --pool=solo` |

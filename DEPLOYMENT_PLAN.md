# Astrology Consultation Platform — Deployment Plan

This document contains step-by-step instructions and environment variable configurations for deploying the Astrology Consultation Platform to production.

---

## 1. Hosting Architecture
*   **Frontend Application:** Next.js deployed on **Vercel** (connected to GitHub repository with automatic builds).
*   **Backend REST API:** Django application deployed on **Railway** (configured via Nixpacks / Dockerfile).
*   **Database:** Managed **PostgreSQL** instance hosted on **Railway**.
*   **Task Broker & Cache:** Managed **Redis** hosted on **Railway** (used by Celery).
*   **Media Storage:** **Cloudinary** CDN (for voice note uploads and profile picture assets).
*   **Payment Gateway:** **Razorpay** (for server-side verification and transaction checkouts).

---

## 2. Environment Variables

### 2.1. Backend API (`backend/.env` on Railway)
```env
# Django Core Settings
SECRET_KEY=your-production-django-secret-key-here
DEBUG=False
ALLOWED_HOSTS=astrology-backend.up.railway.app,yourcustomdomain.com

# CORS Config
CORS_ALLOWED_ORIGINS=https://your-vercel-frontend-domain.vercel.app,https://yourcustomdomain.com

# PostgreSQL Connection Details
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=your_railway_db_password
DB_HOST=your-railway-db-host.railway.internal
DB_PORT=5432
DATABASE_URL=postgresql://postgres:password@host:port/db   # Provided automatically by Railway

# Redis Connection Details
REDIS_URL=redis://default:password@host:port               # Provided automatically by Railway

# Cloudinary Storage API Credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Integration API Credentials
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_live_secret_key

# SMS OTP Provider API Keys
SMS_GATEWAY_API_KEY=your_msg91_or_twilio_token
```

### 2.2. Frontend Application (`frontend/.env.local` on Vercel)
```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=https://astrology-backend.up.railway.app/api

# Razorpay Client-side Credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx

# NextAuth Config
NEXTAUTH_SECRET=your-production-nextauth-secret-string
NEXTAUTH_URL=https://your-vercel-frontend-domain.vercel.app

# Google OAuth Integration Credentials
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret-key
```

---

## 3. Step-by-Step Deployment Guide

### 3.1. Deploying the Backend on Railway
1.  **Repository Setup:** Create a monorepo structure. Ensure `backend/` directory is clean.
2.  **Configuration Files:**
    *   **`backend/Procfile`**:
        ```yaml
        web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
        worker: celery -A config worker --loglevel=info
        ```
    *   **`backend/runtime.txt`**:
        ```text
        python-3.11.9
        ```
3.  **Create Service in Railway:**
    *   Log in to Railway dashboard.
    *   Create a new project and select **Deploy from GitHub Repo**.
    *   Set **Root Directory** settings to `backend/`.
4.  **Add Plugins:**
    *   Add a **PostgreSQL** database service to the project.
    *   Add a **Redis** cache service to the project.
    *   Railway will automatically populate `DATABASE_URL` and `REDIS_URL` in the environment variables.
5.  **Environment Variables Configuration:**
    *   Add all env variables from Section 2.1 into the Railway variables tab.
6.  **Run Migrations & Collect Static:**
    *   Via Railway console or CLI:
        ```bash
        railway run python manage.py migrate
        railway run python manage.py collectstatic --noinput
        railway run python manage.py createsuperuser
        ```

### 3.2. Deploying the Frontend on Vercel
1.  **Vercel Project Creation:**
    *   Log in to Vercel dashboard.
    *   Select **Add New** → **Project** and import your GitHub repository.
2.  **Root Settings:**
    *   Set **Root Directory** to `frontend`.
    *   Vercel will auto-detect Next.js framework settings.
3.  **Environment Variables Configuration:**
    *   Add all env variables from Section 2.2 in the Vercel project configuration dashboard.
4.  **Deploy:** Click **Deploy**. Vercel will trigger automatic production deployments on pushes to the `main` branch.

---

## 4. Production Checklist
*   [ ] **Set `DEBUG=False`** on Railway backend environment variables.
*   [ ] **Set `ALLOWED_HOSTS`** and `CORS_ALLOWED_ORIGINS` to point to production URLs.
*   [ ] **Use Live Razorpay Keys** starting with `rzp_live_`.
*   [ ] **Enable Signed Cloudinary Uploads** to secure files.
*   [ ] **Check Google Console Redirect URIs** to include the Vercel NextAuth callback URL: `https://your-vercel-frontend-domain.vercel.app/api/auth/callback/google`
*   [ ] **Configure Railway Backups** for PostgreSQL.
*   [ ] **Add Sentry Error Monitoring** to track frontend and backend runtime errors:
    *   `pip install sentry-sdk`
    *   `npm install @sentry/nextjs`

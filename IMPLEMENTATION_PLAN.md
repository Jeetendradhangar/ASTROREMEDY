# Implementation Plan — Astrology Consultation Platform

This plan outlines the steps to initialize, construct, and deploy the trust-first Astrology Consultation Platform.

## User Review Required

> [!IMPORTANT]
> Since we are starting with an empty workspace, we must construct the entire backend and frontend codebase. This involves creating the project structures (`frontend/` and `backend/`) and installing dependencies.
> Verification will require local Redis and PostgreSQL services or dummy mocks.

---

## Open Questions

> [!WARNING]
> Please clarify the following choices to help align our implementation:
> 1. **SMS OTP Gateway Selection:** Do you prefer using **Twilio** or **MSG91** for SMS OTP delivery?
> 2. **Authentication Mocks for Test Mode:** Should we include a fallback OTP mock mode (e.g., auto-verifying specific phone numbers) for local testing without spending API credits?
> 3. **Design System Theme:** The stack specifies Tailwind CSS and ShadCN UI. Do you prefer a celestial dark mode theme (e.g. deep indigo/purple gradients) or a classic, clean light layout?

---

## Proposed Changes

### Backend Setup (Django 5)
Create Django project structures, application modules, and setup files.

#### [NEW] [settings.py](file:///z:/ASTROLOGY/backend/config/settings.py)
*   Define Core Django settings, installed apps (`users`, `consultations`, `payments`, `orders`, `reviews`), simple_jwt authentication settings, CORS settings, database config, and Cloudinary settings.

#### [NEW] [celery.py](file:///z:/ASTROLOGY/backend/config/celery.py)
*   Configure asynchronous task runner configuration mapping to Redis.

#### [NEW] [models.py](file:///z:/ASTROLOGY/backend/users/models.py)
*   Define `CustomUser` model inheriting from `AbstractUser` with phone number, OTP fields, and profile photo URL.

#### [NEW] [models.py](file:///z:/ASTROLOGY/backend/consultations/models.py)
*   Define `Consultation`, `VoiceNote`, `VoiceReply`, and `RecommendedRemedy` models.

#### [NEW] [models.py](file:///z:/ASTROLOGY/backend/payments/models.py)
*   Define `Payment` model to store Razorpay order IDs and signature details.

#### [NEW] [models.py](file:///z:/ASTROLOGY/backend/orders/models.py)
*   Define `Order` and `OrderItem` models.

#### [NEW] [models.py](file:///z:/ASTROLOGY/backend/reviews/models.py)
*   Define customer `Review` and feedback model.

---

### Frontend Setup (Next.js 14 App Router)
Create Next.js pages and state stores.

#### [NEW] [api.ts](file:///z:/ASTROLOGY/frontend/src/lib/api.ts)
*   Axios instance with Bearer auth header interceptor and auto token-refresh handling on 401.

#### [NEW] [authStore.ts](file:///z:/ASTROLOGY/frontend/src/store/authStore.ts)
*   Zustand store tracking access/refresh JWT tokens and profile states.

#### [NEW] [layout.tsx](file:///z:/ASTROLOGY/frontend/src/app/layout.tsx)
*   Root HTML frame layout import fonts (Outfit / Inter) and styling sheets.

#### [NEW] [page.tsx](file:///z:/ASTROLOGY/frontend/src/app/page.tsx)
*   Vibrant landing page containing project values, testimonials list, and call-to-actions.

#### [NEW] [page.tsx](file:///z:/ASTROLOGY/frontend/src/app/(auth)/login/page.tsx)
*   Login interface supporting OTP request and entry.

#### [NEW] [page.tsx](file:///z:/ASTROLOGY/frontend/src/app/dashboard/consultations/new/page.tsx)
*   Intake form for entering birth details and recording/uploading voice note.

#### [NEW] [VoiceUploader.tsx](file:///z:/ASTROLOGY/frontend/src/components/consultation/VoiceUploader.tsx)
*   Component for recording audio and uploading to the backend `/upload-voice/` route.

#### [NEW] [page.tsx](file:///z:/ASTROLOGY/frontend/src/app/admin/page.tsx)
*   Astrologer work queue dashboard to view paid items, listen to user files, and submit audio reply.

---

## Verification Plan

### Automated Tests
1.  **Backend PyTest suite:**
    *   Test registration, login OTP send/verify API endpoints.
    *   Test consultation submission and status changes.
    *   Test Razorpay signature verification logic.
    *   Run tests command:
        ```bash
        pytest
        ```

2.  **Frontend Linting:**
    *   Check for TypeScript and eslint warnings:
        ```bash
        npm run lint
        ```

### Manual Verification
1.  Verify OTP login flow end-to-end on local development screens.
2.  Submit a dummy birth date consultation form with an audio file upload, check DB logs.
3.  Simulate a Razorpay mock checkout payment verification step.
4.  Play the client voice note inside the admin portal, upload a reply, and check the update on the user dashboard.

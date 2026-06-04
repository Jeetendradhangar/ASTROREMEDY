# Astrology Consultation Platform — Gap Analysis

This document identifies the differences between the current repository state (which is uninitialized) and the specifications in the PDF documentation.

---

## 1. Summary of Gaps
Since the repository contains only documentation files, there is a **100% gap** between the current state and the required MVP release. 

---

## 2. Priority Categorization of Gaps

### 2.1. Critical Gaps (Must-Have for Core Launch)
These items are required for the basic customer journey (register → consultation form → payment → astrologer response).

*   **Gap C-1: Monorepo & Project Structure Setup**
    *   *Description:* Initialize directories (`frontend/` and `backend/`), set up basic package.json, build tools, TypeScript configs, and Django configurations.
*   **Gap C-2: Authentication & Custom User Database**
    *   *Description:* Create `CustomUser` model. Implement passwordless SMS OTP login APIs (backend) and matching NextAuth.js flow and login UI (frontend).
*   **Gap C-3: Consultation Intake & Submission**
    *   *Description:* Create `Consultation` database tables. Build the frontend Consultation Intake Form to collect client DOB, time, place, and problem description.
*   **Gap C-4: Razorpay Payment Gateway Integration**
    *   *Description:* Implement order creation API (`/api/payments/create-order/`), frontend payment widget checkout, and backend signature verification API (`/api/payments/verify/`) using Razorpay Python SDK.
*   **Gap C-5: Admin / Astrologer Dashboard Queue**
    *   *Description:* Build the astrologer dashboard screen on Next.js (`/admin/consultations/`) to view pending items, play audio voice notes, and submit voice responses.
*   **Gap C-6: Database Connection Setup**
    *   *Description:* Configure local and production PostgreSQL configurations in Django settings.

---

### 2.2. High Gaps (Required for MVP Completeness)
These items are required to handle voice notes, remedy recommendations, and final order placements.

*   **Gap H-1: Cloudinary Audio Upload & Playback**
    *   *Description:* Configure Cloudinary media storage on Django. Create frontend voice recorder/uploader components.
*   **Gap H-2: Remedy Inventory Recommendation Integration**
    *   *Description:* Build tables for remedy products. Create backend APIs and frontend dashboard controls for astrologers to select and attach remedies to responses.
*   **Gap H-3: WhatsApp Pre-filled Order Redirection**
    *   *Description:* Create backend utility to format pre-filled WhatsApp links. Build the frontend "Order via WhatsApp" button routing on the client dashboard.
*   **Gap H-4: Async Task Broker Execution**
    *   *Description:* Set up Celery and Redis to handle email notifications, SMS OTP sending, and status update queues.

---

### 2.3. Medium Gaps (Secondary Features)
These items enrich the user experience but can be finalized after core flows are verified.

*   **Gap M-1: User Profile Management**
    *   *Description:* Develop profile photo upload fields and general profile details forms.
*   **Gap M-2: Reviews & Testimonials Submission**
    *   *Description:* Develop feedback rating submission API and landing page reviews sections.
*   **Gap M-3: Admin Content Moderation Panels**
    *   *Description:* CRUD interfaces for editing inventory counts and approving/rejecting user testimonials.

---

### 2.4. Low Gaps (Deployment & Infrastructure Refinements)
Optimizations and telemetry tasks for production.

*   **Gap L-1: Sentry Error Monitoring Integration**
    *   *Description:* Install Sentry SDKs to track exceptions on production environments.
*   **Gap L-2: Database Automatic Backups Configuration**
    *   *Description:* Configure daily database backup triggers on Railway dashboard.

# AstroRemedy — Frontend Setup Guide

> Next.js 16 application with React 19, TypeScript, Tailwind CSS 4, and Zustand state management.

---

## Tech Stack

| Component        | Version / Tool             |
| ---------------- | -------------------------- |
| Framework        | Next.js 16.2               |
| UI Library       | React 19.2                 |
| Language         | TypeScript 5               |
| Styling          | Tailwind CSS 4             |
| HTTP Client      | Axios 1.6                  |
| State Management | Zustand 4.5                |
| Icons            | Lucide React               |
| Auth             | HTTP-only cookies (JWT)    |

---

## Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **npm 10+** — Comes with Node.js
- **Backend running** — The frontend requires the Django API at `http://localhost:8000`

---

## Step-by-Step Setup

### 1. Clone the Repository

```powershell
git clone <repository-url>
cd ASTROLOGY/frontend
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Create `.env` File

Copy the example:

```powershell
Copy-Item .env.example .env
```

Or create it manually:

```powershell
# Create .env file
@"
# Backend API URL (without trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000
"@ | Out-File -Encoding utf8 .env
```

### 4. Start the Development Server

```powershell
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

| Variable              | Required | Description                                  |
| --------------------- | -------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | ✅       | Backend API base URL (no trailing slash)     |

> **Security Note:** Only `NEXT_PUBLIC_*` variables are exposed to the browser. The frontend does **not** store any API keys, secrets, or tokens. Authentication uses HTTP-only cookies managed by the backend.

---

## How Authentication Works

1. **Login:** User enters phone number → backend sends OTP via SMS → user enters OTP → backend sets HTTP-only `access_token` and `refresh_token` cookies.
2. **Session:** All API requests include cookies automatically (`withCredentials: true`).
3. **Refresh:** The Axios interceptor in `src/lib/api.ts` automatically refreshes expired tokens.
4. **Middleware:** `src/middleware.ts` checks for cookie presence to protect `/dashboard` and `/admin` routes at the edge.
5. **Logout:** Backend blacklists the refresh token and clears cookies.

No tokens are stored in `localStorage` or `sessionStorage`.

---

## Project Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # OTP + Google login page
│   │   │   └── register/      # Registration page
│   │   ├── admin/
│   │   │   ├── consultations/ # Astrologer consultation queue
│   │   │   ├── orders/        # Order management with tabs
│   │   │   ├── products/      # Product inventory CRUD
│   │   │   └── page.tsx       # Admin dashboard
│   │   ├── dashboard/
│   │   │   ├── consultations/ # Seeker consultation details
│   │   │   └── page.tsx       # Seeker dashboard
│   │   ├── globals.css        # Design system tokens & neumorphic styles
│   │   ├── layout.tsx         # Root layout with fonts
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable components
│   ├── lib/
│   │   └── api.ts             # Axios client with token refresh interceptor
│   ├── store/
│   │   └── authStore.ts       # Zustand auth state (no persistence)
│   └── middleware.ts          # Edge middleware for route protection
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

---

## Available Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start dev server on port 3000     |
| `npm run build`   | Create production build            |
| `npm run start`   | Start production server            |
| `npm run lint`    | Run ESLint checks                  |

---

## API Base URL Configuration

The API client (`src/lib/api.ts`) reads the backend URL from the environment:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

- **Development:** `http://localhost:8000` (default)
- **Production:** Set `NEXT_PUBLIC_API_URL` to your deployed backend URL

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `ECONNREFUSED localhost:8000` | Start the backend server first: `python manage.py runserver` |
| `CORS error` | Ensure backend `FRONTEND_URL` in `.env` matches `http://localhost:3000` |
| `Module not found: lucide-react` | Run `npm install` to install all dependencies |
| `Hydration mismatch` | This is normal during development with auth state. Hard refresh fixes it. |
| `401 Unauthorized on all API calls` | Your session expired. Go to `/login` to re-authenticate. |
| `next-env.d.ts missing` | Run `npm run dev` once — Next.js generates this file automatically. |
| `Tailwind classes not applying` | Ensure `globals.css` is imported in `layout.tsx` and PostCSS config is present. |

---

## Full Project Setup Order

For a **brand new clone**, follow this order:

```powershell
# 1. Clone repo
git clone <repository-url>
cd ASTROLOGY

# 2. Start infrastructure (Redis + optional Postgres)
docker compose up -d

# 3. Setup backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env with your credentials
python manage.py migrate
python seed_data.py
python manage.py runserver

# 4. Setup frontend (new terminal)
cd frontend
npm install
Copy-Item .env.example .env
npm run dev

# 5. Start Celery (new terminal)
cd backend
.\.venv\Scripts\Activate.ps1
celery -A config worker --loglevel=info --pool=solo
```

Open `http://localhost:3000` in your browser.

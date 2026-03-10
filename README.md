# Cost Tracking System

A full-stack project management and cost tracking platform with two integrated front-end workspaces:

- `Cost System`: labor, material, and job cost registration and reporting
- `Project Viewer`: agreements, contractors, officers, project lifecycle, and project image tracking

The stack is React + Vite on the client and Express + Prisma + MySQL on the server.

## Features

- JWT-based authentication with refresh-token support
- Role/privilege-driven access control (L1-L7 on frontend feature matrix)
- Cost workflows:
  - Job registration
  - Labor registration and assignment
  - Material registration and orders
  - Daily labor cost and daily job cost calculations
- Reporting:
  - Daily/weekly/monthly/yearly labor cost views
  - Monthly/yearly material cost views
  - Job total cost and labor summaries
- Project workflows:
  - Agreement, contractor, and officer management
  - Project creation, status/progress updates, officer assignments
  - Project image uploads (Cloudinary when configured, local file storage otherwise)

## Tech Stack

### Client (`client/`)

- React 18
- Vite 7
- Chakra UI + Emotion
- Tailwind CSS 4
- Axios
- Recharts
- Framer Motion
- jsPDF / AutoTable / xlsx

### Server (`server/`)

- Node.js + Express
- Prisma ORM
- MySQL
- JWT + bcrypt
- Helmet, CORS, rate limiting, cookie-parser, morgan
- Multer + optional Cloudinary image storage

## Project Structure

```text
Cost-Tracking-System-main/
  client/                  React app (UI, routing, API clients)
  server/                  Express app (REST API, auth, Prisma)
    prisma/                schema, migrations, seed
    src/
      config/              environment, db, cloudinary
      controllers/         business logic
      middleware/          auth, privilege, errors, rate limit
      routes/              REST route modules
  test.js
```

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- MySQL 8+

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
cd server
npm install
cd ../client
npm install
```

### 2. Configure Server Environment

Create `server/.env` with the following values:

```env
# Runtime
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/project_division_db"

# Auth
JWT_SECRET=change_this_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d
COOKIE_SECRET=change_this_cookie_secret

# Security / performance
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=1000

# Optional: Cloudinary (if omitted, local upload storage is used)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Notes:

- If `CLOUDINARY_*` variables are not set, project images are saved to `server/uploads/project-images/`.
- CORS in development accepts localhost origins (including Vite defaults).

### 3. Initialize Database

Run in `server/`:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run the Application

Use two terminals.

Terminal 1 (`server/`):

```bash
npm run dev
```

Terminal 2 (`client/`):

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Seeded Users

Current seed script creates these sample accounts:

- `admin` / `Admin123!`
- `manager` / `Manager123!`
- `supervisor` / `Supervisor123!`
- `worker` / `Worker123!`

After first login, use the user management/register flows to create production-ready users and privileges.

## Scripts

### Client (`client/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

### Server (`server/package.json`)

- `npm run dev` - start server with nodemon
- `npm start` - start server with node
- `npm run db:migrate` - apply Prisma migrations
- `npm run db:generate` - generate Prisma client
- `npm run db:seed` - seed sample data
- `npm run db:studio` - open Prisma Studio

## API Overview

Base URL: `http://localhost:5000/api`

Major route groups:

- `/auth` - login, register, refresh-token, profile, user management
- `/jobs` - job CRUD
- `/labors` - labor CRUD
- `/materials` - material CRUD and search
- `/daily-labor-costs` - labor cost entries
- `/daily-labor-assignments` - labor assignment and summaries
- `/material-orders` - material order CRUD/filtering
- `/material-order-assignments` - material assignment operations
- `/daily-job-costs` - per-job/day aggregate cost operations
- `/agreements` - agreement CRUD
- `/contractors` - contractor CRUD
- `/officers` - officer CRUD
- `/projects` - project CRUD, progress, officers, image upload/list/delete

Most non-auth routes require authentication and privilege checks.

## Authentication Notes

- Client API config uses `withCredentials: true` and Bearer token headers.
- Access tokens are stored in local storage (`authToken`).
- Refresh flow calls `/auth/refresh-token`; refresh token may come from local storage or httpOnly cookie.
- If you get repeated 401 refresh errors, clear local storage and log in again.

## Uploads and Cloudinary

Project image upload endpoint: `POST /api/projects/:projectId/images`

- Cloudinary configured: files upload from memory directly to Cloudinary
- Cloudinary not configured: files are written under `server/uploads/project-images/<projectId>/`
- File constraints:
  - images only
  - max 10 files per request
  - max 10 MB per file

## Troubleshooting

- Server cannot connect to DB:
  - verify `DATABASE_URL`
  - ensure MySQL is running
  - rerun `npm run db:migrate`
- CORS issues:
  - ensure frontend runs from localhost and `FRONTEND_URL` matches your client URL
- Cannot reach backend from client:
  - check server is running on port `5000`
  - verify `client/src/api/config.js` base URL
- Auth refresh loops:
  - clear local storage (`authToken`, `refreshToken`) and re-login

## Security Notes

Before deploying:

- Replace all fallback secrets with strong random values
- Restrict CORS origins to your real frontend domains only
- Enforce HTTPS
- Rotate secrets and review role/privilege assignments

# SAAS-NOTES

A multi-tenant SaaS Notes application built with Next.js and deployed on Vercel.  
Implements authentication, role-based access control, tenant isolation, and subscription gating.

**Live demo:** [https://saas-notes-six.vercel.app](https://saas-notes-six.vercel.app)  
**Repository:** [https://github.com/Ved-S-N/SAAS-NOTES](https://github.com/Ved-S-N/SAAS-NOTES)

---

## 📌 Project Overview

This project provides a secure notes application with:

- **Multi-tenancy** — strict isolation between Acme and Globex
- **Authentication & Authorization** — JWT-based login with Admin and Member roles
- **Subscription gating** — Free plan limited to 3 notes per tenant; Pro plan unlimited
- **Admin features** — upgrade tenant plan, invite users
- **CRUD notes API** — create, read, update, delete
- **Frontend** — minimal UI deployed on Vercel for login and note management
- **Health endpoint** — used by automated scripts to check availability

---

## 🏢 Multi-Tenancy Approach

**Chosen approach: _Shared schema with a `tenantId` column_.**

### Why?
- Works well with a single database on Vercel.
- Simple to seed and query.
- Easy to enforce tenant isolation: every query filters by `tenantId`.
- Tenant subscription plan and roles stored alongside tenant record.

### How it’s enforced
- Tables `Users` and `Notes` include a `tenantId` column.
- JWT contains `tenantId`.
- Middleware ensures all queries are scoped to the authenticated user’s tenant.
- Attempting to access another tenant’s resources returns `403 Forbidden` or `404 Not Found`.

---

## 👥 Pre-seeded Test Accounts

The following accounts are available (all passwords: `password`):

| Email              | Role   | Tenant |
|--------------------|--------|--------|
| admin@acme.test    | Admin  | Acme   |
| user@acme.test     | Member | Acme   |
| admin@globex.test  | Admin  | Globex |
| user@globex.test   | Member | Globex |

---

## 🔐 Authentication

- `POST /auth/login` accepts `{ email, password }`.
- Returns a JWT token.
- Use token in `Authorization: Bearer <token>` header for all protected requests.
- JWT payload includes: `userId`, `role`, `tenantId`.

---

## 🌐 API Endpoints

### Public
- **GET `/health`** → `{ "status": "ok" }` (no auth required)

### Auth
- **POST `/auth/login`** → returns `{ token, user }`

### Tenants
- **POST `/tenants/:slug/upgrade`**  
  Upgrade tenant to Pro (removes 3-note limit).  
  *Admin-only.*

- **POST `/tenants/:slug/invite`**  
  Invite/create a new user under this tenant.  
  *Admin-only.*  
  Body: `{ "email": "newuser@test.com", "role": "Member" }`

### Notes (tenant-scoped)
- **POST `/notes`** — Create a note (Free tenants limited to 3 notes)  
- **GET `/notes`** — List all notes for tenant  
- **GET `/notes/:id`** — Retrieve note by ID (must belong to tenant)  
- **PUT `/notes/:id`** — Update note  
- **DELETE `/notes/:id`** — Delete note  

---

## 🖥️ Frontend Features

- Login with predefined accounts
- List tenant notes
- Create and delete notes
- Show **“Upgrade to Pro”** button when Free plan tenant hits 3 notes
- Upgrade flow immediately removes limit
- (Optional) Admin invite user flow

---

## 🚀 Deployment & CORS

- Hosted on **Vercel** (frontend + backend).
- CORS enabled to allow automated testing and cross-origin API calls.
- Health endpoint public.

---

## ⚡ Example Usage

### Health

curl https://saas-notes-six.vercel.app/api/health
# {"status":"ok"}

curl -X POST https://saas-notes-six.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'

curl -X POST https://saas-notes-six.vercel.app/api/notes \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Note","body":"Hello"}'


This shows them exactly how to test Free vs Pro tenants.

---

### ⚙️ 2. **Running Locally**
Document how they can run/test it locally if they clone the repo. Example:


## ⚙️ Running Locally

1. Clone repo:
  git clone https://github.com/Ved-S-N/SAAS-NOTES.git
  cd SAAS-NOTES

2. Create a .env file in root
   DATABASE_URL="file:./dev.db"
  JWT_SECRET="super-secret"
  NEXTAUTH_URL="http://localhost:3000"

3. Install and migrations
  npm install
  npx prisma migrate dev
  npm run seed

4. Run dev server
   npm run dev

Open http://localhost:3000/

Acceptance Checklist
Show explicitly that you’ve covered all required evaluation points:

✅ Acceptance Checklist

- [x] Health endpoint returns `{ "status": "ok" }`
- [x] All four predefined accounts seeded and working
- [x] Tenant isolation enforced (Acme cannot access Globex)
- [x] Role restrictions enforced (Members cannot invite/upgrade)
- [x] Free plan tenants limited to 3 notes
- [x] Upgrade endpoint removes limit immediately
- [x] Notes CRUD works (create, list, get, update, delete)
- [x] Frontend deployed and functional
- [x] CORS enabled for API

Notes & Assumptions

- Invite endpoint exists for Admins, but frontend UI for inviting may be minimal.
- Members can CRUD any note within their tenant (not just their own).
- Seed script ensures predefined accounts exist in deployment.
- JWT secret and DB URL managed via environment variables.



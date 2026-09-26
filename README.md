# Society Management Workspace

Monorepo for a society / residential community management platform. The frontend talks to a NestJS BFF (`gateway-bff`); the BFF reaches backend services over **gRPC**. Domain data and RBAC live in **service-core** (NestJS + TypeORM + PostgreSQL).

---

## Table of contents

1. [Architecture](#architecture)
2. [Repository layout](#repository-layout)
3. [Features implemented](#features-implemented)
4. [API reference](#api-reference)
5. [Default RBAC seed](#default-rbac-seed)
6. [Environment variables](#environment-variables)
7. [Getting started](#getting-started)
8. [Ports cheat sheet](#ports-cheat-sheet)
9. [Future roadmap](#future-roadmap)

---

## Architecture

```text
┌─────────────────┐
│  frontend-nextjs │  HTTP (auth + dashboard)
└────────┬────────┘
         │
         ▼
┌─────────────────┐     gRPC      ┌──────────────────┐
│   gateway-bff   │──────────────►│   service-core   │──► PostgreSQL
│  (NestJS BFF)   │               │ Nest HTTP + gRPC │
└────────┬────────┘               └──────────────────┘
         │ gRPC
         ├──────────────────────► service-realtime (Express + Socket.IO + gRPC)
         └──────────────────────► service-analytics (FastAPI + gRPC)
```

| Layer | Responsibility |
|--------|----------------|
| **frontend-nextjs** | Nivas UI — landing, login, register, dashboard |
| **gateway-bff** | Public HTTP API; orchestrates backends via gRPC |
| **service-core** | Users, roles, permissions, DB; HTTP + gRPC |
| **service-realtime** | Gate / realtime WebSockets (scaffold + gRPC health) |
| **service-analytics** | PDF / AI analytics (scaffold + gRPC health) |
| **shared-protos** | Single source of truth for `.proto` contracts |
| **@society/nest-config** | Shared NestJS `ConfigModule` / env loading |
| **@society/eslint-config** | Shared ESLint config |

**Design choice:** Clients should prefer **gateway** HTTP APIs. Direct `service-core` HTTP is useful for local debugging; production traffic should go through the BFF.

---

## Repository layout

```text
society-management-workspace/
├── apps/
│   ├── frontend-nextjs/          # Next.js UI
│   ├── gateway-bff/              # NestJS BFF (HTTP + gRPC clients)
│   ├── service-core/             # NestJS domain service (RBAC + DB)
│   ├── service-realtime/         # Express + Socket.IO
│   └── service-analytics/        # FastAPI
├── packages/
│   ├── shared-protos/            # .proto files + path helpers
│   ├── nest-config/              # @society/nest-config
│   └── eslint-config/            # @society/eslint-config
├── package.json                  # npm workspaces root
├── read.md                       # quick run commands
└── README.md                     # this file
```

---

## Features implemented

### 1. Monorepo tooling

- npm **workspaces** (`apps/*`, `packages/*`)
- Root scripts: `dev:frontend`, `dev:gateway`, `dev:core`, `dev:realtime`, `dev:analytics`, `build`, `lint`

### 2. Shared configuration

- **`@society/nest-config`**: `EnvironmentModule.forRoot()` wrapping `@nestjs/config` v4 (async `forRoot` pattern so `ConfigService` works with TypeORM / gRPC clients)
- **service-analytics**: `pydantic-settings` loading `.env` (`PORT`, `HOST`, `GRPC_URL`)

### 3. Database & RBAC model (`service-core`)

- **TypeORM 0.3** + **PostgreSQL**
- Entities / tables:
  - `users` — identity, bcrypt `password_hash`, soft-deactivate via `is_active`
  - `roles` — e.g. ADMIN, RESIDENT, GUARD, VENDOR
  - `user_roles` — many-to-many user ↔ role
  - `permissions` — granular actions (`create:user`, `approve:gate_pass`, …)
  - `role_permissions` — many-to-many role ↔ permission
- Dev convenience: `DB_SYNC=true` (auto-create schema). Prefer migrations before production.

### 4. User / role / permission REST APIs (`service-core`)

- Full CRUD for users, roles, permissions
- Assign / remove roles on users
- Assign / remove permissions on roles
- Passwords hashed with **bcrypt**; hash never returned in responses
- Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`)
- Soft-delete users (`DELETE` sets `isActive: false`)

### 5. RBAC seed (`service-core`)

- On startup (`RBAC_SEED=true`), idempotently seeds default roles, permissions, and role→permission mappings
- See [Default RBAC seed](#default-rbac-seed)

### 6. gRPC foundation

| Service | Role | Default gRPC bind |
|---------|------|-------------------|
| service-core | Server (health + user/role/permission) | `:50051` |
| service-realtime | Server (health) | `:50052` |
| service-analytics | Server (health) | `:50053` |
| gateway-bff | Client to all three | — |

**Protos (`packages/shared-protos`):**

- `proto/common/v1/health.proto` — `HealthService.Check`
- `proto/core/v1/user.proto` — `UserService`, `RoleService`, `PermissionService`, `AuthService`

Helpers exported from `shared-protos`: `healthProto`, `userProto`, package/service name constants.

### 7. Auth — JWT + refresh / reset / OTP (Postgres)

- **service-core** `AuthModule`:
  - `POST /auth/register` — create user, assign **RESIDENT**, return access + refresh tokens
  - `POST /auth/login` — bcrypt check, return access + refresh tokens
  - `POST /auth/refresh` — rotate refresh token (old revoked, `replaced_by` linked)
  - `POST /auth/logout` / `POST /auth/logout-all`
  - `POST /auth/forgot-password` / `POST /auth/reset-password` (email link; hashed token in Postgres)
  - `POST /auth/otp/send` / `POST /auth/otp/verify` — purposes: `VERIFY_PHONE`, `LOGIN`, `RESET_PASSWORD`
  - `GET /auth/me` — Bearer access token → profile **including `permissions`**
- Short-lived JWT access (`JWT_EXPIRES_IN_SECONDS`, default **900**); opaque refresh / reset / OTP **hashes** stored in Postgres (`refresh_tokens`, `password_reset_tokens`, `otp_codes`)
- Notifications via pluggable `NOTIFICATION_PORT` — **console adapter** for now (SMS/email logged); swap later for Twilio/SES or a notifications service; Redis OTP cache later if needed
- Same RPCs on gRPC `AuthService` (including refresh/logout/forgot/reset/otp)
- Inactive users cannot log in

### 8. JWT guards + permission checks on RBAC APIs

- **`JwtAuthGuard`** + **`PermissionsGuard`** + `@RequirePermissions(...)` on:
  - `service-core` HTTP controllers (`/users`, `/roles`, `/permissions`)
  - `service-core` gRPC user/role/permission handlers
  - `gateway-bff` HTTP RBAC controllers
- Gateway forwards `Authorization` as gRPC metadata to core
- Permission mapping (examples):
  - Users: `create:user`, `view:user`, `update:user`, `delete:user`, `manage:roles` (role assign)
  - Roles: `manage:roles`
  - Permissions: `manage:permissions`
- Auth routes (`/auth/*`) remain public
- Optional seeded admin via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (default `admin@nivas.local` / `Admin123!`)

### 9. Gateway BFF HTTP → Core gRPC

- Gateway exposes RBAC + **auth** HTTP surface; calls **service-core over gRPC**
- gRPC errors mapped to HTTP (`401`, `403`, `404`, `409`, `400`, `500`)
- CORS enabled for `http://localhost:3000` (frontend)
- Health proxies: `GET /grpc/health`, `/grpc/health/core|realtime|analytics`

### 10. Frontend (Nivas)

- Brand: **Nivas** (Next.js App Router)
- Pages: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/otp-login`, `/dashboard`
- Calls gateway only (`NEXT_PUBLIC_API_URL`)
- Auth context stores access + refresh tokens; restores session via `/auth/me` then `/auth/refresh`
- Dashboard shows profile, roles, and permissions
- Motions: fade/rise-in on key screens

### 11. Other app scaffolds

- **service-realtime**: Express `/health`, Socket.IO connection stub, gRPC health
- **service-analytics**: FastAPI `/health`, env settings, gRPC health + generated Python stubs under `app/grpc_gen/`

---

## API reference

Base URLs (local defaults):

| Surface | Base URL |
|---------|----------|
| **Preferred** — gateway | `http://localhost:3001` |
| Direct core (debug) | `http://localhost:3008` |

RBAC paths below are available on gateway (gRPC proxy) and directly on core. **Auth paths** are on both as well; prefer gateway from the frontend.

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register; returns `{ accessToken, refreshToken, tokenType, expiresIn, user }` |
| `POST` | `/auth/login` | Login; same response shape |
| `POST` | `/auth/refresh` | Body `{ refreshToken }` → new access + refresh pair |
| `POST` | `/auth/logout` | Body `{ refreshToken }` — revoke one session |
| `POST` | `/auth/logout-all` | Bearer access — revoke all refresh tokens |
| `POST` | `/auth/forgot-password` | Body `{ email }` — always generic message; reset link logged to core console |
| `POST` | `/auth/reset-password` | Body `{ token, newPassword }` |
| `POST` | `/auth/otp/send` | Body `{ phoneNumber, purpose }` — OTP logged to core console |
| `POST` | `/auth/otp/verify` | Body `{ phoneNumber, purpose, code, newPassword? }` |
| `GET` | `/auth/me` | Current user — header `Authorization: Bearer <token>` |

**Register body:**

```json
{
  "email": "resident@example.com",
  "password": "secret123",
  "firstName": "Riya",
  "lastName": "Shah",
  "phoneNumber": "+919876543210"
}
```

**Login body:**

```json
{
  "email": "resident@example.com",
  "password": "secret123"
}
```

### Users

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/users` | Create user (bcrypt password) |
| `GET` | `/users` | List users (includes roles) |
| `GET` | `/users/:uid` | Get user |
| `PATCH` | `/users/:uid` | Update user |
| `DELETE` | `/users/:uid` | Soft-delete (`isActive: false`) |
| `GET` | `/users/:uid/roles` | List role assignments |
| `POST` | `/users/:uid/roles` | Assign role — body `{ "roleId": "<uuid>" }` |
| `DELETE` | `/users/:uid/roles/:roleId` | Remove role |

**Create user body example:**

```json
{
  "email": "admin@example.com",
  "password": "secret123",
  "firstName": "Ada",
  "lastName": "Admin",
  "phoneNumber": "+919876543210",
  "isActive": true
}
```

### Roles

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/roles` | Create role (name stored uppercase) |
| `GET` | `/roles` | List roles |
| `GET` | `/roles/:uid` | Get role + permissions |
| `PATCH` | `/roles/:uid` | Update role |
| `DELETE` | `/roles/:uid` | Delete role |
| `GET` | `/roles/:uid/permissions` | List permissions on role |
| `POST` | `/roles/:uid/permissions` | Assign — `{ "permissionId": "<uuid>" }` |
| `DELETE` | `/roles/:uid/permissions/:permissionId` | Remove permission |

### Permissions

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/permissions` | Create permission |
| `GET` | `/permissions` | List permissions |
| `GET` | `/permissions/:uid` | Get permission |
| `PATCH` | `/permissions/:uid` | Update permission |
| `DELETE` | `/permissions/:uid` | Delete permission |

### Health (gateway)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/grpc/health` | Probe core + realtime + analytics |
| `GET` | `/grpc/health/core` | Core gRPC health |
| `GET` | `/grpc/health/realtime` | Realtime gRPC health |
| `GET` | `/grpc/health/analytics` | Analytics gRPC health |

### Quick curl examples (via gateway)

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"resident@example.com\",\"password\":\"secret123\",\"firstName\":\"Riya\",\"lastName\":\"Shah\"}"

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"resident@example.com\",\"password\":\"secret123\"}"

# Me (replace TOKEN)
curl http://localhost:3001/auth/me -H "Authorization: Bearer TOKEN"

# Refresh (replace REFRESH_TOKEN from login/register response)
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"REFRESH_TOKEN\"}"

# Forgot password (reset link appears in service-core console logs)
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"resident@example.com\"}"

# OTP login — send (OTP appears in service-core console logs)
curl -X POST http://localhost:3001/auth/otp/send \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"+919876543210\",\"purpose\":\"LOGIN\"}"

# List roles (requires manage:roles — use admin token)
curl http://localhost:3001/roles -H "Authorization: Bearer ADMIN_TOKEN"

# Login as seeded admin
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@nivas.local\",\"password\":\"Admin123!\"}"

# gRPC health aggregate
curl http://localhost:3001/grpc/health
```

---

## Default RBAC seed

Runs automatically when `service-core` starts with `RBAC_SEED=true`.

### Roles

| Name | Description |
|------|-------------|
| `ADMIN` | Full society administration |
| `RESIDENT` | Flat owner / resident |
| `GUARD` | Gate / security staff |
| `VENDOR` | External vendor |

### Sample permissions

| Action | Module |
|--------|--------|
| `create:user`, `view:user`, `update:user`, `delete:user` | UserManagement |
| `manage:roles`, `manage:permissions` | UserManagement |
| `approve:gate_pass`, `view:gate_pass`, `create:gate_pass` | GateManagement |
| `view:bills`, `create:bills`, `pay:bills` | Billing |

### Default mappings (summary)

- **ADMIN** — all seeded permissions  
- **RESIDENT** — view user, gate pass view/create, view/pay bills  
- **GUARD** — gate pass approve/view/create, view user  
- **VENDOR** — gate pass view/create  

---

## Environment variables

Do not commit real secrets. `.env` is gitignored; use local files or a secrets manager.

### `apps/service-core/.env`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | HTTP port | `3008` |
| `GRPC_URL` | gRPC bind address | `0.0.0.0:50051` |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL | `localhost`, `5432`, … |
| `DB_SYNC` | TypeORM synchronize (dev only) | `true` |
| `RBAC_SEED` | Seed roles/permissions on boot | `true` |
| `JWT_SECRET` | JWT signing secret | change in production |
| `JWT_EXPIRES_IN_SECONDS` | Access token lifetime (seconds) | `900` |
| `REFRESH_EXPIRES_IN_SECONDS` | Refresh token lifetime | `604800` (7d) |
| `PASSWORD_RESET_EXPIRES_IN_SECONDS` | Reset link lifetime | `3600` |
| `OTP_EXPIRES_IN_SECONDS` | OTP lifetime | `600` |
| `OTP_MAX_ATTEMPTS` | Max wrong OTP attempts | `5` |
| `FRONTEND_RESET_URL` | Base URL for reset links | `http://localhost:3000/reset-password` |
| `SEED_ADMIN_EMAIL` | Optional admin user email | `admin@nivas.local` |
| `SEED_ADMIN_PASSWORD` | Optional admin password | `Admin123!` |

### `apps/gateway-bff/.env`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | HTTP port | `3001` |
| `CORE_GRPC_URL` | service-core gRPC | `localhost:50051` |
| `REALTIME_GRPC_URL` | service-realtime gRPC | `localhost:50052` |
| `ANALYTICS_GRPC_URL` | service-analytics gRPC | `localhost:50053` |
| `FRONTEND_ORIGIN` | Extra CORS origin (optional) | `http://localhost:3000` |

### `apps/frontend-nextjs/.env.local`

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Gateway base URL | `http://localhost:3001` |

### `apps/service-realtime`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | HTTP / Socket.IO | `3003` |
| `GRPC_URL` | gRPC bind | `0.0.0.0:50052` |

### `apps/service-analytics`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` / `HOST` | FastAPI | `3004`, `0.0.0.0` |
| `GRPC_URL` | gRPC bind | `0.0.0.0:50053` |

---

## Getting started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL with a database created (default name: `society_core`)
- Python 3.11+ + venv for `service-analytics` (optional until you need analytics)

### Install

```bash
cd c:\projects\practice\society-management-workspace
npm install
```

Create the Postgres database if needed:

```sql
CREATE DATABASE society_core;
```

Copy / edit `.env` files under each app (see above).

### Analytics (optional)

```bash
cd apps/service-analytics
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
npm run grpc:generate   # regenerate Python stubs from shared-protos
```

### Run (from workspace root)

Typical local stack for auth + UI:

```bash
npm run dev:core        # DB + RBAC seed + HTTP + gRPC :50051
npm run dev:gateway     # HTTP BFF :3001 (CORS for frontend)
npm run dev:frontend    # Nivas UI :3000
```

Optional:

```bash
npm run dev:realtime
npm run dev:analytics
```

Open `http://localhost:3000` → **Create account** or **Sign in**.

### Build

```bash
npm run build
```

---

## Ports cheat sheet

| App | HTTP | gRPC |
|-----|------|------|
| gateway-bff | `3001` | client only |
| service-core | `3008` | `50051` |
| service-realtime | `3003` | `50052` |
| service-analytics | `3004` | `50053` |
| frontend-nextjs | (Next default, e.g. `3000`) | — |

---

## Future roadmap

Prioritized directions for upcoming work (not implemented yet).

### Auth & security

- [x] Login / register / me endpoints (JWT) + frontend integration
- [x] Auth guards on gateway + core + permission checks on RBAC APIs
- [x] Refresh tokens, password reset, OTP via phone (Postgres hashes + console SMS/email)
- [ ] Redis OTP / session cache; real SMS/email providers (Twilio / SES)
- [ ] Rate limiting, helmet, stricter CORS for production

### Data & platform

- [ ] TypeORM **migrations**; turn off `DB_SYNC` in non-dev
- [ ] `.env.example` files per app (no secrets)
- [ ] Docker Compose (Postgres + all services)
- [ ] Structured logging, health/readiness for k8s
- [ ] CI (lint, test, build) on PRs

### Domain features

- [ ] Society / building / flat / membership models
- [ ] Gate pass workflows (create, approve, QR) via **service-realtime**
- [ ] Billing, payments, receipts
- [ ] Notices, complaints, visitor management
- [ ] Vendor onboarding and work orders
- [ ] Notifications (push / email / SMS)

### Frontend

- [x] Landing + login + register + forgot/reset/OTP + basic signed-in dashboard (Nivas)
- [x] Wire Next.js auth flows to gateway APIs (access + refresh)
- [ ] Role-based dashboards (Admin / Resident / Guard)
- [ ] Admin screens for users, roles, permissions
- [ ] Gate / visitor UI for guards

### Analytics & docs

- [ ] PDF generation and AI insights in **service-analytics** (real RPCs beyond health)
- [ ] OpenAPI/Swagger on gateway
- [ ] Buf or proto lint + breaking-change checks for `shared-protos`

### Hardening

- [ ] Unit / e2e tests for RBAC and gateway gRPC mapping
- [ ] Seed admin user (optional, env-driven) after roles exist
- [ ] Audit log for role/permission changes

---

## Notes & conventions

- **Proto path:** always load `.proto` files from `shared-protos` (do not copy into apps).
- **Nest + `@nestjs/config` v4:** use `EnvironmentModule.forRoot()` (async); TypeORM / clients should import that module (or `ConfigModule`) in `forRootAsync` / `registerAsync`.
- **nodenext:** relative imports in TS often use `.js` extensions for emitted ESM/CJS resolution.
- **Password:** never log or return `passwordHash`.

---

## License

Private / unlicensed practice project (`UNLICENSED` on Nest apps).

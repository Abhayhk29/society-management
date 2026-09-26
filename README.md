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
| **service-realtime** | Gate passes (Postgres + gRPC + Socket.IO) |
| **service-analytics** | PDF receipts + society AI insights (gRPC + FastAPI) |
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
- Schema via TypeORM migrations (`src/database/migrations`). `DB_SYNC=true` only for local throwaway DBs; forced off when `NODE_ENV=production`.

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
| service-core | Server (health + RBAC + society + billing + community + vendors + **notifications**) | `:50051` |
| service-realtime | Server (health + gate passes) | `:50052` |
| service-analytics | Server (health + receipt PDF + insights) | `:50053` |
| gateway-bff | Client to all three | — |

**Protos (`packages/shared-protos`):**

- `proto/common/v1/health.proto` — `HealthService.Check`
- `proto/core/v1/user.proto` — `UserService`, `RoleService`, `PermissionService`, `AuthService`
- `proto/core/v1/society.proto` — `SocietyService`, `BuildingService`, `FlatService`, `MembershipService`
- `proto/core/v1/billing.proto` — `BillService`, `PaymentService`, `ReceiptService`
- `proto/core/v1/community.proto` — `NoticeService`, `ComplaintService`, `VisitorService`
- `proto/core/v1/vendor.proto` — `VendorService`, `WorkOrderService`
- `proto/core/v1/notification.proto` — `NotificationService`
- `proto/realtime/v1/gate_pass.proto` — `GatePassService`
- `proto/analytics/v1/analytics.proto` — `ReceiptPdfService`, `InsightsService`

Helpers exported from `shared-protos`: includes `analyticsProto`, `RECEIPT_PDF_SERVICE`, `INSIGHTS_SERVICE`, `ANALYTICS_PACKAGE`.

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
- Health proxies: `GET /grpc/health`, `/grpc/health/core|realtime|analytics`

### 9b. HTTP hardening (gateway + core)

- **Helmet** security headers on both Nest HTTP apps (HSTS only when `NODE_ENV=production`)
- **CORS allowlist** via `CORS_ORIGINS` (comma-separated) and/or `FRONTEND_ORIGIN`
  - Gateway: required in production (boot fails if unset); defaults to localhost:3000 in dev
  - Core HTTP: CORS off unless `CORS_ORIGINS` / `FRONTEND_ORIGIN` is set (gateway is the public edge)
- **Rate limiting** (`@nestjs/throttler`): global default + tighter limit on `/auth/*`
- **Throttler storage:** in-memory by default; set `THROTTLE_STORAGE=redis` + `REDIS_URL` (Compose includes Redis) so counters are shared across instances via `@nest-lab/throttler-storage-redis`
- Health routes on gateway skip throttling; set `TRUST_PROXY` behind a reverse proxy so IP limits work

### 10. Society domain (building / flat / membership)

Hierarchy: **Society → Building → Flat**, plus **Membership** linking a user to a society (optional flat).

| Entity | Key fields |
|--------|------------|
| Society | `name`, unique `code`, address/city/state/pincode, `isActive` |
| Building | `societyId`, `name`, unique `(society, code)`, `totalFloors` |
| Flat | `buildingId`, unique `(building, number)`, `floor`, `unitType`, `areaSqFt` |
| Membership | `userId`, `societyId`, optional `flatId`, `type` (`OWNER`/`TENANT`/`FAMILY`/`COMMITTEE`/`STAFF`), `status` (`ACTIVE`/`PENDING`/`INACTIVE`), `isPrimary` |

Permissions: `view:society`, `manage:society`, `view:membership`, `manage:membership` (seeded; ADMIN manages, RESIDENT views). Soft-delete via `isActive: false` / membership `INACTIVE`.

### 11. Gate pass workflows (**service-realtime**)

- Pass records live in **realtime Postgres** (`society_realtime.gate_passes`), not core
- Status machine: `PENDING` → `APPROVED` → `USED` (also `REJECTED` / `EXPIRED` / `CANCELLED`)
- Create starts `PENDING`, or auto-`APPROVED` if actor has `approve:gate_pass`
- QR payload `gp.<passId>.<exp>.<hmac>` (HMAC with `GATE_PASS_QR_SECRET`); single-use on verify
- Realtime validates society/membership via **core gRPC**; gateway enforces JWT + permissions
- Socket.IO rooms `society:{id}` / `user:{id}` emit `gate_pass.created|updated|scanned`
- Proto: `proto/realtime/v1/gate_pass.proto` (`GatePassService`)
- Complementary to **Visitor** logs in core (optional `gatePassId` string; no cross-DB FK)

### 12. Billing (**service-core**)

Durable society finance in `society_core` (no Razorpay/Stripe in v1 — payments are **recorded**).

| Entity | Key fields |
|--------|------------|
| Bill | `societyId`, optional `flatId`/`membershipId`, `title`, `category` (`MAINTENANCE`/`WATER`/`OTHER`), `amount`, `currency` (INR), `dueDate`, `status` (`DRAFT`/`ISSUED`/`PARTIALLY_PAID`/`PAID`/`CANCELLED`/`OVERDUE`) |
| Payment | `billId`, `amount`, `method` (`CASH`/`UPI`/`CARD`/`MANUAL`), `reference`, `paidByUserId`, `status` (`SUCCESS`/`FAILED`/`REFUNDED`) |
| Receipt | `paymentId`, unique `receiptNumber` (`RCPT-YYYYMMDD-XXXX`), `snapshotJson` |

Rules: `create:bills` creates/issues/cancels; `pay:bills` records payment and auto-creates Receipt on SUCCESS; cumulative SUCCESS ≥ amount → `PAID`, else `PARTIALLY_PAID`. Soft-cancel only if not `PAID`.

### 13. Community — notices, complaints, visitors (**service-core**)

| Entity | Key fields |
|--------|------------|
| Notice | `societyId`, `title`, `body`, `priority` (`NORMAL`/`HIGH`), `publishedAt`, `expiresAt?`, `isActive` |
| Complaint | `societyId`, optional `flatId`, `raisedByUserId`, `category`, `title`, `description`, `status` (`OPEN`/`IN_PROGRESS`/`RESOLVED`/`CLOSED`), `assignedToUserId?` |
| Visitor | `societyId`, optional `flatId`, `hostUserId`, `visitorName`, `expectedAt`, `status` (`EXPECTED`/`CHECKED_IN`/`CHECKED_OUT`/`CANCELLED`), optional `gatePassId` |

Permissions: `view:notice` / `manage:notice`; `view:complaint` / `create:complaint` / `manage:complaint`; `view:visitor` / `manage:visitor`. ADMIN all; RESIDENT views notices, creates/views complaints, manages visitors; GUARD views notices + manages visitors (check-in).

### 14. Vendors & work orders (**service-core**)

Elaborate ops domain for contractor onboarding and job lifecycle (no file uploads — document refs/URLs only).

| Entity | Key fields |
|--------|------------|
| Vendor | `displayName`, `companyName`, contact, `categories`, `status` (`DRAFT`/`PENDING_REVIEW`/`APPROVED`/`REJECTED`/`SUSPENDED`), GST/PAN, optional `userId` (VENDOR role login) |
| VendorDocument | KYC metadata: `docType` (`PAN`/`GST`/`LICENSE`/`INSURANCE`/`OTHER`), `referenceOrUrl`, `status` (`SUBMITTED`/`VERIFIED`/`REJECTED`) |
| VendorSociety | vendor ↔ society assignment (`INVITED`/`ACTIVE`/`SUSPENDED`) |
| WorkOrder | society (+ optional flat/building), `category`, `priority`, status machine, optional `complaintId`, cost estimate/actual, schedule |
| WorkOrderQuote | vendor quote (`PROPOSED`/`ACCEPTED`/`REJECTED`/`WITHDRAWN`); accept → assign vendor |
| WorkOrderEvent | immutable timeline of status / quote actions |

**Vendor flow:** create (DRAFT) → submit → review approve/reject → assign to society → attach/verify KYC docs.  
**Work order flow:** create OPEN → quotes (optional) or direct assign → START → COMPLETE → VERIFY (admin). Also hold/cancel. Accepting a quote auto-assigns the vendor and rejects other proposed quotes. Vendor must be `APPROVED` + `ACTIVE` for the society.

Permissions: `view:vendor` / `manage:vendor`; `view:work_order` / `create:work_order` / `manage:work_order` / `update:work_order`. ADMIN all; RESIDENT view vendors + create/view work orders; VENDOR view + update progress/quotes; GUARD view work orders.

### 15. Notifications — push / email / SMS / in-app (**service-core** hub)

Cross-service notification hub so domain changes in **core** and **realtime** fan out consistently.

| Piece | Role |
|-------|------|
| `Notification` | Per-user delivery row: `channel` (`IN_APP`/`EMAIL`/`SMS`/`PUSH`), `type`, title/body, `payloadJson`, `status` (`PENDING`/`SENT`/`FAILED`/`READ`), `sourceService` |
| `NotificationPreference` | Per-user channel toggles + `mutedTypes` |
| Channel adapters | `NOTIFICATION_CHANNELS` — **console** logs EMAIL/SMS/PUSH (swap for Twilio/SES/FCM later) |
| Enqueue API | gRPC/HTTP `EnqueueNotification` — JWT with `enqueue:notification` **or** `x-service-key` = `INTERNAL_SERVICE_KEY` |

**Emitters (other services affected):**
- **core** (in-process `notifySafe`): bill issued/paid, notice published, complaint raised/updated, visitor check-in, vendor review, work order assign/complete
- **realtime** → core gRPC enqueue + Socket.IO `notification.created`: gate pass created/approved/rejected/scanned

Auth OTP/password-reset still uses the existing auth `NOTIFICATION_PORT` console adapter (unchanged).

Permissions: `view:notification` (inbox/prefs), `enqueue:notification` (ADMIN + service key).

### 16. Analytics — PDF receipts + AI insights (**service-analytics**)

Real RPCs beyond health:

| RPC | Purpose |
|-----|---------|
| `ReceiptPdfService.GenerateReceiptPdf` | Build PDF from receipt number + `snapshotJson` (bill/payment) via **fpdf2** |
| `InsightsService.GenerateSocietyInsights` | Rule-based “AI” insights (`rules-v1`) from live society metrics |

**Gateway orchestration:**
- `GET /receipts/:uid/pdf` — loads receipt from **core**, generates PDF via **analytics**, returns `application/pdf`
- `GET /analytics/insights/:societyId` — aggregates bills/complaints/work orders/visitors from **core**, calls insights RPC

Also exposed on analytics HTTP for local debug: `POST /receipts/pdf`, `POST /insights`. Permission: `view:bills` (PDF), `view:analytics` (insights; ADMIN + RESIDENT).

### 17. Frontend (Nivas)

- Brand: **Nivas** (Next.js App Router)
- Pages: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/otp-login`, `/dashboard`, `/gate-passes`, `/billing`, `/community`, `/vendors`, `/work-orders`, `/notifications`, `/insights`
- Calls gateway HTTP (`NEXT_PUBLIC_API_URL`); Socket.IO to realtime (`NEXT_PUBLIC_SOCKET_URL`)
- Auth context stores access + refresh tokens; restores session via `/auth/me` then `/auth/refresh`
- Gate passes UI: create, list, approve/reject, QR display, verify scan + live updates
- Billing UI: list/issue bills, record payment, receipts list + **Download PDF**
- Community / vendors / work orders / notifications UIs as above
- Insights UI: society summary + insight list (`view:analytics`)
- Motions: fade/rise-in on key screens

---


## API reference

Base URLs (local defaults):

| Surface | Base URL |
|---------|----------|
| **Preferred** — gateway | `http://localhost:3001` |
| Direct core (debug) | `http://localhost:3008` |

RBAC paths below are available on gateway (gRPC proxy) and directly on core. **Auth paths** are on both as well; prefer gateway from the frontend.

**OpenAPI / Swagger (gateway):** interactive docs at [http://localhost:3001/docs](http://localhost:3001/docs) (JSON at `/docs-json`). Enabled by default in development; set `SWAGGER_ENABLED=true` in production if needed, or `SWAGGER_ENABLED=false` to disable. Use **Authorize** with a Bearer access token from `/auth/login`.

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
| `GET` | `/users/:uid/memberships` | List society memberships for user |

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

### Societies / buildings / flats / memberships

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/societies` | Create society — `{ name, code, address?, city?, … }` |
| `GET` | `/societies` | List societies |
| `GET` | `/societies/:uid` | Get society |
| `PATCH` | `/societies/:uid` | Update society |
| `DELETE` | `/societies/:uid` | Soft-deactivate society |
| `GET` | `/societies/:uid/buildings` | List buildings in society |
| `GET` | `/societies/:uid/memberships` | List memberships in society |
| `POST` | `/buildings` | Create — `{ societyId, name, code, totalFloors? }` |
| `GET` | `/buildings/:uid` | Get building |
| `GET` | `/buildings/:uid/flats` | List flats in building |
| `PATCH` / `DELETE` | `/buildings/:uid` | Update / soft-deactivate |
| `POST` | `/flats` | Create — `{ buildingId, number, floor?, unitType?, areaSqFt? }` |
| `GET` / `PATCH` / `DELETE` | `/flats/:uid` | Get / update / soft-deactivate |
| `POST` | `/memberships` | Create — `{ userId, societyId, flatId?, type, status? }` |
| `GET` / `PATCH` / `DELETE` | `/memberships/:uid` | Get / update / set `INACTIVE` |

### Gate passes (via gateway → service-realtime)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/gate-passes` | `create:gate_pass` | Create visitor pass |
| `GET` | `/gate-passes?societyId=` | `view:gate_pass` | List by society (`status` optional) |
| `GET` | `/gate-passes/:uid` | `view:gate_pass` | Get pass (includes QR if approved + allowed) |
| `POST` | `/gate-passes/:uid/approve` | `approve:gate_pass` | Approve + mint QR |
| `POST` | `/gate-passes/:uid/reject` | `approve:gate_pass` | Reject (`{ reason? }`) |
| `POST` | `/gate-passes/:uid/cancel` | `create:gate_pass` | Cancel (creator or approver) |
| `POST` | `/gate-passes/verify-qr` | `approve:gate_pass` | Verify QR payload → mark `USED` |

**Create body example:**

```json
{
  "societyId": "<uuid>",
  "visitorName": "Asha Guest",
  "visitorPhone": "+919800000000",
  "purpose": "Family visit"
}
```

### Billing (via gateway → service-core)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/bills` | `create:bills` | Create + issue bill |
| `GET` | `/bills?societyId=` | `view:bills` | List bills (`status` optional) |
| `GET` | `/bills/:uid` | `view:bills` | Get bill |
| `PATCH` | `/bills/:uid` | `create:bills` | Update draft/issued bill |
| `POST` | `/bills/:uid/issue` | `create:bills` | Issue draft → `ISSUED` |
| `POST` | `/bills/:uid/cancel` | `create:bills` | Soft-cancel (not if `PAID`) |
| `POST` | `/bills/:uid/pay` | `pay:bills` | Record payment → receipt on SUCCESS |
| `GET` | `/bills/:uid/payments` | `view:bills` | List payments for bill |
| `GET` | `/payments/:uid` | `view:bills` | Get payment |
| `GET` | `/receipts` | `view:bills` | List receipts (`billId` / `societyId` query) |
| `GET` | `/receipts/by-payment/:paymentId` | `view:bills` | Receipt for payment |
| `GET` | `/receipts/:uid` | `view:bills` | Get receipt |
| `GET` | `/receipts/:uid/pdf` | `view:bills` | Download PDF via analytics |

**Pay body example:** `{ "amount": 1000, "method": "UPI", "reference": "UTR123" }`

### Analytics insights (via gateway)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/analytics/insights/:societyId` | `view:analytics` | Society AI insights (`rules-v1`) |

### Community (via gateway → service-core)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/notices` | `manage:notice` | Publish notice |
| `GET` | `/notices?societyId=` | `view:notice` | List (`activeOnly` optional) |
| `GET` / `PATCH` / `DELETE` | `/notices/:uid` | view / manage | Get / update / deactivate |
| `POST` | `/complaints` | `create:complaint` | Raise complaint |
| `GET` | `/complaints?societyId=` | `view:complaint` | List complaints |
| `GET` / `PATCH` | `/complaints/:uid` | view / manage | Get / assign-resolve |
| `POST` | `/visitors` | `manage:visitor` | Schedule visitor |
| `GET` | `/visitors?societyId=` | `view:visitor` | List visitors |
| `POST` | `/visitors/:uid/check-in` | `manage:visitor` | Check in |
| `POST` | `/visitors/:uid/check-out` | `manage:visitor` | Check out |
| `POST` | `/visitors/:uid/cancel` | `manage:visitor` | Cancel expected visit |

### Vendors & work orders (via gateway → service-core)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/vendors` | `manage:vendor` | Create vendor (`submitNow` optional) |
| `GET` | `/vendors` | `view:vendor` | List (`status`, `societyId`, `category`) |
| `GET` / `PATCH` | `/vendors/:uid` | view / manage | Get / update |
| `POST` | `/vendors/:uid/submit` | `manage:vendor` | DRAFT/REJECTED → PENDING_REVIEW |
| `POST` | `/vendors/:uid/review` | `manage:vendor` | `{ approve, rejectionReason? }` |
| `POST` | `/vendors/:uid/suspend` | `manage:vendor` | Suspend approved vendor |
| `POST` / `GET` | `/vendors/:uid/documents` | manage / view | Add / list KYC docs |
| `POST` | `/vendor-documents/:uid/verify` | `manage:vendor` | Verify/reject document |
| `POST` / `GET` | `/vendors/:uid/societies` | manage / view | Assign / list societies |
| `PATCH` | `/vendor-societies/:uid` | `manage:vendor` | Update assignment status |
| `POST` | `/work-orders` | `create:work_order` | Create work order |
| `GET` | `/work-orders?societyId=` | `view:work_order` | List (`status`, `vendorId`, `category`) |
| `GET` / `PATCH` | `/work-orders/:uid` | view / manage | Get / update |
| `POST` | `/work-orders/:uid/assign` | `manage:work_order` | Assign approved society vendor |
| `POST` | `/work-orders/:uid/start` | `update:work_order` | → IN_PROGRESS |
| `POST` | `/work-orders/:uid/complete` | `update:work_order` | → COMPLETED |
| `POST` | `/work-orders/:uid/verify` | `manage:work_order` | → VERIFIED |
| `POST` | `/work-orders/:uid/hold` | `update:work_order` | → ON_HOLD |
| `POST` | `/work-orders/:uid/cancel` | `manage:work_order` | → CANCELLED |
| `POST` / `GET` | `/work-orders/:uid/quotes` | update / view | Propose / list quotes |
| `POST` | `/work-order-quotes/:uid/decide` | `manage:work_order` | Accept/reject quote |
| `GET` | `/work-orders/:uid/events` | `view:work_order` | Timeline |

### Notifications (via gateway → service-core)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/notifications/enqueue` | `enqueue:notification` | Manual/admin enqueue |
| `GET` | `/notifications` | `view:notification` | Inbox (`unreadOnly`, `limit`, `societyId`) |
| `GET` | `/notifications/unread-count` | `view:notification` | Unread IN_APP count |
| `POST` | `/notifications/read-all` | `view:notification` | Mark all read |
| `POST` | `/notifications/:uid/read` | `view:notification` | Mark one read |
| `GET` / `PATCH` | `/notifications/preferences/me` | `view:notification` | Channel preferences |

Inter-service: realtime calls core gRPC with header `x-service-key: $INTERNAL_SERVICE_KEY` (default `dev-internal-service-key`).

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
| `view:notice`, `manage:notice` | Community |
| `view:complaint`, `create:complaint`, `manage:complaint` | Community |
| `view:visitor`, `manage:visitor` | Community |
| `view:vendor`, `manage:vendor` | VendorOps |
| `view:work_order`, `create:work_order`, `manage:work_order`, `update:work_order` | VendorOps |
| `view:notification`, `enqueue:notification` | Notifications |
| `view:analytics` | Analytics |
| `view:society`, `manage:society` | SocietyManagement |
| `view:membership`, `manage:membership` | SocietyManagement |

### Default mappings (summary)

- **ADMIN** — all seeded permissions  
- **RESIDENT** — view user, gate pass view/create, view/pay bills, view society/membership, view notices, create/view complaints, view/manage visitors, view vendors, create/view work orders, view notifications, view analytics  
- **GUARD** — gate pass approve/view/create, view user, view society, view notices, view/manage visitors, view work orders, view notifications  
- **VENDOR** — gate pass view/create, view vendor, view/update work orders (progress + quotes), view society, view notifications  

---

## Environment variables

Do not commit real secrets. `.env` is gitignored; use local files or a secrets manager.

### `apps/service-core/.env`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | HTTP port | `3008` |
| `GRPC_URL` | gRPC bind address | `0.0.0.0:50051` |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | PostgreSQL | `localhost`, `5432`, … |
| `DB_SYNC` | TypeORM synchronize (non-prod only; ignored in production) | `false` |
| `DB_MIGRATIONS_RUN` | Apply TypeORM migrations on boot | `true` in prod / Compose |
| `LOG_FORMAT` | `json` or `pretty` structured logs | `json` |
| `RBAC_SEED` | Seed roles/permissions on boot | `true` |
| `JWT_SECRET` | JWT signing secret | change in production |
| `JWT_EXPIRES_IN_SECONDS` | Access token lifetime (seconds) | `900` |
| `REFRESH_EXPIRES_IN_SECONDS` | Refresh token lifetime | `604800` (7d) |
| `PASSWORD_RESET_EXPIRES_IN_SECONDS` | Reset link lifetime | `3600` |
| `OTP_EXPIRES_IN_SECONDS` | OTP lifetime | `600` |
| `OTP_MAX_ATTEMPTS` | Max wrong OTP attempts | `5` |
| `FRONTEND_RESET_URL` | Base URL for reset links | `http://localhost:3000/reset-password` |
| `CORS_ORIGINS` | Optional core HTTP CORS allowlist | (unset = no CORS) |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | Global rate limit window / max | `60000` / `100` |
| `THROTTLE_AUTH_TTL_MS` / `THROTTLE_AUTH_LIMIT` | Tighter `/auth/*` limit | `60000` / `10` |
| `THROTTLE_STORAGE` | `memory` or `redis` | `memory` locally; `redis` in Compose |
| `REDIS_URL` | Redis for shared throttler counters | `redis://localhost:6379` |
| `THROTTLE_REDIS_PREFIX` | Optional Redis key prefix override | `nivas:throttle:service-core:` |
| `TRUST_PROXY` | Express trust proxy (`true` / hop count) | `1` behind nginx |
| `SEED_ADMIN_EMAIL` | Optional admin user email | `admin@nivas.local` |
| `SEED_ADMIN_PASSWORD` | Optional admin password | `Admin123!` |
| `INTERNAL_SERVICE_KEY` | Shared key for realtime → enqueue notifications | `dev-internal-service-key` |

### `apps/gateway-bff/.env`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | HTTP port | `3001` |
| `CORE_GRPC_URL` | service-core gRPC | `localhost:50051` |
| `REALTIME_GRPC_URL` | service-realtime gRPC | `localhost:50052` |
| `ANALYTICS_GRPC_URL` | service-analytics gRPC | `localhost:50053` |
| `CORS_ORIGINS` | Browser origins allowlist (required in production) | `http://localhost:3000` |
| `FRONTEND_ORIGIN` | Extra single CORS origin (merged into allowlist) | `http://localhost:3000` |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | Global rate limit | `60000` / `100` |
| `THROTTLE_AUTH_TTL_MS` / `THROTTLE_AUTH_LIMIT` | `/auth/*` rate limit | `60000` / `10` |
| `THROTTLE_STORAGE` / `REDIS_URL` | Shared throttler store for multi-instance | `redis` + `redis://…` |
| `TRUST_PROXY` | Express trust proxy behind load balancer | `1` |
| `NODE_ENV` | Set `production` for HSTS + strict CORS | `production` |
| `SWAGGER_ENABLED` | OpenAPI UI at `/docs` (default on in non-prod) | `true` / `false` |

### `apps/frontend-nextjs/.env.local`

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Gateway base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_SOCKET_URL` | Realtime Socket.IO URL | `http://localhost:3003` |

### `apps/service-realtime`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | HTTP / Socket.IO | `3003` |
| `GRPC_URL` | gRPC bind | `0.0.0.0:50052` |
| `CORE_GRPC_URL` | service-core for membership checks | `localhost:50051` |
| `JWT_SECRET` | Must match core (Socket.IO auth) | same as core |
| `INTERNAL_SERVICE_KEY` | Must match core (notification enqueue) | `dev-internal-service-key` |
| `GATE_PASS_QR_SECRET` | HMAC secret for QR payloads | change in production |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | Postgres | `society_realtime` |
| `FRONTEND_ORIGIN` | Socket.IO CORS | `http://localhost:3000` |

### `apps/service-analytics`

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` / `HOST` | FastAPI | `3004`, `0.0.0.0` |
| `GRPC_URL` | gRPC bind | `0.0.0.0:50053` |

---

## Getting started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL with databases created: `society_core` and `society_realtime` (or use Docker Compose)
- Python 3.11+ + venv for `service-analytics` (optional until you need analytics)
- Docker Desktop (optional) for full-stack Compose

### Install

```bash
cd c:\projects\practice\society-management-workspace
npm install
```

Copy env templates (placeholders only — never commit real secrets):

```bash
copy .env.example .env
copy apps\service-core\.env.example apps\service-core\.env
copy apps\gateway-bff\.env.example apps\gateway-bff\.env
copy apps\service-realtime\.env.example apps\service-realtime\.env
copy apps\service-analytics\.env.example apps\service-analytics\.env
copy apps\frontend-nextjs\.env.example apps\frontend-nextjs\.env.local
```

Create the Postgres databases if needed:

```sql
CREATE DATABASE society_core;
CREATE DATABASE society_realtime;
```

Or from the repo: `npm run db:ensure` (uses each app’s `.env` credentials).

**Migrations (service-core):** prefer `DB_SYNC=false` and run:

```bash
npm run migration:run
```

In production / Compose, `DB_MIGRATIONS_RUN=true` applies pending TypeORM migrations on boot. `DB_SYNC` is ignored when `NODE_ENV=production`.

### Docker Compose (full stack)

```bash
copy .env.example .env
npm run compose:up
```

Health checks: `GET /health` and `GET /ready` on gateway (`3001`), core (`3008`), realtime (`3003`), analytics (`3004`).

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
npm run dev:realtime    # gate passes DB + gRPC :50052 + Socket.IO :3003
npm run dev:gateway     # HTTP BFF :3001 (CORS for frontend)
npm run dev:frontend    # Nivas UI :3000
```

Optional:

```bash
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
- [x] Rate limiting, helmet, stricter CORS for production
- [x] Redis-backed throttler storage for multi-instance deploys

### Data & platform

- [x] TypeORM **migrations**; turn off `DB_SYNC` in non-dev / production
- [x] `.env.example` files per app (no secrets)
- [x] Docker Compose (Postgres + all services)
- [x] Structured logging, health/readiness for k8s
- [x] CI (lint, test, build) on PRs

### Domain features

- [x] Society / building / flat / membership models
- [x] Gate pass workflows (create, approve, QR) via **service-realtime**
- [x] Billing, payments, receipts (manual record; no PSP yet)
- [x] Notices, complaints, visitor management (core; visitors optional `gatePassId`)
- [x] Vendor onboarding and work orders (KYC docs, society assign, quotes, timeline)
- [x] Notifications (push / email / SMS / in-app hub; console adapters; realtime enqueue)
- [ ] Razorpay/Stripe webhooks; recurring bills / late fees
- [ ] Real Twilio / SES / FCM providers (replace console channel adapters)

### Frontend

- [x] Landing + login + register + forgot/reset/OTP + basic signed-in dashboard (Nivas)
- [x] Wire Next.js auth flows to gateway APIs (access + refresh)
- [x] Gate pass UI (create / approve / QR / verify + Socket.IO)
- [x] Billing + community thin UIs (`/billing`, `/community`)
- [x] Vendors + work orders UIs (`/vendors`, `/work-orders`)
- [x] Notifications inbox + preferences (`/notifications`)
- [x] Insights UI + receipt PDF download (`/insights`, billing PDF)
- [x] Role-based dashboards (Admin / Resident / Guard)
- [x] Admin screens for users, roles, permissions

### Analytics & docs

- [x] PDF receipt generation and AI insights in **service-analytics** (real RPCs beyond health)
- [ ] LLM-backed insights (optional OpenAI) replacing/extending `rules-v1`
- [x] OpenAPI/Swagger on gateway (`/docs`, Bearer JWT)
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

# SAWA RH

SAWA RH is a `pnpm` + `turbo` monorepo for a modern HR platform built with:

- `apps/web`: Next.js App Router, TypeScript, TailwindCSS, `next-intl`
- `apps/api`: NestJS, Prisma, Swagger, JWT auth
- `packages/shared`: shared constants and Zod schemas

This iteration delivers the requested foundation:

- Monorepo skeleton
- Prisma schema + initial SQL migration
- Seed script with 50 job categories + default admin
- NestJS auth module (`register`, `login`, `refresh`, `forgot-password`, `reset-password`)
- NestJS `me` endpoints for onboarding (`GET /me`, `PATCH /me/profile`, `POST /me/profile/submit`)
- NestJS admin verification workflow (`GET /admin/verifications`, `POST /admin/verifications/:userId/approve`, `POST /admin/verifications/:userId/reject`)
- NestJS category management workflow (`GET /admin/categories`, `POST /admin/categories`, `PATCH /admin/categories/:id`, `DELETE /admin/categories/:id`) for `ADMIN` and `MODERATOR`
- NestJS CV workflow with private Supabase Storage, signed URLs and text extraction
- NestJS CV bank search with PostgreSQL full-text search + filters
- NestJS review workflow for candidates and approved RH professionals
- Next.js pages for landing, login, register, onboarding profile, pending review, and a placeholder dashboard
- Next.js admin verification and category management pages
- Next.js candidate CV pages for upload and self-service management
- Next.js search, candidate reviews and RH queue/detail pages
- Swagger bootstrap on `/docs`

## Repository Structure

```text
.
|- apps
|  |- api
|  |  |- prisma
|  |  |- src
|  |- web
|     |- messages
|     |- src
|- packages
|  |- shared
|- package.json
|- pnpm-workspace.yaml
|- turbo.json
```

## Prerequisites

- Node.js 20+
- `pnpm` 9+
- PostgreSQL (Supabase Postgres is the target)

If `pnpm` is not installed locally:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

On Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

3. Update `apps/api/.env` with your Supabase Postgres URL, JWT secrets, SMTP settings and Supabase credentials.

4. Generate Prisma client:

```bash
pnpm prisma:generate
```

5. Apply migrations:

```bash
pnpm prisma:migrate
```

6. Seed initial data:

```bash
pnpm seed
```

7. Run the monorepo in development:

```bash
pnpm dev
```

## Scripts

From the repository root:

- `pnpm dev`: run web and api in parallel via Turbo
- `pnpm build`: build all workspaces
- `pnpm lint`: run workspace lint/type checks
- `pnpm test`: run workspace tests
- `pnpm prisma:generate`: generate Prisma client for the API
- `pnpm prisma:migrate`: deploy Prisma migrations for the API
- `pnpm seed`: seed admin + categories

Workspace-specific:

- `pnpm --filter @sawa-rh/api dev`
- `pnpm --filter @sawa-rh/web dev`
- `pnpm --filter @sawa-rh/shared build`

If you run `api` or `web` alone, build `@sawa-rh/shared` first so its `dist/` output is available. The root `pnpm dev` command now runs the shared watcher as well.

## Environment Variables

### Web

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`

### API

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `JWT_RESET_TTL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `APP_BASE_URL`
- `CORS_ORIGIN`
- `THROTTLE_TTL`
- `THROTTLE_LIMIT`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

## Deployment

### Render (API)

The repository includes `render.yaml` for a Render Blueprint deployment of the NestJS API.

Recommended flow:

1. In Render, create a new Blueprint service from this repository.
2. Use the generated `sawa-rh-api` web service.
3. Set the required environment variables in Render:
   - `DATABASE_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `APP_BASE_URL` (your Vercel web URL)
   - `CORS_ORIGIN` (your Vercel web URL, or a comma-separated allowlist)
   - `SUPABASE_STORAGE_BUCKET` (default: `cvs`)
4. Render will:
   - install dependencies with `pnpm`
   - build `@sawa-rh/shared`
   - generate Prisma client
   - build the NestJS API
   - run `prisma migrate deploy` before each deploy
5. Health checks use `GET /health`.

Render command recap:

- Root Directory: `.`
- Build Command: `pnpm install --frozen-lockfile && pnpm build:api:render`
- Pre-Deploy Command: `pnpm migrate:api:render`
- Start Command: `pnpm start:api:render`

Important:

- Do not use `corepack enable` on Render. Their build image uses a read-only system path, which causes `EROFS` failures.
- The repository now pins Node to `22.x` so Render uses an LTS runtime instead of `25.x`.

### Vercel (Web)

The web app is prepared for Vercel with `apps/web/vercel.json`.

Recommended flow:

1. Import this repository into Vercel.
2. Set the project Root Directory to `apps/web`.
3. Configure the required environment variables:
   - `NEXT_PUBLIC_API_URL` (`https://your-render-service.onrender.com`)
   - `NEXT_PUBLIC_APP_NAME` (`SAWA RH`)
4. Deploy normally.

Notes:

- Local production builds use `.next-build` to avoid colliding with `next dev`.
- Vercel forces `NEXT_DIST_DIR=.next`, so it still uses the standard Next.js output directory expected by the platform.

## API Surface Implemented Now

### Public Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Authenticated / Public Data

- `GET /me`
- `PATCH /me/profile`
- `POST /me/profile/submit`
- `GET /job-categories/active`
- `POST /cvs`
- `GET /cvs/me`
- `PATCH /cvs/:id`
- `DELETE /cvs/:id`
- `GET /cvs/:id/view-url`
- `GET /cvs/:id/download-url`
- `GET /search/cvs`
- `POST /review-requests`
- `GET /review-requests/me`
- `GET /rh/queue`
- `GET /rh/requests/:id`
- `POST /rh/requests/:id/assign`
- `POST /rh/requests/:id/submit`

### Admin

- `GET /admin/verifications?role=RH_PRO|RECRUITER`
- `POST /admin/verifications/:userId/approve`
- `POST /admin/verifications/:userId/reject`
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:categoryId`
- `DELETE /admin/categories/:categoryId`

### System

- `GET /health`
- `GET /docs`

## Database Notes

The Prisma schema already includes the MVP entities required for later iterations:

- `User`
- `Profile`
- `JobCategory`
- `CV`
- `ReviewRequest`
- `Review`
- `Report`
- `AuditLog`

The SQL migration also creates:

- relational indexes for operational queries
- a GIN full-text index on `cvs.searchable_text`

## Authentication Notes

- Auth is email + password only
- JWT access + refresh tokens are issued by the API
- Password reset generates a signed token and sends an email through `MailService`
- Self-registration is restricted to `CANDIDATE`, `RH_PRO`, and `RECRUITER`
- `ADMIN` and `MODERATOR` must be provisioned separately

## Current Frontend Routes

- `/[locale]`
- `/[locale]/auth/login`
- `/[locale]/auth/register`
- `/[locale]/onboarding/profile`
- `/[locale]/onboarding/pending`
- `/[locale]/dashboard`
- `/[locale]/admin/categories`
- `/[locale]/admin/verifications`
- `/[locale]/dashboard/cvs`
- `/[locale]/dashboard/cvs/new`
- `/[locale]/search/cvs`
- `/[locale]/dashboard/reviews`
- `/[locale]/rh/queue`
- `/[locale]/rh/request/[id]`

Supported locales:

- `fr`
- `en`

## What Comes Next

The next implementation pass should add:

1. recruiter-facing company workflows
2. richer analytics and audit exploration
3. moderation UX refinements
4. additional frontend route guards and polish

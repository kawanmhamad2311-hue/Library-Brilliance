# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the **کتێبخانەی بڕایت** (Bright Library) — a full-stack Kurdish digital library management system for BRIGHT Technical and Vocational Institute.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Language/Font**: Kurdish Sorani (RTL), Rudaw Regular font

## Applications

### کتێبخانەی بڕایت (Bright Library)
- **Preview path**: `/` (root)
- **Frontend**: `artifacts/bright-library/`
- **Backend**: `artifacts/api-server/`
- **Database**: PostgreSQL via `lib/db/`

### Admin Credentials
- Username: `admin`
- Password: `admin1234`

### Student Registration
Students register with: name, username, password, department (one of 6), badge code.

### Departments (6)
1. بەشی پەرستاری (Nursing)
2. بەشی تەکنیکی چاو (Optical Technology)
3. بەشی ئایتی (IT)
4. بەشی دەرمانسازی (Pharmacy)
5. بەشی شیکاری نەخۆشیەکان (Disease Analysis)
6. بەشی میکانیکی ئۆتۆمبیل (Automobile Mechanics)

Each department has 5 sample books pre-seeded.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/bright-library run dev` — run frontend locally

## Project Structure

```
artifacts/
  api-server/src/
    routes/       — API route handlers (auth, books, feedback, admin)
    lib/auth.ts   — JWT auth middleware
  bright-library/src/
    pages/        — Login, Register, Library, BookDetail, Feedback, Admin
    contexts/     — AuthContext (user session management)
lib/
  api-spec/openapi.yaml  — OpenAPI spec (source of truth)
  api-zod/               — Generated Zod validation schemas
  api-client-react/      — Generated React Query hooks
  db/src/schema/         — Drizzle ORM schema (users, books, downloads, feedback)
attached_assets/
  photo_2026-04-26_21-28-09_1777334627624.jpg  — BRIGHT institute logo
  rudawregular2_1777334627624.zip               — Rudaw Kurdish font
```

## Auth Flow
- JWT tokens stored in localStorage
- `Authorization: Bearer <token>` header on all API calls
- Admin role: full book management + download notifications
- Student role: browse department books, download, write feedback

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

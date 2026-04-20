# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # ESLint
npx prisma migrate dev   # Run DB migrations
npx prisma generate      # Regenerate Prisma client
npx prisma db seed       # Seed database
npx prisma studio        # DB GUI
```

## Architecture

Clean Architecture with 4 strict layers — dependencies only flow inward:

```
domain/          → Entities + Repository interfaces (no framework deps)
application/     → Use cases + DTOs (orchestrates domain)
infrastructure/  → Prisma repos, JWTService, DIContainer, controllers
src/app/         → Next.js App Router UI + API routes (presentation)
```

**DIContainer** (`src/infrastructure/di/DIContainer.ts`) is a singleton that wires repositories to use cases. API routes always instantiate dependencies via `DIContainer.getInstance()`.

**Repository pattern**: `src/domain/repositories/` holds interfaces (e.g., `IAppointmentRepository`). Prisma implementations live in `src/infrastructure/database/prisma/repositories/`.

## Auth & Role System

- JWT stored in `auth-token` HttpOnly cookie, verified by `JWTService`
- `middleware.ts` intercepts all non-public routes, reads the token, and redirects users to their role-specific panel
- Role → panel mapping: `MEDICO → /medico`, `ADMIN → /admin`, `RECEPCION → /recepcion`, `CAJA → /caja`, `ALMACEN → /almacen`, `ENFERMERIA → /enfermeria`, `FARMACIA → /farmacia`, `LABORATORIO → /laboratorio`, `PATIENT → /dashboard`
- Client-side auth state via `useAuth()` from `src/contexts/AuthContext.tsx`

## Database

- PostgreSQL via Prisma 7 with `@prisma/adapter-pg`
- Schema in `prisma/schema.prisma` — **all model/field names are in Spanish** (e.g., `CitaMedica`, `Factura`, `usuarioId`)
- Prisma client singleton in `src/infrastructure/database/prisma/client.ts`
- Required env vars: `DATABASE_URL`, `JWT_SECRET`

## Module Structure

Each clinical module (`almacen`, `caja`, `enfermeria`, `farmacia`, `laboratorio`, `recepcion`, `emergencias`) has:
- `src/app/<module>/` — UI pages
- `src/app/api/<module>/` — API routes
- Some modules have domain entities in `src/domain/entities/`

## Naming Conventions

- Business logic, routes, and DB fields use **Spanish** (e.g., `citaId`, `estadoPago`, `tipoDocumento`)
- TypeScript interfaces and React components use **English**
- Prisma enums in Spanish (e.g., `CitaEstado`, `FacturaEstado`, `DiaSemana`)

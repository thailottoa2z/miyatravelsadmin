# Miya Travels - Agency Management App

## Overview

This is a full-stack Agency Management application for "Miya Travels," a travel agency business. The app manages multiple business operations including:

- **Agency Cash Ledger** — Track cash in/out transactions with a running balance (starting ₹4,50,000)
- **Flight Bookings** — Record client flight bookings with advance paid tracking, reference contacts, reminder/alert system, and edit capability
- **Cab Bookings & Vehicle Management** — Manage vehicle fleet, cab bookings with advance/pending tracking, reference contacts, reminders, and edit capability
- **Cab Runs** — Track individual cab trips with multiple members (infinite add), km readings, expenses, return trips, driver settlements, reference contacts, and edit capability
- **Visa Applications** — Track work visa applications with medical status and process status workflows
- **Credit Cards** — Monitor credit card usage, limits, and repayments
- **Vendor Management** — Track vendor balances and payments (for Credit/Pay Later bookings)
- **Global Search** — Search across flights, cabs, and visa records by name, phone, or passport number

All monetary values are displayed in Indian Rupees (INR) formatting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management with custom hooks per domain (`use-cash.ts`, `use-flights.ts`, `use-cabs.ts`, `use-visa.ts`)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with React plugin
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

The frontend uses a sidebar layout (`AppSidebar`) with page-level components in `client/src/pages/`. Each page manages its own form state with `useState` and uses dialogs for data entry forms. Data fetching hooks are in `client/src/hooks/`.

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx`
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **API Contract**: Shared route definitions in `shared/routes.ts` using Zod schemas for input validation and response types — both client and server reference the same contract
- **Server Entry**: `server/index.ts` creates HTTP server, registers routes, serves static files in production or Vite dev middleware in development

### Shared Layer (`shared/`)
- **`schema.ts`**: Drizzle ORM table definitions and Zod insert schemas (via `drizzle-zod`)
- **`routes.ts`**: API contract object defining method, path, input schema, and response schemas for every endpoint — used by both client hooks and server route handlers

### Data Storage
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Connection**: `pg.Pool` in `server/db.ts`
- **Schema Management**: `drizzle-kit push` for schema sync (no migration files needed for dev)
- **Tables**: `cash_transactions`, `flight_bookings`, `vehicles`, `cab_bookings`, `cab_runs`, `visa_applications`, `credit_cards`, `vendors`, `vendor_payments`
- **Custom Enums**: `transaction_type` (in/out), `medical_status` (pending/fit/unfit), `process_status` (locked/pending/completed)

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and implements it directly against the database using Drizzle query builder
- All database operations go through `storage` methods (repository pattern)

### Build & Deploy
- **Dev**: `tsx server/index.ts` with Vite dev server middleware for HMR
- **Build**: Custom `script/build.ts` that runs Vite build for client and esbuild for server, outputting to `dist/`
- **Production**: `node dist/index.cjs` serves built static files

### Key Design Decisions
1. **Shared API contract** — The `shared/routes.ts` file acts as a single source of truth for API shapes, preventing client-server drift
2. **No authentication** — This is a single-user/agency internal tool, so no auth layer exists
3. **Numeric handling** — Monetary values use PostgreSQL `numeric(10,2)` type; amounts are converted between string and number at the API boundary
4. **Vehicle plate management** — Vehicles are a separate table with unique car numbers; cab bookings reference them by ID
5. **Vendor credit tracking** — Flight and cab bookings can reference vendors for "Credit/Pay Later" payment modes; vendor balances are computed from bookings minus payments
6. **Cab Run Members** — Cab runs support unlimited members stored as JSONB array; each member has name, phone, referenceName, referencePhone, advancePaid
7. **Edit capability** — Flight bookings, cab bookings, and cab runs all support editing after creation via PUT endpoints
8. **Reminders & Alerts** — Flight and cab bookings support reminder dates/notes; upcoming bookings (within 2 days) and due reminders shown as alert cards

## External Dependencies

### Database
- **PostgreSQL** — Required, connected via `DATABASE_URL` environment variable. Uses `pg` (node-postgres) driver with connection pooling.
- **connect-pg-simple** — Available for session storage (listed in dependencies but sessions not currently active)

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — ORM and schema management
- **drizzle-zod** — Auto-generates Zod schemas from Drizzle table definitions
- **zod** — Runtime validation for API inputs
- **express** v5 — HTTP server framework
- **@tanstack/react-query** — Async state management on the client
- **wouter** — Client-side routing
- **shadcn/ui** ecosystem — Radix UI primitives, class-variance-authority, clsx, tailwind-merge, lucide-react icons
- **recharts** — Charting library (available for dashboard visualizations)
- **date-fns** — Date formatting utilities
- **vaul** — Drawer component
- **embla-carousel-react** — Carousel component
- **react-day-picker** — Calendar/date picker component

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal** — Shows runtime errors in dev
- **@replit/vite-plugin-cartographer** — Dev tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Dev banner (dev only)

### Fonts
- Google Fonts: DM Sans, Geist Mono, Fira Code, Architects Daughter (loaded via CDN in `index.html`)
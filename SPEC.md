# Airport Slot Booking System — Tech Spec

## Overview

Full-stack web application for airport services (Parking, Fast Track, Lounge) with slot-based booking, cancellation, waitlist, and recurring schedules.

- **Frontend**: React 18 + Vite + TailwindCSS (Cloudflare Pages)
- **Backend**: Node.js on Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (SQLite) + Duro (global consistency)
- **Validation**: Zod (shared schemas)

---

## Core Entities

### Product
| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `name` | TEXT | e.g., "Terminal 1 Parking" |
| `type` | TEXT | `PARKING` \| `FAST_TRACK` \| `LOUNGE` |
| `description` | TEXT | Service description |
| `location` | TEXT | Terminal/location identifier |
| `capacity` | INTEGER | Max concurrent bookings per slot |
| `slotDurationMins` | INTEGER | Duration per slot (e.g., 60 for parking) |
| `isActive` | INTEGER | 1 = active, 0 = inactive |
| `createdAt` | TEXT | ISO timestamp |
| `updatedAt` | TEXT | ISO timestamp |

### Schedule
| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `productId` | TEXT | FK → Product |
| `startTime` | TEXT | "HH:MM" format |
| `endTime` | TEXT | "HH:MM" format |
| `daysOfWeek` | TEXT | JSON array `[0,1,2,3,4,5,6]` (Sun=0) |
| `validFrom` | TEXT | Date string |
| `validUntil` | TEXT | Date string or null |
| `slotIntervalMins` | INTEGER | Minutes between slots |
| `createdAt` | TEXT | ISO timestamp |

### Slot
| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `scheduleId` | TEXT | FK → Schedule |
| `productId` | TEXT | FK → Product (denormalized) |
| `date` | TEXT | Date string (YYYY-MM-DD) |
| `startTime` | TEXT | "HH:MM" |
| `endTime` | TEXT | "HH:MM" |
| `totalCapacity` | INTEGER | Max bookings |
| `bookedCount` | INTEGER | Current confirmed bookings |
| `status` | TEXT | `AVAILABLE` \| `FULL` \| `BLOCKED` |
| `createdAt` | TEXT | ISO timestamp |

### Booking
| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `slotId` | TEXT | FK → Slot |
| `productId` | TEXT | FK → Product |
| `customerName` | TEXT | Customer full name |
| `customerEmail` | TEXT | Email address |
| `customerPhone` | TEXT | Phone number |
| `bookingRef` | TEXT | e.g., `APT-XXXXXX` |
| `status` | TEXT | `CONFIRMED` \| `CANCELLED` \| `COMPLETED` \| `NO_SHOW` |
| `bookedAt` | TEXT | ISO timestamp |
| `cancelledAt` | TEXT | ISO timestamp or null |
| `notes` | TEXT | Optional notes |

### Waitlist
| Field | Type | Description |
|-------|------|-------------|
| `id` | TEXT (UUID) | Primary key |
| `slotId` | TEXT | FK → Slot |
| `productId` | TEXT | FK → Product |
| `customerName` | TEXT | Customer name |
| `customerEmail` | TEXT | Email address |
| `customerPhone` | TEXT | Phone |
| `position` | INTEGER | Queue position |
| `status` | TEXT | `WAITING` \| `PROMOTED` \| `EXPIRED` \| `CANCELLED` |
| `createdAt` | TEXT | ISO timestamp |
| `promotedAt` | TEXT | ISO timestamp or null |

---

## API Endpoints

### Products
- `GET /api/products` — List all active products
- `GET /api/products/:id` — Get product details
- `POST /api/products` — Create product (admin)
- `PUT /api/products/:id` — Update product (admin)

### Schedules
- `GET /api/products/:productId/schedules` — List schedules for product
- `POST /api/products/:productId/schedules` — Create schedule
- `PUT /api/schedules/:id` — Update schedule
- `DELETE /api/schedules/:id` — Delete schedule

### Slots
- `GET /api/products/:productId/slots?date=YYYY-MM-DD` — Get slots by date
- `GET /api/slots/:id` — Get slot details
- `POST /api/slots/generate` — Generate slots from schedule (admin)

### Bookings
- `GET /api/bookings` — List bookings (admin, filterable)
- `GET /api/bookings/reference/:ref` — Lookup by booking reference
- `POST /api/bookings` — Create booking
- `POST /api/bookings/:id/cancel` — Cancel booking
- `POST /api/bookings/:id/reschedule` — Rebook to different slot

### Waitlist
- `GET /api/waitlist?slotId=` — List waitlist entries
- `POST /api/waitlist` — Join waitlist
- `DELETE /api/waitlist/:id` — Leave waitlist
- `POST /api/waitlist/:id/promote` — Manual promote (admin)

### System
- `GET /api/health` — Health check

---

## Business Logic

### Slot Generation (Recurring Schedules)
1. Admin creates a `Schedule` with `daysOfWeek`, `startTime`, `endTime`, `slotIntervalMins`
2. `POST /api/slots/generate` creates `Slot` records for a configurable window (e.g., 30 days)
3. `Slot.totalCapacity` = `Product.capacity`; `Slot.bookedCount` starts at 0
4. Cron trigger (Workers cron) extends slot window daily

### Booking Flow
1. Customer selects product → date → available slot
2. Server checks `bookedCount < totalCapacity`
3. Creates `Booking` with `CONFIRMED` status, increments `bookedCount`
4. Returns `bookingRef` (format: `APT-XXXXXX`)

### Cancellation & Auto-Promotion
1. Customer cancels via `bookingRef`
2. `Booking.status` → `CANCELLED`, `cancelledAt` set
3. `Slot.bookedCount` decremented
4. First `WAITING` waitlist entry for that slot gets `PROMOTED` status
5. Promoted customer must confirm within timeout (e.g., 15 min) or becomes `EXPIRED`
6. If expired/cancelled, next in queue is promoted

### Waitlist
- `POST /api/waitlist` adds entry with next `position` (auto-incremented)
- When slot opens, first `WAITING` entry is promoted
- Waitlist is per-slot, ordered by `position`

---

## Project Structure

```
airport-booking/
├── SPEC.md
├── backend/
│   ├── wrangler.toml
│   ├── package.json
│   ├── src/
│   │   ├── index.ts           # Worker entry point
│   │   ├── routes/            # Hono route files
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, validation
│   │   ├── db/
│   │   │   ├── schema.sql     # D1 schema
│   │   │   └── index.ts       # D1 client
│   │   └── types.ts           # Shared types
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── cloudflare-pages/
│   │   └── functions/
│   │       └── [[path]].ts    # Pages router (proxies to Worker API)
│   └── src/
│       ├── App.tsx
│       ├── api/               # API client
│       ├── components/
│       ├── pages/
│       └── types/
└── shared/
    └── schemas/               # Zod schemas
```

---

## Implementation Phases

### Phase 1: Foundation
- Initialize `wrangler` project for Workers
- Set up D1 database with schema
- Build Hono router structure
- Write `SPEC.md`

### Phase 2: Core Booking
- Product & Schedule CRUD
- Slot generation from recurring schedules
- Slot availability query
- Booking creation

### Phase 3: Waitlist & Cancellation
- Booking cancellation with slot release
- Waitlist join/leave
- Auto-promotion with timeout

### Phase 4: Frontend & Admin
- React frontend on Cloudflare Pages
- Public booking flow UI
- Admin dashboard

---

## Verification

1. **API tests** via `wrangler dev` + Postman/curl
2. **DB** — Inspect D1 via `wrangler d1 execute`
3. **Frontend** — `npm run dev` locally, deploy to Pages for preview
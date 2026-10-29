# ROUTIQ — Hackathon Engineering Report
**RISE @ RST 9 Hackathon Submission**  
**Project Name:** ROUTIQ  
**Product Identity:** AI-Powered Fleet & Logistics Intelligence Platform  
**Tagline:** MOVE SMARTER. DELIVER BETTER.  
**Author:** Solo Developer (One person team)

---

## 1. Project Overview

ROUTIQ is an advanced, production-engineered AI fleet and delivery orchestration platform designed to replace fragile dispatch spreadsheets and uncoordinated dispatch workflows. Built specifically for modern logistics operators, courier fleets, and distribution hubs, ROUTIQ enforces transactional consistency at the database level to ensure that vehicle double-booking and conflicting driver assignments can never occur.

The application couples an authoritative server-side assignment engine with real-world turn-by-turn road network routing (OSRM OpenStreetMap), explainable dispatch heuristics, an Electric Lavender-accented Gemini AI fleet copilot, telemetry analytics, and an immutable audit trail.

---

## 2. Problem Statement and Intended Users

### The Problem
Traditional logistics operations face severe operational failure modes:
1. **Resource Race Conditions & Double-Booking:** When multiple dispatchers allocate shipments concurrently, vehicles and drivers are routinely assigned to overlapping active deliveries, leading to missed fulfillment windows, vehicle overloading, and driver fatigue.
2. **Inaccurate Linear Distance Estimations:** Many platforms calculate delivery ETAs using straight-line (Euclidean) distances, neglecting actual urban road topology, one-way networks, and river crossings.
3. **Black-Box AI Hallucinations:** Dispatchers are reluctant to adopt AI recommendations that cannot explain *why* a vehicle was selected or that suggest phantom fleet assets.
4. **Disjointed Auditability:** When shipments are delayed or cancelled, the sequence of allocation and release actions is rarely recorded in an immutable ledger.

### Intended Users
- **Logistics Dispatchers:** Operators responsible for real-time queue triage, vehicle-driver pairings, transit status tracking, and exception handling.
- **Fleet Operations Managers:** Supervisors managing fleet health, maintenance rotations, driver availability schedules, capacity utilization, and SLA compliance.

---

## 3. Architecture and Technology Choices

ROUTIQ is engineered with a separation of concerns, dual-mode persistence, and strong typing:

- **Frontend Core:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3.4.
- **Visual Design Identity:** Minimalist editorial design featuring Lemon Yellow (`#FFF21A`) as primary brand accent, Charcoal Black (`#171717`) for deep background surfaces, Electric Lavender (`#A65BFF`) for AI intelligence, Muted Gray (`#A3A3A3`), and precise borders (`#383838`).
- **Transactional Database & Functions:** Supabase PostgreSQL with `FOR UPDATE` row-level locks, PL/pgSQL atomic assignment routines, Row Level Security (RLS) policies, and foreign key integrity.
- **In-Memory & Local Dual-Engine:** An authoritative transactional state store that implements identical row-locking semantics and validation rules locally. This allows the application and all Vitest integration tests to run with zero external cloud dependencies.
- **Routing Engine:** Open Source Routing Machine (OSRM) driving API with street-network fallback geometry, producing real road distances (km) and road ETAs (minutes).
- **Interactive Mapping:** Leaflet with CartoDB Dark Matter tile layer matching the charcoal brand aesthetic.
- **AI Intelligence:** Gemini 1.5 Flash API with a deterministic grounding layer that prevents hallucinations by restricting queries strictly to authorized live telemetry.
- **Telemetry Charts:** Recharts for delivery lifecycle status distributions, payload mix, and priority spectrums.
- **Testing:** Vitest and React Testing Library covering scenarios T1 through T16.

---

## 4. Database Schema and Relationships

PostgreSQL migrations are located in `supabase/migrations/`:
- `001_initial_schema.sql`
- `002_rls_policies.sql`
- `003_assignment_functions.sql`
- `004_seed_data.sql`

### Key Tables & Constraints:
1. **`profiles`**: User profiles linked to `auth.users(id)` with roles (`dispatcher`, `fleet_manager`, `admin`).
2. **`vehicles`**:
   - `id` (PK, text, e.g. `'V-101'`).
   - `registration_number` (UNIQUE, uppercase license plate).
   - `vehicle_type` (CHECK: `'van'`, `'truck'`, `'electric_van'`, `'cargo_bike'`, `'refrigerated_truck'`).
   - `capacity` (CHECK > 0, numeric kg).
   - `status` (CHECK: `'available'`, `'assigned'`, `'maintenance'`, `'inactive'`).
3. **`drivers`**:
   - `id` (PK, text, e.g. `'DR-01'`).
   - `name`, `phone`.
   - `availability_status` (CHECK: `'available'`, `'assigned'`, `'unavailable'`).
4. **`deliveries`**:
   - `id` (PK, text, e.g. `'DEL-201'`).
   - `pickup_location`, `dropoff_location`, coordinates (`lat`/`lng`).
   - `scheduled_time`, `priority` (CHECK: `'low'`, `'normal'`, `'high'`, `'urgent'`).
   - `required_capacity` (CHECK > 0), `required_vehicle_type`.
   - `status` (CHECK: `'pending'`, `'assigned'`, `'in_transit'`, `'delivered'`, `'cancelled'`).
   - `assigned_vehicle_id` (FK -> `vehicles.id`), `assigned_driver_id` (FK -> `drivers.id`).
5. **`assignments`**:
   - `id` (PK UUID), `delivery_id`, `vehicle_id`, `driver_id`, `status` (`'active'`, `'completed'`, `'cancelled'`), `assigned_at`, `completed_at`, `assigned_by`.
6. **`audit_logs`**:
   - `id` (PK UUID), `action`, `entity_type`, `entity_id`, `details` (JSONB), `actor_id`, `timestamp`.

---

## 5. Assignment Business Rules

A delivery may be assigned **only** when all nine conditions are satisfied:
1. Delivery exists in database.
2. Delivery status is strictly `'pending'`.
3. Vehicle exists.
4. Vehicle status is strictly `'available'`.
5. Vehicle capacity meets or exceeds delivery required capacity (`vehicle.capacity >= delivery.required_capacity`).
6. Vehicle type matches required delivery vehicle type if specified.
7. Driver exists.
8. Driver availability status is strictly `'available'`.
9. Neither vehicle nor driver has an active record in `assignments` (`status = 'active'`).

Deliveries in `'assigned'` or `'in_transit'` are classified as active. Deliveries in `'delivered'` or `'cancelled'` are inactive.

---

## 6. Transaction and Concurrency Strategy

Assignment safety is enforced on the server side:

```sql
-- PostgreSQL Transactional Locking Snippet (from 003_assignment_functions.sql)
SELECT * INTO v_delivery FROM public.deliveries WHERE id = p_delivery_id FOR UPDATE;
SELECT * INTO v_vehicle FROM public.vehicles WHERE id = p_vehicle_id FOR UPDATE;
SELECT * INTO v_driver FROM public.drivers WHERE id = p_driver_id FOR UPDATE;
```

### Concurrency Protection:
- **`FOR UPDATE` Locks:** Prevent race conditions where two simultaneous dispatchers attempt to claim the same vehicle or driver.
- **Recheck inside Lock:** Verification of resource status occurs *after* the lock is acquired.
- **Atomic State Mutations:** In a single transaction:
  1. Insert active record into `assignments`.
  2. Set `vehicles.status = 'assigned'`.
  3. Set `drivers.availability_status = 'assigned'`.
  4. Set `deliveries.status = 'assigned'` with vehicle and driver IDs.
  5. Insert audit log record.
- **Atomic Resource Release:** When `complete_delivery` or `cancel_delivery` executes, the allocated vehicle and driver are safely returned to `'available'` in the same commit.
- **Deterministic Error Codes:** Returns `DELIVERY_NOT_FOUND`, `DELIVERY_NOT_PENDING`, `VEHICLE_NOT_FOUND`, `VEHICLE_UNAVAILABLE`, `VEHICLE_CAPACITY_MISMATCH`, `DRIVER_NOT_FOUND`, `DRIVER_UNAVAILABLE`, `ASSIGNMENT_CONFLICT`, or `INVALID_TRANSITION`.

---

## 7. Authentication and Authorization

- **Supabase Auth & Roles:** Supports role-based access control (`dispatcher`, `fleet_manager`, `admin`).
- **Row Level Security (RLS):** Enabled across all operational tables (`profiles`, `vehicles`, `drivers`, `deliveries`, `assignments`, `audit_logs`).
- **Client Session Persistence:** Session token persisted securely in `localStorage` with instant one-click evaluation switcher between Dispatcher and Fleet Manager.
- **Least-Privilege Security:** Service role keys and AI keys are never committed or exposed in public client bundles.

---

## 8. Map and Routing Integration

- **Leaflet + OpenStreetMap:** Renders pickup and dropoff markers with custom brand styling (Lemon Yellow pickup pin, Electric Lavender dropoff pin).
- **OSRM Integration (`src/lib/osrm.ts`):** Queries the public Open Source Routing Machine driving API to calculate true road geometry (`overview=full&geometries=geojson`), distance in kilometers, and estimated drive time in minutes.
- **Zero Straight-Line Pretense:** Straight-line distances are never disguised as road navigation. The source is explicitly labeled (`OSRM` or `Simulated Network Geometry`).
- **Resilient Fallback:** If OSRM is unreachable or rate-limited, ROUTIQ computes a street-grid waypoint path to prevent dispatch interruption.

---

## 9. AI Integration and Limitations

- **ROUTIQ AI Copilot (`src/lib/gemini.ts`):** Integrates Gemini 1.5 Flash through structured prompt grounding.
- **Ground-Truth Boundary:** The prompt injects current fleet telemetry (total counts, available units, urgent orders, maintenance holds). The model is strictly instructed not to hallucinate coordinates or invent driver names.
- **Advisory Role:** The copilot provides recommendations and answers operational questions, but *cannot* bypass database constraints or execute mutations directly. All allocations must be confirmed by the human dispatcher through the transactional engine.
- **Heuristic Intelligence Fallback:** When `VITE_GEMINI_API_KEY` is not configured, the copilot automatically falls back to an internal heuristic reasoning engine that accurately answers queries regarding available vehicles, urgent orders, utilization, and bottlenecks.

---

## 10. Test Cases with Actual Observed Results

Automated test suite (`src/test/assignment.test.ts`) executed via `npm test` with Vitest v3.2.7:

| Test ID | Test Scenario | Expected Outcome | Actual Observed Result | Status |
|---|---|---|---|---|
| **T1** | Valid assignment | Atomic allocation, vehicle & driver marked assigned | Success, assignment ID generated, states updated | **PASSED** (1ms) |
| **T2** | Vehicle double-booking | Rejected with `VEHICLE_UNAVAILABLE` | Rejected with exact error and vehicle ID | **PASSED** (0ms) |
| **T3** | Driver double-booking | Rejected with `DRIVER_UNAVAILABLE` | Rejected with exact error and driver name | **PASSED** (0ms) |
| **T4** | Occupied vehicle & driver | Rejected prior to mutation | Rejected with `VEHICLE_UNAVAILABLE` | **PASSED** (0ms) |
| **T5** | Unavailable driver | Rejected with `DRIVER_UNAVAILABLE` | Rejected safely, no changes committed | **PASSED** (0ms) |
| **T6** | Maintenance vehicle | Rejected with `VEHICLE_UNAVAILABLE` | Rejected safely, maintenance hold respected | **PASSED** (0ms) |
| **T7** | Missing IDs (delivery/vehicle/driver) | Handled safely without crash | Rejected with `_NOT_FOUND` error codes | **PASSED** (0ms) |
| **T8** | Valid delivery completion | Releases both vehicle & driver to available | Status marked delivered, resources returned to standby | **PASSED** (0ms) |
| **T9** | Eligible cancellation | Releases assigned vehicle & driver | Status marked cancelled, resources released | **PASSED** (0ms) |
| **T10** | Invalid status transition | Reject pending -> delivered or cancelled delivered | Rejected with `INVALID_TRANSITION` | **PASSED** (0ms) |
| **T11** | Duplicate assignment submission | Idempotent rejection on second attempt | First succeeds, second rejected with `DELIVERY_NOT_PENDING` | **PASSED** (0ms) |
| **T12** | Concurrent lock conflict | Concurrent request on locked resource blocked | Rejected with `ASSIGNMENT_CONFLICT` | **PASSED** (0ms) |
| **T13** | Schema validation checks | Reject empty IDs, negative capacities | Zod parser rejects invalid data structures | **PASSED** (1ms) |
| **T14** | Capacity & vehicle type mismatch | Reject underweight vehicle or wrong class | Rejected with `VEHICLE_CAPACITY_MISMATCH` | **PASSED** (0ms) |
| **T15** | Direct illegal transition | Reject direct delivered -> in_transit | Rejected with `INVALID_TRANSITION` | **PASSED** (0ms) |
| **T16** | Transaction rollback on failure | Prior state remains completely unchanged | All resources retain pre-attempt state | **PASSED** (0ms) |

**Summary: 16 passed (100% pass rate in 571ms).**

---

## 11. Team Work and Progress

- **Developer:** Solo developer (individual submission).
- **Progress:** Completed all Phase 1 through Phase 7 milestones, including initial scaffolding, domain modeling, authoritative PostgreSQL migration authoring, Vitest integration testing, Leaflet map integration, OSRM road routing, AI copilot integration, analytics telemetry, and production bundle verification.

---

## 12. Limitations and Next Steps

- **Live GPS Hardware Telematics:** Current positions use road network centroids and OSRM turn coordinates rather than real OBD-II hardware GPS pings. Next step: connect MQTT/Kafka streams for vehicle OBD-II telemetry.
- **Dynamic Multi-Stop TSP Optimization:** Deliveries are currently point-to-point (pickup to dropoff). Next step: introduce Traveling Salesperson Problem (TSP) multi-drop clustering for cargo bikes and vans.
- **Driver Mobile Companion App:** Build a Progressive Web App (PWA) with geofencing to enable drivers to tap "Arrived" and collect electronic proof of delivery (e-signature).

---

## 13. Installation and Run Instructions

### Prerequisites
- Node.js v18+ (tested on Node v22.23.2)
- npm v9+ (tested on npm 10.9.8)

### Local Setup
1. Clone the repository and navigate into the project directory:
   ```bash
   cd ROUTIQ
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```
4. Run the automated integration test suite:
   ```bash
   npm test
   ```
5. Build the production bundle:
   ```bash
   npm run build
   ```
6. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 14. Deployment Configuration

### Frontend (Vercel)
- **Framework Preset:** Vite
- **Root Directory:** `./`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GEMINI_API_KEY`
  - `VITE_OSRM_ROUTING_URL`

### Backend (Supabase PostgreSQL)
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the migrations in sequence:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_assignment_functions.sql`
   - `supabase/migrations/004_seed_data.sql`
4. Copy the Project URL and anon key into `.env.local` or Vercel Environment Variables.

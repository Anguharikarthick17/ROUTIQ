# ROUTIQ — AI-Powered Fleet & Logistics Intelligence Platform

> **MOVE SMARTER. DELIVER BETTER.**  
> *Intelligent dispatch. Conflict-safe allocation. Optimized routes.*

Built for the **RISE @ RST 9 Hackathon**.

---

## Overview

**ROUTIQ** is a modern, production-ready logistics and dispatch command platform designed to coordinate delivery fleets safely and efficiently. At its core is an authoritative, transactional assignment engine backed by PostgreSQL and row-level concurrency locking that mathematically prevents double-booking of vehicles and drivers.

### Key Capabilities
- **Conflict-Safe Resource Allocation:** Atomically verifies eligibility, locks rows, prevents duplicate active assignments, and enforces state machine transitions.
- **Explainable Smart Dispatch:** Scores eligible vehicle-driver pairs based on payload fit, vehicle classification, and shipment urgency, with transparent reasoning.
- **Turn-by-Turn Road Intelligence:** Open Source Routing Machine (OSRM) integration fetches true road networks, calculating genuine road distances (km) and driving durations (mins).
- **ROUTIQ AI Copilot (Electric Lavender):** Secure Gemini 1.5 Flash integration grounded strictly in live fleet state to answer operational inquiries and bottleneck diagnoses without hallucinations.
- **Operational Command Center:** Real-time metrics with documented formulas, live alerts, and interactive Leaflet map integration.
- **Immutable Audit Trail:** Comprehensive event ledger recording every action with timestamps and actor tracking.
- **Dual-Mode Persistence:** Runs out of the box locally with zero cloud setup required, while providing full PostgreSQL migrations for Supabase deployment.

---

## Strict Brand Color System

- **Lemon Yellow (`#FFF21A`):** Primary brand accent, selected states, and key metrics.
- **Charcoal Black (`#171717`):** Application background and primary surfaces.
- **Electric Lavender (`#A65BFF`):** AI intelligence, routes, and recommendations.
- **Primary White (`#FFFFFF`):** High-contrast typography.
- **Muted Gray (`#A3A3A3`):** Metadata, sub-labels, and supporting context.
- **Dark Surface (`#202020`) & Subtle Border (`#383838`):** Editorial card containment.

---

## Quick Start

### 1. Installation
```bash
git clone <repo-url>
cd ROUTIQ
npm install
```

### 2. Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env.local
```
*(Optional: add your Supabase credentials or Gemini API key. If omitted, ROUTIQ operates with its built-in transactional store and heuristic AI engine.)*

### 3. Run Automated Tests
Execute the 16 automated test scenarios verifying transactional assignment safety:
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
```bash
npm run build
```

---

## Automated Test Suite (T1 – T16)

The test suite in `src/test/assignment.test.ts` validates:
- **T1:** Valid assignment succeeds and marks all resources assigned.
- **T2:** Reusing the same vehicle for an active delivery is rejected (`VEHICLE_UNAVAILABLE`).
- **T3:** Reusing the same driver for an active delivery is rejected (`DRIVER_UNAVAILABLE`).
- **T4:** Occupied vehicle and driver are rejected prior to mutation.
- **T5:** Unavailable driver on leave is rejected.
- **T6:** Vehicle under maintenance is rejected.
- **T7:** Missing delivery, vehicle, or driver IDs are handled safely.
- **T8:** Valid delivery completion atomically releases both vehicle and driver.
- **T9:** Eligible cancellation safely returns resources to the available pool.
- **T10:** Invalid status transitions (e.g. pending -> delivered directly) are rejected.
- **T11:** Duplicate assignment submissions do not create duplicate active records.
- **T12:** Concurrent lock conflicts prevent simultaneous assignment attempts.
- **T13:** Duplicate registration numbers and negative capacities are rejected by Zod schema.
- **T14:** Payload capacity and vehicle type mismatches are rejected.
- **T15:** Unauthorized state transitions are rejected.
- **T16:** Transaction failures roll back completely without partial state modification.

---

## Interactive Demonstration Workflow

1. **Operations Command Center:** View live fleet metrics, utilization percentage, and interactive road map.
2. **Select Pending Order:** Go to **Deliveries** or click any order in the command center (e.g. `DEL-201`).
3. **Smart Dispatch:** Click **Smart Assign** to open the allocation modal. Review the match score and explainability reasons.
4. **Authoritative Commitment:** Confirm allocation. Both vehicle (`V-101`) and driver (`DR-01`) transition to `assigned`.
5. **Conflict Verification:** Attempt to assign `V-101` or `DR-01` to another pending delivery; see the system reject the conflicting attempt with an authoritative error message.
6. **In Transit & Delivery:** Transition the delivery to **In Transit**, then click **Delivered**. Notice that both `V-101` and `DR-01` immediately return to the standby available pool.
7. **AI Copilot:** Switch to the **AI Copilot** tab and query: *"Which vehicles are currently available?"* or *"Summarize current operational bottlenecks"*.
8. **Export Analytics:** Switch to **Analytics** and click **Export Deliveries CSV**.
9. **Inspect Audit Trail:** Switch to **Audit Trail** to view the immutable ledger of each step.

---

## Database Migrations (Supabase)

All migrations are located in `supabase/migrations/`:
- `001_initial_schema.sql`: Core tables, check constraints, foreign keys, and indexes.
- `002_rls_policies.sql`: Row Level Security policies for authenticated dispatchers and fleet managers.
- `003_assignment_functions.sql`: Authoritative PL/pgSQL functions (`assign_delivery`, `complete_delivery`, `cancel_delivery`, `update_delivery_status`) with `FOR UPDATE` row locking.
- `004_seed_data.sql`: Realistic baseline logistics demonstration dataset.

---

## Deployment (Vercel)

1. Connect this repository to **Vercel**.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Add any desired environment variables from `.env.example`.

---

## License

Built for the **RISE @ RST 9 Hackathon**. All rights reserved.

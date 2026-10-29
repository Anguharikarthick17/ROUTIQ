# ROUTIQ — AI-Powered Fleet & Logistics Intelligence Platform

> **MOVE SMARTER. DELIVER BETTER.**  
> *Intelligent dispatch. Conflict-safe allocation. Optimized routes.*

Built for the **RISE @ RST 9 Hackathon**.

---

## Overview

**ROUTIQ** is a modern logistics orchestration platform that couples an authoritative, transactional assignment engine backed by PostgreSQL with an explainable dispatch workstation: the **ROUTIQ Decision Lab**.

### Core Capabilities
- **ROUTIQ Decision Lab (Signature Feature):** Explain every dispatch decision. Features a full candidate **Eligibility Matrix**, a non-mutating **What-If Comparative Simulator**, an active **Conflict Radar**, and transparent score breakdowns.
- **Authoritative Transactional Engine:** Enforces 9-point validation with row locks (`FOR UPDATE`), preventing vehicle and driver double-booking across concurrent requests.
- **Safe Resource Release:** Completing or cancelling shipments returns assets to the standby pool without overriding maintenance or off-duty statuses.
- **Real Road Network Routing:** Open Source Routing Machine (OSRM) integration calculates true street-level distances (km) and driving durations (mins) on Leaflet maps.
- **ROUTIQ AI Copilot (Electric Lavender):** Grounded in real-time fleet telemetry to diagnose bottlenecks and advise operators without hallucinations.
- **Dual-Mode Persistence:** Operates out of the box with zero cloud setup using a local transactional store, while providing complete PostgreSQL migrations for Supabase deployment.

---

## Strict Brand Color System

- **Lemon Yellow (`#FFF21A`):** Primary brand accent, selected states, key metrics, and pickup pins.
- **Charcoal Black (`#171717`):** Application background and primary surfaces.
- **Electric Lavender (`#A65BFF`):** Decision Lab, AI intelligence, route geometry, and dropoff pins.
- **Primary White (`#FFFFFF`):** High-contrast editorial typography.
- **Muted Gray (`#A3A3A3`):** Metadata, sub-labels, and supporting context.
- **Dark Surface (`#202020`) & Subtle Border (`#383838`):** Clean editorial card containment.

---

## Quick Start

### 1. Installation
```bash
git clone <repo-url>
cd ROUTIQ
npm install
```

### 2. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env.local
```
*(Optional: Populate Supabase or Gemini API keys. If omitted, ROUTIQ runs in local fallback mode with heuristic AI assistance.)*

### 3. Run Automated Tests
Execute all 45 automated test scenarios:
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Automated Test Suite (45 Tests Across 3 Files)

Run `npm test` to execute:
1. **`src/test/assignment.test.ts` (16 Tests):** Core assignment, conflict rejection, missing ID handling, lifecycle transitions, and transaction rollback.
2. **`src/test/decisionLab.test.ts` (24 Tests):** Decision Lab eligibility evaluation, active delivery conflict tracking, What-If non-mutation guarantees, Conflict Radar calculations, and safe resource release.
3. **`src/test/concurrency.test.ts` (5 Tests):** Simultaneous concurrent requests, double-booking prevention, duplicate submissions, and atomic lock rollback.

---

## Interactive Demonstration Guide

1. **Operations Command Center:** View live fleet metrics, active dispatch directives, and Leaflet turn-by-turn road routes.
2. **Open Decision Lab:** Click the **Decision Lab** tab in the top navigation. Select pending delivery `DEL-201`.
3. **Inspect Eligibility Matrix:** Filter by **Eligible Only** or **Ineligible** to examine satisfied criteria vs. blocking reasons (e.g. `V-103` occupied by `DEL-202`, `V-104` in maintenance).
4. **Run What-If Simulation:** Switch to **What-If Simulator**. Compare candidate pairs side-by-side with guaranteed zero database mutations.
5. **Commit Allocation:** Click **Commit Option** to trigger authoritative transactional allocation. Observe `DEL-201`, `V-101`, and `DR-01` transition to `'assigned'`.
6. **Conflict Verification:** Select `DEL-204` in Decision Lab; verify that `V-101` and `DR-01` are now immediately rejected as occupied by `DEL-201`.
7. **Conflict Radar:** Open **Conflict Radar** to trace occupied assets back to active deliveries.
8. **Delivery Completion:** In **Deliveries**, transition `DEL-201` to `in_transit`, then click `Delivered`. Return to Decision Lab and observe both assets returned to the available pool!

---

## Database Migrations (Supabase)

All SQL migrations are maintained in `supabase/migrations/`:
- `001_initial_schema.sql`: Core schema, foreign keys, check constraints, and indexes.
- `002_rls_policies.sql`: Row-Level Security policies for authenticated staff.
- `003_assignment_functions.sql`: Authoritative PL/pgSQL routines with row locking (`FOR UPDATE`).
- `004_seed_data.sql`: Realistic logistics demonstration dataset.

---

## Deployment (Vercel)

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** Copy placeholders from `.env.example`.

---

## License

Built for the **RISE @ RST 9 Hackathon**. All rights reserved.
# ROUTIQ
# ROUTIQ

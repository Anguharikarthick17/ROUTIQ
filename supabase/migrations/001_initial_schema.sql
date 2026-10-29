-- ROUTIQ PostgreSQL Schema Migration
-- Migration 001: Initial Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('fleet_manager', 'dispatcher', 'admin')) DEFAULT 'dispatcher',
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY, -- e.g. 'V-101'
    registration_number TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('van', 'truck', 'electric_van', 'cargo_bike', 'refrigerated_truck')),
    capacity NUMERIC NOT NULL CHECK (capacity > 0),
    status TEXT NOT NULL CHECK (status IN ('available', 'assigned', 'maintenance', 'inactive')) DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    id TEXT PRIMARY KEY, -- e.g. 'DR-01'
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    availability_status TEXT NOT NULL CHECK (availability_status IN ('available', 'assigned', 'unavailable')) DEFAULT 'available',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Deliveries Table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id TEXT PRIMARY KEY, -- e.g. 'DEL-201'
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_lat NUMERIC,
    pickup_lng NUMERIC,
    dropoff_lat NUMERIC,
    dropoff_lng NUMERIC,
    scheduled_time TIMESTAMPTZ NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    required_capacity NUMERIC NOT NULL CHECK (required_capacity > 0),
    required_vehicle_type TEXT CHECK (required_vehicle_type IN ('van', 'truck', 'electric_van', 'cargo_bike', 'refrigerated_truck')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled')) DEFAULT 'pending',
    assigned_vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    assigned_driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Assignments Table (Audit & Active Association)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id TEXT NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    assigned_by TEXT DEFAULT 'system'
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB,
    actor_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(availability_status);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_priority ON public.deliveries(priority);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON public.assignments(status) WHERE status = 'active';

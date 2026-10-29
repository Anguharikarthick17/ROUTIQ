-- ROUTIQ RLS Policies
-- Migration 002: Row Level Security

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile or all profiles in the org
CREATE POLICY "Allow authenticated read profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Operational tables (vehicles, drivers, deliveries, assignments, audit_logs)
-- Allow authenticated staff (dispatchers and fleet managers) full access
CREATE POLICY "Allow authenticated read vehicles"
    ON public.vehicles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated mutate vehicles"
    ON public.vehicles FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read drivers"
    ON public.drivers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated mutate drivers"
    ON public.drivers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read deliveries"
    ON public.deliveries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated mutate deliveries"
    ON public.deliveries FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read assignments"
    ON public.assignments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated mutate assignments"
    ON public.assignments FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated read audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

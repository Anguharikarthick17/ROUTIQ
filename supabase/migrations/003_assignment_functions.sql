-- ROUTIQ Authoritative PostgreSQL Assignment & Lifecycle Engine
-- Migration 003: Transactional Functions with Concurrency Locking

-- 1. assign_delivery function
CREATE OR REPLACE FUNCTION public.assign_delivery(
    p_delivery_id TEXT,
    p_vehicle_id TEXT,
    p_driver_id TEXT,
    p_actor_id TEXT DEFAULT 'dispatcher'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_delivery RECORD;
    v_vehicle RECORD;
    v_driver RECORD;
    v_assignment_id UUID;
    v_active_vehicle_assignment INT;
    v_active_driver_assignment INT;
BEGIN
    -- 1. Lock and validate delivery
    SELECT * INTO v_delivery
    FROM public.deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DELIVERY_NOT_FOUND',
            'message', 'Delivery ' || p_delivery_id || ' does not exist.'
        );
    END IF;

    IF v_delivery.status != 'pending' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DELIVERY_NOT_PENDING',
            'message', 'Delivery ' || p_delivery_id || ' is currently ' || v_delivery.status || ' and cannot be assigned.'
        );
    END IF;

    -- 2. Lock and validate vehicle
    SELECT * INTO v_vehicle
    FROM public.vehicles
    WHERE id = p_vehicle_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'VEHICLE_NOT_FOUND',
            'message', 'Vehicle ' || p_vehicle_id || ' does not exist.'
        );
    END IF;

    IF v_vehicle.status != 'available' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'VEHICLE_UNAVAILABLE',
            'message', 'Vehicle ' || p_vehicle_id || ' is currently ' || v_vehicle.status || ' (registration ' || v_vehicle.registration_number || ').'
        );
    END IF;

    IF v_vehicle.capacity < v_delivery.required_capacity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'VEHICLE_CAPACITY_MISMATCH',
            'message', 'Vehicle capacity (' || v_vehicle.capacity || ' kg) is lower than delivery requirement (' || v_delivery.required_capacity || ' kg).'
        );
    END IF;

    IF v_delivery.required_vehicle_type IS NOT NULL AND v_vehicle.vehicle_type != v_delivery.required_vehicle_type THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'VEHICLE_CAPACITY_MISMATCH',
            'message', 'Vehicle type (' || v_vehicle.vehicle_type || ') does not match required type (' || v_delivery.required_vehicle_type || ').'
        );
    END IF;

    -- 3. Lock and validate driver
    SELECT * INTO v_driver
    FROM public.drivers
    WHERE id = p_driver_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DRIVER_NOT_FOUND',
            'message', 'Driver ' || p_driver_id || ' does not exist.'
        );
    END IF;

    IF v_driver.availability_status != 'available' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DRIVER_UNAVAILABLE',
            'message', 'Driver ' || v_driver.name || ' (' || p_driver_id || ') is currently ' || v_driver.availability_status || '.'
        );
    END IF;

    -- 4. Check for active assignments conflict
    SELECT COUNT(*) INTO v_active_vehicle_assignment
    FROM public.assignments
    WHERE vehicle_id = p_vehicle_id AND status = 'active';

    IF v_active_vehicle_assignment > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ASSIGNMENT_CONFLICT',
            'message', 'Vehicle ' || p_vehicle_id || ' is already assigned to an active delivery.'
        );
    END IF;

    SELECT COUNT(*) INTO v_active_driver_assignment
    FROM public.assignments
    WHERE driver_id = p_driver_id AND status = 'active';

    IF v_active_driver_assignment > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ASSIGNMENT_CONFLICT',
            'message', 'Driver ' || v_driver.name || ' (' || p_driver_id || ') is currently assigned to another delivery.'
        );
    END IF;

    -- 5. Atomic mutations: create assignment record
    INSERT INTO public.assignments (
        delivery_id,
        vehicle_id,
        driver_id,
        status,
        assigned_at,
        assigned_by
    ) VALUES (
        p_delivery_id,
        p_vehicle_id,
        p_driver_id,
        'active',
        timezone('utc'::text, now()),
        p_actor_id
    ) RETURNING id INTO v_assignment_id;

    -- Update vehicle state
    UPDATE public.vehicles
    SET status = 'assigned', updated_at = timezone('utc'::text, now())
    WHERE id = p_vehicle_id;

    -- Update driver state
    UPDATE public.drivers
    SET availability_status = 'assigned', updated_at = timezone('utc'::text, now())
    WHERE id = p_driver_id;

    -- Update delivery state
    UPDATE public.deliveries
    SET status = 'assigned',
        assigned_vehicle_id = p_vehicle_id,
        assigned_driver_id = p_driver_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_delivery_id;

    -- Create audit log entry
    INSERT INTO public.audit_logs (
        action, entity_type, entity_id, actor_id, details
    ) VALUES (
        'ASSIGN_DELIVERY',
        'DELIVERY',
        p_delivery_id,
        p_actor_id,
        jsonb_build_object(
            'assignment_id', v_assignment_id,
            'vehicle_id', p_vehicle_id,
            'driver_id', p_driver_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'assignment_id', v_assignment_id,
        'delivery_id', p_delivery_id,
        'vehicle_id', p_vehicle_id,
        'driver_id', p_driver_id,
        'message', 'Assignment completed successfully.'
    );
END;
$$;

-- 2. complete_delivery function
CREATE OR REPLACE FUNCTION public.complete_delivery(
    p_delivery_id TEXT,
    p_actor_id TEXT DEFAULT 'dispatcher'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_delivery RECORD;
    v_vehicle_id TEXT;
    v_driver_id TEXT;
BEGIN
    SELECT * INTO v_delivery
    FROM public.deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DELIVERY_NOT_FOUND',
            'message', 'Delivery ' || p_delivery_id || ' does not exist.'
        );
    END IF;

    IF v_delivery.status NOT IN ('assigned', 'in_transit') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_TRANSITION',
            'message', 'Delivery cannot be marked delivered from status: ' || v_delivery.status
        );
    END IF;

    v_vehicle_id := v_delivery.assigned_vehicle_id;
    v_driver_id := v_delivery.assigned_driver_id;

    -- Update delivery status
    UPDATE public.deliveries
    SET status = 'delivered',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_delivery_id;

    -- Update active assignment FIRST
    UPDATE public.assignments
    SET status = 'completed',
        completed_at = timezone('utc'::text, now())
    WHERE delivery_id = p_delivery_id AND status = 'active';

    -- Safely release vehicle ONLY if still currently 'assigned' AND no other active assignment exists
    IF v_vehicle_id IS NOT NULL THEN
        UPDATE public.vehicles v
        SET status = 'available',
            updated_at = timezone('utc'::text, now())
        WHERE v.id = v_vehicle_id
          AND v.status = 'assigned'
          AND NOT EXISTS (
              SELECT 1 FROM public.assignments a
              WHERE a.vehicle_id = v_vehicle_id AND a.status = 'active'
          );
    END IF;

    -- Safely release driver ONLY if currently 'assigned' AND no other active assignment exists
    IF v_driver_id IS NOT NULL THEN
        UPDATE public.drivers d
        SET availability_status = 'available',
            updated_at = timezone('utc'::text, now())
        WHERE d.id = v_driver_id
          AND d.availability_status = 'assigned'
          AND NOT EXISTS (
              SELECT 1 FROM public.assignments a
              WHERE a.driver_id = v_driver_id AND a.status = 'active'
          );
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (
        action, entity_type, entity_id, actor_id, details
    ) VALUES (
        'COMPLETE_DELIVERY',
        'DELIVERY',
        p_delivery_id,
        p_actor_id,
        jsonb_build_object(
            'released_vehicle_id', v_vehicle_id,
            'released_driver_id', v_driver_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'delivery_id', p_delivery_id,
        'released_vehicle_id', v_vehicle_id,
        'released_driver_id', v_driver_id,
        'message', 'Delivery marked delivered and resources released.'
    );
END;
$$;

-- 3. cancel_delivery function
CREATE OR REPLACE FUNCTION public.cancel_delivery(
    p_delivery_id TEXT,
    p_reason TEXT DEFAULT 'Cancelled by dispatcher',
    p_actor_id TEXT DEFAULT 'dispatcher'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_delivery RECORD;
    v_vehicle_id TEXT;
    v_driver_id TEXT;
BEGIN
    SELECT * INTO v_delivery
    FROM public.deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DELIVERY_NOT_FOUND',
            'message', 'Delivery ' || p_delivery_id || ' does not exist.'
        );
    END IF;

    IF v_delivery.status NOT IN ('pending', 'assigned') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_TRANSITION',
            'message', 'Delivery cannot be cancelled from status: ' || v_delivery.status
        );
    END IF;

    v_vehicle_id := v_delivery.assigned_vehicle_id;
    v_driver_id := v_delivery.assigned_driver_id;

    -- Update delivery
    UPDATE public.deliveries
    SET status = 'cancelled',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_delivery_id;

    -- Mark assignment cancelled FIRST
    UPDATE public.assignments
    SET status = 'cancelled',
        completed_at = timezone('utc'::text, now())
    WHERE delivery_id = p_delivery_id AND status = 'active';

    -- Safely release vehicle ONLY if still currently 'assigned' AND no other active assignment exists
    IF v_vehicle_id IS NOT NULL THEN
        UPDATE public.vehicles v
        SET status = 'available',
            updated_at = timezone('utc'::text, now())
        WHERE v.id = v_vehicle_id
          AND v.status = 'assigned'
          AND NOT EXISTS (
              SELECT 1 FROM public.assignments a
              WHERE a.vehicle_id = v_vehicle_id AND a.status = 'active'
          );
    END IF;

    -- Safely release driver ONLY if currently 'assigned' AND no other active assignment exists
    IF v_driver_id IS NOT NULL THEN
        UPDATE public.drivers d
        SET availability_status = 'available',
            updated_at = timezone('utc'::text, now())
        WHERE d.id = v_driver_id
          AND d.availability_status = 'assigned'
          AND NOT EXISTS (
              SELECT 1 FROM public.assignments a
              WHERE a.driver_id = v_driver_id AND a.status = 'active'
          );
    END IF;

    -- Audit log
    INSERT INTO public.audit_logs (
        action, entity_type, entity_id, actor_id, details
    ) VALUES (
        'CANCEL_DELIVERY',
        'DELIVERY',
        p_delivery_id,
        p_actor_id,
        jsonb_build_object(
            'reason', p_reason,
            'released_vehicle_id', v_vehicle_id,
            'released_driver_id', v_driver_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'delivery_id', p_delivery_id,
        'released_vehicle_id', v_vehicle_id,
        'released_driver_id', v_driver_id,
        'message', 'Delivery cancelled and allocated resources released.'
    );
END;
$$;

-- 4. update_delivery_status (e.g. assigned -> in_transit)
CREATE OR REPLACE FUNCTION public.update_delivery_status(
    p_delivery_id TEXT,
    p_target_status TEXT,
    p_actor_id TEXT DEFAULT 'dispatcher'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_delivery RECORD;
BEGIN
    SELECT * INTO v_delivery
    FROM public.deliveries
    WHERE id = p_delivery_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'DELIVERY_NOT_FOUND',
            'message', 'Delivery ' || p_delivery_id || ' does not exist.'
        );
    END IF;

    -- Validate allowed transitions
    IF v_delivery.status = 'assigned' AND p_target_status = 'in_transit' THEN
        UPDATE public.deliveries
        SET status = 'in_transit', updated_at = timezone('utc'::text, now())
        WHERE id = p_delivery_id;

        INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, details)
        VALUES ('STATUS_CHANGE', 'DELIVERY', p_delivery_id, p_actor_id, jsonb_build_object('from', 'assigned', 'to', 'in_transit'));

        RETURN jsonb_build_object('success', true, 'message', 'Status updated to in_transit.');
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_TRANSITION',
            'message', 'Invalid status transition from ' || v_delivery.status || ' to ' || p_target_status
        );
    END IF;
END;
$$;

